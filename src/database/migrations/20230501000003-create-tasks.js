'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Create enum types
    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_tasks_status" AS ENUM ('not_started', 'in_progress', 'completed');
      CREATE TYPE "enum_tasks_priority" AS ENUM ('low', 'medium', 'high');
      CREATE TYPE "enum_tasks_recurrence" AS ENUM ('none', 'daily', 'weekly', 'monthly');
    `);

    await queryInterface.createTable('tasks', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM('not_started', 'in_progress', 'completed'),
        defaultValue: 'not_started'
      },
      priority: {
        type: Sequelize.ENUM('low', 'medium', 'high'),
        defaultValue: 'medium'
      },
      dueDate: {
        type: Sequelize.DATE,
        allowNull: true
      },
      completedAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      estimatedTime: {
        type: Sequelize.INTEGER, // in minutes
        allowNull: true
      },
      attachments: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        defaultValue: []
      },
      recurrence: {
        type: Sequelize.ENUM('none', 'daily', 'weekly', 'monthly'),
        defaultValue: 'none'
      },
      categoryId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'categories',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      createdById: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      assignedToId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      parentTaskId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'tasks',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
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
    await queryInterface.addIndex('tasks', ['status']);
    await queryInterface.addIndex('tasks', ['priority']);
    await queryInterface.addIndex('tasks', ['dueDate']);
    await queryInterface.addIndex('tasks', ['categoryId']);
    await queryInterface.addIndex('tasks', ['createdById']);
    await queryInterface.addIndex('tasks', ['assignedToId']);
    await queryInterface.addIndex('tasks', ['parentTaskId']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('tasks');
    await queryInterface.sequelize.query(`
      DROP TYPE IF EXISTS "enum_tasks_status";
      DROP TYPE IF EXISTS "enum_tasks_priority";
      DROP TYPE IF EXISTS "enum_tasks_recurrence";
    `);
  }
};
