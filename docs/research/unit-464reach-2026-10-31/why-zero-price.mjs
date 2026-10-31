#!/usr/bin/env node
// why-zero-price.mjs — unit-464reach, 2026-10-31 START fire (Theseus).
//
// Two loose ends from priceA/priceB, both turned from inference into measurement.
//
// (1) P6's anchor list was HAND-TYPED and two of its six entries (`GCOMPLETE`, `GCONFORM`)
//     are not prefixes the checker prints, so P6 refused on my own guess rather than on a
//     disagreement. Re-run with the anchors DERIVED from the checker's own stdout.
//
// (2) The cure is a no-op on V22-MAP.md. The REASON is so far inference: that the 19 names
//     the cure exposes are not in the arm's EMITTED set, so wider map-side reach intersects
//     nothing. Measured here instead of asserted.

import { readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const HIS_DIR = '../unit-464authored-2026-10-31';
const CHECKER_PATH = 'docs/research/unit-464mapkey-2026-10-30/grade-filed-maps.mjs';
const REPO = '../../..';
const BASELINE_REV = readFileSync('baseline.rev', 'utf8').trim();
const BOUNDARY = '(?:^|\\s)';
const CURED_BOUNDARY = '(?:^|[^A-Za-z0-9_.])';

// --- Readers sliced from the live checker, exactly as reach-census.mjs does.
const checkerSrc = spawnSync('git', ['-C', REPO, 'show', `${BASELINE_REV}:${CHECKER_PATH}`], {
  encoding: 'utf8',
  stdio: ['ignore', 'pipe', 'pipe'],
  maxBuffer: 64 * 1024 * 1024,
}).stdout;

const sliceFn = (anchor, name) => {
  const lines = checkerSrc.split('\n');
  const starts = lines.map((l, i) => (l === anchor ? i : -1)).filter((i) => i !== -1);
  if (starts.length !== 1) {
    console.log(`SLICE REFUSED ${name}: anchor occurs ${starts.length}x`);
    process.exit(2);
  }
  let end = -1;
  for (let j = starts[0] + 1; j < lines.length; j += 1) if (lines[j] === '};') { end = j; break; }
  if (end === -1) { console.log(`SLICE REFUSED ${name}: no terminator`); process.exit(2); }
  return lines.slice(starts[0], end + 1).join('\n');
};
const tokText = sliceFn('const tokensOf = (payload) => {', 'tokensOf');
const secText = sliceFn('const sectionFor = (mapText, armName) => {', 'sectionFor');
if (tokText.split(BOUNDARY).length - 1 !== 1) {
  console.log('SLICE REFUSED: boundary not present exactly once');
  process.exit(2);
}
// eslint-disable-next-line no-new-func
const tokensOf = new Function(`"use strict";\n${tokText}\nreturn tokensOf;`)();
// eslint-disable-next-line no-new-func
const tokensOfWide = new Function(
  `"use strict";\n${tokText.replace(BOUNDARY, CURED_BOUNDARY)}\nreturn tokensOf;`,
)();
// eslint-disable-next-line no-new-func
const sectionFor = new Function(`"use strict";\n${secText}\nreturn sectionFor;`)();

// ---------------------------------------------------------------------------
// (1) P6 RESTATED on anchors DERIVED from the checker's own stdout.
// ---------------------------------------------------------------------------
const uncured = readFileSync('drive4.scratch-uncured.out', 'utf8');
const his = readFileSync(`${HIS_DIR}/drive1.out`, 'utf8');

// The anchor set is every gate line the CHECKER ITSELF prints in his committed recording,
// plus MAPVERDICT. Derived, not typed, so a gate I have never heard of is still compared
// and a gate I invent cannot refuse on its own absence.
const anchorsOf = (text) =>
  text
    .split('\n')
    .map((l) => (l.match(/^(MAPVERDICT|G[A-Z][A-Z0-9]*)\b/) ?? [])[1])
    .filter((x) => x !== undefined);
const derived = [...new Set(anchorsOf(his))].sort();
console.log(`P6ANCHORS derived from his committed drive1.out: ${derived.length} — [${derived.join(',')}]`);
const hand = ['MAPVERDICT', 'GTYPEDDEF', 'GTYPED', 'GSUBJ', 'GCOMPLETE', 'GCONFORM'];
const bogus = hand.filter((a) => !derived.includes(a));
console.log(
  `P6HANDCHECK my hand-typed list was [${hand.join(',')}] — ${bogus.length} of ${hand.length} ` +
    `are NOT printed by the checker at all: [${bogus.join(',')}]. That is why priceA's P6 refused.`,
);

const lineFor = (text, a) => text.split('\n').filter((l) => new RegExp(`^${a}\\b`).test(l));
let differ = 0;
let refused = 0;
for (const a of derived) {
  const m = lineFor(uncured, a);
  const h = lineFor(his, a);
  if (m.length === 0 || h.length === 0) {
    console.log(`P6R REFUSED ${a}: mine=${m.length} his=${h.length}`);
    refused += 1;
    continue;
  }
  const same = m.join('\n') === h.join('\n');
  if (!same) {
    differ += 1;
    console.log(`P6R RED ${a}`);
    console.log(`      his:  ${h.join(' | ')}`);
    console.log(`      mine: ${m.join(' | ')}`);
  }
}
// And the strongest form: the WHOLE stdout.
const whole = uncured === his;
console.log(
  `P6R ${differ === 0 && refused === 0 ? 'LANDS' : 'FAILS'} — ${derived.length} derived anchor(s), ` +
    `${differ} differ, ${refused} refused. WHOLE-STDOUT byte-identical to his committed ` +
    `drive1.out: ${whole} (${uncured.length}B vs ${his.length}B).`,
);

// ---------------------------------------------------------------------------
// (2) WHY the cure costs nothing on this map: measured.
// ---------------------------------------------------------------------------
const mapText = readFileSync(`${HIS_DIR}/V22-MAP.md`, 'utf8');
const sec = sectionFor(mapText, 't2-dir-only');
if (sec === null) { console.log('WHY REFUSED — sectionFor returned null'); process.exit(2); }
const live = new Set();
const wide = new Set();
for (const l of sec) {
  for (const k of tokensOf(l).keys()) live.add(k);
  for (const k of tokensOfWide(l).keys()) wide.add(k);
}
const exposed = [...wide].filter((n) => !live.has(n)).sort();

// EMITTED set: the tokens the arm recording actually publishes. Read with the UNCURED
// reader, because on the RECORDING side a payload is plain text and `(?:^|\s)` is correct
// there — that is the half of Daedalus's §3 that is not in doubt.
const ARM_REC = `${HIS_DIR}/../unit-464t2b-sat-2026-10-29/drive-cripple-t2-dir-only.out`;
const CLEAN_REC = `${HIS_DIR}/../unit-464t2b-sat-2026-10-29/drive2.clean.out`;
const emittedOf = (path) => {
  const out = new Set();
  for (const l of readFileSync(path, 'utf8').split('\n')) for (const k of tokensOf(l).keys()) out.add(k);
  return out;
};
const emittedArm = emittedOf(ARM_REC);
const emittedClean = emittedOf(CLEAN_REC);
const emitted = new Set([...emittedArm, ...emittedClean]);

const exposedAndEmitted = exposed.filter((n) => emitted.has(n));
console.log(
  `\nWHY  V22-MAP.md / t2-dir-only: live=${live.size} wide=${wide.size} ` +
    `exposed-by-the-cure=${exposed.length}`,
);
console.log(`     exposed names: [${exposed.join(',')}]`);
console.log(
  `     recordings emit ${emitted.size} distinct name(s) (arm ${emittedArm.size} ∪ clean ${emittedClean.size})`,
);
console.log(
  `WHY ${exposedAndEmitted.length === 0 ? 'CONFIRMS-ZERO' : 'REFUTES-ZERO'} — of the ${exposed.length} ` +
    `names the cure exposes on this map, ${exposedAndEmitted.length} are in the recordings' emitted ` +
    `set: [${exposedAndEmitted.join(',')}]`,
);
console.log(
  exposedAndEmitted.length === 0
    ? '     So the cure cannot move a typed-token figure HERE: every name it newly reaches is map\n' +
      '     vocabulary the cell never emits, and GTYPEDDEF is keyed on the intersection. The zero\n' +
      '     price is a property of THIS map, not of the cure.'
    : '     So the cure CAN move a typed-token figure here and the byte-identity needs another\n' +
      '     explanation — the intersection is non-empty.',
);
writeFileSync(
  'why-zero-price.json',
  `${JSON.stringify({ live: [...live].sort(), wide: [...wide].sort(), exposed, exposedAndEmitted, emitted: [...emitted].sort() }, null, 2)}\n`,
);
