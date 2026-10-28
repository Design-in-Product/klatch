#!/usr/bin/env node
// Round 464 — grade Daedalus's proposed round-track stop condition.
//
// SUBJECT (quoted here for orientation only; T6 reads the committed memo's bytes, not this copy):
//
//   "The track continues while its rounds keep curing defects in surfaces that have a standing
//    gate (packages/, scripts/). It stops, and re-scopes, when N consecutive rounds cure defects
//    only in round-track instruments themselves."
//      — docs/mail/daedalus-to-calliope-argus-theseus-cc-iris-janus-xian-both-asks-answered-...md
//
// He asked this seat to accept it or counter it. This cell grades the PROPOSAL AS AN INSTRUMENT:
// can it be computed, can it refuse, and does its key separate what it claims to separate?
//
// It is NOT a grading of whether the track should stop. That is a judgement; this is the
// measurement the judgement needs.
//
// DESIGN NOTES
//
// 1. Every figure printed below is read off a measurement in this run. Where a leg cannot
//    measure, it publishes `null` and `measured()` turns that into REFUSED, not into `ok`.
//    (Fleet rule: a refusable value printed beside its own guard is dead code; a sentinel
//    fallback makes a comparison green forever.)
// 2. The population is selected with `git log` at a STAMPED rev, and the rev is printed. The
//    window `--since` is ABSOLUTE — see design note 4; the first version of this cell used the
//    bare date his memo used and that made the population clock-dependent.
// 3. T4 and T5 are the control pair. T3's disagreement only separates something if the key CAN
//    agree somewhere (T5) and if the disagreement is named by member rather than by count (T4).
// 4. REPAIR 2026-10-27 MID→WORK. `--since=2026-10-13` is NOT midnight: git's approxidate fills
//    unspecified components from the current clock, so the cutoff is 10-13 at the drive's own
//    time-of-day. The window therefore slides forward every hour and members fall off its TAIL.
//    Measured: bare form 569 commits at 14:49, explicit midnight 588. drive1 (10:51) saw 8
//    distinct `scripts/` files; drive2 (14:49), same source, same `--since` string, saw 7. The
//    REV stamp made the recording LOOK reproducible while the population was keyed on wall clock.
//    Cured by pinning a time; graded by W1, which names the tail loss by member.
// 5. REPAIR, same fire. T1 pinned two population COUNTS and reddened on its own promotion (this
//    round's own two `.mjs` files entered the population it measures). Sizes are now published as
//    measurements; the gated claim is the one that cannot move on promotion.
// 6. REPAIR, same fire. T6 sliced a literal path under `docs/mail/`. The close-discipline
//    `git mv`s a closed thread to `docs/mail/read/`, so the slice refused. Now keyed on the
//    memo's BASENAME located in the rev's tree, which survives the documented move.
// 7. RE-AIM 2026-10-28 START. T2 asserted `consecutive > 0`, which makes it RED on GOOD NEWS:
//    a run of 0 means the track just cured a gated surface. Daedalus routed that here on 10-28
//    after his 87270c6f moved the value 454/10 → 464/0. T2 now asserts the condition has NOT
//    fired (`consecutive < N_PROPOSED`), so a RED means "the track should stop and re-scope" —
//    the same information with the polarity the reader expects. The evaluability half of the old
//    leg text is carried by `measured()` refusing, and by G1, which is the gate.
// 8. ADDED, same fire. T2b. `87270c6f` credits round 464 under the dir key only because it filed
//    an artifact into round 464's directory; round 464 cured nothing. Under a SELF-ATTESTED key
//    (the crediting commit's subject names the round, OR the commit created the round's dir) the
//    same rev reads 454/10 and the condition HAS fired. T2b publishes that disagreement, so the
//    standing line can no longer be quoted without the key it was computed under. The key and its
//    controls are graded in `docs/research/unit-464t2-reaim-2026-10-28/grade-the-credit-key.mjs`
//    (9 legs, 6 cripples); it is RE-IMPLEMENTED here rather than imported, on design note 4's own
//    reasoning — this is the cell this seat re-drives every fire and it must not acquire a
//    cross-directory dependency a later round's guard can kill. `P6` pins the two agreeing.
// 9. RETIRED, same fire: P1, P3, P4. Each was pre-registered on 10-27, LANDED that day, and was
//    decided against by a real event rather than by a defect — P1/P3 by 87270c6f, P4 by the bare
//    window's eroded band shrinking as the drive clock moved earlier in the boundary day. Left
//    live they would publish `refuted=[P1,P3,P4]` every fire beside leg text asserting the OLD
//    value, which is the "a cured figure leaves a live sentence about the old one" defect. T9
//    carries their full history — both values, the rev each was read at, and the cause — which is
//    strictly more than the `refuted` token said. Nothing is deleted, and none is re-keyed onto a
//    value where it would land: a prediction bent until it passes grades nothing.

import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync, readdirSync } from 'node:fs';

const REPO = new URL('../../..', import.meta.url).pathname.replace(/\/$/, '');
// ABSOLUTE cutoff. `SINCE_BARE` is kept only so W1 can drive the defect it replaced.
const SINCE = '2026-10-13 00:00:00';
const SINCE_BARE = '2026-10-13';
// The numeric bound this seat supplied with the condition on 2026-10-27. T6 reports that the
// PROPOSAL left N unspecified; a condition with a free bound cannot fire, so the value is named
// here and the leg that uses it says which number it used.
const N_PROPOSED = 5;

// ---------------------------------------------------------------------------
// CRIPPLES. Each of the three repairs driven this fire has one, so that its leg
// is graded by being made to fail rather than by being observed to pass. A green
// leg that was never crippled grades nothing.
//
//   window-bare : restore the bare `--since`, so absolute == bare   -> W1 must RED
//   memo-path   : restore T6's literal `docs/mail/` path            -> T6 must REFUSE
//   t1-no-clock : reconstruct T1 without supplying the drive clock  -> T1 must RED
//   t1-bare-clock : put a BARE date back in the t1-no-clock recon key -> W4 must RED
//                 (added 10-28. The `t1-no-clock` cripple was keyed on the ambient clock and
//                  stopped separating T1 on a fire that ran near drive1's hour. This arm
//                  reproduces that regression deterministically, so W4's green is graded.)
//   t2-dir-only : make the self-attested key admit every credit     -> T2b must go GREEN
//                 (added 10-28 with T2b: a second key that admits everything republishes the
//                  dir key's figure while reading as a second opinion, and T2b's RED is the
//                  whole finding, so the one thing that must be graded is that the RED is
//                  load-bearing rather than structural)
//
// Selected by argv, so the committed source is the real source in every arm; each
// name below is referenced again at its own site, so a cripple that nothing reads
// cannot sit here looking live. An unknown name exits non-zero rather than running
// a clean arm under a crippled filename.
//
//   node grade-the-stop-condition.mjs [window-bare|memo-path|t1-no-clock|t1-bare-clock|t2-dir-only]
// ---------------------------------------------------------------------------
const CRIPPLES = ['window-bare', 'memo-path', 't1-no-clock', 't1-bare-clock', 't2-dir-only'];
const CRIPPLE = process.argv[2] ?? null;
if (CRIPPLE !== null && !CRIPPLES.includes(CRIPPLE)) {
  console.error(`unknown cripple ${JSON.stringify(CRIPPLE)}; known: ${CRIPPLES.join(',')}`);
  process.exit(2);
}

