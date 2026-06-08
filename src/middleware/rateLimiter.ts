/**
 * Rate Limiter Middleware
 * Uses express-rate-limit to prevent abuse.
 * Separate limiters for auth endpoints (stricter) and general API.
 */

import rateLimit from 'express-rate-limit';
import { sendError } from '../utils/response';

// ── General API Rate Limiter ──────────────────────────────────
export const apiRateLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again later',
  handler: (req, res) => {
    sendError(
      res,
      429,
      'RATE_LIMIT_EXCEEDED',
      'Too many requests from this IP, please try again after 15 minutes',
      req.traceId
    );
  },
});

// ── Auth Rate Limiter (stricter) ──────────────────────────────
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Only 10 login/register attempts per window
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many authentication attempts, please try again later',
  handler: (req, res) => {
    sendError(
      res,
      429,
      'AUTH_RATE_LIMIT_EXCEEDED',
      'Too many authentication attempts. Please wait 15 minutes before trying again.',
      req.traceId
    );
  },
});

// ── AI Analysis Rate Limiter (expensive Gemini calls) ─────────
export const analysisRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // Max 5 analysis requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    sendError(
      res,
      429,
      'ANALYSIS_RATE_LIMIT_EXCEEDED',
      'Too many analysis requests. AI analysis is limited to 5 requests per minute.',
      req.traceId
    );
  },
});
