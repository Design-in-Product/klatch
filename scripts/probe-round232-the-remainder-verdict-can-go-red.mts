/**
 * Round 232 — the `remainder` verdict can now go red, and this proves it can.
 *
 * WHY THIS EXISTS
 *
 * `probe-browse-latency-end-to-end.mts` arm O reported the fingerprint decomposition with a
 * **hardcoded `pass: true`** for three rounds. Theseus named it in Round 227 ("a remainder
 * below zero is the decomposition reporting that it does not hold — printed as a PASS"), I
 * printed the noise band in Round 228 but left the verdict alone, and he re-cut it in Round
 * 230 §3. That cut is now applied: sign → soft, negative-beyond-band → hard FAIL.
 *
 * WHAT THIS DRIVES, AND WHY IT IS NOT THE OBVIOUS FILE
 *
 * The change is three lines in arm O, and the temptation is to call it self-evident. It is
 * not, and the reason is Round 215's rule: **a construct that asserts nothing sits exactly
 * where a reader looks for an assertion.** The thing that was wrong for three rounds was not
 * the arithmetic — it was the mapping from a state to an exit code, and that mapping runs
 * through `summarise()` in a different file. Reading both and concluding it works is how the
 * `pass: true` survived being looked at repeatedly.
 *
 * So this drives the real `summarise()` from `scripts/lib/probe-outcome.mts` with the exact
 * verdict shapes arm O now produces, and asserts the three fates are actually three:
 *
 *   remainder ≥ 0               → PASS, exit 0
 *   negative, inside the band   → NOTE, exit 0   (soft: reported, does not redden)
 *   negative, beyond the band   → FAIL, exit 1   ← the state that could not happen before
 *
 * The third row is the whole point. Re-driven against the OLD hardcoded shape as a negative
 * control, it exits 0 — so a green here is a green that could have been red.
 *
 * ── What this cannot establish ────────────────────────────────────────────────────────────
 *
 *   - Nothing about whether the decomposition is *true* on any real corpus. That is arm O's
 *     job on a corpus where the cap fires, which is still not run (Round 227's open item).
 *   - Nothing about the band's width being right. It asserts the three-way branch reaches the
 *     exit code, not that 2σ is the correct threshold.
 *   - It re-implements arm O's branch rather than importing it, because that branch is inline
 *     in a 700-line probe that needs a live server and a corpus to reach. The branch is copied
 *     verbatim below and a drift check asserts the source still contains it.
 *
 * ZERO MODEL CALLS. No server, no port, no DB. `packages/` is not written by this file.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { summarise } from './lib/probe-outcome.mts';

const PROBE = 'probe-round232-the-remainder-verdict-can-go-red';
const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ARM_O_SOURCE = path.join(REPO, 'scripts/probe-browse-latency-end-to-end.mts');

type Kind = 'regression' | 'measurement';
const results: Array<{ arm: string; check: string; pass: boolean; detail: string; kind: Kind }> = [];
function check(arm: string, name: string, pass: boolean, detail: string, kind: Kind = 'regression') {
  results.push({ arm, check: name, pass, detail, kind });
  const tag = pass ? 'PASS' : kind === 'measurement' ? 'NOTE' : 'FAIL';
  console.log(`${tag} [${arm}] ${name} — ${detail}`);
}

/**
 * Arm O's branch, copied verbatim from `probe-browse-latency-end-to-end.mts`. Arm D below
 * asserts the copy has not drifted from the original.
 */
function armOVerdict(remainder: number, remainderBand: number): { pass: boolean; kind: Kind; state: string } {
  const remainderState: 'positive' | 'within-noise' | 'beyond-noise' =
    remainder >= 0 ? 'positive'
      : Math.abs(remainder) <= remainderBand ? 'within-noise'
        : 'beyond-noise';
  return {
    pass: remainderState === 'positive',
    kind: remainderState === 'beyond-noise' ? 'regression' : 'measurement',
    state: remainderState,
  };
}

/** What a probe run containing only this verdict would exit with. */
function exitCodeFor(v: { pass: boolean; kind: Kind }): number {
  return summarise({
    probeName: 'arm-O-single-verdict',
    // A companion hard check that passes, so `ran > 0` and the run is not INCONCLUSIVE for
    // the unrelated reason that nothing hard ran. Without it the measurement-only rows would
    // exit 3 and the contrast this file is drawing would be invisible.
    results: [
      { arm: 'X', check: 'a hard check that passes', pass: true, kind: 'regression' },
      { arm: 'O', check: 'fingerprinting is attributed at the surface it is described at', ...v },
    ],
  }).code;
}

