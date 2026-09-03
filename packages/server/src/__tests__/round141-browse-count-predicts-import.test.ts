/**
 * Round 141 (Daedalus): the browse count must predict what the import persists.
 *
 * Theseus measured a real session on 2026-09-02 where the session browser
 * showed `604+` and the import persisted `325` rows, and declined to file it
 * as a bug: "turn-grouping plausibly accounts for the whole gap; I did not
 * verify the mapping event by event, so I'm not calling it wrong."
 *
 * `scripts/probe-browse-count-vs-persisted-rows.mts` did that verification —
 * residual 0 on every real session in the repo, including a 1001-line one
 * (469 events -> 75 turns -> 143 rows). So it is not a defect: no data is
 * lost, every collapsed event is an assistant tool-call that survives as an
 * artifact on the turn's assistant row.
 *
 * It IS a unit mismatch, and a large one: the events:rows ratio measured
 * 1.9x-3.3x across real sessions, so no mental correction factor is available
 * to a user reading the number. `turnCount` is the fix — the count that
 * predicts what lands.
 *
 * What this file pins:
 *
 *   1. **The invariant.** The scanner's streaming `turnCount` equals the
 *      parser's `groupIntoTurns(...).length` on the same bytes. These are two
 *      independent code paths (streamed + unsorted vs. buffered + sorted); the
 *      whole value of `turnCount` is that they cannot drift apart silently.
 *
 *   2. **turnCount predicts persisted rows.** Rows are `turns with userText` +
 *      `turns with assistant content`, so `turnCount <= rows <= 2 * turnCount`.
 *
 *   3. **turnCount and messageCount genuinely differ.** A regression that
 *      aliased one to the other would pass (1) and (2) on a text-only fixture.
 *      A tool-heavy fixture separates them.
 *
 *   4. **turnCount respects the same filter discipline** as messageCount —
 *      injections are not exchanges.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import './setup.js';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { extractSessionFingerprint } from '../import/session-scanner.js';
import {
  groupIntoTurns,
  isConversationEvent,
  parseJsonlContent,
  type RawEvent,
} from '../import/parser.js';

let tmpDir: string;
let nextFixtureId = 0;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'round141-turncount-'));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

function writeFixture(events: Array<object | string>): string {
  const filePath = path.join(tmpDir, `fixture-${nextFixtureId++}.jsonl`);
  const lines = events.map((e) => (typeof e === 'string' ? e : JSON.stringify(e)));
  fs.writeFileSync(filePath, lines.join('\n'));
  return filePath;
}

/**
 * A human-typed user event. Note `message.role` — `isHumanTurnBoundary`
 * requires it, the scanner's own filter does not. Real JSONL always carries it
 * (measured: 0 divergence across the repo's real sessions).
 */
function userText(text: string, ts: string, extra: object = {}): object {
  return {
    type: 'user',
    uuid: `u-${ts}`,
    timestamp: ts,
    message: { role: 'user', content: [{ type: 'text', text }] },
    ...extra,
  };
}

function assistantText(text: string, ts: string): object {
  return {
    type: 'assistant',
    uuid: `a-${ts}`,
    timestamp: ts,
    message: { role: 'assistant', content: [{ type: 'text', text }] },
  };
}

/** An assistant event that is a pure tool call — its own JSONL event, but it
 *  collapses into an artifact on the turn's single assistant row. */
function assistantToolUse(name: string, ts: string): object {
  return {
    type: 'assistant',
    uuid: `a-${ts}`,
    timestamp: ts,
    message: {
      role: 'assistant',
      content: [{ type: 'tool_use', id: `t-${ts}`, name, input: { path: '/tmp/x' } }],
    },
  };
}

/** Count rows exactly as `importSession` does (queries.ts:1308-1340). */
function persistedRows(turns: ReturnType<typeof groupIntoTurns>): number {
  let rows = 0;
  for (const t of turns) {
    if (t.userText) rows++;
    if (t.assistantText || (t.artifacts && t.artifacts.length > 0)) rows++;
  }
  return rows;
}

