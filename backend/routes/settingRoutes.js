import express from 'express';
import { getSettings, updateSettings } from '../controllers/settingController.js';
import { protectAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(getSettings)
  .put(protectAdmin, updateSettings);

export default router;
