import express from 'express';
import {
  login,
  getAdmin2FASetup,
  resetAdmin2FA,
  verifyAdmin2FA,
  resendAdmin2FA,
  createAdmin,
  registerCustomer,
  verifyCode,
  resendCode,
  customerLogin,
  getMe,
  updateProfile,
  getCustomers
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Admin Authentication & 2FA
router.post('/login', login);
router.post('/admin/login', login);
router.post('/admin/create', createAdmin);
router.get('/admin/2fa-setup', getAdmin2FASetup);
router.post('/admin/reset-2fa', resetAdmin2FA);
router.post('/admin/verify-2fa', verifyAdmin2FA);
router.post('/admin/resend-2fa', resendAdmin2FA);

// Customer Registration & OTP
router.post('/register', registerCustomer);
router.post('/customer/register', registerCustomer);

router.post('/verify-code', verifyCode);
router.post('/customer/verify', verifyCode);
router.post('/verify', verifyCode);

router.post('/resend-code', resendCode);
router.post('/customer/resend', resendCode);
router.post('/resend', resendCode);

router.post('/customer-login', customerLogin);
router.post('/customer/login', customerLogin);

// Customer Management (Real Database Customers)
router.get('/customers', getCustomers);
router.get('/admin/customers', getCustomers);

// Customer Profile
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);

export default router;
