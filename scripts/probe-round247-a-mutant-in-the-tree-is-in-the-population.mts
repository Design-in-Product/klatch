/**
 * Round 247 — the mutation harness is inside the population its subject measures.
 *
 * ## What this exists to hold
 *
 * Round 245 introduced the pattern both seats have used since: to mutation-test a module, copy it
 * beside itself under a dot-prefixed name, copy the driver with its import rewritten, run, delete.
 * The dot prefix was chosen to look inert. It is not inert to a `readdirSync`.
 *
 * Driven 2026-09-21, before any repair: **two verbatim copies, zero mutation, and
 * `probe-round224` went from `All 63 regression checks passed` (exit 0) to
 * `2 of 63 regression check(s) FAILED` (exit 1)** — arm E reporting a caller of the escape hatch
 * that was its own copy, arm I reporting a separator-blind regex that was its own quoted control.
 * My own Round 245 floor probe has the same exposure, and its Round 245 capability run reddened
 * arm B at "14 vs 13" against exactly such a file — which I read at the time as a nested-module
 * finding.
 *
 * > **Rule: a mutation harness that stages its working copies inside the tree its subject
 * > enumerates has changed the measurement it is auditing. The collateral red is
 * > indistinguishable from a real one, and it points at the arm rather than at the harness.**
 *
 * Sibling to Theseus's Round 246 §2 one level over: there, a complete file list with an extractor
 * blind to what was inside the files; here, an extractor that is right and a file list the
 * *harness* silently added to.
 *
 * ## The repair, and where it already existed
 *
 * `probe-round240-…:123` has filtered `!f.startsWith('.')` since it was written. Round 247 applies
 * the same spelling to the three population sites in `probe-round224` and the two in
 * `probe-round245`, and strips comments in arm E's scan — arm I of the same file learned in Round
 * 225 that a citation is not a call, and arm E, eight lines up, never got the lesson. Driven: a
 * file whose only occurrence of the hatch is inside a `//` comment reddened arm E.
 *
 * ## Arms
 *
 *   A  staging verbatim dot-copies leaves both probes green — the repair, driven end to end
 *   B  and the copies really were there and really are visible to an unguarded read — non-vacuity
 *   C  a comment-only citation of the hatch leaves arm E green, and live code still reddens it
 *   D  a defect confined to `summariseAndExit` now reddens the suite — the gap Round 247 closed
 *   E  the population statement: which `scripts/` scan sites guard, and which do not (measurement)
 *
 * Run:  npx tsx scripts/probe-round247-a-mutant-in-the-tree-is-in-the-population.mts
 *
 * Zero model calls. No server, no port, no DB, no read of `~/.claude`. Every working file is
 * removed in a `finally` and the removal is asserted by `readdirSync`, not assumed.
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { summariseAndExit, type ProbeVerdict } from './lib/probe-outcome.mts';

const REPO = path.resolve(import.meta.dirname, '..');
const SCRIPTS = path.join(REPO, 'scripts');
const LIB_DIR = path.join(SCRIPTS, 'lib');
const TSX = path.join(REPO, 'node_modules/.bin/tsx');
const TESTS = path.join(REPO, 'packages/server/src/__tests__');

const R224 = 'probe-round224-a-skip-must-not-summarise-as-a-pass.mts';
const R245 = 'probe-round245-the-shared-lib-coverage-floor.mts';
const R247_TEST = 'round247-the-exit-code-is-driven-not-read.test.ts';

const results: ProbeVerdict[] = [];
function check(arm: string, what: string, pass: boolean, detail: string, kind = 'regression') {
  results.push({ arm, check: what, pass, kind });
  const tag = pass ? 'PASS' : kind === 'measurement' ? 'MEAS' : 'FAIL';
  console.log(`${tag} [${arm}] ${what}\n      ${detail}`);
}

const PACKAGES_BEFORE = execFileSync('git', ['-C', REPO, 'status', '--porcelain', 'packages'], { encoding: 'utf8' });

type Run = { status: number; stdout: string };
function run(file: string): Run {
  try {
    return { status: 0, stdout: execFileSync(TSX, [file], { cwd: REPO, encoding: 'utf8' }) };
  } catch (e) {
    const err = e as { status?: number; stdout?: string };
    if (typeof err.status !== 'number') throw e;
    return { status: err.status, stdout: err.stdout ?? '' };
  }
}

/**
 * A probe's own summary line, and the LAST one in the stream on purpose. The first version of this
 * took the first match, and reported `All 2 regression checks passed` for a run that exited 1 —
 * round224 quotes that exact sentence in arm A's detail, because arm A's whole subject is the
 * headline. A scraper that takes the first match cannot tell a probe's verdict from a probe's
 * fixture.
 */
