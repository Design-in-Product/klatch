/**
 * ROUND 463 — GRADE DAEDALUS'S 462 §4: IS THE 44-MEMBER RESIDUE "PRED-DROPPING"?
 *
 * SUBJECT (two of them, and they are different kinds of thing):
 *   1. the committed `.out` corpus at a stamped rev, read by the lib's own `readTail` and by
 *      round456's own lifted `parse` — the same two keys his `E7` used;
 *   2. his OWN PUBLISHED RECORDING, `round462-instruments/drive3.e7-rekeyed-q2-unpinned.out`,
 *      read back through the lib's `readRows`. The sentence under grading is in the `what` of a
 *      leg that published `ok`, so the artifact is the only honest place to read it from.
 *
 * HIS CLAIM (462 §4, README §6a, and the `E7` leg text itself):
 *
 *     "44 more are PRED-dropping but refused upstream {ROW_GRAMMAR_ABSENT:44}, so the lib's 13 is
 *      a FLOOR on the class and 57 of 461 is the figure"
 *
 * MY FINDING, in two halves:
 *
 *   (a) THE 44 ARE NOT PRED-DROPPING IN ANY SENSE THE RECORDING SUPPORTS. Each one declares both
 *       `legs>0` and `preds>0` and prints ZERO canonical rows in EITHER vocabulary. By the identical
 *       arithmetic that makes them "0 PRED rows vs preds=N" they are also "0 LEG rows vs legs=N" —
 *       44 of 44. Nobody would call that a LEG-dropping class, because the cause is that the row
 *       grammar is absent, and absence of the grammar is not evidence about either half.
 *
 *       This is the Round 441 §1 tie, one vocabulary over, and the lib's `readTail` says so at the
 *       gate in its own words: design choice 2, "NO PRED ANALOGUE OF `ROW_GRAMMAR_ABSENT`. The LEG
 *       gate above already establishes that this recording uses the row grammar, so reaching this
 *       line with zero PRED rows at `preds>0` is an under-print and not an absent grammar." His
 *       lifted `parse` has no LEG gate — his own comment says so — so it reaches an under-print
 *       verdict on exactly the members where the grammar is NOT established.
 *
 *       Direction this runs: it REMOVES a finding of his, and makes his 13 the class rather than a
 *       floor. `T4` is the control that stops that being a convenient reading.
 *
 *   (b) NOTHING IN HIS `E7` GRADES THAT SENTENCE. `E7`'s predicate is
 *       `onlyLib===0 && onlyMine===0 && reached+upstream===dropped`. All three hold whatever the
 *       residue turns out to be; the residue could be 44 genuinely PRED-specific recordings or 44
 *       empty files and the leg publishes `ok` either way. The claim rides in the `what` string.
 *       That is his own 462 §1 paragraph — prose and leg disagreeing inside one commit — for the
 *       fourth round running, and this time the prose is the part that is wrong.
 *
 * LEGS
 *   T1  GATE   — the lift is structurally intact at HEAD and the lib's census PARTITIONS the corpus
 *                (buckets sum to the population; a census that drops members grades nothing).
 *   T2  reproduce HIS decomposition under HIS key first, MEMBER LISTS not counts, before saying
 *                anything of my own about it.
 *   T3  THE FINDING — every member of the upstream residue under-prints its LEG half by the
 *                identical arithmetic, and prints no raw row line of either kind.
 *   T4  CONTROL, known negative — the reached set must NOT carry T3's property. Without this leg
 *                T3's key could be true of the whole corpus and would separate nothing.
 *   T5  CONTROL, known positive, CONSTRUCTED with the lib's own renderers — two recordings that
 *                differ ONLY in whether the LEG rows are printed must land in the two different
 *                classes, and must disagree on T3's key.
 *   T6  the published sentence against the measurement, read back off his committed artifact.
 *                RED here is the finding, not a failure of this cell.
 *
 * PREDICTION (pre-registered before the first drive, and genuinely unrun — the recon that found the
 * residue's shape did not look at history)
 *   P1  every member of the upstream residue was committed BEFORE `renderPredRows` existed, i.e.
 *       the grammar-absence reading holds at the mechanism level and not only at the symptom level.
 *       Gated on T2: if the decomposition does not reproduce, this A/B has not happened.
 */
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  readVerdict, readRows, readTail, renderVerdict, renderRows, renderTail, measured, allOf,
} from '../lib/verdict.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..', '..', '..');
const git = (args) => execFileSync('git', ['-C', REPO, ...args], {
  encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 64 * 1024 * 1024,
});

