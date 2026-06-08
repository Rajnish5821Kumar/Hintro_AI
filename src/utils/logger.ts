/**
 * Winston-based structured logger with trace ID support.
 * Every log entry includes timestamp, level, traceId and message.
 */

import winston from 'winston';

const { combine, timestamp, json, colorize, printf, errors } = winston.format;

// ── Custom log format for development ────────────────────────
const devFormat = printf(({ level, message, timestamp, traceId, ...meta }) => {
  const trace = traceId ? ` [trace:${traceId}]` : '';
  const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
  return `${timestamp} ${level}${trace}: ${message}${metaStr}`;
});

// ── Transport configuration ────────────────────────────────────
const transports: winston.transport[] = [
  new winston.transports.Console({
    format:
      process.env.NODE_ENV === 'production'
        ? combine(timestamp(), errors({ stack: true }), json())
        : combine(
            colorize(),
            timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
            errors({ stack: true }),
            devFormat
          ),
  }),
];

// In production also write to files
if (process.env.NODE_ENV === 'production') {
  transports.push(
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: combine(timestamp(), errors({ stack: true }), json()),
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
      format: combine(timestamp(), errors({ stack: true }), json()),
    })
  );
}

// ── Base logger instance ───────────────────────────────────────
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  defaultMeta: { service: 'meeting-intelligence' },
  transports,
});

// ── Child logger factory — attach traceId ─────────────────────
export const createLogger = (traceId?: string) =>
  logger.child({ traceId: traceId || 'no-trace' });

export default logger;
