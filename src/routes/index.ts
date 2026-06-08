/**
 * Route Index
 * Mounts all route modules onto the Express app.
 */

import { Router } from 'express';
import authRoutes from './auth.routes';
import meetingRoutes from './meeting.routes';
import actionItemRoutes from './actionItem.routes';
import healthRoutes from './health.routes';
import evaluationRoutes from './evaluation.routes';

const router = Router();

// ── Public Routes ─────────────────────────────────────────────
router.use('/auth', authRoutes);

// ── Protected API Routes ──────────────────────────────────────
router.use('/meetings', meetingRoutes);
router.use('/action-items', actionItemRoutes);
router.use('/evaluation', evaluationRoutes);

export { healthRoutes };
export default router;
