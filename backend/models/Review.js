import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    review_id: { type: String, unique: true, default: () => new mongoose.Types.ObjectId().toString() },
    product_id: { type: String, required: true, ref: 'Product' },
    customer_id: { type: String, required: true, ref: 'Customer' },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, default: '' }
  },
  { timestamps: true }
);

export const Review = mongoose.model('Review', reviewSchema);
