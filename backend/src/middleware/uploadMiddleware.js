const multer = require('multer');
const { PROFILE_PICTURE_MAX_BYTES, PROFILE_PICTURE_ALLOWED_MIME } = require('../utils/constants');

// Memory storage: we stream the buffer straight to Cloudinary in the
// service layer rather than touching disk (keeps this safe on ephemeral /
// read-only free-tier hosting filesystems).
const storage = multer.memoryStorage();

function imageFileFilter(req, file, cb) {
  if (!PROFILE_PICTURE_ALLOWED_MIME.includes(file.mimetype)) {
    return cb(new Error('Only JPEG and PNG images are allowed'));
  }
  cb(null, true);
}

const uploadImage = multer({
  storage,
  limits: { fileSize: PROFILE_PICTURE_MAX_BYTES },
  fileFilter: imageFileFilter,
});

module.exports = { uploadImage };
