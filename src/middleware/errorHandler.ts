/**
 * Global Error Handler Middleware
 * Catches all errors thrown anywhere in the request lifecycle.
 * Formats them into the unified API error response format.
 */

import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { AppError } from '../utils/errors';
import { sendError } from '../utils/response';
import { createLogger } from '../utils/logger';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void => {
  const traceId = req.traceId || 'no-trace';
  const log = createLogger(traceId);

  // ── 1. Known application errors ──────────────────────────
  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      log.error('Application error', {
        code: err.code,
        message: err.message,
        stack: err.stack,
      });
    } else {
      log.warn('Client error', {
        code: err.code,
        message: err.message,
        path: req.path,
        method: req.method,
      });
    }

    sendError(res, err.statusCode, err.code, err.message, traceId, err.details);
    return;
  }

  // ── 2. Zod validation errors ──────────────────────────────
  if (err instanceof ZodError) {
    const details = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));

    log.warn('Validation error', { details });
    sendError(res, 400, 'VALIDATION_ERROR', 'Request validation failed', traceId, details);
    return;
  }

  // ── 3. Prisma errors ──────────────────────────────────────
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    log.warn('Prisma known error', { code: err.code, message: err.message });

    switch (err.code) {
      case 'P2002':
        sendError(res, 409, 'CONFLICT', 'A record with this value already exists', traceId);
        return;
      case 'P2025':
        sendError(res, 404, 'NOT_FOUND', 'Record not found', traceId);
        return;
      case 'P2003':
        sendError(res, 400, 'FOREIGN_KEY_VIOLATION', 'Related record not found', traceId);
        return;
      default:
        sendError(res, 400, 'DATABASE_ERROR', 'Database operation failed', traceId);
        return;
    }
  }

  if (err instanceof Prisma.PrismaClientValidationError) {
    log.warn('Prisma validation error', { message: err.message });
    sendError(res, 400, 'DATABASE_VALIDATION_ERROR', 'Invalid data provided', traceId);
    return;
  }

  // ── 4. Unknown errors ─────────────────────────────────────
  log.error('Unhandled error', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  sendError(
    res,
    500,
    'INTERNAL_ERROR',
    process.env.NODE_ENV === 'production'
      ? 'An internal server error occurred'
      : err.message,
    traceId
  );
};
