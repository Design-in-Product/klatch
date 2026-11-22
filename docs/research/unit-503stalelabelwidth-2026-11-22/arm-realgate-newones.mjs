#!/usr/bin/env node
/**
 * unit-503stalelabelwidth — P5 / P6. The REAL gate's newOnes limb, twice.
 *
 * P5 is the half of his §7 this seat expects to survive: whether the newOnes constant `658` is
 * tree-invariant IN FACT and not only by derivation. This morning's `unit-501` d1 measured
 * 722 B / 8 lines for one plant at a path of length 57, at `tracked files read: 1054`. The tree is
 * four-plus files larger now and the gate's stdout figure has moved 4160 -> 4230 in between, so the
 * same defect at the same path length is an out-of-sample test across a changed tree.
 *
 * P6 grades the DECLARED LIMIT rather than the law: his docblock says both laws hold for `N <= 9`
 * because the header interpolates the count. A declared limit states a count and implies a reach;
 * this measures the magnitude of the implied reach at N = 10 and checks that the LINE law, which
 * has no digit dependence, does not break with it.
 *
 * R1: no tracked published file is modified. The plants are index-only (`git add -N`), removed in a
 * `finally` with the index entry reset; `git status --porcelain` is asserted clean of them at close.
 * R3: both streams captured separately, `spawnSync`, never `execFileSync`.
 * P7: no quoted-character comparison and no exemption token appears contiguously in this source.
 */
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const UNIT = import.meta.dirname;
const ROOT = resolve(UNIT, '../../..');
const UNIT_REL = 'docs/research/unit-503stalelabelwidth-2026-11-22';
const GATE = join(ROOT, 'scripts/verify-decl-body-slicers.mjs');
const CAP = join(UNIT, 'captures');

const sha = (b) => createHash('sha256').update(b).digest('hex');
const must = (cond, msg) => { if (!cond) throw new Error(`ASSERTION FAILED: ${msg}`); };
const git = (args) => spawnSync('git', ['-C', ROOT, ...args], { encoding: 'utf8' });

/* --------------------------------------------------- an UNGUARDED population member, assembled */
const Q = String.fromCharCode(39);
const CMP = (c, op) => `  if (k === ${Q}${c}${Q}) d ${op} 1;`;
const OPEN = String.fromCharCode(123);
const CLOSE = String.fromCharCode(125);
// Brace comparisons BOTH ways (admission) and no paren/colon comparison (so the verdict is
// UNGUARDED, not GUARDED) and no declared marker (so it is not MARKED).
const PLANT = [
  '// unit-503 plant — a naive brace-balance slicer, planted to redden the newOnes limb.',
  'export function depth(s) {',
  '  let d = 0;',
  `  for (const k of s) {`,
  CMP(OPEN, '+='),
  CMP(CLOSE, '-='),
  '  }',
  '  return d;',
  '}',
  '',
].join('\n');
const PLANT_SHA = sha(Buffer.from(PLANT, 'utf8'));

/* ------------------------------------------------------------------------- path lengths, asserted */
const relOf = (name) => `${UNIT_REL}/${name}`;
const P5_REL = relOf('plnt.mjs');
must(P5_REL.length === 57, `P5 plant path length is ${P5_REL.length}, wanted exactly 57`);
const P6_RELS = Array.from({ length: 10 }, (_, i) => relOf(`p${String(i).padStart(2, '0')}.mjs`));
for (const r of P6_RELS) must(r.length === 56, `P6 plant path length is ${r.length}, wanted 56`);

/* ---------------------------------------------------------------------------------------- driving */
const planted = new Set();
function plant(rels) {
  for (const rel of rels) {
    writeFileSync(join(ROOT, rel), PLANT);
    must(git(['add', '-N', '--', rel]).status === 0, `intent-to-add failed for ${rel}`);
    planted.add(rel);
    const ls = git(['ls-files', '--', rel]).stdout.trim();
    must(ls === rel, `plant is not in the index: ${rel} -> ${JSON.stringify(ls)}`);
  }
}
function unplantAll() {
  for (const rel of [...planted]) {
    git(['rm', '--cached', '--force', '-q', '--', rel]);
    if (existsSync(join(ROOT, rel))) rmSync(join(ROOT, rel));
    planted.delete(rel);
  }
}

