import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    product_id: { type: String, unique: true, default: () => new mongoose.Types.ObjectId().toString() },
    category_id: { type: String, required: true, ref: 'Category' },
    name_km: { type: String, required: true, trim: true },
    name_en: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    price_khr: { type: Number, min: 100 },
    spice_level: { type: String, enum: ['none', 'mild', 'medium', 'hot'], default: 'none' },
    image: { type: String, required: true }
  },
  { timestamps: true }
);

export const Product = mongoose.model('Product', productSchema);
