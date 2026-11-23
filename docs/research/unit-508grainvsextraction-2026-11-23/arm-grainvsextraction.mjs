#!/usr/bin/env node
/**
 * unit-508grainvsextraction — P1 … P4.
 *
 * Theseus's `unit-507` gave this seat a GRAIN for the stale-limb reader it had offered to land:
 * key it on the `(path,label)` SET, not the rendered-label multiset. This unit tests the thing a
 * grain does not settle. **A reader is a grain AND an extraction method, and the hazard he found
 * one hour earlier is an extraction hazard.** A `(path,label)` set whose label is lifted by
 * containment over the whole emitted line inherits it in full.
 *
 * Four stale-limb cells, ONE synthetic repository, one pass, so every comparison below is
 * within-harness:
 *
 *   cell        baseline            tracked              renders            note
 *   H-SWAP-A    [S1, S2]            S1 (decl)            MARKED + ABSENT    assignment arm
 *   H-SWAP-B    [S1, S2]            S2 (decl)            ABSENT + MARKED    differs from A in ONE input
 *   H-COLLIDE   [P_COL, M1]         M1 (decl)            ABSENT + MARKED    P_COL carries the token
 *   H-CLEAN     [M1, A01]           M1 (decl)            MARKED + ABSENT    CONTROL: no token in any path
 *
 * `P_COL` is NOT hand-written to look dangerous. Its stem is the verdict sliced out of the gate's
 * own `const stale = baseline.filter(… !== '…')` statement — so the known positive carries the
 * property under test (a label token in the PATH field) because the gate's own source put it
 * there. This is the correction to `unit-506` P5.c, where this seat's KP was an analogy for the
 * property rather than a carrier of it. Conceded on 11-23 START and repaired here.
 *
 * FOUR READERS over the SAME captured stderr. Two grains x two extraction methods:
 *
 *   grain \ extraction   EQUALITY (capture, then `===`)   CONTAINMENT (`line.includes(v)`)
 *   label multiset       readByEquality                   readByContainment
 *   (path,label) set     pairsByEquality                  pairsByContainment
 *
 * The claim is that the bottom-right cell separates the cells just as well as the bottom-left one
 * — 4 of 4 under both — while being wrong about what it reports. Injectivity is not correctness.
 *
 * Nothing is typed where it could be sliced: the emitter template, the excluded verdict, the
 * vocabulary and the fallback verdict are all anchored out of the gate source. The exemption key is
 * assembled at runtime and appears contiguously nowhere in this file. No tracked file in the real
 * repository is written; the real repo is read only by `git ls-files` and one baseline read.
 * The gate copy is `sha256`-asserted before every drive.
 */
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  cpSync, mkdirSync, readFileSync, rmSync, writeFileSync, existsSync,
} from 'node:fs';
import { resolve, join } from 'node:path';

const UNIT = import.meta.dirname;
const ROOT = resolve(UNIT, '../../..');
const GATE_REL = 'scripts/verify-decl-body-slicers.mjs';
const BASE_REL = 'scripts/decl-body-slicers.baseline';
const SYN = join(UNIT, 'scratch', 'syn');
const CAP = join(UNIT, 'captures');

const sha = (b) => createHash('sha256').update(b).digest('hex');
const must = (cond, msg) => { if (!cond) throw new Error(`ASSERTION FAILED: ${msg}`); };
const git = (cwd, args) => spawnSync('git', ['-C', cwd, ...args], { encoding: 'utf8', maxBuffer: 1 << 28 });

const Q = String.fromCharCode(39);              // '
const BT = String.fromCharCode(96);             // `
const ch = (c) => `${Q}${c}${Q}`;
const CMP = (c, op) => `  if (k === ${ch(c)}) d ${op} 1;`;
const OPEN = String.fromCharCode(123);          // {
const CLOSE = String.fromCharCode(125);         // }
const DECL = `// ${'brace-slicer'}${'-deliberate'}${':'} unit-508 fixture, a deliberate naive slicer`;

const fixtureSource = ({ marked }) => [
  marked ? DECL : '// unit-508 fixture, nothing declared at this site',
  'export function depth(s) {',
  '  let d = 0;',
  '  for (const k of s) {',
  CMP(OPEN, '+='),
  CMP(CLOSE, '-='),
  CMP('(', '+='),
  CMP(')', '-='),
  CMP(':', '+='),
  '  }',
  '  return d;',
  '}',
  '',
].join('\n');

