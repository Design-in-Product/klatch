#!/usr/bin/env node
/**
 * grade-the-round-population.mjs — Unit 464-T2-population, 2026-10-28, Daedalus
 *
 * THE QUESTION. Theseus's 10/28 WORK memo §4: "Both our `consecutive` figures count
 * `roundNNN-instruments/` directories, and the track has moved to `unit-*` directories."
 * He framed it as round 467 having no dir. Reading the tree it is stronger: the dir
 * population looks TERMINATED. `round464-instruments` is the last round dir and five
 * `unit-*` dirs follow it.
 *
 * WHY THAT IS WORSE THAN AN UNDERCOUNT. `consecutive = count(dirs > last)`. If no new round
 * dir is ever created, that expression is a constant in time. My own standing cell
 * `round464-instruments/grade-the-stop-condition.mjs` publishes `last=464` (= maxDir) under
 * the dir key, so its `consecutive` is 0 and its T2 leg — `consecutive < N_PROPOSED` —
 * is green unconditionally and FOREVER. The cell whose figure this seat has quoted in
 * `COORDINATION.md` every fire cannot report that the stop condition fired. That is not a
 * stale number; it is a guard that cannot fire, and it is mine.
 *
 * Its own line 215 states the assumption that died: "Every round that EXISTS as a
 * directory, so 'consecutive rounds' counts real rounds."
 *
 * DESIGN NOTES, each earned by a prior defect of this seat's:
 *
 *  1. GATE legs are separate from PREDICTION legs. A gate leg refuses as RED; it is the one
 *     site where a refusal must NOT be softened into "unmeasured", because that is what
 *     makes an instrument stop reporting.
 *  2. The cross-check (`G2`) DRIVES Theseus's cell as a child process and parses its
 *     recording. It does not re-type his reader. A hand-typed copy of another seat's key
 *     has disagreed with its author on this project before.
 *  3. Every refusal is `null`, never a numeric sentinel. A `0` fallback would make the
 *     freeze legs green for the wrong reason — the exact shape being graded here.
 *  4. The freeze legs read a LIST OF CREATION ROWS passed as a parameter, so a cripple can
 *     point at them. A leg you cannot aim a counterfactual at cannot be graded for vacuity.
 *  5. Clocks and revs are pinned absolutely. `REV_PRIOR` is a literal, not `HEAD~n`.
 *  6. The exit status and the printed `/N` token are derived from ONE value. A cell that
 *     prints `VERDICT/1 RED` and exits 0 has been found on this track twice.
 *  7. The cripple self-check gates on `!== true`. A printed self-test that gates nothing
 *     has shipped here before; and each cripple name must occur more than once in this
 *     file, so a declared-but-unread cripple cannot make every crippled control clean.
 */
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  DENIAL_RE as LIB_DENIAL_RE, LEGACY_DENIAL_RE, KEY_CASES, ALT_SPELLINGS,
  attestedRounds as libAttestedRounds, selfTest as libSelfTest,
} from '../lib/attested-rounds.mjs';

const SELF = fileURLToPath(import.meta.url);
const UNIT = dirname(SELF);
const REPO = dirname(dirname(dirname(UNIT)));
const CRIPPLE = process.env.CRIPPLE ?? null;

// Pinned absolutely (design note 5). REV_PRIOR is the parent of 6190a0dd ("round467: re-key
// probe-round307 C4 ..."), so round 467 lands strictly inside the PRIOR→NOW span.
const REV_PRIOR = '8fe017b4';
const LAST_PRODUCT_ROUND = 292;
const HIS_CELL = 'docs/research/unit-464t2-surface-2026-10-28/recon-run-length-and-cure.mjs';
const STANDING_CELL = 'docs/research/round464-instruments/grade-the-stop-condition.mjs';

// REPAIR 2026-10-28, found by the `fake-new-round-dir` cripple (drive4, pre-repair).
// F1 used to ask "was any round dir created after the HIGHEST round dir". That cannot fire:
// a new round dir becomes the reference point instead of reddening the leg — the synthetic
// became M4 and M5 stayed 0. The termination instant is now a PINNED LITERAL: the creation
// of `round464-instruments` (725f97ee, Theseus, 2026-10-27T10:52:54-07:00). Keyed on a fixed
// instant, a round dir created after it reddens F1, which is the whole point of the leg.
const TERMINATION_INSTANT = '2026-10-27T17:52:54.000Z';

