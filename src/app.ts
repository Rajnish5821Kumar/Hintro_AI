/**
 * Express Application Setup
 * Configures all middleware, routes, and error handling.
 */

import 'dotenv/config';
import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { traceIdMiddleware } from './middleware/traceId';
import { requestLogger } from './middleware/requestLogger';
import { apiRateLimiter } from './middleware/rateLimiter';
import { errorHandler } from './middleware/errorHandler';
import { setupSwagger } from './docs/swagger';
import apiRoutes, { healthRoutes } from './routes/index';
import { sendError } from './utils/response';

const app: Express = express();

// ── Security Middleware ───────────────────────────────────────
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"], // For Swagger UI
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
  })
);

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Trace-Id'],
    exposedHeaders: ['X-Trace-Id'],
  })
);

// ── Body Parsing ──────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Request Tracing ───────────────────────────────────────────
app.use(traceIdMiddleware);

// ── Request Logging ───────────────────────────────────────────
app.use(requestLogger);

// ── Rate Limiting ─────────────────────────────────────────────
app.use('/api', apiRateLimiter);

// ── API Documentation ─────────────────────────────────────────
setupSwagger(app);

// ── Health Check ──────────────────────────────────────────────
app.use('/health', healthRoutes);

// ── API Routes ────────────────────────────────────────────────
app.use('/api', apiRoutes);

// ── 404 Handler ───────────────────────────────────────────────
app.use((req: Request, res: Response) => {
  sendError(
    res,
    404,
    'NOT_FOUND',
    `Route ${req.method} ${req.path} not found`,
    req.traceId
  );
});

// ── Global Error Handler ──────────────────────────────────────
app.use(errorHandler);

export default app;
