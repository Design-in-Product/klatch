#!/usr/bin/env node
// unit-464moves — grade-moves.mjs
//
// Theseus, 2026-11-04 WORK fire. Predictions in PRE-REGISTRATION.md, committed and pushed as the
// only file in this directory before this file existed.
//
// What it does, and the one thing it deliberately does NOT do:
//
//   It re-implements the disputed selection's semantics FROM the subject's source at the pin. It
//   does not import, require or spawn the subject. Driving the subject would grade this copy's
//   tree, not the subject's selection (the mistake Daedalus declared as his own defect 4 in the
//   11/04 memo, on `P8R441`).
//
// Every count prints the KEY it was taken under on the same line as the count.
//
// Usage:  node grade-moves.mjs [--cripple=lengthmeansdetail]
//
//   --cripple=lengthmeansdetail  degrades the leg()-argument splitter to the naive reader that
//                                keys "is this a gate or a reason string" on the presence of
//                                `.length`. P4GATE's control must catch it. If the control stays
//                                green under the cripple, the control is decoration.

import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const SELF = fileURLToPath(import.meta.url);
const UNIT = dirname(SELF);
const REPO = dirname(dirname(dirname(UNIT)));

const CRIPPLE = (process.argv.slice(2).find((a) => a.startsWith('--cripple=')) ?? '').split('=')[1] ?? null;

// ---------------------------------------------------------------------------
// Pins. All three are literals, so this instrument is reproducible from any rev.
// ---------------------------------------------------------------------------
const PIN_POP = '0ae48068';      // population pin — his, and mine from the 11/04 WORK fire
const PIN_HEAD = 'cc444f7a';     // HEAD at pre-registration
const SUBJECT = 'docs/research/unit-464t2-population-2026-10-28/grade-the-round-population.mjs';
const HIS_TABLE_PIN = 'bba2aa3c'; // the pin his 11/03 census table was taken at
const TERMINATION_INSTANT = '2026-10-27T17:52:54.000Z'; // subject's own constant, line 68 at PIN_POP
const HAND_SITES = join(UNIT, 'HAND-SITES.tsv');

// Daedalus's figures, as TARGETS. Never evidence.
const HIS = { rowsAtPop: 40, rowsAtHead: 45, dirsWithMjs: 90, mjs: 195, allRoundDirs: 91 };

