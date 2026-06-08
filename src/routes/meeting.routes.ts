/**
 * Meeting Routes
 * All routes require JWT authentication.
 *
 * POST   /api/meetings
 * GET    /api/meetings
 * GET    /api/meetings/:id
 * PUT    /api/meetings/:id
 * DELETE /api/meetings/:id
 * POST   /api/meetings/:id/analyze
 */

import { Router } from 'express';
import { meetingController } from '../controllers/meetingController';
import { analysisController } from '../controllers/analysisController';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { analysisRateLimiter } from '../middleware/rateLimiter';
import {
  createMeetingSchema,
  updateMeetingSchema,
  meetingQuerySchema,
  idParamSchema,
} from '../validators/meeting.validator';

const router = Router();

// All meeting routes require authentication
router.use(authenticate);

/**
 * @openapi
 * /api/meetings:
 *   post:
 *     tags: [Meetings]
 *     summary: Create a new meeting
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/',
  validate(createMeetingSchema),
  meetingController.create.bind(meetingController)
);

/**
 * @openapi
 * /api/meetings:
 *   get:
 *     tags: [Meetings]
 *     summary: List all meetings (paginated)
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/',
  validate(meetingQuerySchema, 'query'),
  meetingController.list.bind(meetingController)
);

/**
 * @openapi
 * /api/meetings/{id}:
 *   get:
 *     tags: [Meetings]
 *     summary: Get a meeting by ID
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/:id',
  validate(idParamSchema, 'params'),
  meetingController.getById.bind(meetingController)
);

/**
 * @openapi
 * /api/meetings/{id}:
 *   put:
 *     tags: [Meetings]
 *     summary: Update a meeting
 *     security:
 *       - bearerAuth: []
 */
router.put(
  '/:id',
  validate(idParamSchema, 'params'),
  validate(updateMeetingSchema),
  meetingController.update.bind(meetingController)
);

/**
 * @openapi
 * /api/meetings/{id}:
 *   delete:
 *     tags: [Meetings]
 *     summary: Delete a meeting
 *     security:
 *       - bearerAuth: []
 */
router.delete(
  '/:id',
  validate(idParamSchema, 'params'),
  meetingController.remove.bind(meetingController)
);

/**
 * @openapi
 * /api/meetings/{id}/analyze:
 *   post:
 *     tags: [AI Analysis]
 *     summary: Analyze a meeting transcript with Gemini AI
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/:id/analyze',
  validate(idParamSchema, 'params'),
  analysisRateLimiter,
  analysisController.analyze.bind(analysisController)
);

export default router;
