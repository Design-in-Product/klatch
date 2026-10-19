/**
 * Round 418 — grade §3 of `docs/intel/2026-10-19-sdk-bump-assessment.md`.
 *
 * Two questions, in this order, because the order is the point:
 *   1. Under Daedalus's OWN declared key, how many lines does the segment carry?
 *      (Reproduce their figures under their own key before correcting their count.)
 *   2. Does that key reach the class Klatch actually calls?
 *
 * The changelog is an argument, not a constant, and it is NOT written anywhere:
 * this instrument has no side effects on the reader's tree. Fetch it with
 *   node -e 'fetch("https://raw.githubusercontent.com/anthropics/anthropic-sdk-typescript/main/CHANGELOG.md").then(r=>r.text()).then(t=>require("fs").writeFileSync(process.argv[1],t))' <path>
 * then: node sec3-key-verbatim-then-widened.mjs <path>
 *
 * Every figure is gated. If any known positive or control fails, the process
 * exits non-zero WITHOUT printing a count — a printed self-test that gates
 * nothing is not a self-test.
 */
import fs from 'node:fs';

const CHANGELOG = process.argv[2];
if (!CHANGELOG || !fs.existsSync(CHANGELOG)) {
  console.log(`REFUSED — pass a changelog path as argv[2] (got ${JSON.stringify(CHANGELOG)}). See header.`);
  process.exit(2);
}
const lines = fs.readFileSync(CHANGELOG, 'utf8').split('\n');
console.log('changelog lines:', lines.length);

// ---------------------------------------------------------------- segment
// Same heading key as his instrument, for the same reason (two spellings).
const HEAD_RE = /^##\s+\[?(\d+\.\d+\.\d+)\]?/;
const heads = [];
lines.forEach((l, i) => { const m = HEAD_RE.exec(l); if (m) heads.push({ v: m[1], i }); });
const iLatest = heads.findIndex((h) => h.v === '0.135.0');
const iPin = heads.findIndex((h) => h.v === '0.122.0');
if (iLatest < 0 || iPin < 0) {
  console.log('REFUSED — an endpoint heading is missing; this changelog is not the one the round read');
  process.exit(1);
}
const lo = heads[iLatest].i, hi = heads[iPin].i;
const seg = [];
for (let i = lo; i < hi; i++) seg.push({ i, l: lines[i] });
console.log('segment lines:', seg.length, '(Round 417 published 427)');

function versionOf(i) { let v = null; for (const h of heads) { if (h.i <= i) v = h.v; else break; } return v; }

// ------------------------------------------------------- his key, verbatim
// Transcribed from the intel doc §3 parenthetical:
//   (key: `compaction|context_management|compact-2026|compact_2026|betas`)
const HIS = /compaction|context_management|compact-2026|compact_2026|betas/;

// KNOWN POSITIVES, as the literal source lines they occur in — not analogies.
// Each must occur in the file exactly once, or it is hand-typed and void.
// Sliced out of the fetched file with this instrument's own reader, then pasted
// verbatim — NOT retyped. My first draft hand-typed both commit hashes and got
// both wrong; the occurs==1 gate below is what caught it.
const KP_HIS = [
  "* **api:** compaction instructions replace the server's summarization prompt ([941aaea](https://github.com/anthropics/anthropic-sdk-typescript/commit/941aaea3ca9a42e00b1979f9eac8ca19ae9eb0dd))",
  "* **docs:** correct the compaction beta's parameter descriptions ([eb9abd2](https://github.com/anthropics/anthropic-sdk-typescript/commit/eb9abd200de3a13098a796fa8482f2764df6bd98))",
];
// A negative control: a line in the segment that must NOT read as in-surface.
const KP_NEG = '### Features';

let gateOk = true;
for (const kp of KP_HIS) {
  const occurs = lines.filter((l) => l === kp).length;
  const fires = HIS.test(kp);
  const ok = occurs === 1 && fires;
  console.log(`KP (slice, occurs==1 && key fires): occurs=${occurs} fires=${fires} ${ok ? 'OK' : 'FAIL'}  ${kp.slice(0, 72)}…`);
  if (!ok) gateOk = false;
}
console.log('KP negative (must refuse):', HIS.test(KP_NEG) === false ? 'OK (refused)' : 'FAIL (over-read)');
if (HIS.test(KP_NEG)) gateOk = false;

