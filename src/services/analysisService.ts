/**
 * Analysis Service
 * Orchestrates AI-powered meeting analysis:
 *   1. Load meeting with transcripts
 *   2. Build grounded prompt
 *   3. Call Gemini API
 *   4. Parse and validate response
 *   5. Persist analysis to database
 *   6. Optionally auto-create extracted action items
 */

import { Analysis } from '@prisma/client';
import { meetingRepository } from '../repositories/meetingRepository';
import { analysisRepository } from '../repositories/analysisRepository';
import { actionItemRepository } from '../repositories/actionItemRepository';
import { generateContent } from '../ai/geminiClient';
import { buildAnalysisPrompt } from '../ai/analysisPrompt';
import { parseAnalysisResponse } from '../ai/analysisParser';
import { NotFoundError, AIAnalysisError } from '../utils/errors';
import { createLogger } from '../utils/logger';

export class AnalysisService {
  private readonly log = createLogger();

  /**
   * Analyze a meeting transcript using Gemini AI.
   * Requires the meeting to have at least one transcript entry.
   */
  async analyzeMeeting(meetingId: string, userId: string): Promise<Analysis> {
    this.log.info('Starting meeting analysis', { meetingId });

    // 1. Load meeting with transcripts
    const meeting = await meetingRepository.findByIdWithTranscripts(meetingId);
    if (!meeting) throw new NotFoundError('Meeting');

    if (!meeting.transcripts || meeting.transcripts.length === 0) {
      throw new AIAnalysisError(
        'This meeting has no transcript entries. Add transcript data before analyzing.'
      );
    }

    // 2. Build the grounded prompt
    const prompt = buildAnalysisPrompt(
      meeting.title,
      meeting.participants,
      meeting.transcripts
    );

    // 3. Call Gemini AI
    this.log.info('Calling Gemini AI', { meetingId, transcriptLines: meeting.transcripts.length });
    let rawResponse: string;
    let usage: { promptTokens?: number; completionTokens?: number } = {};

    try {
      const result = await generateContent(prompt);
      rawResponse = result.text;
      usage = result.usage || {};
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.log.error('Gemini API call failed', { meetingId, err: message });
      throw new AIAnalysisError(`Gemini AI request failed: ${message}`);
    }

    // 4. Parse and validate response
    const parsed = parseAnalysisResponse(rawResponse);

    // 5. Persist analysis
    const analysis = await analysisRepository.upsert({
      meetingId,
      summary: parsed.summary,
      actionItems: parsed.actionItems,
      decisions: parsed.decisions,
      followUpSuggestions: parsed.followUpSuggestions,
      rawResponse,
      modelUsed: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
      promptTokens: usage.promptTokens,
      completionTokens: usage.completionTokens,
    });

    // 6. Auto-create action items in the database from AI extraction
    if (parsed.actionItems.length > 0) {
      const actionItemData = parsed.actionItems
        .filter((item) => item.assignee && item.assignee !== '')
        .map((item) => ({
          task: item.task,
          assignee: item.assignee,
          dueDate: item.dueDate ? new Date(item.dueDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default: 7 days
          meetingId,
          status: 'PENDING' as const,
        }));

      if (actionItemData.length > 0) {
        await actionItemRepository.bulkCreate(actionItemData);
        this.log.info('Auto-created action items from AI', {
          meetingId,
          count: actionItemData.length,
        });
      }
    }

    this.log.info('Meeting analysis complete', {
      meetingId,
      summaryItems: parsed.summary.length,
      actionItems: parsed.actionItems.length,
      decisions: parsed.decisions.length,
      followUps: parsed.followUpSuggestions.length,
    });

    return analysis;
  }
}

export const analysisService = new AnalysisService();
