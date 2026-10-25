// Round 454 — probe 0: WHY do Round 449's two reader slices come back NOT FOUND at HEAD?
//
// Context. Round 449's `resolve-the-variable-write-targets.mjs` exited 1 publishing nothing from
// commit `fd7c346d` (Round 450) until Round 454 repaired its row helpers. Reviving it exposed a
// SECOND, independent movement that the revival is the only reason anyone can see: its leg `W10`,
// which published `ok` in its own round's committed recordings
// (`drive15`/`drive16`/`drive21`/`drive22`, all `VERDICT/1 ok legs=10 red=[] refused=[]`),
// publishes `REF` at HEAD. The refusal reason inside the row is:
//
//     446 reader sliced: NOT FOUND   ·   448 reader sliced: NOT FOUND
//
// MY FIRST HYPOTHESIS WAS THAT MY ROUND 452 REPAIRS HAD REMOVED THE TWO ANCHORS. It had not —
// `grep -c` finds `const legLines = ` in 446 and `const legTokens = ` in 448 at HEAD, one each.
// So the slice fails further down its own pipeline, and this probe reads WHICH STEP, per reader,
// rather than letting me argue about it (memory: run the regex, don't reason about it).
//
// The slicer below is SLICED OUT OF 449's OWN SOURCE, not retyped — a divergence between my copy
// of his pipeline and his pipeline is what would make this probe lie (447/363/513). It is lifted
// by the `const sliceRe = ` anchor, brace-balanced, and evaluated with `stripSource` and `git`
// injected, so this probe runs HIS function.

import { execFileSync } from 'node:child_process';
import { stripSource } from '../../../scripts/lib/strip-source.mjs';

const ROOT = new URL('../../../', import.meta.url).pathname.replace(/\/$/, '');
const git = (...a) => execFileSync('git', ['-C', ROOT, ...a], {
  encoding: 'utf8', maxBuffer: 1 << 28, stdio: ['ignore', 'pipe', 'pipe'],
});

const REV = git('rev-parse', 'HEAD').trim();
const SUBJECT = 'docs/research/round449-instruments/resolve-the-variable-write-targets.mjs';

// ── Lift HIS slicer out of HIS source ────────────────────────────────────────────────────────────
const subjSrc = git('show', `${REV}:${SUBJECT}`);
const ANCHOR = 'const sliceRe = ';
const ai = subjSrc.indexOf(ANCHOR);
if (ai === -1) throw new Error(`probe0: anchor ${JSON.stringify(ANCHOR)} not in ${SUBJECT} at ${REV}`);
// Balance over the BLINDED text so a brace inside a regex literal or a string cannot end the scan
// (449's own §6 correction). The statement ends at the first `;` at depth 0 after the anchor.
const blindSubj = stripSource(subjSrc, true);
if (blindSubj.length !== subjSrc.length) throw new Error('probe0: stripSource did not preserve length');
let depth = 0;
let end = ai;
for (; end < blindSubj.length; end += 1) {
  const c = blindSubj[end];
  if ('(['.includes(c) || c === '{') depth += 1;
  else if (')]'.includes(c) || c === '}') depth -= 1;
  else if (c === ';' && depth === 0) break;
}
const slicerSrc = subjSrc.slice(ai, end);
// Gate the slice STRUCTURALLY rather than trusting that it looks right (memory: `sliced exactly
// once` does not pin the start anchor). It must start at the anchor, be a single arrow function,
// and contain the two pipeline steps this probe claims to be bisecting.
const SLICE_GATE = [
  ['starts at the anchor', slicerSrc.startsWith(ANCHOR)],
  ['anchor occurs exactly once in the subject', subjSrc.split(ANCHOR).length - 1 === 1],
  ['carries the indexOf step', slicerSrc.includes('src.indexOf(anchor)')],
  ['carries the stripSource step', slicerSrc.includes('stripSource(src, true)')],
  ['carries the regex-literal lift', slicerSrc.includes('.exec(stmt)')],
  ['carries the new Function compile', slicerSrc.includes('new Function')],
];
for (const [name, okk] of SLICE_GATE) {
  console.log(`  SLICE GATE  ${okk === true ? 'ok ' : 'RED'}  ${name}`);
  if (okk !== true) throw new Error(`probe0: slice gate "${name}" is not true — the lifted slicer is not his`);
}
// eslint-disable-next-line no-new-func
const sliceRe = new Function('git', 'REV', 'stripSource', `${slicerSrc}; return sliceRe;`)(git, REV, stripSource);

// ── His two call sites, read out of his source rather than retyped ───────────────────────────────
const CALLS = [...subjSrc.matchAll(/sliceRe\(\s*'([^']+)'\s*,\s*'([^']+)'\s*\)/g)]
  .map((m) => ({ rel: m[1], anchor: m[2] }));
