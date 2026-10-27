import { Dish } from '../models/Dish.js';
import { StoredImage } from '../models/StoredImage.js';
import mongoose from 'mongoose';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const NON_SPICY_CATEGORIES = [
  'snacks-bari',
  'beverages',
  'beer-wine',
  'drinks',
  'drink',
  'beverage',
  'beer',
  'wine',
  'cigarette',
  'cigarettes',
  'bari'
];

const getDishQuery = (id) => {
  if (id && mongoose.Types.ObjectId.isValid(id)) {
    return { $or: [{ _id: id }, { dishId: id }] };
  }
  return { dishId: id };
};

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
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter
});

// @desc    Upload dish image
// @route   POST /api/dishes/upload
export const uploadDishImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file uploaded' });
    }
    const imageUrl = `/images/foods/${req.file.filename}`;

    // Read buffer and persist into MongoDB so Render restarts never lose the image
    try {
      const fileBuffer = fs.readFileSync(req.file.path);
      await StoredImage.findOneAndUpdate(
        { filename: req.file.filename },
        {
          filename: req.file.filename,
          contentType: req.file.mimetype || 'image/jpeg',
          data: fileBuffer,
          size: req.file.size
        },
        { upsert: true, new: true }
      );
    } catch (dbErr) {
      console.warn('[DishController] Warning: Could not persist image buffer to MongoDB:', dbErr.message);
    }

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

// @desc    Serve food image from disk or MongoDB fallback
export const serveFoodImage = async (req, res, next) => {
  try {
    const filename = path.basename(req.params.filename);
    const localPath = path.join(uploadDir, filename);

    // 1. If available on disk, serve immediately with long-term cache
    if (fs.existsSync(localPath)) {
      res.set('Cache-Control', 'public, max-age=31536000, immutable');
      return res.sendFile(localPath);
    }

    // 2. Not on disk (e.g. Render restarted/redeployed) -> retrieve from MongoDB Atlas!
    const stored = await StoredImage.findOne({ filename });
    if (stored && stored.data) {
      // Re-write to local disk cache so subsequent reads are instant
      try {
        fs.writeFileSync(localPath, stored.data);
      } catch (_) {}

      res.set('Content-Type', stored.contentType);
      res.set('Cache-Control', 'public, max-age=31536000, immutable');
      return res.send(stored.data);
    }

    // Fallthrough to next middleware (404 handler)
    return next();
  } catch (err) {
    console.error('[ServeFoodImage Error]', err.message);
    return next();
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
    const dish = await Dish.findOne(getDishQuery(req.params.id));

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
    let { price, price_khr } = req.body;
    if (price_khr !== undefined && price_khr !== null) {
      price_khr = Math.max(100, Math.round(Number(price_khr)));
      price = parseFloat((price_khr / 4100).toFixed(4));
    } else if (price !== undefined && price !== null) {
      const numP = Number(price);
      if (numP >= 100) {
        price_khr = Math.round(numP);
        price = parseFloat((price_khr / 4100).toFixed(4));
      } else {
        price_khr = Math.max(100, Math.round(numP * 4100));
        price = numP;
      }
    }

    const category = req.body.category ? String(req.body.category).trim() : 'specials';
    const isNonSpicy = NON_SPICY_CATEGORIES.includes(category.toLowerCase());

    const dishData = {
      ...req.body,
      price,
      price_khr,
      category,
      spice_level: isNonSpicy ? 'none' : (req.body.spice_level || 'none'),
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
    const updateData = { ...req.body };
    if (updateData.price_khr !== undefined && updateData.price_khr !== null) {
      updateData.price_khr = Math.max(100, Math.round(Number(updateData.price_khr)));
      updateData.price = parseFloat((updateData.price_khr / 4100).toFixed(4));
    } else if (updateData.price !== undefined && updateData.price !== null) {
      const numP = Number(updateData.price);
      if (numP >= 100) {
        updateData.price_khr = Math.round(numP);
        updateData.price = parseFloat((updateData.price_khr / 4100).toFixed(4));
      } else {
        updateData.price_khr = Math.max(100, Math.round(numP * 4100));
        updateData.price = numP;
      }
    }
    if (updateData.category) {
      updateData.category = String(updateData.category).trim();
      if (NON_SPICY_CATEGORIES.includes(updateData.category.toLowerCase())) {
        updateData.spice_level = 'none';
      }
    }
    const dish = await Dish.findOneAndUpdate(
      getDishQuery(req.params.id),
      updateData,
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
    const dish = await Dish.findOneAndDelete(getDishQuery(req.params.id));

    if (!dish) {
      return res.status(404).json({ success: false, message: 'Dish not found' });
    }
    res.json({ success: true, message: 'Dish removed' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
