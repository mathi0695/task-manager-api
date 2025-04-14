const { Task, User, Category, Comment, Notification, UserActivity } = require('../models');
const { ApiError } = require('../middlewares/errorHandler');
const { Op } = require('sequelize');

/**
 * Create a new task
 * @route POST /api/tasks
 */
const createTask = async (req, res, next) => {
  try {
    const {
      title,
      description,
      status,
      priority,
      dueDate,
      estimatedTime,
      attachments,
      recurrence,
      categoryId,
      assignedToId,
      parentTaskId
    } = req.body;

    // Validate category if provided
    if (categoryId) {
      const category = await Category.findByPk(categoryId);
      if (!category) {
        throw new ApiError('Category not found', 404);
      }
    }

    // Validate assignee if provided
    if (assignedToId) {
      const assignee = await User.findByPk(assignedToId);
      if (!assignee) {
        throw new ApiError('Assignee not found', 404);
      }
    }

    // Validate parent task if provided
    if (parentTaskId) {
      const parentTask = await Task.findByPk(parentTaskId);
      if (!parentTask) {
        throw new ApiError('Parent task not found', 404);
      }
    }

    // Create task
    const task = await Task.create({
      title,
      description,
      status,
      priority,
      dueDate,
      estimatedTime,
      attachments,
      recurrence,
      categoryId,
      assignedToId,
      parentTaskId,
      createdById: req.user.id
    });

    // Create notification for assignee if assigned
    if (assignedToId) {
      await Notification.create({
        type: 'task_assigned',
        message: `You have been assigned to task: ${title}`,
        userId: assignedToId,
        taskId: task.id
      });
    }

    // Log activity
    await UserActivity.create({
      userId: req.user.id,
      action: 'task_created',
      resourceType: 'task',
      resourceId: task.id,
      details: { taskId: task.id },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    // Return created task with associations
    const createdTask = await Task.findByPk(task.id, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'email', 'avatarUrl']
        },
        {
          model: User,
          as: 'assignee',
          attributes: ['id', 'username', 'email', 'avatarUrl']
        },
        {
          model: Category,
          as: 'category'
        }
      ]
    });

    res.status(201).json({
      status: 'success',
      data: {
        task: createdTask
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all tasks with filtering and pagination
 * @route GET /api/tasks
 */
const getAllTasks = async (req, res, next) => {
  try {
    const {
      status,
      priority,
      categoryId,
      assignedToId,
      createdById,
      dueDateFrom,
      dueDateTo,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 10
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    // Build where conditions
    const whereConditions = {};
    
    if (status) whereConditions.status = status;
    if (priority) whereConditions.priority = priority;
    if (categoryId) whereConditions.categoryId = categoryId;
    if (assignedToId) whereConditions.assignedToId = assignedToId;
    if (createdById) whereConditions.createdById = createdById;
    
    // Date range filter
    if (dueDateFrom || dueDateTo) {
      whereConditions.dueDate = {};
      if (dueDateFrom) whereConditions.dueDate[Op.gte] = new Date(dueDateFrom);
      if (dueDateTo) whereConditions.dueDate[Op.lte] = new Date(dueDateTo);
    }
    
    // Search filter
    if (search) {
      whereConditions[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } }
      ];
    }
    
    // Get tasks
    const { count, rows: tasks } = await Task.findAndCountAll({
      where: whereConditions,
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'email', 'avatarUrl']
        },
        {
          model: User,
          as: 'assignee',
          attributes: ['id', 'username', 'email', 'avatarUrl']
        },
        {
          model: Category,
          as: 'category'
        }
      ],
      order: [[sortBy, sortOrder.toUpperCase()]],
      limit: parseInt(limit),
      offset
    });
    
    // Calculate pagination
    const totalPages = Math.ceil(count / parseInt(limit));
    
    res.status(200).json({
      status: 'success',
      data: {
        tasks,
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
 * Get task by ID
 * @route GET /api/tasks/:id
 */
const getTaskById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const task = await Task.findByPk(id, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'email', 'avatarUrl']
        },
        {
          model: User,
          as: 'assignee',
          attributes: ['id', 'username', 'email', 'avatarUrl']
        },
        {
          model: Category,
          as: 'category'
        },
        {
          model: Task,
          as: 'parentTask'
        },
        {
          model: Task,
          as: 'subtasks'
        },
        {
          model: Comment,
          as: 'comments',
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'username', 'email', 'avatarUrl']
            }
          ]
        }
      ]
    });
    
    if (!task) {
      throw new ApiError('Task not found', 404);
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        task
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update task
 * @route PATCH /api/tasks/:id
 */
const updateTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      status,
      priority,
      dueDate,
      completedAt,
      estimatedTime,
      attachments,
      recurrence,
      categoryId,
      assignedToId,
      parentTaskId
    } = req.body;
    
    // Find task
    const task = await Task.findByPk(id);
    if (!task) {
      throw new ApiError('Task not found', 404);
    }
    
    // Check if user has permission to update
    if (task.createdById !== req.user.id && req.user.role !== 'admin') {
      throw new ApiError('Not authorized to update this task', 403);
    }
    
    // Validate category if provided
    if (categoryId) {
      const category = await Category.findByPk(categoryId);
      if (!category) {
        throw new ApiError('Category not found', 404);
      }
    }
    
    // Validate assignee if provided
    if (assignedToId) {
      const assignee = await User.findByPk(assignedToId);
      if (!assignee) {
        throw new ApiError('Assignee not found', 404);
      }
    }
    
    // Validate parent task if provided
    if (parentTaskId) {
      if (parentTaskId === id) {
        throw new ApiError('Task cannot be its own parent', 400);
      }
      
      const parentTask = await Task.findByPk(parentTaskId);
      if (!parentTask) {
        throw new ApiError('Parent task not found', 404);
      }
    }
    
    // Check if status is being updated to completed
    const isCompletingTask = status === 'completed' && task.status !== 'completed';
    
    // Update task
    await task.update({
      ...(title && { title }),
      ...(description !== undefined && { description }),
      ...(status && { status }),
      ...(priority && { priority }),
      ...(dueDate !== undefined && { dueDate }),
      ...(isCompletingTask && { completedAt: new Date() }),
      ...(completedAt !== undefined && { completedAt }),
      ...(estimatedTime !== undefined && { estimatedTime }),
      ...(attachments && { attachments }),
      ...(recurrence && { recurrence }),
      ...(categoryId !== undefined && { categoryId }),
      ...(assignedToId !== undefined && { assignedToId }),
      ...(parentTaskId !== undefined && { parentTaskId })
    });
    
    // Create notification for assignee if assigned to a new user
    if (assignedToId && assignedToId !== task.assignedToId) {
      await Notification.create({
        type: 'task_assigned',
        message: `You have been assigned to task: ${task.title}`,
        userId: assignedToId,
        taskId: task.id
      });
    }
    
    // Create notification for task update
    if (task.assignedToId && task.assignedToId !== req.user.id) {
      await Notification.create({
        type: 'task_updated',
        message: `Task "${task.title}" has been updated`,
        userId: task.assignedToId,
        taskId: task.id
      });
    }
    
    // Create notification for task completion
    if (isCompletingTask && task.createdById !== req.user.id) {
      await Notification.create({
        type: 'task_completed',
        message: `Task "${task.title}" has been completed`,
        userId: task.createdById,
        taskId: task.id
      });
    }
    
    // Log activity
    await UserActivity.create({
      userId: req.user.id,
      action: 'task_updated',
      resourceType: 'task',
      resourceId: task.id,
      details: { taskId: task.id },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });
    
    // Return updated task with associations
    const updatedTask = await Task.findByPk(id, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'email', 'avatarUrl']
        },
        {
          model: User,
          as: 'assignee',
          attributes: ['id', 'username', 'email', 'avatarUrl']
        },
        {
          model: Category,
          as: 'category'
        }
      ]
    });
    
    res.status(200).json({
      status: 'success',
      data: {
        task: updatedTask
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete task
 * @route DELETE /api/tasks/:id
 */
const deleteTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Find task
    const task = await Task.findByPk(id);
    if (!task) {
      throw new ApiError('Task not found', 404);
    }
    
    // Check if user has permission to delete
    if (task.createdById !== req.user.id && req.user.role !== 'admin') {
      throw new ApiError('Not authorized to delete this task', 403);
    }
    
    // Delete task
    await task.destroy();
    
    // Log activity
    await UserActivity.create({
      userId: req.user.id,
      action: 'task_deleted',
      resourceType: 'task',
      resourceId: id,
      details: { taskId: id },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });
    
    res.status(200).json({
      status: 'success',
      message: 'Task deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createTask,
  getAllTasks,
  getTaskById,
  updateTask,
  deleteTask
};
