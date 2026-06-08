/**
 * Meeting Service
 * Business logic for meeting CRUD operations.
 * Handles caching, ownership validation, and orchestration.
 */

import { meetingRepository, CreateMeetingInput, UpdateMeetingInput, FindMeetingsOptions, MeetingWithRelations, PaginatedResult } from '../repositories/meetingRepository';
import { NotFoundError, ForbiddenError } from '../utils/errors';
import { cacheGet, cacheSet, cacheDel, CacheKeys } from '../utils/cache';
import { createLogger } from '../utils/logger';

export class MeetingService {
  private readonly log = createLogger();

  /**
   * Create a new meeting.
   */
  async createMeeting(data: CreateMeetingInput): Promise<MeetingWithRelations> {
    this.log.info('Creating meeting', { title: data.title, userId: data.createdById });

    const meeting = await meetingRepository.create(data);

    // Invalidate list cache for this user
    await cacheDel(`meetings:user:${data.createdById}:*`);

    this.log.info('Meeting created', { meetingId: meeting.id });
    return meeting;
  }

  /**
   * Get paginated list of meetings for a user.
   */
  async getMeetings(options: FindMeetingsOptions): Promise<PaginatedResult<MeetingWithRelations>> {
    this.log.info('Fetching meetings', { userId: options.userId, page: options.page });

    // Only cache simple un-filtered listing
    const cacheKey = !options.search && !options.startDate && !options.endDate
      ? CacheKeys.meetingList(options.userId, options.page || 1, options.limit || 10)
      : null;

    if (cacheKey) {
      const cached = await cacheGet<PaginatedResult<MeetingWithRelations>>(cacheKey);
      if (cached) return cached;
    }

    const result = await meetingRepository.findAll(options);

    if (cacheKey) {
      await cacheSet(cacheKey, result, 60); // Cache for 60 seconds
    }

    return result;
  }

  /**
   * Get a specific meeting by ID (validates ownership).
   */
  async getMeetingById(id: string, userId: string): Promise<MeetingWithRelations> {
    const cacheKey = CacheKeys.meeting(id);
    const cached = await cacheGet<MeetingWithRelations>(cacheKey);
    if (cached) {
      // Validate ownership even for cached results
      if (cached.createdById !== userId) throw new ForbiddenError();
      return cached;
    }

    const meeting = await meetingRepository.findById(id, userId);
    if (!meeting) {
      throw new NotFoundError('Meeting');
    }

    await cacheSet(cacheKey, meeting, 120);
    return meeting;
  }

  /**
   * Update a meeting (validates ownership).
   */
  async updateMeeting(
    id: string,
    userId: string,
    data: UpdateMeetingInput
  ): Promise<MeetingWithRelations> {
    this.log.info('Updating meeting', { meetingId: id, userId });

    const isOwner = await meetingRepository.isOwner(id, userId);
    if (!isOwner) throw new NotFoundError('Meeting');

    const updated = await meetingRepository.update(id, userId, data);

    // Invalidate caches
    await Promise.all([
      cacheDel(CacheKeys.meeting(id)),
      cacheDel(`meetings:user:${userId}:*`),
    ]);

    return updated;
  }

  /**
   * Delete a meeting (validates ownership).
   */
  async deleteMeeting(id: string, userId: string): Promise<void> {
    this.log.info('Deleting meeting', { meetingId: id, userId });

    const isOwner = await meetingRepository.isOwner(id, userId);
    if (!isOwner) throw new NotFoundError('Meeting');

    await meetingRepository.delete(id, userId);

    // Invalidate caches
    await Promise.all([
      cacheDel(CacheKeys.meeting(id)),
      cacheDel(`meetings:user:${userId}:*`),
    ]);

    this.log.info('Meeting deleted', { meetingId: id });
  }
}

export const meetingService = new MeetingService();
