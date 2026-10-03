import mongoose from 'mongoose';

const storedImageSchema = new mongoose.Schema(
  {
    filename: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    contentType: {
      type: String,
      required: true,
      default: 'image/jpeg'
    },
    data: {
      type: Buffer,
      required: true
    },
    size: {
      type: Number,
      required: true
    }
  },
  { timestamps: true }
);

export const StoredImage = mongoose.model('StoredImage', storedImageSchema);
