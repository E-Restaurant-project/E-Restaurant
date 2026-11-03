import express from 'express';
import {
  getDishes,
  getDishById,
  createDish,
  updateDish,
  deleteDish,
  uploadMiddleware,
  uploadDishImage
} from '../controllers/dishController.js';

const router = express.Router();

// Upload image (multipart/form-data with field 'image')
router.post('/upload', uploadMiddleware.single('image'), uploadDishImage);

router.route('/')
  .get(getDishes)
  .post(createDish);

router.route('/:id')
  .get(getDishById)
  .put(updateDish)
  .delete(deleteDish);

export default router;
