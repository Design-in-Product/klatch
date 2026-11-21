#!/usr/bin/env node
/**
 * unit-498closureatthegate — arm for P1, P2, P3, P4.
 *
 * Daedalus's 11-21 §3 asks this seat to check whether the widened key
 * `line.trimEnd().endsWith(v)` is the closure of the hazard's `\s`, or one character narrower. He
 * answers it with a derived 25-character set and 0 disagreements between that key and
 * `/LABEL\s*$/` — measured between two JavaScript predicates. His GATE leg (the P2/P3 matrix in
 * `arm-padded-closure.mjs`) drives the real sliced `publish()` over 4 padded spellings.
 *
 * This arm closes the granularity gap in both directions:
 *
 *  - P1/P2 widen the predicate-level claim: the set is re-derived over the FULL code point range
 *    with a `u`-flagged reader (his scope is U+0000..U+FFFF), and the equality is tested on the
 *    BARE characters rather than with a verdict label glued on, over all 1,114,112 code points.
 *    A positive control runs with it, because 0 disagreements is also what two always-false
 *    predicates produce — which is this unit's P5.
 *  - P3/P4 widen the GATE-level claim from 4 members to all 25, against the real sliced
 *    `publish()`, and separate the cells that GRADE the widening from the cells that merely agree
 *    with it.
 *
 * Method is his, deliberately: the gate body is sliced with the shared slicer
 * (`scripts/lib/decl-body.mjs` → `bodyOf`), asserted byte-identical to a span of the real file with
 * its start anchor pinned, and the counterfactual produced by ONE substitution whose match count is
 * asserted — in whichever direction the tree happens to be in, so this harness does not expire the
 * moment the key is changed again (his §6).
 *
 * Every plant character is written into the harness source as an explicit `\uXXXX` escape rather
 * than relying on `JSON.stringify` to survive the round trip: U+2028 and U+2029 are emitted RAW by
 * `JSON.stringify`, and a harness whose plant depends on the JSON-superset grammar is measuring the
 * grammar. No byte figure in this file is a `.length`; byte figures are `Buffer.byteLength` and
 * code-unit figures say so.
 *
 * This file hand-rolls no brace-balance slicer; it imports the shared one.
 */