const SUBJECT_ROUND_RE = /\bround\s*(\d+)\b/i;
// A subject that DENIES a round is not an attestation of it. `no Round 465` appeared in two
// commit subjects (mine and Theseus's) and his union key credited 465 off them.
//
// CURE 2026-10-29 (Theseus's 10-28 §2, taken). The as-filed spelling was
// `/\bno\s+round\s*(\d+)\b/i`, which reads
//
//     round467: re-key probe-round307 C4 — there is no round467-instruments directory in the tree
//
// as a denial of round **467** — the highest attested round, and the single member whose existence
// carries this unit's own termination finding. `\b` after the digits cannot separate a denial of
// round N from a statement that an artifact of round N is absent, because `7` → `-` is a word
// boundary. Pre-registered by him as a RED before his grader existed.
//
// The key now comes from `docs/research/lib/attested-rounds.mjs` rather than being spelled here, so
// that the live site and the counterfactual arm are the same object as the one the standing cell
// uses. The as-filed spelling is kept as the `legacy-denial-key` cripple, imported rather than
// re-typed: a cripple that re-types what it is crippling can drift from what actually shipped.
const DENIAL_RE = CRIPPLE === 'legacy-denial-key' ? LEGACY_DENIAL_RE : LIB_DENIAL_RE;

function git(args) {
  const r = spawnSync('git', ['-C', REPO, ...args], { stdio: 'pipe', encoding: 'utf8' });
  if (r.status !== 0) return null; // design note 3: refuse with null
  return r.stdout;
}

const REV_NOW = (git(['rev-parse', 'HEAD']) ?? '').trim() || null;

// ---------------------------------------------------------------------------
// Population readers. Both take the rev, so the two-point growth test (F4) runs the SAME
// code at both revs rather than one reader now and a recollection of then.
// ---------------------------------------------------------------------------
function dirPopulation(rev) {
  const tree = git(['ls-tree', '-r', '--name-only', rev]);
  if (tree === null) return null;
  const dirs = new Set();
  for (const p of tree.split('\n')) {
    const m = /^docs\/research\/round(\d+)-instruments\//.exec(p);
    if (m) dirs.add(Number(m[1]));
  }
  if (CRIPPLE === 'credit-465-a-dir') dirs.add(465);
  return [...dirs].sort((a, b) => a - b);
}

function attestation(rev) {
  const tree = git(['ls-tree', '-r', '--name-only', rev]);
  const subjects = git(['log', '--format=%H\u0001%s', rev]);
  if (tree === null || subjects === null) return null;

  const dirs = new Set();
  const tests = new Set();
  const otherDocs = new Set();
  for (const p of tree.split('\n')) {
    let m = /^docs\/research\/round(\d+)-instruments\//.exec(p);
    if (m) { dirs.add(Number(m[1])); continue; }
    m = /(?:^|\/)round(\d+)[^/]*\.test\.tsx?$/.exec(p);
    if (m) { tests.add(Number(m[1])); continue; }
    m = /^docs\/research\/[^/]*round(\d+)/.exec(p);
    if (m) otherDocs.add(Number(m[1]));
  }
  if (CRIPPLE === 'credit-465-a-dir') dirs.add(465);

  const subjectRounds = new Set();
  const deniedRounds = new Set();
  const subjectRows = [];
  for (const line of subjects.split('\n').filter(Boolean)) {
    const [hash, subject = ''] = line.split('\u0001');
    const dm = DENIAL_RE.exec(subject);
    const sm = SUBJECT_ROUND_RE.exec(subject);
    if (sm) subjectRounds.add(Number(sm[1]));
    if (dm) deniedRounds.add(Number(dm[1]));
    subjectRows.push({ hash, subject, round: sm ? Number(sm[1]) : null, denies: dm ? Number(dm[1]) : null });
  }

  const nonSubject = new Set([...dirs, ...tests, ...otherDocs]);
  const raw = new Set([...nonSubject, ...subjectRounds]);

  // The denial filter removes a round ONLY when every attestation of it is a denial — i.e.
  // it is credited by no non-subject source and by no subject that is not a denial.
  const affirmedBySubject = new Set();
  for (const r of subjectRows) {
    if (r.round !== null && r.denies !== r.round) affirmedBySubject.add(r.round);
  }
  const filtered = new Set(
    [...raw].filter((n) => nonSubject.has(n) || affirmedBySubject.has(n))
  );
  const removed = [...raw].filter((n) => !filtered.has(n)).sort((a, b) => a - b);

  if (CRIPPLE === 'dir-key-only') {
    return { raw: new Set(dirs), filtered: new Set(dirs), removed: [], nonSubject, subjectRounds, deniedRounds, dirs };
  }
  if (CRIPPLE === 'no-denial-filter') {
    return { raw, filtered: new Set(raw), removed: [], nonSubject, subjectRounds, deniedRounds, dirs };
  }
  return { raw, filtered, removed, nonSubject, subjectRounds, deniedRounds, dirs };
}

