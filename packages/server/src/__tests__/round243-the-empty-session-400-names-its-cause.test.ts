/**
 * Round 243 — the empty-session 400 names the cause the reader can act on.
 *
 * Theseus, Round 242 §4a: importing a 583 KiB subagent transcript returned
 * `Session is empty — no conversation events found`. Every word true; nothing actionable. The
 * file is visibly not empty, and the real cause — it is a subagent sidechain, which Klatch
 * imports as part of its parent session and never on its own — appeared nowhere. There are 124
 * such files on this machine (52.7 MB; re-derived independently in Round 243 with a directory
 * walk, and all 124 yield zero conversation events).
 *
 * Four causes, four remedies, so four sentences. These tests hold each one to naming its own
 * cause, and — the part that matters — hold them to being **distinguishable from each other**,
 * because a diagnosis that collapses back into one string is the defect returning.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import './setup.js';
import { createTestApp } from './app.js';
import fs from 'fs';
import os from 'os';
import path from 'path';

vi.mock('../claude/client.js', () => ({ streamClaude: vi.fn() }));

const TMP = path.join(os.tmpdir(), 'klatch-r243-empty-400');

function write(name: string, lines: object[] | string): string {
  fs.mkdirSync(TMP, { recursive: true });
  const p = path.join(TMP, name);
  fs.writeFileSync(p, typeof lines === 'string' ? lines : lines.map((l) => JSON.stringify(l)).join('\n') + '\n');
  return p;
}

async function importIt(app: ReturnType<typeof createTestApp>, sessionPath: string) {
  const res = await app.request('/api/import/claude-code', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionPath }),
  });
  return { status: res.status, error: ((await res.json()) as { error?: string }).error ?? '' };
}

const base = {
  parentUuid: null,
  userType: 'external',
  cwd: '/Users/test/r243',
  sessionId: 'r243-empty',
  version: '2.1.19',
  gitBranch: 'main',
};

/** A subagent transcript: conversation-shaped events, every one flagged isSidechain. */
function sidechainLines(n: number): object[] {
  const out: object[] = [
    { ...base, type: 'system', uuid: 'sys-1', timestamp: '2026-03-14T10:00:00.000Z', subtype: 'turn_duration' },
  ];
  for (let i = 0; i < n; i++) {
    out.push({
      ...base, type: 'user', isSidechain: true, uuid: `sc-u${i}`,
      timestamp: `2026-03-14T10:0${i}:00.000Z`,
      message: { role: 'user', content: `subagent prompt ${i}` },
    });
    out.push({
      ...base, type: 'assistant', isSidechain: true, uuid: `sc-a${i}`,
      timestamp: `2026-03-14T10:0${i}:30.000Z`,
      message: { role: 'assistant', model: 'claude-opus-5', content: [{ type: 'text', text: `subagent reply ${i}` }] },
    });
  }
  return out;
}

