/**
 * Round 239: the fingerprint cache gets an endpoint-reachable off switch.
 *
 * `probe-fingerprint-cache-endpoint.mts` asks what the Round 147 cache is worth at
 * `GET /import/claude-code/sessions`, and its arm C answers by A/B-ing today's build
 * against the one that predates the cache — `git show dba7699^` written over
 * `session-scanner.ts` for the duration of one server generation.
 *
 * That workaround carries the three costs Round 237 named for the cap patch, plus a
 * fourth specific to restoring a *commit*: a wholesale historical restore un-ships
 * everything else that landed in the file since, so it measures
 * cache+cap+multi-root+export-root and reports the difference as the cache. Round 159
 * made that exact argument about `probe-browse-endpoint-vs-channel-count`'s arm S and
 * replaced its wholesale restore with a validated inverse transform.
 *
 * The fourth cost is also what killed the probe. To keep the A/B clean it refuses
 * unless the scanner on disk is byte-identical to `dba7699` — so every later commit to
 * that file disarms it. Verified this round: it has exited 1 at the guard since
 * `18d46318` (2026-09-04), one day after it was written, and a refusal reads in a
 * sweep exactly like a probe nobody ran.
 *
 * `KLATCH_FINGERPRINT_CACHE` is the lever. These tests pin the properties that make it
 * usable as one, and 5 and 6 are the ones a probe would otherwise discover by
 * reporting a measurement of the configuration it did not choose.
 *
 * 1. THE DEFAULT IS UNCHANGED. Unset, empty or whitespace: enabled, byte-identical
 *    to before.
 *
 * 2. AN EXPLICIT ARGUMENT STILL WINS. The variable moves the *default*; it does not
 *    reach past a caller who named a mode.
 *
 * 3. READ PER CALL. A probe sets the variable when it spawns the server, which may be
 *    after this module is imported in-process. A value captured at module load would
 *    make the lever silently inert depending on import order — the failure that
 *    `getExportRoot()` and `resolveFingerprintLineCap()` were both written to avoid.
 *
 * 4. UNRECOGNISED VALUES THROW — never a fall back to enabled. At the wire the throw
 *    surfaces as a 500 whose `detail` names the variable.
 *
 * 5. OFF MEANS NEITHER READ NOR WRITE. The pre-cache build had no `get` and no `set`.
 *    An "off" that still populated the map would pay the insert the A/B exists to
 *    remove, and would leave entries a later on-run would serve. Both halves are
 *    pinned separately, because an implementation that skipped only the read would
 *    pass every timing check and still be wrong.
 *
 * 6. IT REACHES THE ENDPOINT, AND THE PROOF IS THE CACHE SIZE. `sessionFingerprintCacheSize()`
 *    stays 0 across two browses with the lever off. "The variable was set" is as weak
 *    a claim as "the file was patched" — the observable effect is the evidence.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import './setup.js';
import { createTestApp } from './app.js';
import fs from 'fs';
import os from 'os';
import path from 'path';
import {
  resolveFingerprintCacheEnabled,
  getSessionFingerprint,
  clearSessionFingerprintCache,
  sessionFingerprintCacheSize,
} from '../import/session-scanner.js';

vi.mock('../claude/client.js', () => ({ streamClaude: vi.fn() }));

const SESSION_ID = 'aaaaaaaa-bbbb-cccc-dddd-000000000239';
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
  cache: process.env.KLATCH_FINGERPRINT_CACHE,
  cap: process.env.KLATCH_FINGERPRINT_LINE_CAP,
  configDir: process.env.CLAUDE_CONFIG_DIR,
  extraRoots: process.env.KLATCH_EXTRA_SESSION_ROOTS,
  exportRoot: process.env.KLATCH_EXPORT_ROOT,
};

beforeEach(() => {
  clearSessionFingerprintCache();
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'klatch-round239-'));
  delete process.env.KLATCH_FINGERPRINT_CACHE;
  delete process.env.KLATCH_FINGERPRINT_LINE_CAP;
});

afterEach(() => {
  // Restore rather than delete: these are real levers an ambient environment may
  // legitimately have set, and this suite is not the only thing in the process.
  if (envBefore.cache === undefined) delete process.env.KLATCH_FINGERPRINT_CACHE;
  else process.env.KLATCH_FINGERPRINT_CACHE = envBefore.cache;
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

describe('resolveFingerprintCacheEnabled: the default is unchanged', () => {
  it('is enabled when the variable is unset', () => {
    expect(resolveFingerprintCacheEnabled()).toBe(true);
  });

  it('is enabled when the variable is empty or whitespace', () => {
    process.env.KLATCH_FINGERPRINT_CACHE = '';
    expect(resolveFingerprintCacheEnabled()).toBe(true);
    process.env.KLATCH_FINGERPRINT_CACHE = '   ';
    expect(resolveFingerprintCacheEnabled()).toBe(true);
  });
});

describe('resolveFingerprintCacheEnabled: the spellings a probe author would reach for', () => {
  // A lever nobody can spell is a lever that gets patched around instead. Each of
  // these is a form that appears in the existing probe corpus or in a shell.
  it.each(['off', 'OFF', 'Off', '0', 'false', 'FALSE', 'no', ' off '])('%j disables the cache', (value) => {
    process.env.KLATCH_FINGERPRINT_CACHE = value;
    expect(resolveFingerprintCacheEnabled()).toBe(false);
  });

  it.each(['on', 'ON', '1', 'true', 'TRUE', 'yes', ' on '])('%j enables the cache', (value) => {
    process.env.KLATCH_FINGERPRINT_CACHE = value;
    expect(resolveFingerprintCacheEnabled()).toBe(true);
  });
});

describe('resolveFingerprintCacheEnabled: read per call', () => {
  it('follows the variable when it changes after module load', () => {
    // This module was imported at the top of the file. If the value had been
    // captured then, this test could not move it — which is exactly the way the
    // lever would be inert for a probe that sets the variable when it spawns its
    // server rather than before the import.
    expect(resolveFingerprintCacheEnabled()).toBe(true);
    process.env.KLATCH_FINGERPRINT_CACHE = 'off';
    expect(resolveFingerprintCacheEnabled()).toBe(false);
    process.env.KLATCH_FINGERPRINT_CACHE = 'on';
    expect(resolveFingerprintCacheEnabled()).toBe(true);
  });
});

describe('resolveFingerprintCacheEnabled: unrecognised values throw', () => {
  it.each(['maybe', 'disabled', 'enabled', '2', '-1', 'o ff'])('%j throws rather than falling back', (value) => {
    process.env.KLATCH_FINGERPRINT_CACHE = value;
    expect(() => resolveFingerprintCacheEnabled()).toThrow(/KLATCH_FINGERPRINT_CACHE/);
  });

  it('names the offending value and refuses the fall back in the message', () => {
    process.env.KLATCH_FINGERPRINT_CACHE = 'disabled';
    expect(() => resolveFingerprintCacheEnabled()).toThrow(/disabled/);
    expect(() => resolveFingerprintCacheEnabled()).toThrow(/Refusing to fall back/);
  });

  it('never returns a value on a bad input', () => {
    process.env.KLATCH_FINGERPRINT_CACHE = 'maybe';
    let returned: boolean | null = null;
    try { returned = resolveFingerprintCacheEnabled(); } catch { /* expected */ }
    expect(returned).toBeNull();
  });
});

