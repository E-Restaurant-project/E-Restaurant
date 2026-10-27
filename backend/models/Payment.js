import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    payment_id: { type: String, unique: true, default: () => new mongoose.Types.ObjectId().toString() },
    order_id: { type: String, required: true, ref: 'Order' },
    payment_method: { type: String, enum: ['khqr', 'cod', 'card'], default: 'khqr' },
    khqr_ref: { type: String, unique: true, sparse: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, enum: ['USD', 'KHR'], default: 'USD' },
    status: { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' }
  },
  { timestamps: true }
);

export const Payment = mongoose.model('Payment', paymentSchema);
