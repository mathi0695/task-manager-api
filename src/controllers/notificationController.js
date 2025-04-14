const { Notification } = require('../models');
const { ApiError } = require('../middlewares/errorHandler');

/**
 * Get all notifications for current user
 * @route GET /api/notifications
 */
const getNotifications = async (req, res, next) => {
  try {
    const { isRead, page = 1, limit = 10 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    // Build where conditions
    const whereConditions = {
      userId: req.user.id
    };
    
    if (isRead !== undefined) {
      whereConditions.isRead = isRead === 'true';
    }
    
    // Get notifications
    const { count, rows: notifications } = await Notification.findAndCountAll({
      where: whereConditions,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset
    });
    
    // Calculate pagination
    const totalPages = Math.ceil(count / parseInt(limit));
    
    res.status(200).json({
      status: 'success',
      data: {
        notifications,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mark notification as read
 * @route PATCH /api/notifications/:id
 */
const markNotificationAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isRead } = req.body;
    
    // Find notification
    const notification = await Notification.findOne({
      where: {
        id,
        userId: req.user.id
      }
    });
    
    if (!notification) {
      throw new ApiError('Notification not found', 404);
    }
    
    // Update notification
    await notification.update({ isRead });
    
    res.status(200).json({
      status: 'success',
      data: {
        notification
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mark all notifications as read
 * @route PATCH /api/notifications/mark-all-read
 */
const markAllNotificationsAsRead = async (req, res, next) => {
  try {
    // Update all unread notifications
    await Notification.update(
      { isRead: true },
      {
        where: {
          userId: req.user.id,
          isRead: false
        }
      }
    );
    
    res.status(200).json({
      status: 'success',
      message: 'All notifications marked as read'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete notification
 * @route DELETE /api/notifications/:id
 */
const deleteNotification = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Find notification
    const notification = await Notification.findOne({
      where: {
        id,
        userId: req.user.id
      }
    });
    
    if (!notification) {
      throw new ApiError('Notification not found', 404);
    }
    
    // Delete notification
    await notification.destroy();
    
    res.status(200).json({
      status: 'success',
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification
};
