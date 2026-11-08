import { Setting } from '../models/Setting.js';

// @desc    Get store settings
// @route   GET /api/settings
export const getSettings = async (req, res) => {
  try {
    let setting = await Setting.findOne();
    if (!setting) {
      setting = await Setting.create({
        isOpen: true,
        standardDeliveryFee: 1.50,
        freeDeliveryThreshold: 25.00,
        khrRate: 4100,
        announcement: {
          active: true,
          text_km: 'ប្រូម៉ូសិនពិសេស៖ បញ្ចុះតម្លៃ ១០% សម្រាប់ការកុម្ម៉ង់ដំបូងដោយប្រើកូដ PHUM10!',
          text_en: 'Special Promo: Enjoy 10% OFF your first delivery order with code PHUM10!'
        }
      });
    }
    res.json({ success: true, data: setting });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update store settings
// @route   PUT /api/settings
export const updateSettings = async (req, res) => {
  try {
    let setting = await Setting.findOne();
    if (!setting) {
      setting = await Setting.create(req.body);
    } else {
      if (req.body.categoryDiscounts !== undefined) {
        setting.categoryDiscounts = req.body.categoryDiscounts;
        setting.markModified('categoryDiscounts');
      }
      if (req.body.announcement !== undefined) {
        setting.announcement = { ...setting.announcement, ...req.body.announcement };
        setting.markModified('announcement');
      }
      if (req.body.isOpen !== undefined) setting.isOpen = req.body.isOpen;
      if (req.body.standardDeliveryFee !== undefined) setting.standardDeliveryFee = req.body.standardDeliveryFee;
      if (req.body.freeDeliveryThreshold !== undefined) setting.freeDeliveryThreshold = req.body.freeDeliveryThreshold;
      if (req.body.khrRate !== undefined) setting.khrRate = req.body.khrRate;

      await setting.save();
    }
    res.json({ success: true, data: setting });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
