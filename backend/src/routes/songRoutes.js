const express = require('express');
const { body, validationResult } = require('express-validator');
const {
  addSong,
  getAllSongs,
  getSongById,
  deleteSong,
  searchSongs,
  playSong,
} = require('../controllers/songController');
const { protect } = require('../middleware/authMiddleware');
const { isArtistOrAdmin } = require('../middleware/adminMiddleware');
const { uploadSongFiles } = require('../middleware/uploadMiddleware');
const ApiError = require('../utils/ApiError');

const router = express.Router();

const validateFields = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((err) => ({
      field: err.path,
      message: err.msg,
    }));
    return next(new ApiError(400, 'Song upload inputs validation failed', formattedErrors));
  }
  next();
};

// All song actions require login
router.use(protect);

// 1. Search endpoint (Placed BEFORE parametric '/:id' to avoid route matching conflicts!)
router.get('/search', searchSongs);

// 2. Play Count Increment Route
router.post('/:id/play', playSong);

// 3. Songs Catalog Endpoints
router.get('/', getAllSongs);
router.get('/:id', getSongById);

// 4. Create and Delete Song (Restricted to Artists or Administrators)
router.post(
  '/',
  isArtistOrAdmin,
  uploadSongFiles,
  [
    body('title').trim().notEmpty().withMessage('Song title is required'),
    body('artistId').trim().notEmpty().withMessage('Artist ID is required').isMongoId().withMessage('Invalid Artist ID format'),
    body('duration').trim().notEmpty().withMessage('Song duration is required'),
  ],
  validateFields,
  addSong
);

router.delete('/:id', isArtistOrAdmin, deleteSong);

module.exports = router;