/* --------------------------------------------------------------- slice the gate's own vocabulary */
const gateBytes = readFileSync(join(ROOT, GATE_REL));
const gateSha = sha(gateBytes);
const gateSrc = gateBytes.toString('utf8');

const EMIT_ANCHOR = 'for (const f of stale) emitErr(';
const emitAt = gateSrc.indexOf(EMIT_ANCHOR);
must(emitAt !== -1, `emitter anchor not found: ${EMIT_ANCHOR}`);
const emitRest = gateSrc.slice(emitAt + EMIT_ANCHOR.length);
let depth = 0; let tEnd = -1;
for (let i = 0; i < emitRest.length; i += 1) {
  if (emitRest[i] === '(') depth += 1;
  else if (emitRest[i] === ')') { if (depth === 0) { tEnd = i - 1; break; } depth -= 1; }
}
must(tEnd > 0, 'could not bound the emitter template expression');
const EMIT_TEMPLATE = emitRest.slice(0, tEnd + 1);
const renderLine = new Function('f', 'verdicts', `return ${EMIT_TEMPLATE};`);

const STALE_ANCHOR = 'const stale = baseline.filter(';
const staleAt = gateSrc.indexOf(STALE_ANCHOR);
must(staleAt !== -1, `stale filter anchor not found: ${STALE_ANCHOR}`);
const staleStmt = gateSrc.slice(staleAt, gateSrc.indexOf('\n', staleAt));
const excMatch = staleStmt.match(new RegExp(`!==\\s*${Q}([A-Z]+)${Q}`));
must(excMatch !== null, `no quoted excluded verdict in: ${staleStmt}`);
const EXCLUDED = excMatch[1];

const LAB_ANCHOR = 'const LABELS = [';
const labAt = gateSrc.indexOf(LAB_ANCHOR);
must(labAt !== -1, `labels anchor not found: ${LAB_ANCHOR}`);
const labLit = gateSrc.slice(labAt + LAB_ANCHOR.length, gateSrc.indexOf(']', labAt));
const LABELS = labLit.split(',').map((s) => s.trim().replace(new RegExp(Q, 'g'), '')).filter(Boolean);
const absMatch = EMIT_TEMPLATE.match(new RegExp(`\\?\\?\\s*${Q}([A-Z]+)${Q}`));
must(absMatch !== null, `no quoted fallback verdict in the emitter template: ${EMIT_TEMPLATE}`);
const GONE = absMatch[1];
const VOCAB = [...LABELS, GONE];
must(VOCAB.includes(EXCLUDED), `the excluded verdict ${EXCLUDED} is not in the vocabulary`);

/** The vocabulary's containment pairs, measured rather than asserted from memory. */
const containmentPairs = [];
for (const a of VOCAB) for (const b of VOCAB) if (a !== b && b.includes(a)) containmentPairs.push([a, b]);

/* ----------------------------------------------------- paths: every one pinned to 40, asserted */
const WANT_LEN = 40;
const mkPath = (stem) => {
  const head = `src/${stem}`;
  const pad = WANT_LEN - head.length - '.mjs'.length;
  must(pad >= 0, `stem ${stem} is too long to pin at ${WANT_LEN}`);
  const p = `${head}${'x'.repeat(pad)}.mjs`;
  must(p.length === WANT_LEN, `path ${p} is ${p.length} long, wanted ${WANT_LEN}`);
  return p;
};
const P_M1 = mkPath('m1');
const P_A01 = mkPath('a01');
const P_S1 = mkPath('s1');
const P_S2 = mkPath('s2');
/** The known positive: stem IS the gate's own excluded verdict, sliced, never typed. */
const P_COL = mkPath(EXCLUDED);
must(P_COL.includes(EXCLUDED), `the collide path does not carry ${EXCLUDED}: ${P_COL}`);
const ALL_PATHS = [P_M1, P_A01, P_S1, P_S2, P_COL];
must(new Set(ALL_PATHS).size === ALL_PATHS.length, 'fixture paths are not distinct');
must(
  ALL_PATHS.filter((p) => VOCAB.some((v) => p.includes(v))).length === 1,
  'exactly one fixture path should carry a vocabulary token',
);