if (CALLS.length !== 2) throw new Error(`probe0: expected 2 sliceRe call sites in his source, read ${CALLS.length}`);

// ── A bisection of his own pipeline, step by step, per reader ────────────────────────────────────
// Each step is reported for both readers AND for a known positive, so a step that answers the same
// way for everything is visible as vacuous rather than passing as a finding.
function bisect(rel, anchor) {
  const out = { rel, anchor };
  let src;
  try { src = git('show', `${REV}:${rel}`); } catch (e) { out.step = 'git show'; out.detail = String(e.message).split('\n')[0]; return out; }
  out.bytes = src.length;
  const i = src.indexOf(anchor);
  out.anchorFound = i !== -1;
  if (i === -1) { out.step = 'indexOf(anchor)'; return out; }
  out.anchorOccurrences = src.split(anchor).length - 1;
  const blind = stripSource(src, true);
  out.lengthPreserved = blind.length === src.length;
  let d = 0;
  let j = i;
  for (; j < blind.length; j += 1) {
    const c = blind[j];
    if ('(['.includes(c) || c === '{') d += 1;
    else if (')]'.includes(c) || c === '}') d -= 1;
    else if (c === ';' && d === 0) break;
  }
  const stmt = src.slice(i, j);
  out.stmtBytes = stmt.length;
  out.stmtFirstLine = stmt.split('\n')[0];
  out.stmtHitEof = j >= blind.length;
  const m = /(\/(?:[^/\\\n[]|\\.|\[(?:[^\]\\]|\\.)*\])+\/[gimsuy]*)/.exec(stmt);
  out.regexLifted = m === null ? null : m[1];
  if (m === null) { out.step = 'no regex literal in the statement span'; return out; }
  try {
    // eslint-disable-next-line no-new-func
    new Function(`return ${m[1]};`)();
    out.step = 'compiles — slice SUCCEEDS';
  } catch (e) { out.step = `new Function threw: ${String(e.message).split('\n')[0]}`; }
  return out;
}

// KNOWN POSITIVE for the bisection itself: 449's OWN source carries `const sliceRe = ` whose
// statement span demonstrably contains a regex literal (the lift above succeeded on it). If the
// bisector reported "no regex literal" for this too, every row would be a reader-failure artifact.
const ROWS = [
  { label: 'KP (449 itself)', ...bisect(SUBJECT, ANCHOR) },
  ...CALLS.map((c, n) => ({ label: `reader ${n + 1}`, ...bisect(c.rel, c.anchor) })),
];

console.log('');
console.log(`probe0 — why 449's two reader slices return null.  REV = ${REV}`);
console.log('');
for (const r of ROWS) {
  console.log(`${r.label}  ${r.rel}`);
  console.log(`    anchor ${JSON.stringify(r.anchor)} found=${r.anchorFound} occurrences=${r.anchorOccurrences ?? '-'}`);
  console.log(`    source ${r.bytes ?? '-'} B · stripSource length-preserved=${r.lengthPreserved ?? '-'}`);
  console.log(`    statement span ${r.stmtBytes ?? '-'} B · ran to EOF=${r.stmtHitEof ?? '-'}`);
  console.log(`    span first line: ${JSON.stringify(r.stmtFirstLine ?? null)}`);
  console.log(`    regex lifted: ${r.regexLifted === undefined ? '-' : JSON.stringify(r.regexLifted)}`);
  console.log(`    STEP REACHED: ${r.step}`);
  console.log('');
}

// ── Grade: his two readers must agree with the row he published, and the KP must NOT ─────────────
const kp = ROWS[0];
const readers = ROWS.slice(1);
const GATE = [
  ['the KP slice succeeds (so "no regex literal" is not this bisector answering no to everything)',
    kp.step === 'compiles — slice SUCCEEDS'],
  ['both readers are reached through a real `git show` at REV (no missing file)',
    readers.every((r) => typeof r.bytes === 'number')],
  ['both reader anchors are present at HEAD — so the NOT FOUND is NOT a vanished anchor',
    readers.every((r) => r.anchorFound === true)],
  ['both readers fail, which is what his row published',
    readers.every((r) => r.step !== 'compiles — slice SUCCEEDS')],
];
let red = 0;
console.log('GATE');
for (const [name, okk] of GATE) {
  console.log(`  ${okk === true ? 'ok ' : 'RED'}  ${name}`);
  if (okk !== true) red += 1;
}
console.log('');
console.log(`probe0 verdict: ${red === 0 ? 'ok' : `RED (${red})`} · failing step, reader 1: ${readers[0].step} · reader 2: ${readers[1].step}`);
if (red !== 0) process.exitCode = 1;
