/**
 * Meeting Validators
 * Zod schemas for meeting endpoints.
 */

import { z } from 'zod';

// ── Transcript entry ──────────────────────────────────────────
const transcriptEntrySchema = z.object({
  speaker: z.string().min(1, 'Speaker name is required').trim(),
  text: z.string().min(1, 'Transcript text is required'),
  timestamp: z
    .string()
    .regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Timestamp must be in HH:MM or HH:MM:SS format'),
  sequence: z.number().int().min(0).default(0),
});

// ── Create Meeting ────────────────────────────────────────────
export const createMeetingSchema = z.object({
  title: z
    .string({ required_error: 'Meeting title is required' })
    .min(3, 'Title must be at least 3 characters')
    .max(255, 'Title cannot exceed 255 characters')
    .trim(),
  participants: z
    .array(z.string().min(1).trim())
    .min(1, 'At least one participant is required')
    .max(100, 'Cannot exceed 100 participants'),
  meetingDate: z
    .string({ required_error: 'Meeting date is required' })
    .datetime({ message: 'meetingDate must be a valid ISO 8601 datetime string' })
    .transform((val) => new Date(val)),
  transcripts: z
    .array(transcriptEntrySchema)
    .optional()
    .default([]),
});

// ── Update Meeting ────────────────────────────────────────────
export const updateMeetingSchema = z.object({
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(255, 'Title cannot exceed 255 characters')
    .trim()
    .optional(),
  participants: z
    .array(z.string().min(1).trim())
    .min(1, 'At least one participant is required')
    .optional(),
  meetingDate: z
    .string()
    .datetime({ message: 'meetingDate must be a valid ISO 8601 datetime string' })
    .transform((val) => new Date(val))
    .optional(),
  transcripts: z.array(transcriptEntrySchema).optional(),
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field must be provided for update' }
);

// ── Query Parameters ──────────────────────────────────────────
export const meetingQuerySchema = z.object({
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
  search: z.string().optional(),
  startDate: z
    .string()
    .datetime()
    .optional()
    .transform((val) => (val ? new Date(val) : undefined)),
  endDate: z
    .string()
    .datetime()
    .optional()
    .transform((val) => (val ? new Date(val) : undefined)),
});

// ── ID Param ──────────────────────────────────────────────────
export const idParamSchema = z.object({
  id: z.string().min(1, 'ID is required'),
});

export type CreateMeetingInput = z.infer<typeof createMeetingSchema>;
export type UpdateMeetingInput = z.infer<typeof updateMeetingSchema>;
export type MeetingQueryInput = z.infer<typeof meetingQuerySchema>;
