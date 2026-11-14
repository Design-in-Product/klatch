/**
 * unit-465byteslabel — arm A
 *
 * Subject: Daedalus's §0 self-correction in
 * `docs/mail/daedalus-to-theseus-argus-…-the-claim-you-left-me-is-driven-…-2026-11-13.md`:
 *
 *   > `P8` said the emptying cripple throws "and the message names **both** spellings." The floor
 *   > is a `for` over the two required names and `must` throws at the **first** miss, so one throw
 *   > can only name one: **"names both" is unsatisfiable**, not merely unmet.
 *
 * The VERDICT of that correction is about one cripple — the emptying one. The REASON given is a
 * general property of the floor's control flow ("a `for` … throws at the first miss, so one throw
 * can only name one"). Those are different claims, and the floor's message has a
 * `Declared: [${Object.keys(S6_FOILS)}]` tail that the reason does not account for.
 *
 * A 2-member family has exactly 4 declaration states. He graded one. This arm drives all four.
 *
 *   control  both present          → selfTest() true            (matched baseline, not inherited red)
 *   E        both removed          → his cripple
 *   R1       boundaryFree removed  → first iteration PASSES, second throws
 *   R2       separatorTolerant removed → throws at the FIRST miss, on his reason's own terms
 *
 * Method constraints (declared in PRE-REGISTRATION.md):
 *  - cripples are spliced out of a COMMITTED rev, with `A-src` asserting the sourced blob is
 *    byte-identical to the live file, so the thing graded is the rev it claims to grade;
 *  - every splice anchor is CAPTURED from the source text, never hand-typed — the block carries
 *    `…` and em dashes, and a hand-typed anchor silently matches zero;
 *  - every splice throws unless the match count is exactly 1. A patch that did not land and a dead
 *    guard read identically from outside; this is the correction Daedalus adopted from this seat
 *    and it is used here rather than restated;
 *  - the live module is NOT edited. `A-gate` asserts that at the end.
 */

import { execFileSync } from 'node:child_process';
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', '..', '..');
const MODPATH = 'docs/research/lib/attested-rounds.mjs';
const SRC_REV = process.env.SRC_REV || 'a00c6fe8';
const SCRATCH = join(HERE, 'scratch', 'a');

const legs = [];
const red = [];
const refused = [];
const preds = [];
const refuted = [];
const prefused = [];

function leg(id, ok, detail) {
  legs.push(id);
  if (ok === null) {
    refused.push(id);
    console.log(`  REFUSED ${id}  ${detail}`);
  } else if (ok) {
    console.log(`  ok      ${id}  ${detail}`);
  } else {
    red.push(id);
    console.log(`  RED     ${id}  ${detail}`);
  }
}
function pred(id, held, detail) {
  preds.push(id);
  if (held === null) {
    prefused.push(id);
    console.log(`  PREFUSED ${id} ${detail}`);
  } else if (held) {
    console.log(`  LANDED  ${id}  ${detail}`);
  } else {
    refuted.push(id);
    console.log(`  REFUTED ${id}  ${detail}`);
  }
}

// `stdio` pins stderr to 'pipe' rather than 'inherit': an inherited child stderr is echoed into
// this arm's own recording and reads as the arm's output.
const git = (...args) =>
  execFileSync('git', ['-C', ROOT, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });

mkdirSync(SCRATCH, { recursive: true });

// ---------------------------------------------------------------- provenance

const liveHash = git('hash-object', MODPATH).trim().slice(0, 12);
const revHash = git('rev-parse', `${SRC_REV}:${MODPATH}`).trim().slice(0, 12);
leg(
  'A-src',
  liveHash === revHash,
  `live=${liveHash} ${SRC_REV}=${revHash} identical=${liveHash === revHash}`
);

const SRC = git('show', `${SRC_REV}:${MODPATH}`);

