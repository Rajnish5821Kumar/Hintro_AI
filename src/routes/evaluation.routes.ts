/**
 * Evaluation Route
 * GET /api/evaluation
 * Returns candidate information for assessment purposes.
 */

import { Router, Request, Response } from 'express';

const router = Router();

/**
 * @openapi
 * /api/evaluation:
 *   get:
 *     tags: [System]
 *     summary: Candidate evaluation info
 *     responses:
 *       200:
 *         description: Evaluation details
 */
router.get('/', (_req: Request, res: Response) => {
  res.status(200).json({
    candidateName: 'Rajnish Kumar',
    email: 'rk2452003@gmail.com',
    repositoryUrl: 'https://github.com/rajnishkumar/meeting-intelligence-service',
    deployedUrl: process.env.DEPLOYED_URL || '',
    externalIntegration: 'Telegram Bot API',
    features: [
      'Authentication (JWT + bcrypt)',
      'Meeting Management (CRUD + Pagination + Search)',
      'AI Analysis (Gemini 2.5 Flash)',
      'Grounded Citations (No Hallucination)',
      'Action Items Management',
      'Overdue Detection',
      'Reminder Scheduler (node-cron)',
      'Telegram Bot Notifications',
      'Redis Caching',
      'Rate Limiting',
      'Swagger / OpenAPI Documentation',
      'Structured Logging (Winston)',
      'Request Trace IDs',
      'Docker Support',
      'CI/CD GitHub Actions',
      'Unit + Integration Tests',
    ],
  });
});

export default router;
