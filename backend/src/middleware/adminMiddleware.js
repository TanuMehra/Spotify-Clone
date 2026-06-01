const ApiError = require('../utils/ApiError');

/**
 * Enforces admin-only permissions.
 * Must be executed AFTER the protect auth middleware.
 */
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    next(new ApiError(403, 'Forbidden: Administrative access is required'));
  }
};

/**
 * Enforces artist-only or admin permissions.
 */
const isArtistOrAdmin = (req, res, next) => {
  if (req.user && (req.user.role === 'artist' || req.user.role === 'admin')) {
    next();
  } else {
    next(new ApiError(403, 'Forbidden: Artist or Administrative access is required'));
  }
};

module.exports = {
  isAdmin,
  isArtistOrAdmin,
};
