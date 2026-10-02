import mongoose from 'mongoose';

const dishSchema = new mongoose.Schema(
  {
    dishId: { type: String, unique: true, sparse: true },
    name_km: { type: String, required: true, trim: true },
    name_en: { type: String, trim: true, default: function() { return this.name_km || ''; } },
    category: {
      type: String,
      required: true,
      trim: true
    },
    price: { type: Number, required: true, min: 0 },
    spice_level: {
      type: String,
      enum: ['none', 'mild', 'medium', 'hot'],
      default: 'none'
    },
    featured: { type: Boolean, default: false },
    inStock: { type: Boolean, default: true },
    rating: { type: Number, default: 5.0 },
    reviews_count: { type: Number, default: 0 },
    image: { type: String, required: true },
    desc_km: { type: String, default: '' },
    desc_en: { type: String, default: '' },
    ingredients_km: [{ type: String }],
    ingredients_en: [{ type: String }]
  },
  { timestamps: true }
);

export const Dish = mongoose.model('Dish', dishSchema);