describe('off means neither read nor write', () => {
  it('does not populate the cache', async () => {
    const file = writeSession(tmp, SESSION_ID, TURNS);
    const stat = fs.statSync(file);

    process.env.KLATCH_FINGERPRINT_CACHE = 'off';
    await getSessionFingerprint(file, stat);
    await getSessionFingerprint(file, stat);

    // The write half. An implementation that skipped only the read would leave 1
    // here, pay the insert on every call, and pass every timing check this probe
    // makes — which is why this is pinned apart from the read half below.
    expect(sessionFingerprintCacheSize()).toBe(0);
  });

  it('does not serve an entry another run already cached', async () => {
    const file = writeSession(tmp, SESSION_ID, TURNS);
    const stat = fs.statSync(file);

    const cached = await getSessionFingerprint(file, stat);
    expect(sessionFingerprintCacheSize()).toBe(1);

    // The read half: same path, same mtime, same size — every key the cache
    // validates on matches. With the cache on this returns the identical object.
    process.env.KLATCH_FINGERPRINT_CACHE = 'off';
    const uncached = await getSessionFingerprint(file, stat);
    expect(uncached).not.toBe(cached);

    // Recomputed, not reused — and the same answer, which is the property that
    // makes the A/B a measurement of cost rather than of behaviour.
    expect(uncached.messageCount).toBe(cached.messageCount);
    expect(uncached.turnCount).toBe(cached.turnCount);
    expect(uncached.firstUserMessage).toBe(cached.firstUserMessage);
    expect(uncached.capped).toBe(cached.capped);
  });

  it('leaves an existing entry alone rather than evicting it', async () => {
    const file = writeSession(tmp, SESSION_ID, TURNS);
    const stat = fs.statSync(file);

    const cached = await getSessionFingerprint(file, stat);
    process.env.KLATCH_FINGERPRINT_CACHE = 'off';
    await getSessionFingerprint(file, stat);

    // Off is a bypass, not a flush. A probe that turns the cache off for one
    // generation and on for the next is measuring two configurations of the same
    // process; an eviction would make the second one cold for a reason the probe
    // did not choose.
    expect(sessionFingerprintCacheSize()).toBe(1);
    process.env.KLATCH_FINGERPRINT_CACHE = 'on';
    expect(await getSessionFingerprint(file, stat)).toBe(cached);
  });

  it('an explicit argument still wins over the variable, both ways', async () => {
    const file = writeSession(tmp, SESSION_ID, TURNS);
    const stat = fs.statSync(file);

    // Variable off, argument on: caches.
    process.env.KLATCH_FINGERPRINT_CACHE = 'off';
    const first = await getSessionFingerprint(file, stat, undefined, true);
    expect(sessionFingerprintCacheSize()).toBe(1);
    expect(await getSessionFingerprint(file, stat, undefined, true)).toBe(first);

    // Variable on, argument off: bypasses.
    process.env.KLATCH_FINGERPRINT_CACHE = 'on';
    expect(await getSessionFingerprint(file, stat, undefined, false)).not.toBe(first);
  });

  it('the result is frozen in both modes, so nothing but reuse distinguishes them', async () => {
    const file = writeSession(tmp, SESSION_ID, TURNS);
    const stat = fs.statSync(file);

    const cached = await getSessionFingerprint(file, stat);
    process.env.KLATCH_FINGERPRINT_CACHE = 'off';
    const uncached = await getSessionFingerprint(file, stat);

    expect(Object.isFrozen(cached)).toBe(true);
    expect(Object.isFrozen(uncached)).toBe(true);
  });
});