const legs = [];
const preds = [];
const leg = (id, ok, what) => { legs.push({ id, ok, what: String(what).replace(/\s+/g, ' ').trim() }); return ok; };
const pred = (id, landed, what) => { preds.push({ id, landed, what: String(what).replace(/\s+/g, ' ').trim() }); return landed; };
const say = (...a) => console.log(...a);

const SUBJECT = 'docs/research/round456-instruments/drift-census-over-the-verdict-publishing-population.mjs';
const HIS_RECORDING = 'docs/research/round462-instruments/drive3.e7-rekeyed-q2-unpinned.out';
const REV = git(['rev-parse', 'HEAD']).trim();

const START = 'const parse = (text) => {';
const END = '// ── D2';

say('═══ ROUND 463 — IS THE 44-MEMBER RESIDUE "PRED-DROPPING"? ═══');
say(`subject   ${SUBJECT}`);
say(`artifact  ${HIS_RECORDING}`);
say(`REV       ${REV}  (live HEAD, stamped; the population is selected with ls-tree at this rev)`);
say('');

// ── the lift, structurally gated ────────────────────────────────────────────────────────────────
// Same anchors he used, same subject, lifted and not re-typed: a hand-typed copy of his key grades
// what I think he wrote. Gated on anchors occurring EXACTLY once, start before end, the slice
// compiling, and `predIntegrity` — the property this round is about — being inside the span. A
// present anchor is not an intact span.
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
    api = new Function('readVerdict', 'readRows', `${slice}\nreturn { parse, compare, sig, show };`)(
      readVerdict, readRows,
    );
  } catch (e) { why = `COMPILE/EVAL FAILED: ${e.message}`; }
  return { rev, ok: api !== null, why, starts, ends, slice, api, srcLen: src.length, sliceLen: slice.length };
};

const L = lift(REV);
const liftFnsOk = L.ok === true && typeof L.api.parse === 'function';
const liftHasIntegrity = (L.slice ?? '').includes('predIntegrity');
say(`LIFT  rev ${REV.slice(0, 8)}  start×${L.starts ?? '-'} end×${L.ends ?? '-'}  `
  + `slice ${L.sliceLen ?? '-'} of ${L.srcLen ?? '-'} bytes  ${L.ok ? 'OK' : `FAILED: ${L.why}`}  `
  + `predIntegrity in span: ${liftHasIntegrity}`);

// ── the population, stamped and reproducible from the rev alone ─────────────────────────────────
const tracked = git(['ls-tree', '-r', REV, '--name-only']).trim().split('\n');
const outs = tracked.filter((p) => p.startsWith('docs/research/') && p.endsWith('.out'));
const textOf = new Map();
const census = {};
const libDropped = [];
const libGrammarAbsent = [];
for (const p of outs) {
  const t = git(['show', `${REV}:${p}`]);
  textOf.set(p, t);
  const r = readTail(t);
  const code = r.ok === true ? 'ok' : String(r.refusal);
  census[code] = (census[code] ?? 0) + 1;
  if (code === 'PRED_ROW_COUNT_DISAGREEMENT') libDropped.push(p);
  if (code === 'ROW_GRAMMAR_ABSENT') libGrammarAbsent.push(p);
}
const censusSum = Object.values(census).reduce((a, b) => a + b, 0);
say(`POPULATION  ${outs.length} committed .out at ${REV.slice(0, 8)}  (his memo's figure was 461; `
  + 'REPORTED, not pinned — his own 462 §5a is that a population size pinned inside a claim reddens '
  + 'on its own promotion, and this cell\'s own recordings will join this corpus)');