// Creation rows for the freeze legs, passed as a parameter (design note 4).
function creationRows() {
  const rows = [];
  const raw = git([
    'log', '--diff-filter=A', '--format=%H\u0001%aI\u0001%s', '--name-only', '--reverse', REV_NOW ?? 'HEAD',
    '--', 'docs/research/',
  ]);
  if (raw === null) return null;
  let cur = null;
  const seenRoundDir = new Set();
  const seenUnitDir = new Set();
  for (const line of raw.split('\n')) {
    if (line.includes('\u0001')) {
      const [hash, date, subject] = line.split('\u0001');
      cur = { hash, date, subject };
      continue;
    }
    if (!line.trim() || !cur) continue;
    let m = /^docs\/research\/(round(\d+)-instruments)\//.exec(line.trim());
    if (m && !seenRoundDir.has(m[1])) {
      seenRoundDir.add(m[1]);
      rows.push({ kind: 'round-dir', name: m[1], round: Number(m[2]), date: cur.date, hash: cur.hash });
      continue;
    }
    m = /^docs\/research\/(unit-[^/]+)\//.exec(line.trim());
    if (m && !seenUnitDir.has(m[1])) {
      seenUnitDir.add(m[1]);
      rows.push({ kind: 'unit-dir', name: m[1], round: null, date: cur.date, hash: cur.hash });
    }
  }
  if (CRIPPLE === 'fake-new-round-dir') {
    const maxRound = Math.max(...rows.filter((r) => r.kind === 'round-dir').map((r) => r.round));
    rows.push({ kind: 'round-dir', name: `round${maxRound + 1}-instruments`, round: maxRound + 1, date: new Date().toISOString(), hash: 'synthetic' });
  }
  return rows;
}

// ---------------------------------------------------------------------------
// Drive Theseus's cell for the cross-check (design note 2).
// ---------------------------------------------------------------------------
// Children are spawned with CRIPPLE stripped from the environment. Neither child reads it
// today (the standing cell takes its cripple from `process.argv[2]`), but a drive that
// leaks this cell's cripple into a cell being measured would make the measurement a
// function of the cripple twice over.
function childEnv() {
  const env = { ...process.env };
  delete env.CRIPPLE;
  return env;
}

function hisFloorFigure() {
  const r = spawnSync('node', [join(REPO, HIS_CELL)], { stdio: 'pipe', encoding: 'utf8', cwd: REPO, env: childEnv() });
  if (typeof r.stdout !== 'string' || r.stdout === '') return null;
  const wanted = CRIPPLE === 'xcheck-wrong-figure'
    ? /attested-union figure \(this recon\)\s*:\s*(\d+)/
    : /dir-only figure published as the floor\s*:\s*(\d+)/;
  const m = wanted.exec(r.stdout);
  return m ? Number(m[1]) : null;
}

