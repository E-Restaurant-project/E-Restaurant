import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { connectDB } from '../config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const adminsToCreate = [
  {
    name: 'Him Lihour',
    email: 'himlihour@phumyeung.com',
    password: 'Password@123',
    role: 'admin',
    isVerified: true,
    twoFactorEnabled: false
  },
  {
    name: 'Vuth Vathana',
    email: 'vuthvathana@phumyeung.com',
    password: 'Password@123',
    role: 'admin',
    isVerified: true,
    twoFactorEnabled: false
  },
  {
    name: 'Lorn Sovannaroth',
    email: 'lornsovannaroth@phumyeung.com',
    password: 'Password@123',
    role: 'admin',
    isVerified: true,
    twoFactorEnabled: false
  },
  {
    name: 'Ream Rithy',
    email: 'reamrithy@phumyeung.com',
    password: 'Password@123',
    role: 'admin',
    isVerified: true,
    twoFactorEnabled: false
  }
];

const seedAdmins = async () => {
  try {
    await connectDB();
    console.log('[Seeding Admins] Connected to MongoDB Atlas...');

    for (const adminData of adminsToCreate) {
      const cleanEmail = adminData.email.toLowerCase().trim();
      let user = await User.findOne({ email: cleanEmail });

      if (user) {
        user.name = adminData.name;
        user.role = 'admin';
        user.isVerified = true;
        user.twoFactorEnabled = false;
        user.password = adminData.password;
        await user.save();
        console.log(`[Updated] Admin: ${adminData.name} <${adminData.email}>`);
      } else {
        user = await User.create(adminData);
        console.log(`[Created] Admin: ${adminData.name} <${adminData.email}>`);
      }
    }

    const totalAdmins = await User.countDocuments({ role: 'admin' });
    console.log(`\n🎉 Successfully provisioned admins: Him Lihour, Vuth Vathana, Lorn Sovannaroth, Ream Rithy. Total admins in DB: ${totalAdmins}`);
    process.exit(0);
  } catch (error) {
    console.error('Error seeding admins:', error);
    process.exit(1);
  }
};

seedAdmins();

