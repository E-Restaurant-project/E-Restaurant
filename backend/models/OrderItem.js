import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema(
  {
    order_item_id: { type: String, unique: true, default: () => new mongoose.Types.ObjectId().toString() },
    order_id: { type: String, required: true, ref: 'Order' },
    product_id: { type: String, required: true, ref: 'Product' },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
    notes: { type: String, default: '' }
  },
  { timestamps: true }
);

export const OrderItem = mongoose.model('OrderItem', orderItemSchema);
