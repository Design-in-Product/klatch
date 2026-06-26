/**
 * Round 47 — UI-as-context AAXT: MessageInput Semantic Conveyance
 *
 * Target: packages/client/src/components/MessageInput.tsx
 *
 * The message input area is the agent's primary interaction surface. An agent observing
 * the UI must correctly read:
 *   - the current state (idle, streaming, disabled)
 *   - what actions are available (Send, Stop, Attach)
 *   - the routing mode (directed → @-mention required; panel/roundtable → free text)
 *
 * Key claims to probe:
 *   PLACEHOLDER1: S-idle — "Type a message..." placeholder communicates ready state
 *   SEND1:        S-idle — Send button is present
 *   ATTACH1:      S-idle — "Attach a file" button is present (title tooltip)
 *   STREAM-STOP:  S-streaming — Stop button replaces Send
 *   STREAM-PH:    S-streaming — "Waiting for response..." placeholder
 *   STREAM-NOATT: S-streaming — Attach button absent during streaming
 *   DIR-PH:       S-directed — "Type @ to mention an entity..." placeholder
 *
 * Scope guards:
 *   - No API mocks needed: MessageInput is entirely prop-driven
 *   - @-mention autocomplete dropdown is state-driven (appears on typing @) — not in
 *     static snapshot; the directed-mode signal is in the placeholder only
 *   - File attachment chip (S-file) requires internal state mutation; deferred to a
 *     future round using userEvent.upload
 *   - "Send" button is disabled when textarea is empty — AAXT probes its presence
 *     (visible), not its enabled/disabled state
 *
 * Gated: makes real LLM calls. Skipped unless RUN_UI_AAXT=1 in env.
 *
 * Run with:
 *   set -a; source .env; set +a; RUN_UI_AAXT=1 npx vitest run packages/client/src/__tests__/round47-message-input-aaxt.test.tsx
 */

import { describe, it, expect, vi } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { MessageInput } from '../components/MessageInput';
import type { Entity } from '@klatch/shared';

// ── Gate ─────────────────────────────────────────────────────

const ENABLED = process.env.RUN_UI_AAXT === '1';
const describeIfEnabled = ENABLED ? describe : describe.skip;

// ── Fixtures ──────────────────────────────────────────────────

function makeEntity(id: string, name: string, handle?: string): Entity {
  return {
    id,
    name,
    model: 'claude-opus-4-6',
    systemPrompt: 'You are a helpful assistant.',
    color: '#6366f1',
    handle: handle ?? null,
  } as Entity;
}

const ENTITY_ARIA = makeEntity('e1', 'Aria', 'aria');
const ENTITY_NOVA = makeEntity('e2', 'Nova', 'nova');

const baseProps = {
  onSend: vi.fn(),
  onSendWithFile: vi.fn(),
  onStop: vi.fn(),
  disabled: false,
  isStreaming: false,
};

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
  isSubliminalCandidate?: boolean;
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
    if (tag === 'svg' || tag === 'path' || tag === 'rect') return;

    const role = el.getAttribute('role');
    const ariaLabel = el.getAttribute('aria-label');
    const placeholder = el.getAttribute('placeholder');
    const title = el.getAttribute('title');
    const href = el.getAttribute('href');
    const target = el.getAttribute('target');
    const type = el.getAttribute('type');
    const disabled = (el as HTMLInputElement).disabled ? 'disabled' : null;
    const value = (el as HTMLInputElement).value
      ? `value="${(el as HTMLInputElement).value.slice(0, 60)}${(el as HTMLInputElement).value.length > 60 ? '…' : ''}"`
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
    if (value && (tag === 'input' || tag === 'textarea')) annotations.push(value);
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
  const userPrompt = `A user was shown a structured accessibility-tree snapshot of a message input area in a chat application. They answered a question about what the UI communicates. Score their answer.

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
  const systemPrompt = `You are a user looking at the message input area at the bottom of a chat application. The input area includes a textarea for typing messages, along with action buttons. Below is a structured accessibility-tree representation of this area. Based ONLY on what you can see in this representation, answer the question naturally. If something is not visible, say so. Return valid JSON.`;

  const userPrompt = `Here is the accessible representation of the message input area:

${domSnapshot || '(empty — nothing rendered)'}

Question: ${question}

