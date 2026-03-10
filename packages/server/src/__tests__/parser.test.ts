import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Parser contract tests — parseEvents() and isHumanTurnBoundary()
import { parseEvents, isHumanTurnBoundary } from '../import/parser.js';
import type { RawEvent } from '../import/parser.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES = path.join(__dirname, 'fixtures');

/** Helper: read a JSONL fixture file and parse each valid line */
function readFixture(filename: string): unknown[] {
  const content = fs.readFileSync(path.join(FIXTURES, filename), 'utf-8');
  return content
    .split('\n')
    .filter((line) => line.trim().length > 0)
    .map((line) => {
      try {
        return JSON.parse(line);
      } catch {
        return null; // malformed lines
      }
    })
    .filter(Boolean);
}

// ── Event filtering ─────────────────────────────────────────────

describe('parseEvents — event filtering', () => {
  it('keeps user and assistant events', () => {
    const events = readFixture('simple-session.jsonl');
    const result = parseEvents(events);
    // Simple session has 2 user messages and 2 assistant responses
    expect(result.turns.length).toBe(2);
  });

  it('skips progress events', () => {
    // Build a minimal event set with a progress event injected
    const events = readFixture('simple-session.jsonl');
    const progressEvent = {
      parentUuid: 'evt-001',
      type: 'progress',
      data: { type: 'hook_progress', hookEvent: 'PostToolUse', hookName: 'PostToolUse:Read', command: 'callback' },
      parentToolUseID: 'toolu_001',
      toolUseID: 'toolu_001',
      timestamp: '2026-01-15T10:00:01.500Z',
      uuid: 'evt-progress',
    };
    events.push(progressEvent);
    const result = parseEvents(events);
    // Progress event should not create any additional turns
    expect(result.turns.length).toBe(2);
  });

  it('skips file-history-snapshot events', () => {
    const events = readFixture('simple-session.jsonl');
    const snapshotEvent = {
      type: 'file-history-snapshot',
      messageId: 'evt-001',
      snapshot: { messageId: 'evt-001', trackedFileBackups: {} },
      uuid: 'evt-snapshot',
      timestamp: '2026-01-15T10:00:01.500Z',
    };
    events.push(snapshotEvent);
    const result = parseEvents(events);
    expect(result.turns.length).toBe(2);
  });

  it('skips queue-operation events', () => {
    const events = readFixture('simple-session.jsonl');
    const queueEvent = {
      type: 'queue-operation',
      uuid: 'evt-queue',
      timestamp: '2026-01-15T10:00:01.500Z',
    };
    events.push(queueEvent);
    const result = parseEvents(events);
    expect(result.turns.length).toBe(2);
  });
});

// ── Subagent classification ─────────────────────────────────────

describe('parseEvents — subagent classification', () => {
  it('skips task subagent events (a{hex} pattern)', () => {
    const events = readFixture('subagent-session.jsonl');
    const result = parseEvents(events);
    // Main session has 1 user turn + 1 assistant response
    // Subagent events (isSidechain=true, agentId=a1b2c3d) should be skipped
    // The tool_result returning to the main session is kept
    expect(result.turns.length).toBe(1);
    // The final assistant text should be the main session response, not the subagent's
    const lastTurn = result.turns[0];
    expect(lastTurn.assistantText).toContain('3 TypeScript files');
  });

  it('skips prompt suggestion subagent events (aprompt_suggestion-*)', () => {
    const promptSuggestionEvents = [
      {
        parentUuid: 'parent-001',
        isSidechain: true,
        agentId: 'aprompt_suggestion-7aa05a',
        type: 'user',
        message: { role: 'user', content: '[SUGGESTION MODE: Suggest what the user might naturally type next]' },
        uuid: 'ps-001',
        sessionId: 'sess-001',
        timestamp: '2026-01-15T10:00:00.000Z',
      },
      {
        parentUuid: 'ps-001',
        isSidechain: true,
        agentId: 'aprompt_suggestion-7aa05a',
        type: 'assistant',
        message: { role: 'assistant', content: [{ type: 'text', text: 'run the tests' }] },
        uuid: 'ps-002',
        sessionId: 'sess-001',
        timestamp: '2026-01-15T10:00:01.000Z',
      },
    ];
    const result = parseEvents(promptSuggestionEvents);
    expect(result.turns.length).toBe(0);
  });

  it('extracts compaction summary from acompact-* subagents', () => {
    const events = readFixture('compaction-subagent.jsonl');
    const result = parseEvents(events);
    // Compaction events should not create conversation turns
    expect(result.turns.length).toBe(0);
    // But the summary should be extracted as metadata
    expect(result.compactionSummary).toBeTruthy();
    expect(result.compactionSummary).toContain('authentication');
  });
});

