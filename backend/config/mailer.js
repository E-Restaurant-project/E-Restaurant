import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

export const sendVerificationEmail = async (toEmail, code, name = 'Valued Customer') => {
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;

  // Always log OTP to server terminal for instant local testing
  console.log(`\n======================================================`);
  console.log(`📧 [Email Verification OTP]`);
  console.log(`👤 Recipient: ${name} <${toEmail}>`);
  console.log(`🔑 6-Digit Verification Code: [ ${code} ]`);
  console.log(`⏱️ Expires in: 10 minutes`);
  console.log(`======================================================\n`);

  // If real Gmail credentials are provided in .env, send real email
  if (emailUser && emailPass) {
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: emailUser,
          pass: emailPass
        }
      });

      const htmlContent = `
        <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 540px; margin: 0 auto; padding: 24px; border: 1px solid #e0dbd3; border-radius: 12px; background-color: #fdfbf7;">
          <div style="text-align: center; margin-bottom: 20px;">
            <span style="font-size: 40px;">🍲</span>
            <h2 style="color: #800020; margin: 8px 0 2px;">ភោជនីយដ្ឋាន ភូមិយើង | Phum Yeung Restaurant</h2>
            <p style="color: #c59b27; font-weight: 600; margin: 0; font-size: 14px;">Authentic Khmer Cuisine & Fast Delivery</p>
          </div>

          <p style="color: #333; font-size: 16px;">សួស្តី <strong>${name}</strong>,</p>
          <p style="color: #555; font-size: 15px; line-height: 1.6;">
            សូមអរគុណសម្រាប់ការចុះឈ្មោះគណនីជាមួយ ភោជនីយដ្ឋាន ភូមិយើង! សូមប្រើប្រាស់កូដផ្ទៀងផ្ទាត់ OTP ៦ ខ្ទង់ខាងក្រោមនេះដើម្បីបញ្ជាក់គណនី Gmail របស់អ្នក៖
          </p>

          <div style="text-align: center; margin: 28px 0;">
            <div style="display: inline-block; padding: 14px 32px; background-color: #800020; color: #ffffff; font-size: 32px; font-weight: 800; letter-spacing: 6px; border-radius: 8px; box-shadow: 0 4px 12px rgba(128,0,32,0.25);">
              ${code}
            </div>
            <div style="color: #888; font-size: 13px; margin-top: 8px;">(កូដនេះមានសុពលភាពរយៈពេល ១០ នាទី)</div>
          </div>

          <p style="color: #777; font-size: 13px; border-top: 1px solid #eee; padding-top: 16px;">
            ប្រសិនបើលោកអ្នកមិនបានស្នើសុំចុះឈ្មោះគណនីនេះទេ សូមអើពើចំពោះសារអ៊ីមែលនេះ។<br/>
            រក្សាសិទ្ធិគ្រប់យ៉ាងដោយ ភោជនីយដ្ឋាន ភូមិយើង (Phum Yeung Restaurant).
          </p>
        </div>
      `;

      await transporter.sendMail({
        from: `"Phum Yeung Restaurant" <${emailUser}>`,
        to: toEmail,
        subject: `[${code}] កូដផ្ទៀងផ្ទាត់គណនី | Phum Yeung Verification Code`,
        html: htmlContent
      });

      console.log(`[Email Service] Real email dispatched to ${toEmail}`);
      return { success: true, code };
    } catch (error) {
      console.warn(`[Email Service Warning] Could not send live email: ${error.message}`);
      console.warn(`[Email Service Note] The code [${code}] was still generated and can be verified.`);
      return { success: true, code, simulated: true };
    }
  }

  return { success: true, code, simulated: true };
};

export const sendAdmin2FAEmail = async (toEmail, code, name = 'Administrator') => {
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;

  // Always log 2FA code to server terminal for security auditing and local testing
  console.log(`\n======================================================`);
  console.log(`🔐 [ADMIN 2-FACTOR AUTHENTICATION (2FA)]`);
  console.log(`👤 Recipient: ${name} <${toEmail}>`);
  console.log(`🔑 6-Digit 2FA Security Code: [ ${code} ]`);
  console.log(`⏱️ Expires in: 5 minutes`);
  console.log(`======================================================\n`);

  if (emailUser && emailPass) {
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: emailUser,
          pass: emailPass
        }
      });

      const htmlContent = `
        <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 540px; margin: 0 auto; padding: 24px; border: 2px solid #800020; border-radius: 12px; background-color: #ffffff;">
          <div style="text-align: center; margin-bottom: 20px;">
            <div style="font-size: 42px;">🛡️</div>
            <h2 style="color: #800020; margin: 8px 0 2px;">Phum Yeung Restaurant | Admin Portal</h2>
            <p style="color: #666; font-weight: 600; margin: 0; font-size: 14px;">Two-Factor Authentication Security Check</p>
          </div>

          <p style="color: #333; font-size: 15px;">Hello <strong>${name}</strong>,</p>
          <p style="color: #555; font-size: 14px; line-height: 1.6;">
            A sign-in attempt was detected for your Administrator account. Please enter the following 6-digit security code to complete your two-factor authentication:
          </p>

          <div style="text-align: center; margin: 28px 0;">
            <div style="display: inline-block; padding: 14px 32px; background-color: #800020; color: #ffffff; font-size: 34px; font-weight: 800; letter-spacing: 8px; border-radius: 8px; box-shadow: 0 4px 14px rgba(128,0,32,0.3);">
              ${code}
            </div>
            <div style="color: #888; font-size: 13px; margin-top: 10px;">⏱️ This security code will expire in <strong>5 minutes</strong>.</div>
          </div>

          <p style="color: #b91c1c; font-size: 13px; background-color: #fef2f2; padding: 10px 14px; border-radius: 6px; border-left: 4px solid #b91c1c;">
            ⚠️ If you did NOT attempt to sign in to the Admin Portal, someone may have your password. Please secure your account immediately.
          </p>
        </div>
      `;

      const recipients = [toEmail];
      if (emailUser && toEmail !== emailUser) {
        recipients.push(emailUser);
      }

      await transporter.sendMail({
        from: `"Phum Yeung Security" <${emailUser}>`,
        to: recipients.join(', '),
        subject: `[${code}] Admin 2FA Security Code | Phum Yeung Restaurant`,
        html: htmlContent
      });

      console.log(`[2FA Email Dispatched] Delivered to: ${recipients.join(', ')}`);
      return { success: true, code };
    } catch (error) {
      console.warn(`[2FA Email Warning] Could not send live email: ${error.message}`);
      return { success: true, code, simulated: true };
    }
  }

  return { success: true, code, simulated: true };
};

