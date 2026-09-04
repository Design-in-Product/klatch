/**
 * Round 33 (Argus): T1.6 — extractSessionFingerprint contract coverage.
 *
 * Pins the behavioral contract of `extractSessionFingerprint` from
 * `packages/server/src/import/session-scanner.ts` (commit `65db553`,
 * Iris triage Tier 1 patch T1.6).
 *
 * Contract surface:
 *
 *   1. **Shape on a known JSONL.** firstUserMessage + messageCount +
 *      capped match a hand-built fixture; truncation at 80 chars adds
 *      an ellipsis.
 *
 *   2. **Filter discipline.** The fingerprint must skip — without
 *      counting toward messageCount or being eligible as
 *      firstUserMessage:
 *        - Sidechain events (isSidechain: true)
 *        - Meta events (isMeta: true)
 *        - Compact summaries (isCompactSummary: true)
 *        - Visible-in-transcript-only events (isVisibleInTranscriptOnly: true)
 *        - Tool-result user events (content is an array where every
 *          block has type: 'tool_result')
 *      One fixture per skip class locks in the contract.
 *
 *   3. **Cap behavior.** Beyond FINGERPRINT_LINE_CAP (1500 lines), the
 *      stream stops, capped is true, and messageCount is a lower bound.
 *
 *   4. **Empty / missing user content.** No real human-typed user
 *      messages → firstUserMessage is empty string.
 *
 *   5. **Malformed JSONL line in the middle.** Skipped gracefully;
 *      well-formed lines around it still counted.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import './setup.js';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { extractSessionFingerprint } from '../import/session-scanner.js';

// ── Fixture helpers ──────────────────────────────────────────

let tmpDir: string;
let nextFixtureId = 0;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'round33-fingerprint-'));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

/** Write a JSONL file from an array of event objects (or raw strings). */
function writeFixture(events: Array<object | string>): string {
  const filePath = path.join(tmpDir, `fixture-${nextFixtureId++}.jsonl`);
  const lines = events.map((e) => (typeof e === 'string' ? e : JSON.stringify(e)));
  fs.writeFileSync(filePath, lines.join('\n'));
  return filePath;
}

/** A clean user-typed message event matching the parser's "real human" shape. */
function userText(text: string): object {
  return {
    type: 'user',
    message: { content: [{ type: 'text', text }] },
  };
}

/** A clean assistant text event. */
function assistantText(text: string): object {
  return {
    type: 'assistant',
    message: { content: [{ type: 'text', text }] },
  };
}

// ── 1. Shape on a known JSONL ────────────────────────────────

describe('Round 33 fingerprint: shape on a known JSONL', () => {
  it('returns first user message + messageCount + capped=false on a 3-event fixture', async () => {
    const filePath = writeFixture([
      userText('Hello, can you help me?'),
      assistantText('Sure, what do you need?'),
      userText('I want to refactor a function.'),
    ]);
    const fp = await extractSessionFingerprint(filePath);
    expect(fp.firstUserMessage).toBe('Hello, can you help me?');
    expect(fp.messageCount).toBe(3);
    expect(fp.capped).toBe(false);
  });

  it('truncates the first user message at 80 chars with an ellipsis', async () => {
    // 90-char string — must be truncated
    const longText = 'A'.repeat(90);
    const filePath = writeFixture([userText(longText)]);
    const fp = await extractSessionFingerprint(filePath);
    expect(fp.firstUserMessage.length).toBeLessThanOrEqual(80);
    expect(fp.firstUserMessage.endsWith('…')).toBe(true);
    // Truncation: first 79 A's + ellipsis
    expect(fp.firstUserMessage).toBe('A'.repeat(79) + '…');
  });

  it('does NOT truncate a message exactly at the 80-char boundary', async () => {
    const exactLength = 'B'.repeat(80);
    const filePath = writeFixture([userText(exactLength)]);
    const fp = await extractSessionFingerprint(filePath);
    expect(fp.firstUserMessage).toBe(exactLength);
    expect(fp.firstUserMessage.endsWith('…')).toBe(false);
  });
});

