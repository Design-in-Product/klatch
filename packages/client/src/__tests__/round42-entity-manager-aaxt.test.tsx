/**
 * Round 42 — UI-as-context AAXT: EntityManager Semantic Conveyance
 *
 * Target: the EntityManager panel — the "Agents" roster for creating and
 * editing reusable AI agent personas.
 *
 * The UI-as-context AAXT question: does a fresh agent dropped in front of the
 * EntityManager correctly attribute what each element does?
 *
 * Key claims to probe:
 *   C1: Panel identity — this manages reusable AI agents, not channels or messages
 *   C2: "in N conversations" count — agent is assigned to N channels
 *   C3: Default entity has no delete button — communication of protected status
 *   C4: Handle (@slug) field — for @-mention routing in Directed mode
 *   C5: Role prompt — agent's persona/system instructions
 *   C6: Effort model-restriction — disabled buttons with titles communicate constraint
 *   C7: Color swatches — avatar color selector
 *   C8: Delete confirmation — two-click deletion, first click isn't final
 *
 * Scope guards:
 *   - useModels hook will fall back to static AVAILABLE_MODELS (no server needed)
 *   - Handle field (C4) is expected to be Absent/Subliminal — no help text explains
 *     @-mention routing; this is a diagnostic probe, not a passing claim
 *   - Default entity protection (C3) may be Absent — no explicit label, only absence
 *
 * Gated: makes real LLM calls. Skipped unless RUN_UI_AAXT=1 in env.
 *
 * Run with:
 *   set -a; source .env; set +a; RUN_UI_AAXT=1 npx vitest run packages/client/src/__tests__/round42-entity-manager-aaxt.test.tsx
 */

import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, cleanup, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Entity } from '@klatch/shared';
import { EntityManager } from '../components/EntityManager';

// ── Gate ─────────────────────────────────────────────────────

const ENABLED = process.env.RUN_UI_AAXT === '1';
const describeIfEnabled = ENABLED ? describe : describe.skip;

// ── Mock useModels (avoids network fetch, returns static fallback) ──

// Includes DEFAULT_MODEL ('claude-opus-5', see @klatch/shared) so the create
// form's pre-selected model is always present in its own picker — omitting it
// silently disabled the effort-restriction probe (C6a) by leaving `discovered`
// undefined, which degrades to "nothing is restricted" (EntityManager.tsx's
// unknown-model fallback). Found live 2026-08-12 (docs/research/aaxt-r42-live-and-a-stale-probe-2026-08-12.md).
vi.mock('../hooks/useModels', () => ({
  useModels: () => ({
    models: [
      { id: 'claude-opus-5', displayName: 'Claude Opus 5', maxOutputTokens: 16384, capabilities: { thinking: true, effort: ['low', 'medium', 'high', 'xhigh', 'max'], compaction: false } },
      { id: 'claude-opus-4-7', displayName: 'Claude Opus 4.7', maxOutputTokens: 16384, capabilities: { thinking: true, effort: ['low', 'medium', 'high', 'xhigh'], compaction: false } },
      { id: 'claude-opus-4-6', displayName: 'Claude Opus', maxOutputTokens: 16384, capabilities: { thinking: true, effort: ['low', 'medium', 'high', 'max'], compaction: false } },
      { id: 'claude-sonnet-4-6', displayName: 'Claude Sonnet', maxOutputTokens: 16384, capabilities: { thinking: false, effort: ['low', 'medium', 'high'], compaction: false } },
      { id: 'claude-haiku-4-5-20251001', displayName: 'Claude Haiku', maxOutputTokens: 8192, capabilities: { thinking: false, effort: ['low', 'medium'], compaction: false } },
    ],
    loading: false,
    defaultModel: 'claude-opus-5',
    aliases: {},
    source: 'fallback',
  }),
  getModelLabel: (id: string) => {
    const labels: Record<string, string> = {
      'claude-opus-5': 'Opus 5',
      'claude-opus-4-7': 'Opus 4.7',
      'claude-opus-4-6': 'Opus',
      'claude-sonnet-4-6': 'Sonnet',
      'claude-haiku-4-5-20251001': 'Haiku',
    };
    return labels[id] ?? id;
  },
}));

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
  isSubliminalCandidate?: boolean;
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
  const userPrompt = `A user was shown a structured accessibility-tree snapshot of a UI panel. They answered a question about what the UI communicates. Score their answer.

Question: ${question}
Expected answer (ground truth): ${expectedAnswer}
User's answer: ${agentResponse}

Classify as exactly one of:
- CORRECT: Response contains the expected information, possibly rephrased
- RECONSTRUCTED: Semantically right but surface form has drifted significantly
- CONFABULATED: Plausible but invented — user filled a gap with wrong information
- ABSENT: User correctly reports they cannot determine the answer from the visible UI
- PHANTOM: User confidently claims something false about what the UI shows
- SUBLIMINAL: User answers correctly but notes they couldn't tell clearly — data is technically present but surface obscures the inference (correct guess from indirect cues, not clear labeling)

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
  const systemPrompt = `You are a user looking at a software interface for managing AI agents. Below is a structured accessibility-tree representation of a panel — the visible text, labels, placeholders, buttons, and interactive elements. Based ONLY on what you can see in this representation, answer the question naturally. If you cannot tell from what is visible, say so honestly. Return valid JSON.`;

  const userPrompt = `Here is the accessible representation of what you can see on screen:

