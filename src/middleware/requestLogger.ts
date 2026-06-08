/**
 * Request Logger Middleware
 * Logs every incoming HTTP request and its response status/duration.
 */

import { Request, Response, NextFunction } from 'express';
import { createLogger } from '../utils/logger';

export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();
  const log = createLogger(req.traceId);

  log.info('Incoming request', {
    method: req.method,
    path: req.path,
    query: req.query,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });

  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - start;
    const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';

    log[level]('Request completed', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userId: req.user?.id,
    });
  });

  next();
};
