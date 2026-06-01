const jwt = require('jsonwebtoken');

/**
 * Generates a long-lived refresh JWT token and sets it as an HTTP-only cookie.
 * @param {object} res - Express response object.
 * @param {string} userId - User ID payload.
 * @returns {string} Signed refresh token.
 */
const generateRefreshToken = (res, userId) => {
  const refreshToken = jwt.sign(
    { id: userId }, 
    process.env.JWT_REFRESH_SECRET, 
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRE || '7d' }
  );

  // Secure cookie configurations
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
  };

  res.cookie('refreshToken', refreshToken, cookieOptions);

  return refreshToken;
};

module.exports = generateRefreshToken;
