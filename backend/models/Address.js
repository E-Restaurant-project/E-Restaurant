import mongoose from 'mongoose';

const addressSchema = new mongoose.Schema(
  {
    address_id: { type: String, unique: true, default: () => new mongoose.Types.ObjectId().toString() },
    customer_id: { type: String, required: true, ref: 'Customer' },
    khan: { type: String, required: true, trim: true },
    street: { type: String, required: true, trim: true },
    is_default: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export const Address = mongoose.model('Address', addressSchema);
