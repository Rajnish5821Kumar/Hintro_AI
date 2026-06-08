/**
 * Health Check Route
 * GET /health
 */

import { Router, Request, Response } from 'express';
import prisma from '../prisma/client';

const router = Router();

/**
 * @openapi
 * /health:
 *   get:
 *     tags: [System]
 *     summary: Health check endpoint
 *     responses:
 *       200:
 *         description: Service is healthy
 */
router.get('/', async (_req: Request, res: Response) => {
  // Optionally check DB connectivity
  let dbStatus = 'UP';
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    dbStatus = 'DOWN';
  }

  const status = dbStatus === 'UP' ? 'UP' : 'DEGRADED';

  res.status(status === 'UP' ? 200 : 503).json({
    status,
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    services: {
      database: dbStatus,
    },
  });
});

export default router;
