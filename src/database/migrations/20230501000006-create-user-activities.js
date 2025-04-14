'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('user_activities', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      action: {
        type: Sequelize.STRING,
        allowNull: false
      },
      details: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      ipAddress: {
        type: Sequelize.STRING,
        allowNull: true
      },
      userAgent: {
        type: Sequelize.STRING,
        allowNull: true
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      resourceType: {
        type: Sequelize.STRING,
        allowNull: true
      },
      resourceId: {
        type: Sequelize.UUID,
        allowNull: true
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Add indexes
    await queryInterface.addIndex('user_activities', ['userId']);
    await queryInterface.addIndex('user_activities', ['action']);
    await queryInterface.addIndex('user_activities', ['resourceType', 'resourceId']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('user_activities');
  }
};
