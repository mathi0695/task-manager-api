const Joi = require('joi');

// User validation schemas
const userRegisterSchema = Joi.object({
  username: Joi.string().min(3).max(30).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).max(100).required(),
  firstName: Joi.string().allow('', null),
  lastName: Joi.string().allow('', null),
  avatarUrl: Joi.string().uri().allow('', null)
});

const userLoginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

const userUpdateSchema = Joi.object({
  username: Joi.string().min(3).max(30),
  email: Joi.string().email(),
  firstName: Joi.string().allow('', null),
  lastName: Joi.string().allow('', null),
  avatarUrl: Joi.string().uri().allow('', null)
});

const passwordUpdateSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().min(6).max(100).required(),
  confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required()
    .messages({ 'any.only': 'Passwords do not match' })
});

const passwordResetRequestSchema = Joi.object({
  email: Joi.string().email().required()
});

const passwordResetSchema = Joi.object({
  token: Joi.string().required(),
  newPassword: Joi.string().min(6).max(100).required(),
  confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required()
    .messages({ 'any.only': 'Passwords do not match' })
});

// Task validation schemas
const taskCreateSchema = Joi.object({
  title: Joi.string().min(2).max(100).required(),
  description: Joi.string().allow('', null),
  status: Joi.string().valid('not_started', 'in_progress', 'completed').default('not_started'),
  priority: Joi.string().valid('low', 'medium', 'high').default('medium'),
  dueDate: Joi.date().iso().allow(null),
  estimatedTime: Joi.number().integer().min(0).allow(null),
  attachments: Joi.array().items(Joi.string()).default([]),
  recurrence: Joi.string().valid('none', 'daily', 'weekly', 'monthly').default('none'),
  categoryId: Joi.string().uuid().allow(null),
  assignedToId: Joi.string().uuid().allow(null),
  parentTaskId: Joi.string().uuid().allow(null)
});

const taskUpdateSchema = Joi.object({
  title: Joi.string().min(2).max(100),
  description: Joi.string().allow('', null),
  status: Joi.string().valid('not_started', 'in_progress', 'completed'),
  priority: Joi.string().valid('low', 'medium', 'high'),
  dueDate: Joi.date().iso().allow(null),
  completedAt: Joi.date().iso().allow(null),
  estimatedTime: Joi.number().integer().min(0).allow(null),
  attachments: Joi.array().items(Joi.string()),
  recurrence: Joi.string().valid('none', 'daily', 'weekly', 'monthly'),
  categoryId: Joi.string().uuid().allow(null),
  assignedToId: Joi.string().uuid().allow(null),
  parentTaskId: Joi.string().uuid().allow(null)
});

const taskQuerySchema = Joi.object({
  status: Joi.string().valid('not_started', 'in_progress', 'completed'),
  priority: Joi.string().valid('low', 'medium', 'high'),
  categoryId: Joi.string().uuid(),
  assignedToId: Joi.string().uuid(),
  createdById: Joi.string().uuid(),
  dueDateFrom: Joi.date().iso(),
  dueDateTo: Joi.date().iso(),
  search: Joi.string(),
  sortBy: Joi.string().valid('title', 'dueDate', 'priority', 'status', 'createdAt', 'updatedAt'),
  sortOrder: Joi.string().valid('asc', 'desc').default('asc'),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10)
});

// Category validation schemas
const categoryCreateSchema = Joi.object({
  name: Joi.string().min(2).max(50).required(),
  description: Joi.string().allow('', null),
  color: Joi.string().regex(/^#[0-9A-F]{6}$/i).allow('', null),
  icon: Joi.string().allow('', null)
});

const categoryUpdateSchema = Joi.object({
  name: Joi.string().min(2).max(50),
  description: Joi.string().allow('', null),
  color: Joi.string().regex(/^#[0-9A-F]{6}$/i).allow('', null),
  icon: Joi.string().allow('', null),
  isActive: Joi.boolean()
});

// Comment validation schemas
const commentCreateSchema = Joi.object({
  content: Joi.string().required(),
  taskId: Joi.string().uuid().required(),
  parentCommentId: Joi.string().uuid().allow(null)
});

const commentUpdateSchema = Joi.object({
  content: Joi.string().required()
});

// Notification validation schemas
const notificationUpdateSchema = Joi.object({
  isRead: Joi.boolean().required()
});

// Refresh token validation schema
const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().required()
});

module.exports = {
  userRegisterSchema,
  userLoginSchema,
  userUpdateSchema,
  passwordUpdateSchema,
  passwordResetRequestSchema,
  passwordResetSchema,
  taskCreateSchema,
  taskUpdateSchema,
  taskQuerySchema,
  categoryCreateSchema,
  categoryUpdateSchema,
  commentCreateSchema,
  commentUpdateSchema,
  notificationUpdateSchema,
  refreshTokenSchema
};
