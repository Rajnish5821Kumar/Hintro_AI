/**
 * Async Handler Utility
 * Wraps async route handlers to automatically catch errors and pass them to next().
 * Eliminates repetitive try/catch blocks in controllers.
 */

import { Request, Response, NextFunction, RequestHandler } from 'express';

type AsyncRequestHandler = (req: Request, res: Response, next: NextFunction) => Promise<void>;

/**
 * Wraps an async Express handler and forwards any thrown errors to next().
 */
export const asyncHandler =
  (fn: AsyncRequestHandler): RequestHandler =>
  (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
