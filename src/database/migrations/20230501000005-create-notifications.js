'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Create enum type
    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_notifications_type" AS ENUM (
        'task_assigned', 'task_updated', 'task_completed', 'comment_added', 'due_date_reminder'
      );
    `);

    await queryInterface.createTable('notifications', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      type: {
        type: Sequelize.ENUM('task_assigned', 'task_updated', 'task_completed', 'comment_added', 'due_date_reminder'),
        allowNull: false
      },
      message: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      isRead: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
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
      taskId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'tasks',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      commentId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'comments',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
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
    await queryInterface.addIndex('notifications', ['userId']);
    await queryInterface.addIndex('notifications', ['isRead']);
    await queryInterface.addIndex('notifications', ['taskId']);
    await queryInterface.addIndex('notifications', ['commentId']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('notifications');
    await queryInterface.sequelize.query(`
      DROP TYPE IF EXISTS "enum_notifications_type";
    `);
  }
};
