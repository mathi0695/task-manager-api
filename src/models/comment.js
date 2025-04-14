const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class Comment extends Model {}

Comment.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  taskId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'tasks',
      key: 'id'
    }
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  parentCommentId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'comments',
      key: 'id'
    }
  }
}, {
  sequelize,
  modelName: 'Comment',
  tableName: 'comments',
  timestamps: true,
  indexes: [
    {
      fields: ['taskId']
    },
    {
      fields: ['userId']
    },
    {
      fields: ['parentCommentId']
    }
  ]
});

module.exports = Comment;
