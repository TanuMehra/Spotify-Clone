const jwt = require('jsonwebtoken');

/**
 * Generates a short-lived access JWT token.
 * @param {string} userId - User ID payload.
 * @returns {string} Signed access token.
 */
const generateAccessToken = (userId) => {
  return jwt.sign(
    { id: userId }, 
    process.env.JWT_ACCESS_SECRET, 
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRE || '15m' }
  );
};

module.exports = generateAccessToken;
