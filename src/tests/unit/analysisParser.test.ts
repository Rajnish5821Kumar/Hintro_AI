/**
 * Unit Tests — AI Analysis Parser
 */

import { parseAnalysisResponse } from '../../ai/analysisParser';
import { AIAnalysisError } from '../../utils/errors';

describe('parseAnalysisResponse', () => {
  const validResponse = {
    summary: [
      {
        text: 'Team plans to launch next Friday.',
        citations: [{ timestamp: '00:10', speaker: 'Alice', quote: 'We launch Friday' }],
      },
    ],
    actionItems: [
      {
        task: 'Prepare release notes',
        assignee: 'Alice',
        dueDate: '2026-06-15T00:00:00.000Z',
        citations: [{ timestamp: '00:15', speaker: 'Bob', quote: 'Alice, handle release notes' }],
      },
    ],
    decisions: [
      {
        text: 'Launch date set to next Friday.',
        citations: [{ timestamp: '00:20', speaker: 'Alice', quote: 'Confirmed for Friday' }],
      },
    ],
    followUpSuggestions: [
      {
        text: 'Schedule a follow-up meeting.',
        citations: [{ timestamp: '00:25', speaker: 'Charlie', quote: 'We should meet again' }],
      },
    ],
  };

  it('should parse a valid JSON response', () => {
    const result = parseAnalysisResponse(JSON.stringify(validResponse));
    expect(result.summary).toHaveLength(1);
    expect(result.actionItems).toHaveLength(1);
    expect(result.decisions).toHaveLength(1);
    expect(result.followUpSuggestions).toHaveLength(1);
  });

  it('should strip markdown code fences', () => {
    const withFences = '```json\n' + JSON.stringify(validResponse) + '\n```';
    const result = parseAnalysisResponse(withFences);
    expect(result.summary).toHaveLength(1);
  });

  it('should throw AIAnalysisError for invalid JSON', () => {
    expect(() => parseAnalysisResponse('not json')).toThrow(AIAnalysisError);
  });

  it('should throw AIAnalysisError when citations are missing', () => {
    const invalidResponse = {
      ...validResponse,
      summary: [{ text: 'No citations item' }], // Missing citations
    };
    expect(() => parseAnalysisResponse(JSON.stringify(invalidResponse))).toThrow(AIAnalysisError);
  });

  it('should accept empty arrays for all sections', () => {
    const emptyResponse = {
      summary: [],
      actionItems: [],
      decisions: [],
      followUpSuggestions: [],
    };
    const result = parseAnalysisResponse(JSON.stringify(emptyResponse));
    expect(result.summary).toHaveLength(0);
  });
});
