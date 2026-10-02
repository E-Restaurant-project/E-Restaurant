import { Dish } from '../models/Dish.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.resolve(__dirname, '../public/images/foods');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `dish-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|webp|avif/;
  const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
  if (allowed.test(ext) || allowed.test(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (JPG, PNG, WebP) are allowed'));
  }
};

export const uploadMiddleware = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 }, // 8MB
  fileFilter
});

// @desc    Upload dish image
// @route   POST /api/dishes/upload
export const uploadDishImage = (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file uploaded' });
    }
    const imageUrl = `/images/foods/${req.file.filename}`;
    res.json({
      success: true,
      imageUrl,
      fileName: req.file.filename,
      message: 'Image uploaded successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// @desc    Get all dishes
// @route   GET /api/dishes
export const getDishes = async (req, res) => {
  try {
    const { category, search, featured } = req.query;
    const query = {};

    if (category && category !== 'all') {
      query.category = category;
    }
    if (featured === 'true') {
      query.featured = true;
    }
    if (search) {
      query.$or = [
        { name_km: { $regex: search, $options: 'i' } },
        { name_en: { $regex: search, $options: 'i' } }
      ];
    }

    const dishes = await Dish.find(query).sort({ createdAt: -1 });
    res.json({ success: true, count: dishes.length, data: dishes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single dish
// @route   GET /api/dishes/:id
export const getDishById = async (req, res) => {
  try {
    const dish = await Dish.findOne({
      $or: [{ _id: req.params.id.match(/^[0-9a-fA-F]{24}$/) ? req.params.id : null }, { dishId: req.params.id }]
    });

    if (!dish) {
      return res.status(404).json({ success: false, message: 'Dish not found' });
    }
    res.json({ success: true, data: dish });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a dish
// @route   POST /api/dishes
export const createDish = async (req, res) => {
  try {
    const dishData = {
      ...req.body,
      name_en: req.body.name_en || req.body.name_km || '',
      dishId: req.body.dishId || `dish-${Date.now()}`
    };
    const dish = await Dish.create(dishData);
    res.status(201).json({ success: true, data: dish });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Update a dish
// @route   PUT /api/dishes/:id
export const updateDish = async (req, res) => {
  try {
    const dish = await Dish.findOneAndUpdate(
      { $or: [{ _id: req.params.id.match(/^[0-9a-fA-F]{24}$/) ? req.params.id : null }, { dishId: req.params.id }] },
      req.body,
      { new: true, runValidators: true }
    );

    if (!dish) {
      return res.status(404).json({ success: false, message: 'Dish not found' });
    }
    res.json({ success: true, data: dish });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Delete a dish
// @route   DELETE /api/dishes/:id
export const deleteDish = async (req, res) => {
  try {
    const dish = await Dish.findOneAndDelete({
      $or: [{ _id: req.params.id.match(/^[0-9a-fA-F]{24}$/) ? req.params.id : null }, { dishId: req.params.id }]
    });

    if (!dish) {
      return res.status(404).json({ success: false, message: 'Dish not found' });
    }
    res.json({ success: true, message: 'Dish removed' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