describe('the empty-session 400 names its cause', () => {
  let app: ReturnType<typeof createTestApp>;

  beforeEach(() => { app = createTestApp(); });
  afterEach(() => { fs.rmSync(TMP, { recursive: true, force: true }); });

  it('a subagent transcript is diagnosed as a subagent transcript, not as empty', async () => {
    const p = write('subagent.jsonl', sidechainLines(3));
    const { status, error } = await importIt(app, p);
    expect(status).toBe(400);
    expect(error).toMatch(/subagent transcript/i);
    // The remedy has to be in the message, not left to the reader to infer.
    expect(error).toMatch(/parent session/i);
  });

  it('counts the sidechain events rather than asserting "all of them"', async () => {
    // 3 turns -> 6 sidechain events, plus one system event that is NOT sidechain. A message
    // claiming all 7 events were sidechain would be wrong, and wrong in the direction that
    // costs the reader their trust in the number.
    const p = write('subagent-counted.jsonl', sidechainLines(3));
    const { error } = await importIt(app, p);
    expect(error).toContain('6 of its 7 events');
    expect(error).not.toMatch(/all 7/);
  });

  it('scales the count with the file, so the number is measured and not boilerplate', async () => {
    const small = await importIt(app, write('sc-small.jsonl', sidechainLines(1)));
    const large = await importIt(app, write('sc-large.jsonl', sidechainLines(9)));
    expect(small.error).toContain('2 of its 3 events');
    expect(large.error).toContain('18 of its 19 events');
  });

  it('a file with no readable events says so, and does not blame a sidechain', async () => {
    const p = write('no-events.jsonl', '\n\n');
    const { status, error } = await importIt(app, p);
    expect(status).toBe(400);
    expect(error).toMatch(/no events could be read/i);
    expect(error).not.toMatch(/subagent/i);
  });

  it('non-conversation events are reported with the event types actually present', async () => {
    const p = write('bookkeeping.jsonl', [
      { type: 'file-history-snapshot', uuid: 'snap-1', timestamp: '2026-03-14T10:00:00.000Z', snapshot: {} },
      { type: 'queue-operation', uuid: 'q-1', timestamp: '2026-03-14T10:00:01.000Z' },
    ]);
    const { status, error } = await importIt(app, p);
    expect(status).toBe(400);
    expect(error).toMatch(/empty/i);
    expect(error).toContain('read 2 events');
    expect(error).toContain('file-history-snapshot');
    expect(error).toContain('queue-operation');
    expect(error).not.toMatch(/subagent/i);
  });

  it('conversation events with no human prompt are distinguished from having none at all', async () => {
    // Assistant events and tool-result envelopes only — real conversation events, but nothing
    // that is a human turn boundary, so groupIntoTurns emits nothing. Different cause, and a
    // different fix, from a file that had no conversation events in the first place.
    const p = write('no-human-turn.jsonl', [
      {
        ...base, type: 'user', uuid: 'tr-1', timestamp: '2026-03-14T10:00:00.000Z',
        message: { role: 'user', content: [{ type: 'tool_result', tool_use_id: 'tu-1', content: 'ok' }] },
      },
      {
        ...base, type: 'assistant', uuid: 'a-1', timestamp: '2026-03-14T10:00:01.000Z',
        message: { role: 'assistant', model: 'claude-opus-5', content: [{ type: 'text', text: 'hello' }] },
      },
    ]);
    const { status, error } = await importIt(app, p);
    expect(status).toBe(400);
    expect(error).toMatch(/no.*human prompt|not.*human prompt/i);
    expect(error).toContain('2 conversation events read');
    expect(error).not.toMatch(/subagent/i);
  });

  it('the four diagnoses are four distinct strings', async () => {
    const messages = [
      (await importIt(app, write('d-subagent.jsonl', sidechainLines(2)))).error,
      (await importIt(app, write('d-noevents.jsonl', ''))).error,
      (await importIt(app, write('d-bookkeeping.jsonl', [
        { type: 'file-history-snapshot', uuid: 's', timestamp: '2026-03-14T10:00:00.000Z', snapshot: {} },
      ]))).error,
      (await importIt(app, write('d-nohuman.jsonl', [
        {
          ...base, type: 'assistant', uuid: 'a', timestamp: '2026-03-14T10:00:01.000Z',
          message: { role: 'assistant', model: 'claude-opus-5', content: [{ type: 'text', text: 'hi' }] },
        },
      ]))).error,
    ];
    expect(messages.every((m) => m.length > 0)).toBe(true);
    expect(new Set(messages).size).toBe(4);
  });

  it('a valid session still imports — the guard did not widen', async () => {
    const p = write('good.jsonl', [
      {
        ...base, type: 'user', uuid: 'u-1', timestamp: '2026-03-14T10:00:00.000Z',
        message: { role: 'user', content: 'a genuine human question' },
      },
      {
        ...base, parentUuid: 'u-1', type: 'assistant', uuid: 'a-1', timestamp: '2026-03-14T10:00:01.000Z',
        message: { role: 'assistant', model: 'claude-opus-5', content: [{ type: 'text', text: 'an answer' }] },
      },
    ]);
    const res = await app.request('/api/import/claude-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionPath: p }),
    });
    expect(res.status).toBe(201);
  });
});

describe('integrity.sidechainEvents', () => {
  it('counts conversation-shaped events dropped only for isSidechain', async () => {
    const { parseEvents } = await import('../import/parser.js');
    const parsed = parseEvents(sidechainLines(4));
    expect(parsed.integrity?.sidechainEvents).toBe(8);
    expect(parsed.integrity?.conversationEvents).toBe(0);
  });

  it('is zero for a session with no sidechain, so it cannot fire on a normal import', async () => {
    const { parseEvents } = await import('../import/parser.js');
    const parsed = parseEvents([
      {
        ...base, type: 'user', uuid: 'u-1', timestamp: '2026-03-14T10:00:00.000Z',
        message: { role: 'user', content: 'a genuine human question' },
      },
      {
        ...base, parentUuid: 'u-1', type: 'assistant', uuid: 'a-1', timestamp: '2026-03-14T10:00:01.000Z',
        message: { role: 'assistant', model: 'claude-opus-5', content: [{ type: 'text', text: 'an answer' }] },
      },
    ]);
    expect(parsed.integrity?.sidechainEvents).toBe(0);
    expect(parsed.turns.length).toBe(1);
  });

  it('does not count non-conversation event types that happen to be sidechain', async () => {
    const { parseEvents } = await import('../import/parser.js');
    const parsed = parseEvents([
      { ...base, type: 'progress', isSidechain: true, uuid: 'p-1', timestamp: '2026-03-14T10:00:00.000Z' },
      { ...base, type: 'user', isSidechain: true, uuid: 'u-1', timestamp: '2026-03-14T10:00:01.000Z', message: { role: 'user', content: 'x' } },
    ]);
    expect(parsed.integrity?.sidechainEvents).toBe(1);
  });
});
