const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class Task extends Model {}

Task.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [2, 100]
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('not_started', 'in_progress', 'completed'),
    defaultValue: 'not_started'
  },
  priority: {
    type: DataTypes.ENUM('low', 'medium', 'high'),
    defaultValue: 'medium'
  },
  dueDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  completedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  estimatedTime: {
    type: DataTypes.INTEGER, // in minutes
    allowNull: true
  },
  attachments: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  },
  recurrence: {
    type: DataTypes.ENUM('none', 'daily', 'weekly', 'monthly'),
    defaultValue: 'none'
  },
  categoryId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'categories',
      key: 'id'
    }
  },
  createdById: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  assignedToId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  parentTaskId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'tasks',
      key: 'id'
    }
  }
}, {
  sequelize,
  modelName: 'Task',
  tableName: 'tasks',
  timestamps: true,
  indexes: [
    {
      fields: ['status']
    },
    {
      fields: ['priority']
    },
    {
      fields: ['dueDate']
    },
    {
      fields: ['categoryId']
    },
    {
      fields: ['createdById']
    },
    {
      fields: ['assignedToId']
    }
  ]
});

module.exports = Task;
