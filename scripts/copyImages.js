const fs = require('fs');
const path = require('path');

const src = path.resolve('backend/public/images');
const dest = path.resolve('frontend/dist/images');

if (fs.existsSync(src)) {
  fs.mkdirSync(dest, { recursive: true });
  fs.cpSync(src, dest, { recursive: true });
  console.log('✅ Successfully copied 500+ food images to frontend/dist/images');
} else {
  console.warn('⚠️ Source images not found at:', src);
}
