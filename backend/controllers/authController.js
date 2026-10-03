import jwt from 'jsonwebtoken';
import { generateSecret, generateURI, verifySync } from 'otplib';
import QRCode from 'qrcode';
import { User } from '../models/User.js';
import { sendVerificationEmail, sendAdmin2FAEmail } from '../config/mailer.js';

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'phum_yeung_khmer_secret_key_jwt_2026', {
    expiresIn: '30d'
  });
};

const generate6DigitCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// ==========================================
// 1. Admin Login (Step 1: Verify Credentials & Issue 2FA)
// ==========================================
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const cleanEmail = email.trim().toLowerCase();
    let admin = await User.findOne({ email: cleanEmail });

    // Seed default admin with unbreached strong password if not present
    if (!admin && cleanEmail === 'admin@phumyeung.com') {
      admin = await User.create({
        name: 'Phum Yeung Admin',
        email: 'admin@phumyeung.com',
        password: 'PhumYeung@Admin2026!',
        twoFactorSecret: generateSecret(),
        role: 'admin',
        isVerified: true
      });
    }

    if (!admin || admin.role !== 'admin') {
      return res.status(401).json({ success: false, message: 'Invalid administrator credentials or access denied' });
    }

    let isMatch = await admin.comparePassword(password);
    
    // Auto-migrate if admin used previous default password
    if (!isMatch && password === 'admin123' && cleanEmail === 'admin@phumyeung.com') {
      admin.password = 'PhumYeung@Admin2026!';
      await admin.save();
      isMatch = true;
    }

    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // Ensure 2FA Authenticator secret is initialized
    if (!admin.twoFactorSecret) {
      admin.twoFactorSecret = generateSecret();
      await admin.save();
    }

    // Generate 6-digit email 2FA code with 10-minute expiry
    const code = generate6DigitCode();
    admin.twoFactorCode = code;
    admin.twoFactorExpires = new Date(Date.now() + 10 * 60 * 1000);
    await admin.save();

    // Send real 2FA email notification
    await sendAdmin2FAEmail(admin.email, code, admin.name);

    return res.json({
      success: true,
      requires2FA: true,
      email: admin.email,
      hasAuthenticatorKey: true,
      backupCode: '888999',
      message: '2FA security verification required. Enter code from Google Authenticator, email, or emergency backup code 888999.'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// 2. Admin 2FA Setup / Key retrieval (Google Authenticator)
// ==========================================
export const getAdmin2FASetup = async (req, res) => {
  try {
    const email = (req.query.email || 'admin@phumyeung.com').trim().toLowerCase();
    let admin = await User.findOne({ email, role: 'admin' });

    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin account not found' });
    }

    if (!admin.twoFactorSecret) {
      admin.twoFactorSecret = generateSecret();
      await admin.save();
    }

    const uri = generateURI({
      issuer: 'Phum Yeung Restaurant',
      label: admin.email,
      secret: admin.twoFactorSecret
    });

    const qrCode = await QRCode.toDataURL(uri);

    return res.json({
      success: true,
      email: admin.email,
      secret: admin.twoFactorSecret,
      qrCode,
      issuer: 'Phum Yeung Restaurant',
      backupCode: '888999',
      instructions: 'Scan this QR code or type the secret key into Google Authenticator or Microsoft Authenticator. Emergency backup code: 888999.'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// 3. Admin 2FA Reset (Generate fresh Secret Key & QR Code)
// ==========================================
export const resetAdmin2FA = async (req, res) => {
  try {
    const { email } = req.body;
    const cleanEmail = (email || 'admin@phumyeung.com').trim().toLowerCase();
    const admin = await User.findOne({ email: cleanEmail, role: 'admin' });

    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin account not found' });
    }

    // Force-generate new clean Base32 secret
    const newSecret = generateSecret();
    admin.twoFactorSecret = newSecret;
    await admin.save();

    const uri = generateURI({
      issuer: 'Phum Yeung Restaurant',
      label: admin.email,
      secret: newSecret
    });

    const qrCode = await QRCode.toDataURL(uri);

    return res.json({
      success: true,
      message: 'Fresh 2FA key generated successfully. Please scan the new QR code into Google Authenticator.',
      email: admin.email,
      secret: newSecret,
      qrCode,
      backupCode: '888999'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// 4. Admin 2FA Code Verification (Step 2: Issue JWT)
// ==========================================
export const verifyAdmin2FA = async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ success: false, message: 'Email and 2FA code are required' });
    }

    const cleanEmail = String(email).replace(/\s+/g, '').toLowerCase();
    const cleanCode = String(code).replace(/[\s-]/g, '').trim();
    const admin = await User.findOne({ email: cleanEmail, role: 'admin' });

    if (!admin) {
      return res.status(401).json({ success: false, message: 'Admin account not found' });
    }

    let isValid = false;
    let authMethod = '';

    // 1. Verify against Emergency Master Backup Code (guaranteed login if phone time is skewed or authenticator lost)
    const masterBackupCode = process.env.ADMIN_2FA_MASTER_CODE || '888999';
    if (cleanCode === masterBackupCode) {
      isValid = true;
      authMethod = 'Emergency Backup Code (888999)';
    }

    // 2. Verify against Google Authenticator / TOTP with 120s epochTolerance (+/- 2 minutes clock skew)
    if (!isValid && admin.twoFactorSecret) {
      try {
        const check = verifySync({
          token: cleanCode,
          secret: admin.twoFactorSecret,
          epochTolerance: 120
        });
        if (check && check.valid) {
          isValid = true;
          authMethod = 'Google Authenticator (TOTP)';
        }
      } catch (e) {
        console.warn('[Admin 2FA TOTP Check]', e.message);
      }
    }

    // 3. Verify against Email 2FA OTP
    if (!isValid && admin.twoFactorCode && admin.twoFactorExpires) {
      if (new Date() <= admin.twoFactorExpires && admin.twoFactorCode === cleanCode) {
        isValid = true;
        authMethod = 'Email OTP Code';
      }
    }

    console.log(`[Admin 2FA] Verification attempt for ${cleanEmail} with code [${cleanCode}]: ${isValid ? 'PASSED via ' + authMethod : 'FAILED'}`);

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired 2FA code. Please check your Google Authenticator or use Emergency Backup Code 888999.'
      });
    }

    // Clear one-time email 2FA code on success
    admin.twoFactorCode = null;
    admin.twoFactorExpires = null;
    await admin.save();

    const token = generateToken(admin._id);

    return res.json({
      success: true,
      message: '2FA verification successful. Access granted.',
      data: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        token
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// 4. Admin Resend 2FA Email Code
// ==========================================
export const resendAdmin2FA = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const admin = await User.findOne({ email: cleanEmail, role: 'admin' });

    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin account not found' });
    }

    const code = generate6DigitCode();
    admin.twoFactorCode = code;
    admin.twoFactorExpires = new Date(Date.now() + 5 * 60 * 1000);
    await admin.save();

    await sendAdmin2FAEmail(admin.email, code, admin.name);

    return res.json({
      success: true,
      message: 'A fresh 2FA security code has been sent to your email.'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// 5. Create New Admin Account with 2FA Key
// ==========================================
export const createAdmin = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = await User.findOne({ email: cleanEmail });
    if (existing) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists' });
    }

    const secret = generateSecret();
    const newAdmin = await User.create({
      name: name.trim(),
      email: cleanEmail,
      password,
      role: 'admin',
      isVerified: true,
      twoFactorSecret: secret
    });

    const uri = generateURI({
      issuer: 'Phum Yeung Restaurant',
      label: newAdmin.email,
      secret
    });

    const qrCode = await QRCode.toDataURL(uri);

    return res.status(201).json({
      success: true,
      message: 'New administrator created successfully with 2FA key initialized.',
      data: {
        id: newAdmin._id,
        name: newAdmin.name,
        email: newAdmin.email,
        role: newAdmin.role,
        twoFactorSecret: secret,
        qrCode
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ========================
// 2. Customer Register with OTP
// ========================
export const registerCustomer = async (req, res) => {
  try {
    const { name, email, password, phone, address } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email and password are required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    let existingUser = await User.findOne({ email: cleanEmail });

    const code = generate6DigitCode();
    const codeExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    if (existingUser) {
      if (existingUser.isVerified) {
        return res.status(400).json({ success: false, message: 'An account with this email already exists' });
      }

      // If user exists but not verified yet, update verification code and name/password
      existingUser.name = name;
      existingUser.password = password;
      existingUser.phone = phone || existingUser.phone;
      existingUser.address = address || existingUser.address;
      existingUser.verificationCode = code;
      existingUser.verificationCodeExpires = codeExpires;
      await existingUser.save();
    } else {
      await User.create({
        name,
        email: cleanEmail,
        password,
        phone: phone || '',
        address: address || '',
        role: 'customer',
        isVerified: false,
        verificationCode: code,
        verificationCodeExpires: codeExpires
      });
    }

    // Send verification email via nodemailer
    const mailResult = await sendVerificationEmail(cleanEmail, code, name);

    res.status(201).json({
      success: true,
      message: 'Verification code sent to your email',
      email: cleanEmail,
      // Provide OTP in response for instant developer testing
      devCode: code
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ========================
// 3. Verify OTP Code
// ========================
export const verifyCode = async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ success: false, message: 'Email and verification code are required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanCode = code.trim();

    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      return res.status(404).json({ success: false, message: 'Account not found' });
    }

    if (user.isVerified) {
      const token = generateToken(user._id);
      return res.json({
        success: true,
        message: 'Account is already verified',
        data: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          address: user.address,
          role: user.role,
          token
        }
      });
    }

    // Verify code matching and expiration
    if (user.verificationCode !== cleanCode) {
      return res.status(400).json({ success: false, message: 'Invalid verification code' });
    }

    if (user.verificationCodeExpires && new Date() > user.verificationCodeExpires) {
      return res.status(400).json({ success: false, message: 'Verification code has expired. Please request a new code.' });
    }

    // Mark as verified
    user.isVerified = true;
    user.verificationCode = null;
    user.verificationCodeExpires = null;
    await user.save();

    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Email verified successfully!',
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        role: user.role,
        token
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ========================
// 4. Resend OTP Code
// ========================
export const resendCode = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: cleanEmail });

    if (!user) {
      return res.status(404).json({ success: false, message: 'Account not found' });
    }

    const code = generate6DigitCode();
    user.verificationCode = code;
    user.verificationCodeExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    await sendVerificationEmail(cleanEmail, code, user.name);

    res.json({
      success: true,
      message: 'New verification code has been sent',
      devCode: code
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ========================
// 5. Customer Login
// ========================
export const customerLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: cleanEmail });

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    if (!user.isVerified) {
      // Auto-send a new code if unverified
      const code = generate6DigitCode();
      user.verificationCode = code;
      user.verificationCodeExpires = new Date(Date.now() + 10 * 60 * 1000);
      await user.save();
      await sendVerificationEmail(cleanEmail, code, user.name);

      return res.status(403).json({
        success: false,
        requireVerification: true,
        email: cleanEmail,
        message: 'Your email address is not verified yet. A verification code has been sent.',
        devCode: code
      });
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        role: user.role,
        token
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ========================
// 6. Profile (Get & Update)
// ========================
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password -verificationCode');
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { name, phone, address } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (name) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (address !== undefined) user.address = address;

    await user.save();

    res.json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        role: user.role
      }
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
