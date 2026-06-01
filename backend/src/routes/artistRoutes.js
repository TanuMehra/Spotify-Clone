const express = require('express');
const { body, validationResult } = require('express-validator');
const {
  createArtist,
  getAllArtists,
  getArtistById,
  deleteArtist,
} = require('../controllers/artistController');
const { protect } = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/adminMiddleware');
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
    return next(new ApiError(400, 'Artist inputs validation failed', formattedErrors));
  }
  next();
};

// All artist endpoints require login session
router.use(protect);

router.get('/', getAllArtists);
router.get('/:id', getArtistById);

// Create and Delete profiles (Restricted solely to system Admins)
router.post(
  '/',
  isAdmin,
  uploadSingleImage,
  [body('name').trim().notEmpty().withMessage('Artist name is required')],
  validateFields,
  createArtist
);

router.delete('/:id', isAdmin, deleteArtist);

module.exports = router;
