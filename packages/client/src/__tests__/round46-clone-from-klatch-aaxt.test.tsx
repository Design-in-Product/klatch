/**
 * Round 46 — UI-as-context AAXT: Clone-from-Klatch Semantic Conveyance
 *
 * Target: the clone-from-klatch action-select in ChannelSidebar's New Klatch form.
 *   Source: packages/client/src/components/ChannelSidebar.tsx
 *   Increment 6 (composition gesture).
 *
 * What the surface does:
 *   When at least one klatch exists, an action-select appears at the top of the
 *   New Klatch form: "Copy setup from an existing klatch…". Selecting a source
 *   prefills Name ("Copy of {name}"), Purpose (empty if source was boilerplate,
 *   otherwise source purpose), Mode, and Project. The select always resets to its
 *   placeholder after prefilling — it's a one-shot action, not a persistent selection.
 *
 * Key claims to probe:
 *   GUARD1:   Clone select absent when no klatches exist (fresh account)
 *   PRESENT1: Placeholder "Copy setup from an existing klatch…" is legible
 *   TITLE1:   title attribute conveys what prefill means
 *   OPTION1:  Existing klatch names appear as options in the select
 *   NAME1:    After clone, name field reads "Copy of {source}"
 *   PURPOSE1: After clone with real purpose, purpose field shows that purpose
 *   PURPOSE2: After clone with boilerplate purpose, purpose field is empty
 *   RESET1:   Clone select returns to placeholder after prefilling (not stuck on source)
 *
 * Scope guards:
 *   - Roster prefill is async (fetchChannelEntities); AAXT focuses on sync-visible fields
 *   - Multi-project behavior is out of scope for this increment
 *   - Mode select prefill is visible in DOM but not probed (already verified by Iris MAXT)
 *
 * Gated: makes real LLM calls. Skipped unless RUN_UI_AAXT=1 in env.
 *
 * Run with:
 *   set -a; source .env; set +a; RUN_UI_AAXT=1 npx vitest run packages/client/src/__tests__/round46-clone-from-klatch-aaxt.test.tsx
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, cleanup, waitFor, fireEvent, screen } from '@testing-library/react';
import type { Channel } from '@klatch/shared';
import { ChannelSidebar } from '../components/ChannelSidebar';

// ── Gate ─────────────────────────────────────────────────────

const ENABLED = process.env.RUN_UI_AAXT === '1';
const describeIfEnabled = ENABLED ? describe : describe.skip;

// ── Mocks ─────────────────────────────────────────────────────

const mockFetchChannelEntities = vi.fn();

vi.mock('../api/client', () => ({
  fetchChannelEntities: (...args: any[]) => mockFetchChannelEntities(...args),
}));

vi.mock('../hooks/useModels', () => ({
  getModelLabel: (model: string) =>
    model.includes('opus') ? 'Opus' : model.includes('sonnet') ? 'Sonnet' : 'Haiku',
  useModels: () => ({ models: [], loading: false }),
}));

vi.mock('../components/KlatchLogo', () => ({
  KlatchLogo: () => null,
}));

// ── Fixtures ──────────────────────────────────────────────────

function makeChannel(overrides: Partial<Channel>): Channel {
  return {
    id: 'default',
    name: 'general',
    type: 'chat',
    systemPrompt: '',
    model: 'claude-opus-4-6',
    mode: 'panel',
    source: 'native',
    createdAt: '2026-01-01T00:00:00Z',
    ...overrides,
  } as Channel;
}

const GENERAL_CHANNEL = makeChannel({ id: 'default', name: 'general', type: 'chat' });
const CHAT_CHANNEL = makeChannel({ id: 'c1', name: 'daedalus', type: 'chat' });

const STANDUP_KLATCH = makeChannel({
  id: 'k1',
  name: 'standup',
  type: 'klatch',
  mode: 'roundtable',
  systemPrompt: 'Discuss daily standups and blockers.',
});

const BOILERPLATE_KLATCH = makeChannel({
  id: 'k2',
  name: 'retro',
  type: 'klatch',
  mode: 'panel',
  systemPrompt: 'You are a helpful assistant.',
});

const DEFAULT_PROPS = {
  activeChannelId: 'default',
  onSelectChannel: vi.fn(),
  onCreateChannel: vi.fn(),
  projects: [],
  entities: [],
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
    // A <select> renders the text of its selected option, and a sighted user reads
    // that text off the closed control. Annotating only a truthy `value` meant an
    // empty-valued select — like the one-shot clone action-select, hardcoded
    // value="" (ChannelSidebar.tsx:504) — appeared with no indication of what it
    // shows, so the snapshot conveyed strictly LESS than the screen.
    // (Argus 8/05 Finding C, re-scoped as instrument fidelity.)
    //
    // Marked on the option rather than as a select-level attribute on purpose: a
    // first attempt used `displays="…"` and scored WORSE, because a reader treats
    // an attribute as machine metadata and keeps reasoning from the options list —
    // it answered "'standup', because the select has a displays attribute". Two
    // competing signals are worse than none. The annotation is phrased to say what
    // a viewer would see, not to name a DOM property.
    if (tag === 'option' && (el as HTMLOptionElement).selected) {
      annotations.push('currently shown on the closed control');
    }
    if (tag === 'button') annotations.push('clickable');
    if (tag === 'a') annotations.push('link');
    if (tag === 'label') annotations.push('label');
    if (tag === 'input') annotations.push('input');
    if (tag === 'textarea') annotations.push('textarea');
    if (tag === 'select') annotations.push('select');
    if (tag === 'option') annotations.push('option');

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
       'select', 'option'].includes(tag);

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
  const userPrompt = `A user was shown a structured accessibility-tree snapshot of a chat application's "New Klatch" form. They answered a question about what the UI communicates. Score their answer.

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
  const systemPrompt = `You are a user looking at the "New Klatch" creation form in a chat application. Below is a structured accessibility-tree representation of the form — visible text, inputs, dropdowns, buttons, and their attributes. Based ONLY on what you can see in this representation, answer the question naturally. If you cannot tell from what is visible, say so. Return valid JSON.`;

  const userPrompt = `Here is the accessible representation of the New Klatch form:

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
  state: 'S-no-klatches' | 'S-has-klatches' | 'S-prefilled-real' | 'S-prefilled-boilerplate';
  claim: string;
  category: string;
  question: string;
  expectedAnswer: string;
  scopeNote?: string;
  isSubliminalCandidate?: boolean;
}

const PROBES: Probe[] = [
  // S-no-klatches: fresh account — only a chat channel exists, no klatches
  {
    id: 'GUARD1',
    claim: 'clone-select-absent-without-klatches',
    category: 'visibility-guard',
    state: 'S-no-klatches',
    question:
      'In the New Klatch form, is there a dropdown or select element that lets you copy setup from an existing klatch?',
    // The mode control is named with its rendered option labels (INTERACTION_MODES,
    // shared/src/types.ts:55) because the probe question invites a contrast: asked
    // "is there a copy-setup select?", a correct answer naturally distinguishes it
    // from the select that IS present. Twice now the judge has penalized that true
    // supplementary detail — Confabulated in R46/June, Phantom on 8/05 — while the
    // guard behavior itself passed both times. Naming the control lets the judge
    // reconcile "klatch type (Broadcast/Roundtable/Directed)" with "mode".
    expectedAnswer:
      'No — there is no clone or copy-setup dropdown. The form only shows the name field, purpose, a Mode select (options: Broadcast, Roundtable, Directed), and create/cancel buttons. Mentioning the Mode select is correct and expected, not a fabrication.',
  },

  // S-has-klatches: one klatch exists — clone select visible
  {
    id: 'PRESENT1',
    claim: 'clone-select-placeholder-legible',
    category: 'label-legibility',
    state: 'S-has-klatches',
    question:
      'What does the first dropdown/select in the New Klatch form say? What is its placeholder or default option?',
    expectedAnswer:
      '"Copy setup from an existing klatch…" — it is an action invitation to pre-fill the form from an existing klatch.',
  },
  {
    id: 'TITLE1',
    claim: 'clone-select-title-conveys-prefill',
    category: 'label-legibility',
    state: 'S-has-klatches',
    question:
      'Does the clone/copy-setup dropdown have a tooltip or title? If so, what does it say?',
    expectedAnswer:
      'Yes — the title reads "Pre-fill name, agents, mode, purpose, and project from an existing klatch".',
  },
  {
    id: 'OPTION1',
    claim: 'klatch-name-appears-as-option',
    category: 'clone-content',
    state: 'S-has-klatches',
    question:
      'What options are available in the clone/copy-setup dropdown (aside from the placeholder)?',
    expectedAnswer:
      'The existing klatch "standup" appears as a selectable option.',
  },

  // S-prefilled-real: after selecting the standup klatch (real purpose)
  {
    id: 'NAME1',
    claim: 'name-prefilled-with-copy-of-prefix',
    category: 'prefill-content',
    state: 'S-prefilled-real',
    question:
      'What value is currently in the klatch name field?',
    expectedAnswer:
      '"Copy of standup" — the name field has been prefilled with "Copy of" prepended to the source klatch\'s name.',
  },
  {
    id: 'PURPOSE1',
    claim: 'purpose-prefilled-with-real-purpose',
    category: 'prefill-content',
    state: 'S-prefilled-real',
    question:
      'What text appears in the purpose/instructions textarea?',
    expectedAnswer:
      '"Discuss daily standups and blockers." — the purpose from the source klatch has been copied into the textarea.',
  },
  {
    id: 'RESET1',
    claim: 'clone-select-resets-to-placeholder-after-prefill',
    category: 'prefill-behavior',
    state: 'S-prefilled-real',
    question:
      'After prefilling the form, what does the clone/copy-setup dropdown currently show — the selected klatch name, or the placeholder?',
    expectedAnswer:
      'The dropdown shows the placeholder "Copy setup from an existing klatch…" — it has reset after prefilling, not persisting the selected klatch.',
  },

  // S-prefilled-boilerplate: source klatch has boilerplate purpose → purpose should be empty
  {
    id: 'PURPOSE2',
    claim: 'purpose-empty-for-boilerplate-source',
    category: 'prefill-behavior',
    state: 'S-prefilled-boilerplate',
    question:
      'After copying setup from the "retro" klatch, what appears in the purpose textarea? Is there any purpose text, or does it show a placeholder/empty state?',
    expectedAnswer:
      'The purpose textarea is empty — it shows the placeholder "Purpose — what is this klatch for? (optional)" rather than the source\'s default boilerplate text.',
    scopeNote:
      'The source klatch has the default boilerplate purpose ("You are a helpful assistant."). The design intentionally omits boilerplate from the prefill to avoid copying meaningless noise.',
  },
];

// ── Test execution ─────────────────────────────────────────────

describeIfEnabled('Round 46 — UI-as-context AAXT (Clone-from-Klatch)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchChannelEntities.mockResolvedValue([]);
  });

  it(
    'semantic conveyance probe: visibility guard, placeholder legibility, prefill accuracy, boilerplate skip',
    async () => {
      if (!process.env.ANTHROPIC_API_KEY && !process.env.OPENAI_API_KEY) {
        throw new Error('No API key available — set ANTHROPIC_API_KEY or OPENAI_API_KEY');
      }

      const allResults: ScoredResult[] = [];
      const startedAt = new Date().toISOString();

      // ── State S-no-klatches: form open, only a chat exists ─────

      {
        const { container } = render(
          <ChannelSidebar
            {...DEFAULT_PROPS}
            channels={[GENERAL_CHANNEL, CHAT_CHANNEL]}
          />,
        );

        // Open the New Klatch form
        fireEvent.click(screen.getByText('+ New Klatch'));

        await waitFor(() => {
          expect(container.querySelector('textarea')).toBeTruthy();
        });

        const snapshot = snapshotDom(container);

        for (const probe of PROBES.filter((p) => p.state === 'S-no-klatches')) {
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

      // ── State S-has-klatches: form open, standup klatch exists ──

      {
        const { container } = render(
          <ChannelSidebar
            {...DEFAULT_PROPS}
            channels={[GENERAL_CHANNEL, STANDUP_KLATCH]}
          />,
        );

        fireEvent.click(screen.getByText('+ New Klatch'));

        await waitFor(() => {
          expect(container.querySelector('select[title*="Pre-fill"]')).toBeTruthy();
        });

        const snapshot = snapshotDom(container);

        for (const probe of PROBES.filter((p) => p.state === 'S-has-klatches')) {
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

      // ── State S-prefilled-real: select standup (real purpose) ──

      {
        const { container } = render(
          <ChannelSidebar
            {...DEFAULT_PROPS}
            channels={[GENERAL_CHANNEL, STANDUP_KLATCH]}
          />,
        );

        fireEvent.click(screen.getByText('+ New Klatch'));

        await waitFor(() => {
          expect(container.querySelector('select[title*="Pre-fill"]')).toBeTruthy();
        });

        // Trigger clone — fires cloneFromKlatch(STANDUP_KLATCH.id)
        const cloneSelect = container.querySelector('select[title*="Pre-fill"]') as HTMLSelectElement;
        fireEvent.change(cloneSelect, { target: { value: STANDUP_KLATCH.id } });

        // Wait for synchronous prefill to land (name field updates immediately)
        await waitFor(() => {
          const nameInput = container.querySelector('input[type="text"]') as HTMLInputElement;
          expect(nameInput?.value).toContain('Copy of standup');
        });

        const snapshot = snapshotDom(container);

        for (const probe of PROBES.filter((p) => p.state === 'S-prefilled-real')) {
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

      // ── State S-prefilled-boilerplate: select retro (boilerplate) ──

      {
        const { container } = render(
          <ChannelSidebar
            {...DEFAULT_PROPS}
            channels={[GENERAL_CHANNEL, BOILERPLATE_KLATCH]}
          />,
        );

        fireEvent.click(screen.getByText('+ New Klatch'));

        await waitFor(() => {
          expect(container.querySelector('select[title*="Pre-fill"]')).toBeTruthy();
        });

        const cloneSelect = container.querySelector('select[title*="Pre-fill"]') as HTMLSelectElement;
        fireEvent.change(cloneSelect, { target: { value: BOILERPLATE_KLATCH.id } });

        // Wait for name prefill to confirm the clone fired
        await waitFor(() => {
          const nameInput = container.querySelector('input[type="text"]') as HTMLInputElement;
          expect(nameInput?.value).toContain('Copy of retro');
        });

        const snapshot = snapshotDom(container);

        for (const probe of PROBES.filter((p) => p.state === 'S-prefilled-boilerplate')) {
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

      console.log('\n══ Round 46 — Clone-from-Klatch AAXT ══════════════════════════');
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
        // Truncation is fine for a passing probe and actively harmful for a failing
        // one: a clipped judge rationale is exactly what blocks deciding whether a
        // Phantom is a real finding or a judge miscall (Argus, 8/05 Finding B).
        // Failures print in full.
        const isFailure = r.classification === 'Phantom' || r.classification === 'Confabulated';
        console.log(`    A: ${isFailure ? r.agentResponse : r.agentResponse.slice(0, 200)}`);
        console.log(`    ${isFailure ? r.reasoning : r.reasoning.slice(0, 200)}`);
        if (r.scopeNote) console.log(`    scope: ${r.scopeNote}`);
      }

      console.log('═══════════════════════════════════════════════════════════════\n');

      const summary = { total, correct, reconstructed, confabulated, absent, phantom, subliminal, conveyancePct };
      expect(summary.phantom).toBe(0);
    },
    600_000,
  );
});
