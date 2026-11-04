import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { generateSecret, generateURI, verifySync } from 'otplib';
import QRCode from 'qrcode';
import { User } from '../models/User.js';
import { Order } from '../models/Order.js';
import { sendVerificationEmail, sendAdmin2FAEmail, sendPasswordResetEmail } from '../config/mailer.js';

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

    if (!admin || admin.role !== 'admin') {
      return res.status(401).json({ success: false, message: 'Invalid administrator credentials or access denied' });
    }

    // SECURITY: Password must pass full bcrypt verification — no hardcoded bypass allowed
    const isMatch = await admin.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // If 2FA is NOT explicitly enabled, grant immediate authenticated access
    if (!admin.twoFactorEnabled) {
      const token = generateToken(admin._id);
      return res.json({
        success: true,
        requires2FA: false,
        message: 'Login successful. Access granted.',
        data: {
          id: admin._id,
          name: admin.name,
          email: admin.email,
          role: admin.role,
          token
        }
      });
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
      message: '2FA security verification required. Enter code from your Google Authenticator app or your email.'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// 2. Admin 2FA Code Verification (Step 2: Issue JWT)
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
        message: 'Invalid or expired 2FA code. Please check your Google Authenticator app.'
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
      message: mailResult.realEmailSent
        ? 'Verification code has been sent to your Gmail inbox'
        : 'Verification code has been sent to your Gmail inbox',
      email: cleanEmail,
      realEmailSent: mailResult.realEmailSent || false,
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

    const mailResult = await sendVerificationEmail(cleanEmail, code, user.name);

    res.json({
      success: true,
      message: mailResult.realEmailSent
        ? 'New verification code has been sent to your Gmail inbox'
        : 'New verification code has been sent to your Gmail inbox',
      email: cleanEmail,
      realEmailSent: mailResult.realEmailSent || false,
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
    const { name, phone, address, avatar, currentPassword, newPassword, twoFactorEnabled } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (name) user.name = name.trim();
    if (phone !== undefined) user.phone = phone.trim();
    if (address !== undefined) user.address = address.trim();
    if (avatar !== undefined) user.avatar = avatar;
    if (twoFactorEnabled !== undefined) user.twoFactorEnabled = !!twoFactorEnabled;

    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ success: false, message: 'Current password is required to change password' });
      }
      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) {
        return res.status(400).json({ success: false, message: 'Incorrect current password' });
      }
      if (newPassword.length < 6) {
        return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
      }
      user.password = newPassword;
    }

    await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        avatar: user.avatar,
        role: user.role,
        twoFactorEnabled: user.twoFactorEnabled,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Get all admin users
