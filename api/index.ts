/**
 * Vercel Serverless Entry Point
 * Exports the Express app for @vercel/node serverless runtime.
 * All routes are handled by the existing Express app.
 */

import 'dotenv/config';
import app from '../src/app';
import { initGemini } from '../src/ai/geminiClient';
import { initRedis } from '../src/utils/cache';
import prisma from '../src/prisma/client';
import logger from '../src/utils/logger';

// Initialize services (runs on cold start)
let initialized = false;

const init = async () => {
  if (initialized) return;
  try {
    await prisma.$connect();
    initRedis();
    initGemini();
    initialized = true;
    logger.info('Vercel serverless: services initialized');
  } catch (err) {
    logger.error('Vercel serverless init error', { err });
  }
};

// Trigger init on first request
init().catch(console.error);

export default app;
