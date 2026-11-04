import express from 'express';
import {
  getOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
  getMyOrders
} from '../controllers/orderController.js';
import { protect, protectAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protectAdmin, getOrders)
  .post(createOrder);

router.get('/my-orders', protect, getMyOrders);

router.route('/:orderId')
  .get(getOrderById);

router.route('/:orderId/status')
  .patch(protectAdmin, updateOrderStatus);

export default router;
