const mongoose = require('mongoose');

const artistSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add an artist name'],
      trim: true,
      unique: true,
    },
    bio: {
      type: String,
      default: '',
      trim: true,
    },
    profileImage: {
      type: String,
      required: [true, 'Please provide an artist profile image URL'],
    },
    profileImagePublicId: {
      type: String,
      required: [true, 'Please provide the artist profile image Cloudinary public ID'],
    },
    monthlyListeners: {
      type: Number,
      default: 0,
    },
    followers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    socialLinks: {
      spotify: { type: String, default: '' },
      instagram: { type: String, default: '' },
      twitter: { type: String, default: '' },
    },
  },
  {
    timestamps: true,
  }
);

// Virtual to get total followers count
artistSchema.virtual('followersCount').get(function () {
  return this.followers.length;
});

// Ensure virtuals are included in JSON outputs
artistSchema.set('toJSON', { virtuals: true });
artistSchema.set('toObject', { virtuals: true });

const Artist = mongoose.model('Artist', artistSchema);

module.exports = Artist;
