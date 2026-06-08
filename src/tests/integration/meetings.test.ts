/**
 * Integration Tests — Meeting Endpoints
 */

import request from 'supertest';
import app from '../../app';
import prisma from '../../prisma/client';

const timestamp = Date.now();
const testEmail = `meetings-test-${timestamp}@example.com`;
let authToken: string;
let userId: string;
let meetingId: string;

describe('Meeting Integration Tests', () => {
  beforeAll(async () => {
    // Register and login to get token
    const reg = await request(app)
      .post('/api/auth/register')
      .send({ email: testEmail, name: 'Meeting Tester', password: 'TestPass123' });

    authToken = reg.body.data.token;
    userId = reg.body.data.user.id;
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.user.deleteMany({ where: { email: testEmail } });
    await prisma.$disconnect();
  });

  describe('POST /api/meetings', () => {
    it('should create a meeting with transcripts', async () => {
      const response = await request(app)
        .post('/api/meetings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Test Planning Meeting',
          participants: ['Alice', 'Bob'],
          meetingDate: '2026-06-10T10:00:00.000Z',
          transcripts: [
            { speaker: 'Alice', text: 'We should launch next Friday.', timestamp: '00:10', sequence: 0 },
            { speaker: 'Bob', text: 'Agreed. Alice, please prepare release notes.', timestamp: '00:15', sequence: 1 },
          ],
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('Test Planning Meeting');
      expect(response.body.data.transcripts).toHaveLength(2);

      meetingId = response.body.data.id;
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .post('/api/meetings')
        .send({ title: 'No Auth Meeting', participants: ['Alice'], meetingDate: '2026-06-10T10:00:00.000Z' });

      expect(response.status).toBe(401);
    });

    it('should return 400 for missing required fields', async () => {
      const response = await request(app)
        .post('/api/meetings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Missing Participants' });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/meetings', () => {
    it('should list meetings with pagination metadata', async () => {
      const response = await request(app)
        .get('/api/meetings')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('total');
      expect(response.body.data).toHaveProperty('page');
      expect(response.body.data).toHaveProperty('totalPages');
    });

    it('should support search filter', async () => {
      const response = await request(app)
        .get('/api/meetings?search=Planning')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.data.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/meetings/:id', () => {
    it('should get a specific meeting', async () => {
      const response = await request(app)
        .get(`/api/meetings/${meetingId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.id).toBe(meetingId);
    });

    it('should return 404 for non-existent meeting', async () => {
      const response = await request(app)
        .get('/api/meetings/nonexistent-id')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('PUT /api/meetings/:id', () => {
    it('should update meeting title', async () => {
      const response = await request(app)
        .put(`/api/meetings/${meetingId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Updated Planning Meeting' });

      expect(response.status).toBe(200);
      expect(response.body.data.title).toBe('Updated Planning Meeting');
    });
  });

  describe('DELETE /api/meetings/:id', () => {
    it('should delete a meeting', async () => {
      const response = await request(app)
        .delete(`/api/meetings/${meetingId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should return 404 for already deleted meeting', async () => {
      const response = await request(app)
        .get(`/api/meetings/${meetingId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });
  });
});
