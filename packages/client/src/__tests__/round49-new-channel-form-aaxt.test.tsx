/**
 * Round 49 — UI-as-context AAXT: New Channel Form Semantic Conveyance
 *
 * Target: ChannelSidebar.tsx inline form (lines ~460–647)
 *
 * The "New Chat / New Klatch" form in the sidebar is the composition gesture entry point —
 * every feature from Inc 1–6 (type toggle, agent picker, project select, mode select,
 * clone-from-klatch, purpose field) lives here. An agent must correctly read:
 *   - what field names and placeholders signal about the form's purpose
 *   - which fields are Klatch-only vs Chat-only
 *   - the clone-from-klatch affordance (title tooltip, default option text)
 *   - the mode selector's presence and options
 *   - the agent picker's label
 *
 * Key claims to probe:
 *   CHAT-PH:     S-chat     — "Chat name" placeholder in name input
 *   CHAT-BTN:    S-chat     — "Create Chat" submit button
 *   CHAT-NOMODE: S-chat     — No Mode selector visible (klatch-only)
 *   KLATCH-PH:   S-klatch-bare — "Klatch name" placeholder
 *   NO-CLONE:    S-klatch-bare — Clone select absent when no klatches exist
 *   MODE-SEL:    S-klatch-bare — Mode selector present with Broadcast/Roundtable/Directed
 *   CLONE-PH:    S-klatch-full — "Copy setup from an existing klatch…" default option
 *   CLONE-TITLE: S-klatch-full — Clone select title tooltip describes the prefill action
 *   AGENTS-HDR:  S-klatch-full — "Agents" label in agent picker section
 *
 * Scope guards:
 *   - No API mocks needed: form is prop-driven; fetchChannelEntities only fires on clone select change
 *   - Clone prefill behavior (post-select state mutations) is not in static snapshot; deferred
 *   - Project select visibility tested implicitly via S-klatch-full (projects=[] in bare state)
 *   - @mention autocomplete (Inc 7) is state-driven; not in static snapshot
 *   - Mode select is added to snapshotDom interesting list here (no title attribute on the element)
 *     so its option texts appear as structured children rather than floating text nodes
 *
 * Gated: makes real LLM calls. Skipped unless RUN_UI_AAXT=1 in env.
 *
 * Run with:
 *   set -a; source .env; set +a; RUN_UI_AAXT=1 npx vitest run packages/client/src/__tests__/round49-new-channel-form-aaxt.test.tsx
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, cleanup, fireEvent } from '@testing-library/react';
import { ChannelSidebar } from '../components/ChannelSidebar';
import type { Channel, Entity } from '@klatch/shared';
import type { Project } from '../api/client';

// ── Gate ─────────────────────────────────────────────────────

const ENABLED = process.env.RUN_UI_AAXT === '1';
const describeIfEnabled = ENABLED ? describe : describe.skip;

// ── Fixtures ──────────────────────────────────────────────────

function makeChannel(overrides: Partial<Channel> & { id: string; name: string }): Channel {
  return {
    systemPrompt: '',
    createdAt: '2026-01-01T00:00:00Z',
    type: 'chat',
    mode: 'panel',
    projectId: null,
    source: null,
    sourceMetadata: null,
    ...overrides,
  } as Channel;
}

function makeKlatch(id: string, name: string): Channel {
  return makeChannel({ id, name, type: 'klatch' });
}

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

function makeProject(id: string, name: string): Project {
  return {
    id,
    name,
    instructions: null,
    memory: null,
    source: null,
    sourceMetadata: null,
    createdAt: '2026-01-01T00:00:00Z',
  } as Project;
}

const KLATCH_ALPHA = makeKlatch('k1', 'Alpha');
const ENTITY_ARIA = makeEntity('e1', 'Aria', 'aria');
const PROJECT_MAIN = makeProject('p1', 'Main Project');

const baseProps = {
  activeChannelId: '',
  onSelectChannel: vi.fn(),
  onCreateChannel: vi.fn(),
  theme: 'light' as const,
  onToggleTheme: vi.fn(),
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
// Note: `select` added to interesting list so Mode selector renders as a structured
// container (with its Broadcast/Roundtable/Directed option texts as children) rather
// than having option text appear as floating text nodes in the surrounding form content.

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
    if (tag === 'strong') annotations.push('bold');
    if (tag === 'em') annotations.push('italic');

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
       'article', 'aside', 'form', 'a', 'label', 'input', 'textarea', 'span',
       'select'].includes(tag);

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
  const userPrompt = `A user was shown a structured accessibility-tree snapshot of a channel creation form in a chat application. They answered a question about what the UI communicates. Score their answer.

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
  const systemPrompt = `You are a user looking at a channel creation form inside the sidebar of a chat application. The form allows creating either a "Chat" (1 agent) or a "Klatch" (multi-agent conversation). Below is a structured accessibility-tree representation of the form. Based ONLY on what you can see in this representation, answer the question naturally. If something is not visible, say so. Return valid JSON.`;

  const userPrompt = `Here is the accessible representation of the channel creation form:

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
  state: 'S-chat' | 'S-klatch-bare' | 'S-klatch-full';
  claim: string;
  category: string;
  question: string;
  expectedAnswer: string;
  scopeNote?: string;
  isSubliminalCandidate?: boolean;
}

const PROBES: Probe[] = [
  // S-chat — form open with Chat type, no entities/projects/klatches
  {
    id: 'CHAT-PH',
    state: 'S-chat',
    claim: 'chat-name-placeholder',
    category: 'field-labeling',
    question: 'What placeholder text appears in the name input field when creating a Chat?',
    expectedAnswer: '"Chat name" appears as the placeholder in the name input field.',
  },
  {
    id: 'CHAT-BTN',
    state: 'S-chat',
    claim: 'create-chat-button-label',
    category: 'action-labeling',
    question: 'What text appears on the primary submit/create button?',
    expectedAnswer: '"Create Chat" appears as the submit button text.',
  },
  {
    id: 'CHAT-NOMODE',
    state: 'S-chat',
    claim: 'no-mode-selector-in-chat-form',
    category: 'field-visibility-guard',
    question: 'Is there a Mode selector (with options like Broadcast, Roundtable, or Directed) visible in the form?',
    expectedAnswer: 'No Mode selector is visible — mode selection only appears for Klatch type, not Chat.',
  },

  // S-klatch-bare — Klatch type, no existing klatches, no entities, no projects
  {
    id: 'KLATCH-PH',
    state: 'S-klatch-bare',
    claim: 'klatch-name-placeholder',
    category: 'field-labeling',
    question: 'What placeholder text appears in the name input field when creating a Klatch?',
    expectedAnswer: '"Klatch name" appears as the placeholder in the name input field.',
  },
  {
    id: 'NO-CLONE',
    state: 'S-klatch-bare',
    claim: 'no-clone-select-when-no-existing-klatches',
    category: 'field-visibility-guard',
    question: 'Is there an option or selector for copying setup from an existing klatch?',
    expectedAnswer: 'No clone-setup selector is visible — it only appears when at least one klatch already exists.',
  },
  {
    id: 'MODE-SEL',
    state: 'S-klatch-bare',
    claim: 'mode-selector-present-with-broadcast-roundtable-directed',
    category: 'field-presence',
    question: 'Is there a field for choosing an interaction mode? If so, what options are available?',
    expectedAnswer: 'A mode selector is visible with options including Broadcast, Roundtable, and Directed.',
  },

  // S-klatch-full — Klatch type, 1 existing klatch, 1 entity, 1 project
  {
    id: 'CLONE-PH',
    state: 'S-klatch-full',
    claim: 'clone-select-default-option-text',
    category: 'composition-gesture-discoverability',
    question: 'Is there an element for copying setup from an existing klatch? What does its default or placeholder option say?',
    expectedAnswer: '"Copy setup from an existing klatch…" appears as the default/placeholder option of the clone action-select.',
  },
  {
    id: 'CLONE-TITLE',
    state: 'S-klatch-full',
    claim: 'clone-select-title-tooltip',
    category: 'composition-gesture-discoverability',
    question: 'What tooltip or title attribute does the clone-setup element have?',
    expectedAnswer: 'The clone select\'s title reads "Pre-fill name, agents, mode, purpose, and project from an existing klatch".',
    isSubliminalCandidate: true,
  },
  {
    id: 'AGENTS-HDR',
    state: 'S-klatch-full',
    claim: 'agents-section-label',
    category: 'composition-gesture-discoverability',
    question: 'Is there an agent picker or agent selection area visible? What label or heading does it have?',
    expectedAnswer: 'An "Agents" label heading is visible above the agent selection area.',
  },
];

// ── Test execution ────────────────────────────────────────────

describeIfEnabled('Round 49 — UI-as-context AAXT (New Channel Form)', () => {
  it(
    'semantic conveyance probe: chat form, bare klatch form, klatch form with existing data',
    async () => {
      if (!process.env.ANTHROPIC_API_KEY && !process.env.OPENAI_API_KEY) {
        throw new Error('No API key available — set ANTHROPIC_API_KEY or OPENAI_API_KEY');
      }

      const allResults: ScoredResult[] = [];
      const startedAt = new Date().toISOString();

      // ── State S-chat: form open, Chat type ────────────────────

      {
        const { container, getByText } = render(
          <ChannelSidebar
            {...baseProps}
            channels={[]}
            entities={[]}
            projects={[]}
          />,
        );

        // Open the form in Chat mode
        fireEvent.click(getByText('+ New Chat'));

        const snapshot = snapshotDom(container);

        for (const probe of PROBES.filter((p) => p.state === 'S-chat')) {
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

      // ── State S-klatch-bare: Klatch type, no existing klatches ─

      {
        const { container, getByText } = render(
          <ChannelSidebar
            {...baseProps}
            channels={[]}
            entities={[]}
            projects={[]}
          />,
        );

        // Open the form in Klatch mode
        fireEvent.click(getByText('+ New Klatch'));

        const snapshot = snapshotDom(container);

        for (const probe of PROBES.filter((p) => p.state === 'S-klatch-bare')) {
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

      // ── State S-klatch-full: Klatch type + existing data ───────

      {
        const { container, getByText } = render(
          <ChannelSidebar
            {...baseProps}
            channels={[KLATCH_ALPHA]}
            entities={[ENTITY_ARIA]}
            projects={[PROJECT_MAIN]}
          />,
        );

        // Open the form in Klatch mode
        fireEvent.click(getByText('+ New Klatch'));

        const snapshot = snapshotDom(container);

        for (const probe of PROBES.filter((p) => p.state === 'S-klatch-full')) {
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

      const expectedAbsent = allResults.filter(
        (r) => r.isSubliminalCandidate && ['Absent', 'Subliminal'].includes(r.classification),
      ).length;
      const adjustedTotal = total - expectedAbsent;
      const adjustedConveyed = correct + reconstructed;
      const conveyancePct = Math.round((adjustedConveyed / adjustedTotal) * 100);

      console.log('\n══ Round 49 — New Channel Form AAXT ═══════════════════════════════');
      console.log(`  Started: ${startedAt}`);
      console.log(`  Total probes: ${total} | Adjusted (excl. expected-absent): ${adjustedTotal}`);
      console.log(
        `  Correct: ${correct} | Reconstructed: ${reconstructed} | Confabulated: ${confabulated} | Absent: ${absent} | Phantom: ${phantom} | Subliminal: ${subliminal}`,
      );
      console.log(`  Conveyance: ${conveyancePct}% (adjusted)`);
      console.log('\n── Probe detail ──────────────────────────────────────────────────────');

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

      console.log('═════════════════════════════════════════════════════════════════════\n');

      // Hard guard: zero Phantoms (false claims about visible UI) is non-negotiable
      const summary = { total, correct, reconstructed, confabulated, absent, phantom, subliminal, conveyancePct };
      expect(summary.phantom).toBe(0);
    },
    600_000,
  );
});
