import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { generateSecret } from 'otplib';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const NEW_PASSWORD = 'PhumYeung@Admin2026!';

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const salt = await bcrypt.genSalt(12);
  const hashedPassword = await bcrypt.hash(NEW_PASSWORD, salt);
  const result = await mongoose.connection.collection('users').updateOne(
    { email: 'admin@phumyeung.com', role: 'admin' },
    {
      $set: {
        password: hashedPassword
      }
    }
  );
  console.log('Password hardened with bcrypt 12 rounds. Modified:', result.modifiedCount);
  console.log('New admin password is:', NEW_PASSWORD);
  await mongoose.disconnect();
}

run().catch(console.error);
