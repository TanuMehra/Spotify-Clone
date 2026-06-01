const Artist = require('../models/Artist');
const Song = require('../models/Song');
const Album = require('../models/Album');
const User = require('../models/User');
const Playlist = require('../models/Playlist');
const ApiError = require('../utils/ApiError');
const { uploadToCloudinary, deleteFromCloudinary } = require('../config/cloudinary');

/**
 * @desc    Create a new Artist profile (Admin only)
 * @route   POST /api/artists
 * @access  Private (Admin)
 */
const createArtist = async (req, res, next) => {
  const { name, bio, socialLinks } = req.body;

  try {
    if (!name) {
      return next(new ApiError(400, 'Artist name is required'));
    }

    if (!req.file) {
      return next(new ApiError(400, 'Please upload an artist profile image'));
    }

    // Check if artist name already exists
    const artistExists = await Artist.findOne({ name });
    if (artistExists) {
      return next(new ApiError(400, 'Artist profile already exists with this name'));
    }

    // Upload profile image to Cloudinary
    const imageUpload = await uploadToCloudinary(req.file.buffer, 'spotify_clone/artists', 'image');

    // Parse social links if passed as stringified JSON
    let parsedSocials = { spotify: '', instagram: '', twitter: '' };
    if (socialLinks) {
      try {
        parsedSocials = typeof socialLinks === 'string' ? JSON.parse(socialLinks) : socialLinks;
      } catch (e) {
        console.error('Error parsing social links, using default empty structure:', e);
      }
    }

    const artist = await Artist.create({
      name,
      bio: bio || '',
      profileImage: imageUpload.secure_url,
      profileImagePublicId: imageUpload.public_id,
      socialLinks: parsedSocials,
      followers: [],
      monthlyListeners: 0,
    });

    res.status(201).json({
      success: true,
      message: 'Artist profile created successfully',
      data: artist,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all active artists
 * @route   GET /api/artists
 * @access  Private
 */
const getAllArtists = async (req, res, next) => {
  try {
    const artists = await Artist.find().sort({ monthlyListeners: -1 });

    res.status(200).json({
      success: true,
      count: artists.length,
      data: artists,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single Artist profile and their songs & albums
 * @route   GET /api/artists/:id
 * @access  Private
 */
const getArtistById = async (req, res, next) => {
  const artistId = req.params.id;

  try {
    const artist = await Artist.findById(artistId).populate('followers', 'username avatar');
    if (!artist) {
      return next(new ApiError(404, 'Artist not found'));
    }

    // Dynamically retrieve associated Albums & Songs
    const [albums, songs] = await Promise.all([
      Album.find({ artist: artistId }),
      Song.find({ artist: artistId }).populate('album', 'title coverImage'),
    ]);

    res.status(200).json({
      success: true,
      data: {
        artist,
        albums,
        songs,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete Artist profile with absolute database cascading wipes
 * @route   DELETE /api/artists/:id
 * @access  Private (Admin)
 */
const deleteArtist = async (req, res, next) => {
  const artistId = req.params.id;

  try {
    const artist = await Artist.findById(artistId);
    if (!artist) {
      return next(new ApiError(404, 'Artist not found'));
    }

    // 1. Fetch all songs belonging to this artist
    const songs = await Song.find({ artist: artistId });
    const songIds = songs.map((song) => song._id);

    // 2. Fetch all albums belonging to this artist
    const albums = await Album.find({ artist: artistId });

    // 3. WIPE ALL ALBUM COVERS FROM CLOUDINARY
    const albumWipes = albums.map((album) => deleteFromCloudinary(album.coverImagePublicId, 'image'));

    // 4. WIPE ALL SONG TRACKS & COVERS FROM CLOUDINARY
    const songWipes = [];
    songs.forEach((song) => {
      songWipes.push(deleteFromCloudinary(song.audioPublicId, 'video'));
      songWipes.push(deleteFromCloudinary(song.imagePublicId, 'image'));
    });

    // 5. Run Cloudinary wipes in parallel
    await Promise.all([
      deleteFromCloudinary(artist.profileImagePublicId, 'image'),
      ...albumWipes,
      ...songWipes,
    ]);

    // 6. Cascade delete: pull songs from all Playlists
    if (songIds.length > 0) {
      await Playlist.updateMany(
        { songs: { $in: songIds } },
        { $pull: { songs: { $in: songIds } } }
      );

      // Pull from all User likes and play history
      await User.updateMany(
        {},
        {
          $pull: {
            likedSongs: { $in: songIds },
            recentlyPlayed: { song: { $in: songIds } },
          },
        }
      );
    }

    // 7. Pull artist reference from User following lists
    await User.updateMany(
      { followingArtists: artistId },
      { $pull: { followingArtists: artistId } }
    );

    // 8. Delete all associated Albums and Songs from MongoDB
    await Promise.all([
      Song.deleteMany({ artist: artistId }),
      Album.deleteMany({ artist: artistId }),
      Artist.findByIdAndDelete(artistId),
    ]);

    res.status(200).json({
      success: true,
      message: 'Artist, all their albums, songs, media storage assets, and references deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createArtist,
  getAllArtists,
  getArtistById,
  deleteArtist,
};
