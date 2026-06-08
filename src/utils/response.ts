/**
 * Unified API response builder.
 * Every response from this service is wrapped in a standard envelope.
 *
 * Success:  { traceId, success: true,  data: {...} }
 * Error:    { traceId, success: false, error: { code, message } }
 */

import { Response } from 'express';

// ── Success Response ──────────────────────────────────────────
export interface SuccessResponse<T = unknown> {
  traceId: string;
  success: true;
  data: T;
}

// ── Error Response ────────────────────────────────────────────
export interface ErrorResponse {
  traceId: string;
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

/**
 * Send a successful JSON response.
 */
export const sendSuccess = <T>(
  res: Response,
  data: T,
  statusCode = 200,
  traceId = 'no-trace'
): Response => {
  const response: SuccessResponse<T> = {
    traceId,
    success: true,
    data,
  };
  return res.status(statusCode).json(response);
};

/**
 * Send an error JSON response.
 */
export const sendError = (
  res: Response,
  statusCode: number,
  code: string,
  message: string,
  traceId = 'no-trace',
  details?: unknown
): Response => {
  const response: ErrorResponse = {
    traceId,
    success: false,
    error: {
      code,
      message,
      ...(details !== undefined && { details }),
    },
  };
  return res.status(statusCode).json(response);
};