const BAND = 100; // ms, stands in for COLD_BAND_SIGMAS × SE(Δ−Δ)

// ── Arm V — the three states get three fates ─────────────────────────────────────────────
const positive = armOVerdict(+250, BAND);
check('V', 'a positive remainder passes', positive.pass && exitCodeFor(positive) === 0,
  `remainder +250 ms → state ${positive.state}, ${positive.pass ? 'PASS' : 'not a pass'}, exit ${exitCodeFor(positive)}`);

const withinNoise = armOVerdict(-40, BAND);
check('V', 'a small negative is soft — reported, not a PASS, and does not redden the exit',
  !withinNoise.pass && withinNoise.kind === 'measurement' && exitCodeFor(withinNoise) === 0,
  `remainder −40 ms against a ±${BAND} ms band → state ${withinNoise.state}, prints ` +
  `${withinNoise.pass ? 'PASS' : 'NOTE'}, exit ${exitCodeFor(withinNoise)}. This is the state Round 228 ` +
  `printed as a PASS.`);

const beyondNoise = armOVerdict(-250, BAND);
check('V', 'a negative beyond the band FAILS and exits 1',
  !beyondNoise.pass && beyondNoise.kind === 'regression' && exitCodeFor(beyondNoise) === 1,
  `remainder −250 ms against a ±${BAND} ms band → state ${beyondNoise.state}, prints ` +
  `${beyondNoise.pass ? 'PASS' : 'FAIL'}, exit ${exitCodeFor(beyondNoise)} — the state that was ` +
  `unreachable while the line read \`pass: true\`.`);

// ── Arm B — the boundary is inclusive, and stated rather than left to a reader ───────────
const atBand = armOVerdict(-BAND, BAND);
check('B', 'a negative exactly at the band is soft, not a failure', atBand.state === 'within-noise',
  `remainder −${BAND} ms against a ±${BAND} ms band → ${atBand.state}. The comparison is ` +
  `\`<=\`, so the boundary case does not redden — a probe should not fail on the value its own ` +
  `noise estimate says it cannot resolve.`);

// ── Arm N — the negative control: the OLD shape, which could not go red ─────────────────
//
// Without this, arm V's third row is a green with nothing to contrast against: it would pass
// whether or not the change had any effect on the exit code.
const oldShape = { pass: true, kind: 'measurement' as Kind };
check('N', 'the shape this replaced could NOT report a false decomposition',
  exitCodeFor(oldShape) === 0,
  `the pre-change verdict was \`pass: true, kind: 'measurement'\` regardless of the remainder, ` +
  `so even a −250 ms remainder exited ${exitCodeFor(oldShape)}. Arm V row 3 is a green that ` +
  `could have been red.`);

// ── Arm D — has the copy above drifted from the source it claims to mirror? ─────────────
const src = fs.readFileSync(ARM_O_SOURCE, 'utf8');
const stillThere = [
  "remainder >= 0 ? 'positive'",
  "Math.abs(remainder) <= remainderBand ? 'within-noise'",
  "remainderState === 'positive'",
  "remainderState === 'beyond-noise' ? 'regression' : 'measurement'",
];
const missing = stillThere.filter((s) => !src.includes(s));
check('D', 'the branch this file copies is still the branch arm O runs', missing.length === 0,
  missing.length === 0
    ? `all ${stillThere.length} markers present in ${path.basename(ARM_O_SOURCE)}`
    : `DRIFTED — not found in the source: ${missing.join(' · ')}. This file is now testing a branch nobody runs.`);

check('D', 'and the hardcoded pass is gone from that call',
  !/check\('O', 'fingerprinting is attributed at the surface it is described at', true,/.test(src),
  'the literal `true` in arm O\'s remainder check is what Rounds 227/228/230 kept naming.');

// ── summary ──────────────────────────────────────────────────────────────────────────────
const { summariseAndExit } = await import('./lib/probe-outcome.mts');
summariseAndExit({ probeName: PROBE, results });
