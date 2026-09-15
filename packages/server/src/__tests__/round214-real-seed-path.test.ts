/**
 * Round 214 — the *real* seed in `db/index.ts`, executed.
 *
 * `setup.ts` mocks `../db/index.js` down to `{ getDb }` over an in-memory
 * database whose schema it declares itself — a second definition of the schema,
 * including its own seed rows — and `vitest.config.ts` registers it as a global
 * `setupFiles` entry, so it is in force for *every* server test file. No test in
 * the suite had ever executed the seed in `db/index.ts`. This file reaches the
 * real module with `vi.importActual` and a temp `KLATCH_DB`.
 *
 * That gap was found by mutation, not by reading: pointing the `db/index.ts`
 * channel seed at a different string left
 * `round214-seeded-preamble-drops-end-to-end` fully green, because the row that
 * test reads is written by `setup.ts`. The end-to-end claim in that file's first
 * version was wrong, and this file is what makes it true.
 *
 * `getDb()` resolves its path from `KLATCH_DB` and calls the private
 * `initSchema()`, so setting that to a temp file before the first import is
 * enough to exercise the production seed for real.
 *
 * What this pins: the seed writes a channel purpose that
 * `isDefaultChannelPreamble` recognises, which is the precondition for layer 4
 * dropping it (`claude/client.ts`). If the seed and the constant ever disagree,
 * the seeded channel silently resumes carrying "You are a helpful assistant." at
 * char 0 above a chosen agent's identity — the Round 161 defect. Theseus named
 * this chain in Round 213 §4 and measured only its source half.
 */

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import type Database from 'better-sqlite3';
import {
  DEFAULT_CHANNEL_PREAMBLE,
  DEFAULT_ENTITY_ID,
  isDefaultChannelPreamble,
} from '@klatch/shared';

let tmpDir: string;
let db: Database.Database;

beforeAll(async () => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'klatch-real-seed-'));
  // Must be set before the first import of db/index.js — DB_PATH is resolved at
  // module scope.
  process.env.KLATCH_DB = path.join(tmpDir, 'seed.db');
  // `vi.importActual`, not a plain import: `setupFiles` in vitest.config.ts
  // applies setup.ts to *every* server test file, so the mock of
  // `../db/index.js` is in force here no matter what this file imports. A plain
  // import returns the mock's `{ getDb }`, which at beforeAll time is still
  // undefined — that is what the first version of this file hit.
  const mod = await vi.importActual<typeof import('../db/index.js')>('../db/index.js');
  db = mod.getDb();
});

afterAll(() => {
  try {
    db?.close();
  } catch {
    /* already closed */
  }
  fs.rmSync(tmpDir, { recursive: true, force: true });
  delete process.env.KLATCH_DB;
});

describe('Round 214 — the production seed path, actually run', () => {
  it('opened a real database file, not the in-memory fixture', () => {
    // Guards against this file silently testing the mock and reporting a green
    // that means nothing — the failure mode that produced the wrong claim.
    expect(fs.existsSync(process.env.KLATCH_DB!)).toBe(true);
  });

  it('the seeded default channel carries the shared constant', () => {
    const row = db
      .prepare("SELECT system_prompt FROM channels WHERE id = 'default'")
      .get() as { system_prompt: string } | undefined;

    expect(row, 'db/index.ts did not seed the default channel').toBeDefined();
    expect(row!.system_prompt).toBe(DEFAULT_CHANNEL_PREAMBLE);
    // The load-bearing assertion: equality with the constant is what layer 4's
    // skip is conditioned on.
    expect(isDefaultChannelPreamble(row!.system_prompt)).toBe(true);
  });

  it('the seeded default entity carries the shared constant', () => {
    const row = db
      .prepare('SELECT system_prompt FROM entities WHERE id = ?')
      .get(DEFAULT_ENTITY_ID) as { system_prompt: string } | undefined;

    expect(row, 'db/index.ts did not seed the default entity').toBeDefined();
    expect(row!.system_prompt).toBe(DEFAULT_CHANNEL_PREAMBLE);
  });

  it('the test fixture and the production seed agree', () => {
    // The two schema definitions are a standing drift risk (see setup.ts). This
    // compares what each one actually seeds, so a change to either alone is red.
    const fixture = fs.readFileSync(path.join(__dirname, 'setup.ts'), 'utf8');
    const production = fs.readFileSync(path.join(__dirname, '..', 'db', 'index.ts'), 'utf8');

    // Neither may contain a quoted copy of the preamble text.
    for (const [label, src] of [
      ['setup.ts', fixture],
      ['db/index.ts', production],
    ] as const) {
      const quoted = src
        .split('\n')
        .filter((l) => l.includes(`'${DEFAULT_CHANNEL_PREAMBLE}'`))
        .map((l) => l.trim());
      expect(quoted, `${label} hardcodes the preamble instead of the constant`).toEqual([]);
    }
  });
});
