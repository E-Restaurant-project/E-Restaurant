import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const file = path.resolve(__dirname, '../controllers/authController.js');

let content = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');

const oldBlock = `    if (user) {
      if (!user.googleId && googleId) user.googleId = googleId;
      if (!user.avatar && picture) user.avatar = picture;
      user.isVerified = true;
      await user.save();
    } else {
      const randomPassword = crypto.randomBytes(32).toString('hex');
      user = await User.create({
        name,
        email: cleanEmail,
        password: randomPassword,
        role: 'customer',
        isVerified: true,
        googleId,
        avatar: picture
      });
      console.log(\`[Google Auth] Created new customer account for \${cleanEmail}\`);
    }`;

const newBlock = `    const reqPhone = req.body.phone ? String(req.body.phone).trim() : '';
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
      console.log(\`[Google Auth] Created new customer account for \${cleanEmail}\`);
    }`;

if (content.includes(oldBlock)) {
  content = content.replace(oldBlock, newBlock);
  fs.writeFileSync(file, content, 'utf8');
  console.log('SUCCESS: authController googleAuth updated');
} else {
  console.error('Target oldBlock not found in authController.js');
}


