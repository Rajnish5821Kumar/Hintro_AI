/**
 * Meeting Controller
 * Handles HTTP requests for meeting CRUD endpoints.
 */

import { Request, Response, NextFunction } from 'express';
import { meetingService } from '../services/meetingService';
import { sendSuccess } from '../utils/response';

/** Safely extract a string param from Express (handles string | string[]) */
const param = (req: Request, key: string): string => String(req.params[key] ?? '');

export class MeetingController {
  /**
   * POST /api/meetings
   */
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const meeting = await meetingService.createMeeting({
        ...req.body,
        createdById: req.user!.id,
      });
      sendSuccess(res, meeting, 201, req.traceId);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/meetings
   */
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await meetingService.getMeetings({
        userId: req.user!.id,
        page: Number(req.query.page) || 1,
        limit: Number(req.query.limit) || 10,
        search: typeof req.query.search === 'string' ? req.query.search : undefined,
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
      });
      sendSuccess(res, result, 200, req.traceId);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/meetings/:id
   */
  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const meeting = await meetingService.getMeetingById(param(req, 'id'), req.user!.id);
      sendSuccess(res, meeting, 200, req.traceId);
    } catch (err) {
      next(err);
    }
  }

  /**
   * PUT /api/meetings/:id
   */
  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const meeting = await meetingService.updateMeeting(
        param(req, 'id'),
        req.user!.id,
        req.body
      );
      sendSuccess(res, meeting, 200, req.traceId);
    } catch (err) {
      next(err);
    }
  }

  /**
   * DELETE /api/meetings/:id
   */
  async remove(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await meetingService.deleteMeeting(param(req, 'id'), req.user!.id);
      sendSuccess(res, { message: 'Meeting deleted successfully' }, 200, req.traceId);
    } catch (err) {
      next(err);
    }
  }
}

export const meetingController = new MeetingController();
