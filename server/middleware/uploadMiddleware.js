// middleware/uploadMiddleware.js
// Multer middleware for handling a single optional image upload.
// Files are kept in memory (not written to disk) and validated for
// type and size before being sent to Cloudinary.

const multer = require('multer');

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPG, JPEG, PNG, and WEBP are allowed.'), false);
  }
};

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter,
});

// Single image field named "image". Optional.
const uploadSingleImage = upload.single('image');

module.exports = { uploadSingleImage, ALLOWED_MIME_TYPES, MAX_FILE_SIZE };
