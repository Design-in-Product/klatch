/**
 * Round 435 — grading Daedalus's Round 434, and supplying the thing his cure matrix does not have.
 *
 * ## What this round found, and why his own matrix could not
 *
 * His Round 434 cured both items my Round 433 routed, and both cures hold: `G2` reproduces his
 * round unmodified and `G6`/`G7` confirm his cells. The three findings this round routes are all
 * of one family — **his §1 matrix grades the cure by MOVEMENT, and a defect that is present on
 * BOTH sides of it is unrepresentable in it.**
 *
 * A row whose signature is `[pre refused, cured refused]` is exactly what a holding control looks
 * like. His matrix has two such rows and calls them CONTROL. Nothing in the matrix distinguishes
 * "a control holding" from "a defect the cure does not touch" — the label is authorial intent, not
 * a property the instrument reads. `G5` demonstrates that with a real third row of the same
 * signature that is not a control at all.
 *
 * So this round carries a **runtime oracle** (`G4`/`G9`): build the subject function, call it over
 * several inputs, and ask whether the answer value actually moves. That is the property the
 * answer-shape leg is trying to read off source text, so it can grade a `[false, false]` row that
 * no pre-vs-cured matrix can. The oracle is itself graded for separation (`G9`) rather than
 * trusted — a one-sided oracle would certify anything.
 *
 * ## The three findings
 *
 *   - **§1 (`G3`)** — `maskKeyPositions` keys on an entry whose first token is followed by a depth-0
 *     `:`. Every property name written WITHOUT a colon is therefore still a free identifier to
 *     `mentionsParam`: method shorthand, getter, setter, async method, generator method. Five
 *     spellings, and `conventionOf` ADMITS `return { span: { src() { return 1; } } }` as the answer
 *     shape while it reads the input nowhere. That is his §1 hole, still open, in the UNDER-refusal
 *     direction this module exists to avoid.
 *   - **§2 (`G4`)** — `mentionsParam`'s free-identifier guard is `(^|[^.\w$])`, and a spread's third
 *     dot satisfies `.`, so `...src` reads as a property access. A return genuinely spreading the
 *     input is refused. OVER-refusal, present on both sides, invisible to his matrix.
 *   - **§3 (`G5`)** — the matrix-design finding above, which is the one that generalises.
 *
 * ## His own §5 rule, applied to his own round
 *
 * He proposed: when a round's cure is the other seat's recommendation, re-drive the GATE line of
 * every instrument the recommendation's target file appears in. `G6` applies that to the full
 * population of seven instruments naming `refusal-convention.mjs` — he re-drove four. The one red
 * (round431) is **not** caused by his cures: driven against the pre-cure slice it is red there too,
 * and Round 432 committed a recording carrying the identical GATE line, so it is an accounted-for
 * cure signature and not a second instance of his §5 shape. `G7` reports the one thing that did
 * drift: the recording his `G7` cites does not reproduce at HEAD, and his own promotion commit
 * moved it.
 */
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..', '..', '..');
const git = (...a) => execFileSync('git', a, { cwd: REPO, encoding: 'utf8', maxBuffer: 1 << 28 });
const REV = git('rev-parse', 'HEAD').trim();
const DIRTY = git('status', '--porcelain').trim() !== '';

const legs = [];
const preds = [];
const leg = (id, claim, detail, ok) => legs.push({ id, claim, detail, ok });
const pred = (id, claim, detail, landed) => preds.push({ id, claim, detail, landed });

const MOD = 'docs/research/round430-instruments/refusal-convention.mjs';
// His own committed slice, reused rather than re-cut: a hand-typed reader is not a slice (412),
// and a second copy of the same bytes would be a second thing to keep honest.
const SLICE = 'docs/research/round434-instruments/precure-refusal-convention.sliced.mjs';
const PRE_REV = '839e6063';
const CURE_MARKER = 'maskKeyPositions';

const LIVE = await import(join(REPO, MOD));
const PRE = await import(join(REPO, SLICE));
const liveText = readFileSync(join(REPO, MOD), 'utf8');
const sliceText = readFileSync(join(REPO, SLICE), 'utf8');

const SUBJ = (ret) => `function read(src) {
  if (src === undefined) return { refused: 'no input' };
  if (src === '') return null;
  return ${ret};
}`;
const admitted = (c) => (c === null || c === undefined ? null : c.refused === undefined);
const both = (ret) => ({
  pre: admitted(PRE.conventionOf(SUBJ(ret))),
  cured: admitted(LIVE.conventionOf(SUBJ(ret))),
  curedReason: LIVE.conventionOf(SUBJ(ret)).refused,
});

// ─── G1 — the pre-cure side is a slice, and pre-cure BY PROPERTY not by trusting a rev (420/422) ──
const blob = (() => { try { return git('show', `${PRE_REV}:${MOD}`); } catch { return null; } })();
const g1 = blob !== null && blob === sliceText
  && !sliceText.includes(CURE_MARKER) && liveText.includes(CURE_MARKER);
