/**
 * Round 147: the browse fingerprint cache.
 *
 * Browse is dominated by `extractSessionFingerprint`, which streams and JSON-parses
 * up to `FINGERPRINT_LINE_CAP` lines per session file. Theseus measured browse at
 * ~98% fingerprinting (`docs/browse-latency-end-to-end-2026-09-03.md`), and the
 * files are append-only and almost always unchanged between two visits to the
 * import screen. So the same bytes are re-parsed on every browse.
 *
 * `getSessionFingerprint(path, stat, cap)` reuses a previous result when the file
 * is provably unchanged. These tests pin the four things that make that safe —
 * three of which are failure modes a naive `(path, mtime)` cache would have.
 *
 * 1. THE DEDUP FIELDS MUST NOT BE CACHED. `alreadyImported` / `existingChannelId`
 *    are functions of the DATABASE, not of the file. If they rode along in the
 *    cache entry, importing a session would leave the browse screen saying it is
 *    still unimported until its file happened to change. This is the trap, and it
 *    is the reason the cache is scoped to the fingerprint tuple rather than to
 *    `SessionInfo`.
 *
 * 2. THE LINE CAP IS PART OF VALIDITY. The cap is under an open decision (Round
 *    143, routed to xian). If it is raised or removed, every cached `capped: true`
 *    entry is a stale undercount for a file that never changed — mtime and size
 *    cannot detect that. Keying on the cap makes a cap change self-invalidating.
 *
 * 3. SIZE, NOT JUST MTIME. Cheap to include, and it is the property that makes the
 *    append-only case airtight.
 *
 * 4. ONE ENTRY PER PATH. A file that changes overwrites its own entry rather than
 *    accumulating one per version, so an actively-appended session cannot grow the
 *    map without bound across a long-lived server.
 *
 * Reuse is asserted by OBJECT IDENTITY (`toBe`), not wall-clock: identity can only
 * hold if the second call returned the stored object. Timing assertions are flaky;
 * this one is exact.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import './setup.js';
import fs from 'fs';
import os from 'os';
import path from 'path';
import {
  extractSessionFingerprint,
  getSessionFingerprint,
  clearSessionFingerprintCache,
  sessionFingerprintCacheSize,
  scanExportedSessions,
} from '../import/session-scanner.js';
import { getDb } from '../db/index.js';

vi.mock('@anthropic-ai/sdk', () => ({
  default: class MockAnthropic { messages = { create: vi.fn() } },
}));
vi.mock('../claude/client.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../claude/client.js')>();
  return { ...actual, streamClaude: vi.fn(), streamClaudeRoundtable: vi.fn() };
});

let tmp: string;

beforeEach(() => {
  clearSessionFingerprintCache();
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'klatch-r147-'));
});

afterEach(() => {
  fs.rmSync(tmp, { recursive: true, force: true });
});

/** One user turn plus one assistant reply, as Claude Code writes them. */
function turn(sessionId: string, text: string): string {
  return [
    JSON.stringify({ type: 'user', sessionId, message: { role: 'user', content: text } }),
    JSON.stringify({ type: 'assistant', sessionId, message: { role: 'assistant', content: [{ type: 'text', text: 'ok' }] } }),
  ].join('\n');
}

function writeSession(file: string, turns: string[], sessionId = 'sess-1'): string {
  const p = path.join(tmp, file);
  fs.writeFileSync(p, turns.map((t) => turn(sessionId, t)).join('\n') + '\n');
  return p;
}

/** Force a distinct mtime — same-tick writes would make the test assert nothing. */
function touchForward(p: string, msAhead: number): void {
  const t = new Date(fs.statSync(p).mtimeMs + msAhead);
  fs.utimesSync(p, t, t);
}

