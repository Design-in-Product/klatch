#!/usr/bin/env node
/**
 * unit-503stalelabelwidth — P2 / P3 / P4. The stale limb's three reachable renderings, driven.
 *
 * `unit-502streampin` §4 reached the stale limb for the first time by driving a byte-identical copy
 * of the gate from an already-ignored directory, where `git -C <ROOT> ls-files` is empty. That makes
 * the population empty, which makes EVERY baseline entry render `ABSENT` — so the cell his law was
 * derived in is the only cell that trick can reach. The gate's own comment at L826-828 names the
 * other one as the real-world case: *"an entry that still exists renders `→ now \`GUARDED\``"*.
 *
 * This arm reaches all three by giving the copy its OWN git repository inside this unit's ignored
 * `scratch/`, with exactly one tracked file. `git ls-files` is then a population of 1 and the
 * verdict is whatever the fixture's content earns:
 *
 *   cell        fixture state                                  verdict     renders
 *   C-GUARDED   brace + paren + colon comparisons, no marker   GUARDED     `→ now \`GUARDED\``
 *   C-MARKED    same, plus a DECLARED marker in a comment      MARKED      `→ now \`MARKED\``
 *   C-ABSENT    removed from the copy's index and from disk     undefined   `→ now \`ABSENT\``
 *
 * C-ABSENT and C-MARKED are the CONTROLS, and they are what make C-GUARDED mean anything:
 *   - C-ABSENT pins this harness to his published law in the one cell he measured (his B1 at a
 *     path length of 40 read 292 B / 5 L, and 227 + 40 + 25 = 292). Without it, a C-GUARDED
 *     departure cannot be told from a synthetic harness that differs from the real gate elsewhere.
 *   - C-MARKED is a PRESENT label six characters wide. Without it, a C-GUARDED departure is
 *     consistent with "the law is right when no label prints and wrong when one does" — C-MARKED
 *     forces the reading to label WIDTH.
 *
 * R1: no tracked published file is touched. R2: the copy is `sha256`-asserted equal to the tracked
 * gate before every drive, and `git check-ignore` is asserted rather than assumed. R3: both streams
 * captured separately, `spawnSync`, never `execFileSync`.
 *
 * P7: no quoted-character comparison and no exemption token appears contiguously in THIS source.
 * Every one is assembled at runtime, so `OPEN_BRACE`/`CLOSE_BRACE`/`MARKER` cannot match this file.
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

/* ------------------------------------------------- the fixture, assembled, never written literal */
const Q = String.fromCharCode(39);              // '
const ch = (c) => `${Q}${c}${Q}`;
const CMP = (c, op) => `  if (k === ${ch(c)}) d ${op} 1;`;
const OPEN = String.fromCharCode(123);          // {
const CLOSE = String.fromCharCode(125);         // }
// Assembled so `MARKER` (/brace-slicer-deliberate:\s*\S+/) cannot match THIS file's source.
const MARKER_DECL = `// ${'brace-slicer-deliberate'}${':'} unit-503 fixture, a deliberate naive slicer`;

/** A population member (brace comparisons both ways) that is also GUARDED (paren + colon). */
function fixtureSource({ marked }) {
  const body = [
    marked ? MARKER_DECL : '// unit-503 fixture — no exemption declared',
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
  ];
  return body.join('\n');
}

/* ----------------------------------------------------------------------------- the synthetic repo */
// Path length is pinned to 40 so the ABSENT cell is directly comparable to unit-502's out-of-sample
// B1 (1 entry @ 40 -> 292 B / 5 L), which was measured by the other seat in a different harness.
const WANT_LEN = 40;
const FIX_REL = `src/f${'x'.repeat(WANT_LEN - 'src/f'.length - '.mjs'.length)}.mjs`;
must(FIX_REL.length === WANT_LEN, `fixture path length is ${FIX_REL.length}, wanted ${WANT_LEN}`);

const gateBytes = readFileSync(join(ROOT, GATE_REL));
const gateSha = sha(gateBytes);

function buildRepo() {
  rmSync(SYN, { recursive: true, force: true });
  mkdirSync(join(SYN, 'scripts'), { recursive: true });
  mkdirSync(join(SYN, 'src'), { recursive: true });

  // R2: `check-ignore` ASSERTED, not assumed — a scratch copy at the wrong depth is a defect this
  // corpus has shipped four times.
  const ci = git(ROOT, ['check-ignore', '-q', SYN]);
  must(ci.status === 0, `scratch path is NOT gitignored by the real repo: ${SYN}`);

  cpSync(join(ROOT, GATE_REL), join(SYN, GATE_REL));
  cpSync(join(ROOT, 'scripts', 'lib'), join(SYN, 'scripts', 'lib'), { recursive: true });
  must(sha(readFileSync(join(SYN, GATE_REL))) === gateSha, 'gate copy is not byte-identical');

  // The baseline, and the gate copy and its lib, stay UNTRACKED in the synthetic repo on purpose:
  // `git ls-files` must return the fixture and nothing else, or the lib's own population members
  // would redden the newOnes limb and contaminate the stream under measurement.
  writeFileSync(join(SYN, BASE_REL), `${FIX_REL}\n`);

  must(git(SYN, ['init', '-q']).status === 0, 'git init failed in the synthetic repo');
  git(SYN, ['config', 'user.email', 'theseus@local']);
  git(SYN, ['config', 'user.name', 'unit-503 synthetic']);
}

