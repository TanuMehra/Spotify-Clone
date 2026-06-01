const Playlist = require('../models/Playlist');
const Song = require('../models/Song');
const ApiError = require('../utils/ApiError');
const { uploadToCloudinary } = require('../config/cloudinary');

/**
 * @desc    Create a new playlist
 * @route   POST /api/playlists
 * @access  Private
 */
const createPlaylist = async (req, res, next) => {
  const { name, description, isPublic } = req.body;

  try {
    if (!name) {
      return next(new ApiError(400, 'Playlist name is required'));
    }

    let coverImageUrl;

    // Optional file cover upload
    if (req.file) {
      const coverUpload = await uploadToCloudinary(req.file.buffer, 'spotify_clone/playlist_covers', 'image');
      coverImageUrl = coverUpload.secure_url;
    }

    const playlist = await Playlist.create({
      name,
      description: description || '',
      owner: req.user._id,
      coverImage: coverImageUrl, // model default applies if undefined
      isPublic: isPublic !== undefined ? isPublic === 'true' || isPublic === true : true,
      songs: [],
    });

    res.status(201).json({
      success: true,
      message: 'Playlist created successfully',
      data: playlist,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all playlists owned by user
 * @route   GET /api/playlists
 * @access  Private
 */
const getUserPlaylists = async (req, res, next) => {
  try {
    const playlists = await Playlist.find({ owner: req.user._id })
      .populate({
        path: 'songs',
        populate: { path: 'artist', select: 'name profileImage' },
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: playlists.length,
      data: playlists,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Add a song to a playlist
 * @route   POST /api/playlists/:id/song
 * @access  Private
 */
const addSongToPlaylist = async (req, res, next) => {
  const playlistId = req.params.id;
  const { songId } = req.body;

  try {
    if (!songId) {
      return next(new ApiError(400, 'Song ID is required'));
    }

    // 1. Verify song exists
    const song = await Song.findById(songId);
    if (!song) {
      return next(new ApiError(404, 'Song not found'));
    }

    // 2. Verify playlist exists
    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
      return next(new ApiError(404, 'Playlist not found'));
    }

    // 3. Verify owner
    if (playlist.owner.toString() !== req.user._id.toString()) {
      return next(new ApiError(403, 'Unauthorized: You do not own this playlist'));
    }

    // 4. Prevent duplicate tracks
    if (playlist.songs.includes(songId)) {
      return next(new ApiError(400, 'Song is already in this playlist'));
    }

    // 5. Append and save
    playlist.songs.push(songId);
    await playlist.save();

    const updatedPlaylist = await Playlist.findById(playlistId).populate({
      path: 'songs',
      populate: { path: 'artist', select: 'name profileImage' },
    });

    res.status(200).json({
      success: true,
      message: 'Song added to playlist successfully',
      data: updatedPlaylist,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Remove a song from a playlist
 * @route   DELETE /api/playlists/:id/song/:songId
 * @access  Private
 */
const removeSongFromPlaylist = async (req, res, next) => {
  const { id: playlistId, songId } = req.params;

  try {
    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
      return next(new ApiError(404, 'Playlist not found'));
    }

    // Check ownership
    if (playlist.owner.toString() !== req.user._id.toString()) {
      return next(new ApiError(403, 'Unauthorized: You do not own this playlist'));
    }

    // Check if song exists in playlist
    if (!playlist.songs.includes(songId)) {
      return next(new ApiError(400, 'Song does not exist in this playlist'));
    }

    // Pull song from list
    playlist.songs = playlist.songs.filter((id) => id.toString() !== songId);
    await playlist.save();

    const updatedPlaylist = await Playlist.findById(playlistId).populate({
      path: 'songs',
      populate: { path: 'artist', select: 'name profileImage' },
    });

    res.status(200).json({
      success: true,
      message: 'Song removed from playlist successfully',
      data: updatedPlaylist,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update a playlist name/description
 * @route   PUT /api/playlists/:id
 * @access  Private
 */
const updatePlaylist = async (req, res, next) => {
  const playlistId = req.params.id;
  const { name, description } = req.body;

  try {
    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
      return next(new ApiError(404, 'Playlist not found'));
    }

    if (playlist.owner.toString() !== req.user._id.toString()) {
      return next(new ApiError(403, 'Unauthorized: You do not own this playlist'));
    }

    if (name) playlist.name = name.trim();
    if (description !== undefined) playlist.description = description.trim();
    await playlist.save();

    res.status(200).json({
      success: true,
      message: 'Playlist updated successfully',
      data: playlist,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a playlist
 * @route   DELETE /api/playlists/:id
 * @access  Private
 */
const deletePlaylist = async (req, res, next) => {
  const playlistId = req.params.id;

  try {
    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
      return next(new ApiError(404, 'Playlist not found'));
    }

    // Check ownership
    if (playlist.owner.toString() !== req.user._id.toString()) {
      return next(new ApiError(403, 'Unauthorized: You do not own this playlist'));
    }

    await Playlist.findByIdAndDelete(playlistId);

    res.status(200).json({
      success: true,
      message: 'Playlist deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createPlaylist,
  getUserPlaylists,
  updatePlaylist,
  addSongToPlaylist,
  removeSongFromPlaylist,
  deletePlaylist,
};
