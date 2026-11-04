import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema(
  {
    id: { type: String, trim: true },
    slug: { type: String, trim: true },
    category_id: { type: String, trim: true },
    label_km: { type: String, trim: true },
    name_km: { type: String, trim: true },
    label_en: { type: String, trim: true },
    name_en: { type: String, trim: true },
    order: { type: Number, default: 0 }
  },
  { timestamps: true, strict: false }
);

export const Category = mongoose.model('Category', categorySchema);
