/**
 * Auth Controller
 * Handles HTTP requests for authentication endpoints.
 */

import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/authService';
import { sendSuccess } from '../utils/response';

export class AuthController {
  /**
   * POST /api/auth/register
   * Register a new user account.
   */
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.register(req.body);

      sendSuccess(
        res,
        {
          user: result.user,
          token: result.token,
          expiresIn: process.env.JWT_EXPIRES_IN || '7d',
        },
        201,
        req.traceId
      );
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/auth/login
   * Authenticate an existing user.
   */
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.login(req.body);

      sendSuccess(
        res,
        {
          user: result.user,
          token: result.token,
          expiresIn: process.env.JWT_EXPIRES_IN || '7d',
        },
        200,
        req.traceId
      );
    } catch (err) {
      next(err);
    }
  }
}

export const authController = new AuthController();
