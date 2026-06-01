const multer = require('multer');
const path = require('path');
const ApiError = require('../utils/ApiError');

// Configure memory storage to facilitate direct Cloudinary stream pipes
const storage = multer.memoryStorage();

// Validate file type filters
const fileFilter = (req, file, cb) => {
  const allowedImageTypes = /jpeg|jpg|png|webp/;
  const allowedAudioTypes = /mp3|wav|ogg|mpeg|flac|m4a|aac/;

  const extname = path.extname(file.originalname).toLowerCase();
  const mimetype = file.mimetype.toLowerCase();

  if (file.fieldname === 'image' || file.fieldname === 'avatar' || file.fieldname === 'coverImage' || file.fieldname === 'profileImage') {
    const isImageExt = allowedImageTypes.test(extname);
    const isImageMime = mimetype.startsWith('image/') && allowedImageTypes.test(mimetype);
    
    if (isImageExt && isImageMime) {
      return cb(null, true);
    } else {
      return cb(new ApiError(400, 'Invalid file type: Only images (jpeg, jpg, png, webp) are permitted!'));
    }
  } else if (file.fieldname === 'audio') {
    const isAudioExt = allowedAudioTypes.test(extname);
    const isAudioMime = mimetype.startsWith('audio/') || mimetype === 'video/mp4' || allowedAudioTypes.test(mimetype);

    if (isAudioExt || isAudioMime) {
      return cb(null, true);
    } else {
      return cb(new ApiError(400, 'Invalid file type: Only audio files (mp3, wav, ogg, flac, m4a) are permitted!'));
    }
  } else {
    cb(new ApiError(400, 'Unexpected field uploaded'));
  }
};

// Initiate multer setup
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 15 * 1024 * 1024, // 15MB file cap
  },
});

// Multipart parsing rules
const uploadSongFiles = upload.fields([
  { name: 'audio', maxCount: 1 },
  { name: 'image', maxCount: 1 },
]);

const uploadSingleImage = upload.single('image');

module.exports = {
  upload,
  uploadSongFiles,
  uploadSingleImage,
};
