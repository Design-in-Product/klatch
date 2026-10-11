/**
 * The characterisation-test sweep, driven.
 *
 * Predicate (Theseus Round 362 §3, narrowed): a COMMENT in a test/probe file carrying an explicit
 * contrast between what the test asserts and what it would prefer.
 *
 * Known positive: the REAL pre-re-aim text of the Round 247 characterisation comment, extracted
 * from `2485ba99^` — not an analogy to it. Graded as a CONTROL, and the figure REFUSES if the
 * control does not pass, so a printed number cannot outlive a broken detector.
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import {
  population,
  commentSpans,
  commentBlocks,
  commentProse,
  markersIn,
  markersInRaw,
  MARKERS,
} from './characterisation-sweep-lib.mjs';

const ROOT = process.cwd();
const KP_FILE = 'packages/server/src/__tests__/round247-the-exit-code-is-driven-not-read.test.ts';
const KP_SENTENCE = /an inapplicable entry is silently dropped when code is 1/;

const kpSrc = execFileSync('git', ['show', `2485ba99^:${KP_FILE}`], {
  encoding: 'utf8',
  maxBuffer: 1 << 28,
  cwd: ROOT,
});

// ── CONTROL, graded before any live figure prints ──
const kpBlocks = commentBlocks(kpSrc);
const kpTarget = kpBlocks.find((b) => KP_SENTENCE.test(commentProse(b.text)));
const kpMarkers = kpTarget ? markersIn(kpTarget.text) : [];

// The counterfactual: the SAME predicate against per-line spans, which is the version that cannot
// represent a marker straddling a wrap.
const kpPerLine = commentSpans(kpSrc).find((s) => KP_SENTENCE.test(commentProse(s.text)));
const kpPerLineMarkers = kpPerLine ? markersIn(kpPerLine.text) : [];

const CONTROL = {
  'KP block found': Boolean(kpTarget),
  'KP block spans >1 line': Boolean(kpTarget && kpTarget.spans > 1),
  'KP carries shape-rather-than-intent': kpMarkers.includes('shape-rather-than-intent'),
  'per-line version MISSES it (counterfactual bites)':
    !kpPerLineMarkers.includes('shape-rather-than-intent'),
};

console.log('── CONTROL (graded before any live figure prints) ──');
console.log(`KP: ${KP_FILE} @ 2485ba99^`);
if (kpTarget) {
  console.log(`  block at line ${kpTarget.line}, ${kpTarget.spans} span(s) joined`);
  console.log(`  prose: ${JSON.stringify(commentProse(kpTarget.text))}`);
  console.log(`  markers (block)   : ${kpMarkers.join(', ') || '(none)'}`);
  console.log(`  markers (per-line): ${kpPerLineMarkers.join(', ') || '(none)'}`);
}
for (const [k, v] of Object.entries(CONTROL)) console.log(`  ${v ? 'ok  ' : 'FAIL'} ${k}`);

const controlOk = Object.values(CONTROL).every((v) => v === true);
console.log(`CONTROL GRADE: ${controlOk}`);
// Gate on `!== true`, not on truthiness: a missing key scores as `undefined` and must refuse.
if (controlOk !== true) {
  console.log('\nCONTROL FAILED — refusing to print a live figure. Exit 2.');
  process.exit(2);
}

// ── LIVE ──
const pop = population(ROOT);
const rows = [];
const perLineKeys = new Set();
const rawKeys = new Set();
let blockTotal = 0;
let spanTotal = 0;

for (const f of pop.files) {
  const src = fs.readFileSync(path.join(ROOT, f), 'utf8');
  const blocks = commentBlocks(src);
  blockTotal += blocks.length;
  spanTotal += commentSpans(src).length;

  for (const b of blocks) {
    const m = markersIn(b.text);
    if (m.length > 0) {
      rows.push({ file: f, line: b.line, spans: b.spans, markers: m, prose: commentProse(b.text) });
    }
    if (markersInRaw(b.text).length > 0) rawKeys.add(`${f}:${b.line}`);
  }
  for (const s of commentSpans(src)) {
    if (markersIn(s.text).length > 0) perLineKeys.add(`${f}:${s.line}`);
  }
}

const byMarker = new Map();
for (const r of rows) for (const m of r.markers) byMarker.set(m, (byMarker.get(m) ?? 0) + 1);

console.log('\n── LIVE ──');
console.log(`population     : ${pop.files.length} files (${pop.tests.length} test, ${pop.probes.length} probe)`);
console.log(`comment spans  : ${spanTotal}`);
console.log(`comment blocks : ${blockTotal}`);
console.log(`blocks matching: ${rows.length}`);
console.log(`files touched  : ${new Set(rows.map((r) => r.file)).size}`);
for (const [k] of MARKERS) console.log(`  ${k.padEnd(26)} ${byMarker.get(k) ?? 0}`);

console.log('\n── COUNTERFACTUALS (population) ──');
console.log(`block-joined, normalised : ${rows.length}`);
console.log(`raw (no prose normalise) : ${rawKeys.size}`);
console.log(`shape-rather-than-intent members, block-joined: ${rows.filter((r) => r.markers.includes('shape-rather-than-intent')).length}`);

fs.writeFileSync(path.join(ROOT, 'docs/research/round370-instruments/characterisation-sweep-rows.json'), JSON.stringify(rows, null, 2));
console.log(`\nrows -> docs/research/round370-instruments/characterisation-sweep-rows.json`);