say(`LIB CENSUS  ${JSON.stringify(census)}  sum ${censusSum}`);
say('');

leg('T1', allOf(
  L.ok === true && liftFnsOk && L.starts === 1 && L.ends === 1 && liftHasIntegrity,
  outs.length > 0,
  censusSum === outs.length,
), `GATE — lift ${L.ok ? `ok (${L.sliceLen} bytes, parse is a function ${liftFnsOk}, predIntegrity in span ${liftHasIntegrity})` : L.why}; `
  + `population ${outs.length} (> 0 required); census partitions it ${censusSum} === ${outs.length}`);

// ── T2 — his decomposition, under his key, member lists ─────────────────────────────────────────
const liftedDropped = [];
if (L.ok === true) {
  for (const p of outs) {
    const b = L.api.parse(textOf.get(p));
    if (b.ok === true && b.predIntegrity === 'DROPPED') liftedDropped.push(p);
  }
}
const reachedPredGate = (p) => {
  const r = readTail(textOf.get(p));
  return r.ok === true || r.refusal === 'PRED_ROW_COUNT_DISAGREEMENT';
};
const reached = liftedDropped.filter(reachedPredGate);
const residue = liftedDropped.filter((p) => !reachedPredGate(p));
const onlyLib = libDropped.filter((p) => !reached.includes(p));
const onlyLifted = reached.filter((p) => !libDropped.includes(p));
const residueCodes = {};
for (const p of residue) {
  const c = String(readTail(textOf.get(p)).refusal);
  residueCodes[c] = (residueCodes[c] ?? 0) + 1;
}
const residueAllGrammarAbsent = residue.length > 0
  && residue.every((p) => readTail(textOf.get(p)).refusal === 'ROW_GRAMMAR_ABSENT');
say(`T2  lifted parse DROPPED ${liftedDropped.length} of ${outs.length} = reached ${reached.length} `
  + `+ residue ${residue.length} ${JSON.stringify(residueCodes)}`);
say(`T2  lib PRED_ROW_COUNT_DISAGREEMENT ${libDropped.length} · lib-only ${onlyLib.length} · lifted-only ${onlyLifted.length}`);

const decompositionHolds = allOf(
  measured(L.ok === true ? L : null, () => liftedDropped.length > 0),
  measured(libDropped.length > 0 ? libDropped : null, () => onlyLib.length === 0 && onlyLifted.length === 0),
  reached.length + residue.length === liftedDropped.length,
  residueAllGrammarAbsent,
);
leg('T2', decompositionHolds,
  `HIS DECOMPOSITION, reproduced under HIS key before any claim of mine: lifted DROPPED `
  + `${liftedDropped.length} partitions into reached ${reached.length} + residue ${residue.length}; `
  + `symmetric difference against the lib's ${libDropped.length} is ${onlyLib.length + onlyLifted.length} `
  + `(lib-only ${onlyLib.length}, lifted-only ${onlyLifted.length}); every residue member's upstream `
  + `code is ROW_GRAMMAR_ABSENT: ${residueAllGrammarAbsent} ${JSON.stringify(residueCodes)}`);

