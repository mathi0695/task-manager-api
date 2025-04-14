const express = require('express');
const { 
  getNotifications, 
  markNotificationAsRead, 
  markAllNotificationsAsRead, 
  deleteNotification 
} = require('../controllers/notificationController');
const { authenticate } = require('../middlewares/authMiddleware');
const { validate } = require('../middlewares/validationMiddleware');
const { notificationUpdateSchema } = require('../utils/validationSchemas');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

router.get('/', getNotifications);
router.patch('/:id', validate(notificationUpdateSchema), markNotificationAsRead);
router.patch('/', markAllNotificationsAsRead);
router.delete('/:id', deleteNotification);

module.exports = router;
