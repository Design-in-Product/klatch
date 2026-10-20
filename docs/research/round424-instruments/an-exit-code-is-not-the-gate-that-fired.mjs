#!/usr/bin/env node
/**
 * Round 424 — grade Daedalus's Round 423 grader.
 *
 * SUBJECT: docs/research/round423-instruments/grade-the-422-cures.mjs. It drives six cells, each a
 * copy of a cured instrument with exactly one cure undone, and publishes
 *   §1 cure (OLD cell derived by property): SEPARATES
 *   §2 cure (every figure gated on its value …):  SEPARATES
 *
 * THE CHARGE. Four of its six cells are required to come out RED. The legs that read each red are:
 *
 *   A2  `gateTrue === false` and `exit === 1`                       — nothing reads WHY
 *   A3  `exit === 2` and `gateTrue === false`                       — nothing reads WHY
 *   B1  the two above, PLUS `refuted > 0`                           — reads the cell's own predicts
 *   B2  the two above, PLUS the `census-only` sentence names 2 legs — reads the cell's own sentence
 *
 * A cell that dies for a reason unrelated to the cure under test exits 1 with no `GATE:` line, so
 * `gateLine` falls to '(no GATE line)' and `gateTrue` is false. For A2 and A3 that is
 * indistinguishable from the cure firing. The identifying text IS captured (his `gateLine`) and IS
 * printed (his line 153) — it is read by no leg. This is his own Round 354 lesson one layer out: a
 * guard on identity is not a guard on value, and here an exit code is not the gate that fired.
 *
 * HOW IT IS GRADED, and the control I owe. Six cells, each a copy of HIS grader with exactly one
 * line changed, driven serially (all cells share `.testdata/round423cells`, so they cannot overlap):
 *
 *   R1  unmodified                                    → expect his published verdict, in MY tree
 *   R2  A2's crippling replaced by an UNRELATED FATAL, the §1 cure left INTACT
 *   R3  A3's crippling replaced by an UNRELATED exit 2 BEFORE the derivation, token left INTACT
 *   R4  his `rmSync` of the cell tree made a no-op
 *   R5  B1's crippling replaced by an unrelated fatal   → CONTROL: expect him to NOTICE
 *   R6  B2's crippling replaced by an unrelated fatal   → CONTROL: expect him to NOTICE
 *
 * R2 and R3 are the finding: they must publish the SAME verdict as R1 — GATE true, 14 landed, 0
 * refuted, "§1 cure … SEPARATES" — on a tree where the §1 defect was never restored. R5 and R6 are
 * the control that this is not a blanket claim about his grader: where a leg reads the identity of
 * the failure, the same crippling is caught. A finding that reddened every cell would not separate.
 *
 * EXPECTED MEMBER LOSS, written down before the drive (Rounds 382/383/386):
 *   R2, R3: zero legs lost. R5: exactly one predict refuted, the `refuted > 0` leg. R6: exactly one
 *   gate failed, the BETA-sentence gate. R4: exactly one gate failed, 'the cell tree was removed',
 *   and NOT 'no cell file leaked into docs/research'.
 *
 * ANCHORS are declared as a line PREFIX or an exact two-line span and asserted to match exactly one
 * line / occur exactly once before any mutation is applied (Round 347). Every cell DIRECTORY is
 * gated to depth 3 under REPO, because his grader derives REPO as `import.meta.dirname/../../..`
 * and a copy at the wrong depth grades path resolution instead of the thing under charge (Round 421).
 *
 * HIS PUBLISHED `.out` IS A SUBJECT HERE, SO IT IS GATED. His grader writes its `.out` into its own
 * `import.meta.dirname`; a copy writes into the copy's dir, but the published file is checked
 * unmodified at the end with `git diff HEAD --stat` — HEAD, not the bare form, because a staged
 * change is invisible to `git diff --stat` (Rounds 414/415/416).
 */
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const REPO = path.resolve(import.meta.dirname, '../../..');
const G_REL = 'docs/research/round423-instruments/grade-the-422-cures.mjs';
const G_OUT_REL = 'docs/research/round423-instruments/grade-the-422-cures.out';
const A_REL = 'docs/research/round421-instruments/grade-the-420-repair.mjs';
const B_REL = 'docs/research/round421-instruments/scope-label-legs-are-a-class-of-three.mjs';
const CHANGELOG = path.join(REPO, '.testdata', 'round419-sdk-changelog.md');
// `.testdata`(1) / `round424cells`(2) / `<cell>`(3) — so a cell's own dirname is depth 3.
const CELLS = path.join(REPO, '.testdata', 'round424cells');
const OUT_ABS = path.join(import.meta.dirname, 'an-exit-code-is-not-the-gate-that-fired.out');

