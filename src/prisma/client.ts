/**
 * Prisma client singleton.
 * Ensures only one PrismaClient instance is created across the application.
 */

import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger';

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

// Prevent multiple instances in development hot-reloading
const prisma =
  global.__prisma ||
  new PrismaClient({
    log: [
      { emit: 'event', level: 'query' },
      { emit: 'event', level: 'error' },
      { emit: 'event', level: 'warn' },
    ],
  });

if (process.env.NODE_ENV !== 'production') {
  global.__prisma = prisma;
}

// Log slow queries in development
if (process.env.NODE_ENV === 'development') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (prisma as any).$on('query', (e: any) => {
    if (e.duration > 500) {
      logger.warn('Slow query detected', {
        query: e.query,
        duration: `${e.duration}ms`,
      });
    }
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(prisma as any).$on('error', (e: any) => {
  logger.error('Prisma error', { message: e.message });
});

export default prisma;