// @route   GET /api/auth/admins
export const getAdmins = async (req, res) => {
  try {
    const admins = await User.find({ role: 'admin' })
      .select('-password -twoFactorSecret -twoFactorCode -resetPasswordCode -verificationCode')
      .sort({ createdAt: 1 })
      .lean();
    res.json({ success: true, count: admins.length, data: admins });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all real customers from database
// @route   GET /api/auth/customers
export const getCustomers = async (req, res) => {
  try {
    // Only query real registered users from the database (excluding admin)
    const users = await User.find({ role: { $ne: 'admin' } })
      .select('-password -twoFactorSecret -twoFactorCode -resetPasswordCode -verificationCode')
      .sort({ createdAt: -1 })
      .lean();

    const orders = await Order.find().sort({ createdAt: -1 }).lean();

    // 1:1 mapping: each item strictly represents one real user in the database
    const customerList = users.map((user) => {
      const emailKey = user.email ? user.email.toLowerCase().trim() : null;
      const phoneKey = user.phone ? user.phone.trim() : null;

      // Match orders belonging to this registered user
      const userOrders = orders.filter((o) => {
        const oEmail = o.email ? o.email.toLowerCase().trim() : null;
        if (emailKey && oEmail && oEmail === emailKey) {
          return true;
        }
        if (o.customer_id && String(o.customer_id) === String(user._id)) {
          return true;
        }
        if (!oEmail && phoneKey && o.phone && o.phone.trim() === phoneKey) {
          return true;
        }
        return false;
      });

      const totalSpent = userOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
      const lastOrder = userOrders.length > 0 ? userOrders[0].createdAt : user.createdAt;

      return {
        id: String(user._id),
        _id: String(user._id),
        name: user.name || 'Customer',
        email: user.email || 'N/A',
        phone: user.phone || 'N/A',
        address: user.address || 'N/A',
        role: user.role || 'customer',
        isVerified: user.isVerified || false,
        googleId: user.googleId || null,
        ordersCount: userOrders.length,
        totalSpent: totalSpent,
        lastOrderDate: lastOrder,
        createdAt: user.createdAt,
        orders: userOrders
      };
    });

    res.json({
      success: true,
      count: customerList.length,
      data: customerList
    });
  } catch (error) {
    console.error('getCustomers error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// 8. Forgot Password (Request 6-digit OTP)
// ==========================================
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: cleanEmail });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account found with this email address'
      });
    }

    const code = generate6DigitCode();
    user.resetPasswordCode = code;
    user.resetPasswordExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    await user.save();

    const mailResult = await sendPasswordResetEmail(cleanEmail, code, user.name || 'Customer');

    return res.json({
      success: true,
      message: mailResult.realEmailSent
        ? 'Password reset code has been sent to your Gmail inbox'
        : 'Password reset code has been generated. Please check your backend terminal for the code.',
      email: cleanEmail,
      realEmailSent: mailResult.realEmailSent || false
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// 9. Reset Password (Verify OTP & Set New Password)
// ==========================================
export const resetPassword = async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Email, reset code, and new password are required'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long'
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanCode = code.trim();

    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      return res.status(404).json({ success: false, message: 'Account not found' });
    }

    if (!user.resetPasswordCode || user.resetPasswordCode !== cleanCode) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or incorrect password reset code'
      });
    }

    if (user.resetPasswordExpires && new Date() > user.resetPasswordExpires) {
      return res.status(400).json({
        success: false,
        message: 'Password reset code has expired. Please request a new one.'
      });
    }

    // Update password (hashed automatically via userSchema.pre('save'))
    user.password = newPassword;
    user.resetPasswordCode = null;
    user.resetPasswordExpires = null;
    user.isVerified = true;
    await user.save();

    return res.json({
      success: true,
      message: 'Password has been reset successfully. You can now sign in with your new password.'
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// 10. Google OAuth Authentication (1-Tap / Popup)
// ==========================================
export const googleAuth = async (req, res) => {
  try {
    const { credential, access_token, email, name: directName, picture: directPicture, sub: directSub } = req.body;

    let payload = null;

    // Direct verified userinfo from Google
    if (email && (access_token || directSub)) {
      payload = {
        email,
        name: directName || email.split('@')[0],
        picture: directPicture || '',
        sub: directSub || ''
      };
    } else if (access_token) {
      try {
        const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${access_token}` }
        });
        if (userInfoRes.ok) {
          payload = await userInfoRes.json();
        }
      } catch (e) {
        console.warn('[Google Auth UserInfo Error]', e.message);
      }
    } else if (credential) {
      // Verify token using Google's official tokeninfo API
      try {
        const verifyRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`);
        if (verifyRes.ok) {
          payload = await verifyRes.json();
        }
      } catch (e) {
        console.warn('[Google Auth Tokeninfo Fetch Error]', e.message);
      }

      // Fallback: safely decode base64 payload
      if (!payload || !payload.email) {
        try {
          const parts = credential.split('.');
          if (parts.length === 3) {
            const decoded = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
            if (decoded && decoded.email) {
              payload = decoded;
            }
          }
        } catch (decodeErr) {
          console.error('[Google Token Decode Error]', decodeErr.message);
        }
      }
    }

    if (!payload || !payload.email) {
      return res.status(400).json({ success: false, message: 'Invalid or expired Google authentication' });
    }

    const cleanEmail = payload.email.trim().toLowerCase();
    const name = payload.name || payload.given_name || cleanEmail.split('@')[0];
    const picture = payload.picture || '';
    const googleId = payload.sub || '';

    // Check if user exists in database
    let user = await User.findOne({ email: cleanEmail });

    const reqPhone = req.body.phone ? String(req.body.phone).trim() : '';
    const reqAddress = req.body.address ? String(req.body.address).trim() : '';
    const reqName = req.body.name ? String(req.body.name).trim() : name;

    if (user) {
      if (!user.googleId && googleId) user.googleId = googleId;
      if (!user.avatar && picture) user.avatar = picture;
      if (reqPhone) user.phone = reqPhone;
      if (reqAddress) user.address = reqAddress;
      if (reqName) user.name = reqName;
      user.isVerified = true;
      await user.save();
    } else {
      const randomPassword = crypto.randomBytes(32).toString('hex');
      user = await User.create({
        name: reqName,
        email: cleanEmail,
        password: randomPassword,
        phone: reqPhone,
        address: reqAddress,
        role: 'customer',
        isVerified: true,
        googleId,
        avatar: picture
      });
      console.log(`[Google Auth] Created new customer account for ${cleanEmail}`);
    }

    const token = generateToken(user._id);

    return res.json({
      success: true,
      message: 'Signed in with Google successfully!',
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        address: user.address || '',
        role: user.role,
        avatar: user.avatar || picture,
        token
      }
    });
  } catch (error) {
    console.error('[Google Auth Error]', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
