const request = require('supertest');
const app = require('../../../server');
const { User, RefreshToken } = require('../../../models');

describe('Auth Controller', () => {
  let userData;

  beforeEach(() => {
    userData = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      firstName: 'Test',
      lastName: 'User'
    };
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.status).toBe('success');
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.user.username).toBe(userData.username);
      expect(response.body.data.user.email).toBe(userData.email);
      expect(response.body.data.user.password).toBeUndefined();
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();

      // Verify user was created in database
      const user = await User.findOne({ where: { email: userData.email } });
      expect(user).toBeDefined();
    });

    it('should return error for duplicate email', async () => {
      // Create user first
      await User.create(userData);

      // Try to register with same email
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('Email already in use');
    });

    it('should return error for duplicate username', async () => {
      // Create user first
      await User.create(userData);

      // Try to register with same username but different email
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          ...userData,
          email: 'different@example.com'
        })
        .expect(400);

      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('Username already taken');
    });

    it('should return error for invalid data', async () => {
      // Missing required fields
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser'
        })
        .expect(400);

      expect(response.body.status).toBe('error');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Create a user for login tests
      await User.create(userData);
    });

    it('should login successfully with correct credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: userData.email,
          password: userData.password
        })
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.user.email).toBe(userData.email);
      expect(response.body.data.user.password).toBeUndefined();
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();

      // Verify refresh token was created
      const refreshToken = await RefreshToken.findOne({
        where: { userId: response.body.data.user.id }
      });
      expect(refreshToken).toBeDefined();
    });

    it('should return error for incorrect password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: userData.email,
          password: 'wrongpassword'
        })
        .expect(401);

      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('Invalid email or password');
    });

    it('should return error for non-existent email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: userData.password
        })
        .expect(401);

      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('Invalid email or password');
    });
  });

  // Additional tests for refresh token, logout, password reset, etc. would go here
});
