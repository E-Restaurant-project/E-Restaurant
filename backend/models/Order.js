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
    order_id: { type: String, default: function () { return this.orderId; } },
    orderId: { type: String, required: true, unique: true },
    customer_id: { type: String, ref: 'Customer', default: null },
    address_id: { type: String, ref: 'Address', default: null },
    promo_id: { type: String, ref: 'PromoCode', default: null },
    customerName: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, default: '' },
    orderType: { type: String, enum: ['delivery', 'pickup'], default: 'delivery' },
    order_type: { type: String, default: function () { return this.orderType; } },
    address: { type: String, default: '' },
    pickupTime: { type: String, default: '' },
    notes: { type: String, default: '' },
    paymentMethod: { type: String, enum: ['cod', 'khqr'], default: 'cod' },
    items: [orderItemSchema],
    subtotal: { type: Number, required: true, default: 0 },
    deliveryFee: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    total: { type: Number, required: true, default: 0 },
    total_amount: { type: Number, default: function () { return this.total; } },
    status: {
      type: String,
      enum: ['pending', 'preparing', 'delivering', 'completed', 'cancelled'],
      default: 'pending'
    }
  },
  { timestamps: true }
);

export const Order = mongoose.model('Order', orderSchema);
