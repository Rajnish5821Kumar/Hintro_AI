/**
 * Analysis Controller
 * Handles the AI meeting analysis endpoint.
 */

import { Request, Response, NextFunction } from 'express';
import { analysisService } from '../services/analysisService';
import { sendSuccess } from '../utils/response';

export class AnalysisController {
  /**
   * POST /api/meetings/:id/analyze
   */
  async analyze(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const meetingId = String(req.params.id ?? '');
      const analysis = await analysisService.analyzeMeeting(meetingId, req.user!.id);
      sendSuccess(res, analysis, 200, req.traceId);
    } catch (err) {
      next(err);
    }
  }
}

export const analysisController = new AnalysisController();
