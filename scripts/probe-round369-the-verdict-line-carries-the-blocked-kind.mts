/**
 * The verdict line now carries the blocked KIND — and the counter is keyed on the exit code, because
 * the obvious key double-counts the only probe that can reach the state.
 *
 * Round 369, Daedalus, 2026-10-11 (START fire). Lands the item Theseus's Round 368 §4 wrote down and
 * left unclaimed after two seats declined it in sequence — "which is how an item sits for 96 rounds".
 * The shape is his; three things in it are not, and two of those are corrections to it.
 *
 * ── What was wrong before, and why the first cure was worse than nothing ───────
 *
 * The verdict line said `N blocked (did not conclude)`. That parenthetical was honest and empty: it
 * was chosen in Round 271 because the exit-2 wording "could not run" would have overstated the
 * exit-3 case, and it bought the honesty by declining to say anything. The distinction the per-probe
 * rows spend four lines keeping apart — "could not run" vs "ran but did not finish" — was legible
 * there and invisible on the line a reader actually quotes into COORDINATION.
 *
 * Round 367 (mine) proposed `N blocked (N declared blocker, clearable)`. Theseus's Round 368 grader
 * killed it, correctly: `BLOCKED` is unreachable without a declaration — both limbs of `classify`
 * require one — so `declared === blocked` over every population that can exist, and the second
 * figure could never differ from the first. It agreed vacuously across two populations of different
 * kinds while reading as though it had measured something. Arm B5 holds that wording out of the
 * shipped line, so it cannot come back by a later edit that finds it plausible again.
 *
 * ── The correction to his spelling: the key is the exit code, not the flags ────
 *
 * His §4 said "split `blocked` into `blockedRefused` / `blockedSkipped`" without naming the
 * predicate. The reachable predicate is wrong. `refused` and `skipped` are independent predicates
 * over the same output, and `probe-round225` is the only SWEPT entry declaring BOTH a `refusal` and
 * a `skip`, so it is the only entry for which both flags can be true at once. Driven, at exit 3, on
 * an output built from that entry's own two patterns (C2-C4):
 *
 *     exit-code key (shipped)   ->  blocked 1, refused 0, skipped 1    sum 1  ✓
 *     flag key      (rejected)  ->  blocked 1, refused 1, skipped 1    sum 2  ✗
 *
 * The flag key prints a verdict line whose kind figures contradict its own `blocked`, on the one
 * probe in the set that can currently reach BLOCKED at all. C4 is that counterfactual as a known
 * positive: it asserts the rejected key really does over-count, so C3 is not a check that passes
 * because nothing was at stake.
 *
 * ── The second correction: a pin that re-spells a format pins nothing ─────────
 *
 * His grader had to re-implement the proposed wording from the prose of a memo, because the format
 * string lived inside `main()` and there was nothing to call. A pin written that way grades a COPY
 * against its author's expectations — the same vacuity it exists to detect, one level down. So
 * `verdictLine` and `blockedKind` are now exported, and every arm below drives the real functions.
 * Nothing here re-spells the format.
 *
 * ── Polarity ──────────────────────────────────────────────────────────────────
 *
 * B1/B2 are the load-bearing pair and they are a two-sided pin: the two populations have an
 * ASSERTED-EQUAL `blocked` (B0, so this is not comparing different-sized things) and must render
 * DIFFERENTLY (B3). B4 is the control that makes B3 attributable — two different refusal-blocked
 * populations must render IDENTICALLY, so the variation in B3 is kind and not row identity. A future
 * edit that collapses the two kinds back into one string reddens B3; an edit that makes the line
 * vary on something other than kind reddens B4. It cannot be cleared by deleting what it reads.
 *
 * D1 drives the documented example in `sweep-probes.mjs`'s own header against the live template.
 * That file has shipped a stale worked example of this very line twice; an arm catching it costs
 * nothing, and prose written beside its own cure is exactly the thing that ships false.
 *
 * NOT claimed: that `probe-round225`'s live blocked output trips both flags. Its skip line carries
 * exit/duration/pass/fail counts, not the refusal text. The both-flags case is established as
 * reachable by construction through `classify`, which is all the partition argument needs — the
 * shipped key is correct whether or not that run is the one that occurs. `:3001` read free this
 * fire, so the occupied-port cell was not available to measure it either way.
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { summariseAndExit, type ProbeVerdict } from './lib/probe-outcome.mts';
import { SWEPT, classify, blockedKind, blockedTally, verdictLine } from './sweep-probes.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const SWEEP = join(HERE, 'sweep-probes.mjs');

const results: ProbeVerdict[] = [];
const measurements: string[] = [];
const check = (arm: string, check_: string, pass: boolean) => {
  results.push({ arm, check: check_, pass, kind: 'regression' });
  console.log(`${pass ? '[ok]' : 'FAIL'} ${arm}  ${check_}`);
};
const meas = (arm: string, line: string) => {
  measurements.push(`${arm}  ${line}`);
  console.log(`[MEAS] ${arm}  ${line}`);
};

/** The shape `main()` passes to {@link verdictLine}, with everything green. */
const GREEN = {
  swept: 36,
  red: 0,
  blocked: 0,
  blockedRefused: 0,
  blockedSkipped: 0,
  bad: 0,
  deferred: 109,
};

