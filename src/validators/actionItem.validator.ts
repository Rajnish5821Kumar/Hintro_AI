/**
 * Action Item Validators
 * Zod schemas for action item endpoints.
 */

import { z } from 'zod';
import { ActionItemStatus } from '@prisma/client';

// ── Create Action Item ────────────────────────────────────────
export const createActionItemSchema = z.object({
  task: z
    .string({ required_error: 'Task description is required' })
    .min(3, 'Task must be at least 3 characters')
    .max(500, 'Task cannot exceed 500 characters')
    .trim(),
  assignee: z
    .string({ required_error: 'Assignee is required' })
    .min(1, 'Assignee name is required')
    .max(100, 'Assignee name cannot exceed 100 characters')
    .trim(),
  dueDate: z
    .string({ required_error: 'Due date is required' })
    .datetime({ message: 'dueDate must be a valid ISO 8601 datetime string' })
    .transform((val) => new Date(val)),
  meetingId: z
    .string({ required_error: 'Meeting ID is required' })
    .min(1, 'Meeting ID is required'),
  telegramChatId: z.string().optional(),
  status: z.nativeEnum(ActionItemStatus).optional().default(ActionItemStatus.PENDING),
});

// ── Update Status ─────────────────────────────────────────────
export const updateStatusSchema = z.object({
  status: z.nativeEnum(ActionItemStatus, {
    errorMap: () => ({
      message: `Status must be one of: ${Object.values(ActionItemStatus).join(', ')}`,
    }),
  }),
});

// ── Query Filters ─────────────────────────────────────────────
export const actionItemQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1))
    .pipe(z.number().int().min(1)),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 10))
    .pipe(z.number().int().min(1).max(100)),
  status: z.nativeEnum(ActionItemStatus).optional(),
  assignee: z.string().optional(),
  meetingId: z.string().optional(),
});

// ── ID Param ──────────────────────────────────────────────────
export const idParamSchema = z.object({
  id: z.string().min(1, 'ID is required'),
});

export type CreateActionItemInput = z.infer<typeof createActionItemSchema>;
export type UpdateStatusInput = z.infer<typeof updateStatusSchema>;
export type ActionItemQueryInput = z.infer<typeof actionItemQuerySchema>;