function setFixture({ marked, tracked }) {
  const abs = join(SYN, FIX_REL);
  if (tracked) {
    writeFileSync(abs, fixtureSource({ marked }));
    must(git(SYN, ['add', '-f', FIX_REL]).status === 0, 'git add failed');
  } else {
    if (existsSync(abs)) rmSync(abs);
    git(SYN, ['rm', '--cached', '-q', FIX_REL]);
  }
  const ls = git(SYN, ['ls-files']).stdout.split('\n').filter(Boolean);
  must(
    tracked ? ls.length === 1 && ls[0] === FIX_REL : ls.length === 0,
    `synthetic ls-files is ${JSON.stringify(ls)} for tracked=${tracked}`,
  );
  return ls;
}

function drive(cell) {
  must(sha(readFileSync(join(SYN, GATE_REL))) === gateSha, `gate copy drifted before ${cell}`);
  const r = spawnSync(process.execPath, [join(SYN, GATE_REL)], { cwd: SYN, maxBuffer: 1 << 26 });
  writeFileSync(join(CAP, `${cell}.out`), r.stdout);
  writeFileSync(join(CAP, `${cell}.err`), r.stderr);
  const lines = (buf) => {
    if (!buf.length) return 0;
    const s = buf.toString('utf8');
    return s.split('\n').length - (s.endsWith('\n') ? 1 : 0);
  };
  return {
    rc: r.status,
    outBytes: r.stdout.length,
    errBytes: r.stderr.length,
    errLines: lines(r.stderr),
    errSha: r.stderr.length ? sha(r.stderr) : null,
    errText: r.stderr.toString('utf8'),
  };
}

/* ------------------------------------------------------------------------------------------ drive */
const LAW = (n, perEntry, len) => 227 + n * (len + perEntry);
const results = {};
try {
  buildRepo();

  for (const [cell, state] of [
    ['C-GUARDED', { marked: false, tracked: true }],
    ['C-MARKED', { marked: true, tracked: true }],
    ['C-ABSENT', { marked: false, tracked: false }],
  ]) {
    setFixture(state);
    results[cell] = drive(cell);
  }
} finally {
  rmSync(SYN, { recursive: true, force: true });
}

/* ------------------------------------------------------------------------------------- the grades */
const tok = (cell, label) => new RegExp(`${String.fromCharCode(96)}${label}${String.fromCharCode(96)}`)
  .test(results[cell].errText);
const noNewOnes = (cell) => !/new hand-rolled brace-balance body slicer/.test(results[cell].errText);

const verdict = {
  'P2.a  C-GUARDED rc = 1': results['C-GUARDED'].rc === 1,
  'P2.b  C-GUARDED stderr = 227 + 40 + 26 = 293 (his law + 1)':
    results['C-GUARDED'].errBytes === LAW(1, 26, WANT_LEN),
  'P2.c  C-GUARDED stderr lines = 5': results['C-GUARDED'].errLines === 5,
  'P2.d  C-GUARDED newOnes block ABSENT from stderr': noNewOnes('C-GUARDED'),
  'P2.e  C-GUARDED renders the token GUARDED': tok('C-GUARDED', 'GUARDED'),

  'P3.a  C-ABSENT rc = 1': results['C-ABSENT'].rc === 1,
  'P3.b  C-ABSENT stderr = 227 + 40 + 25 = 292 (his law EXACT)':
    results['C-ABSENT'].errBytes === LAW(1, 25, WANT_LEN),
  'P3.c  C-ABSENT stderr lines = 5': results['C-ABSENT'].errLines === 5,
  'P3.d  C-ABSENT reproduces his out-of-sample B1 figure (292 B / 5 L @ len 40)':
    results['C-ABSENT'].errBytes === 292 && results['C-ABSENT'].errLines === 5,

  'P4.a  C-MARKED rc = 1': results['C-MARKED'].rc === 1,
  'P4.b  C-MARKED stderr = 227 + 40 + 25 = 292 (his law exact, with a PRESENT label)':
    results['C-MARKED'].errBytes === LAW(1, 25, WANT_LEN),
  'P4.c  C-MARKED stderr lines = 5': results['C-MARKED'].errLines === 5,
  'P4.d  C-MARKED renders the token MARKED': tok('C-MARKED', 'MARKED'),

  'DIFFERENTIAL (restates P2.b/P3.b/P4.b)  C-GUARDED is exactly 1 byte more than BOTH controls':
    results['C-GUARDED'].errBytes - results['C-ABSENT'].errBytes === 1
    && results['C-GUARDED'].errBytes - results['C-MARKED'].errBytes === 1,
  'POST-HOC, not pre-registered  the two 6-char-label cells agree in COUNT and differ in BYTES':
    results['C-ABSENT'].errBytes === results['C-MARKED'].errBytes
    && results['C-ABSENT'].errSha !== results['C-MARKED'].errSha,
};

console.log(JSON.stringify({
  gateSha,
  fixturePath: FIX_REL,
  fixturePathLength: FIX_REL.length,
  publishedLaw: 'bytes = 227 + SUM(len(path_i) + 25), declared scope: all ABSENT',
  cells: Object.fromEntries(Object.entries(results).map(([k, v]) => [k, {
    rc: v.rc, errBytes: v.errBytes, errLines: v.errLines, errSha: v.errSha, outBytes: v.outBytes,
  }])),
  stderrTexts: Object.fromEntries(Object.entries(results).map(([k, v]) => [k, v.errText])),
  verdict,
}, null, 2));
