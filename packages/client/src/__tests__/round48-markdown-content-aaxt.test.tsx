/**
 * Round 48 — UI-as-context AAXT: MarkdownContent Semantic Conveyance
 *
 * Target: packages/client/src/components/MarkdownContent.tsx
 *
 * MarkdownContent renders agent responses as HTML using react-markdown + remark-gfm
 * + react-syntax-highlighter. An agent observing rendered message content must
 * correctly read: headings, emphasis, code spans, code blocks (with language label +
 * Copy/Save actions), links (new tab), and lists.
 *
 * Key claims to probe:
 *   H2:           S-text — h2 heading is visible and identifiable
 *   BOLD1:        S-text — bold/strong text is visible
 *   EM1:          S-text — italic/em text is visible
 *   CODE-LANG:    S-code — language label (e.g., "python") appears in the code block header
 *   CODE-COPY:    S-code — "Copy" button is present in the code block
 *   CODE-SAVE:    S-code — Save button (with filename title) is present
 *   LINK-NEWTAB:  S-structured — link opens in new tab (detected via opens-in-new-tab annotation)
 *   LIST-ITEMS:   S-structured — bullet list items are visible
 *
 * Scope guards:
 *   - react-syntax-highlighter (Prism) has known JSDOM rendering issues (R43 note).
 *     SyntaxHighlighter is mocked to <pre data-language={lang}>{children}</pre>. The
 *     language header tab and Copy/Save buttons are rendered by MarkdownContent itself
 *     (not by SyntaxHighlighter), so the AAXT probes on those remain valid.
 *   - The mock is minimal: oneDark/oneLight styles are empty objects (not used).
 *   - Inline code (<code> without a language tag) is not mocked — it renders natively.
 *   - Tables and blockquotes deferred to a future round; scope here is text + code + links + lists.
 *
 * Gated: makes real LLM calls. Skipped unless RUN_UI_AAXT=1 in env.
 *
 * Run with:
 *   set -a; source .env; set +a; RUN_UI_AAXT=1 npx vitest run packages/client/src/__tests__/round48-markdown-content-aaxt.test.tsx
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { MarkdownContent } from '../components/MarkdownContent';

// ── Gate ─────────────────────────────────────────────────────

const ENABLED = process.env.RUN_UI_AAXT === '1';
const describeIfEnabled = ENABLED ? describe : describe.skip;

// ── Mocks ─────────────────────────────────────────────────────
// react-syntax-highlighter has known JSDOM rendering issues.
// Mock Prism to a minimal <pre> so the MarkdownContent wrapper
// (language header tab, Copy/Save buttons) still renders normally.

vi.mock('react-syntax-highlighter', () => ({
  Prism: ({ children, language }: { children: React.ReactNode; language?: string }) =>
    React.createElement('pre', { 'data-language': language }, children),
}));

vi.mock('react-syntax-highlighter/dist/esm/styles/prism', () => ({
  oneDark: {},
  oneLight: {},
}));

// ── Fixtures ──────────────────────────────────────────────────

const CONTENT_TEXT = `## Why Klatch Matters

This tool helps **teams** coordinate with *multiple AI agents* simultaneously.

Each agent brings a \`distinct perspective\` to the conversation.`;

const CONTENT_CODE = `Here is a Python function:

\`\`\`python
def greet(name: str) -> str:
    return f"Hello, {name}!"
\`\`\`

Call it with \`greet("World")\`.`;

const CONTENT_STRUCTURED = `Check out the [Klatch documentation](https://klatch.ing) for more info.

Key features:
- Multi-entity conversations
- Project context injection
- Session import from Claude Code`;

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
    if (tag === 'svg' || tag === 'path' || tag === 'rect') return;

    const role = el.getAttribute('role');
    const ariaLabel = el.getAttribute('aria-label');
    const placeholder = el.getAttribute('placeholder');
    const title = el.getAttribute('title');
    const href = el.getAttribute('href');
    const target = el.getAttribute('target');
    const type = el.getAttribute('type');
    const dataLanguage = el.getAttribute('data-language');
    const disabled = (el as HTMLInputElement).disabled ? 'disabled' : null;

    const annotations: string[] = [];
    if (role) annotations.push(`role=${role}`);
    if (ariaLabel) annotations.push(`aria-label="${ariaLabel}"`);
    if (placeholder) annotations.push(`placeholder="${placeholder}"`);
    if (title) annotations.push(`title="${title}"`);
    if (href) annotations.push(`href="${href}"`);
    if (target === '_blank') annotations.push('opens-in-new-tab');
    if (type && type !== 'text') annotations.push(`type=${type}`);
    if (dataLanguage) annotations.push(`data-language="${dataLanguage}"`);
    if (disabled) annotations.push(disabled);
    if (tag === 'button') annotations.push('clickable');
    if (tag === 'a') annotations.push('link');
    if (tag === 'strong') annotations.push('bold');
    if (tag === 'em') annotations.push('italic');
    if (tag === 'code') annotations.push('code');
    if (tag === 'pre') annotations.push('preformatted');

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
       'strong', 'em', 'code', 'pre', 'ul', 'ol', 'li', 'blockquote', 'p'].includes(tag);

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
  const userPrompt = `A user was shown a structured DOM snapshot of a rendered markdown message in a chat application. They answered a question about what is visible. Score their answer.

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
  const systemPrompt = `You are a user reading a rendered chat message in a messaging application. The message was composed in Markdown and has been rendered to HTML. Below is a structured DOM snapshot (accessibility tree) of the rendered message content. Based ONLY on what you can see in this snapshot, answer the question naturally. Return valid JSON.`;

  const userPrompt = `Here is the accessible DOM snapshot of the rendered message:

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
  state: 'S-text' | 'S-code' | 'S-structured';
  claim: string;
  category: string;
  question: string;
  expectedAnswer: string;
  scopeNote?: string;
  isSubliminalCandidate?: boolean;
}

const PROBES: Probe[] = [
  // S-text — heading, bold, italic, inline code
  {
    id: 'H2',
    claim: 'h2-heading-visible',
    category: 'text-structure',
    state: 'S-text',
    question:
      'Is there a section heading visible in the rendered message? If so, what is its text?',
    expectedAnswer:
      'Yes — a section heading reads "Why Klatch Matters".',
  },
  {
    id: 'BOLD1',
    claim: 'bold-text-visible',
    category: 'text-emphasis',
    state: 'S-text',
    question:
      'Is there any bold or strongly-emphasized text visible in the rendered message? If so, what word or phrase is bolded?',
    expectedAnswer:
      'Yes — the word "teams" appears in bold.',
  },
  {
    id: 'EM1',
    claim: 'italic-text-visible',
    category: 'text-emphasis',
    state: 'S-text',
    question:
      'Is there any italic or emphasized text visible in the rendered message? If so, what phrase is italicized?',
    expectedAnswer:
      'Yes — "multiple AI agents" appears in italics.',
  },

  // S-code — python code block with language header + Copy/Save buttons
  {
    id: 'CODE-LANG',
    claim: 'code-block-language-label',
    category: 'code-block-semantics',
    state: 'S-code',
    question:
      'Is there a code block in the rendered message? If so, what language label or header appears above or near the code?',
    expectedAnswer:
      'Yes — there is a code block with a "python" language label in its header.',
  },
  {
    id: 'CODE-COPY',
    claim: 'code-block-copy-button',
    category: 'code-block-actions',
    state: 'S-code',
    question:
      'Is there a "Copy" button associated with the code block?',
    expectedAnswer:
      'Yes — a "Copy" button is present in the code block area.',
  },
  {
    id: 'CODE-SAVE',
    claim: 'code-block-save-button',
    category: 'code-block-actions',
    state: 'S-code',
    question:
      'Is there a save or download button associated with the code block? What does its tooltip say?',
    expectedAnswer:
      'Yes — there is a save button. Its tooltip (title) includes a filename (e.g., "Save as snippet.py" or similar).',
    scopeNote: 'extractFilename detects a Python file; the exact name depends on code content — probe checks for save-button presence + filename title, not exact text.',
  },

  // S-structured — link + bullet list
  {
    id: 'LINK-NEWTAB',
    claim: 'external-link-opens-new-tab',
    category: 'link-semantics',
    state: 'S-structured',
    question:
      'Is there a hyperlink visible in the message? Does it appear to open in a new tab?',
    expectedAnswer:
      'Yes — there is a link labeled "Klatch documentation". It opens in a new tab.',
  },
  {
    id: 'LIST-ITEMS',
    claim: 'bullet-list-items-visible',
    category: 'list-structure',
    state: 'S-structured',
    question:
      'Is there a bullet list in the rendered message? How many items does it contain, and what are they?',
    expectedAnswer:
      'Yes — a bullet list with 3 items: "Multi-entity conversations", "Project context injection", and "Session import from Claude Code".',
  },
];

// ── Test execution ────────────────────────────────────────────

describeIfEnabled('Round 48 — UI-as-context AAXT (MarkdownContent)', () => {
  it(
    'semantic conveyance probe: headings, emphasis, code blocks (lang + actions), links, lists',
    async () => {
      if (!process.env.ANTHROPIC_API_KEY && !process.env.OPENAI_API_KEY) {
        throw new Error('No API key available — set ANTHROPIC_API_KEY or OPENAI_API_KEY');
      }

      const allResults: ScoredResult[] = [];
      const startedAt = new Date().toISOString();

      // ── State S-text: heading + bold + italic ──────────────────

      {
        const { container } = render(
          <MarkdownContent content={CONTENT_TEXT} theme="light" />,
        );

        const snapshot = snapshotDom(container);

        for (const probe of PROBES.filter((p) => p.state === 'S-text')) {
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

      // ── State S-code: python code block with actions ───────────

      {
        const { container } = render(
          <MarkdownContent content={CONTENT_CODE} theme="light" />,
        );

        const snapshot = snapshotDom(container);

        for (const probe of PROBES.filter((p) => p.state === 'S-code')) {
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

      // ── State S-structured: link + bullet list ─────────────────

      {
        const { container } = render(
          <MarkdownContent content={CONTENT_STRUCTURED} theme="light" />,
        );

        const snapshot = snapshotDom(container);

        for (const probe of PROBES.filter((p) => p.state === 'S-structured')) {
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

      console.log('\n══ Round 48 — MarkdownContent AAXT ════════════════════════════');
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

      const summary = { total, correct, reconstructed, confabulated, absent, phantom, subliminal, conveyancePct };
      expect(summary.phantom).toBe(0);
    },
    600_000,
  );
});
