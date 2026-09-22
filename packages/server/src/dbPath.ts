/**
 * Where the database file lives, and the one environment lever that moves it.
 *
 * **Why this exists (Round 253).** `KLATCH_DB` has been the scratch-database
 * lever for as long as probes have needed one, but `db/index.ts` read it into a
 * module-scope `const` at import time. ESM hoists imports above statements, so
 * `index.ts`'s `import { getDb } from './db/index.js'` evaluated the whole db
 * module *before* `dotenv.config()` on line 25 ever ran. A `KLATCH_DB` line in
 * `.env` therefore never reached the database path at all.
 *
 * Driven rather than reasoned — `probe-round253-…mts` boots the real entrypoint
 * with a `KLATCH_DB` line in a shadowing `packages/server/.env` and no caller
 * value: at the parent of this commit the scratch file is never created and the
 * server opens the repo-root `klatch.db` instead. Arm A1 shows the mechanism
 * without dotenv in the picture at all — a value assigned to `process.env` after
 * the module is imported was simply ignored.
 *
 * The consequence was quiet because the environment and the file disagree in the
 * safe direction here: probes set `KLATCH_DB` in the real environment before
 * spawning, and that path always worked. Only the `.env` spelling was dead, and
 * `.env` is where a human would naturally reach first.
 *
 * **Resolution is now per-call, in `getDb()`.** Two things follow. A `.env` line
 * works, because `index.ts` calls `getDb()` after `dotenv.config()`. And a probe
 * may set `KLATCH_DB` after importing the module — the ordering constraint that
 * `round214-real-seed-path.test.ts:45` documents ("must be set before the first
 * import") is now a belt-and-braces comment rather than a requirement. Setting it
 * early still works; the connection is still cached after the first `getDb()`.
 *
 * **Unset, empty, or whitespace means unset**, matching `fromEnv` in `port.ts`
 * and `getExportRoot()` in `paths.ts`. Claude for Mac hands this process
 * `ANTHROPIC_API_KEY=""`, so an empty string is how this environment spells
 * absent.
 *
 * **Relative paths resolve against the process CWD**, which is what
 * `path.resolve` did before this file existed and is deliberately unchanged —
 * every probe in `scripts/` that passes a relative `KLATCH_DB` depends on it.
 */
import path from 'path';
import { getProjectRoot } from './paths.js';

/** The database used when `KLATCH_DB` is absent: `klatch.db` at the repo root. */
export function defaultDbPath(): string {
  return path.join(getProjectRoot(), 'klatch.db');
}

/**
 * Resolve the database path from an environment value.
 *
 * Pass `process.env.KLATCH_DB` at the moment the database is about to be opened,
 * not at module scope — reading it early is the defect this file was written to
 * remove.
 */
export function resolveDbPath(raw: string | undefined): string {
  const trimmed = raw?.trim();
  return trimmed ? path.resolve(trimmed) : defaultDbPath();
}
