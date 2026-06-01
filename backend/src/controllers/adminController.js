const User = require('../models/User');
const Song = require('../models/Song');
const Album = require('../models/Album');
const Artist = require('../models/Artist');
const Playlist = require('../models/Playlist');

/**
 * @desc    Get dashboard analytics (Admin only)
 * @route   GET /api/admin/dashboard
 * @access  Private (Admin)
 */
const getDashboardAnalytics = async (req, res, next) => {
  try {
    // 1. Gather database counts in parallel for optimal throughput
    const [
      totalUsers,
      totalSongs,
      totalAlbums,
      totalArtists,
      totalPlaylists,
      mostPlayedSongs,
    ] = await Promise.all([
      User.countDocuments(),
      Song.countDocuments(),
      Album.countDocuments(),
      Artist.countDocuments(),
      Playlist.countDocuments(),
      Song.find()
        .populate('artist', 'name profileImage')
        .populate('album', 'title')
        .sort({ totalPlays: -1 })
        .limit(6),
    ]);

    res.status(200).json({
      success: true,
      message: 'Dashboard analytics retrieved successfully',
      data: {
        counts: {
          users: totalUsers,
          songs: totalSongs,
          albums: totalAlbums,
          artists: totalArtists,
          playlists: totalPlaylists,
        },
        mostPlayed: mostPlayedSongs,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardAnalytics,
};