function git(args) {
  return execFileSync('git', ['-C', REPO, ...args], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    maxBuffer: 64 * 1024 * 1024,
  });
}

const REV = git(['rev-parse', 'HEAD']).trim();

// ---------------------------------------------------------------------------
// Verdict harness (local, so this cell has no cross-round dependency that a
// later round's guard can kill — Round 453's finding, applied to myself).
// ---------------------------------------------------------------------------
const legs = [];
const preds = [];
/** A leg whose value may legitimately be unmeasurable. null => REFUSED, never ok. */
function measured(value, id, text, detail) {
  legs.push({ id, text, detail, value: value === null || value === undefined ? null : !!value });
}
function predict(id, text, expected, actualThunk) {
  let actual;
  try {
    actual = actualThunk();
  } catch (e) {
    actual = null;
  }
  preds.push({ id, text, expected, actual });
}
function allOf(...vals) {
  if (vals.some((v) => v === null || v === undefined)) return null;
  return vals.every(Boolean);
}

// ---------------------------------------------------------------------------
// Population: commits in the window, with author, subject, and touched paths.
// ---------------------------------------------------------------------------
const SEP = '\u0001';

/**
 * Load the commit population for a given `--since` argument. Returns null on any
 * failure, so a caller cannot mistake an empty population for a loaded one.
 * Takes the window as a PARAMETER so W1 can point the same reader at the key it
 * replaced (a leg you cannot aim at a counterfactual cannot be graded for vacuity).
 */
function loadCommits(sinceArg, rev = null) {
  try {
    const raw = git([
      'log',
      ...(rev ? [rev] : []),
      `--since=${sinceArg}`,
      `--format=${SEP}%H${SEP}%an${SEP}%ad${SEP}%s`,
      '--date=short',
      '--name-only',
    ]);
    const records = raw.split('\n' + SEP);
    records[0] = records[0].replace(/^\u0001/, '');
    const out = [];
    for (const rec of records) {
      if (!rec.trim()) continue;
      const lines = rec.split('\n');
      const head = lines[0].split(SEP);
      if (head.length < 4) continue;
      const [hash, author, date, ...subjParts] = head;
      out.push({
        hash,
        author,
        date,
        subject: subjParts.join(SEP),
        files: lines.slice(1).filter((l) => l.trim().length > 0),
      });
    }
    return out;
  } catch (e) {
    return null;
  }
}

// Under `window-bare` the cell's own window reverts to the clock-keyed one, so
// the absolute and bare arms coincide and W1 has nothing to separate.
const SINCE_EFFECTIVE = CRIPPLE === 'window-bare' ? SINCE_BARE : SINCE;
let commits = loadCommits(SINCE_EFFECTIVE);
let popError = commits === null ? 'git log failed for the absolute window' : null;
if (commits === null) commits = [];
const commitsBare = loadCommits(SINCE_BARE);

const GATED_RE = /^(packages|scripts)\//;
const ROUND_DIR_RE = /^docs\/research\/round(\d+)-/;
// Subject-prefix key: how a round labels its own commit, e.g. "round454: ..." or "feat(round249):"
const SUBJECT_ROUND_RE = /\bround\s*(\d+)\b/i;

for (const c of commits) {
  c.gatedFiles = c.files.filter((f) => GATED_RE.test(f));
  c.touchesGated = c.gatedFiles.length > 0;
  const rs = new Set();
  for (const f of c.files) {
    const m = ROUND_DIR_RE.exec(f);
    if (m) rs.add(Number(m[1]));
  }
  c.dirRounds = [...rs].sort((a, b) => a - b);
  const sm = SUBJECT_ROUND_RE.exec(c.subject);
  c.subjectRound = sm ? Number(sm[1]) : null;
}

const gated = commits.filter((c) => c.touchesGated);

// Every round that EXISTS as a directory, so "consecutive rounds" counts real rounds.
let existingRounds = [];
try {
  existingRounds = readdirSync(`${REPO}/docs/research`)
    .map((d) => /^round(\d+)-instruments$/.exec(d))
    .filter(Boolean)
    .map((m) => Number(m[1]))
    .sort((a, b) => a - b);
} catch (e) {
  existingRounds = [];
}

console.log(`=== GRADE/464 the proposed stop condition ===`);
console.log(`REV ${REV}`);
console.log(`WINDOW --since=${JSON.stringify(SINCE_EFFECTIVE)}  (absolute; see design note 4)`);
console.log(`CRIPPLE ${CRIPPLE ?? 'none'}`);
console.log(`CLOCK ${new Date().toISOString()}  — printed because the REPLACED key depended on it`);
console.log(`POPULATION commits=${commits.length} gated=${gated.length} roundDirsExisting=${existingRounds.length}`);
if (popError) console.log(`POPULATION ERROR: ${popError}`);

// ---------------------------------------------------------------------------
// G1 — GATE LEG. A refusal here MUST be a RED: if the population did not load,
// every other leg below is reporting about nothing. (Round 459 §2.)
// ---------------------------------------------------------------------------
const g1 = popError === null && commits.length > 0 && existingRounds.length > 0;
legs.push({
  id: 'G1',
  text: 'GATE: the commit population and the round-directory list both loaded non-empty',
  detail: `commits=${commits.length} roundDirs=${existingRounds.length} popError=${popError ?? 'none'}`,
  value: g1,
});