describe('Round 147: fingerprint cache', () => {
  describe('reuse when the file is unchanged', () => {
    it('returns the identical object on the second call', async () => {
      const p = writeSession('a.jsonl', ['hello there', 'second question']);
      const st = fs.statSync(p);

      const first = await getSessionFingerprint(p, st, 1500);
      const second = await getSessionFingerprint(p, fs.statSync(p), 1500);

      // Identity, not equality: only a cache hit can return the same object.
      expect(second).toBe(first);
      expect(sessionFingerprintCacheSize()).toBe(1);
    });

    it('the cached value equals what the uncached function computes', async () => {
      const p = writeSession('a.jsonl', ['hello there', 'second question']);

      const direct = await extractSessionFingerprint(p, 1500);
      const cached = await getSessionFingerprint(p, fs.statSync(p), 1500);

      expect({ ...cached }).toEqual(direct);
      expect(cached.turnCount).toBe(2);
      expect(cached.firstUserMessage).toBe('hello there');
      expect(cached.capped).toBe(false);
    });

    it('does not leak between different paths', async () => {
      const a = writeSession('a.jsonl', ['from file a']);
      const b = writeSession('b.jsonl', ['from file b']);

      const fa = await getSessionFingerprint(a, fs.statSync(a), 1500);
      const fb = await getSessionFingerprint(b, fs.statSync(b), 1500);

      expect(fa.firstUserMessage).toBe('from file a');
      expect(fb.firstUserMessage).toBe('from file b');
      expect(sessionFingerprintCacheSize()).toBe(2);
    });
  });

  describe('invalidation', () => {
    it('recomputes when the file is appended to (size and mtime both move)', async () => {
      const p = writeSession('a.jsonl', ['first']);
      const before = await getSessionFingerprint(p, fs.statSync(p), 1500);
      expect(before.turnCount).toBe(1);

      fs.appendFileSync(p, turn('sess-1', 'second') + '\n');
      touchForward(p, 1000);

      const after = await getSessionFingerprint(p, fs.statSync(p), 1500);
      expect(after).not.toBe(before);
      expect(after.turnCount).toBe(2);
    });

    it('recomputes when mtime moves at identical size', async () => {
      const p = writeSession('a.jsonl', ['aaaaa']);
      const before = await getSessionFingerprint(p, fs.statSync(p), 1500);

      // Same byte length, different content — the case mtime alone must catch.
      const rewritten = fs.readFileSync(p, 'utf-8').replace('aaaaa', 'bbbbb');
      fs.writeFileSync(p, rewritten);
      expect(fs.statSync(p).size).toBe(Buffer.byteLength(rewritten));
      touchForward(p, 1000);

      const after = await getSessionFingerprint(p, fs.statSync(p), 1500);
      expect(after.firstUserMessage).toBe('bbbbb');
      expect(before.firstUserMessage).toBe('aaaaa');
    });

    it('recomputes when size moves at identical mtime', async () => {
      const p = writeSession('a.jsonl', ['first']);

      // Pin mtime to a whole-second value BEFORE measuring, rather than restoring it
      // afterwards. `utimesSync` takes a Date and so truncates to whole milliseconds,
      // while APFS records mtime at sub-millisecond resolution — restoring a natural
      // mtime lands ~0.45 ms away from where it started and the test would be
      // asserting nothing. (Found by this test failing; the product is unaffected,
      // it only ever compares stats it read from the filesystem.)
      const pinned = new Date(1_700_000_000_000);
      fs.utimesSync(p, pinned, pinned);
      const st = fs.statSync(p);
      const before = await getSessionFingerprint(p, st, 1500);

      fs.appendFileSync(p, turn('sess-1', 'second') + '\n');
      fs.utimesSync(p, pinned, pinned);
      const restat = fs.statSync(p);
      // mtime is now the ONLY thing that has not moved — size is the sole signal.
      expect(restat.mtimeMs).toBe(st.mtimeMs);
      expect(restat.size).not.toBe(st.size);

      const after = await getSessionFingerprint(p, restat, 1500);
      expect(after).not.toBe(before);
      expect(after.turnCount).toBe(2);
    });

    it('recomputes when the line cap changes — the open cap decision cannot serve stale counts', async () => {
      const p = writeSession('a.jsonl', Array.from({ length: 40 }, (_, i) => `turn ${i}`));
      const st = fs.statSync(p);

      // 10 lines = 5 turns, and the scan stops short of EOF.
      const capped = await getSessionFingerprint(p, st, 10);
      expect(capped.capped).toBe(true);
      expect(capped.turnCount).toBe(5);

      // Same file, same mtime, same size — only the cap moved. A (path, mtime, size)
      // cache would hand back turnCount 5 here, which is wrong by 8x.
      const uncapped = await getSessionFingerprint(p, st, Number.MAX_SAFE_INTEGER);
      expect(uncapped.capped).toBe(false);
      expect(uncapped.turnCount).toBe(40);
    });
  });

  describe('bounds and immutability', () => {
    it('keeps one entry per path across many versions of the same file', async () => {
      const p = writeSession('a.jsonl', ['v0']);
      for (let i = 1; i <= 5; i++) {
        fs.appendFileSync(p, turn('sess-1', `v${i}`) + '\n');
        touchForward(p, 1000);
        await getSessionFingerprint(p, fs.statSync(p), 1500);
      }
      expect(sessionFingerprintCacheSize()).toBe(1);
    });

    it('returns a frozen object, so one caller cannot corrupt every later one', async () => {
      const p = writeSession('a.jsonl', ['hello']);
      const fp = await getSessionFingerprint(p, fs.statSync(p), 1500);

      expect(Object.isFrozen(fp)).toBe(true);
      expect(() => { (fp as any).turnCount = 9999; }).toThrow();

      const again = await getSessionFingerprint(p, fs.statSync(p), 1500);
      expect(again.turnCount).toBe(1);
    });
  });

  describe('the dedup fields are NOT cached', () => {
    it('a session imported between two browses flips to alreadyImported without its file changing', async () => {
      const sessionId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
      const exportDir = path.join(tmp, 'exports', 'sessions');
      fs.mkdirSync(exportDir, { recursive: true });
      fs.writeFileSync(
        path.join(exportDir, `${sessionId}.jsonl`),
        [turn(sessionId, 'a question long enough to clear the 100-byte floor in the scanner')].join('\n') + '\n',
      );

      const first = await scanExportedSessions(tmp);
      expect(first?.sessions).toHaveLength(1);
      expect(first!.sessions[0].alreadyImported).toBe(false);
      expect(first!.sessions[0].turnCount).toBe(1);

      // Import it. The FILE is untouched — only the database changed.
      getDb().prepare(
        'INSERT INTO channels (id, name, system_prompt, model, mode, type, source, source_metadata, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
      ).run(
        'ch-imported', 'Imported session', '', 'claude-opus-4-6', 'roundtable', 'chat',
        'claude-code', JSON.stringify({ originalSessionId: sessionId }), new Date().toISOString(),
      );

      const second = await scanExportedSessions(tmp);
      expect(second!.sessions[0].alreadyImported).toBe(true);
      expect(second!.sessions[0].existingChannelId).toBe('ch-imported');
      // ...and the fingerprint half still came from cache.
      expect(second!.sessions[0].turnCount).toBe(1);
      expect(sessionFingerprintCacheSize()).toBe(1);
    });
  });
});
