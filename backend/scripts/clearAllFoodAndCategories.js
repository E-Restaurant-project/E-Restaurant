import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function clearDatabase() {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGO_URI is not defined in backend/.env');
    process.exit(1);
  }

  console.log('Connecting to MongoDB Atlas...');
  await mongoose.connect(uri);
  console.log('Connected to MongoDB successfully.');

  const db = mongoose.connection.db;

  // Clear categories collection
  try {
    const catColl = db.collection('categories');
    const catCountBefore = await catColl.countDocuments();
    const catRes = await catColl.deleteMany({});
    console.log(`Deleted ${catRes.deletedCount} categories from MongoDB (was ${catCountBefore}).`);
  } catch (err) {
    console.warn('Error clearing categories:', err.message);
  }

  // Clear dishes collection
  try {
    const dishColl = db.collection('dishes');
    const dishCountBefore = await dishColl.countDocuments();
    const dishRes = await dishColl.deleteMany({});
    console.log(`Deleted ${dishRes.deletedCount} dishes from MongoDB (was ${dishCountBefore}).`);
  } catch (err) {
    console.warn('Error clearing dishes:', err.message);
  }

  await mongoose.disconnect();
  console.log('Database successfully cleared! Both categories and dishes are now 0.');
}

clearDatabase().catch((err) => {
  console.error('Error in clearDatabase:', err);
  process.exit(1);
});