import { readFileSync, writeFileSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { bodyOf } from '../../../scripts/lib/decl-body.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '../../..');
const GATE = resolve(ROOT, 'scripts/verify-decl-body-slicers.mjs');
const SCRATCH = resolve(ROOT, 'scripts/scratch-unit498-arm.mjs'); // scripts/ depth, untracked

/* ---------------------------------------------------------------- slice provenance (his method) */
const src = readFileSync(GATE, 'utf8');
const body = bodyOf(src, 'publish');
if (typeof body !== 'string' || body.length === 0) throw new Error('arm: publish() body not sliced');
const occurrences = src.split(body).length - 1;
const startOffset = src.indexOf(body);
const headOffset = src.indexOf('function publish(sink, args)');
if (occurrences !== 1) throw new Error(`arm: publish() body appears ${occurrences}x - span ambiguous`);
if (startOffset < headOffset) throw new Error('arm: sliced span starts BEFORE the declaration head');
if (src.slice(startOffset, startOffset + body.length) !== body) {
  throw new Error('arm: slice is not byte-identical to the file span');
}

const PRE_KEY = 'LABELS.find((v) => line.endsWith(v))';
const POST_KEY = 'LABELS.find((v) => line.trimEnd().endsWith(v))';
const preHits = body.split(PRE_KEY).length - 1;
const postHits = body.split(POST_KEY).length - 1;
if (preHits + postHits !== 1) {
  throw new Error(`arm: body carries PRE x${preHits} and POST x${postHits}; exactly one must be present`);
}
const liveForm = postHits === 1 ? 'POST (cured)' : 'PRE (uncured)';
const preBody = postHits === 1 ? body.replace(POST_KEY, PRE_KEY) : body;
const postBody = postHits === 1 ? body : body.replace(PRE_KEY, POST_KEY);
if (preBody === postBody) throw new Error('arm: substitution produced an identical body');
if (preBody.split(PRE_KEY).length - 1 !== 1) throw new Error('arm: PRE key not present exactly once');
if (postBody.split(POST_KEY).length - 1 !== 1) throw new Error('arm: POST key not present exactly once');

/* --------------------------------------------------------------------------- P1: derive the set */
// His derivation: U+0000..U+FFFF with a non-`u` reader. This one walks every code point and uses a
// `u`-flagged anchored reader, so an astral member would be visible if one existed.
const WS_FULL = [];
for (let cp = 0; cp <= 0x10ffff; cp += 1) {
  if (cp >= 0xd800 && cp <= 0xdfff) continue; // lone surrogates are not code points `fromCodePoint` can test under /u
  if (/^\s$/u.test(String.fromCodePoint(cp))) WS_FULL.push(cp);
}
const WS_BMP = WS_FULL.filter((cp) => cp <= 0xffff);
const WS_ASTRAL = WS_FULL.filter((cp) => cp > 0xffff);

/* ------------------------------------------------- P2: set-level equality, label stripped off it */
let scanned = 0;
const eqDisagreements = [];
for (let cp = 0; cp <= 0x10ffff; cp += 1) {
  const c = String.fromCodePoint(cp);
  scanned += 1;
  const byRegex = /\s/.test(c);
  const byTrim = c.trimEnd() === '';
  if (byRegex !== byTrim) eqDisagreements.push({ cp, byRegex, byTrim });
}
// POSITIVE CONTROL for the zero above: the 25 members must report TRUE on both sides. Without this
// the 0 is indistinguishable from the zero two always-false predicates produce (this unit's P5).
const bothTrue = WS_FULL.filter((cp) => {
  const c = String.fromCodePoint(cp);
  return /\s/.test(c) && c.trimEnd() === '';
}).length;
// And the run case: his leg appends exactly ONE whitespace character. A trailing RUN is untested by
// it, so it is tested here — every ordered pair of members, 25 x 25.
let runCells = 0;
const runDisagreements = [];
for (const a of WS_FULL) {
  for (const b of WS_FULL) {
    const line = `row  GUARDED${String.fromCodePoint(a)}${String.fromCodePoint(b)}`;
    runCells += 1;
    const byTrim = line.trimEnd().endsWith('GUARDED');
    const byRegex = /(?:MARKED|GUARDED|UNGUARDED)\s*$/.test(line);
    if (byTrim !== byRegex || !byTrim) runDisagreements.push({ a, b, byTrim, byRegex });
  }
}

/* ------------------------------------------------------- P3 / P4: set-complete at the GATE level */
// Plant characters are escaped explicitly; nothing about the plant depends on JSON's own grammar.
const jsStr = (s) => `'${[...s].map((ch) => {
  const cp = ch.codePointAt(0);
  if (cp === 0x27) return "\\'";
  if (cp === 0x5c) return '\\\\';
  if (cp >= 0x20 && cp <= 0x7e) return ch;
  return cp > 0xffff
    ? `\\u{${cp.toString(16)}}`
    : `\\u${cp.toString(16).padStart(4, '0')}`;
}).join('')}'`;

function drive(bodyText, plant) {
  const harness = `import { format } from 'node:util';
const LABELS = ['MARKED', 'GUARDED', 'UNGUARDED'];
function refuse(message) {
  console.error(\`verify-decl-body-slicers: BLOCKED — \${message}\`);
  process.exit(2);
}
function publish(sink, args) {${bodyText}}
const emit = (...args) => publish((c) => console.log(c), args);
emit(${jsStr(plant)});
`;
  writeFileSync(SCRATCH, harness);
  try {
    const r = spawnSync(process.execPath, [SCRATCH], { encoding: 'buffer' });
    return {
      rc: r.status,
      stdoutBytes: r.stdout.length,
      refused: r.status === 2,
      published: r.status === 0 && r.stdout.length > 0,
    };
  } finally {
    rmSync(SCRATCH, { force: true });
  }
}

const cells = [];
for (const cp of WS_FULL) {
  const ch = String.fromCodePoint(cp);
  cells.push({
    cp,
    pre: drive(preBody, `row  GUARDED${ch}`),
    post: drive(postBody, `row  GUARDED${ch}`),
    quotedPost: drive(postBody, `row  \`GUARDED\`${ch}`),
  });
}
const kpBare = { pre: drive(preBody, 'row  GUARDED'), post: drive(postBody, 'row  GUARDED') };
const absentPost = drive(postBody, 'row  → now ABSENT');

const postRefused = cells.filter((c) => c.post.refused);
const preRefused = cells.filter((c) => c.pre.refused);
const differential = cells.filter((c) => c.pre.published && c.post.refused);
const vacuous = cells.filter((c) => c.pre.refused && c.post.refused);
const quotedPublished = cells.filter((c) => c.quotedPost.published);

/* ------------------------------------------------------------------------------------- report */
const hex = (cp) => `U+${cp.toString(16).toUpperCase().padStart(4, '0')}`;
console.log('unit-498closureatthegate — arm');
console.log('');
console.log('## slice provenance (the subject is the real `publish()`, not a re-typing)');
console.log(`  sliced body: ${Buffer.byteLength(body)} bytes (Buffer.byteLength) / ${body.length} UTF-16 code units`);
console.log(`  occurrences in file: ${occurrences}  start offset: ${startOffset}  (declaration head at ${headOffset})`);
console.log(`  byte-identical to the file span: true   live form in the tree: ${liveForm}`);
console.log('');

console.log('## P1 — the derived set, re-derived over the FULL range with a `u`-flagged reader');
console.log(`  his scope  U+0000..U+FFFF   members: ${WS_BMP.length}`);
console.log(`  full range U+0000..U+10FFFF members: ${WS_FULL.length}   astral members: ${WS_ASTRAL.length}`);
console.log(`  the set: ${WS_FULL.map(hex).join(' ')}`);
console.log('');

console.log('## P2 — set-level equality, with the verdict label stripped OFF the test');
console.log(`  code points scanned: ${scanned}`);
console.log(`  disagreements between /\\s/.test(c) and c.trimEnd() === '': ${eqDisagreements.length}`
  + (eqDisagreements.length ? `  ${JSON.stringify(eqDisagreements.slice(0, 8))}` : ''));
console.log(`  POSITIVE CONTROL — members reporting TRUE on both sides: ${bothTrue} of ${WS_FULL.length}`);
console.log(`  trailing RUN case (his leg appends one char): ${runCells} ordered pairs,`
  + ` disagreements or false cells: ${runDisagreements.length}`);
console.log('');

console.log('## P3 / P4 — set-complete at the GATE, against the real sliced `publish()`');
console.log(`  kp-bare                  PRE: rc=${kpBare.pre.rc} ${kpBare.pre.refused ? 'REFUSED' : 'published'}`
  + `   POST: rc=${kpBare.post.rc} ${kpBare.post.refused ? 'REFUSED' : 'published'}`);
console.log(`  control-absent-terminal  POST: rc=${absentPost.rc} ${absentPost.refused ? 'REFUSED' : 'published'}`);
console.log('');
for (const c of cells) {
  const cell = (r) => (r.refused ? `rc=${r.rc} REFUSED` : `rc=${r.rc} published ${r.stdoutBytes} B`);
  const kind = c.pre.published && c.post.refused ? 'DIFFERENTIAL'
    : c.pre.refused && c.post.refused ? 'vacuous (PRE refuses too)' : 'OTHER';
  console.log(`  ${hex(c.cp).padEnd(8)} PRE: ${cell(c.pre).padEnd(22)} POST: ${cell(c.post).padEnd(16)}`
    + ` quoted-POST: ${cell(c.quotedPost).padEnd(22)} ${kind}`);
}
console.log('');
console.log(`  P3: padded refused under POST = ${postRefused.length} of ${cells.length}`);
console.log(`  P3 control (keeps the above off the refuse-everything zero):`
  + ` quoted \`GUARDED\` + same char still publishes = ${quotedPublished.length} of ${cells.length}`);
console.log(`  P4: cells that GRADE the widening (PRE published, POST refused) = ${differential.length}`
  + ` of ${cells.length}`);
console.log(`  P4: cells that are VACUOUS (PRE refused as well)               = ${vacuous.length}`
  + `  -> ${vacuous.map((c) => hex(c.cp)).join(' ') || 'none'}`);
console.log(`  P4: PRE-refused members = ${preRefused.map((c) => hex(c.cp)).join(' ') || 'none'}`);
console.log('');

const ok = WS_FULL.length === 25 && WS_ASTRAL.length === 0
  && eqDisagreements.length === 0 && bothTrue === WS_FULL.length
  && runDisagreements.length === 0
  && postRefused.length === cells.length && quotedPublished.length === cells.length
  && kpBare.pre.refused && kpBare.post.refused && absentPost.published;
console.log(`ARM ${ok ? 'OK' : 'ATTENTION'} — every gate cell above is a drive of the real sliced \`publish()\`,`
  + ' and every predicate-level zero above carries a positive control for the zero.');
