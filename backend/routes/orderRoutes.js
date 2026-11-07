import express from 'express';
import rateLimit from 'express-rate-limit';
import {
  getOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
  getMyOrders
} from '../controllers/orderController.js';
import { protect, protectAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Strict order creation rate limiter: Max 25 order submissions per 15 minutes per IP
const orderLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 25,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many order requests from this IP. Please wait a moment before trying again.'
  }
});

router.route('/')
  .get(protectAdmin, getOrders)
  .post(orderLimiter, createOrder);

router.get('/my-orders', protect, getMyOrders);

router.route('/:orderId')
  .get(getOrderById);

router.route('/:orderId/status')
  .patch(protectAdmin, updateOrderStatus);

export default router;