/* ---------------------------------------------------------------------------- the four readers */
const LINE_RE = new RegExp(`^\\s+(\\S+)\\s+→ now ${BT}([A-Z]+)${BT}\\s*$`);
const entryLines = (text) => text.split('\n').filter((l) => LINE_RE.test(l));

/** EQUALITY, label grain: capture the label, compare with `===`. Sorted multiset. */
function readByEquality(text) {
  const out = [];
  for (const line of entryLines(text)) {
    const captured = line.match(LINE_RE)[2];
    const hit = VOCAB.filter((v) => captured === v);
    must(hit.length <= 1, `equality matched ${hit.length} labels for one captured token`);
    out.push(hit.length === 1 ? hit[0] : `UNKNOWN(${captured})`);
  }
  return out.slice().sort();
}

/** CONTAINMENT, label grain: the defect shape, kept live. One line can yield many labels. */
function readByContainment(text) {
  const out = [];
  for (const line of entryLines(text)) out.push(...VOCAB.filter((v) => line.includes(v)));
  return out.slice().sort();
}

/** EQUALITY, pair grain: exactly one pair per entry line, by construction. */
function pairsByEquality(text) {
  const out = [];
  for (const line of entryLines(text)) {
    const m = line.match(LINE_RE);
    const hit = VOCAB.filter((v) => m[2] === v);
    must(hit.length <= 1, `equality matched ${hit.length} labels for one captured token`);
    out.push(`${m[1]}\t${hit.length === 1 ? hit[0] : `UNKNOWN(${m[2]})`}`);
  }
  return out;
}

/** CONTAINMENT, pair grain: the grain Theseus specified, with the extraction he did not. */
function pairsByContainment(text) {
  const out = [];
  for (const line of entryLines(text)) {
    const p = line.match(LINE_RE)[1];
    for (const v of VOCAB) if (line.includes(v)) out.push(`${p}\t${v}`);
  }
  return out;
}

const asSet = (pairs) => [...new Set(pairs)].sort();

/* --------------------------------------------------------------------------- the synthetic repo */
function buildRepo() {
  rmSync(SYN, { recursive: true, force: true });
  mkdirSync(join(SYN, 'scripts'), { recursive: true });
  mkdirSync(join(SYN, 'src'), { recursive: true });
  const ci = git(ROOT, ['check-ignore', '-q', SYN]);
  must(ci.status === 0, `scratch path is NOT gitignored by the real repo: ${SYN}`);
  cpSync(join(ROOT, GATE_REL), join(SYN, GATE_REL));
  cpSync(join(ROOT, 'scripts', 'lib'), join(SYN, 'scripts', 'lib'), { recursive: true });
  must(sha(readFileSync(join(SYN, GATE_REL))) === gateSha, 'gate copy is not byte-identical');
  must(git(SYN, ['init', '-q']).status === 0, 'git init failed in the synthetic repo');
  git(SYN, ['config', 'user.email', 'daedalus@local']);
  git(SYN, ['config', 'user.name', 'unit-508 synthetic']);
}

function setTracked(tracked) {
  for (const p of ALL_PATHS) {
    const abs = join(SYN, p);
    if (Object.hasOwn(tracked, p)) {
      writeFileSync(abs, fixtureSource(tracked[p]));
      must(git(SYN, ['add', '-f', p]).status === 0, `git add failed for ${p}`);
    } else {
      if (existsSync(abs)) rmSync(abs);
      git(SYN, ['rm', '--cached', '-q', p]);
    }
  }
  const want = Object.keys(tracked);
  const ls = git(SYN, ['ls-files']).stdout.split('\n').filter(Boolean);
  must(
    ls.length === want.length && want.every((p) => ls.includes(p)),
    `synthetic ls-files is ${JSON.stringify(ls)}, wanted ${JSON.stringify(want)}`,
  );
  return ls;
}

function setBaseline(entries) {
  writeFileSync(join(SYN, BASE_REL), `${entries.join('\n')}\n`);
  const back = readFileSync(join(SYN, BASE_REL), 'utf8').split('\n').filter(Boolean);
  must(JSON.stringify(back) === JSON.stringify(entries), 'the baseline on disk is not what was asked for');
}

