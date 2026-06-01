const mongoose = require('mongoose');

const albumSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please add an album title'],
      trim: true,
    },
    coverImage: {
      type: String,
      required: [true, 'Please provide an album cover image URL'],
    },
    coverImagePublicId: {
      type: String,
      required: [true, 'Please provide the album cover Cloudinary public ID'],
    },
    artist: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Artist',
      required: [true, 'Please add an artist reference'],
    },
    songs: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Song',
      },
    ],
    releaseDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const Album = mongoose.model('Album', albumSchema);

module.exports = Album;
