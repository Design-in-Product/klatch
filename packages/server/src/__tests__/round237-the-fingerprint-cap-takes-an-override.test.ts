/**
 * Round 237: the fingerprint line cap gets an endpoint-reachable lever.
 *
 * `extractSessionFingerprint(file, lineCap)` has always taken a cap, and that is
 * enough for a *test*, which imports the function. It is not enough for a probe
 * driving `GET /import/claude-code/sessions`: nothing between `fetch` and
 * `getSessionFingerprint` carries a cap, so four probes
 * (`probe-browse-cold-figure-gap`, `probe-pm-corpus-cap-delta`,
 * `probe-browse-latency-end-to-end`, `probe-round227-arm-o-…`) did the only thing
 * available — **wrote a patched `session-scanner.ts` to disk**, started a server
 * against it, and restored the file in a `finally`.
 *
 * Theseus named what that costs in Round 236. Every one of those patches is
 * guarded by a skip on "the literal is not the one I expect", and a skip makes
 * "this feature shipped" and "this arm is missing" indistinguishable in the
 * output — which is how two arms of `probe-browse-endpoint-second-corpus` went
 * quiet for fifteen days after the commit that retired their workaround. The
 * 2026-09-04 reformatting of this very constant (`50000` → `50_000`) had already
 * killed one probe outright and handed another a cap 1000x too small.
 *
 * `KLATCH_FINGERPRINT_LINE_CAP` is the lever. These tests pin the five properties
 * that make it usable as one, and the last two are the ones a probe would
 * otherwise discover by reporting a measurement of the wrong cap.
 *
 * 1. THE DEFAULT IS UNCHANGED. Unset, empty or whitespace: the shipped cap,
 *    byte-identical to before.
 *
 * 2. AN EXPLICIT ARGUMENT STILL WINS. The variable moves the *default*; it does
 *    not reach past a caller who named a cap. Every in-product call site takes the
 *    default, and the latency probes that pass one are measuring what they passed.
 *
 * 3. READ PER CALL. A probe sets the variable when it spawns the server, which
 *    may be after this module is imported in-process. A value captured at module
 *    load would make the lever silently inert depending on import order.
 *
 * 4. INVALID VALUES THROW — they never fall back to the shipped cap. A lever that
 *    quietly ignores what it was set to is worse than no lever: the probe measures
 *    50_000 and writes it down as 1_500. At the wire the throw surfaces as a 500
 *    whose `detail` names the variable.
 *
 * 5. IT REACHES THE ENDPOINT, AND PAST THE FINGERPRINT CACHE. The cache is keyed
 *    on `(path, mtime, size, lineCap)`, so moving the cap must miss it. If it did
 *    not, a probe measuring two caps in one process would get the first one twice.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import './setup.js';
import { createTestApp } from './app.js';
import fs from 'fs';
import os from 'os';
import path from 'path';
import {
  resolveFingerprintLineCap,
  extractSessionFingerprint,
  getSessionFingerprint,
  clearSessionFingerprintCache,
} from '../import/session-scanner.js';

vi.mock('../claude/client.js', () => ({ streamClaude: vi.fn() }));

/**
 * The shipped cap, pinned deliberately. `round33-session-fingerprint` pins it too;
 * if both fail together the constant moved, which should be a decision and not a
 * surprise. If only this one fails, the override stopped honouring the default.
 */
const SHIPPED_CAP = 50_000;

const SESSION_ID = 'aaaaaaaa-bbbb-cccc-dddd-000000000237';

/**
 * The fixture: 40 user/assistant pairs, so 80 lines and — this is the part worth
 * stating rather than assuming — `messageCount` **80**, not 40. It counts
 * messages, both roles, which is what makes it a lower bound under the cap.
 */
const TURNS = 40;
const MESSAGES = TURNS * 2;

/** A session file with `turns` user/assistant pairs — 2 lines each. */
function writeSession(dir: string, sessionId: string, turns: number): string {
  fs.mkdirSync(dir, { recursive: true });
  const lines: string[] = [];
  for (let i = 0; i < turns; i++) {
    lines.push(JSON.stringify({
      type: 'user', sessionId,
      message: { role: 'user', content: `question ${i} — long enough that the file clears the scanner's 100-byte floor` },
    }));
    lines.push(JSON.stringify({
      type: 'assistant', sessionId,
      message: { role: 'assistant', content: [{ type: 'text', text: `answer ${i}` }] },
    }));
  }
  const file = path.join(dir, `${sessionId}.jsonl`);
  fs.writeFileSync(file, lines.join('\n') + '\n');
  return file;
}

let tmp: string;
const envBefore = {
  cap: process.env.KLATCH_FINGERPRINT_LINE_CAP,
  configDir: process.env.CLAUDE_CONFIG_DIR,
  extraRoots: process.env.KLATCH_EXTRA_SESSION_ROOTS,
  exportRoot: process.env.KLATCH_EXPORT_ROOT,
};

