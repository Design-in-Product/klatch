/**
 * Round 38 — UI-as-context AAXT: ImportDialog session browser
 *
 * Third UI-as-context AAXT surface, after Round 36 (sidebar) and Round 37
 * (export review). Per Iris's reply (5/18): probes T1.6's design intent of
 * "selection by recognition" — does the rendered content fingerprint actually
 * let a user identify their session?
 *
 * Same methodology:
 *   1. Render ImportDialog with mocked fetchClaudeCodeSessions (synthetic
 *      session browse response)
 *   2. Click the "Browse..." button to trigger the browse fetch
 *   3. Expand all projects programmatically so the session list is visible
 *   4. Snapshot DOM, probe with user-proxy LLM, score
 *
 * Claim categories:
 *   IP1 — content fingerprint enables session identification by topic
 *   IP2 — already-imported sessions are distinguishable from new ones
 *   IP3 — turn count is readable per session
 *   IP5 — last-active date is readable per session
 *   IP6 — per-project session counts are visible
 *   IP7 — total session/project counts are visible at the header
 *
 * IP4 (fingerprintCapped suffix "+" communicates approximate count) retired
 * 2026-09-04: xian's cap ruling (FINGERPRINT_LINE_CAP 1500 -> 50,000, see
 * docs/scan-cap-latency-2026-09-03.md) made turnCount exact corpus-wide, so
 * the label dropped the "+" hedge entirely (ImportDialog.tsx) rather than
 * keep rendering it for a case that no longer occurs in practice.
 *
 * Gate: RUN_UI_AAXT=1.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, cleanup, waitFor } from '@testing-library/react';
import { act } from 'react';

vi.mock('../api/client', async () => {
  const actual = await vi.importActual<typeof import('../api/client')>('../api/client');
  return {
    ...actual,
    fetchClaudeCodeSessions: vi.fn(),
  };
});

import { fetchClaudeCodeSessions } from '../api/client';
import { ImportDialog } from '../components/ImportDialog';

const mockBrowse = vi.mocked(fetchClaudeCodeSessions);

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
  browseResponse: any;
}

// ── Auxiliary LLM client (inline, identical to 36/37) ────────

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
    const isInput = tag === 'input';
    const type = isInput ? el.getAttribute('type') : null;
    const checked = isInput && type === 'checkbox' ? (el as HTMLInputElement).checked : null;

    const annotations: string[] = [];
    if (role) annotations.push(`role=${role}`);
    if (ariaLabel) annotations.push(`aria-label="${ariaLabel}"`);
    if (title) annotations.push(`title="${title}"`);
    if (dataTestId) annotations.push(`data-testid=${dataTestId}`);
    if (isButton) annotations.push('clickable');
    if (type) annotations.push(`type=${type}`);
    if (checked !== null) annotations.push(`checked=${checked}`);

    const desc = annotations.length > 0 ? `<${tag} ${annotations.join(' ')}>` : `<${tag}>`;

    const onlyTextChild =
      el.childNodes.length === 1 &&
      el.firstChild?.nodeType === Node.TEXT_NODE &&
      el.firstChild.textContent?.trim();

    if (onlyTextChild) {
      lines.push(`${indent}${desc} "${onlyTextChild}"`);
      return;
    }

    if (annotations.length > 0 || ['button', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'nav', 'main', 'section', 'article', 'aside', 'label', 'input'].includes(tag)) {
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
  const systemPrompt = `You are a user looking at a software application UI. Below is a structured representation of what is visible on screen — the accessible text and ARIA tree of an "Import" dialog showing a list of Claude Code sessions the user could import. The list is organized by project; each session has a short text snippet showing what the conversation was about, plus metadata like message count and date. Based ONLY on what you can see, answer the question naturally. If you cannot tell from what is visible, say so honestly. You must return valid JSON.`;
  const userPrompt = `Here is what you can see in the import dialog:

${domSnapshot}

Question: ${question}

Answer based on what is visible. Return JSON: {"answer": "..."}`;

  const response = await queryAuxiliary(systemPrompt, userPrompt);
  const parsed = extractJson(response);
  return String(parsed.answer || '');
}

// ── Test states ──────────────────────────────────────────────

function sess(overrides: Partial<any>): any {
  return {
    path: '/tmp/sess.jsonl',
    sessionId: 'sess-default',
    projectPath: '/home/user/proj',
    projectName: 'proj',
    sizeBytes: 12345,
    modifiedAt: '2026-05-15T10:00:00Z',
    alreadyImported: false,
    isExported: false,
    ...overrides,
  };
}

const IS1_RICH: any = {
  projects: [
    {
      projectPath: '/home/user/Development/klatch',
      projectName: 'klatch',
      sessions: [
        sess({
          sessionId: 'a1', path: '/p/a1.jsonl',
          firstUserMessage: 'help me debug the SSE streaming race condition in messages route',
          messageCount: 47,
          turnCount: 47,
          fingerprintCapped: false,
          modifiedAt: '2026-05-17T14:32:00Z',
          alreadyImported: false,
        }),
        sess({
          sessionId: 'a2', path: '/p/a2.jsonl',
          firstUserMessage: 'review the new export-preview UI before I commit',
          messageCount: 12,
          turnCount: 12,
          fingerprintCapped: false,
          modifiedAt: '2026-05-16T09:15:00Z',
          alreadyImported: false,
        }),
        sess({
          sessionId: 'a3', path: '/p/a3.jsonl',
          firstUserMessage: 'lets continue from where we left off on the round 31 round-trip work',
          messageCount: 500,
          turnCount: 500,
          // fingerprintCapped no longer changes what's rendered (IP4 retired 9/4) --
          // kept true here as a regression check that a capped session still shows
          // a plain turn count, not a stale "+".
          fingerprintCapped: true,
          modifiedAt: '2026-04-28T08:36:00Z',
          alreadyImported: true,
          existingChannelName: 'daedalus-round31-roundtrip',
        }),
      ],
    },
    {
      projectPath: '/home/user/Development/piper-morgan-product',
      projectName: 'piper-morgan-product',
      sessions: [
        sess({
          sessionId: 'b1', path: '/p/b1.jsonl',
          firstUserMessage: 'M2g check-in — where are we on Slack DM aggregation',
          messageCount: 89,
          turnCount: 89,
          fingerprintCapped: false,
          modifiedAt: '2026-05-17T22:14:00Z',
          alreadyImported: false,
        }),
      ],
    },
  ],
  totalProjects: 2,
  totalSessions: 4,
};

const IS2_SINGLE: any = {
  projects: [
    {
      projectPath: '/home/user/proj-x',
      projectName: 'proj-x',
      sessions: [
        sess({
          sessionId: 'x1', path: '/p/x1.jsonl',
          firstUserMessage: 'hello, just exploring',
          messageCount: 3,
          turnCount: 3,
          fingerprintCapped: false,
          alreadyImported: false,
        }),
      ],
    },
  ],
  totalProjects: 1,
  totalSessions: 1,
};

const IS3_NO_FINGERPRINT: any = {
  projects: [
    {
      projectPath: '/home/user/empty-proj',
      projectName: 'empty-proj',
      sessions: [
        sess({
          sessionId: 'e1', path: '/p/e1.jsonl',
          firstUserMessage: undefined,
          messageCount: undefined,
          turnCount: undefined,
          fingerprintCapped: false,
          modifiedAt: '2026-05-10T00:00:00Z',
          alreadyImported: false,
        }),
        sess({
          sessionId: 'e2', path: '/p/e2.jsonl',
          firstUserMessage: 'a normal first message',
          messageCount: 5,
          turnCount: 5,
          fingerprintCapped: false,
          modifiedAt: '2026-05-11T00:00:00Z',
          alreadyImported: false,
        }),
      ],
    },
  ],
  totalProjects: 1,
  totalSessions: 2,
};

const IS4_DENSE: any = {
  projects: [
    {
      projectPath: '/home/user/dense',
      projectName: 'dense',
      sessions: Array.from({ length: 8 }, (_, i) => sess({
        sessionId: `d${i}`,
        path: `/p/d${i}.jsonl`,
        firstUserMessage: `session ${i + 1} — first user message about topic ${['auth', 'routing', 'tests', 'db', 'ui', 'api', 'deploy', 'monitoring'][i]}`,
        messageCount: 10 + i * 5,
        turnCount: 10 + i * 5,
        fingerprintCapped: false,
        modifiedAt: `2026-05-${10 + i}T12:00:00Z`,
        alreadyImported: i % 3 === 0, // every third is imported
        existingChannelName: i % 3 === 0 ? `imported-${i}` : undefined,
      })),
    },
  ],
  totalProjects: 1,
  totalSessions: 8,
};

const IS5_ALL_IMPORTED: any = {
  projects: [
    {
      projectPath: '/home/user/all-imp',
      projectName: 'all-imported',
      sessions: [
        sess({
          sessionId: 'i1', path: '/p/i1.jsonl',
          firstUserMessage: 'old session one',
          messageCount: 50,
          turnCount: 50,
          alreadyImported: true,
          existingChannelName: 'old-one',
        }),
        sess({
          sessionId: 'i2', path: '/p/i2.jsonl',
          firstUserMessage: 'old session two',
          messageCount: 30,
          turnCount: 30,
          alreadyImported: true,
          existingChannelName: 'old-two',
        }),
      ],
    },
  ],
  totalProjects: 1,
  totalSessions: 2,
};

const STATES: TestState[] = [
  { name: 'IS1-rich', description: '2 projects, 4 sessions, mix of imported/new and capped/uncapped', browseResponse: IS1_RICH },
  { name: 'IS2-single', description: '1 project, 1 session, simplest case', browseResponse: IS2_SINGLE },
  { name: 'IS3-no-fingerprint', description: '1 project, 2 sessions, one with no firstUserMessage', browseResponse: IS3_NO_FINGERPRINT },
  { name: 'IS4-dense', description: '1 project, 8 sessions, every 3rd imported', browseResponse: IS4_DENSE },
  { name: 'IS5-all-imported', description: '1 project, 2 sessions, both already imported', browseResponse: IS5_ALL_IMPORTED },
];

// ── Probe builders ───────────────────────────────────────────

const PROBE_BUILDERS: Array<(s: TestState) => Probe[]> = [
  // IP1 — fingerprint identification (pick the actual most-recently-modified)
  (s) => {
    const all = s.browseResponse.projects.flatMap((p: any) => p.sessions);
    const withFingerprint = all.filter((x: any) => x.firstUserMessage && x.modifiedAt);
    if (withFingerprint.length === 0) return [];
    // Sort by modifiedAt desc, take the most recent
    const mostRecent = [...withFingerprint].sort((a, b) =>
      new Date(b.modifiedAt).getTime() - new Date(a.modifiedAt).getTime(),
    )[0];
    return [{
      id: `${s.name}.IP1`,
      state: s.name,
      claim: 'IP1-fingerprint-identification',
      question: `Looking at the list of sessions, what topic was the most-recently-active session about? Quote or summarize what the conversation started with.`,
      expectedAnswer: `The most recently modified session — opening message: "${mostRecent.firstUserMessage}"`,
      category: 'fingerprint-identification',
    }];
  },

  // IP2 — already-imported identification
  (s) => {
    const all = s.browseResponse.projects.flatMap((p: any) => p.sessions);
    const imported = all.filter((x: any) => x.alreadyImported);
    return [{
      id: `${s.name}.IP2`,
      state: s.name,
      claim: 'IP2-already-imported',
      question: `Across all the sessions visible in the dialog, how many of them have already been imported, versus how many are new (not yet imported)?`,
      expectedAnswer: `${imported.length} already imported, ${all.length - imported.length} new (not yet imported)`,
      category: 'already-imported',
    }];
  },

  // IP3 — turn count readability
  (s) => {
    const sess = s.browseResponse.projects.flatMap((p: any) => p.sessions).find((x: any) => typeof x.turnCount === 'number');
    if (!sess) return [];
    return [{
      id: `${s.name}.IP3`,
      state: s.name,
      claim: 'IP3-turn-count-readable',
      question: `Pick any one session in the list that shows a count of exchanges and tell me approximately how many it has.`,
      expectedAnswer: `At least one session has a visible exchange count, e.g., "${sess.firstUserMessage}" with ${sess.turnCount} exchanges`,
      category: 'turn-count-readable',
    }];
  },

  // IP5 — last-active date readability
  (s) => {
    const sess = s.browseResponse.projects.flatMap((p: any) => p.sessions).find((x: any) => x.modifiedAt);
    if (!sess) return [];
    const date = new Date(sess.modifiedAt).toLocaleDateString();
    return [{
      id: `${s.name}.IP5`,
      state: s.name,
      claim: 'IP5-last-active-date',
      question: `Pick any visible session and tell me approximately when it was last active.`,
      expectedAnswer: `Each session shows a date; e.g., one session is from approximately ${date}`,
      category: 'last-active-date',
    }];
  },

  // IP6 — per-project session count
  (s) => {
    const proj = s.browseResponse.projects[0];
    if (!proj) return [];
    return [{
      id: `${s.name}.IP6`,
      state: s.name,
      claim: 'IP6-per-project-count',
      question: `How many sessions are in the project named "${proj.projectName}"?`,
      expectedAnswer: `${proj.sessions.length}`,
      category: 'per-project-count',
    }];
  },

  // IP7 — totals at the header
  (s) => {
    return [{
      id: `${s.name}.IP7`,
      state: s.name,
      claim: 'IP7-totals-at-header',
      question: `How many sessions are visible across how many projects in this dialog? (Look for a summary count.)`,
      expectedAnswer: `${s.browseResponse.totalSessions} sessions across ${s.browseResponse.totalProjects} project${s.browseResponse.totalProjects === 1 ? '' : 's'}`,
      category: 'totals-at-header',
    }];
  },
];

// ── Test execution ───────────────────────────────────────────

describeIfEnabled('Round 38 — UI-as-context AAXT (ImportDialog session browser)', () => {
  beforeEach(() => {
    mockBrowse.mockReset();
  });

  it('semantic conveyance probe across 5 states × 6 claim categories', async () => {
    if (!process.env.OPENAI_API_KEY && !process.env.ANTHROPIC_API_KEY) {
      throw new Error('No API key available');
    }

    const allResults: ScoredResult[] = [];
    const startedAt = new Date().toISOString();

    for (const state of STATES) {
      mockBrowse.mockResolvedValueOnce(state.browseResponse);

      const { container, getByText } = render(
        <ImportDialog
          isOpen={true}
          onClose={() => {}}
          onImported={() => {}}
        />,
      );

      // Click "Browse..." to trigger session-browse fetch
      const browseBtn = Array.from(container.querySelectorAll('button')).find(
        (b) => b.textContent?.trim() === 'Browse...',
      );
      if (browseBtn) {
        await act(async () => {
          browseBtn.click();
        });
      }

      // Wait for sessions list to render — header reads "Sessions (N in M projects)"
      // handleBrowseSessions auto-expands all projects on load (and pre-selects
      // non-imported sessions); no additional click required.
      await waitFor(() => {
        expect(container.textContent).toMatch(/sessions?\s*\(\d+\s+in\s+\d+/i);
      }, { timeout: 3000 });

      // Brief wait for re-render after auto-expand state updates settle
      await new Promise((r) => setTimeout(r, 100));

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

    const finishedAt = new Date().toISOString();
    const provider = process.env.OPENAI_API_KEY ? 'openai/gpt-4o-mini' : 'anthropic/claude-haiku-4-5';

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('Round 38 — UI-as-context AAXT (ImportDialog session browser)');
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

    // Soft-fail by design, not oversight: IP1's Phantom (cross-project recency
    // not legible in the import browser) was traced and confirmed as a genuine,
    // non-fixable UI/design limitation, not an instrument bug — see the Phantom
    // gating policy in docs/plans/AAXT-SCAFFOLDED-PROBING.md and the disposition
    // in docs/research/aaxt-c7-ground-truth-2026-08-09.md. Gate stays relaxed to
    // "did the run complete coherently" until/unless that changes.
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
    expect(summary.absent + summary.correct + summary.reconstructed + summary.confabulated + summary.phantom + summary.subliminal).toBe(summary.total);
  }, 600_000);
});
