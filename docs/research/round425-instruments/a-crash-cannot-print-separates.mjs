#!/usr/bin/env node
/**
 * Round 425 — grade the two cures I applied to Theseus's Round 424 §1 and §2.
 *
 * THE SUBJECT is my own grader, `docs/research/round423-instruments/grade-the-422-cures.mjs`.
 * His charge was that its A2/A3 reds were keyed on `gateTrue === false` plus an exit code, and a
 * cell that dies of an unrelated fatal satisfies both — so it published `SEPARATES` from evidence
 * that cannot distinguish the cure from a crash. He drove that (R2/R3). My cures: `absent` is a
 * third gate state, and each A-red additionally matches the IDENTITY of the gate that fired.
 *
 * WHY A 2 × 2 AND NOT A GREEN RE-DRIVE. A cured instrument that comes back green is consistent
 * with the cure being decoration (Rounds 321/368), and it is also consistent with the crippling
 * having failed to land. So each leg is graded on both axes at once:
 *
 *                      | subject's A-cell CLEAN      | subject's A-cell CRASHES
 *   -------------------+-----------------------------+---------------------------------
 *   my NEW spelling    | SEPARATES   (D1 / D5n)      | must NOT print SEPARATES (D2 / D5)
 *   my OLD spelling    | SEPARATES   (D4 / D6n)      | prints SEPARATES anyway (D3 / D6)
 *
 * The OLD-spelling row is his finding reproduced against my own tree; the NEW-spelling row is the
 * cure. A green that appears in both rows of the CLEAN column is what makes the CRASH column a
 * reading rather than an artefact of the mutation.
 *
 * THE OLD SPELLING IS DERIVED BY MUTATION, NOT FROM `git show HEAD:`. Rounds 420/422: an OLD cell
 * sourced from HEAD inverts the moment the cure and the grader share a commit — which is exactly
 * what happens here, since cure and grader land in adjacent commits of the same fire. Each OLD
 * cell is the CURED source with the cured conjunct textually removed, anchored and asserted to
 * occur exactly once.
 *
 * COST. Each cell is a drive of my grader, which itself drives cells. The three B cells of the
 * subject each drive a six-sub-cell instrument and dominate the runtime, and nothing under charge
 * here is a B leg — so every cell carries an `A-ONLY` mutation that drops the B entries from the
 * subject's CELL_SPEC. The consequence is deliberate and is NOT read as a failure: with B cells
 * absent the subject's overall `GATE:` goes FALSE and it exits 1 in every cell below. Every leg
 * here reads a NAMED line of the subject's output — its §1 SUMMARY sentence, its §1 discriminator
 * gate, its A3 refusal gate, its two hygiene gates — never the overall exit code or GATE line.
 *
 * Cells are driven SERIALLY: every copy of the subject writes its inner cells to the same
 * `REPO/.testdata/round423cells`.
 */
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync, readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const REPO = path.resolve(import.meta.dirname, '../../..');
const S_REL = 'docs/research/round423-instruments/grade-the-422-cures.mjs';
const CHANGELOG = path.join(REPO, '.testdata', 'round419-sdk-changelog.md');
// `.testdata`(1) / `round425cells`(2) / `<cell>`(3) — a cell's own dirname is depth 3, which is
// what the SUBJECT resolves REPO from (Round 421: a copy at the wrong depth refuses every cell).
const CELLS = path.join(REPO, '.testdata', 'round425cells');
const INNER = path.join(REPO, '.testdata', 'round423cells');

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

say('# Round 425 — a crash in the A2 cell can no longer print `SEPARATES`');
say('');
say(`REPO: ${REPO}`);
say(`HEAD at open: ${git('rev-parse', 'HEAD').stdout.trim()}`);
say(`subject: ${S_REL}`);
say(`driven at: ${new Date().toISOString()}`);
say('');

gate('the subject (my Round 423 grader) is present', existsSync(path.join(REPO, S_REL)), S_REL);
gate('the changelog fixture the subject needs is present', existsSync(CHANGELOG), CHANGELOG);
gate('a cell DIRECTORY is depth 3 under REPO', path.resolve(path.join(CELLS, 'sample'), '../../..') === REPO,
  path.resolve(path.join(CELLS, 'sample'), '../../..'));
