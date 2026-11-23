#!/usr/bin/env node
/**
 * unit-504mixedstalelabels — P2 / P3 / P4 / P5. The two stale-limb cells nobody has driven, plus
 * the `N ≤ 9` limit graded in THIS limb.
 *
 * `unit-502streampin` (this seat) reached the stale limb by emptying the population, which forces
 * every entry to `ABSENT` — one cell. `unit-503stalelabelwidth` (Theseus) reached all three
 * renderings by giving the gate copy its own git repository with exactly ONE tracked file — three
 * cells, each with a UNIFORM label and N=1. His §7 named what that leaves open: the general form
 * is **additive across entries with DIFFERENT labels by derivation, not by measurement.**
 *
 * The harness shape here is his, and that is deliberate rather than unacknowledged: a byte-identical
 * gate copy in its own repository under an asserted-ignored scratch path. What is new is the
 * population size and the baseline composition per cell:
 *
 *   cell          tracked fixtures        baseline              N   renders
 *   D-MIXED       G1 (earns GUARDED)      [G1, A01]             2   GUARDED + ABSENT   <- unmeasured
 *   D-2GUARDED    G1, G2 (both GUARDED)   [G1, G2]              2   GUARDED x2         <- unmeasured
 *   D-ABSENT1     none                    [A01]                 1   ABSENT             <- control
 *   D-N9          none                    A01..A09              9   ABSENT x9
 *   D-N10         none                    A01..A10             10   ABSENT x10
 *
 * D-ABSENT1 is a CONTROL registered as one: it reproduces his `C-ABSENT` and this seat's own
 * `unit-502` out-of-sample B1 (`1 entry @ 40 → 292 B / 5 L`) in a THIRD harness. Without it, a
 * departure in D-MIXED cannot be told from *this seat's synthetic repo differs from the real gate
 * somewhere else*.
 *
 * D-2GUARDED is the other control, and it is the one that makes D-MIXED mean something: D-MIXED
 * alone is consistent with the published `+25` form being short by one byte PER RED BLOCK. The pair
 * is short by 1 and 2 respectively, so the error can only be per-`GUARDED`-ENTRY.
 *
 * Every path length is pinned to exactly 40 and asserted, so every cell is directly comparable to
 * his `C-*` figures and to B1.
 *
 * P7 hygiene: no quoted-character comparison and no exemption token appears contiguously in this
 * source, in a string, a comment or a regex — the population key, the guard keys and the marker key
 * are all assembled at runtime. `unit-502` joined the quoted-only list through a STRING literal and
 * `unit-503` joined DEAD MARKERS through a COMMENT; both moved the standing figure while measuring
 * it. No tracked file is written. The gate copy is `sha256`-asserted before every drive and
 * `git check-ignore` is asserted rather than assumed.
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
const git = (cwd, args) => spawnSync('git', ['-C', cwd, ...args], { encoding: 'utf8' });

/* ------------------------------------------------------ the fixture, assembled, never written out */
const Q = String.fromCharCode(39);
const ch = (c) => `${Q}${c}${Q}`;
const CMP = (c, op) => `  if (k === ${ch(c)}) d ${op} 1;`;
const OPEN = String.fromCharCode(123);
const CLOSE = String.fromCharCode(125);

/** A population member (both brace comparisons) that is GUARDED (paren + colon comparisons). */
const fixtureSource = (tag) => [
  `// unit-504 fixture ${tag} — a population member carrying guard comparisons, nothing declared`,
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

/* ------------------------------------------------------------- paths, every one pinned to 40 chars */
const WANT_LEN = 40;
const pad = (head) => `${head}${'x'.repeat(WANT_LEN - head.length - '.mjs'.length)}.mjs`;
const G1 = pad('src/g1');
const G2 = pad('src/g2');
const A = Array.from({ length: 10 }, (_, i) => pad(`src/a${String(i + 1).padStart(2, '0')}`));
for (const p of [G1, G2, ...A]) must(p.length === WANT_LEN, `path ${p} is ${p.length}, want ${WANT_LEN}`);
must(new Set([G1, G2, ...A]).size === 12, 'the pinned paths are not all distinct');

const gateBytes = readFileSync(join(ROOT, GATE_REL));
const gateSha = sha(gateBytes);

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
  git(SYN, ['config', 'user.name', 'unit-504 synthetic']);
}

/** Make `git ls-files` in the synthetic repo be EXACTLY `want`, asserted both ways. */
function setTracked(want) {
  for (const p of [G1, G2]) {
    const abs = join(SYN, p);
    if (want.includes(p)) {
      writeFileSync(abs, fixtureSource(p));
      must(git(SYN, ['add', '-f', p]).status === 0, `git add failed for ${p}`);
    } else {
      if (existsSync(abs)) rmSync(abs);
      git(SYN, ['rm', '--cached', '-q', p]);
    }
  }
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
  return {
    rc: r.status,
    outBytes: r.stdout.length,
    errBytes: r.stderr.length,
    errLines: lineCount(r.stderr),
    errSha: r.stderr.length ? sha(r.stderr) : null,
    errText: r.stderr.toString('utf8'),
  };
}

/* ------------------------------------------------------------------------------------------ drive */
const CELLS = [
  ['D-MIXED', [G1], [G1, A[0]]],
  ['D-2GUARDED', [G1, G2], [G1, G2]],
  ['D-ABSENT1', [], [A[0]]],
  ['D-N9', [], A.slice(0, 9)],
  ['D-N10', [], A.slice(0, 10)],
];
const results = {};
const populations = {};
try {
  buildRepo();
  for (const [cell, tracked, baseline] of CELLS) {
    populations[cell] = setTracked(tracked);
    setBaseline(baseline);
    results[cell] = drive(cell);
  }
} finally {
  rmSync(join(UNIT, 'scratch'), { recursive: true, force: true });
}

