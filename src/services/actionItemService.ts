/**
 * Action Item Service
 * Business logic for action item management.
 */

import { ActionItem, ActionItemStatus } from '@prisma/client';
import {
  actionItemRepository,
  CreateActionItemInput,
  FindActionItemsOptions,
  PaginatedResult,
} from '../repositories/actionItemRepository';
import { meetingRepository } from '../repositories/meetingRepository';
import { NotFoundError } from '../utils/errors';
import { overdueService } from './overdueService';
import { createLogger } from '../utils/logger';

export class ActionItemService {
  private readonly log = createLogger();

  /**
   * Create a new action item. Validates that the meeting exists.
   */
  async createActionItem(data: CreateActionItemInput, userId: string): Promise<ActionItem> {
    this.log.info('Creating action item', { meetingId: data.meetingId, task: data.task });

    // Verify meeting exists and is owned by user
    const meeting = await meetingRepository.findById(data.meetingId, userId);
    if (!meeting) throw new NotFoundError('Meeting');

    const item = await actionItemRepository.create(data);
    this.log.info('Action item created', { id: item.id });
    return item;
  }

  /**
   * Get paginated action items with optional filters.
   */
  async getActionItems(
    options: FindActionItemsOptions
  ): Promise<PaginatedResult<ActionItem>> {
    return actionItemRepository.findAll(options);
  }

  /**
   * Update the status of an action item.
   */
  async updateStatus(
    id: string,
    status: ActionItemStatus,
    userId: string
  ): Promise<ActionItem> {
    this.log.info('Updating action item status', { id, status });

    const item = await actionItemRepository.findById(id);
    if (!item) throw new NotFoundError('Action item');

    // Verify the meeting belongs to this user
    const isOwner = await meetingRepository.isOwner(item.meetingId, userId);
    if (!isOwner) throw new NotFoundError('Action item');

    return actionItemRepository.updateStatus(id, status);
  }

  /**
   * Get all overdue action items.
   */
  async getOverdueItems() {
    return overdueService.getOverdueItems();
  }
}

export const actionItemService = new ActionItemService();
