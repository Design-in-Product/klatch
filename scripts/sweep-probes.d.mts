/**
 * Types for `sweep-probes.mjs`, so a `.mts` probe may import it without TS7016.
 *
 * Round 279, Daedalus, 2026-09-26. `probe-round261` and `probe-round269` both drive this module's
 * pure half from TypeScript; both carried an untyped import, and `probe-round269` had already
 * hand-annotated one callback parameter (`:231`) to work around it. That annotation is the tell:
 * the file wanted these types and there was nowhere to put them.
 *
 * The declarations are deliberately NARROWER than the implementation where the implementation is
 * structural. `entryProblems` and `measurementCheck` take the fields they actually read, not a full
 * `SweptEntry`, because both are driven on local literals in the probes' arms — a declaration that
 * demanded a whole entry would have reddened the tests that exist to drive them.
 */

/** What the classifier can conclude about one probe's run. */
export type ProbeState = 'PASS' | 'BLOCKED' | 'RED';

/**
 * One declared entry in {@link SWEPT}. `refusal` and `skip` are optional and independent: `refusal`
 * admits an exit 2 that names its own cause, `skip` an exit 3 that names a declared skip label.
 */
export interface SweptEntry {
  file: string;
  expect: RegExp;
  why: string;
  refusal?: RegExp;
  skip?: RegExp;
}

export declare const SWEPT: readonly SweptEntry[];

/** Probe files deliberately NOT swept — not established safe, unexamined. */
export declare const DEFERRED: readonly string[];

/** Probe filenames under `dir`, sorted. Not recursive; `scripts/` is flat. */
export declare const census: (dir: string) => string[];

export declare const partition: (
  files: readonly string[],
  swept: readonly string[],
  deferred: readonly string[],
) => { unclassified: string[]; missing: string[]; duplicated: string[] };

/**
 * `code` is `number | null` because it comes from `spawnSync`'s `status`, which is null when the
 * child was killed by a signal. Typing it as `number` would have made the one case the sweep most
 * needs to distinguish — died vs. exited — unrepresentable at the boundary.
 */
export declare const classify: (
  code: number | null,
  out: string,
  expect: RegExp,
  refusal?: RegExp,
  skip?: RegExp,
) => { state: ProbeState; matched: boolean; refused: boolean; skipped: boolean; code: number | null };

/** The line to quote as a probe's diagnosis when its pinned summary was not found. */
export declare const diagnosisLine: (out: string) => string;

/** The original two-valued view, a wrapper over {@link classify} rather than a second grader. */
export declare const verdict: (
  code: number | null,
  out: string,
  expect: RegExp,
) => { ok: boolean; matched: boolean; code: number | null };

/** 1 = something failed, 2 = nothing failed but something could not run, 0 = clean. */
export declare const sweepExit: (counts: { red: number; blocked: number; bad: number }) => number;

export declare const measurementLines: (out: string) => number;

/** Problem strings; empty means the entry's prose and its assertion agree. */
export declare const entryProblems: (entry: { expect: RegExp; why: string }) => string[];

/**
 * Can this source emit a conclusion line (predicate 5's observable) at all? Round 289. Read over
 * `stripSource(src, false)` — comments blanked, strings KEPT, because two SWEPT probes hand-roll
 * their summary as a string literal and a strings-blanked reading loses both.
 */
export declare const verdictBearing: (src: string) => boolean;

/** Problem strings; empty means every SWEPT file — a known positive by construction — reads true. */
export declare const verdictBearingProblems: (
  sweptFiles: readonly string[],
  read: (file: string) => string,
) => string[];

export declare const measurementCheck: (
  entry: { why: string },
  out: string,
) => { problem?: string; note?: string };
