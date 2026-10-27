/**
 * Round 462 — grade the PRED-half refusal in round456's comparator.
 *
 * THE UNIT. Theseus's Round 457 §5.2 and §5.3, routed to me, held back in Round 458 so as not to
 * move the recording he had just measured at `df5a27cc`, released by him in 459 §6 and named again
 * in 461 §5:
 *
 *   §5.2  in the COMPARATOR, not the reader: when a baseline's declared `preds` disagrees with its
 *         printed PRED rows, REFUSE the PRED half of that comparison instead of reporting `ABSENT→`.
 *   §5.3  split the sentinel: `ABSENT` (no row, no declaration) vs `DROPPED` (declared, not printed).
 *
 * WHY THIS CELL EXISTS RATHER THAN A RE-DRIVE. round456's cell drives every member of its own
 * population as a subprocess at a 90 s budget and restores tracked paths under `docs/research/` as
 * it goes. Measured this fire, not recalled: the population is **16** members, 1 excluded on a
 * `checkout` call, so a whole-cell re-drive is 15 instrument drives with a live restore loop. That
 * is not a thing to run inside a fire that has uncommitted work in the tree — the same call Theseus
 * made in 461 §4 for 455 cell A, and I am making it for the same reason and naming it the same way.
 *
 * So the cure is graded at PREDICATE level: `parse`, `compare`, `sig`, `show` and
 * `bucketFromComparisons` are LIFTED from round456's own committed bytes at TWO revs and driven over
 * real recordings. Lifted, not re-typed: a hand-typed copy of the subject is a copy of what I meant
 * to write, and the thing under test is what is committed.
 *
 * THE SEAM. `PRE_REV` is a 40-character literal — `80d503c4…`, the rev before the cure. `NOW_REV` is
 * live `HEAD`. Sourcing the pre-cure arm from `HEAD` would make the whole A/B collapse to "no
 * effect" the moment the cure commits, which is the failure this cell is built to avoid. Driven
 * BEFORE the cure commits (`drive1`), the two arms are the same bytes and `E2` is RED by
 * construction: that is the evidence the seam is load-bearing rather than decorative.
 *
 * Legs
 *   E1  GATE — the slicer is structurally intact at BOTH revs: each anchor occurs exactly once,
 *       start precedes end, the slice is non-empty, it COMPILES, and the factory yields `parse`,
 *       `compare`, `sig`, `show` as functions. A present anchor is not an intact span.
 *   E2  GATE — the two arms are separated by the cure's OWN property, graded as a 2 × 2:
 *       `predRefusal` absent from the PRE slice and present in the NOW slice; `bucketFromComparisons`
 *       likewise. A source pin that cannot tell the arms apart grades nothing.
 *   E3  THE DEFECT, reproduced — PRE arm, each of the DROPPED recordings against a PRED-COMPLETE
 *       head, publishes at least one `PRED … ABSENT→…` movement.
 *   E4  THE CURE — NOW arm, same inputs: ZERO `PRED` movements, every comparison carries a
 *       `predRefusal` naming the baseline and its counts, and the LEG HALF of every comparison is
 *       byte-identical to the PRE arm's. The cure must remove the spurious half and nothing else.
 *   E5  CONTROL (known positive, NOT blinded) — NOW arm, a COMPLETE recording against a copy of
 *       itself with ONE PRED row's token mutated: the movement is still reported, `predRefusal` is
 *       empty, `identical` is `false`. A cure that refused every PRED comparison would pass E4 and
 *       fail here, which is the only reason E4 means anything.
 *   E6  CONTROL (known negative) — NOW arm, a COMPLETE recording against ITSELF: `identical === true`,
 *       nothing moved, nothing refused.
 *   E7  THE SPLIT, as a census under two independent keys — the member LIST (not the count) of
 *       recordings my lifted `parse` calls `DROPPED` equals the member list the lib's own `readTail`
 *       refuses with `PRED_ROW_COUNT_DISAGREEMENT`. Equal counts can hide a disagreement; lists
 *       cannot.
 *   E8  THE BUCKET DECISION, all five input shapes — `[true,false]→IDENTICAL`, `[false,false]→
 *       DRIFTED`, `[null,false]→PRED_REFUSED`, `[null,null]→PRED_REFUSED`, `[]→PRED_REFUSED`. The
 *       third is the one that matters: a terminal bucket reached by fall-through would call it
 *       DRIFTED and absorb the blindness this whole round is about.
 *
 * Predictions
 *   Q1  over the DROPPED recordings: PRE-arm `PRED` movement entries > 0, NOW-arm == 0, and the LEG
 *       half identical in both arms. The PRE figure is REPORTED, not pre-written — I do not know it
 *       when writing this and a guess that lands teaches nothing.
 *   Q2  over every PRED-COMPLETE recording compared against ITSELF, the NOW arm answers
 *       `identical === true` for all of them and refuses none. Pre-registered at 35 of 35 and 0
 *       refusals, off this fire's recon (`recon.out`). The cure must not acquire a new population.
 */
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderTail, readVerdict, readRows, readTail, measured, allOf } from '../lib/verdict.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..', '..', '..');
const git = (args) => execFileSync('git', args, {
  cwd: REPO, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 64 * 1024 * 1024,
});