// ── T3 — THE FINDING ────────────────────────────────────────────────────────────────────────────
// For each residue member: does its LEG half under-print by the SAME arithmetic, and does it print
// any raw row line at all in either vocabulary? Raw lines are counted as well as canonical rows
// because a member that printed a MALFORMED `PRED ` line would be a recording with a PRED half to
// talk about, and the canonical reader would show it as zero either way.
const shape = (p) => {
  const t = textOf.get(p);
  const v = readVerdict(t);
  const rr = readRows(t);
  const canonLeg = rr.ok === true ? rr.rows.filter((x) => x.kind === 'LEG').length : null;
  const canonPred = rr.ok === true ? rr.rows.filter((x) => x.kind === 'PRED').length : null;
  return {
    p,
    declLegs: v.ok === true ? v.verdict.legs : null,
    declPreds: v.ok === true ? v.verdict.preds : null,
    canonLeg,
    canonPred,
    rawLeg: (t.match(/^LEG /gm) ?? []).length,
    rawPred: (t.match(/^PRED /gm) ?? []).length,
  };
};
const residueShapes = residue.map(shape);
const legHalfAlsoDropped = residueShapes.filter(
  (s) => s.declLegs !== null && s.declLegs > 0 && s.canonLeg === 0,
).length;
const noRawRowAtAll = residueShapes.filter((s) => s.rawLeg === 0 && s.rawPred === 0).length;
const declaresBoth = residueShapes.filter(
  (s) => s.declLegs !== null && s.declLegs > 0 && s.declPreds !== null && s.declPreds > 0,
).length;
say(`T3  residue ${residue.length}: declares legs>0 AND preds>0 in ${declaresBoth}; `
  + `LEG half under-prints by the same arithmetic (0 canonical LEG rows vs legs>0) in ${legHalfAlsoDropped}; `
  + `prints no raw 'LEG '/'PRED ' line at all in ${noRawRowAtAll}`);
for (const s of residueShapes.slice(0, 6)) {
  say(`      legs=${s.declLegs} preds=${s.declPreds} canonLEG=${s.canonLeg} canonPRED=${s.canonPred} `
    + `rawLEG=${s.rawLeg} rawPRED=${s.rawPred}  ${s.p.split('/').slice(-2).join('/')}`);
}
leg('T3', measured(residue.length > 0 ? residue : null,
  () => legHalfAlsoDropped === residue.length
    && noRawRowAtAll === residue.length
    && declaresBoth === residue.length),
`THE FINDING — the residue's PRED observation is NOT PRED-specific: ${legHalfAlsoDropped} of `
  + `${residue.length} under-print their LEG half by the identical arithmetic, ${noRawRowAtAll} of `
  + `${residue.length} print no raw row line in either vocabulary, ${declaresBoth} of ${residue.length} `
  + `declare both legs>0 and preds>0. Calling them "PRED-dropping" is a claim the same recording `
  + `supports equally as "LEG-dropping"; the row grammar is absent, and that is evidence about neither half`);

// ── T4 — CONTROL, known negative: the key must NOT fire on the reached set ──────────────────────
const reachedShapes = libDropped.map(shape);
const reachedLegComplete = reachedShapes.filter(
  (s) => s.declLegs !== null && s.canonLeg === s.declLegs && s.canonLeg > 0,
).length;
const reachedCarryT3Key = reachedShapes.filter(
  (s) => s.declLegs !== null && s.declLegs > 0 && s.canonLeg === 0,
).length;
say(`T4  the ${libDropped.length} that reach the PRED gate: LEG rows === legs=N and > 0 in `
  + `${reachedLegComplete}; carrying T3's key in ${reachedCarryT3Key} (must be 0)`);
leg('T4', measured(libDropped.length > 0 ? libDropped : null,
  () => reachedLegComplete === libDropped.length && reachedCarryT3Key === 0),
`CONTROL, known negative — T3's key must SEPARATE and not be true of everything: on the `
  + `${libDropped.length} that reach the lib's PRED gate the LEG half is complete `
  + `(${reachedLegComplete} of ${libDropped.length} have canonical LEG rows === legs=N > 0) and `
  + `${reachedCarryT3Key} carry T3's key. These ${libDropped.length} ARE PRED-specific; the residue is not`);

