import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { generateSecret, generateURI } from 'otplib';
import QRCode from 'qrcode';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb+srv://r59012695_db_user:PhumYeung2026!@cluster0.mdmoxbx.mongodb.net/phum_yeung_db?retryWrites=true&w=majority&appName=Cluster0';

async function main() {
  console.log(`\n======================================================`);
  console.log(`🛡️  PHUM YEUNG RESTAURANT - CREATE ADMIN ACCOUNT`);
  console.log(`======================================================\n`);

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  try {
    // Get parameters from command line args or interactive prompt
    const args = process.argv.slice(2);
    let email = args[0];
    let password = args[1];
    let name = args[2];

    if (!email) {
      email = await rl.question('Enter Admin Email (e.g. manager@phumyeung.com): ');
    }
    email = email.trim().toLowerCase();

    if (!email || !email.includes('@')) {
      console.error('❌ Error: A valid email address is required.');
      process.exit(1);
    }

    if (!name) {
      name = await rl.question('Enter Admin Name (e.g. General Manager): ');
    }
    name = (name || 'Administrator').trim();

    if (!password) {
      password = await rl.question('Enter Secure Password (min 8 characters): ');
    }
    password = password.trim();

    if (password.length < 6) {
      console.error('❌ Error: Password must be at least 6 characters long.');
      process.exit(1);
    }

    console.log('\n⏳ Connecting to MongoDB database...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB.');

    const usersCol = mongoose.connection.collection('users');
    const existing = await usersCol.findOne({ email });

    // Generate 2FA Secret Key
    const secret = generateSecret();

    // Hash password with bcrypt (cost factor 12)
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    if (existing) {
      console.log(`⚠️ User with email [${email}] already exists. Updating to Administrator...`);
      await usersCol.updateOne(
        { email },
        {
          $set: {
            name,
            password: hashedPassword,
            role: 'admin',
            isVerified: true,
            twoFactorSecret: secret,
            twoFactorCode: null,
            twoFactorExpires: null
          }
        }
      );
      console.log('✅ Account updated to Administrator role with fresh 2FA key.');
    } else {
      await usersCol.insertOne({
        name,
        email,
        password: hashedPassword,
        phone: '',
        address: '',
        role: 'admin',
        isVerified: true,
        twoFactorSecret: secret,
        twoFactorCode: null,
        twoFactorExpires: null,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log('✅ Administrator account created successfully.');
    }

    // Generate TOTP URI & QR Code
    const uri = generateURI({
      issuer: 'Phum Yeung Restaurant',
      label: email,
      secret
    });

    console.log(`\n======================================================`);
    console.log(`📋 ADMIN CREDENTIALS & 2FA KEY`);
    console.log(`======================================================`);
    console.log(`👤 Name:     ${name}`);
    console.log(`📧 Email:    ${email}`);
    console.log(`🔑 Password: ${password}`);
    console.log(`🛡️ Role:     admin`);
    console.log(`🔐 2FA Key:  ${secret}`);
    console.log(`======================================================\n`);

    console.log(`📱 SCAN THIS QR CODE WITH GOOGLE AUTHENTICATOR:\n`);
    const terminalQR = await QRCode.toString(uri, { type: 'terminal', small: true });
    console.log(terminalQR);

    console.log(`💡 Setup Instructions:`);
    console.log(`1. Open Google Authenticator, Microsoft Authenticator, or Apple Passwords on your phone.`);
    console.log(`2. Tap "+" -> "Scan a QR code" to scan the code above.`);
    console.log(`   OR select "Enter a setup key" and type: ${secret}`);
    console.log(`3. Sign in at: http://localhost:3001/login`);
    console.log(`4. Enter the 6-digit rolling code generated on your phone.\n`);

  } catch (err) {
    console.error('❌ Error creating admin account:', err.message);
  } finally {
    rl.close();
    await mongoose.disconnect();
    process.exit(0);
  }
}

main();
