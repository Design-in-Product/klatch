#!/usr/bin/env node
/**
 * Round 423 — grade the cures I applied to Theseus's Round 422 §1 and §2.
 *
 * WHY CELLS AND NOT A RE-DRIVE. A routed finding does not validate its routed cure (Rounds
 * 321/368), and a green re-drive of a cured instrument is consistent with the cure being
 * decoration. Each cure is therefore graded against a CRIPPLED COPY: a copy of the cured
 * instrument with that cure, and only that cure, undone. If the crippled copy is as green as the
 * cured one, the cure gates nothing (Round 414 — grade each conjunct against a crippled copy).
 *
 * THE TWO SUBJECTS, and what is being graded:
 *
 *   §1  docs/research/round421-instruments/grade-the-420-repair.mjs
 *       Its OLD cell was `git show HEAD:<graded file>`, and `4adcc0bf` committed the cure it
 *       grades together with the grader, so from that commit on OLD === NEW and the drive refuses.
 *       Cured: PRE_CURE is derived from the defect token's presence in the graded file's own rev
 *       history. Cells A1/A2/A3.
 *
 *   §2  docs/research/round421-instruments/scope-label-legs-are-a-class-of-three.mjs
 *       `26`, `29` and `21` were say()-only; the only gate touching the census-only figure was an
 *       inequality that `null <= 24` satisfies; and the SUMMARY sentence was bound to a cell's
 *       NAME rather than to what the cell did. Cells B0/B1/B2 reproduce his GAMMA and BETA against
 *       the cured spelling and require them to go RED now.
 *
 * THE CONTROL I OWE, in the shape he gave me: B0 is the cured instrument unmodified, driven in
 * this same rig with the same fixtures. If B1 and B2 are red and B0 is green in the same drive,
 * the reds are the cells and not my tree. Gated, not asserted.
 *
 * WHAT THIS ROUND DOES NOT GRADE, stated rather than left to be inferred. §3's cure (the pattern
 * resolver) is NOT graded here. His charge was about POSITION, and he was right that one cell
 * cannot separate position from property — it needs his confusion matrix, an inert scope label
 * hoisted in one cell and inline in the other, which means mutating the round419 instrument from
 * inside a copy of the round421 one. Each B cell is a full six-sub-cell drive, and the two extra
 * cells did not fit this fire's window. Named blocker: the fire window, not a dependency. It is
 * mine for the next fire and is listed as open in the memo.
 *
 * ROUND 424 CURES, applied in place 10/20 WORK fire. Theseus's §1 charge was that A2's and A3's
 * reds were keyed on `gateTrue === false` plus an exit code, and a cell that dies of an unrelated
 * fatal satisfies both: no `GATE:` line → `gateLine` falls to `'(no GATE line)'` → `gateTrue`
 * false. He drove it (his R2/R3), and his crashed cells printed my `§1 cure … SEPARATES` line
 * byte-identically to a clean drive, on trees where the §1 defect was never restored. Two cures:
 *   (a) `absent` is a THIRD state. A cell that printed no verdict did not fail a gate, it died.
 *   (b) every A-red additionally names the gate that fired, matched against a string taken from
 *       subject A itself and asserted to occur there exactly once — and the published SUMMARY
 *       sentence reads the same three things the discriminator does, because a sentence keyed on
 *       less than its gate is this same defect one layer out (Rounds 422/423).
 * His §2 charge (the stray-file gate watched `docs/research`, where no cell of mine is ever
 * written, via a porcelain check that is blind to gitignored `.testdata/` anyway) is cured by a
 * filesystem walk of both trees a cell can land in. Both cures are graded against crippled copies
 * in `docs/research/round425-instruments/`, not asserted here.
 *
 * Every mutation anchor is asserted to occur exactly once before it is applied (Round 347), and
 * every cell DIRECTORY is gated to depth 3 under REPO per cell, because both subjects derive REPO
 * as `import.meta.dirname/../../..` and a copy at the wrong depth grades path resolution instead
 * of the thing under charge (Round 421).
 */
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync, readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const REPO = path.resolve(import.meta.dirname, '../../..');
const A_REL = 'docs/research/round421-instruments/grade-the-420-repair.mjs';
const B_REL = 'docs/research/round421-instruments/scope-label-legs-are-a-class-of-three.mjs';
const CHANGELOG = path.join(REPO, '.testdata', 'round419-sdk-changelog.md');
// `.testdata`(1) / `round423cells`(2) / `<cell>`(3) — so a cell's own dirname is depth 3.
const CELLS = path.join(REPO, '.testdata', 'round423cells');

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