// ---------------------------------------------------------------------------
// W1 — KNOWN POSITIVE for the window defect this cell was repaired for.
// Drive the REPLACED key (the bare date) alongside the cure and name what the
// bare key loses off the TAIL of its window, by member, not by count.
//
// Containment (bare subset of absolute) is guaranteed by construction and is
// therefore NOT what is gated — a conjunct the filter makes true cannot be
// re-keyed red. What is gated is STRICT loss: that the bare key drops commits
// the absolute key keeps, so the cure is load-bearing rather than cosmetic.
// ---------------------------------------------------------------------------
let w1 = null;
let w1detail = 'the bare-window population did not load';
let barePathLoss = [];
if (commitsBare !== null && commits.length > 0) {
  const absHashes = new Set(commits.map((c) => c.hash));
  const bareHashes = new Set(commitsBare.map((c) => c.hash));
  const lostCommits = commits.filter((c) => !bareHashes.has(c.hash));
  const gainedByBare = commitsBare.filter((c) => !absHashes.has(c.hash));
  const absScripts = new Set();
  const bareScripts = new Set();
  for (const c of commits) for (const f of c.files) if (f.startsWith('scripts/')) absScripts.add(f);
  for (const c of commitsBare) for (const f of c.files) if (f.startsWith('scripts/')) bareScripts.add(f);
  barePathLoss = [...absScripts].filter((f) => !bareScripts.has(f)).sort();
  console.log(`\nW1 the window key this cell was repaired for, driven against its cure:`);
  console.log(`  absolute "${SINCE_EFFECTIVE}" : commits=${commits.length}`);
  console.log(`  bare     "${SINCE_BARE}" : commits=${commitsBare.length}`);
  console.log(`  commits the BARE key drops off its tail: ${lostCommits.length}`);
  console.log(`  commits the BARE key has and absolute does not (must be 0): ${gainedByBare.length}`);
  console.log(`  oldest commit each key reaches:`);
  console.log(`    absolute ${commits.length ? commits[commits.length - 1].hash.slice(0, 8) : '-'}`);
  console.log(`    bare     ${commitsBare.length ? commitsBare[commitsBare.length - 1].hash.slice(0, 8) : '-'}`);
  console.log(`  distinct scripts/ files the BARE key cannot see (${barePathLoss.length}):`);
  for (const f of barePathLoss) console.log(`    ${f}`);
  w1 = lostCommits.length > 0 && gainedByBare.length === 0;
  w1detail =
    `absolute=${commits.length} bare=${commitsBare.length} tailLoss=${lostCommits.length} ` +
    `bareOnly=${gainedByBare.length} scriptsMembersLost=${barePathLoss.length} ` +
    `[${barePathLoss.join(', ')}]`;
}
measured(
  w1,
  'W1',
  'the bare date `--since=2026-10-13` drops commits the absolute cutoff keeps, and drops none the absolute cutoff lacks — git approxidate fills the time-of-day from the drive clock, so the REPLACED key made this cell irreproducible from its own stamped rev',
  w1detail
);

// ---------------------------------------------------------------------------
// W2 — BOUND the hazard W1 found, in the direction that blunts it.
//
// The eroded band is [SINCE-date 00:00, SINCE-date clock), so it is confined to
// the window's BOUNDARY DAY and can never reach a commit from a later day. The
// question that matters is therefore not "do the figures move" (W1: they do) but
// "does the CONDITION'S VALUE move" — i.e. is the most recent gated-curing round
// the same under both keys. It is computed under both arms here rather than
// asserted, and the leg REFUSES unless both arms reach a value, so two dead arms
// cannot read as agreement.
// ---------------------------------------------------------------------------
function lastGatedCuringRound(pop) {
  if (pop === null) return undefined;
  const rounds = new Set();
  for (const c of pop) {
    if (!c.files.some((f) => GATED_RE.test(f))) continue;
    for (const f of c.files) {
      const m = ROUND_DIR_RE.exec(f);
      if (m) rounds.add(Number(m[1]));
    }
  }
  return rounds.size ? Math.max(...rounds) : undefined;
}
const sinceDay = SINCE_EFFECTIVE.slice(0, 10);
const bareHashSet = commitsBare === null ? null : new Set(commitsBare.map((c) => c.hash));
const erodedBand = bareHashSet === null ? null : commits.filter((c) => !bareHashSet.has(c.hash));
const offBoundaryDay =
  erodedBand === null ? null : erodedBand.filter((c) => c.date !== sinceDay);
const lastAbs = lastGatedCuringRound(commits.length ? commits : null);
const lastBare = lastGatedCuringRound(commitsBare);
let w2 = null;
let w2detail = 'one or both arms did not reach a last-gated-curing-round value';
if (lastAbs !== undefined && lastBare !== undefined && offBoundaryDay !== null) {
  console.log(`\nW2 how far the W1 hazard reaches:`);
  console.log(`  eroded band size                : ${erodedBand.length}`);
  console.log(`  of those, NOT on ${sinceDay}   : ${offBoundaryDay.length} (band is confined to the boundary day)`);
  console.log(`  last gated-curing round, absolute: ${lastAbs}`);
  console.log(`  last gated-curing round, bare    : ${lastBare}`);
  w2 = offBoundaryDay.length === 0 && lastAbs === lastBare;
  w2detail =
    `band=${erodedBand.length} offBoundaryDay=${offBoundaryDay.length} ` +
    `lastGatedCuringRound absolute=${lastAbs} bare=${lastBare}`;
}
measured(
  w2,
  'W2',
  "the erosion is confined to the window's boundary day and both keys agree on the most recent gated-curing round — so the window defect broke the cell's REPRODUCIBILITY without moving the condition's value; reported because it blunts W1",
  w2detail
);

// ---------------------------------------------------------------------------
// T1 — his two reported figures, and mine, were taken under the bare key, so
// NEITHER is reproducible from any rev. This leg no longer pins their counts
// (the pin reddened on its own promotion — this round's own two `.mjs` files
// entered the population T1 measures). It publishes the sizes as measurements
// and gates the claim that cannot move on promotion: that the two published
// figures are unreachable under an absolute window, named by member.
// ---------------------------------------------------------------------------
const scriptsFiles = new Set();
const researchFiles = new Set();
const researchMjs = new Set();
for (const c of commits) {
  for (const f of c.files) {
    if (f.startsWith('scripts/')) scriptsFiles.add(f);
    if (f.startsWith('docs/research/')) {
      researchFiles.add(f);
      if (f.endsWith('.mjs')) researchMjs.add(f);
    }
  }
}
const HIS = { scripts: 8, researchMjs: 169 };
// The clock and rev drive1 ran under. The clock was NOT a parameter of that drive —
// it leaked in through the bare `--since`. Naming it is what makes the figure
// re-drivable at all; it is recorded here as the drive's hidden second key.
const DRIVE1 = { rev: 'd057a46c', clock: '2026-10-13 10:51:00' };

