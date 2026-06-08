/**
 * Integration Tests — Auth Endpoints
 * Tests the full request/response cycle via Supertest.
 *
 * Requires a test database (DATABASE_URL_TEST in .env).
 * Uses separate DB to avoid polluting production data.
 */

import request from 'supertest';
import app from '../../app';
import prisma from '../../prisma/client';

// Use a unique email per test run to avoid conflicts
const timestamp = Date.now();
const testEmail = `test-${timestamp}@example.com`;
const testPassword = 'TestPass123';

describe('Auth Integration Tests', () => {
  afterAll(async () => {
    // Clean up test user
    await prisma.user.deleteMany({ where: { email: testEmail } });
    await prisma.$disconnect();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: testEmail,
          name: 'Test User',
          password: testPassword,
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.user.email).toBe(testEmail);
      expect(response.body.data.user).not.toHaveProperty('passwordHash');
      expect(response.body.traceId).toBeDefined();
    });

    it('should return 409 for duplicate email', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: testEmail,
          name: 'Test User 2',
          password: testPassword,
        });

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('CONFLICT');
    });

    it('should return 400 for invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'not-an-email',
          name: 'Test User',
          password: testPassword,
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for weak password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: `other-${timestamp}@example.com`,
          name: 'Test User',
          password: 'weak',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testEmail,
          password: testPassword,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();
    });

    it('should return 401 for wrong password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testEmail,
          password: 'WrongPassword123',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should return 401 for non-existent user', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nobody@example.com',
          password: testPassword,
        });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app).get('/health');
      expect(response.status).toBeLessThan(600);
      expect(response.body.status).toBeDefined();
    });
  });
});
