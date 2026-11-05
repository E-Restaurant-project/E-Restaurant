import { Order } from '../models/Order.js';
import { Payment } from '../models/Payment.js';
import { OrderItem } from '../models/OrderItem.js';

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
    const cleanId = req.params.orderId.trim().toUpperCase();
    const order = await Order.findOne({ orderId: cleanId });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    res.json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create new order
// @route   POST /api/orders
export const createOrder = async (req, res) => {
  try {
    const orderId = req.body.orderId || `PY-ORD-${Math.floor(1000 + Math.random() * 9000)}`;
    const orderData = {
      ...req.body,
      orderId,
      order_id: orderId
    };

    const order = await Order.create(orderData);

    // 1. Automatically create corresponding Payment record in payments collection
    try {
      const isPaid = order.paymentMethod === 'khqr' || req.body.isPaid;
      await Payment.create({
        payment_id: `PAY-${order.orderId}`,
        order_id: order.orderId,
        payment_method: order.paymentMethod || 'cod',
        khqr_ref: order.paymentMethod === 'khqr' ? `KHQR-HASH-${order.orderId}` : `COD-${order.orderId}`,
        amount: order.total || 0,
        currency: 'USD',
        status: isPaid ? 'paid' : 'pending'
      });
    } catch (payErr) {
      console.warn('[OrderController] Warning: Could not create Payment record:', payErr.message);
    }

    // 2. Automatically create OrderItem records in orderitems collection
    try {
      if (Array.isArray(order.items) && order.items.length > 0) {
        const orderItemDocs = order.items.map((it, idx) => ({
          order_item_id: `ITEM-${order.orderId}-${idx + 1}`,
          order_id: order.orderId,
          product_id: it.dishId || it.id || `PROD-${idx + 1}`,
          quantity: it.quantity || 1,
          price: it.price || 0,
          notes: it.notes || ''
        }));
        await OrderItem.insertMany(orderItemDocs);
      }
    } catch (itemErr) {
      console.warn('[OrderController] Warning: Could not create OrderItem records:', itemErr.message);
    }

    res.status(201).json({ success: true, data: order });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
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