// ── Section A — `blockedKind` reads the limb that fired, with a control per limb ──
//
// Each positive limb is paired with a negative, because a classifier checked only on the inputs it
// is supposed to accept is a classifier that cannot see its own false positives.

check('A1', 'BLOCKED at exit 2 is the refusal kind', blockedKind('BLOCKED', 2) === 'refused');
check('A2', 'BLOCKED at exit 3 is the skip kind', blockedKind('BLOCKED', 3) === 'skipped');
check(
  'A3',
  'PASS at exit 0 has no kind — a kind is a property of being BLOCKED, not of the exit code',
  blockedKind('PASS', 0) === undefined,
);
check(
  'A4',
  'RED at exit 2 has no kind — so the kind cannot be read off the exit code alone, which is what ' +
    'makes A1 a statement about the limb rather than about the number 2',
  blockedKind('RED', 2) === undefined,
);
check(
  'A5',
  'RED at exit 3 has no kind either (the same control on the other limb)',
  blockedKind('RED', 3) === undefined,
);
check(
  'A6',
  'a BLOCKED run at a code with no limb THROWS rather than returning undefined — a silent ' +
    'kind-less BLOCKED would be counted in `blocked` and in neither kind, and the line would not sum',
  (() => {
    try {
      blockedKind('BLOCKED', 7);
      return false;
    } catch (e) {
      return e instanceof Error && /no kind/.test(e.message);
    }
  })(),
);

// ── Section B — the kind split carries a bit; the killed wording could not ──

const refusalPop = { ...GREEN, blocked: 1, blockedRefused: 1, blockedSkipped: 0 };
const skipPop = { ...GREEN, blocked: 1, blockedRefused: 0, blockedSkipped: 1 };

check(
  'B0',
  `the two populations have an equal blocked count (${refusalPop.blocked} and ${skipPop.blocked}), ` +
    'so B1-B3 are not comparing different-sized things',
  refusalPop.blocked === skipPop.blocked,
);

const refusalLine = verdictLine(refusalPop);
const skipLine = verdictLine(skipPop);
meas('B1', `refusal-blocked -> ${refusalLine}`);
meas('B2', `skip-blocked    -> ${skipLine}`);

check(
  'B1',
  'a refusal-blocked population renders "1 blocked (1 could not run, 0 ran but did not finish)"',
  refusalLine.includes('1 blocked (1 could not run, 0 ran but did not finish)'),
);
check(
  'B2',
  'a skip-blocked population renders "1 blocked (0 could not run, 1 ran but did not finish)"',
  skipLine.includes('1 blocked (0 could not run, 1 ran but did not finish)'),
);
check(
  'B3',
  'and the two lines DIFFER — the annotation carries a bit, which is the whole claim the ' +
    '`(N declared blocker, clearable)` wording could not make',
  refusalLine !== skipLine,
);
check(
  'B4',
  'control: two DIFFERENT refusal-blocked populations render identically, so B3 is attributable ' +
    'to kind and not to row identity',
  verdictLine({ ...refusalPop }) === verdictLine({ ...GREEN, blocked: 1, blockedRefused: 1, blockedSkipped: 0 }),
);
check(
  'B5',
  'the killed wording is not in the shipped line — `declared === blocked` by construction, so ' +
    '"declared blocker" could never have read as anything but the blocked count restated',
  !refusalLine.includes('declared blocker') && !skipLine.includes('declared blocker'),
);
check(
  'B6',
  'the retired `(did not conclude)` parenthetical is gone from the shipped line',
  !refusalLine.includes('did not conclude') && !verdictLine(GREEN).includes('did not conclude'),
);
check(
  'B7',
  'the kind figures sum to `blocked` on both populations, and the green line shows the invariant ' +
    'too (0 + 0 = 0) rather than hiding it on the runs a reader sees most',
  refusalPop.blockedRefused + refusalPop.blockedSkipped === refusalPop.blocked &&
    skipPop.blockedRefused + skipPop.blockedSkipped === skipPop.blocked &&
    verdictLine(GREEN).includes('0 blocked (0 could not run, 0 ran but did not finish)'),
);

