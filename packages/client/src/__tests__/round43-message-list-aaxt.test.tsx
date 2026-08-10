/**
 * Round 43 — UI-as-context AAXT: MessageList Semantic Conveyance
 *
 * Target: the MessageList component — the scrolling conversation thread that
 * renders user/assistant bubbles, entity attribution, model badges, artifacts
 * (tool use, file attachments, thinking), the fork marker, and action buttons.
 *
 * Key claims to probe:
 *   E1: Empty state — "Start a conversation / Send a message to begin"
 *   C2a: User bubble positioning (right side)
 *   C2b: Entity attribution — entity name in assistant message header
 *   C3a: Model badge — which model produced the response
 *   C6a: Tool use artifact — "agent used the Read tool on src/claude/client.ts"
 *   C8a: Retry button purpose — regenerates the assistant response
 *   F4a: Fork marker — boundary between imported and native messages
 *   P5a: Pin button on file — pins file to channel (Subliminal candidate: only a title attr)
 *   P5b: File card link — opens the file in a new tab
 *   D7a: Delete two-click — first click shows "Confirm?", second click deletes
 *   T9a: Thinking indicator — "Thought about this" communicates internal reasoning
 *
 * Scope guards:
 *   - MarkdownContent mocked to plain div to avoid react-markdown JSDOM issues
 *   - useModels mocked (no server needed)
 *   - Pin button (P5a) is a Subliminal candidate — intent is only in title attr, not label
 *
 * Gated: makes real LLM calls. Skipped unless RUN_UI_AAXT=1 in env.
 *
 * Run with:
 *   set -a; source .env; set +a; RUN_UI_AAXT=1 npx vitest run packages/client/src/__tests__/round43-message-list-aaxt.test.tsx
 */

import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, cleanup, act, getAllByTitle, getByText } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Message, Entity } from '@klatch/shared';
import { MessageList } from '../components/MessageList';

// ── Gate ─────────────────────────────────────────────────────

const ENABLED = process.env.RUN_UI_AAXT === '1';
const describeIfEnabled = ENABLED ? describe : describe.skip;

// ── Mocks ─────────────────────────────────────────────────────

// Mock MarkdownContent to avoid react-markdown / prism JSDOM issues
vi.mock('../components/MarkdownContent', () => ({
  MarkdownContent: ({ content }: { content: string }) => <div data-testid="markdown">{content}</div>,
}));

// Mock useModels (avoids network fetch)
vi.mock('../hooks/useModels', () => ({
  useModels: () => ({
    models: [
      { id: 'claude-opus-4-7', displayName: 'Claude Opus 4.7', maxOutputTokens: 16384, capabilities: { thinking: true, effort: ['low', 'medium', 'high', 'xhigh'], compaction: false } },
      { id: 'claude-opus-4-6', displayName: 'Claude Opus', maxOutputTokens: 16384, capabilities: { thinking: true, effort: ['low', 'medium', 'high', 'max'], compaction: false } },
      { id: 'claude-sonnet-4-6', displayName: 'Claude Sonnet', maxOutputTokens: 16384, capabilities: { thinking: false, effort: ['low', 'medium', 'high'], compaction: false } },
    ],
    loading: false,
    defaultModel: 'claude-opus-4-7',
    aliases: {},
    source: 'fallback',
  }),
  getModelLabel: (id: string) => {
    const labels: Record<string, string> = {
      'claude-opus-4-7': 'Opus 4.7',
      'claude-opus-4-6': 'Opus',
      'claude-sonnet-4-6': 'Sonnet',
    };
    return labels[id] ?? id;
  },
}));

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
    const disabled = (el as HTMLInputElement).disabled ? 'disabled' : null;

    const annotations: string[] = [];
    if (role) annotations.push(`role=${role}`);
    if (ariaLabel) annotations.push(`aria-label="${ariaLabel}"`);
    if (placeholder) annotations.push(`placeholder="${placeholder}"`);
    if (title) annotations.push(`title="${title}"`);
    if (href) annotations.push(`href="${href}"`);
    if (target === '_blank') annotations.push('opens-in-new-tab');
    if (disabled) annotations.push(disabled);
    if (tag === 'button') annotations.push('clickable');
    if (tag === 'a') annotations.push('link');

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
       'article', 'aside', 'form', 'a', 'label', 'span'].includes(tag);

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
  const userPrompt = `A user was shown a structured accessibility-tree snapshot of a conversation message list UI. They answered a question about what the UI communicates. Score their answer.

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
  const systemPrompt = `You are a user looking at a chat interface for AI conversations. Below is a structured accessibility-tree representation of the message list — the visible text, labels, buttons, links, and their attributes. Based ONLY on what you can see in this representation, answer the question naturally. If you cannot tell from what is visible, say so honestly. Return valid JSON.`;

  const userPrompt = `Here is the accessible representation of what you can see on screen:

