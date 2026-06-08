/**
 * Trace ID Middleware
 * Generates a unique trace ID for every incoming request.
 * The ID is either forwarded from the X-Trace-Id header (for upstream tracing)
 * or generated fresh using UUID v4.
 */

import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

// Extend Express Request type to carry traceId
declare global {
  namespace Express {
    interface Request {
      traceId: string;
    }
  }
}

export const traceIdMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  // Use upstream trace ID if provided (useful in microservice chains)
  const traceId = (req.headers['x-trace-id'] as string) || uuidv4();

  req.traceId = traceId;

  // Return the trace ID in the response header for client-side correlation
  res.setHeader('X-Trace-Id', traceId);

  next();
};
