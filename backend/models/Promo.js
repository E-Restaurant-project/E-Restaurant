import mongoose from 'mongoose';

const promoSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    discount: { type: Number, required: true, min: 1, max: 100 },
    active: { type: Boolean, default: true },
    description: { type: String, default: '' },
    usageCount: { type: Number, default: 0 }
  },
  { timestamps: true }
);

export const Promo = mongoose.model('Promo', promoSchema);
