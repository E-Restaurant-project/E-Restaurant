import mongoose from 'mongoose';

const inventorySchema = new mongoose.Schema(
  {
    inventory_id: { type: String, unique: true, default: () => new mongoose.Types.ObjectId().toString() },
    product_id: { type: String, required: true, unique: true, ref: 'Product' },
    stock_quantity: { type: Number, required: true, default: 0, min: 0 },
    unit: { type: String, default: 'portion' },
    reorder_level: { type: Number, default: 5, min: 0 }
  },
  { timestamps: true }
);

export const Inventory = mongoose.model('Inventory', inventorySchema);