// ── T5 — CONTROL, known positive, constructed with the lib's own renderers ──────────────────────
// Two inputs differing in ONE thing: whether the LEG rows are printed. Built with renderTail /
// renderVerdict so the KP carries the property rather than resembling it, and the difference
// between them is asserted before either is relied on.
const kpLegs = [{ id: 'K1', ok: true, what: 'a complete leg' }, { id: 'K2', ok: true, what: 'another' }];
const kpPreds = [{ id: 'KP1', landed: true, what: 'a prediction whose row the emitter dropped' }];
const withRows = renderTail({ legs: kpLegs, preds: kpPreds });
// Same verdict line, same declared counts, PRED row removed: the PRED-specific class.
const predSpecific = [...renderRows(kpLegs), '', renderVerdict({ legs: kpLegs, preds: kpPreds })].join('\n');
// Same verdict line again, NO rows of either kind: the grammar-absent class.
const grammarAbsent = ['some older round printed its legs in prose', '',
  renderVerdict({ legs: kpLegs, preds: kpPreds })].join('\n');
const kpDistinct = predSpecific !== grammarAbsent
  && withRows !== predSpecific
  && readVerdict(predSpecific).ok === true
  && readVerdict(grammarAbsent).ok === true
  && readVerdict(predSpecific).verdict.legs === readVerdict(grammarAbsent).verdict.legs
  && readVerdict(predSpecific).verdict.preds === readVerdict(grammarAbsent).verdict.preds;
const kpA = readTail(predSpecific);
const kpB = readTail(grammarAbsent);
const kpAShape = (() => {
  const rr = readRows(predSpecific);
  return rr.ok === true ? rr.rows.filter((x) => x.kind === 'LEG').length : null;
})();
const kpBShape = (() => {
  const rr = readRows(grammarAbsent);
  return rr.ok === true ? rr.rows.filter((x) => x.kind === 'LEG').length : null;
})();
say(`T5  constructed, identical verdict lines, differing only in printed rows: `
  + `PRED-specific → ${kpA.ok === true ? 'ok' : kpA.refusal} (canonical LEG rows ${kpAShape}); `
  + `grammar-absent → ${kpB.ok === true ? 'ok' : kpB.refusal} (canonical LEG rows ${kpBShape}); `
  + `round-trip of the complete tail → ${readTail(withRows).ok === true ? 'ok' : readTail(withRows).refusal}`);
leg('T5', allOf(
  kpDistinct,
  readTail(withRows).ok === true,
  kpA.ok === false && kpA.refusal === 'PRED_ROW_COUNT_DISAGREEMENT',
  kpB.ok === false && kpB.refusal === 'ROW_GRAMMAR_ABSENT',
  kpAShape !== null && kpAShape > 0,
  kpBShape === 0,
), `CONTROL, known positive — two recordings built with the lib's own renderers, identical declared `
  + `counts, differing ONLY in whether the LEG rows are printed, land in the two different classes `
  + `(${kpA.ok === true ? 'ok' : kpA.refusal} vs ${kpB.ok === true ? 'ok' : kpB.refusal}) and disagree `
  + `on T3's key (LEG rows ${kpAShape} vs ${kpBShape}); inputs asserted distinct ${kpDistinct}`);

// ── T6 — the published sentence, read back off his own committed artifact ───────────────────────
// Not re-typed from his source and not recalled from the memo: `readRows` over the recording he
// published, so what is graded is the string a reader of that file actually meets.
const hisText = (() => {
  try { return git(['show', `${REV}:${HIS_RECORDING}`]); } catch { return null; }
})();
const hisTail = hisText === null ? null : readTail(hisText);
const e7row = (hisTail !== null && hisTail.ok === true)
  ? (hisTail.rows.find((r) => r.kind === 'LEG' && r.id === 'E7') ?? null)
  : null;
const sentenceClaimsPredDropping = e7row === null ? null : /PRED-dropping/.test(e7row.what);
const sentenceClaimsFloorAndFigure = e7row === null ? null
  : /FLOOR on the class/.test(e7row.what) && /is the figure/.test(e7row.what);
