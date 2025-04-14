const { User } = require('../../../models');
const bcrypt = require('bcrypt');

describe('User Model', () => {
  let userData;

  beforeEach(() => {
    userData = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      firstName: 'Test',
      lastName: 'User',
      role: 'user'
    };
  });

  it('should create a user successfully', async () => {
    const user = await User.create(userData);
    
    expect(user).toBeDefined();
    expect(user.id).toBeDefined();
    expect(user.username).toBe(userData.username);
    expect(user.email).toBe(userData.email);
    expect(user.firstName).toBe(userData.firstName);
    expect(user.lastName).toBe(userData.lastName);
    expect(user.role).toBe(userData.role);
    expect(user.isActive).toBe(true);
    
    // Password should be hashed
    expect(user.password).not.toBe(userData.password);
  });

  it('should hash the password before saving', async () => {
    const user = await User.create(userData);
    
    // Verify that the password is hashed
    const isPasswordValid = await bcrypt.compare(userData.password, user.password);
    expect(isPasswordValid).toBe(true);
  });

  it('should hash the password when updating', async () => {
    const user = await User.create(userData);
    const newPassword = 'newpassword123';
    
    await user.update({ password: newPassword });
    
    // Verify that the new password is hashed
    const isPasswordValid = await bcrypt.compare(newPassword, user.password);
    expect(isPasswordValid).toBe(true);
  });

  it('should compare password correctly', async () => {
    const user = await User.create(userData);
    
    // Correct password
    const isPasswordValid = await user.comparePassword(userData.password);
    expect(isPasswordValid).toBe(true);
    
    // Incorrect password
    const isInvalidPasswordValid = await user.comparePassword('wrongpassword');
    expect(isInvalidPasswordValid).toBe(false);
  });

  it('should not allow duplicate username', async () => {
    await User.create(userData);
    
    // Try to create another user with the same username
    await expect(User.create({
      ...userData,
      email: 'another@example.com'
    })).rejects.toThrow();
  });

  it('should not allow duplicate email', async () => {
    await User.create(userData);
    
    // Try to create another user with the same email
    await expect(User.create({
      ...userData,
      username: 'anotheruser'
    })).rejects.toThrow();
  });

  it('should validate email format', async () => {
    // Try to create a user with invalid email
    await expect(User.create({
      ...userData,
      email: 'invalid-email'
    })).rejects.toThrow();
  });

  it('should validate username length', async () => {
    // Try to create a user with too short username
    await expect(User.create({
      ...userData,
      username: 'ab'
    })).rejects.toThrow();
    
    // Try to create a user with too long username
    await expect(User.create({
      ...userData,
      username: 'a'.repeat(31)
    })).rejects.toThrow();
  });

  it('should validate password length', async () => {
    // Try to create a user with too short password
    await expect(User.create({
      ...userData,
      password: 'short'
    })).rejects.toThrow();
    
    // Try to create a user with too long password
    await expect(User.create({
      ...userData,
      password: 'a'.repeat(101)
    })).rejects.toThrow();
  });
});