// REPAIR 2026-10-28. F3 used to assert `count(dirs > maxDir) === 0`, which is a TAUTOLOGY:
// `dirsNow` is sorted ascending and `maxDir` is its last element, so that count is 0 for
// every possible input. The leg asserted nothing, and the claim in its own `why` string —
// that the standing cell publishes `last=maxDir`, hence `consecutive=0` — was never tested.
// It is tested now, by driving the standing cell and reading the figure it actually prints.
function standingDirKeyFigures() {
  const r = spawnSync('node', [join(REPO, STANDING_CELL)], { stdio: 'pipe', encoding: 'utf8', cwd: REPO, env: childEnv() });
  if (typeof r.stdout !== 'string' || r.stdout === '') return null;
  const m = /dir key\s*:.*?last=(\d+)\s+consecutive=(\d+)/.exec(r.stdout);
  if (!m) return null;
  const figures = { last: Number(m[1]), consecutive: Number(m[2]) };
  if (CRIPPLE === 'standing-last-mismatch') figures.last -= 1;
  return figures;
}

// ---------------------------------------------------------------------------
// Measure.
// ---------------------------------------------------------------------------
console.log('=== GRADE/464-T2-population — is the round population the condition counts still alive? ===');
console.log(`REV_NOW   ${REV_NOW ?? 'UNRESOLVED'}`);
console.log(`REV_PRIOR ${REV_PRIOR} (pinned literal)`);
console.log(`CLOCK     ${new Date().toISOString()}`);
console.log(`CRIPPLE   ${CRIPPLE ?? 'none'}`);
console.log('');

const dirsNow = REV_NOW === null ? null : dirPopulation(REV_NOW);
const dirsPrior = dirPopulation(REV_PRIOR);
const attNow = REV_NOW === null ? null : attestation(REV_NOW);
const attPrior = attestation(REV_PRIOR);
const rows = creationRows();

const above = (arr, n) => (arr === null ? null : arr.filter((x) => x > n).length);
const dirsAbove292 = above(dirsNow, LAST_PRODUCT_ROUND);
const dirsAbove292Prior = above(dirsPrior, LAST_PRODUCT_ROUND);
const rawAbove292 = attNow === null ? null : [...attNow.raw].filter((n) => n > LAST_PRODUCT_ROUND).length;
const rawAbove292Prior = attPrior === null ? null : [...attPrior.raw].filter((n) => n > LAST_PRODUCT_ROUND).length;
const filteredAbove292 = attNow === null ? null : [...attNow.filtered].filter((n) => n > LAST_PRODUCT_ROUND).length;
const maxDir = dirsNow === null || dirsNow.length === 0 ? null : dirsNow[dirsNow.length - 1];
const maxAttested = attNow === null ? null : Math.max(...attNow.filtered);

const roundDirRows = rows === null ? null : rows.filter((r) => r.kind === 'round-dir');
const unitDirRows = rows === null ? null : rows.filter((r) => r.kind === 'unit-dir');
const maxDirRow = roundDirRows === null || roundDirRows.length === 0
  ? null
  : roundDirRows.reduce((a, b) => (b.round > a.round ? b : a));
// Keyed on the PINNED instant, not on the max row (see REPAIR note at TERMINATION_INSTANT).
const dirsCreatedAfterMaxDir = roundDirRows === null
  ? null
  : roundDirRows.filter((r) => Date.parse(r.date) > Date.parse(TERMINATION_INSTANT)).length;
const unitsCreatedAfterMaxDir = unitDirRows === null
  ? null
  : unitDirRows.filter((r) => Date.parse(r.date) > Date.parse(TERMINATION_INSTANT)).length;
const standing = standingDirKeyFigures();

console.log('--- [MEAS] populations');
console.log(`  M1 dir population            : n=${dirsNow === null ? 'REFUSED' : dirsNow.length} max=${maxDir ?? 'REFUSED'} above ${LAST_PRODUCT_ROUND}: ${dirsAbove292 ?? 'REFUSED'}`);
console.log(`  M2 attested raw              : above ${LAST_PRODUCT_ROUND}: ${rawAbove292 ?? 'REFUSED'}  (prior rev: ${rawAbove292Prior ?? 'REFUSED'})`);
console.log(`  M3 attested denial-filtered  : above ${LAST_PRODUCT_ROUND}: ${filteredAbove292 ?? 'REFUSED'} max=${maxAttested ?? 'REFUSED'} removed=[${attNow === null ? 'REFUSED' : attNow.removed.join(',')}]`);
console.log(`  M4 highest round dir         : ${maxDirRow === null ? 'REFUSED' : `${maxDirRow.name} created ${maxDirRow.date.slice(0, 16)} by ${maxDirRow.hash.slice(0, 8)}`}`);
console.log(`  M5 round dirs after PIN      : ${dirsCreatedAfterMaxDir ?? 'REFUSED'}  (pin ${TERMINATION_INSTANT})`);
console.log(`  M6 unit-* dirs after PIN     : ${unitsCreatedAfterMaxDir ?? 'REFUSED'}${unitDirRows === null ? '' : ` of ${unitDirRows.length} total`}`);
if (unitDirRows !== null) {
  for (const u of unitDirRows.filter((r) => Date.parse(r.date) > Date.parse(TERMINATION_INSTANT))) {
    console.log(`       after: ${u.name} created ${u.date.slice(0, 16)}`);
  }
}
console.log(`  M8 standing cell, dir key    : ${standing === null ? 'REFUSED' : `last=${standing.last} consecutive=${standing.consecutive}`}`);
console.log(`  M7 dir figure PRIOR vs NOW   : ${dirsAbove292Prior ?? 'REFUSED'} -> ${dirsAbove292 ?? 'REFUSED'}`);
console.log('');