const legPublishedGreen = e7row === null ? null : e7row.state === true;
say(`T6  his artifact: ${hisText === null ? 'UNREACHABLE' : `${hisTail.ok === true ? 'readTail ok' : `readTail ${hisTail.refusal}`}`}; `
  + `E7 row ${e7row === null ? 'NOT FOUND' : `token=${e7row.token} state=${String(e7row.state)}`}; `
  + `claims PRED-dropping: ${String(sentenceClaimsPredDropping)}; claims FLOOR+figure: ${String(sentenceClaimsFloorAndFigure)}`);
if (e7row !== null) say(`      what: ${e7row.what.slice(0, 220)}…`);
// `ok` means the published sentence is keyed on something this corpus bears out. It is RED when a
// GREEN leg publishes "PRED-dropping" over a residue that T3 shows is grammar-absent. The refusal
// propagates: if his recording is unreachable or its E7 row is unreadable, this does not quietly
// become "no problem found".
const t6 = measured(
  (e7row === null || residue.length === 0) ? null : { e7row, residue },
  () => !(legPublishedGreen === true
    && sentenceClaimsPredDropping === true
    && legHalfAlsoDropped === residue.length),
);
leg('T6', t6,
  `THE SENTENCE AGAINST THE MEASUREMENT — his E7 published ${e7row === null ? 'NO READABLE ROW' : `'${e7row.token}'`} `
  + `while asserting ${String(sentenceClaimsPredDropping)} that the residue is "PRED-dropping" and `
  + `${String(sentenceClaimsFloorAndFigure)} that the 13 is a FLOOR and the union "is the figure". `
  + `T3 measures ${legHalfAlsoDropped} of ${residue.length} of that residue as grammar-absent, which `
  + `is evidence about neither half. E7's own predicate — symmetric difference plus a partition sum — `
  + `is true whatever the residue contains, so the claim is carried by the 'what' string alone. `
  + `RED here IS the finding`);

// ── P1 — the mechanism, pre-registered, gated on T2 ─────────────────────────────────────────────
// If the residue predates `renderPredRows`, the grammar-absence reading is a mechanism and not just
// a symptom. Gated on T2 (his decomposition reproducing): scoring this against a decomposition that
// did not reproduce is scoring an A/B that did not happen — his own 462 §6b.
const rpCommits = (() => {
  try {
    return git(['log', '--reverse', '--format=%H', '-S', 'export function renderPredRows', '--', 'docs/research/lib/verdict.mjs'])
      .trim().split('\n').filter((x) => x.length === 40);
  } catch { return []; }
})();
const rpCommit = rpCommits[0] ?? null;
let addedAfter = null;
let addedBefore = null;
let unknownAdd = null;
if (rpCommit !== null && residue.length > 0) {
  addedAfter = 0; addedBefore = 0; unknownAdd = 0;
  for (const p of residue) {
    const add = (() => {
      try {
        return git(['log', '--diff-filter=A', '--format=%H', '-1', '--', p]).trim();
      } catch { return ''; }
    })();
    if (add.length !== 40) { unknownAdd += 1; continue; }
    let isDesc = false;
    try {
      git(['merge-base', '--is-ancestor', rpCommit, add]);
      isDesc = true;
    } catch { isDesc = false; }
    if (isDesc) addedAfter += 1; else addedBefore += 1;
  }
}
say(`P1  renderPredRows introduced at ${rpCommit === null ? 'NOT FOUND' : rpCommit.slice(0, 8)} `
  + `(${rpCommits.length} touching commit(s)); residue added before it: ${addedBefore}, after: ${addedAfter}, `
  + `add-commit unknown: ${unknownAdd}`);
pred('P1', decompositionHolds !== true ? null
  : measured(rpCommit === null || addedBefore === null ? null : { rpCommit },
    () => addedAfter === 0 && unknownAdd === 0 && addedBefore === residue.length),
`every residue member predates renderPredRows: before ${addedBefore} / after ${addedAfter} / unknown `
  + `${unknownAdd} of ${residue.length}${decompositionHolds === true ? '' : ' — OPEN: T2 did not reproduce, so this A/B did not happen'}`);

say('');
say(renderTail({ legs, preds }));
