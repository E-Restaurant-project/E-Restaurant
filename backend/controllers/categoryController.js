import { Category } from '../models/Category.js';
import { Dish } from '../models/Dish.js';

// Normalize MongoDB category document to clean client format
export const normalizeCategory = (cat) => {
  if (!cat) return null;
  const id = (cat.id || cat.slug || cat.category_id || String(cat._id || '')).trim();
  const label_km = (cat.label_km || cat.name_km || '').trim();
  const label_en = (cat.label_en || cat.name_en || '').trim();

  return {
    _id: cat._id,
    id,
    slug: id,
    category_id: id,
    label_km: label_km || label_en || id,
    name_km: label_km || label_en || id,
    label_en: label_en || label_km || id,
    name_en: label_en || label_km || id,
    order: cat.order !== undefined ? Number(cat.order) : 0
  };
};

// @desc    Get all categories from database
// @route   GET /api/categories
// @access  Public
export const getCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ order: 1, createdAt: 1 }).lean();
    const normalized = (categories || []).map(normalizeCategory).filter(Boolean);

    res.json({
      success: true,
      count: normalized.length,
      data: normalized
    });
  } catch (error) {
    console.error('[getCategories error]', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a new category in database
// @route   POST /api/categories
// @access  Private/Admin
export const createCategory = async (req, res) => {
  try {
    const { id, label_km, name_km, label_en, name_en, order } = req.body;

    const kmText = (label_km || name_km || '').trim();
    const enText = (label_en || name_en || '').trim();

    if (!kmText || !enText) {
      return res.status(400).json({
        success: false,
        message: 'Both Khmer and English labels are required.'
      });
    }

    let slug = (id || enText || kmText)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    if (!slug) {
      slug = `cat-${Date.now()}`;
    }

    // Check duplicate
    const existing = await Category.findOne({
      $or: [{ id: slug }, { slug: slug }, { category_id: slug }]
    });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `Category with ID '${slug}' already exists.`
      });
    }

    const count = await Category.countDocuments();
    const newCategory = await Category.create({
      id: slug,
      slug: slug,
      category_id: slug,
      label_km: kmText,
      name_km: kmText,
      label_en: enText,
      name_en: enText,
      order: order !== undefined ? Number(order) : count + 1
    });

    res.status(201).json({
      success: true,
      message: 'Category created successfully.',
      data: normalizeCategory(newCategory.toObject ? newCategory.toObject() : newCategory)
    });
  } catch (error) {
    console.error('[createCategory error]', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update category in database
// @route   PUT /api/categories/:id
// @access  Private/Admin
export const updateCategory = async (req, res) => {
  try {
    const oldId = req.params.id;
    const { id, label_km, name_km, label_en, name_en, order } = req.body;

    const category = await Category.findOne({
      $or: [{ id: oldId }, { slug: oldId }, { category_id: oldId }]
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: `Category with ID '${oldId}' not found.`
      });
    }

    const newId = (id || oldId).toLowerCase().trim();

    // If ID changed, ensure new ID is not already taken by another category
    if (newId !== oldId) {
      const conflict = await Category.findOne({
        $or: [{ id: newId }, { slug: newId }, { category_id: newId }],
        _id: { $ne: category._id }
      });
      if (conflict) {
        return res.status(400).json({
          success: false,
          message: `Category ID '${newId}' is already used by another category.`
        });
      }
    }

    const kmText = label_km !== undefined ? label_km : name_km;
    const enText = label_en !== undefined ? label_en : name_en;

    category.id = newId;
    category.slug = newId;
    category.category_id = newId;
    if (kmText !== undefined) {
      category.label_km = String(kmText).trim();
      category.name_km = String(kmText).trim();
    }
    if (enText !== undefined) {
      category.label_en = String(enText).trim();
      category.name_en = String(enText).trim();
    }
    if (order !== undefined) category.order = Number(order);

    await category.save();

    // If category ID was renamed, migrate all dishes belonging to oldId to newId
    if (newId !== oldId) {
      try {
        await Dish.updateMany({ category: oldId }, { category: newId });
      } catch (err) {
        console.warn('[updateCategory] Dish category cascade update warning:', err.message);
      }
    }

    res.json({
      success: true,
      message: 'Category updated successfully.',
      data: normalizeCategory(category.toObject ? category.toObject() : category)
    });
  } catch (error) {
    console.error('[updateCategory error]', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete category from database
// @route   DELETE /api/categories/:id
// @access  Private/Admin
export const deleteCategory = async (req, res) => {
  try {
    const catId = req.params.id;

    const category = await Category.findOne({
      $or: [{ id: catId }, { slug: catId }, { category_id: catId }]
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: `Category with ID '${catId}' not found.`
      });
    }

    await Category.deleteOne({ _id: category._id });

    // Fallback category for orphaned dishes if any exist
    const fallback = await Category.findOne();
    const fallbackId = fallback ? (fallback.id || fallback.slug) : '';

    if (fallbackId) {
      try {
        await Dish.updateMany({ category: catId }, { category: fallbackId });
      } catch (err) {
        console.warn('[deleteCategory] Dish fallback update warning:', err.message);
      }
    }

    res.json({
      success: true,
      message: `Category '${catId}' deleted.`
    });
  } catch (error) {
    console.error('[deleteCategory error]', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
