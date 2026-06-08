/**
 * Meeting Analysis Prompt Engineering
 *
 * These prompts enforce STRICT GROUNDING — the AI must:
 *   - Only use content explicitly present in the provided transcript
 *   - Never invent attendees, tasks, decisions, or outcomes
 *   - Cite every single insight with the exact speaker and timestamp
 *   - Return valid JSON only (no markdown code blocks, no prose)
 *   - Reject any conclusion not directly supported by the transcript
 */

export interface TranscriptEntry {
  speaker: string;
  text: string;
  timestamp: string;
  sequence: number;
}

/**
 * Builds the grounded analysis prompt for Gemini.
 * The transcript is injected verbatim into the prompt so the model
 * can perform strict citation-based analysis.
 */
export const buildAnalysisPrompt = (
  meetingTitle: string,
  participants: string[],
  transcripts: TranscriptEntry[]
): string => {
  // Format the transcript into a numbered, structured block
  const formattedTranscript = transcripts
    .sort((a, b) => a.sequence - b.sequence)
    .map(
      (t) =>
        `[${t.timestamp}] ${t.speaker}: ${t.text}`
    )
    .join('\n');

  return `You are a precise meeting analyst. Your task is to analyze the following meeting transcript and extract structured information. You MUST adhere to these ABSOLUTE RULES:

ABSOLUTE RULES — VIOLATION IS NOT ACCEPTABLE:
1. NEVER invent, assume, or hallucinate ANY information not EXPLICITLY present in the transcript below.
2. NEVER invent attendees. Only use names that ACTUALLY APPEAR in the transcript.
3. NEVER invent tasks. Only extract action items that are EXPLICITLY stated in the transcript.
4. NEVER invent decisions. Only state decisions that are EXPLICITLY made in the transcript.
5. NEVER invent outcomes or follow-ups not explicitly discussed.
6. Every single item in your response MUST include a citation with the exact timestamp and speaker from the transcript.
7. If a section has NO grounded content, return an EMPTY ARRAY [] for that section.
8. DO NOT include any reasoning, explanation, or prose outside the JSON structure.
9. Return ONLY valid JSON — no markdown code fences, no comments.
10. If a statement is ambiguous, uncertain, or implied but not explicitly stated, DO NOT include it.

MEETING CONTEXT:
Title: ${meetingTitle}
Listed Participants: ${participants.join(', ')}

TRANSCRIPT (this is your ONLY source of truth):
---
${formattedTranscript}
---

Return a JSON object with EXACTLY this structure. All arrays can be empty if no grounded content exists:

{
  "summary": [
    {
      "text": "A factual sentence summarizing a key point from the transcript",
      "citations": [
        {
          "timestamp": "exact timestamp from transcript",
          "speaker": "exact speaker name from transcript",
          "quote": "the actual words from the transcript supporting this summary"
        }
      ]
    }
  ],
  "actionItems": [
    {
      "task": "Specific task that was explicitly assigned",
      "assignee": "Name of person explicitly assigned (use 'Unassigned' ONLY if no one was mentioned)",
      "dueDate": "ISO 8601 date string if explicitly mentioned, null otherwise",
      "citations": [
        {
          "timestamp": "exact timestamp from transcript",
          "speaker": "exact speaker name",
          "quote": "the exact words assigning this task"
        }
      ]
    }
  ],
  "decisions": [
    {
      "text": "A decision that was explicitly made during the meeting",
      "citations": [
        {
          "timestamp": "exact timestamp from transcript",
          "speaker": "exact speaker name",
          "quote": "the exact words making or confirming this decision"
        }
      ]
    }
  ],
  "followUpSuggestions": [
    {
      "text": "A follow-up action explicitly suggested in the transcript",
      "citations": [
        {
          "timestamp": "exact timestamp from transcript",
          "speaker": "exact speaker name",
          "quote": "the exact words suggesting this follow-up"
        }
      ]
    }
  ]
}

REMINDER: Ground EVERY item in the transcript. Return ONLY the JSON object.`;
};