if (fails.length) { say(''); say(`GATE: FALSE (${fails.join('; ')})`); say('SUMMARY: REFUSED at a precondition'); process.exit(2); }

const S_SRC = readFileSync(path.join(REPO, S_REL), 'utf8');

// --- the mutations ----------------------------------------------------------
// Each is [from, to]. Every one is asserted to occur exactly once in the subject before it is
// applied (Round 347), and a cell whose anchor misses is SKIPPED and refuses, never silently run.

// (0) A-ONLY — drop the subject's three B cells. Cost only; no leg below reads a B result.
const AONLY_FROM = `  ['B0-cured-control', B_SRC, []],
  ['B1-gamma-read-misses', B_SRC, [[B1_FROM, B1_TO]]],
  ['B2-beta-named-three-drops-two', B_SRC, [[B2_FROM, B2_TO]]],`;
const AONLY_TO = `  // A-ONLY (Round 425 meta-grader): the three B cells cost ~2 minutes and no leg under charge reads them.`;

// CURED (Round 428, his Round 426 §3) — THE TWO LINES BELOW ARE SLICED, NOT TYPED.
// What carried my load-bearing claim — *"the §1 cure left textually intact … no rev-sourced defect
// restored anywhere"* — used to be a string I had TYPED into this file: a copy of the subject's
// `A2_FROM`, which is itself a copy of a line of subject A. Nothing asserted the copy still
// equalled the original, and no `occurs === 1` can see it: an anchor is the text you SEARCH for,
// this is the text you WRITE (Round 347 applied correctly and still blind to this). His control is
// the third row of his table — a rename a maintainer is FORCED to carry into the subject's
// `A2_FROM` leaves both anchors at 1 and silently stops restoring the cure, so D2's red would mean
// *the cured spelling refused a restored defect* rather than *refused a crash*. Both lines are now
// sliced out of the subject and asserted to occur in subject A exactly once (Round 408/412: a
// hand-typed reader is not a slice), so the carried rename reddens here instead of passing.
const A_REL_PIN = (S_SRC.match(/^const A_REL = '(.*)';$/m) || [, null])[1];
gate('subject A\'s path was sliced out of the subject, not typed', A_REL_PIN !== null, A_REL_PIN || '(no match)');
const A_SRC_PIN = A_REL_PIN !== null && existsSync(path.join(REPO, A_REL_PIN))
  ? readFileSync(path.join(REPO, A_REL_PIN), 'utf8') : null;
gate('…and subject A is readable', A_SRC_PIN !== null, A_REL_PIN ? `${A_REL_PIN} — ${A_SRC_PIN?.length ?? 0} bytes` : '(no path)');
const A2_CURED_LINE = (S_SRC.match(/^const A2_FROM = '(.*)';$/m) || [, null])[1];
const A3_DEFECT_LINE = (S_SRC.match(/^const A3_FROM = `(.*)`;$/m) || [, null])[1];
for (const [label, line] of [['A2_FROM (the §1 cured line)', A2_CURED_LINE], ['A3_FROM (DEFECT_TOKEN)', A3_DEFECT_LINE]]) {
  gate(`the subject's \`${label}\` was sliced out of the subject`, line !== null, (line || '(no match)').slice(0, 72));
  const n = line === null || A_SRC_PIN === null ? -1 : A_SRC_PIN.split(line).length - 1;
  gate(`…and THE SLICED TEXT occurs in subject A exactly once — the pin his §3 asked for`,
    n === 1, `occurs=${n} in ${A_REL_PIN}`);
}
if (fails.length) { say(''); say(`GATE: FALSE (${fails.join('; ')})`); say('SUMMARY: REFUSED at the §3 pin'); process.exit(2); }

