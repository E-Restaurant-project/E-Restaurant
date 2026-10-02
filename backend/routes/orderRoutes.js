import express from 'express';
import {
  getOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
  getMyOrders
} from '../controllers/orderController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(getOrders)
  .post(createOrder);

router.get('/my-orders', protect, getMyOrders);

router.route('/:orderId')
  .get(getOrderById);

router.route('/:orderId/status')
  .patch(protect, updateOrderStatus);

export default router;
