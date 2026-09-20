/**
 * Probe corpus sessions — one place for "which real sessions should this probe use?"
 *
 * ## Why this exists
 *
 * Theseus, Round 240 (`docs/mail/theseus-to-daedalus-…-your-sweep-found-a-third-pin-class-and-it-has-a-30-day-fuse-2026-09-20.md` §2–3):
 * `probe-import-entity-binding.mts` — by its own header *"the acceptance test for the import
 * confirm step"* — named **seven session files by UUID** under `~/.claude/projects`. Four of
 * the seven were already gone. Of the three survivors, one was **under a day** from
 * disappearing.
 *
 * That corpus is not under version control and it is not merely volatile: it is **on a
 * schedule**. Measured two-sided in this worktree, 2026-09-20 WORK fire, independently of
 * Theseus's figures:
 *
 * ```
 * files:                            538
 * oldest mtime:                     30.10 d
 * files with mtime > 30 d:          2        ← the cliff, with sweep latency
 * files with birthtime > 30 d:      16       ← survivors, oldest born 59.10 d ago
 * ```
 *
 * A max-age cliff alone would be consistent with a corpus that is merely young. The sixteen
 * **old births that survive** are the discriminator: Claude Code deletes a session file some
 * time after it was last *appended to*, not after it was created. The horizon is 30 days plus
 * whatever latency the sweep runs at — the two files at 30.10 d are the evidence that it is a
 * periodic sweep and not an instantaneous delete, so **a computed expiry date is a lower bound
 * on remaining life, never an exact date.**
 *
 * So a probe naming a session UUID is not *at risk* of rotting. It is **scheduled** to.
 *
 * ## The class is exactly one probe, and that is a measured claim
 *
 * Swept all 112 top-level files under `scripts/` (`readdirSync`, not a glob) for UUID-shaped
 * tokens, resolving each against the live corpus by basename:
 *
 * | | |
 * |---|---|
 * | scripts containing a UUID-shaped token | 8 |
 * | scripts naming a **real** session file | **1** (`probe-import-entity-binding.mts`) |
 * | scripts naming only **self-minted** UUIDs | 7 |
 *
 * The seven are `00000000-0000-4000-8000-000000000000`, `aaaaaaaa-0000-…-0001`,
 * `c0111111-…`, and friends — fixtures the probe mints itself. That is the correct pattern and
 * it is Theseus's Round 240 §4 lesson stated in a second domain: **mint a marker, never pick
 * one that occurs in the world.** A minted UUID cannot expire because nothing else owns it.
 *
 * This module is for the remaining case — a probe that genuinely needs *real, long,
 * independently-authored transcripts* and therefore cannot mint them.
 *
 * ## The invariant this module exists to hold
 *
 * **A probe states the properties it needs and is handed sessions that have them, at run time.**
 * It never names one. The corollary that matters for a reader: the probe **prints what it was
 * handed**, because a resolution that is not reported is indistinguishable from a pin that
 * happens to still resolve.
 *
 * ## Refusal must name the remedy that is actually available
 *
 * Theseus's Round 240 §3 rule, which this module encodes rather than leaves to each caller:
 *
 * > A guard that cannot pass renders as silence. So does a guard that *can* pass but
 * > **misattributes its own failure** — and that one is worse, because it sends the reader to
 * > a fix that isn't available.
 *
 * The old guard printed *"this probe needs a machine with the live Claude Code corpus it was
 * written against"* on a machine that **had** 538 sessions. "Wrong machine" and "right machine,
 * expired corpus" have opposite remedies and only the second is actionable. So refusal here is
 * two-valued and the two values are never conflated:
 *
 * - {@link CorpusUnavailable} `reason: 'no-corpus'` — there is no corpus here. Run elsewhere.
 * - {@link CorpusUnavailable} `reason: 'insufficient-corpus'` — there **is** a corpus, it does
 *   not meet the stated properties, and the message says by how much.
 *
 * ## Determinism
 *
 * Re-resolution is the whole point, so the selection cannot be random — an acceptance test that
 * measures a different corpus on every run cannot be compared to itself. The rule is total and
 * documented on {@link resolveSessionCast}: rank by in-band session count descending, tiebreak
 * on directory name ascending; within a directory, size descending, tiebreak on file name
 * ascending. Same corpus in, same cast out. A *different* corpus is supposed to give a
 * different cast, and the printed report is how the reader sees that it did.
 */

import fs from 'fs';
import path from 'path';
import os from 'os';

/** Where Claude Code keeps session transcripts, one directory per project/worktree. */
export const DEFAULT_PROJECTS_DIR = path.join(os.homedir(), '.claude', 'projects');

/**
 * Measured retention horizon, in days, for a Claude Code session file — keyed on **mtime**,
 * not birthtime. Exported so a caller can report how close its own resolution is to the edge.
 * See the module docstring for the two-sided measurement. Treat as a lower bound.
 */
export const SESSION_RETENTION_DAYS = 30;

