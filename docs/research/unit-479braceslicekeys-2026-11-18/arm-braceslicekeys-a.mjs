#!/usr/bin/env node
/**
 * **unit-479braceslicekeys arm A — the two brace-slicer population keys, member-for-member, over
 * ONE tree in ONE process.**
 *
 * Pre-registration: `PRE-REGISTRATION.md`, pushed at 14:50:18 PT before this file existed.
 *
 * ## What is sliced and what is typed, said at the top because it decides what the legs can grade
 *
 * - **The 469 census reader is not re-implemented.** It is the tracked
 *   `unit-469braceslice-2026-11-17/arm-braceslice-a.mjs`, run as a child process over this tree,
 *   after `A0` asserts it is byte-identical (sha256) to the blob at its publishing rev `9f00b765`.
 *   Its member lists are **parsed out of its own stdout**.
 * - **The published member list is captured out of `drive3.arma.out`**, never typed. `A1` fails
 *   `CAPTURE-FAILED` if the parse does not reproduce the artefact's own printed class counts.
 * - **The gate's KEYS are captured out of `scripts/verify-decl-body-slicers.mjs`'s source text** at
 *   drive time (the `cmp` factory, the five character arguments, `EXTS`, `SELF`, `MARKER`) and
 *   evaluated — not re-typed. `stripSource` is imported from the real shared module.
 * - **What IS typed is the gate's classification loop** (control flow, not the key). That is why
 *   `B1` exists: the typed loop must reproduce the **live gate's own four printed figures** —
 *   population, UNGUARDED, MARKED, GUARDED — from a run of the tracked gate in this same process.
 *   A reader that reproduces the instrument's published numbers exactly is a slice of it; one that
 *   does not is a hand-typed rival, and this seat has a filed lesson against publishing those.
 *
 * ## The one thing this arm must not do
 *
 * R5: nothing is edited. No write to the gate, its baseline, or the 469 arm. R6: no figure is
 * reconciled by arithmetic across two dates — every number below comes off this tree.
 */