// `A-marker`: the floor must be PRESENT in the sourced bytes. Without this, every cripple below
// could be grading a rev where the cure does not exist and all four states would agree.
const FLOOR_ANCHOR = "for (const required of ['separatorTolerant', 'boundaryFree']) {";
const floorHits = SRC.split(FLOOR_ANCHOR).length - 1;
leg('A-marker', floorHits === 1, `floor loop occurrences in ${SRC_REV} = ${floorHits} (want exactly 1)`);

// `A-tail`: the `Declared:` tail — the thing his reason does not account for — must be present in
// the floor's message in the sourced bytes, or the refutation below would be about some other text.
const TAIL_ANCHOR = 'Declared: [${Object.keys(S6_FOILS)}]';
const tailHits = SRC.split(TAIL_ANCHOR).length - 1;
leg('A-tail', tailHits === 1, `floor message 'Declared: [...]' tail occurrences = ${tailHits} (want exactly 1)`);

// ------------------------------------------------------------------ splicing

/** Replace exactly one regex match, or throw. A splice that matched 0 or 2+ is not a cripple. */
function spliceOnce(src, re, replacement, label) {
  const all = src.match(new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g'));
  const n = all ? all.length : 0;
  if (n !== 1) throw new Error(`cripple ${label}: anchor matched ${n} times, want exactly 1`);
  return src.replace(re, replacement);
}

/**
 * CAPTURE the S6_FOILS object literal from the source rather than hand-typing it: the block
 * contains `…` and the property lines are long. Returns [startIdx, endIdxExclusive].
 */
function captureFoilsBlock(src) {
  const start = src.indexOf('export const S6_FOILS = {');
  if (start === -1) throw new Error('capture: S6_FOILS block start not found');
  if (src.indexOf('export const S6_FOILS = {', start + 1) !== -1)
    throw new Error('capture: S6_FOILS block start is not unique');
  const end = src.indexOf('\n};\n', start);
  if (end === -1) throw new Error('capture: S6_FOILS block end not found');
  return [start, end + '\n};\n'.length];
}

let caseNo = 0;
function runState(label, mutate) {
  caseNo += 1;
  const text = mutate(SRC);
  const file = join(SCRATCH, `attested-rounds.${caseNo}.${label}.mjs`);
  writeFileSync(file, text, 'utf8');
  return import(pathToFileURL(file).href)
    .then((mod) => {
      try {
        const v = mod.selfTest();
        return { threw: false, value: v, msg: '' };
      } catch (e) {
        return { threw: true, value: null, msg: String(e && e.message) };
      }
    })
    .catch((e) => ({ threw: true, value: null, msg: `IMPORT: ${String(e && e.message)}` }));
}

const RE_BOUNDARYFREE = /^ {2}boundaryFree: .*\n/m;
const RE_SEPARATORTOLERANT = /^ {2}separatorTolerant: .*\n/m;

// ------------------------------------------------------------------- the four states

const control = await runState('control', (s) => s);
leg(
  'A0',
  control.threw === false && control.value === true,
  `uncrippled sourced copy: selfTest() → ${control.threw ? `THREW ${control.msg}` : control.value}`
);

const emptied = await runState('E-both-removed', (s) => {
  const [a, b] = captureFoilsBlock(s);
  return s.slice(0, a) + 'export const S6_FOILS = {};\n' + s.slice(b);
});
const eNamesSep = emptied.msg.includes('separatorTolerant');
const eNamesBnd = emptied.msg.includes('boundaryFree');
leg('E1', emptied.threw === true, `both removed: threw=${emptied.threw}`);
leg(
  'E2',
  eNamesSep && !eNamesBnd,
  `both removed, message names: separatorTolerant=${eNamesSep} boundaryFree=${eNamesBnd}`
);
pred(
  'P9',
  emptied.threw && eNamesSep && !eNamesBnd,
  'his CORRECTED grade reproduces: the emptying cripple throws and the message names exactly one spelling'
);
console.log(`          E msg: ${emptied.msg}`);

const r1 = await runState('R1-boundaryFree-removed', (s) =>
  spliceOnce(s, RE_BOUNDARYFREE, '', 'R1')
);
const r1Sep = r1.msg.includes('separatorTolerant');
const r1Bnd = r1.msg.includes('boundaryFree');
leg('R1a', r1.threw === true, `boundaryFree removed: threw=${r1.threw}`);
leg(
  'R1b',
  r1Sep && r1Bnd,
  `boundaryFree removed, message names BOTH: separatorTolerant=${r1Sep} boundaryFree=${r1Bnd}`
);
console.log(`          R1 msg: ${r1.msg}`);

const r2 = await runState('R2-separatorTolerant-removed', (s) =>
  spliceOnce(s, RE_SEPARATORTOLERANT, '', 'R2')
);
const r2Sep = r2.msg.includes('separatorTolerant');
const r2Bnd = r2.msg.includes('boundaryFree');
leg('R2a', r2.threw === true, `separatorTolerant removed: threw=${r2.threw}`);
leg(
  'R2b',
  r2Sep && r2Bnd,
  `separatorTolerant removed, message names BOTH: separatorTolerant=${r2Sep} boundaryFree=${r2Bnd}`
);
console.log(`          R2 msg: ${r2.msg}`);

// `R2` is the state that tests his reason on its OWN terms: it throws at the FIRST iteration of the
// loop — a first-miss throw — and the message still carries both spellings. So "throws at the first
// miss, so one throw can only name one" is false as stated, independent of iteration order.
const r2IsFirstMiss = r2.msg.includes('no longer declares separatorTolerant');
leg('R2c', r2IsFirstMiss, `R2's throw is the FIRST loop iteration (names separatorTolerant as the miss) = ${r2IsFirstMiss}`);

pred(
  'P10',
  r1.threw && r1Sep && r1Bnd && r2.threw && r2Sep && r2Bnd,
  'his stated REASON is refuted: in both one-removed states a single throw names BOTH spellings'
);
pred(
  'P11',
  r2IsFirstMiss && r2Sep && r2Bnd,
  'refuted on the reason\'s own terms: a FIRST-miss throw names both spellings'
);

// The carrier: the surviving name arrives via the `Declared: [...]` tail, not via `${required}`.
const r1TailCarries = /Declared: \[separatorTolerant\]/.test(r1.msg);
const r2TailCarries = /Declared: \[boundaryFree\]/.test(r2.msg);
leg('A-carrier1', r1TailCarries, `R1's second spelling arrives in the 'Declared: [...]' tail = ${r1TailCarries}`);
leg('A-carrier2', r2TailCarries, `R2's second spelling arrives in the 'Declared: [...]' tail = ${r2TailCarries}`);
pred(
  'P12',
  r1TailCarries && r2TailCarries,
  'the mechanism is the `Declared: [Object.keys(S6_FOILS)]` tail, which the stated reason does not mention'
);

// And the reason the emptied state is the ONLY one that names a single spelling: its tail is empty.
const eTailEmpty = /Declared: \[\]/.test(emptied.msg);
leg('A-why', eTailEmpty, `the emptied state names one spelling because its tail is EMPTY: 'Declared: []' = ${eTailEmpty}`);
pred(
  'P13',
  eTailEmpty,
  'the true cause of his verdict is the emptied tail, not the loop\'s first-miss control flow'
);

// ------------------------------------------------------------------- gate

const dirty = git('status', '--porcelain', 'docs/research/lib', 'packages', 'scripts').trim();
leg('A-gate', dirty === '', `git status --porcelain docs/research/lib packages scripts → ${JSON.stringify(dirty)}`);

const liveHashAfter = git('hash-object', MODPATH).trim().slice(0, 12);
leg('A-gate2', liveHashAfter === liveHash, `live module unchanged by this arm: ${liveHash} → ${liveHashAfter}`);

// ------------------------------------------------------------------- verdict

const state = red.length ? 'RED' : refused.length ? 'REFUSED' : 'GREEN';
const exit = red.length || refused.length ? 1 : 0;
console.log(
  `VERDICT/${exit} ${state} legs=${legs.length} red=[${red}] refused=[${refused}] ` +
    `preds=${preds.length} refuted=[${refuted}] prefused=[${prefused}]`
);
process.exit(exit);
