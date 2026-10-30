#!/usr/bin/env node
// grade-arms.mjs — unit-464drift, 2026-10-30 WORK fire (Daedalus).
//
// Grades this unit's four cripple arms against the cripple map in PRE-REGISTRATION.md §4.
//
// IT GRADES A DELTA AGAINST A MATCHED NO-CRIPPLE DRIVE, not an absolute red list. Found
// while building: three of this instrument's gates (GCTRL, GDRIFTBITE, GDRIFTREF) are all
// keyed on the same precondition — a readable control pair — so the arm that removes that
// precondition reddens all three and an absolute "reddens X and only X" claim is
// unachievable by construction. The matched pair isolates the arm: drive6 and drive9 are
// given IDENTICAL inputs and differ only in `--cripple`, so the difference of their red
// sets is the arm's effect and nothing else.
//
// The same shape in reverse: a cripple that makes a gate GREEN (must-blind) shows up as a
// REMOVAL from the red set. A gate that still reddens under its own cripple has not been
// shown to be doing the work.
//
// And one arm is graded at the REASON level, because its gate is SATURATED: GCONFORM is
// red under both keys on this population, so the verdict cannot tell the keys apart. The
// token the gate prints for which figure it read can.

import { readFileSync } from 'node:fs';

const out = (name) => {
  try {
    return readFileSync(`${name}.out`, 'utf8');
  } catch {
    return null;
  }
};

const redsOf = (text) => {
  if (text === null) return null;
  const line = text.split('\n').find((l) => l.startsWith('MAPVERDICT/'));
  if (line === undefined) return null;
  const m = line.match(/red=\[([^\]]*)\]/);
  if (m === null) return null;
  return m[1] === '' ? [] : m[1].split(',');
};

/** The figure-name token GCONFORM prints for which under-report it read. */
const conformKey = (text) => {
  if (text === null) return null;
  const line = text.split('\n').find((l) => l.startsWith('GCONF '));
  if (line === undefined) return null;
  const m = line.match(/\b(underReportedArmCaused|underReported) = (\d+) cell\(s\): membership (\d+) .*?\+ tokens (\d+)/);
  return m === null ? null : { key: m[1], cells: Number(m[2]), membership: Number(m[3]), tokens: Number(m[4]) };
};

/** The count GMUST says it flagged, which the blind arm still prints while going green. */
const mustFlagged = (text) => {
  if (text === null) return null;
  const line = text.split('\n').find((l) => l.startsWith('GMUST '));
  if (line === undefined) return null;
  const m = line.match(/would have flagged (\d+) |(\d+) MUST field\(s\) fail/);
  if (m === null) return line.includes('EXEMPT') ? 0 : null;
  return Number(m[1] ?? m[2]);
};

// The cripple map from PRE-REGISTRATION.md §4, transcribed here as the EXPECTATION side.
// `addsRed` / `removesRed` are deltas against the matched no-cripple drive named in `vs`.
const MAP = [
  {
    arm: 'drift-blind',
    drive: 'drive5.cripple-drift-blind',
    vs: 'drive1.his-six-arms-with-control',
    addsRed: ['GDRIFTBITE'],
    removesRed: [],
    pred: 'P8',
  },
  {
    arm: 'control-fallback',
    drive: 'drive6.cripple-control-fallback',
    vs: 'drive9.no-control-baseline',
    addsRed: ['GDRIFTREF'],
    removesRed: [],
    pred: 'P9',
  },
  {
    arm: 'conform-raw',
    drive: 'drive7.cripple-conform-raw',
    vs: 'drive2.v2map-with-control',
    addsRed: [],
    removesRed: [],
    pred: 'P10 — SATURATED: graded at the reason level below, not at the verdict',
  },
  {
    arm: 'must-blind',
    drive: 'drive8.cripple-must-blind',
    vs: 'drive3.v2map-stamp-stripped',
    addsRed: [],
    removesRed: ['GMUST'],
    pred: 'P11',
  },
];

const sorted = (a) => [...a].sort().join(',');
let bad = 0;
console.log('=== grade-arms.mjs — cripple arms graded as a DELTA against a matched no-cripple drive ===');
console.log('');
for (const row of MAP) {
  const a = redsOf(out(row.vs));
  const b = redsOf(out(row.drive));
  if (a === null || b === null) {
    console.log(`ARM ${row.arm.padEnd(18)} REFUSED — a recording is missing or has no MAPVERDICT line`);
    bad += 1;
    continue;
  }
  const added = b.filter((x) => !a.includes(x));
  const removed = a.filter((x) => !b.includes(x));
  const okAdd = sorted(added) === sorted(row.addsRed);
  const okRem = sorted(removed) === sorted(row.removesRed);
  const ok = okAdd && okRem;
  if (!ok) bad += 1;
  console.log(
    `ARM ${row.arm.padEnd(18)} ${ok ? 'MATCH' : 'MISS '}  vs ${row.vs}`
    + `\n    predicted  adds=[${sorted(row.addsRed)}] removes=[${sorted(row.removesRed)}]`
    + `\n    measured   adds=[${sorted(added)}] removes=[${sorted(removed)}]`
    + `\n    red sets   no-cripple=[${sorted(a)}]  arm=[${sorted(b)}]   (${row.pred})`
  );
}

// --- The reason-level grade for the saturated gate.
console.log('');
const base = conformKey(out('drive2.v2map-with-control'));
const raw = conformKey(out('drive7.cripple-conform-raw'));
if (base === null || raw === null) {
  console.log('CONFKEY REFUSED — a GCONF detail line is missing');
  bad += 1;
} else {
  const distinct = base.key !== raw.key && (base.cells !== raw.cells || base.membership !== raw.membership);
  if (!distinct) bad += 1;
  console.log(
    `CONFKEY ${distinct ? 'MATCH' : 'MISS '} the two keys are distinguishable at the reason level though the verdict is saturated:`
    + `\n    cured   key=${base.key} cells=${base.cells} membership=${base.membership} tokens=${base.tokens}`
    + `\n    cripple key=${raw.key} cells=${raw.cells} membership=${raw.membership} tokens=${raw.tokens}`
  );
}

// --- The must-blind arm must go green WHILE STILL PRINTING the count it declined to act
// on. A cripple that also hides the figure is indistinguishable from a clean population.
const blindCount = mustFlagged(out('drive8.cripple-must-blind'));
const strictCount = mustFlagged(out('drive3.v2map-stamp-stripped'));
const sameFigure = blindCount !== null && blindCount === strictCount && blindCount > 0;
if (!sameFigure) bad += 1;
console.log(
  `MUSTFIG ${sameFigure ? 'MATCH' : 'MISS '} must-blind prints the same flagged count it goes green on:`
  + ` strict=${strictCount} blind=${blindCount}`
);

console.log('');
console.log(`ARMVERDICT/${bad > 0 ? 1 : 0} ${bad === 0 ? 'ok' : 'RED'} rows=${MAP.length + 2} mismatched=${bad}`);
process.exit(bad > 0 ? 1 : 0);
