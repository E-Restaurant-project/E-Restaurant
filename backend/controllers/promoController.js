import { Promo } from '../models/Promo.js';

// @desc    Get all promos
// @route   GET /api/promos
export const getPromos = async (req, res) => {
  try {
    const promos = await Promo.find().sort({ createdAt: -1 });
    res.json({ success: true, count: promos.length, data: promos });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Validate a promo code
// @route   GET /api/promos/validate/:code
export const validatePromo = async (req, res) => {
  try {
    const cleanCode = req.params.code.trim().toUpperCase();
    const promo = await Promo.findOne({ code: cleanCode, active: true });

    if (!promo) {
      return res.status(404).json({ success: false, message: 'Invalid or inactive promo code' });
    }

    res.json({ success: true, discount: promo.discount, code: promo.code });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a promo code
// @route   POST /api/promos
export const createPromo = async (req, res) => {
  try {
    const { code, discount, description, active } = req.body;
    const promo = await Promo.create({
      code: code.trim().toUpperCase(),
      discount: Number(discount),
      description,
      active: active !== false
    });
    res.status(201).json({ success: true, data: promo });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Update a promo code
// @route   PUT /api/promos/:id
export const updatePromo = async (req, res) => {
  try {
    const rawId = req.params.id;
    const query = mongoose.Types.ObjectId.isValid(rawId)
      ? { $or: [{ _id: rawId }, { code: String(rawId).toUpperCase() }] }
      : { code: String(rawId).toUpperCase() };

    const promo = await Promo.findOneAndUpdate(query, req.body, {
      new: true,
      runValidators: true
    });
    if (!promo) {
      return res.status(404).json({ success: false, message: 'Promo code not found' });
    }
    res.json({ success: true, data: promo });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Delete a promo code
// @route   DELETE /api/promos/:id
export const deletePromo = async (req, res) => {
  try {
    const rawId = req.params.id;
    const query = mongoose.Types.ObjectId.isValid(rawId)
      ? { $or: [{ _id: rawId }, { code: String(rawId).toUpperCase() }] }
      : { code: String(rawId).toUpperCase() };

    const promo = await Promo.findOneAndDelete(query);
    if (!promo) {
      return res.status(404).json({ success: false, message: 'Promo code not found' });
    }
    res.json({ success: true, message: 'Promo code removed' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
