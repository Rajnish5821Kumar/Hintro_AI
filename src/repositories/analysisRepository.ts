/**
 * Analysis Repository
 * All database operations for the Analysis model.
 */

import { Analysis } from '@prisma/client';
import prisma from '../prisma/client';

export interface CreateAnalysisInput {
  meetingId: string;
  summary: object;
  actionItems: object;
  decisions: object;
  followUpSuggestions: object;
  rawResponse: string;
  modelUsed: string;
  promptTokens?: number;
  completionTokens?: number;
}

export class AnalysisRepository {
  /**
   * Create or update (upsert) an analysis for a meeting.
   * A meeting can only have one analysis; re-analyzing replaces it.
   */
  async upsert(data: CreateAnalysisInput): Promise<Analysis> {
    return prisma.analysis.upsert({
      where: { meetingId: data.meetingId },
      update: {
        summary: data.summary,
        actionItems: data.actionItems,
        decisions: data.decisions,
        followUpSuggestions: data.followUpSuggestions,
        rawResponse: data.rawResponse,
        modelUsed: data.modelUsed,
        promptTokens: data.promptTokens,
        completionTokens: data.completionTokens,
        updatedAt: new Date(),
      },
      create: data,
    });
  }

  /**
   * Find analysis by meeting ID.
   */
  async findByMeetingId(meetingId: string): Promise<Analysis | null> {
    return prisma.analysis.findUnique({ where: { meetingId } });
  }
}

export const analysisRepository = new AnalysisRepository();