// ── Text extraction ─────────────────────────────────────────────

describe('parseEvents — text extraction', () => {
  it('extracts string content from user messages', () => {
    const events = readFixture('simple-session.jsonl');
    const result = parseEvents(events);
    expect(result.turns[0].userText).toBe('What is the capital of France?');
    expect(result.turns[1].userText).toBe('And what about Germany?');
  });

  it('extracts text blocks from assistant content arrays', () => {
    const events = readFixture('simple-session.jsonl');
    const result = parseEvents(events);
    expect(result.turns[0].assistantText).toBe('The capital of France is Paris.');
    expect(result.turns[1].assistantText).toBe('The capital of Germany is Berlin.');
  });

  it('concatenates multiple text blocks in assistant response', () => {
    const multiTextEvents = [
      {
        parentUuid: null,
        type: 'user',
        message: { role: 'user', content: 'Hello' },
        uuid: 'mt-001',
        sessionId: 'sess-mt',
        timestamp: '2026-01-15T10:00:00.000Z',
      },
      {
        parentUuid: 'mt-001',
        type: 'assistant',
        message: {
          role: 'assistant',
          content: [
            { type: 'text', text: 'First paragraph.' },
            { type: 'text', text: 'Second paragraph.' },
          ],
        },
        uuid: 'mt-002',
        sessionId: 'sess-mt',
        timestamp: '2026-01-15T10:00:01.000Z',
      },
    ];
    const result = parseEvents(multiTextEvents);
    expect(result.turns[0].assistantText).toContain('First paragraph.');
    expect(result.turns[0].assistantText).toContain('Second paragraph.');
  });
});

// ── Tool-use summarization ──────────────────────────────────────

describe('parseEvents — tool-use summarization', () => {
  it('summarizes tool_use blocks with tool name and key info', () => {
    const events = readFixture('tool-heavy-session.jsonl');
    const result = parseEvents(events);
    // Should have 1 turn (one user message that triggered tool chain)
    expect(result.turns.length).toBe(1);
    const turn = result.turns[0];
    // Artifacts should capture the tool usage
    expect(turn.artifacts).toBeDefined();
    expect(turn.artifacts!.length).toBeGreaterThanOrEqual(2);
    // Check tool summaries reference the right tools
    const toolNames = turn.artifacts!.map((a) => a.toolName);
    expect(toolNames).toContain('Read');
    expect(toolNames).toContain('Bash');
  });

  it('captures tool input summary (e.g., file path for Read, command for Bash)', () => {
    const events = readFixture('tool-heavy-session.jsonl');
    const result = parseEvents(events);
    const turn = result.turns[0];
    const readArtifact = turn.artifacts!.find((a) => a.toolName === 'Read');
    expect(readArtifact?.inputSummary).toContain('App.tsx');
    const bashArtifact = turn.artifacts!.find((a) => a.toolName === 'Bash');
    expect(bashArtifact?.inputSummary).toContain('npm test');
  });
});

// ── Turn grouping ───────────────────────────────────────────────