// Sizes under the absolute window: published as MEASUREMENTS, not pinned. A pin on
// a population count reddens on its own promotion, and this one did — this round's
// own `recon.mjs` and `grade-the-stop-condition.mjs` are members of `researchMjs`.
const t1scripts = scriptsFiles.size;
const t1mjs = researchMjs.size;
console.log(`\nT1 the two published figures, and whether they are re-drivable:`);
console.log(`  MEAS absolute window, this rev:`);
console.log(`    scripts/ distinct files      : ${t1scripts}`);
console.log(`    docs/research/*.mjs distinct : ${t1mjs}`);
console.log(`  PUBLISHED (his memo, and drive1 of this cell): scripts=${HIS.scripts} researchMjs=${HIS.researchMjs}`);
console.log(`  scripts/ members (absolute window):`);
for (const f of [...scriptsFiles].sort()) console.log(`    ${f}`);

// Reconstruct the published pair by supplying BOTH hidden keys — drive1's rev and
// drive1's wall clock — to the key it actually used (the bare date).
let recon = null;
let reconDetail = 'the reconstruction population did not load';
// Under `t1-no-clock` the reconstruction is given the rev but a DIFFERENT clock from
// drive1's, which is exactly what drive1's recording left a reader holding: a rev and
// no hour.
//
// REPAIR 2026-10-28 START. This cripple used to pass `SINCE_BARE` — the literal
// `'2026-10-13'` — which git resolves against the AMBIENT clock. It separated on
// 10-27 at 14:57 (reconstruction 6/169 vs published 8/169, T1 RED) and STOPPED
// separating on 10-28 at ~11:0x (reconstruction 8/169 == published 8/169, T1 green),
// because this fire ran at nearly the same time of day as drive1's 10:51 and the
// eroded band therefore nearly coincided. The cripple was keyed on the drive clock —
// the hazard it exists to demonstrate — so T1's green was vacuous at some hours and
// load-bearing at others, with nothing in the output saying which. Now pinned to the
// clock drive2 actually ran at, so the arm separates at every hour; `W4` reddens if
// anyone puts a bare date back here, and `W3` keeps the ambient figure printed so the
// coincidence stays visible instead of flipping a verdict silently.
const CLOCK_OTHER = CRIPPLE === 't1-bare-clock' ? SINCE_BARE : '2026-10-13 14:49:00';
const RECON_SINCE =
  CRIPPLE === 't1-no-clock' || CRIPPLE === 't1-bare-clock' ? CLOCK_OTHER : DRIVE1.clock;
const reconCommits = loadCommits(RECON_SINCE, DRIVE1.rev);
if (reconCommits !== null) {
  const rs = new Set();
  const rm = new Set();
  for (const c of reconCommits) {
    for (const f of c.files) {
      if (f.startsWith('scripts/')) rs.add(f);
      if (f.startsWith('docs/research/') && f.endsWith('.mjs')) rm.add(f);
    }
  }
  console.log(`  RECONSTRUCTION at rev=${DRIVE1.rev} --since=${JSON.stringify(RECON_SINCE)}:`);
  console.log(`    scripts/ distinct files      : ${rs.size}  (published ${HIS.scripts})`);
  console.log(`    docs/research/*.mjs distinct : ${rm.size}  (published ${HIS.researchMjs})`);
  recon = rs.size === HIS.scripts && rm.size === HIS.researchMjs;
  reconDetail =
    `absolute now ${t1scripts}/${t1mjs}; reconstruction at (${DRIVE1.rev}, --since=${RECON_SINCE}) ` +
    `${rs.size}/${rm.size} vs published ${HIS.scripts}/${HIS.researchMjs}`;
}
measured(
  recon,
  'T1',
  'the two published figures are reproducible ONLY once the drive clock is supplied alongside the rev — which is the positive demonstration that the bare window had a hidden second key, and the reason neither figure may be pinned',
  reconDetail
);

// ---------------------------------------------------------------------------
// W3 — [MEAS] the AMBIENT bare reconstruction, printed in every arm. This is the
// figure the `t1-no-clock` cripple used to be keyed on, and it moves with the
// hour the fire happens to run at. Kept visible so a future reader can see when
// it coincides with the published pair rather than discovering it by a cripple
// quietly going green.
// ---------------------------------------------------------------------------
let ambientScripts = null;
let ambientMjs = null;
const ambientCommits = loadCommits(SINCE_BARE, DRIVE1.rev);
if (ambientCommits !== null) {
  const as = new Set();
  const am = new Set();
  for (const c of ambientCommits) {
    for (const f of c.files) {
      if (f.startsWith('scripts/')) as.add(f);
      if (f.startsWith('docs/research/') && f.endsWith('.mjs')) am.add(f);
    }
  }
  ambientScripts = as.size;
  ambientMjs = am.size;
}
const ambientCoincides =
  ambientScripts === null ? null : ambientScripts === HIS.scripts && ambientMjs === HIS.researchMjs;
console.log(`\nW3 [MEAS] the AMBIENT bare reconstruction at rev=${DRIVE1.rev} --since=${JSON.stringify(SINCE_BARE)}:`);
console.log(`  scripts/ distinct : ${ambientScripts ?? 'UNMEASURED'}  (published ${HIS.scripts})`);
console.log(`  research .mjs     : ${ambientMjs ?? 'UNMEASURED'}  (published ${HIS.researchMjs})`);
console.log(`  coincides with the published pair at THIS hour: ${ambientCoincides ?? 'UNMEASURED'}`);
console.log(`  drive1's clock was ${DRIVE1.clock}; this drive's is ${new Date().toISOString()}`);
measured(
  null,
  'W3',
  '[MEAS] the ambient bare reconstruction and whether it happens to coincide with the published pair at this hour (no assertion; it is a function of the drive clock)',
  `ambient ${ambientScripts}/${ambientMjs} vs published ${HIS.scripts}/${HIS.researchMjs}; coincides=${ambientCoincides}`
);

// ---------------------------------------------------------------------------
// W4 — the `t1-no-clock` cripple's recon key must carry an explicit TIME, not a
// bare date. A bare date here is resolved against the ambient clock and the
// cripple stops separating at the hours that happen to match drive1's. This is
// the structural guard against reverting the 10-28 repair above.
// ---------------------------------------------------------------------------
measured(
  /\b\d{2}:\d{2}:\d{2}$/.test(CLOCK_OTHER) && CLOCK_OTHER !== DRIVE1.clock,
  'W4',
  'the t1-no-clock cripple reconstructs at an explicitly pinned clock that differs from drive1\'s, so its separating power is not a function of the hour the fire runs at',
  `CLOCK_OTHER=${JSON.stringify(CLOCK_OTHER)} DRIVE1.clock=${JSON.stringify(DRIVE1.clock)} hasExplicitTime=${/\b\d{2}:\d{2}:\d{2}$/.test(CLOCK_OTHER)}`
);

