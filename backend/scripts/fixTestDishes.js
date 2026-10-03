import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const uri = process.env.MONGODB_URI || 'mongodb+srv://r59012695_db_user:PhumYeung2026!@cluster0.mdmoxbx.mongodb.net/phum_yeung_db?retryWrites=true&w=majority&appName=Cluster0';

async function run() {
  await mongoose.connect(uri);
  const Dish = mongoose.model('Dish', new mongoose.Schema({}, { strict: false }));
  const r1 = await Dish.updateOne(
    { dishId: 'dish-1790995272200' },
    { $set: { image: '/images/foods/clxzw1kj6001r10xkfxw0y2fy.jpg' } }
  );
  const r2 = await Dish.updateOne(
    { dishId: 'dish-1790995127715' },
    { $set: { image: '/images/foods/cls2y144a004p2zxdytrjrbaw.jpg' } }
  );
  console.log('Fixed test dishes images in MongoDB:', r1.modifiedCount, r2.modifiedCount);
  await mongoose.disconnect();
}

run().catch(console.error);
