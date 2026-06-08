/**
 * Overdue Service
 * Reusable service for detecting overdue action items.
 *
 * An item is overdue when:
 *   status != COMPLETED AND dueDate < now()
 */

import { ActionItem } from '@prisma/client';
import { actionItemRepository } from '../repositories/actionItemRepository';
import { createLogger } from '../utils/logger';

export interface OverdueStats {
  total: number;
  items: ActionItem[];
}

export class OverdueService {
  private readonly log = createLogger();

  /**
   * Retrieve all overdue action items with full details.
   */
  async getOverdueItems(): Promise<OverdueStats> {
    this.log.info('Checking for overdue action items');

    const items = await actionItemRepository.findOverdue();

    this.log.info(`Found ${items.length} overdue action items`);

    return {
      total: items.length,
      items,
    };
  }

  /**
   * Determine if a single action item is overdue.
   */
  isOverdue(item: ActionItem): boolean {
    return (
      item.status !== 'COMPLETED' &&
      item.dueDate < new Date()
    );
  }
}

export const overdueService = new OverdueService();