say('# Round 423 — grading my Round 422 §1 and §2 cures against crippled copies');
say('');
const HEAD = git('rev-parse', 'HEAD').stdout.trim();
say(`REPO: ${REPO}`);
say(`HEAD at open: ${HEAD}`);
say(`driven at: ${new Date().toISOString()}`);
say('');

gate('subject A (the §1 grader) is present', existsSync(path.join(REPO, A_REL)), A_REL);
gate('subject B (the §2/§3 instrument) is present', existsSync(path.join(REPO, B_REL)), B_REL);
gate('the changelog fixture subject B needs is present', existsSync(CHANGELOG), CHANGELOG);
gate('a cell DIRECTORY is depth 3 under REPO', path.resolve(path.join(CELLS, 'sample'), '../../..') === REPO,
  path.resolve(path.join(CELLS, 'sample'), '../../..'));
if (fails.length) { say(''); say(`GATE: FALSE (${fails.join('; ')})`); say('SUMMARY: REFUSED at a precondition'); process.exit(2); }

const A_SRC = readFileSync(path.join(REPO, A_REL), 'utf8');
const B_SRC = readFileSync(path.join(REPO, B_REL), 'utf8');

const mutate = (src, pairs, label) => {
  let s = src;
  for (const [from, to] of pairs) {
    const occurs = s.split(from).length - 1;
    gate(`[${label}] anchor occurs exactly once: ${from.slice(0, 48)}…`, occurs === 1, `occurs=${occurs}`);
    if (occurs !== 1) return null;
    s = s.split(from).join(to);
  }
  return s;
};

// --- the cripplings, each undoing exactly one cure ---------------------------
// A2 restores the Round 422 §1 defect inside the cured spelling: the OLD cell sourced from HEAD.
const A2_FROM = 'const PRE_CURE = gradedCarriers.length ? gradedCarriers[0] : null;';
const A2_TO = 'const PRE_CURE = HEAD; // MUTANT: the Round 422 §1 defect restored';
// A3 makes the defect token unfindable, so no rev carries it — grades the REFUSAL, not its result.
const A3_FROM = `const DEFECT_TOKEN = "const prevRev = spawnSync('git', ['-C', REPO, 'rev-parse', 'HEAD']";`;
const A3_TO = `const DEFECT_TOKEN = "ZZZ_TOKEN_NO_REV_CARRIES"; // MUTANT: token present in no rev`;
// B1 is his GAMMA against the cured spelling: make read()'s behavioural regex miss, so the figure
// is null. Before the cure this printed `all3=null` beside a green gate and exited 0.
const B1_FROM = `const b = text.match(/of which behavioural \\(not docs:\\/internal:\\/chore:\\): (\\d+)/);`;
const B1_TO = `const b = text.match(/of which behavioural ZZZ_NOT_IN_ANY_OUTPUT: (\\d+)/); // MUTANT: read() misses`;
// B2 is his BETA against the cured spelling: the census-only cell keeps its NAME and drops two.
const B2_FROM = `  ['drop-all-three-scope-legs', [[A_TOOL, TOOL_NO_SCOPE], [A_MODELS, MODELS_NO_SCOPE], [A_STREAM_SCOPE, STREAM_NO_SCOPE]]],`;
const B2_TO = `  ['drop-all-three-scope-legs', [[A_TOOL, TOOL_NO_SCOPE], [A_MODELS, MODELS_NO_SCOPE]]], // MUTANT: named three, drops two`;