// ── Section C — the partition, on the one entry that can set both flags ──
//
// C1 reads the live SWEPT list rather than naming a filename, so promoting a second both-declaring
// entry changes this measurement instead of sliding past it.

const bothDeclaring = SWEPT.filter((s) => s.refusal && s.skip).map((s) => s.file);
meas('C1', `SWEPT entries declaring BOTH a refusal and a skip: ${bothDeclaring.length} — [${bothDeclaring.join(', ')}]`);
check(
  'C1',
  `at least one SWEPT entry declares both a refusal and a skip, so the both-flags state is ` +
    `representable and C2-C4 are about a live entry (found ${bothDeclaring.length})`,
  bothDeclaring.length >= 1,
);

const r225 = SWEPT.find((s) => s.file.startsWith('probe-round225'));
check('C2a', 'probe-round225 is the entry carrying both patterns', !!r225 && !!r225.refusal && !!r225.skip);

// Built from that entry's OWN two patterns rather than from an analogy — a known positive has to
// carry the property, not resemble it.
const bothFlagsOut = [
  'INCONCLUSIVE — probe-round369 fixture: established some checks and skipped 1 arm(s).',
  'SKIP [B] the drive of probe-round223b — COULD NOT RUN, not failed',
  'probe-round223b: something already holds 3001. Stop it and re-run.',
  'did not run: arm B: the drive of probe-round223b — it refused at its own door',
].join('\n');

const c = r225
  ? classify(3, bothFlagsOut, r225.expect, r225.refusal, r225.skip)
  : { state: 'RED' as const, refused: false, skipped: false, code: 3, matched: false };

meas('C2', `classify(3, both-flags output) -> state=${c.state} refused=${c.refused} skipped=${c.skipped}`);
check(
  'C2',
  'the both-flags state is reachable through the real `classify`: BLOCKED at exit 3 with BOTH ' +
    '`refused` and `skipped` true — the premise C3/C4 rest on, asserted rather than assumed',
  c.state === 'BLOCKED' && c.refused === true && c.skipped === true,
);

// C3 drives the REAL accumulator — `blockedTally`, the function `main()` calls — rather than
// re-implementing the tally here. That distinction is this round's own counterfactual finding: with
// the accumulation inlined in the loop, a C3 that recomputed it stayed green while the loop's key
// was mutated to the flags, and only the source-text arm E3 noticed.
const shipped = blockedTally([{ state: c.state, code: c.code }]);

// The rejected alternative, computed here because it is the thing that does NOT ship. C4 is a known
// positive: if this does not over-count, C3 is passing with nothing at stake.
const flagKeyed = {
  refused: c.state === 'BLOCKED' && c.refused ? 1 : 0,
  skipped: c.state === 'BLOCKED' && c.skipped ? 1 : 0,
};
meas('C3', `blockedTally (shipped) -> blocked ${shipped.blocked}, refused ${shipped.blockedRefused}, skipped ${shipped.blockedSkipped}, kinds sum ${shipped.blockedRefused + shipped.blockedSkipped}`);
meas('C4', `rejected flag key      -> blocked 1, refused ${flagKeyed.refused}, skipped ${flagKeyed.skipped}, kinds sum ${flagKeyed.refused + flagKeyed.skipped}`);

