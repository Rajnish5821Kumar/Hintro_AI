/**
 * Telegram Bot Integration
 * Sends meeting reminder and overdue notification messages via the Telegram Bot API.
 */

import TelegramBot from 'node-telegram-bot-api';
import { ActionItem } from '@prisma/client';
import logger from '../utils/logger';

export interface DeliveryResult {
  success: boolean;
  messageId?: number;
  error?: string;
}

export class TelegramService {
  private bot: TelegramBot | null = null;
  private readonly log = logger;

  constructor() {
    this.initialize();
  }

  /**
   * Initialize the Telegram bot client.
   * Called once at startup. Gracefully degrades if token is missing.
   */
  private initialize(): void {
    const token = process.env.TELEGRAM_BOT_TOKEN;

    if (!token) {
      this.log.warn('TELEGRAM_BOT_TOKEN not set — Telegram notifications disabled');
      return;
    }

    try {
      // polling: false — we only use the bot to SEND messages, not receive them
      this.bot = new TelegramBot(token, { polling: false });
      this.log.info('Telegram bot initialized');
    } catch (err) {
      this.log.error('Failed to initialize Telegram bot', { err });
    }
  }

  /**
   * Send an overdue reminder message for an action item.
   *
   * Message format:
   * ⚠️ Action Item Reminder
   * Task: Prepare Release Notes
   * Assigned To: Alice
   * Due Date: 2026-05-25
   * Status: OVERDUE
   * Meeting: Q2 Planning
   * Reminder #3
   */
  async sendReminder(chatId: string, item: ActionItem & { meeting?: { title: string } }): Promise<DeliveryResult> {
    if (!this.bot) {
      return {
        success: false,
        error: 'Telegram bot not initialized. Check TELEGRAM_BOT_TOKEN.',
      };
    }

    const dueDate = item.dueDate.toISOString().split('T')[0];
    const reminderCount = item.reminderCount + 1;

    const message = this.formatReminderMessage(item, dueDate, reminderCount);

    try {
      const sent = await this.bot.sendMessage(chatId, message, {
        parse_mode: 'HTML',
      });

      this.log.info('Telegram reminder sent', {
        chatId,
        actionItemId: item.id,
        messageId: sent.message_id,
      });

      return { success: true, messageId: sent.message_id };
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      this.log.error('Telegram message send failed', { chatId, actionItemId: item.id, error });
      return { success: false, error };
    }
  }

  /**
   * Format the reminder message with HTML markup for Telegram.
   */
  private formatReminderMessage(
    item: ActionItem & { meeting?: { title: string } },
    dueDate: string,
    reminderCount: number
  ): string {
    const statusEmoji = item.status === 'IN_PROGRESS' ? '🔄' : '⏳';

    return [
      `⚠️ <b>Action Item Reminder</b>`,
      ``,
      `📋 <b>Task:</b> ${this.escape(item.task)}`,
      `👤 <b>Assigned To:</b> ${this.escape(item.assignee)}`,
      `📅 <b>Due Date:</b> ${dueDate}`,
      `${statusEmoji} <b>Status:</b> OVERDUE`,
      ...(item.meeting ? [`🗓️ <b>Meeting:</b> ${this.escape(item.meeting.title)}`] : []),
      ``,
      `🔔 <i>Reminder #${reminderCount}</i>`,
      `<i>Please update the status or complete this task.</i>`,
    ].join('\n');
  }

  /**
   * Escape HTML special characters for Telegram HTML parse mode.
   */
  private escape(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  /**
   * Send a plain text notification (for testing/custom messages).
   */
  async sendMessage(chatId: string, message: string): Promise<DeliveryResult> {
    if (!this.bot) {
      return { success: false, error: 'Telegram bot not initialized' };
    }

    try {
      const sent = await this.bot.sendMessage(chatId, message, { parse_mode: 'HTML' });
      return { success: true, messageId: sent.message_id };
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      return { success: false, error };
    }
  }

  /**
   * Check if the Telegram bot is configured and operational.
   */
  isConfigured(): boolean {
    return this.bot !== null;
  }
}

export const telegramService = new TelegramService();
