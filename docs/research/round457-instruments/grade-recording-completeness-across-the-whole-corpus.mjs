#!/usr/bin/env node
/**
 * ROUND 457 — RECORDING COMPLETENESS ACROSS THE WHOLE COMMITTED CORPUS
 *
 * Why this cell exists
 * ────────────────────
 * Daedalus's Round 456 §5 declared a limit on his drift census and gave it a fire-budget blocker:
 *
 *   > Both [444 and 446] drift as `rows-equal` with a differing `red` list. Equal row id sets and a
 *   > differing `red` set means **legs moved that have no printed row** — the comparison is complete
 *   > only when a recording's row count equals its own `legs=N`, which is the tie `readTail` breaks
 *   > and which this cell does not call.
 *
 * He is right about the tie and right that his cell does not call `readTail`. Two things follow that
 * he did not have the budget to measure, and both are measurable from committed bytes alone — no
 * member needs driving, so the fire-budget blocker he named does not apply to this shape:
 *
 *   1. HOW MANY committed recordings are incomplete in that sense, and how many of them are
 *      baselines his census actually joins against. That is the size of his declared limit.
 *   2. `readTail` gates the LEG row count against `legs=N` and **never gates the PRED row count
 *      against `preds=N`** (lib `verdict.mjs`, `readTail`: `legRows.length !== v.verdict.legs` is
 *      the only count check). So a recording that under-prints its PRED rows is a completeness
 *      defect the tie-breaker he would have called **cannot refuse**. This is Round 441 §1's shape
 *      again, one vocabulary over: a missing row and an absent grammar read the same, and the field
 *      that breaks the tie is read for LEG and not for PRED.
 *
 * Population: every `.out` tracked at REV under `docs/research/`, selected with `ls-tree` at the
 * rev and read with `git show` at the rev — never the worktree, so the population is reproducible
 * from the rev alone. This cell's own recordings are therefore excluded by construction at the rev
 * it is first driven at, and legitimately included at any later rev; the counts below are
 * rev-stamped for exactly that reason and the GATE legs are structural rather than count-pinned.
 *
 * Legs
 * ────
 *   GATE legs (must hold for the figure to mean anything):
 *     C1  population selected from REV with `ls-tree`, and REV is stamped
 *     C2  buckets partition the population — sizes sum to the population, detail rows match
 *     C3  CONTROL, known negative: a recording whose printed LEG rows equal its own `legs=N` must
 *         bucket COMPLETE. Keyed on 455's `drive2.w10-disposition.out`, pre-registered because my
 *         own Round 455 recorded it and my drive1 of his census reproduced it 1-of-1 today.
 *     C4  KP, known positive carrying the LEG-incompleteness property: `round444-instruments/
 *         his-round442-instrument.postcommit.out`. Pre-registered from HIS report, not from my
 *         measurement: his drive2 and my drive1 both name that file as a baseline whose LEG id set
 *         MATCHED 444's HEAD output (it was a join match) while `legs` was among the differing
 *         fields. Equal LEG id set and differing `legs` is only possible if at least one side
 *         prints fewer LEG rows than it declares. This leg asserts the committed side is that side;
 *         if it REFUSES or comes out COMPLETE, the inference was wrong and I want to know.
 *     C5  the PRED-count check is MINE and not the lib's — assert `readTail` does not contain a
 *         PRED-count comparison, read off the lib's source, so that a cure to the lib reddens this
 *         leg instead of leaving a stale sentence behind.
 *     C6  CONTROL for C5's slicer: the same slice must FIND the LEG-count comparison it is keyed
 *         to miss for PRED. A source key that finds nothing proves nothing.
 *
 *   PREDICTION legs (written before the drive; they do not gate the figure):
 *     Q1  at least one committed recording fails `readTail` on a count/grammar disagreement.
 *         I expect LANDED — C4's inference says so. Stated separately from C4 so that C4 grades the
 *         named exemplar and Q1 grades the population.
 *     Q2  at least one committed recording has `predRows.length !== preds` — the class `readTail`
 *         cannot refuse. I do not know the answer. If REFUTED, the lib gap is latent and not live,
 *         and that is the honest result.
 */

