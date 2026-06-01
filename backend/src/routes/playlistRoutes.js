const express = require('express');
const { body, validationResult } = require('express-validator');
const {
  createPlaylist,
  getUserPlaylists,
  updatePlaylist,
  addSongToPlaylist,
  removeSongFromPlaylist,
  deletePlaylist,
} = require('../controllers/playlistController');
const { protect } = require('../middleware/authMiddleware');
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
    return next(new ApiError(400, 'Playlist inputs validation failed', formattedErrors));
  }
  next();
};

// All playlist operations require active authentication
router.use(protect);

router.post(
  '/',
  uploadSingleImage,
  [body('name').trim().notEmpty().withMessage('Playlist name is required')],
  validateFields,
  createPlaylist
);

router.get('/', getUserPlaylists);
router.put('/:id', updatePlaylist);
router.post('/:id/song', addSongToPlaylist);
router.delete('/:id/song/:songId', removeSongFromPlaylist);
router.delete('/:id', deletePlaylist);

module.exports = router;