function turnsFromFile(filePath: string) {
  const { events } = parseJsonlContent(fs.readFileSync(filePath, 'utf-8'));
  return groupIntoTurns((events as RawEvent[]).filter(isConversationEvent));
}

// ── 1. The invariant ─────────────────────────────────────────

describe('Round 141: scanner turnCount == parser groupIntoTurns length', () => {
  it('agrees on a plain alternating conversation', async () => {
    const filePath = writeFixture([
      userText('one', '2026-01-01T00:00:00Z'),
      assistantText('reply one', '2026-01-01T00:00:01Z'),
      userText('two', '2026-01-01T00:00:02Z'),
      assistantText('reply two', '2026-01-01T00:00:03Z'),
      userText('three', '2026-01-01T00:00:04Z'),
      assistantText('reply three', '2026-01-01T00:00:05Z'),
    ]);
    const fp = await extractSessionFingerprint(filePath);
    expect(fp.turnCount).toBe(3);
    expect(fp.turnCount).toBe(turnsFromFile(filePath).length);
  });

  it('agrees on a tool-heavy turn — many assistant events, one exchange', async () => {
    const filePath = writeFixture([
      userText('do the thing', '2026-01-01T00:00:00Z'),
      assistantText('working on it', '2026-01-01T00:00:01Z'),
      assistantToolUse('Read', '2026-01-01T00:00:02Z'),
      assistantToolUse('Edit', '2026-01-01T00:00:03Z'),
      assistantToolUse('Bash', '2026-01-01T00:00:04Z'),
      assistantText('done', '2026-01-01T00:00:05Z'),
    ]);
    const fp = await extractSessionFingerprint(filePath);
    expect(fp.turnCount).toBe(1);
    expect(fp.turnCount).toBe(turnsFromFile(filePath).length);
  });

  it('agrees when events arrive out of timestamp order (scanner streams, parser sorts)', async () => {
    // The parser sorts by timestamp before finding boundaries; the scanner
    // counts in file order. Boundary detection is per-event, so the counts must
    // still match — this is the specific way the two paths could have drifted.
    const filePath = writeFixture([
      userText('second', '2026-01-01T00:00:04Z'),
      assistantText('reply two', '2026-01-01T00:00:05Z'),
      userText('first', '2026-01-01T00:00:00Z'),
      assistantText('reply one', '2026-01-01T00:00:01Z'),
    ]);
    const fp = await extractSessionFingerprint(filePath);
    expect(fp.turnCount).toBe(2);
    expect(fp.turnCount).toBe(turnsFromFile(filePath).length);
  });

  it('agrees on the repo real-session fixtures', async () => {
    const fixtureDir = path.join(import.meta.dirname, 'fixtures');
    const fixtures = [
      'simple-session.jsonl',
      'tool-heavy-session.jsonl',
      'subagent-session.jsonl',
    ].map((f) => path.join(fixtureDir, f)).filter((p) => fs.existsSync(p));

    expect(fixtures.length).toBeGreaterThan(0);
    for (const f of fixtures) {
      const fp = await extractSessionFingerprint(f);
      expect(fp.turnCount, `turnCount mismatch on ${f}`).toBe(turnsFromFile(f).length);
    }
  });
});

// ── 2. turnCount predicts persisted rows ─────────────────────

