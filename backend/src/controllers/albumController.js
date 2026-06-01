const Album = require('../models/Album');
const Song = require('../models/Song');
const Artist = require('../models/Artist');
const ApiError = require('../utils/ApiError');
const { uploadToCloudinary, deleteFromCloudinary } = require('../config/cloudinary');

/**
 * @desc    Create a new album (Admin/Artist only)
 * @route   POST /api/albums
 * @access  Private (Admin/Artist)
 */
const createAlbum = async (req, res, next) => {
  const { title, artistId, releaseDate } = req.body;

  try {
    if (!title || !artistId) {
      return next(new ApiError(400, 'Please provide album title and artist ID'));
    }

    if (!req.file) {
      return next(new ApiError(400, 'Please upload an album cover image'));
    }

    // Verify artist exists
    const artist = await Artist.findById(artistId);
    if (!artist) {
      return next(new ApiError(404, 'Artist not found with provided ID'));
    }

    // Upload cover image to Cloudinary
    const coverUpload = await uploadToCloudinary(req.file.buffer, 'spotify_clone/albums', 'image');

    const album = await Album.create({
      title,
      coverImage: coverUpload.secure_url,
      coverImagePublicId: coverUpload.public_id,
      artist: artistId,
      songs: [],
      releaseDate: releaseDate || new Date(),
    });

    res.status(201).json({
      success: true,
      message: 'Album created successfully',
      data: album,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all albums
 * @route   GET /api/albums
 * @access  Private
 */
const getAllAlbums = async (req, res, next) => {
  try {
    const albums = await Album.find()
      .populate('artist', 'name profileImage')
      .populate('songs')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: albums.length,
      data: albums,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single album details
 * @route   GET /api/albums/:id
 * @access  Private
 */
const getAlbumById = async (req, res, next) => {
  try {
    const album = await Album.findById(req.params.id)
      .populate('artist', 'name profileImage bio')
      .populate({
        path: 'songs',
        populate: { path: 'artist', select: 'name profileImage' },
      });

    if (!album) {
      return next(new ApiError(404, 'Album not found'));
    }

    res.status(200).json({
      success: true,
      data: album,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete an album
 * @route   DELETE /api/albums/:id
 * @access  Private (Admin/Artist-Owner)
 */
const deleteAlbum = async (req, res, next) => {
  const albumId = req.params.id;

  try {
    const album = await Album.findById(albumId);
    if (!album) {
      return next(new ApiError(404, 'Album not found'));
    }

    // 1. Wipe cover image from Cloudinary
    await deleteFromCloudinary(album.coverImagePublicId, 'image');

    // 2. Cascade update: Set album ref to null in child songs
    await Song.updateMany(
      { album: albumId },
      { $set: { album: null } }
    );

    // 3. Delete Album document from MongoDB
    await Album.findByIdAndDelete(albumId);

    res.status(200).json({
      success: true,
      message: 'Album and cover art deleted successfully, child tracks updated',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createAlbum,
  getAllAlbums,
  getAlbumById,
  deleteAlbum,
};