${domSnapshot}

Question: ${question}

Answer based only on what is visible. Return JSON: {"answer": "..."}`;

  const response = await queryAuxiliary(systemPrompt, userPrompt);
  const parsed = extractJson(response);
  return String(parsed.answer || '');
}

// ── Fixtures ──────────────────────────────────────────────────

const ENTITIES: Entity[] = [
  {
    id: 'ent-daedalus',
    name: 'Daedalus',
    model: 'claude-opus-4-7',
    systemPrompt: 'You are Daedalus.',
    color: '#e05c5c',
    handle: 'daedalus',
  },
];

const CONVO_MESSAGES: Message[] = [
  {
    id: 'msg-user-1',
    channelId: 'ch-1',
    role: 'user',
    content: 'Can you explain how streaming works in this codebase?',
    status: 'complete',
    createdAt: '2026-06-23T10:00:00Z',
  },
  {
    id: 'msg-asst-1',
    channelId: 'ch-1',
    role: 'assistant',
    content: 'Streaming uses Server-Sent Events. When you send a message, a POST creates it, then an SSE connection streams the response.',
    status: 'complete',
    createdAt: '2026-06-23T10:00:05Z',
    entityId: 'ent-daedalus',
    model: 'claude-opus-4-7',
    artifacts: [
      {
        id: 'art-tool-1',
        messageId: 'msg-asst-1',
        type: 'tool_use',
        toolName: 'Read',
        inputSummary: 'src/claude/client.ts',
      },
      {
        id: 'art-think-1',
        messageId: 'msg-asst-1',
        type: 'thinking',
      },
    ],
  },
];

const FORK_MESSAGES: Message[] = [
  {
    id: 'msg-imported-1',
    channelId: 'ch-2',
    role: 'user',
    content: 'This was from an imported Claude Code session.',
    status: 'complete',
    createdAt: '2026-06-20T09:00:00Z',
    originalId: 'original-uuid-1',
  },
  {
    id: 'msg-imported-2',
    channelId: 'ch-2',
    role: 'assistant',
    content: 'I was also imported from the original session.',
    status: 'complete',
    createdAt: '2026-06-20T09:00:10Z',
    entityId: 'ent-daedalus',
    model: 'claude-opus-4-7',
    originalId: 'original-uuid-2',
  },
  {
    id: 'msg-native-1',
    channelId: 'ch-2',
    role: 'user',
    content: 'This is a new message I sent after importing the session into Klatch.',
    status: 'complete',
    createdAt: '2026-06-23T10:00:00Z',
    // No originalId — native Klatch message after the fork
  },
];

const FILE_MESSAGES: Message[] = [
  {
    id: 'msg-file-1',
    channelId: 'ch-3',
    role: 'assistant',
    content: 'I have attached the architecture document for your review.',
    status: 'complete',
    createdAt: '2026-06-23T10:00:00Z',
    entityId: 'ent-daedalus',
    model: 'claude-opus-4-7',
    artifacts: [
      {
        id: 'art-file-1',
        messageId: 'msg-file-1',
        type: 'file',
        fileName: 'architecture.md',
        fileSizeBytes: 12480,
        fileStorageKey: 'uploads/architecture-2026.md',
      },
    ],
  },
];

const DELETE_MESSAGES: Message[] = [
  {
    id: 'msg-user-del',
    channelId: 'ch-4',
    role: 'user',
    content: 'Please delete this message.',
    status: 'complete',
    createdAt: '2026-06-23T10:00:00Z',
  },
];

// ── Probe definitions ─────────────────────────────────────────

interface MessageListProbe {
  id: string;
  claim: string;
  category: string;
  question: string;
  expectedAnswer: string;
  state: 'S-empty' | 'S-convo' | 'S-fork' | 'S-file' | 'S-delete';
  scopeNote?: string;
  isSubliminalCandidate?: boolean;
}

const PROBES: MessageListProbe[] = [
  {
    id: 'E1',
    claim: 'empty-state-guidance',
    category: 'empty-state',
    state: 'S-empty',
    question: 'You see an empty message list with no messages. Is there any guidance or call to action visible?',
    expectedAnswer: 'Yes — "Start a conversation" and "Send a message to begin" prompts are shown',
  },
  {
    id: 'C2a',
    claim: 'user-bubble-alignment',
    category: 'message-attribution',
    state: 'S-convo',
    question: 'There are two messages in the thread. The first starts with "You" in the header. What does the header label "You" tell you about who sent this message?',
    expectedAnswer: 'It was sent by the user (you / the human), not an AI agent',
  },
  {
    id: 'C2b',
    claim: 'entity-attribution',
    category: 'message-attribution',
    state: 'S-convo',
    question: 'The second message (the assistant response) has a header with a name. What name appears in the assistant message header?',
    expectedAnswer: 'Daedalus — the name of the AI entity/agent that produced the response',
  },
  {
    id: 'C3a',
    claim: 'model-badge',
    category: 'model-attribution',
    state: 'S-convo',
    question: 'The assistant message header shows a small badge labeled "Opus 4.7" next to the agent name. What does this badge communicate?',
    expectedAnswer: 'The AI model that produced this response — in this case Claude Opus 4.7',
  },
  {
    id: 'C6a',
    claim: 'tool-use-artifact',
    category: 'artifact-recognition',
    state: 'S-convo',
    question: 'Below the assistant message content, there is a small indicator with "Read" and "src/claude/client.ts". What does this communicate?',
    expectedAnswer: 'The agent used the Read tool to access/read the file src/claude/client.ts while composing this response',
  },
  {
    id: 'T9a',
    claim: 'thinking-indicator',
    category: 'artifact-recognition',
    state: 'S-convo',
    question: 'The assistant message shows a small indicator reading "Thought about this". What does this communicate?',
    expectedAnswer: 'The AI engaged in internal reasoning or thinking before producing its response',
  },
  {
    id: 'C8a',
    claim: 'retry-button-purpose',
    category: 'action-buttons',
    state: 'S-convo',
    question: 'The assistant message shows a "Retry" button below its content. What does clicking "Retry" do?',
    expectedAnswer: 'It regenerates or retries the assistant\'s response — asks the AI to produce a new answer for the same user message',
  },
  {
    id: 'F4a',
    claim: 'fork-marker',
    category: 'import-continuity',
    state: 'S-fork',
    question: 'Between the second and third messages, there is a horizontal divider with text reading "Continued in Klatch — Jun 23, 2026". What does this divider indicate?',
    expectedAnswer: 'A boundary between imported conversation history (above) and new messages added natively in Klatch (below)',
  },
  {
    id: 'P5a',
    claim: 'pin-button-purpose',
    category: 'file-attachment',
    state: 'S-file',
    question: 'A file card for "architecture.md" includes a small icon with the title "Pin to channel". What does clicking this icon do?',
    expectedAnswer: 'Pins or saves the file to the current channel for easy reference — makes it accessible within this conversation',
    scopeNote: 'Subliminal candidate — intent is only in the title attribute (a tooltip), not a visible label',
    isSubliminalCandidate: true,
  },
  {
    id: 'P5b',
    claim: 'file-card-link',
    category: 'file-attachment',
    state: 'S-file',
    question: 'The file card for "architecture.md" shows the filename as a link with an ↗ arrow icon and opens-in-new-tab behavior. What happens when you click it?',
    expectedAnswer: 'The file opens in a new browser tab — you can view or download the attached file',
  },
  {
    id: 'D7a',
    claim: 'delete-two-click',
    category: 'delete-confirmation',
    state: 'S-delete',
    question: 'A message\'s delete button now shows the text "Confirm?" with the title "Click again to confirm". What does this state communicate, and how do you actually delete the message?',
    expectedAnswer: 'The first click was a warning/staging step; you need to click the button a second time to confirm and actually delete the message',
  },
];

// ── Test execution ────────────────────────────────────────────

describeIfEnabled('Round 43 — UI-as-context AAXT (MessageList)', () => {
  it('semantic conveyance probe: message thread, attribution, artifacts, fork marker, file cards, delete confirm', async () => {
    if (!process.env.ANTHROPIC_API_KEY && !process.env.OPENAI_API_KEY) {
      throw new Error('No API key available — set ANTHROPIC_API_KEY or OPENAI_API_KEY');
    }

    const user = userEvent.setup();
    const allResults: ScoredResult[] = [];
    const startedAt = new Date().toISOString();

    // ── State S-empty: no messages ────────────────────────────

    {
      const { container } = render(
        <MessageList
          messages={[]}
          getStreamContent={(_id: string) => ''}
          isMessageStreaming={(_id: string) => false}
          channelEntities={ENTITIES}
          theme="light"
        />,
      );

      const snapshot = snapshotDom(container);

      for (const probe of PROBES.filter((p) => p.state === 'S-empty')) {
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

    // ── State S-convo: user + assistant with entity, model, artifacts ──

    {
      const { container } = render(
        <MessageList
          messages={CONVO_MESSAGES}
          getStreamContent={(_id: string) => ''}
          isMessageStreaming={(_id: string) => false}
          channelEntities={ENTITIES}
          onDeleteMessage={() => {}}
          onRegenerateMessage={() => {}}
          theme="light"
        />,
      );

      const snapshot = snapshotDom(container);

      for (const probe of PROBES.filter((p) => p.state === 'S-convo')) {
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

    // ── State S-fork: imported + native messages with fork marker ──

    {
      const { container } = render(
        <MessageList
          messages={FORK_MESSAGES}
          getStreamContent={(_id: string) => ''}
          isMessageStreaming={(_id: string) => false}
          channelEntities={ENTITIES}
          channelSource="claude-code"
          theme="light"
        />,
      );

      const snapshot = snapshotDom(container);

      for (const probe of PROBES.filter((p) => p.state === 'S-fork')) {
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

    // ── State S-file: message with file artifact + pin button ──

    {
      const { container } = render(
        <MessageList
          messages={FILE_MESSAGES}
          getStreamContent={(_id: string) => ''}
          isMessageStreaming={(_id: string) => false}
          channelEntities={ENTITIES}
          onPinFile={() => {}}
          theme="light"
        />,
      );

      const snapshot = snapshotDom(container);

      for (const probe of PROBES.filter((p) => p.state === 'S-file')) {
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

    // ── State S-delete: click delete, snapshot confirm state ──

    {
      const { container } = render(
        <MessageList
          messages={DELETE_MESSAGES}
          getStreamContent={(_id: string) => ''}
          isMessageStreaming={(_id: string) => false}
          channelEntities={ENTITIES}
          onDeleteMessage={() => {}}
          theme="light"
        />,
      );

      // Click the delete button to enter confirm state
      const deleteButton = container.querySelector('[title="Delete message"]');
      if (deleteButton) {
        await act(async () => {
          await user.click(deleteButton as HTMLElement);
        });
      }

      const snapshot = snapshotDom(container);

      for (const probe of PROBES.filter((p) => p.state === 'S-delete')) {
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

    console.log('\n══ Round 43 — MessageList AAXT ══════════════════════════════');
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
      console.log(`    Response: ${r.agentResponse.slice(0, 120)}${r.agentResponse.length > 120 ? '…' : ''}`);
      console.log(`    Scoring: ${r.reasoning.slice(0, 120)}${r.reasoning.length > 120 ? '…' : ''}`);
      if (r.scopeNote) console.log(`    Scope: ${r.scopeNote}`);
      console.log('');
    }

    console.log('══ End Round 43 ══════════════════════════════════════════════');

    // Hard assertion: zero Phantoms
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
