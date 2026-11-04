import express from 'express';
import {
  login,
  verifyAdmin2FA,
  resendAdmin2FA,
  registerCustomer,
  verifyCode,
  resendCode,
  customerLogin,
  getMe,
  updateProfile,
  getCustomers,
  getAdmins,
  forgotPassword,
  resetPassword,
  googleAuth
} from '../controllers/authController.js';
import { protect, protectAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Admin Authentication & 2FA
router.post('/login', login);
router.post('/admin/login', login);
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

// Customer Management (Real Database Customers) - Strictly Admin Only
router.get('/customers', protectAdmin, getCustomers);
router.get('/admins', protectAdmin, getAdmins);
router.get('/admin/list', protectAdmin, getAdmins);
router.get('/admin/customers', protectAdmin, getCustomers);

// Customer Profile
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);


// Password Reset Endpoints
router.post('/forgot-password', forgotPassword);
router.post('/customer/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/customer/reset-password', resetPassword);


// Google OAuth Sign-In
router.post('/google', googleAuth);
router.post('/customer/google', googleAuth);

export default router;
