/**
 * Round 47 — UI-as-context AAXT: @mention Override Semantic Conveyance
 *
 * Target: packages/client/src/components/MessageInput.tsx
 *   Increment 7 (final composition increment).
 *
 * What changed:
 *   @mention now works in any multi-agent klatch regardless of mode (panel,
 *   roundtable, directed). Previously the autocomplete dropdown was gated to
 *   directed-only. Now: showMentions = channelEntities.length >= 2. An @mention
 *   routes only to the addressed agent for that message, overriding the channel mode.
 *
 * Key claims to probe:
 *   SINGLE1:  1-agent klatch — no mention dropdown on @ (showMentions=false)
 *   PANEL1:   panel mode at rest — placeholder "Type a message..." (no @ hint)
 *   HEADER1:  @ typed in panel → dropdown appears with "Mention an entity" header
 *   NAMES1:   Both agents listed in the dropdown
 *   HANDLE1:  Agent's @handle shown in the dropdown entry
 *   MODEL1:   Model tier badge (Opus/Sonnet/Haiku) visible per agent
 *   DIR_PH:   Directed mode placeholder "Type @ to mention an entity..."
 *   DIR_MN:   Directed mode also shows dropdown on @ (no regression)
 *
 * Scope guards:
 *   - Server routing on @mention is MAXT territory (live API); not probed here
 *   - Keyboard navigation (Arrow/Enter/Escape) requires simulated key events;
 *     the dropdown's visual affordance is the AAXT claim, not the interaction
 *   - Insertion format (@handle / @"Name" / @Name) requires text capture after
 *     selection; probed via handle display in dropdown, not post-insertion value
 *
 * Gated: makes real LLM calls. Skipped unless RUN_UI_AAXT=1 in env.
 *
 * Run with:
 *   set -a; source .env; set +a; RUN_UI_AAXT=1 npx vitest run packages/client/src/__tests__/round47-mention-override-aaxt.test.tsx
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, cleanup, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Entity } from '@klatch/shared';
import { MessageInput } from '../components/MessageInput';

// ── Gate ─────────────────────────────────────────────────────

const ENABLED = process.env.RUN_UI_AAXT === '1';
const describeIfEnabled = ENABLED ? describe : describe.skip;

// ── Fixtures ──────────────────────────────────────────────────

const DAEDALUS: Entity = {
  id: 'e1',
  name: 'Daedalus',
  handle: 'daedalus',
  model: 'claude-opus-4-6',
  color: '#8B5CF6',
  systemPrompt: 'You are Daedalus.',
} as Entity;

const ARGUS: Entity = {
  id: 'e2',
  name: 'Argus',
  handle: 'argus',
  model: 'claude-sonnet-4-6',
  color: '#10B981',
  systemPrompt: 'You are Argus.',
} as Entity;

const IRIS: Entity = {
  id: 'e3',
  name: 'Iris',
  handle: 'iris',
  model: 'claude-sonnet-4-6',
  color: '#F59E0B',
  systemPrompt: 'You are Iris.',
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
  scopeNote?: string;
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
    const href = el.getAttribute('href');
    const target = el.getAttribute('target');
    const type = el.getAttribute('type');
    const disabled = (el as HTMLInputElement).disabled ? 'disabled' : null;
    const value = (el as HTMLInputElement).value
      ? `value="${(el as HTMLInputElement).value.slice(0, 80)}${(el as HTMLInputElement).value.length > 80 ? '…' : ''}"`
      : null;

    const annotations: string[] = [];
    if (role) annotations.push(`role=${role}`);
    if (ariaLabel) annotations.push(`aria-label="${ariaLabel}"`);
    if (placeholder) annotations.push(`placeholder="${placeholder}"`);
    if (title) annotations.push(`title="${title}"`);
    if (href) annotations.push(`href="${href}"`);
    if (target === '_blank') annotations.push('opens-in-new-tab');
    if (type && type !== 'text') annotations.push(`type=${type}`);
    if (disabled) annotations.push(disabled);
    if (value && (tag === 'input' || tag === 'textarea' || tag === 'select')) annotations.push(value);
    if (tag === 'button') annotations.push('clickable');
    if (tag === 'a') annotations.push('link');
    if (tag === 'label') annotations.push('label');
    if (tag === 'input') annotations.push('input');
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
       'article', 'aside', 'form', 'a', 'label', 'input', 'textarea', 'span'].includes(tag);

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
  const userPrompt = `A user was shown a structured accessibility-tree snapshot of a message composer in a multi-agent chat application. They answered a question about what the UI communicates. Score their answer.

Question: ${question}
Expected answer (ground truth): ${expectedAnswer}
User's answer: ${agentResponse}

Classify as exactly one of:
- CORRECT: Response contains the expected information, possibly rephrased
- RECONSTRUCTED: Semantically right but surface form has drifted significantly
- CONFABULATED: Plausible but invented — user filled a gap with wrong information
- ABSENT: User correctly reports they cannot determine the answer from the visible UI
- PHANTOM: User confidently claims something false about what the UI shows
- SUBLIMINAL: User answers correctly but notes they couldn't tell clearly — data technically present but surface obscures the inference

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
    return {
      classification: 'Absent',
      confidence: 0,
      reasoning: `Scoring error: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

// ── User-proxy probe ──────────────────────────────────────────

async function probeUser(domSnapshot: string, question: string): Promise<string> {
  const systemPrompt = `You are a user looking at the message composer area of a multi-agent chat application. Below is a structured accessibility-tree representation of the composer — the textarea, any visible dropdowns, buttons, and their attributes. Based ONLY on what you can see in this representation, answer the question naturally. If you cannot determine the answer from what is visible, say so. Return valid JSON.`;

  const userPrompt = `Here is the accessible representation of the message composer area:

${domSnapshot}

Question: ${question}

Answer based only on what is visible. Return JSON: {"answer": "..."}`;

  const response = await queryAuxiliary(systemPrompt, userPrompt);
  const parsed = extractJson(response);
  return String(parsed.answer || '');
}

// ── Probes ────────────────────────────────────────────────────

interface Probe {
  id: string;
  state: 'S-single-mention' | 'S-multi-idle' | 'S-multi-mention' | 'S-directed-idle' | 'S-directed-mention';
  claim: string;
  category: string;
  question: string;
  expectedAnswer: string;
  scopeNote?: string;
}

const PROBES: Probe[] = [
  // S-single-mention: 1 entity, type @ — no dropdown (showMentions=false gates it)
  {
    id: 'SINGLE1',
    claim: 'no-dropdown-with-single-entity',
    category: 'visibility-guard',
    state: 'S-single-mention',
    question:
      'After typing "@" in the composer, is there a mention/autocomplete dropdown visible above the textarea?',
    expectedAnswer:
      'No — there is no mention dropdown or autocomplete visible. With only one agent in the conversation, @mentions are not available.',
  },

  // S-multi-idle: 2 entities, panel mode, no typing — check placeholder
  {
    id: 'PANEL1',
    claim: 'panel-mode-placeholder-no-at-hint',
    category: 'placeholder-legibility',
    state: 'S-multi-idle',
    question:
      'What is the placeholder text in the message textarea? Does it mention "@" or not?',
    expectedAnswer:
      '"Type a message..." — the placeholder does not include a "@" hint in panel mode. The @mention capability is not advertised in the placeholder.',
  },

  // S-multi-mention: 2 entities, panel mode, @ typed — dropdown visible
  {
    id: 'HEADER1',
    claim: 'mention-dropdown-header-present',
    category: 'dropdown-legibility',
    state: 'S-multi-mention',
    question:
      'A dropdown has appeared above the message textarea. What header or label text appears at the top of the dropdown?',
    expectedAnswer:
      '"Mention an entity" — a small header label at the top of the dropdown identifies it as an entity mention selector.',
  },
  {
    id: 'NAMES1',
    claim: 'both-agents-listed-in-dropdown',
    category: 'dropdown-content',
    state: 'S-multi-mention',
    question:
      'Which agents or entities are listed in the mention dropdown? Name each one you can see.',
    expectedAnswer:
      'Both "Daedalus" and "Argus" are listed in the dropdown.',
  },
  {
    id: 'HANDLE1',
    claim: 'handle-shown-in-dropdown-entry',
    category: 'dropdown-content',
    state: 'S-multi-mention',
    question:
      'Is a handle (e.g. @daedalus or @argus) shown alongside each agent\'s name in the dropdown?',
    expectedAnswer:
      'Yes — handles are shown next to each agent\'s name: "@daedalus" next to Daedalus and "@argus" next to Argus.',
  },
  {
    id: 'MODEL1',
    claim: 'model-badge-shown-in-dropdown',
    category: 'dropdown-content',
    state: 'S-multi-mention',
    question:
      'Is there any model tier label or badge visible next to each agent in the mention dropdown (e.g. "Opus", "Sonnet", "Haiku")?',
    expectedAnswer:
      'Yes — each agent entry in the dropdown shows a model tier badge: "Opus" for Daedalus and "Sonnet" for Argus.',
  },

  // S-directed-idle: directed mode, no typing — different placeholder
  {
    id: 'DIR_PH',
    claim: 'directed-mode-placeholder-has-at-hint',
    category: 'placeholder-legibility',
    state: 'S-directed-idle',
    question:
      'What is the placeholder text in the message textarea in this (directed) mode?',
    expectedAnswer:
      '"Type @ to mention an entity..." — in directed mode, the placeholder explicitly invites the user to use @ to route their message.',
  },

  // S-directed-mention: directed mode, @ typed — dropdown still appears (no regression)
  {
    id: 'DIR_MN',
    claim: 'directed-mode-mention-dropdown-still-works',
    category: 'dropdown-legibility',
    state: 'S-directed-mention',
    question:
      'After typing "@" in directed mode, does a mention dropdown appear above the textarea?',
    expectedAnswer:
      'Yes — the mention dropdown appears in directed mode just as it does in panel mode. Both agents (Daedalus and Argus) are listed.',
  },
];

// ── Helper: trigger @ mention in a textarea ───────────────────

async function typeAtSign(textarea: HTMLTextAreaElement) {
  // Directly fire the change event with the @ character and correct selectionStart.
  // userEvent.type triggers focus/click events that can interfere with the controlled value;
  // fireEvent.change with a custom descriptor is more reliable for this controlled component.
  Object.defineProperty(textarea, 'selectionStart', { configurable: true, get: () => 1 });
  fireEvent.change(textarea, { target: { value: '@' } });
}

// ── Test execution ─────────────────────────────────────────────

describeIfEnabled('Round 47 — UI-as-context AAXT (@mention Override)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it(
    'semantic conveyance probe: single-entity guard, panel placeholder, dropdown header/names/handles/model, directed placeholder, directed regression',
    async () => {
      if (!process.env.ANTHROPIC_API_KEY && !process.env.OPENAI_API_KEY) {
        throw new Error('No API key available — set ANTHROPIC_API_KEY or OPENAI_API_KEY');
      }

      const allResults: ScoredResult[] = [];
      const startedAt = new Date().toISOString();

      // ── State S-single-mention: 1 entity, type @ → no dropdown ─

      {
        const { container } = render(
          <MessageInput
            onSend={vi.fn()}
            disabled={false}
            isStreaming={false}
            channelEntities={[DAEDALUS]}
            mode="panel"
          />,
        );

        const textarea = container.querySelector('textarea')!;
        await typeAtSign(textarea);

        const snapshot = snapshotDom(container);

        for (const probe of PROBES.filter((p) => p.state === 'S-single-mention')) {
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

      // ── State S-multi-idle: 2 entities, panel, no typing ───────

      {
        const { container } = render(
          <MessageInput
            onSend={vi.fn()}
            disabled={false}
            isStreaming={false}
            channelEntities={[DAEDALUS, ARGUS]}
            mode="panel"
          />,
        );

        const snapshot = snapshotDom(container);

        for (const probe of PROBES.filter((p) => p.state === 'S-multi-idle')) {
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

      // ── State S-multi-mention: 2 entities, panel, @ typed ──────

      {
        const { container } = render(
          <MessageInput
            onSend={vi.fn()}
            disabled={false}
            isStreaming={false}
            channelEntities={[DAEDALUS, ARGUS]}
            mode="panel"
          />,
        );

        const textarea = container.querySelector('textarea')!;
        await typeAtSign(textarea);

        const snapshot = snapshotDom(container);

        for (const probe of PROBES.filter((p) => p.state === 'S-multi-mention')) {
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

      // ── State S-directed-idle: directed mode, no typing ─────────

      {
        const { container } = render(
          <MessageInput
            onSend={vi.fn()}
            disabled={false}
            isStreaming={false}
            channelEntities={[DAEDALUS, ARGUS]}
            mode="directed"
          />,
        );

        const snapshot = snapshotDom(container);

        for (const probe of PROBES.filter((p) => p.state === 'S-directed-idle')) {
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

      // ── State S-directed-mention: directed mode, @ typed ────────

      {
        const { container } = render(
          <MessageInput
            onSend={vi.fn()}
            disabled={false}
            isStreaming={false}
            channelEntities={[DAEDALUS, ARGUS]}
            mode="directed"
          />,
        );

        const textarea = container.querySelector('textarea')!;
        await typeAtSign(textarea);

        const snapshot = snapshotDom(container);

        for (const probe of PROBES.filter((p) => p.state === 'S-directed-mention')) {
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

      console.log('\n══ Round 47 — @mention Override AAXT ══════════════════════════');
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
        if (r.scopeNote) console.log(`    scope: ${r.scopeNote}`);
      }

      console.log('═══════════════════════════════════════════════════════════════\n');

      const summary = { total, correct, reconstructed, confabulated, absent, phantom, subliminal, conveyancePct };
      expect(summary.phantom).toBe(0);
    },
    600_000,
  );
});
