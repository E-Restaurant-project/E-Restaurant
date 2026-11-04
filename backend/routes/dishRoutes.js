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
import { protectAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Upload image (multipart/form-data with field 'image') - Admin only
router.post('/upload', protectAdmin, uploadMiddleware.single('image'), uploadDishImage);

// Activity / Audit logs route - Admin only
router.get('/audit-logs', protectAdmin, getAuditLogs);

// Dishes: Public can read, only Admin can create
router.route('/')
  .get(getDishes)
  .post(protectAdmin, createDish);

// Dish by ID: Public can read, only Admin can edit/delete
router.route('/:id')
  .get(getDishById)
  .put(protectAdmin, updateDish)
  .delete(protectAdmin, deleteDish);

export default router;