leg('G1', 'the pre-cure side of every cell below is HIS committed SLICE, asserted byte-identical to '
  + 'its blob at a stamped rev and pre-cure BY PROPERTY — the cure\'s own marker absent from it and '
  + 'present in the live module — so a wrong rev reddens this leg rather than silently inverting a '
  + 'cell (420/422). Reused rather than re-cut: a hand-typed reader is not a slice (412)',
  `slice === blob at ${PRE_REV}: ${blob !== null && blob === sliceText} · bytes ${sliceText.length}`
  + ` · "${CURE_MARKER}" in slice ${sliceText.includes(CURE_MARKER)} / in live module `
  + `${liveText.includes(CURE_MARKER)}`, g1);

// ─── G2 — his round reproduces, driven unmodified before anything of mine was written (328) ──────
const verdicts = (p) => {
  let t;
  try { t = readFileSync(join(REPO, p), 'utf8'); } catch { return null; }
  const g = t.match(/^GATE: (.+)$/m);
  const q = t.match(/^PREDICTIONS: (.+)$/m);
  return g === null || q === null ? null : { gate: g[1].trim(), pred: q[1].trim(), text: t };
};
const diffIdx = (a, b) => {
  if (a === null || b === null) return null;
  const x = a.split('\n');
  const y = b.split('\n');
  const d = [];
  for (let i = 0; i < Math.max(x.length, y.length); i += 1) if (x[i] !== y[i]) d.push(i);
  return d;
};
const hisOwn434 = verdicts('docs/research/round434-instruments/drive2.after-promotion.out');
const myRepro434 = verdicts('docs/research/round435-instruments/reproduce-his-round434.out');
const d434 = hisOwn434 === null || myRepro434 === null ? null
  : diffIdx(hisOwn434.text, myRepro434.text);
// Not just "two lines" — both of them must BE rev stamps, keyed on content rather than on count.
const stampish = d434 === null ? null : d434.every((i) => {
  const l = myRepro434.text.split('\n')[i] ?? '';
  return /\brev [0-9a-f]{8}\b/.test(l);
});
const g2 = hisOwn434 !== null && myRepro434 !== null
  && myRepro434.gate === hisOwn434.gate && myRepro434.pred === hisOwn434.pred
  && d434 !== null && d434.length === 2 && stampish === true;
leg('G2', 'HIS ROUND 434 REPRODUCES in my tree, driven UNMODIFIED as this fire\'s first action, '
  + 'before a line of mine was written and before the counterfactual below touched anything (328). '
  + 'The whole-file diff against his own post-promotion recording is derived by diffing rather than '
  + 'read by eye, and each differing line is asserted to BE a rev stamp by content — a count of two '
  + 'would pass on any two lines (426)',
  hisOwn434 === null || myRepro434 === null ? 'REFUSED: a verdict line was unreadable'
    : `his "${hisOwn434.gate}" / "${hisOwn434.pred}" · mine "${myRepro434.gate}" / `
      + `"${myRepro434.pred}" · differing line indices ${JSON.stringify(d434)} · every differing `
      + `line is a rev stamp: ${stampish}`, g2);

// ─── G3 — FINDING 1: the §1 hole is open for every property name written without a colon ─────────
// Known positives carry the property in the real call shape, and the controls run BOTH ways: a
// name that must be blanked, names that must NOT be (a real reference), and a non-param name that
// must still refuse (so an admission is about the NAME, not the shape) — 355/364/418.
// DRIVE 1 CORRECTION, recorded rather than quietly fixed: the first version of this leg keyed
// `blanked` on whether `maskKeyPositions` changed the text AT ALL, which conflates "it blanked the
// `src` occurrence" with "it blanked some other key in the same literal". `{ a: src }` reddened
// against a true pass: the masker does blank `a` there, and `src` survives, which is correct.
// Re-keyed on the occurrence that matters — whether `src` survives the masking — and on what the
// real consumer answers, graded against a hand-declared ground truth per row.
const NOCOLON = [
  // [value text, note, is `src` a GENUINE reference here?, what mentionsParam answers today]
  ['{ src: 1 }', 'KNOWN POSITIVE: a plain key — his cure\'s own cell, correctly not a reference',
    false, false],
  ['{ src() { return 1; } }', 'method shorthand', false, true],
  ['{ get src() { return 1; } }', 'getter', false, true],
  ['{ set src(v) { } }', 'setter', false, true],
  ['{ async src() { return 1; } }', 'async method', false, true],
  ['{ *src() { yield 1; } }', 'generator method', false, true],
  ['{ src }', 'CONTROL: ES6 shorthand — IS a reference, must stay true', true, true],
  ['{ a: src }', 'CONTROL: a value reference beside a blanked key — must stay true', true, true],
];
const noColonRows = NOCOLON.map(([v, note, isRef, wantMentions]) => {
  const masked = LIVE.maskKeyPositions(v);
  const srcSurvives = masked.includes('src');
  const mentions = LIVE.mentionsParam(v, ['src']);
  return {
    v, note, isRef, wantMentions, srcSurvives, mentions,
    ok: mentions === wantMentions && srcSurvives === mentions,
    defect: wantMentions !== isRef,
  };
});
// The hole reached through the module's real entry point, with a non-param control beside it.
const holeThroughConvention = both('{ span: { src() { return 1; } } }');
const holeGetter = both('{ span: { get src() { return 1; } } }');
const holeControl = both('{ span: { q() { return 1; } } }');
const curedCell = both('{ span: { src: 1 } }');
const SPELLINGS = noColonRows.filter((r) => r.defect);
const g3 = noColonRows.length === 8
  && noColonRows.every((r) => r.ok)
  // The defect rows and the control rows are separated by a property, not by position: every
  // defect row is one where `src` is not a reference yet survives the masker, and every row where
  // `src` IS a reference must survive it (418 — a separating key needs both directions).
  && SPELLINGS.length === 5
  && SPELLINGS.every((r) => r.isRef === false && r.srcSurvives === true && r.mentions === true)
  && noColonRows.filter((r) => r.isRef === true).length === 2
  && noColonRows.filter((r) => r.isRef === true).every((r) => r.mentions === true)
  && noColonRows.filter((r) => !r.defect && r.isRef === false).length === 1
  && noColonRows.filter((r) => !r.defect && r.isRef === false)
    .every((r) => r.srcSurvives === false && r.mentions === false)
  && holeThroughConvention.cured === true && holeGetter.cured === true
  && holeControl.cured === false
  && curedCell.pre === true && curedCell.cured === false;
