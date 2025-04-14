const { Task, Category, User, sequelize } = require('../models');
const { Op } = require('sequelize');

/**
 * Get task statistics for current user
 * @route GET /api/stats/tasks
 */
const getTaskStats = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    // Get task counts by status
    const taskStatusCounts = await Task.findAll({
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      where: {
        [Op.or]: [
          { createdById: userId },
          { assignedToId: userId }
        ]
      },
      group: ['status']
    });
    
    // Get task counts by priority
    const taskPriorityCounts = await Task.findAll({
      attributes: [
        'priority',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      where: {
        [Op.or]: [
          { createdById: userId },
          { assignedToId: userId }
        ]
      },
      group: ['priority']
    });
    
    // Get task counts by category
    const taskCategoryCounts = await Task.findAll({
      attributes: [
        'categoryId',
        [sequelize.fn('COUNT', sequelize.col('Task.id')), 'count']
      ],
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name', 'color']
        }
      ],
      where: {
        [Op.or]: [
          { createdById: userId },
          { assignedToId: userId }
        ],
        categoryId: { [Op.ne]: null }
      },
      group: ['categoryId', 'category.id', 'category.name', 'category.color']
    });
    
    // Get overdue tasks
    const overdueTasks = await Task.findAll({
      attributes: ['id', 'title', 'dueDate', 'priority', 'status'],
      where: {
        [Op.or]: [
          { createdById: userId },
          { assignedToId: userId }
        ],
        status: { [Op.ne]: 'completed' },
        dueDate: { [Op.lt]: new Date() }
      },
      order: [['dueDate', 'ASC']],
      limit: 5
    });
    
    // Get upcoming tasks
    const upcomingTasks = await Task.findAll({
      attributes: ['id', 'title', 'dueDate', 'priority', 'status'],
      where: {
        [Op.or]: [
          { createdById: userId },
          { assignedToId: userId }
        ],
        status: { [Op.ne]: 'completed' },
        dueDate: { 
          [Op.and]: [
            { [Op.gte]: new Date() },
            { [Op.lte]: new Date(new Date().setDate(new Date().getDate() + 7)) }
          ]
        }
      },
      order: [['dueDate', 'ASC']],
      limit: 5
    });
    
    // Get tasks completed per day for the last 7 days
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split('T')[0];
    }).reverse();
    
    const completedTasksPerDay = await Task.findAll({
      attributes: [
        [sequelize.fn('DATE', sequelize.col('completedAt')), 'date'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      where: {
        [Op.or]: [
          { createdById: userId },
          { assignedToId: userId }
        ],
        status: 'completed',
        completedAt: {
          [Op.gte]: new Date(new Date().setDate(new Date().getDate() - 7))
        }
      },
      group: [sequelize.fn('DATE', sequelize.col('completedAt'))],
      order: [[sequelize.fn('DATE', sequelize.col('completedAt')), 'ASC']]
    });
    
    // Format completed tasks per day
    const completedTasksChart = last7Days.map(date => {
      const found = completedTasksPerDay.find(item => item.dataValues.date === date);
      return {
        date,
        count: found ? parseInt(found.dataValues.count) : 0
      };
    });
    
    res.status(200).json({
      status: 'success',
      data: {
        statusCounts: taskStatusCounts.map(item => ({
          status: item.status,
          count: parseInt(item.dataValues.count)
        })),
        priorityCounts: taskPriorityCounts.map(item => ({
          priority: item.priority,
          count: parseInt(item.dataValues.count)
        })),
        categoryCounts: taskCategoryCounts.map(item => ({
          category: item.category,
          count: parseInt(item.dataValues.count)
        })),
        overdueTasks,
        upcomingTasks,
        completedTasksChart
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get productivity statistics for current user
 * @route GET /api/stats/productivity
 */
const getProductivityStats = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    // Get tasks completed per week for the last 4 weeks
    const last4Weeks = Array.from({ length: 4 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (i * 7));
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      return {
        start: new Date(weekStart),
        end: new Date(new Date(weekStart).setDate(weekStart.getDate() + 6))
      };
    }).reverse();
    
    const completedTasksPerWeek = [];
    
    for (const week of last4Weeks) {
      const count = await Task.count({
        where: {
          [Op.or]: [
            { createdById: userId },
            { assignedToId: userId }
          ],
          status: 'completed',
          completedAt: {
            [Op.between]: [week.start, week.end]
          }
        }
      });
      
      completedTasksPerWeek.push({
        weekStart: week.start.toISOString().split('T')[0],
        weekEnd: week.end.toISOString().split('T')[0],
        count
      });
    }
    
    // Get average completion time (in days)
    const tasksWithCompletionTime = await Task.findAll({
      attributes: [
        'id',
        'createdAt',
        'completedAt'
      ],
      where: {
        [Op.or]: [
          { createdById: userId },
          { assignedToId: userId }
        ],
        status: 'completed',
        completedAt: { [Op.ne]: null }
      }
    });
    
    let totalCompletionTime = 0;
    
    tasksWithCompletionTime.forEach(task => {
      const createdAt = new Date(task.createdAt);
      const completedAt = new Date(task.completedAt);
      const completionTime = (completedAt - createdAt) / (1000 * 60 * 60 * 24); // in days
      totalCompletionTime += completionTime;
    });
    
    const averageCompletionTime = tasksWithCompletionTime.length > 0
      ? totalCompletionTime / tasksWithCompletionTime.length
      : 0;
    
    // Get completion rate (completed tasks / total tasks)
    const totalTasks = await Task.count({
      where: {
        [Op.or]: [
          { createdById: userId },
          { assignedToId: userId }
        ]
      }
    });
    
    const completedTasks = await Task.count({
      where: {
        [Op.or]: [
          { createdById: userId },
          { assignedToId: userId }
        ],
        status: 'completed'
      }
    });
    
    const completionRate = totalTasks > 0
      ? (completedTasks / totalTasks) * 100
      : 0;
    
    res.status(200).json({
      status: 'success',
      data: {
        completedTasksPerWeek,
        averageCompletionTime,
        completionRate,
        totalTasks,
        completedTasks
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get project statistics (admin only)
 * @route GET /api/stats/projects
 */
const getProjectStats = async (req, res, next) => {
  try {
    // Get total users
    const totalUsers = await User.count();
    
    // Get total tasks
    const totalTasks = await Task.count();
    
    // Get total categories
    const totalCategories = await Category.count();
    
    // Get tasks by status
    const tasksByStatus = await Task.findAll({
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['status']
    });
    
    // Get most active users (by tasks created)
    const mostActiveUsers = await Task.findAll({
      attributes: [
        'createdById',
        [sequelize.fn('COUNT', sequelize.col('Task.id')), 'count']
      ],
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'email', 'avatarUrl']
        }
      ],
      group: ['createdById', 'creator.id', 'creator.username', 'creator.email', 'creator.avatarUrl'],
      order: [[sequelize.fn('COUNT', sequelize.col('Task.id')), 'DESC']],
      limit: 5
    });
    
    // Get most used categories
    const mostUsedCategories = await Task.findAll({
      attributes: [
        'categoryId',
        [sequelize.fn('COUNT', sequelize.col('Task.id')), 'count']
      ],
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name', 'color']
        }
      ],
      where: {
        categoryId: { [Op.ne]: null }
      },
      group: ['categoryId', 'category.id', 'category.name', 'category.color'],
      order: [[sequelize.fn('COUNT', sequelize.col('Task.id')), 'DESC']],
      limit: 5
    });
    
    res.status(200).json({
      status: 'success',
      data: {
        totalUsers,
        totalTasks,
        totalCategories,
        tasksByStatus: tasksByStatus.map(item => ({
          status: item.status,
          count: parseInt(item.dataValues.count)
        })),
        mostActiveUsers: mostActiveUsers.map(item => ({
          user: item.creator,
          count: parseInt(item.dataValues.count)
        })),
        mostUsedCategories: mostUsedCategories.map(item => ({
          category: item.category,
          count: parseInt(item.dataValues.count)
        }))
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTaskStats,
  getProductivityStats,
  getProjectStats
};
