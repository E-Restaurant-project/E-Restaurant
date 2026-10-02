import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema(
  {
    dishId: { type: String, required: true },
    name_km: { type: String, required: true },
    name_en: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
    spiceLevel: { type: String, default: 'mild' },
    notes: { type: String, default: '' },
    image: { type: String, default: '' }
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderId: { type: String, required: true, unique: true },
    customerName: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, default: '' },
    orderType: { type: String, enum: ['delivery', 'pickup'], default: 'delivery' },
    address: { type: String, default: '' },
    pickupTime: { type: String, default: '' },
    notes: { type: String, default: '' },
    paymentMethod: { type: String, enum: ['cod', 'khqr'], default: 'cod' },
    items: [orderItemSchema],
    subtotal: { type: Number, required: true, default: 0 },
    deliveryFee: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    total: { type: Number, required: true, default: 0 },
    status: {
      type: String,
      enum: ['pending', 'preparing', 'delivering', 'completed', 'cancelled'],
      default: 'pending'
    }
  },
  { timestamps: true }
);

export const Order = mongoose.model('Order', orderSchema);
