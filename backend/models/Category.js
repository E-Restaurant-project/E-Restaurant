import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema(
  {
    category_id: { type: String, unique: true, default: () => new mongoose.Types.ObjectId().toString() },
    name_km: { type: String, required: true, trim: true },
    name_en: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true }
  },
  { timestamps: true }
);

export const Category = mongoose.model('Category', categorySchema);
