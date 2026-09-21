/**
 * Round 247 — `scripts/lib/probe-outcome.mts` under `npm test`, and the half nothing drove.
 *
 * Routed by Theseus, Round 246 §6: *"`probe-outcome.mts` is on the outside list, and it is the
 * module your §8 named as your next pick — it decides every probe's exit code."* Bringing it under
 * a server test also brings it into `npm run typecheck`, since Round 245 widened the checking
 * config and coverage extends exactly as far as the tests reach.
 *
 * ## What already existed, stated before adding to it
 *
 * `probe-round224-a-skip-must-not-summarise-as-a-pass.mts` drives this module hard — 63 regression
 * checks across arms A–I, green at this HEAD. **This file is not the first thing to test
 * `summarise`, and saying so is the Round 245 rule applied to myself:** "X has no coverage" is a
 * claim about a denominator. The denominator here is not zero; it is *one probe, run by hand*.
 *
 * What the probe does NOT drive is the other exported function.
 *
 * ## `summariseAndExit` had no assertion anywhere, and it is the one with 16 callers
 *
 * Round 224 imports `summariseAndExit` **to report its own results with**. Every arm it has
 * targets `summarise`, the pure half. Nothing in the repo asserted what the printing half prints,
 * or that the process exit code equals the outcome code.
 *
 * Driven, 2026-09-21: a copy of the library with `process.exit(outcome.code)` changed to
 * `process.exit(0)` leaves round 224 fully green and exiting 0. The probe that audits this module
 * cannot report a defect in it, because the subject produces the probe's own exit code — Theseus's
 * Round 223 finding (*a probe that skips its way to zero checks reports success*) one layer up, in
 * the module written to fix it.
 *
 * So the exit code is **driven in a real subprocess here**, not read off the return value:
 * `process.exit(n)` is unobservable from inside the process that calls it, and the return type is
 * `never`. A test that called it in-process would either kill the worker or need the call stubbed,
 * and a stub of `process.exit` asserts the argument, not the exit.
 *
 * Zero model calls, no server, no port, no DB, no read of `~/.claude` — `summarise` is pure and
 * the subprocess runs a driver this file mints into a temp directory.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';
import {
  summarise,
  type ProbeVerdict,
  type SummariseInput,
} from '../../../../scripts/lib/probe-outcome.mts';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
const LIB = path.join(REPO, 'scripts/lib/probe-outcome.mts');
const TSX = path.join(REPO, 'node_modules/.bin/tsx');

const ok = (arm: string, check = 'a check'): ProbeVerdict => ({ arm, check, pass: true, kind: 'regression' });
const bad = (arm: string, check = 'a check'): ProbeVerdict => ({ arm, check, pass: false, kind: 'regression' });

// ── the pure half: properties round 224 does not assert ──────────────────────

describe('summarise — the gaps in what the probe already drives', () => {
  it('counts a verdict with NO kind as a hard check, which is what the docstring promises', () => {
    // The type says `kind` is optional and the comment says the untagged reading is the safe one,
    // "since the alternative silently drops it from the count that decides the exit". Round 224's
    // helpers always set `kind`, so no arm there can tell the two readings apart.
    const untagged = summarise({ probeName: 's', results: [{ arm: 'A', check: 'one', pass: true }] });
    expect(untagged.code).toBe(0);
    expect(untagged.ran).toBe(1);

    const untaggedFail = summarise({ probeName: 's', results: [{ arm: 'A', check: 'one', pass: false }] });
    expect(untaggedFail.code).toBe(1);
    expect(untaggedFail.failed).toHaveLength(1);
  });

  it('a run of ONLY untagged failures is 1, not a vacuous 3 — the drop would have read as inconclusive', () => {
    // This is the whole reason the untagged default matters: if an untagged verdict were dropped
    // from the regression count, a probe whose checks all failed would report "established
    // nothing" instead of "something broke", and the operator's next action is different.
    const o = summarise({ probeName: 's', results: [{ arm: 'A', check: 'x', pass: false }, { arm: 'B', check: 'y', pass: false }] });
    expect(o.code).toBe(1);
    expect(o.headline).toContain('2 of 2');
  });

  it('honours a caller-supplied regressionKind on both the results and the skips', () => {
    const input: SummariseInput = {
      probeName: 's',
      regressionKind: 'hard',
      results: [{ arm: 'A', check: 'one', pass: true, kind: 'hard' }, { arm: 'B', check: 'two', pass: true, kind: 'regression' }],
      skipped: [{ label: '[C] soft', kind: 'regression' }],
    };
    const o = summarise(input);
    // Under regressionKind 'hard': B's 'regression' kind is now a SOFT verdict, and the skip
    // tagged 'regression' is now a soft skip that must not force 3.
    expect(o.ran).toBe(1);
    expect(o.code).toBe(0);
    expect(o.reasons).toEqual(['not a hard check, did not run: [C] soft']);
  });

  it('a bare-string skip under a custom regressionKind still defaults to hard', () => {
    // `kindOf` returns the *caller's* regressionKind for a bare string, not the literal
    // 'regression'. A bare string is the safe default whatever the kind is spelled.
    //
    // The result MUST be tagged 'hard' here. The first version of this test passed a
    // regression-kinded result under regressionKind 'hard', which made `ran` zero — so the 3 it
    // asserted came from vacuity, and a mutant that hardcoded the literal 'regression' in `kindOf`
    // went unnoticed. The fixture has to leave the skip as the only thing that can force the 3.
    const o = summarise({
      probeName: 's',
      regressionKind: 'hard',
      results: [{ arm: 'A', check: 'one', pass: true, kind: 'hard' }],
      skipped: ['[B] no port'],
    });
    expect(o.ran).toBe(1);
    expect(o.code).toBe(3);
    expect(o.reasons).toEqual(['did not run: [B] no port']);
  });

  it('puts the vacuity reason FIRST when a run both ran nothing and skipped', () => {
    // The type comment says reasons are "in the order a reader should see them"; nothing pinned
    // the order, and the first line is the one a skimming operator reads.
    const o = summarise({ probeName: 's', results: [], skipped: ['[A] no port', '[B] no corpus'] });
    expect(o.code).toBe(3);
    expect(o.reasons).toHaveLength(3);
    expect(o.reasons[0]).toContain('zero regression checks ran');
    expect(o.reasons.slice(1)).toEqual(['did not run: [A] no port', 'did not run: [B] no corpus']);
  });

  it('reports the skips but NOT the inapplicable list when a check failed', () => {
    // On the failure path the returned `reasons` are built from skips only. Asserting the shape
    // rather than the intent: an inapplicable entry is silently dropped when code is 1.
    const o = summarise({
      probeName: 's',
      results: [bad('A')],
      skipped: ['[B] no port'],
      inapplicable: ['[C] no instance'],
    });
    expect(o.code).toBe(1);
    expect(o.reasons).toEqual(['did not run: [B] no port']);
  });

  it('never prints the word "passed" outside code 0 — across every shape this module can return', () => {
    const shapes: SummariseInput[] = [
      { probeName: 's', results: [] },
      { probeName: 's', results: [ok('A')], skipped: ['[B] no port'] },
      { probeName: 's', results: [bad('A')] },
      { probeName: 's', results: [bad('A')], skipped: ['[B] no port'] },
      { probeName: 's', results: [{ arm: 'M', check: 'a measurement', pass: true, kind: 'measurement' }] },
    ];
    for (const s of shapes) {
      const o = summarise(s);
      expect(o.code, JSON.stringify(s)).not.toBe(0);
      expect(o.headline, JSON.stringify(s)).not.toMatch(/passed/);
    }
    // …and that the check is not vacuous: the one shape that IS a pass does say it.
    expect(summarise({ probeName: 's', results: [ok('A')] }).headline).toMatch(/passed/);
  });
});

// ── the exiting half: driven in a subprocess, because that is the only place it exists ──

type Run = { status: number; stdout: string };

const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'klatch-round247-'));
const DRIVER = path.join(TMP, 'driver.mts');
const runs: Record<string, Run> = {};

const CASES: Record<string, SummariseInput> = {
  clean: { probeName: 'subject', results: [ok('A', 'one'), ok('B', 'two')] },
  failed: { probeName: 'subject', results: [ok('A', 'one'), bad('B', 'the broken one'), bad('C', 'also broken')] },
  skipped: { probeName: 'subject', results: [ok('A', 'one')], skipped: ['[R] needs a free port 3001'] },
  vacuous: { probeName: 'subject', results: [], skipped: [] },
  softSkip: { probeName: 'subject', results: [ok('A', 'one')], skipped: [{ label: '[J] open item', kind: 'open' }] },
};

function drive(input: SummariseInput): Run {
  try {
    const stdout = execFileSync(TSX, [DRIVER], {
      encoding: 'utf8',
      env: { ...process.env, KLATCH_R247_CASE: JSON.stringify(input) },
    });
    return { status: 0, stdout };
  } catch (e) {
    const err = e as { status?: number; stdout?: string };
    // execFileSync throws on any non-zero exit; the exit code IS the measurement here.
    if (typeof err.status !== 'number') throw e;
    return { status: err.status, stdout: err.stdout ?? '' };
  }
}

beforeAll(() => {
  expect(fs.existsSync(TSX), `${TSX} — the subprocess runner must exist; a skip here would make ` +
    'a missing toolchain look like a passing exit-code contract').toBe(true);
  fs.writeFileSync(
    DRIVER,
    [
      `import { summariseAndExit } from ${JSON.stringify(LIB)};`,
      'summariseAndExit(JSON.parse(process.env.KLATCH_R247_CASE!));',
      '',
    ].join('\n'),
  );
  for (const [name, input] of Object.entries(CASES)) runs[name] = drive(input);
}, 120_000);

afterAll(() => {
  fs.rmSync(TMP, { recursive: true, force: true });
});

describe('summariseAndExit — the process exit code, driven not read', () => {
  it('exits 0 on a clean run and says so', () => {
    expect(runs.clean.status).toBe(0);
    expect(runs.clean.stdout).toContain('All 2 regression checks passed.');
  });

  it('exits 1 when a check failed, and names every failing arm', () => {
    expect(runs.failed.status).toBe(1);
    expect(runs.failed.stdout).toContain('REGRESSIONS:');
    expect(runs.failed.stdout).toContain('[B] the broken one');
    expect(runs.failed.stdout).toContain('[C] also broken');
    expect(runs.failed.stdout).toContain('2 of 3 regression check(s) FAILED.');
  });

  it('exits 3 on a skipped arm, names the skip, and prints the exit-code legend', () => {
    expect(runs.skipped.status).toBe(3);
    expect(runs.skipped.stdout).toContain('did not run: [R] needs a free port 3001');
    expect(runs.skipped.stdout).toContain('INCONCLUSIVE');
    expect(runs.skipped.stdout).toContain('exit 3 — see scripts/lib/probe-outcome.mts');
  });

  it('exits 3 on a run that established nothing — the Round 223 defect, at the exit', () => {
    expect(runs.vacuous.status).toBe(3);
    expect(runs.vacuous.stdout).toContain('established nothing');
  });

  it('exits 0 when the only skip was a soft one, and still reports it', () => {
    expect(runs.softSkip.status).toBe(0);
    expect(runs.softSkip.stdout).toContain('not a hard check, did not run: [J] open item');
  });

  it('prints "passed" in exactly one of the five runs — the one that exited 0 with hard checks', () => {
    const saidPassed = Object.entries(runs).filter(([, r]) => /passed/.test(r.stdout)).map(([n]) => n).sort();
    expect(saidPassed).toEqual(['clean', 'softSkip']);
    // Both are exit 0. The property is not "one run" but "only a zero exit".
    for (const name of saidPassed) expect(runs[name].status, name).toBe(0);
  });

  it('prints the exit-3 legend only when the exit really was 3', () => {
    for (const [name, r] of Object.entries(runs)) {
      expect(/exit 3 — see scripts\/lib\/probe-outcome\.mts/.test(r.stdout), name).toBe(r.status === 3);
    }
  });

  it('the process exit code equals the outcome code for every case — the line nothing asserted', () => {
    for (const [name, input] of Object.entries(CASES)) {
      expect(runs[name].status, `${name}: process exit vs summarise().code`).toBe(summarise(input).code);
    }
    // Not vacuous: the five cases cover three distinct codes.
    expect(new Set(Object.values(runs).map((r) => r.status))).toEqual(new Set([0, 1, 3]));
  });
});
