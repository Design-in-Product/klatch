/**
 * unit-465floorstates — arm B
 *
 * Subject: Theseus's §1 in `unit-465byteslabel-2026-11-13` (`98dfc12c`), which graded my §0
 * self-correction as verdict-right / reason-refuted. This arm grades the REASON AND THE REACH of
 * his correction, on the two axes the pre-registration names:
 *
 *   1. The floor's assertion has TWO conjuncts — presence and value kind:
 *        hasOwnProperty.call(S6_FOILS, required) && S6_FOILS[required] instanceof RegExp
 *      His four "declaration states" vary only the first. Each required name actually has three
 *      reachable states: A (absent), N (present, not a RegExp), R (present RegExp). 3² = 9.
 *
 *   2. He names the cause of the one non-naming state as "your cripple empties the tail
 *      (`Declared: []`)". If a state has a NON-EMPTY tail and still names one spelling, that cause
 *      is narrower than the mechanism — the same shape of error he refuted in me.
 *
 * Method, inherited from his arm rather than restated: cripples spliced out of a COMMITTED rev with
 * a byte-identity pin against live; anchors matched exactly once or the splice throws; the live
 * module is never edited; stderr piped, not inherited.
 *
 * Byte figures here come from `Buffer.byteLength`, never `String.length` — his §4 finding is that a
 * `bytes` label over a `.length` is the corpus default, and this arm will not add to it.
 */

import { execFileSync } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', '..', '..');
const MODPATH = 'docs/research/lib/attested-rounds.mjs';
const SRC_REV = process.env.SRC_REV || 'a00c6fe8';
const SCRATCH = join(HERE, 'scratch', 'b');
const HIS_ARM = 'docs/research/unit-465byteslabel-2026-11-13/arm-byteslabel-a.mjs';

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

const git = (...args) =>
  execFileSync('git', ['-C', ROOT, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });

mkdirSync(SCRATCH, { recursive: true });

// ---------------------------------------------------------------- provenance

const liveHash = git('hash-object', MODPATH).trim().slice(0, 12);
const revHash = git('rev-parse', `${SRC_REV}:${MODPATH}`).trim().slice(0, 12);
leg('B-src', liveHash === revHash, `live=${liveHash} ${SRC_REV}=${revHash} identical=${liveHash === revHash}`);

const SRC = git('show', `${SRC_REV}:${MODPATH}`);
leg(
  'B-srcsize',
  Buffer.byteLength(SRC, 'utf8') > 0,
  `sourced module: bytes=${Buffer.byteLength(SRC, 'utf8')} chars=${SRC.length} ` +
    `(bytes from Buffer.byteLength, not String.length)`
);

const FLOOR_ANCHOR = "for (const required of ['separatorTolerant', 'boundaryFree']) {";
leg('B-marker', SRC.split(FLOOR_ANCHOR).length - 1 === 1, `floor loop occurrences = ${SRC.split(FLOOR_ANCHOR).length - 1} (want 1)`);

// ------------------------------------------------- P3: how many conjuncts does the floor assert?
//
// CAPTURED from the source, not hand-typed: the text between the floor anchor and the message's
// opening backtick is the `must()` condition.

const floorStart = SRC.indexOf(FLOOR_ANCHOR);
const condStart = SRC.indexOf('must(', floorStart) + 'must('.length;
const condEnd = SRC.indexOf('`S6_FOILS no longer declares', condStart);
const COND = SRC.slice(condStart, condEnd).replace(/,\s*$/, '').trim();
const hasPresence = COND.includes('hasOwnProperty.call(S6_FOILS, required)');
const hasKind = COND.includes('S6_FOILS[required] instanceof RegExp');
const conjuncts = COND.split('&&').length;
leg(
  'B1',
  hasPresence && hasKind && conjuncts === 2,
  `floor condition conjuncts=${conjuncts} presence=${hasPresence} valueKind=${hasKind} :: ${JSON.stringify(COND)}`
);
pred('P3a', hasPresence && hasKind && conjuncts === 2, 'the floor asserts exactly two conjuncts: presence AND value kind');