// ---------------------------------------------------------------------------
// Legs.
// ---------------------------------------------------------------------------
const legs = [];
function leg(id, kind, value, why, detail) {
  legs.push({ id, kind, value, why, detail });
}

// GATE — a refusal here stays RED (design note 1).
leg('G1', 'GATE', dirsNow !== null && dirsPrior !== null && attNow !== null && attPrior !== null && dirsNow.length > 0 && rows !== null,
  'every reader resolved at both revs and the dir population is non-empty',
  `dirsNow=${dirsNow === null ? 'null' : dirsNow.length} dirsPrior=${dirsPrior === null ? 'null' : dirsPrior.length} attNow=${attNow === null ? 'null' : 'ok'} rows=${rows === null ? 'null' : rows.length}`);

const hisFloor = hisFloorFigure();
leg('G2', 'GATE', hisFloor !== null && hisFloor === dirsAbove292,
  "cross-check: Theseus's own cell, driven as a child, reports the same dir floor I do",
  `his=${hisFloor ?? 'REFUSED'} mine=${dirsAbove292 ?? 'REFUSED'}`);

// FREEZE — the finding.
leg('F1', 'FREEZE', dirsCreatedAfterMaxDir === 0,
  'the dir population is TERMINATED: no round dir was created after the pinned instant',
  `roundDirsAfterPin=${dirsCreatedAfterMaxDir ?? 'REFUSED'} pin=${TERMINATION_INSTANT}`);

leg('F2', 'FREEZE', unitsCreatedAfterMaxDir !== null && unitsCreatedAfterMaxDir >= 1,
  'the track kept filing after that instant — into unit-* dirs, which the dir key cannot see',
  `unitDirsAfterPin=${unitsCreatedAfterMaxDir ?? 'REFUSED'}`);

// RE-AIMED 2026-10-29, and the reason is the whole point of writing it down.
//
// As filed on 10-28, F3 asserted the DEFECT: `standing.last === maxDir && standing.consecutive === 0`
// — "the standing cell is saturated, so its T2 leg is green for every future round." That was the
// finding, and it was true. Then this fire CURED it (the population re-key, design note 10 in
// `round464-instruments/grade-the-stop-condition.mjs`), and F3 went RED on its own cure: the first
// drive after the re-key published `RED legs=17 red=[F3]` with every figure it reports correct.
//
// A leg whose assertion IS the defect publishes a false RED the moment the defect is fixed, and the
// RED is indistinguishable from a regression. So F3 now asserts the PROPERTY in the direction where
// a RED is a problem — the standing cell is NOT saturated — and the 10-28 reading is kept as a
// pinned literal in the detail rather than deleted, because the figure that moved is the evidence.
//
// `standing.consecutive === 0` alone would not do: 0 is also the honest answer when the track has
// just cured a gated surface. What makes it saturation is `last === maxDir` — a last-round AT the
// top of the counting population, so nothing can ever be counted above it.
leg('F3', 'FREEZE',
  standing !== null && maxDir !== null && !(standing.last >= maxDir && standing.consecutive === 0),
  'the standing cell is NO LONGER saturated: it does not publish consecutive=0 at a last-round that '
  + 'sits at the top of its counting population. A RED means the dead dir surface is back and its T2 '
  + 'leg is green for every future round whatever the track does',
  `standing=${standing === null ? 'REFUSED' : `last=${standing.last} consecutive=${standing.consecutive}`}`
  + ` maxDir=${maxDir ?? 'REFUSED'}; saturated=${standing === null || maxDir === null ? 'REFUSED' : standing.last >= maxDir && standing.consecutive === 0}`
  + '; 10-28 reading (pinned literal, pre-re-key): last=464 consecutive=0 maxDir=464 saturated=true');

