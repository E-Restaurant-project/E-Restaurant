import { Order } from '../models/Order.js';

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
    const query = {
      $or: [
        { email: user.email.toLowerCase() },
        ...(user.phone ? [{ phone: user.phone }] : [])
      ]
    };

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
    const orderData = {
      ...req.body,
      orderId: req.body.orderId || `PY-ORD-${Math.floor(1000 + Math.random() * 9000)}`
    };

    const order = await Order.create(orderData);
    res.status(201).json({ success: true, data: order });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Update order status
// @route   PATCH /api/orders/:orderId/status
export const updateOrderStatus = async (req, res) => {
  try {
    const cleanId = req.params.orderId.trim().toUpperCase();
    const { status } = req.body;

    const order = await Order.findOneAndUpdate(
      { orderId: cleanId },
      { status },
      { new: true, runValidators: true }
    );

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    res.json({ success: true, data: order });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
