/**
 * Redis caching utility using ioredis.
 * Gracefully degrades — if Redis is unavailable, cache operations become no-ops.
 */

import Redis from 'ioredis';
import logger from './logger';

let redis: Redis | null = null;

/**
 * Initialize Redis connection (called at app startup).
 */
export const initRedis = (): void => {
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    logger.warn('REDIS_URL not set — caching disabled');
    return;
  }

  try {
    redis = new Redis(redisUrl, {
      lazyConnect: true,
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        if (times > 5) return null; // Stop retrying after 5 attempts
        return Math.min(times * 100, 3000);
      },
    });

    redis.on('connect', () => logger.info('Redis connected'));
    redis.on('error', (err) => logger.warn('Redis error — falling back to no-cache', { err: err.message }));
    redis.on('close', () => logger.warn('Redis connection closed'));

    redis.connect().catch((err) => {
      logger.warn('Redis initial connection failed — caching disabled', { err: err.message });
      redis = null;
    });
  } catch (err) {
    logger.warn('Redis initialization failed', { err });
    redis = null;
  }
};

const DEFAULT_TTL = parseInt(process.env.REDIS_TTL_SECONDS || '300', 10);

/**
 * Get a cached value. Returns null on miss or Redis unavailable.
 */
export const cacheGet = async <T>(key: string): Promise<T | null> => {
  if (!redis) return null;
  try {
    const value = await redis.get(key);
    return value ? (JSON.parse(value) as T) : null;
  } catch {
    return null;
  }
};

/**
 * Set a cached value with optional TTL (seconds).
 */
export const cacheSet = async <T>(key: string, value: T, ttl = DEFAULT_TTL): Promise<void> => {
  if (!redis) return;
  try {
    await redis.set(key, JSON.stringify(value), 'EX', ttl);
  } catch {
    // Fail silently — cache is best-effort
  }
};

/**
 * Delete a cached key.
 */
export const cacheDel = async (key: string): Promise<void> => {
  if (!redis) return;
  try {
    await redis.del(key);
  } catch {
    // Fail silently
  }
};

/**
 * Delete all keys matching a pattern.
 */
export const cacheDelPattern = async (pattern: string): Promise<void> => {
  if (!redis) return;
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch {
    // Fail silently
  }
};

/**
 * Cache key builders.
 */
export const CacheKeys = {
  meeting: (id: string) => `meeting:${id}`,
  meetingList: (userId: string, page: number, limit: number) =>
    `meetings:user:${userId}:page:${page}:limit:${limit}`,
  actionItem: (id: string) => `action-item:${id}`,
  actionItemList: (userId: string) => `action-items:user:${userId}:*`,
  analysis: (meetingId: string) => `analysis:meeting:${meetingId}`,
};
