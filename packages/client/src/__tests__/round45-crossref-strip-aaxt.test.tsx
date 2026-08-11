/**
 * Round 45 — UI-as-context AAXT: CrossRefStrip Semantic Conveyance
 *
 * Target: packages/client/src/components/CrossRefStrip.tsx
 *   + the show-condition in App.tsx (line 504):
 *     activeChannel?.type === 'chat' && channelEntities.length === 1 && activeChannel?.id !== 'default'
 *
 * The cross-reference strip appears beneath a 1-1 role chat's header and surfaces
 * the klatches its agent also participates in, as clickable links. The #general guard
 * (!== 'default') is the critical correctness claim Iris required before merge.
 *
 * Key claims to probe:
 *   GUARD1/2: S-empty — strip absent when no klatches (covers #general exclusion + empty entity)
 *   LABEL1: "Also in:" label present and legible
 *   LABEL2: "Also in:" is a label, not a link
 *   LINK1:  Klatch link shows correct channel name with # prefix
 *   NAV1:   Klatch link is clickable / navigable (button with title)
 *   MULTI1: Two klatches both listed by name
 *   MULTI2: Count of klatches is accurate
 *
 * Scope guards:
 *   - No API mocks needed: CrossRefStrip is a pure prop-driven component
 *   - The #general guard lives in App.tsx show-condition; tested here via the
 *     equivalent path (App sets klatches=[] for #general → component renders null)
 *   - S-click is not a meaningful AAXT state: onSelect is external and doesn't
 *     mutate the DOM; nav intent is captured via NAV1 (button title)
 *   - "First project" sidebar and default-project group: scoped to Round 46
 *
 * Gated: makes real LLM calls. Skipped unless RUN_UI_AAXT=1 in env.
 *
 * Run with:
 *   set -a; source .env; set +a; RUN_UI_AAXT=1 npx vitest run packages/client/src/__tests__/round45-crossref-strip-aaxt.test.tsx
 */

import { describe, it, expect, vi } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { CrossRefStrip } from '../components/CrossRefStrip';
import type { Channel } from '@klatch/shared';

// ── Gate ─────────────────────────────────────────────────────

const ENABLED = process.env.RUN_UI_AAXT === '1';
const describeIfEnabled = ENABLED ? describe : describe.skip;

// ── Fixtures ──────────────────────────────────────────────────

function makeKlatch(id: string, name: string): Channel {
  return {
    id,
    name,
    type: 'klatch',
    systemPrompt: '',
    model: 'claude-opus-4-6',
    mode: 'panel',
    source: 'native',
    createdAt: '2026-01-01T00:00:00Z',
  } as Channel;
}

const KLATCH_STANDUP = makeKlatch('k1', 'standup');
const KLATCH_RETRO = makeKlatch('k2', 'retro');

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
  const userPrompt = `A user was shown a structured accessibility-tree snapshot of a UI component in a chat application. They answered a question about what the UI communicates. Score their answer.

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
  const systemPrompt = `You are a user looking at a chat application header area. Below is a structured accessibility-tree representation of a UI strip that may appear beneath a channel header. Based ONLY on what you can see in this representation, answer the question naturally. If the area is empty or there is nothing visible, say so. Return valid JSON.`;

  const userPrompt = `Here is the accessible representation of what you can see in the header area:

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
  state: 'S-empty' | 'S-one' | 'S-two';
  claim: string;
  category: string;
  question: string;
  expectedAnswer: string;
  scopeNote?: string;
  isSubliminalCandidate?: boolean;
}

