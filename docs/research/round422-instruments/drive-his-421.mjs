#!/usr/bin/env node
/**
 * Round 422 §1 — drive Daedalus's two Round 421 instruments UNMODIFIED and say what reproduces.
 *
 * DISCIPLINE, carried from Round 420:
 *   - Each instrument is extracted from the commit that published it with `git show`, NOT read
 *     from disk, and disk-vs-commit agreement is reported as its own measurement. Two of his
 *     instruments rewrite their own `.out` when driven, so a disk read is a read of whatever the
 *     last drive left behind.
 *   - Each is driven from a COPY at depth 3 under the gitignored `.testdata/`, because both
 *     derive REPO as `import.meta.dirname/../../..`. His own `docs/research/round421-instruments/`
 *     is never written to; that is asserted at the end with `git status --porcelain` over his
 *     directory specifically, not over a parent.
 *   - His published `.out` is also extracted from its commit, and the live output is compared
 *     against it line for line on the three verdict lines.
 *
 * WHAT I EXPECT, DECLARED BEFORE THE DRIVE (and gated, so a wrong expectation refutes and does
 * not quietly become the finding — Round 405: never draft the slot for a running measurement):
 *
 *   scope-label-legs-are-a-class-of-three.mjs  -> reproduces GATE true / 9 landed / 0 refuted.
 *       Its inputs are the graded instrument's committed blob plus a gitignored fixture I already
 *       have, and nothing it reads has moved since `5bf46753`.
 *
 *   grade-the-420-repair.mjs                   -> does NOT reproduce. It takes its OLD cell as
 *       `git show HEAD:docs/research/round419-instruments/grade-the-417-repairs.mjs` (line 78) and
 *       its NEW cell from that same path on disk. It was driven at HEAD `7c2208ae`, with the cure
 *       uncommitted in the working tree, and then COMMITTED IN THE SAME COMMIT AS THE CURE
 *       (`4adcc0bf` carries both). So at `4adcc0bf` and at every descendant of it, HEAD:<path> IS
 *       the cured blob, OLD === NEW, and there is no 2 x 2 left to drive. The published result is
 *       reproducible from no revision of this repository.
 *
 *       That is the same mechanism he cured this round, one layer out: an old cell sourced from
 *       HEAD, in the grader that grades the cure. I state the direction it fails in, because a
 *       refusing instrument and a vacuously green one are different findings: his GATE at line 81
 *       ("OLD and NEW differ") catches it, so this reddens LOUDLY rather than passing. The defect
 *       is irreproducibility, not a false green.
 */
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import path from 'node:path';

const REPO = path.resolve(import.meta.dirname, '../../..');
const HIS_DIR_REL = 'docs/research/round421-instruments';
const SCRATCH = path.join(REPO, '.testdata', 'round422', 'drive');

