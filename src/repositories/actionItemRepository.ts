/**
 * Action Item Repository
 * All database operations for the ActionItem model.
 */

import { ActionItem, ActionItemStatus, Prisma } from '@prisma/client';
import prisma from '../prisma/client';

export interface CreateActionItemInput {
  task: string;
  assignee: string;
  dueDate: Date;
  meetingId: string;
  telegramChatId?: string;
  status?: ActionItemStatus;
}

export interface FindActionItemsOptions {
  page?: number;
  limit?: number;
  status?: ActionItemStatus;
  assignee?: string;
  meetingId?: string;
  userId?: string; // Owner's user ID
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class ActionItemRepository {
  /**
   * Create a new action item.
   */
  async create(data: CreateActionItemInput): Promise<ActionItem> {
    return prisma.actionItem.create({ data });
  }

  /**
   * Find all action items with optional filters and pagination.
   */
  async findAll(options: FindActionItemsOptions): Promise<PaginatedResult<ActionItem>> {
    const { page = 1, limit = 10, status, assignee, meetingId, userId } = options;

    const where: Prisma.ActionItemWhereInput = {
      ...(status ? { status } : {}),
      ...(assignee ? { assignee: { contains: assignee, mode: 'insensitive' } } : {}),
      ...(meetingId ? { meetingId } : {}),
      // If userId is provided, filter by meetings owned by that user
      ...(userId
        ? {
            meeting: { createdById: userId },
          }
        : {}),
    };

    const [data, total] = await Promise.all([
      prisma.actionItem.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { dueDate: 'asc' },
        include: {
          meeting: { select: { id: true, title: true } },
        },
      }),
      prisma.actionItem.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Find a single action item by ID.
   */
  async findById(id: string): Promise<ActionItem | null> {
    return prisma.actionItem.findUnique({ where: { id } });
  }

  /**
   * Update the status of an action item.
   */
  async updateStatus(id: string, status: ActionItemStatus): Promise<ActionItem> {
    return prisma.actionItem.update({
      where: { id },
      data: { status, updatedAt: new Date() },
    });
  }

  /**
   * Find all overdue action items (status != COMPLETED and dueDate < now).
   */
  async findOverdue(): Promise<ActionItem[]> {
    return prisma.actionItem.findMany({
      where: {
        status: { not: ActionItemStatus.COMPLETED },
        dueDate: { lt: new Date() },
      },
      orderBy: { dueDate: 'asc' },
      include: {
        meeting: { select: { id: true, title: true } },
      },
    });
  }

  /**
   * Increment the reminder count for an action item.
   */
  async incrementReminderCount(id: string): Promise<ActionItem> {
    return prisma.actionItem.update({
      where: { id },
      data: { reminderCount: { increment: 1 } },
    });
  }

  /**
   * Bulk create action items (used when AI extracts multiple items).
   */
  async bulkCreate(items: CreateActionItemInput[]): Promise<{ count: number }> {
    return prisma.actionItem.createMany({ data: items });
  }
}

export const actionItemRepository = new ActionItemRepository();
