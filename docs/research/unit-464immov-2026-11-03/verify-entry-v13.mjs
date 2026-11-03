#!/usr/bin/env node
// verify-entry-v13 — grade the v1.3 edit to LEG-CLASS-CONVENTION.md.
//
// Three things have to hold, and none of them can be checked by re-running the measurement:
//
//   1. FIX-FORWARD IS REAL. `unit-464order-2026-11-02/HAND-AXES-13.tsv` must be BYTE-IDENTICAL at
//      the pin and in the worktree. The entry claims the hand read was left alone and the
//      corrections put in a new section; if that file moved, the claim is false and every
//      instrument pinning it is reading something else.
//
//   2. THE CURE IS A CHANGE, NOT AN ASSERTION. The baseline comes from git at the pin and the cure
//      from the worktree, so the leg can see the false clause LEAVE. A leg that only reads the
//      cured text cannot tell a cure from a document that never had the defect.
//      [[feedback_a_unit_that_cures_its_own_subject_needs_the_baseline_from_git]]
//      [[feedback_a_leg_that_asserts_the_defect_reddens_on_its_own_cure]]
//
//   3. MEASURED-BLOCK-V13'S FIGURES ARE NOT RECOMPUTED BY THE LEG GRADING THEM. Each figure is
//      compared against the RECORDED `.out` file it came from, read off disk. A pin that
//      recomputes what it grades is hollow. [[feedback_a_pin_that_recomputes_what_it_grades_is_hollow]]

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const PIN = process.env.PIN ?? 'e0fbd74c';
const UNIT = 'docs/research/unit-464immov-2026-11-03/';
const ENTRY = 'docs/research/LEG-CLASS-CONVENTION.md';
const AXES = 'docs/research/unit-464order-2026-11-02/HAND-AXES-13.tsv';

let red = 0;
let unrunnable = 0;
const check = (id, cond, msg) => {
  if (cond === true) console.log(`${id}  ok    ${msg}`);
  else { console.log(`${id}  RED   ${msg}`); red += 1; }
};
const refuse = (id, msg) => { console.log(`${id}  UNRUNNABLE  ${msg}`); unrunnable += 1; };

const git = (args) => {
  try { return execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }); }
  catch { return null; }
};
const read = (p) => { try { return readFileSync(p, 'utf8'); } catch { return null; } };

// ------------------------------------------------------------------ 1. fix-forward is real
const axesAtPin = git(['rev-parse', `${PIN}:${AXES}`]);
const axesNow = git(['hash-object', AXES]);
if (axesAtPin === null || axesNow === null) refuse('GAXESUNMOVED', `cannot hash ${AXES} at both revs`);
else check('GAXESUNMOVED', axesAtPin.trim() === axesNow.trim(),
  `FIX-FORWARD: ${AXES} is byte-identical at ${PIN} and in the worktree (${axesAtPin.trim().slice(0, 12)}). The three why corrections went into a new section of the entry, not into the filed hand read`);

// ------------------------------------------------------------------ 2. the cure is a change
const entryAtPin = git(['show', `${PIN}:${ENTRY}`]);
const entryNow = read(ENTRY);
const FALSE_CLAUSE = 'never operands of one comparison** — each is compared to a literal';
if (entryAtPin === null || entryNow === null) refuse('GCUREISACHANGE', `cannot read ${ENTRY} at both revs`);
else {
  const hadIt = entryAtPin.includes(FALSE_CLAUSE);
  const hasIt = entryNow.includes(FALSE_CLAUSE);
  check('GCUREISACHANGE', hadIt === true && hasIt === false,
    `THE CURE IS A CHANGE: the false clause "${FALSE_CLAUSE.slice(-32)}" was present at ${PIN} (${hadIt}) and is absent in the worktree (${hasIt}). Baseline from git, cure from the worktree — so this leg could have reddened`);
  check('GV13HEADER', /^\*\*v1\.3, 2026-11-03\.\*\*/m.test(entryNow) && entryNow.includes('### 2.1d') && entryNow.includes('### 2.1e'),
    `the entry declares v1.3 and carries both new sections (2.1d the lemma, 2.1e the why corrections)`);
  // The version key is read as an ANCHORED v1.3 header, not as a bare /v1\.3/ match: a v1.3
  // document still says "v1.2" in the paragraph naming what it superseded, and unit-464order's
  // GDOCPIN was already caught grading the superseded version for exactly that reason.
  // [[feedback_a_correction_that_quotes_the_wrong_spelling_retrips_the_detector]]
  check('GV13NOTBARE', /v1\.2/.test(entryNow),
    `and v1.2 is still named in the prose (${/v1\.2/.test(entryNow)}), which is why the version key above is an anchored header match and not a bare /v1\\.3/ test`);
}