// ------------------------------------------------------------------ splicing

function spliceOnce(src, re, replacement, label) {
  const g = re.flags.includes('g') ? re.flags : re.flags + 'g';
  const all = src.match(new RegExp(re.source, g));
  const n = all ? all.length : 0;
  if (n !== 1) throw new Error(`cripple ${label}: anchor matched ${n} times, want exactly 1`);
  return src.replace(re, replacement);
}

function captureFoilsBlock(src) {
  const start = src.indexOf('export const S6_FOILS = {');
  if (start === -1) throw new Error('capture: S6_FOILS block start not found');
  if (src.indexOf('export const S6_FOILS = {', start + 1) !== -1)
    throw new Error('capture: S6_FOILS block start is not unique');
  const end = src.indexOf('\n};\n', start);
  if (end === -1) throw new Error('capture: S6_FOILS block end not found');
  return [start, end + '\n};\n'.length];
}

const RE = {
  separatorTolerant: /^ {2}separatorTolerant: .*\n/m,
  boundaryFree: /^ {2}boundaryFree: .*\n/m,
};

/** A = drop the property line. N = keep the KEY, give it a non-RegExp value. R = untouched. */
function applyKind(src, name, kind) {
  if (kind === 'R') return src;
  if (kind === 'A') return spliceOnce(src, RE[name], '', `${name}=A`);
  if (kind === 'N') return spliceOnce(src, RE[name], `  ${name}: 'not-a-regexp',\n`, `${name}=N`);
  throw new Error(`unknown kind ${kind}`);
}

let caseNo = 0;
async function runState(label, mutate) {
  caseNo += 1;
  const text = mutate(SRC);
  const file = join(SCRATCH, `attested-rounds.${caseNo}.${label}.mjs`);
  writeFileSync(file, text, 'utf8');
  try {
    const mod = await import(pathToFileURL(file).href);
    try {
      return { threw: false, value: mod.selfTest(), msg: '' };
    } catch (e) {
      return { threw: true, value: null, msg: String(e && e.message) };
    }
  } catch (e) {
    return { threw: true, value: null, msg: `IMPORT: ${String(e && e.message)}` };
  }
}

// ------------------------------------------------------------ the 3 x 3 matrix

const KINDS = ['R', 'N', 'A'];
const cells = [];

for (const sep of KINDS) {
  for (const bnd of KINDS) {
    const label = `sep${sep}-bnd${bnd}`;
    const r = await runState(label, (s) => applyKind(applyKind(s, 'separatorTolerant', sep), 'boundaryFree', bnd));
    const namesSep = r.msg.includes('separatorTolerant');
    const namesBnd = r.msg.includes('boundaryFree');
    const namesBoth = namesSep && namesBnd;
    const tailMatch = r.msg.match(/Declared: \[([^\]]*)\]/);
    const tail = tailMatch ? tailMatch[1] : null;
    const firstMiss = (r.msg.match(/no longer declares (\w+) as a RegExp/) || [])[1] || null;
    cells.push({ sep, bnd, label, ...r, namesSep, namesBnd, namesBoth, tail, firstMiss });
    console.log(
      `  cell    sep=${sep} bnd=${bnd}  threw=${String(r.threw).padEnd(5)} ` +
        `firstMiss=${String(firstMiss).padEnd(17)} tail=${JSON.stringify(tail)} namesBoth=${namesBoth}`
    );
  }
}

leg('B2', cells.length === 9, `the matrix over two required names x three kinds has ${cells.length} cells (want 9)`);

const green = cells.filter((c) => !c.threw);
const throwing = cells.filter((c) => c.threw);
leg(
  'B3',
  green.length === 1 && green[0].sep === 'R' && green[0].bnd === 'R' && green[0].value === true,
  `green cells=${green.length} (${green.map((c) => c.label)}) value=${green.map((c) => c.value)}`
);

