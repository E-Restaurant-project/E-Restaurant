import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { connectDB } from './config/db.js';

// Route Imports
import dishRoutes from './routes/dishRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import promoRoutes from './routes/promoRoutes.js';
import settingRoutes from './routes/settingRoutes.js';
import authRoutes from './routes/authRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';

// Seed Models
import { Dish } from './models/Dish.js';
import { User } from './models/User.js';
import { Setting } from './models/Setting.js';
import { serveFoodImage } from './controllers/dishController.js';

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '.env') });
dotenv.config();


const app = express();
const PORT = process.env.PORT || 5000;

// Trust reverse proxy (Render, Vercel, Cloudflare) for accurate client IP in rate limiting
app.set('trust proxy', 1);

// Security Headers: Protection against XSS, clickjacking, sniffing
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }, // Allows images to load in frontend/admin
  contentSecurityPolicy: false // Allows API to serve media and JSON without breaking inline scripts
}));

// Connect to MongoDB
connectDB().then(async (conn) => {
  if (conn && mongoose.connection.readyState === 1) {
    try {
      const settingExists = await Setting.findOne();
      if (!settingExists) {
        await Setting.create({
          isOpen: true,
          standardDeliveryFee: 1.50,
          freeDeliveryThreshold: 25.00,
          khrRate: 4100,
          announcement: {
            active: true,
            text_km: '🔥 ប្រូម៉ូសិនពិសេស៖ បញ្ចុះតម្លៃ ១០% សម្រាប់ការកុម្ម៉ង់ដំបូងដោយប្រើកូដ PHUM10!',
            text_en: '🔥 Special Promo: Enjoy 10% OFF your first delivery order with code PHUM10!'
          }
        });
      }
    } catch (e) {
      console.warn('[Server] Auto-seed check:', e.message);
    }
  }
});

// Middleware
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
  process.env.CLIENT_URL,
  process.env.ADMIN_URL
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser requests or matching origins
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    // Allow any localhost / 127.0.0.1 development port
    if (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
      return callback(null, true);
    }
    // Allow Vercel preview & production deployments
    if (/\.vercel\.app$/.test(origin)) {
      return callback(null, true);
    }
    // Allow Cloudflare Workers & Pages deployments
    if (/\.(workers|pages)\.dev$/.test(origin)) {
      return callback(null, true);
    }
    // Allow Render deployments
    if (/\.onrender\.com$/.test(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`CORS blocked origin: ${origin}`));
  },
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static media files (dishes, logos) directly from backend API
app.get('/images/foods/:filename', serveFoodImage);
app.use('/images', express.static(path.join(__dirname, 'public/images')));


// Database connectivity check middleware
app.use('/api', (req, res, next) => {
  if (req.path === '/health') return next();

  // If MongoDB is not connected (readyState !== 1), return 503 gracefully so client falls back immediately
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      success: false,
      isOffline: true,
      message: 'MongoDB is currently offline. Front-end fallback mode is active.'
    });
  }
  next();
});

// Welcome Root Endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '🍲 Phum Yeung Restaurant REST API Server',
    status: 'ONLINE',
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    endpoints: {
      health: '/api/health',
      dishes: '/api/dishes',
      categories: '/api/categories'
    }
  });
});

// Health Check API
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'Phum Yeung Online Backend API',
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// ==========================================
// 🛡️ Rate Limiting & Anti-Brute-Force Shields
// ==========================================
// 1. General API Limiter: Max 300 requests per 15 minutes per IP
const generalApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP. Please try again after 15 minutes.'
  }
});
app.use('/api', generalApiLimiter);

// 2. Strict Auth / Login Limiter: Max 15 attempts per 15 mins per IP (Stops brute-force & OTP bombing)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many login attempts. Please wait 15 minutes before trying again.'
  }
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/admin/login', authLimiter);
app.use('/api/auth/admin/verify-2fa', authLimiter);
app.use('/api/auth/customer/login', authLimiter);
app.use('/api/auth/customer/verify', authLimiter);

// 3. Strict Order / Payment Limiter: Max 20 checkout/KHQR requests per 15 mins (Stops fake/spam orders)
const orderCreationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Order creation rate exceeded. Please wait a moment.'
  }
});
app.use('/api/orders/checkout', orderCreationLimiter);
app.use('/api/payments/khqr/generate', orderCreationLimiter);

// Mount Routes
app.use('/api/dishes', dishRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/promos', promoRoutes);
app.use('/api/settings', settingRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/categories', categoryRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[API Error]', err.stack);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

// 404 Handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Endpoint ${req.originalUrl} not found`
  });
});

app.listen(PORT, () => {
  console.log(`=============================================`);
  console.log(`🍲 Phum Yeung Online API Server`);
  console.log(`📡 Running on: http://localhost:${PORT}`);
  console.log(`🛡️ Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`=============================================`);
});