check(
  'C3',
  'driven through the real `blockedTally`, the both-flags run contributes to exactly one kind, so ' +
    'the kinds partition `blocked` (kinds sum 1 against blocked 1)',
  shipped.blocked === 1 &&
    shipped.blockedRefused + shipped.blockedSkipped === shipped.blocked &&
    shipped.blockedSkipped === 1 &&
    shipped.blockedRefused === 0,
);
check(
  'C4',
  'known positive: under the REJECTED flag key the same run contributes to both kinds, summing 2 ' +
    'against a blocked of 1 — so C3 is a check with something at stake, not one that passes vacuously',
  flagKeyed.refused + flagKeyed.skipped === 2,
);
check(
  'C6',
  'and `blockedTally` partitions over a MIXED population too — one refusal-blocked, one ' +
    'skip-blocked, one both-flags, one PASS that must not be counted at all',
  (() => {
    const t = blockedTally([
      { state: 'BLOCKED', code: 2 },
      { state: 'BLOCKED', code: 3 },
      { state: c.state, code: c.code },
      { state: 'PASS', code: 0 },
    ]);
    return (
      t.blocked === 3 &&
      t.blockedRefused === 1 &&
      t.blockedSkipped === 2 &&
      t.blockedRefused + t.blockedSkipped === t.blocked
    );
  })(),
);
check(
  'C7',
  'control: `blockedTally` over a population with no BLOCKED run returns all zeroes rather than ' +
    'counting the RED and PASS rows it was handed',
  (() => {
    const t = blockedTally([
      { state: 'RED', code: 2 },
      { state: 'RED', code: 3 },
      { state: 'PASS', code: 0 },
    ]);
    return t.blocked === 0 && t.blockedRefused === 0 && t.blockedSkipped === 0;
  })(),
);
check(
  'C5',
  'and the kind attributed is the SKIP kind, matching the limb that actually fired (exit 3) rather ' +
    'than the refusal text that merely happened to be present',
  blockedKind(c.state, c.code) === 'skipped',
);

// ── Section D — the documented example, driven against the live template ──

const sweepSrc = readFileSync(SWEEP, 'utf8');
const leadingDoc = /^\s*\/\*\*([\s\S]*?)\*\//.exec(sweepSrc)?.[1] ?? '';
const documented =
  /^\s*\*\s{4,}(SWEEP (?:PASSED|BLOCKED|FAILED) — .*could not run.*)$/m.exec(leadingDoc)?.[1]?.trim() ??
  null;

// The bindings the header states for that worked example: 14 swept, 13 green, 0 red, 1 blocked of
// the skip kind, 0 census problems, today's deferred count.
const rendered = verdictLine({
  swept: 14,
  red: 0,
  blocked: 1,
  blockedRefused: 0,
  blockedSkipped: 1,
  bad: 0,
  deferred: 109,
});
meas('D1', `header example: ${documented === null ? 'NOT FOUND' : documented}`);
check(
  'D1',
  'the worked example in sweep-probes.mjs\'s own header is byte-identical to what `verdictLine` ' +
    'renders from the bindings the header states — the example is driven, not proofread',
  documented === rendered,
);
check(
  'D2',
  'and the header still carries the superseded pre-Round-369 shape as a record of that run, so the ' +
    'example above reads as a shape change rather than as a correction of the figures',
  /1 blocked, 0 census problem\(s\)/.test(leadingDoc),
);

// ── Section E — the call site actually uses the extracted function ──
//
// Without this, every arm above could pass against an exported function that `main()` does not call,
// which is the failure mode of pinning a pure half that the impure half has quietly forked.

const MAIN_ANCHOR = 'const blockedRuns = [];';
check(
  'E0',
  `the anchor Section E slices \`main()\` at occurs exactly once, so E1-E3 read the body they ` +
    `intend to — a source-reading arm that silently slices at the wrong place reports a smaller number`,
  (sweepSrc.match(/const blockedRuns = \[\];/g) || []).length === 1,
);
const mainBody = sweepSrc.slice(sweepSrc.indexOf(MAIN_ANCHOR));
check(
  'E1',
  '`main()` renders the verdict through `verdictLine` rather than through a second copy of the ' +
    'format string — so Sections B and D are about the line the sweep really prints',
  /console\.log\(\s*verdictLine\(\{/.test(mainBody),
);
check(
  'E2',
  'and there is exactly one template carrying the kind wording in the file, so no fork of it ' +
    'survives the extraction',
  (sweepSrc.match(/\$\{blockedRefused\} could not run/g) || []).length === 1,
);
check(
  'E3',
  '`main()` takes all three blocked figures from `blockedTally` rather than accumulating them at ' +
    'the call site — so C3/C6/C7 grade the counts the sweep really prints',
  /const \{ blocked, blockedRefused, blockedSkipped \} = blockedTally\(blockedRuns\);/.test(mainBody) &&
    !/blockedRefused \+= 1/.test(mainBody) &&
    !/blockedSkipped \+= 1/.test(mainBody),
);
check(
  'E4',
  'the loop hands `blockedTally` only `{ state, code }` — withholding the flags is what makes the ' +
    'flag-keyed mistake UNREPRESENTABLE inside the tally rather than merely detected by C3',
  /blockedRuns\.push\(\{ state, code \}\);/.test(mainBody) &&
    /for \(const \{ state, code \} of runs\) \{/.test(sweepSrc),
);

console.log('');
for (const m of measurements) console.log(`[MEAS] ${m}`);

summariseAndExit({ probeName: 'probe-round369', results });