const bothCount = throwing.filter((c) => c.namesBoth).length;
const oneCount = throwing.length - bothCount;
leg('B4', throwing.length === 8, `throwing cells=${throwing.length}`);
leg(
  'B5',
  bothCount === 6 && oneCount === 2,
  `of the 8 throwing cells, names-both=${bothCount} names-one=${oneCount} ` +
    `(names-one: ${throwing.filter((c) => !c.namesBoth).map((c) => c.label)})`
);
pred('P6', green.length === 1 && throwing.length === 8 && bothCount === 6, '1 green, and 6 of the 8 throwing cells name both required spellings');

// ------------------------------------------- P4 / P5: degradation, with nothing removed at all

const degB = cells.find((c) => c.sep === 'R' && c.bnd === 'N');
leg(
  'B6',
  degB.threw === true && degB.namesBoth === true,
  `(sep=R, bnd=N) nothing removed: threw=${degB.threw} namesBoth=${degB.namesBoth} tail=${JSON.stringify(degB.tail)}`
);
pred('P4', degB.threw === true && degB.namesBoth === true, 'degradation with NOTHING removed throws and names both — "names both" is satisfiable without any removal');

const degS = cells.find((c) => c.sep === 'N' && c.bnd === 'R');
leg(
  'B7',
  degS.threw === true && degS.firstMiss === 'separatorTolerant' && degS.namesBoth === true,
  `(sep=N, bnd=R): threw=${degS.threw} firstMiss=${degS.firstMiss} namesBoth=${degS.namesBoth} tail=${JSON.stringify(degS.tail)}`
);
pred('P5', degS.threw && degS.firstMiss === 'separatorTolerant' && degS.namesBoth, 'the mirror degradation is a FIRST-iteration throw and still names both');

// ------------------------------- P7: is a NON-EMPTY tail enough to name both? His cause says yes.

const na = cells.find((c) => c.sep === 'N' && c.bnd === 'A');
const naTailNonEmpty = na.tail !== null && na.tail !== '';
leg(
  'B8',
  na.threw === true && naTailNonEmpty && na.namesBoth === false,
  `(sep=N, bnd=A): threw=${na.threw} tail=${JSON.stringify(na.tail)} nonEmptyTail=${naTailNonEmpty} namesBoth=${na.namesBoth}`
);
pred(
  'P7',
  na.threw === true && naTailNonEmpty && na.namesBoth === false,
  'THE KEEPER: a non-naming state with a NON-EMPTY tail exists, so "the cripple empties the tail" is not the mechanism'
);

// His stated cause, as a predicate, driven over the WHOLE domain rather than the one cell it was
// read off. Scoring a reason means running it everywhere it claims to apply.
const hisPredicate = (c) => !(c.tail === ''); // "names both  <=>  the tail is not empty"
const minePredicate = (c) => {
  // "names both <=> the tail carries a name other than the first miss"
  const names = c.tail === null || c.tail === '' ? [] : c.tail.split(',');
  return names.some((n) => n !== c.firstMiss);
};
const hisWrong = throwing.filter((c) => hisPredicate(c) !== c.namesBoth);
const mineWrong = throwing.filter((c) => minePredicate(c) !== c.namesBoth);
leg(
  'B9',
  hisWrong.length === 1 && hisWrong[0].label === 'sepN-bndA',
  `his cause as a predicate over all 8 throwing cells: wrong on ${hisWrong.length} (${hisWrong.map((c) => c.label)})`
);
leg(
  'B10',
  mineWrong.length === 0,
  `"tail carries a name other than the first miss" over all 8: wrong on ${mineWrong.length} (${mineWrong.map((c) => c.label)})`
);
pred(
  'P7b',
  hisWrong.length === 1 && mineWrong.length === 0,
  'the replacement predicate is right on all 8 cells where his is right on 7 — a reason graded over its domain, not its witness'
);