const legs = [];
const preds = [];
const leg = (id, ok, what) => { legs.push({ id, ok, what: String(what).replace(/\s+/g, ' ').trim() }); return ok; };
const pred = (id, landed, what) => { preds.push({ id, landed, what: String(what).replace(/\s+/g, ' ').trim() }); return landed; };
const say = (...a) => console.log(...a);

const SUBJECT = 'docs/research/round456-instruments/drift-census-over-the-verdict-publishing-population.mjs';
const PRE_REV = '80d503c4df169469d3dacf10ce420d8d0680e3eb';
const NOW_REV = git(['rev-parse', 'HEAD']).trim();

const START = 'const parse = (text) => {';
const END = '// ── D2';

say('═══ ROUND 462 — GRADE THE PRED-HALF REFUSAL IN ROUND456\'S COMPARATOR ═══');
say(`subject  ${SUBJECT}`);
say(`PRE_REV  ${PRE_REV}  (40-char literal, NOT HEAD)`);
say(`NOW_REV  ${NOW_REV}  (live HEAD)`);
say('');

// ── the lift ────────────────────────────────────────────────────────────────────────────────────
// Structurally gated, every step reported: `sliced exactly once` does not pin the start anchor, and
// a slice that compiles is not a slice that contains what it was supposed to.
const lift = (rev) => {
  const src = (() => {
    try { return git(['show', `${rev}:${SUBJECT}`]); } catch { return null; }
  })();
  if (src === null) return { rev, ok: false, why: 'UNREACHABLE REV OR PATH' };
  const starts = src.split(START).length - 1;
  const ends = src.split(END).length - 1;
  const i = src.indexOf(START);
  const j = src.indexOf(END);
  const slice = (starts === 1 && ends === 1 && i >= 0 && j > i) ? src.slice(i, j) : null;
  if (slice === null) return { rev, ok: false, why: `anchors: start ${starts}, end ${ends}, i ${i}, j ${j}`, starts, ends };
  let api = null;
  let why = null;
  try {
    // eslint-disable-next-line no-new-func
    api = new Function('readVerdict', 'readRows', `${slice}\nreturn { parse, compare, sig, show,`
      + ' bucketFromComparisons: typeof bucketFromComparisons === "undefined" ? null : bucketFromComparisons };')(
      readVerdict, readRows,
    );
  } catch (e) { why = `COMPILE/EVAL FAILED: ${e.message}`; }
  return {
    rev, ok: api !== null, why, starts, ends, slice, api,
    srcLen: src.length, sliceLen: slice.length,
  };
};

const PRE = lift(PRE_REV);
const NOW = lift(NOW_REV);
for (const a of [['PRE', PRE], ['NOW', NOW]]) {
  const [n, l] = a;
  say(`LIFT ${n}  rev ${l.rev.slice(0, 8)}  start×${l.starts ?? '-'} end×${l.ends ?? '-'}  `
    + `slice ${l.sliceLen ?? '-'} of ${l.srcLen ?? '-'} bytes  ${l.ok ? 'OK' : `FAILED: ${l.why}`}`
    + `${l.ok ? `  bucketFn ${l.api.bucketFromComparisons === null ? 'ABSENT' : 'PRESENT'}` : ''}`);
}
say('');

