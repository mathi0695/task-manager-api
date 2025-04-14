const express = require('express');
const { 
  getTaskStats, 
  getProductivityStats, 
  getProjectStats 
} = require('../controllers/statsController');
const { authenticate, authorize } = require('../middlewares/authMiddleware');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// User stats routes
router.get('/tasks', getTaskStats);
router.get('/productivity', getProductivityStats);

// Admin-only routes
router.get('/projects', authorize('admin'), getProjectStats);

module.exports = router;