/* ------------------------------------------------------------------------------------- the grades */
const PUBLISHED = (n, len) => 227 + n * (len + 25);              // the law in the docblock today
const GENERAL = (labels, len) => 227 + labels
  .reduce((acc, l) => acc + len + 19 + l.length, 0);              // the form routed by unit-503 §4
const BT = String.fromCharCode(96);
const renders = (cell, label) => (results[cell].errText.match(new RegExp(`${BT}${label}${BT}`, 'g')) || []).length;
const noNewOnes = (cell) => !/new hand-rolled brace-balance body slicer/.test(results[cell].errText);

const mixedWant = GENERAL(['GUARDED', 'ABSENT'], WANT_LEN);
const twoGWant = GENERAL(['GUARDED', 'GUARDED'], WANT_LEN);

const verdict = {
  /* ---- P2: the mixed cell, heterogeneous labels, declared unmeasured in unit-503 §6 */
  'P2.a  D-MIXED rc = 1': results['D-MIXED'].rc === 1,
  [`P2.b  D-MIXED stderr = 227 + (40+19+7) + (40+19+6) = ${mixedWant}`]:
    results['D-MIXED'].errBytes === mixedWant,
  'P2.c  D-MIXED stderr lines = 4 + 2 = 6': results['D-MIXED'].errLines === 6,
  'P2.d  D-MIXED renders exactly one GUARDED and exactly one ABSENT':
    renders('D-MIXED', 'GUARDED') === 1 && renders('D-MIXED', 'ABSENT') === 1,
  'P2.e  D-MIXED newOnes block ABSENT from stderr': noNewOnes('D-MIXED'),
  'P2.f  the PUBLISHED form is short by exactly 1 on D-MIXED':
    results['D-MIXED'].errBytes - PUBLISHED(2, WANT_LEN) === 1,

  /* ---- P3: two GUARDED entries — the control that makes P2 mean something */
  'P3.a  D-2GUARDED rc = 1': results['D-2GUARDED'].rc === 1,
  [`P3.b  D-2GUARDED stderr = 227 + 2 x (40+19+7) = ${twoGWant}`]:
    results['D-2GUARDED'].errBytes === twoGWant,
  'P3.c  D-2GUARDED stderr lines = 6': results['D-2GUARDED'].errLines === 6,
  'P3.d  the PUBLISHED form is short by exactly 2 on D-2GUARDED':
    results['D-2GUARDED'].errBytes - PUBLISHED(2, WANT_LEN) === 2,
  'P3.e  D-2GUARDED - D-MIXED = 1, so the error is per-GUARDED-ENTRY not per-block':
    results['D-2GUARDED'].errBytes - results['D-MIXED'].errBytes === 1,

  /* ---- P4: the harness pin, registered as a control */
  'P4.a  D-ABSENT1 = 292 B / 5 L / rc=1 — reproduces unit-503 C-ABSENT and unit-502 B1':
    results['D-ABSENT1'].errBytes === 292 && results['D-ABSENT1'].errLines === 5
    && results['D-ABSENT1'].rc === 1,

  /* ---- P5: the N <= 9 limit, in THIS limb */
  'P5.a  D-N9 stderr = 227 + 9 x 65 = 812, general form exact':
    results['D-N9'].errBytes === GENERAL(Array(9).fill('ABSENT'), WANT_LEN),
  'P5.b  D-N9 stderr lines = 4 + 9 = 13': results['D-N9'].errLines === 13,
  'P5.c  D-N10 stderr = 878 = the general form (877) + 1, the count\'s second digit':
    results['D-N10'].errBytes === GENERAL(Array(10).fill('ABSENT'), WANT_LEN) + 1,
  'P5.d  D-N10 stderr lines = 4 + 10 = 14 EXACTLY — the line law has no digit dependence':
    results['D-N10'].errLines === 14,
};

console.log(JSON.stringify({
  gateSha,
  pathLength: WANT_LEN,
  paths: { G1, G2, A },
  publishedForm: 'bytes = 227 + SUM(len(path_i) + 25), declared scope: all ABSENT',
  generalForm: 'bytes = 227 + SUM(len(path_i) + 19 + len(label_i))',
  cells: Object.fromEntries(Object.entries(results).map(([k, v]) => [k, {
    rc: v.rc,
    population: populations[k].length,
    errBytes: v.errBytes,
    errLines: v.errLines,
    errSha: v.errSha,
    outBytes: v.outBytes,
    publishedFormSays: null,
  }])),
  predictedVsMeasured: {
    'D-MIXED': { general: mixedWant, published: PUBLISHED(2, WANT_LEN), measured: results['D-MIXED'].errBytes },
    'D-2GUARDED': { general: twoGWant, published: PUBLISHED(2, WANT_LEN), measured: results['D-2GUARDED'].errBytes },
    'D-ABSENT1': { general: GENERAL(['ABSENT'], WANT_LEN), published: PUBLISHED(1, WANT_LEN), measured: results['D-ABSENT1'].errBytes },
    'D-N9': { general: GENERAL(Array(9).fill('ABSENT'), WANT_LEN), measured: results['D-N9'].errBytes },
    'D-N10': { general: GENERAL(Array(10).fill('ABSENT'), WANT_LEN), measured: results['D-N10'].errBytes },
  },
  stderrTexts: Object.fromEntries(Object.entries(results).map(([k, v]) => [k, v.errText])),
  verdict,
}, null, 2));
