import { describe, it, expect, vi, beforeEach } from 'vitest';
import './setup.js';
import { createTestApp } from './app.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { importSession, getMessages } from '../db/queries.js';
import { DEFAULT_MODEL } from '@klatch/shared';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES = path.join(__dirname, 'fixtures');

// Mock the claude client to avoid real API calls
vi.mock('../claude/client.js', () => ({
  streamClaude: vi.fn(),
  streamClaudeRoundtable: vi.fn(),
  activeStreams: new Map(),
  abortStream: vi.fn(() => false),
}));

function createApp() {
  return createTestApp();
}

function req(method: string, path: string, body?: unknown) {
  const init: RequestInit = { method, headers: { 'Content-Type': 'application/json' } };
  if (body) init.body = JSON.stringify(body);
  return init;
}

// ── Path validation hardening ────────────────────────────────────

describe('Import path validation', () => {
  let app: ReturnType<typeof createApp>;

  beforeEach(() => {
    app = createApp();
  });

  it('rejects paths with directory traversal (..)', async () => {
    const res = await app.request(
      '/api/import/claude-code',
      req('POST', '/api/import/claude-code', { sessionPath: '/tmp/../../etc/passwd.jsonl' })
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('Invalid');
  });

  it('rejects empty sessionPath', async () => {
    const res = await app.request(
      '/api/import/claude-code',
      req('POST', '/api/import/claude-code', { sessionPath: '' })
    );
    expect(res.status).toBe(400);
  });

  it('rejects directory traversal in claude-ai zipPath', async () => {
    const res = await app.request(
      '/api/import/claude-ai',
      req('POST', '/api/import/claude-ai', { zipPath: '/tmp/../../../etc/shadow.zip' })
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('Invalid');
  });
});

// ── Skip reporting ───────────────────────────────────────────────

describe('JSONL skip reporting', () => {
  let app: ReturnType<typeof createApp>;

  beforeEach(() => {
    app = createApp();
  });

  it('reports skippedLines count for malformed JSONL', async () => {
    const sessionPath = path.join(FIXTURES, 'malformed.jsonl');
    const res = await app.request(
      '/api/import/claude-code',
      req('POST', '/api/import/claude-code', { sessionPath })
    );
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.skippedLines).toBeGreaterThan(0);
  });

  it('omits skippedLines when no lines were skipped', async () => {
    const sessionPath = path.join(FIXTURES, 'simple-session.jsonl');
    const res = await app.request(
      '/api/import/claude-code',
      req('POST', '/api/import/claude-code', { sessionPath })
    );
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.skippedLines).toBeUndefined();
  });
});

// ── History cap (Increment 1 validation) ─────────────────────────

describe('Imported channel history cap (MAX_HISTORY_MESSAGES)', () => {
  it('imported channel with many messages can still accept new messages', async () => {
    const { streamClaude } = await import('../claude/client.js');
    vi.mocked(streamClaude).mockClear();

    // Create an imported channel with a large number of turns
    const turns = [];
    for (let i = 0; i < 120; i++) {
      turns.push({
        timestamp: `2026-03-01T${String(Math.floor(i / 60)).padStart(2, '0')}:${String(i % 60).padStart(2, '0')}:00Z`,
        originalId: `ev-${i}`,
        userText: `Question ${i}`,
        assistantText: `Answer ${i}`,
      });
    }

    const result = importSession({
      channelName: 'large-import',
      source: 'claude-code',
      sourceMetadata: { originalSessionId: 'test-large-001' },
      turns,
    });

    // Verify all messages are stored
    const allMsgs = getMessages(result.channelId);
    expect(allMsgs).toHaveLength(240); // 120 user + 120 assistant

    const app = createApp();
    // Send a new message — should work despite large history
    const res = await app.request(
      `/api/channels/${result.channelId}/messages`,
      req('POST', `/api/channels/${result.channelId}/messages`, { content: 'Continue' })
    );
    expect(res.status).toBe(200);
    expect(streamClaude).toHaveBeenCalledTimes(1);
  });
});

// ── Empty content filter (Increment 1 validation) ────────────────