// ---------------------------------------------------------------------------
// T2 — THE UNIT MISMATCH. His condition's unit is a ROUND. His reported current
// value is a count of FILES ("8 against 755"). Compute the per-ROUND value.
// ---------------------------------------------------------------------------
// Dir-membership key: a round "cured a gated surface" if some commit touches
// both that round's dir and a gated file.
const curedByDirKey = new Set();
for (const c of gated) for (const r of c.dirRounds) curedByDirKey.add(r);

const maxRound = existingRounds.length ? existingRounds[existingRounds.length - 1] : null;
const lastCuringRoundDirKey = [...curedByDirKey].length
  ? Math.max(...curedByDirKey)
  : null;
// Consecutive rounds since then that exist and did NOT cure a gated surface.
const consecutiveSelfOnly =
  lastCuringRoundDirKey === null
    ? null
    : existingRounds.filter((r) => r > lastCuringRoundDirKey).length;

console.log(`\nT2 the unit is a ROUND, and the per-round value:`);
console.log(`  rounds that cured a gated surface (dir key): ${[...curedByDirKey].sort((a, b) => a - b).join(',') || 'NONE'}`);
console.log(`  most recent such round                     : ${lastCuringRoundDirKey ?? 'NONE'}`);
console.log(`  highest existing round                     : ${maxRound ?? 'NONE'}`);
console.log(`  CONSECUTIVE rounds since, gated-cure-free  : ${consecutiveSelfOnly ?? 'UNMEASURED'}`);
console.log(`  N_PROPOSED                                 : ${N_PROPOSED}`);
console.log(
  `  FIRED under the dir key                    : ${consecutiveSelfOnly === null ? 'UNMEASURED' : consecutiveSelfOnly >= N_PROPOSED}`
);
// RE-AIMED 2026-10-28 (design note 7). The old key was `consecutive > 0`, which reddens when the
// run is 0 — i.e. on the track having just cured a gated surface. A leg must not be RED on good
// news. The assertion is now the condition itself, in the direction where a RED is a problem:
// the track has NOT reached the point where it should stop and re-scope.
measured(
  consecutiveSelfOnly === null ? null : consecutiveSelfOnly < N_PROPOSED,
  'T2',
  `the stop condition has NOT fired under the dir key — a RED here means the consecutive self-only run has reached N=${N_PROPOSED} and the track should stop and re-scope`,
  `last gated-curing round ${lastCuringRoundDirKey}, highest ${maxRound}, consecutive ${consecutiveSelfOnly}, N=${N_PROPOSED}, fired=${consecutiveSelfOnly === null ? 'UNMEASURED' : consecutiveSelfOnly >= N_PROPOSED}`
);

// ---------------------------------------------------------------------------
// T2b — THE KEY DECIDES THE ANSWER (design note 8). A credit edge is
// SELF-ATTESTED iff the crediting commit's subject names the credited round, or
// the crediting commit is the one that created that round's directory. Clause
// (b) is not decoration: round 417's credit comes from the commit that created
// its directory and that commit's subject carries no round label at all.
//
// `dirCreatorOf` REFUSES with null rather than guessing. An unresolvable creator
// must not become "not self-creating", because that reads identically to
// "incidental" and would manufacture the finding this leg exists to report.
// ---------------------------------------------------------------------------
const creatorCache = new Map();
function dirCreatorOf(round) {
  if (creatorCache.has(round)) return creatorCache.get(round);
  let res = null;
  try {
    const raw = git([
      'log',
      '--diff-filter=A',
      '--reverse',
      `--format=%H${SEP}%an`,
      '--',
      `docs/research/round${round}-instruments/`,
    ]);
    const first = raw.split('\n').find((l) => l.trim().length > 0);
    if (first) {
      const [hash, author] = first.split(SEP);
      if (hash && author) res = { hash, author };
    }
  } catch (e) {
    res = null;
  }
  creatorCache.set(round, res);
  return res;
}

const creditEdges = [];
for (const c of gated) for (const r of c.dirRounds) creditEdges.push({ round: r, commit: c });
for (const e of creditEdges) {
  const creator = dirCreatorOf(e.round);
  if (creator === null) {
    e.genuine = null;
  } else if (CRIPPLE === 't2-dir-only') {
    e.genuine = true;
  } else {
    e.genuine = e.commit.subjectRound === e.round || creator.hash === e.commit.hash;
  }
}
const edgesRefused = creditEdges.filter((e) => e.genuine === null).length;
const curedBySelfAttested =
  edgesRefused > 0
    ? null
    : [...new Set(creditEdges.filter((e) => e.genuine === true).map((e) => e.round))].sort(
        (a, b) => a - b
      );
const lastSelfAttested =
  curedBySelfAttested === null || curedBySelfAttested.length === 0
    ? null
    : Math.max(...curedBySelfAttested);
const consecutiveSelfAttested =
  lastSelfAttested === null ? null : existingRounds.filter((r) => r > lastSelfAttested).length;
const incidentalRounds =
  curedBySelfAttested === null
    ? null
    : [...new Set(creditEdges.filter((e) => e.genuine === false).map((e) => e.round))].sort(
        (a, b) => a - b
      );

const firedDirKey = consecutiveSelfOnly === null ? null : consecutiveSelfOnly >= N_PROPOSED;
const firedSelfAttested =
  consecutiveSelfAttested === null ? null : consecutiveSelfAttested >= N_PROPOSED;

console.log(`\nT2b does the CREDIT KEY decide whether the condition has fired?`);
console.log(`  credit edges                 : ${creditEdges.length} (refused ${edgesRefused})`);
console.log(
  `  dir key            : cure set ${[...curedByDirKey].sort((a, b) => a - b).join(',')} last=${lastCuringRoundDirKey} consecutive=${consecutiveSelfOnly} fired=${firedDirKey ?? 'UNMEASURED'}`
);
console.log(
  `  self-attested key  : cure set ${curedBySelfAttested === null ? 'UNMEASURED' : curedBySelfAttested.join(',')} last=${lastSelfAttested ?? 'UNMEASURED'} consecutive=${consecutiveSelfAttested ?? 'UNMEASURED'} fired=${firedSelfAttested ?? 'UNMEASURED'}`
);
console.log(
  `  credited ONLY by an incidental edge: ${incidentalRounds === null ? 'UNMEASURED' : incidentalRounds.join(',') || 'NONE'}`
);
measured(
  firedDirKey === null || firedSelfAttested === null ? null : firedDirKey === firedSelfAttested,
  'T2b',
  'the dir key and the self-attested key AGREE on whether the condition has fired — a RED means the standing line cannot be quoted without naming the key it came from',
  `dir fired=${firedDirKey} (consecutive ${consecutiveSelfOnly}) vs self-attested fired=${firedSelfAttested} (consecutive ${consecutiveSelfAttested}); incidental=[${incidentalRounds === null ? 'UNMEASURED' : incidentalRounds.join(',')}]`
);

