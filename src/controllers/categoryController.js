const { Category, Task, UserActivity } = require('../models');
const { ApiError } = require('../middlewares/errorHandler');
const { Op } = require('sequelize');

/**
 * Create a new category
 * @route POST /api/categories
 */
const createCategory = async (req, res, next) => {
  try {
    const { name, description, color, icon } = req.body;
    
    // Check if category with same name already exists for this user
    const existingCategory = await Category.findOne({
      where: {
        name,
        userId: req.user.id
      }
    });
    
    if (existingCategory) {
      throw new ApiError('Category with this name already exists', 400);
    }
    
    // Create category
    const category = await Category.create({
      name,
      description,
      color,
      icon,
      userId: req.user.id
    });
    
    // Log activity
    await UserActivity.create({
      userId: req.user.id,
      action: 'category_created',
      resourceType: 'category',
      resourceId: category.id,
      details: { categoryId: category.id },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });
    
    res.status(201).json({
      status: 'success',
      data: {
        category
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all categories for current user
 * @route GET /api/categories
 */
const getAllCategories = async (req, res, next) => {
  try {
    const { search, sortBy = 'name', sortOrder = 'asc' } = req.query;
    
    // Build where conditions
    const whereConditions = {
      userId: req.user.id
    };
    
    // Search filter
    if (search) {
      whereConditions.name = { [Op.iLike]: `%${search}%` };
    }
    
    // Get categories
    const categories = await Category.findAll({
      where: whereConditions,
      order: [[sortBy, sortOrder.toUpperCase()]],
      include: [
        {
          model: Task,
          as: 'tasks',
          attributes: ['id', 'status'],
          required: false
        }
      ]
    });
    
    // Add task counts to each category
    const categoriesWithCounts = categories.map(category => {
      const categoryData = category.toJSON();
      const taskCounts = {
        total: categoryData.tasks.length,
        completed: categoryData.tasks.filter(task => task.status === 'completed').length,
        inProgress: categoryData.tasks.filter(task => task.status === 'in_progress').length,
        notStarted: categoryData.tasks.filter(task => task.status === 'not_started').length
      };
      
      delete categoryData.tasks;
      
      return {
        ...categoryData,
        taskCounts
      };
    });
    
    res.status(200).json({
      status: 'success',
      data: {
        categories: categoriesWithCounts
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get category by ID
 * @route GET /api/categories/:id
 */
const getCategoryById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const category = await Category.findOne({
      where: {
        id,
        userId: req.user.id
      },
      include: [
        {
          model: Task,
          as: 'tasks',
          required: false
        }
      ]
    });
    
    if (!category) {
      throw new ApiError('Category not found', 404);
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        category
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update category
 * @route PATCH /api/categories/:id
 */
const updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, color, icon, isActive } = req.body;
    
    // Find category
    const category = await Category.findOne({
      where: {
        id,
        userId: req.user.id
      }
    });
    
    if (!category) {
      throw new ApiError('Category not found', 404);
    }
    
    // Check if name is being changed and already exists
    if (name && name !== category.name) {
      const existingCategory = await Category.findOne({
        where: {
          name,
          userId: req.user.id,
          id: { [Op.ne]: id }
        }
      });
      
      if (existingCategory) {
        throw new ApiError('Category with this name already exists', 400);
      }
    }
    
    // Update category
    await category.update({
      ...(name && { name }),
      ...(description !== undefined && { description }),
      ...(color !== undefined && { color }),
      ...(icon !== undefined && { icon }),
      ...(isActive !== undefined && { isActive })
    });
    
    // Log activity
    await UserActivity.create({
      userId: req.user.id,
      action: 'category_updated',
      resourceType: 'category',
      resourceId: category.id,
      details: { categoryId: category.id },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });
    
    res.status(200).json({
      status: 'success',
      data: {
        category
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete category
 * @route DELETE /api/categories/:id
 */
const deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Find category
    const category = await Category.findOne({
      where: {
        id,
        userId: req.user.id
      }
    });
    
    if (!category) {
      throw new ApiError('Category not found', 404);
    }
    
    // Check if category has tasks
    const tasksCount = await Task.count({
      where: { categoryId: id }
    });
    
    if (tasksCount > 0) {
      throw new ApiError('Cannot delete category with associated tasks', 400);
    }
    
    // Delete category
    await category.destroy();
    
    // Log activity
    await UserActivity.create({
      userId: req.user.id,
      action: 'category_deleted',
      resourceType: 'category',
      resourceId: id,
      details: { categoryId: id },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });
    
    res.status(200).json({
      status: 'success',
      message: 'Category deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory
};
