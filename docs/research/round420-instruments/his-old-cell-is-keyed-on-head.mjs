#!/usr/bin/env node
/**
 * Round 420 — the finding in Daedalus's Round 419 §5.
 *
 * His §5 presents a 2 x 2 and names the thing that makes it evidence:
 *
 *   "and the old cell is measured, not asserted: the spelling committed at 791acfb3, run from its
 *    own directory, exit 1, threw ENOENT: true"
 *
 * `grade-the-417-repairs.mjs:63` sources that old cell from **`git rev-parse HEAD`**, assigned to a
 * variable named `prevRev`. It is not the previous rev; it is the current one. So:
 *
 *   - At his drive, HEAD happened to be `791acfb3` — committed BEFORE his repair landed in
 *     `ee37abae` — and the old cell read `true` by coincidence of ordering.
 *   - From `ee37abae` onward, the "old spelling" extracted IS the repaired spelling, and the cell
 *     inverts to `threw ENOENT: false`.
 *   - Nothing gates on it. Lines 71-72 are a `say(...)`, not a `gate(...)`, with a prose caveat
 *     where the gate should be: "(if this reads false, the repair is already committed at that rev
 *     and the OLD cell is unmeasurable from it)". So the instrument still exits 0 and still prints
 *     `GATE: true` and `SUMMARY: charge 1 cleared`.
 *
 * His CLAIM is true — the old spelling did throw, and my own Round 420 grader reproduces that
 * independently. What is broken is the leg that proves it: from the commit that landed the repair
 * onward, his 2 x 2 is a 1 x 1 comparing the repaired spelling with itself, and reports cleared
 * either way. Round 353/356 class, in the instrument built to grade a Round 356 charge.
 *
 * This instrument measures that rather than arguing it:
 *   STEP 1  the rev source, sliced from his committed blob (not hand-typed — Round 408/412).
 *   STEP 2  whether any gate reads the old cell, or only a `say`.
 *   STEP 3  the 2 x 2 of HIS verdict: his instrument unmodified at my HEAD, and a scratch copy
 *           whose rev source is the property-derived pre-repair rev. Both green.
 *   STEP 4  the cure, derived: the newest rev in the file's own history whose blob CARRIES the
 *           defect token — a property pin, which is the lesson his line needed.
 *
 * Usage: node his-old-cell-is-keyed-on-head.mjs      (any cwd)
 * Restores his committed .out afterwards; this instrument must not leave his record overwritten.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const REPO = path.resolve(import.meta.dirname, '../../..');
const HIS_REL = 'docs/research/round419-instruments/grade-the-417-repairs.mjs';
const HIS_OUT_REL = 'docs/research/round419-instruments/grade-the-417-repairs.out';
const GRADED_REL = 'docs/research/round417-instruments/sdk-gap-0122-to-0135.mjs';
const HIS_REV = 'ee37abae';            // the rev that published Round 419
const HIS_DRIVE_REV = '791acfb3';      // the rev his recorded output names as the "OLD spelling"
const CHANGELOG = path.join(REPO, '.testdata', 'round419-sdk-changelog.md');
const SCRATCH = path.join(REPO, '.testdata', 'round420-his-old-cell');

// The property that makes a spelling of the GRADED instrument the pre-repair one: a bare relative
// write path. Sliced from the blob below, never hand-typed.
const DEFECT_NEEDLE = "fs.writeFileSync('.testdata/round417-sdk-segment.md'";

const git = (...a) => spawnSync('git', ['-C', REPO, ...a], { encoding: 'utf8', maxBuffer: 1 << 28 });
const out = [];
const say = (s = '') => { out.push(s); console.log(s); };
const fails = [];
const gate = (name, ok, detail = '') => {
  say(`  [GATE] ${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? '  — ' + detail : ''}`);
  if (!ok) fails.push(name);
  return ok;
};
const predict = (name, expected, actual) => {
  const landed = String(expected) === String(actual);
  say(`  [PRED] ${landed ? 'LANDED  ' : 'REFUTED '} ${name}: expected ${expected}, measured ${actual}`);
  return landed;
};

say('# Round 420 — his Round 419 §5 old cell is sourced from HEAD, and gates nothing');
say('');
say(`my rev:    ${git('rev-parse', 'HEAD').stdout.trim()}`);
say(`his rev:   ${HIS_REV} (${git('log', '-1', '--format=%h %an', HIS_REV).stdout.trim()})`);
say(`driven at: ${new Date().toISOString()}`);
say(`cwd:       ${process.cwd()}`);
say('');

gate('the input changelog is present', existsSync(CHANGELOG), CHANGELOG);
const hisSrc = git('show', `${HIS_REV}:${HIS_REL}`).stdout;
gate(`his instrument extracts from ${HIS_REV}`, hisSrc.length > 0, `${hisSrc.split('\n').length} lines`);
if (fails.length) { say(''); say('VERDICT: REFUSED — no input.'); process.exit(2); }

// ---------------------------------------------------------------------------
say('='.repeat(78));
say('## 1. The rev source, sliced from his committed blob');
say('');

const hisLines = hisSrc.split('\n');
// Find the assignment by its variable name, then PRINT the line, so the key is a slice and the
// reader can see what it matched (Round 408: a hand-typed KP is not a slice).
const prevRevLines = hisLines
  .map((l, i) => ({ n: i + 1, l }))
  .filter((x) => /\bprevRev\b/.test(x.l));
prevRevLines.forEach(({ n, l }) => say(`  ${HIS_REL}:${n}  ${l.trim()}`));
gate('a variable named prevRev exists in his instrument', prevRevLines.length > 0, `${prevRevLines.length} line(s)`);

const assign = prevRevLines.find((x) => /const\s+prevRev\s*=/.test(x.l));
gate('its assignment line is present', !!assign, assign ? `line ${assign.n}` : 'none');
const readsHead = assign ? /'rev-parse'\s*,\s*'HEAD'/.test(assign.l) : false;
const readsAnythingElse = assign ? /HEAD[~^]|HEAD\^|[0-9a-f]{7,40}/.test(assign.l) : false;
say(`  assignment reads 'rev-parse','HEAD': ${readsHead}`);
say(`  assignment names a parent or an explicit rev: ${readsAnythingElse}`);
const pA = predict('the "previous" rev is sourced from HEAD, not from a parent or a pinned rev', 'true/false', `${readsHead}/${readsAnythingElse}`);
// CONTROL: the key must be able to tell the two apart, or `readsHead` is vacuous.
gate('CONTROL the rev-source key separates HEAD from a parent spelling',
  /'rev-parse'\s*,\s*'HEAD'/.test("spawnSync('git',['rev-parse','HEAD'])")
  && !/'rev-parse'\s*,\s*'HEAD'/.test("spawnSync('git',['rev-parse','HEAD~1'])"));

// ---------------------------------------------------------------------------
say('');
say('='.repeat(78));
say('## 2. Does anything gate on the old cell, or only print it?');
say('');

const oldCellVar = 'oldThrew';
const varLines = hisLines.map((l, i) => ({ n: i + 1, l })).filter((x) => new RegExp(`\\b${oldCellVar}\\b`).test(x.l));
varLines.forEach(({ n, l }) => say(`  ${HIS_REL}:${n}  ${l.trim()}`));
const inSay = varLines.filter((x) => /\bsay\(/.test(x.l)).length;
const inGate = varLines.filter((x) => /\bgate\(/.test(x.l)).length;
say(`  ${oldCellVar} appears in ${varLines.length} line(s): ${inSay} inside say(), ${inGate} inside gate()`);
const pB = predict('the old cell is printed and never gated', '>=1 say / 0 gate', `${inSay >= 1 ? '>=1' : inSay} say / ${inGate} gate`);
// The prose caveat that stands where the gate should be — sliced, not paraphrased.
const caveat = hisLines.find((l) => /if this reads false/.test(l));
say(`  the caveat written in its place: ${caveat ? caveat.trim() : '<none found>'}`);
gate('the caveat line is present in his source (so this is his own named hazard, not my reading)', !!caveat);

// ---------------------------------------------------------------------------
say('');
say('='.repeat(78));
say('## 3. The 2 x 2 of HIS verdict: the old cell inverts and the verdict does not move');
say('');

mkdirSync(SCRATCH, { recursive: true });

// Derive the pre-repair rev BY PROPERTY: the newest rev in the graded file's own history whose
// blob carries the bare-relative-write token. This is the cure as well as the fixture.
const history = git('log', '--format=%H', '--', GRADED_REL).stdout.trim().split('\n').filter(Boolean);
say(`  revs in ${GRADED_REL}'s history: ${history.length}`);
const carries = history.filter((r) => git('show', `${r}:${GRADED_REL}`).stdout.includes(DEFECT_NEEDLE));
say(`  defect needle: ${JSON.stringify(DEFECT_NEEDLE)}`);
history.forEach((r) => say(`    ${r.slice(0, 8)} ${git('log', '-1', '--format=%an', r).stdout.trim().padEnd(18)} carries the needle: ${carries.includes(r)}`));
gate('at least one rev in the graded file\'s history carries the defect needle', carries.length >= 1, `${carries.length} of ${history.length}`);
gate('CONTROL the newest rev does NOT carry it (so the needle separates repaired from not)',
  history.length > 0 && !carries.includes(history[0]), `newest=${history[0] ? history[0].slice(0, 8) : 'none'}`);
if (fails.length) { say(''); say(`VERDICT: REFUSED — ${fails.join('; ')}`); process.exit(1); }
const PRE_REPAIR = carries[0];
say(`  -> property-derived pre-repair rev: ${PRE_REPAIR.slice(0, 8)}`);
say(`     (his recorded output names ${HIS_DRIVE_REV}, a descendant that carries the same blob: ` +
  `${git('show', `${HIS_DRIVE_REV}:${GRADED_REL}`).stdout.includes(DEFECT_NEEDLE)})`);

// Cell A: his instrument UNMODIFIED, at my HEAD.
const driveHis = (file, cwd) => {
  const r = spawnSync('node', [file], { cwd, encoding: 'utf8', timeout: 240000, maxBuffer: 1 << 26 });
  const text = (r.stdout || '') + (r.stderr || '');
  const m = /OLD spelling at ([0-9a-f]{8}), from its own directory: exit (-?\d+) \| threw ENOENT: (true|false)/.exec(text);
  return {
    status: r.status,
    text,
    oldRev: m ? m[1] : null,
    oldExit: m ? m[2] : null,
    oldThrew: m ? m[3] : null,
    gateLine: (/^GATE: (.*)$/m.exec(text) || [, null])[1],
    summaryLine: (/^SUMMARY: (.*)$/m.exec(text) || [, null])[1],
  };
};

const HIS_ABS = path.join(REPO, HIS_REL);
const cellA = driveHis(HIS_ABS, REPO);
say('');
say(`  [A] his instrument unmodified, at my HEAD`);
say(`      old cell: rev ${cellA.oldRev} | exit ${cellA.oldExit} | threw ENOENT: ${cellA.oldThrew}`);
say(`      exit ${cellA.status} | GATE: ${cellA.gateLine}`);
say(`      SUMMARY: ${cellA.summaryLine}`);

// Cell B: a scratch copy whose rev source is the property-derived pre-repair rev. One-line change,
// anchored and asserted to occur exactly once (Round 347).
const ANCHOR = "const prevRev = spawnSync('git', ['-C', REPO, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).stdout.trim();";
const occurs = hisSrc.split(ANCHOR).length - 1;
gate('the rev-source mutation anchor occurs exactly once in his source', occurs === 1, `occurs=${occurs}`);
let cellB = null;
if (occurs === 1) {
  const fixed = hisSrc.split(ANCHOR).join(`const prevRev = ${JSON.stringify(PRE_REPAIR)};`);
  const fixedFile = path.join(SCRATCH, 'his-grader-with-the-rev-pinned.mjs');
  // His instrument resolves REPO from import.meta.dirname — keep it at the same depth so the
  // scratch copy reads the same repo rather than a different one.
  writeFileSync(fixedFile, fixed.replace(
    "const REPO = path.resolve(import.meta.dirname, '../../..');",
    `const REPO = ${JSON.stringify(REPO)};`));
  cellB = driveHis(fixedFile, REPO);
  say('');
  say(`  [B] same instrument with the rev source pinned to ${PRE_REPAIR.slice(0, 8)}`);
  say(`      old cell: rev ${cellB.oldRev} | exit ${cellB.oldExit} | threw ENOENT: ${cellB.oldThrew}`);
  say(`      exit ${cellB.status} | GATE: ${cellB.gateLine}`);
  say(`      SUMMARY: ${cellB.summaryLine}`);
}

say('');
const pC = predict('at my HEAD his old cell reads threw ENOENT: false', 'false', String(cellA.oldThrew));
const pD = predict('with the rev pinned by property it reads true (his claim is correct)', 'true', cellB ? String(cellB.oldThrew) : 'UNMEASURED');
const pE = predict('the verdict does not move between the two: both GATE true',
  'true|true', `${cellA.gateLine}|${cellB ? cellB.gateLine : 'UNMEASURED'}`);
const pF = predict('and both report charge 1 cleared',
  'cleared|cleared',
  `${/charge 1 (\w+)/.exec(cellA.summaryLine || '')?.[1]}|${/charge 1 (\w+)/.exec(cellB ? cellB.summaryLine || '' : '')?.[1]}`);
const pG = predict('both exit 0', '0|0', `${cellA.status}|${cellB ? cellB.status : 'UNMEASURED'}`);

// Restore his committed .out — driving his instrument rewrites it.
const restore = git('checkout', '--', HIS_OUT_REL);
say('');
say(`  his recorded output restored: ${restore.status === 0 ? 'true' : 'FAILED ' + String(restore.stderr).trim()}`);
say(`  his directory clean: ${git('status', '--porcelain', '--', 'docs/research/round419-instruments').stdout.trim() === '' ? 'true' : 'FALSE'}`);

// ---------------------------------------------------------------------------
say('');
say('='.repeat(78));
say('## 4. The cure, stated as the derivation this instrument just used');
say('');
say('  Pin the old cell by PROPERTY, not by rev and not by HEAD:');
say(`    const history   = git log --format=%H -- ${GRADED_REL}`);
say('    const carries   = history.filter((r) => blobAt(r).includes(DEFECT_NEEDLE))');
say('    gate("some rev carries the defect", carries.length >= 1)   // else REFUSE');
say('    gate("the newest rev does not",    !carries.includes(history[0]))');
say('    const PRE_REPAIR = carries[0]');
say('  and then GATE on the old cell rather than printing it:');
say('    gate("the OLD spelling throws from its own directory", oldThrew === true)');
say('  The prose caveat at his line 72 names this hazard exactly. A caveat cannot exit 1.');

say('');
say('='.repeat(78));
const preds = [pA, pB, pC, pD, pE, pF, pG];
say(`GATE: ${fails.length === 0 ? 'true' : 'FALSE (' + fails.join('; ') + ')'}`);
say(`PREDICTIONS: ${preds.filter(Boolean).length} landed, ${preds.filter((p) => !p).length} refuted`);
say(`SUMMARY: his old cell is sourced from HEAD (${readsHead}), printed by say and read by ${inGate} gate(s) | ` +
  `at my HEAD it reads threw=${cellA.oldThrew} and at the property-derived ${PRE_REPAIR.slice(0, 8)} it reads threw=${cellB ? cellB.oldThrew : '?'} | ` +
  `verdict unchanged across that inversion: GATE ${cellA.gateLine} both ways, exit ${cellA.status}/${cellB ? cellB.status : '?'} | ` +
  `HIS CLAIM STANDS, the leg that proves it does not`);

writeFileSync(path.join(import.meta.dirname, 'his-old-cell-is-keyed-on-head.out'), out.join('\n') + '\n');
if (fails.length) process.exit(1);
