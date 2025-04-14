const express = require('express');
const { 
  getCurrentUser, 
  updateCurrentUser, 
  getUserActivity, 
  getUserById, 
  getAllUsers, 
  updateUser, 
  deleteUser 
} = require('../controllers/userController');
const { authenticate, authorize } = require('../middlewares/authMiddleware');
const { validate } = require('../middlewares/validationMiddleware');
const { userUpdateSchema } = require('../utils/validationSchemas');

const router = express.Router();

// Protected routes for all authenticated users
router.get('/me', authenticate, getCurrentUser);
router.patch('/me', authenticate, validate(userUpdateSchema), updateCurrentUser);
router.get('/me/activity', authenticate, getUserActivity);

// Admin-only routes
router.get('/', authenticate, authorize('admin'), getAllUsers);
router.get('/:id', authenticate, authorize('admin'), getUserById);
router.patch('/:id', authenticate, authorize('admin'), validate(userUpdateSchema), updateUser);
router.delete('/:id', authenticate, authorize('admin'), deleteUser);

module.exports = router;