export interface ResolvedSession {
  /** Basename including `.jsonl`. */
  file: string;
  /** The project directory name under `projects/`, e.g. `-Users-xian-Development-klatch`. */
  dir: string;
  /** Absolute path. */
  path: string;
  sizeBytes: number;
  /**
   * Age of the last append, in days. Retention is keyed on this.
   *
   * Clamped at zero. A file written microseconds ago can carry an `mtime` fractionally ahead
   * of `Date.now()` — filesystem timestamp granularity, observed while building this module's
   * controls, which printed `last append -0.0 d ago`. A negative age is not a real
   * measurement, and the one output a reader is supposed to trust is the wrong place to leak
   * clock granularity.
   */
  mtimeAgeDays: number;
}

export interface ResolvedSource {
  dir: string;
  /** A stable, unique, human-readable name derived from `dir`. Safe to use as an entity name. */
  label: string;
  sessions: ResolvedSession[];
}

export interface CorpusResolution {
  projectsDir: string;
  /** Every `.jsonl` under `projectsDir`, before any filtering. */
  totalSessions: number;
  /** Every project directory under `projectsDir`, before any filtering. */
  totalDirs: number;
  /** Directories that met the size band and per-directory count, before the top-N cut. */
  qualifyingDirs: number;
  sources: ResolvedSource[];
}

export type CorpusUnavailableReason = 'no-corpus' | 'insufficient-corpus';

/**
 * Thrown by {@link resolveSessionCast}. The two reasons have **opposite remedies**; callers
 * that collapse them reintroduce exactly the defect this module exists to remove.
 */
export class CorpusUnavailable extends Error {
  readonly reason: CorpusUnavailableReason;
  /** What was actually observed, so the reader does not have to re-derive it. */
  readonly observed: string;
  /** The action that would make this resolve, on *this* machine. */
  readonly remedy: string;

  constructor(reason: CorpusUnavailableReason, observed: string, remedy: string) {
    super(`${reason}: ${observed}`);
    this.name = 'CorpusUnavailable';
    this.reason = reason;
    this.observed = observed;
    this.remedy = remedy;
  }
}

export interface ResolveOptions {
  /** How many **distinct** project directories the cast needs. */
  count: number;
  /** How many sessions to take from each chosen directory. Default 1. */
  sessionsPerDir?: number;
  /** Inclusive lower bound on file size. Default 150 KiB — "a real, long transcript". */
  minBytes?: number;
  /** Inclusive upper bound on file size. Default 600 KiB. */
  maxBytes?: number;
  projectsDir?: string;
}

/** Derive the trailing `n` hyphen-separated segments of a project directory name. */
function tailSegments(dir: string, n: number): string {
  const parts = dir.split('-').filter(Boolean);
  return parts.slice(Math.max(0, parts.length - n)).join('-');
}

/**
 * A stable, unique label per directory.
 *
 * Collisions are not hypothetical — `…-klatch-worktrees-argus` and `…-other-worktrees-argus`
 * both end in `argus`, and the caller that matters (the import acceptance test) uses these as
 * **entity names**, where a silent collision would turn "five distinct entities" into four and
 * grade it as a regression in shipped code. So widen until unique, and only then fall back to
 * an index — a fallback that is reached is visible in the printed report.
 */
function labelDirs(dirs: string[]): Map<string, string> {
  const out = new Map<string, string>();
  const cap = Math.max(1, ...dirs.map((d) => d.split('-').filter(Boolean).length));
  for (let width = 1; width <= cap; width++) {
    const byLabel = new Map<string, string[]>();
    for (const d of dirs) {
      const l = tailSegments(d, width);
      byLabel.set(l, [...(byLabel.get(l) ?? []), d]);
    }
    if ([...byLabel.values()].every((ds) => ds.length === 1)) {
      for (const [l, [d]] of byLabel) out.set(d, titleCase(l));
      return out;
    }
  }
  // Two directories with identical names cannot occur on one filesystem, so this is
  // unreachable in practice; keep it total rather than throwing from a labeller.
  dirs.forEach((d, i) => out.set(d, `${titleCase(tailSegments(d, cap))}${i + 1}`));
  return out;
}

function titleCase(s: string): string {
  return s
    .split('-')
    .filter(Boolean)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join('');
}

/**
 * Resolve a cast of real sessions **by property**, at run time.
 *
 * Selection is total and deterministic:
 *
 * 1. every project directory under `projectsDir`;
 * 2. within each, `.jsonl` files with `minBytes <= size <= maxBytes`;
 * 3. keep directories with at least `sessionsPerDir` such files;
 * 4. rank those directories by **in-band count descending**, tiebreak **name ascending** — a
 *    directory holding many long transcripts is a real working corpus; one holding exactly the
 *    minimum is as likely to be a scratch directory another probe left behind;
 * 5. take the first `count`; within each, **size descending**, tiebreak **file name ascending**,
 *    take `sessionsPerDir`.
 *
 * @throws CorpusUnavailable — `'no-corpus'` if `projectsDir` is absent or holds no sessions at
 * all; `'insufficient-corpus'` if it holds sessions but not enough that meet the properties.
 */