const out = [];
const flush = () => writeFileSync(OUT_ABS, out.join('\n') + '\n');
const say = (s = '') => { out.push(s); console.log(s); flush(); };
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

say('# Round 424 — an exit code is not the gate that fired: grading the Round 423 grader');
say('');
const HEAD = git('rev-parse', 'HEAD').stdout.trim();
say(`REPO: ${REPO}`);
say(`HEAD at open: ${HEAD}`);
say(`driven at: ${new Date().toISOString()}`);
say('');

gate('the subject (his Round 423 grader) is present', existsSync(path.join(REPO, G_REL)), G_REL);
gate('his published .out is present (it is checked unmodified at the end)', existsSync(path.join(REPO, G_OUT_REL)), G_OUT_REL);
gate('his subject A is present', existsSync(path.join(REPO, A_REL)), A_REL);
gate('his subject B is present', existsSync(path.join(REPO, B_REL)), B_REL);
gate('the changelog fixture his subject B needs is present', existsSync(CHANGELOG), CHANGELOG);
gate('a cell DIRECTORY is depth 3 under REPO', path.resolve(path.join(CELLS, 'sample'), '../../..') === REPO,
  path.resolve(path.join(CELLS, 'sample'), '../../..'));
if (fails.length) { say(''); say(`GATE: FALSE (${fails.join('; ')})`); say('SUMMARY: REFUSED at a precondition'); flush(); process.exit(2); }

const G_SRC = readFileSync(path.join(REPO, G_REL), 'utf8');
const B_SRC = readFileSync(path.join(REPO, B_REL), 'utf8');
const G_OUT_PUBLISHED = readFileSync(path.join(REPO, G_OUT_REL), 'utf8');

// --- the anchors, declared and asserted -------------------------------------
// A line-prefix anchor replaces the whole matching line. A span anchor replaces an exact substring.
// Either way: asserted to match exactly once, before anything is applied.
const UNRELATED = 'R42x UNRELATED FAILURE, not the cure under test';

// R2: restore his cured §1 spelling verbatim and add a fatal after it. The §1 cure is INTACT.
const R2_LINE = `const A2_TO = 'const PRE_CURE = gradedCarriers.length ? gradedCarriers[0] : null; if (PRE_CURE !== null) throw new Error("${UNRELATED} — the section 1 cure is INTACT in this cell");';`;
// R3: keep the REAL defect token, then exit 2 before the derivation runs. The derivation is INTACT.
const R3_LINE = 'const A3_TO = `const DEFECT_TOKEN = "const prevRev = spawnSync(\'git\', [\'-C\', REPO, \'rev-parse\', \'HEAD\']"; '
  + `console.error("${UNRELATED} — early exit 2 BEFORE the derivation"); process.exit(2);\`;`;
// R5/R6: the cell keeps its name but its only mutation is an unrelated fatal in subject B, injected
// at subject B's `const out = [];` (line 66 — before any output, asserted below to occur once).
const B_CRASH = `['const out = [];', 'const out = []; throw new Error("${UNRELATED}");']`;
const R5_LINE = `  ['B1-gamma-read-misses', B_SRC, [${B_CRASH}]],`;
const R6_LINE = `  ['B2-beta-named-three-drops-two', B_SRC, [${B_CRASH}]],`;
// R4: his rmSync of the cell tree made a no-op. Two-line span, because the rmSync call text alone
// occurs twice (he also clears the tree before the drive).
const R4_FROM = "rmSync(CELLS, { recursive: true, force: true });\ngate('the cell tree was removed'";
const R4_TO = "/* R42x: rmSync suppressed */\ngate('the cell tree was removed'";

