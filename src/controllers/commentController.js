const { Comment, Task, User, Notification, UserActivity } = require('../models');
const { ApiError } = require('../middlewares/errorHandler');

/**
 * Create a new comment
 * @route POST /api/comments
 */
const createComment = async (req, res, next) => {
  try {
    const { content, taskId, parentCommentId } = req.body;
    
    // Validate task
    const task = await Task.findByPk(taskId);
    if (!task) {
      throw new ApiError('Task not found', 404);
    }
    
    // Validate parent comment if provided
    if (parentCommentId) {
      const parentComment = await Comment.findOne({
        where: {
          id: parentCommentId,
          taskId
        }
      });
      
      if (!parentComment) {
        throw new ApiError('Parent comment not found', 404);
      }
    }
    
    // Create comment
    const comment = await Comment.create({
      content,
      taskId,
      userId: req.user.id,
      parentCommentId
    });
    
    // Create notification for task creator if not the commenter
    if (task.createdById !== req.user.id) {
      await Notification.create({
        type: 'comment_added',
        message: `New comment on your task: ${task.title}`,
        userId: task.createdById,
        taskId,
        commentId: comment.id
      });
    }
    
    // Create notification for task assignee if not the commenter
    if (task.assignedToId && task.assignedToId !== req.user.id && task.assignedToId !== task.createdById) {
      await Notification.create({
        type: 'comment_added',
        message: `New comment on task: ${task.title}`,
        userId: task.assignedToId,
        taskId,
        commentId: comment.id
      });
    }
    
    // Create notification for parent comment author if not the commenter
    if (parentCommentId) {
      const parentComment = await Comment.findByPk(parentCommentId);
      if (parentComment && parentComment.userId !== req.user.id) {
        await Notification.create({
          type: 'comment_added',
          message: `Someone replied to your comment on task: ${task.title}`,
          userId: parentComment.userId,
          taskId,
          commentId: comment.id
        });
      }
    }
    
    // Log activity
    await UserActivity.create({
      userId: req.user.id,
      action: 'comment_created',
      resourceType: 'comment',
      resourceId: comment.id,
      details: { commentId: comment.id, taskId },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });
    
    // Return created comment with associations
    const createdComment = await Comment.findByPk(comment.id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'email', 'avatarUrl']
        }
      ]
    });
    
    res.status(201).json({
      status: 'success',
      data: {
        comment: createdComment
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get comments for a task
 * @route GET /api/comments
 */
const getComments = async (req, res, next) => {
  try {
    const { taskId } = req.query;
    
    if (!taskId) {
      throw new ApiError('Task ID is required', 400);
    }
    
    // Validate task
    const task = await Task.findByPk(taskId);
    if (!task) {
      throw new ApiError('Task not found', 404);
    }
    
    // Get comments
    const comments = await Comment.findAll({
      where: { taskId },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'email', 'avatarUrl']
        },
        {
          model: Comment,
          as: 'replies',
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'username', 'email', 'avatarUrl']
            }
          ]
        }
      ],
      order: [['createdAt', 'ASC']]
    });
    
    res.status(200).json({
      status: 'success',
      data: {
        comments
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update comment
 * @route PATCH /api/comments/:id
 */
const updateComment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    
    // Find comment
    const comment = await Comment.findByPk(id);
    if (!comment) {
      throw new ApiError('Comment not found', 404);
    }
    
    // Check if user has permission to update
    if (comment.userId !== req.user.id && req.user.role !== 'admin') {
      throw new ApiError('Not authorized to update this comment', 403);
    }
    
    // Update comment
    await comment.update({ content });
    
    // Log activity
    await UserActivity.create({
      userId: req.user.id,
      action: 'comment_updated',
      resourceType: 'comment',
      resourceId: comment.id,
      details: { commentId: comment.id },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });
    
    // Return updated comment with associations
    const updatedComment = await Comment.findByPk(id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'email', 'avatarUrl']
        }
      ]
    });
    
    res.status(200).json({
      status: 'success',
      data: {
        comment: updatedComment
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete comment
 * @route DELETE /api/comments/:id
 */
const deleteComment = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Find comment
    const comment = await Comment.findByPk(id);
    if (!comment) {
      throw new ApiError('Comment not found', 404);
    }
    
    // Check if user has permission to delete
    if (comment.userId !== req.user.id && req.user.role !== 'admin') {
      throw new ApiError('Not authorized to delete this comment', 403);
    }
    
    // Delete comment
    await comment.destroy();
    
    // Log activity
    await UserActivity.create({
      userId: req.user.id,
      action: 'comment_deleted',
      resourceType: 'comment',
      resourceId: id,
      details: { commentId: id },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });
    
    res.status(200).json({
      status: 'success',
      message: 'Comment deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createComment,
  getComments,
  updateComment,
  deleteComment
};
