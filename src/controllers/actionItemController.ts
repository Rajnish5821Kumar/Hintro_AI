/**
 * Action Item Controller
 * Handles HTTP requests for action item management endpoints.
 */

import { Request, Response, NextFunction } from 'express';
import { actionItemService } from '../services/actionItemService';
import { sendSuccess } from '../utils/response';
import { ActionItemStatus } from '@prisma/client';

export class ActionItemController {
  /**
   * POST /api/action-items
   */
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const item = await actionItemService.createActionItem(req.body, req.user!.id);
      sendSuccess(res, item, 201, req.traceId);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/action-items
   */
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await actionItemService.getActionItems({
        userId: req.user!.id,
        page: Number(req.query.page) || 1,
        limit: Number(req.query.limit) || 10,
        status: req.query.status as ActionItemStatus | undefined,
        assignee: typeof req.query.assignee === 'string' ? req.query.assignee : undefined,
        meetingId: typeof req.query.meetingId === 'string' ? req.query.meetingId : undefined,
      });
      sendSuccess(res, result, 200, req.traceId);
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH /api/action-items/:id/status
   */
  async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const item = await actionItemService.updateStatus(
        String(req.params.id ?? ''),
        req.body.status as ActionItemStatus,
        req.user!.id
      );
      sendSuccess(res, item, 200, req.traceId);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/action-items/overdue
   */
  async getOverdue(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await actionItemService.getOverdueItems();
      sendSuccess(res, result, 200, req.traceId);
    } catch (err) {
      next(err);
    }
  }
}

export const actionItemController = new ActionItemController();
