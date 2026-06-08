/**
 * Reminder Service
 * Orchestrates the full reminder workflow:
 *   1. Find overdue items
 *   2. Send Telegram notifications
 *   3. Record delivery history
 *   4. Update reminder counts
 */

import { ActionItem, DeliveryStatus } from '@prisma/client';
import { overdueService } from './overdueService';
import { actionItemRepository } from '../repositories/actionItemRepository';
import { reminderRepository } from '../repositories/reminderRepository';
import { telegramService } from '../integrations/telegram';
import { createLogger } from '../utils/logger';

export interface ReminderRunResult {
  processed: number;
  sent: number;
  failed: number;
  errors: string[];
}

export class ReminderService {
  private readonly log = createLogger();

  /**
   * Main reminder job:
   * - Fetches all overdue items
   * - Sends a Telegram notification for each
   * - Records every attempt in ReminderHistory
   * - Increments the reminderCount on successful send
   */
  async processReminders(): Promise<ReminderRunResult> {
    this.log.info('Starting reminder processing run');

    const { items } = await overdueService.getOverdueItems();

    const result: ReminderRunResult = {
      processed: items.length,
      sent: 0,
      failed: 0,
      errors: [],
    };

    if (items.length === 0) {
      this.log.info('No overdue items found — skipping');
      return result;
    }

    // Process each overdue item
    const promises = items.map((item) => this.sendReminderForItem(item, result));
    await Promise.allSettled(promises);

    this.log.info('Reminder run complete', {
      processed: result.processed,
      sent: result.sent,
      failed: result.failed,
    });

    return result;
  }

  /**
   * Send a reminder for a single action item.
   */
  private async sendReminderForItem(
    item: ActionItem,
    result: ReminderRunResult
  ): Promise<void> {
    try {
      const chatId = item.telegramChatId || process.env.TELEGRAM_CHAT_ID;

      if (!chatId) {
        this.log.warn('No Telegram chat ID for item — skipping', { itemId: item.id });
        result.failed++;
        result.errors.push(`No chat ID for action item ${item.id}`);

        await reminderRepository.create({
          actionItemId: item.id,
          deliveryStatus: DeliveryStatus.FAILED,
          errorMessage: 'No Telegram chat ID configured',
        });
        return;
      }

      const deliveryResult = await telegramService.sendReminder(chatId, item);

      if (deliveryResult.success) {
        await Promise.all([
          reminderRepository.create({
            actionItemId: item.id,
            deliveryStatus: DeliveryStatus.SENT,
          }),
          actionItemRepository.incrementReminderCount(item.id),
        ]);
        result.sent++;
        this.log.info('Reminder sent', { itemId: item.id, assignee: item.assignee });
      } else {
        await reminderRepository.create({
          actionItemId: item.id,
          deliveryStatus: DeliveryStatus.FAILED,
          errorMessage: deliveryResult.error,
        });
        result.failed++;
        result.errors.push(`Failed for item ${item.id}: ${deliveryResult.error}`);
        this.log.warn('Reminder delivery failed', { itemId: item.id, error: deliveryResult.error });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      result.failed++;
      result.errors.push(`Exception for item ${item.id}: ${message}`);

      await reminderRepository.create({
        actionItemId: item.id,
        deliveryStatus: DeliveryStatus.FAILED,
        errorMessage: message,
      }).catch(() => {/* swallow secondary errors */});

      this.log.error('Exception during reminder send', { itemId: item.id, err: message });
    }
  }
}

export const reminderService = new ReminderService();
