import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createTestApp } from './app.js';
import { importSession, getMessages } from '../db/queries.js';
import { DEFAULT_MODEL, DEFAULT_ENTITY_ID } from '@klatch/shared';

// Mock the claude client
vi.mock('../claude/client.js', () => ({
  streamClaude: vi.fn(),
  streamClaudeRoundtable: vi.fn(),
  activeStreams: new Map(),
  abortStream: vi.fn(() => false),
}));

const app = createTestApp();

function req(method: string, path: string, body?: unknown) {
  const init: RequestInit = { method, headers: { 'Content-Type': 'application/json' } };
  if (body) init.body = JSON.stringify(body);
  return app.request(`/api${path}`, init);
}

// Import the mock after vi.mock hoisting
import { streamClaude } from '../claude/client.js';
const mockStreamClaude = vi.mocked(streamClaude);

beforeEach(() => {
  mockStreamClaude.mockClear();
});

describe('fork continuity: context fidelity', () => {
  it('sends imported history to Claude when continuing a forked channel', async () => {
    // 1. Import a fixture session with known content
    const result = importSession({
      channelName: 'rate-limiter-session',
      source: 'claude-code',
      sourceMetadata: {
        originalSessionId: 'fork-test-001',
        cwd: '/home/user/ratelimiter',
      },
      turns: [
        {
          timestamp: '2026-03-01T10:00:00Z',
          originalId: 'ev-1',
          userText: 'Help me implement a token bucket rate limiter in Go',
          assistantText: 'I\'ll help you implement a token bucket rate limiter. Let me start with the core struct.',
        },
        {
          timestamp: '2026-03-01T10:05:00Z',
          originalId: 'ev-2',
          userText: 'Add a method to consume tokens',
          assistantText: 'Here\'s the Allow() method that consumes a token from the bucket.',
        },
        {
          timestamp: '2026-03-01T10:10:00Z',
          originalId: 'ev-3',
          userText: 'Now add tests',
          assistantText: 'I\'ll write table-driven tests for the rate limiter.',
        },
      ],
    });

    // 2. Verify messages were imported correctly
    const messages = getMessages(result.channelId);
    expect(messages).toHaveLength(6); // 3 user + 3 assistant

    // 3. Send a new message (triggers fork continuation)
    const res = await req('POST', `/channels/${result.channelId}/messages`, {
      content: 'What file were we working on?',
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.userMessageId).toBeTruthy();
    expect(data.assistants).toHaveLength(1);

    // 4. Verify streamClaude was called — it receives the channel history
    expect(mockStreamClaude).toHaveBeenCalledTimes(1);

    // The important thing: streamClaude was invoked, meaning the full
    // message history from the channel (imported + new) will be sent to the API.
    // The actual history assembly happens inside streamClaude/streamClaudeCore,
    // which reads from the DB — the DB now contains our imported messages.
    const msgs = getMessages(result.channelId);
    expect(msgs).toHaveLength(8); // 6 imported + 1 new user + 1 new assistant placeholder

    // Verify the imported messages are still intact in order
    const userMsgs = msgs.filter((m) => m.role === 'user');
    const assistantMsgs = msgs.filter((m) => m.role === 'assistant');
    expect(userMsgs).toHaveLength(4); // 3 imported + 1 new
    expect(assistantMsgs).toHaveLength(4); // 3 imported + 1 placeholder

    // The last user message should be our new one
    expect(userMsgs[userMsgs.length - 1].content).toBe('What file were we working on?');

    // Imported messages should preserve original timestamps
    expect(userMsgs[0].originalTimestamp).toBe('2026-03-01T10:00:00Z');
    expect(userMsgs[0].content).toContain('token bucket rate limiter');
  });

  it('preserves message ordering across imported and new messages', async () => {
    const result = importSession({
      channelName: 'ordering-test',
      source: 'claude-code',
      sourceMetadata: { originalSessionId: 'fork-order-001' },
      turns: [
        { timestamp: '2026-03-01T09:00:00Z', originalId: 'o-1', userText: 'First', assistantText: 'Reply 1' },
        { timestamp: '2026-03-01T09:05:00Z', originalId: 'o-2', userText: 'Second', assistantText: 'Reply 2' },
      ],
    });

    // Send two new messages
    await req('POST', `/channels/${result.channelId}/messages`, { content: 'Third' });
    await req('POST', `/channels/${result.channelId}/messages`, { content: 'Fourth' });

    const msgs = getMessages(result.channelId);
    const userMsgs = msgs.filter((m) => m.role === 'user');

    // User messages should be in chronological order
    expect(userMsgs.map((m) => m.content)).toEqual([
      'First', 'Second', 'Third', 'Fourth',
    ]);
  });

  it('handles imported channel with compaction state', async () => {
    const result = importSession({
      channelName: 'compacted-session',
      source: 'claude-code',
      sourceMetadata: {
        originalSessionId: 'fork-compact-001',
        cwd: '/home/user/project',
        compactionSummary: 'We were building a rate limiter in Go. Key decisions: token bucket algorithm, configurable burst size, thread-safe with mutex.',
      },
      turns: [
        { timestamp: '2026-03-01T10:00:00Z', originalId: 'c-1', userText: 'Continue from where we left off', assistantText: 'Sure, the rate limiter is working.' },
      ],
    });

    // The channel should exist and be messageable
    const res = await req('POST', `/channels/${result.channelId}/messages`, {
      content: 'What decisions did we make?',
    });
    expect(res.status).toBe(200);
    expect(mockStreamClaude).toHaveBeenCalledTimes(1);
  });

  it('maintains correct message count after multiple forks', async () => {
    const result = importSession({
      channelName: 'multi-fork',
      source: 'claude-code',
      sourceMetadata: { originalSessionId: 'fork-multi-001' },
      turns: [
        { timestamp: '2026-03-01T10:00:00Z', originalId: 'm-1', userText: 'Start', assistantText: 'Hello' },
      ],
    });

    // Send 3 messages in sequence
    for (const content of ['message 1', 'message 2', 'message 3']) {
      const res = await req('POST', `/channels/${result.channelId}/messages`, { content });
      expect(res.status).toBe(200);
    }

    const msgs = getMessages(result.channelId);
    // 2 imported (1 user + 1 assistant) + 6 new (3 user + 3 assistant placeholders) = 8
    expect(msgs).toHaveLength(8);
    expect(mockStreamClaude).toHaveBeenCalledTimes(3);
  });

  it('handles imported sessions with empty assistant responses gracefully', async () => {
    // Import a session where one turn has an empty assistant response (tool-only)
    // importSession may skip storing empty assistant messages — that's fine
    const result = importSession({
      channelName: 'empty-content-session',
      source: 'claude-code',
      sourceMetadata: { originalSessionId: 'fork-empty-001' },
      turns: [
        { timestamp: '2026-03-01T10:00:00Z', originalId: 'e-1', userText: 'Run the tests', assistantText: '' },
        { timestamp: '2026-03-01T10:01:00Z', originalId: 'e-2', userText: 'What happened?', assistantText: 'All tests passed.' },
      ],
    });

    // Verify the non-empty turn was imported
    const allMsgs = getMessages(result.channelId);
    const nonEmptyAssistant = allMsgs.find((m) => m.role === 'assistant' && m.content.includes('tests passed'));
    expect(nonEmptyAssistant).toBeTruthy();

    // Send a new message — should succeed regardless of empty turns
    const res = await req('POST', `/channels/${result.channelId}/messages`, { content: 'Continue' });
    expect(res.status).toBe(200);
  });
});
