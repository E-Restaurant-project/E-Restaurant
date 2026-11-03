import mongoose from 'mongoose';

const promoCodeSchema = new mongoose.Schema(
  {
    promo_id: { type: String, unique: true, default: () => new mongoose.Types.ObjectId().toString() },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    discount_type: { type: String, enum: ['percentage', 'fixed'], default: 'percentage' },
    discount_value: { type: Number, required: true, min: 0 },
    min_spend: { type: Number, default: 0, min: 0 }
  },
  { timestamps: true }
);

export const PromoCode = mongoose.model('PromoCode', promoCodeSchema);
