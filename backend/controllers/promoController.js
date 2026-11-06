import mongoose from 'mongoose';
import { Promo } from '../models/Promo.js';

// @desc    Get all promos
// @route   GET /api/promos
export const getPromos = async (req, res) => {
  try {
    const promos = await Promo.find().sort({ createdAt: -1 });
    const normalized = promos.map((p) => {
      const obj = p.toObject();
      return { ...obj, active: true };
    });
    res.json({ success: true, count: normalized.length, data: normalized });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Validate a promo code
// @route   GET /api/promos/validate/:code
export const validatePromo = async (req, res) => {
  try {
    const cleanCode = req.params.code.trim().toUpperCase();
    let promo = await Promo.findOne({ code: cleanCode });

    if (!promo) {
      return res.status(404).json({ success: false, message: 'Invalid promo code' });
    }

    if (promo.active === false) {
      promo.active = true;
      await promo.save();
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
    const updateData = { ...req.body };
    if (updateData.code) {
      updateData.code = String(updateData.code).trim().toUpperCase();
    }
    if (updateData.discount !== undefined) {
      updateData.discount = Number(updateData.discount);
    }

    const query = mongoose.Types.ObjectId.isValid(rawId)
      ? { $or: [{ _id: rawId }, { code: String(rawId).toUpperCase() }] }
      : { code: String(rawId).toUpperCase() };

    const promo = await Promo.findOneAndUpdate(query, updateData, {
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