const fnsOk = (l) => l.ok === true && ['parse', 'compare', 'sig', 'show'].every((k) => typeof l.api[k] === 'function');
leg('E1', PRE.ok === true && NOW.ok === true && fnsOk(PRE) && fnsOk(NOW)
  && PRE.starts === 1 && PRE.ends === 1 && NOW.starts === 1 && NOW.ends === 1,
  `lift gate — PRE ${PRE.ok ? `ok (${PRE.sliceLen} bytes, 4 fns ${fnsOk(PRE)})` : PRE.why}; `
  + `NOW ${NOW.ok ? `ok (${NOW.sliceLen} bytes, 4 fns ${fnsOk(NOW)})` : NOW.why}`);

// ── E2 — the separating property, graded as a 2 × 2 ─────────────────────────────────────────────
const has = (l, tok) => (l.slice ?? '').includes(tok);
const sep = {
  'predRefusal@PRE': has(PRE, 'predRefusal'),
  'predRefusal@NOW': has(NOW, 'predRefusal'),
  'bucketFn@PRE': PRE.ok === true && PRE.api.bucketFromComparisons !== null,
  'bucketFn@NOW': NOW.ok === true && NOW.api.bucketFromComparisons !== null,
};
say(`SEPARATION  ${JSON.stringify(sep)}`);
// THE GATE FOR BOTH PREDICTIONS, split out of E2 so it can be read as one. `Q1` and `Q2` are claims
// about the CURED comparator; if the two arms are the same bytes, the A/B has not happened and
// scoring either of them is scoring a measurement that did not take place. Caught by drive1 of this
// very cell, which published `refuted=[Q1]` and a vacuous `LANDED` for `Q2` before this gate
// existed: at the pre-cure rev `Q2`'s "0 refusals" is true because the mechanism is absent, not
// because it behaved. GATE legs from PREDICTION legs — the predictions go OPEN, not REFUTED.
const armsSeparated = sep['predRefusal@PRE'] === false && sep['predRefusal@NOW'] === true
  && sep['bucketFn@PRE'] === false && sep['bucketFn@NOW'] === true;
leg('E2', armsSeparated,
  `the arms must differ in the cure's own property, both ways: ${JSON.stringify(sep)} `
  + '— expect PRE false / NOW true on both rows (a pre-commit drive of this cell is RED here BY CONSTRUCTION)');

// ── the inputs, selected from committed bytes ───────────────────────────────────────────────────
const tracked = git(['ls-tree', '-r', NOW_REV, '--name-only']).trim().split('\n');
const outs = tracked.filter((p) => p.startsWith('docs/research/') && p.endsWith('.out'));
const textOf = new Map();
const libDropped = [];
const libComplete = [];
for (const p of outs) {
  const t = git(['show', `${NOW_REV}:${p}`]);
  textOf.set(p, t);
  const r = readTail(t);
  if (r.ok !== true && r.refusal === 'PRED_ROW_COUNT_DISAGREEMENT') libDropped.push(p);
  if (r.ok === true && r.rows.filter((x) => x.kind === 'PRED').length > 0) libComplete.push(p);
}
say(`INPUTS  ${outs.length} committed .out; lib readTail: DROPPED ${libDropped.length}, `
  + `COMPLETE-with-PRED-rows ${libComplete.length}`);
const HEADREF = libComplete[0] ?? null;
say(`HEAD-SIDE INPUT  ${HEADREF ?? 'NONE — E3/E4 unmeasured'}`);
say('');

// ── E3 / E4 / Q1 — the defect and the cure over the same inputs ─────────────────────────────────
// One comparison per DROPPED recording, each against the SAME PRED-complete head, run through both
// arms. The LEG half is the invariant: the cure may only touch the PRED half.
const arms = (baseText, headText, l) => {
  if (l.ok !== true) return null;
  const b = l.api.parse(baseText);
  const h = l.api.parse(headText);
  if (b.ok !== true || h.ok !== true) return null;
  const c = l.api.compare(b, h);
  return {
    c,
    predMoves: c.moved.filter((m) => m.startsWith('PRED ')),
    legMoves: c.moved.filter((m) => m.startsWith('LEG ')),
    refusal: Array.isArray(c.predRefusal) ? c.predRefusal : [],
  };
};