import { execFileSync } from 'node:child_process';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readVerdict, readRows, readTail, renderTail } from '../lib/verdict.mjs';

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

const REV = git(['rev-parse', 'HEAD']).trim();
say('═══ ROUND 457 — RECORDING COMPLETENESS ACROSS THE WHOLE COMMITTED CORPUS ═══');
say(`rev ${REV}`);
say('');

// ── C1 — the population, from the rev ───────────────────────────────────────────────────────────
const tracked = git(['ls-tree', '-r', REV, '--name-only']).trim().split('\n');
const corpus = tracked
  .filter((p) => p.startsWith('docs/research/') && p.endsWith('.out'))
  .sort();
leg('C1', corpus.length > 0 && REV.length === 40,
  `population ${corpus.length} committed .out recording(s) selected with ls-tree at ${REV}`);

// ── the measurement ─────────────────────────────────────────────────────────────────────────────
// Buckets are positively keyed, each from a condition of its own, and the last one is reached by a
// named condition rather than by fall-through — a terminal bucket reached by else absorbs every
// blindness upstream of it.
const BUCKETS = ['COMPLETE', 'LEG_UNDER_PRINTED', 'LEG_GRAMMAR_ABSENT', 'PRED_COUNT_MISMATCH',
  'ROWS_UNREADABLE', 'NO_VERDICT', 'UNMODELLED'];
const buckets = Object.fromEntries(BUCKETS.map((b) => [b, []]));
const rows = [];

for (const p of corpus) {
  const text = git(['show', `${REV}:${p}`]);
  const v = readVerdict(text);
  const r = readRows(text);
  const t = readTail(text);

  // One classification, one push. Every branch assigns `bucket` positively — including the last,
  // which is keyed on `legOk && predOk` rather than reached by `else`, so that a recording no
  // condition claims lands in UNMODELLED and C2 reddens instead of being absorbed as COMPLETE.
  let bucket = 'UNMODELLED';
  let note = 'no condition claimed this recording';
  let legRows = null;
  let predRows = null;
  if (v.ok !== true) {
    bucket = 'NO_VERDICT';
    note = `verdict ${v.refusal}`;
  } else if (r.ok !== true) {
    bucket = 'ROWS_UNREADABLE';
    note = `rows ${r.refusal}`;
  } else {
    legRows = r.rows.filter((x) => x.kind === 'LEG').length;
    predRows = r.rows.filter((x) => x.kind === 'PRED').length;
    const legOk = legRows === v.verdict.legs;
    const predOk = predRows === v.verdict.preds;
    if (legRows === 0 && v.verdict.legs > 0) {
      bucket = 'LEG_GRAMMAR_ABSENT';
      note = `0 LEG rows vs legs=${v.verdict.legs}`;
    } else if (!legOk) {
      bucket = 'LEG_UNDER_PRINTED';
      note = `${legRows} LEG row(s) vs legs=${v.verdict.legs}`;
    } else if (legOk && !predOk) {
      // The class `readTail` cannot refuse: the LEG count agrees, so `readTail` returns ok, while
      // the PRED rows do not account for the recording's own `preds=N`.
      bucket = 'PRED_COUNT_MISMATCH';
      note = `${predRows} PRED row(s) vs preds=${v.verdict.preds}; readTail says `
        + `${t.ok === true ? 'ok' : t.refusal}`;
    } else if (legOk && predOk) {
      bucket = 'COMPLETE';
      note = `LEG ${legRows}=${v.verdict.legs}, PRED ${predRows}=${v.verdict.preds}`;
    }
  }
  rows.push({
    p, bucket, note, legRows, predRows,
    declLegs: v.ok === true ? v.verdict.legs : null,
    declPreds: v.ok === true ? v.verdict.preds : null,
    tailOk: t.ok === true, tailRefusal: t.ok === true ? null : t.refusal,
  });
  buckets[bucket].push(p);
}

