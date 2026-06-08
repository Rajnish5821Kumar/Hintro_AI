/**
 * Unit Tests — Overdue Service
 */

import { OverdueService } from '../../services/overdueService';
import { actionItemRepository } from '../../repositories/actionItemRepository';
import { ActionItemStatus } from '@prisma/client';

jest.mock('../../repositories/actionItemRepository');

const mockRepo = actionItemRepository as jest.Mocked<typeof actionItemRepository>;

const makeItem = (overrides: Partial<{
  id: string;
  status: ActionItemStatus;
  dueDate: Date;
}> = {}) => ({
  id: 'item-1',
  task: 'Write tests',
  assignee: 'Bob',
  meetingId: 'meeting-1',
  reminderCount: 0,
  telegramChatId: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  status: ActionItemStatus.PENDING,
  dueDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
  ...overrides,
});

describe('OverdueService', () => {
  let overdueService: OverdueService;

  beforeEach(() => {
    overdueService = new OverdueService();
    jest.clearAllMocks();
  });

  describe('getOverdueItems', () => {
    it('should return overdue items from repository', async () => {
      const overdueItems = [makeItem(), makeItem({ id: 'item-2' })];
      mockRepo.findOverdue.mockResolvedValue(overdueItems as any);

      const result = await overdueService.getOverdueItems();

      expect(result.total).toBe(2);
      expect(result.items).toHaveLength(2);
      expect(mockRepo.findOverdue).toHaveBeenCalledTimes(1);
    });

    it('should return empty array when no items are overdue', async () => {
      mockRepo.findOverdue.mockResolvedValue([]);

      const result = await overdueService.getOverdueItems();

      expect(result.total).toBe(0);
      expect(result.items).toHaveLength(0);
    });
  });

  describe('isOverdue', () => {
    it('should return true for PENDING items past due date', () => {
      const item = makeItem({
        status: ActionItemStatus.PENDING,
        dueDate: new Date(Date.now() - 1000),
      });

      expect(overdueService.isOverdue(item as any)).toBe(true);
    });

    it('should return true for IN_PROGRESS items past due date', () => {
      const item = makeItem({
        status: ActionItemStatus.IN_PROGRESS,
        dueDate: new Date(Date.now() - 1000),
      });

      expect(overdueService.isOverdue(item as any)).toBe(true);
    });

    it('should return false for COMPLETED items regardless of due date', () => {
      const item = makeItem({
        status: ActionItemStatus.COMPLETED,
        dueDate: new Date(Date.now() - 1000),
      });

      expect(overdueService.isOverdue(item as any)).toBe(false);
    });

    it('should return false for items with future due dates', () => {
      const item = makeItem({
        status: ActionItemStatus.PENDING,
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      });

      expect(overdueService.isOverdue(item as any)).toBe(false);
    });
  });
});
