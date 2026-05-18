/**
 * Round 36 — UI-as-context AAXT: Sidebar Semantic Conveyance
 *
 * Extends AAXT methodology from the agent surface to the user surface.
 *
 * The original AAXT pipeline (Round 19+) asks: "Does an LLM that consumes
 * this system prompt actually have access to the content it's supposed to
 * have?" — i.e., is the agent-facing context layer behaviorally accessible
 * (not just structurally delivered)?
 *
 * This round asks the parallel question for the **user surface**: "Does a
 * user looking at this rendered UI accurately perceive the state the
 * underlying data represents?"
 *
 * Same six-failure-mode taxonomy: Correct, Reconstructed, Confabulated,
 * Absent, Phantom, Subliminal. The Subliminal case is especially valuable
 * here — per Iris's guidance, cases where the DOM contains the data but
 * the rendered surface obscures it are the most interesting findings on
 * the user side.
 *
 * Method (Option 1 from design discussion 5/18):
 *   1. Render <ChannelSidebar /> via React Testing Library + JSDOM
 *   2. Snapshot the accessible text + ARIA tree
 *   3. For each design claim, send snapshot + probe question to auxiliary
 *      LLM acting as "user reading the UI"
 *   4. Score the response against ground truth derived from DB state
 *   5. Tally per-state, per-claim. Report.
 *
 * Gated: this test makes real LLM calls and costs money. Skipped unless
 * RUN_UI_AAXT=1 in env. CI never runs it.
 *
 * Run with:
 *   RUN_UI_AAXT=1 npx vitest run packages/client/src/__tests__/round36-ui-context-aaxt.test.tsx
 *
 * Design discussion: docs/logs/2026-05-18-0724-theseus-opus-log.md
 * Iris alignment: docs/mail/iris-to-theseus-ui-as-context-aaxt-reply-2026-05-18.md
 */

import { describe, it, expect } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import type { Channel } from '@klatch/shared';
import { ChannelSidebar } from '../components/ChannelSidebar';
import type { Project } from '../api/client';

// ── Gate ─────────────────────────────────────────────────────

const ENABLED = process.env.RUN_UI_AAXT === '1';
const describeIfEnabled = ENABLED ? describe : describe.skip;

// ── Types ────────────────────────────────────────────────────

type Classification =
  | 'Correct'
  | 'Reconstructed'
  | 'Confabulated'
  | 'Absent'
  | 'Phantom'
  | 'Subliminal';

interface Probe {
  id: string;          // e.g., "S1.C1" — state.claim
  state: string;       // state name
  claim: string;       // claim id
  question: string;    // user-question
  expectedAnswer: string; // ground truth derived from DB state
  category: string;    // which design claim category
}

interface ScoredResult {
  probe: Probe;
  agentResponse: string;
  classification: Classification;
  confidence: number;
  reasoning: string;
}

interface TestState {
  name: string;
  description: string;
  channels: Channel[];
  projects: Project[];
}

// ── Auxiliary LLM client (inline; mirrors server/src/aaxt/auxiliary.ts) ──

async function queryAuxiliary(systemPrompt: string, userPrompt: string): Promise<string> {
  const openaiKey = process.env.OPENAI_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  if (openaiKey) {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: process.env.AAXT_AUXILIARY_MODEL || 'gpt-4o-mini',
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

  throw new Error('No API key for auxiliary LLM');
}

function extractJson(text: string): any {
  const trimmed = text.trim();
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) return JSON.parse(trimmed);
  const fenceMatch = trimmed.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
  if (fenceMatch) return JSON.parse(fenceMatch[1].trim());
  return JSON.parse(trimmed);
}

// ── Snapshot helpers ─────────────────────────────────────────

