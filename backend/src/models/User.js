const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      trim: true,
      default: 'Spotify Listener',
    },
    username: {
      type: String,
      trim: true,
      lowercase: true,
      unique: true,
      sparse: true, // Crucial for allowing users with only email or only phone number!
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      unique: true,
      sparse: true, // Crucial for allowing phone-only or email-only signups without duplicate conflicts!
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email address',
      ],
    },
    phoneNumber: {
      type: String,
      trim: true,
      unique: true,
      sparse: true, // Crucial for allowing email-only or phone-only signups!
    },
    avatar: {
      type: String,
      default: 'https://res.cloudinary.com/demo/image/upload/v1672531190/cld-sample.jpg',
    },
    role: {
      type: String,
      enum: ['user', 'artist', 'admin'],
      default: 'user',
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    otp: {
      type: String,
      default: null,
    },
    otpExpires: {
      type: Date,
      default: null,
    },
    likedSongs: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Song',
      },
    ],
    recentlyPlayed: [
      {
        song: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Song',
        },
        playedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    followingArtists: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Artist',
      },
    ],
    totalListeningMinutes: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model('User', userSchema);

module.exports = User;