function drive(cell) {
  const r = spawnSync(process.execPath, [GATE], { cwd: ROOT, maxBuffer: 1 << 26 });
  writeFileSync(join(CAP, `${cell}.out`), r.stdout);
  writeFileSync(join(CAP, `${cell}.err`), r.stderr);
  const lines = (buf) => {
    if (!buf.length) return 0;
    const s = buf.toString('utf8');
    return s.split('\n').length - (s.endsWith('\n') ? 1 : 0);
  };
  const readFig = (name) => {
    const m = new RegExp(`${name}:\\s*(\\d+)`).exec(r.stdout.toString('utf8'));
    return m ? Number(m[1]) : null;
  };
  return {
    rc: r.status,
    outBytes: r.stdout.length,
    outLines: lines(r.stdout),
    outSha: r.stdout.length ? sha(r.stdout) : null,
    errBytes: r.stderr.length,
    errLines: lines(r.stderr),
    errSha: r.stderr.length ? sha(r.stderr) : null,
    trackedRead: readFig('tracked files read'),
  };
}

const NEWONES_LAW = (rels) => 658 + rels.reduce((a, rel) => a + rel.length + 7, 0);
const cells = {};
try {
  // P5 — one plant at length 57, the same defect and the same path length as this morning's d1.
  plant([P5_REL]);
  cells.d1_p5 = drive('d1-p5-one-plant-len57');
  unplantAll();

  // P6.d — N = 9 at length 56, where the declared limit says the law still holds.
  plant(P6_RELS.slice(0, 9));
  cells.d2_p6_n9 = drive('d2-p6-nine-plants-len56');
  unplantAll();

  // P6.a-c — N = 10, one past the declared limit.
  plant(P6_RELS);
  cells.d3_p6_n10 = drive('d3-p6-ten-plants-len56');
  unplantAll();

  // A clean close, so a figure read at the end is read at a tree with no plant in it.
  cells.d4_clean = drive('d4-clean-after-reset');
} finally {
  unplantAll();
}

const porcelain = git(['status', '--porcelain']).stdout
  .split('\n').filter((l) => /unit-503stalelabelwidth/.test(l) && /p\d\d\.mjs|plnt\.mjs/.test(l));

/* ------------------------------------------------------------------------------------- the grades */
const MORNING_D1 = { errBytes: 722, errLines: 8, trackedRead: 1054 };
const law9 = NEWONES_LAW(P6_RELS.slice(0, 9));     // 658 + 9 * 63 = 1225
const law10 = NEWONES_LAW(P6_RELS);                // 658 + 10 * 63 = 1288

const verdict = {
  'P5.a  rc = 1': cells.d1_p5.rc === 1,
  'P5.b  stderr = 722 B, byte-count-identical to this morning d1 at a CHANGED tree':
    cells.d1_p5.errBytes === MORNING_D1.errBytes,
  'P5.c  stderr lines = 8': cells.d1_p5.errLines === MORNING_D1.errLines,
  'P5.d  the tree really did change: tracked files read > 1054':
    cells.d1_p5.trackedRead > MORNING_D1.trackedRead,
  'P5.e  derived law reproduces it with no fit: 658 + (57 + 7) = 722':
    NEWONES_LAW([P5_REL]) === cells.d1_p5.errBytes,

  'P6.d  N = 9 at len 56: the law is EXACT (658 + 9*63 = 1225)':
    cells.d2_p6_n9.errBytes === law9,
  'P6.d2 N = 9 lines = 7 + 9 = 16': cells.d2_p6_n9.errLines === 16,
  'P6.a  N = 10 rc = 1': cells.d3_p6_n10.rc === 1,
  'P6.b  N = 10 overflows the law by EXACTLY 1 (1288 predicted, 1289 measured)':
    cells.d3_p6_n10.errBytes === law10 + 1,
  'P6.c  N = 10 LINE law does NOT break: lines = 7 + 10 = 17':
    cells.d3_p6_n10.errLines === 17,

  'CLEANUP  the gate is green again after the reset': cells.d4_clean.rc === 0,
  'CLEANUP  no plant is left in the working tree or the index': porcelain.length === 0,
};

console.log(JSON.stringify({
  plantSha: PLANT_SHA,
  paths: { p5: P5_REL, p5len: P5_REL.length, p6: P6_RELS[0], p6len: P6_RELS[0].length },
  morningD1ForComparison: MORNING_D1,
  derivedLaw: { n1: NEWONES_LAW([P5_REL]), n9: law9, n10: law10 },
  cells,
  byteCountVsBytes: {
    note: 'P5 agrees on a COUNT across two trees. The shas differ because the path spelling'
      + ' differs, which is registered as P5.d-adjacent and is the distinction this unit is about.',
    morningD1Sha: 'see unit-501redbranchpin/captures/figures.json — d1 errSha was not recorded there',
    thisFireErrSha: cells.d1_p5.errSha,
  },
  leftoverPorcelain: porcelain,
  verdict,
}, null, 2));
