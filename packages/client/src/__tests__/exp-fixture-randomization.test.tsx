/**
 * EXPERIMENT — Finding A disposition: is cross-fixture "leakage" memorization,
 * a harness bug, or something else?
 *
 * Context: Argus's 2026-08-05 findings (`docs/research/aaxt-phantom-findings-2026-08-05.md`)
 * reported the R36 C7 probe answering with byte-identical content from a *different*
 * fixture state. He ruled out an in-process DOM leak by tracing `snapshotDom`/`cleanup()`
 * (I re-verified that trace — it holds) and proposed training-data memorization of this
 * repo's own fixtures as the most parsimonious remaining explanation, with a randomization
 * experiment as the cheap way to settle it.
 *
 * This is that experiment, plus the step that has to come first: capture the exact
 * snapshot bytes sent to the model. Without that, "the model ignored its input" and
 * "the input was wrong" are indistinguishable from the outside.
 *
 * Arms, per state, using R36's verbatim prompts and model (claude-haiku-4-5):
 *   A (control)    — original fixture names
 *   B (randomized) — every project/channel name replaced with an opaque random token
 *
 * If Phantom persists in B, memorization is ruled out.
 * If the captured snapshot doesn't support the ground truth, the probe is mis-specified
 * and neither explanation was needed.
 *
 * Gated behind RUN_UI_AAXT=1 like every other live-LLM round; costs real API calls.
 * Not part of any suite gate — this is an investigation, not coverage.
 *
 *   RUN_UI_AAXT=1 npx vitest run packages/client/src/__tests__/exp-fixture-randomization.test.tsx
 */

import { describe, it } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { writeFileSync, mkdirSync } from 'node:fs';
import type { Channel } from '@klatch/shared';
import { ChannelSidebar } from '../components/ChannelSidebar';
import type { Project } from '../api/client';

const ENABLED = process.env.RUN_UI_AAXT === '1';
const describeIfEnabled = ENABLED ? describe : describe.skip;
const OUT_DIR = process.env.EXP_OUT_DIR || '/tmp/aaxt-exp';

// ── Auxiliary LLM client — copied verbatim from round36 so the experiment
//    exercises the same path, not a reimplementation of it ──

async function queryAuxiliary(systemPrompt: string, userPrompt: string): Promise<string> {
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (!anthropicKey) throw new Error('No ANTHROPIC_API_KEY');
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

function extractJson(text: string): any {
  const trimmed = text.trim();
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) return JSON.parse(trimmed);
  const fenceMatch = trimmed.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
  if (fenceMatch) return JSON.parse(fenceMatch[1].trim());
  return JSON.parse(trimmed);
}

// snapshotDom — copied verbatim from round36
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

// probeUser + scoreResponse — verbatim prompts from round36
async function probeUser(domSnapshot: string, question: string): Promise<string> {
  const systemPrompt = `You are a user looking at a software application UI. Below is a structured representation of what is visible on screen — the accessible text and ARIA tree of a sidebar component, including button labels, titles, tooltips, and visible text content. Based ONLY on what you can see in this representation, answer the user's question naturally. If you cannot tell from what is visible, say so honestly. You must return valid JSON.`;
  const userPrompt = `Here is what you can see in the sidebar:

${domSnapshot}

Question: ${question}

Answer the question based on what is visible. Return JSON: {"answer": "..."}`;
  const response = await queryAuxiliary(systemPrompt, userPrompt);
  return String(extractJson(response).answer || '');
}

async function scoreResponse(question: string, expectedAnswer: string, agentResponse: string) {
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
  const response = await queryAuxiliary(systemPrompt, userPrompt);
  const parsed = extractJson(response);
  return {
    classification: String(parsed.classification || ''),
    confidence: Number(parsed.confidence) || 0,
    // full reasoning, NOT truncated — Argus could not recover this for Finding B
    reasoning: String(parsed.reasoning || ''),
  };
}

// ── Fixtures — mirror round36's STATES exactly ──

function chan(overrides: Partial<Channel> & { id: string; name: string }): Channel {
  return {
    // id/name come from `overrides` via the spread below — the param type
    // guarantees both are present.
    systemPrompt: '',
    source: 'native',
    sourceMetadata: null,
    projectId: null,
    projectName: null,
    entityCount: 0,
    messageCount: 0,
    mode: 'panel' as any,
    type: 'chat',
    createdAt: '2026-05-01T00:00:00Z',
    ...overrides,
  } as Channel;
}

interface ExpState { name: string; channels: Channel[]; projects: Project[] }

