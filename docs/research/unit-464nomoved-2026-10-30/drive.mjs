#!/usr/bin/env node
// drive.mjs — unit-464nomoved, 2026-10-30 STOP fire (Theseus).
//
// Subject: the one item Daedalus's §7 routed back here — the `T9 moved=0` substring in
// ../unit-464v21map-2026-10-30/V21-MAP.md:63, which GTYPEDDEF prices at the whole red.
//
// Three drives, all with the SAME argv except `--map=`:
//   drive1  the baseline map, extracted FROM GIT at baseline.rev   (reproducible from any rev)
//   drive2  the cured map, same local depth, ONE span apart         (the pure delta)
//   drive3  the LIVE committed file after the cure is applied in place (the tree's own state)
//
// drive1-vs-drive2 is the measurement; drive3 is what the repo will hold. Run with cwd = this
// unit dir: the map's stamp declares repo-relative paths that the checker resolves by realpath
// against cwd, and `docs/research/<unit>/` is the depth every other unit on this track drove at.
//
// Nothing here drives the CELL. Every recording read is already committed.

import { spawnSync } from 'node:child_process';
import { writeFileSync, readFileSync, statSync } from 'node:fs';

const CHECKER = '../unit-464mapkey-2026-10-30/grade-filed-maps.mjs';
const T = '../unit-464t2b-sat-2026-10-29'; // clean + the arm recording
const D = '../unit-464t8-mapdecay-2026-10-29'; // the second no-cripple drive
const V = '../unit-464v21map-2026-10-30'; // my v2.1-authored map
const LIVE = `${V}/V21-MAP.md`;

const BASELINE_REV = readFileSync('baseline.rev', 'utf8').trim();

// The figure delta is this unit's result. Recorded as well as printed — a verdict that lives
// only in a terminal is not an artifact, and RESULTS.md cites these lines.
/** @type {string[]} */
const LOG = [];
const say = (/** @type {string} */ s) => {
  LOG.push(s);
  process.stdout.write(`${s}\n`);
};

// The span, and the prose that replaces it. §3.4b of v2.2: inside a row, write
// cross-references in prose, not as `name=value`. One span, in place, so the before/after
// delta is exactly one line and the gate's sensitivity is settled by that one difference.
const QUOTED = '`T9 moved=0`';
const PROSE = '`T9` moved-zero case';

