#!/usr/bin/env node
// mint-kp.mjs — unit-464absorb, 2026-10-31 WORK fire (Daedalus).
//
// Mints the known positive and its control from `V22-MAP.md`. Both are DERIVED, with gated
// anchors; neither is hand-authored, because a hand-typed map is not a slice and two
// hand-typed maps can differ in more than the one thing they are supposed to differ in.
//
// The inserted span is SLICED from the arm recording, so it is a real captured string.
//
// The two maps differ in exactly one thing: which member's row the identical inserted bytes
// land on. Asserted below, by diffing the two minted maps against each other and requiring
// the inserted text to be byte-identical on both sides.

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';

const HERE = dirname(new URL(import.meta.url).pathname);
const SRC = resolve(HERE, '../unit-464authored-2026-10-31/V22-MAP.md');
const RECORDING = resolve(HERE, '../unit-464t2b-sat-2026-10-29/drive-cripple-t2-dir-only.out');

const map = readFileSync(SRC, 'utf8');

// --- The span, SLICED. Required to occur in the recording; the name and value are taken
// from the match and not retyped.
const rec = readFileSync(RECORDING, 'utf8');
const spanHits = [...rec.matchAll(/(?:^|\s)(pinDistance)=(\S+)/g)];
if (spanHits.length === 0) {
  console.error('FATAL no `pinDistance=` occurrence in the arm recording to slice');
  process.exit(2);
}
const NAME = spanHits[0][1];
const VALUE = spanHits[0][2].replace(/[;,.]$/, '');
const SPAN = '`' + NAME + '=' + VALUE + '`';
console.log(`SLICE  span sliced from ${RECORDING.replace(/.*\/docs\//, 'docs/')}: ${SPAN}`);
console.log(`       (${spanHits.length} occurrence(s) of \`${NAME}=\` in the recording; first taken)`);

// --- The two destinations. Each anchor is the START of the member's row and must occur once.
const DESTS = [
  { file: 'KP-MISATTRIBUTED-MAP.md', anchor: '- **`P7`** —', member: 'P7', emits: false },
  { file: 'KP-ALIGNED-MAP.md', anchor: '- **`T2b`** —', member: 'T2b', emits: true },
];

// The sentence is identical in both; only the row it is appended to differs. Appended at the
// END of the row's line, so no other line in the file moves.
const SENTENCE = ` Cross-reference minted by unit-464absorb: ${SPAN}.`;

const minted = {};
for (const d of DESTS) {
  const n = map.split(d.anchor).length - 1;
  console.log(`ANCHOR ${d.file.padEnd(26)} "${d.anchor}" occurrences=${n}`);
  if (n !== 1) {
    console.error(`FATAL anchor for ${d.file} occurs ${n} time(s), need exactly 1 — nothing written`);
    process.exit(2);
  }
  const lines = map.split('\n');
  const i = lines.findIndex((l) => l.startsWith(d.anchor));
  if (i < 0) {
    console.error(`FATAL anchor for ${d.file} is not at the start of any line`);
    process.exit(2);
  }
  const out = lines.slice();
  out[i] = out[i] + SENTENCE;
  minted[d.file] = out.join('\n');
  writeFileSync(resolve(HERE, d.file), minted[d.file]);
  console.log(`       -> ${d.file}  line ${i + 1} extended by ${SENTENCE.length} chars (${d.member}, emits=${d.emits})`);
}

// --- The one-thing-differs assertion. Both minted files must differ from the source by
// exactly one line, must be the SAME length, and the appended text must be byte-identical.
const srcLines = map.split('\n');
let fatal = false;
for (const d of DESTS) {
  const got = minted[d.file].split('\n');
  const differing = got.filter((l, i) => l !== srcLines[i]);
  const ok = got.length === srcLines.length && differing.length === 1 && differing[0].endsWith(SENTENCE);
  console.log(
    `MINTDIFF ${d.file.padEnd(26)} lines=${got.length}/${srcLines.length} ` +
      `differing=${differing.length} endsWithSpan=${differing.length === 1 && differing[0].endsWith(SENTENCE)} -> ${ok ? 'ok' : 'FATAL'}`,
  );
  if (!ok) fatal = true;
}
const a = minted['KP-MISATTRIBUTED-MAP.md'].split('\n');
const b = minted['KP-ALIGNED-MAP.md'].split('\n');
const between = a.map((l, i) => (l === b[i] ? null : i + 1)).filter((x) => x !== null);
console.log(`MINTPAIR the two minted maps differ at ${between.length} line(s): [${between.join(',')}] — expected exactly 2 (one row each)`);
if (between.length !== 2) fatal = true;
if (fatal) {
  console.error('FATAL the minted pair does not differ in exactly one thing — not offered as a KP');
  process.exit(2);
}
console.log('MINT ok  both maps derived from V22-MAP.md, identical inserted bytes, destination the only variable');
