const jwt = require('jsonwebtoken');

/**
 * Generates a JWT token and sets it as an HTTP-only cookie on the response.
 * @param {object} res - Express response object.
 * @param {string} userId - The ID of the authenticated user.
 * @returns {string} The generated JWT token.
 */
const generateToken = (res, userId) => {
  const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

  // Set standard cookie configuration options
  const cookieOptions = {
    httpOnly: true, // Prevents client-side JS from reading the cookie
    secure: process.env.NODE_ENV === 'production', // Cookie only transmitted over HTTPS in prod
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // Lax for dev, None for cross-site in prod
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
  };

  res.cookie('token', token, cookieOptions);

  return token;
};

module.exports = generateToken;
