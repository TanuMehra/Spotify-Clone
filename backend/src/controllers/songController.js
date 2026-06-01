const Song = require('../models/Song');
const Album = require('../models/Album');
const Playlist = require('../models/Playlist');
const User = require('../models/User');
const Artist = require('../models/Artist');
const ApiError = require('../utils/ApiError');
const { uploadToCloudinary, deleteFromCloudinary } = require('../config/cloudinary');
const { emitPlayCountUpdate } = require('../config/socket');

/**
 * @desc    Add a new song (Artist/Admin only, handles parallel streams upload)
 * @route   POST /api/songs
 * @access  Private (Artist/Admin)
 */
const addSong = async (req, res, next) => {
  const { title, artistId, albumId, genre, duration } = req.body;

  try {
    // 1. Validation
    if (!title || !artistId || !duration) {
      return next(new ApiError(400, 'Please provide song title, artist ID, and duration'));
    }

    if (!req.files || !req.files.audio || !req.files.image) {
      return next(new ApiError(400, 'Please upload both an audio file and a cover thumbnail'));
    }

    // Check if artist exists
    const artist = await Artist.findById(artistId);
    if (!artist) {
      return next(new ApiError(404, 'Artist not found with provided ID'));
    }

    // Check if album exists if provided
    let album = null;
    if (albumId) {
      album = await Album.findById(albumId);
      if (!album) {
        return next(new ApiError(404, 'Album not found with provided ID'));
      }
    }

    const audioFile = req.files.audio[0];
    const imageFile = req.files.image[0];

    // 2. Parallel Cloudinary Uploads
    const [audioUpload, imageUpload] = await Promise.all([
      uploadToCloudinary(audioFile.buffer, 'spotify_clone/audio', 'video'),
      uploadToCloudinary(imageFile.buffer, 'spotify_clone/covers', 'image'),
    ]);

    // 3. Create Song document
    const song = await Song.create({
      title,
      artist: artistId,
      album: albumId || null,
      genre: genre || 'Unknown',
      duration,
      audioUrl: audioUpload.secure_url,
      imageUrl: imageUpload.secure_url,
      audioPublicId: audioUpload.public_id,
      imagePublicId: imageUpload.public_id,
    });

    // 4. If album was specified, add song reference to the album
    if (albumId) {
      await Album.findByIdAndUpdate(albumId, { $push: { songs: song._id } });
    }

    res.status(201).json({
      success: true,
      message: 'Song uploaded and recorded successfully',
      data: song,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all songs
 * @route   GET /api/songs
 * @access  Private
 */
const getAllSongs = async (req, res, next) => {
  try {
    const songs = await Song.find()
      .populate('artist', 'name profileImage')
      .populate('album', 'title coverImage')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: songs.length,
      data: songs,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single song details
 * @route   GET /api/songs/:id
 * @access  Private
 */
const getSongById = async (req, res, next) => {
  try {
    const song = await Song.findById(req.params.id)
      .populate('artist', 'name profileImage bio monthlyListeners')
      .populate('album', 'title coverImage releaseDate');

    if (!song) {
      return next(new ApiError(404, 'Song not found'));
    }

    res.status(200).json({
      success: true,
      data: song,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete song from database and Cloudinary, with clean cascading
 * @route   DELETE /api/songs/:id
 * @access  Private (Admin/Artist-Owner)
 */
const deleteSong = async (req, res, next) => {
  const songId = req.params.id;

  try {
    const song = await Song.findById(songId);
    if (!song) {
      return next(new ApiError(404, 'Song not found'));
    }

    // 1. Wipe files from Cloudinary in parallel
    await Promise.all([
      deleteFromCloudinary(song.audioPublicId, 'video'),
      deleteFromCloudinary(song.imagePublicId, 'image'),
    ]);

    // 2. Cascade delete: pull from all Albums
    if (song.album) {
      await Album.findByIdAndUpdate(song.album, { $pull: { songs: songId } });
    }

    // 3. Cascade delete: pull from all Playlists
    await Playlist.updateMany(
      { songs: songId },
      { $pull: { songs: songId } }
    );

    // 4. Cascade delete: pull from all Users (liked & recentlyPlayed)
    await User.updateMany(
      {},
      {
        $pull: {
          likedSongs: songId,
          recentlyPlayed: { song: songId },
        },
      }
    );

    // 5. Delete Song document from MongoDB
    await Song.findByIdAndDelete(songId);

    res.status(200).json({
      success: true,
      message: 'Song and all associated elements deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Search songs (Title, artist, genre, album)
 * @route   GET /api/songs/search
 * @access  Private
 */
const searchSongs = async (req, res, next) => {
  const { q } = req.query;

  try {
    if (!q) {
      return res.status(200).json({ success: true, data: [] });
    }

    // 1. Find matching Artists
    const matchingArtists = await Artist.find({
      name: { $regex: q, $options: 'i' },
    }).select('_id');
    const artistIds = matchingArtists.map((artist) => artist._id);

    // 2. Find matching Albums
    const matchingAlbums = await Album.find({
      title: { $regex: q, $options: 'i' },
    }).select('_id');
    const albumIds = matchingAlbums.map((album) => album._id);

    // 3. Find matching Songs matching text OR referencing matching artists/albums
    const songs = await Song.find({
      $or: [
        { title: { $regex: q, $options: 'i' } },
        { genre: { $regex: q, $options: 'i' } },
        { artist: { $in: artistIds } },
        { album: { $in: albumIds } },
      ],
    })
      .populate('artist', 'name profileImage')
      .populate('album', 'title coverImage')
      .limit(30);

    res.status(200).json({
      success: true,
      count: songs.length,
      data: songs,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Increment play count of a song & broadcast play counts in real-time
 * @route   POST /api/songs/:id/play
 * @access  Private
 */
const playSong = async (req, res, next) => {
  const songId = req.params.id;

  try {
    const song = await Song.findById(songId);
    if (!song) {
      return next(new ApiError(404, 'Song not found'));
    }

    // Increment play count
    song.totalPlays += 1;
    await song.save();

    // Broadcast the updated play count in real-time using Socket.io
    emitPlayCountUpdate(songId, song.totalPlays);

    res.status(200).json({
      success: true,
      message: 'Play counter incremented',
      totalPlays: song.totalPlays,
    });
  } catch (error) {
    next(error);
  }
};


/**
 * @desc    Edit a song (Admin/Artist only, handles optional file replacements)
 * @route   PUT /api/admin/songs/:id
 * @access  Private (Admin/Artist)
 */
const editSong = async (req, res, next) => {
  const songId = req.params.id;
  const { title, artistId, albumId, genre, duration } = req.body;

  try {
    const song = await Song.findById(songId);
    if (!song) {
      return next(new ApiError(404, 'Song not found'));
    }

    // 1. Update text metadata
    if (title) song.title = title;
    if (genre) song.genre = genre;
    if (duration) song.duration = duration;

    // 2. Manage Artist reassignment
    if (artistId && artistId !== song.artist?.toString()) {
      const artist = await Artist.findById(artistId);
      if (!artist) {
        return next(new ApiError(404, 'Artist not found with provided ID'));
      }
      song.artist = artistId;
    }

    // 3. Manage Album reassignment with relational integrity cascades
    if (albumId !== undefined) {
      const currentAlbumId = song.album?.toString();
      const targetAlbumId = albumId === '' || albumId === 'null' ? null : albumId;

      if (targetAlbumId !== currentAlbumId) {
        // Pull track reference from current album if one existed
        if (song.album) {
          await Album.findByIdAndUpdate(song.album, { $pull: { songs: songId } });
        }

        // Push track reference to target album
        if (targetAlbumId) {
          const album = await Album.findById(targetAlbumId);
          if (!album) {
            return next(new ApiError(404, 'Album not found with provided ID'));
          }
          await Album.findByIdAndUpdate(targetAlbumId, { $push: { songs: songId } });
        }
        song.album = targetAlbumId;
      }
    }

    // 4. Manage File Stream replacements
    if (req.files) {
      const fileWipes = [];
      const uploads = [];

      // Replace audio track
      if (req.files.audio && req.files.audio[0]) {
        fileWipes.push(deleteFromCloudinary(song.audioPublicId, 'video'));
        uploads.push(
          uploadToCloudinary(req.files.audio[0].buffer, 'spotify_clone/audio', 'video').then((upload) => {
            song.audioUrl = upload.secure_url;
            song.audioPublicId = upload.public_id;
          })
        );
      }

      // Replace cover thumbnail
      if (req.files.image && req.files.image[0]) {
        fileWipes.push(deleteFromCloudinary(song.imagePublicId, 'image'));
        uploads.push(
          uploadToCloudinary(req.files.image[0].buffer, 'spotify_clone/covers', 'image').then((upload) => {
            song.imageUrl = upload.secure_url;
            song.imagePublicId = upload.public_id;
          })
        );
      }

      if (fileWipes.length > 0) {
        await Promise.all(fileWipes);
      }
      if (uploads.length > 0) {
        await Promise.all(uploads);
      }
    }

    await song.save();

    const populatedSong = await Song.findById(songId)
      .populate('artist', 'name profileImage')
      .populate('album', 'title');

    res.status(200).json({
      success: true,
      message: 'Song updated successfully',
      data: populatedSong,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  addSong,
  getAllSongs,
  getSongById,
  deleteSong,
  searchSongs,
  playSong,
  editSong,
};