export function resolveSessionCast(opts: ResolveOptions): CorpusResolution {
  const projectsDir = opts.projectsDir ?? DEFAULT_PROJECTS_DIR;
  const sessionsPerDir = opts.sessionsPerDir ?? 1;
  const minBytes = opts.minBytes ?? 150 * 1024;
  const maxBytes = opts.maxBytes ?? 600 * 1024;

  if (opts.count < 1) throw new RangeError(`count must be >= 1, got ${opts.count}`);
  if (sessionsPerDir < 1) throw new RangeError(`sessionsPerDir must be >= 1, got ${sessionsPerDir}`);

  if (!fs.existsSync(projectsDir) || !fs.statSync(projectsDir).isDirectory()) {
    throw new CorpusUnavailable(
      'no-corpus',
      `${projectsDir} does not exist`,
      'Run this probe on a machine with a live Claude Code install.',
    );
  }

  const dirNames = fs
    .readdirSync(projectsDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

  const now = Date.now();
  let totalSessions = 0;
  const inBand = new Map<string, ResolvedSession[]>();

  for (const dir of dirNames) {
    const abs = path.join(projectsDir, dir);
    const files = fs.readdirSync(abs).filter((f) => f.endsWith('.jsonl'));
    totalSessions += files.length;
    const kept: ResolvedSession[] = [];
    for (const file of files) {
      const p = path.join(abs, file);
      const st = fs.statSync(p);
      if (!st.isFile()) continue;
      if (st.size < minBytes || st.size > maxBytes) continue;
      kept.push({
        file,
        dir,
        path: p,
        sizeBytes: st.size,
        mtimeAgeDays: Math.max(0, (now - st.mtimeMs) / 86_400_000),
      });
    }
    if (kept.length) inBand.set(dir, kept);
  }

  if (totalSessions === 0) {
    throw new CorpusUnavailable(
      'no-corpus',
      `${projectsDir} exists but holds 0 .jsonl sessions across ${dirNames.length} directories`,
      'Run this probe on a machine with a live Claude Code install.',
    );
  }

  const qualifying = [...inBand.entries()].filter(([, s]) => s.length >= sessionsPerDir);

  if (qualifying.length < opts.count) {
    const band = `${(minBytes / 1024).toFixed(0)}-${(maxBytes / 1024).toFixed(0)} KiB`;
    throw new CorpusUnavailable(
      'insufficient-corpus',
      `this machine HAS a corpus — ${totalSessions} sessions across ${dirNames.length} directories — ` +
        `but only ${qualifying.length} of them hold ${sessionsPerDir}+ sessions in ${band}, and ${opts.count} are needed`,
      `Widen the size band or lower count/sessionsPerDir. Do NOT read this as "wrong machine": ` +
        `the corpus is present and ${inBand.size} directories have at least one in-band session.`,
    );
  }

  qualifying.sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]));
  const chosen = qualifying.slice(0, opts.count);
  const labels = labelDirs(chosen.map(([dir]) => dir));

  const sources: ResolvedSource[] = chosen.map(([dir, sessions]) => ({
    dir,
    label: labels.get(dir)!,
    sessions: [...sessions]
      .sort((a, b) => b.sizeBytes - a.sizeBytes || a.file.localeCompare(b.file))
      .slice(0, sessionsPerDir),
  }));

  return {
    projectsDir,
    totalSessions,
    totalDirs: dirNames.length,
    qualifyingDirs: qualifying.length,
    sources,
  };
}

/**
 * The report. A resolution that is not printed is indistinguishable, to a reader, from a pin
 * that happens to still resolve — so every caller prints this before it asserts anything.
 *
 * Remaining life is shown because it is the number that made this module necessary, and it is
 * labelled `>=` because {@link SESSION_RETENTION_DAYS} is a sweep horizon, not a delete time.
 */
export function describeResolution(r: CorpusResolution): string {
  const lines: string[] = [];
  lines.push(
    `corpus: ${r.totalSessions} sessions across ${r.totalDirs} directories under ${r.projectsDir}`,
  );
  lines.push(
    `resolved ${r.sources.length} of ${r.qualifyingDirs} qualifying directories (by property, not by name):`,
  );
  for (const s of r.sources) {
    lines.push(`  ${s.label}  <- ${s.dir}`);
    for (const sess of s.sessions) {
      const left = SESSION_RETENTION_DAYS - sess.mtimeAgeDays;
      lines.push(
        `      ${sess.file}  ${(sess.sizeBytes / 1024).toFixed(0)} KiB  ` +
          `last append ${sess.mtimeAgeDays.toFixed(1)} d ago  (>= ${left.toFixed(1)} d of life left)`,
      );
    }
  }
  return lines.join('\n');
}

/**
 * Print a refusal that names the remedy available on *this* machine, and exit 2.
 *
 * Exit 2 matches the convention already in `scripts/lib/probe-outcome.mts`: a probe that could
 * not run is not a probe that passed and not a probe that failed.
 */
export function refuseWithCorpusDiagnosis(err: unknown): never {
  if (!(err instanceof CorpusUnavailable)) throw err;
  console.error(`Cannot run [${err.reason}]: ${err.observed}`);
  console.error(`Remedy: ${err.remedy}`);
  process.exit(2);
}
