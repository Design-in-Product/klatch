// unit-494lineendingreach — POST-HOC probe. Written AFTER the arm ran and all six registered
// predictions came back HIT, which is itself the reason it exists: six of six HIT means I
// registered nothing that could have bitten me, and the arm's own post-hoc leg said so in its
// output — "a plant APPENDED cannot displace an earlier match, so an unchanged figure here is a
// property of position, not of safety."
//
// Not dressed as a forecast. The expectation below is recorded before the drive, and the probe is
// committed before it runs, so the direction is on the record either way:
//
//   EXPECTATION (stated 19:5x PST, before driving): the hazard `unit-493ceilingreplication` §4
//   names is reachable, and POSITION is the whole of what closes it today. A line ending in a bare
//   verdict label, planted immediately BEFORE a published line whose first token is a bare count,
//   makes `/GUARDED\s+(\d+)/` return that count instead of 3 — because `\s+` crosses the newline
//   and the planted ending is now the FIRST match. I expect at least one such position to exist in
//   the live publication, and therefore at least one non-3 figure below.
//
//   If every position returns 3, the label direction is closed by something stronger than
//   adjacency and §4's "coincidence" reading is too pessimistic — which would be a finding against
//   my own framing of the ask.
//
// R1: plants happen in copies of the capture held in this unit's directory. The gate is read and
// driven, never edited.
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const capture = readFileSync(join(HERE, 'drive1.gate-plain.out'), 'utf8');
const lines = capture.split('\n');
const unanchored = /GUARDED\s+(\d+)/;
const PLANT = '  and the three rows above are MARKED, GUARDED and UNGUARDED';

// The positions are DERIVED from the publication, not typed: every line whose first
// whitespace-delimited token is a bare count. Hand-typing the positions would make this a test of
// my reading of the capture rather than of the capture.
const countLeading = [];
lines.forEach((l, i) => {
  if (/^\s*\d+(\s|$)/.test(l)) countLeading.push(i);
});

const out = [];
out.push('unit-494lineendingreach — posthoc: does POSITION decide whether the hazard bites?');
out.push('');
out.push(`published lines: ${lines.length - (lines[lines.length - 1] === '' ? 1 : 0)}`);
out.push(`lines whose first token is a bare count: ${countLeading.length}`);
for (const i of countLeading) out.push(`      line ${i + 1}: ${lines[i].slice(0, 72)}`);
out.push('');
out.push(`baseline — /GUARDED\\s+(\\d+)/ over the untouched capture: ${capture.match(unanchored)?.[1]}`);
out.push('');
out.push('one label-ending line planted immediately BEFORE each count-leading line:');
const moved = [];
for (const i of countLeading) {
  const planted = [...lines.slice(0, i), PLANT, ...lines.slice(i)].join('\n');
  const got = planted.match(unanchored)?.[1] ?? 'null';
  if (got !== '3') moved.push({ line: i + 1, got });
  out.push(`      plant before line ${String(i + 1).padStart(3)} → reads ${got}`
    + `${got === '3' ? '' : '   ← FIGURE MOVED'}`);
  writeFileSync(join(HERE, `plant-before-line-${i + 1}.out`), planted);
}
out.push('');
out.push(`positions at which one planted line moves the published figure: ${moved.length} of ${countLeading.length}`);
if (moved.length) {
  out.push(`EXPECTATION HELD. Widest move: 3 → ${moved.map((m) => m.got).sort((a, b) => b - a)[0]}`);
} else {
  out.push('EXPECTATION FAILED — every position returns 3; the label direction is closed by more');
  out.push('than adjacency, and my framing of the ask was too pessimistic.');
}
console.log(out.join('\n'));
