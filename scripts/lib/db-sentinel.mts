/**
 * A content bracket over the database files a probe must not touch — read from the FILESYSTEM,
 * deliberately not from git.
 *
 * Round 287, Daedalus, 2026-09-28 (START fire). Written because Theseus's Round 286 §6 handed this
 * seat "the forced-drive judgement calls on the 72 `db`-flagged DEFERRED probes", and the honest
 * answer to that request turned out to be that **the judgement cannot be made yet**, for a reason
 * that is a property of the sandbox rather than of any one probe.
 *
 * ── Why `tree-fingerprint.mts` cannot be the instrument here ─────────────────
 *
 * The promotion path already brackets every drive with {@link fingerprint} over `scripts/` and
 * `packages/`. That module is excellent at what it grades and it is structurally incapable of
 * grading this one, for TWO independent reasons — and the second is the one that matters, because
 * it survives the obvious fix:
 *
 *   1. **Scope.** The real database is `klatch.db` at the REPO ROOT (`defaultDbPath()` in
 *      `packages/server/src/dbPath.ts`). That is under neither fingerprinted pathspec. Widening
 *      the pathspec is the obvious repair and it is a trap, because —
 *
 *   2. **Kind.** `fingerprint()` is built entirely on `git status --porcelain -uall` and
 *      `git diff HEAD`. `.gitignore` line 3 is `*.db`. Git does not list ignored paths in
 *      `status` without `--ignored`, so *every* term of the fingerprint — `P:`, `D:`, and `U:` —
 *      is empty for a database file no matter which pathspec you hand it. A widened pathspec
 *      therefore yields a check that **cannot go red**: the vacuous-check shape this fleet has
 *      now found in five rounds. `probe-round287` drives both halves rather than asserting them.
 *
 * And the two reasons compose into the thing that makes this worth a module rather than a note:
 * **the one asset the sandbox cannot see is also the one asset git cannot restore.** `klatch.db`
 * is ignored and untracked, so there is no `git checkout --` for it. A probe that corrupts it
 * destroys state with no version-controlled copy behind it.
 *
 * ── What is graded and what is only reported ─────────────────────────────────
 *
 * The split matches `tree-fingerprint`'s own "the window is a measurement, what the run did is a
 * check":
 *
 *   **graded**  — every database file OUTSIDE `.testdata/`. Today that set is exactly one file,
 *                 repo-root `klatch.db`. A probe moving one of these is a finding.
 *   **scratch** — every database file UNDER `.testdata/`, the sanctioned scratch area (`.gitignore`
 *                 calls it "by definition disposable"). Probes are *supposed* to write here, so
 *                 movement is reported as a measurement and never graded.
 *
 * The set is computed by walking the tree, not by grepping a list, so a database that appears in a
 * new location is graded from the moment it exists rather than from the moment someone remembers
 * to add it.
 *
 * ── Why `-wal` and `-shm` are in the set ─────────────────────────────────────
 *
 * `getDb()` runs `db.pragma('journal_mode = WAL')`. Under WAL a committed write lands in the
 * `-wal` sidecar and the main `.db` file's bytes need not change until a checkpoint. A sentinel
 * that hashed only `*.db` would therefore report "unchanged" across a drive that had just written
 * rows — the same false-green shape this module exists to remove, one layer down. `.gitignore`
 * lists `*.db-wal` and `*.db-shm` on their own lines for the same underlying reason.
 *
 * Read-only: this module stats and reads files. It never writes.
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { createHash } from 'node:crypto';

/** One database file as it stood at a moment. */
export type DbSnapshot = {
  /** Repo-relative, `/`-separated. */
  path: string;
  bytes: number;
  /** Content hash, or — for an oversized SCRATCH file only — a `size:mtime` identity. See `hashed`. */
  sha: string;
  /** True when `sha` is a content hash. False means `sha` is the weaker `size:mtime` identity. */
  hashed: boolean;
};

export type DbState = {
  /** Outside `.testdata/` — movement here is a finding. */
  graded: DbSnapshot[];
  /** Under `.testdata/` — movement here is expected, and is reported, never graded. */
  scratch: DbSnapshot[];
};

/** Directories never descended into. `.testdata` IS descended — its contents are the scratch set. */
const PRUNE = new Set(['node_modules', '.git', 'dist', '.claude']);

/** A SQLite database or one of its WAL sidecars. See the module note on why the sidecars count. */
const isDbFile = (name: string): boolean => /\.db(-wal|-shm)?$/.test(name);

const sha256 = (b: Buffer): string => createHash('sha256').update(b).digest('hex').slice(0, 16);

