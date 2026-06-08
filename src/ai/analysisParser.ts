/**
 * Analysis Response Parser
 * Parses and validates the JSON output from Gemini AI.
 * Handles edge cases where the model wraps JSON in code fences.
 */

import { z } from 'zod';
import { AIAnalysisError } from '../utils/errors';
import logger from '../utils/logger';

// ── Zod Schemas for AI Response Validation ────────────────────

const CitationSchema = z.object({
  timestamp: z.string(),
  speaker: z.string(),
  quote: z.string().optional(),
});

const GroundedItemSchema = z.object({
  text: z.string().min(1),
  citations: z.array(CitationSchema).min(1, 'Each item must have at least one citation'),
});

const ActionItemSchema = z.object({
  task: z.string().min(1),
  assignee: z.string().min(1),
  dueDate: z.string().nullable().optional(),
  citations: z.array(CitationSchema).min(1, 'Each action item must have at least one citation'),
});

export const AnalysisResponseSchema = z.object({
  summary: z.array(GroundedItemSchema),
  actionItems: z.array(ActionItemSchema),
  decisions: z.array(GroundedItemSchema),
  followUpSuggestions: z.array(GroundedItemSchema),
});

export type AnalysisResponse = z.infer<typeof AnalysisResponseSchema>;

/**
 * Strip markdown code fences from AI responses.
 * Some models wrap JSON in ```json ... ``` blocks.
 */
const stripCodeFences = (text: string): string => {
  return text
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
};

/**
 * Parse and validate the raw AI text response.
 * Throws AIAnalysisError if parsing or validation fails.
 */
export const parseAnalysisResponse = (rawText: string): AnalysisResponse => {
  // Step 1: Strip any code fences
  const cleaned = stripCodeFences(rawText);

  // Step 2: Parse JSON
  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch (err) {
    logger.error('AI response is not valid JSON', { snippet: cleaned.substring(0, 200) });
    throw new AIAnalysisError(
      'The AI returned an invalid JSON response. Please try again.'
    );
  }

  // Step 3: Validate schema
  const validated = AnalysisResponseSchema.safeParse(parsed);
  if (!validated.success) {
    const issues = validated.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
    logger.error('AI response failed schema validation', { issues });
    throw new AIAnalysisError(
      `AI response validation failed: ${issues.join('; ')}`
    );
  }

  return validated.data;
};
