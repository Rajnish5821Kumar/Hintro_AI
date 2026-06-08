/**
 * Server Entry Point
 * Initializes all services, starts the HTTP server, and schedules cron jobs.
 */

import 'dotenv/config';
import http from 'http';
import app from './app';
import logger from './utils/logger';
import { initRedis } from './utils/cache';
import { initGemini } from './ai/geminiClient';
import { startReminderJob, stopReminderJob } from './jobs/reminderJob';
import prisma from './prisma/client';

const PORT = parseInt(process.env.PORT || '3000', 10);

// ── Graceful Shutdown ─────────────────────────────────────────
const shutdown = async (signal: string, server: http.Server): Promise<void> => {
  logger.info(`${signal} received — starting graceful shutdown`);

  // Stop accepting new connections
  server.close(async () => {
    logger.info('HTTP server closed');

    // Stop cron jobs
    stopReminderJob();

    // Disconnect from Prisma
    try {
      await prisma.$disconnect();
      logger.info('Prisma disconnected');
    } catch (err) {
      logger.error('Error disconnecting Prisma', { err });
    }

    logger.info('Graceful shutdown complete');
    process.exit(0);
  });

  // Force shutdown after 30 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 30_000);
};

// ── Application Bootstrap ─────────────────────────────────────
const bootstrap = async (): Promise<void> => {
  try {
    // 1. Connect to database
    logger.info('Connecting to database...');
    await prisma.$connect();
    logger.info('Database connected');

    // 2. Initialize Redis (optional — gracefully degrades)
    initRedis();

    // 3. Initialize Gemini AI client
    initGemini();

    // 4. Start HTTP server
    const server = http.createServer(app);

    server.listen(PORT, () => {
      logger.info('Meeting Intelligence Service started', {
        port: PORT,
        env: process.env.NODE_ENV || 'development',
        docs: `http://localhost:${PORT}/docs`,
        health: `http://localhost:${PORT}/health`,
      });
    });

    // 5. Start scheduled cron jobs
    startReminderJob();

    // 6. Register graceful shutdown handlers
    process.on('SIGTERM', () => shutdown('SIGTERM', server));
    process.on('SIGINT', () => shutdown('SIGINT', server));

    // 7. Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled promise rejection', {
        reason: String(reason),
        promise: String(promise),
      });
    });

    // 8. Handle uncaught exceptions
    process.on('uncaughtException', (err) => {
      logger.error('Uncaught exception — shutting down', {
        message: err.message,
        stack: err.stack,
      });
      process.exit(1);
    });
  } catch (err) {
    logger.error('Failed to start server', {
      message: err instanceof Error ? err.message : String(err),
    });
    process.exit(1);
  }
};

bootstrap();
