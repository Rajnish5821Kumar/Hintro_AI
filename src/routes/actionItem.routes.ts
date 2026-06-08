/**
 * Action Item Routes
 * All routes require JWT authentication.
 *
 * POST   /api/action-items
 * GET    /api/action-items
 * GET    /api/action-items/overdue
 * PATCH  /api/action-items/:id/status
 */

import { Router } from 'express';
import { actionItemController } from '../controllers/actionItemController';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  createActionItemSchema,
  updateStatusSchema,
  actionItemQuerySchema,
  idParamSchema,
} from '../validators/actionItem.validator';

const router = Router();

// All action item routes require authentication
router.use(authenticate);

/**
 * @openapi
 * /api/action-items:
 *   post:
 *     tags: [Action Items]
 *     summary: Create a new action item
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/',
  validate(createActionItemSchema),
  actionItemController.create.bind(actionItemController)
);

/**
 * @openapi
 * /api/action-items:
 *   get:
 *     tags: [Action Items]
 *     summary: List action items with optional filters
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/',
  validate(actionItemQuerySchema, 'query'),
  actionItemController.list.bind(actionItemController)
);

/**
 * @openapi
 * /api/action-items/overdue:
 *   get:
 *     tags: [Action Items]
 *     summary: Get all overdue action items
 *     security:
 *       - bearerAuth: []
 */
// Must be declared BEFORE /:id route to avoid route conflicts
router.get(
  '/overdue',
  actionItemController.getOverdue.bind(actionItemController)
);

/**
 * @openapi
 * /api/action-items/{id}/status:
 *   patch:
 *     tags: [Action Items]
 *     summary: Update the status of an action item
 *     security:
 *       - bearerAuth: []
 */
router.patch(
  '/:id/status',
  validate(idParamSchema, 'params'),
  validate(updateStatusSchema),
  actionItemController.updateStatus.bind(actionItemController)
);

export default router;
