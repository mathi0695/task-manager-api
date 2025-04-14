const sequelize = require('../config/database');
const { User } = require('../models');
const bcrypt = require('bcrypt');

/**
 * Initialize database with admin user
 */
const initDb = async () => {
  try {
    // Sync database
    await sequelize.sync({ alter: true });
    console.log('Database synchronized');

    // Check if admin user exists
    const adminExists = await User.findOne({
      where: { email: 'admin@example.com' }
    });

    if (!adminExists) {
      // Create admin user
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);

      await User.create({
        username: 'admin',
        email: 'admin@example.com',
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin',
        isActive: true
      });

      console.log('Admin user created');
    }

    console.log('Database initialization completed');
  } catch (error) {
    console.error('Database initialization failed:', error);
  }
};

// Run if called directly
if (require.main === module) {
  initDb()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = initDb;
