import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { generateSecret } from 'otplib';
import dotenv from 'dotenv';
dotenv.config();

const uri = process.env.MONGO_URI || 'mongodb+srv://r59012695_db_user:PhumYeung2026!@cluster0.mdmoxbx.mongodb.net/phum_yeung_db?retryWrites=true&w=majority&appName=Cluster0';

async function updateAdmin() {
  await mongoose.connect(uri);
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('PhumYeung@Admin2026!', salt);
  const secret = generateSecret();

  const result = await mongoose.connection.collection('users').updateOne(
    { email: 'admin@phumyeung.com' },
    {
      $set: {
        password: hashedPassword,
        twoFactorSecret: secret,
        role: 'admin',
        isVerified: true
      }
    },
    { upsert: true }
  );

  console.log('Admin updated:', result);
  console.log('Permanent 2FA Secret Key:', secret);
  process.exit(0);
}

updateAdmin().catch(e => {
  console.error(e);
  process.exit(1);
});