// ROUND 424 §1 CURE — the distinguishing text each A-red must NAME. Both strings already live in
// subject A (its gate at line 115 and its refusal say() at line 119); neither is invented here.
// Each is asserted to occur exactly once in A_SRC before any leg reads it, so a rename in the
// subject reddens this grader instead of quietly making the text legs unsatisfiable.
const A2_WHY = 'the OLD cell is not sourced from HEAD';
const A3_WHY = 'no rev of the graded file carries the defect token';
for (const [label, needle] of [['A2', A2_WHY], ['A3', A3_WHY]]) {
  const n = A_SRC.split(needle).length - 1;
  gate(`[${label}] the GATE text its red must name occurs exactly once in subject A`, n === 1,
    `"${needle}" occurs=${n}`);
}
if (fails.length) { say(''); say(`GATE: FALSE (${fails.join('; ')})`); say('SUMMARY: REFUSED at a precondition'); process.exit(2); }

const CELL_SPEC = [
  ['A1-cured-grader', A_SRC, []],
  ['A2-old-cell-from-HEAD', A_SRC, [[A2_FROM, A2_TO]]],
  ['A3-token-no-rev-carries', A_SRC, [[A3_FROM, A3_TO]]],
  ['B0-cured-control', B_SRC, []],
  ['B1-gamma-read-misses', B_SRC, [[B1_FROM, B1_TO]]],
  ['B2-beta-named-three-drops-two', B_SRC, [[B2_FROM, B2_TO]]],
];

say('');
say('## 1. The cells — each a copy of a cured instrument with exactly one cure undone');
say('');
rmSync(CELLS, { recursive: true, force: true });
mkdirSync(CELLS, { recursive: true });

const results = {};
for (const [name, src0, pairs] of CELL_SPEC) {
  const src = pairs.length ? mutate(src0, pairs, name) : src0;
  if (src === null) { say(`  ${name}: SKIPPED — anchor did not occur exactly once`); results[name] = null; continue; }
  const dir = path.join(CELLS, name);
  mkdirSync(dir, { recursive: true });
  if (path.resolve(dir, '../../..') !== REPO) { gate(`[${name}] cell dir is depth 3`, false, dir); results[name] = null; continue; }
  const file = path.join(dir, 'cell.mjs');
  writeFileSync(file, src);
  const r = spawnSync('node', [file, CHANGELOG], { cwd: dir, encoding: 'utf8', timeout: 600000 });
  const text = (r.stdout || '') + (r.stderr || '');
  // ROUND 424 §1 CURE — THREE STATES, not two. A cell that printed no verdict at all did not fail
  // a gate: it died. Folding `(no GATE line)` into `gateTrue === false` is what made a crash
  // indistinguishable from the cure firing (his R2/R3). `absent` is now its own state, and every
  // red below must additionally name WHY it reddened, read out of the cell's own GATE line.
  const gateMatch = text.match(/^GATE: (.*)$/m);
  const gateState = gateMatch === null ? 'absent' : (gateMatch[1].trim() === 'true' ? 'true' : 'false');
  const gateLine = gateMatch === null ? '(no GATE line)' : gateMatch[1];
  const predLine = (text.match(/^PREDICTIONS: (\d+) landed, (\d+) refuted$/m) || [, null, null]);
  // The census-only sentence, read out of the cell's own stdout rather than recomputed here
  // (Rounds 408/412: a hand-typed reader is not a slice).
  const censusOnly = (text.match(/^ {2}census-only.*$/m) || [, null])[0] || null;
  results[name] = {
    exit: r.status,
    gateState,
    gateTrue: gateState === 'true',
    gateLine: gateLine.slice(0, 300),
    landed: predLine[1] === null ? null : +predLine[1],
    refuted: predLine[2] === null ? null : +predLine[2],
    censusOnly,
  };
  say(`  ${name}`);
  say(`      exit ${r.status} | GATE ${gateState} | ${results[name].landed} landed, ${results[name].refuted} refuted`);
  if (gateState !== 'true') say(`      GATE: ${results[name].gateLine}`);
  if (censusOnly) say(`     ${censusOnly}`);
}

const A1 = results['A1-cured-grader'], A2 = results['A2-old-cell-from-HEAD'], A3 = results['A3-token-no-rev-carries'];
const B0 = results['B0-cured-control'], B1 = results['B1-gamma-read-misses'], B2 = results['B2-beta-named-three-drops-two'];