function summaryLine(stdout: string): string {
  const matches = stdout.match(/^(All \d+ regression checks passed\.|\d+ of \d+ regression check\(s\) FAILED\.|INCONCLUSIVE — .*)$/gm);
  return matches?.at(-1) ?? 'no summary line found';
}

/** Exactly-once anchor replacement: a silent no-op rewrite is how a harness runs the original. */
function mutate(src: string, from: string, to: string, label: string): string {
  const n = src.split(from).length - 1;
  if (n !== 1) throw new Error(`${label}: anchor occurs ${n} time(s), expected exactly 1`);
  const out = src.replace(from, to);
  if (out === src) throw new Error(`${label}: replacement was a no-op`);
  return out;
}

const staged: string[] = [];
const stage = (p: string, contents: string) => { fs.writeFileSync(p, contents); staged.push(p); };

try {
  // ── A — the repair, driven: verbatim dot-copies must not move either probe ──
  const cleanR224 = run(path.join(SCRIPTS, R224));
  const cleanR245 = run(path.join(SCRIPTS, R245));
  check('A', 'both probes are green on a clean tree — the staging condition for this whole arm',
    cleanR224.status === 0 && cleanR245.status === 0,
    `round224 exit ${cleanR224.status}, round245 exit ${cleanR245.status}`);

  const libCopy = path.join(LIB_DIR, '.probe-outcome-r247-harness.mts');
  const probeCopy = path.join(SCRIPTS, '.probe-round224-r247-harness.mts');
  stage(libCopy, fs.readFileSync(path.join(LIB_DIR, 'probe-outcome.mts'), 'utf8'));
  stage(probeCopy, fs.readFileSync(path.join(SCRIPTS, R224), 'utf8'));

  const stagedR224 = run(path.join(SCRIPTS, R224));
  const stagedR245 = run(path.join(SCRIPTS, R245));
  check('A', 'round224 is unmoved by two verbatim dot-copies (it exited 1, 2 of 63 red, before the guard)',
    stagedR224.status === 0, `exit ${stagedR224.status}; ${summaryLine(stagedR224.stdout)}`);
  check('A', 'round245 is unmoved too — its arm B counted a dot-copy as a fourteenth module',
    stagedR245.status === 0, `exit ${stagedR245.status}`);

  // ── B — non-vacuity: the copies are really there, and an unguarded read really sees them ──
  const naiveScripts = fs.readdirSync(SCRIPTS).filter((n) => n.endsWith('.mts') || n.endsWith('.mjs'));
  const guardedScripts = naiveScripts.filter((n) => !n.startsWith('.'));
  const naiveLib = fs.readdirSync(LIB_DIR).filter((n) => /\.(mts|mjs)$/.test(n));
  const guardedLib = naiveLib.filter((n) => !n.startsWith('.'));
  check('B', 'an unguarded read of scripts/ counts the staged copy and a guarded one does not',
    naiveScripts.length === guardedScripts.length + 1,
    `unguarded ${naiveScripts.length} vs guarded ${guardedScripts.length} while staged`);
  check('B', 'same in scripts/lib — this is the +1 that read as "14 vs 13"',
    naiveLib.length === guardedLib.length + 1,
    `unguarded ${naiveLib.length} vs guarded ${guardedLib.length} while staged`);

  // ── D — the gap this round closed: a defect confined to summariseAndExit ──
  //
  // Staged here because the copies are already in place. The mutant library is the dot-copy; the
  // probe copy is repointed at it. Round 224 is expected to stay green — that IS the finding — so
  // the regression check is on the SUITE noticing, not on the probe failing to.
  fs.writeFileSync(libCopy, mutate(fs.readFileSync(libCopy, 'utf8'),
    'process.exit(outcome.code);', 'process.exit(0);', 'M1'));
  fs.writeFileSync(probeCopy, mutate(fs.readFileSync(probeCopy, 'utf8'),
    "'./lib/probe-outcome.mts'", "'./lib/.probe-outcome-r247-harness.mts'", 'M1 import'));
  const mutantProbe = run(probeCopy);
  check('D', 'the probe that audits this module cannot see the mutation — recorded, not asserted away',
    true,
    `mutant round224 exit ${mutantProbe.status}; ${summaryLine(mutantProbe.stdout)}`,
    'measurement');

  // The same mutation, through the suite. Mutant library goes to a tmpdir this time — outside
  // every tree any probe enumerates, which is the other half of the remedy.
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'klatch-r247-probe-'));
  const tmpLib = path.join(tmp, 'probe-outcome.mts');
  fs.writeFileSync(tmpLib, mutate(fs.readFileSync(path.join(LIB_DIR, 'probe-outcome.mts'), 'utf8'),
    'process.exit(outcome.code);', 'process.exit(0);', 'M1 tmp'));
  const testSrc = fs.readFileSync(path.join(TESTS, R247_TEST), 'utf8');
  const mutTest = path.join(TESTS, 'zzz-r247-probe-mutant.test.ts');
  stage(mutTest, mutate(
    mutate(testSrc, "'../../../../scripts/lib/probe-outcome.mts'", JSON.stringify(tmpLib), 'suite import'),
    "const LIB = path.join(REPO, 'scripts/lib/probe-outcome.mts');", `const LIB = ${JSON.stringify(tmpLib)};`,
    'suite LIB constant',
  ));
  let suiteStatus = -1;
  let suiteOut = '';
  try {
    suiteOut = execFileSync('npx', ['vitest', 'run', `src/__tests__/${path.basename(mutTest)}`, '--root', 'packages/server'],
      { cwd: REPO, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    suiteStatus = 0;
  } catch (e) {
    const err = e as { status?: number; stdout?: string; stderr?: string };
    suiteStatus = err.status ?? -1;
    suiteOut = (err.stdout ?? '') + (err.stderr ?? '');
  }
  fs.rmSync(tmp, { recursive: true, force: true });
  const failedCount = /(\d+) failed/.exec(suiteOut.replace(/\u001b\[[0-9;]*m/g, ''))?.[1] ?? '?';
  check('D', 'and the suite DOES see it — the exit code is now asserted somewhere',
    suiteStatus !== 0, `vitest exit ${suiteStatus}, ${failedCount} test(s) failed under the mutant`);

  fs.rmSync(libCopy, { force: true });
  fs.rmSync(probeCopy, { force: true });

  // ── C — a citation of the escape hatch is not a call ──
  //
  // Not dot-prefixed on purpose: a dot-prefixed fixture would be excluded by the guard from arm A
  // and would prove nothing about the comment-stripping.
  // The fixture's text is assembled at runtime rather than written as a literal here. That is
  // deliberate, and it is Theseus's Round 246 §4 resolution rather than a trick: a scanner cannot
  // separate "a string I am writing to disk" from "a call I make" — the string contents are how a
  // probe names its subject — so the file minting the fixture is the one that has to keep the
  // spelling out of its own live code. The first version of this probe did not, and it reddened
  // arm E of round224 against itself, which is this round's own rule arriving one level down.
  const HATCH = `${'inapplic'}${'able'}:`;
  const citation = path.join(SCRIPTS, 'zz-r247-citation-fixture.mts');
  stage(citation, [
    '// A fixture. Its only mention of the hatch is on the next comment line:',
    `//   ${HATCH} ['[G] no instance in this corpus'],`,
    'export const nothing = 1;',
    '',
  ].join('\n'));
  const citedR224 = run(path.join(SCRIPTS, R224));
  check('C', 'a comment-only citation of the hatch leaves arm E green (it reddened it before the repair)',
    citedR224.status === 0, `exit ${citedR224.status}`);

  // Two-sided: the same text in LIVE code must still be caught, or the repair is just a hole.
  fs.writeFileSync(citation, [
    'export const live = {',
    `  ${HATCH} ['[G] no instance in this corpus'],`,
    '};',
    '',
  ].join('\n'));
  const liveR224 = run(path.join(SCRIPTS, R224));
  check('C', 'and the same text in live code still reddens it — the scan was narrowed, not disabled',
    liveR224.status === 1 && /FAIL \[E\]/.test(liveR224.stdout),
    `exit ${liveR224.status}; ${liveR224.stdout.split('\n').filter((l) => /^FAIL \[E\]/.test(l)).length} arm-E failure(s)`);
  fs.rmSync(citation, { force: true });

  // ── E — the population statement ──
  const isComment = (l: string) => /^\s*(\/\/|\*|\/\*)/.test(l);
  const sites: Array<{ file: string; line: number; guarded: boolean }> = [];
  for (const n of fs.readdirSync(SCRIPTS).filter((f) => /\.(mts|mjs)$/.test(f) && !f.startsWith('.'))) {
    const lines = fs.readFileSync(path.join(SCRIPTS, n), 'utf8').split('\n');
    lines.forEach((l, i) => {
      if (isComment(l) || !/readdirSync\(/.test(l)) return;
      const ctx = lines.slice(i, i + 4).filter((x) => !isComment(x)).join(' ');
      if (!/['"]scripts['"]|SCRIPTS|LIB_DIR/.test(ctx)) return;
      sites.push({ file: n, line: i + 1, guarded: /startsWith\(['"]\.['"]\)/.test(ctx) });
    });
  }
  // This probe's own two reads are CLEANUP counters — they look for its working files by name and
  // feed no population — so they are reported separately rather than counted as exposed sites. Said
  // out loud because "exempt yourself from your own scan" is how a scan stops meaning anything; the
  // number both ways is printed.
  const self = path.basename(import.meta.filename);
  const exposed = sites.filter((s) => !s.guarded && s.file !== self);
  const selfSites = sites.filter((s) => s.file === self).length;
  check('E', `${sites.length} live readdirSync site(s) enumerate scripts/ or scripts/lib; ${exposed.length} unguarded outside this file (${selfSites} cleanup counters here)`,
    true,
    exposed.length ? exposed.map((s) => `${s.file}:${s.line}`).join(', ') : 'all guarded',
    'measurement');
  check('E', 'the sites Round 247 repaired are guarded — a floor, not a pin on the total',
    sites.filter((s) => s.guarded && (s.file === R224 || s.file === R245)).length >= 4,
    `${sites.filter((s) => s.guarded && (s.file === R224 || s.file === R245)).length} guarded sites across round224 + round245`);
} finally {
  for (const p of staged) fs.rmSync(p, { force: true });
  const leftInScripts = fs.readdirSync(SCRIPTS).filter((n) => /r247-harness|r247-citation/.test(n));
  const leftInLib = fs.readdirSync(LIB_DIR).filter((n) => /r247-harness/.test(n));
  const leftInTests = fs.readdirSync(TESTS).filter((n) => /r247-probe-mutant/.test(n));
  check('Z', 'every working file removed — counted by readdirSync, not assumed',
    leftInScripts.length + leftInLib.length + leftInTests.length === 0,
    `scripts ${leftInScripts.length}, lib ${leftInLib.length}, __tests__ ${leftInTests.length}`);
  const after = execFileSync('git', ['-C', REPO, 'status', '--porcelain', 'packages'], { encoding: 'utf8' });
  check('Z', 'packages/ untouched by this run', after === PACKAGES_BEFORE,
    after === PACKAGES_BEFORE ? 'identical git status before and after' : `before ${JSON.stringify(PACKAGES_BEFORE)} after ${JSON.stringify(after)}`);
}

console.log('\n─── summary ───');
for (const r of results) console.log(`  ${r.pass ? 'PASS' : r.kind === 'measurement' ? 'MEAS' : 'FAIL'} [${r.arm}] ${r.check}`);

summariseAndExit({ probeName: 'probe-round247-a-mutant-in-the-tree-is-in-the-population', results });