describe('parseEvents — turn grouping', () => {
  it('groups events into turns based on parentUuid=null user messages', () => {
    const events = readFixture('simple-session.jsonl');
    const result = parseEvents(events);
    // Two root user messages → two turns
    expect(result.turns.length).toBe(2);
  });

  it('preserves chronological order of turns', () => {
    const events = readFixture('simple-session.jsonl');
    const result = parseEvents(events);
    const t1 = new Date(result.turns[0].timestamp).getTime();
    const t2 = new Date(result.turns[1].timestamp).getTime();
    expect(t1).toBeLessThan(t2);
  });

  it('associates tool chains with the correct turn', () => {
    const events = readFixture('tool-heavy-session.jsonl');
    const result = parseEvents(events);
    // Single turn with tool chain
    expect(result.turns.length).toBe(1);
    expect(result.turns[0].userText).toBe('Read the App.tsx file and run the tests');
    expect(result.turns[0].assistantText).toContain('tests pass');
  });
});

// ── Session metadata ────────────────────────────────────────────

describe('parseEvents — session metadata', () => {
  it('extracts sessionId from events', () => {
    const events = readFixture('simple-session.jsonl');
    const result = parseEvents(events);
    expect(result.sessionId).toBe('sess-simple-001');
  });

  it('extracts slug when present', () => {
    const events = readFixture('simple-session.jsonl');
    const result = parseEvents(events);
    expect(result.slug).toBe('testing-simple-session');
  });

  it('handles missing slug gracefully (older versions)', () => {
    const noSlugEvents = [
      {
        parentUuid: null,
        type: 'user',
        message: { role: 'user', content: 'Hello' },
        uuid: 'ns-001',
        sessionId: 'sess-ns',
        version: '2.1.2',
        timestamp: '2026-01-09T10:00:00.000Z',
      },
      {
        parentUuid: 'ns-001',
        type: 'assistant',
        message: { role: 'assistant', content: [{ type: 'text', text: 'Hi!' }] },
        uuid: 'ns-002',
        sessionId: 'sess-ns',
        version: '2.1.2',
        timestamp: '2026-01-09T10:00:01.000Z',
      },
    ];
    const result = parseEvents(noSlugEvents);
    expect(result.slug).toBeUndefined();
    expect(result.turns.length).toBe(1);
  });

  it('extracts model from assistant messages', () => {
    const events = readFixture('simple-session.jsonl');
    const result = parseEvents(events);
    expect(result.model).toBe('claude-opus-4-6');
  });
});

// ── Edge cases ──────────────────────────────────────────────────

describe('parseEvents — edge cases', () => {
  it('handles empty event array', () => {
    const result = parseEvents([]);
    expect(result.turns.length).toBe(0);
    expect(result.sessionId).toBeUndefined();
  });

  it('handles single user message with no assistant response', () => {
    const singleEvent = [
      {
        parentUuid: null,
        type: 'user',
        message: { role: 'user', content: 'Hello?' },
        uuid: 'single-001',
        sessionId: 'sess-single',
        timestamp: '2026-01-15T10:00:00.000Z',
      },
    ];
    const result = parseEvents(singleEvent);
    expect(result.turns.length).toBe(1);
    expect(result.turns[0].userText).toBe('Hello?');
    expect(result.turns[0].assistantText).toBe('');
  });

  it('handles assistant with only tool_use blocks (no text)', () => {
    const toolOnlyEvents = [
      {
        parentUuid: null,
        type: 'user',
        message: { role: 'user', content: 'Read the file' },
        uuid: 'to-001',
        sessionId: 'sess-toolonly',
        timestamp: '2026-01-15T10:00:00.000Z',
      },
      {
        parentUuid: 'to-001',
        type: 'assistant',
        message: {
          role: 'assistant',
          content: [{ type: 'tool_use', id: 'toolu_001', name: 'Read', input: { file_path: '/tmp/test.txt' } }],
        },
        uuid: 'to-002',
        sessionId: 'sess-toolonly',
        timestamp: '2026-01-15T10:00:01.000Z',
      },
      {
        parentUuid: 'to-002',
        type: 'user',
        message: {
          role: 'user',
          content: [{ tool_use_id: 'toolu_001', type: 'tool_result', content: 'file contents here' }],
        },
        uuid: 'to-003',
        sessionId: 'sess-toolonly',
        timestamp: '2026-01-15T10:00:01.500Z',
      },
    ];
    const result = parseEvents(toolOnlyEvents);
    expect(result.turns.length).toBe(1);
    // No text block → assistantText should be empty string
    expect(result.turns[0].assistantText).toBe('');
    // But artifacts should still be captured
    expect(result.turns[0].artifacts).toBeDefined();
    expect(result.turns[0].artifacts!.length).toBe(1);
    expect(result.turns[0].artifacts![0].toolName).toBe('Read');
  });

  it('tolerates malformed JSONL lines (parser receives only valid parsed events)', () => {
    // Note: the JSONL file reading/parsing happens before parseEvents().
    // parseEvents() receives already-parsed event objects.
    // This test verifies the fixture helper (and by extension the parser's file reader)
    // can handle malformed lines.
    const events = readFixture('malformed.jsonl');
    // malformed.jsonl has 7 lines: 4 valid events + 1 broken JSON + 1 empty + 1 truncated
    expect(events.length).toBe(4);
    const result = parseEvents(events);
    // Should produce 2 turns from the 4 valid events
    expect(result.turns.length).toBe(2);
  });
});

