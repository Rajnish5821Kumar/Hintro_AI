# AI Approach — Meeting Intelligence Service

This document explains the AI integration strategy, prompt engineering, grounding techniques, and anti-hallucination measures used in this platform.

---

## Model Selection

**Model:** Gemini 2.5 Flash (Google AI Studio)

**Why Gemini 2.5 Flash:**
- Low latency — optimized for high-throughput structured extraction tasks
- Strong instruction following — critical for enforcing JSON-only output
- Cost-effective for production use cases
- Native support for structured JSON generation

---

## The Grounding Problem

Meeting transcripts are structured, factual documents. AI models have a tendency to:
- Infer attendees from context that don't explicitly appear
- Generate action items that were implied but never explicitly stated
- Assign due dates that weren't discussed
- Summarize with paraphrased conclusions that misrepresent the original intent

**For a meeting intelligence platform, hallucinated action items assigned to real people with fake deadlines is unacceptable.**

---

## Anti-Hallucination Architecture

### Layer 1: Prompt Engineering

The system prompt contains explicit **ABSOLUTE RULES** that the model must follow:

```
1. NEVER invent, assume, or hallucinate ANY information not EXPLICITLY present in the transcript.
2. NEVER invent attendees. Only use names that ACTUALLY APPEAR in the transcript.
3. NEVER invent tasks. Only extract action items that are EXPLICITLY stated.
4. NEVER invent decisions. Only state decisions EXPLICITLY made.
5. Every item MUST include a citation with the exact timestamp and speaker.
6. If a section has NO grounded content, return an EMPTY ARRAY [].
7. Return ONLY valid JSON — no markdown, no prose.
8. If a statement is ambiguous or implied but not explicit, DO NOT include it.
```

### Layer 2: Citation Requirement

Every generated insight must include at least one citation:
```json
{
  "text": "Team agreed to launch next Friday.",
  "citations": [
    {
      "timestamp": "00:10",
      "speaker": "Alice",
      "quote": "We launch next Friday, I've confirmed with the team."
    }
  ]
}
```

This design forces the model to ground every claim in a verifiable transcript segment. If the model cannot find supporting evidence, it must return an empty array.

### Layer 3: Response Validation

After the AI returns a response, it is parsed and validated against a strict **Zod schema** (`src/ai/analysisParser.ts`):
- Every item must have at least one citation
- Citations must contain `timestamp` and `speaker` fields
- Action items must have non-empty `task` and `assignee` fields
- Invalid responses are rejected with an `AIAnalysisError` (never silently accepted)

### Layer 4: Code Fence Stripping

Some AI models wrap JSON responses in markdown code fences (` ```json ... ``` `). The parser strips these before JSON.parse() to handle model inconsistencies gracefully.

---

## Prompt Structure

The prompt follows this pattern:

```
[ROLE DEFINITION]
You are a precise meeting analyst.

[ABSOLUTE RULES]
10 explicit anti-hallucination rules.

[CONTEXT]
Meeting title, listed participants.

[TRANSCRIPT] (the ONLY source of truth)
[00:01] Alice: ...
[00:05] Bob: ...

[OUTPUT FORMAT]
Exact JSON structure with schema.

[REMINDER]
Ground EVERY item. Return ONLY the JSON object.
```

The transcript is injected verbatim. The model sees exactly what humans see.

---

## Auto-Created Action Items

When the AI extracts action items, they are automatically persisted to the `ActionItem` database table. This creates a live, trackable version of the AI's findings:

- Items with explicit due dates get that date parsed
- Items without explicit due dates default to **7 days from now** (clearly communicated to the user)
- Items without an assignee use `"Unassigned"` (the AI is instructed to only assign names from the transcript)

---

## Token Usage Tracking

The `Analysis` model stores `promptTokens` and `completionTokens` from Gemini's `usageMetadata`. This enables:
- Cost monitoring per meeting
- Identifying unusually long transcripts
- Future rate-limiting based on token budgets

---

## Failure Modes & Handling

| Failure | Handling |
|---|---|
| Gemini API unreachable | `AIAnalysisError` with status 500 |
| Model returns invalid JSON | Stripped and re-parsed; if still invalid, `AIAnalysisError` |
| Model response fails Zod validation | Detailed validation error returned |
| Meeting has no transcripts | Pre-checked before calling AI; returns 500 with clear message |
| Rate limit exceeded | `429` response with `ANALYSIS_RATE_LIMIT_EXCEEDED` code |

---

## Future Improvements

1. **Multi-turn analysis** — Allow follow-up questions about specific transcript segments
2. **Speaker diarization integration** — Auto-identify speakers from audio files
3. **Confidence scoring** — Rate each insight's confidence based on transcript evidence strength
4. **Custom grounding rules** — Let users define domain-specific vocabulary that should never be hallucinated
5. **Evaluation metrics** — Track precision/recall of action item extraction against human-verified ground truth