let prePredMoves = 0;
let nowPredMoves = 0;
let preAbsentArrows = 0;
let legHalvesEqual = 0;
let nowAllNamed = 0;
let pairs = 0;
const rows = [];
if (HEADREF !== null) {
  for (const p of libDropped) {
    const a = arms(textOf.get(p), textOf.get(HEADREF), PRE);
    const z = arms(textOf.get(p), textOf.get(HEADREF), NOW);
    if (a === null || z === null) continue;
    pairs += 1;
    prePredMoves += a.predMoves.length;
    nowPredMoves += z.predMoves.length;
    preAbsentArrows += a.predMoves.filter((m) => m.includes('ABSENT→')).length;
    if (a.legMoves.join('|') === z.legMoves.join('|')) legHalvesEqual += 1;
    if (z.refusal.some((r) => /^baseline DROPPED \d+ PRED row\(s\) vs preds=\d+$/.test(r))) nowAllNamed += 1;
    rows.push({ p, pre: a.predMoves.length, now: z.predMoves.length, legs: a.legMoves.length, ref: z.refusal.join(' + ') });
  }
}
say(`A/B OVER ${pairs} DROPPED BASELINE(S) vs ${HEADREF}:`);
for (const r of rows.slice(0, 13)) {
  say(`   PRE pred-moves ${String(r.pre).padStart(2)} · NOW ${String(r.now).padStart(2)} · `
    + `LEG moves ${String(r.legs).padStart(2)} · ${r.p.split('/').pop()}`);
}
if (rows.length > 0) say(`   NOW refusal, first row: ${rows[0].ref || 'NONE'}`);
say('');

leg('E3', measured(pairs > 0 ? pairs : null,
  () => prePredMoves > 0 && preAbsentArrows > 0 && pairs === libDropped.length),
  `THE DEFECT at PRE: ${prePredMoves} PRED movement(s) across ${pairs} comparison(s), `
  + `${preAbsentArrows} of them 'ABSENT→' — expect > 0 on both, over all ${libDropped.length} DROPPED recordings`);

leg('E4', measured(pairs > 0 ? pairs : null,
  () => nowPredMoves === 0 && nowAllNamed === pairs && legHalvesEqual === pairs),
  `THE CURE at NOW: ${nowPredMoves} PRED movement(s) (expect 0); ${nowAllNamed} of ${pairs} name the `
  + `baseline's DROPPED counts; ${legHalvesEqual} of ${pairs} LEG halves byte-identical to the PRE arm`);

pred('Q1', armsSeparated === false ? null
  : (pairs > 0 && prePredMoves > 0 && nowPredMoves === 0 && legHalvesEqual === pairs),
  `PRE ${prePredMoves} PRED movement(s) → NOW ${nowPredMoves}, LEG half unchanged in ${legHalvesEqual} of ${pairs}`
  + `${armsSeparated ? '' : ' — OPEN: the arms are not separated (E2), so this A/B did not happen'}`);

// ── E5 — the known positive: a REAL PRED movement must survive the cure ─────────────────────────
// The mutation target is asserted before it is relied on, and the figure is gated on having MOVED.
let e5 = null;
let e5note = 'NO USABLE COMPLETE RECORDING';
if (HEADREF !== null && NOW.ok === true) {
  const t = textOf.get(HEADREF);
  const m = t.match(/^PRED ([A-Za-z0-9_.:-]+) LANDED /m);
  const hits = m === null ? 0 : (t.split(`\nPRED ${m[1]} LANDED `).length - 1);
  if (m !== null && hits === 1) {
    const mutated = t.replace(`\nPRED ${m[1]} LANDED `, `\nPRED ${m[1]} REFUTED `);
    const z = arms(t, mutated, NOW);
    if (z !== null) {
      e5 = z;
      e5note = `mutated PRED ${m[1]} LANDED→REFUTED (target found ${hits}×): `
        + `moved [${z.c.moved.join('; ')}], predRefusal ${z.refusal.length}, identical ${String(z.c.identical)}`;
    } else e5note = `mutation parsed but the comparator refused to read one side (target ${m[1]})`;
  } else e5note = `mutation target not uniquely present: match ${m === null ? 'none' : m[1]}, occurrences ${hits}`;
}
leg('E5', measured(e5, (z) => z.predMoves.length === 1 && z.refusal.length === 0 && z.c.identical === false),
  `CONTROL, the cure must not blind the PRED half: ${e5note} — expect exactly 1 PRED movement, 0 refusals, identical=false`);

// ── E6 — the known negative: a COMPLETE recording against itself ────────────────────────────────
let e6 = null;
if (HEADREF !== null) e6 = arms(textOf.get(HEADREF), textOf.get(HEADREF), NOW);
leg('E6', measured(e6, (z) => z.c.identical === true && z.c.moved.length === 0 && z.refusal.length === 0),
  `CONTROL, COMPLETE vs itself at NOW: ${e6 === null ? 'UNMEASURED' : `identical=${String(e6.c.identical)}, `
    + `moved ${e6.c.moved.length}, refusals ${e6.refusal.length}`} — expect true / 0 / 0`);

