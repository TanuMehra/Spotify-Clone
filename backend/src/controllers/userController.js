const User = require('../models/User');
const Song = require('../models/Song');
const Artist = require('../models/Artist');
const Playlist = require('../models/Playlist');
const ApiError = require('../utils/ApiError');
const { uploadToCloudinary } = require('../config/cloudinary');
const { emitNotification } = require('../config/socket');

/**
 * @desc    Get current user profile (with populated likes & recent)
 * @route   GET /api/users/me
 * @access  Private
 */
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('likedSongs')
      .populate('followingArtists');

    if (!user) {
      return next(new ApiError(404, 'User profile not found'));
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Like a song
 * @route   POST /api/users/like/:songId
 * @access  Private
 */
const likeSong = async (req, res, next) => {
  const songId = req.params.songId;

  try {
    // 1. Verify song exists
    const song = await Song.findById(songId);
    if (!song) {
      return next(new ApiError(404, 'Song not found'));
    }

    const user = await User.findById(req.user._id);

    // 2. Prevent double liking
    if (user.likedSongs.includes(songId)) {
      return next(new ApiError(400, 'Song is already in your Liked Songs'));
    }

    // 3. Save song to User list
    user.likedSongs.push(songId);
    await user.save();

    // 4. Increment likesCount on Song document
    song.likesCount += 1;
    await song.save();

    // 5. Optional Real-Time socket notification if the song artist is active
    if (song.artist) {
      emitNotification(song.artist.toString(), {
        type: 'SONG_LIKED',
        message: `Your track "${song.title}" was liked by ${user.username}!`,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Song added to your Liked Songs',
      likedSongs: user.likedSongs,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Unlike a song
 * @route   DELETE /api/users/unlike/:songId
 * @access  Private
 */
const unlikeSong = async (req, res, next) => {
  const songId = req.params.songId;

  try {
    const user = await User.findById(req.user._id);

    // 1. Verify liked state
    if (!user.likedSongs.includes(songId)) {
      return next(new ApiError(400, 'Song is not in your Liked Songs'));
    }

    // 2. Remove from User list
    user.likedSongs = user.likedSongs.filter((id) => id.toString() !== songId);
    await user.save();

    // 3. Decrement likesCount on Song document if it exists
    const song = await Song.findById(songId);
    if (song) {
      song.likesCount = Math.max(0, song.likesCount - 1);
      await song.save();
    }

    res.status(200).json({
      success: true,
      message: 'Song removed from your Liked Songs',
      likedSongs: user.likedSongs,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get liked songs catalog of user
 * @route   GET /api/users/liked
 * @access  Private
 */
const getLikedSongs = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: 'likedSongs',
      populate: { path: 'artist', select: 'name profileImage' },
    });

    res.status(200).json({
      success: true,
      count: user.likedSongs.length,
      data: user.likedSongs,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Add song to playback history
 * @route   POST /api/users/recent/:songId
 * @access  Private
 */
const addToRecentlyPlayed = async (req, res, next) => {
  const songId = req.params.songId;

  try {
    const song = await Song.findById(songId);
    if (!song) {
      return next(new ApiError(404, 'Song not found'));
    }

    const user = await User.findById(req.user._id);

    // Filter out song duplicates to bring it to top
    user.recentlyPlayed = user.recentlyPlayed.filter(
      (item) => item.song && item.song.toString() !== songId
    );

    // Prepend to history
    user.recentlyPlayed.unshift({ song: songId, playedAt: new Date() });

    // Limit to latest 20
    if (user.recentlyPlayed.length > 20) {
      user.recentlyPlayed = user.recentlyPlayed.slice(0, 20);
    }

    // Accumulate listening minutes from song duration (format: "3:45" or "3.5" or number)
    if (song.duration) {
      let durationMinutes = 0;
      const dStr = String(song.duration).trim();
      if (dStr.includes(':')) {
        const [mins, secs] = dStr.split(':').map(Number);
        durationMinutes = (mins || 0) + (secs || 0) / 60;
      } else {
        durationMinutes = parseFloat(dStr) || 0;
      }
      user.totalListeningMinutes = (user.totalListeningMinutes || 0) + durationMinutes;
    }

    await user.save();

    // Emit real-time profile stats update to this user
    emitNotification(user._id.toString(), {
      type: 'STATS_UPDATE',
      recentlyPlayedCount: user.recentlyPlayed.length,
      totalListeningMinutes: user.totalListeningMinutes,
    });

    res.status(200).json({
      success: true,
      message: 'Song playback recorded in history',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get user's play history
 * @route   GET /api/users/recent
 * @access  Private
 */
const getRecentlyPlayed = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: 'recentlyPlayed.song',
      populate: { path: 'artist', select: 'name profileImage' },
    });

    const validHistory = user.recentlyPlayed.filter((item) => item.song !== null);

    res.status(200).json({
      success: true,
      count: validHistory.length,
      data: validHistory,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Follow an Artist
 * @route   POST /api/users/follow/:artistId
 * @access  Private
 */
const followArtist = async (req, res, next) => {
  const artistId = req.params.artistId;

  try {
    // 1. Verify artist exists
    const artist = await Artist.findById(artistId);
    if (!artist) {
      return next(new ApiError(404, 'Artist not found'));
    }

    const user = await User.findById(req.user._id);

    // 2. Prevent duplicate follow
    if (user.followingArtists.includes(artistId)) {
      return next(new ApiError(400, 'You are already following this artist'));
    }

    // 3. User follow artist
    user.followingArtists.push(artistId);
    await user.save();

    // 4. Artist append follower user
    artist.followers.push(user._id);
    await artist.save();

    // Emit live push notification to the artist
    emitNotification(artistId, {
      type: 'NEW_FOLLOWER',
      message: `User ${user.username} started following you!`,
    });

    res.status(200).json({
      success: true,
      message: `You are now following ${artist.name}`,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Unfollow an Artist
 * @route   DELETE /api/users/unfollow/:artistId
 * @access  Private
 */
const unfollowArtist = async (req, res, next) => {
  const artistId = req.params.artistId;

  try {
    const artist = await Artist.findById(artistId);
    if (!artist) {
      return next(new ApiError(404, 'Artist not found'));
    }

    const user = await User.findById(req.user._id);

    if (!user.followingArtists.includes(artistId)) {
      return next(new ApiError(400, 'You are not following this artist'));
    }

    // Pull from user following lists
    user.followingArtists = user.followingArtists.filter((id) => id.toString() !== artistId);
    await user.save();

    // Pull from artist followers array
    artist.followers = artist.followers.filter((id) => id.toString() !== req.user._id.toString());
    await artist.save();

    res.status(200).json({
      success: true,
      message: `You successfully unfollowed ${artist.name}`,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get detailed user profile statistics and metadata
 * @route   GET /api/users/profile
 * @access  Private
 */
const getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return next(new ApiError(404, 'User profile not found'));
    }

    // Calculate statistics
    const likedSongsCount = user.likedSongs.length;
    const followingArtistsCount = user.followingArtists.length;
    const recentlyPlayedCount = user.recentlyPlayed.length;
    
    // Find custom user playlists created by this user
    const playlistsCreatedCount = await Playlist.countDocuments({ owner: req.user._id });

    // Use real stored totalListeningMinutes; fallback: 3.5 mins per track estimate
    const totalMinutes = user.totalListeningMinutes > 0
      ? user.totalListeningMinutes
      : recentlyPlayedCount * 3.5;
    const totalListeningTime = totalMinutes >= 60
      ? `${Math.floor(totalMinutes / 60)} hrs ${Math.floor(totalMinutes % 60)} mins`
      : `${Math.floor(totalMinutes)} mins`;

    const profileData = {
      fullName: user.fullName,
      username: user.username,
      email: user.email || 'N/A',
      phoneNumber: user.phoneNumber || 'N/A',
      avatar: user.avatar,
      role: user.role,
      isVerified: user.isVerified,
      joiningDate: new Date(user.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      stats: {
        likedSongsCount,
        playlistsCreatedCount,
        followingArtistsCount,
        recentlyPlayedCount,
        totalListeningTime,
        followersCount: 0, // listeners have 0 followers
        followingCount: followingArtistsCount,
      }
    };

    res.status(200).json({
      success: true,
      data: profileData,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update current user profile metadata
 * @route   PUT /api/users/profile
 * @access  Private
 */
const updateUserProfile = async (req, res, next) => {
  const { fullName, username, email } = req.body;

  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return next(new ApiError(404, 'User profile not found'));
    }

    // Check unique-sparse constraints for changed fields
    if (email && email.trim().toLowerCase() !== user.email) {
      const emailConflict = await User.findOne({ email: email.trim().toLowerCase() });
      if (emailConflict) {
        return next(new ApiError(400, 'Email address is already in use by another account'));
      }
      user.email = email.trim().toLowerCase();
    }

    if (username && username.trim().toLowerCase() !== user.username) {
      const usernameConflict = await User.findOne({ username: username.trim().toLowerCase() });
      if (usernameConflict) {
        return next(new ApiError(400, 'Username is already taken'));
      }
      user.username = username.trim().toLowerCase();
    }

    if (fullName) {
      user.fullName = fullName.trim();
    }

    await user.save();

    // Notify of update
    emitNotification(user._id.toString(), {
      type: 'PROFILE_UPDATED',
      message: 'Your profile settings have been updated successfully!',
    });

    res.status(200).json({
      success: true,
      message: 'Profile settings updated successfully',
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get user followed artists
 * @route   GET /api/users/following-artists
 * @access  Private
 */
const getFollowingArtists = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate('followingArtists');
    if (!user) {
      return next(new ApiError(404, 'User profile not found'));
    }

    res.status(200).json({
      success: true,
      count: user.followingArtists.length,
      data: user.followingArtists,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Upload profile avatar to Cloudinary
 * @route   POST /api/users/upload-avatar
 * @access  Private
 */
const uploadAvatar = async (req, res, next) => {
  try {
    if (!req.file) {
      return next(new ApiError(400, 'Please provide an image file to upload'));
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return next(new ApiError(404, 'User profile not found'));
    }

    console.log(`[Upload] Uploading avatar buffer stream to Cloudinary for: ${user.username}`);
    const uploadResult = await uploadToCloudinary(req.file.buffer, 'spotify_clone/avatars', 'image');
    
    // Save secure url in DB
    user.avatar = uploadResult.secure_url;
    await user.save();

    // Trigger websocket notification
    emitNotification(user._id.toString(), {
      type: 'AVATAR_UPLOADED',
      message: 'Your new avatar image has been uploaded successfully!',
    });

    res.status(200).json({
      success: true,
      message: 'Profile image uploaded successfully',
      avatarUrl: user.avatar,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
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
};