// (1) A2 CRASHES, with the §1 cure in subject A left TEXTUALLY INTACT. His R2 shape. The cured
// derived-PRE_CURE line is kept verbatim and a throw is appended after it, so no rev-sourced
// defect is restored anywhere: the cell simply dies before printing a verdict.
const A2CRASH_FROM = `const A2_TO = 'const PRE_CURE = HEAD; // MUTANT: the Round 422 §1 defect restored';`;
const A2CRASH_TO = `const A2_TO = ${JSON.stringify(
  `${A2_CURED_LINE}\n`
  + 'throw new Error("UNRELATED FATAL: this cell dies before printing any verdict; the §1 cure above is intact");',
)}; // MUTANT (Round 425): an unrelated fatal, the §1 cure left intact`;

// (2) A3 exits 2 for a reason that is not the token refusal, with DEFECT_TOKEN left INTACT. His R3
// shape: an unrelated exit 2 BEFORE the derivation, so the refusal say() never prints.
const A3CRASH_FROM = `const A3_TO = \`const DEFECT_TOKEN = "ZZZ_TOKEN_NO_REV_CARRIES"; // MUTANT: token present in no rev\`;`;
const A3CRASH_TO = `const A3_TO = ${JSON.stringify(
  'process.exit(2); // MUTANT (Round 425): an unrelated exit 2 before the derivation\n'
  + A3_DEFECT_LINE,
)};`;

// (3) UN-CURE the §1 discriminator: remove the `whyA2` conjunct, restoring the four-conjunct gate
// he quoted. Derived by removing text from the CURED source, never read from a rev.
const UNCURE_DISC_FROM = `  !!A1 && !!A2 && A1.gateState === 'true' && A2.gateState === 'false' && whyA2
  && A1.exit === 0 && A2.exit !== 0,`;
const UNCURE_DISC_TO = `  !!A1 && !!A2 && A1.gateTrue === true && A2.gateTrue === false && A1.exit === 0 && A2.exit !== 0, // UN-CURED (Round 425): the Round 423 spelling`;

// (4) UN-CURE the published §1 SUMMARY sentence, back to the key he quoted.
const UNCURE_SUMM_FROM = `  \`\${A1 && A2 && A1.gateState === 'true' && A2.gateState === 'false' && whyA2
    ? 'SEPARATES — and A2 names the gate it failed, so a crash in that cell cannot print this'
    : 'NOT shown to separate'}\`);`;
const UNCURE_SUMM_TO = `  \`\${A1 && A2 && A1.gateTrue && !A2.gateTrue ? 'SEPARATES' : 'NOT shown to separate'}\`); // UN-CURED (Round 425)`;

// (5) UN-CURE the A3 refusal gate, back to exit-code-plus-not-true.
const UNCURE_A3_FROM = `  !!A3 && A3.exit === 2 && A3.gateState === 'false' && whyA3,`;
const UNCURE_A3_TO = `  !!A3 && A3.exit === 2 && A3.gateTrue === false, // UN-CURED (Round 425)`;

// (6) Suppress the hygiene rmSync — his R4 shape, a whole cell tree left on disk. `rmSync(CELLS…)`
// occurs twice in the subject (once before the loop), so the anchor carries the gate below it.
const LEAK_FROM = `rmSync(CELLS, { recursive: true, force: true });
gate('the cell tree was removed'`;
const LEAK_TO = `// MUTANT (Round 425): hygiene rmSync suppressed — the cell tree is left on disk
gate('the cell tree was removed'`;

// (7) UN-CURE the §2 stray-file check, back to the porcelain-over-docs/research spelling.
// (`walk` itself is left declared and unused in the un-cured cell — the old spelling never had it,
// and removing its declaration too would be a second change in one crippling.)
const UNCURE_STRAY_FROM = `const strays = [...walk(CELLS), ...walk(import.meta.dirname)
  .filter((f) => /cell/i.test(path.basename(f)) && f !== import.meta.filename)];
gate('no cell file survives anywhere a cell of mine can land (walked, not \`git status\` — '
  + '\`.testdata/\` is gitignored and porcelain is blind to it)',
  strays.length === 0, strays.map((f) => path.relative(REPO, f)).join(' | ') || '(none)');`;
const UNCURE_STRAY_TO = `const stray = git('status', '--porcelain', '--', 'docs/research').stdout.trim().split('\\n').filter((l) => /cell/i.test(l)); // UN-CURED (Round 425)
gate('no cell file leaked into docs/research', stray.length === 0, stray.join(' | ') || '(none)');`;

