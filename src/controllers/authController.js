const crypto = require('crypto');
const { User, UserActivity, RefreshToken } = require('../models');
const { ApiError } = require('../middlewares/errorHandler');
const { 
  generateAccessToken, 
  generateRefreshToken, 
  verifyRefreshToken, 
  revokeRefreshToken,
  revokeAllUserRefreshTokens
} = require('../utils/tokenUtils');
const { Op } = require('sequelize');

/**
 * Register a new user
 * @route POST /api/auth/register
 */
const register = async (req, res, next) => {
  try {
    const { username, email, password, firstName, lastName, avatarUrl } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [{ email }, { username }]
      }
    });

    if (existingUser) {
      if (existingUser.email === email) {
        throw new ApiError('Email already in use', 400);
      } else {
        throw new ApiError('Username already taken', 400);
      }
    }

    // Create new user
    const user = await User.create({
      username,
      email,
      password, // Will be hashed by model hook
      firstName,
      lastName,
      avatarUrl
    });

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = await generateRefreshToken(user);

    // Log activity
    await UserActivity.create({
      userId: user.id,
      action: 'user_registered',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    // Return user data (excluding password)
    const userData = user.toJSON();
    delete userData.password;

    res.status(201).json({
      status: 'success',
      data: {
        user: userData,
        accessToken,
        refreshToken
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Login user
 * @route POST /api/auth/login
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ where: { email } });
    if (!user) {
      throw new ApiError('Invalid email or password', 401);
    }

    // Check if user is active
    if (!user.isActive) {
      throw new ApiError('Account is disabled', 403);
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new ApiError('Invalid email or password', 401);
    }

    // Update last login
    await user.update({ lastLogin: new Date() });

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = await generateRefreshToken(user);

    // Log activity
    await UserActivity.create({
      userId: user.id,
      action: 'user_logged_in',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    // Return user data (excluding password)
    const userData = user.toJSON();
    delete userData.password;

    res.status(200).json({
      status: 'success',
      data: {
        user: userData,
        accessToken,
        refreshToken
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Refresh access token
 * @route POST /api/auth/refresh-token
 */
const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken: token } = req.body;

    // Verify refresh token
    const refreshTokenDoc = await verifyRefreshToken(token);
    const user = refreshTokenDoc.user;

    // Revoke the used refresh token
    await revokeRefreshToken(token);

    // Generate new tokens
    const accessToken = generateAccessToken(user);
    const newRefreshToken = await generateRefreshToken(user);

    res.status(200).json({
      status: 'success',
      data: {
        accessToken,
        refreshToken: newRefreshToken
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Logout user
 * @route POST /api/auth/logout
 */
const logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    // Revoke refresh token if provided
    if (refreshToken) {
      await revokeRefreshToken(refreshToken);
    }

    // Log activity if user is authenticated
    if (req.user) {
      await UserActivity.create({
        userId: req.user.id,
        action: 'user_logged_out',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Logged out successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Request password reset
 * @route POST /api/auth/forgot-password
 */
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    // Find user by email
    const user = await User.findOne({ where: { email } });
    if (!user) {
      // Don't reveal that email doesn't exist
      return res.status(200).json({
        status: 'success',
        message: 'If your email is registered, you will receive a password reset link'
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // Set token expiry (1 hour)
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000);

    // Save to user
    await user.update({
      resetPasswordToken: resetTokenHash,
      resetPasswordExpires: resetTokenExpiry
    });

    // In a real application, send email with reset link
    // For this test, we'll just return the token
    console.log(`Reset token for ${email}: ${resetToken}`);

    res.status(200).json({
      status: 'success',
      message: 'If your email is registered, you will receive a password reset link',
      // Only for testing purposes
      resetToken
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reset password
 * @route POST /api/auth/reset-password
 */
const resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;

    // Hash the token from the request
    const resetTokenHash = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // Find user with valid token
    const user = await User.findOne({
      where: {
        resetPasswordToken: resetTokenHash,
        resetPasswordExpires: { [Op.gt]: new Date() }
      }
    });

    if (!user) {
      throw new ApiError('Invalid or expired token', 400);
    }

    // Update password and clear reset token
    await user.update({
      password: newPassword,
      resetPasswordToken: null,
      resetPasswordExpires: null
    });

    // Revoke all refresh tokens for security
    await revokeAllUserRefreshTokens(user.id);

    // Log activity
    await UserActivity.create({
      userId: user.id,
      action: 'password_reset',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.status(200).json({
      status: 'success',
      message: 'Password has been reset successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Change password
 * @route POST /api/auth/change-password
 */
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    // Find user
    const user = await User.findByPk(userId);
    if (!user) {
      throw new ApiError('User not found', 404);
    }

    // Verify current password
    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      throw new ApiError('Current password is incorrect', 401);
    }

    // Update password
    await user.update({ password: newPassword });

    // Revoke all refresh tokens except current one
    const currentRefreshToken = req.body.refreshToken;
    const refreshTokens = await RefreshToken.findAll({
      where: { 
        userId,
        isRevoked: false,
        token: { [Op.ne]: currentRefreshToken }
      }
    });

    for (const token of refreshTokens) {
      await token.update({ isRevoked: true });
    }

    // Log activity
    await UserActivity.create({
      userId: user.id,
      action: 'password_changed',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.status(200).json({
      status: 'success',
      message: 'Password changed successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  refreshToken,
  logout,
  forgotPassword,
  resetPassword,
  changePassword
};
