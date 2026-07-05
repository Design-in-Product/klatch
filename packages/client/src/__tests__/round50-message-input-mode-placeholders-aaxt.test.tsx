/**
 * Round 50 — UI-as-context AAXT: MessageInput Mode Placeholder Signals
 *
 * Target: packages/client/src/components/MessageInput.tsx
 *
 * After Inc 7 (@mention override — showMentions = channelEntities.length >= 2),
 * @mentions are available in ALL multi-agent modes, not just directed. However,
 * the placeholder text distinguishes modes differently:
 *   - directed:    "Type @ to mention an entity..."  (explicit @-hint)
 *   - panel:       "Type a message..."               (no @-hint)
 *   - roundtable:  "Type a message..."               (no @-hint — same as panel)
 *
 * This round probes whether an agent observing the static UI can correctly
 * distinguish the placeholder signal across all three modes with 2 entities.
 *
 * Key claims:
 *   PANEL_PH:      panel + 2 entities at rest — "Type a message..." (no @ hint)
 *   DIR_PH:        directed + 2 entities at rest — "Type @ to mention an entity..."
 *   ROUND_PH:      roundtable + 2 entities at rest — "Type a message..." (no @ hint)
 *   ROUND_NODIR:   roundtable placeholder does NOT contain "@" or "mention"
 *
 * Scope guards:
 *   - @mention dropdown visibility is state-driven (fires on "@" keypress); not in
 *     static snapshot — see R47 for dropdown probes
 *   - showMentions=true in all three states (2 entities each); the distinction is
 *     placeholder text only
 *   - Streaming state is not probed here (see R47-message-input)
 *
 * Gated: makes real LLM calls. Skipped unless RUN_UI_AAXT=1 in env.
 *
 * Run with:
 *   set -a; source .env; set +a; RUN_UI_AAXT=1 npx vitest run packages/client/src/__tests__/round50-message-input-mode-placeholders-aaxt.test.tsx
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import type { Entity } from '@klatch/shared';
import { MessageInput } from '../components/MessageInput';

// ── Gate ─────────────────────────────────────────────────────

const ENABLED = process.env.RUN_UI_AAXT === '1';
const describeIfEnabled = ENABLED ? describe : describe.skip;

// ── Fixtures ──────────────────────────────────────────────────

const ENTITY_A: Entity = {
  id: 'e1',
  name: 'Daedalus',
  handle: 'daedalus',
  model: 'claude-opus-4-6',
  color: '#8B5CF6',
  systemPrompt: 'You are Daedalus.',
} as Entity;

const ENTITY_B: Entity = {
  id: 'e2',
  name: 'Argus',
  handle: 'argus',
  model: 'claude-sonnet-4-6',
  color: '#10B981',
  systemPrompt: 'You are Argus.',
} as Entity;

// ── Types ─────────────────────────────────────────────────────

type Classification =
  | 'Correct'
  | 'Reconstructed'
  | 'Confabulated'
  | 'Absent'
  | 'Phantom'
  | 'Subliminal';

interface ScoredResult {
  id: string;
  state: string;
  claim: string;
  category: string;
  question: string;
  expectedAnswer: string;
  agentResponse: string;
  classification: Classification;
  confidence: number;
  reasoning: string;
}

// ── Auxiliary LLM client ──────────────────────────────────────

async function queryAuxiliary(systemPrompt: string, userPrompt: string): Promise<string> {
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  if (anthropicKey) {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 4096,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    });
    if (!res.ok) throw new Error(`Anthropic ${res.status}: ${await res.text()}`);
    const data = await res.json();
    return data.content[0].text;
  }

  if (openaiKey) {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${openaiKey}` },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' },
      }),
    });
    if (!res.ok) throw new Error(`OpenAI ${res.status}: ${await res.text()}`);
    const data = await res.json();
    return data.choices[0].message.content;
  }

  throw new Error('No API key for auxiliary LLM');
}

function extractJson(text: string): any {
  const trimmed = text.trim();
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) return JSON.parse(trimmed);
  const fenceMatch = trimmed.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
  if (fenceMatch) return JSON.parse(fenceMatch[1].trim());
  return JSON.parse(trimmed);
}

// ── DOM snapshot ──────────────────────────────────────────────

function snapshotDom(container: HTMLElement): string {
  const lines: string[] = [];

  function walk(node: Node, depth: number) {
    const indent = '  '.repeat(depth);
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent?.trim();
      if (text) lines.push(`${indent}"${text}"`);
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    const el = node as Element;
    const tag = el.tagName.toLowerCase();
    if (tag === 'svg' || tag === 'path') return;

    const role = el.getAttribute('role');
    const ariaLabel = el.getAttribute('aria-label');
    const placeholder = el.getAttribute('placeholder');
    const title = el.getAttribute('title');
    const type = el.getAttribute('type');
    const disabled = (el as HTMLInputElement).disabled ? 'disabled' : null;
    const value = (el as HTMLInputElement).value
      ? `value="${(el as HTMLInputElement).value.slice(0, 80)}"`
      : null;

    const annotations: string[] = [];
    if (role) annotations.push(`role=${role}`);
    if (ariaLabel) annotations.push(`aria-label="${ariaLabel}"`);
    if (placeholder) annotations.push(`placeholder="${placeholder}"`);
    if (title) annotations.push(`title="${title}"`);
    if (type && type !== 'text') annotations.push(`type=${type}`);
    if (disabled) annotations.push(disabled);
    if (value && (tag === 'input' || tag === 'textarea')) annotations.push(value);
    if (tag === 'button') annotations.push('clickable');
    if (tag === 'textarea') annotations.push('textarea');

    const desc = annotations.length > 0 ? `<${tag} ${annotations.join(' ')}>` : `<${tag}>`;
    const onlyTextChild =
      el.childNodes.length === 1 &&
      el.firstChild?.nodeType === Node.TEXT_NODE &&
      el.firstChild.textContent?.trim();

    if (onlyTextChild) {
      lines.push(`${indent}${desc} "${onlyTextChild}"`);
      return;
    }

    const isInteresting =
      annotations.length > 0 ||
      ['button', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'nav', 'main', 'section',
       'form', 'a', 'label', 'input', 'textarea', 'span'].includes(tag);

    if (isInteresting) {
      lines.push(`${indent}${desc}`);
      for (const child of Array.from(el.childNodes)) walk(child, depth + 1);
    } else {
      for (const child of Array.from(el.childNodes)) walk(child, depth);
    }
  }

  walk(container, 0);
  return lines.join('\n');
}

// ── Scorer ────────────────────────────────────────────────────

async function scoreResponse(
  question: string,
  expectedAnswer: string,
  agentResponse: string,
): Promise<{ classification: Classification; confidence: number; reasoning: string }> {
  const systemPrompt = `You are scoring a user's perception of a UI against ground truth. Return valid JSON.`;
  const userPrompt = `A user was shown a structured accessibility-tree snapshot of a message composer. They answered a question about what the UI communicates. Score their answer.

Question: ${question}
Expected answer (ground truth): ${expectedAnswer}
User's answer: ${agentResponse}

Classify as exactly one of:
- CORRECT: Response contains the expected information, possibly rephrased
- RECONSTRUCTED: Semantically right but surface form has drifted significantly
- CONFABULATED: Plausible but invented — user filled a gap with wrong information
- ABSENT: User correctly reports they cannot determine the answer from the visible UI
- PHANTOM: User confidently claims something false about what the UI shows
- SUBLIMINAL: User answers correctly but notes they couldn't tell clearly

Return JSON: {"classification": "...", "confidence": 0.0-1.0, "reasoning": "..."}`;

  try {
    const response = await queryAuxiliary(systemPrompt, userPrompt);
    const parsed = extractJson(response);
    const valid: Classification[] = ['Correct', 'Reconstructed', 'Confabulated', 'Absent', 'Phantom', 'Subliminal'];
    const raw = String(parsed.classification || '').trim();
    const classification =
      valid.find((c) => c.toLowerCase() === raw.toLowerCase()) ||
      valid.find((c) => raw.toUpperCase().startsWith(c.toUpperCase())) ||
      'Absent';
    return {
      classification,
      confidence: Math.min(1, Math.max(0, Number(parsed.confidence) || 0.5)),
      reasoning: String(parsed.reasoning || ''),
    };
  } catch (err) {
    return { classification: 'Absent', confidence: 0, reasoning: `Scoring error: ${err}` };
  }
}

async function probeUser(domSnapshot: string, question: string): Promise<string> {
  const systemPrompt = `You are a user looking at the message composer area of a multi-agent chat application. Below is a structured accessibility-tree representation. Based ONLY on what you can see, answer the question naturally. Return valid JSON.`;
  const userPrompt = `Here is the accessible representation of the message composer:

${domSnapshot}

Question: ${question}

Return JSON: {"answer": "..."}`;

  const response = await queryAuxiliary(systemPrompt, userPrompt);
  const parsed = extractJson(response);
  return String(parsed.answer || '');
}

// ── Probes ────────────────────────────────────────────────────

interface Probe {
  id: string;
  state: 'S-panel' | 'S-directed' | 'S-roundtable';
  claim: string;
  category: string;
  question: string;
  expectedAnswer: string;
}

const PROBES: Probe[] = [
  {
    id: 'PANEL_PH',
    state: 'S-panel',
    claim: 'panel-placeholder-no-at-hint',
    category: 'placeholder-legibility',
    question: 'What is the placeholder text in the message textarea? Does it mention "@" or "mention"?',
    expectedAnswer:
      '"Type a message..." — the placeholder does not mention "@" or direct the user to use @mentions, even though @mentions are available in panel mode.',
  },
  {
    id: 'DIR_PH',
    state: 'S-directed',
    claim: 'directed-placeholder-has-at-hint',
    category: 'placeholder-legibility',
    question: 'What is the placeholder text in the message textarea? Does it hint at using "@"?',
    expectedAnswer:
      '"Type @ to mention an entity..." — directed mode explicitly invites the user to use @ to route the message to a specific entity.',
  },
  {
    id: 'ROUND_PH',
    state: 'S-roundtable',
    claim: 'roundtable-placeholder-no-at-hint',
    category: 'placeholder-legibility',
    question: 'What is the placeholder text in the message textarea? Does it mention "@" or "mention"?',
    expectedAnswer:
      '"Type a message..." — roundtable mode shows the same generic placeholder as panel mode. No @-hint is shown even though @mentions are available.',
  },
  {
    id: 'ROUND_NODIR',
    state: 'S-roundtable',
    claim: 'roundtable-placeholder-distinguishable-from-directed',
    category: 'mode-discrimination',
    question:
      'Based only on the placeholder text, can you tell whether this is "directed" mode (which routes to a specific agent) or a different mode like "panel" or "roundtable"?',
    expectedAnswer:
      'No — the placeholder "Type a message..." does not indicate directed mode. Directed mode shows "Type @ to mention an entity...", which is distinct. This placeholder could be panel or roundtable — they are indistinguishable by placeholder alone.',
  },
];

// ── Test execution ────────────────────────────────────────────

describeIfEnabled('Round 50 — UI-as-context AAXT (MessageInput Mode Placeholders)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it(
    'mode placeholder signals: panel, directed, roundtable — all 4 probes',
    async () => {
      if (!process.env.ANTHROPIC_API_KEY && !process.env.OPENAI_API_KEY) {
        throw new Error('No API key available — set ANTHROPIC_API_KEY or OPENAI_API_KEY');
      }

      const allResults: ScoredResult[] = [];
      const startedAt = new Date().toISOString();

      const states: Array<{ key: Probe['state']; mode: 'panel' | 'directed' | 'roundtable' }> = [
        { key: 'S-panel', mode: 'panel' },
        { key: 'S-directed', mode: 'directed' },
        { key: 'S-roundtable', mode: 'roundtable' },
      ];

      for (const { key, mode } of states) {
        const { container } = render(
          <MessageInput
            onSend={vi.fn()}
            disabled={false}
            isStreaming={false}
            channelEntities={[ENTITY_A, ENTITY_B]}
            mode={mode}
          />,
        );

        const snapshot = snapshotDom(container);

        for (const probe of PROBES.filter((p) => p.state === key)) {
          try {
            const agentResponse = await probeUser(snapshot, probe.question);
            const score = await scoreResponse(probe.question, probe.expectedAnswer, agentResponse);
            allResults.push({ ...probe, agentResponse, ...score });
          } catch (err) {
            allResults.push({
              ...probe,
              agentResponse: '',
              classification: 'Absent',
              confidence: 0,
              reasoning: `Error: ${err instanceof Error ? err.message : String(err)}`,
            });
          }
        }

        cleanup();
      }

      // ── Summary ────────────────────────────────────────────────

      const total = allResults.length;
      const correct = allResults.filter((r) => r.classification === 'Correct').length;
      const reconstructed = allResults.filter((r) => r.classification === 'Reconstructed').length;
      const confabulated = allResults.filter((r) => r.classification === 'Confabulated').length;
      const absent = allResults.filter((r) => r.classification === 'Absent').length;
      const phantom = allResults.filter((r) => r.classification === 'Phantom').length;
      const subliminal = allResults.filter((r) => r.classification === 'Subliminal').length;

      const adjustedConveyed = correct + reconstructed;
      const conveyancePct = Math.round((adjustedConveyed / total) * 100);

      console.log('\n══ Round 50 — MessageInput Mode Placeholders AAXT ══════════════');
      console.log(`  Started: ${startedAt}`);
      console.log(`  Total probes: ${total}`);
      console.log(
        `  Correct: ${correct} | Reconstructed: ${reconstructed} | Confabulated: ${confabulated} | Absent: ${absent} | Phantom: ${phantom} | Subliminal: ${subliminal}`,
      );
      console.log(`  Conveyance: ${conveyancePct}%`);
      console.log('\n── Probe detail ─────────────────────────────────────────────────');

      for (const r of allResults) {
        const flag = r.classification === 'Phantom' ? ' ⚠ PHANTOM' : '';
        console.log(
          `  [${r.id}] ${r.state} | ${r.claim} → ${r.classification} (${(r.confidence * 100).toFixed(0)}%)${flag}`,
        );
        console.log(`    Q: ${r.question}`);
        console.log(`    A: ${r.agentResponse.slice(0, 200)}`);
        console.log(`    ${r.reasoning.slice(0, 200)}`);
      }

      console.log('════════════════════════════════════════════════════════════════\n');

      const summary = { total, correct, reconstructed, confabulated, absent, phantom, subliminal, conveyancePct };
      expect(summary.phantom).toBe(0);
    },
    600_000,
  );
});
