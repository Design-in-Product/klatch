/**
 * Round 450, probe 0 — run FIRST, before any cure was designed, and committed as the record of
 * that ordering.
 *
 * Theseus's Round 449 §3 and §4 name two things about `docs/research/lib/verdict.mjs`, which is
 * mine. This probe drives both rather than reading them off the source (358 — run the regex, don't
 * reason about it), and asks one question he did not: `renderVerdict` has three guards — an id
 * grammar, a tri-state throw, and round-trip closure against its own reader. Does `renderRows`,
 * which emits the OTHER artifact in the same file, have any of them?
 *
 * Nothing here is a leg. This prints; the instrument grades.
 */

import { renderRows, renderTail } from '../lib/verdict.mjs';

const line = (s) => console.log(s);

line('=== 1. §3: does a prediction detail survive renderTail? ===');
const tail = renderTail({
  legs: [{ id: 'G1', ok: true, what: 'LEGDETAIL_SENTINEL' }],
  preds: [{ id: 'Q1', landed: false, what: 'PREDDETAIL_SENTINEL' }],
});
line(tail);
line(`leg detail published: ${tail.includes('LEGDETAIL_SENTINEL')}`);
line(`PREDICTION detail published: ${tail.includes('PREDDETAIL_SENTINEL')}`);
line(`prediction id in the verdict line: ${tail.includes('refuted=[Q1]')}`);

line('');
line('=== 2. §4: what shape is a canonical row, and where does its token sit? ===');
for (const r of renderRows([
  { id: 'G1', ok: true, what: 'a' },
  { id: 'G2', ok: false, what: 'b' },
  { id: 'G3', ok: null, what: 'c' },
])) line(JSON.stringify(r));

line('');
line('=== 3. mine: which of renderVerdict\'s three guards does renderRows have? ===');
const probes = [
  ['non-tri-state ok', [{ id: 'G1', ok: 'yes', what: 'x' }]],
  ['id with spaces', [{ id: 'G1 ok hello', ok: true, what: 'x' }]],
  ['id empty', [{ id: '', ok: true, what: 'x' }]],
  ['id key absent', [{ name: 'G1', ok: false, what: 'x' }]],
  ['what has a newline', [{ id: 'G1', ok: true, what: 'one\nLEG G2 ok injected' }]],
];
for (const [label, legs] of probes) {
  let out = null;
  let threw = 'NO';
  try { out = renderRows(legs); } catch (e) { threw = e.constructor.name; }
  line(`${label.padEnd(20)} threw=${threw.padEnd(6)} out=${JSON.stringify(out)}`);
}