if (!gateOk) {
  console.log('VERDICT: KEY REFUSED — not printing a count from a key that fails its own known positives.');
  console.log('NOTE: a KP that no longer occurs exactly once means the changelog MOVED since Round 418;');
  console.log('      re-slice the KP out of the current file rather than loosening the key.');
  process.exit(1);
}

const bullet = (l) => /^\s*\*\s/.test(l);
const hisHits = seg.filter((x) => HIS.test(x.l));
console.log('\n=== HIS §3 KEY, VERBATIM, over the same segment ===');
console.log('matching lines:', hisHits.length, '| of which bullets:', hisHits.filter((x) => bullet(x.l)).length);
for (const x of hisHits) console.log('  ', versionOf(x.i), '|', x.l.trim().slice(0, 120));
console.log('PUBLISHED IN §3:', 7, '| HIS OWN KEY RETURNS:', hisHits.length,
  hisHits.length === 7 ? '(agree)' : '(DISAGREE — §3 declares no filter)');

const dropped = hisHits.filter((x) => /\*\*(docs|internal):\*\*/.test(x.l));
console.log('of the difference, lines scoped docs:/internal::', dropped.length);
for (const x of dropped) console.log('   dropped:', versionOf(x.i), '|', x.l.trim().slice(0, 110));

// ------------------------------------------------------- the widened key
// Klatch's call site is `beta.messages.stream(...)`, and `beta.messages.stream`
// returns a BetaMessageStream (resources/beta/messages/messages.js). Klatch
// drives that object directly: `stream.on('compaction', …)`, `stream.finalMessage()`.
// So the class, not only the feature name, is in the blast radius.
const WIDER = {
  'BetaMessageStream (the class Klatch drives)': /BetaMessageStream/,
  'streaming: scope': /^\s*\*\s+\*\*streaming:\*\*/,
  'context management, any separator': /context[ _-]?management/i,
  'context editing, any separator': /context[ _-]?editing/i,
};
// CONTROL that GATES: each widened key must fire on a real slice of this file,
// or it is a key with no known positive and its zero means nothing.
const WIDE_KP = {
  'BetaMessageStream (the class Klatch drives)': '* **streaming:** tolerate unknown event types in MessageStream and BetaMessageStream',
  'streaming: scope': '* **streaming:** tolerate unknown event types in MessageStream and BetaMessageStream',
  'context management, any separator': null,   // UNMODELLED: no slice known; its 0 is NOT a reading
  'context editing, any separator': null,      // UNMODELLED: same
};
console.log('\n=== WIDENED KEYS — control first ===');
let wideGate = true;
for (const [name, re] of Object.entries(WIDER)) {
  const kp = WIDE_KP[name];
  if (kp === null) { console.log(`  CONTROL ${name}: UNMODELLED — no slice carries this shape, so its count is a floor, not a reading`); continue; }
  const occurs = lines.filter((l) => l.trim() === kp.trim()).length;
  const ok = occurs >= 1 && re.test(kp);
  console.log(`  CONTROL ${name}: KP occurs=${occurs} fires=${re.test(kp)} ${ok ? 'OK' : 'FAIL'}`);
  if (!ok) wideGate = false;
}
if (!wideGate) { console.log('VERDICT: REFUSED — a widened key has no known positive in this file'); process.exit(1); }

let extra = new Set();
for (const [name, re] of Object.entries(WIDER)) {
  const hits = seg.filter((x) => re.test(x.l));
  const missed = hits.filter((x) => !HIS.test(x.l));
  console.log(`\n  ${name}: ${hits.length} in segment, ${missed.length} INVISIBLE to his key`);
  for (const x of missed) { extra.add(x.i); console.log('     ', versionOf(x.i), '|', x.l.trim().slice(0, 125)); }
}
console.log('\ndistinct segment lines his §3 key cannot reach:', extra.size);

console.log('\nSUMMARY: §3 published 7 |', 'his own key returns', hisHits.length, '|',
  dropped.length, 'of the difference are docs:/internal:-scoped |',
  extra.size, 'further segment lines are invisible to that key, of which',
  seg.filter((x) => /BetaMessageStream/.test(x.l)).length, 'name BetaMessageStream itself');