const PROBES: Probe[] = [
  // S-empty — klatches=[] → component renders null (covers #general guard + no-klatches case)
  {
    id: 'GUARD1',
    claim: 'general-guard-strip-absent',
    category: 'visibility-guard',
    state: 'S-empty',
    question:
      'You are looking at the area directly beneath a 1-1 role chat channel header in a workspace app. Is there any cross-reference strip or "Also in:" section visible here?',
    expectedAnswer:
      'No — the area is empty. There is no cross-reference strip or "Also in:" label visible.',
  },
  {
    id: 'GUARD2',
    claim: 'empty-entity-strip-absent',
    category: 'visibility-guard',
    state: 'S-empty',
    question:
      'In the area below the channel header, can you see any channel links or navigation elements?',
    expectedAnswer:
      'No — nothing is visible in this area. There are no channel links, buttons, or labels.',
  },

  // S-one — one klatch in the strip
  {
    id: 'LABEL1',
    claim: 'also-in-label-present',
    category: 'label-legibility',
    state: 'S-one',
    question:
      'In the cross-reference strip below the channel header, what text label appears before the channel link(s)?',
    expectedAnswer: 'The label "Also in:" appears before the channel links.',
  },
  {
    id: 'LABEL2',
    claim: 'also-in-label-not-clickable',
    category: 'label-legibility',
    state: 'S-one',
    question:
      'Is the "Also in:" text in the cross-reference strip a clickable link, or is it just a label?',
    expectedAnswer:
      '"Also in:" is a plain label (not a button or link) — only the channel name that follows it is clickable.',
  },
  {
    id: 'LINK1',
    claim: 'single-klatch-link-text',
    category: 'cross-ref-content',
    state: 'S-one',
    question:
      'What is the exact text of the channel link shown in the cross-reference strip below the header?',
    expectedAnswer: 'The link text is "#standup".',
  },
  {
    id: 'NAV1',
    claim: 'klatch-link-navigable',
    category: 'cross-ref-content',
    state: 'S-one',
    question:
      'Is the channel name in the cross-reference strip clickable? What happens or what tooltip appears when you interact with it?',
    expectedAnswer:
      'Yes — it is a clickable button. The tooltip (title attribute) reads "Open #standup".',
  },

  // S-two — two klatches in the strip
  {
    id: 'MULTI1',
    claim: 'two-klatches-count',
    category: 'cross-ref-content',
    state: 'S-two',
    question:
      'How many channel links are listed in the cross-reference strip below the header?',
    expectedAnswer: 'Two channel links are listed.',
  },
  {
    id: 'MULTI2',
    claim: 'two-klatches-names',
    category: 'cross-ref-content',
    state: 'S-two',
    question:
      'What are the names of all the channels listed in the cross-reference strip? List them.',
    expectedAnswer: 'The two channels are "#standup" and "#retro".',
  },
];

// ── Test execution ────────────────────────────────────────────

describeIfEnabled('Round 45 — UI-as-context AAXT (CrossRefStrip)', () => {
  it(
    'semantic conveyance probe: #general guard, "Also in:" label, klatch links, multi-klatch display',
    async () => {
      if (!process.env.ANTHROPIC_API_KEY && !process.env.OPENAI_API_KEY) {
        throw new Error('No API key available — set ANTHROPIC_API_KEY or OPENAI_API_KEY');
      }

      const allResults: ScoredResult[] = [];
      const startedAt = new Date().toISOString();

      // ── State S-empty: klatches=[] → null render ───────────

      {
        const { container } = render(
          <CrossRefStrip klatches={[]} onSelect={vi.fn()} />,
        );

        const snapshot = snapshotDom(container);

        for (const probe of PROBES.filter((p) => p.state === 'S-empty')) {
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

      // ── State S-one: single klatch ─────────────────────────

      {
        const { container } = render(
          <CrossRefStrip klatches={[KLATCH_STANDUP]} onSelect={vi.fn()} />,
        );

        const snapshot = snapshotDom(container);

        for (const probe of PROBES.filter((p) => p.state === 'S-one')) {
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

      // ── State S-two: two klatches ──────────────────────────

      {
        const { container } = render(
          <CrossRefStrip klatches={[KLATCH_STANDUP, KLATCH_RETRO]} onSelect={vi.fn()} />,
        );

        const snapshot = snapshotDom(container);

        for (const probe of PROBES.filter((p) => p.state === 'S-two')) {
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

      console.log('\n══ Round 45 — CrossRefStrip AAXT ═══════════════════════════════');
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
      // Liveness gate (Theseus, 2026-08-10) — see
      // docs/research/aaxt-liveness-gap-2026-08-10.md. An instrument failure
      // (bad key, network fault, judge outage) is recorded as `Absent`, which
      // the summary cannot distinguish from a surface that genuinely conveys
      // nothing, and the gate below is trivially satisfied by a run where every
      // call failed. Assert the calls landed before reading the numbers.
      const instrumentErrors = allResults
        .map((r) => r.reasoning ?? '')
        .filter((why) => /^(Error|Scoring error):/.test(why));
      expect(instrumentErrors).toEqual([]);

      expect(summary.phantom).toBe(0);
    },
    600_000,
  );
});
