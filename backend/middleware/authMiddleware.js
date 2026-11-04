import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'phum_yeung_khmer_secret_key_jwt_2026');
      req.user = await User.findById(decoded.id).select('-password');
      return next();
    } catch (error) {
      return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token provided' });
  }
};

/**
 * Strict Admin Gatekeeper:
 * Rejects requests from non-admins or customers immediately with 403 Forbidden.
 */
export const protectAdmin = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'phum_yeung_khmer_secret_key_jwt_2026');
      const user = await User.findById(decoded.id).select('-password');
      if (!user) {
        return res.status(401).json({ success: false, message: 'User not found' });
      }
      if (user.role !== 'admin' && user.role !== 'superadmin' && user.role !== 'staff') {
        return res.status(403).json({ success: false, message: 'Access denied: Admin privileges required' });
      }
      req.user = user;
      return next();
    } catch (error) {
      return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
    }
  }

  return res.status(401).json({ success: false, message: 'Not authorized, no token provided' });
};

/**
 * Optional user resolver: extracts req.user if a valid token is provided,
 * otherwise lets the request proceed smoothly without blocking.
 */
export const resolveUser = async (req, res, next) => {
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      const token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'phum_yeung_khmer_secret_key_jwt_2026');
      req.user = await User.findById(decoded.id).select('-password');
    } catch (_) {
      // Proceed without user
    }
  }
  next();
};