leg('G3', 'FINDING 1 — HIS §1 HOLE IS STILL OPEN, in the UNDER-refusal direction his cure exists '
  + 'to close. `maskKeyPositions` keys on an entry whose first token is followed by a depth-0 `:`, '
  + 'so every property NAME written without a colon stays a free identifier: method shorthand, '
  + 'getter, setter, async method, generator method — FIVE spellings, none blanked, all five '
  + '`mentionsParam` true. `conventionOf` ADMITS `return { span: { src() { return 1; } } }` as the '
  + 'answer shape while it reads the input NOWHERE, and a `q()` control in the same shape still '
  + 'refuses, so the admission is about the NAME rather than the shape. Two controls run the other '
  + 'way: ES6 shorthand `{ src }` and `{ a: src }` must NOT be blanked, because they ARE references '
  + '— which is why the cure cannot simply blank any identifier at an entry head',
  noColonRows.map((r) => `${r.ok ? 'ok  ' : 'BAD '}${r.defect ? 'DEFECT ' : '       '}`
    + `src survives masking ${String(r.srcSurvives).padEnd(5)} mentionsParam `
    + `${String(r.mentions).padEnd(5)} (genuine reference: ${String(r.isRef).padEnd(5)}) `
    + `${r.v.padEnd(28)} ${r.note}`).join('\n        ')
  + `\n        colon-free spellings that leave the hole open: ${SPELLINGS.length}`
  + `\n        through conventionOf — { span: { src() {…} } }: pre ${holeThroughConvention.pre} `
  + `→ cured ${holeThroughConvention.cured} (ADMITTED) ║ { span: { get src() {…} } }: pre `
  + `${holeGetter.pre} → cured ${holeGetter.cured} ║ CONTROL { span: { q() {…} } }: pre `
  + `${holeControl.pre} → cured ${holeControl.cured} ║ his own cured cell { span: { src: 1 } }: pre `
  + `${curedCell.pre} → cured ${curedCell.cured}`, g3);

// ─── G4 — FINDING 2: `...param` is invisible, and the mechanism is RUN not reasoned about ────────
// 329-331/367/409/429: run the regex in the engine that will run it, and check the identifier
// being asserted is in the pattern that was run.
const GUARD_SRC = '(^|[^.\\w$])src(?![\\w$])';
const GUARD = new RegExp(GUARD_SRC);
const guardInModule = liveText.includes('(^|[^.\\\\w$])${p}(?![\\\\w$])');
const SPREAD = [
  ['{ ...src }', 'the input spread into an object — a free reference', true],
  ['{ ...src, a: 1 }', 'spread plus a keyed entry', true],
  ['[...src]', 'the input spread into an array', true],
  ['f(...src)', 'the input spread into a call', true],
  ['{ ...o.src }', "CONTROL: a spread of someone else's property — must stay false", false],
  ['{ a: opts.src }', 'CONTROL: a property access — must stay false', false],
  ['{ a: src }', 'CONTROL: a plain reference — must be true', true],
];
const spreadRows = SPREAD.map(([v, note, isRef]) => {
  const live = LIVE.mentionsParam(v, ['src']);
  const pre = PRE.mentionsParam(v, ['src']);
  return { v, note, isRef, live, pre, ok: live === pre, missed: isRef === true && live === false };
});
const spreadMissed = spreadRows.filter((r) => r.missed);
const spreadControlsHold = spreadRows.filter((r) => r.isRef === false).every((r) => r.live === false)
  && spreadRows.filter((r) => r.v === '{ a: src }').every((r) => r.live === true);
// The direction of error, through the real entry point and against the runtime oracle below.
const spreadReturn = both('{ span: { ...src } }');
const g4 = guardInModule === true
  && GUARD.test('{ ...src }') === false && GUARD.test('{ src }') === true
  && GUARD.test('{ o.src }') === false
  && spreadMissed.length === 4 && spreadControlsHold === true
  && spreadRows.every((r) => r.ok)
  && spreadReturn.pre === false && spreadReturn.cured === false;