const sizes = Object.fromEntries(BUCKETS.map((b) => [b, buckets[b].length]));
const sum = BUCKETS.reduce((n, b) => n + sizes[b], 0);

say(`BUCKETS  ${JSON.stringify(sizes)}  sum=${sum}  corpus=${corpus.length}`);
const incomplete = [...buckets.LEG_UNDER_PRINTED, ...buckets.LEG_GRAMMAR_ABSENT,
  ...buckets.PRED_COUNT_MISMATCH];
say(`FIGURE   ${incomplete.length} of ${corpus.length} committed recording(s) cannot support `
  + `complete per-row attribution; of those, ${buckets.PRED_COUNT_MISMATCH.length} are in the class `
  + `readTail cannot refuse`);
say('');

leg('C2', sum === corpus.length && rows.length === corpus.length && sizes.UNMODELLED === 0,
  `buckets sum to ${sum}; corpus ${corpus.length}; detail rows ${rows.length}; `
  + `UNMODELLED ${sizes.UNMODELLED} (a non-zero UNMODELLED means a recording no bucket claims)`);

// ── C3 — CONTROL, known negative ────────────────────────────────────────────────────────────────
const CONTROL = 'docs/research/round455-instruments/drive2.w10-disposition.out';
const controlRow = rows.find((x) => x.p === CONTROL) ?? null;
leg('C3', controlRow !== null && controlRow.bucket === 'COMPLETE',
  `CONTROL ${relative('docs/research', CONTROL)} → `
  + `${controlRow === null ? 'ABSENT FROM POPULATION' : `${controlRow.bucket} (${controlRow.note})`} `
  + `— expect COMPLETE`);

// ── C4 — KP, known positive, pre-registered from HIS report ─────────────────────────────────────
const KP = 'docs/research/round444-instruments/his-round442-instrument.postcommit.out';
const kpRow = rows.find((x) => x.p === KP) ?? null;
const kpIncomplete = kpRow !== null
  && (kpRow.bucket === 'LEG_UNDER_PRINTED' || kpRow.bucket === 'LEG_GRAMMAR_ABSENT');
leg('C4', kpIncomplete,
  `KP ${relative('docs/research', KP)} → `
  + `${kpRow === null ? 'ABSENT FROM POPULATION' : `${kpRow.bucket} (${kpRow.note})`} `
  + `— expect LEG_UNDER_PRINTED or LEG_GRAMMAR_ABSENT, inferred from his drive2 naming it a `
  + `join match on the LEG id set with 'legs' among the differing fields`);

// ── C5 / C6 — the lib gap, read off the lib's own source ────────────────────────────────────────
// Slice `readTail`'s body structurally rather than grepping the whole file: a file-wide grep for a
// PRED-count comparison would hit `readVerdict`'s own `refuted.length + prefused.length > preds`
// and answer the wrong question. Bisect on the declaration and the next top-level `export`.
const libSrc = git(['show', `${REV}:docs/research/lib/verdict.mjs`]);
const ANCHOR = 'export function readTail(text) {';
const startIdx = libSrc.indexOf(ANCHOR);
const afterStart = startIdx < 0 ? -1 : startIdx + ANCHOR.length;
const nextExport = afterStart < 0 ? -1 : libSrc.indexOf('\nexport ', afterStart);
const sliceOk = startIdx >= 0
  && libSrc.indexOf(ANCHOR, afterStart) === -1   // the anchor occurs exactly once
  && nextExport > startIdx;
const tailSrc = sliceOk ? libSrc.slice(startIdx, nextExport) : '';

