/**
 * Round 46 — UI-as-context AAXT: ChannelSidebar "First project" default-project group
 *
 * Target: packages/client/src/components/ChannelSidebar.tsx
 *   Default-project logic (lines 359–386):
 *     - S-flat: no real projects → render null-project channels flat, no "First project" header
 *     - S-mixed: real projects present → show "First project" collapsible group at the bottom
 *   And within-project ordering: chats above klatches, each with "CHATS"/"KLATCHES" subheaders
 *   (only when both types are present).
 *
 * Key claims to probe:
 *   FLAT1:        S-flat — no "First project" header (singleton/flat render)
 *   AT1:          S-flat — chat items carry @ prefix
 *   FP1:          S-mixed — "First project" label communicates a default bucket (not a named project)
 *   HASH1:        S-mixed — klatch items carry # prefix
 *   FP-KLATCH1:   S-mixed — project-less klatch appears under "First project", not under a named project
 *   ORDER1:       S-order — "CHATS" subheader appears above "KLATCHES" within an expanded project
 *   ORDER2:       S-order — chats (@) precede klatches (#) within the same project group
 *
 * Scope guards:
 *   - No API mocks needed: ChannelSidebar is prop-driven; all channel data passed directly
 *   - Accordion auto-expand is synchronous (useMemo on first render) — no waitFor needed
 *   - "First project" is always expanded by default (collapsedSections starts empty)
 *   - "CHATS"/"KLATCHES" subheaders only appear when BOTH types are present in a group
 *   - FP1 is the highest-value Subliminal candidate: an LLM may read "First project" as a
 *     specific named project rather than a default bucket for unassigned channels
 *   - #general is always pinned at top; excluded from within-group ordering probes
 *
 * Gated: makes real LLM calls. Skipped unless RUN_UI_AAXT=1 in env.
 *
 * Run with:
 *   set -a; source .env; set +a; RUN_UI_AAXT=1 npx vitest run packages/client/src/__tests__/round46-sidebar-first-project-aaxt.test.tsx
 */

import { describe, it, expect, vi } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { ChannelSidebar } from '../components/ChannelSidebar';
import type { Channel } from '@klatch/shared';
import type { Project } from '../api/client';

// ── Gate ─────────────────────────────────────────────────────

const ENABLED = process.env.RUN_UI_AAXT === '1';
const describeIfEnabled = ENABLED ? describe : describe.skip;

// ── Fixtures ──────────────────────────────────────────────────

function makeChannel(overrides: Partial<Channel> & { id: string; name: string }): Channel {
  return {
    systemPrompt: '',
    model: 'claude-opus-4-6',
    mode: 'panel',
    createdAt: '2026-01-01T00:00:00Z',
    type: 'chat',
    source: 'native',
    ...overrides,
  } as Channel;
}

function makeProject(id: string, name: string): Project {
  return {
    id,
    name,
    instructions: '',
    memory: '',
    source: 'native',
    sourceMetadata: '{}',
    createdAt: '2026-01-01T00:00:00Z',
  };
}

const defaultProps = {
  activeChannelId: 'default',
  onSelectChannel: vi.fn(),
  onCreateChannel: vi.fn(),
  theme: 'light' as const,
  onToggleTheme: vi.fn(),
};

const GENERAL = makeChannel({ id: 'default', name: 'general' });

// S-flat: two null-project chats, no real projects
const FLAT_CHANNELS: Channel[] = [
  GENERAL,
  makeChannel({ id: 'chat-1', name: 'Quick Question', type: 'chat' }),
  makeChannel({ id: 'chat-2', name: 'Code Review', type: 'chat' }),
];

// S-mixed: one real project chat + one project-less klatch
const PROJ_ALPHA = makeProject('proj-1', 'Alpha');
const MIXED_CHANNELS: Channel[] = [
  GENERAL,
  makeChannel({ id: 'proj-chat', name: 'API Design', type: 'chat', projectId: 'proj-1', projectName: 'Alpha' }),
  makeChannel({ id: 'loose-klatch', name: 'brainstorm', type: 'klatch', entityCount: 2 }),
];

// S-order: chats + klatch under the same project → subheaders appear
const ORDER_CHANNELS: Channel[] = [
  GENERAL,
  makeChannel({ id: 'o-chat-1', name: 'Architecture Chat', type: 'chat', projectId: 'proj-1', projectName: 'Alpha' }),
  makeChannel({ id: 'o-chat-2', name: 'Bug Triage', type: 'chat', projectId: 'proj-1', projectName: 'Alpha' }),
  makeChannel({ id: 'o-klatch', name: 'standup', type: 'klatch', projectId: 'proj-1', projectName: 'Alpha', entityCount: 3 }),
];

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
  const userPrompt = `A user was shown a structured accessibility-tree snapshot of a navigation sidebar in a workspace/chat application. They answered a question about what the UI communicates. Score their answer.

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
  const systemPrompt = `You are a user looking at the navigation sidebar of a workspace chat application. The sidebar lists channels, projects, and group conversations. Below is a structured accessibility-tree representation of the sidebar. Based ONLY on what you can see in this representation, answer the question naturally. If something is not visible, say so. Return valid JSON.`;

  const userPrompt = `Here is the accessible representation of the sidebar:

${domSnapshot || '(empty — nothing rendered)'}

Question: ${question}

