import express from 'express';
import {
  getDishes,
  getDishById,
  createDish,
  updateDish,
  deleteDish,
  uploadMiddleware,
  uploadDishImage,
  getAuditLogs
} from '../controllers/dishController.js';
import { protectAdmin, resolveUser } from '../middleware/authMiddleware.js';

const router = express.Router();

// Upload image (multipart/form-data with field 'image') - Admin only
router.post('/upload', protectAdmin, uploadMiddleware.single('image'), uploadDishImage);

// Activity / Audit logs route - Admin only
router.get('/audit-logs', protectAdmin, getAuditLogs);

// Dishes: Public can read (sanitized), Admin gets full audit info
router.route('/')
  .get(resolveUser, getDishes)
  .post(protectAdmin, createDish);

// Dish by ID: Public can read (sanitized), Admin gets full audit info
router.route('/:id')
  .get(resolveUser, getDishById)
  .put(protectAdmin, updateDish)
  .delete(protectAdmin, deleteDish);

export default router;