const linePrefix = (src, pfx, replacement, label) => {
  const lines = src.split('\n');
  const hits = lines.map((l, i) => [i, l]).filter(([, l]) => l.startsWith(pfx));
  gate(`[${label}] line-prefix anchor matches exactly one line: ${JSON.stringify(pfx)}`, hits.length === 1,
    `matches=${hits.length}${hits.length ? ' at line ' + (hits[0][0] + 1) : ''}`);
  if (hits.length !== 1) return null;
  lines[hits[0][0]] = replacement;
  return lines.join('\n');
};
const span = (src, from, to, label) => {
  const occurs = src.split(from).length - 1;
  gate(`[${label}] span anchor occurs exactly once`, occurs === 1, `occurs=${occurs}`);
  if (occurs !== 1) return null;
  return src.split(from).join(to);
};

gate('subject B carries the crash-injection anchor exactly once (R5/R6 depend on it)',
  B_SRC.split('const out = [];').length - 1 === 1, `occurs=${B_SRC.split('const out = [];').length - 1}`);

const CELL_SPEC = [
  ['R1-his-grader-unmodified', (s) => s],
  ['R2-A2-dies-of-an-unrelated-fatal', (s) => linePrefix(s, 'const A2_TO = ', R2_LINE, 'R2')],
  ['R3-A3-exits-2-for-an-unrelated-reason', (s) => linePrefix(s, 'const A3_TO = ', R3_LINE, 'R3')],
  ['R4-cell-tree-left-behind', (s) => span(s, R4_FROM, R4_TO, 'R4')],
  ['R5-CONTROL-B1-dies-of-an-unrelated-fatal', (s) => linePrefix(s, "  ['B1-gamma-read-misses'", R5_LINE, 'R5')],
  ['R6-CONTROL-B2-dies-of-an-unrelated-fatal', (s) => linePrefix(s, "  ['B2-beta-named-three-drops-two'", R6_LINE, 'R6')],
];

say('');
say('## 1. The cells — each a copy of HIS grader with exactly one line changed');
say('');
rmSync(CELLS, { recursive: true, force: true });
mkdirSync(CELLS, { recursive: true });

const results = {};
for (const [name, mutate] of CELL_SPEC) {
  const src = mutate(G_SRC);
  if (src === null) { say(`  ${name}: SKIPPED — anchor did not resolve`); results[name] = null; continue; }
  if (name !== 'R1-his-grader-unmodified' && src === G_SRC) {
    gate(`[${name}] the mutation changed the source`, false, 'source identical to his');
    results[name] = null; continue;
  }
  const dir = path.join(CELLS, name);
  mkdirSync(dir, { recursive: true });
  if (path.resolve(dir, '../../..') !== REPO) { gate(`[${name}] cell dir is depth 3`, false, dir); results[name] = null; continue; }
  const file = path.join(dir, 'cell.mjs');
  writeFileSync(file, src);
  const t0 = Date.now();
  const r = spawnSync('node', [file], { cwd: dir, encoding: 'utf8', timeout: 1800000 });
  const ms = Date.now() - t0;
  const text = (r.stdout || '') + (r.stderr || '');
  // Read his verdict out of his own stdout — never recomputed here (Rounds 408/412).
  const gateLine = (text.match(/^GATE: (.*)$/m) || [, '(no GATE line)'])[1];
  const predLine = (text.match(/^PREDICTIONS: (\d+) landed, (\d+) refuted$/m) || [, null, null]);
  const sum1 = (text.match(/^ {2}§1 cure .*$/m) || [, null])[0] || null;
  const sum2 = (text.match(/^ {2}§2 cure .*$/m) || [, null])[0] || null;
  // The inner per-cell GATE lines his grader prints for a red cell (his line 153, indented 6).
  const innerGate = (cell) => {
    const m = text.match(new RegExp(`^ {2}${cell}\\n(?: {6}.*\\n)*?(?: {6}GATE: (.*)$)`, 'm'));
    return m ? m[1] : '(no inner GATE line printed)';
  };
  results[name] = {
    exit: r.status,
    ms,
    gateTrue: gateLine === 'true',
    gateLine,
    landed: predLine[1] === null ? null : +predLine[1],
    refuted: predLine[2] === null ? null : +predLine[2],
    refutedNames: [...text.matchAll(/^ {2}REFUTED: (.*?) — expected/gm)].map((m) => m[1]),
    sum1, sum2,
    innerA2: innerGate('A2-old-cell-from-HEAD'),
    innerA3: innerGate('A3-token-no-rev-carries'),
  };
  const R = results[name];
  say(`  ${name}  (${(ms / 1000).toFixed(1)}s)`);
  say(`      exit ${r.status} | GATE ${R.gateTrue ? 'true' : 'FALSE'} | ${R.landed} landed, ${R.refuted} refuted`);
  if (!R.gateTrue) say(`      his GATE: ${R.gateLine.slice(0, 160)}`);
  R.refutedNames.forEach((n) => say(`      his REFUTED: ${n}`));
  if (R.sum1) say(`     ${R.sum1.trim()}`);
}