const CELL_SPEC = [
  // --- §1 / A2: the 2 × 2 -------------------------------------------------
  ['D1-new-clean'],
  ['D2-new-A2-crashes', [A2CRASH_FROM, A2CRASH_TO]],
  ['D3-old-A2-crashes', [A2CRASH_FROM, A2CRASH_TO], [UNCURE_DISC_FROM, UNCURE_DISC_TO], [UNCURE_SUMM_FROM, UNCURE_SUMM_TO]],
  ['D4-old-clean', [UNCURE_DISC_FROM, UNCURE_DISC_TO], [UNCURE_SUMM_FROM, UNCURE_SUMM_TO]],
  // --- §1 / A3: the 2 × 2 (D1 and D4 are its CLEAN column too) ------------
  ['D5-new-A3-exits-2', [A3CRASH_FROM, A3CRASH_TO]],
  ['D6-old-A3-exits-2', [A3CRASH_FROM, A3CRASH_TO], [UNCURE_A3_FROM, UNCURE_A3_TO]],
  // --- §2: the 2 × 2 (D1 and D4 are its NO-LEAK column) -------------------
  ['D7-new-cells-leak', [LEAK_FROM, LEAK_TO]],
  ['D8-old-cells-leak', [LEAK_FROM, LEAK_TO], [UNCURE_STRAY_FROM, UNCURE_STRAY_TO]],
];

// --- what I expect, written down before the drive ---------------------------
say('## 0. Expected member loss, written down before the drive');
say('');
say('  D1 new/clean      — §1 SUMMARY SEPARATES · discriminator OK · A3 gate OK · stray gate OK');
say('  D2 new/A2 crash   — §1 SUMMARY NOT · discriminator FAIL · A2 state `absent`, names-its-gate false');
say('  D3 old/A2 crash   — §1 SUMMARY SEPARATES · discriminator OK   <-- his R2, reproduced on my tree');
say('  D4 old/clean      — §1 SUMMARY SEPARATES · discriminator OK   <-- the un-cure alone changes nothing');
say('  D5 new/A3 exit 2  — A3 gate FAIL (state `absent`, refusal not named)');
say('  D6 old/A3 exit 2  — A3 gate OK                                 <-- his R3, reproduced on my tree');
say('  D7 new/leak       — walk gate FAIL, naming leaked files; `cell tree was removed` FAIL');
say('  D8 old/leak       — porcelain gate OK (silent) with a cell tree on disk; `removed` FAIL  <-- his R4');
say('');
say('  REVISED after the first drive, and recorded as revised rather than quietly re-predicted:');
say('  the first drive refuted `D1 new/no leak: walk OK` — the cured walk searched its own');
say('  directory for /cell/i and a cell of this grader IS named `cell.mjs`, so it reddened in all');
say('  eight cells, including the clean ones. That is a real flaw in the cure (it graded the rig,');
say('  Round 421), fixed by excluding the running file by its own path, and the leg is inert in');
say('  the published tree where the entry file is `grade-the-422-cures.mjs`. D1 is now OK.');
say('');

say('## 1. The cells');
say('');
rmSync(CELLS, { recursive: true, force: true });
mkdirSync(CELLS, { recursive: true });

// Readers. Each returns null when the line it wants is absent, and no leg below compares two
// nulls (Round 393: a sentinel fallback makes a comparison green forever).
const readGate = (text, nameRe) => {
  const m = text.match(new RegExp(String.raw`^\s*\[GATE\] (OK|FAIL)\s+${nameRe}`, 'm'));
  return m === null ? null : m[1];
};
const readSummary1 = (text) => {
  const m = text.match(/^ {2}§1 cure \(OLD cell derived by property\): (.*)$/m);
  return m === null ? null : (/^SEPARATES/.test(m[1]) ? 'SEPARATES' : m[1].slice(0, 40));
};
const readA2State = (text) => {
  const m = text.match(/^ {6}exit (-?\d+|null) \| GATE (\w+) \|/gm);
  return m === null ? null : m;
};