// Keyed on the comparison SHAPE against the declared count, for each vocabulary in turn. Both keys
// are the same shape with one identifier changed, so C6 grades C5's aim rather than its luck.
// The PRED key is deliberately the BROADER of the two: not "does it compare a PRED row count",
// but "does it mention `preds` at all". A narrow key keyed on one spelling of the comparison would
// answer false for a readTail that gated the count some other way, and I would publish a gap that
// is not there. Broad in the direction that makes the leg harder to pass.
const legCountCheck = /legRows\.length\s*!==\s*v\.verdict\.legs/.test(tailSrc);
const predCountCheck = /\bpreds\b/.test(tailSrc);

leg('C6', sliceOk && legCountCheck,
  `CONTROL for the slicer: readTail slice ${sliceOk ? `${tailSrc.length} bytes` : 'REFUSED'}; `
  + `the LEG-count comparison the same key shape looks for is `
  + `${legCountCheck ? 'FOUND' : 'ABSENT — the key finds nothing and so proves nothing about PRED'}`);

leg('C5', sliceOk && legCountCheck && predCountCheck === false,
  `readTail gates LEG count (${legCountCheck}) and references verdict.preds (${predCountCheck}) — `
  + `expect false: a PRED row-count disagreement is unrepresentable in readTail's refusal set, so `
  + `the tie-breaker his §5 would have called cannot see the PRED half of the same defect`);

// ── the baselines his census actually joins against ─────────────────────────────────────────────
// The sub-figure that bears directly on his §5: incompleteness anywhere in the corpus is a lib
// observation, but incompleteness in a directory his census joins in is a limit on HIS figure.
const CENSUS_DIRS = [442, 443, 444, 446, 448, 449, 450, 451, 452, 455]
  .map((n) => `docs/research/round${n}-instruments`);
const inCensus = rows.filter((x) => CENSUS_DIRS.includes(dirname(x.p)));
const inCensusBad = inCensus.filter((x) => x.bucket !== 'COMPLETE');
say(`SUBFIGURE  of ${inCensus.length} recording(s) in the 10 round directories his census joins in, `
  + `${inCensusBad.length} are not COMPLETE`);
for (const x of inCensusBad) {
  say(`   ${x.bucket.padEnd(20)} ${relative('docs/research', x.p)} — ${x.note}`);
}
say('');

// ── predictions ─────────────────────────────────────────────────────────────────────────────────
pred('Q1', buckets.LEG_UNDER_PRINTED.length + buckets.LEG_GRAMMAR_ABSENT.length > 0,
  `recordings failing readTail on a LEG count/grammar disagreement: `
  + `${buckets.LEG_UNDER_PRINTED.length + buckets.LEG_GRAMMAR_ABSENT.length}`);
pred('Q2', buckets.PRED_COUNT_MISMATCH.length > 0,
  `recordings in the class readTail cannot refuse (PRED rows vs preds=N): `
  + `${buckets.PRED_COUNT_MISMATCH.length}`
  + `${buckets.PRED_COUNT_MISMATCH.length ? ` — ${buckets.PRED_COUNT_MISMATCH.map((p) => relative('docs/research', p)).join(', ')}` : ''}`);

// ── per-bucket detail ───────────────────────────────────────────────────────────────────────────
for (const b of BUCKETS) {
  if (b === 'COMPLETE' || sizes[b] === 0) continue;
  say(`${b}  ${sizes[b]}:`);
  for (const p of buckets[b]) {
    const x = rows.find((y) => y.p === p);
    say(`   ${relative('docs/research', p)} — ${x.note}`);
  }
  say('');
}

// ── the verdict, through the shared emitter ─────────────────────────────────────────────────────
// `renderTail` returns ONE string, not `{text, exitCode}` and not an array of lines.
say(renderTail({ legs, preds }));
const red = legs.filter((l) => l.ok === false).length;
const refusedLegs = legs.filter((l) => l.ok === null).length;
process.exit(red + refusedLegs > 0 ? 1 : 0);