Answer based only on what is visible in the sidebar. Return JSON: {"answer": "..."}`;

  const response = await queryAuxiliary(systemPrompt, userPrompt);
  const parsed = extractJson(response);
  return String(parsed.answer || '');
}

// ── Probes ────────────────────────────────────────────────────

interface Probe {
  id: string;
  state: 'S-flat' | 'S-mixed' | 'S-order';
  claim: string;
  category: string;
  question: string;
  expectedAnswer: string;
  scopeNote?: string;
  isSubliminalCandidate?: boolean;
}

const PROBES: Probe[] = [
  // S-flat — no real projects; null-project chats render flat with no section header
  {
    id: 'FLAT1',
    claim: 'singleton-flat-no-first-project-header',
    category: 'default-project-visibility',
    state: 'S-flat',
    question:
      'You are looking at a workspace sidebar. Do you see any section labeled "First project" or any other project group header? Or does the channel list appear as a flat list with no section headers?',
    expectedAnswer:
      'There is no "First project" header or any project group label. The channel list is flat — channels are listed directly without any section headers.',
    scopeNote: 'Singleton mode: when no real projects exist, null-project channels render flat — no project chrome at all.',
  },
  {
    id: 'AT1',
    claim: 'chat-items-at-prefix',
    category: 'prefix-semantics',
    state: 'S-flat',
    question:
      'In the sidebar, what symbol or character appears before the names of the chat channels (not #general)?',
    expectedAnswer:
      'Chat channels have an @ symbol (at-sign) before their name.',
  },

  // S-mixed — one real project + one project-less klatch → "First project" section visible
  {
    id: 'FP1',
    claim: 'first-project-label-meaning',
    category: 'default-project-label',
    state: 'S-mixed',
    question:
      'You see a section in the sidebar labeled "First project". Based on what is visible, what do you think this section is for? Is it a specific project with that name, or does it appear to serve another purpose?',
    expectedAnswer:
      'It appears to be a default or catch-all section for conversations not assigned to a specific project — a fallback group for channels without an explicit project.',
    scopeNote: 'High Subliminal risk: "First project" is the label Klatch uses for the default project bucket, but a naive reading suggests it is a specific project named "First project." The label is terse and may not clearly signal its default-bucket role.',
    isSubliminalCandidate: true,
  },
  {
    id: 'HASH1',
    claim: 'klatch-items-hash-prefix',
    category: 'prefix-semantics',
    state: 'S-mixed',
    question:
      'In the "First project" section, what symbol appears before the group conversation channel name?',
    expectedAnswer:
      'Group conversation channels (klatches) have a # symbol (hash/pound sign) before their name.',
  },
  {
    id: 'FP-KLATCH1',
    claim: 'loose-klatch-in-first-project-section',
    category: 'default-project-routing',
    state: 'S-mixed',
    question:
      'You see both a named project section and a "First project" section in the sidebar. Which section contains the group conversation channel (the one with a # prefix)? Is it inside the named project or inside "First project"?',
    expectedAnswer:
      'The group conversation channel with the # prefix appears inside the "First project" section, not inside the named project.',
    scopeNote: 'Tests that a project-less klatch routes to the default "First project" group, not to the accordion project.',
  },

  // S-order — chats + klatch under the same project → "CHATS" / "KLATCHES" subheaders
  {
    id: 'ORDER1',
    claim: 'chats-subheader-before-klatches-subheader',
    category: 'within-project-ordering',
    state: 'S-order',
    question:
      'Inside the expanded project section in the sidebar, are there any section subheadings that separate different types of channels? If so, what are they and in what order do they appear?',
    expectedAnswer:
      'Yes — a "CHATS" subheading appears first, followed by a "KLATCHES" subheading below it.',
  },
  {
    id: 'ORDER2',
    claim: 'chats-at-prefix-before-klatches-hash-prefix',
    category: 'within-project-ordering',
    state: 'S-order',
    question:
      'Within the expanded project group, do the @ channels (individual chats) appear above or below the # channels (group klatches)?',
    expectedAnswer:
      'The @ channels (individual chats) appear above the # channels (group klatches) — chats come first.',
  },
];

// ── Test execution ────────────────────────────────────────────

describeIfEnabled('Round 46 — UI-as-context AAXT (ChannelSidebar: First project group)', () => {
  it(
    'semantic conveyance probe: flat-singleton, "First project" label, prefix semantics, within-project ordering',
    async () => {
      if (!process.env.ANTHROPIC_API_KEY && !process.env.OPENAI_API_KEY) {
        throw new Error('No API key available — set ANTHROPIC_API_KEY or OPENAI_API_KEY');
      }

      const allResults: ScoredResult[] = [];
      const startedAt = new Date().toISOString();

      // ── State S-flat: null-project chats only, no real projects ─

      {
        const { container } = render(
          <ChannelSidebar
            {...defaultProps}
            channels={FLAT_CHANNELS}
            projects={[]}
          />,
        );

        const snapshot = snapshotDom(container);

        for (const probe of PROBES.filter((p) => p.state === 'S-flat')) {
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

      // ── State S-mixed: one real project + project-less klatch ──

      {
        const { container } = render(
          <ChannelSidebar
            {...defaultProps}
            channels={MIXED_CHANNELS}
            projects={[PROJ_ALPHA]}
          />,
        );

        const snapshot = snapshotDom(container);

        for (const probe of PROBES.filter((p) => p.state === 'S-mixed')) {
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

      // ── State S-order: chats + klatch in same project → subheaders ─

      {
        const { container } = render(
          <ChannelSidebar
            {...defaultProps}
            channels={ORDER_CHANNELS}
            projects={[PROJ_ALPHA]}
          />,
        );

        const snapshot = snapshotDom(container);

        for (const probe of PROBES.filter((p) => p.state === 'S-order')) {
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

      console.log('\n══ Round 46 — ChannelSidebar "First project" AAXT ══════════════');
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