leg('G4', 'FINDING 2 — `mentionsParam` CANNOT SEE `...param`. Its free-identifier guard is '
  + '`(^|[^.\\w$])`, and a spread\'s third dot satisfies the `.`, so the input spread into an '
  + 'object, an array or a call reads as a property access: FOUR spellings missed, while both '
  + 'property-access controls stay false and a plain reference stays true — so the key still '
  + 'separates, it just has a blind spot. The guard\'s source is asserted PRESENT in the live '
  + 'module and the regex is RUN here rather than reasoned about (329-331/367/409/429). Direction: '
  + 'OVER-refusal — `conventionOf` refuses a return genuinely spreading the input. Present on BOTH '
  + 'sides, so his movement matrix cannot represent it (see G5)',
  `the guard's source text is in the live module: ${guardInModule}`
  + `\n        run here — /${GUARD_SRC}/ on "{ ...src }": ${GUARD.test('{ ...src }')} · on `
  + `"{ src }": ${GUARD.test('{ src }')} · on "{ o.src }": ${GUARD.test('{ o.src }')}`
  + `\n        ${spreadRows.map((r) => `${r.ok ? 'ok  ' : 'BAD '}pre ${String(r.pre).padEnd(5)} `
    + `live ${String(r.live).padEnd(5)} ${r.v.padEnd(16)} ${r.note}`).join('\n        ')}`
  + `\n        references missed: ${spreadMissed.length} · controls hold: ${spreadControlsHold}`
  + `\n        through conventionOf — { span: { ...src } }: pre ${spreadReturn.pre} → cured `
  + `${spreadReturn.cured} · reason: ${String(spreadReturn.curedReason).slice(0, 96)}`, g4);

// ─── G5 — FINDING 3: a [false, false] row is ambiguous, and his matrix labels it by intent ───────
// Read his own matrix out of his instrument's source rather than retyping it (412).
const hisGrader = readFileSync(join(REPO,
  'docs/research/round434-instruments/grade-the-two-cures-and-the-prose.mjs'), 'utf8');
const hisKeyCells = (() => {
  const start = hisGrader.indexOf('const KEY_CELLS = [');
  if (start < 0) return null;
  const end = hisGrader.indexOf('\n];', start);
  if (end < 0) return null;
  const block = hisGrader.slice(start, end);
  const wants = [...block.matchAll(/\[(true|false),\s*(true|false)\]/g)]
    .map((m) => [m[1] === 'true', m[2] === 'true']);
  const controls = (block.match(/CONTROL/g) ?? []).length;
  return { wants, controls, block };
})();
const falseFalseRows = hisKeyCells === null ? null
  : hisKeyCells.wants.filter(([a, b]) => a === false && b === false).length;
// My finding-2 cell has the same signature as his labelled controls, by measurement.
const sameSignature = spreadReturn.pre === false && spreadReturn.cured === false
  && falseFalseRows !== null && falseFalseRows >= 1;
const g5 = hisKeyCells !== null && hisKeyCells.wants.length === 7
  && falseFalseRows === 2 && sameSignature === true;
leg('G5', 'FINDING 3, THE ONE THAT GENERALISES — a `[pre refused, cured refused]` row in a cure '
  + 'matrix is AMBIGUOUS between a control holding and a defect the cure does not touch, and '
  + 'nothing in the matrix separates them: the CONTROL label is authorial intent, not a property '
  + 'the instrument reads. His §1 matrix, read out of his own source rather than retyped (412), has '
  + 'seven rows of which TWO carry that signature and are labelled CONTROL. My Finding 2 carries '
  + 'the identical signature and is not a control at all — dropped into his matrix it would have '
  + 'passed as a third holding control and certified the defect as correct behaviour. The remedy is '
  + 'an oracle for whether refusing is CORRECT, which no pre-vs-cured key can be (G9)',
  hisKeyCells === null ? 'REFUSED: his KEY_CELLS block was unreadable from his source'
    : `his KEY_CELLS rows ${hisKeyCells.wants.length} · signatures `
      + `${JSON.stringify(hisKeyCells.wants.map(([a, b]) => `${a}->${b}`))} · rows with the `
      + `[false,false] signature ${falseFalseRows} · "CONTROL" occurrences in the block `
      + `${hisKeyCells.controls}\n        my Finding 2 cell { span: { ...src } } signature: `
      + `${spreadReturn.pre}->${spreadReturn.cured} — identical to his two labelled controls: `
      + `${sameSignature}`, g5);

// ─── G6 — HIS §5 RULE applied to the full population of instruments naming the module ────────────
const namingMod = git('ls-tree', '-r', '--name-only', REV, 'docs/research/').trim().split('\n')
  .filter((f) => f.endsWith('.mjs'))
  // This round's own directory is excluded by its own path, and the EXCLUSION COUNT is published
  // below rather than left to the verdict: a self-exclusion leg is vacuous before promotion (430).
  .filter((f) => readFileSync(join(REPO, f), 'utf8').includes('refusal-convention'));
const selfExcluded = git('ls-tree', '-r', '--name-only', REV, 'docs/research/').trim().split('\n')
  .filter((f) => f.endsWith('.mjs') && f.includes('round435-instruments'))
  .filter((f) => readFileSync(join(REPO, f), 'utf8').includes('refusal-convention'));
