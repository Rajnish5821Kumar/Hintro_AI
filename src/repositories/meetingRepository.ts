/**
 * Meeting Repository
 * All database operations for the Meeting model.
 * Supports pagination, filtering, and full-text search.
 */

import { Meeting, Prisma } from '@prisma/client';
import prisma from '../prisma/client';

export interface CreateMeetingInput {
  title: string;
  participants: string[];
  meetingDate: Date;
  createdById: string;
  transcripts?: Array<{
    speaker: string;
    text: string;
    timestamp: string;
    sequence: number;
  }>;
}

export interface UpdateMeetingInput {
  title?: string;
  participants?: string[];
  meetingDate?: Date;
  transcripts?: Array<{
    speaker: string;
    text: string;
    timestamp: string;
    sequence: number;
  }>;
}

export interface FindMeetingsOptions {
  userId: string;
  page?: number;
  limit?: number;
  search?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export type MeetingWithRelations = Meeting & {
  transcripts: {
    id: string;
    speaker: string;
    text: string;
    timestamp: string;
    sequence: number;
  }[];
  _count: {
    actionItems: number;
  };
  analysis: {
    id: string;
    createdAt: Date;
  } | null;
};

export class MeetingRepository {
  /**
   * Create a new meeting with optional transcript entries.
   */
  async create(data: CreateMeetingInput): Promise<MeetingWithRelations> {
    const { transcripts, ...meetingData } = data;

    return prisma.meeting.create({
      data: {
        ...meetingData,
        ...(transcripts && transcripts.length > 0
          ? {
              transcripts: {
                create: transcripts,
              },
            }
          : {}),
      },
      include: {
        transcripts: {
          orderBy: { sequence: 'asc' },
        },
        _count: { select: { actionItems: true } },
        analysis: { select: { id: true, createdAt: true } },
      },
    });
  }

  /**
   * Find all meetings for a user with pagination and optional filters.
   */
  async findAll(options: FindMeetingsOptions): Promise<PaginatedResult<MeetingWithRelations>> {
    const { userId, page = 1, limit = 10, search, startDate, endDate } = options;

    const where: Prisma.MeetingWhereInput = {
      createdById: userId,
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: 'insensitive' } },
              { participants: { has: search } },
            ],
          }
        : {}),
      ...(startDate || endDate
        ? {
            meetingDate: {
              ...(startDate ? { gte: startDate } : {}),
              ...(endDate ? { lte: endDate } : {}),
            },
          }
        : {}),
    };

    const [data, total] = await Promise.all([
      prisma.meeting.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { meetingDate: 'desc' },
        include: {
          transcripts: { orderBy: { sequence: 'asc' } },
          _count: { select: { actionItems: true } },
          analysis: { select: { id: true, createdAt: true } },
        },
      }),
      prisma.meeting.count({ where }),
    ]);

    return {
      data: data as MeetingWithRelations[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Find a single meeting by ID, validating ownership.
   */
  async findById(id: string, userId: string): Promise<MeetingWithRelations | null> {
    const result = await prisma.meeting.findFirst({
      where: { id, createdById: userId },
      include: {
        transcripts: { orderBy: { sequence: 'asc' } },
        _count: { select: { actionItems: true } },
        analysis: { select: { id: true, createdAt: true } },
      },
    });
    return result as MeetingWithRelations | null;
  }

  /**
   * Find a meeting without user ownership check (used by analysis service).
   */
  async findByIdWithTranscripts(id: string) {
    return prisma.meeting.findUnique({
      where: { id },
      include: {
        transcripts: { orderBy: { sequence: 'asc' } },
      },
    });
  }

  /**
   * Update a meeting and optionally replace its transcripts.
   */
  async update(id: string, userId: string, data: UpdateMeetingInput): Promise<MeetingWithRelations> {
    const { transcripts, ...meetingData } = data;

    // If transcripts provided, delete old ones first (replace strategy)
    if (transcripts !== undefined) {
      await prisma.transcript.deleteMany({ where: { meetingId: id } });
    }

    const updated = await prisma.meeting.update({
      where: { id },
      data: {
        ...meetingData,
        ...(transcripts && transcripts.length > 0
          ? {
              transcripts: {
                create: transcripts,
              },
            }
          : {}),
      },
      include: {
        transcripts: { orderBy: { sequence: 'asc' } },
        _count: { select: { actionItems: true } },
        analysis: { select: { id: true, createdAt: true } },
      },
    });

    // Verify ownership
    if (updated.createdById !== userId) {
      throw new Error('Unauthorized');
    }

    return updated as MeetingWithRelations;
  }

  /**
   * Delete a meeting by ID (cascades to transcripts, analysis, actionItems).
   */
  async delete(id: string, userId: string): Promise<void> {
    await prisma.meeting.deleteMany({
      where: { id, createdById: userId },
    });
  }

  /**
   * Check if user owns the meeting.
   */
  async isOwner(id: string, userId: string): Promise<boolean> {
    const count = await prisma.meeting.count({
      where: { id, createdById: userId },
    });
    return count > 0;
  }
}

export const meetingRepository = new MeetingRepository();
