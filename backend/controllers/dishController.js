import { Dish } from '../models/Dish.js';
import { StoredImage } from '../models/StoredImage.js';
import { AuditLog } from '../models/AuditLog.js';
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

const getAdminInfo = (req) => {
  let name = req.user?.name || req.body?.adminName || req.query?.adminName;
  let email = req.user?.email || req.body?.adminEmail || req.query?.adminEmail;
  let id = req.user?._id || req.body?.adminId || null;

  if (!name || name === 'Admin') {
    if (req.body?.adminName) name = req.body.adminName;
    else if (req.query?.adminName) name = req.query.adminName;
    else name = req.user?.name || 'Admin';
  }

  return {
    adminName: name || 'Admin',
    adminEmail: email || '',
    adminId: id
  };
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

    let dishQuery = Dish.find(query).sort({ createdAt: -1 });
    const isAdmin = req.user && (req.user.role === 'admin' || req.user.role === 'superadmin' || req.user.role === 'staff');
    if (!isAdmin) {
      dishQuery = dishQuery.select('-activityLogs -createdBy -updatedBy');
    }
    const dishes = await dishQuery;
    res.json({ success: true, count: dishes.length, data: dishes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single dish
// @route   GET /api/dishes/:id
export const getDishById = async (req, res) => {
  try {
    let dishQuery = Dish.findOne(getDishQuery(req.params.id));
    const isAdmin = req.user && (req.user.role === 'admin' || req.user.role === 'superadmin' || req.user.role === 'staff');
    if (!isAdmin) {
      dishQuery = dishQuery.select('-activityLogs -createdBy -updatedBy');
    }
    const dish = await dishQuery;

    if (!dish) {
      return res.status(404).json({ success: false, message: 'Dish not found' });
    }
    res.json({ success: true, data: dish });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a dish (records which admin created it)
// @route   POST /api/dishes
export const createDish = async (req, res) => {
  try {
    const { adminName, adminEmail, adminId } = getAdminInfo(req);
    const now = new Date();

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
      dishId: req.body.dishId || `dish-${Date.now()}`,
      inStock: req.body.inStock !== false,
      createdBy: {
        id: adminId,
        name: adminName,
        email: adminEmail,
        at: now
      },
      updatedBy: {
        id: adminId,
        name: adminName,
        email: adminEmail,
        at: now
      },
      activityLogs: [
        {
          action: 'create',
          adminName,
          adminEmail,
          adminId,
          details: `បានបង្កើតមុខម្ហូប "${req.body.name_km || req.body.name_en || ''}"`,
          at: now
        }
      ]
    };

    const dish = await Dish.create(dishData);

    // Record permanently in AuditLog collection
    try {
      await AuditLog.create({
        action: 'create_dish',
        adminId,
        adminName,
        adminEmail,
        targetType: 'dish',
        targetId: dish.dishId || String(dish._id),
        targetName: dish.name_km || dish.name_en,
        details: `Created product "${dish.name_km}" (${dish.name_en}) - Price: ${dish.price_khr}៛ ($${dish.price})`
      });
    } catch (auditErr) {
      console.warn('[AuditLog Warning]', auditErr.message);
    }

    res.status(201).json({ success: true, data: dish });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Update a dish (records which admin modified it or changed stock/selling)
// @route   PUT /api/dishes/:id
export const updateDish = async (req, res) => {
  try {
    const { adminName, adminEmail, adminId } = getAdminInfo(req);
    const now = new Date();

    const existingDish = await Dish.findOne(getDishQuery(req.params.id));
    if (!existingDish) {
      return res.status(404).json({ success: false, message: 'Dish not found' });
    }

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

    // Determine change specifics for clear human-readable audit trail
    const changes = [];
    let actionType = 'update';

    if (updateData.inStock !== undefined && updateData.inStock !== existingDish.inStock) {
      actionType = 'toggle_stock';
      if (updateData.inStock) {
        changes.push('បានបើកលក់ឡើងវិញ (Set to Available / In Stock)');
      } else {
        changes.push('បានបិទលក់ជាបណ្តោះអាសន្ន (Set to Out of Stock)');
      }
    }

    if (updateData.price_khr !== undefined && updateData.price_khr !== existingDish.price_khr) {
      changes.push(`កែប្រែតម្លៃពី ${existingDish.price_khr}៛ ទៅ ${updateData.price_khr}៛`);
    }

    if (updateData.name_km && updateData.name_km !== existingDish.name_km) {
      changes.push(`កែឈ្មោះខ្មែរ: "${updateData.name_km}"`);
    }

    if (updateData.category && updateData.category !== existingDish.category) {
      changes.push(`ប្តូរប្រភេទទៅ: "${updateData.category}"`);
    }

    if (updateData.discount_percent !== undefined && updateData.discount_percent !== existingDish.discount_percent) {
      changes.push(`ប្តូរការបញ្ចុះតម្លៃទៅ: ${updateData.discount_percent}%`);
    }

    if (changes.length === 0) {
      changes.push('បានកែប្រែព័ត៌មានមុខម្ហូប');
    }

    const logDetails = changes.join(', ');

    const newLog = {
      action: actionType,
      adminName,
      adminEmail,
      adminId,
      details: logDetails,
      at: now
    };

    updateData.updatedBy = {
      id: adminId,
      name: adminName,
      email: adminEmail,
      at: now
    };

    const dish = await Dish.findOneAndUpdate(
      getDishQuery(req.params.id),
      {
        $set: updateData,
        $push: { activityLogs: { $each: [newLog], $slice: -50 } }
      },
      { new: true, runValidators: true }
    );

    // Record permanently in AuditLog
    try {
      await AuditLog.create({
        action: actionType === 'toggle_stock' ? 'toggle_stock' : 'update_dish',
        adminId,
        adminName,
        adminEmail,
        targetType: 'dish',
        targetId: dish.dishId || String(dish._id),
        targetName: dish.name_km || dish.name_en,
        details: `${adminName}: ${logDetails}`
      });
    } catch (auditErr) {
      console.warn('[AuditLog Warning]', auditErr.message);
    }

    res.json({ success: true, data: dish });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Delete a dish (records which admin deleted it)
// @route   DELETE /api/dishes/:id
export const deleteDish = async (req, res) => {
  try {
    const { adminName, adminEmail, adminId } = getAdminInfo(req);

    const dish = await Dish.findOne(getDishQuery(req.params.id));
    if (!dish) {
      return res.status(404).json({ success: false, message: 'Dish not found' });
    }

    await Dish.deleteOne(getDishQuery(req.params.id));

    // Record deletion permanently in AuditLog
    try {
      await AuditLog.create({
        action: 'delete_dish',
        adminId,
        adminName,
        adminEmail,
        targetType: 'dish',
        targetId: dish.dishId || String(dish._id),
        targetName: dish.name_km || dish.name_en,
        details: `Deleted dish "${dish.name_km}" (${dish.name_en})`
      });
    } catch (auditErr) {
      console.warn('[AuditLog Warning]', auditErr.message);
    }

    res.json({
      success: true,
      message: 'Dish removed successfully',
      deletedBy: { name: adminName, email: adminEmail }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get system audit logs
// @route   GET /api/dishes/audit-logs
export const getAuditLogs = async (req, res) => {
  try {
    const logs = await AuditLog.find().sort({ createdAt: -1 }).limit(100);
    res.json({ success: true, count: logs.length, data: logs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