import { readFileSync, existsSync, writeFileSync } from 'node:fs';
import { join, dirname, resolve, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { stripSource } from '../../../scripts/lib/strip-source.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '../../..');
const ARM469 = 'docs/research/unit-469braceslice-2026-11-17/arm-braceslice-a.mjs';
const PUBLISHING_REV = '9f00b765';
const DRIVE3 = join(ROOT, 'docs/research/unit-469braceslice-2026-11-17/drive3.arma.out');
const GATE = 'scripts/verify-decl-body-slicers.mjs';

const legs = [];
const red = [];
const refused = [];
const check = (name, ok, msg) => {
  legs.push(`  ${ok ? 'ok  ' : 'RED '} ${name} — ${msg}`);
  if (!ok) red.push(`${name}: ${msg}`);
};
const die = (why) => { console.log(`\nCAPTURE-FAILED — ${why}`); process.exit(3); };
const git = (...a) => execFileSync('git', ['-C', ROOT, ...a], { encoding: 'utf8' });
const sha = (s) => createHash('sha256').update(s).digest('hex').slice(0, 16);

console.log('unit-479braceslicekeys arm A — two population keys, one tree');
console.log(`  HEAD: ${git('rev-parse', 'HEAD').trim()}`);

/* ================================================== R1: the untracked state, printed at drive time */
const porcelain = git('status', '--porcelain').split('\n').filter(Boolean);
const EXT_SET = new Set(['.ts', '.mts', '.js', '.mjs', '.cts', '.cjs', '.tsx']);
const ROOTS469 = ['scripts', 'docs/research', 'docs/operations', 'packages'];
const untrackedCode = porcelain
  .filter((l) => l.startsWith('??'))
  .map((l) => l.slice(3).trim())
  .filter((p) => EXT_SET.has(extname(p)) && ROOTS469.some((r) => p.startsWith(`${r}/`)));
console.log(`  R1 — git status --porcelain: ${porcelain.length} entr(ies); untracked code files under the four 469 roots: ${untrackedCode.length}`);
for (const p of untrackedCode) console.log(`      UNTRACKED ${p}`);

/* ================================================== A0: the 469 reader is the PUBLISHED reader */
const liveArm = readFileSync(join(ROOT, ARM469), 'utf8');
let revArm;
try { revArm = git('show', `${PUBLISHING_REV}:${ARM469}`); } catch (e) { die(`could not read ${ARM469} at ${PUBLISHING_REV}: ${e.message}`); }
check('A0', sha(liveArm) === sha(revArm),
  `469 arm in this worktree vs ${PUBLISHING_REV}: sha256/16 ${sha(liveArm)} vs ${sha(revArm)}`);
if (sha(liveArm) !== sha(revArm)) die('the reader is not the published reader; every comparison below would be across two readers and two dates');

/* ================================================== the shared parser for 469-arm stdout */
// Rows are aligned and padded (`      UNGUARDED <path>`), so the path token is CAPTURED. The
// liveness section below them starts its rows with LIVE / LATENT / UNKNOWN, so this key cannot
// absorb them. A row shape this arm does not expect is a capture failure, not a silent drop.
const ROW = /^ {6}(GUARDED|AMBIGUOUS|UNGUARDED) +(\S+)$/;
const COUNT = {
  pop: /^ {2}population \|P\| \(compares against an open brace\): +(\d+)$/m,
  slicer: /^ {2}SLICER \(also compares against a close brace\): +(\d+)$/m,
  guarded: /^ {2}GUARDED \(paren-match within 400 chars before\): (\d+)$/m,
  ambiguous: /^ {2}AMBIGUOUS \(window-sensitive, WITHDRAWN\): +(\d+)$/m,
  unguarded: /^ {2}UNGUARDED: +(\d+)$/m,
};
const parse469 = (text, label) => {
  const nums = {};
  for (const [k, re] of Object.entries(COUNT)) {
    const m = text.match(re);
    if (!m) die(`${label}: could not capture the ${k} count line`);
    nums[k] = Number(m[1]);
  }
  const cls = new Map();
  for (const line of text.split('\n')) {
    const m = line.match(ROW);
    if (m) cls.set(m[2], m[1]);
  }
  const by = (v) => [...cls].filter(([, c]) => c === v).map(([p]) => p);
  const got = { guarded: by('GUARDED').length, ambiguous: by('AMBIGUOUS').length, unguarded: by('UNGUARDED').length };
  for (const k of ['guarded', 'ambiguous', 'unguarded']) {
    if (got[k] !== nums[k]) die(`${label}: parsed ${got[k]} ${k} member rows but the artefact prints ${nums[k]} — R2 forbids proceeding on a list that does not reproduce its own counts`);
  }
  if (cls.size !== nums.slicer) die(`${label}: parsed ${cls.size} member rows against a printed SLICER count of ${nums.slicer}`);
  return { nums, cls };
};

/* ================================================== A1: the PUBLISHED member list, captured */
if (!existsSync(DRIVE3)) die(`published artefact missing at ${DRIVE3}`);
const published = parse469(readFileSync(DRIVE3, 'utf8'), 'drive3.arma.out (published)');
check('A1', published.cls.size === published.nums.slicer,
  `published list captured from drive3.arma.out: |P| ${published.nums.pop}, SLICER ${published.nums.slicer} = ${published.nums.guarded} guarded + ${published.nums.ambiguous} ambiguous + ${published.nums.unguarded} unguarded, all reproduced from the member rows`);

/* ================================================== A2: the SAME reader, THIS tree */
const todayOut = execFileSync('node', [join(ROOT, ARM469)], { encoding: 'utf8', cwd: ROOT, maxBuffer: 64 * 1024 * 1024 });
writeFileSync(join(HERE, 'drive-inarm.469arm.out'), todayOut);
const today = parse469(todayOut, '469 arm at HEAD (this process)');
check('A2', today.cls.size === today.nums.slicer,
  `same reader over this tree: |P| ${today.nums.pop}, SLICER ${today.nums.slicer} = ${today.nums.guarded} + ${today.nums.ambiguous} + ${today.nums.unguarded}`);

/* ================================================== P1 */
const p1 = today.nums.slicer >= 69 && today.nums.unguarded >= 57;
check('P1', p1,
  `registered SLICER >= 69 and UNGUARDED >= 57 (the 11/18 START incidental reading was 57/69); measured ${today.nums.unguarded}/${today.nums.slicer} — ${p1 ? 'HIT' : 'REFUTED'}`);

/* ================================================== the member diff across the two dates (P2, P3) */
const pubSet = new Set(published.cls.keys());
const todaySet = new Set(today.cls.keys());
const arrivals = [...todaySet].filter((p) => !pubSet.has(p)).sort();
const departures = [...pubSet].filter((p) => !todaySet.has(p)).sort();

console.log(`\nD1 — 469 SLICER membership, published (${pubSet.size}) vs this tree (${todaySet.size})`);
console.log(`  arrivals:   ${arrivals.length}`);
const addedAfter = [];
const existedBefore = [];
for (const p of arrivals) {
  let firstCommit = '';
  try {
    firstCommit = git('log', '--diff-filter=A', '--format=%H %ad', '--date=short', '--', p).trim().split('\n').filter(Boolean).pop() || '';
  } catch { /* fall through to untracked */ }
  let verdict;
  if (!firstCommit) verdict = 'UNTRACKED-OR-NO-ADD-COMMIT';
  else {
    const h = firstCommit.split(' ')[0];
    let isAfter;
    try {
      execFileSync('git', ['-C', ROOT, 'merge-base', '--is-ancestor', h, PUBLISHING_REV], { stdio: 'ignore' });
      isAfter = false; // the adding commit is an ancestor of the publishing rev → the file existed then
    } catch { isAfter = true; }
    verdict = isAfter ? 'ADDED-AFTER' : 'EXISTED-AT-REV';
    (isAfter ? addedAfter : existedBefore).push(p);
  }
  console.log(`      + ${verdict.padEnd(26)} ${p}  ${firstCommit}`);
}
console.log(`  departures: ${departures.length}`);
for (const p of departures) {
  const onDisk = existsSync(join(ROOT, p));
  let tracked = true;
  try { git('ls-files', '--error-unmatch', p); } catch { tracked = false; }
  console.log(`      - ${(onDisk ? 'ON-DISK' : 'ABSENT-FROM-DISK').padEnd(18)} ${tracked ? 'TRACKED  ' : 'UNTRACKED'} ${p}`);
}

const p2 = arrivals.length > 0 && existedBefore.length === 0 && addedAfter.length === arrivals.length;
check('P2', p2,
  `registered: every arrival is a path added after ${PUBLISHING_REV}. arrivals ${arrivals.length} = ${addedAfter.length} added-after + ${existedBefore.length} existed-at-rev + ${arrivals.length - addedAfter.length - existedBefore.length} untracked/no-add — ${p2 ? 'HIT' : 'REFUTED'}`);
check('P3', departures.length === 0,
  `registered 0 departures; measured ${departures.length}${departures.length ? ` — ${departures.join(', ')}` : ''} — ${departures.length === 0 ? 'HIT' : 'REFUTED'}`);

/* ================================================== the gate's keys, CAPTURED from its source */
const gateSrc = readFileSync(join(ROOT, GATE), 'utf8');
const grab = (re, what) => { const m = gateSrc.match(re); if (!m) die(`could not capture ${what} out of ${GATE}`); return m; };
const cmpLine = grab(/^const cmp = \(ch\) => (new RegExp\(.*\));$/m, 'the cmp factory')[1];
// eslint-disable-next-line no-new-func
const cmp = new Function('ch', `return ${cmpLine};`);
const chars = {};
for (const name of ['OPEN_BRACE', 'CLOSE_BRACE', 'LPAREN', 'RPAREN', 'COLON']) {
  chars[name] = grab(new RegExp(`^const ${name} = cmp\\('(.+?)'\\);$`, 'm'), `the ${name} character`)[1];
}
const K = Object.fromEntries(Object.entries(chars).map(([n, c]) => [n, cmp(c)]));
const MARKER = new RegExp(grab(/^const MARKER = \/(.*)\/;$/m, 'the MARKER key')[1]);
const gateExts = new Set(JSON.parse(grab(/^const EXTS = new Set\((\[[^\]]*\])\);$/m, 'the gate EXTS set')[1].replace(/'/g, '"')));
const gateSelf = new Set(grab(/^const SELF = new Set\(\[([\s\S]*?)\]\);$/m, 'the gate SELF set')[1]
  .split(',').map((s) => s.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean));
console.log(`\n  keys captured from ${GATE}: cmp(${Object.values(chars).join(' ')}) · MARKER ${MARKER} · EXTS ${[...gateExts].join(' ')} · SELF ${gateSelf.size} path(s)`);

/* ================================================== the gate's population, by the captured keys */
const tracked = git('ls-files').split('\n').map((l) => l.trim()).filter(Boolean);
const gateVerdicts = new Map();
for (const rel of tracked) {
  if (gateSelf.has(rel) || !gateExts.has(extname(rel))) continue;
  let raw;
  try { raw = readFileSync(join(ROOT, rel), 'utf8'); } catch { continue; }
  const code = stripSource(raw, false);
  if (!K.OPEN_BRACE.test(code) || !K.CLOSE_BRACE.test(code)) continue;
  if (MARKER.test(raw)) gateVerdicts.set(rel, 'MARKED');
  else if (K.LPAREN.test(code) && K.RPAREN.test(code) && K.COLON.test(code)) gateVerdicts.set(rel, 'GUARDED');
  else gateVerdicts.set(rel, 'UNGUARDED');
}
const gateCount = (v) => [...gateVerdicts.values()].filter((x) => x === v).length;

/* ================================================== B1: the typed loop must reproduce the LIVE gate */
let gateOut = '';
let gateRc = 0;
try { gateOut = execFileSync('node', [join(ROOT, GATE)], { encoding: 'utf8', cwd: ROOT }); }
catch (e) { gateOut = `${e.stdout || ''}${e.stderr || ''}`; gateRc = e.status; }
writeFileSync(join(HERE, 'drive-inarm.gate.out'), gateOut);
const gp = (re, what) => { const m = gateOut.match(re); if (!m) die(`could not capture ${what} out of the live gate's own output`); return Number(m[1]); };
const live = {
  pop: gp(/^ {2}population \(compares against both braces\): (\d+)$/m, 'the gate population'),
  UNGUARDED: gp(/^ {6}UNGUARDED {2}(\d+)$/m, 'the gate UNGUARDED count'),
  MARKED: gp(/^ {6}MARKED {5}(\d+)$/m, 'the gate MARKED count'),
  GUARDED: gp(/^ {6}GUARDED {4}(\d+)$/m, 'the gate GUARDED count'),
};
const b1 = gateVerdicts.size === live.pop && gateCount('UNGUARDED') === live.UNGUARDED
  && gateCount('MARKED') === live.MARKED && gateCount('GUARDED') === live.GUARDED;
check('B1', b1,
  `captured-key reader vs the LIVE gate's own printed figures (rc=${gateRc}): population ${gateVerdicts.size}/${live.pop}, UNGUARDED ${gateCount('UNGUARDED')}/${live.UNGUARDED}, MARKED ${gateCount('MARKED')}/${live.MARKED}, GUARDED ${gateCount('GUARDED')}/${live.GUARDED}`);
if (!b1) die('the reader does not reproduce the instrument it claims to slice; its member list is a rival, not a slice');

/* ================================================== D2: the two populations, member-for-member */
const gateSet = new Set(gateVerdicts.keys());
const gateOnly = [...gateSet].filter((p) => !todaySet.has(p)).sort();
const armOnly = [...todaySet].filter((p) => !gateSet.has(p)).sort();
const both = [...todaySet].filter((p) => gateSet.has(p)).sort();

console.log(`\nD2 — populations over ONE tree: gate ${gateSet.size} · 469 SLICER ${todaySet.size} · in both ${both.length}`);
console.log(`  GATE-ONLY: ${gateOnly.length}`);
const causeTally = {};
const unexplainedGate = [];
for (const p of gateOnly) {
  const outsideRoots = !ROOTS469.some((r) => p.startsWith(`${r}/`));
  const tsx = extname(p) === '.tsx';
  const cause = outsideRoots ? 'OUTSIDE-THE-FOUR-ROOTS' : tsx ? 'TSX-EXT-469-DOES-NOT-WALK' : 'UNEXPLAINED';
  causeTally[cause] = (causeTally[cause] || 0) + 1;
  if (cause === 'UNEXPLAINED') unexplainedGate.push(p);
  console.log(`      G ${cause.padEnd(26)} ${gateVerdicts.get(p).padEnd(10)} ${p}`);
}
console.log(`  469-ONLY: ${armOnly.length}`);
const armCause = {};
const unexplainedArm = [];
for (const p of armOnly) {
  let cause;
  if (untrackedCode.includes(p)) cause = 'UNTRACKED-IN-THIS-WORKTREE';
  else if (!gateExts.has(extname(p))) cause = 'EXT-THE-GATE-SKIPS';
  else if (gateSelf.has(p)) cause = 'GATE-SELF-EXCLUSION';
  else {
    const raw = readFileSync(join(ROOT, p), 'utf8');
    const code = stripSource(raw, false);
    const rawHit = K.OPEN_BRACE.test(raw) && K.CLOSE_BRACE.test(raw);
    const codeHit = K.OPEN_BRACE.test(code) && K.CLOSE_BRACE.test(code);
    cause = rawHit && !codeHit ? 'COMMENT-ONLY-COMPARISON' : 'UNEXPLAINED';
  }
  armCause[cause] = (armCause[cause] || 0) + 1;
  if (cause === 'UNEXPLAINED') unexplainedArm.push(p);
  console.log(`      A ${cause.padEnd(26)} ${today.cls.get(p).padEnd(10)} ${p}`);
}

const p4 = gateOnly.length >= 1 && unexplainedGate.length === 0;
check('P4', p4,
  `registered gate-only >= 1 with every member explained by root-or-.tsx; measured ${gateOnly.length} (${Object.entries(causeTally).map(([k, v]) => `${k}=${v}`).join(' · ') || 'none'}) — ${p4 ? 'HIT' : 'REFUTED'}`);
const p5 = armOnly.length >= 1 && (armCause['COMMENT-ONLY-COMPARISON'] || 0) >= 1;
check('P5', p5,
  `registered 469-only >= 1 with >= 1 comment-only comparison; measured ${armOnly.length} (${Object.entries(armCause).map(([k, v]) => `${k}=${v}`).join(' · ') || 'none'}) — ${p5 ? 'HIT' : 'REFUTED'}`);
const p6 = gateOnly.length >= 1 && armOnly.length >= 1;
check('P6', p6,
  `registered: the gate's docblock claim "cannot disagree about who is in the population" is FALSE, with both differences non-empty; measured gate-only ${gateOnly.length}, 469-only ${armOnly.length} — ${p6 ? 'HIT (claim refuted)' : 'REFUTED (claim survives)'}`);
const p8 = gateOnly.length <= 5;
check('P8', p8, `registered gate-only <= 5; measured ${gateOnly.length} — ${p8 ? 'HIT' : 'REFUTED'}`);

if (untrackedCode.length) refused.push(`P5 mechanism claim WITHDRAWN per R1: ${untrackedCode.length} untracked code file(s) under the four roots at drive time`);

/* ================================================== D3: the VERDICTS, over the shared members (P7) */
const pairs = new Map();
for (const p of both) {
  const g = gateVerdicts.get(p);
  const a = today.cls.get(p);
  const k = `gate=${g} 469=${a}`;
  if (!pairs.has(k)) pairs.set(k, []);
  pairs.get(k).push(p);
}
console.log(`\nD3 — verdicts over the ${both.length} shared members (cross-tab, not two totals)`);
for (const [k, ps] of [...pairs].sort((x, y) => y[1].length - x[1].length)) {
  console.log(`      ${k.padEnd(34)} ${String(ps.length).padStart(3)}`);
}
const disagree = [];
for (const [k, ps] of pairs) {
  const g = /gate=(\w+)/.exec(k)[1];
  const a = /469=(\w+)/.exec(k)[1];
  if ((g === 'UNGUARDED' && a === 'GUARDED') || (g === 'GUARDED' && a === 'UNGUARDED')) disagree.push(...ps.map((p) => `${k} ${p}`));
}
console.log(`  hard disagreements (one says GUARDED, the other UNGUARDED): ${disagree.length}`);
for (const d of disagree) console.log(`      X ${d}`);
check('P7', disagree.length >= 1,
  `registered >= 1 hard verdict disagreement over the shared population; measured ${disagree.length} — ${disagree.length >= 1 ? 'HIT' : 'REFUTED'}`);

/* ================================================== report */
console.log('\nlegs:');
for (const l of legs) console.log(l);
console.log(`\n${red.length ? 'red' : 'ok'} legs=${red.length} red=[${red.join(' | ')}] refused=[${refused.join(' | ')}]`);
console.log(`POPULATIONS: gate ${gateSet.size} · 469 ${todaySet.size} · shared ${both.length} · gate-only ${gateOnly.length} · 469-only ${armOnly.length}`);
console.log(`MOVEMENT: published SLICER ${published.nums.slicer} → this tree ${today.nums.slicer}; arrivals ${arrivals.length}, departures ${departures.length}`);
console.log(`NOT MEASURED (R4): the published LIVE 45/52 → 48/56 movement is not explained by this arm.`);