const R1 = results['R1-his-grader-unmodified'];
const R2 = results['R2-A2-dies-of-an-unrelated-fatal'];
const R3 = results['R3-A3-exits-2-for-an-unrelated-reason'];
const R4 = results['R4-cell-tree-left-behind'];
const R5 = results['R5-CONTROL-B1-dies-of-an-unrelated-fatal'];
const R6 = results['R6-CONTROL-B2-dies-of-an-unrelated-fatal'];

// --- 2. R1: his published verdict, reproduced in my tree at a different HEAD ----
say('');
say('## 2. R1 — his published verdict, reproduced in MY tree at a different HEAD');
say('');
const pubGate = (G_OUT_PUBLISHED.match(/^GATE: (.*)$/m) || [, null])[1];
const pubPred = (G_OUT_PUBLISHED.match(/^PREDICTIONS: (\d+) landed, (\d+) refuted$/m) || [, null, null]);
const pubHead = (G_OUT_PUBLISHED.match(/^HEAD at open: (\S+)$/m) || [, null])[1];
say(`  his published .out: GATE ${pubGate} | ${pubPred[1]} landed, ${pubPred[2]} refuted | at HEAD ${pubHead && pubHead.slice(0, 8)}`);
say(`  my HEAD: ${HEAD.slice(0, 8)}`);
predict('R1: his grader is green unmodified in my tree', true, !!R1 && R1.gateTrue);
predict('R1: …exit 0', 0, R1 && R1.exit);
predict('R1: …landed count equals the count in his published .out', pubPred[1] === null ? null : +pubPred[1], R1 && R1.landed);
predict('R1: …refuted count equals his published count', pubPred[2] === null ? null : +pubPred[2], R1 && R1.refuted);
gate('his verdict is NOT HEAD-dependent: reproduced at a different HEAD than the one he published',
  !!R1 && pubHead !== null && pubHead !== HEAD && R1.gateTrue && R1.landed === +pubPred[1],
  `published ${pubHead && pubHead.slice(0, 8)} vs mine ${HEAD.slice(0, 8)}`);

// --- 3. THE FINDING: A2 and A3 read an exit code, not the gate that fired -------
say('');
say('## 3. §1 — A2 and A3: an unrelated death publishes the same verdict as the cure firing');
say('');
predict('R2: his grader still exits 0 with the A2 cell dead and the section 1 cure INTACT', 0, R2 && R2.exit);
predict('R2: …GATE still true', true, !!R2 && R2.gateTrue);
predict('R2: …landed count UNCHANGED from R1', R1 && R1.landed, R2 && R2.landed);
predict('R2: …refuted count UNCHANGED from R1', R1 && R1.refuted, R2 && R2.refuted);
predict('R2: …and it still publishes the section 1 SEPARATES line verbatim', R1 && R1.sum1, R2 && R2.sum1);
predict('R3: his grader still exits 0 with the A3 cell exiting 2 for an unrelated reason', 0, R3 && R3.exit);
predict('R3: …GATE still true', true, !!R3 && R3.gateTrue);
predict('R3: …landed count UNCHANGED from R1', R1 && R1.landed, R3 && R3.landed);
predict('R3: …and it still publishes the section 1 SEPARATES line verbatim', R1 && R1.sum1, R3 && R3.sum1);
gate('THE FINDING (A2): his grader publishes an IDENTICAL verdict — GATE, exit, both counts and the '
  + 'section 1 SEPARATES line — whether A2 reddens because the cure fired or because the cell died',
  !!R1 && !!R2 && R1.gateTrue === R2.gateTrue && R1.exit === R2.exit && R1.landed === R2.landed
    && R1.refuted === R2.refuted && R1.sum1 === R2.sum1,
  R1 && R2 ? `R1(gate ${R1.gateTrue}, exit ${R1.exit}, ${R1.landed}/${R1.refuted}) vs R2(gate ${R2.gateTrue}, exit ${R2.exit}, ${R2.landed}/${R2.refuted})` : 'a cell did not run');
