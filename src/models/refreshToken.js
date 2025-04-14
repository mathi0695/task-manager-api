const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class RefreshToken extends Model {}

RefreshToken.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  token: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: false
  },
  isRevoked: {
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
  }
}, {
  sequelize,
  modelName: 'RefreshToken',
  tableName: 'refresh_tokens',
  timestamps: true,
  indexes: [
    {
      fields: ['token']
    },
    {
      fields: ['userId']
    }
  ]
});

module.exports = RefreshToken;
