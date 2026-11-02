// unit-464pins — drive my own three harnesses against Daedalus's CURED tree and grade the hand
// map in PRE-REGISTRATION.md against what the drive actually reaches and reddens.
//
// The map is the prediction. This drive is the answer key. The one thing this instrument must not
// do is decide a leg's class from the same thing it reads to decide the verdict
// ([[feedback_a_gate_whose_predicate_is_the_predictions_predicate_can_only_suppress]]): the CLASS
// comes from the hand table below, typed once from PRE-REGISTRATION.md and gated against it; the
// VERDICT comes from each harness's own printed GATES block.
//
// Run from the repo root:
//   node docs/research/unit-464pins-2026-11-01/drive-my-three-harnesses.mjs
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const DIR = 'docs/research/unit-464pins-2026-11-01';
const PREREG = DIR + '/PRE-REGISTRATION.md';

const HARNESSES = [
  { key: 'armreach', path: 'docs/research/unit-464bucket-2026-11-01/grade-his-armreach-gate.mjs' },
  { key: 'attrib',   path: 'docs/research/unit-464bucket-2026-11-01/grade-his-attrib-gate.mjs' },
  { key: 'regrade',  path: 'docs/research/unit-464bucket-2026-11-01/regrade-saturation.mjs' },
];

const legs = [];
const check = (name, ok, note) => { legs.push({ name, ok, note }); return ok; };

// ------------------------------------------------------------------ the hand map, lifted not retyped
// [[feedback_slicing_the_inputs_but_retyping_the_verdict]] — the class column is parsed OUT of the
// pre-registration's own markdown table, so the map this instrument grades is the map that was
// filed, and a later edit to the table cannot silently diverge from what is scored here.
const prereg = readFileSync(PREREG, 'utf8');
const MAP = [];
for (const line of prereg.split('\n')) {
  const m = line.match(/^\| *(\d+) *\| *(armreach|attrib|regrade) *\| *`(G[A-Z0-9_]+)` *\| *(\*\*PIN\*\*|PIN|GATE\?|GATE|FUSE) *\|/);
  if (m) MAP.push({ n: +m[1], file: m[2], leg: m[3], cls: m[4].replace(/\*/g, '') });
}
check('GMAPLIFT', MAP.length === 15 && MAP[0].n === 1 && MAP[14].n === 15,
  `${MAP.length} rows lifted from the pre-registration table (15 expected), numbered ${MAP[0]?.n}..${MAP[MAP.length - 1]?.n}`);
const predPin = MAP.filter((r) => r.cls === 'PIN');
const predGate = MAP.filter((r) => r.cls === 'GATE' || r.cls === 'GATE?');
const predFuse = MAP.filter((r) => r.cls === 'FUSE');
check('GMAPSPLIT', predPin.length === 4 && predGate.length === 10 && predFuse.length === 1,
  `lifted split is ${predPin.length} PIN / ${predGate.length} GATE / ${predFuse.length} FUSE (4/10/1 registered)`);

