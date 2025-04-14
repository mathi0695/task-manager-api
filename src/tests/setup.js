// Set environment to test
process.env.NODE_ENV = 'test';

// Load environment variables
require('dotenv').config();

// Set test-specific environment variables if not already set
process.env.TEST_DB_NAME = process.env.TEST_DB_NAME || 'task_manager_test';
process.env.TEST_DB_USERNAME = process.env.TEST_DB_USERNAME || 'postgres';
process.env.TEST_DB_PASSWORD = process.env.TEST_DB_PASSWORD || 'postgres';
process.env.TEST_DB_HOST = process.env.TEST_DB_HOST || 'localhost';
process.env.TEST_DB_PORT = process.env.TEST_DB_PORT || '5432';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret';
process.env.REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'test_refresh_token_secret';

// Import database connection
const sequelize = require('../config/database');

// Global setup before all tests
beforeAll(async () => {
  // Sync database (create tables)
  await sequelize.sync({ force: true });
});

// Global teardown after all tests
afterAll(async () => {
  // Close database connection
  await sequelize.close();
});

// Reset database before each test
beforeEach(async () => {
  // Clear all tables
  await sequelize.sync({ force: true });
});