// ── E7 — the split, two independent keys, MEMBER LISTS compared ─────────────────────────────────
const mineDropped = [];
if (NOW.ok === true) {
  for (const p of outs) {
    const b = NOW.api.parse(textOf.get(p));
    if (b.ok === true && b.predIntegrity === 'DROPPED') mineDropped.push(p);
  }
}
const onlyLib = libDropped.filter((p) => !mineDropped.includes(p));
const onlyMine = mineDropped.filter((p) => !libDropped.includes(p));
say(`E7  lib readTail DROPPED ${libDropped.length} · lifted parse DROPPED ${mineDropped.length} · `
  + `lib-only ${onlyLib.length} ${onlyLib.map((p) => p.split('/').pop()).join(',')} · `
  + `lifted-only ${onlyMine.length} ${onlyMine.map((p) => p.split('/').pop()).join(',')}`);
leg('E7', allOf(NOW.ok === true, libDropped.length > 0,
  onlyLib.length === 0 && onlyMine.length === 0 && mineDropped.length === libDropped.length),
  `sentinel split under two independent keys over ${outs.length} recordings: lib ${libDropped.length}, `
  + `lifted ${mineDropped.length}, symmetric difference ${onlyLib.length + onlyMine.length} — member lists, not counts`);

// ── E8 — the bucket decision, every input shape ─────────────────────────────────────────────────
const SHAPES = [
  ['[true,false]', [true, false], 'IDENTICAL'],
  ['[false,false]', [false, false], 'DRIFTED'],
  ['[null,false]', [null, false], 'PRED_REFUSED'],
  ['[null,null]', [null, null], 'PRED_REFUSED'],
  ['[] (no baseline cmps)', [], 'PRED_REFUSED'],
];
const bucketFn = NOW.ok === true ? NOW.api.bucketFromComparisons : null;
const got = bucketFn === null ? null : SHAPES.map(([name, states, want]) => {
  const cmps = states.map((s, i) => ({ o: `drive${i}`, c: { identical: s, moved: [], fields: [], predRefusal: s === null ? ['x'] : [] } }));
  const out = bucketFn(cmps);
  return { name, want, got: out.bucket, ok: out.bucket === want };
});
if (got !== null) for (const g of got) say(`E8  ${g.name.padEnd(22)} want ${g.want.padEnd(12)} got ${g.got.padEnd(12)} ${g.ok ? 'ok' : 'WRONG'}`);
leg('E8', measured(got, (g) => g.length === SHAPES.length && g.every((x) => x.ok)),
  `bucket decision over ${SHAPES.length} input shapes: ${got === null ? 'UNMEASURED — no bucketFromComparisons at NOW'
    : `${got.filter((x) => x.ok).length} of ${got.length} correct${got.some((x) => !x.ok) ? ` — wrong: ${got.filter((x) => !x.ok).map((x) => `${x.name}→${x.got}`).join(', ')}` : ''}`}`
  + ' — [null,false] is the one that matters: a fall-through terminal bucket calls it DRIFTED');

// ── Q2 — the cure must not acquire a population ─────────────────────────────────────────────────
let q2ok = 0;
let q2ref = 0;
if (NOW.ok === true) {
  for (const p of libComplete) {
    const z = arms(textOf.get(p), textOf.get(p), NOW);
    if (z === null) continue;
    if (z.c.identical === true) q2ok += 1;
    if (z.refusal.length > 0) q2ref += 1;
  }
}
pred('Q2', armsSeparated === false ? null
  : (q2ok === libComplete.length && q2ref === 0 && libComplete.length === 35),
  `every PRED-COMPLETE recording vs itself at NOW: identical ${q2ok} of ${libComplete.length}, `
  + `refusals ${q2ref} — pre-registered 35 of 35 and 0`
  + `${armsSeparated ? '' : ' — OPEN: at the pre-cure rev "0 refusals" is true because the mechanism is ABSENT'}`);

say('');
say(renderTail({ legs, preds }));
const red = legs.filter((l) => l.ok === false).length;
const refused = legs.filter((l) => l.ok === null).length;
process.exit(red + refused > 0 ? 1 : 0);
