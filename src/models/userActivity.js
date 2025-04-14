const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class UserActivity extends Model {}

UserActivity.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  action: {
    type: DataTypes.STRING,
    allowNull: false
  },
  details: {
    type: DataTypes.JSONB,
    allowNull: true
  },
  ipAddress: {
    type: DataTypes.STRING,
    allowNull: true
  },
  userAgent: {
    type: DataTypes.STRING,
    allowNull: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  resourceType: {
    type: DataTypes.STRING,
    allowNull: true
  },
  resourceId: {
    type: DataTypes.UUID,
    allowNull: true
  }
}, {
  sequelize,
  modelName: 'UserActivity',
  tableName: 'user_activities',
  timestamps: true,
  indexes: [
    {
      fields: ['userId']
    },
    {
      fields: ['action']
    },
    {
      fields: ['resourceType', 'resourceId']
    }
  ]
});

module.exports = UserActivity;