// ── 2. Filter discipline (one fixture per skip class) ───────

describe('Round 33 fingerprint: filter discipline', () => {
  it('skips sidechain events — does not count, does not become firstUserMessage', async () => {
    const filePath = writeFixture([
      { ...userText('SIDECHAIN MESSAGE'), isSidechain: true },
      userText('first real user message'),
    ]);
    const fp = await extractSessionFingerprint(filePath);
    expect(fp.firstUserMessage).toBe('first real user message');
    expect(fp.messageCount).toBe(1); // only the real user event counted
  });

  it('skips isMeta events', async () => {
    const filePath = writeFixture([
      { ...userText('META USER MESSAGE'), isMeta: true },
      userText('real first message'),
    ]);
    const fp = await extractSessionFingerprint(filePath);
    expect(fp.firstUserMessage).toBe('real first message');
    expect(fp.messageCount).toBe(1);
  });

  it('skips isCompactSummary events', async () => {
    const filePath = writeFixture([
      { ...assistantText('COMPACTION SUMMARY'), isCompactSummary: true },
      userText('first real message'),
    ]);
    const fp = await extractSessionFingerprint(filePath);
    expect(fp.firstUserMessage).toBe('first real message');
    expect(fp.messageCount).toBe(1);
  });

  it('skips isVisibleInTranscriptOnly events', async () => {
    const filePath = writeFixture([
      { ...userText('TRANSCRIPT-ONLY'), isVisibleInTranscriptOnly: true },
      userText('first real message'),
    ]);
    const fp = await extractSessionFingerprint(filePath);
    expect(fp.firstUserMessage).toBe('first real message');
    expect(fp.messageCount).toBe(1);
  });

  it('skips tool-result user events (content is array of tool_result blocks)', async () => {
    const filePath = writeFixture([
      {
        type: 'user',
        message: {
          content: [
            { type: 'tool_result', tool_use_id: 'abc', content: 'tool output here' },
          ],
        },
      },
      userText('first real human message'),
    ]);
    const fp = await extractSessionFingerprint(filePath);
    expect(fp.firstUserMessage).toBe('first real human message');
    expect(fp.messageCount).toBe(1);
  });

  it('skips events without a `message` field entirely', async () => {
    const filePath = writeFixture([
      { type: 'user' }, // no message
      userText('first real message'),
    ]);
    const fp = await extractSessionFingerprint(filePath);
    expect(fp.firstUserMessage).toBe('first real message');
    expect(fp.messageCount).toBe(1);
  });

  it('skips event types that are neither user nor assistant', async () => {
    const filePath = writeFixture([
      { type: 'system', message: { content: 'system' } },
      { type: 'tool_use', message: { content: 'tool' } },
      userText('only real message'),
    ]);
    const fp = await extractSessionFingerprint(filePath);
    expect(fp.firstUserMessage).toBe('only real message');
    expect(fp.messageCount).toBe(1);
  });
});

// ── 3. Cap behavior ─────────────────────────────────────────

