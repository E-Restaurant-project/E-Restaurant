import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const customerSchema = new mongoose.Schema(
  {
    customer_id: { type: String, unique: true, default: () => new mongoose.Types.ObjectId().toString() },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, default: '' },
    role: { type: String, enum: ['customer', 'admin', 'staff'], default: 'customer' },
    password_hash: { type: String, required: true }
  },
  { timestamps: true }
);

// Hash password before saving
customerSchema.pre('save', async function (next) {
  if (!this.isModified('password_hash')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password_hash = await bcrypt.hash(this.password_hash, salt);
  next();
});

customerSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password_hash);
};

export const Customer = mongoose.model('Customer', customerSchema);
