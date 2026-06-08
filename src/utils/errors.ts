/**
 * Custom error classes for structured error handling.
 * All errors extend AppError which carries HTTP status, error code, and traceability info.
 */

// ── Base Application Error ────────────────────────────────────
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;
  public readonly details?: unknown;

  constructor(
    message: string,
    statusCode = 500,
    code = 'INTERNAL_ERROR',
    isOperational = true,
    details?: unknown
  ) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    this.details = details;

    // Capture stack trace (V8-specific)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

// ── 400 Bad Request ───────────────────────────────────────────
export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 400, 'VALIDATION_ERROR', true, details);
  }
}

// ── 401 Unauthorized ─────────────────────────────────────────
export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, 401, 'UNAUTHORIZED', true);
  }
}

// ── 403 Forbidden ────────────────────────────────────────────
export class ForbiddenError extends AppError {
  constructor(message = 'Access denied') {
    super(message, 403, 'FORBIDDEN', true);
  }
}

// ── 404 Not Found ────────────────────────────────────────────
export class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND', true);
  }
}

// ── 409 Conflict ─────────────────────────────────────────────
export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT', true);
  }
}

// ── 429 Too Many Requests ─────────────────────────────────────
export class RateLimitError extends AppError {
  constructor(message = 'Too many requests, please try again later') {
    super(message, 429, 'RATE_LIMIT_EXCEEDED', true);
  }
}

// ── 500 AI Analysis Error ─────────────────────────────────────
export class AIAnalysisError extends AppError {
  constructor(message: string) {
    super(message, 500, 'AI_ANALYSIS_ERROR', true);
  }
}

// ── 503 External Service Error ────────────────────────────────
export class ExternalServiceError extends AppError {
  constructor(service: string, message: string) {
    super(`${service}: ${message}`, 503, 'EXTERNAL_SERVICE_ERROR', true);
  }
}
