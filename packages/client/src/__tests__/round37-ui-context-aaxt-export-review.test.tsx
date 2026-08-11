/**
 * Round 37 — UI-as-context AAXT: ExportReviewPanel Semantic Conveyance
 *
 * Second surface in the UI-as-context AAXT line, following Round 36 (sidebar).
 * Per Iris's reply (5/18): "densest semantic surface in the app" — layer
 * composition sparkline, field notes review with per-source provenance,
 * agreement/disagreement signaling, package contents summary.
 *
 * Same methodology as Round 36:
 *   1. Render ExportReviewPanel via React Testing Library + JSDOM with mocked
 *      fetchExportPreview (synthetic manifest per test state)
 *   2. Snapshot the accessible text + ARIA tree
 *   3. Probe with user-proxy LLM
 *   4. Score with AXT six-failure-mode taxonomy
 *   5. Report
 *
 * Probes target the densest claims:
 *   EP1: per-layer character counts (sparkline)
 *   EP2: which entity each field note is about
 *   EP3: source distinction (external-extraction vs self-authored-briefing vs micro-reflection)
 *   EP4: agreements identifiable as "both sources confirm"
 *   EP5: single-source observations identifiable as such
 *   EP6: confidence levels (high/medium/low)
 *   EP7: total message + file counts
 *   EP8: accepted/rejected status (initial state — no user actions yet)
 *
 * Gate: RUN_UI_AAXT=1 (same as Round 36; CI never runs).
 *
 * Run with:
 *   set -a; source .env; set +a
 *   RUN_UI_AAXT=1 npx vitest run packages/client/src/__tests__/round37-ui-context-aaxt-export-review.test.tsx
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, cleanup, waitFor } from '@testing-library/react';

// ── Mock the API client before importing the component ───────

vi.mock('../api/client.js', () => ({
  fetchExportPreview: vi.fn(),
  getExportUrl: vi.fn((id: string) => `http://test/export/${id}`),
}));

import { fetchExportPreview } from '../api/client.js';
import { ExportReviewPanel } from '../components/ExportReviewPanel';

const mockFetch = vi.mocked(fetchExportPreview);

// ── Gate ─────────────────────────────────────────────────────

const ENABLED = process.env.RUN_UI_AAXT === '1';
const describeIfEnabled = ENABLED ? describe : describe.skip;

// ── Types ────────────────────────────────────────────────────

type Classification = 'Correct' | 'Reconstructed' | 'Confabulated' | 'Absent' | 'Phantom' | 'Subliminal' | 'Unscored';

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
  manifest: any;
}

// ── Auxiliary LLM client (inline, identical to Round 36) ─────

async function queryAuxiliary(systemPrompt: string, userPrompt: string): Promise<string> {
  const openaiKey = process.env.OPENAI_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  if (openaiKey) {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
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

// ── Snapshot helper (identical to Round 36) ──────────────────

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
    const isButton = tag === 'button';

    const annotations: string[] = [];
    if (role) annotations.push(`role=${role}`);
    if (ariaLabel) annotations.push(`aria-label="${ariaLabel}"`);
    if (title) annotations.push(`title="${title}"`);
    if (dataTestId) annotations.push(`data-testid=${dataTestId}`);
    if (isButton) annotations.push('clickable');

    const desc = annotations.length > 0 ? `<${tag} ${annotations.join(' ')}>` : `<${tag}>`;

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
- PHANTOM: User confidently claims something false (asserts a specific count or property the UI doesn't show)
- SUBLIMINAL: User answers correctly but explicitly notes they cannot tell from what they see (correct guess from indirect cues; the data is technically present but the surface obscures it)

Return JSON: {"classification": "...", "confidence": 0.0-1.0, "reasoning": "..."}`;

  try {
    const response = await queryAuxiliary(systemPrompt, userPrompt);
    const parsed = extractJson(response);
    const valid: Classification[] = ['Correct', 'Reconstructed', 'Confabulated', 'Absent', 'Phantom', 'Subliminal'];
    const raw = String(parsed.classification || '');
    const found = valid.find((c) => c.toLowerCase() === raw.toLowerCase());
    return {
      classification: found ?? 'Unscored',
      confidence: Math.min(1, Math.max(0, Number(parsed.confidence) || 0.5)),
      reasoning: found ? String(parsed.reasoning || '') : `Scoring error: unparseable classification "${raw}"`,
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
  const systemPrompt = `You are a user looking at a software application UI. Below is a structured representation of what is visible on screen — the accessible text and ARIA tree of an "Export Preview" panel that shows what is about to be exported from the application. The panel includes a package-contents summary and field notes (behavioral observations about agents in this conversation). Based ONLY on what you can see in this representation, answer the user's question naturally. If you cannot tell from what is visible, say so honestly. You must return valid JSON.`;

  const userPrompt = `Here is what you can see in the export preview panel:

${domSnapshot}

Question: ${question}

Answer the question based on what is visible. Return JSON: {"answer": "..."}`;

  const response = await queryAuxiliary(systemPrompt, userPrompt);
  const parsed = extractJson(response);
  return String(parsed.answer || '');
}

// ── Test states (synthetic manifests) ────────────────────────

const ES1_RICH: any = {
  package_id: 'pkg-1',
  project: {
    id: 'proj-1',
    name: 'Klatch',
    instructions: { length_chars: 7035 },
    memory: { length_chars: 8624 },
  },
  conversation_context: {
    id: 'ch-1',
    name: 'theseus-2026-03-22-imported',
    context: { length_chars: 175 },
  },
  conversation_history: {
    message_count: 143,
  },
  files: [{ id: 'f1' }, { id: 'f2' }],
  entities: [
    {
      id: 'e1',
      name: 'Daedalus',
      model: 'claude-opus-4-7',
      effort: 'high',
      prompt_length_chars: 322,
      field_notes: [
        // Agreement pair (both sources, working-style)
        {
          observation: 'User prefers terse, action-oriented responses without preamble.',
          citations: ['msg-12', 'msg-45'],
          confidence: 'high',
          source: 'external-extraction',
          trust: 'synthesized',
          status: 'draft',
          category: 'working-style',
        },
        {
          observation: 'User has consistently asked me to skip preamble and get to the point.',
          citations: ['msg-12'],
          confidence: 'high',
          source: 'self-authored-briefing',
          trust: 'agent-observed',
          status: 'draft',
          category: 'working-style',
        },
        // Single-source: external-extraction only
        {
          observation: 'User frequently checks in with brief acknowledgments before requesting changes.',
          citations: ['msg-22'],
          confidence: 'medium',
          source: 'external-extraction',
          trust: 'synthesized',
          status: 'draft',
          category: 'patterns',
        },
        // Single-source: self-authored only, low confidence
        {
          observation: 'User may prefer that I push back on decisions I disagree with, but evidence is thin.',
          citations: [],
          confidence: 'low',
          source: 'self-authored-briefing',
          trust: 'agent-observed',
          status: 'draft',
          category: 'relationship',
        },
        // Micro-reflection
        {
          observation: 'User course-corrected me on file naming convention; remember kebab-case for docs.',
          citations: ['msg-78'],
          confidence: 'high',
          source: 'micro-reflection',
          trust: 'agent-observed',
          status: 'draft',
          category: 'course-corrections',
        },
      ],
    },
  ],
};

const ES2_AGREEMENTS_HEAVY: any = {
  ...ES1_RICH,
  conversation_context: { ...ES1_RICH.conversation_context, name: 'agreements-heavy' },
  entities: [
    {
      id: 'e2',
      name: 'Argus',
      model: 'claude-opus-4-7',
      effort: 'high',
      prompt_length_chars: 280,
      field_notes: [
        // Three agreement pairs
        {
          observation: 'User wants tests to fail loudly rather than hedge.',
          citations: ['msg-1'],
          confidence: 'high',
          source: 'external-extraction',
          trust: 'synthesized',
          status: 'draft',
          category: 'working-style',
        },
        {
          observation: 'Strict on test failure verbosity — I should never silently downgrade.',
          citations: ['msg-1'],
          confidence: 'high',
          source: 'self-authored-briefing',
          trust: 'agent-observed',
          status: 'draft',
          category: 'working-style',
        },
        {
          observation: 'User commits in small focused increments.',
          citations: ['msg-30'],
          confidence: 'high',
          source: 'external-extraction',
          trust: 'synthesized',
          status: 'draft',
          category: 'patterns',
        },
        {
          observation: 'Small commits with focused scope are the norm here.',
          citations: ['msg-30'],
          confidence: 'high',
          source: 'self-authored-briefing',
          trust: 'agent-observed',
          status: 'draft',
          category: 'patterns',
        },
        {
          observation: 'User trusts agent judgment after corrections established.',
          citations: ['msg-55'],
          confidence: 'medium',
          source: 'external-extraction',
          trust: 'synthesized',
          status: 'draft',
          category: 'relationship',
        },
        {
          observation: 'After initial corrections, user has been letting me proceed without micro-managing.',
          citations: ['msg-55'],
          confidence: 'medium',
          source: 'self-authored-briefing',
          trust: 'agent-observed',
          status: 'draft',
          category: 'relationship',
        },
      ],
    },
  ],
};

const ES3_SINGLE_SOURCE: any = {
  ...ES1_RICH,
  conversation_context: { ...ES1_RICH.conversation_context, name: 'single-source-heavy' },
  entities: [
    {
      id: 'e3',
      name: 'Iris',
      model: 'claude-opus-4-7',
      effort: 'high',
      prompt_length_chars: 410,
      field_notes: [
        {
          observation: 'User responds best to visual mockups over verbal description.',
          citations: ['msg-3'],
          confidence: 'medium',
          source: 'external-extraction',
          trust: 'synthesized',
          status: 'draft',
          category: 'working-style',
        },
        {
          observation: 'I tend to overthink; user prefers I commit to a direction and iterate.',
          citations: [],
          confidence: 'low',
          source: 'self-authored-briefing',
          trust: 'agent-observed',
          status: 'draft',
          category: 'patterns',
        },
        {
          observation: 'User changed their mind about panel-as-modal disclosure pattern mid-session.',
          citations: ['msg-44'],
          confidence: 'high',
          source: 'micro-reflection',
          trust: 'agent-observed',
          status: 'draft',
          category: 'course-corrections',
        },
      ],
    },
  ],
};

const ES4_NO_NOTES: any = {
  package_id: 'pkg-4',
  project: {
    id: 'proj-4',
    name: 'aaxt-rich',
    instructions: { length_chars: 191 },
    memory: { length_chars: 173 },
  },
  conversation_context: {
    id: 'ch-4',
    name: 'no-notes-yet',
    context: { length_chars: 175 },
  },
  conversation_history: { message_count: 6 },
  files: [],
  entities: [
    {
      id: 'e4',
      name: 'TestBot',
      model: 'claude-opus-4-7',
      effort: 'high',
      prompt_length_chars: 322,
      field_notes: null,
    },
  ],
};

const ES5_MULTI_ENTITY: any = {
  package_id: 'pkg-5',
  project: { id: 'proj-5', name: 'Mystery Menu', instructions: { length_chars: 230 }, memory: { length_chars: 0 } },
  conversation_context: { id: 'ch-5', name: 'mystery-menu', context: { length_chars: 95 } },
  conversation_history: { message_count: 24 },
  files: [{ id: 'fa' }],
  entities: [
    {
      id: 'ent-chef',
      name: 'Chef Margaux',
      model: 'claude-sonnet-4-6',
      effort: 'medium',
      prompt_length_chars: 250,
      field_notes: [
        {
          observation: 'User loves bold flavor ideas but pulls back if technique gets impractical.',
          citations: ['msg-5'],
          confidence: 'high',
          source: 'self-authored-briefing',
          trust: 'agent-observed',
          status: 'draft',
          category: 'patterns',
        },
      ],
    },
    {
      id: 'ent-sam',
      name: 'Sam',
      model: 'claude-sonnet-4-6',
      effort: 'medium',
      prompt_length_chars: 240,
      field_notes: [
        {
          observation: 'User dismisses cost objections once they trust the food vision.',
          citations: ['msg-9'],
          confidence: 'medium',
          source: 'external-extraction',
          trust: 'synthesized',
          status: 'draft',
          category: 'working-style',
        },
      ],
    },
    {
      id: 'ent-julien',
      name: 'Julien',
      model: 'claude-sonnet-4-6',
      effort: 'medium',
      prompt_length_chars: 245,
      field_notes: null,
    },
  ],
};

const STATES: TestState[] = [
  {
    name: 'ES1-rich',
    description: 'One entity, 5 field notes (1 agreement pair, 2 single-source, 1 micro-reflection)',
    manifest: ES1_RICH,
  },
  {
    name: 'ES2-agreements-heavy',
    description: 'One entity, 3 agreement pairs (all confirmed by both sources)',
    manifest: ES2_AGREEMENTS_HEAVY,
  },
  {
    name: 'ES3-single-source',
    description: 'One entity, 3 single-source notes (1 external, 1 self-authored, 1 micro-reflection)',
    manifest: ES3_SINGLE_SOURCE,
  },
  {
    name: 'ES4-no-notes',
    description: 'One entity with field_notes: null — tests "package contents only" path',
    manifest: ES4_NO_NOTES,
  },
  {
    name: 'ES5-multi-entity',
    description: 'Three entities (chef/sam/julien); only two have notes, third has none',
    manifest: ES5_MULTI_ENTITY,
  },
];

// ── Probe builders ───────────────────────────────────────────

const PROBE_BUILDERS: Array<(s: TestState) => Probe[]> = [
  // EP1 — Per-layer character counts
  (s) => {
    const m = s.manifest;
    const proj = m.project?.instructions?.length_chars ?? 0;
    if (proj === 0) return [];
    return [{
      id: `${s.name}.EP1`,
      state: s.name,
      claim: 'EP1-layer-character-counts',
      question: `Approximately how many characters of project instructions are being included in this export?`,
      expectedAnswer: `${proj.toLocaleString()} characters (from project "${m.project.name}")`,
      category: 'layer-character-counts',
    }];
  },

  // EP2 — Which entity each field note is about
  (s) => {
    const entityWithNotes = s.manifest.entities?.find((e: any) => e.field_notes && e.field_notes.length > 0);
    if (!entityWithNotes) return [];
    return [{
      id: `${s.name}.EP2`,
      state: s.name,
      claim: 'EP2-entity-attribution',
      question: `Which entity (agent) do the field notes in the panel describe? If there are notes for multiple entities, name them all.`,
      expectedAnswer: `${s.manifest.entities.filter((e: any) => e.field_notes && e.field_notes.length > 0).map((e: any) => e.name).join(', ')}`,
      category: 'entity-attribution',
    }];
  },

  // EP3 — Source distinction (across ALL entities with notes)
  (s) => {
    const entitiesWithNotes = s.manifest.entities?.filter((e: any) => e.field_notes && e.field_notes.length > 0) ?? [];
    if (entitiesWithNotes.length === 0) return [];
    const sources = new Set<string>();
    for (const ent of entitiesWithNotes) {
      for (const n of ent.field_notes) sources.add(n.source);
    }
    if (sources.size === 0) return [];
    return [{
      id: `${s.name}.EP3`,
      state: s.name,
      claim: 'EP3-source-distinction',
      question: `What different source labels or methods appear on any of the field notes shown in the panel? List the distinct labels you can see across all notes (e.g., "Self-reported", "External analysis", "Micro-reflection").`,
      expectedAnswer: `Distinct source labels shown: ${[...sources].map((s) => {
        if (s === 'external-extraction') return 'External analysis';
        if (s === 'self-authored-briefing') return 'Self-reported';
        if (s === 'micro-reflection') return 'Micro-reflection';
        return s;
      }).sort().join(', ')}`,
      category: 'source-distinction',
    }];
  },

  // EP4 — Agreement identification (across ALL entities with notes)
  (s) => {
    const entitiesWithNotes = s.manifest.entities?.filter((e: any) => e.field_notes && e.field_notes.length > 0) ?? [];
    if (entitiesWithNotes.length === 0) return [];
    // Pair within each entity (per-entity agreements; the UI shows agreements within each entity's section)
    let agreementCount = 0;
    for (const ent of entitiesWithNotes) {
      const notes = ent.field_notes;
      const used = new Set<number>();
      for (let i = 0; i < notes.length; i++) {
        if (used.has(i)) continue;
        for (let j = i + 1; j < notes.length; j++) {
          if (used.has(j)) continue;
          if (notes[j].category === notes[i].category && notes[j].source !== notes[i].source) {
            agreementCount++;
            used.add(i); used.add(j);
            break;
          }
        }
      }
    }
    return [{
      id: `${s.name}.EP4`,
      state: s.name,
      claim: 'EP4-agreement-identification',
      question: `Across all field notes in the panel (for all entities shown), how many notes (or note pairs) have been confirmed by more than one source/method?`,
      expectedAnswer: `${agreementCount} agreement pair${agreementCount === 1 ? '' : 's'} total (notes confirmed by both an external analysis and self-reflection on the same topic, summed across all entities shown)`,
      category: 'agreement-identification',
    }];
  },

  // EP5 — Single-source identification (across ALL entities with notes)
  (s) => {
    const entitiesWithNotes = s.manifest.entities?.filter((e: any) => e.field_notes && e.field_notes.length > 0) ?? [];
    if (entitiesWithNotes.length === 0) return [];
    let totalSingleSource = 0;
    for (const ent of entitiesWithNotes) {
      const notes = ent.field_notes;
      const used = new Set<number>();
      for (let i = 0; i < notes.length; i++) {
        if (used.has(i)) continue;
        for (let j = i + 1; j < notes.length; j++) {
          if (used.has(j)) continue;
          if (notes[j].category === notes[i].category && notes[j].source !== notes[i].source) {
            used.add(i); used.add(j);
            break;
          }
        }
      }
      totalSingleSource += notes.length - used.size;
    }
    return [{
      id: `${s.name}.EP5`,
      state: s.name,
      claim: 'EP5-single-source-count',
      question: `Across all field notes in the panel (for all entities shown), how many notes appear to come from only a single source (only one method found them — not confirmed by another)? Sum across all entities.`,
      expectedAnswer: `${totalSingleSource} single-source note${totalSingleSource === 1 ? '' : 's'} total (across all entities shown)`,
      category: 'single-source-count',
    }];
  },

  // EP6 — Confidence levels (across ALL entities with notes)
  (s) => {
    const entitiesWithNotes = s.manifest.entities?.filter((e: any) => e.field_notes && e.field_notes.length > 0) ?? [];
    if (entitiesWithNotes.length === 0) return [];
    const confidences = new Set<string>();
    for (const ent of entitiesWithNotes) {
      for (const n of ent.field_notes) confidences.add(n.confidence);
    }
    return [{
      id: `${s.name}.EP6`,
      state: s.name,
      claim: 'EP6-confidence-levels',
      question: `What confidence levels (e.g., high, medium, low) appear anywhere on the field notes in the panel? List only the distinct level names you can see, regardless of how many notes have each level.`,
      expectedAnswer: `Distinct confidence levels shown: ${[...confidences].sort().join(', ')}`,
      category: 'confidence-levels',
    }];
  },

  // EP7 — Message + file counts
  (s) => {
    const msgs = s.manifest.conversation_history?.message_count ?? 0;
    const files = s.manifest.files?.length ?? 0;
    return [{
      id: `${s.name}.EP7`,
      state: s.name,
      claim: 'EP7-message-file-count',
      question: `How many messages and how many files are being included in this export?`,
      expectedAnswer: `${msgs} messages and ${files} file${files === 1 ? '' : 's'}`,
      category: 'message-file-count',
    }];
  },

  // EP8 — Accepted/rejected status (initial state)
  (s) => {
    const entityWithNotes = s.manifest.entities?.find((e: any) => e.field_notes && e.field_notes.length > 0);
    if (!entityWithNotes) return [];
    return [{
      id: `${s.name}.EP8`,
      state: s.name,
      claim: 'EP8-review-status',
      question: `Looking at the field notes panel right now, has the user reviewed (accepted or rejected) any of the notes yet, or are they all still pending review?`,
      expectedAnswer: `All notes are still pending review (none accepted or rejected yet — the user has not interacted with them)`,
      category: 'review-status',
    }];
  },
];

// ── Test execution ───────────────────────────────────────────

describeIfEnabled('Round 37 — UI-as-context AAXT (ExportReviewPanel)', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('semantic conveyance probe across 5 states × 8 claim categories', async () => {
    if (!process.env.OPENAI_API_KEY && !process.env.ANTHROPIC_API_KEY) {
      throw new Error('No API key available — set ANTHROPIC_API_KEY or OPENAI_API_KEY');
    }

    const allResults: ScoredResult[] = [];
    const startedAt = new Date().toISOString();

    for (const state of STATES) {
      // Mock the fetch for this state
      mockFetch.mockResolvedValueOnce(state.manifest);

      const { container } = render(
        <ExportReviewPanel channelId={state.manifest.conversation_context.id} onClose={() => {}} />,
      );

      // Wait for the panel to finish loading
      await waitFor(() => {
        expect(container.textContent).toContain('Export Preview');
      });

      // For ES2/ES3 with agreements, expand the agreements section so probes can see them
      const expandBtn = container.querySelector('button')?.parentElement?.querySelector('button[class*="text-muted"]');
      // The agreements toggle uses class containing "text-muted hover:text-secondary"
      // Programmatically click it if present (it's a small toggle to expand collapsed agreements)
      const allButtons = Array.from(container.querySelectorAll('button'));
      const agreementsToggle = allButtons.find((b) => b.textContent?.match(/note(s)? confirmed by both/));
      if (agreementsToggle) {
        agreementsToggle.click();
        // Re-render snapshot after click
        await new Promise((r) => setTimeout(r, 50));
      }

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

      cleanup();
    }

    // ── Report ─────────────────────────────────────────────
    const finishedAt = new Date().toISOString();
    const provider = process.env.OPENAI_API_KEY ? 'openai/gpt-4o-mini' : 'anthropic/claude-haiku-4-5';

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('Round 37 — UI-as-context AAXT (ExportReviewPanel)');
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
    console.log(`Phantom:       ${summary.phantom}  ${summary.phantom > 0 ? '← HARD FAIL' : ''}`);
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
    // and the gate below is trivially satisfied by a run where every call
    // failed. Assert the calls actually landed before reading the numbers.
    const instrumentErrors = allResults
      .map((r) => r.reasoning ?? '')
      .filter((why) => /^(Error|Scoring error):/.test(why));
    expect(instrumentErrors).toEqual([]);

    expect(summary.phantom).toBe(0);
  }, 600_000);
});