describe('Round 141: turnCount bounds what the import persists', () => {
  it('turnCount <= rows <= 2 * turnCount on a tool-heavy session', async () => {
    const filePath = writeFixture([
      userText('do the thing', '2026-01-01T00:00:00Z'),
      assistantToolUse('Read', '2026-01-01T00:00:01Z'),
      assistantToolUse('Edit', '2026-01-01T00:00:02Z'),
      assistantText('done', '2026-01-01T00:00:03Z'),
      userText('and again', '2026-01-01T00:00:04Z'),
      assistantText('done again', '2026-01-01T00:00:05Z'),
    ]);
    const fp = await extractSessionFingerprint(filePath);
    const rows = persistedRows(turnsFromFile(filePath));

    expect(fp.turnCount).toBe(2);
    expect(rows).toBe(4);
    expect(rows).toBeGreaterThanOrEqual(fp.turnCount);
    expect(rows).toBeLessThanOrEqual(2 * fp.turnCount);
  });

  it('a trailing user message with no reply yields a turn with only a user row', async () => {
    const filePath = writeFixture([
      userText('hello?', '2026-01-01T00:00:00Z'),
      userText('anyone there?', '2026-01-01T00:00:01Z'),
    ]);
    const fp = await extractSessionFingerprint(filePath);
    const rows = persistedRows(turnsFromFile(filePath));

    expect(fp.turnCount).toBe(2);
    expect(rows).toBe(2); // 2 user rows, 0 assistant rows — the lower bound is real
    expect(rows).toBeGreaterThanOrEqual(fp.turnCount);
  });
});

// ── 3. turnCount and messageCount genuinely differ ───────────

describe('Round 141: turnCount is not an alias for messageCount', () => {
  it('separates by 5x on a tool-heavy session', async () => {
    const filePath = writeFixture([
      userText('do the thing', '2026-01-01T00:00:00Z'),
      assistantToolUse('Read', '2026-01-01T00:00:01Z'),
      assistantToolUse('Edit', '2026-01-01T00:00:02Z'),
      assistantToolUse('Bash', '2026-01-01T00:00:03Z'),
      assistantText('done', '2026-01-01T00:00:04Z'),
    ]);
    const fp = await extractSessionFingerprint(filePath);
    expect(fp.messageCount).toBe(5);
    expect(fp.turnCount).toBe(1);
  });

  it('messageCount always >= turnCount', async () => {
    const filePath = writeFixture([
      userText('a', '2026-01-01T00:00:00Z'),
      assistantText('b', '2026-01-01T00:00:01Z'),
      userText('c', '2026-01-01T00:00:02Z'),
    ]);
    const fp = await extractSessionFingerprint(filePath);
    expect(fp.messageCount).toBeGreaterThanOrEqual(fp.turnCount);
  });
});

// ── 4. Filter discipline — injections are not exchanges ──────

describe('Round 141: turnCount respects the fingerprint filter discipline', () => {
  it('does not count sidechain, isMeta, isCompactSummary, or isVisibleInTranscriptOnly user events', async () => {
    const filePath = writeFixture([
      userText('real one', '2026-01-01T00:00:00Z'),
      assistantText('reply', '2026-01-01T00:00:01Z'),
      userText('sidechain', '2026-01-01T00:00:02Z', { isSidechain: true }),
      userText('meta', '2026-01-01T00:00:03Z', { isMeta: true }),
      userText('compact', '2026-01-01T00:00:04Z', { isCompactSummary: true }),
      userText('transcript-only', '2026-01-01T00:00:05Z', { isVisibleInTranscriptOnly: true }),
    ]);
    const fp = await extractSessionFingerprint(filePath);
    expect(fp.turnCount).toBe(1);
  });

  it('does not count tool-result user events', async () => {
    const filePath = writeFixture([
      userText('real one', '2026-01-01T00:00:00Z'),
      {
        type: 'user',
        uuid: 'u-tr',
        timestamp: '2026-01-01T00:00:01Z',
        message: {
          role: 'user',
          content: [{ type: 'tool_result', tool_use_id: 't-1', content: 'ok' }],
        },
      },
    ]);
    const fp = await extractSessionFingerprint(filePath);
    expect(fp.turnCount).toBe(1);
  });

  it('reports turnCount 0 on a session with no human turns', async () => {
    const filePath = writeFixture([
      assistantText('unprompted', '2026-01-01T00:00:00Z'),
    ]);
    const fp = await extractSessionFingerprint(filePath);
    expect(fp.turnCount).toBe(0);
    expect(fp.messageCount).toBe(1);
  });
});