const R = {};
for (const [name, ...pairs] of CELL_SPEC) {
  let src = S_SRC;
  let ok = true;
  for (const [from, to] of [[AONLY_FROM, AONLY_TO], ...pairs]) {
    const occurs = src.split(from).length - 1;
    gate(`[${name}] anchor occurs exactly once: ${from.slice(0, 44).replace(/\n/g, '⏎')}…`, occurs === 1, `occurs=${occurs}`);
    if (occurs !== 1) { ok = false; break; }
    src = src.split(from).join(to);
  }
  if (!ok) { say(`  ${name}: SKIPPED — an anchor did not occur exactly once`); R[name] = null; continue; }
  const dir = path.join(CELLS, name);
  mkdirSync(dir, { recursive: true });
  if (path.resolve(dir, '../../..') !== REPO) { gate(`[${name}] cell dir is depth 3`, false, dir); R[name] = null; continue; }
  const file = path.join(dir, 'cell.mjs');
  writeFileSync(file, src);
  // Serial by construction: every copy drives its inner cells into the same INNER directory.
  rmSync(INNER, { recursive: true, force: true });
  const r = spawnSync('node', [file, CHANGELOG], { cwd: dir, encoding: 'utf8', timeout: 900000 });
  const text = (r.stdout || '') + (r.stderr || '');
  R[name] = {
    exit: r.status,
    summary1: readSummary1(text),
    disc1: readGate(text, String.raw`THE DISCRIMINATOR \(§1\)`),
    a3: readGate(text, 'the refusal is a refusal'),
    removed: readGate(text, 'the cell tree was removed'),
    walkStray: readGate(text, 'no cell file survives anywhere'),
    porcStray: readGate(text, 'no cell file leaked into docs/research'),
    cellStates: readA2State(text),
    innerLeft: existsSync(INNER) ? readdirSync(INNER).sort() : null,
  };
  // The inner tree is left behind on purpose by D7/D8; clear it before the next cell either way.
  rmSync(INNER, { recursive: true, force: true });
  say(`  ${name}: exit ${r.status} | §1 SUMMARY ${JSON.stringify(R[name].summary1)} | disc §1 ${R[name].disc1}`
    + ` | A3 ${R[name].a3} | removed ${R[name].removed} | walk ${R[name].walkStray} | porcelain ${R[name].porcStray}`);
  say(`      inner cells left on disk afterwards: ${R[name].innerLeft ? R[name].innerLeft.join(', ') : '(tree gone)'}`);
  say(`      the subject's own cell lines: ${(R[name].cellStates || ['(none)']).map((s) => s.trim()).join('  ·  ')}`);
}

const D = (n) => R[n] || {};
const [D1, D2, D3, D4, D5, D6, D7, D8] = ['D1-new-clean', 'D2-new-A2-crashes', 'D3-old-A2-crashes',
  'D4-old-clean', 'D5-new-A3-exits-2', 'D6-old-A3-exits-2', 'D7-new-cells-leak', 'D8-old-cells-leak'].map(D);

// --- CURED (Round 428, Theseus's Round 426 §1): each discriminator is named ONCE and read by
// BOTH its gate and its published sentence ----------------------------------------------------
// His charge, verified against my own source and not his memo: three of the four sentences this
// file published were keyed on a PROPER SUBSET of the conjuncts of their own named discriminator,
// and each dropped conjunct was the control that makes the reading a reading —
//   §1/A2 dropped `D4.summary1 === 'SEPARATES'` (the un-cure-alone column, which is what makes the
//          crippled column attributable) and `D2.summary1 !== null` (the did-it-print guard, so a
//          cell dying between its gate line and its verdict read as a cell that refused to publish
//          one — the Round 424 charge I had just cured, happening in the sentence instead of the
//          gate) and `D3.disc1 === 'OK'`;
//   §1/A3 dropped `D4.a3 === 'OK'`, the same clean/old control;
//   §2     dropped `D7.innerLeft.length > 0`, the only evidence that D8's silence was silence
//          ABOUT something rather than about an empty disk.
// A red overall `GATE:` line does not unprint a sentence, and the sentence is what gets quoted
// into a memo — Round 353 and Round 422, one layer out. The cure is deliberately STRUCTURAL and
// not three edits: there is now exactly one expression per reading, so a conjunct added to the
// gate cannot be missed by the sentence. `D(n)` hands `{}` to every leg of a SKIPPED or
// depth-refused cell, so each predicate is written to be false on `{}` rather than to throw.
const SEPARATES_1_A2 = D1.summary1 === 'SEPARATES' && D4.summary1 === 'SEPARATES'
  && D3.summary1 === 'SEPARATES' && D3.disc1 === 'OK'
  && D2.summary1 !== null && D2.summary1 !== 'SEPARATES' && D2.disc1 === 'FAIL';