const lineCount = (buf) => {
  if (!buf.length) return 0;
  const s = buf.toString('utf8');
  return s.split('\n').length - (s.endsWith('\n') ? 1 : 0);
};

function drive(cell) {
  must(sha(readFileSync(join(SYN, GATE_REL))) === gateSha, `gate copy drifted before ${cell}`);
  const r = spawnSync(process.execPath, [join(SYN, GATE_REL)], { cwd: SYN, maxBuffer: 1 << 26 });
  writeFileSync(join(CAP, `${cell}.out`), r.stdout);
  writeFileSync(join(CAP, `${cell}.err`), r.stderr);
  const errText = r.stderr.toString('utf8');
  const lines = entryLines(errText);
  return {
    rc: r.status,
    errBytes: r.stderr.length,
    errLines: lineCount(r.stderr),
    errSha: r.stderr.length ? sha(r.stderr) : null,
    entryCount: lines.length,
    errText,
    equality: readByEquality(errText),
    containment: readByContainment(errText),
    pairsEq: pairsByEquality(errText),
    pairsCo: pairsByContainment(errText),
    capturedLabels: lines.map((l) => l.match(LINE_RE)[2]),
    capturedPaths: lines.map((l) => l.match(LINE_RE)[1]),
  };
}

/* ------------------------------------------------------------------------------------- drive */
const CELLS = [
  ['H-SWAP-A', { [P_S1]: { marked: true } }, [P_S1, P_S2]],
  ['H-SWAP-B', { [P_S2]: { marked: true } }, [P_S1, P_S2]],
  ['H-COLLIDE', { [P_M1]: { marked: true } }, [P_COL, P_M1]],
  ['H-CLEAN', { [P_M1]: { marked: true } }, [P_M1, P_A01]],
];
const R = {};
const populations = {};
try {
  buildRepo();
  for (const [cell, tracked, baseline] of CELLS) {
    populations[cell] = setTracked(tracked);
    setBaseline(baseline);
    R[cell] = drive(cell);
  }
} finally {
  rmSync(join(UNIT, 'scratch'), { recursive: true, force: true });
}

const NAMES = CELLS.map(([c]) => c);
const NONCOLLIDE = NAMES.filter((c) => c !== 'H-COLLIDE');

/* ================================================================================== GRADING */
const G = [];
const grade = (id, claim, pass, detail) => { G.push({ id, claim, verdict: pass ? 'HIT' : 'REFUTED', detail }); };

/* --- P1: Theseus's §3 refutation, under my own drive --------------------------------------- */
grade('P1.a.eq', 'H-COLLIDE equality reads exactly 2 labels',
  R['H-COLLIDE'].equality.length === 2, R['H-COLLIDE'].equality.join(','));
grade('P1.a.co', 'H-COLLIDE containment reads exactly 4 labels',
  R['H-COLLIDE'].containment.length === 4, R['H-COLLIDE'].containment.join(','));
grade('P1.a.sup', 'the containment multiset is a strict superset of the equality one',
  R['H-COLLIDE'].containment.length > R['H-COLLIDE'].equality.length
    && R['H-COLLIDE'].equality.every((l) => R['H-COLLIDE'].containment.includes(l)),
  `${R['H-COLLIDE'].equality.length} -> ${R['H-COLLIDE'].containment.length}`);

const pairInCo = containmentPairs.filter(([a, b]) =>
  R['H-COLLIDE'].containment.includes(a) && R['H-COLLIDE'].containment.includes(b));
grade('P1.b', 'the containment multiset contains BOTH members of a vocabulary containment pair',
  pairInCo.length === 1 && pairInCo[0][1] === EXCLUDED,
  `pairs present: ${JSON.stringify(pairInCo)}; vocabulary pairs: ${JSON.stringify(containmentPairs)}`);
grade('P1.c.label', `NO captured label equals ${EXCLUDED}, on any cell`,
  NAMES.every((c) => R[c].capturedLabels.every((l) => l !== EXCLUDED)),
  JSON.stringify(Object.fromEntries(NAMES.map((c) => [c, R[c].capturedLabels]))));