/**
 * Extract a structured, accessible representation of the rendered DOM.
 * Captures: visible text, ARIA roles/labels, button affordances, hierarchy.
 * Deliberately discards CSS visual rules — Option 1 tests semantic conveyance
 * via accessible-tree alone, not visual hierarchy. (Option 2 would add screenshots.)
 */
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

    // Skip purely decorative SVGs (chevrons, icons) to keep snapshot focused
    if (tag === 'svg' || tag === 'path') return;

    const role = el.getAttribute('role');
    const ariaLabel = el.getAttribute('aria-label');
    const title = el.getAttribute('title');
    const dataTestId = el.getAttribute('data-testid');
    const isButton = tag === 'button';

    const annotations: string[] = [];
    if (role) annotations.push(`role=${role}`);
    if (ariaLabel) annotations.push(`aria-label="${ariaLabel}"`);
    if (title) annotations.push(`title="${title}"`);
    if (dataTestId) annotations.push(`data-testid=${dataTestId}`);
    if (isButton) annotations.push('clickable');

    const desc = annotations.length > 0 ? `<${tag} ${annotations.join(' ')}>` : `<${tag}>`;

    // Inline single-text-child elements for readability
    const onlyTextChild =
      el.childNodes.length === 1 &&
      el.firstChild?.nodeType === Node.TEXT_NODE &&
      el.firstChild.textContent?.trim();

    if (onlyTextChild) {
      lines.push(`${indent}${desc} "${onlyTextChild}"`);
      return;
    }

    if (annotations.length > 0 || ['button', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'nav', 'main', 'section', 'article', 'aside'].includes(tag)) {
      lines.push(`${indent}${desc}`);
      for (const child of Array.from(el.childNodes)) walk(child, depth + 1);
    } else {
      // Skip the wrapper, descend
      for (const child of Array.from(el.childNodes)) walk(child, depth);
    }
  }

  walk(container, 0);
  return lines.join('\n');
}

// ── Scorer ───────────────────────────────────────────────────