// ---------------------------------------------------------------------------
// T9 — [MEAS] the dated history of this cell's own headline figure (design
// note 9). Carries what retiring P1/P3/P4 would otherwise have dropped: both
// values, the rev each was read at, and the cause of the move. Asserts nothing.
// ---------------------------------------------------------------------------
console.log(`\nT9 [MEAS] dated history of the figure this cell exists to publish:`);
console.log(`  2026-10-27, rev 7a84c8d4 (this cell's source, unchanged since): dir key last=454 consecutive=10 — P1/P3 pre-registered and LANDED`);
console.log(`  2026-10-28, rev 26f3a062 and later                           : dir key last=464 consecutive=0  — P1/P3 decided against`);
console.log(`  cause: 87270c6f (Daedalus, 10-27 17:33) filed a grader under docs/research/round464-instruments/`);
console.log(`         while curing scripts/lib/characterisation-markers.mjs and scripts/lib/offer-choice.mjs.`);
console.log(`         Round 464 is this cell's own round and it cured nothing — see T2b.`);
console.log(`  P4 (the bare window's 2 lost scripts/ paths) read "0|" on 10-28: the eroded band is`);
console.log(`         [10-13 00:00, 10-13 <drive clock>) and the 10-28 drive ran EARLIER in the day`);
console.log(`         than the 10-27 one, so the band shrank 19 -> 7 and no distinct path is lost.`);
console.log(`         Decided against by the clock, which is the hazard W1/W2 exist to report.`);
measured(
  null,
  'T9',
  '[MEAS] dated history of the dir-key figure and the retirement record for P1/P3/P4 (no assertion)',
  `10-27 454/10 -> 10-28 ${lastCuringRoundDirKey}/${consecutiveSelfOnly}; cause 87270c6f; P4 bare-window path loss now 0`
);

// ---------------------------------------------------------------------------
// T3 — THE FINDING. Two candidate attribution keys, and they disagree.
// A 2x2 confusion matrix over the gated commits. Each cell named by member.
// ---------------------------------------------------------------------------
const cell = { bothAgree: [], dirOnly: [], subjectOnly: [], neither: [] };
for (const c of gated) {
  const byDir = c.dirRounds.length > 0;
  const bySubject = c.subjectRound !== null;
  if (byDir && bySubject) cell.bothAgree.push(c);
  else if (byDir) cell.dirOnly.push(c);
  else if (bySubject) cell.subjectOnly.push(c);
  else cell.neither.push(c);
}
console.log(`\nT3 attribution-key confusion matrix over the ${gated.length} gated commits:`);
for (const [k, arr] of Object.entries(cell)) {
  console.log(`  ${k.padEnd(12)} ${String(arr.length).padStart(3)}`);
  for (const c of arr) {
    console.log(
      `      ${c.hash.slice(0, 8)} ${c.date} dir=[${c.dirRounds.join(',') || '-'}] subj=${c.subjectRound ?? '-'} :: ${c.subject.slice(0, 70)}`
    );
  }
}
const sumCells =
  cell.bothAgree.length + cell.dirOnly.length + cell.subjectOnly.length + cell.neither.length;
// The finding is that BOTH asymmetric cells are occupied: neither key is a
// refinement of the other, so the condition's value depends on an unstated choice.
measured(
  sumCells === gated.length && cell.subjectOnly.length > 0 && cell.dirOnly.length > 0,
  'T3',
  'both asymmetric cells are non-empty — the two attribution keys are INCOMPARABLE, so the condition has an unstated free variable',
  `sum ${sumCells}/${gated.length}; dirOnly=${cell.dirOnly.length} subjectOnly=${cell.subjectOnly.length} bothAgree=${cell.bothAgree.length} neither=${cell.neither.length}`
);

// ---------------------------------------------------------------------------
// T4 — KNOWN NEGATIVE (control), named by member not by count.
// Today's routed CI fix is the work his OWN memo holds up as the counterexample
// to the track. Under a subject-prefix key it reads as "round 249 cured a gated
// surface" and would RESET the counter.
// ---------------------------------------------------------------------------
const ciFix = gated.filter(
  (c) => /round249/i.test(c.subject) && /bind|linux|matrix/i.test(c.subject)
);
const ciFixAllSubjectOnly =
  ciFix.length > 0 && ciFix.every((c) => c.dirRounds.length === 0 && c.subjectRound !== null);
console.log(`\nT4 known negative — the routed CI fix his memo cites AGAINST the track:`);
for (const c of ciFix) {
  console.log(
    `  ${c.hash.slice(0, 8)} ${c.author} dir=[${c.dirRounds.join(',') || '-'}] subjectRound=${c.subjectRound} gated=${c.gatedFiles.join(' ')}`
  );
}
measured(
  ciFix.length === 0 ? null : ciFixAllSubjectOnly,
  'T4',
  'the routed non-round CI fix is attributed to a ROUND by the subject key while touching no round dir — so a subject-keyed condition is reset by exactly the work that evidences the track NOT finding things',
  `${ciFix.length} commit(s) matched; all subject-only=${ciFixAllSubjectOnly}`
);

// ---------------------------------------------------------------------------
// T5 — KNOWN POSITIVE (control). A commit where both keys agree, so T3's
// disagreement is not the key being broken everywhere.
// ---------------------------------------------------------------------------
const agreeing = cell.bothAgree.filter((c) => c.dirRounds.includes(c.subjectRound));
console.log(`\nT5 known positive — gated commits where BOTH keys name the SAME round:`);
for (const c of agreeing) {
  console.log(`  ${c.hash.slice(0, 8)} dir=[${c.dirRounds.join(',')}] subj=${c.subjectRound} :: ${c.subject.slice(0, 70)}`);
}
measured(
  agreeing.length > 0,
  'T5',
  'at least one gated commit has both keys naming the same round — the key shape CAN agree, so T3 separates something',
  `${agreeing.length} agreeing commit(s)`
);

// ---------------------------------------------------------------------------
// T6 — N IS UNSPECIFIED. Read the COMMITTED memo's bytes; do not grade my
// retyped copy of his sentence. (Fleet rule: a hand-typed reader is not a slice.)
// ---------------------------------------------------------------------------
// Keyed on the BASENAME, located in the rev's own tree. The literal path this leg
// first used was `docs/mail/<basename>`; the close-discipline `git mv`s a closed
// thread into `docs/mail/read/`, which is a documented convention, so ANY slice
// keyed on a literal `docs/mail/` path refuses the moment its thread is closed.
// Calliope closed this thread on 2026-10-27 and that is what refused the leg.
const MEMO_BASENAME =
  'daedalus-to-calliope-argus-theseus-cc-iris-janus-xian-both-asks-answered-the-probe-is-blocked-on-xian-and-the-flat-census-cannot-see-the-track-2026-10-27.md';
