import express from 'express';
import {
  getPromos,
  validatePromo,
  createPromo,
  updatePromo,
  deletePromo
} from '../controllers/promoController.js';
import { protectAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(getPromos)
  .post(protectAdmin, createPromo);

router.route('/validate/:code')
  .get(validatePromo);

router.route('/:id')
  .put(protectAdmin, updatePromo)
  .delete(protectAdmin, deletePromo);

export default router;
