import mongoose from 'mongoose';

const settingSchema = new mongoose.Schema(
  {
    isOpen: { type: Boolean, default: true },
    standardDeliveryFee: { type: Number, default: 1.50 },
    freeDeliveryThreshold: { type: Number, default: 25.00 },
    khrRate: { type: Number, default: 4100 },
    categoryDiscounts: { type: Object, default: {} },
    announcement: {
      active: { type: Boolean, default: true },
      text_km: { type: String, default: '' },
      text_en: { type: String, default: '' }
    }
  },
  { timestamps: true }
);

export const Setting = mongoose.model('Setting', settingSchema);
