const express = require('express');
const { body, validationResult } = require('express-validator');
const {
  createAlbum,
  getAllAlbums,
  getAlbumById,
  deleteAlbum,
} = require('../controllers/albumController');
const { protect } = require('../middleware/authMiddleware');
const { isArtistOrAdmin } = require('../middleware/adminMiddleware');
const { uploadSingleImage } = require('../middleware/uploadMiddleware');
const ApiError = require('../utils/ApiError');

const router = express.Router();

const validateFields = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((err) => ({
      field: err.path,
      message: err.msg,
    }));
    return next(new ApiError(400, 'Album inputs validation failed', formattedErrors));
  }
  next();
};

// All album actions require login
router.use(protect);

router.get('/', getAllAlbums);
router.get('/:id', getAlbumById);

// Create and Delete restricted to Artist or Admin
router.post(
  '/',
  isArtistOrAdmin,
  uploadSingleImage,
  [
    body('title').trim().notEmpty().withMessage('Album title is required'),
    body('artistId').trim().notEmpty().withMessage('Artist ID is required').isMongoId().withMessage('Invalid Artist ID format'),
  ],
  validateFields,
  createAlbum
);

router.delete('/:id', isArtistOrAdmin, deleteAlbum);

module.exports = router;