describe('Empty content filter for imported history', () => {
  it('filters empty-content messages when building API history', async () => {
    const { streamClaude } = await import('../claude/client.js');
    vi.mocked(streamClaude).mockClear();

    // Import with a mix of normal and empty-content assistant messages
    const result = importSession({
      channelName: 'filter-test',
      source: 'claude-code',
      sourceMetadata: { originalSessionId: 'test-filter-001' },
      turns: [
        { timestamp: '2026-03-01T10:00:00Z', originalId: 'ev-1', userText: 'Hello', assistantText: 'Hi!' },
        { timestamp: '2026-03-01T10:01:00Z', originalId: 'ev-2', userText: 'Do stuff', assistantText: '',
          artifacts: [{ type: 'tool_use' as const, toolName: 'Bash', inputSummary: 'npm test' }] },
        { timestamp: '2026-03-01T10:02:00Z', originalId: 'ev-3', userText: 'Results?', assistantText: 'All passing.' },
      ],
    });

    // DB should have all 6 messages including the empty one
    const allMsgs = getMessages(result.channelId);
    expect(allMsgs).toHaveLength(6);
    const emptyMsg = allMsgs.find(m => m.role === 'assistant' && m.content === '');
    expect(emptyMsg).toBeTruthy();

    // Sending a new message should succeed (empty messages filtered from API history)
    const app = createApp();
    const res = await app.request(
      `/api/channels/${result.channelId}/messages`,
      req('POST', `/api/channels/${result.channelId}/messages`, { content: 'Continue' })
    );
    expect(res.status).toBe(200);
  });

  it('imported channel with only empty assistant messages still works', async () => {
    const { streamClaude } = await import('../claude/client.js');
    vi.mocked(streamClaude).mockClear();

    const result = importSession({
      channelName: 'all-empty-test',
      source: 'claude-code',
      sourceMetadata: { originalSessionId: 'test-allempty-001' },
      turns: [
        { timestamp: '2026-03-01T10:00:00Z', originalId: 'ev-1', userText: 'Hello', assistantText: '',
          artifacts: [{ type: 'tool_use' as const, toolName: 'Read', inputSummary: 'file.ts' }] },
      ],
    });

    const app = createApp();
    const res = await app.request(
      `/api/channels/${result.channelId}/messages`,
      req('POST', `/api/channels/${result.channelId}/messages`, { content: 'What did you find?' })
    );
    expect(res.status).toBe(200);
  });
});

// ── isMeta and isCompactSummary detection in parser ──────────────

describe('Parser injection detection', () => {
  it('isCompactSummary events are not counted as turns', async () => {
    const { parseEvents } = await import('../import/parser.js');

    const events = [
      {
        type: 'user', uuid: 'u1', parentUuid: null,
        timestamp: '2026-03-01T10:00:00Z',
        message: { role: 'user', content: 'Hello' },
        sessionId: 'sess-001',
      },
      {
        type: 'assistant', uuid: 'a1', parentUuid: 'u1',
        timestamp: '2026-03-01T10:00:01Z',
        message: { role: 'assistant', content: [{ type: 'text', text: 'Hi!' }] },
        sessionId: 'sess-001',
      },
      // Compaction summary injected as user message — should NOT be a turn boundary
      {
        type: 'user', uuid: 'u2', parentUuid: 'a1',
        timestamp: '2026-03-01T10:00:02Z',
        isCompactSummary: true,
        isVisibleInTranscriptOnly: true,
        message: {
          role: 'user',
          content: 'This session is being continued from a previous conversation that ran out of context. Here is a summary of our conversation so far...',
        },
        sessionId: 'sess-001',
      },
      {
        type: 'user', uuid: 'u3', parentUuid: 'u2',
        timestamp: '2026-03-01T10:00:03Z',
        message: { role: 'user', content: 'What were we discussing?' },
        sessionId: 'sess-001',
      },
      {
        type: 'assistant', uuid: 'a2', parentUuid: 'u3',
        timestamp: '2026-03-01T10:00:04Z',
        message: { role: 'assistant', content: [{ type: 'text', text: 'We were discussing imports.' }] },
        sessionId: 'sess-001',
      },
    ];

    const result = parseEvents(events);
    // Should have 2 turns: u1+a1 and u3+a2. The compaction summary (u2) is not a turn.
    expect(result.turns).toHaveLength(2);
    expect(result.turns[0].userText).toBe('Hello');
    expect(result.turns[1].userText).toBe('What were we discussing?');
  });

  it('isMeta events (hook feedback) are not counted as turns', async () => {
    const { parseEvents } = await import('../import/parser.js');

    const events = [
      {
        type: 'user', uuid: 'u1', parentUuid: null,
        timestamp: '2026-03-01T10:00:00Z',
        message: { role: 'user', content: 'Fix the bug' },
        sessionId: 'sess-002',
      },
      {
        type: 'assistant', uuid: 'a1', parentUuid: 'u1',
        timestamp: '2026-03-01T10:00:01Z',
        message: { role: 'assistant', content: [{ type: 'text', text: 'I\'ll fix it.' }] },
        sessionId: 'sess-002',
      },
      // Hook feedback injected as user message — should NOT be a turn boundary
      {
        type: 'user', uuid: 'u2', parentUuid: 'a1',
        timestamp: '2026-03-01T10:00:02Z',
        isMeta: true,
        message: {
          role: 'user',
          content: 'Stop hook feedback:\n[Verification Required] Code was edited while a preview server is running.',
        },
        sessionId: 'sess-002',
      },
      {
        type: 'assistant', uuid: 'a2', parentUuid: 'u2',
        timestamp: '2026-03-01T10:00:03Z',
        message: { role: 'assistant', content: [{ type: 'text', text: 'Let me verify the changes.' }] },
        sessionId: 'sess-002',
      },
    ];

    const result = parseEvents(events);
    // Should have 1 turn: u1 + a1 + a2. The hook feedback (u2) is not a turn boundary,
    // so a2 is grouped with the same turn.
    expect(result.turns).toHaveLength(1);
    expect(result.turns[0].userText).toBe('Fix the bug');
    // Both assistant responses should be concatenated
    expect(result.turns[0].assistantText).toContain('fix it');
    expect(result.turns[0].assistantText).toContain('verify');
  });
});