// ---------------------------------------------------------------------------
// git. Child stderr is captured, never inherited — an inherited stderr prints the child's
// complaint into this recording where it reads like the instrument's own output.
// ---------------------------------------------------------------------------
function git(args) {
  try {
    return execFileSync('git', ['-C', REPO, ...args], {
      encoding: 'utf8',
      maxBuffer: 64 * 1024 * 1024,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// The disputed selection, re-implemented from the subject's `creationRows()` (lines 167-201 at
// PIN_POP): --diff-filter=A --name-only --reverse <rev> -- docs/research/, first-appearance dedup
// into round-dir and unit-dir rows.
// ---------------------------------------------------------------------------
function creationRows(rev) {
  const raw = git([
    'log', '--diff-filter=A', '--format=%H\u0001%aI\u0001%s', '--name-only', '--reverse', rev,
    '--', 'docs/research/',
  ]);
  if (raw === null) return null;
  const rows = [];
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
  return rows;
}

// Everything the subject derives from that selection, at one rev. Six quantities, each one a site
// where the selection is consumed somewhere downstream.
function derive(rev) {
  const rows = creationRows(rev);
  if (rows === null) return null;
  const roundDirRows = rows.filter((r) => r.kind === 'round-dir');
  const unitDirRows = rows.filter((r) => r.kind === 'unit-dir');
  const maxDirRow = roundDirRows.length === 0 ? null : roundDirRows.reduce((a, b) => (b.round > a.round ? b : a));
  const after = (arr) => arr.filter((r) => Date.parse(r.date) > Date.parse(TERMINATION_INSTANT)).length;
  return {
    rowsLen: rows.length,
    unitDirLen: unitDirRows.length,
    roundDirLen: roundDirRows.length,
    maxDirName: maxDirRow === null ? null : maxDirRow.name,
    dirsAfterPin: after(roundDirRows),
    unitsAfterPin: after(unitDirRows),
    // the two predicates that consume the selection
    predG1RowsNonNull: rows !== null,
    predF2AtLeastOne: after(unitDirRows) >= 1,
  };
}

// ---------------------------------------------------------------------------
// The leg()-argument splitter. leg(id, kind, value, why, detail): arg 2 is the PREDICATE, args 3
// and 4 are the reason strings. Splits on top-level commas only, tracking quote, template,
// paren/bracket/brace depth.
// ---------------------------------------------------------------------------
function splitLegArgs(src, legId) {
  const start = src.indexOf(`leg('${legId}'`);
  if (start < 0) return null;
  const open = src.indexOf('(', start);
  if (open < 0) return null;
  const args = [];
  let buf = '';
  let depth = 0;
  let quote = null;
  for (let i = open; i < src.length; i += 1) {
    const c = src[i];
    const prev = src[i - 1];
    if (quote) {
      buf += c;
      if (c === quote && prev !== '\\') quote = null;
      continue;
    }
    if (c === "'" || c === '"' || c === '`') { quote = c; buf += c; continue; }
    if (c === '(' || c === '[' || c === '{') {
      depth += 1;
      if (depth === 1) continue; // skip leg's own opening paren
      buf += c;
      continue;
    }
    if (c === ')' || c === ']' || c === '}') {
      depth -= 1;
      if (depth === 0) { args.push(buf); return args; }
      buf += c;
      continue;
    }
    if (c === ',' && depth === 1) { args.push(buf); buf = ''; continue; }
    buf += c;
  }
  return null;
}

// Where does a token live in a leg() call: the predicate, or a reason string?
function siteOfToken(args, token) {
  if (args === null) return 'REFUSED';
  const hits = [];
  args.forEach((a, i) => { if (a.includes(token)) hits.push(i); });
  if (hits.length === 0) return 'ABSENT';
  // CRIPPLE: the naive reader — anything containing `.length` is treated as a printed figure.
  if (CRIPPLE === 'lengthmeansdetail' && token.includes('.length')) return 'REASON-STRING';
  const label = (i) => (i === 2 ? 'PREDICATE' : i === 3 || i === 4 ? 'REASON-STRING' : `ARG${i}`);
  return [...new Set(hits.map(label))].join('+');
}

// ---------------------------------------------------------------------------
// Legs.
// ---------------------------------------------------------------------------
const legs = [];
function leg(id, kind, value, why, detail) { legs.push({ id, kind, value, why, detail }); }

const atPop = derive(PIN_POP);
const atHead = derive(PIN_HEAD);

console.log('--- [MEAS] the disputed selection, evaluated at two revs');
console.log(`  key: --diff-filter=A --name-only --reverse <rev> -- docs/research/, first-appearance dedup (re-implemented from ${SUBJECT}@${PIN_POP} lines 167-201)`);
for (const [label, rev, d] of [['POP ', PIN_POP, atPop], ['HEAD', PIN_HEAD, atHead]]) {
  if (d === null) { console.log(`  ${label} ${rev}: REFUSED`); continue; }
  console.log(`  ${label} ${rev}: rows=${d.rowsLen} unit-dir=${d.unitDirLen} round-dir=${d.roundDirLen} maxDir=${d.maxDirName} dirsAfterPin=${d.dirsAfterPin} unitsAfterPin=${d.unitsAfterPin}`);
}
console.log('');

leg('P1REPRO', 'GATE',
  atPop !== null && atHead !== null && atPop.unitDirLen === HIS.rowsAtPop && atHead.unitDirLen === HIS.rowsAtHead,
  `BLOCKING: the selection's unit-dir extent re-derived independently is ${HIS.rowsAtPop} at the population pin and ${HIS.rowsAtHead} at HEAD — his two figures, reproduced not retyped`,
  `mine: ${atPop === null ? 'REFUSED' : atPop.unitDirLen}@${PIN_POP} -> ${atHead === null ? 'REFUSED' : atHead.unitDirLen}@${PIN_HEAD}; his targets ${HIS.rowsAtPop}/${HIS.rowsAtHead}`);

// --- P2SITE: the consumption sites, each with MEASURED movability -----------
const subjSrc = git(['show', `${PIN_POP}:${SUBJECT}`]);
const g1 = subjSrc === null ? null : splitLegArgs(subjSrc, 'G1');
const f2 = subjSrc === null ? null : splitLegArgs(subjSrc, 'F2');

const moved = (k) => (atPop === null || atHead === null ? 'REFUSED' : String(atPop[k]) === String(atHead[k]) ? 'stable' : 'MOVED');

const SITES = [
  { id: 'S1', what: 'M6 published total `of ${unitDirRows.length} total`', kind: 'PUBLISHED-FIGURE', key: 'unitDirLen' },
  { id: 'S2', what: 'M6 published count `unitsCreatedAfterMaxDir`', kind: 'PUBLISHED-FIGURE', key: 'unitsAfterPin' },
  { id: 'S3', what: 'G1 detail string `rows=${rows.length}`', kind: 'REASON-STRING', key: 'rowsLen' },
  { id: 'S4', what: 'G1 predicate `rows !== null`', kind: 'PREDICATE', key: 'predG1RowsNonNull' },
  { id: 'S5', what: 'F2 predicate `unitsCreatedAfterMaxDir >= 1`', kind: 'PREDICATE', key: 'predF2AtLeastOne' },
  { id: 'S6', what: 'M4 published `maxDirRow.name`', kind: 'PUBLISHED-FIGURE', key: 'maxDirName' },
];
console.log('--- [MEAS] consumption sites of that one selection, movability MEASURED at the two revs');
for (const s of SITES) {
  const mv = moved(s.key);
  const vals = atPop === null || atHead === null ? 'REFUSED' : `${atPop[s.key]} -> ${atHead[s.key]}`;
  console.log(`  ${s.id} ${s.kind.padEnd(16)} ${mv.padEnd(8)} ${vals.padEnd(26)} ${s.what}`);
}
const classesPresent = [...new Set(SITES.map((s) => `${s.kind}/${moved(s.key)}`))].sort();
console.log(`  key: movability = does the value this site consumes differ between ${PIN_POP} and ${PIN_HEAD}`);
console.log(`  distinct (site-kind / movability) classes present: ${classesPresent.length} -> ${classesPresent.join(' , ')}`);
console.log('');

const immovablePredicate = SITES.some((s) => s.kind === 'PREDICATE' && moved(s.key) === 'stable');
leg('P2SITE', 'FINDING',
  classesPresent.length >= 3 && immovablePredicate,
  'ONE selection is consumed at >=3 distinct (site-kind / movability) classes, and at least one PREDICATE over it does not move while the figures over it do — so "does the selection move" is underdetermined by the selection alone',
  `classes=${classesPresent.length} immovable-predicate=${immovablePredicate}`);

// --- P3SAT: the saturation, with its asymmetry printed ----------------------
const figureMoved = moved('unitsAfterPin') === 'MOVED' || moved('unitDirLen') === 'MOVED';
const f2Both = atPop !== null && atHead !== null && atPop.predF2AtLeastOne === true && atHead.predF2AtLeastOne === true;
console.log('--- [MEAS] P3SAT asymmetry');
console.log(`  F2 predicate (>=1): ${atPop === null ? 'REFUSED' : atPop.predF2AtLeastOne} @${PIN_POP} -> ${atHead === null ? 'REFUSED' : atHead.predF2AtLeastOne} @${PIN_HEAD}`);
console.log(`  figure under it   : ${atPop === null ? 'REFUSED' : atPop.unitsAfterPin} -> ${atHead === null ? 'REFUSED' : atHead.unitsAfterPin}  (extent ${atPop === null ? '?' : atPop.unitDirLen} -> ${atHead === null ? '?' : atHead.unitDirLen})`);
console.log(`  INTERPRETABLE: ${figureMoved ? 'YES — the figure moved over the same interval, so a stable verdict is evidence of SATURATION' : 'NO — the figure did not move, so a stable verdict carries NO information and this leg says nothing'}`);
console.log('');

leg('P3SAT', 'FINDING',
  f2Both && figureMoved,
  "F2's verdict is stable TRUE across an interval in which the figure it is derived from moved — a saturated threshold over a movable selection. Registered asymmetry: a stable verdict is evidence only BECAUSE the figure is measured to move; it is uninterpretable otherwise",
  `f2 stable-true=${f2Both} figure-moved=${figureMoved}`);

// --- P4GATE: predicate vs reason string, with its control ------------------
const siteRowsLen = siteOfToken(g1, 'rows.length');
const siteRowsNull = siteOfToken(g1, 'rows !== null');
const siteCtl = siteOfToken(g1, 'dirsNow.length > 0');
console.log('--- [MEAS] P4GATE — where in the G1 call each token actually lives');
console.log(`  key: leg(id, kind, value, why, detail); arg index 2 is the PREDICATE, 3 and 4 are reason strings. Top-level comma split over ${SUBJECT}@${PIN_POP}${CRIPPLE ? ` [CRIPPLE=${CRIPPLE}]` : ''}`);
console.log(`  G1 args parsed      : ${g1 === null ? 'REFUSED' : g1.length}`);
console.log(`  'rows.length'       : ${siteRowsLen}`);
console.log(`  'rows !== null'     : ${siteRowsNull}`);
console.log(`  CONTROL 'dirsNow.length > 0' : ${siteCtl}`);
console.log('');

leg('P4GATE', 'FINDING',
  siteRowsLen === 'REASON-STRING' && siteRowsNull === 'PREDICATE',
  "the `rows.length` the reply memo calls a gate lives in G1's DETAIL argument; G1's predicate over the selection is `rows !== null`, an existence check that cannot move however far the selection grows",
  `rows.length=${siteRowsLen} rows!==null=${siteRowsNull}`);

leg('P4CTL', 'CONTROL',
  siteCtl === 'PREDICATE',
  "CONTROL for P4GATE: a `.length` that IS in the predicate must read PREDICATE. Without this, a reader that calls every `.length` a reason string passes P4GATE vacuously",
  `dirsNow.length > 0 => ${siteCtl} (expected PREDICATE)`);

// --- P5CENSUS: the roundNNN population, with the key on every line ---------
function censusAt(rev) {
  const top = git(['ls-tree', rev, 'docs/research/']);
  if (top === null) return null;
  const dirs = [];
  for (const line of top.split('\n')) {
    const m = /^\d+ (tree|blob) [0-9a-f]+\tdocs\/research\/(.+)$/.exec(line);
    if (!m || m[1] !== 'tree') continue;
    if (/^round\d+-instruments$/.test(m[2])) dirs.push(m[2]);
  }
  const all = git(['ls-tree', '-r', '--name-only', rev, 'docs/research/']);
  if (all === null) return null;
  const mjsByDir = new Map(dirs.map((d) => [d, 0]));
  for (const p of all.split('\n')) {
    const m = /^docs\/research\/(round\d+-instruments)\/(.+)$/.exec(p);
    if (!m) continue;
    if (!p.endsWith('.mjs')) continue;
    if (mjsByDir.has(m[1])) mjsByDir.set(m[1], mjsByDir.get(m[1]) + 1);
  }
  const withMjs = [...mjsByDir.entries()].filter(([, n]) => n > 0).map(([d]) => d);
  const withoutMjs = [...mjsByDir.entries()].filter(([, n]) => n === 0).map(([d]) => d);
  const mjsTotal = [...mjsByDir.values()].reduce((a, b) => a + b, 0);
  return { dirs, withMjs, withoutMjs, mjsTotal };
}

const cPop = censusAt(PIN_POP);
const cHis = censusAt(HIS_TABLE_PIN);
console.log('--- [MEAS] P5CENSUS — roundNNN-instruments, three keys, each printed with its count');
for (const [label, rev, c] of [['POP ', PIN_POP, cPop], ['HIS ', HIS_TABLE_PIN, cHis]]) {
  if (c === null) { console.log(`  ${label} ${rev}: REFUSED`); continue; }
  console.log(`  ${label} ${rev} (a) tree entries under docs/research/ matching /^round\\d+-instruments$/, no other condition : ${c.dirs.length}`);
  console.log(`  ${label} ${rev} (b) of those, directories holding >=1 *.mjs at any depth                                    : ${c.withMjs.length}`);
  console.log(`  ${label} ${rev} (c) *.mjs blobs under those directories, recursive                                          : ${c.mjsTotal}`);
  console.log(`  ${label} ${rev} (d) (a)-(b), named                                                                          : ${c.withoutMjs.length === 0 ? '(none)' : c.withoutMjs.join(', ')}`);
}
console.log(`  his 11/03 table at ${HIS_TABLE_PIN} said dirs-with-.mjs=${HIS.dirsWithMjs} .mjs=${HIS.mjs}; his 11/04 P8NEGS at ${PIN_POP} said all-dirs=${HIS.allRoundDirs}`);
console.log('');

leg('P5CENSUS', 'FINDING',
  cPop !== null && cHis !== null
    && cPop.dirs.length === HIS.allRoundDirs
    && cHis.withMjs.length === HIS.dirsWithMjs && cHis.mjsTotal === HIS.mjs
    && cPop.dirs.length - cPop.withMjs.length === 1,
  'the 90-vs-91 is one tree under two conditions: (a) every roundNNN-instruments directory = 91, (b) those holding an instrument = 90, and the difference is exactly one named directory with no .mjs in it',
  `pop: a=${cPop === null ? 'REFUSED' : cPop.dirs.length} b=${cPop === null ? 'REFUSED' : cPop.withMjs.length} c=${cPop === null ? 'REFUSED' : cPop.mjsTotal}; his-pin: b=${cHis === null ? 'REFUSED' : cHis.withMjs.length} c=${cHis === null ? 'REFUSED' : cHis.mjsTotal}; targets a=${HIS.allRoundDirs} b=${HIS.dirsWithMjs} c=${HIS.mjs}`);

// --- P6HAND: my own 20 reason lines, scored against me ---------------------
let hand = null;
if (existsSync(HAND_SITES)) {
  // DEFECT, mine, caught by drive6's own output: the first version filtered only '#' lines and
  // blanks, so the TSV's uncommented COLUMN HEADER was parsed as a 21st data row. P6HAND's
  // predicate is a conjunction of `rows === 20` and `naming <= 8`, so a red could have been
  // produced by my own parsing slip while printing a reason about the registered ceiling. A leg red
  // for two reasons, one of them an artefact, cannot say which. The header row is now dropped by
  // name and drive6's first recording is kept.
  hand = readFileSync(HAND_SITES, 'utf8').split('\n')
    .filter((l) => l.trim() && !l.startsWith('#'))
    .map((l) => l.split('\t'))
    .filter((r) => r[0] !== 'site_id');
}
if (hand === null) {
  leg('P6HAND', 'FINDING', 'UNRUN',
    'of my own 20 HAND-ARM3 reason lines, how many name a consumption site',
    'UNRUN: HAND-SITES.tsv does not exist yet at this drive. The hand read is filed in its own commit before the drive that grades it');
} else {
  const named = hand.filter((r) => (r[1] ?? '').trim() === 'yes');
  console.log('--- [MEAS] P6HAND — my own reason lines');
  console.log(`  key: a row counts as NAMING a consumption site only if its HAND-ARM3 reason text identifies what consumes the selection (hand-read, one row per site)`);
  console.log(`  rows read: ${hand.length}   naming a consumption site: ${named.length}`);
  console.log('');
  leg('P6HAND', 'FINDING',
    hand.length === 20 && named.length <= 8,
    'registered against my own work: <=8 of my 20 reason lines name a consumption site, i.e. the discipline this unit proposes is NOT already in place in my own table',
    `rows=${hand.length} naming=${named.length} (registered ceiling 8)`);
}

// ---------------------------------------------------------------------------
// Verdict.
// ---------------------------------------------------------------------------
console.log('--- legs');
let red = 0; let unrun = 0;
for (const l of legs) {
  const v = l.value === 'UNRUN' ? 'UNRUN' : l.value === true ? 'GREEN' : 'RED';
  if (v === 'RED') red += 1;
  if (v === 'UNRUN') unrun += 1;
  console.log(`  ${v.padEnd(5)} ${l.id.padEnd(9)} ${l.kind.padEnd(8)} ${l.why}`);
  console.log(`        detail: ${l.detail}`);
}
const gate = legs.find((l) => l.id === 'P1REPRO');
console.log('');
console.log(`VERDICT ${red === 0 ? 'GREEN' : 'RED'} legs=${legs.length} red=${red} unrun=${unrun} gate=${gate.value === true ? 'GREEN' : 'RED'}${CRIPPLE ? ` CRIPPLE=${CRIPPLE}` : ''}`);
