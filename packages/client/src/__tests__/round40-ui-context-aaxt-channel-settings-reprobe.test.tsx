/**
 * Round 40 — UI-as-context AAXT: ChannelSettings RE-PROBE after Tier 1 patches
 *
 * Same probes, same scoring, same states as Round 39 — only the underlying
 * ChannelSettings component code has changed. This is the validation signal
 * for Daedalus's CS-F1..CS-F3 patches (commit `ca43052`, shipped 5/18 PM).
 *
 * Round 39 baseline (before patches):  54.5% conveyance
 * Iris's predicted post-patch result:  ~80%+ conveyance
 * Predicted shifts:
 *   - CS-F1 (prompt layers): 0/5 Correct → near 5/5 (status text + aria-label)
 *   - CS-F2(a/b/c): Absent → Correct (always-render patterns applied)
 *
 * Methodology principle being validated: the "diagnostic → fix → re-probe"
 * loop closes within a single session, providing empirical evidence that
 * AAXT findings translate to measurable conveyance improvements.
 *
 * Test is a structural duplicate of round39 by design — preserving probe
 * parity is what makes the before/after comparison meaningful.
 *
 * Gate: RUN_UI_AAXT=1.
 *
 * Run with:
 *   set -a; source .env; set +a
 *   RUN_UI_AAXT=1 npx vitest run packages/client/src/__tests__/round40-ui-context-aaxt-channel-settings-reprobe.test.tsx
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, cleanup, waitFor } from '@testing-library/react';
import type { Channel, Entity } from '@klatch/shared';

vi.mock('../api/client.js', async () => {
  const actual = await vi.importActual<typeof import('../api/client.js')>('../api/client.js');
  return {
    ...actual,
    fetchProjects: vi.fn(),
    fetchChannelFiles: vi.fn(),
    fetchContextFile: vi.fn(),
    promoteFile: vi.fn(),
    unpinFileFromChannel: vi.fn(),
  };
});

// Global fetch mock for /stats and /prompt-debug
const originalFetch = globalThis.fetch;

import { fetchProjects, fetchChannelFiles, type Project } from '../api/client.js';
import { ChannelSettings } from '../components/ChannelSettings';

const mockProjects = vi.mocked(fetchProjects);
const mockChannelFiles = vi.mocked(fetchChannelFiles);

const ENABLED = process.env.RUN_UI_AAXT === '1';
const describeIfEnabled = ENABLED ? describe : describe.skip;

// ── Types ────────────────────────────────────────────────────

type Classification = 'Correct' | 'Reconstructed' | 'Confabulated' | 'Absent' | 'Phantom' | 'Subliminal';

interface Probe {
  id: string;
  state: string;
  claim: string;
  question: string;
  expectedAnswer: string;
  category: string;
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
  channel: Channel;
  channelEntities: Entity[];
  allEntities: Entity[];
  projects: Project[];
  channelFiles: any[];
  stats?: any;
  promptLayers: Record<string, string>;
}

// ── Auxiliary LLM client (inline, identical to 36/37/38) ─────

async function queryAuxiliary(systemPrompt: string, userPrompt: string): Promise<string> {
  const openaiKey = process.env.OPENAI_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  if (openaiKey) {
    const res = await originalFetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${openaiKey}` },
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
    const res = await originalFetch('https://api.anthropic.com/v1/messages', {
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
    if (tag === 'svg' || tag === 'path' || tag === 'circle') return;

    const role = el.getAttribute('role');
    const ariaLabel = el.getAttribute('aria-label');
    const title = el.getAttribute('title');
    const dataTestId = el.getAttribute('data-testid');
    const placeholder = el.getAttribute('placeholder');
    const value = (el as any).value;
    const isButton = tag === 'button';
    const isInput = tag === 'input' || tag === 'textarea' || tag === 'select';

    const annotations: string[] = [];
    if (role) annotations.push(`role=${role}`);
    if (ariaLabel) annotations.push(`aria-label="${ariaLabel}"`);
    if (title) annotations.push(`title="${title}"`);
    if (dataTestId) annotations.push(`data-testid=${dataTestId}`);
    if (placeholder) annotations.push(`placeholder="${placeholder}"`);
    if (isButton) annotations.push('clickable');
    if (isInput && value !== undefined && value !== '') annotations.push(`value="${String(value).slice(0, 200)}"`);
    if (isInput) annotations.push(`type=${(el as HTMLInputElement).type || tag}`);

    const desc = annotations.length > 0 ? `<${tag} ${annotations.join(' ')}>` : `<${tag}>`;

    const onlyTextChild =
      el.childNodes.length === 1 &&
      el.firstChild?.nodeType === Node.TEXT_NODE &&
      el.firstChild.textContent?.trim();

    if (onlyTextChild) {
      lines.push(`${indent}${desc} "${onlyTextChild}"`);
      return;
    }

    if (annotations.length > 0 || ['button', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'nav', 'main', 'section', 'article', 'aside', 'label', 'input', 'textarea', 'select', 'option'].includes(tag)) {
      lines.push(`${indent}${desc}`);
      for (const child of Array.from(el.childNodes)) walk(child, depth + 1);
    } else {
      for (const child of Array.from(el.childNodes)) walk(child, depth);
    }
  }
  walk(container, 0);
  return lines.join('\n');
}

async function scoreResponse(
  question: string,
  expectedAnswer: string,
  agentResponse: string,
): Promise<{ classification: Classification; confidence: number; reasoning: string }> {
  const systemPrompt = `You are scoring a user's perception of a UI against the ground truth. You must return valid JSON.`;
  const userPrompt = `A user was shown a structured representation of a rendered UI surface. They were asked a question.

Question asked: ${question}

Expected answer (ground truth from underlying data): ${expectedAnswer}

User's response: ${agentResponse}

Classify as exactly one of:
- CORRECT: matches expected information, possibly rephrased
- RECONSTRUCTED: semantically right but surface form drifted significantly
- CONFABULATED: plausible but invented — user filled gap with wrong info
- ABSENT: user correctly reports cannot determine from what's visible
- PHANTOM: user confidently claims something false
- SUBLIMINAL: user answers correctly but explicitly notes they cannot tell from what they see

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

async function probeUser(domSnapshot: string, question: string): Promise<string> {
  const systemPrompt = `You are a user looking at a software application UI. Below is a structured representation of what is visible on screen — the accessible text and ARIA tree of a "Channel Settings" panel. The panel shows configuration and status for a single conversation channel. Based ONLY on what you can see, answer the question naturally. If you cannot tell, say so honestly. You must return valid JSON.`;
  const userPrompt = `Here is what you can see in the channel settings panel:

${domSnapshot}

Question: ${question}

Answer based on what is visible. Return JSON: {"answer": "..."}`;

  const response = await queryAuxiliary(systemPrompt, userPrompt);
  const parsed = extractJson(response);
  return String(parsed.answer || '');
}

// ── Test data factories ──────────────────────────────────────

function chan(overrides: Partial<Channel> & { id: string; name: string }): Channel {
  return {
    systemPrompt: '',
    model: 'claude-opus-4-7' as any,
    mode: 'panel' as any,
    type: 'chat',
    createdAt: '2026-05-01T00:00:00Z',
    ...overrides,
  };
}

function ent(overrides: Partial<Entity> & { id: string; name: string }): Entity {
  return {
    model: 'claude-opus-4-7' as any,
    systemPrompt: 'You are a helpful assistant.',
    color: '#6366f1',
    effort: 'high' as any,
    createdAt: '2026-05-01T00:00:00Z',
    ...overrides,
  };
}

const CSS1_IMPORTED_RICH: TestState = {
  name: 'CSS1-imported-rich',
  description: 'Claude Code import, linked to project, default Claude entity, no L4, no files, 5 stats',
  channel: chan({
    id: 'theseus-imp',
    name: 'theseus-2026-03-22-imported',
    type: 'chat',
    source: 'claude-code',
    sourceMetadata: JSON.stringify({
      cwd: '/home/user/Development/klatch',
      importedAt: '2026-03-22T15:00:00Z',
      eventCount: 358,
      version: '2.1.19',
    }),
    projectId: 'proj-klatch',
    systemPrompt: '',
  }),
  channelEntities: [ent({ id: 'default-entity', name: 'Claude', systemPrompt: 'You are a helpful assistant.' })],
  allEntities: [ent({ id: 'default-entity', name: 'Claude' })],
  projects: [{ id: 'proj-klatch', name: 'klatch', instructions: '' } as Project],
  channelFiles: [],
  stats: {
    messageCount: 143,
    toolBreakdown: [
      { tool: 'Read', count: 87 },
      { tool: 'Edit', count: 45 },
      { tool: 'Bash', count: 32 },
      { tool: 'Grep', count: 18 },
      { tool: 'Write', count: 12 },
    ],
  },
  promptLayers: {
    '1_kitBriefing': 'ACTIVE — imported channel gets kit briefing',
    '2_projectInstructions': 'ACTIVE — from project "klatch" (7035 chars)',
    '3_projectMemory': 'ACTIVE — from project "klatch" (8624 chars)',
    '4_channelAddendum': 'EMPTY',
    '5_entityPrompt': '"Claude" — 28 chars',
  },
};

const CSS2_KLATCH_RICH: TestState = {
  name: 'CSS2-klatch-rich',
  description: 'Native klatch, project linked, 3 named entities, roundtable mode, custom L4, 2 pinned files',
  channel: chan({
    id: 'mystery-menu',
    name: 'mystery-menu',
    type: 'klatch',
    mode: 'roundtable' as any,
    source: 'native',
    projectId: 'proj-restaurant',
    systemPrompt: 'You are the leadership team of a fine dining restaurant. The owner has just walked in with an idea. Respond in character — be opinionated, specific, and react to what others have said.',
  }),
  channelEntities: [
    ent({ id: 'ent-chef', name: 'Chef Margaux', color: '#ef4444', model: 'claude-sonnet-4-6' as any }),
    ent({ id: 'ent-sam', name: 'Sam', color: '#10b981', model: 'claude-sonnet-4-6' as any }),
    ent({ id: 'ent-julien', name: 'Julien', color: '#8b5cf6', model: 'claude-sonnet-4-6' as any }),
  ],
  allEntities: [
    ent({ id: 'ent-chef', name: 'Chef Margaux', color: '#ef4444' }),
    ent({ id: 'ent-sam', name: 'Sam', color: '#10b981' }),
    ent({ id: 'ent-julien', name: 'Julien', color: '#8b5cf6' }),
    ent({ id: 'ent-extra', name: 'AnotherAgent', color: '#f59e0b' }),
  ],
  projects: [
    { id: 'proj-restaurant', name: 'Mystery Menu Restaurant', instructions: '' } as Project,
    { id: 'proj-klatch', name: 'klatch', instructions: '' } as Project,
  ],
  channelFiles: [
    { id: 'f1', refId: 'r1', name: 'wine-list.pdf', sizeBytes: 245000, storageKey: 'sk-1', mimeType: 'application/pdf', scope: 'channel', scopeId: 'mystery-menu', refType: 'pinned', addedAt: '2026-05-01T00:00:00Z' },
    { id: 'f2', refId: 'r2', name: 'menu-spec.md', sizeBytes: 5800, storageKey: 'sk-2', mimeType: 'text/markdown', scope: 'channel', scopeId: 'mystery-menu', refType: 'pinned', addedAt: '2026-05-01T00:00:00Z' },
  ],
  promptLayers: {
    '1_kitBriefing': 'INACTIVE — native channel, no kit briefing',
    '2_projectInstructions': 'ACTIVE — from project "Mystery Menu Restaurant" (320 chars)',
    '3_projectMemory': 'EMPTY — project has no memory',
    '4_channelAddendum': 'ACTIVE — 188 chars; 2 file(s) pinned: wine-list.pdf, menu-spec.md',
    '5_entityPrompt': '"Chef Margaux" — 250 chars',
  },
};

const CSS3_BARE_DEFAULT: TestState = {
  name: 'CSS3-bare-default',
  description: 'Default Klatch channel — native, no project, default Claude entity, default L4 ("helpful assistant"), no files',
  channel: chan({
    id: 'default',
    name: 'general',
    type: 'chat',
    source: 'native',
    systemPrompt: 'You are a helpful assistant.',
  }),
  channelEntities: [ent({ id: 'default-entity', name: 'Claude' })],
  allEntities: [ent({ id: 'default-entity', name: 'Claude' })],
  projects: [],
  channelFiles: [],
  promptLayers: {
    '1_kitBriefing': 'INACTIVE — native channel, no kit briefing',
    '2_projectInstructions': 'INACTIVE — no project linked',
    '3_projectMemory': 'INACTIVE — no project linked',
    '4_channelAddendum': 'ACTIVE — 28 chars',
    '5_entityPrompt': '"Claude" — 28 chars',
  },
};

const CSS4_CUSTOM_L4_ONLY: TestState = {
  name: 'CSS4-custom-L4-only',
  description: 'Native chat, no project, custom L4 (architecture review), default entity, no files',
  channel: chan({
    id: 'arch-review',
    name: 'architecture-review',
    type: 'chat',
    source: 'native',
    systemPrompt: 'This channel focuses on architecture review and test coverage for the export pipeline. Pay attention to the 5-layer prompt assembly model and how context flows between layers.',
  }),
  channelEntities: [ent({ id: 'ent-daedalus', name: 'Daedalus', color: '#6366f1' })],
  allEntities: [ent({ id: 'ent-daedalus', name: 'Daedalus', color: '#6366f1' })],
  projects: [],
  channelFiles: [],
  promptLayers: {
    '1_kitBriefing': 'INACTIVE — native channel, no kit briefing',
    '2_projectInstructions': 'INACTIVE — no project linked',
    '3_projectMemory': 'INACTIVE — no project linked',
    '4_channelAddendum': 'ACTIVE — 175 chars',
    '5_entityPrompt': '"Daedalus" — 322 chars',
  },
};

const CSS5_IMPORTED_NO_PROJECT: TestState = {
  name: 'CSS5-imported-no-project',
  description: 'Claude Code import without project link — only L1 + L5 active',
  channel: chan({
    id: 'orphan-import',
    name: 'orphan-claude-code-session',
    type: 'chat',
    source: 'claude-code',
    sourceMetadata: JSON.stringify({
      cwd: '/tmp/scratch',
      importedAt: '2026-04-10T08:00:00Z',
      eventCount: 24,
    }),
    systemPrompt: '',
  }),
  channelEntities: [ent({ id: 'default-entity', name: 'Claude' })],
  allEntities: [ent({ id: 'default-entity', name: 'Claude' })],
  projects: [{ id: 'proj-klatch', name: 'klatch', instructions: '' } as Project],
  channelFiles: [],
  stats: {
    messageCount: 12,
    toolBreakdown: [{ tool: 'Read', count: 8 }, { tool: 'Edit', count: 4 }],
  },
  promptLayers: {
    '1_kitBriefing': 'ACTIVE — imported channel gets kit briefing',
    '2_projectInstructions': 'INACTIVE — no project linked',
    '3_projectMemory': 'INACTIVE — no project linked',
    '4_channelAddendum': 'EMPTY',
    '5_entityPrompt': '"Claude" — 28 chars',
  },
};

const STATES: TestState[] = [CSS1_IMPORTED_RICH, CSS2_KLATCH_RICH, CSS3_BARE_DEFAULT, CSS4_CUSTOM_L4_ONLY, CSS5_IMPORTED_NO_PROJECT];

// ── Probe builders ───────────────────────────────────────────

const PROBE_BUILDERS: Array<(s: TestState) => Probe[]> = [
  // CS1: Source provenance (chat vs imported)
  (s) => [{
    id: `${s.name}.CS1`, state: s.name, claim: 'CS1-source-provenance',
    question: `Was this channel created here in this application as a native conversation, or was it imported from somewhere else? If imported, from where?`,
    expectedAnswer: s.channel.source === 'native'
      ? `Native — created in Klatch, not imported from elsewhere`
      : `Imported from ${s.channel.source === 'claude-code' ? 'Claude Code' : s.channel.source === 'claude-ai' ? 'claude.ai' : s.channel.source}`,
    category: 'source-provenance',
  }],

  // CS2: Channel type (chat vs klatch / single vs multi-entity)
  (s) => [{
    id: `${s.name}.CS2`, state: s.name, claim: 'CS2-channel-type',
    question: `Is this channel set up as a one-on-one conversation with a single AI agent, or as a group conversation with multiple agents? How many agents are in it?`,
    expectedAnswer: s.channelEntities.length === 1
      ? `One-on-one chat with a single agent (${s.channelEntities[0].name})`
      : `Group conversation (klatch) with ${s.channelEntities.length} agents: ${s.channelEntities.map((e) => e.name).join(', ')}`,
    category: 'channel-type',
  }],

  // CS3: Project assignment
  (s) => [{
    id: `${s.name}.CS3`, state: s.name, claim: 'CS3-project-assignment',
    question: `Is this channel currently assigned to a project? If yes, which one? If no, say so.`,
    expectedAnswer: s.channel.projectId
      ? `Yes — assigned to project "${s.projects.find((p) => p.id === s.channel.projectId)?.name}"`
      : `No project assigned`,
    category: 'project-assignment',
  }],

  // CS4: Channel context (L4) content
  (s) => {
    const isDefault = s.channel.systemPrompt === 'You are a helpful assistant.';
    const isEmpty = !s.channel.systemPrompt;
    return [{
      id: `${s.name}.CS4`, state: s.name, claim: 'CS4-channel-context-L4',
      question: `What is the "channel context" or "purpose" set for this channel? Summarize what it's for, or say if there isn't one.`,
      expectedAnswer: isEmpty
        ? `No channel context set (the field is empty)`
        : isDefault
          ? `The channel context is the default generic prompt ("You are a helpful assistant.")`
          : `Has custom channel context describing: ${s.channel.systemPrompt.slice(0, 120)}`,
      category: 'channel-context-L4',
    }];
  },

  // CS5: Pinned files count
  (s) => [{
    id: `${s.name}.CS5`, state: s.name, claim: 'CS5-pinned-files',
    question: `Are there any files pinned to this channel? If yes, how many and what are they?`,
    expectedAnswer: s.channelFiles.length === 0
      ? `No pinned files`
      : `${s.channelFiles.length} pinned files: ${s.channelFiles.map((f) => f.name).join(', ')}`,
    category: 'pinned-files',
  }],

  // CS6: Interaction mode (only meaningful with 2+ entities)
  (s) => {
    if (s.channelEntities.length < 2) return [];
    return [{
      id: `${s.name}.CS6`, state: s.name, claim: 'CS6-interaction-mode',
      question: `For this multi-agent channel, which interaction mode is currently selected (e.g., panel, roundtable, directed)?`,
      expectedAnswer: `${s.channel.mode}`,
      category: 'interaction-mode',
    }];
  },

  // CS7: Prompt layer status — THE value-proposition probe
  (s) => {
    const active = Object.entries(s.promptLayers).filter(([_, v]) => v.startsWith('ACTIVE')).map(([k]) => k.replace(/^\d+_/, ''));
    return [{
      id: `${s.name}.CS7`, state: s.name, claim: 'CS7-prompt-layer-status',
      question: `Looking at the prompt layers indicator (which shows whether each of the 5 system prompt layers is active or inactive for this channel), which layers are currently active?`,
      expectedAnswer: `Active layers: ${active.join(', ')} (others are inactive)`,
      category: 'prompt-layer-status',
    }];
  },

  // CS8: Imported channel stats
  (s) => {
    if (!s.stats) return [];
    return [{
      id: `${s.name}.CS8`, state: s.name, claim: 'CS8-imported-stats',
      question: `For this imported channel, approximately how many messages does it contain, and approximately how many tool calls were made during the original session?`,
      expectedAnswer: `${s.stats.messageCount} messages; ${s.stats.toolBreakdown.reduce((sum: number, t: any) => sum + t.count, 0)} total tool calls`,
      category: 'imported-stats',
    }];
  },
];

// ── Test execution ───────────────────────────────────────────

describeIfEnabled('Round 40 — UI-as-context AAXT (ChannelSettings re-probe after CS-F1..CS-F3 patches)', () => {
  beforeEach(() => {
    mockProjects.mockReset();
    mockChannelFiles.mockReset();
  });

  it('semantic conveyance probe across 5 states × 8 claim categories', async () => {
    if (!process.env.OPENAI_API_KEY && !process.env.ANTHROPIC_API_KEY) {
      throw new Error('No API key');
    }

    const allResults: ScoredResult[] = [];
    const startedAt = new Date().toISOString();

    for (const state of STATES) {
      mockProjects.mockResolvedValueOnce(state.projects);
      mockChannelFiles.mockResolvedValueOnce(state.channelFiles);

      // Mock global fetch for /stats and /prompt-debug endpoints
      const originalFetchRef = globalThis.fetch;
      globalThis.fetch = vi.fn(async (url: any) => {
        const urlStr = String(url);
        if (urlStr.includes('/stats')) {
          if (!state.stats) return new Response(null, { status: 404 });
          return new Response(JSON.stringify(state.stats), { status: 200, headers: { 'Content-Type': 'application/json' } });
        }
        if (urlStr.includes('/prompt-debug')) {
          return new Response(JSON.stringify({ layers: state.promptLayers }), { status: 200, headers: { 'Content-Type': 'application/json' } });
        }
        return originalFetchRef(url);
      }) as any;

      const { container } = render(
        <ChannelSettings
          channel={state.channel}
          channelEntities={state.channelEntities}
          allEntities={state.allEntities}
          onSave={() => {}}
          onAssignEntity={() => {}}
          onRemoveEntity={() => {}}
          onDeleteChannel={() => {}}
          onClose={() => {}}
        />,
      );

      // Wait for the async data to load — at least the prompt layers
      // Panel title is type-specific ("Chat Settings" / "Klatch Settings"), not "Channel
      // Settings" — that generic form was retired by the chats/klatches vocabulary work.
      await waitFor(() => {
        expect(container.textContent).toContain('Settings');
      });

      // Wait a bit more for all useEffects to settle (projects, files, stats, prompt-debug)
      await new Promise((r) => setTimeout(r, 200));

      const snapshot = snapshotDom(container);

      const probes: Probe[] = [];
      for (const builder of PROBE_BUILDERS) probes.push(...builder(state));

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

      globalThis.fetch = originalFetchRef;
      cleanup();
    }

    const finishedAt = new Date().toISOString();
    const provider = process.env.OPENAI_API_KEY ? 'openai/gpt-4o-mini' : 'anthropic/claude-haiku-4-5';

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('Round 40 — UI-as-context AAXT (ChannelSettings RE-PROBE)');
    console.log('Validation of Daedalus CS-F1..CS-F3 patches (commit ca43052)');
    console.log('Round 39 baseline: 54.5% conveyance');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`Started:   ${startedAt}`);
    console.log(`Finished:  ${finishedAt}`);
    console.log(`Auxiliary: ${provider}`);
    console.log(`Probes:    ${allResults.length}`);
    console.log();

    for (const state of STATES) {
      const stateResults = allResults.filter((r) => r.probe.state === state.name);
      if (stateResults.length === 0) continue;
      console.log(`── ${state.name} — ${state.description}`);
      for (const r of stateResults) {
        console.log(`   [${r.classification}] (${r.confidence.toFixed(2)}) ${r.probe.claim}`);
        console.log(`     Q: ${r.probe.question}`);
        console.log(`     Expected: ${r.probe.expectedAnswer}`);
        console.log(`     Got: ${r.agentResponse.slice(0, 250)}`);
        if (['Confabulated', 'Phantom', 'Subliminal'].includes(r.classification)) {
          console.log(`     ⚠ Reasoning: ${r.reasoning.slice(0, 300)}`);
        }
        console.log();
      }
    }

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
    console.log(`Phantom:       ${summary.phantom}`);
    console.log(`Subliminal:    ${summary.subliminal}  ${summary.subliminal > 0 ? '← UI obscures present data' : ''}`);
    console.log(`Semantic conveyance rate: ${(((summary.correct + summary.reconstructed) / summary.total) * 100).toFixed(1)}%`);
    console.log();

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

    // Liveness gate (Theseus, 2026-08-10) — see
    // docs/research/aaxt-liveness-gap-2026-08-10.md. An instrument failure (bad
    // key, network fault, judge outage) is recorded as `Absent`, which the
    // summary cannot distinguish from a surface that genuinely conveys nothing,
    // and the gates below are trivially satisfied by a run where every call
    // failed. Assert the calls actually landed before reading the numbers.
    const instrumentErrors = allResults
      .map((r) => r.reasoning ?? '')
      .filter((why) => /^(Error|Scoring error):/.test(why));
    expect(instrumentErrors).toEqual([]);

    expect(summary.total).toBeGreaterThan(0);
  }, 600_000);
});