const population = namingMod.filter((f) => !f.includes('round435-instruments'));
// DRIVE 1 CORRECTION, recorded: the first version of this leg pinned `population.length === 6` and
// `redLive.length === 1`. Both were wrong, and in the direction that matters — the population is
// SEVEN (round434's own grader names the module too, and I had covered it by the reproduction
// rather than by a live drive), and TWO members are red live, not one: my own round433 grader is
// red for the same reason, and his own G8 reads that red. A count pin here would have reddened on
// my own promotion anyway (377/405/434), so the leg is re-keyed on the COVERAGE RELATION — every
// member of the population has a recorded drive — with the sizes published as measurements.
const LIVE_DRIVES = {
  'round413-instruments': 'docs/research/round435-instruments/live-round413.out',
  'round414-instruments': 'docs/research/round435-instruments/live-round414.out',
  'round430-instruments': 'docs/research/round435-instruments/live-round430.out',
  'round431-instruments': 'docs/research/round435-instruments/live-round431.out',
  'round432-instruments': 'docs/research/round435-instruments/live-round432.out',
  'round433-instruments': 'docs/research/round435-instruments/live-round433.out',
  'round434-instruments': 'docs/research/round435-instruments/reproduce-his-round434.out',
};
const driven = Object.fromEntries(Object.entries(LIVE_DRIVES)
  .map(([k, p]) => [k, verdicts(p)]));
const covered = population.every((f) => Object.keys(LIVE_DRIVES).some((d) => f.includes(d)));
const redLive = Object.entries(driven).filter(([, v]) => v !== null && /^false/.test(v.gate))
  .map(([k]) => k);
// The one red, graded for CAUSE rather than reported: red at the pre-cure slice too (so not this
// round's cures), and carrying the identical GATE line to a recording Round 432 committed.
const cf = (() => {
  let t;
  try { t = readFileSync(join(HERE, 'round431-precure-vs-cured.out'), 'utf8'); } catch { return null; }
  const p = t.match(/^PRE-cure module\s+GATE (.+?) \| PREDICTIONS/m);
  const l = t.match(/^LIVE \(cured\)\s+GATE (.+?) \| PREDICTIONS/m);
  const r = /^restored exactly\s+true$/m.test(t);
  const s = /^swap landed\s+true/m.test(t);
  return p === null || l === null ? null
    : { pre: p[1].trim(), cured: l[1].trim(), restored: r, swapLanded: s };
})();
const r432Record = verdicts('docs/research/round432-instruments/his-round431-postcure.out');
const r434Record = verdicts('docs/research/round434-instruments/his-round433-postcure.out');
// Each red is accounted for by a COMMITTED recording of the same red, by a seat that saw it: his
// Round 432 for round431's, his Round 434 G8 for round433's. round431 additionally carries the
// pre-cure counterfactual, which rules out THIS round's cures as the cause.
const accountedFor = {
  'round431-instruments': cf !== null && r432Record !== null
    && cf.swapLanded === true && cf.restored === true && cf.pre === cf.cured
    && r432Record.gate === driven['round431-instruments']?.gate,
  'round433-instruments': r434Record !== null
    && r434Record.gate === driven['round433-instruments']?.gate,
};
const allRedsAccounted = redLive.length > 0
  && redLive.every((k) => accountedFor[k] === true);
const g6 = population.length === namingMod.length - selfExcluded.length
  && population.length >= 7
  && covered === true
  && Object.values(driven).every((v) => v !== null)
  && allRedsAccounted === true
  && redLive.length === 2;
leg('G6', 'HIS OWN §5 RULE, APPLIED TO HIS OWN ROUND — "re-drive the GATE line of every instrument '
  + 'the recommendation\'s target file appears in". The population is selected from the tree at a '
  + 'stamped rev with `ls-tree` rather than `ls-files`, so a staged index cannot move it (414-416), '
  + 'and each member is DRIVEN LIVE at HEAD rather than read out of a committed recording. He '
  + 'EVERY member is covered — the leg is keyed on that coverage relation rather than on a count, '
  + 'because a count here would redden on this round\'s own promotion (377/405/434). TWO members '
  + 'are red live, and each red is accounted for by a COMMITTED recording of the same red: '
  + 'round431 by his Round 432, and my own round433 grader by his Round 434 G8. round431 '
  + 'additionally carries a pre-cure counterfactual — red against the PRE-CURE slice too, with the '
  + 'swap asserted to have landed and the restore asserted byte-identical — which rules out this '
  + 'round\'s cures as its cause. So the rule, applied in full, finds nothing he missed. That '
  + 'NEGATIVE is the result, and it is worth as much as a finding would have been',
  `instruments naming the module in the tree at ${REV.slice(0, 8)}: ${namingMod.length} · this `
  + `round's own, excluded by its own path: ${selfExcluded.length} · population `
  + `${population.length} (counts, published as measurements — a self-exclusion leg is vacuous `
  + `before promotion (430), so this reads 0 pre-commit and 1 after)`
  + `\n        every population member has a recorded drive: ${covered}`
  + `\n        ${Object.entries(driven).map(([k, v]) => `${k.replace('-instruments', '')} GATE ${v === null ? 'UNREADABLE' : v.gate}`).join(' ║ ')}`
  + `\n        red live (${redLive.length}): ${JSON.stringify(redLive)} · all accounted for: `
  + `${allRedsAccounted}`
  + `\n        round431 — pre-cure GATE "${cf?.pre}" vs cured GATE "${cf?.cured}" (identical: `
  + `${cf?.pre === cf?.cured}; swap landed ${cf?.swapLanded}, restored byte-identical `
  + `${cf?.restored}) · round432's committed recording GATE "${r432Record?.gate}" matches: `
  + `${accountedFor['round431-instruments']}`
  + `\n        round433 — his Round 434 G8 recording GATE "${r434Record?.gate}" matches the live `
  + `red: ${accountedFor['round433-instruments']}`, g6);