const SEPARATES_1_A3 = D1.a3 === 'OK' && D4.a3 === 'OK' && D6.a3 === 'OK' && D5.a3 === 'FAIL';
const SEPARATES_2 = D7.walkStray === 'FAIL' && D8.porcStray === 'OK' && D1.walkStray === 'OK'
  && Array.isArray(D7.innerLeft) && D7.innerLeft.length > 0
  && Array.isArray(D8.innerLeft) && D8.innerLeft.length > 0;

// --- every leg needs its reader shown to work ------------------------------
say('');
say('## 2. The readers read something — a refusing reader would make every cell below agree');
say('');
for (const [n, c] of [['D1', D1], ['D2', D2], ['D3', D3], ['D4', D4]]) {
  gate(`[${n}] the §1 SUMMARY sentence and the §1 discriminator gate were both found`,
    c.summary1 !== null && c.disc1 !== null, `summary=${JSON.stringify(c.summary1)} disc=${c.disc1}`);
}
gate('[D5/D6] the A3 refusal gate was found in both', D5.a3 !== null && D6.a3 !== null, `D5=${D5.a3} D6=${D6.a3}`);
gate('[D7] the cured walk gate was found, and the un-cured porcelain gate is absent from it',
  D7.walkStray !== null && D7.porcStray === null, `walk=${D7.walkStray} porcelain=${D7.porcStray}`);
gate('[D8] the un-cured porcelain gate was found, and the cured walk gate is absent from it',
  D8.porcStray !== null && D8.walkStray === null, `porcelain=${D8.porcStray} walk=${D8.walkStray}`);

// --- §1 / A2 ---------------------------------------------------------------
say('');
say('## 3. §1 — the A2 2 × 2: can a crash still print `SEPARATES`?');
say('');
predict('D1 new/clean: publishes SEPARATES', 'SEPARATES', D1.summary1);
predict('D1 new/clean: §1 discriminator OK', 'OK', D1.disc1);
predict('D4 old/clean: publishes SEPARATES too — the un-cure alone moves nothing', 'SEPARATES', D4.summary1);
predict('D4 old/clean: §1 discriminator OK', 'OK', D4.disc1);
predict('D3 old/A2 crash: HIS FINDING — the old spelling prints SEPARATES for a crashed cell',
  'SEPARATES', D3.summary1);
predict('D3 old/A2 crash: …and its discriminator passes', 'OK', D3.disc1);
predict('D2 new/A2 crash: the cured spelling does NOT publish SEPARATES', true,
  D2.summary1 !== null && D2.summary1 !== 'SEPARATES');
predict('D2 new/A2 crash: …and its discriminator FAILS', 'FAIL', D2.disc1);
gate('THE DISCRIMINATOR (§1/A2): the cure separates a crash from the cure — identical crippled '
  + 'tree, SEPARATES under the old spelling and NOT under the new, while the un-cure alone leaves '
  + 'the clean verdict untouched in both rows',
  SEPARATES_1_A2,
  `clean: new ${JSON.stringify(D1.summary1)} / old ${JSON.stringify(D4.summary1)} — crashed: new ${JSON.stringify(D2.summary1)} / old ${JSON.stringify(D3.summary1)}`);

