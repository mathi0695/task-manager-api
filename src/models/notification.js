const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class Notification extends Model {}

Notification.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  type: {
    type: DataTypes.ENUM('task_assigned', 'task_updated', 'task_completed', 'comment_added', 'due_date_reminder'),
    allowNull: false
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  isRead: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  taskId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'tasks',
      key: 'id'
    }
  },
  commentId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'comments',
      key: 'id'
    }
  }
}, {
  sequelize,
  modelName: 'Notification',
  tableName: 'notifications',
  timestamps: true,
  indexes: [
    {
      fields: ['userId']
    },
    {
      fields: ['isRead']
    },
    {
      fields: ['taskId']
    }
  ]
});

module.exports = Notification;