Answer based only on what is visible. Return JSON: {"answer": "..."}`;

  const response = await queryAuxiliary(systemPrompt, userPrompt);
  const parsed = extractJson(response);
  return String(parsed.answer || '');
}

// ── Probes ────────────────────────────────────────────────────

interface Probe {
  id: string;
  state: 'S-idle' | 'S-streaming' | 'S-directed';
  claim: string;
  category: string;
  question: string;
  expectedAnswer: string;
  scopeNote?: string;
  isSubliminalCandidate?: boolean;
}

const PROBES: Probe[] = [
  // S-idle — normal enabled state, no active stream
  {
    id: 'PLACEHOLDER1',
    claim: 'idle-placeholder-text',
    category: 'ready-state-signaling',
    state: 'S-idle',
    question:
      'What placeholder text appears inside the message textarea when it is empty?',
    expectedAnswer:
      '"Type a message..." appears as the placeholder text in the textarea.',
  },
  {
    id: 'SEND1',
    claim: 'idle-send-button-present',
    category: 'action-availability',
    state: 'S-idle',
    question:
      'Is there a "Send" button visible in the message input area?',
    expectedAnswer:
      'Yes — a "Send" button is visible.',
  },
  {
    id: 'ATTACH1',
    claim: 'idle-attach-button-present',
    category: 'action-availability',
    state: 'S-idle',
    question:
      'Is there a button for attaching a file? What does its tooltip or title say?',
    expectedAnswer:
      'Yes — there is a button for attaching a file. Its tooltip reads "Attach a file".',
  },

  // S-streaming — response in flight; Send → Stop, attach hidden
  {
    id: 'STREAM-STOP',
    claim: 'streaming-stop-button-present',
    category: 'streaming-state-signaling',
    state: 'S-streaming',
    question:
      'What action button is visible in the message input area while a response is being generated?',
    expectedAnswer:
      'A "Stop" button is visible — it replaces the "Send" button while the AI is responding.',
  },
  {
    id: 'STREAM-PH',
    claim: 'streaming-placeholder-text',
    category: 'streaming-state-signaling',
    state: 'S-streaming',
    question:
      'What placeholder text appears in the textarea when a response is being streamed?',
    expectedAnswer:
      '"Waiting for response..." appears as the placeholder text.',
  },
  {
    id: 'STREAM-NOATT',
    claim: 'streaming-no-attach-button',
    category: 'streaming-state-signaling',
    state: 'S-streaming',
    question:
      'During streaming (while the AI is responding), is there a button to attach a file?',
    expectedAnswer:
      'No — the file attachment button is not present while the AI is responding.',
  },

  // S-directed — directed mode with 2 entities; @ mention hint in placeholder
  {
    id: 'DIR-PH',
    claim: 'directed-placeholder-at-mention-hint',
    category: 'routing-mode-signaling',
    state: 'S-directed',
    question:
      'In this mode, what does the textarea placeholder text tell you about how to address a message?',
    expectedAnswer:
      'The placeholder says "Type @ to mention an entity..." — indicating that you need to @ mention a specific entity to direct your message.',
    scopeNote: 'Directed mode uses @-mention routing; the only static signal is the placeholder text change. The autocomplete dropdown is state-driven (appears after typing @) and is not in this snapshot.',
  },
];

// ── Test execution ────────────────────────────────────────────

describeIfEnabled('Round 47 — UI-as-context AAXT (MessageInput)', () => {
  it(
    'semantic conveyance probe: idle state, streaming state, directed routing mode',
    async () => {
      if (!process.env.ANTHROPIC_API_KEY && !process.env.OPENAI_API_KEY) {
        throw new Error('No API key available — set ANTHROPIC_API_KEY or OPENAI_API_KEY');
      }

      const allResults: ScoredResult[] = [];
      const startedAt = new Date().toISOString();

      // ── State S-idle: enabled, not streaming, panel mode ──────

      {
        const { container } = render(
          <MessageInput
            {...baseProps}
            isStreaming={false}
            disabled={false}
            mode="panel"
          />,
        );

        const snapshot = snapshotDom(container);

        for (const probe of PROBES.filter((p) => p.state === 'S-idle')) {
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

      // ── State S-streaming: isStreaming=true ────────────────────

      {
        const { container } = render(
          <MessageInput
            {...baseProps}
            isStreaming={true}
            disabled={false}
            mode="panel"
          />,
        );

        const snapshot = snapshotDom(container);

        for (const probe of PROBES.filter((p) => p.state === 'S-streaming')) {
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

      // ── State S-directed: directed mode + 2 entities ──────────

      {
        const { container } = render(
          <MessageInput
            {...baseProps}
            isStreaming={false}
            disabled={false}
            mode="directed"
            channelEntities={[ENTITY_ARIA, ENTITY_NOVA]}
          />,
        );

        const snapshot = snapshotDom(container);

        for (const probe of PROBES.filter((p) => p.state === 'S-directed')) {
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

      // ── Summary ────────────────────────────────────────────

      const total = allResults.length;
      const correct = allResults.filter((r) => r.classification === 'Correct').length;
      const reconstructed = allResults.filter((r) => r.classification === 'Reconstructed').length;
      const confabulated = allResults.filter((r) => r.classification === 'Confabulated').length;
      const absent = allResults.filter((r) => r.classification === 'Absent').length;
      const phantom = allResults.filter((r) => r.classification === 'Phantom').length;
      const subliminal = allResults.filter((r) => r.classification === 'Subliminal').length;

      const expectedAbsent = allResults.filter(
        (r) => r.isSubliminalCandidate && ['Absent', 'Subliminal'].includes(r.classification),
      ).length;
      const adjustedTotal = total - expectedAbsent;
      const adjustedConveyed = correct + reconstructed;
      const conveyancePct = Math.round((adjustedConveyed / adjustedTotal) * 100);

      console.log('\n══ Round 47 — MessageInput AAXT ════════════════════════════════');
      console.log(`  Started: ${startedAt}`);
      console.log(`  Total probes: ${total} | Adjusted (excl. expected-absent): ${adjustedTotal}`);
      console.log(
        `  Correct: ${correct} | Reconstructed: ${reconstructed} | Confabulated: ${confabulated} | Absent: ${absent} | Phantom: ${phantom} | Subliminal: ${subliminal}`,
      );
      console.log(`  Conveyance: ${conveyancePct}% (adjusted)`);
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

      // Hard guard: zero Phantoms (false claims about visible UI) is non-negotiable
      const summary = { total, correct, reconstructed, confabulated, absent, phantom, subliminal, conveyancePct };
      expect(summary.phantom).toBe(0);
    },
    600_000,
  );
});