beforeEach(() => {
  clearSessionFingerprintCache();
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'klatch-round237-'));
  delete process.env.KLATCH_FINGERPRINT_LINE_CAP;
});

afterEach(() => {
  // Restore rather than delete: these are real levers an ambient environment may
  // legitimately have set, and this suite is not the only thing in the process.
  if (envBefore.cap === undefined) delete process.env.KLATCH_FINGERPRINT_LINE_CAP;
  else process.env.KLATCH_FINGERPRINT_LINE_CAP = envBefore.cap;
  if (envBefore.configDir === undefined) delete process.env.CLAUDE_CONFIG_DIR;
  else process.env.CLAUDE_CONFIG_DIR = envBefore.configDir;
  if (envBefore.extraRoots === undefined) delete process.env.KLATCH_EXTRA_SESSION_ROOTS;
  else process.env.KLATCH_EXTRA_SESSION_ROOTS = envBefore.extraRoots;
  if (envBefore.exportRoot === undefined) delete process.env.KLATCH_EXPORT_ROOT;
  else process.env.KLATCH_EXPORT_ROOT = envBefore.exportRoot;
  clearSessionFingerprintCache();
  fs.rmSync(tmp, { recursive: true, force: true });
});

describe('resolveFingerprintLineCap: the default is unchanged', () => {
  it('is the shipped cap when the variable is unset', () => {
    expect(resolveFingerprintLineCap()).toBe(SHIPPED_CAP);
  });

  it('is the shipped cap when the variable is empty or whitespace', () => {
    // Same trim discipline as CLAUDE_CONFIG_DIR and KLATCH_EXPORT_ROOT.
    // `KLATCH_FINGERPRINT_LINE_CAP=` in a shell script means "I did not set
    // this", and `Number('')` is 0 — a cap of zero lines would fingerprint
    // nothing at all while looking like a deliberate setting.
    for (const value of ['', '   ', '\t\n']) {
      process.env.KLATCH_FINGERPRINT_LINE_CAP = value;
      expect(resolveFingerprintLineCap()).toBe(SHIPPED_CAP);
    }
  });
});

describe('resolveFingerprintLineCap: the override', () => {
  it('takes a plain integer', () => {
    process.env.KLATCH_FINGERPRINT_LINE_CAP = '1500';
    expect(resolveFingerprintLineCap()).toBe(1500);
  });

  it('reads every spelling of the same number', () => {
    // The lesson of scripts/lib/probe-source-constants.mts, applied on the way
    // in rather than on the way out: a probe setting this variable is naming a
    // value, not a spelling. `1_500` is what the constant itself looks like in
    // source, so it is the spelling a probe author is most likely to copy.
    for (const value of ['1500', '1_500', ' 1500 ', '1.5e3', '0x5DC']) {
      process.env.KLATCH_FINGERPRINT_LINE_CAP = value;
      expect(resolveFingerprintLineCap()).toBe(1500);
    }
  });

  it('is read on every call, not captured at module load', () => {
    // The property a probe depends on. This module was imported at the top of
    // this file, long before any of these assignments.
    expect(resolveFingerprintLineCap()).toBe(SHIPPED_CAP);
    process.env.KLATCH_FINGERPRINT_LINE_CAP = '7';
    expect(resolveFingerprintLineCap()).toBe(7);
    process.env.KLATCH_FINGERPRINT_LINE_CAP = '9';
    expect(resolveFingerprintLineCap()).toBe(9);
    delete process.env.KLATCH_FINGERPRINT_LINE_CAP;
    expect(resolveFingerprintLineCap()).toBe(SHIPPED_CAP);
  });
});

