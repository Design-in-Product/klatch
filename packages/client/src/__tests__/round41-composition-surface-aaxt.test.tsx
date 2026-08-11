/**
 * Round 41 — UI-as-context AAXT: Composition Surface Semantic Conveyance
 *
 * Target: the "New Klatch" creation form and agent picker (composition spec §2–4).
 * Daedalus increments 1+2 shipped to main 2026-06-21/22.
 *
 * The UI-as-context AAXT question here: does an agent dropped in front of the
 * klatch creation surface correctly attribute what each element does?
 *
 * Per Iris's handoff memo (iris-to-theseus-composition-surface-aaxt-2026-06-22.md),
 * four specific claims to probe:
 *   C1: What "Roles vs Other agents" means in the picker tier structure
 *   C2: What "Purpose" does (shared context for the klatch, not per-agent instructions)
 *   C3: What the selected-agent chips represent
 *   C4: What the mode selector changes (message routing, not appearance)
 *
 * Plus two additional surface-level claims:
 *   C5: Whether the agent-count "(N/5)" communicates a max cap
 *   C6: Whether the New Chat / New Klatch affordance pair communicates distinct types
 *
 * Scope guards (per Iris — don't log these as missing/absent):
 *   - "Other agents" tier is empty (all agents are named; that tier is latent by design)
 *   - No default-project / "First project" group (not built yet)
 *   - No Path B (JIT import) or Path C (new agent) options (not built yet)
 *   - No clone-from-klatch option (not built yet)
 *
 * Failure taxonomy: Correct, Reconstructed, Confabulated, Absent, Phantom, Subliminal.
 * Subliminal = data present in DOM but surface obscures the inference.
 * One Phantom is a hard fail. Subliminals route to Iris's design queue.
 *
 * Gated: makes real LLM calls. Skipped unless RUN_UI_AAXT=1 in env. CI never runs it.
 *
 * Run with:
 *   set -a; source .env; set +a; RUN_UI_AAXT=1 npx vitest run packages/client/src/__tests__/round41-composition-surface-aaxt.test.tsx
 *
 * Iris: docs/mail/iris-to-theseus-composition-surface-aaxt-2026-06-22.md
 * Spec: docs/ux/spec-composition-gesture.md
 * Iris's design-acceptance: docs/ux/composition-surface-design-acceptance-2026-06-22.md
 */

import { describe, it, expect } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Entity } from '@klatch/shared';
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
  | 'Subliminal'
  | 'Unscored';

interface Probe {
  id: string;
  state: string;
  claim: string;
  question: string;
  expectedAnswer: string;
  category: string;
  scopeNote?: string;
}

interface ScoredResult {
  probe: Probe;
  agentResponse: string;
  classification: Classification;
  confidence: number;
  reasoning: string;
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
    const disabled = (el as HTMLInputElement).disabled ? 'disabled' : null;
    const checked = el.getAttribute('type') === 'checkbox'
      ? ((el as HTMLInputElement).checked ? 'checked' : 'unchecked')
      : null;

    const annotations: string[] = [];
    if (role) annotations.push(`role=${role}`);
    if (ariaLabel) annotations.push(`aria-label="${ariaLabel}"`);
    if (placeholder) annotations.push(`placeholder="${placeholder}"`);
    if (title) annotations.push(`title="${title}"`);
    if (disabled) annotations.push(disabled);
    if (checked) annotations.push(checked);
    if (tag === 'button') annotations.push('clickable');
    if (tag === 'select') annotations.push('dropdown');
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
       'article', 'aside', 'form', 'select', 'option', 'label', 'input', 'textarea'].includes(tag);

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
  const userPrompt = `A user was shown a structured accessibility-tree snapshot of a UI form. They answered a question about what the UI communicates. Score their answer.

Question: ${question}
Expected answer (ground truth): ${expectedAnswer}
User's answer: ${agentResponse}

Classify as exactly one of:
- CORRECT: Response contains the expected information, possibly rephrased
- RECONSTRUCTED: Semantically right but surface form has drifted significantly
- CONFABULATED: Plausible but invented — user filled a gap with wrong information
- ABSENT: User correctly reports they cannot determine the answer from the visible UI
- PHANTOM: User confidently claims something false about what the UI shows
- SUBLIMINAL: User answers correctly but explicitly notes they couldn't tell clearly — data is technically present but the surface obscures the inference (the correct guess came from indirect cues, not clear labeling)

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
  const systemPrompt = `You are a user looking at a software interface for creating AI group conversations. Below is a structured accessibility-tree representation of a form — the visible text, labels, placeholders, and interactive elements. Based ONLY on what you can see in this representation, answer the question naturally. If you cannot tell from what is visible, say so honestly. Return valid JSON.`;

  const userPrompt = `Here is the accessible representation of what you can see on screen:

${domSnapshot}

Question: ${question}

Answer based only on what is visible. Return JSON: {"answer": "..."}`;

  const response = await queryAuxiliary(systemPrompt, userPrompt);
  const parsed = extractJson(response);
  return String(parsed.answer || '');
}

// ── Test fixtures ─────────────────────────────────────────────

const SAMPLE_PROJECT: Project = {
  id: 'proj-alpha',
  name: 'Alpha Project',
  instructions: 'Some project instructions.',
} as any;

const SAMPLE_ENTITIES: Entity[] = [
  {
    id: 'ent-daedalus',
    name: 'Daedalus',
    model: 'claude-opus-4-8',
    systemPrompt: 'You are Daedalus, an architect.',
    color: '#4f8ef7',
    handle: 'daedalus',
    effort: 'high',
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'ent-argus',
    name: 'Argus',
    model: 'claude-sonnet-4-6',
    systemPrompt: 'You are Argus, a quality agent.',
    color: '#e05c5c',
    handle: 'argus',
    effort: 'high',
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'ent-iris',
    name: 'Iris',
    model: 'claude-opus-4-8',
    systemPrompt: 'You are Iris, a UX designer.',
    color: '#9b59b6',
    handle: 'iris',
    effort: 'high',
    createdAt: '2026-01-01T00:00:00Z',
  },
];

// ── Probe definitions ─────────────────────────────────────────

interface CompositionProbe {
  id: string;
  claim: string;
  category: string;
  question: string;
  expectedAnswer: string;
  scopeNote?: string;
  requiresChips?: boolean;
}

const PROBES: CompositionProbe[] = [
  {
    id: 'C1a',
    claim: 'C1-affordance-pair',
    category: 'affordance-distinction',
    question: 'There are two buttons to start a new conversation. What is the difference between them?',
    expectedAnswer: 'One starts a single-agent chat ("New Chat") and the other starts a multi-agent group conversation ("New Klatch")',
    scopeNote: 'Probed on closed-form state where both buttons are visible',
  },
  {
    id: 'C2a',
    claim: 'C2-roles-tier',
    category: 'roles-tier',
    question: 'In the agent picker, there is a section labeled "ROLES". What does this label tell you about the agents listed under it?',
    expectedAnswer: 'These are named agents with persistent identities — the main selectable agents (as opposed to unnamed or one-off agents)',
  },
  {
    id: 'C3a',
    claim: 'C3-purpose-placeholder',
    category: 'purpose-scope',
    question: 'There is a text area with the placeholder "Purpose — what is this klatch for? (optional)". If you type something here, who or what does it apply to?',
    expectedAnswer: 'It applies to the entire klatch — shared context for all agents participating in this group conversation, not instructions for a single agent',
    scopeNote: 'Key Iris claim: Purpose = L4 shared context, not per-agent instructions',
  },
  {
    id: 'C3b',
    claim: 'C3-purpose-vs-instructions',
    category: 'purpose-scope',
    question: 'A single-agent chat also has a text field for custom instructions. In the klatch creation form, the similar field is labeled differently. What is the label, and does it suggest the text applies to one agent or to all agents?',
    expectedAnswer: 'The field is labeled "Purpose — what is this klatch for?" — the phrasing "this klatch" suggests it applies to the whole group conversation, not to a single agent',
    scopeNote: 'Comparing klatch Purpose vs chat instructions — does the label differentiate scope?',
  },
  {
    id: 'C4a',
    claim: 'C4-mode-what-changes',
    category: 'mode-selector',
    question: 'The form contains a dropdown with options like "Broadcast — All agents respond independently to your message" and "Roundtable — Agents respond in sequence, each seeing prior responses". What does changing this dropdown control?',
    expectedAnswer: 'It controls how agents receive and respond to your messages — whether they all respond independently, in sequence seeing each other\'s responses, or only when directly addressed',
  },
  {
    id: 'C4b',
    claim: 'C4-mode-broadcast-meaning',
    category: 'mode-selector',
    question: 'The "Broadcast" mode option says "All agents respond independently to your message." Does this mean agents see each other\'s responses?',
    expectedAnswer: 'No — in Broadcast mode, agents respond independently and do not see each other\'s responses',
  },
  {
    id: 'C5a',
    claim: 'C5-cap-counter',
    category: 'agent-cap',
    question: 'The Agents section shows a counter like "(2/5)". What does this tell you?',
    expectedAnswer: '2 agents have been selected, and the maximum number allowed is 5',
    requiresChips: true,
  },
  {
    id: 'C5b',
    claim: 'C5-cap-enforce',
    category: 'agent-cap',
    question: 'Is there a maximum number of agents you can add to a klatch? If so, what is it, and how can you tell from the visible form?',
    expectedAnswer: 'Yes, the maximum is 5 agents — shown by the "(N/5)" counter in the Agents section header',
    requiresChips: true,
  },
  {
    id: 'C6a',
    claim: 'C6-chips-meaning',
    category: 'chips',
    question: 'There are small colored pills or chips at the top of the Agents section, each showing a name and an "×" button. What do these represent?',
    expectedAnswer: 'The agents that have been selected to participate in this klatch — the × button removes them from the selection',
    requiresChips: true,
  },
  {
    id: 'C6b',
    claim: 'C6-chips-remove',
    category: 'chips',
    question: 'Each chip in the Agents section has an "×" next to a name. What happens if you click the "×"?',
    expectedAnswer: 'That agent is removed from the klatch\'s agent roster / deselected from the group',
    requiresChips: true,
  },
  {
    id: 'C7a',
    claim: 'C7-project-required',
    category: 'project-required',
    question: 'The klatch creation form has a "Select project (required)" dropdown. What does this tell you about whether a project is needed to create a klatch?',
    expectedAnswer: 'A project is required — a klatch cannot be created without selecting a project first',
  },
  {
    id: 'C8a',
    claim: 'C8-model-badge',
    category: 'model-badge',
    question: 'Each agent in the picker list shows a small badge to the right of their name (e.g., "Opus 4" or "Sonnet 4"). What does this badge communicate?',
    expectedAnswer: 'The AI model that agent uses / runs on',
  },
];

// ── Test execution ────────────────────────────────────────────

describeIfEnabled('Round 41 — UI-as-context AAXT (Composition Surface)', () => {
  it('semantic conveyance probe: klatch creation form + agent picker', async () => {
    if (!process.env.ANTHROPIC_API_KEY && !process.env.OPENAI_API_KEY) {
      throw new Error('No API key available — set ANTHROPIC_API_KEY or OPENAI_API_KEY');
    }

    const user = userEvent.setup();
    const allResults: ScoredResult[] = [];
    const startedAt = new Date().toISOString();

    // ── State A: form closed — two-affordance view ───────────

    {
      const { container, getByText } = render(
        <ChannelSidebar
          channels={[]}
          activeChannelId=""
          onSelectChannel={() => {}}
          onCreateChannel={() => {}}
          projects={[SAMPLE_PROJECT]}
          entities={SAMPLE_ENTITIES}
          theme="light"
          onToggleTheme={() => {}}
        />,
      );

      const snapshotClosed = snapshotDom(container);

      // Probes that work on the closed state (affordance pair)
      for (const probe of PROBES.filter((p) => !p.requiresChips && p.id === 'C1a')) {
        try {
          const agentResponse = await probeUser(snapshotClosed, probe.question);
          const score = await scoreResponse(probe.question, probe.expectedAnswer, agentResponse);
          allResults.push({ probe: { ...probe, state: 'S-closed', id: `S-closed.${probe.id}` }, agentResponse, ...score });
        } catch (err) {
          allResults.push({
            probe: { ...probe, state: 'S-closed', id: `S-closed.${probe.id}` },
            agentResponse: '',
            classification: 'Absent',
            confidence: 0,
            reasoning: `Error: ${err instanceof Error ? err.message : String(err)}`,
          });
        }
      }

      cleanup();
    }

    // ── State B: klatch form open, no agents selected ────────

    {
      const { container, getByText } = render(
        <ChannelSidebar
          channels={[]}
          activeChannelId=""
          onSelectChannel={() => {}}
          onCreateChannel={() => {}}
          projects={[SAMPLE_PROJECT]}
          entities={SAMPLE_ENTITIES}
          theme="light"
          onToggleTheme={() => {}}
        />,
      );

      // Open the klatch form
      await user.click(getByText('+ New Klatch'));

      const snapshotOpen = snapshotDom(container);

      // Run probes that don't require chips
      for (const probe of PROBES.filter((p) => !p.requiresChips && p.id !== 'C1a')) {
        try {
          const agentResponse = await probeUser(snapshotOpen, probe.question);
          const score = await scoreResponse(probe.question, probe.expectedAnswer, agentResponse);
          allResults.push({ probe: { ...probe, state: 'S-open', id: `S-open.${probe.id}` }, agentResponse, ...score });
        } catch (err) {
          allResults.push({
            probe: { ...probe, state: 'S-open', id: `S-open.${probe.id}` },
            agentResponse: '',
            classification: 'Absent',
            confidence: 0,
            reasoning: `Error: ${err instanceof Error ? err.message : String(err)}`,
          });
        }
      }

      cleanup();
    }

    // ── State C: form open, 2 agents selected (chips visible) ─

    {
      const { container, getByText, getAllByRole } = render(
        <ChannelSidebar
          channels={[]}
          activeChannelId=""
          onSelectChannel={() => {}}
          onCreateChannel={() => {}}
          projects={[SAMPLE_PROJECT]}
          entities={SAMPLE_ENTITIES}
          theme="light"
          onToggleTheme={() => {}}
        />,
      );

      // Open klatch form then select first two agents
      await user.click(getByText('+ New Klatch'));

      const checkboxes = getAllByRole('checkbox');
      if (checkboxes.length >= 2) {
        await user.click(checkboxes[0]);
        await user.click(checkboxes[1]);
      }

      const snapshotChips = snapshotDom(container);

      // Probes that require chips / the selected-agent state
      for (const probe of PROBES.filter((p) => p.requiresChips)) {
        try {
          const agentResponse = await probeUser(snapshotChips, probe.question);
          const score = await scoreResponse(probe.question, probe.expectedAnswer, agentResponse);
          allResults.push({ probe: { ...probe, state: 'S-chips', id: `S-chips.${probe.id}` }, agentResponse, ...score });
        } catch (err) {
          allResults.push({
            probe: { ...probe, state: 'S-chips', id: `S-chips.${probe.id}` },
            agentResponse: '',
            classification: 'Absent',
            confidence: 0,
            reasoning: `Error: ${err instanceof Error ? err.message : String(err)}`,
          });
        }
      }

      cleanup();
    }

    // ── Report ────────────────────────────────────────────────

    const finishedAt = new Date().toISOString();
    const provider = process.env.ANTHROPIC_API_KEY
      ? 'anthropic/claude-haiku-4-5'
      : 'openai/gpt-4o-mini';

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('Round 41 — UI-as-context AAXT (Composition Surface)');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`Started:   ${startedAt}`);
    console.log(`Finished:  ${finishedAt}`);
    console.log(`Auxiliary: ${provider}`);
    console.log(`Probes:    ${allResults.length}`);
    console.log();

    for (const r of allResults) {
      const flag =
        r.classification === 'Phantom' ? ' ← HARD FAIL' :
        r.classification === 'Subliminal' ? ' ← Iris queue' :
        r.classification === 'Confabulated' ? ' ← check' : '';
      console.log(`[${r.classification}] (${r.confidence.toFixed(2)}) ${r.probe.id} — ${r.probe.claim}${flag}`);
      console.log(`  Q: ${r.probe.question}`);
      console.log(`  Expected: ${r.probe.expectedAnswer}`);
      console.log(`  Got: ${r.agentResponse.slice(0, 300)}`);
      if (r.probe.scopeNote) console.log(`  Scope: ${r.probe.scopeNote}`);
      if (['Confabulated', 'Phantom', 'Subliminal'].includes(r.classification)) {
        console.log(`  ⚠ Reasoning: ${r.reasoning}`);
      }
      console.log();
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
    console.log(`Phantom:       ${summary.phantom}${summary.phantom > 0 ? '  ← HARD FAIL' : ''}`);
    console.log(`Subliminal:    ${summary.subliminal}${summary.subliminal > 0 ? '  ← UI obscures present data (Iris queue)' : ''}`);
    const conveyance = (
      (summary.correct + summary.reconstructed) / Math.max(1, summary.total) * 100
    ).toFixed(1);
    console.log(`Semantic conveyance rate (Correct+Reconstructed): ${conveyance}%`);
    console.log();

    // Per-category
    const categories = [...new Set(allResults.map((r) => r.probe.category))];
    console.log('Per-claim breakdown:');
    for (const cat of categories) {
      const cr = allResults.filter((r) => r.probe.category === cat);
      const c = cr.filter((r) => r.classification === 'Correct').length;
      const rc = cr.filter((r) => r.classification === 'Reconstructed').length;
      const cf = cr.filter((r) => r.classification === 'Confabulated').length;
      const a = cr.filter((r) => r.classification === 'Absent').length;
      const p = cr.filter((r) => r.classification === 'Phantom').length;
      const s = cr.filter((r) => r.classification === 'Subliminal').length;
      console.log(`  ${cat}: C:${c} R:${rc} F:${cf} A:${a} P:${p} S:${s} (${cr.length} probes)`);
    }

    // Hard assertion: no Phantoms
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