grade('P1.c.path', `EXACTLY ONE captured path contains ${EXCLUDED}, across all cells`,
  NAMES.reduce((n, c) => n + R[c].capturedPaths.filter((p) => p.includes(EXCLUDED)).length, 0) === 1,
  JSON.stringify(Object.fromEntries(NAMES.map((c) => [c, R[c].capturedPaths.filter((p) => p.includes(EXCLUDED))]))));
grade('P1.d', 'CONTROL: on every cell with no token-bearing path, equality and containment agree exactly',
  NONCOLLIDE.every((c) => JSON.stringify(R[c].equality) === JSON.stringify(R[c].containment)),
  JSON.stringify(Object.fromEntries(NONCOLLIDE.map((c) => [c, [R[c].equality, R[c].containment]]))));

/* --- P2: the grain is not the reader -------------------------------------------------------- */
grade('P2.a', 'pairsByEquality yields exactly one pair per entry line, every cell',
  NAMES.every((c) => R[c].pairsEq.length === R[c].entryCount),
  JSON.stringify(Object.fromEntries(NAMES.map((c) => [c, `${R[c].pairsEq.length}/${R[c].entryCount}`]))));
grade('P2.b', 'pairsByContainment EXCEEDS the entry count on H-COLLIDE and only there',
  R['H-COLLIDE'].pairsCo.length > R['H-COLLIDE'].entryCount
    && NONCOLLIDE.every((c) => R[c].pairsCo.length === R[c].entryCount),
  JSON.stringify(Object.fromEntries(NAMES.map((c) => [c, `${R[c].pairsCo.length}/${R[c].entryCount}`]))));
const falsePairs = asSet(R['H-COLLIDE'].pairsCo).filter((p) => p.split('\t')[1] === EXCLUDED);
grade('P2.c', `the containment pair set mints a pair labelled ${EXCLUDED}, which no line renders`,
  falsePairs.length === 1
    && !asSet(R['H-COLLIDE'].pairsEq).some((p) => p.split('\t')[1] === EXCLUDED),
  `minted: ${JSON.stringify(falsePairs)}`);

const eqSets = NAMES.map((c) => JSON.stringify(asSet(R[c].pairsEq)));
const coSets = NAMES.map((c) => JSON.stringify(asSet(R[c].pairsCo)));
const msSets = NAMES.map((c) => JSON.stringify(R[c].equality));
grade('P2.d.eq', 'the equality-extracted pair SET separates all 4 cells',
  new Set(eqSets).size === 4, `${new Set(eqSets).size} of 4`);
grade('P2.d.co', 'the containment-extracted pair SET ALSO separates all 4 cells — injectivity is green on the defect',
  new Set(coSets).size === 4, `${new Set(coSets).size} of 4`);
grade('P2.e', 'CONTROL: on the non-colliding cells the two extractions are identical',
  NONCOLLIDE.every((c) => JSON.stringify(R[c].pairsEq) === JSON.stringify(R[c].pairsCo)),
  JSON.stringify(Object.fromEntries(NONCOLLIDE.map((c) => [c, R[c].pairsEq.length === R[c].pairsCo.length]))));

/* --- P3: his §4 mislabel, re-derived ------------------------------------------------------- */
const baseRaw = readFileSync(join(ROOT, BASE_REL), 'utf8');
const baseNonEmpty = baseRaw.split('\n').filter((l) => l.trim().length > 0);
const baseComments = baseNonEmpty.filter((l) => l.trim().startsWith('#'));
const baseEntries = baseNonEmpty.filter((l) => !l.trim().startsWith('#'));
grade('P3.a', 'the baseline file is 87 non-empty lines, 29 of them `#` comments, 58 real entries',
  baseNonEmpty.length === 87 && baseComments.length === 29 && baseEntries.length === 58,
  `${baseNonEmpty.length} non-empty, ${baseComments.length} comments, ${baseEntries.length} entries`);

/* --- P4: his P8 population, re-derived with a reading time -------------------------------- */
const readAt = spawnSync('date', ['+%Y-%m-%d %H:%M:%S %Z'], { encoding: 'utf8' }).stdout.trim();
const tracked = git(ROOT, ['ls-files']).stdout.split('\n').filter(Boolean);
const tokenBearing = tracked.filter((p) => VOCAB.some((v) => p.includes(v)));
grade('P4.a', 'token-bearing tracked paths is >= 26 at my own read time',
  tokenBearing.length >= 26, `${tokenBearing.length} of ${tracked.length} tracked, read at ${readAt}`);