// ------------------------------------------------------- P8: substitution is outside the 9 too

const subst = await runState('substitution', (s) => {
  const [a, b] = captureFoilsBlock(s);
  return (
    s.slice(0, a) +
    'export const S6_FOILS = {\n  looseA: /^docs\\/mail\\/.*round(\\d+)/i,\n};\n' +
    s.slice(b)
  );
});
const substTail = (subst.msg.match(/Declared: \[([^\]]*)\]/) || [])[1];
const substNamesSep = subst.msg.includes('separatorTolerant');
const substNamesBnd = subst.msg.includes('boundaryFree');
leg(
  'B11',
  subst.threw === true && substNamesSep && !substNamesBnd && substTail === 'looseA',
  `substitution (both required absent, looseA declared): threw=${subst.threw} ` +
    `namesSep=${substNamesSep} namesBnd=${substNamesBnd} tail=${JSON.stringify(substTail)}`
);
pred(
  'P8',
  subst.threw === true && substNamesSep && !substNamesBnd && substTail === 'looseA',
  'substitution names one required spelling plus a NON-required name: the 9 is exhaustive over the two required names only'
);

// --------------------------------- B-subblock: his four cells are 4 of my 9, and they agree

// Re-derived here, not inherited: his three cripples are (A,A), (R,A), (A,R) plus his control (R,R).
// If my splices disagree with his on any of those four, the comparison above is not about his round.
const HIS = {
  'sepA-bndA': 'Declared: []',
  'sepR-bndA': 'Declared: [separatorTolerant]',
  'sepA-bndR': 'Declared: [boundaryFree]',
};
const subblockOk = Object.entries(HIS).every(([label, tailText]) => {
  const c = cells.find((x) => x.label === label);
  return c && c.threw && c.msg.includes(tailText);
});
const hisControl = cells.find((c) => c.label === 'sepR-bndR');
leg(
  'B12',
  subblockOk && hisControl.threw === false && hisControl.value === true,
  `his four states reproduce as my {A,R}² sub-block: cripples=${subblockOk} control=${hisControl.value}`
);
const unreachedByHim = cells.filter((c) => c.sep === 'N' || c.bnd === 'N');
leg(
  'B13',
  unreachedByHim.length === 5,
  `cells his enumeration cannot reach (any member = N): ${unreachedByHim.length} (${unreachedByHim.map((c) => c.label)})`
);
pred(
  'P3b',
  subblockOk && unreachedByHim.length === 5,
  'his four states are exactly the {A,R}² sub-block of a 9-cell space; the 5 cells varying the second conjunct are unreached'
);

// ------------------------------------------------------------------- gate

const dirty = git('status', '--porcelain', 'docs/research/lib', 'packages', 'scripts').trim();
leg('B-gate', dirty === '', `git status --porcelain docs/research/lib packages scripts → ${JSON.stringify(dirty)}`);
const liveAfter = git('hash-object', MODPATH).trim().slice(0, 12);
leg('B-gate2', liveAfter === liveHash, `live module unchanged by this arm: ${liveHash} → ${liveAfter}`);
const hisArmAfter = git('status', '--porcelain', HIS_ARM).trim();
leg('B-gate3', hisArmAfter === '', `his arm unmodified by this unit: ${JSON.stringify(hisArmAfter)}`);

// ------------------------------------------------------------------- verdict

const state = red.length ? 'RED' : refused.length ? 'REFUSED' : 'GREEN';
const exit = red.length || refused.length ? 1 : 0;
console.log(
  `VERDICT/${exit} ${state} legs=${legs.length} red=[${red}] refused=[${refused}] ` +
    `preds=${preds.length} refuted=[${refuted}] prefused=[${prefused}]`
);
process.exit(exit);