/**
 * Above this size a SCRATCH file is identified by `size:mtime` instead of by content.
 *
 * Measured rather than guessed, on this repo, 2026-09-28: a full content hash of all 276 database
 * files is **235 ms**; capping at 8 MB makes it **42 ms**. The driver takes two snapshots per drive
 * and two drives per probe, so the uncapped cost is ~1 s of pure overhead per probe examined —
 * enough that someone would eventually turn the sentinel off, which is the real failure mode.
 *
 * Nine files exceed the cap and they account for 215 of the 278 MB; they are static size fixtures
 * (`.testdata/r197/s/size-64mb.db` and siblings). **The cap is never applied to the GRADED set**,
 * whatever its size — that set is the evidence predicate 8 rests on, and it is 0.5 MB today.
 * Weakening the safety-critical half to save time on the reported half would be the wrong trade in
 * exactly the direction this module exists to prevent.
 */
const SCRATCH_HASH_LIMIT = 8 * 1024 * 1024;

/**
 * Every database file under `repo`, split into graded and scratch.
 *
 * Walked with `readdirSync` rather than matched with a glob or a grep: a directory walk answers
 * "what is on disk", which is the question, and it cannot miss a file for the reason a pattern
 * can. Unreadable entries are skipped rather than thrown on — a sentinel that crashes on a
 * permission error would convert a safety instrument into an outage.
 *
 * @param repo absolute path to the repository root
 */
export function snapshot(repo: string): DbState {
  const graded: DbSnapshot[] = [];
  const scratch: DbSnapshot[] = [];

  const walk = (dir: string): void => {
    let entries: ReturnType<typeof readdirSync>;
    try {
      entries = readdirSync(dir, { withFileTypes: true }) as never;
    } catch {
      return; // unreadable directory: a missed entry, not a crash
    }
    for (const e of entries as unknown as { name: string; isDirectory(): boolean; isFile(): boolean }[]) {
      const abs = join(dir, e.name);
      if (e.isDirectory()) {
        if (!PRUNE.has(e.name)) walk(abs);
        continue;
      }
      if (!e.isFile() || !isDbFile(e.name)) continue;
      try {
        const rel = relative(repo, abs).split(sep).join('/');
        const isScratch = rel.startsWith('.testdata/');
        const st = statSync(abs);
        // The cap applies to scratch only; a graded file is hashed whatever its size.
        const cap = isScratch && st.size > SCRATCH_HASH_LIMIT;
        const snap: DbSnapshot = cap
          ? { path: rel, bytes: st.size, sha: `size:${st.size}:mtime:${st.mtimeMs}`, hashed: false }
          : { path: rel, bytes: st.size, sha: sha256(readFileSync(abs)), hashed: true };
        (isScratch ? scratch : graded).push(snap);
      } catch {
        // A file that vanished between readdir and read is a race with a concurrent fire, not a
        // finding. Skipping it is the conservative direction: it cannot manufacture a false red.
      }
    }
  };

  walk(repo);
  const byPath = (a: DbSnapshot, b: DbSnapshot): number => a.path.localeCompare(b.path);
  return { graded: graded.sort(byPath), scratch: scratch.sort(byPath) };
}

export type DbDelta = {
  /** Present in both snapshots with different contents. */
  changed: string[];
  /** Present only in the later snapshot. */
  appeared: string[];
  /** Present only in the earlier snapshot. */
  vanished: string[];
};

/** True when nothing in the delta moved. */
export const unchanged = (d: DbDelta): boolean =>
  d.changed.length === 0 && d.appeared.length === 0 && d.vanished.length === 0;

/**
 * Compare two snapshots of the same set. Content is compared by `sha`, not by `bytes` or `mtime`:
 * an equal-length overwrite is the case a size check misses, and mtime is the case a filesystem
 * can round away.
 */
export function compare(before: DbSnapshot[], after: DbSnapshot[]): DbDelta {
  const b = new Map(before.map((s) => [s.path, s.sha]));
  const a = new Map(after.map((s) => [s.path, s.sha]));
  const changed: string[] = [];
  const appeared: string[] = [];
  const vanished: string[] = [];

  for (const [p, sha] of a) {
    if (!b.has(p)) appeared.push(p);
    else if (b.get(p) !== sha) changed.push(p);
  }
  for (const p of b.keys()) if (!a.has(p)) vanished.push(p);

  return { changed: changed.sort(), appeared: appeared.sort(), vanished: vanished.sort() };
}

/** A one-line human summary of a delta, for a probe or driver to print. */
export const describe = (d: DbDelta): string =>
  unchanged(d)
    ? 'unchanged'
    : [
        d.changed.length ? `changed: ${d.changed.join(', ')}` : '',
        d.appeared.length ? `appeared: ${d.appeared.join(', ')}` : '',
        d.vanished.length ? `vanished: ${d.vanished.join(', ')}` : '',
      ]
        .filter(Boolean)
        .join(' · ');