// ── Injection detection (isHumanTurnBoundary) ─────────────────

describe('isHumanTurnBoundary — injection detection', () => {
  const baseEvent: RawEvent = {
    type: 'user',
    uuid: 'test-001',
    parentUuid: 'test-000',
    timestamp: '2026-03-10T10:00:00.000Z',
    message: { role: 'user', content: 'Hello from a real human' },
  };

  it('accepts a real human message (string content)', () => {
    expect(isHumanTurnBoundary(baseEvent)).toBe(true);
  });

  it('accepts a real human message (array content with text block)', () => {
    const event: RawEvent = {
      ...baseEvent,
      message: {
        role: 'user',
        content: [{ type: 'text', text: 'Hello from array' }],
      },
    };
    expect(isHumanTurnBoundary(event)).toBe(true);
  });

  it('rejects compaction summary (isCompactSummary=true)', () => {
    const event: RawEvent = {
      ...baseEvent,
      isCompactSummary: true,
      isVisibleInTranscriptOnly: true,
      message: {
        role: 'user',
        content: 'This session is being continued from a previous conversation that ran out of context.',
      },
    };
    expect(isHumanTurnBoundary(event)).toBe(false);
  });

  it('rejects hook feedback (isMeta=true)', () => {
    const event: RawEvent = {
      ...baseEvent,
      isMeta: true,
      message: {
        role: 'user',
        content: 'Stop hook feedback:\n[Verification Required] Code was edited while a preview server is running.',
      },
    };
    expect(isHumanTurnBoundary(event)).toBe(false);
  });

  it('rejects skill injection (isMeta=true, sourceToolUseID)', () => {
    const event: RawEvent = {
      ...baseEvent,
      isMeta: true,
      sourceToolUseID: 'toolu_016v8Cz3c1cvW46MD7CuUd8j',
      message: {
        role: 'user',
        content: [{ type: 'text', text: '# Release a new version of Klatch\n\nFollow the release runbook...' }],
      },
    };
    expect(isHumanTurnBoundary(event)).toBe(false);
  });

  it('rejects tool result (array of tool_result blocks, no text)', () => {
    const event: RawEvent = {
      ...baseEvent,
      sourceToolAssistantUUID: 'test-assistant-uuid',
      message: {
        role: 'user',
        content: [{ type: 'tool_result', tool_use_id: 'toolu_001', content: 'file contents' }],
      },
    };
    expect(isHumanTurnBoundary(event)).toBe(false);
  });

  it('rejects non-user events', () => {
    const event: RawEvent = { ...baseEvent, type: 'assistant' };
    expect(isHumanTurnBoundary(event)).toBe(false);
  });

  it('rejects empty content', () => {
    const event: RawEvent = {
      ...baseEvent,
      message: { role: 'user', content: '' },
    };
    expect(isHumanTurnBoundary(event)).toBe(false);
  });
});