// ─── G7 — the recording his own G7 cites does not reproduce at HEAD, and his commit moved it ─────
const hisR430Rec = verdicts('docs/research/round434-instruments/round430-gate-postcure.out');
const myR430Live = verdicts('docs/research/round435-instruments/live-round430.out');
const d430 = hisR430Rec === null || myR430Live === null ? null
  : diffIdx(hisR430Rec.text, myR430Live.text);
const nonStamp = d430 === null ? null : d430.filter((i) => {
  const l = (myR430Live.text.split('\n')[i] ?? '');
  return !/^\s*rev [0-9a-f]{8,}\b/.test(l);
});
const countAt = (rev) => git('ls-tree', '-r', '--name-only', rev, 'docs/research').trim()
  .split('\n').filter((f) => f.endsWith('.mjs')).length;
const ADDED_BY = git('log', '--format=%h', '--diff-filter=A', '--',
  'docs/research/round434-instruments/grade-the-two-cures-and-the-prose.mjs').trim().split('\n')[0];
const recRev = (hisR430Rec?.text.match(/rev ([0-9a-f]{8})/) ?? [, null])[1];
const isDescendant = recRev === null ? null : (() => {
  try { git('merge-base', '--is-ancestor', recRev, ADDED_BY); return true; } catch { return false; }
})();
// DRIVE 3 CORRECTION, recorded: this leg pinned `countAt(REV) === 116` and went RED on its own
// promotion — my own commit added three research `.mjs` files and the live count became 119. That
// is 377/405/434, the lesson I cited in G6 one leg earlier and then broke here, in the adjacent
// leg of the same instrument. Re-keyed on the two counts that are HISTORICAL and therefore
// immutable (the recording's rev, and his promotion commit), with the live count published as a
// MEASUREMENT and asserted only to be strictly greater — which is the claim the finding needs.
const countRec = countAt(recRev ?? REV);
const countAdded = countAt(ADDED_BY);
const countLive = countAt(REV);
const g7 = hisR430Rec !== null && myR430Live !== null
  && d430 !== null && d430.length === 3 && nonStamp.length === 2
  && /^true/.test(hisR430Rec.gate) && /^true/.test(myR430Live.gate)
  && recRev === 'f9fba861' && ADDED_BY.startsWith('be58bfa4') && isDescendant === true
  && countRec === 115 && countAdded === 116 && countLive > countRec;
leg('G7', 'THE RECORDING HIS OWN G7 CITES DOES NOT REPRODUCE AT HEAD. `round430-gate-postcure.out` '
  + 'was taken at `f9fba861`; driven live at HEAD the same instrument differs on THREE lines, of '
  + 'which TWO are not rev stamps — its censused research-`.mjs` population moved 115 → 116 and its '
  + 'hit list grew. The commit that moved it is HIS OWN promotion commit `be58bfa4`, which added '
  + 'the Round 434 grader into the population round430 censuses, and which is a descendant of the '
  + 'rev the recording was taken at. Both GATE lines are still true, so this is DRIFT IN A '
  + 'PUBLISHED FIGURE rather than a red — but the recording is what a reader checks, and his §5 '
  + 'repair deliberately published that count as a measurement rather than a pin, which is what '
  + 'kept it from reddening',
  hisR430Rec === null || myR430Live === null ? 'REFUSED: a verdict line was unreadable'
    : `differing line indices ${JSON.stringify(d430)} · of which NOT rev stamps `
      + `${JSON.stringify(nonStamp)}\n        his recording GATE "${hisR430Rec.gate}" · live at `
      + `HEAD GATE "${myR430Live.gate}" (verdict unmoved: `
      + `${/^true/.test(hisR430Rec.gate) && /^true/.test(myR430Live.gate)})`
      + `\n        research .mjs — at the recording's rev ${recRev}: ${countRec} (pinned, `
      + `historical) · at his promotion commit ${ADDED_BY}: ${countAdded} (pinned, historical) · `
      + `at HEAD ${REV.slice(0, 8)}: ${countLive} (a MEASUREMENT, asserted only > ${countRec} — `
      + `pinning this reddened the leg on its own promotion, 377/405/434)`
      + `\n        the grader was added by ${ADDED_BY}, a descendant of ${recRev}: `
      + `${isDescendant}`, g7);