leg('F4', 'FREEZE',
  dirsAbove292 !== null && dirsAbove292Prior !== null && rawAbove292 !== null && rawAbove292Prior !== null
    && dirsAbove292 === dirsAbove292Prior && rawAbove292 > rawAbove292Prior,
  'two-point growth test: a round landed between PRIOR and NOW; the dir measure did not move and the attested measure did',
  `dir ${dirsAbove292Prior ?? 'REFUSED'}->${dirsAbove292 ?? 'REFUSED'} (equal expected), attested ${rawAbove292Prior ?? 'REFUSED'}->${rawAbove292 ?? 'REFUSED'} (increase expected)`);

// DENIAL.
leg('D1', 'DENIAL', attNow !== null && attNow.raw.has(465),
  'the raw subject key credits round 465',
  `raw has 465: ${attNow === null ? 'REFUSED' : attNow.raw.has(465)}`);

leg('D2', 'DENIAL', attNow !== null && !attNow.filtered.has(465),
  'the denial-filtered key does NOT credit round 465',
  `filtered has 465: ${attNow === null ? 'REFUSED' : attNow.filtered.has(465)}`);

leg('D3', 'DENIAL', attNow !== null && !attNow.nonSubject.has(465),
  'round 465 is attested by no non-subject source, so the denial filter is sufficient, not merely necessary',
  `nonSubject has 465: ${attNow === null ? 'REFUSED' : attNow.nonSubject.has(465)}`);

// ---------------------------------------------------------------------------
// D4/D5/D6 — THE SELECTOR'S OTHER HALF (Theseus's 10-28 §2, taken 10-29).
//
// D1/D2/D3 are all keyed on the member **465**. A population-level claim — *the removed set is
// exactly [465]* — graded only by legs about its single known member cannot reach either half of
// what a selector gets wrong. These three grade the false-positive half.
//
// D4 is the known positive, in the real call shape (a whole commit subject, not a fragment).
// D5 is its CONTROL, and it is not decoration: without it, a key that matched nothing at all would
// pass D4. Under `legacy-denial-key` BOTH go to their as-filed answers together, which is how the
// control is known to be live.
// D6 is the recall floor, declared as [MEAS] rather than graded — four denial spellings neither key
// reaches, with 0 instances measured in the corpus. A floor is not a defect, and labelling it one
// would manufacture a finding.
// ---------------------------------------------------------------------------
const fpMatch = DENIAL_RE.exec(KEY_CASES.fpSubject);
const ctlMatch = DENIAL_RE.exec(KEY_CASES.denialSubject);
leg('D4', 'DENIAL', fpMatch === null,
  'the ACTIVE denial key does NOT read "there is no round467-instruments directory" as a denial of '
  + 'round 467 — the one member whose existence carries this unit\'s termination finding',
  `active key ${DENIAL_RE} on the KP subject: ${fpMatch === null ? 'no match' : `DENIES ${fpMatch[1]}`}`);

leg('D5', 'DENIAL', ctlMatch !== null && Number(ctlMatch[1]) === 465,
  'CONTROL: the ACTIVE denial key still matches a GENUINE denial — so D4 is a false positive '
  + 'removed, not a key that stopped matching anything',
  `active key on the control subject: ${ctlMatch === null ? 'NO MATCH (the key is dead)' : `denies ${ctlMatch[1]}`}`);

const altReached = ALT_SPELLINGS.filter((s) => DENIAL_RE.test(s));
console.log(`  M9 recall floor [MEAS]       : the active key reaches ${altReached.length} of ${ALT_SPELLINGS.length} alternate denial spellings (0 instances in corpus — a floor, not a defect)`);

