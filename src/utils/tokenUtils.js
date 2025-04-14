const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { Op } = require('sequelize');
const { RefreshToken, User } = require('../models');

/**
 * Generate JWT access token
 * @param {Object} user - User object
 * @returns {String} JWT token
 */
const generateAccessToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );
};

/**
 * Generate refresh token
 * @param {Object} user - User object
 * @returns {String} Refresh token
 */
const generateRefreshToken = async (user) => {
  // Generate a random token
  const refreshToken = crypto.randomBytes(40).toString('hex');

  // Calculate expiry date
  const expiresIn = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d';
  const expiresInMs = ms(expiresIn);
  const expiresAt = new Date(Date.now() + expiresInMs);

  // Save to database
  await RefreshToken.create({
    token: refreshToken,
    userId: user.id,
    expiresAt
  });

  return refreshToken;
};

/**
 * Verify refresh token
 * @param {String} token - Refresh token
 * @returns {Object} RefreshToken instance
 */
const verifyRefreshToken = async (token) => {
  const refreshToken = await RefreshToken.findOne({
    where: {
      token,
      isRevoked: false,
      expiresAt: { [Op.gt]: new Date() }
    },
    include: {
      model: User,
      as: 'user',
      attributes: { exclude: ['password'] }
    }
  });

  if (!refreshToken) {
    throw new Error('Invalid or expired refresh token');
  }

  return refreshToken;
};

/**
 * Revoke refresh token
 * @param {String} token - Refresh token
 */
const revokeRefreshToken = async (token) => {
  await RefreshToken.update(
    { isRevoked: true },
    { where: { token } }
  );
};

/**
 * Revoke all refresh tokens for a user
 * @param {String} userId - User ID
 */
const revokeAllUserRefreshTokens = async (userId) => {
  await RefreshToken.update(
    { isRevoked: true },
    { where: { userId } }
  );
};

/**
 * Helper function to parse duration string to milliseconds
 * @param {String} str - Duration string (e.g., '7d', '1h')
 * @returns {Number} Milliseconds
 */
function ms(str) {
  const match = /^(\d+)([smhdwy])$/.exec(str);
  if (!match) return 0;

  const num = parseInt(match[1], 10);
  const type = match[2];

  switch (type) {
    case 's': return num * 1000; // seconds
    case 'm': return num * 60 * 1000; // minutes
    case 'h': return num * 60 * 60 * 1000; // hours
    case 'd': return num * 24 * 60 * 60 * 1000; // days
    case 'w': return num * 7 * 24 * 60 * 60 * 1000; // weeks
    case 'y': return num * 365 * 24 * 60 * 60 * 1000; // years (approximate)
    default: return 0;
  }
}

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  revokeRefreshToken,
  revokeAllUserRefreshTokens
};