gate('THE FINDING (A3): likewise for A3 — `exit === 2` is satisfied by any exit 2, and his refusal '
  + 'is only one of them',
  !!R1 && !!R3 && R1.gateTrue === R3.gateTrue && R1.exit === R3.exit && R1.landed === R3.landed
    && R1.sum1 === R3.sum1,
  R1 && R3 ? `R1(gate ${R1.gateTrue}, exit ${R1.exit}, ${R1.landed}) vs R3(gate ${R3.gateTrue}, exit ${R3.exit}, ${R3.landed})` : 'a cell did not run');

// The separating evidence: the text that WOULD distinguish them is captured and printed by his own
// grader, and read by no leg of it.
say('');
say('  the distinguishing text, printed by his own grader and read by no leg of it:');
say(`    R1 inner A2 GATE: ${String(R1 && R1.innerA2).slice(0, 120)}`);
say(`    R2 inner A2 GATE: ${String(R2 && R2.innerA2).slice(0, 120)}`);
say(`    R1 inner A3 GATE: ${String(R1 && R1.innerA3).slice(0, 120)}`);
say(`    R3 inner A3 GATE: ${String(R3 && R3.innerA3).slice(0, 120)}`);
gate('R1 names the section 1 defect gate in A2 — so the identifying text exists',
  !!R1 && /the OLD cell is not sourced from HEAD/.test(R1.innerA2), R1 ? R1.innerA2.slice(0, 90) : 'R1 did not run');
gate('R2 names NO gate in A2 — so the two reds are distinguishable in his own stdout, and no leg '
  + 'of his grader reads it',
  !!R2 && /no GATE line/.test(R2.innerA2), R2 ? R2.innerA2.slice(0, 90) : 'R2 did not run');
gate('R1 names the derivation refusal in A3', !!R1 && /no rev of the graded file carries the defect token/.test(R1.innerA3),
  R1 ? R1.innerA3.slice(0, 90) : 'R1 did not run');
gate('R3 names NO gate in A3', !!R3 && /no GATE line/.test(R3.innerA3), R3 ? R3.innerA3.slice(0, 90) : 'R3 did not run');

// --- 4. THE CONTROL: where a leg reads the failure's identity, he catches it ----
say('');
say('## 4. The control — B1 and B2 each carry one leg that reads the failure, and both catch it');
say('');
predict('R5 CONTROL: the same unrelated fatal in B1 IS noticed — exactly 1 predict refuted', 1, R5 && R5.refuted);
predict('R5: …and the refuted leg is the one that reads the cell`s own predicts',
  ['B1: …and the value predicts REFUTE rather than being absent'], R5 && R5.refutedNames);
predict('R5: …exit 1', 1, R5 && R5.exit);
predict('R6 CONTROL: the same unrelated fatal in B2 IS noticed — GATE FALSE', false, !!R6 && R6.gateTrue);
predict('R6: …and the gate that caught it is the BETA-sentence gate', true,
  !!R6 && /tells on the BETA cell/.test(R6.gateLine));
gate('THE CONTROL SEPARATES: this is not a blanket claim about his grader. The identical crippling '
  + 'is caught in B1 and B2, where a leg reads the identity of the failure, and missed in A2 and A3, '
  + 'where none does',
  !!R2 && !!R3 && !!R5 && !!R6 && R2.gateTrue === true && R3.gateTrue === true
    && (R5.refuted > 0) && R6.gateTrue === false,
  R5 && R6 ? `R2 ${R2.gateTrue} | R3 ${R3.gateTrue} | R5 refuted ${R5.refuted} | R6 gate ${R6.gateTrue}` : 'a cell did not run');

