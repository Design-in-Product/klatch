/**
 * Round 44 — UI-as-context AAXT: ProjectSettings Semantic Conveyance
 *
 * Target: the ProjectSettings panel — the L2 (Project Instructions) and L3 (Project Memory)
 * injection surface. Iris flagged this as highest-value next surface: if an agent can't read
 * what ProjectSettings communicates about the 5-layer model, it's flying blind on the two
 * deepest context layers.
 *
 * Key claims to probe:
 *   L1: Loading state — "Loading project..." communicates data is in-flight
 *   L2: Instructions field label — "(CLAUDE.md / project rules — injected into every chat)"
 *   L3: Memory field label — "(accumulated knowledge — MEMORY.md / claude.ai memories)"
 *   KB1: Knowledge base injection — "included in AI context for all channels" label semantics
 *   KB2: Remove file button — what "Remove from project" does
 *   KB3: "+ Add file" button — opens file picker for KB upload
 *   SRC1: Import source badge — "CC / Imported from Claude Code" communication
 *   SRC2: Import path + timestamp — provenance info on imported projects
 *   SAVE1: Cancel button in dirty state — discards / reverts
 *   CHAR1: Character count — live count below Instructions/Memory fields
 *
 * Scope guards:
 *   - API mocked: fetchProject, fetchProjectFiles (no server needed)
 *   - KB1 ("AI context") was originally "L3 context" — fixed per Daedalus 6/26 copy update
 *
 * Gated: makes real LLM calls. Skipped unless RUN_UI_AAXT=1 in env.
 *
 * Run with:
 *   set -a; source .env; set +a; RUN_UI_AAXT=1 npx vitest run packages/client/src/__tests__/round44-project-settings-aaxt.test.tsx
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, cleanup, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { FileWithRef } from '@klatch/shared';
import type { Project } from '../api/client';
import { ProjectSettings } from '../components/ProjectSettings';

// ── Gate ─────────────────────────────────────────────────────

const ENABLED = process.env.RUN_UI_AAXT === '1';
const describeIfEnabled = ENABLED ? describe : describe.skip;

// ── Mock API ──────────────────────────────────────────────────

const mockFetchProject = vi.fn();
const mockFetchProjectFiles = vi.fn();
const mockUpdateProjectApi = vi.fn();
const mockUploadProjectFile = vi.fn();
const mockRemoveProjectFile = vi.fn();

vi.mock('../api/client', () => ({
  fetchProject: (...args: any[]) => mockFetchProject(...args),
  fetchProjectFiles: (...args: any[]) => mockFetchProjectFiles(...args),
  updateProjectApi: (...args: any[]) => mockUpdateProjectApi(...args),
  uploadProjectFile: (...args: any[]) => mockUploadProjectFile(...args),
  removeProjectFile: (...args: any[]) => mockRemoveProjectFile(...args),
}));

// ── Types ─────────────────────────────────────────────────────

type Classification =
  | 'Correct'
  | 'Reconstructed'
  | 'Confabulated'
  | 'Absent'
  | 'Phantom'
  | 'Subliminal'
  | 'Unscored';

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
  const userPrompt = `A user was shown a structured accessibility-tree snapshot of a project settings panel in a chat application. They answered a question about what the UI communicates. Score their answer.

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
    const found =
      valid.find((c) => c.toLowerCase() === raw.toLowerCase()) ||
      valid.find((c) => raw.toUpperCase().startsWith(c.toUpperCase()));
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

// ── User-proxy probe ──────────────────────────────────────────

async function probeUser(domSnapshot: string, question: string): Promise<string> {
  const systemPrompt = `You are a user looking at a settings panel in a chat application that manages AI conversations. Below is a structured accessibility-tree representation of the panel — the visible text, labels, inputs, buttons, and their attributes. Based ONLY on what you can see in this representation, answer the question naturally. If you cannot tell from what is visible, say so honestly. Return valid JSON.`;

  const userPrompt = `Here is the accessible representation of what you can see on screen:

${domSnapshot}

Question: ${question}

Answer based only on what is visible. Return JSON: {"answer": "..."}`;

  const response = await queryAuxiliary(systemPrompt, userPrompt);
  const parsed = extractJson(response);
  return String(parsed.answer || '');
}

// ── Fixtures ──────────────────────────────────────────────────

const NATIVE_PROJECT: Project = {
  id: 'proj-native',
  name: 'Klatch',
  instructions: 'You are working on Klatch, a Slack-inspired local-first web app for managing Claude AI conversations. The key architecture pattern is POST + SSE streaming. Follow Gall\'s Law: each feature is the smallest working increment. No state management library yet.',
  memory: 'Test count: 1173 total (server + client). Default model: claude-opus-4-7. SQLite at project root (klatch.db). npm workspaces.',
  source: 'native',
  sourceMetadata: '',
  createdAt: '2026-06-01T00:00:00Z',
};

const IMPORTED_PROJECT: Project = {
  id: 'proj-imported',
  name: 'Klatch (imported)',
  instructions: '# Klatch\n\nA standalone, local-first web app for managing Claude AI conversations.\n\n## Quick Start\n\n```bash\nnpm run dev\n```',
  memory: '',
  source: 'claude-code',
  sourceMetadata: JSON.stringify({
    cwd: '/Users/xian/Development/klatch',
    importedAt: '2026-06-23T17:00:00.000Z',
  }),
  createdAt: '2026-06-23T17:00:00Z',
};

const SAMPLE_FILES: FileWithRef[] = [
  {
    id: 'file-arch',
    name: 'ARCHITECTURE.md',
    mimeType: 'text/markdown',
    sizeBytes: 4200,
    storageKey: 'uploads/architecture-2026.md',
    createdAt: '2026-06-23T10:00:00Z',
    refId: 'ref-1',
    scope: 'project',
    scopeId: 'proj-native',
    refType: 'pinned',
    addedAt: '2026-06-23T10:00:00Z',
  },
  {
    id: 'file-road',
    name: 'ROADMAP.md',
    mimeType: 'text/markdown',
    sizeBytes: 8192,
    storageKey: 'uploads/roadmap-2026.md',
    createdAt: '2026-06-23T10:00:00Z',
    refId: 'ref-2',
    scope: 'project',
    scopeId: 'proj-native',
    refType: 'pinned',
    addedAt: '2026-06-23T10:00:00Z',
  },
];

// ── Probe definitions ─────────────────────────────────────────

interface ProjectSettingsProbe {
  id: string;
  claim: string;
  category: string;
  question: string;
  expectedAnswer: string;
  state: 'S-loading' | 'S-native' | 'S-imported' | 'S-files' | 'S-dirty';
  scopeNote?: string;
  isSubliminalCandidate?: boolean;
}

const PROBES: ProjectSettingsProbe[] = [
  {
    id: 'L1',
    claim: 'loading-state',
    category: 'loading',
    state: 'S-loading',
    question: 'You see the text "Loading project..." in a panel. What does this indicate?',
    expectedAnswer: 'The project data is being fetched/loaded from the server; the settings form is not ready yet',
  },
  {
    id: 'L2a',
    claim: 'instructions-inject-label',
    category: 'l2-layer',
    state: 'S-native',
    question: 'The "Instructions" field label reads "(CLAUDE.md / project rules — injected into every chat)". What does text in this field configure for AI conversations in this project?',
    expectedAnswer: 'Project-level behavioral rules and instructions for the AI — equivalent to CLAUDE.md — that are automatically injected into every conversation that belongs to this project',
  },
  {
    id: 'L3a',
    claim: 'memory-accumulated-knowledge-label',
    category: 'l3-layer',
    state: 'S-native',
    question: 'The "Memory" field label reads "(accumulated knowledge — MEMORY.md / claude.ai memories)". What type of content belongs in this field?',
    expectedAnswer: 'Accumulated contextual knowledge about the project — facts, preferences, history, and memories — equivalent to MEMORY.md or claude.ai project memories',
  },
  {
    id: 'CHAR1',
    claim: 'char-count-indicator',
    category: 'field-feedback',
    state: 'S-native',
    question: 'Below the Instructions textarea, there is a small text showing a number followed by "chars". What does this communicate?',
    expectedAnswer: 'The current character count of the Instructions field content — a live length indicator',
  },
  {
    id: 'SRC1',
    claim: 'import-source-badge',
    category: 'import-provenance',
    state: 'S-imported',
    question: 'A card at the top of the panel shows a "CC" badge and the text "Imported from Claude Code". What does this communicate about this project?',
    expectedAnswer: 'The project was originally created in Claude Code (the CLI tool) and was imported into this application — it did not originate natively here',
  },
  {
    id: 'SRC2',
    claim: 'import-path-and-date',
    category: 'import-provenance',
    state: 'S-imported',
    question: 'The import card shows "Path: /Users/xian/Development/klatch" and "Imported: ..." with a timestamp. What information do these two items provide?',
    expectedAnswer: 'The original file system path of the Claude Code project on disk, and the date/time when it was imported into this application',
  },
  {
    id: 'KB1',
    claim: 'kb-l3-context-injection',
    category: 'knowledge-base',
    state: 'S-files',
    question: 'The "Knowledge base" section label reads "(2 files — included in AI context for all channels in this project)". What does "included in AI context" tell you about how these files are used?',
    expectedAnswer: 'The files are included in the AI context and are available to the AI in every conversation within this project',
    scopeNote: 'L3 is domain jargon from the 5-layer model — a user without that context may not understand "L3"; partial credit for "injected into context for all channels"',
    isSubliminalCandidate: true,
  },
  {
    id: 'KB2',
    claim: 'kb-remove-file',
    category: 'knowledge-base',
    state: 'S-files',
    question: 'A file card in the Knowledge base section has a button with title "Remove from project". What does clicking this button do?',
    expectedAnswer: 'Removes the file from the project\'s knowledge base — it will no longer be included in the AI context for conversations in this project',
  },
  {
    id: 'KB3',
    claim: 'kb-add-file',
    category: 'knowledge-base',
    state: 'S-files',
    question: 'Below the file list, there is a dashed-border button labeled "+ Add file". What does clicking it do?',
    expectedAnswer: 'Opens a file upload dialog to add a new file to the project\'s knowledge base',
  },
  {
    id: 'SAVE1',
    claim: 'cancel-reverts-dirty',
    category: 'save-cancel',
    state: 'S-dirty',
    question: 'After editing the Instructions field, "Save" and "Cancel" buttons appeared. What does the "Cancel" button do?',
    expectedAnswer: 'Discards the unsaved changes and reverts the field back to the previously saved value',
  },
];

// ── Test execution ────────────────────────────────────────────

const DEFAULT_PROPS = {
  projectId: 'proj-native',
  onClose: () => {},
  onUpdated: () => {},
};

describeIfEnabled('Round 44 — UI-as-context AAXT (ProjectSettings)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('semantic conveyance probe: L2/L3 labels, import badge, KB injection, save/cancel', async () => {
    if (!process.env.ANTHROPIC_API_KEY && !process.env.OPENAI_API_KEY) {
      throw new Error('No API key available — set ANTHROPIC_API_KEY or OPENAI_API_KEY');
    }

    const user = userEvent.setup();
    const allResults: ScoredResult[] = [];
    const startedAt = new Date().toISOString();

    // ── State S-loading: fetchProject never resolves ──────────

    {
      mockFetchProject.mockReturnValue(new Promise(() => {}));
      mockFetchProjectFiles.mockReturnValue(new Promise(() => {}));

      const { container } = render(<ProjectSettings {...DEFAULT_PROPS} />);

      const snapshot = snapshotDom(container);

      for (const probe of PROBES.filter((p) => p.state === 'S-loading')) {
        try {
          const agentResponse = await probeUser(snapshot, probe.question);
          const score = await scoreResponse(probe.question, probe.expectedAnswer, agentResponse);
          allResults.push({ ...probe, agentResponse, ...score });
        } catch (err) {
          allResults.push({ ...probe, agentResponse: '', classification: 'Absent', confidence: 0, reasoning: `Error: ${err instanceof Error ? err.message : String(err)}` });
        }
      }

      cleanup();
    }

    // ── State S-native: native project, no files ──────────────

    {
      mockFetchProject.mockResolvedValue(NATIVE_PROJECT);
      mockFetchProjectFiles.mockResolvedValue([]);

      const { container } = render(<ProjectSettings {...DEFAULT_PROPS} />);

      await waitFor(() => {
        expect(container.querySelector('textarea')).toBeTruthy();
      });

      const snapshot = snapshotDom(container);

      for (const probe of PROBES.filter((p) => p.state === 'S-native')) {
        try {
          const agentResponse = await probeUser(snapshot, probe.question);
          const score = await scoreResponse(probe.question, probe.expectedAnswer, agentResponse);
          allResults.push({ ...probe, agentResponse, ...score });
        } catch (err) {
          allResults.push({ ...probe, agentResponse: '', classification: 'Absent', confidence: 0, reasoning: `Error: ${err instanceof Error ? err.message : String(err)}` });
        }
      }

      cleanup();
    }

    // ── State S-imported: imported project (CC), no files ─────

    {
      mockFetchProject.mockResolvedValue(IMPORTED_PROJECT);
      mockFetchProjectFiles.mockResolvedValue([]);

      const { container } = render(
        <ProjectSettings projectId="proj-imported" onClose={() => {}} onUpdated={() => {}} />,
      );

      await waitFor(() => {
        expect(container.querySelector('textarea')).toBeTruthy();
      });

      const snapshot = snapshotDom(container);

      for (const probe of PROBES.filter((p) => p.state === 'S-imported')) {
        try {
          const agentResponse = await probeUser(snapshot, probe.question);
          const score = await scoreResponse(probe.question, probe.expectedAnswer, agentResponse);
          allResults.push({ ...probe, agentResponse, ...score });
        } catch (err) {
          allResults.push({ ...probe, agentResponse: '', classification: 'Absent', confidence: 0, reasoning: `Error: ${err instanceof Error ? err.message : String(err)}` });
        }
      }

      cleanup();
    }

    // ── State S-files: native project + 2 KB files ────────────

    {
      mockFetchProject.mockResolvedValue(NATIVE_PROJECT);
      mockFetchProjectFiles.mockResolvedValue(SAMPLE_FILES);

      const { container } = render(<ProjectSettings {...DEFAULT_PROPS} />);

      await waitFor(() => {
        expect(container.querySelector('[title="Remove from project"]')).toBeTruthy();
      });

      const snapshot = snapshotDom(container);

      for (const probe of PROBES.filter((p) => p.state === 'S-files')) {
        try {
          const agentResponse = await probeUser(snapshot, probe.question);
          const score = await scoreResponse(probe.question, probe.expectedAnswer, agentResponse);
          allResults.push({ ...probe, agentResponse, ...score });
        } catch (err) {
          allResults.push({ ...probe, agentResponse: '', classification: 'Absent', confidence: 0, reasoning: `Error: ${err instanceof Error ? err.message : String(err)}` });
        }
      }

      cleanup();
    }

    // ── State S-dirty: edit Instructions field ────────────────

    {
      mockFetchProject.mockResolvedValue(NATIVE_PROJECT);
      mockFetchProjectFiles.mockResolvedValue([]);

      const { container } = render(<ProjectSettings {...DEFAULT_PROPS} />);

      await waitFor(() => {
        expect(container.querySelector('textarea')).toBeTruthy();
      });

      // Edit the Instructions textarea to trigger dirty state
      const textareas = container.querySelectorAll('textarea');
      const instructionsArea = textareas[0]; // Instructions is first textarea

      await act(async () => {
        await user.click(instructionsArea);
        await user.type(instructionsArea, ' (updated)');
      });

      await waitFor(() => {
        expect(container.querySelector('button[class*="bg-accent"]')).toBeTruthy();
      });

      const snapshot = snapshotDom(container);

      for (const probe of PROBES.filter((p) => p.state === 'S-dirty')) {
        try {
          const agentResponse = await probeUser(snapshot, probe.question);
          const score = await scoreResponse(probe.question, probe.expectedAnswer, agentResponse);
          allResults.push({ ...probe, agentResponse, ...score });
        } catch (err) {
          allResults.push({ ...probe, agentResponse: '', classification: 'Absent', confidence: 0, reasoning: `Error: ${err instanceof Error ? err.message : String(err)}` });
        }
      }

      cleanup();
    }

    // ── Summary ───────────────────────────────────────────────

    const total = allResults.length;
    const correct = allResults.filter((r) => r.classification === 'Correct').length;
    const reconstructed = allResults.filter((r) => r.classification === 'Reconstructed').length;
    const confabulated = allResults.filter((r) => r.classification === 'Confabulated').length;
    const absent = allResults.filter((r) => r.classification === 'Absent').length;
    const phantom = allResults.filter((r) => r.classification === 'Phantom').length;
    const subliminal = allResults.filter((r) => r.classification === 'Subliminal').length;

    const expectedAbsent = allResults.filter((r) => r.isSubliminalCandidate && ['Absent', 'Subliminal'].includes(r.classification)).length;
    const adjustedTotal = total - expectedAbsent;
    const adjustedConveyed = correct + reconstructed;
    const conveyancePct = Math.round((adjustedConveyed / adjustedTotal) * 100);

    console.log('\n══ Round 44 — ProjectSettings AAXT ════════════════════════════');
    console.log(`  Started: ${startedAt}`);
    console.log(`  Total probes: ${total} | Adjusted (excl. expected-absent): ${adjustedTotal}`);
    console.log(`  Correct: ${correct} | Reconstructed: ${reconstructed} | Confabulated: ${confabulated} | Absent: ${absent} | Phantom: ${phantom} | Subliminal: ${subliminal}`);
    console.log(`  Overall conveyance: ${Math.round(((correct + reconstructed) / total) * 100)}% | Adjusted conveyance: ${conveyancePct}%`);
    console.log('');

    for (const r of allResults) {
      const flag = r.classification === 'Phantom' ? ' ⚠ PHANTOM'
        : r.classification === 'Confabulated' ? ' ⚠ CONFABULATED'
        : r.classification === 'Absent' && !r.isSubliminalCandidate ? ' ⚠ ABSENT'
        : r.isSubliminalCandidate ? ' (diagnostic)'
        : '';
      console.log(`  [${r.id}] [${r.state}] ${r.classification} (${r.confidence.toFixed(2)})${flag}`);
      console.log(`    Claim: ${r.claim}`);
      console.log(`    Response: ${r.agentResponse.slice(0, 140)}${r.agentResponse.length > 140 ? '…' : ''}`);
      console.log(`    Scoring: ${r.reasoning.slice(0, 140)}${r.reasoning.length > 140 ? '…' : ''}`);
      if (r.scopeNote) console.log(`    Scope: ${r.scopeNote}`);
      console.log('');
    }

    console.log('══ End Round 44 ══════════════════════════════════════════════════');

    const summary = { correct, reconstructed, confabulated, absent, phantom, subliminal };
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