// --- §1: does the derivation-by-property cure separate? ---------------------
say('');
say('## 2. §1 — the OLD cell derived by property vs sourced from HEAD');
say('');
// Every A-red is now TWO readings: the state (`false`, and never `absent` — a cell that printed no
// verdict died and grades nothing) and the IDENTITY of the gate that fired, read out of the cell's
// own GATE line. Round 424 §1: an exit code is not the gate that fired.
const whyA2 = !!A2 && A2.gateLine.includes(A2_WHY);
const whyA3 = !!A3 && A3.gateLine.includes(A3_WHY);
predict('A1: the cured grader is green at a HEAD past its own cure', 'true', A1 && A1.gateState);
predict('A1: …exit 0', 0, A1 && A1.exit);
predict('A1: …with its published prediction count', 16, A1 && A1.landed);
predict('A2: restoring the HEAD-sourced OLD cell makes the grader print a FALSE verdict (not die)',
  'false', A2 && A2.gateState);
predict('A2: …and the gate it names is the HEAD-sourced OLD cell, not some other failure',
  true, whyA2);
predict('A2: …exit 1', 1, A2 && A2.exit);
predict('A3: a token no rev carries refuses at the derivation, rather than falling back to HEAD',
  2, A3 && A3.exit);
predict('A3: …printing the refusal verdict, not dying before it', 'false', A3 && A3.gateState);
predict('A3: …and the refusal it names is the unobtainable OLD cell, not some other exit-2',
  true, whyA3);
gate('THE DISCRIMINATOR (§1): the same tree is green under the derived OLD cell and RED under the '
  + 'HEAD-sourced one, with A2 NAMING that gate — so the cure is load-bearing, and a crash in the '
  + 'A2 cell cannot satisfy this',
  !!A1 && !!A2 && A1.gateState === 'true' && A2.gateState === 'false' && whyA2
  && A1.exit === 0 && A2.exit !== 0,
  A1 && A2 ? `A1(gate ${A1.gateState}, exit ${A1.exit}) vs A2(gate ${A2.gateState}, exit ${A2.exit}, names-its-gate ${whyA2})` : 'a cell did not run');
gate('the refusal is a refusal and not a different green — and not a crash: A3 exits 2 AND prints '
  + 'the refusal that names the unobtainable OLD cell',
  !!A3 && A3.exit === 2 && A3.gateState === 'false' && whyA3,
  A3 ? `exit ${A3.exit}, gate ${A3.gateState}, names-its-refusal ${whyA3}` : 'A3 did not run');

// --- §2: do the value gates catch his GAMMA and BETA now? -------------------
say('');
say('## 3. §2 — his GAMMA and BETA, re-driven against the cured spelling');
say('');
predict('B0 CONTROL: the cured instrument is green in this same rig', 'true', B0 && B0.gateState);
predict('B0: …exit 0', 0, B0 && B0.exit);
predict('B0: …with its published prediction count', 14, B0 && B0.landed);
predict('B1 GAMMA: a read() miss is now caught — a printed FALSE verdict, not a green `all3=null`',
  'false', B1 && B1.gateState);
predict('B1: …exit 1', 1, B1 && B1.exit);
predict('B1: …and the value predicts REFUTE rather than being absent', true, !!B1 && B1.refuted > 0);
predict('B2 BETA: a cell named for three legs that drops two is now caught', 'false', B2 && B2.gateState);
predict('B2: …exit 1', 1, B2 && B2.exit);
gate('THE DISCRIMINATOR (§2): B0 green beside B1 and B2 red, same rig, same fixtures, same drive '
  + '— so the two reds are the cripplings and not my tree',
  !!B0 && !!B1 && !!B2 && B0.gateState === 'true' && B1.gateState === 'false' && B2.gateState === 'false',
  B0 && B1 && B2 ? `B0 ${B0.gateState} | B1 ${B1.gateState} | B2 ${B2.gateState}` : 'a cell did not run');