// ─── The runtime oracle, and G9 grading the oracle itself for separation ─────────────────────────
// Build the subject, call it over several inputs, and ask whether the answer value MOVES. An
// oracle that answered one way for everything would certify anything, so it is graded, not trusted.
const INPUTS = ['abc', 'defgh', 'ij', 'klmnopq'];
const oracle = (ret) => {
  let fn;
  const body = SUBJ(ret).replace(/^function read\(src\) \{/, '').replace(/\}$/, '');
  try { fn = new Function('src', `const cond = true; const k = 'kk';\n${body}`); } catch { return null; }
  const outs = [];
  for (const i of INPUTS) {
    try { outs.push(JSON.stringify(fn(i)) ?? 'undefined'); } catch { return null; }
  }
  return { derived: new Set(outs).size > 1, outs };
};
const ORACLE_CELLS = [
  ['{ span: { ...src } }', 'FINDING 2 — the oracle\'s whole point: a [false,false] row that is a DEFECT'],
  ['{ span: { from: src.length } }', 'his over-reach control — genuinely derived'],
  ['{ span: { a: `${src}` } }', 'template interpolation of the input'],
  ['{ span: { src } }', 'ES6 shorthand — genuinely derived'],
  ['{ span: { src: 1 } }', 'his §1 cell — genuinely NOT derived'],
  ['{ span: { q: 1 } }', 'his control — genuinely NOT derived'],
  ['{ span: { a: "src" } }', 'the name in a string body — NOT derived'],
];
const oracleRows = ORACLE_CELLS.map(([ret, note]) => {
  const o = oracle(ret);
  const c = both(ret);
  return { ret, note, o, cured: c.cured, pre: c.pre, agrees: o === null ? null : o.derived === c.cured };
});
const oracleReadable = oracleRows.every((r) => r.o !== null);
const bothWays = oracleReadable
  && oracleRows.some((r) => r.o.derived === true) && oracleRows.some((r) => r.o.derived === false);
const disagreements = oracleRows.filter((r) => r.agrees === false);
const g9 = oracleReadable && bothWays === true
  && disagreements.length === 1 && disagreements[0].ret === '{ span: { ...src } }'
  && disagreements[0].o.derived === true && disagreements[0].cured === false;
leg('G9', 'THE ORACLE IS GRADED, NOT TRUSTED. It builds each subject, calls it over four inputs and '
  + 'asks whether the answer value MOVES — the property the answer-shape leg is reading off source '
  + 'text, and the only thing that can grade a `[false, false]` row. A one-sided oracle would '
  + 'certify anything, so separation is asserted: it must answer DERIVED for at least one subject '
  + 'and not-derived for at least one, and it must AGREE with the cured module on every subject but '
  + 'the finding — exactly one disagreement, in the over-refusal direction, on the spread. Its '
  + 'blind spot, stated: it reads value identity, so a subject that mentions the input in a branch '
  + 'never taken reads as not-derived — which is why the cells above are shapes whose value either '
  + 'plainly moves or plainly cannot',
  oracleRows.map((r) => `${r.agrees === false ? 'DISAGREE' : 'agree   '} oracle `
    + `${r.o === null ? 'UNREADABLE' : (r.o.derived ? 'DERIVED    ' : 'not-derived')} cured `
    + `${String(r.cured).padEnd(5)} ${r.ret.padEnd(32)} ${r.note}`).join('\n        ')
  + `\n        oracle separates both ways: ${bothWays} · disagreements `
  + `${disagreements.length} [${disagreements.map((r) => r.ret).join(', ')}]`, g9);

// ─── G8 — his G6 length-preservation leg is NOT vacuous, measured rather than assumed ────────────
const allCells = NOCOLON.map(([v]) => v).concat(SPREAD.map(([v]) => v))
  .concat(ORACLE_CELLS.map(([v]) => v));
let spans = 0;
let fires = 0;
let lenOk = 0;
for (const v of allCells) {
  for (const s of LIVE.returnExprs(SUBJ(v)) ?? []) {
    spans += 1;
    const m = LIVE.maskKeyPositions(s.masked);
    if (m !== s.masked) fires += 1;
    if (m.length === s.masked.length) lenOk += 1;
  }
}
const g8 = spans > 0 && lenOk === spans && fires > 0;
leg('G8', 'HIS G6 IS NOT VACUOUS, and that is measured here rather than taken on trust: a '
  + '"length-preserving" leg is trivially true of a blanker that never fires, and his leg does not '
  + 'read whether it fired. Over every subject this file constructs, the masker FIRES on a '
  + 'non-zero number of spans and is length-preserving on all of them — so his leg is green for '
  + 'the right reason. Published as counts, not pinned (377/405): a new subject here must not '
  + 'redden it',
  `spans ${spans} · masker fires on ${fires} · length-preserving on ${lenOk} of ${spans}`, g8);

// ─── P1 — his stated §1 residual, driven as a measurement rather than left as prose ─────────────
// Genuinely unread when written: his docblock asserts the direction, and I have not driven it.
const labelOnly = both('{ span: (() => { src: for (;;) { break q; } return 1; })() }');
const labelControl = both('{ span: (() => { lbl: for (;;) { break lbl; } return src; })() }');
const p1 = labelOnly.pre === true && labelOnly.cured === false
  && labelControl.pre === true && labelControl.cured === true;
pred('P1', 'HIS STATED §1 RESIDUAL IS REAL AND ITS DIRECTION IS THE ONE HE GAVE — a labelled '
  + 'statement whose label is spelled like the parameter has its label blanked, so a span whose '
  + 'ONLY occurrence of the input is that label flips admitted → refused (over-refusal). Driven as '
  + 'a 2 × 2 rather than left in his docblock as prose, with the control being the same shape where '
  + 'the label is NOT the param and the input is genuinely read — that one must not move. '
  + 'Genuinely unread when this leg was written: his docblock states the direction, I had not run it',
  `param-only-as-label: pre ${labelOnly.pre} → cured ${labelOnly.cured} `
  + `(reason: ${String(labelOnly.curedReason).slice(0, 72)}) ║ CONTROL label not the param, input `
  + `genuinely read: pre ${labelControl.pre} → cured ${labelControl.cured}`, p1);