const entrySet = new Set(baseEntries.map((l) => l.trim()));
grade('P4.b', 'NONE of the token-bearing tracked paths is a baseline entry (reach, not a live red)',
  tokenBearing.every((p) => !entrySet.has(p)),
  `overlap: ${JSON.stringify(tokenBearing.filter((p) => entrySet.has(p)))}`);

/* ===================================================================================== REPORT */
const hits = G.filter((g) => g.verdict === 'HIT').length;
const out = {
  unit: 'unit-508grainvsextraction',
  readAt,
  gateSha,
  vocabulary: VOCAB,
  excludedVerdict: EXCLUDED,
  containmentPairs,
  collidePath: P_COL,
  cells: Object.fromEntries(NAMES.map((c) => [c, {
    rc: R[c].rc,
    errBytes: R[c].errBytes,
    errLines: R[c].errLines,
    errSha: R[c].errSha ? R[c].errSha.slice(0, 8) : null,
    entryCount: R[c].entryCount,
    labelMultiset: R[c].equality,
    containmentMultiset: R[c].containment,
    pairsEqualitySet: asSet(R[c].pairsEq),
    pairsContainmentSet: asSet(R[c].pairsCo),
    population: populations[c],
  }])),
  separation: {
    labelMultiset: `${new Set(msSets).size} of 4`,
    pairSetEqualityExtraction: `${new Set(eqSets).size} of 4`,
    pairSetContainmentExtraction: `${new Set(coSets).size} of 4`,
  },
  liveBaseline: {
    nonEmptyLines: baseNonEmpty.length,
    commentLines: baseComments.length,
    realEntries: baseEntries.length,
  },
  tokenBearing: { tracked: tracked.length, count: tokenBearing.length, paths: tokenBearing },
  grades: G,
  summary: `${hits} of ${G.length} HIT`,
};
writeFileSync(join(CAP, 'P1-P4-arm.json'), `${JSON.stringify(out, null, 2)}\n`);

console.log(`unit-508grainvsextraction — read at ${readAt}`);
console.log(`gate sha ${gateSha.slice(0, 8)} · vocabulary ${JSON.stringify(VOCAB)} · excluded ${EXCLUDED}`);
console.log(`containment pairs in the vocabulary: ${JSON.stringify(containmentPairs)}`);
console.log(`collide path (stem sliced from the gate): ${P_COL}\n`);
console.log('  cell        bytes lines rc  sha       entries  label multiset         pairs(eq)  pairs(co)');
for (const c of NAMES) {
  const r = R[c];
  console.log(
    `  ${c.padEnd(11)} ${String(r.errBytes).padStart(4)}  ${String(r.errLines).padStart(4)}  ${r.rc}  `
    + `${(r.errSha || '-').slice(0, 8)}  ${String(r.entryCount).padStart(5)}    `
    + `${`[${r.equality.join(',')}]`.padEnd(22)} ${String(asSet(r.pairsEq).length).padStart(5)}      `
    + `${String(asSet(r.pairsCo).length).padStart(5)}`,
  );
}
console.log('\nSEPARATION (how many of the 4 cells each reader tells apart):');
console.log(`  rendered-label multiset              ${out.separation.labelMultiset}`);
console.log(`  (path,label) set, EQUALITY extraction ${out.separation.pairSetEqualityExtraction}`);
console.log(`  (path,label) set, CONTAINMENT extract ${out.separation.pairSetContainmentExtraction}`);
console.log(`\nlive baseline: ${baseNonEmpty.length} non-empty = ${baseComments.length} comments + ${baseEntries.length} entries`);
console.log(`token-bearing tracked paths: ${tokenBearing.length} of ${tracked.length}, read at ${readAt}`);
console.log('\nGRADES');
for (const g of G) console.log(`  ${g.verdict.padEnd(8)} ${g.id.padEnd(10)} ${g.claim}\n           ${g.detail}`);
console.log(`\n${out.summary}`);
if (hits !== G.length) process.exitCode = 1;
