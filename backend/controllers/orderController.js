import mongoose from 'mongoose';
import { Order } from '../models/Order.js';
import { Payment } from '../models/Payment.js';
import { OrderItem } from '../models/OrderItem.js';
import { Dish } from '../models/Dish.js';
import { Setting } from '../models/Setting.js';
import { PromoCode } from '../models/PromoCode.js';

// @desc    Get all orders
// @route   GET /api/orders
export const getOrders = async (req, res) => {
  try {
    const { status, search } = req.query;
    const query = {};

    if (status && status !== 'all') {
      query.status = status;
    }
    if (search) {
      query.$or = [
        { orderId: { $regex: search, $options: 'i' } },
        { customerName: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    const orders = await Order.find(query).sort({ createdAt: -1 });
    res.json({ success: true, count: orders.length, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get orders for current authenticated customer
// @route   GET /api/orders/my-orders
export const getMyOrders = async (req, res) => {
  try {
    const user = req.user;
    if (!user || !user.email) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }

    const cleanEmail = user.email.toLowerCase().trim();
    const escapedEmail = cleanEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // Strictly match orders belonging ONLY to this user's account (email or customer_id).
    // Note: Never match by phone number alone to prevent cross-account order leakage.
    const query = {
      $or: [
        { email: cleanEmail },
        { email: { $regex: new RegExp(`^${escapedEmail}$`, 'i') } }
      ]
    };

    if (user._id) {
      query.$or.push({ customer_id: String(user._id) });
    }

    const orders = await Order.find(query).sort({ createdAt: -1 });
    res.json({ success: true, count: orders.length, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single order by orderId
// @route   GET /api/orders/:orderId
export const getOrderById = async (req, res) => {
  try {
    const rawId = (req.params.orderId || '').trim();
    const cleanId = rawId.toUpperCase();
    const query = {
      $or: [
        { orderId: cleanId },
        { order_id: cleanId },
        { orderId: rawId },
        { order_id: rawId },
        ...(mongoose.Types.ObjectId.isValid(rawId) ? [{ _id: rawId }] : [])
      ]
    };
    const order = await Order.findOne(query);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    res.json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create new order (Server-Side Price Validation & Strict KHQR Enforced)
// @route   POST /api/orders
export const createOrder = async (req, res) => {
  try {
    const {
      customerName,
      phone,
      orderType = 'delivery',
      address = '',
      pickupTime = '',
      notes = '',
      items = [],
      paymentMethod,
      promoCode
    } = req.body;

    // 1. Strict Security Guard: Strictly reject any non-KHQR payment (blocks curl with cash/cod or console bypass)
    if (!paymentMethod || String(paymentMethod).trim().toLowerCase() !== 'khqr') {
      return res.status(400).json({
        success: false,
        message: 'Security Violation: Phum Yeung Restaurant strictly accepts only Bakong KHQR scan payments. Cash or COD is not allowed.'
      });
    }

    // 2. Validate Customer Details
    const cleanCustomerName = typeof customerName === 'string' ? customerName.trim() : '';
    const cleanPhone = typeof phone === 'string' ? phone.trim() : '';
    const cleanOrderType = orderType === 'pickup' ? 'pickup' : 'delivery';
    const cleanAddress = typeof address === 'string' ? address.trim() : '';

    if (!cleanCustomerName || cleanCustomerName.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid customer name (minimum 2 characters).'
      });
    }

    if (!cleanPhone || cleanPhone.replace(/\D/g, '').length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid phone number (minimum 8 digits).'
      });
    }

    if (cleanOrderType === 'delivery' && (!cleanAddress || cleanAddress.length < 3)) {
      return res.status(400).json({
        success: false,
        message: 'Delivery address is required for delivery orders.'
      });
    }

    // 3. Validate Cart Items: Never trust prices or totals from the client request body
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Your cart is empty. Please select at least one dish.'
      });
    }

    // 4. Server-Side Price Verification: Fetch each dish directly from MongoDB
    let serverSubtotal = 0;
    const verifiedItems = [];

    for (const item of items) {
      const rawDishId = item.dishId || item.id || item._id;
      if (!rawDishId) {
        return res.status(400).json({
          success: false,
          message: 'Invalid item data in cart.'
        });
      }

      const dishQuery = mongoose.Types.ObjectId.isValid(rawDishId)
        ? { $or: [{ _id: rawDishId }, { dishId: rawDishId }] }
        : { dishId: rawDishId };

      const dish = await Dish.findOne(dishQuery);
      if (!dish) {
        return res.status(400).json({
          success: false,
          message: `Dish "${item.name_km || item.name_en || rawDishId}" was not found in our menu.`
        });
      }

      if (dish.inStock === false) {
        return res.status(400).json({
          success: false,
          message: `Dish "${dish.name_km || dish.name_en}" is currently sold out.`
        });
      }

      const quantity = Math.max(1, Math.min(99, parseInt(item.quantity, 10) || 1));
      const truePrice = Number(dish.price) || 0;
      serverSubtotal += truePrice * quantity;

      verifiedItems.push({
        dishId: dish._id.toString(),
        name_km: dish.name_km,
        name_en: dish.name_en || dish.name_km,
        image: dish.image,
        price: truePrice,
        quantity,
        notes: typeof item.notes === 'string' ? item.notes.trim().slice(0, 200) : ''
      });
    }

    // Round subtotal to 2 decimals
    serverSubtotal = Math.round(serverSubtotal * 100) / 100;

    // 5. Server-Side Delivery Fee & Exchange Rate from Setting Collection
    const settings = await Setting.findOne();
    const standardDeliveryFee = Number(settings?.standardDeliveryFee) || 1.50;
    const freeDeliveryThreshold = Number(settings?.freeDeliveryThreshold) || 25.00;
    const khrRate = Number(settings?.khrRate) || 4100;

    let serverDeliveryFee = 0;
    if (cleanOrderType === 'delivery') {
      serverDeliveryFee = serverSubtotal >= freeDeliveryThreshold ? 0 : standardDeliveryFee;
    }

    // 6. Server-Side Promo Code Validation from PromoCode Collection
    let serverDiscount = 0;
    let appliedPromoCode = null;
    let appliedDiscountPercent = 0;

    if (promoCode && typeof promoCode === 'string') {
      const cleanCode = promoCode.trim().toUpperCase();
      const promo = await PromoCode.findOne({ code: cleanCode });
      if (promo && serverSubtotal >= (promo.min_spend || 0)) {
        appliedPromoCode = promo.code;
        if (promo.discount_type === 'percentage') {
          appliedDiscountPercent = Number(promo.discount_value) || 0;
          serverDiscount = Math.round(((serverSubtotal * appliedDiscountPercent) / 100) * 100) / 100;
        } else {
          serverDiscount = Math.min(serverSubtotal, Number(promo.discount_value) || 0);
        }
      }
    }

    // 7. Calculate Authoritative Final Total
    const serverTotal = Math.max(0, Math.round((serverSubtotal + serverDeliveryFee - serverDiscount) * 100) / 100);
    const serverTotalKhr = Math.round(serverTotal * khrRate);

    // 8. Generate Authoritative Order ID and Persist Order
    const orderId = `PY-ORD-${Math.floor(100000 + Math.random() * 900000)}`;
    const newOrder = await Order.create({
      orderId,
      order_id: orderId,
      customerName: cleanCustomerName,
      phone: cleanPhone,
      orderType: cleanOrderType,
      address: cleanAddress,
      pickupTime: cleanOrderType === 'pickup' ? (pickupTime || '').slice(0, 50) : '',
      notes: typeof notes === 'string' ? notes.slice(0, 300) : '',
      paymentMethod: 'khqr',
      isPaid: true,
      items: verifiedItems,
      subtotal: serverSubtotal,
      deliveryFee: serverDeliveryFee,
      discount: serverDiscount,
      total: serverTotal,
      total_khr: serverTotalKhr,
      promoCode: appliedPromoCode,
      discountPercent: appliedDiscountPercent,
      status: 'pending'
    });

    // 9. Automatically create Authoritative Payment record in payments collection
    try {
      await Payment.create({
        payment_id: `PAY-${newOrder.orderId}`,
        order_id: newOrder.orderId,
        payment_method: 'khqr',
        khqr_ref: `KHQR-HASH-${newOrder.orderId}`,
        amount: serverTotal,
        currency: 'USD',
        status: 'paid'
      });
    } catch (payErr) {
      console.warn('[OrderController] Warning: Could not create Payment record:', payErr.message);
    }

    // 10. Automatically create Authoritative OrderItem records in orderitems collection
    try {
      const orderItemDocs = verifiedItems.map((it, idx) => ({
        order_item_id: `ITEM-${newOrder.orderId}-${idx + 1}`,
        order_id: newOrder.orderId,
        product_id: it.dishId,
        quantity: it.quantity,
        price: it.price,
        notes: it.notes || ''
      }));
      await OrderItem.insertMany(orderItemDocs);
    } catch (itemErr) {
      console.warn('[OrderController] Warning: Could not create OrderItem records:', itemErr.message);
    }

    return res.status(201).json({ success: true, data: newOrder });
  } catch (error) {
    console.error('[OrderController] createOrder Error:', error);
    return res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Update order status & record admin audit log
// @route   PATCH /api/orders/:orderId/status
export const updateOrderStatus = async (req, res) => {
  try {
    const rawId = (req.params.orderId || '').trim();
    const cleanId = rawId.toUpperCase();
    const { status, adminName } = req.body;

    const actingAdminName = adminName || req.user?.name || req.user?.username || req.user?.email || 'Admin';
    const actingAdminEmail = req.user?.email || '';
    const actingAdminId = req.user?._id?.toString() || '';

    const query = {
      $or: [
        { orderId: cleanId },
        { order_id: cleanId },
        { orderId: rawId },
        ...(mongoose.Types.ObjectId.isValid(rawId) ? [{ _id: rawId }] : [])
      ]
    };

    const existingOrder = await Order.findOne(query);
    if (!existingOrder) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const previousStatus = existingOrder.status;

    // Create Activity Log Entry
    const logEntry = {
      adminId: actingAdminId,
      adminName: actingAdminName,
      adminEmail: actingAdminEmail,
      action: 'STATUS_UPDATE',
      description: `ប្តូរស្ថានភាពពី "${previousStatus}" ទៅជា "${status}" ដោយ ${actingAdminName}`,
      timestamp: new Date()
    };

    existingOrder.status = status;
    existingOrder.lastUpdatedBy = actingAdminName;
    if (!existingOrder.adminSale) {
      existingOrder.adminSale = actingAdminName;
    }
    if (!Array.isArray(existingOrder.activityLogs)) {
      existingOrder.activityLogs = [];
    }
    existingOrder.activityLogs.unshift(logEntry);

    const savedOrder = await existingOrder.save();

    // Synchronize Payment status if order completed or cancelled
    try {
      if (status === 'completed') {
        await Payment.findOneAndUpdate({ order_id: cleanId }, { status: 'paid' });
      } else if (status === 'cancelled') {
        await Payment.findOneAndUpdate({ order_id: cleanId }, { status: 'failed' });
      }
    } catch (_) {}

    res.json({ success: true, data: savedOrder });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
