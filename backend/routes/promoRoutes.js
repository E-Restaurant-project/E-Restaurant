import express from 'express';
import {
  getPromos,
  validatePromo,
  createPromo,
  updatePromo,
  deletePromo
} from '../controllers/promoController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(getPromos)
  .post(protect, createPromo);

router.route('/validate/:code')
  .get(validatePromo);

router.route('/:id')
  .put(protect, updatePromo)
  .delete(protect, deletePromo);

export default router;