describe('resolveFingerprintLineCap: invalid values throw rather than falling back', () => {
  it.each([
    ['abc', 'not a number at all'],
    ['0', 'a cap of zero lines'],
    ['-5', 'a negative cap'],
    ['1.5', 'a fraction of a line'],
    ['1e400', 'Infinity'],
    ['9007199254740992', 'past Number.MAX_SAFE_INTEGER'],
    ['50_000 lines', 'a number with a unit glued on'],
  ])('rejects %j (%s)', (value) => {
    process.env.KLATCH_FINGERPRINT_LINE_CAP = value;
    expect(() => resolveFingerprintLineCap()).toThrow(/KLATCH_FINGERPRINT_LINE_CAP/);
    // And it says what it refused, so the operator does not have to guess which
    // of several environment variables the 500 came from.
    expect(() => resolveFingerprintLineCap()).toThrow(new RegExp(value.split(' ')[0].replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  });

  it('does not silently return the shipped cap for a bad value', () => {
    // The failure this guard exists to prevent, stated as an assertion: a probe
    // that sets 1_500 and gets 50_000 back measures the wrong cap and reports
    // the right one.
    process.env.KLATCH_FINGERPRINT_LINE_CAP = 'fifteen hundred';
    let returned: number | null = null;
    try { returned = resolveFingerprintLineCap(); } catch { /* expected */ }
    expect(returned).toBeNull();
  });
});

describe('the fingerprint honours the override', () => {
  it('caps at the overridden value, and does not at the shipped one', async () => {
    const file = writeSession(tmp, SESSION_ID, TURNS); // 80 lines

    const uncapped = await extractSessionFingerprint(file);
    expect(uncapped.capped).toBe(false);
    expect(uncapped.messageCount).toBe(MESSAGES);

    process.env.KLATCH_FINGERPRINT_LINE_CAP = '10';
    const capped = await extractSessionFingerprint(file);
    expect(capped.capped).toBe(true);
    // A lower bound, which is what `capped` means.
    expect(capped.messageCount).toBeLessThan(uncapped.messageCount);
  });

  it('an explicit lineCap argument still wins over the variable', async () => {
    const file = writeSession(tmp, SESSION_ID, TURNS);
    process.env.KLATCH_FINGERPRINT_LINE_CAP = '10';

    // The three latency probes that pass a cap are measuring the cap they passed;
    // an environment variable reaching past them would silently confound exactly
    // the measurement this lever exists to serve.
    const explicit = await extractSessionFingerprint(file, 1_000);
    expect(explicit.capped).toBe(false);
    expect(explicit.messageCount).toBe(MESSAGES);
  });

  it('moving the cap misses the fingerprint cache rather than reusing the old answer', async () => {
    const file = writeSession(tmp, SESSION_ID, TURNS);
    const stat = fs.statSync(file);

    const first = await getSessionFingerprint(file, stat);
    expect(first.capped).toBe(false);

    // Same path, same mtime, same size — everything the cache keys on except the
    // cap. If `lineCap` were not part of the key this would return `first`.
    process.env.KLATCH_FINGERPRINT_LINE_CAP = '10';
    const second = await getSessionFingerprint(file, stat);
    expect(second.capped).toBe(true);
    expect(second).not.toBe(first);

    // And back: the first answer is still correct for the first cap.
    delete process.env.KLATCH_FINGERPRINT_LINE_CAP;
    const third = await getSessionFingerprint(file, stat);
    expect(third.capped).toBe(false);
  });
});

describe('at the wire: a probe can move the cap without patching source', () => {
  /** A config dir laid out the way Claude Code lays one out, plus isolation. */
  function isolatedCorpus(turns: number): void {
    const configDir = path.join(tmp, 'config');
    writeSession(path.join(configDir, 'projects', '-tmp-round237'), SESSION_ID, turns);
    process.env.CLAUDE_CONFIG_DIR = configDir;
    delete process.env.KLATCH_EXTRA_SESSION_ROOTS;
    // The other half of the isolation, per Round 235 — without this the repo's
    // own exports/sessions/ arrives in the payload and the assertions below are
    // about a corpus this test did not build.
    process.env.KLATCH_EXPORT_ROOT = path.join(tmp, 'no-exports');
  }

  async function browse(): Promise<Response> {
    return createTestApp().request('/api/import/claude-code/sessions');
  }

  it('the endpoint reports fingerprintCapped under the override and not without it', async () => {
    isolatedCorpus(TURNS);

    const before = await browse();
    expect(before.status).toBe(200);
    const bodyBefore = await before.json() as {
      projects: { sessions: { sessionId: string; fingerprintCapped?: boolean; messageCount: number }[] }[];
    };
    const sessionsBefore = bodyBefore.projects.flatMap((p) => p.sessions);
    expect(sessionsBefore.map((s) => s.sessionId)).toEqual([SESSION_ID]);
    expect(sessionsBefore[0].fingerprintCapped).toBeUndefined();
    expect(sessionsBefore[0].messageCount).toBe(MESSAGES);

    clearSessionFingerprintCache();
    process.env.KLATCH_FINGERPRINT_LINE_CAP = '10';

    const after = await browse();
    expect(after.status).toBe(200);
    const bodyAfter = await after.json() as {
      projects: { sessions: { sessionId: string; fingerprintCapped?: boolean; messageCount: number }[] }[];
    };
    const sessionsAfter = bodyAfter.projects.flatMap((p) => p.sessions);
    expect(sessionsAfter.map((s) => s.sessionId)).toEqual([SESSION_ID]);
    // The whole point of the round: this line is the arm that four probes were
    // rewriting shipped source to reach.
    expect(sessionsAfter[0].fingerprintCapped).toBe(true);
    expect(sessionsAfter[0].messageCount).toBeLessThan(MESSAGES);
  });

  it('a misconfigured variable is a 500 that names it, not a quietly wrong measurement', async () => {
    isolatedCorpus(TURNS);
    process.env.KLATCH_FINGERPRINT_LINE_CAP = 'not-a-number';

    const res = await browse();
    expect(res.status).toBe(500);
    const body = await res.json() as { error: string; detail: string };
    expect(body.detail).toMatch(/KLATCH_FINGERPRINT_LINE_CAP/);
    expect(body.detail).toMatch(/not-a-number/);
  });
});
