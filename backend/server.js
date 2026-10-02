import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectDB } from './config/db.js';

// Route Imports
import dishRoutes from './routes/dishRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import promoRoutes from './routes/promoRoutes.js';
import settingRoutes from './routes/settingRoutes.js';
import authRoutes from './routes/authRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';

// Seed Models
import { Dish } from './models/Dish.js';
import { User } from './models/User.js';
import { Setting } from './models/Setting.js';

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '.env') });
dotenv.config();


const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB().then(async (conn) => {
  if (conn && mongoose.connection.readyState === 1) {
    try {
      const adminExists = await User.findOne({ email: 'admin@phumyeung.com' });
      if (!adminExists) {
        await User.create({
          name: 'Phum Yeung Admin',
          email: 'admin@phumyeung.com',
          password: 'admin123',
          role: 'admin'
        });
        console.log('[Server] Default admin initialized: admin@phumyeung.com');
      }

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
    return callback(new Error(`CORS blocked origin: ${origin}`));
  },
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static media files (dishes, logos) directly from backend API
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

// Mount Routes
app.use('/api/dishes', dishRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/promos', promoRoutes);
app.use('/api/settings', settingRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/payments', paymentRoutes);

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
