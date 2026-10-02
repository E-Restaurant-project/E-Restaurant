import express from 'express';
import {
  generateBakongKHQR,
  verifyTransactionByMD5,
  simulatePaymentSuccess
} from '../controllers/paymentController.js';

const router = express.Router();

router.post('/bakong/generate', generateBakongKHQR);
router.post('/bakong/check-md5', verifyTransactionByMD5);
router.post('/bakong/simulate-success', simulatePaymentSuccess);

export default router;
