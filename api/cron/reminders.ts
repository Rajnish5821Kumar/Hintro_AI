/**
 * Vercel Cron Job Handler — Reminder Job
 * Called by Vercel's built-in cron scheduler every hour.
 * This replaces node-cron in the serverless environment.
 *
 * Configure in vercel.json under "crons" key.
 */

import { Request, Response } from 'express';
import { reminderService } from '../../src/services/reminderService';
import { initGemini } from '../../src/ai/geminiClient';
import { initRedis } from '../../src/utils/cache';
import prisma from '../../src/prisma/client';
import logger from '../../src/utils/logger';

// Initialize on cold start
let initialized = false;
const init = async () => {
  if (initialized) return;
  await prisma.$connect();
  initRedis();
  initGemini();
  initialized = true;
};

export default async function handler(req: Request, res: Response) {
  // Vercel cron requests come as GET; protect with a secret header
  const authHeader = req.headers.authorization;
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    await init();
    logger.info('Vercel cron: running reminder job');

    const result = await reminderService.processReminders();

    logger.info('Vercel cron: reminder job complete', result);
    res.status(200).json({ success: true, result });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error('Vercel cron: reminder job failed', { err: message });
    res.status(500).json({ success: false, error: message });
  }
}
