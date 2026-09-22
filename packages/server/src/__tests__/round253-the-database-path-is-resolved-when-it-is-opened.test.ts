/**
 * Round 253 — `KLATCH_DB` is read when the database is opened, not when the
 * module is imported.
 *
 * **The defect.** `db/index.ts` resolved its path into a module-scope `const`.
 * ESM hoists imports above statements, so `index.ts`'s
 * `import { getDb } from './db/index.js'` ran that whole module *before*
 * `dotenv.config()` on line 25 — and a `KLATCH_DB` line in `.env` therefore never
 * reached the database path. Driven end to end by
 * `scripts/probe-round253-the-env-file-cannot-reach-the-database-path.mts`: at the
 * parent of this commit, booting the real entrypoint with `KLATCH_DB` in a
 * shadowing `packages/server/.env` and no caller value creates nothing and opens
 * the repo-root `klatch.db` instead.
 *
 * **Every arm here asserts the invariant the remedy establishes, not the defect
 * it removes** — Theseus's Round 252 §4 rule, written about two arms of his own
 * that were scheduled to break on success, in the same colour they would break on
 * regression. "The path is resolved when the database is opened" survives every
 * future fix; "the path is frozen at import" would have to die of one.
 *
 * The one thing this file cannot do is bring up the real entrypoint with a
 * `.env`: `findEnv()` reads a file on disk, and writing `packages/server/.env`
 * from inside `npm test` would race any other test and any running `npm run dev`.
 * That arm lives in the probe, which owns the scratch file and removes it. What
 * is scheduled here is the mechanism the probe's A3 depends on — and the
 * precedence rule in `index.ts`, read rather than driven, labelled as such.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { resolveDbPath, defaultDbPath } from '../dbPath.js';

let tmp: string;
const savedEnv = process.env.KLATCH_DB;

beforeEach(() => {
  // realpathSync, not the raw mkdtemp result: on macOS `os.tmpdir()` is `/var/…`,
  // a symlink to `/private/var/…`, and SQLite's `PRAGMA database_list` reports the
  // resolved path. Comparing the two spellings failed this file's first run — a
  // fault in the arm, not in the product.
  tmp = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'klatch-r253-')));
});

afterEach(() => {
  fs.rmSync(tmp, { recursive: true, force: true });
  if (savedEnv === undefined) delete process.env.KLATCH_DB;
  else process.env.KLATCH_DB = savedEnv;
});

describe('resolveDbPath — the pure resolver', () => {
  it('returns the repo-root klatch.db when KLATCH_DB is absent', () => {
    expect(resolveDbPath(undefined)).toBe(defaultDbPath());
    expect(defaultDbPath().endsWith(`${path.sep}klatch.db`)).toBe(true);
  });

  it.each([
    ['empty string', ''],
    ['whitespace only', '   '],
    ['a tab', '\t'],
  ])('treats %s as absent, matching fromEnv in port.ts', (_label, raw) => {
    // Claude for Mac hands this process ANTHROPIC_API_KEY="", so an empty string
    // is how this environment spells absent. A blank KLATCH_DB resolving to a
    // file literally named "" would be a silent, unrecoverable mess.
    expect(resolveDbPath(raw)).toBe(defaultDbPath());
  });

  it('honours an absolute path exactly', () => {
    const p = path.join(tmp, 'explicit.db');
    expect(resolveDbPath(p)).toBe(p);
  });

  it('trims surrounding whitespace rather than resolving a padded path', () => {
    const p = path.join(tmp, 'padded.db');
    expect(resolveDbPath(`  ${p}  `)).toBe(p);
  });

  it('resolves a relative path against the process CWD', () => {
    // Deliberately unchanged from the module-scope version: probes in scripts/
    // pass relative KLATCH_DB values and depend on this.
    expect(resolveDbPath('.testdata/rel.db')).toBe(path.resolve('.testdata/rel.db'));
  });
});

describe('getDb — resolution happens at the call, which is what makes .env work', () => {
  /**
   * `setup.ts` is registered as a global `setupFiles` entry and mocks
   * `../db/index.js` down to `{ getDb }` over an in-memory database, for *every*
   * server test file. `vi.importActual` is the only way to reach the real module
   * — the same technique, and the same reason, as
   * `round214-real-seed-path.test.ts`.
   */
  const actualDb = () => vi.importActual<typeof import('../db/index.js')>('../db/index.js');

  it('opens the file named by KLATCH_DB as it stood when getDb() was called', async () => {
    // The assignment happens AFTER the module is imported. Under the module-scope
    // version this value was ignored and the repo-root klatch.db was opened
    // instead — which is precisely why this arm must never write a real path.
    vi.resetModules();
    const mod = await actualDb();
    const target = path.join(tmp, 'late.db');
    process.env.KLATCH_DB = target;

    const db = mod.getDb();
    try {
      const rows = db.prepare('PRAGMA database_list').all() as Array<{ file: string }>;
      expect(rows[0].file).toBe(target);
      expect(fs.existsSync(target)).toBe(true);
    } finally {
      db.close();
    }
  });

  it('caches the connection: a KLATCH_DB changed after the first getDb() does not move it', async () => {
    // Not a defect and not an accident — `db` is a module-level singleton and the
    // whole server shares it. Pinned so that a future change to resolution timing
    // has to decide about this on purpose rather than discover it in production.
    vi.resetModules();
    const mod = await actualDb();
    const first = path.join(tmp, 'first.db');
    process.env.KLATCH_DB = first;
    const db = mod.getDb();

    try {
      process.env.KLATCH_DB = path.join(tmp, 'second.db');
      const again = mod.getDb();
      expect(again).toBe(db);
      const rows = again.prepare('PRAGMA database_list').all() as Array<{ file: string }>;
      expect(rows[0].file).toBe(first);
      expect(fs.existsSync(path.join(tmp, 'second.db'))).toBe(false);
    } finally {
      db.close();
    }
  });
});

describe('index.ts — precedence, read not driven', () => {
  // Labelled honestly: this is a source read. Driving it needs a `.env` file on
  // disk, which is the probe's job (arm A2). What it guards is the pair of lines
  // being deleted or reordered, which is the realistic regression.
  const source = fs.readFileSync(new URL('../index.ts', import.meta.url), 'utf8');

  it("captures the caller's KLATCH_DB above the dotenv.config() that would clobber it", () => {
    const capture = source.indexOf('const dbFromCaller = process.env.KLATCH_DB');
    const dotenv = source.indexOf('dotenv.config(');
    expect(capture, 'the pre-dotenv KLATCH_DB capture is gone').toBeGreaterThan(-1);
    expect(dotenv).toBeGreaterThan(-1);
    expect(capture).toBeLessThan(dotenv);
  });

  it('restores it after dotenv and before getDb() opens anything', () => {
    const restore = source.indexOf('process.env.KLATCH_DB = dbFromCaller');
    const dotenv = source.indexOf('dotenv.config(');
    // The CALL, anchored to the start of a line. `indexOf('getDb()')` found the
    // string inside a comment forty lines above the call and failed this arm on
    // its first run — a source-reading arm that cannot tell code from prose is
    // worse than no arm, because it reports a real ordering as broken.
    const open = source.search(/^getDb\(\);$/m);
    expect(restore, 'the caller-precedence restore is gone').toBeGreaterThan(-1);
    expect(open, 'the getDb() call site moved or changed shape').toBeGreaterThan(-1);
    expect(restore).toBeGreaterThan(dotenv);
    expect(restore).toBeLessThan(open);
  });
});