// --- §1 / A3 ---------------------------------------------------------------
say('');
say('## 4. §1 — the A3 2 × 2: is an unrelated exit 2 still read as the refusal?');
say('');
predict('D1 new/clean: A3 gate OK', 'OK', D1.a3);
predict('D4 old/clean: A3 gate OK', 'OK', D4.a3);
predict('D6 old/A3 exit 2: HIS FINDING — the old spelling accepts an unrelated exit 2', 'OK', D6.a3);
predict('D5 new/A3 exit 2: the cured spelling FAILS it', 'FAIL', D5.a3);
gate('THE DISCRIMINATOR (§1/A3): same crippled tree, the A3 gate passes under the old spelling and '
  + 'fails under the new, and both spellings pass on a clean tree',
  SEPARATES_1_A3,
  `clean: new ${D1.a3} / old ${D4.a3} — exit-2: new ${D5.a3} / old ${D6.a3}`);

// --- §2 --------------------------------------------------------------------
say('');
say('## 5. §2 — the stray-file 2 × 2: does the check see the tree the cells are in?');
say('');
predict('D7 new/leak: the walk FAILS and names the leak', 'FAIL', D7.walkStray);
predict('D7 new/leak: …and the cell tree really was on disk when it was checked', true,
  Array.isArray(D7.innerLeft) && D7.innerLeft.length > 0);
predict('D8 old/leak: HIS FINDING — the porcelain check stays silent with a cell tree on disk',
  'OK', D8.porcStray);
predict('D8 old/leak: …with the same tree on disk', true,
  Array.isArray(D8.innerLeft) && D8.innerLeft.length > 0);
predict('D1 new/no leak: the walk passes when there is nothing to find', 'OK', D1.walkStray);
gate('THE DISCRIMINATOR (§2): the same leaked cell tree is FAILED by the walk and passed by the '
  + 'porcelain check it replaced, and the walk still passes with no leak',
  SEPARATES_2,
  `leak: walk ${D7.walkStray} (tree ${JSON.stringify(D7.innerLeft)}) / porcelain ${D8.porcStray} (tree ${JSON.stringify(D8.innerLeft)}) — no leak: walk ${D1.walkStray}`);

// --- hygiene ---------------------------------------------------------------
say('');
rmSync(CELLS, { recursive: true, force: true });
rmSync(INNER, { recursive: true, force: true });
const walk = (root) => (existsSync(root) ? readdirSync(root, { recursive: true, withFileTypes: true })
  .filter((d) => d.isFile()).map((d) => path.join(d.parentPath ?? d.path, d.name)) : []);
const strays = [...walk(CELLS), ...walk(INNER), ...walk(import.meta.dirname).filter((f) => /cell/i.test(path.basename(f)))];
gate('no cell file survives, in either cell tree or beside this instrument (walked, not `git status`)',
  strays.length === 0, strays.map((f) => path.relative(REPO, f)).join(' | ') || '(none)');
const dirty = git('diff', '--stat', '--', S_REL).stdout.trim();
gate('the subject was never mutated in place (every cell was a copy)', dirty === '', dirty || '(unmodified)');

say('');
say('='.repeat(78));
const refuted = preds.filter((p) => !p.landed);
say(`GATE: ${fails.length === 0 ? 'true' : 'FALSE (' + fails.join('; ') + ')'}`);
say(`PREDICTIONS: ${preds.length - refuted.length} landed, ${refuted.length} refuted`);
refuted.forEach((p) => say(`  REFUTED: ${p.name} — expected ${JSON.stringify(p.expected)}, got ${JSON.stringify(p.actual)}`));
say('');
say('SUMMARY:');
// Each sentence reads the SAME const its `THE DISCRIMINATOR` gate above reads — nothing else.
say(`  §1/A2 cure (a red must name the gate that fired): ${SEPARATES_1_A2
  ? 'SEPARATES — his R2 shape prints SEPARATES under the old spelling and is refused under the new'
  : 'NOT shown to separate'}`);
say(`  §1/A3 cure (the refusal must name itself): ${SEPARATES_1_A3
  ? 'SEPARATES — his R3 shape passes under the old spelling and fails under the new'
  : 'NOT shown to separate'}`);
say(`  §2 cure (walk both trees instead of porcelain over docs/research): ${SEPARATES_2
  ? 'SEPARATES — his R4 shape is silent under the old spelling and named under the new'
  : 'NOT shown to separate'}`);

writeFileSync(path.join(import.meta.dirname, 'a-crash-cannot-print-separates.out'), out.join('\n') + '\n');
if (fails.length || refuted.length) process.exit(1);