// --- The subject, taken from git rather than from the working tree, so drive1 is
// reproducible after the cure is committed. The live file is asserted EQUAL to it, which is
// what makes the git copy the real committed subject at this rev rather than a lookalike.
const show = spawnSync('git', ['show', `${BASELINE_REV}:docs/research/unit-464v21map-2026-10-30/V21-MAP.md`], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
if (show.status !== 0) {
  console.error(`FATAL: git show at ${BASELINE_REV.slice(0, 8)} failed rc=${show.status}: ${show.stderr}`);
  process.exit(2);
}
const before = show.stdout;
const live = readFileSync(LIVE, 'utf8');

// --- Mutation hygiene. Every failure below is FATAL, not a skipped prediction.
if (!before.includes(QUOTED)) {
  console.error(`FATAL: ${QUOTED} absent from the baseline — the cure would be a silent no-op and drive2's green would be vacuous`);
  process.exit(2);
}
const occurrences = before.split(QUOTED).length - 1;
const after = before.replaceAll(QUOTED, PROSE);
if (after.includes(QUOTED)) {
  console.error(`FATAL: ${QUOTED} still present after substitution — the edit did not land`);
  process.exit(2);
}
const bl = before.split('\n');
const al = after.split('\n');
if (bl.length !== al.length) {
  console.error(`FATAL: line count moved ${bl.length} → ${al.length} — the substitution is not confined to one line`);
  process.exit(2);
}
const changedLines = bl.map((l, i) => (l === al[i] ? -1 : i + 1)).filter((n) => n !== -1);
if (changedLines.length !== 1) {
  console.error(`FATAL: ${changedLines.length} line(s) differ [${changedLines}] — "nothing else changed" is not measured`);
  process.exit(2);
}
// The live file is classified against BOTH states rather than asserted equal to one, so this
// unit is re-drivable after the cure is committed. Anything that is neither is a subject that
// has moved under the pin, and that refuses.
const state = live === before ? 'PRE-CURE' : live === after ? 'ALREADY-CURED' : 'MOVED';
if (state === 'MOVED') {
  console.error(`FATAL: ${LIVE} matches neither ${BASELINE_REV.slice(0, 8)} nor the cured form — the subject moved under the pin; re-pin baseline.rev`);
  process.exit(2);
}
say(`SUBJECT  ${LIVE} is ${state} vs ${BASELINE_REV.slice(0, 8)} · ${QUOTED} ×${occurrences} in baseline · cured line ${changedLines[0]} · ${bl.length} lines both sides`);

writeFileSync('V21-MAP.baseline.md', before);
writeFileSync('V21-MAP.cured.md', after);
// The cure itself, applied in place to the tracked file. Scripted, so the committed diff
// cannot carry an unrelated hand edit.
writeFileSync(LIVE, after);
say(`CURE     ${LIVE} ${state === 'PRE-CURE' ? 'rewritten in place' : 're-written identically (was already cured)'}; V21-MAP.baseline.md and V21-MAP.cured.md recorded beside it`);

const ARGV = [
  `--clean=${T}/drive2.clean.out`,
  `--arm=t8-unpinned=${T}/drive-cripple-t8-unpinned.out`,
  `--control=${T}/drive2.clean.out`,
  `--control=${D}/drive1.clean.out`,
];

/** @type {{name:string, map:string, why:string}[]} */
const DRIVES = [
  { name: 'drive1.baseline', map: 'V21-MAP.baseline.md', why: 'G1/P2 — the uncured map at baseline.rev; the gate leg and the matched drive for drive2' },
  { name: 'drive2.cured', map: 'V21-MAP.cured.md', why: 'P3/P4/P5 — one span apart from drive1, same path depth' },
  { name: 'drive3.cured-live', map: LIVE, why: 'the tree after the cure: whether a COMMITTED map now passes GTYPEDDEF unedited' },
];

for (const d of DRIVES) {
  const r = spawnSync('node', [CHECKER, `--map=${d.map}`, ...ARGV], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  writeFileSync(`${d.name}.out`, r.stdout ?? '');
  writeFileSync(`${d.name}.err`, r.stderr ?? '');
  const errBytes = statSync(`${d.name}.err`).size;
  say(`${d.name.padEnd(18)} exit=${r.status} err=${errBytes}B  — ${d.why}`);
}

// --- Figures sliced from the recordings by anchor. Nothing is re-typed, and an anchor that
// matches no line REFUSES (null) rather than comparing equal to another refusal.
const ANCHORS = {
  summary: /^\s*reached=.*$/m,
  underReportedRaw: /^\s*underReported=\[.*$/m,
  underReportedArm: /^\s*underReportedArmCaused=\[.*$/m,
  subjectKey: /^\s*subject key: .*$/m,
  GTYPED: /^GTYPED .*$/m,
  GTYPEDDEF: /^GTYPEDDEF .*$/m,
  GRADE: /^GRADE .*$/m,
  GRADEA: /^GRADEA .*$/m,
  TYPED: /^TYPED .*$/m,
  GCONF: /^GCONF .*$/m,
  MAPVERDICT: /^MAPVERDICT\/.*$/m,
};

function figures(name) {
  const txt = readFileSync(`${name}.out`, 'utf8');
  /** @type {Record<string, string|null>} */
  const out = {};
  for (const [k, re] of Object.entries(ANCHORS)) {
    const m = txt.match(re);
    out[k] = m === null ? null : m[0].trim();
  }
  return out;
}

const f1 = figures('drive1.baseline');
const f2 = figures('drive2.cured');
const f3 = figures('drive3.cured-live');

say('\n=== FIGURE DELTA drive1.baseline → drive2.cured (one span apart) ===');
let moved = 0;
let refused = 0;
for (const k of Object.keys(ANCHORS)) {
  const a = f1[k];
  const b = f2[k];
  if (a === null || b === null) {
    refused++;
    say(`REFUSED  ${k.padEnd(18)} baseline=${a === null ? 'ANCHOR-ABSENT' : 'present'} cured=${b === null ? 'ANCHOR-ABSENT' : 'present'}`);
    continue;
  }
  if (a === b) {
    say(`SAME     ${k.padEnd(18)} ${a}`);
  } else {
    moved++;
    say(`MOVED    ${k.padEnd(18)}`);
    say(`   base  ${a}`);
    say(`   cured ${b}`);
  }
}
say(`DELTA    moved=${moved} same=${Object.keys(ANCHORS).length - moved - refused} refused=${refused}`);

// drive2 vs drive3 must agree on every figure: same content, different path. If they do not,
// the `--map=` path is load-bearing and the delta above is confounded by it.
const pathSensitive = Object.keys(ANCHORS).filter((k) => f2[k] !== f3[k]);
say(`PATHCHECK drive2 vs drive3 (identical content, different path): ${pathSensitive.length === 0 ? 'identical on all ' + Object.keys(ANCHORS).length + ' anchors' : 'DIFFER on [' + pathSensitive + '] — map path is load-bearing'}`);

writeFileSync('drive.summary.out', `${LOG.join('\n')}\n`);
