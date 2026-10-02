import mongoose from 'mongoose';

export const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/phum_yeung_db';
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000 // Timeout after 5s instead of hanging
    });
    console.log(`[MongoDB] Connected successfully: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.warn(`[MongoDB Warning] Could not connect to MongoDB: ${error.message}`);
    console.warn(`[MongoDB Note] If you don't have local MongoDB running, you can provide a cloud MongoDB Atlas connection URI in server/.env or the app will run with in-memory/localStorage fallback.`);
    return null;
  }
};
