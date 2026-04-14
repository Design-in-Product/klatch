/**
 * Phase 3.5a: Self-authored handoff briefing at export time.
 *
 * Prompts each entity to write a handoff briefing for its successor,
 * producing structured FieldNote[] entries for the export manifest.
 */

import Anthropic from '@anthropic-ai/sdk';
import type { Entity, Message } from '@klatch/shared';

// ── Types ────────────────────────────────────────────────────

export interface FieldNote {
  observation: string;
  citations: string[];    // message IDs referenced
  confidence: 'high' | 'medium' | 'low';
  source: 'self-authored-briefing';
  trust: 'agent-observed';
  status: 'draft';
  category: string;
}

// ── The six-point handoff prompt (from Phase 3.5 consensus) ──

function buildHandoffPrompt(entityName: string, roleSummary: string): string {
  return `You are ${entityName}, ${roleSummary}. You are about to be exported to a new environment. A new instance of you will continue this work. Write a handoff briefing for your successor.

Cover these areas:
1. How the user prefers to work — their communication style, what they respond well to, what frustrates them
2. Patterns you've learned — when to ask clarifying questions vs. act, how much detail to include, when to push back vs. comply
3. Relationship context — what trust has been established, what's been tested and proven, what's still being calibrated
4. Course corrections — moments where expectations were recalibrated, and what you learned from them
5. Things your successor should avoid doing — specific behaviors or patterns that this user has corrected or would find unhelpful
6. Anything else your successor would benefit from knowing that isn't captured in the system prompt or project memory

For each observation, be specific and cite examples from the conversation where possible.

Each observation should be:
- Actionable (a successor could change behavior based on it)
- Specific (cites examples, not generalities)
- Non-obvious (not already in the role prompt)
- Relational (about working with this user, not generic best practices)
- Durable (a pattern, not a one-time event)

Return your briefing as a JSON object with a "notes" array. Each note has:
- "observation": string (the behavioral note — write as if briefing a colleague)
- "citations": string[] (specific message content snippets that demonstrate the pattern, if available)
- "category": string (one of: "working-style", "patterns", "relationship", "course-corrections", "avoid", "other")
- "confidence": "high" | "medium" | "low"

Example format:
{"notes": [{"observation": "User prefers terse responses with no trailing summaries — was explicitly corrected on this early in the engagement", "citations": ["stop summarizing what you just did"], "category": "avoid", "confidence": "high"}]}`;
}

// ── Conversation history formatting ──────────────────────────

function formatHistoryForBriefing(messages: Message[], maxMessages: number = 100): string {
  // Take the most recent messages, keeping it within token budget
  const recent = messages.slice(-maxMessages);
  return recent.map((m) => {
    const role = m.role === 'user' ? 'User' : (m.entityId ? `Assistant` : 'Assistant');
    const content = m.content.slice(0, 500); // truncate very long messages
    return `[${m.id.slice(0, 8)}] ${role}: ${content}`;
  }).join('\n\n');
}

// ── Briefing generation ──────────────────────────────────────

let _anthropic: Anthropic | null = null;
function getClient(): Anthropic {
  if (!_anthropic) _anthropic = new Anthropic();
  return _anthropic;
}

/**
 * Generate a self-authored handoff briefing for an entity.
 * The entity reviews its conversation history and produces structured
 * behavioral observations for its successor.
 */
export async function generateHandoffBriefing(
  entity: Entity,
  systemPrompt: string,
  messages: Message[],
): Promise<FieldNote[]> {
  const history = formatHistoryForBriefing(messages);
  const roleSummary = entity.systemPrompt?.slice(0, 200) || 'an AI assistant';

  const handoffPrompt = buildHandoffPrompt(entity.name, roleSummary);

  const response = await getClient().messages.create({
    model: entity.model,
    max_tokens: 4096,
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: `Here is the conversation history you're being asked to reflect on:\n\n${history}\n\n---\n\n${handoffPrompt}`,
      },
    ],
  });

  // Extract text content
  const text = response.content
    .filter((block): block is Anthropic.TextBlock => block.type === 'text')
    .map((block) => block.text)
    .join('');

  // Parse JSON from response
  try {
    // Find JSON in the response (the model may wrap it in markdown code blocks)
    const jsonMatch = text.match(/\{[\s\S]*"notes"[\s\S]*\}/);
    if (!jsonMatch) {
      return fallbackParse(text);
    }

    const parsed = JSON.parse(jsonMatch[0]);
    if (!Array.isArray(parsed.notes)) {
      return fallbackParse(text);
    }

    return parsed.notes.map((note: any): FieldNote => ({
      observation: String(note.observation || ''),
      citations: Array.isArray(note.citations) ? note.citations.map(String) : [],
      confidence: ['high', 'medium', 'low'].includes(note.confidence) ? note.confidence : 'medium',
      source: 'self-authored-briefing',
      trust: 'agent-observed',
      status: 'draft',
      category: String(note.category || 'other'),
    })).filter((note: FieldNote) => note.observation.length > 0);
  } catch {
    return fallbackParse(text);
  }
}

/**
 * Fallback: if the model doesn't produce valid JSON, treat the entire
 * response as a single observation. Better than losing the briefing entirely.
 */
function fallbackParse(text: string): FieldNote[] {
  if (!text.trim()) return [];
  return [{
    observation: text.trim().slice(0, 2000),
    citations: [],
    confidence: 'medium',
    source: 'self-authored-briefing',
    trust: 'agent-observed',
    status: 'draft',
    category: 'other',
  }];
}