// X1 — the cost of having one reader in a lib and one inline. This cell's own `attestation()` and
// `docs/research/lib/attested-rounds.mjs` compute the same population by two separate pieces of
// code, and the lib is what the standing cell now counts over. A hand-check that they agree is
// worth nothing a week from now, so the agreement is a leg: if the two ever diverge, this reddens
// rather than two cells quietly publishing different populations under the same name.
const libAtt = libAttestedRounds(REPO, REV_NOW ?? 'HEAD', { denialRe: DENIAL_RE });
let libSelfOk = null;
try { libSelfOk = libSelfTest() === true; } catch (e) { libSelfOk = false; }
const mineSorted = attNow === null ? null : [...attNow.filtered].sort((a, b) => a - b);
leg('X1', 'GATE',
  libAtt !== null && mineSorted !== null
    && libAtt.sorted.length === mineSorted.length
    && libAtt.sorted.every((n, i) => n === mineSorted[i])
    && libAtt.removed.join(',') === attNow.removed.join(','),
  "cross-check: the shared reader in docs/research/lib/attested-rounds.mjs and this cell's own "
  + 'inline reader give the same attested population, member for member, under the same key',
  `lib n=${libAtt === null ? 'REFUSED' : libAtt.sorted.length} removed=[${libAtt === null ? 'REFUSED' : libAtt.removed.join(',')}]`
  + ` vs mine n=${mineSorted === null ? 'REFUSED' : mineSorted.length} removed=[${attNow === null ? 'REFUSED' : attNow.removed.join(',')}]`);

leg('X2', 'GATE', libSelfOk === true,
  "the shared reader's own selfTest() returns true (gated on `!== true`, not on truthiness)",
  `libSelfTest=${libSelfOk}`);

// PUBLISH — the pre-registered predictions.
leg('P1', 'PRED', dirsAbove292 === 91, 'PRED-1: dirsAbove292 === 91', `measured ${dirsAbove292 ?? 'REFUSED'}`);
leg('P2', 'PRED', rawAbove292 === 175, 'PRED-2: rawUnionAbove292 === 175', `measured ${rawAbove292 ?? 'REFUSED'}`);
leg('P3', 'PRED',
  filteredAbove292 === 174 && attNow !== null && attNow.removed.length === 1 && attNow.removed[0] === 465,
  'PRED-3: denial-filtered === 174 and the removed set is exactly [465]',
  `measured ${filteredAbove292 ?? 'REFUSED'} removed=[${attNow === null ? 'REFUSED' : attNow.removed.join(',')}]`);

// ---------------------------------------------------------------------------
// Cripple self-check (design note 7). Each declared cripple name must occur MORE THAN ONCE
// in this file: once in the declaration list below and at least once at a site that reads
// it. A name that appears only here is a cripple no code reads, which would make every
// crippled control come back clean.
// ---------------------------------------------------------------------------
const DECLARED = ['no-denial-filter', 'credit-465-a-dir', 'fake-new-round-dir', 'dir-key-only', 'xcheck-wrong-figure', 'standing-last-mismatch', 'legacy-denial-key'];
const selfSource = readFileSync(SELF, 'utf8');
const unread = DECLARED.filter((name) => selfSource.split(name).length - 1 < 2);
const selfCheckOk = unread.length === 0 && (CRIPPLE === null || DECLARED.includes(CRIPPLE));
leg('S1', 'GATE', selfCheckOk,
  'every declared cripple name is read somewhere in this file, and CRIPPLE (if set) is a declared name',
  `unread=[${unread.join(',')}] CRIPPLE=${CRIPPLE ?? 'none'}`);

// ---------------------------------------------------------------------------
// Verdict. One value drives both the printed token and the exit status (design note 6).
// ---------------------------------------------------------------------------
console.log('--- legs');
const red = [];
for (const l of legs) {
  const mark = l.value === true ? 'ok  ' : 'RED ';
  if (l.value !== true) red.push(l.id);
  console.log(`  ${mark} ${l.id.padEnd(3)} [${l.kind.padEnd(6)}] ${l.why}`);
  console.log(`         ${l.detail}`);
}
console.log('');

const code = red.length === 0 ? 0 : 1;
console.log(`VERDICT/${code} ${code === 0 ? 'ok' : 'RED'} legs=${legs.length} red=[${red.join(',')}]`);
process.exit(code);