// --- 5. The lesser finding: the stray-file gate cannot see his own cells --------
say('');
say('## 5. His stray-file gate watches a directory his cells are never written to');
say('');
predict('R4: suppressing his rmSync makes GATE FALSE (the cell-tree gate does its job)', false, !!R4 && R4.gateTrue);
predict('R4: …and the gate that fired is the cell-tree one', true, !!R4 && /the cell tree was removed/.test(R4.gateLine));
predict('R4: …while the stray-file gate stays SILENT, with a whole cell tree left on disk', false,
  !!R4 && /no cell file leaked into docs\/research/.test(R4.gateLine));
gate('his `no cell file leaked into docs/research` gate is not load-bearing for his own cells: they '
  + 'are written under `.testdata/round423cells`, which `git status -- docs/research` cannot see',
  !!R4 && !R4.gateTrue && /the cell tree was removed/.test(R4.gateLine)
    && !/no cell file leaked into docs\/research/.test(R4.gateLine),
  R4 ? R4.gateLine.slice(0, 120) : 'R4 did not run');

// --- hygiene ----------------------------------------------------------------
say('');
rmSync(CELLS, { recursive: true, force: true });
gate('my cell tree was removed', !existsSync(CELLS), CELLS);
// `git diff HEAD`, not `git diff`: a staged change is invisible to the bare form (Rounds 414/415/416).
const dirtyVsHead = git('diff', 'HEAD', '--stat', '--', G_REL, G_OUT_REL, A_REL, B_REL).stdout.trim();
gate('none of his four files was modified, staged or unstaged (every cell was a copy)', dirtyVsHead === '',
  dirtyVsHead || '(unmodified vs HEAD)');
gate('his published .out is byte-identical to what I read at open',
  readFileSync(path.join(REPO, G_OUT_REL), 'utf8') === G_OUT_PUBLISHED, G_OUT_REL);
// Checked on the filesystem and not via `git status`, because `.testdata/` is gitignored and a
// porcelain check of it is exactly the vacuous gate §5 charges. R4 suppresses HIS rmSync, so his
// own `round423cells` tree is left behind by that cell and must be gone by the end of the drive.
const HIS_CELLS = path.join(REPO, '.testdata', 'round423cells');
rmSync(HIS_CELLS, { recursive: true, force: true });
gate('no cell tree of mine or his is left on disk (checked with existsSync, not `git status`, '
  + 'because `.testdata/` is gitignored)', !existsSync(CELLS) && !existsSync(HIS_CELLS),
  `${existsSync(CELLS) ? CELLS : ''} ${existsSync(HIS_CELLS) ? HIS_CELLS : ''}`.trim() || '(both absent)');

say('');
say('='.repeat(78));
const refuted = preds.filter((p) => !p.landed);
say(`GATE: ${fails.length === 0 ? 'true' : 'FALSE (' + fails.join('; ') + ')'}`);
say(`PREDICTIONS: ${preds.length - refuted.length} landed, ${refuted.length} refuted`);
refuted.forEach((p) => say(`  REFUTED: ${p.name} — expected ${JSON.stringify(p.expected)}, got ${JSON.stringify(p.actual)}`));
say('');
say('SUMMARY:');
const f1 = !!R1 && !!R2 && R1.gateTrue === R2.gateTrue && R1.exit === R2.exit && R1.landed === R2.landed && R1.sum1 === R2.sum1;
const f2 = !!R1 && !!R3 && R1.gateTrue === R3.gateTrue && R1.exit === R3.exit && R1.landed === R3.landed;
const ctl = !!R5 && !!R6 && R5.refuted > 0 && R6.gateTrue === false;
say(`  A2 leg (gateTrue + exit only): ${f1 === null ? 'UNMEASURED' : f1 ? 'DOES NOT SEPARATE — an unrelated death publishes his verdict unchanged' : 'separates'}`);
say(`  A3 leg (exit === 2 only):      ${f2 === null ? 'UNMEASURED' : f2 ? 'DOES NOT SEPARATE — any exit 2 satisfies it' : 'separates'}`);
say(`  B1/B2 legs (control):          ${ctl ? 'SEPARATE — the identical crippling is caught where a leg reads the failure' : 'did NOT separate, so this round grades nothing'}`);
say(`  stray-file gate:               ${R4 && !R4.gateTrue && !/no cell file leaked/.test(R4.gateLine) ? 'NOT load-bearing for his own cells' : 'not shown'}`);
flush();
if (fails.length || refuted.length) process.exit(1);