describe('Round 33 fingerprint: cap behavior', () => {
  // Rewritten 2026-09-04. FINGERPRINT_LINE_CAP moved 1500 -> 50_000 (xian's ruling:
  // remove the cap, keep a pathological-file guard). The lower-bound property is still
  // worth pinning — it is what `capped` means — but it now has to be provoked with a
  // file larger than any real session, because that is the whole point of the change.
  it('capped=true past FINGERPRINT_LINE_CAP (50_000) lines; messageCount is a lower bound', async () => {
    const events: object[] = [userText('the very first user msg')];
    for (let i = 0; i < 50_100; i++) {
      events.push(assistantText(`assistant turn ${i}`));
    }
    const filePath = writeFixture(events);
    const fp = await extractSessionFingerprint(filePath);
    expect(fp.capped).toBe(true);
    expect(fp.firstUserMessage).toBe('the very first user msg');
    // Hard stop at line 50_001, so the count is a lower bound: short of the true
    // total, but the guard is honored.
    expect(fp.messageCount).toBeLessThan(50_101);
    expect(fp.messageCount).toBeGreaterThanOrEqual(50_000);
  });

  // The ruling's actual payload: the sessions the old cap clipped now read exact.
  // 1,600 lines was over the old cap; the largest file in the real corpus measured
  // 15,371 lines on 2026-09-04, so nothing real reaches the new guard.
  it('a session that the old 1500 cap clipped now reports an exact count', async () => {
    const events: object[] = [userText('the very first user msg')];
    for (let i = 0; i < 1599; i++) {
      events.push(assistantText(`assistant turn ${i}`));
    }
    const filePath = writeFixture(events);
    const fp = await extractSessionFingerprint(filePath);
    expect(fp.capped).toBe(false);
    expect(fp.messageCount).toBe(1600);
  });

  it('capped=false when total lines stay under the cap', async () => {
    const events: object[] = [];
    for (let i = 0; i < 100; i++) {
      events.push(i % 2 === 0 ? userText(`msg ${i}`) : assistantText(`reply ${i}`));
    }
    const filePath = writeFixture(events);
    const fp = await extractSessionFingerprint(filePath);
    expect(fp.capped).toBe(false);
    expect(fp.messageCount).toBe(100);
  });
});

// ── 4. Empty / missing user content ─────────────────────────

describe('Round 33 fingerprint: empty / missing user content', () => {
  it('returns empty firstUserMessage when no real human-typed user messages exist', async () => {
    // Only assistant messages + tool-result user events
    const filePath = writeFixture([
      assistantText('Hello!'),
      {
        type: 'user',
        message: {
          content: [{ type: 'tool_result', tool_use_id: 'x', content: 'output' }],
        },
      },
      assistantText('Continuing.'),
    ]);
    const fp = await extractSessionFingerprint(filePath);
    expect(fp.firstUserMessage).toBe('');
    // The two assistant events are counted; the tool-result user is not.
    expect(fp.messageCount).toBe(2);
  });

  it('returns empty firstUserMessage on an empty file', async () => {
    const filePath = writeFixture([]);
    const fp = await extractSessionFingerprint(filePath);
    expect(fp.firstUserMessage).toBe('');
    expect(fp.messageCount).toBe(0);
    expect(fp.capped).toBe(false);
  });

  it('returns empty firstUserMessage when user content is whitespace-only', async () => {
    const filePath = writeFixture([
      userText('   \n\t  '), // whitespace only
      userText('real first message after whitespace'),
    ]);
    const fp = await extractSessionFingerprint(filePath);
    // Whitespace doesn't count as a "real" first message; the next one wins.
    expect(fp.firstUserMessage).toBe('real first message after whitespace');
  });
});

// ── 5. Malformed JSONL line in the middle ───────────────────

describe('Round 33 fingerprint: malformed JSONL', () => {
  it('skips a malformed line mid-stream; well-formed lines around it still counted', async () => {
    const filePath = writeFixture([
      JSON.stringify(userText('first real message')),
      '{not valid json{',
      JSON.stringify(assistantText('reply 1')),
      '{also bad',
      JSON.stringify(assistantText('reply 2')),
    ]);
    const fp = await extractSessionFingerprint(filePath);
    expect(fp.firstUserMessage).toBe('first real message');
    expect(fp.messageCount).toBe(3); // user + 2 assistant; 2 malformed skipped
  });

  it('returns empty fingerprint on a file that is entirely malformed', async () => {
    const filePath = writeFixture([
      '{garbage 1',
      '{garbage 2',
      '{garbage 3',
    ]);
    const fp = await extractSessionFingerprint(filePath);
    expect(fp.firstUserMessage).toBe('');
    expect(fp.messageCount).toBe(0);
  });
});

// ── 6. String-content variant (parser tolerance) ───────────

describe('Round 33 fingerprint: string-content variant', () => {
  it('handles content as a plain string (not just text-block array)', async () => {
    const filePath = writeFixture([
      { type: 'user', message: { content: 'String content variant' } },
    ]);
    const fp = await extractSessionFingerprint(filePath);
    expect(fp.firstUserMessage).toBe('String content variant');
    expect(fp.messageCount).toBe(1);
  });
});
