/**
 * Reminder Repository
 * Manages ReminderHistory records — storing delivery outcomes for every reminder sent.
 */

import { DeliveryStatus, ReminderHistory } from '@prisma/client';
import prisma from '../prisma/client';

export interface CreateReminderInput {
  actionItemId: string;
  deliveryStatus: DeliveryStatus;
  provider?: string;
  errorMessage?: string;
}

export class ReminderRepository {
  /**
   * Record a reminder delivery event.
   */
  async create(data: CreateReminderInput): Promise<ReminderHistory> {
    return prisma.reminderHistory.create({
      data: {
        actionItemId: data.actionItemId,
        deliveryStatus: data.deliveryStatus,
        provider: data.provider || 'telegram',
        errorMessage: data.errorMessage,
        sentAt: new Date(),
      },
    });
  }

  /**
   * Find all reminders for a specific action item.
   */
  async findByActionItemId(actionItemId: string): Promise<ReminderHistory[]> {
    return prisma.reminderHistory.findMany({
      where: { actionItemId },
      orderBy: { sentAt: 'desc' },
    });
  }

  /**
   * Count reminders sent for an action item.
   */
  async countByActionItemId(actionItemId: string): Promise<number> {
    return prisma.reminderHistory.count({ where: { actionItemId } });
  }

  /**
   * Get summary of delivery stats (for monitoring).
   */
  async getDeliveryStats(): Promise<{ status: DeliveryStatus; count: number }[]> {
    const result = await prisma.reminderHistory.groupBy({
      by: ['deliveryStatus'],
      _count: { deliveryStatus: true },
    });

    return result.map((r) => ({
      status: r.deliveryStatus,
      count: r._count.deliveryStatus,
    }));
  }
}

export const reminderRepository = new ReminderRepository();