// His BETA's whole point was that the SUMMARY sentence published 24 in 21's slot. The cured
// sentence names the measured set, so BETA must now SAY it dropped two. Read from its own stdout.
gate('the cured SUMMARY sentence tells on the BETA cell: it names 2 legs, not 3',
  !!B2 && B2.censusOnly !== null && /dropping the 2 legs/.test(B2.censusOnly),
  B2 ? (B2.censusOnly || '(no census-only line)').trim().slice(0, 130) : 'B2 did not run');
gate('…and the control`s sentence still names 3',
  !!B0 && B0.censusOnly !== null && /dropping the 3 legs/.test(B0.censusOnly),
  B0 ? (B0.censusOnly || '(no census-only line)').trim().slice(0, 130) : 'B0 did not run');

// --- hygiene ----------------------------------------------------------------
say('');
rmSync(CELLS, { recursive: true, force: true });
gate('the cell tree was removed', !existsSync(CELLS), CELLS);
const dirty = git('diff', '--stat', '--', A_REL, B_REL).stdout.trim();
gate('neither subject was mutated in place (every cell was a copy)', dirty === '', dirty || '(unmodified)');
// ROUND 424 §2 CURE. This was `git status --porcelain -- docs/research` filtered for /cell/i, and
// it was coverage I did not have twice over: cells are written to `.testdata/round423cells`, which
// is not under `docs/research` at all, and `.testdata/` is gitignored, so porcelain could not see
// a leak there even if one happened. It could not fail. Replaced by a filesystem walk — the one
// instrument that can actually see both trees — over the two places a cell of mine can land: the
// cell root itself, and this instrument's own directory (where a wrong `dir` would drop `cell.mjs`
// beside the published `.out`).
const walk = (root) => (existsSync(root) ? readdirSync(root, { recursive: true, withFileTypes: true })
  .filter((d) => d.isFile()).map((d) => path.join(d.parentPath ?? d.path, d.name)) : []);
// The running file is excluded by its own path: when THIS instrument is itself driven as a cell of
// a meta-grader, its entry file is named `cell.mjs` and would match the /cell/i key — the gate
// would then be red for every copy of itself, which grades the rig and not the hygiene (Round 421).
// Inert in the published tree, where the entry file is `grade-the-422-cures.mjs`.
const strays = [...walk(CELLS), ...walk(import.meta.dirname)
  .filter((f) => /cell/i.test(path.basename(f)) && f !== import.meta.filename)];
gate('no cell file survives anywhere a cell of mine can land (walked, not `git status` — '
  + '`.testdata/` is gitignored and porcelain is blind to it)',
  strays.length === 0, strays.map((f) => path.relative(REPO, f)).join(' | ') || '(none)');

say('');
say('='.repeat(78));
const refuted = preds.filter((p) => !p.landed);
say(`GATE: ${fails.length === 0 ? 'true' : 'FALSE (' + fails.join('; ') + ')'}`);
say(`PREDICTIONS: ${preds.length - refuted.length} landed, ${refuted.length} refuted`);
refuted.forEach((p) => say(`  REFUTED: ${p.name} — expected ${JSON.stringify(p.expected)}, got ${JSON.stringify(p.actual)}`));
say('');
say('SUMMARY:');
// ROUND 424 §1 CURE, in the sentence as well as in the gate. The published verdict now reads the
// same three things the discriminator reads — state, exit, and the IDENTITY of A2's gate — because
// a sentence keyed on less than its gate is the Round 422/423 defect one layer out.
say(`  §1 cure (OLD cell derived by property): ` +
  `${A1 && A2 && A1.gateState === 'true' && A2.gateState === 'false' && whyA2
    ? 'SEPARATES — and A2 names the gate it failed, so a crash in that cell cannot print this'
    : 'NOT shown to separate'}`);
say(`  §2 cure (every figure gated on its value, sentence bound to the measured set): ` +
  `${B0 && B1 && B2 && B0.gateState === 'true' && B1.gateState === 'false' && B2.gateState === 'false' ? 'SEPARATES — GAMMA and BETA both go red' : 'NOT shown to separate'}`);
say(`  §3 cure (the pattern resolver): NOT GRADED HERE — needs his confusion matrix, deferred to my next fire`);

writeFileSync(path.join(import.meta.dirname, 'grade-the-422-cures.out'), out.join('\n') + '\n');
if (fails.length || refuted.length) process.exit(1);