let MEMO = null;
let memoCandidates = [];
try {
  memoCandidates = git(['ls-tree', '-r', '--name-only', REV, '--', 'docs/mail'])
    .split('\n')
    .filter((p) => p.endsWith('/' + MEMO_BASENAME));
  // Exactly one match or refuse — two copies would mean the leg is reading an
  // arbitrary one of them.
  if (memoCandidates.length === 1) MEMO = memoCandidates[0];
  // Under `memo-path` the leg reverts to the literal path it first used, which the
  // close-discipline has since moved out from under it.
  if (CRIPPLE === 'memo-path') {
    MEMO = 'docs/mail/' + MEMO_BASENAME;
    memoCandidates = [MEMO];
  }
} catch (e) {
  memoCandidates = [];
}
let memoText = null;
if (MEMO !== null) {
  try {
    memoText = git(['show', `${REV}:${MEMO}`]);
  } catch (e) {
    memoText = null;
  }
}
console.log(`\nT6 memo located by basename in the rev's tree:`);
console.log(`  candidates=${memoCandidates.length} chosen=${MEMO ?? 'NONE — leg refuses'}`);
let t6 = null;
let t6detail =
  memoCandidates.length === 1
    ? `memo found at ${MEMO} but unreadable at REV`
    : `memo basename matched ${memoCandidates.length} path(s) under docs/mail at REV — refusing rather than guessing which`;
if (memoText !== null) {
  // Slice the blockquoted proposal, structurally: the contiguous run of '> ' lines
  // that contains the phrase 'The track continues while'.
  const lines = memoText.split('\n');
  let start = -1;
  for (let i = 0; i < lines.length; i++) {
    if (/^>\s*\*\*The track continues while/.test(lines[i])) {
      start = i;
      break;
    }
  }
  if (start === -1) {
    t6 = null;
    t6detail = 'the proposal blockquote did not slice — anchor absent at REV';
  } else {
    let end = start;
    while (end + 1 < lines.length && /^>/.test(lines[end + 1])) end++;
    const quote = lines.slice(start, end + 1).join('\n');
    const mentionsN = /\bN consecutive rounds\b/.test(quote);
    const hasNumericBound = /\b\d+\s+consecutive rounds\b/.test(quote);
    t6 = mentionsN && !hasNumericBound;
    t6detail = `at ${MEMO}: sliced ${end - start + 1} quote line(s); 'N consecutive rounds'=${mentionsN}; numeric bound present=${hasNumericBound}`;
    console.log(`  the proposal as committed, sliced from ${MEMO}:`);
    console.log(quote.split('\n').map((l) => '    ' + l).join('\n'));
  }
}
measured(
  t6,
  'T6',
  'the committed proposal states its threshold as the free variable N with no numeral — so the condition cannot fire, and cannot be reported per fire as he asks',
  t6detail
);

