// unit-464frozen — DECLARED POST-HOC probe, written after drive2 and before RESULTS.
//
//   node docs/research/unit-464frozen-2026-11-05/probe-notes.mjs
//
// Not registered in PRE-REGISTRATION.md. It exists because drive2 printed, on A4ECHO, a RED GHKECHO
// whose note still asserted "the figure does not move" — the same drifting-assertive-note defect
// Daedalus repaired in GENTRY this morning, in a leg he did not repair. The question this probe
// answers mechanically rather than by eye: for each of the 6 legs, how much of the note is a
// MEASUREMENT (varies with the data) and how much is a CONSTANT clause that prints unchanged on the
// arm where that leg's own predicate failed?
//
// Method: read drive2.arms.out (the recording, not a re-run), collect each leg's note per arm, and
// for any leg that has both an `ok` note and a `RED` note, report the character-level common PREFIX
// and common SUFFIX of the two. A long common suffix on a leg that changed verdict is a clause that
// cannot report its own failure. [[feedback_a_legs_reason_string_drifts_false_while_its_predicate_stays_true]]
import { readFileSync } from 'node:fs';

// Default is the UNTRUNCATED recording. Pass the truncated `drive2.arms.out` as argv[2] to reproduce
// the contaminated first run that is kept in `probe-notes.out`.
const REC = process.argv[2] ?? 'docs/research/unit-464frozen-2026-11-05/drive3.arms-untruncated.out';
const text = readFileSync(REC, 'utf8');

const byLeg = new Map();
let arm = null;
for (const line of text.split('\n')) {
  const a = line.match(/^== (\S+)/);
  if (a) { arm = a[1]; continue; }
  const m = line.match(/^ {6}(ok|RED) +(G[A-Z0-9]+) {2,}(.*)$/);
  if (!m || !arm) continue;
  if (!byLeg.has(m[2])) byLeg.set(m[2], []);
  byLeg.get(m[2]).push({ arm, verdict: m[1], note: m[3] });
}

const common = (a, b, dir) => {
  const n = Math.min(a.length, b.length);
  let k = 0;
  while (k < n && (dir === 1 ? a[k] === b[k] : a[a.length - 1 - k] === b[b.length - 1 - k])) k += 1;
  return dir === 1 ? a.slice(0, k) : a.slice(a.length - k);
};

console.log(`recording ${REC} — ${byLeg.size} legs × ${[...byLeg.values()][0].length} arms`);
console.log('');
let constTail = 0;
for (const [leg, rows] of byLeg) {
  const okRow = rows.find((r) => r.verdict === 'ok');
  const redRow = rows.find((r) => r.verdict === 'RED');
  if (!okRow || !redRow) { console.log(`   ${leg.padEnd(11)} NO PAIR — verdicts seen: ${[...new Set(rows.map((r) => r.verdict))].join('/')}`); continue; }
  const pre = common(okRow.note, redRow.note, 1);
  const suf = common(okRow.note, redRow.note, -1);
  // Clamped. The first form summed prefix and suffix unclamped, and for GHKECHO — whose two notes
  // are byte-IDENTICAL — prefix and suffix are each the whole note, so it printed "identical 336
  // (200%)". A percentage over 100 is a double count, not a measurement.
  // [[feedback_add_up_the_numbers_in_your_own_sentence]]
  const longest = Math.max(okRow.note.length, redRow.note.length);
  const shared = Math.min(pre.length + suf.length, longest);
  const pct = Math.round((100 * shared) / longest);
  if (suf.length > 40) constTail += 1;
  console.log(`   ${leg.padEnd(11)} ok@${okRow.arm.padEnd(10)} RED@${redRow.arm.padEnd(10)} note ${okRow.note.length}/${redRow.note.length} bytes · identical ${shared} (${pct}%)`);
  console.log(`      common PREFIX (${pre.length}): ${JSON.stringify(pre.slice(0, 90))}`);
  console.log(`      common SUFFIX (${suf.length}): ${JSON.stringify(suf.slice(-150))}`);
  console.log(`      the RED note's own words:     ${JSON.stringify(redRow.note.slice(0, 200))}`);
  console.log('');
}
console.log(`${constTail} of ${byLeg.size} legs print a common suffix of more than 40 bytes across their own ok/RED pair`);
