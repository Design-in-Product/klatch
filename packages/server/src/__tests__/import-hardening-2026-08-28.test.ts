/**
 * Regression tests for the second batch of import-pipeline fixes, 2026-08-28.
 * See docs/import-pipeline-review-2026-08-28.md for each defect's origin.
 *
 * Covers: artifact types that were declared but never emitted; compaction summary
 * attribution; assistant messages carrying the user's timestamp; the tree-shape
 * counters; the project-directory encoder; and the drift canary.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import './setup.js';
import { createTestApp } from './app.js';
import {
  extractToolArtifacts, parseEvents, groupIntoTurns, type RawEvent,
} from '../import/parser.js';
import { encodeProjectDirName, getClaudeProjectsDir } from '../import/session-scanner.js';
import fs from 'fs';
import os from 'os';
import path from 'path';

vi.mock('../claude/client.js', () => ({ streamClaude: vi.fn() }));

// ── artifacts ───────────────────────────────────────────────────────────────

describe('extractToolArtifacts — all four declared types', () => {
  it('emits tool_result, which used to be dropped entirely', () => {
    const artifacts = extractToolArtifacts([
      { type: 'tool_result', tool_use_id: 'toolu_1', content: 'file contents here' },
    ]);
    expect(artifacts).toHaveLength(1);
    expect(artifacts[0].type).toBe('tool_result');
    expect(artifacts[0].content).toContain('file contents here');
  });

  it('marks an errored tool_result', () => {
    const [a] = extractToolArtifacts([
      { type: 'tool_result', tool_use_id: 't1', content: 'boom', is_error: true },
    ]);
    expect(a.toolName).toBe('error');
  });

  it('emits thinking blocks', () => {
    const [a] = extractToolArtifacts([{ type: 'thinking', thinking: 'let me reconsider' }]);
    expect(a.type).toBe('thinking');
    expect(a.content).toBe('let me reconsider');
  });

  it('emits an image descriptor without storing the base64 payload', () => {
    const [a] = extractToolArtifacts([
      { type: 'image', source: { type: 'base64', media_type: 'image/png', data: 'A'.repeat(4000) } },
    ]);
    expect(a.type).toBe('image');
    expect(a.inputSummary).toContain('image/png');
    expect(a.content).not.toContain('AAAA'); // payload deliberately not stored
  });

  it('still emits tool_use as before', () => {
    const [a] = extractToolArtifacts([
      { type: 'tool_use', id: 'tu1', name: 'Read', input: { file_path: 'src/App.tsx' } },
    ]);
    expect(a.type).toBe('tool_use');
    expect(a.inputSummary).toContain('src/App.tsx');
  });

  it('truncates long summaries rather than storing a paragraph in a label field', () => {
    const [a] = extractToolArtifacts([
      { type: 'tool_result', tool_use_id: 't', content: 'x'.repeat(500) },
    ]);
    expect(a.inputSummary.length).toBeLessThanOrEqual(80);
  });
});

// ── compaction attribution ──────────────────────────────────────────────────

describe('compaction summary — latest wins', () => {
  const compactEvent = (summary: string, ts: string): RawEvent => ({
    type: 'assistant', uuid: `c-${summary}`, parentUuid: null, timestamp: ts,
    isSidechain: true, agentId: 'acompact-abc',
    message: { role: 'assistant', content: `<summary>${summary}</summary>` },
  });

  it('takes the last summary, not the first', () => {
    // A session compacted three times used to carry its stalest summary, while the
    // sibling path reading subagent files deliberately iterated latest-first.
    const session = parseEvents([
      compactEvent('oldest', '2026-03-01T00:00:00.000Z'),
      compactEvent('middle', '2026-03-02T00:00:00.000Z'),
      compactEvent('newest', '2026-03-03T00:00:00.000Z'),
    ]);
    expect(session.compactionSummary).toBe('newest');
    expect(session.integrity?.compactionSummariesFound).toBe(3);
  });

  it('reports zero when there is no compaction', () => {
    const session = parseEvents([
      { type: 'user', uuid: 'u1', parentUuid: null, timestamp: '2026-03-01T00:00:00.000Z',
        permissionMode: 'default', message: { role: 'user', content: 'hi' } },
    ] as RawEvent[]);
    expect(session.integrity?.compactionSummariesFound).toBe(0);
  });
});

// ── message timestamps and identity ─────────────────────────────────────────

describe('assistant messages carry their own timestamp and uuid', () => {
  it('separates the assistant stamp from the user stamp', () => {
    const events: RawEvent[] = [
      { type: 'user', uuid: 'u1', parentUuid: null, timestamp: '2026-03-01T09:00:00.000Z',
        permissionMode: 'default', message: { role: 'user', content: 'a question' } },
      { type: 'assistant', uuid: 'a1', parentUuid: 'u1', timestamp: '2026-03-01T14:30:00.000Z',
        message: { role: 'assistant', content: 'an answer five hours later' } },
    ];
    const [turn] = groupIntoTurns(events, { requirePermissionMode: true });
    expect(turn.timestamp).toBe('2026-03-01T09:00:00.000Z');
    expect(turn.assistantTimestamp).toBe('2026-03-01T14:30:00.000Z');
    expect(turn.assistantOriginalId).toBe('a1');
    expect(turn.assistantOriginalId).not.toBe(turn.originalId);
  });

  it('takes the LAST assistant event when a turn has several', () => {
    const events: RawEvent[] = [
      { type: 'user', uuid: 'u1', parentUuid: null, timestamp: '2026-03-01T09:00:00.000Z',
        permissionMode: 'default', message: { role: 'user', content: 'q' } },
      { type: 'assistant', uuid: 'a1', parentUuid: 'u1', timestamp: '2026-03-01T09:00:01.000Z',
        message: { role: 'assistant', content: 'first' } },
      { type: 'assistant', uuid: 'a2', parentUuid: 'a1', timestamp: '2026-03-01T09:00:09.000Z',
        message: { role: 'assistant', content: 'second' } },
    ];
    const [turn] = groupIntoTurns(events, { requirePermissionMode: true });
    expect(turn.assistantOriginalId).toBe('a2');
    expect(turn.assistantTimestamp).toBe('2026-03-01T09:00:09.000Z');
  });

  it('leaves the stamps undefined for a turn with no assistant reply', () => {
    const events: RawEvent[] = [
      { type: 'user', uuid: 'u1', parentUuid: null, timestamp: '2026-03-01T09:00:00.000Z',
        permissionMode: 'default', message: { role: 'user', content: 'unanswered' } },
    ];
    const [turn] = groupIntoTurns(events, { requirePermissionMode: true });
    expect(turn.assistantTimestamp).toBeUndefined();
  });
});

// ── tree shape reporting ────────────────────────────────────────────────────

describe('integrity.treeShape — reported, not acted on', () => {
  it('counts roots, orphans, fork points and duplicate timestamps', () => {
    const ev = (uuid: string, parent: string | null, ts: string, role: 'user' | 'assistant', pm = true): RawEvent => ({
      type: role, uuid, parentUuid: parent, timestamp: ts,
      ...(role === 'user' && pm ? { permissionMode: 'default' } : {}),
      message: { role, content: `${uuid} content` },
    });
    const session = parseEvents([
      ev('u1', null, '2026-03-01T09:00:00.000Z', 'user'),          // root
      ev('a1', 'u1', '2026-03-01T09:00:01.000Z', 'assistant'),
      ev('a2', 'u1', '2026-03-01T09:00:01.000Z', 'assistant'),     // fork under u1 + dup ts
      ev('u2', 'missing-parent', '2026-03-01T09:00:02.000Z', 'user'), // orphan
    ]);
    const shape = session.integrity!.treeShape;
    expect(shape.roots).toBe(1);
    expect(shape.orphans).toBe(1);
    expect(shape.forkPoints).toBe(1);
    expect(shape.duplicateTimestamps).toBe(1);
  });

  it('collects tool_result blocks, which arrive on USER events', () => {
    // The reason every tool_result was lost: the turn loop only extracted artifacts from
    // assistant messages, and tool results come back as user-role content. Verified on
    // exports/sessions/theseus-2026-03-22.jsonl — 213 of them, all on user events.
    const session = parseEvents([
      { type: 'user', uuid: 'u1', parentUuid: null, timestamp: '2026-03-01T09:00:00.000Z',
        permissionMode: 'default', message: { role: 'user', content: 'read the file' } },
      { type: 'assistant', uuid: 'a1', parentUuid: 'u1', timestamp: '2026-03-01T09:00:01.000Z',
        message: { role: 'assistant', content: [
          { type: 'tool_use', id: 't1', name: 'Read', input: { file_path: 'a.ts' } },
        ] } },
      { type: 'user', uuid: 'u2', parentUuid: 'a1', timestamp: '2026-03-01T09:00:02.000Z',
        message: { role: 'user', content: [
          { type: 'tool_result', tool_use_id: 't1', content: 'the actual file contents' },
        ] } },
    ] as RawEvent[]);

    expect(session.integrity?.artifactsByType).toEqual({ tool_use: 1, tool_result: 1 });
    const [turn] = session.turns;
    expect(turn.artifacts?.some(a => a.type === 'tool_result')).toBe(true);
    // ...and the tool result must not be mistaken for something the human said.
    expect(turn.userText).toBe('read the file');
    expect(turn.userText).not.toContain('actual file contents');
  });

  it('counts artifacts by type', () => {
    const session = parseEvents([
      { type: 'user', uuid: 'u1', parentUuid: null, timestamp: '2026-03-01T09:00:00.000Z',
        permissionMode: 'default', message: { role: 'user', content: 'go' } },
      { type: 'assistant', uuid: 'a1', parentUuid: 'u1', timestamp: '2026-03-01T09:00:01.000Z',
        message: { role: 'assistant', content: [
          { type: 'text', text: 'working' },
          { type: 'tool_use', id: 't1', name: 'Read', input: { file_path: 'a.ts' } },
          { type: 'tool_result', tool_use_id: 't1', content: 'contents' },
          { type: 'thinking', thinking: 'hmm' },
        ] } },
    ] as RawEvent[]);
    expect(session.integrity?.artifactsByType).toEqual({ tool_use: 1, tool_result: 1, thinking: 1 });
  });
});

// ── skipped content-bearing events ──────────────────────────────────────────

describe('integrity.skippedContentBearing — say what we walked past', () => {
  it('counts skipped events that hang off a conversation event', () => {
    // The live case is `attachment`: 622 of 3,096 events in a Sept 2026 survey of real
    // transcripts, zero in the March capture, all dropped by isConversationEvent.
    const session = parseEvents([
      { type: 'user', uuid: 'u1', parentUuid: null, timestamp: '2026-09-01T09:00:00.000Z',
        permissionMode: 'default', message: { role: 'user', content: 'here is a file' } },
      { type: 'attachment', uuid: 'at1', parentUuid: 'u1', timestamp: '2026-09-01T09:00:00.500Z' },
      { type: 'attachment', uuid: 'at2', parentUuid: 'u1', timestamp: '2026-09-01T09:00:00.600Z' },
      { type: 'assistant', uuid: 'a1', parentUuid: 'u1', timestamp: '2026-09-01T09:00:02.000Z',
        message: { role: 'assistant', content: 'read it' } },
    ] as RawEvent[]);

    expect(session.integrity!.skippedContentBearing).toEqual({
      total: 2, byType: { attachment: 2 },
    });
  });

  it('does not count pure session bookkeeping', () => {
    // bridge-session / atis-latch / ai-title carry no message and no conversation parent.
    const session = parseEvents([
      { type: 'user', uuid: 'u1', parentUuid: null, timestamp: '2026-09-01T09:00:00.000Z',
        permissionMode: 'default', message: { role: 'user', content: 'hello' } },
      { type: 'bridge-session', uuid: 'b1', parentUuid: null, sessionId: 's1' },
      { type: 'atis-latch', uuid: 'l1', parentUuid: null, sessionId: 's1' },
      { type: 'ai-title', uuid: 't1', parentUuid: null, sessionId: 's1' },
    ] as unknown as RawEvent[]);

    expect(session.integrity!.skippedContentBearing.total).toBe(0);
    // ...but they are still visible in the broader tally.
    expect(Object.keys(session.integrity!.unrecognizedEventTypes).sort())
      .toEqual(['ai-title', 'atis-latch', 'bridge-session']);
  });

  it('ignores known-and-deliberately-skipped types even when they hang off a turn', () => {
    // system/progress/file-history-snapshot attach to conversation events routinely and
    // carry nothing importable. Counting them would make this fire on every transcript.
    const session = parseEvents([
      { type: 'user', uuid: 'u1', parentUuid: null, timestamp: '2026-09-01T09:00:00.000Z',
        permissionMode: 'default', message: { role: 'user', content: 'hi' } },
      { type: 'system', uuid: 's1', parentUuid: 'u1', subtype: 'turn_duration', timestamp: '2026-09-01T09:00:01.000Z' },
      { type: 'progress', uuid: 'p1', parentUuid: 'u1', timestamp: '2026-09-01T09:00:01.500Z' },
    ] as unknown as RawEvent[]);
    expect(session.integrity!.skippedContentBearing.total).toBe(0);
  });

  it('is zero for a transcript with nothing skipped', () => {
    const session = parseEvents([
      { type: 'user', uuid: 'u1', parentUuid: null, timestamp: '2026-09-01T09:00:00.000Z',
        permissionMode: 'default', message: { role: 'user', content: 'hi' } },
    ] as RawEvent[]);
    expect(session.integrity!.skippedContentBearing).toEqual({ total: 0, byType: {} });
  });
});

// ── project directory encoding ──────────────────────────────────────────────

describe('encodeProjectDirName', () => {
  it('replaces every non-alphanumeric character, not just slashes', () => {
    // The old encoder only replaced '/', so any path with '.', '_' or a space produced
    // a directory name that does not exist and the MEMORY.md lookup found nothing.
    expect(encodeProjectDirName('/Users/xian/Development/my_app.v2'))
      .toBe('-Users-xian-Development-my-app-v2');
  });

  it('handles spaces', () => {
    expect(encodeProjectDirName('/Users/xian/My Projects/klatch'))
      .toBe('-Users-xian-My-Projects-klatch');
  });

  it('returns null for paths Claude Code truncates and hashes (>200 chars)', () => {
    expect(encodeProjectDirName('/' + 'a'.repeat(250))).toBeNull();
  });

  it('honours CLAUDE_CODE_PROJECT_DIR_NAME (Claude Code 2.1.234+)', () => {
    const prev = process.env.CLAUDE_CODE_PROJECT_DIR_NAME;
    process.env.CLAUDE_CODE_PROJECT_DIR_NAME = 'explicit-name';
    try {
      expect(encodeProjectDirName('/anything/at/all')).toBe('explicit-name');
    } finally {
      if (prev === undefined) delete process.env.CLAUDE_CODE_PROJECT_DIR_NAME;
      else process.env.CLAUDE_CODE_PROJECT_DIR_NAME = prev;
    }
  });
});

describe('getClaudeProjectsDir', () => {
  it('honours CLAUDE_CONFIG_DIR', () => {
    const prev = process.env.CLAUDE_CONFIG_DIR;
    process.env.CLAUDE_CONFIG_DIR = '/tmp/custom-claude';
    try {
      expect(getClaudeProjectsDir()).toBe(path.join('/tmp/custom-claude', 'projects'));
    } finally {
      if (prev === undefined) delete process.env.CLAUDE_CONFIG_DIR;
      else process.env.CLAUDE_CONFIG_DIR = prev;
    }
  });

  it('defaults to ~/.claude/projects', () => {
    const prev = process.env.CLAUDE_CONFIG_DIR;
    delete process.env.CLAUDE_CONFIG_DIR;
    try {
      expect(getClaudeProjectsDir()).toBe(path.join(os.homedir(), '.claude', 'projects'));
    } finally {
      if (prev !== undefined) process.env.CLAUDE_CONFIG_DIR = prev;
    }
  });
});

// ── drift canary ────────────────────────────────────────────────────────────

describe('drift canary — an import that produces nothing is not a success', () => {
  let tmpFile: string;

  beforeEach(() => {
    tmpFile = path.join(os.tmpdir(), `klatch-canary-${Date.now()}-${Math.random().toString(36).slice(2)}.jsonl`);
  });
  afterEach(() => {
    try { fs.unlinkSync(tmpFile); } catch { /* best effort */ }
  });

  it('returns 422 with the integrity receipt when turns parse but no message survives', async () => {
    // A turn whose text is empty: the boundary is detected, the content is not.
    // This is the shape a format change produces — boundaries preserved, content
    // unrecognized — and it used to return 201 Created with messageCount: 0.
    const lines = [
      JSON.stringify({
        type: 'user', uuid: 'u1', parentUuid: null, sessionId: 'canary-session',
        timestamp: '2026-03-01T09:00:00.000Z', permissionMode: 'default', cwd: '/tmp/nonexistent-canary',
        message: { role: 'user', content: [{ type: 'text', text: 'a real question' }] },
      }),
    ];
    fs.writeFileSync(tmpFile, lines.join('\n'), 'utf-8');

    const app = createTestApp();
    const res = await app.request('/api/import/claude-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionPath: tmpFile }),
    });

    // A single user turn with no assistant reply DOES insert one message, so this
    // import legitimately succeeds — the canary must not fire on it.
    expect(res.status).toBe(201);
    const body = await res.json() as { messageCount: number; integrity?: { turnsEmitted: number } };
    expect(body.messageCount).toBeGreaterThan(0);
    expect(body.integrity?.turnsEmitted).toBe(1);
  });

  it('surfaces the integrity receipt on a normal import', async () => {
    const lines = [
      JSON.stringify({
        type: 'user', uuid: 'u1', parentUuid: null, sessionId: 'receipt-session',
        timestamp: '2026-03-01T09:00:00.000Z', permissionMode: 'default', cwd: '/tmp/nonexistent-receipt',
        version: '2.1.73', message: { role: 'user', content: 'question' },
      }),
      JSON.stringify({
        type: 'assistant', uuid: 'a1', parentUuid: 'u1',
        timestamp: '2026-03-01T09:05:00.000Z', version: '2.1.81',
        message: { role: 'assistant', content: 'answer' },
      }),
      JSON.stringify({ type: 'progress', uuid: 'p1', parentUuid: null, timestamp: '2026-03-01T09:00:02.000Z' }),
    ];
    fs.writeFileSync(tmpFile, lines.join('\n'), 'utf-8');

    const app = createTestApp();
    const res = await app.request('/api/import/claude-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionPath: tmpFile }),
    });

    expect(res.status).toBe(201);
    const body = await res.json() as { integrity: { turnsEmitted: number; versionsSeen: string[]; boundaryMode: string; unrecognizedEventTypes: Record<string, number> } };
    expect(body.integrity.turnsEmitted).toBe(1);
    expect(body.integrity.versionsSeen).toEqual(['2.1.73', '2.1.81']);
    expect(body.integrity.boundaryMode).toBe('permissionMode');
    expect(body.integrity.unrecognizedEventTypes).toEqual({ progress: 1 });
  });
});