async function scoreResponse(
  question: string,
  expectedAnswer: string,
  agentResponse: string,
): Promise<{ classification: Classification; confidence: number; reasoning: string }> {
  const systemPrompt = `You are scoring a user's perception of a UI against the ground truth. You must return valid JSON.`;
  const userPrompt = `A user was shown a structured representation of a rendered UI surface (the accessible text and ARIA tree). They were asked a question. Score their response.

Question asked: ${question}

Expected answer (ground truth from underlying data): ${expectedAnswer}

User's response: ${agentResponse}

Classify the response as exactly one of:
- CORRECT: Response contains the expected information, possibly rephrased
- RECONSTRUCTED: Semantically right but surface form has drifted significantly
- CONFABULATED: Plausible but invented — user filled a gap with wrong information
- ABSENT: User correctly reports they cannot determine the answer from what they can see
- PHANTOM: User confidently claims something false (e.g., asserts a specific count or property the UI doesn't show)
- SUBLIMINAL: User answers correctly but explicitly notes they cannot tell from what they see (correct guess from indirect cues; the data is technically present but the surface obscures it)

Return JSON: {"classification": "...", "confidence": 0.0-1.0, "reasoning": "..."}`;

  try {
    const response = await queryAuxiliary(systemPrompt, userPrompt);
    const parsed = extractJson(response);
    const valid: Classification[] = ['Correct', 'Reconstructed', 'Confabulated', 'Absent', 'Phantom', 'Subliminal'];
    const classification = valid.find((c) => c.toLowerCase() === String(parsed.classification || '').toLowerCase()) || 'Absent';
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

// ── User-proxy probe ─────────────────────────────────────────

async function probeUser(domSnapshot: string, question: string): Promise<string> {
  const systemPrompt = `You are a user looking at a software application UI. Below is a structured representation of what is visible on screen — the accessible text and ARIA tree of a sidebar component, including button labels, titles, tooltips, and visible text content. Based ONLY on what you can see in this representation, answer the user's question naturally. If you cannot tell from what is visible, say so honestly. You must return valid JSON.`;

  const userPrompt = `Here is what you can see in the sidebar:

${domSnapshot}

Question: ${question}

Answer the question based on what is visible. Return JSON: {"answer": "..."}`;

  const response = await queryAuxiliary(systemPrompt, userPrompt);
  const parsed = extractJson(response);
  return String(parsed.answer || '');
}

// ── Test states ──────────────────────────────────────────────

function chan(overrides: Partial<Channel> & { id: string; name: string }): Channel {
  return {
    systemPrompt: '',
    model: 'claude-opus-4-6' as any,
    mode: 'panel' as any,
    type: 'chat',
    createdAt: '2026-05-01T00:00:00Z',
    ...overrides,
  };
}

const STATES: TestState[] = [
  {
    name: 'S1-realistic',
    description: 'Mirrors current live DB: #general + one rich project (mixed chats/klatches) + one project of imports + unassigned',
    projects: [
      { id: 'proj-aaxt', name: 'AAXT Test Project', instructions: '' },
      { id: 'proj-klatch', name: 'Klatch', instructions: '' },
    ] as any,
    channels: [
      chan({ id: 'default', name: 'general' }),
      chan({ id: 'aaxt-rich', name: 'aaxt-rich', projectId: 'proj-aaxt', projectName: 'AAXT Test Project', entityCount: 1 }),
      chan({ id: 'aaxt-klatch', name: 'standup', type: 'klatch', projectId: 'proj-aaxt', projectName: 'AAXT Test Project', entityCount: 3 }),
      chan({ id: 'aaxt-bare', name: 'aaxt-bare', projectId: 'proj-aaxt', projectName: 'AAXT Test Project', entityCount: 1 }),
      chan({ id: 'theseus-imp', name: 'theseus-2026-03-22-imported', source: 'claude-code', projectId: 'proj-klatch', projectName: 'Klatch', entityCount: 1 }),
      chan({ id: 'cio-imp', name: 'CIO — 2026-04-23 to 5/10', source: 'claude-code', projectId: 'proj-klatch', projectName: 'Klatch', entityCount: 1 }),
      chan({ id: 'free-chat', name: 'free-floating-notes', entityCount: 1 }),
    ],
  },
  {
    name: 'S2-chats-only',
    description: 'Single project with chats only — no klatch distinction visible',
    projects: [{ id: 'proj-x', name: 'ProjectX', instructions: '' }] as any,
    channels: [
      chan({ id: 'default', name: 'general' }),
      chan({ id: 'c1', name: 'chat-one', projectId: 'proj-x', projectName: 'ProjectX', entityCount: 1 }),
      chan({ id: 'c2', name: 'chat-two', projectId: 'proj-x', projectName: 'ProjectX', entityCount: 1 }),
    ],
  },
  {
    name: 'S3-klatches-only',
    description: 'Single project with klatches only — no chat distinction visible',
    projects: [{ id: 'proj-y', name: 'KlatchProject', instructions: '' }] as any,
    channels: [
      chan({ id: 'default', name: 'general' }),
      chan({ id: 'k1', name: 'morning-standup', type: 'klatch', projectId: 'proj-y', projectName: 'KlatchProject', entityCount: 3 }),
      chan({ id: 'k2', name: 'retro', type: 'klatch', projectId: 'proj-y', projectName: 'KlatchProject', entityCount: 4 }),
    ],
  },
  {
    name: 'S4-unassigned-heavy',
    description: 'Many unassigned chats, no projects — tests Unassigned section visibility',
    projects: [] as any,
    channels: [
      chan({ id: 'default', name: 'general' }),
      chan({ id: 'u1', name: 'orphan-one', entityCount: 1 }),
      chan({ id: 'u2', name: 'orphan-two', entityCount: 1 }),
      chan({ id: 'u3', name: 'orphan-three', entityCount: 1 }),
    ],
  },
  {
    name: 'S5-empty',
    description: 'Empty state — only #general',
    projects: [] as any,
    channels: [chan({ id: 'default', name: 'general' })],
  },
];

// ── Probe builders ───────────────────────────────────────────

/**
 * Each builder takes a TestState and produces zero-or-more probes
 * applicable to that state. Skip if state doesn't have the relevant data.
 */
const PROBE_BUILDERS: Array<(s: TestState) => Probe[]> = [
  // C1: Project grouping — "Which project contains channel X?"
  (s) => {
    const projChan = s.channels.find((c) => c.projectId && c.id !== 'default');
    if (!projChan) return [];
    return [{
      id: `${s.name}.C1`,
      state: s.name,
      claim: 'C1-project-grouping',
      question: `Which project, if any, contains the channel named "${projChan.name}"?`,
      expectedAnswer: `${projChan.projectName}`,
      category: 'project-grouping',
    }];
  },

  // C2: Channel type distinction — "Is X a one-on-one chat or a group conversation?"
  (s) => {
    const klatch = s.channels.find((c) => c.type === 'klatch');
    if (!klatch) return [];
    return [{
      id: `${s.name}.C2`,
      state: s.name,
      claim: 'C2-channel-type',
      question: `Is the channel named "${klatch.name}" a one-on-one conversation with a single AI agent, or a group conversation with multiple agents?`,
      expectedAnswer: `Group conversation with multiple agents (it is a klatch with ${klatch.entityCount ?? '?'} entities)`,
      category: 'channel-type',
    }];
  },

  // C3: Entity count — "How many agents are in the X channel?"
  (s) => {
    const multi = s.channels.find((c) => (c.entityCount ?? 0) >= 2);
    if (!multi) return [];
    return [{
      id: `${s.name}.C3`,
      state: s.name,
      claim: 'C3-entity-count',
      question: `How many AI agents participate in the channel named "${multi.name}"?`,
      expectedAnswer: `${multi.entityCount}`,
      category: 'entity-count',
    }];
  },

  // C4: Source provenance — "Was X imported or created in Klatch?"
  (s) => {
    const imp = s.channels.find((c) => c.source === 'claude-code');
    if (!imp) return [];
    return [{
      id: `${s.name}.C4`,
      state: s.name,
      claim: 'C4-source-provenance',
      question: `Was the channel named "${imp.name}" created here in this application, or imported from somewhere else?`,
      expectedAnswer: `Imported from elsewhere (specifically from Claude Code)`,
      category: 'source-provenance',
    }];
  },

  // C5: Project channel count — "How many channels are under project Y?"
  (s) => {
    const projChans = new Map<string, { name: string; count: number }>();
    for (const c of s.channels) {
      if (c.projectId && c.projectName) {
        const e = projChans.get(c.projectId) ?? { name: c.projectName, count: 0 };
        e.count++;
        projChans.set(c.projectId, e);
      }
    }
    const first = projChans.values().next().value;
    if (!first) return [];
    return [{
      id: `${s.name}.C5`,
      state: s.name,
      claim: 'C5-project-channel-count',
      question: `How many channels belong to the project named "${first.name}"?`,
      expectedAnswer: `${first.count}`,
      category: 'project-channel-count',
    }];
  },

  // C6: Order within project — chats before klatches
  (s) => {
    const projWithBoth = new Map<string, { chats: number; klatches: number; name: string }>();
    for (const c of s.channels) {
      if (!c.projectId) continue;
      const e = projWithBoth.get(c.projectId) ?? { chats: 0, klatches: 0, name: c.projectName ?? '' };
      if (c.type === 'klatch') e.klatches++; else e.chats++;
      projWithBoth.set(c.projectId, e);
    }
    const mixed = [...projWithBoth.values()].find((e) => e.chats > 0 && e.klatches > 0);
    if (!mixed) return [];
    return [{
      id: `${s.name}.C6`,
      state: s.name,
      claim: 'C6-order-within-project',
      question: `Within the project "${mixed.name}", which type of channel appears first in the list — single-agent chats or multi-agent klatches?`,
      expectedAnswer: `Single-agent chats appear first (chats are listed above klatches within a project)`,
      category: 'order-within-project',
    }];
  },

  // C7: Accordion state — which project is expanded
  (s) => {
    if (s.projects.length < 1) return [];
    // The component auto-expands the first project (or the one containing active channel)
    const first = s.projects[0];
    return [{
      id: `${s.name}.C7`,
      state: s.name,
      claim: 'C7-accordion-state',
      question: `Looking at the sidebar, which project's channels are currently visible/expanded? (If multiple, name them all. If none are expanded, say so.)`,
      expectedAnswer: `The project named "${first.name}" is expanded; its channels are visible in the list`,
      category: 'accordion-state',
    }];
  },
];

// ── Test execution ───────────────────────────────────────────

describeIfEnabled('Round 36 — UI-as-context AAXT (sidebar)', () => {
  it('semantic conveyance probe across 5 states × 7 claim categories', async () => {
    if (!process.env.OPENAI_API_KEY && !process.env.ANTHROPIC_API_KEY) {
      throw new Error('No API key available — set ANTHROPIC_API_KEY or OPENAI_API_KEY');
    }

    const allResults: ScoredResult[] = [];
    const startedAt = new Date().toISOString();

    for (const state of STATES) {
      // Render the sidebar with this state
      const { container } = render(
        <ChannelSidebar
          channels={state.channels}
          activeChannelId="default"
          onSelectChannel={() => {}}
          onCreateChannel={() => {}}
          projects={state.projects}
          entities={[]}
          theme="light"
          onToggleTheme={() => {}}
        />,
      );

      const snapshot = snapshotDom(container);

      // Build all probes applicable to this state
      const probes: Probe[] = [];
      for (const builder of PROBE_BUILDERS) probes.push(...builder(state));

      // Execute probes
      for (const probe of probes) {
        try {
          const agentResponse = await probeUser(snapshot, probe.question);
          const score = await scoreResponse(probe.question, probe.expectedAnswer, agentResponse);
          allResults.push({
            probe,
            agentResponse,
            classification: score.classification,
            confidence: score.confidence,
            reasoning: score.reasoning,
          });
        } catch (err) {
          allResults.push({
            probe,
            agentResponse: '',
            classification: 'Absent',
            confidence: 0,
            reasoning: `Probe error: ${err instanceof Error ? err.message : String(err)}`,
          });
        }
      }

      cleanup();
    }

    // ── Report ─────────────────────────────────────────────────
    const finishedAt = new Date().toISOString();
    const provider = process.env.OPENAI_API_KEY ? 'openai/gpt-4o-mini' : 'anthropic/claude-haiku-4-5';

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('Round 36 — UI-as-context AAXT (Sidebar)');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`Started:   ${startedAt}`);
    console.log(`Finished:  ${finishedAt}`);
    console.log(`Auxiliary: ${provider}`);
    console.log(`Probes:    ${allResults.length}`);
    console.log();

    // By state
    for (const state of STATES) {
      const stateResults = allResults.filter((r) => r.probe.state === state.name);
      if (stateResults.length === 0) continue;
      console.log(`── ${state.name} — ${state.description}`);
      for (const r of stateResults) {
        console.log(`   [${r.classification}] (${r.confidence.toFixed(2)}) ${r.probe.claim}`);
        console.log(`     Q: ${r.probe.question}`);
        console.log(`     Expected: ${r.probe.expectedAnswer}`);
        console.log(`     Got: ${r.agentResponse.slice(0, 200)}`);
        if (['Confabulated', 'Phantom', 'Subliminal'].includes(r.classification)) {
          console.log(`     ⚠ Reasoning: ${r.reasoning}`);
        }
        console.log();
      }
    }

    // Tally
    const tally = (cls: Classification) => allResults.filter((r) => r.classification === cls).length;
    const summary = {
      total: allResults.length,
      correct: tally('Correct'),
      reconstructed: tally('Reconstructed'),
      confabulated: tally('Confabulated'),
      absent: tally('Absent'),
      phantom: tally('Phantom'),
      subliminal: tally('Subliminal'),
    };

    console.log('═══════════════════════════════════════════════════════');
    console.log('Summary');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`Total:         ${summary.total}`);
    console.log(`Correct:       ${summary.correct}`);
    console.log(`Reconstructed: ${summary.reconstructed}`);
    console.log(`Confabulated:  ${summary.confabulated}`);
    console.log(`Absent:        ${summary.absent}`);
    console.log(`Phantom:       ${summary.phantom}  ${summary.phantom > 0 ? '← HARD FAIL' : ''}`);
    console.log(`Subliminal:    ${summary.subliminal}  ${summary.subliminal > 0 ? '← UI obscures present data (Iris finding territory)' : ''}`);
    const accessibilityRate = ((summary.correct + summary.reconstructed) / summary.total * 100).toFixed(1);
    console.log(`Semantic conveyance rate (Correct+Reconstructed): ${accessibilityRate}%`);
    console.log();

    // Per-category breakdown
    const categories = [...new Set(allResults.map((r) => r.probe.category))];
    console.log('Per-claim breakdown:');
    for (const cat of categories) {
      const catResults = allResults.filter((r) => r.probe.category === cat);
      const c = catResults.filter((r) => r.classification === 'Correct').length;
      const r = catResults.filter((r) => r.classification === 'Reconstructed').length;
      const cf = catResults.filter((r) => r.classification === 'Confabulated').length;
      const a = catResults.filter((r) => r.classification === 'Absent').length;
      const p = catResults.filter((r) => r.classification === 'Phantom').length;
      const s = catResults.filter((r) => r.classification === 'Subliminal').length;
      console.log(`  ${cat}: C:${c} R:${r} F:${cf} A:${a} P:${p} S:${s} (${catResults.length} probes)`);
    }

    // Assertion: phantoms are a hard fail. Everything else is a finding to discuss.
    expect(summary.phantom).toBe(0);
  }, 600_000);
});
