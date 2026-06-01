const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');

/**
 * Protect routes - verifies short-lived JWT Access Token
 */
const protect = async (req, res, next) => {
  let token;

  // 1. Retrieve access token from Authorization header or cookie
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.accessToken) {
    token = req.cookies.accessToken;
  }

  if (!token) {
    return next(new ApiError(401, 'Access denied, authentication token missing'));
  }

  try {
    // Verify Access Token
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

    // Fetch user and attach to request
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return next(new ApiError(401, 'User belonging to this token no longer exists'));
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Access token verification error:', error);
    
    // Explicit token expiry catch for refresh token client rotation triggering
    if (error.name === 'TokenExpiredError') {
      return next(new ApiError(401, 'Access token has expired', [{ code: 'TOKEN_EXPIRED' }]));
    }
    
    return next(new ApiError(401, 'Access token is invalid or corrupted'));
  }
};

module.exports = {
  protect,
};
