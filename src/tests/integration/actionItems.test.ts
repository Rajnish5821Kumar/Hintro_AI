/**
 * Integration Tests — Action Item Endpoints
 */

import request from 'supertest';
import app from '../../app';
import prisma from '../../prisma/client';

const timestamp = Date.now();
const testEmail = `action-items-test-${timestamp}@example.com`;
let authToken: string;
let meetingId: string;
let actionItemId: string;

describe('Action Item Integration Tests', () => {
  beforeAll(async () => {
    // Register
    const reg = await request(app)
      .post('/api/auth/register')
      .send({ email: testEmail, name: 'Action Tester', password: 'TestPass123' });
    authToken = reg.body.data.token;

    // Create meeting
    const mtg = await request(app)
      .post('/api/meetings')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: 'Action Item Test Meeting',
        participants: ['Alice', 'Bob'],
        meetingDate: '2026-06-10T10:00:00.000Z',
      });
    meetingId = mtg.body.data.id;
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: testEmail } });
    await prisma.$disconnect();
  });

  describe('POST /api/action-items', () => {
    it('should create an action item', async () => {
      const response = await request(app)
        .post('/api/action-items')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          task: 'Prepare Release Notes',
          assignee: 'Alice',
          dueDate: '2026-06-15T17:00:00.000Z',
          meetingId,
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.task).toBe('Prepare Release Notes');
      expect(response.body.data.status).toBe('PENDING');

      actionItemId = response.body.data.id;
    });
  });

  describe('GET /api/action-items', () => {
    it('should list action items', async () => {
      const response = await request(app)
        .get('/api/action-items')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.data).toBeInstanceOf(Array);
    });

    it('should filter by status', async () => {
      const response = await request(app)
        .get('/api/action-items?status=PENDING')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      const items = response.body.data.data;
      items.forEach((item: any) => {
        expect(item.status).toBe('PENDING');
      });
    });
  });

  describe('PATCH /api/action-items/:id/status', () => {
    it('should update status to IN_PROGRESS', async () => {
      const response = await request(app)
        .patch(`/api/action-items/${actionItemId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'IN_PROGRESS' });

      expect(response.status).toBe(200);
      expect(response.body.data.status).toBe('IN_PROGRESS');
    });

    it('should return 400 for invalid status', async () => {
      const response = await request(app)
        .patch(`/api/action-items/${actionItemId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'INVALID_STATUS' });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/action-items/overdue', () => {
    it('should return overdue items list', async () => {
      const response = await request(app)
        .get('/api/action-items/overdue')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('items');
      expect(response.body.data).toHaveProperty('total');
    });
  });
});
