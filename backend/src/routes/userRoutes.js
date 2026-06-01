const express = require('express');
const {
  getMe,
  likeSong,
  unlikeSong,
  getLikedSongs,
  addToRecentlyPlayed,
  getRecentlyPlayed,
  followArtist,
  unfollowArtist,
  getUserProfile,
  updateUserProfile,
  getFollowingArtists,
  uploadAvatar,
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const { upload } = require('../middleware/uploadMiddleware');

const router = express.Router();

// Enforce JWT protect middleware across all user sub-routes
router.use(protect);

router.get('/me', getMe);

// Song Likes
router.post('/like/:songId', likeSong);
router.delete('/unlike/:songId', unlikeSong);
router.get('/liked', getLikedSongs);
router.get('/liked-songs', getLikedSongs); // Profile alias

// History Tracking
router.post('/recent/:songId', addToRecentlyPlayed);
router.get('/recent', getRecentlyPlayed);
router.get('/recently-played', getRecentlyPlayed); // Profile alias

// Artist Following
router.post('/follow/:artistId', followArtist);
router.delete('/unfollow/:artistId', unfollowArtist);
router.get('/following-artists', getFollowingArtists);

// Profile Details & Edit
router.get('/profile', getUserProfile);
router.put('/profile', updateUserProfile);

// Avatar uploads
router.post('/upload-avatar', upload.single('avatar'), uploadAvatar);

module.exports = router;