// ----------------------------------------------------------- the hand leg count, against the regex
// The pre-registration claims hand=15, regex=17, and that the regex over-counts by exactly 2 in
// the armreach file. Measure both rather than restating them. [[feedback_run_the_regex_dont_reason_about_it]]
let rawTotal = 0; const rawPer = {};
for (const h of HARNESSES) {
  const src = readFileSync(h.path, 'utf8');
  const n = (src.match(/\bcheck\(\s*'/g) || []).length;
  rawPer[h.key] = n; rawTotal += n;
}
check('GRAWCOUNT', rawTotal === 17 && rawPer.armreach === 9,
  `raw \`check('\` hits: ${JSON.stringify(rawPer)} = ${rawTotal} (17 registered, armreach 9)`);

// ------------------------------------------------------------------------------------ the drives
const liveRev = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
for (const h of HARNESSES) {
  let out = '', err = '', code = 0;
  try {
    out = execFileSync('node', [h.path], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 1 << 28 });
  } catch (e) { code = e.status ?? '?'; out = String(e.stdout ?? ''); err = String(e.stderr ?? ''); }
  h.code = code; h.out = out; h.err = err;
  writeFileSync(`${DIR}/drive1.${h.key}.out`, out);
  writeFileSync(`${DIR}/drive1.${h.key}.err`, err);

  // Verdicts read from the harness's OWN printed GATES block, not re-derived.
  const seen = new Map();
  const gatesAt = out.indexOf('\nGATES\n');
  if (gatesAt >= 0) {
    for (const line of out.slice(gatesAt + 7).split('\n')) {
      const m = line.match(/^ {2}(G[A-Z0-9_]+) +(ok|RED) +— /);
      if (!m) { if (seen.size) break; else continue; }
      seen.set(m[1], m[2] === 'ok' ? 'ok' : 'RED');
    }
  }
  h.seen = seen;
  h.refusedEarly = /^REFUSED — /m.test(out) && gatesAt < 0;
}

const byFile = Object.fromEntries(HARNESSES.map((h) => [h.key, h]));

// A leg is REACHED iff its own harness printed a verdict line for it.
for (const r of MAP) { r.verdict = byFile[r.file].seen.get(r.leg) ?? null; }
const reached = MAP.filter((r) => r.verdict !== null);
const unreached = MAP.filter((r) => r.verdict === null);

// GREACHSPLIT — the drive must actually reach SOME legs and leave SOME unreached, or the 2×2 below
// is scored over a degenerate population and P1/P2's whole distinction is untested.
check('GREACHSPLIT', reached.length > 0 && unreached.length > 0,
  `${reached.length} legs reached, ${unreached.length} unreached — both non-empty, so exit-1 and exit-2 are distinguished by measurement`);
check('GCODES', HARNESSES.every((h) => h.code === 0 || h.code === 1 || h.code === 2),
  'exit codes: ' + HARNESSES.map((h) => `${h.key}=${h.code}`).join(', '));

const gatesOk = legs.every((l) => l.ok);
console.log('unit-464pins — my three harnesses, driven against his cured tree');
console.log(`  live rev: ${liveRev}`);
console.log(`  map:      ${PREREG} (class column lifted, not retyped)`);
console.log('');
console.log('GATES');
for (const l of legs) console.log(`  ${l.name.padEnd(13)} ${l.ok ? 'ok ' : 'RED'} — ${l.note}`);
console.log('');
if (!gatesOk) { console.log('REFUSED — a gate is RED, so nothing below is published.'); process.exit(1); }

console.log('1. WHAT EACH HARNESS DID');
console.log('   harness   exit  legs reached  refused before any gate ran');
for (const h of HARNESSES) {
  console.log(`   ${h.key.padEnd(9)} ${String(h.code).padEnd(5)} ${String(h.seen.size).padEnd(13)} ${h.refusedEarly}`);
}
console.log('');

console.log('2. THE MAP, GRADED — reached legs only');
console.log('   #   file      leg            predicted  observed  agrees');
for (const r of MAP) {
  const agrees = r.verdict === null ? '(unreached)'
    : (r.cls === 'PIN' ? r.verdict === 'RED' : r.verdict === 'ok') ? 'yes' : 'NO';
  console.log(`   ${String(r.n).padStart(2)}  ${r.file.padEnd(9)} ${r.leg.padEnd(14)} ` +
    `${r.cls.padEnd(10)} ${(r.verdict ?? '—').padEnd(9)} ${agrees}`);
}
console.log('');

// The 2 × 2, over reached legs only. [[feedback_a_lookahead_behind_quantified_whitespace_excludes_nothing]]
const cell = (cls, v) => reached.filter((r) => (cls === 'PIN' ? r.cls === 'PIN' : r.cls !== 'PIN') && r.verdict === v);
const pinRed = cell('PIN', 'RED'), pinOk = cell('PIN', 'ok');
const gateRed = cell('GATE', 'RED'), gateOk = cell('GATE', 'ok');
console.log('3. CONFUSION MATRIX over the ' + reached.length + ' reached legs');
console.log('                     observed RED   observed ok');
console.log(`   predicted PIN     ${String(pinRed.length).padStart(12)}   ${String(pinOk.length).padStart(11)}`);
console.log(`   predicted GATE/F  ${String(gateRed.length).padStart(12)}   ${String(gateOk.length).padStart(11)}`);
if (pinOk.length) console.log(`   PIN that did not redden: ${pinOk.map((r) => r.file + '/' + r.leg).join(', ')}`);
if (gateRed.length) console.log(`   GATE/FUSE that reddened: ${gateRed.map((r) => r.file + '/' + r.leg).join(', ')}`);
console.log(`   unreached (ungraded, NOT confirmed): ${unreached.map((r) => r.file + '/' + r.leg).join(', ') || '(none)'}`);
console.log('');

console.log('PREDICTIONS settled by this drive');
const p1 = byFile.regrade.code === 2 && byFile.regrade.seen.size === 0;
console.log(`  P1  ${p1 ? 'LANDS  ' : 'REFUTED'}  regrade-saturation exits ${byFile.regrade.code} with ${byFile.regrade.seen.size} legs reached (2 and 0 predicted)`);
const p2 = byFile.armreach.code === 1 && byFile.armreach.seen.size === 7
  && byFile.armreach.seen.get('GDISJUNCT') === 'RED' && byFile.armreach.seen.get('GALREADY') === 'RED';
console.log(`  P2  ${p2 ? 'LANDS  ' : 'REFUTED'}  armreach exits ${byFile.armreach.code}, ${byFile.armreach.seen.size} legs reached, ` +
  `GDISJUNCT ${byFile.armreach.seen.get('GDISJUNCT') ?? '—'}, GALREADY ${byFile.armreach.seen.get('GALREADY') ?? '—'}`);
const p3 = byFile.attrib.seen.get('GLIFT') === 'RED';
console.log(`  P3  ${p3 ? 'LANDS  ' : 'REFUTED'}  attrib GLIFT reads ${byFile.attrib.seen.get('GLIFT') ?? '(unreached)'}`);
const p4 = reached.length > 0 && pinOk.length === 0 && gateRed.length === 0;
console.log(`  P4  ${p4 ? 'LANDS  ' : 'REFUTED'}  hand map over reached legs: ${pinOk.length + gateRed.length} disagreement(s)`);
const leg11 = MAP.find((r) => r.n === 11);
const p5 = leg11.verdict === 'RED';
console.log(`  P5  ${p5 ? 'LANDS  ' : 'REFUTED'}  leg 11 attrib/GCTRL reads ${leg11.verdict ?? '(unreached)'} — registered as the one expected to cost me`);
console.log('');
console.log(`PINS/0  ${legs.length} gates, ${legs.filter((l) => l.ok).length} ok; reached ${reached.length}/15, ` +
  `matrix ${pinRed.length}/${pinOk.length}/${gateRed.length}/${gateOk.length} (pinRED/pinOK/gateRED/gateOK); ` +
  `P1 ${p1 ? 'LANDS' : 'REFUTED'}, P2 ${p2 ? 'LANDS' : 'REFUTED'}, P3 ${p3 ? 'LANDS' : 'REFUTED'}, P4 ${p4 ? 'LANDS' : 'REFUTED'}, P5 ${p5 ? 'LANDS' : 'REFUTED'}`);
process.exit(0);
