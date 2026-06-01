const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

// Set storage
const storage = multer.memoryStorage();

// File filter
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

// Upload middleware
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024 // 2MB max
  }
});

// Resize and save logo
const processLogo = async (file) => {
  const filename = `logo-${Date.now()}.jpg`;
  const uploadPath = path.join(__dirname, '../../uploads/logos', filename);

  // Resize to 200x200 using sharp
  await sharp(file.buffer)
    .resize(200, 200, {
      fit: 'cover',
      position: 'center'
    })
    .jpeg({ quality: 90 })
    .toFile(uploadPath);

  return `/uploads/logos/${filename}`;
};

module.exports = { upload, processLogo };