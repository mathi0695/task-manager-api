const { User, UserActivity, Task } = require('../models');
const { ApiError } = require('../middlewares/errorHandler');
const { Op } = require('sequelize');

/**
 * Get current user profile
 * @route GET /api/users/me
 */
const getCurrentUser = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Get user with task counts
    const user = await User.findByPk(userId, {
      attributes: { exclude: ['password'] },
      include: [
        {
          model: Task,
          as: 'assignedTasks',
          attributes: ['id', 'status'],
          required: false
        }
      ]
    });

    if (!user) {
      throw new ApiError('User not found', 404);
    }

    // Calculate task statistics
    const taskStats = {
      total: user.assignedTasks.length,
      completed: user.assignedTasks.filter(task => task.status === 'completed').length,
      inProgress: user.assignedTasks.filter(task => task.status === 'in_progress').length,
      notStarted: user.assignedTasks.filter(task => task.status === 'not_started').length
    };

    // Remove tasks from response
    const userData = user.toJSON();
    delete userData.assignedTasks;

    res.status(200).json({
      status: 'success',
      data: {
        user: userData,
        taskStats
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update current user profile
 * @route PATCH /api/users/me
 */
const updateCurrentUser = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { username, email, firstName, lastName, avatarUrl } = req.body;

    // Check if username or email already exists
    if (username || email) {
      const existingUser = await User.findOne({
        where: {
          [Op.and]: [
            { id: { [Op.ne]: userId } },
            {
              [Op.or]: [
                ...(username ? [{ username }] : []),
                ...(email ? [{ email }] : [])
              ]
            }
          ]
        }
      });

      if (existingUser) {
        if (email && existingUser.email === email) {
          throw new ApiError('Email already in use', 400);
        }
        if (username && existingUser.username === username) {
          throw new ApiError('Username already taken', 400);
        }
      }
    }

    // Update user
    const user = await User.findByPk(userId);
    if (!user) {
      throw new ApiError('User not found', 404);
    }

    await user.update({
      ...(username && { username }),
      ...(email && { email }),
      ...(firstName !== undefined && { firstName }),
      ...(lastName !== undefined && { lastName }),
      ...(avatarUrl !== undefined && { avatarUrl })
    });

    // Log activity
    await UserActivity.create({
      userId,
      action: 'profile_updated',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    // Return updated user
    const updatedUser = await User.findByPk(userId, {
      attributes: { exclude: ['password'] }
    });

    res.status(200).json({
      status: 'success',
      data: {
        user: updatedUser
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user activity log
 * @route GET /api/users/me/activity
 */
const getUserActivity = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Get user activities
    const { count, rows: activities } = await UserActivity.findAndCountAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });

    // Calculate pagination
    const totalPages = Math.ceil(count / limit);

    res.status(200).json({
      status: 'success',
      data: {
        activities,
        pagination: {
          total: count,
          page,
          limit,
          totalPages
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user by ID (admin only)
 * @route GET /api/users/:id
 */
const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id, {
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      throw new ApiError('User not found', 404);
    }

    res.status(200).json({
      status: 'success',
      data: {
        user
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all users (admin only)
 * @route GET /api/users
 */
const getAllUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';

    // Build search condition
    const searchCondition = search
      ? {
          [Op.or]: [
            { username: { [Op.iLike]: `%${search}%` } },
            { email: { [Op.iLike]: `%${search}%` } },
            { firstName: { [Op.iLike]: `%${search}%` } },
            { lastName: { [Op.iLike]: `%${search}%` } }
          ]
        }
      : {};

    // Get users
    const { count, rows: users } = await User.findAndCountAll({
      where: searchCondition,
      attributes: { exclude: ['password'] },
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });

    // Calculate pagination
    const totalPages = Math.ceil(count / limit);

    res.status(200).json({
      status: 'success',
      data: {
        users,
        pagination: {
          total: count,
          page,
          limit,
          totalPages
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update user (admin only)
 * @route PATCH /api/users/:id
 */
const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { username, email, firstName, lastName, avatarUrl, role, isActive } = req.body;

    // Check if username or email already exists
    if (username || email) {
      const existingUser = await User.findOne({
        where: {
          [Op.and]: [
            { id: { [Op.ne]: id } },
            {
              [Op.or]: [
                ...(username ? [{ username }] : []),
                ...(email ? [{ email }] : [])
              ]
            }
          ]
        }
      });

      if (existingUser) {
        if (email && existingUser.email === email) {
          throw new ApiError('Email already in use', 400);
        }
        if (username && existingUser.username === username) {
          throw new ApiError('Username already taken', 400);
        }
      }
    }

    // Update user
    const user = await User.findByPk(id);
    if (!user) {
      throw new ApiError('User not found', 404);
    }

    await user.update({
      ...(username && { username }),
      ...(email && { email }),
      ...(firstName !== undefined && { firstName }),
      ...(lastName !== undefined && { lastName }),
      ...(avatarUrl !== undefined && { avatarUrl }),
      ...(role && { role }),
      ...(isActive !== undefined && { isActive })
    });

    // Log activity
    await UserActivity.create({
      userId: req.user.id,
      action: 'user_updated',
      resourceType: 'user',
      resourceId: id,
      details: { updatedUserId: id },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    // Return updated user
    const updatedUser = await User.findByPk(id, {
      attributes: { exclude: ['password'] }
    });

    res.status(200).json({
      status: 'success',
      data: {
        user: updatedUser
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete user (admin only)
 * @route DELETE /api/users/:id
 */
const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Prevent deleting yourself
    if (id === req.user.id) {
      throw new ApiError('Cannot delete your own account', 400);
    }

    // Find user
    const user = await User.findByPk(id);
    if (!user) {
      throw new ApiError('User not found', 404);
    }

    // Delete user
    await user.destroy();

    // Log activity
    await UserActivity.create({
      userId: req.user.id,
      action: 'user_deleted',
      resourceType: 'user',
      resourceId: id,
      details: { deletedUserId: id },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.status(200).json({
      status: 'success',
      message: 'User deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCurrentUser,
  updateCurrentUser,
  getUserActivity,
  getUserById,
  getAllUsers,
  updateUser,
  deleteUser
};