function originalStates(): ExpState[] {
  return [
    {
      name: 'S1-realistic',
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
      projects: [{ id: 'proj-x', name: 'ProjectX', instructions: '' }] as any,
      channels: [
        chan({ id: 'default', name: 'general' }),
        chan({ id: 'c1', name: 'chat-one', projectId: 'proj-x', projectName: 'ProjectX', entityCount: 1 }),
        chan({ id: 'c2', name: 'chat-two', projectId: 'proj-x', projectName: 'ProjectX', entityCount: 1 }),
      ],
    },
    {
      name: 'S3-klatches-only',
      projects: [{ id: 'proj-y', name: 'KlatchProject', instructions: '' }] as any,
      channels: [
        chan({ id: 'default', name: 'general' }),
        chan({ id: 'k1', name: 'morning-standup', type: 'klatch', projectId: 'proj-y', projectName: 'KlatchProject', entityCount: 3 }),
        chan({ id: 'k2', name: 'retro', type: 'klatch', projectId: 'proj-y', projectName: 'KlatchProject', entityCount: 4 }),
      ],
    },
  ];
}

/** Opaque, non-memorable tokens. Deterministic per index so runs are comparable. */
function tok(prefix: string, i: number): string {
  return `${prefix}-${['qx7', 'zr4', 'mv9', 'kd2', 'bt6', 'wn8', 'hf3', 'ls5'][i % 8]}${(i * 37) % 100}`;
}

/** Randomize every user-visible name; preserve structure exactly. */
function randomizeState(s: ExpState): ExpState {
  const projMap = new Map<string, string>();
  const projects = (s.projects as any[]).map((p, i) => {
    const newName = tok('P', i);
    projMap.set(p.name, newName);
    return { ...p, name: newName };
  });
  const channels = s.channels.map((c, i) => ({
    ...c,
    // leave #general alone: it's a fixed product string, not fixture content
    name: c.id === 'default' ? c.name : tok('C', i),
    projectName: c.projectName ? projMap.get(c.projectName) ?? c.projectName : c.projectName,
  }));
  return { name: `${s.name}-RANDOMIZED`, projects: projects as any, channels };
}

const C7_QUESTION = `Looking at the sidebar, which project's channels are currently visible/expanded? (If multiple, name them all. If none are expanded, say so.)`;

describeIfEnabled('EXPERIMENT — fixture randomization vs cross-fixture leakage', () => {
  it('captures snapshots and runs C7 under control + randomized arms', async () => {
    mkdirSync(OUT_DIR, { recursive: true });
    const report: string[] = [];

    const arms: Array<{ arm: string; states: ExpState[] }> = [
      { arm: 'A-control', states: originalStates() },
      { arm: 'B-randomized', states: originalStates().map(randomizeState) },
    ];

    for (const { arm, states } of arms) {
      for (const state of states) {
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
        writeFileSync(`${OUT_DIR}/snapshot-${arm}-${state.name}.txt`, snapshot);

        const first = (state.projects as any[])[0];
        const expectedAnswer = `The project named "${first.name}" is expanded; its channels are visible in the list`;
        const answer = await probeUser(snapshot, C7_QUESTION);
        const score = await scoreResponse(C7_QUESTION, expectedAnswer, answer);

        // Leakage check: does the answer name anything that is NOT in this snapshot?
        const namesInSnapshot = state.channels.map((c) => c.name).concat((state.projects as any[]).map((p) => p.name));
        const allFixtureNames = arms
          .flatMap((a) => a.states)
          .flatMap((s) => s.channels.map((c) => c.name).concat((s.projects as any[]).map((p) => p.name)));
        const foreign = [...new Set(allFixtureNames)].filter(
          (n) => n !== 'general' && !namesInSnapshot.includes(n) && answer.includes(n),
        );

        report.push(
          [
            `── ${arm} / ${state.name}`,
            `   snapshot chars: ${snapshot.length}  (file: snapshot-${arm}-${state.name}.txt)`,
            `   snapshot mentions project names: ${(state.projects as any[]).map((p) => `${p.name}=${snapshot.includes(p.name)}`).join(' ')}`,
            `   ground truth : ${expectedAnswer}`,
            `   answer       : ${answer}`,
            `   class        : ${score.classification} (${score.confidence})`,
            `   judge        : ${score.reasoning}`,
            `   FOREIGN NAMES IN ANSWER: ${foreign.length ? foreign.join(' | ') : '(none)'}`,
          ].join('\n'),
        );
        cleanup();
      }
    }

    const out = report.join('\n\n');
    writeFileSync(`${OUT_DIR}/report.txt`, out);
    console.log('\n════════ FIXTURE RANDOMIZATION EXPERIMENT ════════\n');
    console.log(out);
    console.log('\n══════════════════════════════════════════════════\n');
  }, 600_000);
});
