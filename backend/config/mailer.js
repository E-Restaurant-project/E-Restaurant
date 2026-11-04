import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

/**
 * Creates and returns an authenticated Nodemailer transporter for Gmail
 */
const getTransporter = () => {
  const emailUser = process.env.EMAIL_USER?.trim();
  const emailPass = process.env.EMAIL_PASS?.trim()?.replace(/\s+/g, ''); // strip spaces from App Password

  if (!emailUser || !emailPass) {
    return null;
  }

  return nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: emailUser,
      pass: emailPass
    },
    tls: {
      rejectUnauthorized: false
    }
  });
};

/**
 * Sends a REAL 6-digit OTP verification code to customer's Gmail
 */
export const sendVerificationEmail = async (toEmail, code, name = 'Valued Customer') => {
  const emailUser = process.env.EMAIL_USER?.trim();
  const emailPass = process.env.EMAIL_PASS?.trim()?.replace(/\s+/g, '');

  console.log(`\n======================================================`);
  console.log(`📧 [Real Gmail OTP Dispatch System]`);
  console.log(`👤 Recipient: ${name} <${toEmail}>`);
  console.log(`🔑 Verification Code: [ ${code} ]`);
  console.log(`⏱️ Expiry: 10 minutes`);
  console.log(`======================================================\n`);

  if (!emailUser || !emailPass) {
    console.warn(`⚠️ [Email Service Warning] EMAIL_USER or EMAIL_PASS not configured in backend/.env.`);
    console.warn(`👉 To send real emails directly to ${toEmail}, please add your Gmail and App Password in backend/.env:`);
    console.warn(`   EMAIL_USER=your_email@gmail.com`);
    console.warn(`   EMAIL_PASS=your_16_char_app_password\n`);
    return {
      success: false,
      realEmailSent: false,
      code,
      error: 'Gmail SMTP credentials (EMAIL_USER / EMAIL_PASS) not set in backend/.env'
    };
  }

  try {
    const transporter = getTransporter();
    if (!transporter) {
      throw new Error('Could not initialize Gmail SMTP transporter');
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>កូដផ្ទៀងផ្ទាត់គណនី - ភោជនីយដ្ឋាន ភូមិយើង</title>
      </head>
      <body style="margin: 0; padding: 20px; background-color: #f6f3ee; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        <div style="max-width: 520px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #e8e2d8;">
          <!-- Top Header Banner -->
          <div style="background: linear-gradient(135deg, #800020 0%, #a31c38 100%); padding: 32px 24px; text-align: center; color: #ffffff;">
            <div style="font-size: 42px; line-height: 1; margin-bottom: 8px;">🍲</div>
            <h1 style="margin: 0; font-size: 22px; font-weight: 800; letter-spacing: 0.5px; color: #ffffff;">
              ភោជនីយដ្ឋាន ភូមិយើង
            </h1>
            <div style="font-size: 13px; color: #fdf8e6; font-weight: 600; margin-top: 4px; letter-spacing: 0.5px;">
              Phum Yeung Restaurant • Authentic Khmer Cuisine
            </div>
          </div>

          <!-- Body Content -->
          <div style="padding: 32px 28px;">
            <p style="font-size: 16px; color: #231f1e; margin: 0 0 16px; font-weight: 600;">
              សួស្តី <strong>${name}</strong>,
            </p>
            <p style="font-size: 14.5px; line-height: 1.6; color: #55514f; margin: 0 0 24px;">
              សូមអរគុណសម្រាប់ការចុះឈ្មោះគណនីជាមួយ <strong>ភោជនីយដ្ឋាន ភូមិយើង</strong>។ សូមប្រើប្រាស់លេខកូដសម្ងាត់ OTP ៦ ខ្ទង់ខាងក្រោមនេះ ដើម្បីផ្ទៀងផ្ទាត់គណនី Gmail របស់អ្នក៖
            </p>

            <!-- OTP Box -->
            <div style="background: #fdfbf7; border: 2px dashed #800020; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0;">
              <div style="font-size: 12px; color: #800020; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px;">
                លេខកូដផ្ទៀងផ្ទាត់ / Verification Code
              </div>
              <div style="font-size: 36px; font-weight: 900; color: #800020; letter-spacing: 8px; font-family: monospace;">
                ${code}
              </div>
              <div style="font-size: 12px; color: #8b8380; margin-top: 8px;">
                ⏱️ មានសុពលភាពរយៈពេល <strong>១០ នាទី</strong> ប៉ុណ្ណោះ
              </div>
            </div>

            <p style="font-size: 13px; line-height: 1.6; color: #736c69; margin: 24px 0 0; padding-top: 20px; border-top: 1px solid #f0eae1;">
              ⚠️ <strong>ចំណាំសុវត្ថិភាព៖</strong> សូមកុំចែករំលែកលេខកូដនេះទៅកាន់អ្នកដទៃឡើយ។ បុគ្គលិកភូមិយើងនឹងមិនសួររកលេខកូដសម្ងាត់របស់អ្នកជាដាច់ខាត។
            </p>
          </div>

          <!-- Footer -->
          <div style="background-color: #faf7f2; padding: 18px 24px; text-align: center; font-size: 12px; color: #9c948f; border-top: 1px solid #eee8de;">
            ភោជនីយដ្ឋាន ភូមិយើង (Phum Yeung Restaurant)<br/>
            រាជធានីភ្នំពេញ • ទូរស័ព្ទ៖ 012 345 678
          </div>
        </div>
      </body>
      </html>
    `;

    const textContent = `សួស្តី ${name},\n\nលេខកូដផ្ទៀងផ្ទាត់គណនីរបស់អ្នកគឺ៖ ${code}\n(កូដនេះមានសុពលភាពរយៈពេល ១០ នាទី)\n\nសូមអរគុណ,\nភោជនីយដ្ឋាន ភូមិយើង (Phum Yeung Restaurant)`;

    const info = await transporter.sendMail({
      from: `"ភោជនីយដ្ឋាន ភូមិយើង" <${emailUser}>`,
      to: toEmail,
      subject: `[${code}] កូដផ្ទៀងផ្ទាត់គណនី Gmail របស់អ្នក | Phum Yeung Restaurant`,
      text: textContent,
      html: htmlContent
    });

    console.log(`✅ [Real Email Sent] Message delivered to ${toEmail} | Message ID: ${info.messageId}`);
    return {
      success: true,
      realEmailSent: true,
      code,
      messageId: info.messageId
    };
  } catch (error) {
    console.error(`❌ [Real Email Dispatch Failed]: ${error.message}`);
    return {
      success: false,
      realEmailSent: false,
      code,
      error: error.message
    };
  }
};

/**
 * Sends Admin 2FA Security Email
 */
export const sendAdmin2FAEmail = async (toEmail, code, name = 'Administrator') => {
  const emailUser = process.env.EMAIL_USER?.trim();
  const emailPass = process.env.EMAIL_PASS?.trim()?.replace(/\s+/g, '');

  console.log(`\n======================================================`);
  console.log(`🔐 [ADMIN 2-FACTOR AUTHENTICATION (2FA)]`);
  console.log(`👤 Recipient: ${name} <${toEmail}>`);
  console.log(`🔑 6-Digit 2FA Security Code: [ ${code} ]`);
  console.log(`⏱️ Expires in: 5 minutes`);
  console.log(`======================================================\n`);

  if (!emailUser || !emailPass) {
    return { success: false, realEmailSent: false, code };
  }

  try {
    const transporter = getTransporter();
    if (!transporter) throw new Error('No transporter');

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; border: 2px solid #800020; border-radius: 12px; background: #ffffff;">
        <h2 style="color: #800020; margin-top: 0;">🛡️ Phum Yeung Admin 2FA Code</h2>
        <p>Hello <strong>${name}</strong>,</p>
        <p>Your Admin 2FA security code is:</p>
        <div style="text-align: center; margin: 24px 0;">
          <div style="display: inline-block; padding: 12px 28px; background: #800020; color: #fff; font-size: 32px; font-weight: 800; letter-spacing: 6px; border-radius: 8px;">
            ${code}
          </div>
          <div style="color: #888; font-size: 12px; margin-top: 8px;">Valid for 5 minutes.</div>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: `"Phum Yeung Security" <${emailUser}>`,
      to: toEmail,
      subject: `[${code}] Admin 2FA Security Code | Phum Yeung Restaurant`,
      html: htmlContent
    });

    return { success: true, realEmailSent: true, code };
  } catch (error) {
    console.error(`Admin 2FA Email Error: ${error.message}`);
    return { success: false, realEmailSent: false, code, error: error.message };
  }
};

/**
 * Sends a Password Reset OTP code to customer or admin Gmail
 */
export const sendPasswordResetEmail = async (toEmail, code, name = 'Customer') => {
  const emailUser = process.env.EMAIL_USER?.trim();
  const emailPass = process.env.EMAIL_PASS?.trim()?.replace(/\s+/g, '');

  console.log('\n======================================================');
  console.log('🔑 [Password Reset OTP Dispatch]');
  console.log(`👤 Recipient: ${name} <${toEmail}>`);
  console.log(`🔢 Reset OTP Code: [ ${code} ]`);
  console.log('⏱️ Expiry: 10 minutes');
  console.log('======================================================\n');

  if (!emailUser || !emailPass) {
    console.warn('⚠️ [Password Reset Warning] EMAIL_USER or EMAIL_PASS not set in backend/.env.');
    return {
      success: false,
      realEmailSent: false,
      code,
      error: 'Gmail SMTP credentials not set in backend/.env'
    };
  }

  try {
    const transporter = getTransporter();
    if (!transporter) throw new Error('No transporter');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>កំណត់ពាក្យសម្ងាត់ឡើងវិញ - ភោជនីយដ្ឋាន ភូមិយើង</title>
      </head>
      <body style="margin: 0; padding: 20px; background-color: #f6f3ee; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        <div style="max-width: 520px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #e8e2d8;">
          <div style="background: linear-gradient(135deg, #800020 0%, #a31c38 100%); padding: 32px 24px; text-align: center; color: #ffffff;">
            <div style="font-size: 42px; line-height: 1; margin-bottom: 8px;">🔐</div>
            <h1 style="margin: 0; font-size: 22px; font-weight: 800; letter-spacing: 0.5px; color: #ffffff;">
              កំណត់ពាក្យសម្ងាត់ឡើងវិញ
            </h1>
            <div style="font-size: 13px; color: #fdf8e6; font-weight: 600; margin-top: 4px; letter-spacing: 0.5px;">
              Phum Yeung Restaurant • Password Reset Request
            </div>
          </div>

          <div style="padding: 32px 28px;">
            <p style="font-size: 16px; color: #231f1e; margin: 0 0 16px; font-weight: 600;">
              សួស្តី <strong>${name}</strong>,
            </p>
            <p style="font-size: 14.5px; line-height: 1.6; color: #55514f; margin: 0 0 24px;">
              យើងបានទទួលសំណើសុំកំណត់ពាក្យសម្ងាត់គណនីរបស់អ្នកឡើងវិញ។ សូមប្រើប្រាស់លេខកូដសម្ងាត់ OTP ៦ ខ្ទង់ខាងក្រោមនេះ ដើម្បីប្តូរពាក្យសម្ងាត់ថ្មី៖
            </p>

            <div style="background: #fdfbf7; border: 2px dashed #800020; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0;">
              <div style="font-size: 12px; color: #800020; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px;">
                លេខកូដប្តូរពាក្យសម្ងាត់ / Password Reset Code
              </div>
              <div style="font-size: 36px; font-weight: 900; color: #800020; letter-spacing: 8px; font-family: monospace;">
                ${code}
              </div>
              <div style="font-size: 12px; color: #8b8380; margin-top: 8px;">
                ⏱️ មានសុពលភាពរយៈពេល <strong>១០ នាទី</strong> ប៉ុណ្ណោះ
              </div>
            </div>

            <p style="font-size: 13px; line-height: 1.6; color: #736c69; margin: 24px 0 0; padding-top: 20px; border-top: 1px solid #f0eae1;">
              ⚠️ <strong>ចំណាំសុវត្ថិភាព៖</strong> ប្រសិនបើអ្នកមិនបានស្នើសុំប្តូរពាក្យសម្ងាត់នេះទេ សូមកុំចែករំលែកលេខកូដនេះទៅកាន់អ្នកណាឡើយ។ គណនីរបស់អ្នកនៅតែមានសុវត្ថិភាពដដែល។
            </p>
          </div>

          <div style="background-color: #faf7f2; padding: 18px 24px; text-align: center; font-size: 12px; color: #9c948f; border-top: 1px solid #eee8de;">
            ភោជនីយដ្ឋាន ភូមិយើង (Phum Yeung Restaurant)<br/>
            📍 រាជធានីភ្នំពេញ • Authentic Khmer Dining Experience
          </div>
        </div>
      </body>
      </html>
    `;

    await transporter.sendMail({
      from: `"ភោជនីយដ្ឋាន ភូមិយើង" <${emailUser}>`,
      to: toEmail,
      subject: `[${code}] កូដប្តូរពាក្យសម្ងាត់គណនី - ភោជនីយដ្ឋាន ភូមិយើង (Password Reset Code)`,
      html: htmlContent
    });

    console.log(`✅ [Real Gmail] Password reset email sent successfully to ${toEmail}`);
    return { success: true, realEmailSent: true, code };
  } catch (error) {
    console.error(`❌ [Password Reset Email Error]: ${error.message}`);
    return { success: false, realEmailSent: false, code, error: error.message };
  }
};