// ------------------------------------------------------------------ 3. figures vs the recordings
const d2 = read(`${UNIT}drive2.occupy-repaired.out`);
const d6 = read(`${UNIT}drive6.whycensus-greached-gated.out`);
const d7 = read(`${UNIT}drive7.cripple-vs-gated-greached.out`);
if (d2 === null || d6 === null || d7 === null) {
  refuse('GV13FIGURES', 'one of the three recordings is unreadable — the V13 block is unpinned');
} else {
  const block = (entryNow ?? '').split('### MEASURED-BLOCK-V13')[1]?.split('```')[1] ?? '';
  if (block === '') refuse('GV13FIGURES', 'no fenced MEASURED-BLOCK-V13 found in the entry');
  else {
    // Each claim is (what the block must say) x (what the RECORDING must say). Neither side is
    // recomputed here.
    const claims = [
      ['7 of 7 anchors+figures', /byte-identical anchors AND figures\s+7 of 7/.test(block), /on 7\/7 state pairs the delta leg and its identity complement present BYTE-IDENTICAL anchors AND byte-identical figures/.test(d2)],
      ['7 of 7 opposite verdicts', /opposite verdicts\s+7 of 7/.test(block), /on 7\/7 state pairs the two polarities give OPPOSITE verdicts/.test(d2)],
      ['6 independent cells', /independent cells implied, of 9\s+6/.test(block), /leaving 6 independent cells, not 9/.test(d2)],
      ['2 reachable by the lemma', /reachable by the polarity lemma\s+2/.test(block), /2 of the 3 empty cells are reachable-by-complement/.test(d2)],
      ['1 outside the lemma', /neither\s+1\s+\(conjunctive x history-keyed\)/.test(block), /OUTSIDE THE LEMMA\s+conjunctive x history-keyed/.test(d2)],
      ['reached 12 / 1', /reached \/ unreached\s+12 \/ 1/.test(block), /reached 12 \/ unreached 1 of 13/.test(d6)],
      ['defective 3, named', /defective, two registered classes\s+3\s+G0@79, G0@80, GLIFT2@186/.test(block), /\[G0@79,G0@80,GLIFT2@186\] vs the measurement's \[G0@79,G0@80,GLIFT2@186\] — identical/.test(d6)],
      ['disclosed 1', /DISCLOSED, not defective\s+1\s+C0@78/.test(block), /"disclosedNotCounted":\["C0@78"\]/.test(d6)],
      ['zero-cmp rows 2', /zero comparison operators\s+2\s+GLIFT2@186, GCURE@90/.test(block), /"zeroCmpRows":\["GLIFT2@186","GCURE@90"\]/.test(d6)],
      ['whyClass departures 0', /departures, whyClass\s+0 of 13/.test(block), /0 departures of 13 between my hand read's whyClass column/.test(d6)],
      ['cmp departures 0 of 5', /departures, comparison counts\s+0 of 5/.test(block), /"cmpDepartures":\[\]/.test(d6)],
      ['shape map 7 fields', /shape map at grade-the-steal-cures\.mjs:77\s+7 fields/.test(block), /Measured at the pin: 7 —/.test(d6)],
    ];
    const bad = claims.filter(([, inBlock, inRec]) => !(inBlock && inRec))
      .map(([n, b, r]) => `${n}(block=${b},recording=${r})`);
    check('GV13FIGURES', bad.length === 0,
      `all ${claims.length} MEASURED-BLOCK-V13 figures appear BOTH in the block and in the recording they came from, and none is recomputed by this leg${bad.length ? `. FAILING: ${bad.join(' ; ')}` : ''}`);

    // The cripple delta is a figure too, and it is the one the entry does NOT carry — so this leg
    // reads it off the two recordings directly rather than off a sentence.
    check('GV13CRIPPLE', /GREACHED  RED/.test(d7) && /GREACHED  ok/.test(d6),
      `and the guard the cripple caught is recorded moving: GREACHED reads ok in drive6 (intact) and RED in drive7 (crippled), so the repair is graded by a delta and not by a claim`);
  }
}

console.log(`\n=========================================================`);
console.log(`verify-entry-v13: RED ${red} · UNRUNNABLE ${unrunnable}`);
console.log(`VERDICT ${red === 0 && unrunnable === 0 ? 'GREEN' : red > 0 ? 'RED' : 'UNRUNNABLE'}`);
process.exit(red > 0 ? 1 : unrunnable > 0 ? 2 : 0);