// ---------------------------------------------------------------------------
// T7 — "surfaces that have a standing gate (packages/, scripts/)" is not a
// censused surface. Read scripts/tsconfig.json's own include globs and classify
// each gated file touched in the window.
// ---------------------------------------------------------------------------
let includeGlobs = null;
try {
  const tsconfigRaw = git([ 'show', `${REV}:scripts/tsconfig.json` ]);
  // strip // comments (the file is heavily commented JSONC)
  const stripped = tsconfigRaw
    .split('\n')
    .filter((l) => !/^\s*\/\//.test(l))
    .join('\n');
  includeGlobs = JSON.parse(stripped).include;
} catch (e) {
  includeGlobs = null;
}
const allGatedFiles = new Set();
for (const c of gated) for (const f of c.gatedFiles) allGatedFiles.add(f);

let t7 = null;
let t7detail = 'scripts/tsconfig.json include globs unreadable';
if (Array.isArray(includeGlobs)) {
  const exts = includeGlobs
    .map((g) => /\*\*?\/?\*(\.[a-z]+)$/.exec(g))
    .filter(Boolean)
    .map((m) => m[1]);
  const inProgram = [];
  const outOfProgram = [];
  for (const f of [...allGatedFiles].sort()) {
    if (f.startsWith('packages/')) {
      inProgram.push(`${f}  [packages workspace tsconfig + npm test]`);
    } else if (exts.some((e) => f.endsWith(e))) {
      inProgram.push(`${f}  [scripts/tsconfig include ${exts.join('|')}]`);
    } else {
      outOfProgram.push(f);
    }
  }
  console.log(`\nT7 is "scripts/" actually a gated surface? include=${JSON.stringify(includeGlobs)}`);
  console.log(`  IN a standing type program (${inProgram.length}):`);
  for (const f of inProgram) console.log(`    ${f}`);
  console.log(`  NOT in any standing type program (${outOfProgram.length}):`);
  for (const f of outOfProgram) console.log(`    ${f}`);
  t7 = outOfProgram.length > 0;
  t7detail = `include=${JSON.stringify(includeGlobs)}; in=${inProgram.length} out=${outOfProgram.length}; out members=[${outOfProgram.join(', ')}]`;
}
measured(
  t7,
  'T7',
  'the proposal\'s own "standing gate" surface contains files no standing type program reads — the scope label is not a censused surface',
  t7detail
);

// ---------------------------------------------------------------------------
// T8 — does the free variable T3 found change the condition's CURRENT value, or
// only its future ones? Compute the UNION key (dir OR subject) and compare the
// consecutive run against the dir key's. If they agree today, the key choice is
// latent now and load-bearing later — which is a different report than "the
// number is wrong", and the honest one.
// ---------------------------------------------------------------------------
const curedByUnionKey = new Set(curedByDirKey);
const subjectOnlyDetail = [];
for (const c of gated) {
  if (c.subjectRound === null) continue;
  const dirExists = existsSync(`${REPO}/docs/research/round${c.subjectRound}-instruments`);
  curedByUnionKey.add(c.subjectRound);
  if (c.dirRounds.length === 0) {
    subjectOnlyDetail.push(
      `${c.hash.slice(0, 8)} names round ${c.subjectRound} (dir ${dirExists ? 'EXISTS' : 'ABSENT'})`
    );
  }
}
const lastCuringUnion = curedByUnionKey.size ? Math.max(...curedByUnionKey) : null;
const consecutiveUnion =
  lastCuringUnion === null ? null : existingRounds.filter((r) => r > lastCuringUnion).length;

console.log(`\nT8 does the key ambiguity move the CURRENT value?`);
console.log(`  dir key   : last=${lastCuringRoundDirKey} consecutive=${consecutiveSelfOnly}`);
console.log(`  union key : last=${lastCuringUnion} consecutive=${consecutiveUnion}`);
console.log(`  union cure set: ${[...curedByUnionKey].sort((a, b) => a - b).join(',')}`);
console.log(`  subject-only members and whether their round dir exists:`);
for (const d of subjectOnlyDetail) console.log(`    ${d}`);
measured(
  consecutiveSelfOnly === null || consecutiveUnion === null
    ? null
    : consecutiveSelfOnly === consecutiveUnion,
  'T8',
  'the two keys give the SAME consecutive run at this rev — the free variable is latent today and becomes load-bearing the moment a routed gated fix lands (T4)',
  `dir ${consecutiveSelfOnly} vs union ${consecutiveUnion}; last dir=${lastCuringRoundDirKey} union=${lastCuringUnion}`
);

// ---------------------------------------------------------------------------
// PREDICTIONS — pre-registered in source before the drive.
// ---------------------------------------------------------------------------
// --- RETIRED 2026-10-28 START (design note 9) ---------------------------------
// P1 ("the most recent dir-key gated-curing round is 454", expected 454) and
// P3 ("the union key does not move the run; both give 10", expected 10) were
// pre-registered on 10-27 and LANDED on 10-27. They were decided against on
// 10-28 by 87270c6f — a real event, not an instrument defect. P4 ("the bare
// window's tail loss is exactly the round263 and round377 probes") was decided
// against by the drive clock: the eroded band is confined to the window's
// boundary day and shrinks as the drive runs earlier in that day, so the loss
// read "0|" rather than a two-member list.
//
// They are retired rather than re-expected, because bending a pin to the value
// it now holds grades nothing, and rather than left live, because the leg text
// of a live-but-refuted prediction asserts the OLD value every fire. T9 carries
// both values, the rev each was read at, and the cause — strictly more than the
// `refuted=[P1,P3,P4]` token carried. P6/P7/P8 below replace them with claims
// about THIS fire's measurement, pre-registered before its first drive.
// -----------------------------------------------------------------------------
predict(
  'P6',
  'the self-attested key re-implemented in this cell agrees with the one graded in unit-464t2-reaim-2026-10-28 at this rev: most recent gated-curing round 454',
  454,
  () => lastSelfAttested
);
predict(
  'P7',
  'the self-attested key gives a consecutive run of 10, so the two keys reach OPPOSITE verdicts about whether the condition has fired at N=5 — this is T2b\'s RED, pinned as a number',
  10,
  () => consecutiveSelfAttested
);
predict(
  'P8',
  'exactly three rounds are credited only by an incidental edge — 387 and 389 (round 391\'s own commit, same author, amending their cells) and 464 (87270c6f, cross-author)',
  '3|387,389,464',
  () => (incidentalRounds === null ? null : `${incidentalRounds.length}|${incidentalRounds.join(',')}`)
);
predict(
  'P5',
  'T6 now reads the memo from docs/mail/read/ — the path the close-discipline moved it to — rather than refusing',
  'docs/mail/read/' + MEMO_BASENAME,
  () => MEMO
);
predict(
  'P2',
  'every gated commit in the window is authored by Daedalus or Theseus (no third seat touches the gated surface the condition keys on)',
  true,
  () => {
    if (gated.length === 0) return null;
    const authors = new Set(gated.map((c) => c.author));
    return [...authors].every((a) => /Daedalus|Theseus/.test(a));
  }
);

// ---------------------------------------------------------------------------
// VERDICT
// ---------------------------------------------------------------------------
// MEAS legs carry a figure and assert nothing, so their null must not read as a
// refusal. The exclusion is keyed on a DECLARED id list, not on the leg's own
// text: a text-only rule would let any leg opt out of the verdict by editing its
// own first six characters. `MEAS_DECLARED_OK` reddens if a declared MEAS leg
// ever carries a non-null value, or if its text does not actually say [MEAS] —
// either means the id list and the legs have drifted apart.
const MEAS_LEGS = ['T9', 'W3'];
const measDrift = MEAS_LEGS.filter((id) => {
  const l = legs.find((x) => x.id === id);
  return l === undefined || l.value !== null || !/^\[MEAS\]/.test(l.text);
});
measured(
  measDrift.length === 0,
  'M0',
  'every leg declared as [MEAS] exists, carries no value and says so in its own text — so the verdict\'s refusal set cannot be opted out of silently',
  `declared=[${MEAS_LEGS.join(',')}] drifted=[${measDrift.join(',')}]`
);

const isMeas = (l) => MEAS_LEGS.includes(l.id);
const red = legs.filter((l) => l.value === false).map((l) => l.id);
const refused = legs.filter((l) => l.value === null && !isMeas(l)).map((l) => l.id);
const refuted = preds.filter((p) => p.actual !== null && p.actual !== p.expected).map((p) => p.id);
const prefused = preds.filter((p) => p.actual === null).map((p) => p.id);

console.log(`\n--- LEGS ---`);
for (const l of legs) {
  const v = isMeas(l) ? 'MEAS' : l.value === null ? 'REF ' : l.value ? ' ok ' : 'RED ';
  console.log(`${v} ${l.id}: ${l.text}`);
  console.log(`      detail: ${l.detail}`);
}
console.log(`\n--- PREDICTIONS ---`);
for (const p of preds) {
  const v = p.actual === null ? 'PREF' : p.actual === p.expected ? 'LAND' : 'REFU';
  console.log(`${v} ${p.id}: ${p.text}`);
  console.log(`      expected=${JSON.stringify(p.expected)} actual=${JSON.stringify(p.actual)}`);
}

// The `/N` token and the exit status are derived from ONE value. Until 2026-10-28 this
// line printed a hardcoded `VERDICT/1` and the file had no verdict-keyed `process.exit`
// at all, so this cell — whose figure the standing COORDINATION line quotes every fire —
// exited 0 on every RED it ever published. Anything keying on `$?` read those REDs as
// passes. Measured, not reasoned: unit-464t2-surface-2026-10-28/drive6, which drove this
// cell and recorded `word=RED status=0 printedToken=1`.
// Fixing only the exit would leave the printed token free to drift back out of step, and
// fixing only the token would leave the gate dead; so both come off `code`.
const status = red.length > 0 ? 'RED' : refused.length > 0 ? 'REFUSED' : 'ok';
const code = red.length > 0 || refused.length > 0 ? 1 : 0;
console.log(
  `\nVERDICT/${code} ${status} legs=${legs.length} red=[${red}] refused=[${refused}] preds=${preds.length} refuted=[${refuted}] prefused=[${prefused}]`
);
process.exit(code);
