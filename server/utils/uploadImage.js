// utils/uploadImage.js
// Uploads an image buffer to Cloudinary and returns { url, publicId }.
// Uses upload_stream since we keep files in memory.

const cloudinary = require('../config/cloudinary');
const streamifier = require('streamifier');

const uploadImage = (buffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'campus-lost-found' },
      (error, result) => {
        if (error) return reject(error);
        resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );
    streamifier.createReadStream(buffer).pipe(stream);
  });
};

const deleteImage = async (publicId) => {
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    // Log but do not throw; avoid leaving DB inconsistent.
    console.error('Cloudinary delete failed:', error.message);
  }
};

module.exports = { uploadImage, deleteImage };
