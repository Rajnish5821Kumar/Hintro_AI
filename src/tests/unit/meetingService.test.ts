/**
 * Unit Tests — Meeting Service
 */

import { MeetingService } from '../../services/meetingService';
import { meetingRepository } from '../../repositories/meetingRepository';
import { NotFoundError } from '../../utils/errors';
import * as cache from '../../utils/cache';

jest.mock('../../repositories/meetingRepository');
jest.mock('../../utils/cache');

const mockRepo = meetingRepository as jest.Mocked<typeof meetingRepository>;
const mockCache = cache as jest.Mocked<typeof cache>;

const mockMeeting = {
  id: 'meeting-1',
  title: 'Test Meeting',
  participants: ['Alice', 'Bob'],
  meetingDate: new Date('2026-06-10T10:00:00.000Z'),
  createdById: 'user-1',
  createdAt: new Date(),
  updatedAt: new Date(),
  transcripts: [],
  _count: { actionItems: 0 },
  analysis: null,
};

describe('MeetingService', () => {
  let meetingService: MeetingService;

  beforeEach(() => {
    meetingService = new MeetingService();
    jest.clearAllMocks();
    mockCache.cacheGet.mockResolvedValue(null);
    mockCache.cacheSet.mockResolvedValue(undefined);
    mockCache.cacheDel.mockResolvedValue(undefined);
  });

  describe('createMeeting', () => {
    it('should create a meeting and return it', async () => {
      mockRepo.create.mockResolvedValue(mockMeeting as any);

      const result = await meetingService.createMeeting({
        title: 'Test Meeting',
        participants: ['Alice', 'Bob'],
        meetingDate: new Date(),
        createdById: 'user-1',
      });

      expect(result.id).toBe('meeting-1');
      expect(mockRepo.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('getMeetingById', () => {
    it('should return a meeting from the repository', async () => {
      mockRepo.findById.mockResolvedValue(mockMeeting as any);

      const result = await meetingService.getMeetingById('meeting-1', 'user-1');

      expect(result.id).toBe('meeting-1');
    });

    it('should throw NotFoundError when meeting does not exist', async () => {
      mockRepo.findById.mockResolvedValue(null);

      await expect(meetingService.getMeetingById('nonexistent', 'user-1')).rejects.toThrow(
        NotFoundError
      );
    });

    it('should return cached meeting if available', async () => {
      mockCache.cacheGet.mockResolvedValue(mockMeeting as any);

      const result = await meetingService.getMeetingById('meeting-1', 'user-1');

      expect(result.id).toBe('meeting-1');
      expect(mockRepo.findById).not.toHaveBeenCalled();
    });
  });

  describe('deleteMeeting', () => {
    it('should delete a meeting when user is the owner', async () => {
      mockRepo.isOwner.mockResolvedValue(true);
      mockRepo.delete.mockResolvedValue(undefined);

      await meetingService.deleteMeeting('meeting-1', 'user-1');

      expect(mockRepo.delete).toHaveBeenCalledWith('meeting-1', 'user-1');
    });

    it('should throw NotFoundError when user does not own the meeting', async () => {
      mockRepo.isOwner.mockResolvedValue(false);

      await expect(meetingService.deleteMeeting('meeting-1', 'other-user')).rejects.toThrow(
        NotFoundError
      );
    });
  });
});
