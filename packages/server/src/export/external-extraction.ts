/**
 * Phase 3.5b: External extraction of behavioral patterns.
 *
 * An auxiliary LLM reads the conversation history and extracts behavioral
 * observations as structured FieldNote[] entries. This is the observer-side
 * complement to the self-authored handoff briefing (3.5a).
 */

import { queryAuxiliary } from '../aaxt/auxiliary.js';
import type { Message } from '@klatch/shared';
import type { FieldNote } from './briefing.js';

// ── Extraction prompt ────────────────────────────────────────

const EXTRACTION_SYSTEM_PROMPT = `You are analyzing an AI agent's conversation to extract behavioral calibration patterns. You must return valid JSON.`;

function buildExtractionUserPrompt(entityName: string, history: string): string {
  return `Analyze the following conversation involving an AI agent named "${entityName}". Extract behavioral patterns that would help a successor instance of this agent work effectively with the same user.

Focus on:
1. Communication preferences — how the user likes to receive information (terse vs detailed, structured vs conversational)
2. Decision-making patterns — when the agent asks for permission vs acts independently, and how the user responds
3. Course corrections — moments where the user redirected the agent's behavior
4. Working rhythms — pace, session patterns, when the user wants depth vs speed
5. Relationship signals — trust level, areas where the agent has earned autonomy
6. Things to avoid — behaviors the user corrected or would find unhelpful

Each observation should be:
- Actionable (a successor could change behavior based on it)
- Specific (cite message content as evidence)
- Non-obvious (not just "responds to questions")
- Relational (about THIS user, not generic best practices)
- Durable (a pattern, not a one-time event)

Conversation:
---
${history}
---

Return a JSON object with a "notes" array. Each note has:
- "observation": string (the behavioral pattern, written concisely)
- "citations": string[] (specific message snippets that demonstrate the pattern)
- "confidence": "high" | "medium" | "low"
- "category": string (one of: "working-style", "patterns", "relationship", "course-corrections", "avoid", "other")

Example: {"notes": [{"observation": "User prefers to discuss architecture before implementation — redirected the agent twice when it jumped to code", "citations": ["let's talk about the shape of the solution first", "hold on, I want to understand the approach before we build"], "confidence": "high", "category": "working-style"}]}`;
}

// ── History formatting ───────────────────────────────────────

function formatHistory(messages: Message[], maxMessages: number = 100): string {
  const recent = messages.slice(-maxMessages);
  return recent.map((m) => {
    const role = m.role === 'user' ? 'User' : 'Assistant';
    const content = m.content.slice(0, 500);
    return `[${m.id.slice(0, 8)}] ${role}: ${content}`;
  }).join('\n\n');
}

// ── Extraction ───────────────────────────────────────────────

/**
 * Extract behavioral patterns from conversation history using the auxiliary LLM.
 * Returns FieldNote[] entries for inclusion in the export manifest.
 */
export async function extractBehavioralPatterns(
  entityName: string,
  messages: Message[],
): Promise<FieldNote[]> {
  if (messages.length < 5) return []; // too little conversation to extract from

  const history = formatHistory(messages);
  const userPrompt = buildExtractionUserPrompt(entityName, history);

  try {
    const response = await queryAuxiliary(EXTRACTION_SYSTEM_PROMPT, userPrompt);

    // Parse JSON
    const jsonMatch = response.match(/\{[\s\S]*"notes"[\s\S]*\}/);
    if (!jsonMatch) return [];

    const parsed = JSON.parse(jsonMatch[0]);
    if (!Array.isArray(parsed.notes)) return [];

    return parsed.notes.map((note: any): FieldNote => ({
      observation: String(note.observation || ''),
      citations: Array.isArray(note.citations) ? note.citations.map(String) : [],
      confidence: ['high', 'medium', 'low'].includes(note.confidence) ? note.confidence : 'medium',
      source: 'external-extraction' as any,
      trust: 'synthesized' as any,
      status: 'draft',
      category: String(note.category || 'other'),
    })).filter((note: FieldNote) => note.observation.length > 0);
  } catch (err) {
    console.error(`External extraction failed for ${entityName}:`, err);
    return [];
  }
}
