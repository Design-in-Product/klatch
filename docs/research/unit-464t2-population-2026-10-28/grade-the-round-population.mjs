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

const SELF = fileURLToPath(import.meta.url);
const UNIT = dirname(SELF);
const REPO = dirname(dirname(dirname(UNIT)));
const CRIPPLE = process.env.CRIPPLE ?? null;

// Pinned absolutely (design note 5). REV_PRIOR is the parent of 6190a0dd ("round467: re-key
// probe-round307 C4 ..."), so round 467 lands strictly inside the PRIOR→NOW span.
const REV_PRIOR = '8fe017b4';
const LAST_PRODUCT_ROUND = 292;
const HIS_CELL = 'docs/research/unit-464t2-surface-2026-10-28/recon-run-length-and-cure.mjs';

const SUBJECT_ROUND_RE = /\bround\s*(\d+)\b/i;
// A subject that DENIES a round is not an attestation of it. `no Round 465` appeared in two
// commit subjects (mine and Theseus's) and his union key credited 465 off them.
const DENIAL_RE = /\bno\s+round\s*(\d+)\b/i;

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
function hisFloorFigure() {
  const r = spawnSync('node', [join(REPO, HIS_CELL)], { stdio: 'pipe', encoding: 'utf8', cwd: REPO });
  if (typeof r.stdout !== 'string' || r.stdout === '') return null;
  const wanted = CRIPPLE === 'xcheck-wrong-figure'
    ? /attested-union figure \(this recon\)\s*:\s*(\d+)/
    : /dir-only figure published as the floor\s*:\s*(\d+)/;
  const m = wanted.exec(r.stdout);
  return m ? Number(m[1]) : null;
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
const dirsCreatedAfterMaxDir = maxDirRow === null || roundDirRows === null
  ? null
  : roundDirRows.filter((r) => r.date > maxDirRow.date).length;
const unitsCreatedAfterMaxDir = maxDirRow === null || unitDirRows === null
  ? null
  : unitDirRows.filter((r) => r.date > maxDirRow.date).length;

console.log('--- [MEAS] populations');
console.log(`  M1 dir population            : n=${dirsNow === null ? 'REFUSED' : dirsNow.length} max=${maxDir ?? 'REFUSED'} above ${LAST_PRODUCT_ROUND}: ${dirsAbove292 ?? 'REFUSED'}`);
console.log(`  M2 attested raw              : above ${LAST_PRODUCT_ROUND}: ${rawAbove292 ?? 'REFUSED'}  (prior rev: ${rawAbove292Prior ?? 'REFUSED'})`);
console.log(`  M3 attested denial-filtered  : above ${LAST_PRODUCT_ROUND}: ${filteredAbove292 ?? 'REFUSED'} max=${maxAttested ?? 'REFUSED'} removed=[${attNow === null ? 'REFUSED' : attNow.removed.join(',')}]`);
console.log(`  M4 highest round dir         : ${maxDirRow === null ? 'REFUSED' : `${maxDirRow.name} created ${maxDirRow.date.slice(0, 16)} by ${maxDirRow.hash.slice(0, 8)}`}`);
console.log(`  M5 dirs created after M4     : ${dirsCreatedAfterMaxDir ?? 'REFUSED'}`);
console.log(`  M6 unit-* dirs after M4      : ${unitsCreatedAfterMaxDir ?? 'REFUSED'}${unitDirRows === null ? '' : ` of ${unitDirRows.length} total`}`);
if (unitDirRows !== null && maxDirRow !== null) {
  for (const u of unitDirRows.filter((r) => r.date > maxDirRow.date)) {
    console.log(`       after: ${u.name} created ${u.date.slice(0, 16)}`);
  }
}
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
  'the dir population is TERMINATED: no round dir was created after the highest one',
  `dirsCreatedAfterMaxDir=${dirsCreatedAfterMaxDir ?? 'REFUSED'}`);

leg('F2', 'FREEZE', unitsCreatedAfterMaxDir !== null && unitsCreatedAfterMaxDir >= 1,
  'the track kept filing after that commit — into unit-* dirs, which the dir key cannot see',
  `unitsCreatedAfterMaxDir=${unitsCreatedAfterMaxDir ?? 'REFUSED'}`);

leg('F3', 'FREEZE', maxDir !== null && dirsNow !== null && dirsNow.filter((d) => d > maxDir).length === 0,
  "saturation: count(dirs > maxDir) is 0, and maxDir is the value the standing cell publishes as `last`, so its consecutive is pinned at 0",
  `maxDir=${maxDir ?? 'REFUSED'} dirsAboveMaxDir=${dirsNow === null ? 'REFUSED' : dirsNow.filter((d) => d > maxDir).length}`);

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
const DECLARED = ['no-denial-filter', 'credit-465-a-dir', 'fake-new-round-dir', 'dir-key-only', 'xcheck-wrong-figure'];
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