${domSnapshot}

Question: ${question}

Answer based only on what is visible. Return JSON: {"answer": "..."}`;

  const response = await queryAuxiliary(systemPrompt, userPrompt);
  const parsed = extractJson(response);
  return String(parsed.answer || '');
}

// ── Test fixtures ─────────────────────────────────────────────

// DEFAULT_ENTITY_ID is 'default-entity' per @klatch/shared — use the literal
// to avoid the vi.mock hoisting issue (can't reference module imports in factory)
const SAMPLE_ENTITIES: Entity[] = [
  {
    id: 'default-entity',
    name: 'Assistant',
    model: 'claude-opus-4-7',
    systemPrompt: 'You are a helpful assistant.',
    color: '#4f8ef7',
    handle: undefined,
    effort: 'high',
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'ent-daedalus',
    name: 'Daedalus',
    model: 'claude-opus-4-7',
    systemPrompt: 'You are Daedalus, a senior software architect focused on clean design.',
    color: '#e05c5c',
    handle: 'daedalus',
    channelCount: 2,
  } as Entity & { channelCount: number },
  {
    id: 'ent-iris',
    name: 'Iris',
    model: 'claude-sonnet-4-6',
    systemPrompt: 'You are Iris, a UX designer who thinks deeply about user needs.',
    color: '#9b59b6',
    handle: 'iris',
    channelCount: 1,
  } as Entity & { channelCount: number },
];

// ── Probe definitions ─────────────────────────────────────────

interface EntityManagerProbe {
  id: string;
  claim: string;
  category: string;
  question: string;
  expectedAnswer: string;
  scopeNote?: string;
  requiresCreate?: boolean;
  requiresDeleteConfirm?: boolean;
  isSubliminalCandidate?: boolean;
}

const PROBES: EntityManagerProbe[] = [
  {
    id: 'C1a',
    claim: 'C1-panel-identity',
    category: 'panel-identity',
    question: 'What does this panel manage? What are the items listed here?',
    expectedAnswer: 'It manages AI agents — named personas with system prompts, handles, models, and colors that can be assigned to conversations',
  },
  {
    id: 'C2a',
    claim: 'C2-conversation-count',
    category: 'conversation-count',
    question: 'An agent named "Daedalus" shows "in 2 conversations" next to its name. What does this tell you?',
    expectedAnswer: 'This agent is currently assigned to / participating in 2 conversations (channels)',
  },
  {
    id: 'C3a',
    claim: 'C3-default-no-delete',
    category: 'default-protection',
    question: 'Looking at the agent cards: the "Daedalus" card has both an edit button (title="Edit agent") and a delete button. The "Assistant" card has only an edit button and no delete button. What might explain this difference?',
    expectedAnswer: 'The Assistant is a default or protected agent that cannot be deleted; non-default agents can be deleted',
    scopeNote: 'Likely Absent — no explicit label says "protected"; only the absence of a delete button signals this',
    isSubliminalCandidate: true,
  },
  {
    id: 'C4a',
    claim: 'C4-handle-field',
    category: 'handle-semantics',
    question: 'The form has a "Handle" field with an "@" prefix and placeholder "slug". What is this field used for?',
    expectedAnswer: 'It sets an @-mention alias for the agent — used to address the agent directly in Directed conversation mode',
    scopeNote: 'Expected Absent/Subliminal — the form shows the @ prefix and slug placeholder but does not explain @-mention routing',
    isSubliminalCandidate: true,
    requiresCreate: true,
  },
  {
    id: 'C5a',
    claim: 'C5-role-prompt',
    category: 'role-prompt',
    question: 'The form has a field labeled "Role prompt". What does this configure for the agent?',
    expectedAnswer: "The agent's persona, identity, and behavioral instructions — its system prompt that shapes how it responds",
    requiresCreate: true,
  },
  {
    id: 'C6a',
    claim: 'C6-effort-restricted',
    category: 'effort-restriction',
    // Question intentionally does not quote titles verbatim — the disabled
    // title is generic ("<level> effort is not available on this model",
    // EntityManager.tsx:296-298) since 38bcebf replaced the old hardcoded,
    // model-naming strings. A probe that quotes UI literals goes stale the
    // next time those literals change without failing anything; see
    // docs/research/aaxt-r42-live-and-a-stale-probe-2026-08-12.md.
    question: 'In the Effort section, the "xhigh" and "max" buttons appear disabled (greyed out) with a title explaining they are not available on the currently selected model. What does this communicate?',
    expectedAnswer: 'Certain effort levels are unavailable for the currently selected model — a different model would need to be selected to use them',
    requiresCreate: true,
  },
  {
    id: 'C7a',
    claim: 'C7-color-swatches',
    category: 'color-swatches',
    question: 'The form shows several colored circles in a "Color" section. What are these for?',
    expectedAnswer: "Choosing the agent's avatar or identity color — the colored circle shown next to the agent's name",
    requiresCreate: true,
  },
  {
    id: 'C8a',
    claim: 'C8-model-picker',
    category: 'model-picker',
    question: 'The form shows clickable buttons labeled "Opus 4.7", "Opus", "Sonnet", "Haiku". What does selecting one configure?',
    expectedAnswer: 'The AI model this agent uses to generate its responses',
    requiresCreate: true,
  },
  {
    id: 'C9a',
    claim: 'C9-delete-confirm',
    category: 'delete-confirmation',
    question: 'A delete button now shows the title "Click again to confirm". What does this mean and what should you do if you want to delete the agent?',
    expectedAnswer: 'The first click was a warning step; a second click is required to confirm and actually delete the agent',
    requiresDeleteConfirm: true,
  },
];

// ── Test execution ────────────────────────────────────────────

describeIfEnabled('Round 42 — UI-as-context AAXT (EntityManager)', () => {
  it('semantic conveyance probe: agent roster panel + create form + delete confirmation', async () => {
    if (!process.env.ANTHROPIC_API_KEY && !process.env.OPENAI_API_KEY) {
      throw new Error('No API key available — set ANTHROPIC_API_KEY or OPENAI_API_KEY');
    }

    const user = userEvent.setup();
    const allResults: ScoredResult[] = [];
    const startedAt = new Date().toISOString();

    // ── State A: Entity list (no form open) ──────────────────

    {
      const { container } = render(
        <EntityManager
          entities={SAMPLE_ENTITIES}
          onCreateEntity={() => {}}
          onUpdateEntity={() => {}}
          onDeleteEntity={() => {}}
          onClose={() => {}}
        />,
      );

      const snapshotList = snapshotDom(container);

      for (const probe of PROBES.filter((p) => !p.requiresCreate && !p.requiresDeleteConfirm)) {
        try {
          const agentResponse = await probeUser(snapshotList, probe.question);
          const score = await scoreResponse(probe.question, probe.expectedAnswer, agentResponse);
          allResults.push({
            probe: { ...probe, state: 'S-list', id: `S-list.${probe.id}` },
            agentResponse,
            ...score,
          });
        } catch (err) {
          allResults.push({
            probe: { ...probe, state: 'S-list', id: `S-list.${probe.id}` },
            agentResponse: '',
            classification: 'Absent',
            confidence: 0,
            reasoning: `Error: ${err instanceof Error ? err.message : String(err)}`,
          });
        }
      }

      cleanup();
    }

    // ── State B: Create form open ─────────────────────────────

    {
      const { container, getByText, getByRole } = render(
        <EntityManager
          entities={SAMPLE_ENTITIES}
          onCreateEntity={() => {}}
          onUpdateEntity={() => {}}
          onDeleteEntity={() => {}}
          onClose={() => {}}
        />,
      );

      await user.click(getByText('New agent'));

      // Select a model with a restricted effort ladder (Sonnet: low/medium/
      // high only) so the Effort section actually renders a disabled state
      // for C6a to probe. The default model (Opus 5) carries the full
      // ladder and disables nothing — probing against it would make C6a
      // Absent for a legitimate reason, not because the model dropped a
      // literal string. getByRole (not getByText) because SAMPLE_ENTITIES
      // already has a Sonnet-model agent, whose roster badge also reads
      // "Sonnet". See docs/research/aaxt-r42-live-and-a-stale-probe-2026-08-12.md.
      await user.click(getByRole('button', { name: 'Sonnet' }));

      const snapshotCreate = snapshotDom(container);

      for (const probe of PROBES.filter((p) => p.requiresCreate)) {
        try {
          const agentResponse = await probeUser(snapshotCreate, probe.question);
          const score = await scoreResponse(probe.question, probe.expectedAnswer, agentResponse);
          allResults.push({
            probe: { ...probe, state: 'S-create', id: `S-create.${probe.id}` },
            agentResponse,
            ...score,
          });
        } catch (err) {
          allResults.push({
            probe: { ...probe, state: 'S-create', id: `S-create.${probe.id}` },
            agentResponse: '',
            classification: 'Absent',
            confidence: 0,
            reasoning: `Error: ${err instanceof Error ? err.message : String(err)}`,
          });
        }
      }

      cleanup();
    }

    // ── State C: Delete confirmation ──────────────────────────

    {
      const { container, getAllByTitle } = render(
        <EntityManager
          entities={SAMPLE_ENTITIES}
          onCreateEntity={() => {}}
          onUpdateEntity={() => {}}
          onDeleteEntity={() => {}}
          onClose={() => {}}
        />,
      );

      // Click the first "Delete agent" button (Daedalus — non-default)
      const deleteButtons = getAllByTitle('Delete agent');
      if (deleteButtons.length > 0) {
        await user.click(deleteButtons[0]);
      }

      const snapshotConfirm = snapshotDom(container);

      for (const probe of PROBES.filter((p) => p.requiresDeleteConfirm)) {
        try {
          const agentResponse = await probeUser(snapshotConfirm, probe.question);
          const score = await scoreResponse(probe.question, probe.expectedAnswer, agentResponse);
          allResults.push({
            probe: { ...probe, state: 'S-confirm', id: `S-confirm.${probe.id}` },
            agentResponse,
            ...score,
          });
        } catch (err) {
          allResults.push({
            probe: { ...probe, state: 'S-confirm', id: `S-confirm.${probe.id}` },
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
    console.log('Round 42 — UI-as-context AAXT (EntityManager)');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`Started:   ${startedAt}`);
    console.log(`Finished:  ${finishedAt}`);
    console.log(`Auxiliary: ${provider}`);
    console.log(`Probes:    ${allResults.length}`);
    console.log();

    for (const r of allResults) {
      const flag =
        r.classification === 'Phantom' ? ' ← HARD FAIL' :
        r.classification === 'Subliminal' ? ' ← design queue' :
        r.classification === 'Absent' && r.probe.isSubliminalCandidate ? ' ← expected (diagnostic)' :
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

    // How many Absent were expected (subliminalCandidate probes)
    const expectedAbsent = allResults.filter(
      (r) => r.probe.isSubliminalCandidate && (r.classification === 'Absent' || r.classification === 'Subliminal')
    ).length;
    const unexpectedAbsent = summary.absent - expectedAbsent;

    console.log('═══════════════════════════════════════════════════════');
    console.log('Summary');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`Total:            ${summary.total}`);
    console.log(`Correct:          ${summary.correct}`);
    console.log(`Reconstructed:    ${summary.reconstructed}`);
    console.log(`Confabulated:     ${summary.confabulated}`);
    console.log(`Absent:           ${summary.absent} (${expectedAbsent} expected diagnostic, ${unexpectedAbsent} unexpected)`);
    console.log(`Phantom:          ${summary.phantom}${summary.phantom > 0 ? '  ← HARD FAIL' : ''}`);
    console.log(`Subliminal:       ${summary.subliminal}${summary.subliminal > 0 ? '  ← design queue' : ''}`);
    const conveyance = (
      (summary.correct + summary.reconstructed) / Math.max(1, summary.total) * 100
    ).toFixed(1);
    const adjustedConveyance = (
      (summary.correct + summary.reconstructed) /
      Math.max(1, summary.total - expectedAbsent) * 100
    ).toFixed(1);
    console.log(`Semantic conveyance (C+R / total):    ${conveyance}%`);
    console.log(`Adjusted conveyance (excl. expected-absent): ${adjustedConveyance}%`);
    console.log();

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
      console.log(`  ${cat}: C:${c} R:${rc} F:${cf} A:${a} P:${p} S:${s}`);
    }

    // Hard assertion: no Phantoms
    // Liveness gate (Theseus, 2026-08-10) — see
    // docs/research/aaxt-liveness-gap-2026-08-10.md. An instrument failure (bad
    // key, network fault, judge outage) is recorded as `Absent`, which the
    // summary cannot distinguish from a surface that genuinely conveys nothing,
    // and the gate below is trivially satisfied by a run where every call
    // failed — this round is where that was demonstrated: with an invalid key
    // it reported 9/9 Absent, 0.0% conveyance, and still passed green.
    const instrumentErrors = allResults
      .map((r) => r.reasoning ?? '')
      .filter((why) => /^(Error|Scoring error):/.test(why));
    expect(instrumentErrors).toEqual([]);

    expect(summary.phantom).toBe(0);
  }, 600_000);
});