const out = [];
const say = (s = '') => { out.push(s); console.log(s); };
const fails = [];
const gate = (name, ok, detail = '') => {
  say(`  [GATE] ${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? '  — ' + detail : ''}`);
  if (!ok) fails.push(name);
};
const preds = [];
const predict = (name, expected, actual) => {
  const landed = JSON.stringify(expected) === JSON.stringify(actual);
  preds.push({ name, landed, expected, actual });
  say(`  [PRED] ${landed ? 'LANDED  ' : 'REFUTED '} ${name} — expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
};
const git = (...a) => spawnSync('git', ['-C', REPO, ...a], { encoding: 'utf8', maxBuffer: 1 << 26 });
const sha = (s) => createHash('sha256').update(s).digest('hex');

say('# Round 422 §1 — his two Round 421 instruments, driven unmodified');
say('');
const HEAD = git('rev-parse', 'HEAD').stdout.trim();
say(`REPO: ${REPO}`);
say(`my HEAD: ${HEAD}`);
say(`driven at: ${new Date().toISOString()}`);
say('');

// --- preconditions -----------------------------------------------------------
gate('SCRATCH is depth 3 under REPO, so ../../.. from a copy resolves to REPO',
  path.resolve(SCRATCH, '../../..') === REPO, `${path.resolve(SCRATCH, '../../..')} vs ${REPO}`);
const FIXTURE = path.join(REPO, '.testdata', 'round419-sdk-changelog.md');
gate('the changelog fixture his second instrument needs is present IN MY TREE',
  existsSync(FIXTURE), FIXTURE);
// Stated separately from the drive so that a red below is attributable to the mechanism under
// charge and not to a missing gitignored input (Round 350: characterise under the right selector).
const GRADED_REL = 'docs/research/round419-instruments/grade-the-417-repairs.mjs';
gate('the file his FIRST instrument grades is present in my tree',
  existsSync(path.join(REPO, GRADED_REL)), GRADED_REL);

// --- the two instruments, by commit ------------------------------------------
const SUBJECTS = [
  { name: 'grade-the-420-repair', rev: '4adcc0bf', expectReproduce: false },
  { name: 'scope-label-legs-are-a-class-of-three', rev: '5bf46753', expectReproduce: true },
];

say('');
say('## 0. Provenance — commit blob vs disk, for each instrument and its published .out');
say('');
for (const s of SUBJECTS) {
  const mjsRel = `${HIS_DIR_REL}/${s.name}.mjs`;
  const outRel = `${HIS_DIR_REL}/${s.name}.out`;
  s.mjsFromCommit = git('show', `${s.rev}:${mjsRel}`).stdout;
  s.outFromCommit = git('show', `${s.rev}:${outRel}`).stdout;
  const mjsOnDisk = readFileSync(path.join(REPO, mjsRel), 'utf8');
  const outOnDisk = readFileSync(path.join(REPO, outRel), 'utf8');
  say(`  ${s.name}`);
  say(`      .mjs at ${s.rev}: ${s.mjsFromCommit.length}B sha256 ${sha(s.mjsFromCommit).slice(0, 16)}…`);
  say(`      .out at ${s.rev}: ${s.outFromCommit.length}B sha256 ${sha(s.outFromCommit).slice(0, 16)}…`);
  gate(`[${s.name}] the .mjs blob at ${s.rev} is non-empty`, s.mjsFromCommit.length > 0,
    `${s.mjsFromCommit.length}B`);
  gate(`[${s.name}] the .out blob at ${s.rev} is non-empty`, s.outFromCommit.length > 0,
    `${s.outFromCommit.length}B`);
  // Reported, not gated: a disk/commit disagreement is information about whether anyone has
  // re-driven his directory since he pushed it, and it is not a defect either way.
  say(`      disk matches commit:  .mjs ${mjsOnDisk === s.mjsFromCommit} · .out ${outOnDisk === s.outFromCommit}`);
}

// --- the specific mechanism in instrument 1, measured before it is driven -----
say('');
say('## 1. Instrument 1\'s OLD cell, read off ITS OWN source and the graded file\'s history');
say('');
const HEAD_SOURCED = "const OLD_SRC = git('show', `${HEAD}:${GRADED_REL}`).stdout;";
const s1 = SUBJECTS[0].mjsFromCommit;
const nHeadSourced = s1.split(HEAD_SOURCED).length - 1;
say(`  his line "const OLD_SRC = git('show', \`\${HEAD}:\${GRADED_REL}\`)…" occurs ${nHeadSourced}x in his source`);
gate('instrument 1 really does source its OLD cell from HEAD (the charge, pinned on the call shape)',
  nHeadSourced === 1, `occurs=${nHeadSourced}`);

const gradedHistory = git('log', '--format=%H', '--', GRADED_REL).stdout.trim().split('\n').filter(Boolean);
say(`  rev history of the file it grades: ${gradedHistory.map((r) => r.slice(0, 8)).join(', ')}`);
// The cure and its grader are in ONE commit. That is the whole finding, derived rather than quoted.
const curedAt = gradedHistory.find((r) => r.startsWith('4adcc0bf'));
const graderAddedAt = git('log', '--format=%H', '--', `${HIS_DIR_REL}/grade-the-420-repair.mjs`)
  .stdout.trim().split('\n').filter(Boolean);
say(`  rev history of the grader itself:  ${graderAddedAt.map((r) => r.slice(0, 8)).join(', ')}`);
predict('the cure and the grader that grades it landed in exactly ONE shared commit',
  true, !!curedAt && graderAddedAt.length === 1 && graderAddedAt[0] === curedAt);
predict('his published .out was driven at a HEAD that is NOT an ancestor-or-self of the cure',
  true, /^HEAD at open: 7c2208ae/m.test(SUBJECTS[0].outFromCommit)
    && git('merge-base', '--is-ancestor', '4adcc0bf', '7c2208ae').status !== 0);
const oldAtMyHead = git('show', `${HEAD}:${GRADED_REL}`).stdout;
const newOnDisk = readFileSync(path.join(REPO, GRADED_REL), 'utf8');
predict('at my HEAD his OLD cell and his NEW cell are the SAME blob — the 2 x 2 has collapsed',
  true, oldAtMyHead === newOnDisk && oldAtMyHead.length > 0);

// --- drive both --------------------------------------------------------------
say('');
say('## 2. Driven from a copy at depth 3, his directory never written to');
say('');
rmSync(SCRATCH, { recursive: true, force: true });
mkdirSync(SCRATCH, { recursive: true });

const verdict = (text) => ({
  gate: (text.match(/^GATE: (.*)$/m) || [, '(no GATE line)'])[1],
  preds: (text.match(/^PREDICTIONS: (.*)$/m) || [, '(no PREDICTIONS line)'])[1],
  summary: (text.match(/^SUMMARY: (.*)$/m) || [, '(no SUMMARY line)'])[1],
});

for (const s of SUBJECTS) {
  const file = path.join(SCRATCH, `${s.name}.mjs`);
  writeFileSync(file, s.mjsFromCommit);
  const r = spawnSync('node', [file], { cwd: SCRATCH, encoding: 'utf8', timeout: 600000 });
  const text = (r.stdout || '') + (r.stderr || '');
  s.live = { exit: r.status, ...verdict(text), text };
  s.pub = verdict(s.outFromCommit);
  say(`  ${s.name}  (copy driven at ${file.replace(REPO, '<REPO>')})`);
  say(`      live      exit ${r.status} | GATE ${s.live.gate.slice(0, 70)}`);
  say(`      live      ${s.live.preds}`);
  say(`      published GATE ${s.pub.gate.slice(0, 70)}`);
  say(`      published ${s.pub.preds}`);
}

// --- does each reproduce? ----------------------------------------------------
say('');
say('## 3. Reproduction, against the .out extracted from his own commit');
say('');
for (const s of SUBJECTS) {
  const reproduced = s.live.gate === s.pub.gate && s.live.preds === s.pub.preds && s.live.exit === 0;
  predict(`[${s.name}] reproduces his published GATE and PREDICTIONS lines`,
    s.expectReproduce, reproduced);
  s.reproduced = reproduced;
}

// The direction of instrument 1's failure matters: a refusal and a false green are different
// findings, and only one of them is a hazard to a reader (Rounds 353/395).
const g1 = SUBJECTS[0];
predict('instrument 1 fails LOUDLY — non-zero exit, not a vacuous green', true, g1.live.exit !== 0);
predict('…and the gate that catches it is his own "OLD and NEW differ"', true,
  /OLD and NEW differ/.test(g1.live.gate));
gate('CONTROL: instrument 2 is green in the same drive, so a red above is about instrument 1 and '
  + 'not about this rig, this tree, or a missing fixture',
  SUBJECTS[1].reproduced === true, `instrument 2 reproduced: ${SUBJECTS[1].reproduced}`);

// --- hygiene: his published directory, specifically ---------------------------
say('');
rmSync(SCRATCH, { recursive: true, force: true });
const hisDirty = git('status', '--porcelain', '--', HIS_DIR_REL).stdout.trim();
gate(`HIS directory ${HIS_DIR_REL} is untouched by this drive (keyed on his dir, not a parent)`,
  hisDirty === '', hisDirty || '(clean)');
const r419Dirty = git('status', '--porcelain', '--', 'docs/research/round419-instruments').stdout.trim();
gate('the round419 directory his instruments READ is also untouched',
  r419Dirty === '', r419Dirty || '(clean)');

say('');
say('='.repeat(78));
const refuted = preds.filter((p) => !p.landed);
say(`GATE: ${fails.length === 0 ? 'true' : 'FALSE (' + fails.join('; ') + ')'}`);
say(`PREDICTIONS: ${preds.length - refuted.length} landed, ${refuted.length} refuted`);
refuted.forEach((p) => say(`  REFUTED: ${p.name} — expected ${JSON.stringify(p.expected)}, got ${JSON.stringify(p.actual)}`));
say('');
say('SUMMARY:');
for (const s of SUBJECTS) {
  say(`  ${s.name.padEnd(38)} reproduces: ${s.reproduced} (expected ${s.expectReproduce})`);
  say(`      live GATE: ${s.live.gate}`);
}
writeFileSync(path.join(import.meta.dirname, 'drive-his-421.out'), out.join('\n') + '\n');
if (fails.length || refuted.length) process.exit(1);
