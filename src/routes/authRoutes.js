const express = require('express');
const { 
  register, 
  login, 
  refreshToken, 
  logout, 
  forgotPassword, 
  resetPassword, 
  changePassword 
} = require('../controllers/authController');
const { validate } = require('../middlewares/validationMiddleware');
const { 
  userRegisterSchema, 
  userLoginSchema, 
  refreshTokenSchema, 
  passwordResetRequestSchema, 
  passwordResetSchema, 
  passwordUpdateSchema 
} = require('../utils/validationSchemas');
const { authenticate } = require('../middlewares/authMiddleware');

const router = express.Router();

// Public routes
router.post('/register', validate(userRegisterSchema), register);
router.post('/login', validate(userLoginSchema), login);
router.post('/refresh-token', validate(refreshTokenSchema), refreshToken);
router.post('/forgot-password', validate(passwordResetRequestSchema), forgotPassword);
router.post('/reset-password', validate(passwordResetSchema), resetPassword);

// Protected routes
router.post('/logout', authenticate, logout);
router.post('/change-password', authenticate, validate(passwordUpdateSchema), changePassword);

module.exports = router;
