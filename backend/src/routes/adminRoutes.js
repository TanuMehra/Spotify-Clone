const express = require('express');
const { getDashboardAnalytics } = require('../controllers/adminController');
const { addSong, editSong, deleteSong } = require('../controllers/songController');
const { protect } = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/adminMiddleware');
const { uploadSongFiles } = require('../middleware/uploadMiddleware');

const router = express.Router();

// Enforce JWT protect & Admin role authorization to all sub-routes
router.use(protect);
router.use(isAdmin);

router.get('/dashboard', getDashboardAnalytics);

// Admin Song Management Routes
router.post('/songs', uploadSongFiles, addSong);
router.put('/songs/:id', uploadSongFiles, editSong);
router.delete('/songs/:id', deleteSong);

module.exports = router;
