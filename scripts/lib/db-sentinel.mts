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
 *   **graded**  — every database file OUTSIDE `.testdata/`. A probe moving one of these is a finding.
 *                 This note said "exactly one file, repo-root `klatch.db`" from Round 287 until
 *                 Round 291 measured it: on Daedalus's tree it is **six**, and three of the six are
 *                 gitignored backup copies the old name predicate did not match. See {@link isDbFile}.
 *                 The count is machine-local and decays — treat it as a measurement, never a claim.
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

/**
 * Suffixes that sit after a `.db` stem but name a *report about* a database rather than a database.
 *
 * Measured on this tree, Round 291: of the 330 files carrying a `.db.`/`.db-` infix, 66 are
 * `klatch.db.backfill-<timestamp>.json` — the backfill tool's own record of what it changed. Pulling
 * those into the set would be the mirror of the miss below: a wider rule that grades the wrong
 * files. They are excluded by extension, and `probe-round291` arm B drives them as known negatives.
 */
const NON_DB_SUFFIX = /\.(json|log|txt|md|csv)$/i;

/**
 * A SQLite database or one of its WAL sidecars. See the module note on why the sidecars count.
 *
 * ── Round 291, Daedalus, 2026-09-28 (STOP fire): why this is not just `/\.db$/` ──
 *
 * The rule shipped in Round 287 was `/\.db(-wal|-shm)?$/`, and it had a hole of exactly the kind
 * this module was written to close. Three files on this tree are byte-for-byte copies of the real
 * database and matched none of those alternatives, because their names do not *end* at `.db`:
 *
 *   klatch.db.backup-pre-round227-cleanup-20260918      425,984 bytes
 *   backups/klatch.db.backup-2026-03-14                5,230,592 bytes
 *   backups/klatch.db.backup-2026-03-15-pre-fresh        335,872 bytes
 *
 * They do **not** all sit in the same recovery class, and the first draft of this note said they did.
 * I read `.gitignore` — `*.db.backup*` on line 11, `backups/` on its own line — and wrote "all three
 * are gitignored". `probe-round291` arm C asked git instead, and the partition is:
 *
 *   - `klatch.db.backup-pre-round227-cleanup-20260918` — ignored **and untracked**. 0.42 MB that git
 *     genuinely cannot restore. This is the module note's own criterion, verbatim: *"the one asset
 *     the sandbox cannot see is also the one asset git cannot restore."* It is comparable in size to
 *     the 0.45 MB of `klatch.db` the rule did grade — so the unrecoverable bytes inside the bracket
 *     and outside it were roughly **equal**, and half of them were unwatched.
 *   - `backups/klatch.db.backup-2026-03-14` and `…-03-15-pre-fresh` — **tracked**, 5.44 MB. A tracked
 *     file is never ignored, which is why `check-ignore` disagreed with my reading of the file.
 *     `git checkout --` restores both, so destroying them is recoverable.
 *
 * The tracked pair is still worth grading, for a reason that is not about restorability: `fingerprint()`
 * is called only as `fingerprint(repo, 'scripts/')` and `fingerprint(repo, 'packages/')`, so `backups/`
 * is outside every pathspec the promotion bracket looks at. Git could undo the damage; nothing in the
 * promotion path would tell anyone it happened. Arm C2b drives that.
 *
 * The walk was never the problem: `backups/` is not in {@link PRUNE}, so `readdirSync` visited every
 * one of these files and the *name predicate* rejected them. A directory walk answers "what is on
 * disk" (see {@link snapshot}); it cannot help when the filter downstream of it is narrow.
 *
 * **Cost, measured on the shipped predicate rather than asserted**, same method as
 * {@link SCRATCH_HASH_LIMIT}: a full snapshot goes from **68 ms to 119–136 ms** on this tree
 * (graded 3 files/0.45 MB → 6 files/6.16 MB; scratch 273 → 534). Four snapshots per probe puts the
 * added overhead at roughly **0.24 s**, well under the ~1 s per-probe bar that note set as the point
 * where someone turns the sentinel off. An earlier draft of this comment said 179 ms and 0.44 s; that
 * was timed against the draft predicate {@link NON_DB_SUFFIX} exists to correct, which was also
 * hashing 66 JSON reports.
 */
export const isDbFile = (name: string): boolean => {
  if (NON_DB_SUFFIX.test(name)) return false;
  return /\.db(-wal|-shm)?$/.test(name) || /\.db\.[^/]+$/.test(name) || /\.bak$/.test(name);
};

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

/** A WAL sidecar rather than a main database file. */
const isSidecar = (p: string): boolean => /\.db-(wal|shm)$/.test(p);

/**
 * True when a delta moved *something*, and every path it moved is a WAL sidecar.
 *
 * Round 289, after Theseus's Round 288 §2. He drove the thing that makes this worth distinguishing:
 * `-shm` is SQLite's WAL index, and it is a file whose **existence** tracks whether any connection
 * holds the database open. His W2/W7 show the pair appearing on a *read-only* open and vanishing
 * when the last connection closes. So `npm run dev` starting on :3001, or a sibling worktree's fire
 * ending, moves files in the graded set with nobody having written a row.
 *
 * What this predicate is NOT, and the distinction matters more than the one above:
 *
 *   **It does not mean the movement was harmless.** A committed write that was never checkpointed
 *   lands entirely in `-wal` and leaves the main `.db` bytes untouched — the SAME signature. The
 *   two are not separable from a before/after bracket, which is why the caller's job here is to
 *   change the *wording* to predicate 7's ("could be this probe or a concurrent holder; not
 *   promotable either way") and **not** to change the grading. `probe-round289` drives both
 *   generators of the signature — a foreign holder and an uncheckpointed write — and shows the
 *   sentinel reporting them identically.
 */
export const sidecarOnly = (d: DbDelta): boolean => {
  const moved = [...d.changed, ...d.appeared, ...d.vanished];
  return moved.length > 0 && moved.every(isSidecar);
};

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
