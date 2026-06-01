const mongoose = require('mongoose');

const songSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please add a song title'],
      trim: true,
    },
    artist: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Artist',
      required: [true, 'Please add an artist reference'],
    },
    album: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Album',
      default: null,
    },
    genre: {
      type: String,
      default: 'Unknown',
      trim: true,
    },
    duration: {
      type: String,
      required: [true, 'Please add song duration'],
    },
    imageUrl: {
      type: String,
      required: [true, 'Please provide the song cover thumbnail URL'],
    },
    audioUrl: {
      type: String,
      required: [true, 'Please provide the audio track URL'],
    },
    audioPublicId: {
      type: String,
      required: [true, 'Please provide the audio track Cloudinary public ID'],
    },
    imagePublicId: {
      type: String,
      required: [true, 'Please provide the cover thumbnail Cloudinary public ID'],
    },
    totalPlays: {
      type: Number,
      default: 0,
    },
    likesCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const Song = mongoose.model('Song', songSchema);

module.exports = Song;
