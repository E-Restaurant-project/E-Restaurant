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
    price_khr: { type: Number, min: 100 },
    discount_percent: { type: Number, default: 0, min: 0, max: 100 },
    spice_level: {
      enum: ['none', 'mild', 'medium', 'hot'],
      type: String,
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
    ingredients_en: [{ type: String }],
    createdBy: {
      id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      name: { type: String, default: 'Admin' },
      email: { type: String, default: '' },
      at: { type: Date, default: Date.now }
    },
    updatedBy: {
      id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      name: { type: String, default: 'Admin' },
      email: { type: String, default: '' },
      at: { type: Date, default: Date.now }
    },
    activityLogs: [
      {
        action: { type: String, required: true },
        adminName: { type: String, default: 'Admin' },
        adminEmail: { type: String, default: '' },
        adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        details: { type: String, default: '' },
        at: { type: Date, default: Date.now }
      }
    ]
  },
  { timestamps: true }
);

export const Dish = mongoose.model('Dish', dishSchema);