describe('at the wire: a probe can turn the cache off without patching source', () => {
  /** A config dir laid out the way Claude Code lays one out, plus isolation. */
  function isolatedCorpus(turns: number): void {
    const configDir = path.join(tmp, 'config');
    writeSession(path.join(configDir, 'projects', '-tmp-round239'), SESSION_ID, turns);
    process.env.CLAUDE_CONFIG_DIR = configDir;
    delete process.env.KLATCH_EXTRA_SESSION_ROOTS;
    // The other half of the isolation, per Round 235 — without this the repo's own
    // exports/sessions/ arrives in the payload and the assertions below are about a
    // corpus this test did not build.
    process.env.KLATCH_EXPORT_ROOT = path.join(tmp, 'no-exports');
  }

  async function browse(): Promise<Response> {
    return createTestApp().request('/api/import/claude-code/sessions');
  }

  type Row = { sessionId: string; messageCount: number; turnCount: number; firstUserMessage: string };
  async function rows(res: Response): Promise<Row[]> {
    const body = await res.json() as { projects: { sessions: Row[] }[] };
    return body.projects.flatMap((p) => p.sessions);
  }

  it('two browses leave the cache empty with the lever off, and populated without it', async () => {
    isolatedCorpus(TURNS);

    process.env.KLATCH_FINGERPRINT_CACHE = 'off';
    expect((await browse()).status).toBe(200);
    expect((await browse()).status).toBe(200);
    // The arm the probe was restoring a 2026-09-04 commit to reach. Not "the
    // variable was set" — the cache is observably not being filled at the wire.
    expect(sessionFingerprintCacheSize()).toBe(0);

    delete process.env.KLATCH_FINGERPRINT_CACHE;
    expect((await browse()).status).toBe(200);
    expect(sessionFingerprintCacheSize()).toBe(1);
  });

  it('serves identical rows either way — the lever changes cost, not answers', async () => {
    isolatedCorpus(TURNS);

    const withCache = await rows(await browse());
    expect(withCache.map((s) => s.sessionId)).toEqual([SESSION_ID]);
    expect(withCache[0].messageCount).toBe(MESSAGES);

    process.env.KLATCH_FINGERPRINT_CACHE = 'off';
    const without = await rows(await browse());

    expect(without).toEqual(withCache);
  });

  it('a misconfigured variable is a 500 that names it, not a quietly wrong measurement', async () => {
    isolatedCorpus(TURNS);
    process.env.KLATCH_FINGERPRINT_CACHE = 'disabled';

    const res = await browse();
    expect(res.status).toBe(500);
    const body = await res.json() as { error: string; detail: string };
    expect(body.detail).toMatch(/KLATCH_FINGERPRINT_CACHE/);
    expect(body.detail).toMatch(/disabled/);
  });
});
