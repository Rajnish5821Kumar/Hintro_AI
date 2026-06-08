/**
 * Reminder Cron Job
 * Scheduled task that runs every hour to:
 *   1. Find all overdue action items
 *   2. Send Telegram reminders
 *   3. Store delivery history
 *   4. Update reminder counts
 *
 * Schedule: configurable via REMINDER_CRON_SCHEDULE env variable
 * Default: "0 * * * *" (every hour on the hour)
 */

import cron from 'node-cron';
import { reminderService } from '../services/reminderService';
import logger from '../utils/logger';

let reminderTask: cron.ScheduledTask | null = null;

/**
 * Start the reminder cron job.
 * Called once during server initialization.
 */
export const startReminderJob = (): void => {
  const isEnabled = process.env.REMINDER_JOB_ENABLED !== 'false';
  if (!isEnabled) {
    logger.info('Reminder cron job is disabled (REMINDER_JOB_ENABLED=false)');
    return;
  }

  const schedule = process.env.REMINDER_CRON_SCHEDULE || '0 * * * *';

  if (!cron.validate(schedule)) {
    logger.error('Invalid REMINDER_CRON_SCHEDULE', { schedule });
    return;
  }

  logger.info('Starting reminder cron job', { schedule });

  reminderTask = cron.schedule(schedule, async () => {
    const jobId = `reminder-${Date.now()}`;
    logger.info('Reminder job triggered', { jobId, time: new Date().toISOString() });

    try {
      const result = await reminderService.processReminders();

      logger.info('Reminder job completed', {
        jobId,
        processed: result.processed,
        sent: result.sent,
        failed: result.failed,
      });

      if (result.errors.length > 0) {
        logger.warn('Reminder job had errors', { jobId, errors: result.errors });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      logger.error('Reminder job failed with exception', { jobId, err: message });
    }
  });

  logger.info('Reminder cron job scheduled', { schedule });
};

/**
 * Stop the reminder cron job (for clean shutdown).
 */
export const stopReminderJob = (): void => {
  if (reminderTask) {
    reminderTask.stop();
    reminderTask = null;
    logger.info('Reminder cron job stopped');
  }
};