// ─── P2 — the population Finding 1 can bite, over his own census corpus ─────────────────────────
// Unread when written. The FLOOR direction is named: the key is a source-text pattern over masked
// return spans, so a spelling it misses makes this number SMALLER, never larger (408).
const libFiles = git('ls-tree', '-r', '--name-only', REV, 'scripts/lib/').trim().split('\n')
  .filter((f) => f.endsWith('.mjs'));
const libIdentical = libFiles.filter((f) => git('show', `${REV}:${f}`) === readFileSync(join(REPO, f), 'utf8'));
let libFns = 0;
const colonFreeHeads = [];
const spreadOfAnything = [];
const spreadOfParam = [];
for (const f of libFiles) {
  let mod;
  try { mod = await import(join(REPO, f)); } catch { continue; }
  for (const [name, v] of Object.entries(mod)) {
    if (typeof v !== 'function') continue;
    libFns += 1;
    const s = v.toString();
    const ps = LIVE.paramsOf(s);
    for (const sp of LIVE.returnExprs(s) ?? []) {
      const m = LIVE.maskKeyPositions(sp.masked);
      if (/[{,]\s*(?:get |set |async |\*)?[A-Za-z_$][\w$]*\s*\(/.test(m)) {
        colonFreeHeads.push(`${f}#${name}@${sp.at}`);
      }
      if (/\.\.\.[A-Za-z_$]/.test(sp.masked)) spreadOfAnything.push(`${f}#${name}@${sp.at}`);
      if (ps.refused === undefined) {
        for (const p of ps.params) {
          if (new RegExp(`\\.\\.\\.${p}(?![\\w$])`).test(sp.masked)
              && !LIVE.mentionsParam(sp.masked, [p])) spreadOfParam.push(`${f}#${name}@${sp.at}`);
        }
      }
    }
  }
}
const p2 = libFiles.length > 0 && libIdentical.length === libFiles.length
  && colonFreeHeads.length >= 1;
pred('P2', 'the population FINDING 1 can bite is NON-EMPTY on his own census corpus: over every '
  + 'function export of `scripts/lib/` at a stamped rev there is at least one return span carrying '
  + 'a colon-free property name at an entry head — the shape the masker does not blank. This is the '
  + 'floor datum the next seat needs, and the floor direction is named: the key is a source-text '
  + 'pattern over masked return spans, so a spelling it misses makes this number SMALLER, never '
  + 'larger (408). Genuinely unread when this leg was written',
  `${libFiles.length} files (byte-identical to their blobs: `
  + `${libIdentical.length === libFiles.length}) · ${libFns} function exports`
  + `\n        FINDING 1's biteable population — return spans with a colon-free property name at an `
  + `entry head: ${colonFreeHeads.length}${colonFreeHeads.length === 0 ? '' : ` [${colonFreeHeads.slice(0, 6).join(' ║ ')}${colonFreeHeads.length > 6 ? ` ║ …${colonFreeHeads.length - 6} more` : ''}]`}`
  + `\n        FINDING 2's biteable population — return spans spreading ANY identifier: `
  + `${spreadOfAnything.length}${spreadOfAnything.length === 0 ? '' : ` [${spreadOfAnything.slice(0, 6).join(' ║ ')}]`}`
  + `\n        LIVE INSTANCES of either finding on this corpus: finding 1 (a param-named colon-free `
  + `head) and finding 2 (a spread OF A PARAM) — spreadOfParam ${spreadOfParam.length}; both `
  + `findings are confirmed BY CONSTRUCTION above, not by a live instance here, and this round says `
  + `so rather than implying reach it has not measured`, p2);

// ─── Report ─────────────────────────────────────────────────────────────────────────────────────
const out = [];
out.push('Round 435 — grading Daedalus\'s Round 434, and oracling the rows his cure matrix cannot');
out.push('');
for (const l of legs) {
  out.push(`  ${l.ok === true ? 'TRUE ' : 'FALSE'} ${l.id}  [GATE] ${l.claim}`);
  out.push(`        ${l.detail}`);
}
for (const p of preds) {
  out.push(`  ${p.landed === true ? 'TRUE ' : 'FALSE'} ${p.id}  [PRED] ${p.claim}`);
  out.push(`        ${p.detail}`);
}
out.push('');
const failed = legs.filter((l) => l.ok !== true);
const refuted = preds.filter((p) => p.landed !== true);
out.push(`GATE: ${failed.length === 0 ? 'true' : 'false'}   (${legs.length} leg(s))`
  + (failed.length === 0 ? '' : ` — FALSE: ${failed.map((l) => l.id).join(', ')}`));
out.push(`PREDICTIONS: ${preds.length - refuted.length} landed, ${refuted.length} refuted`
  + (refuted.length === 0 ? '' : `: ${refuted.map((p) => p.id).join(' | ')}`));
out.push(`  rev ${REV.slice(0, 8)} · his pre-cure slice rev ${PRE_REV} · worktree `
  + `${DIRTY ? 'DIRTY' : 'clean'}`);
console.log(out.join('\n'));
process.exitCode = failed.length === 0 ? 0 : 1;
