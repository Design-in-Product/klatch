#!/usr/bin/env node
// grade-acons.mjs — unit-464acons, Theseus, 2026-11-04 STOP fire.
//
// Grades the eight legs registered in PRE-REGISTRATION.md. Written AFTER HAND-CONS-A.tsv was
// committed on its own (c21105db), so the hand verdicts cannot have been tuned to this grader.
//
// The hand table is read at ITS OWN ADD-COMMIT, derived here rather than typed, so a later edit to
// the TSV cannot change a verdict retroactively. Deriving it uses `--diff-filter=A --reverse` plus
// the first record — the very selection shape this unit is about — deliberately and with the
// resolved SHA printed, because that shape is the right one for "the commit that added this file"
// and this unit's whole finding is that it is stable when reduced to one record.
//
// Child stderr is captured, never inherited. Every git read pins -C <toplevel>.

import { execFileSync } from 'node:child_process';

const TOP = execFileSync('git', ['rev-parse', '--show-toplevel'], {
  encoding: 'utf8',
  stdio: ['ignore', 'pipe', 'pipe'],
}).trim();
const UNIT = 'docs/research/unit-464acons-2026-11-04';

function die(why) {
  console.log(`REFUSE: ${why}`);
  process.exit(2);
}

function git(args, { allowFail = false } = {}) {
  try {
    return execFileSync('git', ['-C', TOP, ...args], {
      encoding: 'utf8',
      maxBuffer: 64 * 1024 * 1024,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  } catch (e) {
    if (allowFail) return null;
    die(`git ${args.slice(0, 3).join(' ')} failed, status ${e.status}`);
  }
}

// run read-consumers.mjs as a child; return { rc, out, err }
function drive(extraArgs) {
  try {
    const out = execFileSync('node', [`${TOP}/${UNIT}/read-consumers.mjs`, ...extraArgs], {
      cwd: TOP,
      encoding: 'utf8',
      maxBuffer: 64 * 1024 * 1024,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    return { rc: 0, out, err: '' };
  } catch (e) {
    return { rc: e.status ?? -1, out: e.stdout ?? '', err: e.stderr ?? '' };
  }
}

console.log('grade-acons — unit-464acons');

// ---- the hand table, at its own add-commit ---------------------------------
const TSV_REL = `${UNIT}/HAND-CONS-A.tsv`;
const addLog = git(['log', '--diff-filter=A', '--reverse', '--format=%H', '--', TSV_REL]);
const ADD_REV = (addLog ?? '').trim().split('\n').filter(Boolean)[0];
if (!ADD_REV) die(`no add-commit for ${TSV_REL}`);
console.log(`  hand table   ${TSV_REL}`);
console.log(`  at its own add-commit  ${ADD_REV}`);

const tsv = git(['show', `${ADD_REV}:${TSV_REL}`]);
if (!tsv || !tsv.trim()) die(`${TSV_REL} reads empty at ${ADD_REV}`);

const handRows = tsv
  .split('\n')
  .filter((l) => l.trim() && !l.startsWith('#'))
  .map((l) => l.split('\t'))
  .filter((c) => c[0] !== 'site_id'); // header dropped BY NAME, never by position

if (handRows.length !== 8) die(`expected 8 hand rows, read ${handRows.length}`);

const flips = handRows.filter((c) => (c[1] || '').trim().toLowerCase() !== 'yes');
const FLIPS = flips.length;
const flagged = handRows.filter((c) => (c[4] || '').trim().startsWith('FLAG')).length;

// ---- the subject arm -------------------------------------------------------
const subj = drive([]);
if (subj.rc !== 0) die(`subject arm exited ${subj.rc}`);
if (subj.err.trim()) die(`subject arm wrote to stderr: ${subj.err.slice(0, 200)}`);
const num = (label, text) => {
  // NOT anchored on end-of-line: WHOLE_SELECTION's line carries a trailing parenthetical, and a
  // `$` anchor made this refuse on a figure that was present. The refusal was correct behaviour
  // on a wrong reader; drive5.grade.out is kept as its recording.
  const m = new RegExp(`^\\s*${label}\\s+(\\d+) of (\\d+)\\b`, 'm').exec(text);
  if (!m) die(`could not read ${label} off the subject arm's output`);
  return { n: Number(m[1]), of: Number(m[2]) };
};
const BOUND = num('BOUND_TO_IDENT', subj.out);
const MULTI = num('MULTIPATH_OR_DIR', subj.out);
const SINGLE = num('SINGLE_RECORD', subj.out);
const WHOLE = num('WHOLE_SELECTION', subj.out);
if (BOUND.of !== 8) die(`subject arm reports ${BOUND.of} sites, not 8`);

// ---- the cripple -----------------------------------------------------------
const crip = drive(['--cripple=callshapeonly']);
if (crip.rc !== 0) die(`cripple arm exited ${crip.rc}`);
const cm = /^\s*CRIPPLE_FLIPS\s+(\d+) of (\d+)\s*$/m.exec(crip.out);
if (!cm) die('cripple arm printed no CRIPPLE_FLIPS line');
const CRIPPLE_FLIPS = Number(cm[1]);
// per-site cripple classes, to argue liveness rather than assert it
const cripClasses = [...crip.out.matchAll(/^--- (.+)$|CRIPPLE callshapeonly -> (\w)$/gm)];
let lastSite = null;
const cripBySite = new Map();
for (const m of cripClasses) {
  if (m[1]) lastSite = m[1].trim();
  else if (m[2] && lastSite) cripBySite.set(lastSite, m[2]);
}
if (cripBySite.size !== 8) die(`cripple arm emitted ${cripBySite.size} per-site classes, not 8`);
const handBySite = new Map(handRows.map((c) => [c[0].trim(), (c[1] || '').trim().toLowerCase() === 'yes' ? 'A' : 'R']));
const disagree = [...handBySite.entries()].filter(([site, cls]) => cripBySite.get(site) !== cls);

// ---- the refusal guard -----------------------------------------------------
const bad = drive(['--pin=deadbeefdeadbeefdeadbeefdeadbeefdeadbeef']);
const REFUSED = bad.rc !== 0 && /^REFUSE:/m.test(bad.out);
const LEAKED_FIGURE = /SINGLE_RECORD|WHOLE_SELECTION|CRIPPLE_FLIPS/.test(bad.out);

// ---- legs ------------------------------------------------------------------
const P = [];
const leg = (id, kind, ok, claim, detail) => {
  P.push({ id, kind, ok, claim, detail });
  console.log(`  ${ok ? 'GREEN' : 'RED  '}  ${id.padEnd(10)} ${kind.padEnd(5)} ${claim}`);
  console.log(`              ${detail}`);
};

console.log('');
console.log('=== LEGS ===');

leg('P1AFLIP', 'PRED', FLIPS >= 1,
  'at least 1 of the 8 A rows flips to R when read at its consumption site',
  `flips = ${FLIPS} of 8, floor >= 1  ${FLIPS === 1 ? '(EXACTLY ON the floor — tight, not comfortable)' : ''}`);

leg('P1BEXACT', 'PRED', FLIPS === 1,
  'exactly 1 of the 8 flips',
  `flips = ${FLIPS}; the flipped row(s): ${flips.map((c) => c[0]).join(', ') || '(none)'}`);

leg('P2CENSUS', 'PRED', MULTI.n === 1,
  'exactly 1 of the 8 enclosing calls selects over a directory or multi-path pathspec',
  `MULTIPATH_OR_DIR = ${MULTI.n} of 8, registered exactly 1`);

leg('P3BIND', 'PRED', BOUND.n >= 4,
  'at least 4 of the 8 bind the call result to a named identifier',
  `BOUND_TO_IDENT = ${BOUND.n} of 8, floor >= 4`);

leg('P4REDUCE', 'PRED', SINGLE.n === 7,
  'exactly 7 of the 8 reduce the selection to a single record',
  `SINGLE_RECORD = ${SINGLE.n} of 8, registered exactly 7`);

leg('P5LEN', 'PRED', WHOLE.n === 1,
  'exactly 1 of the 8 consumes the whole selection rather than one record out of it',
  `WHOLE_SELECTION = ${WHOLE.n} of 8, registered exactly 1`);

leg('P6CRIPPLE', 'CTL', CRIPPLE_FLIPS === 0,
  'the call-shape-only cripple flips 0 of 8 — it reproduces the original hand read and cannot see the flip',
  `CRIPPLE_FLIPS = ${CRIPPLE_FLIPS} of 8; cripple disagrees with the corrected hand read on ${disagree.length} site(s): ${disagree.map(([s]) => s).join(', ') || '(none)'}`);

leg('P7REFUSE', 'CTL', REFUSED && !LEAKED_FIGURE,
  'an unresolvable pin makes the reader REFUSE, with no figure printed',
  `rc = ${bad.rc}, REFUSE line = ${REFUSED}, figure leaked = ${LEAKED_FIGURE}; first line: ${(bad.out.split('\n')[0] || '(empty)').slice(0, 90)}`);

// ---- summary ---------------------------------------------------------------
const green = P.filter((p) => p.ok).length;
console.log('');
console.log(`VERDICT  ${green} of ${P.length} legs GREEN, ${P.length - green} RED`);
console.log(`  FLIPS=${FLIPS}  FLAGGED_ROWS=${flagged}  BOUND=${BOUND.n} MULTIPATH=${MULTI.n} SINGLE=${SINGLE.n} WHOLE=${WHOLE.n}`);
console.log(`  CRIPPLE_LIVE=${disagree.length > 0}  (a cripple that agreed with the hand read on all 8 would be reported as vacuous)`);
console.log(`  reds: ${P.filter((p) => !p.ok).map((p) => p.id).join(', ') || '(none)'}`);
