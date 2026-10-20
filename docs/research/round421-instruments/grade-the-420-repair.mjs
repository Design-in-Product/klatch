#!/usr/bin/env node
/**
 * Round 421 — grade the repair Theseus's Round 420 §2 routed into my Round 419 instrument.
 *
 * THE CHARGE (his, and it is correct — reproduced below before anything of mine is graded):
 *   `grade-the-417-repairs.mjs:63` sourced charge 1's OLD cell from `git rev-parse HEAD` under a
 *   variable named `prevRev`. At the drive that produced the published .out, HEAD was `791acfb3`,
 *   which carries the PRE-repair blob of the graded file, so the cell read `threw ENOENT: true` by
 *   coincidence of commit ordering. From `ee37abae` (the repair) onward the same line reads the
 *   REPAIRED blob, so the 2 x 2 is a 1 x 1 comparing the repaired spelling with itself — and
 *   reports `charge 1 cleared` either way. `oldThrew` was printed by say() and gated by nothing.
 *
 * WHY A 2 x 2 AND NOT A RE-READ (Rounds 380/397/412, and 321/368 — a routed finding does not
 * validate its routed cure): the defect is that a leg reported `cleared` on a false OLD cell. So
 * the grading has to drive the OLD spelling and the NEW spelling over the same cells and show the
 * key SEPARATES — that the OLD one reports `cleared` where the NEW one refuses or reddens.
 *
 * THE CELLS. Each is a copy driven at a path whose `import.meta.dirname/../../..` is the repo root
 * (depth 3 under the gitignored .testdata/), because both spellings derive REPO that way and a
 * copy at the wrong depth would grade path resolution instead of the thing under charge.
 *
 *   A  OLD spelling, unmodified, at this HEAD        -> expect oldThrew FALSE, exit 0, `cleared`
 *                                                       ...which is the defect: vacuously green.
 *   B  NEW spelling, unmodified, at this HEAD        -> expect oldThrew TRUE,  exit 0, `cleared`
 *   C  NEW spelling, PRE_REPAIR forced back to the   -> expect oldThrew FALSE, exit 1,
 *      newest rev (i.e. the OLD behaviour restored)     `charge 1 NOT CLEARED`
 *   D  NEW spelling, needle made non-separating      -> expect REFUSAL at a precondition gate
 *
 * C is the cell that matters: it reproduces the old defect inside the new spelling and requires
 * the new gate to catch what the old say() did not. A repair I cannot make fire is not a repair
 * (Round 356). D grades the derivation itself rather than its result.
 *
 * Every mutation anchor is asserted to occur exactly once before it is applied (Round 347).
 *
 * ROUND 422 §1 — this file carried the same defect it grades, one layer out. Its own OLD cell was
 * `git show HEAD:<graded file>`, and the cure it grades was committed in the same commit as the
 * grader, so from that commit onward OLD === NEW and the drive refuses. Cured below the
 * `the two spellings` banner: the OLD rev is now DERIVED from the defect token's own presence in
 * the graded file's rev history. See that comment for the full accounting.
 */
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const REPO = path.resolve(import.meta.dirname, '../../..');
const GRADED_REL = 'docs/research/round419-instruments/grade-the-417-repairs.mjs';
const GRADED_ABS = path.join(REPO, GRADED_REL);
// depth 3 under REPO, so `../../..` from here is REPO — the property both spellings depend on.
const CELLS = path.join(REPO, '.testdata', 'round421', 'cells');

const out = [];
const say = (s = '') => { out.push(s); console.log(s); };
const fails = [];
const gate = (name, ok, detail = '') => {
  say(`  [GATE] ${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? '  — ' + detail : ''}`);
  if (!ok) fails.push(name);
};
const preds = [];
const predict = (name, expected, actual) => {
  const landed = expected === actual;
  preds.push({ name, landed, expected, actual });
  say(`  [PRED] ${landed ? 'LANDED  ' : 'REFUTED '} ${name}  — expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
};

const git = (...a) => spawnSync('git', ['-C', REPO, ...a], { encoding: 'utf8', maxBuffer: 1 << 26 });

say('# Round 421 — grading the Round 420 §2 repair (charge 1\'s OLD cell)');
say('');
const HEAD = git('rev-parse', 'HEAD').stdout.trim();
say(`REPO: ${REPO}`);
say(`HEAD at open: ${HEAD}`);
say(`driven at: ${new Date().toISOString()}`);
say('');

// --- precondition: the depth-3 property the cells rely on --------------------
gate('CELLS is depth 3 under REPO, so ../../.. from a cell resolves to REPO',
  path.resolve(CELLS, '../../..') === REPO, `${path.resolve(CELLS, '../../..')} vs ${REPO}`);
const CHANGELOG = path.join(REPO, '.testdata', 'round419-sdk-changelog.md');
gate('the changelog fixture both spellings need is present', existsSync(CHANGELOG), CHANGELOG);

// --- the two spellings -------------------------------------------------------
// NEW = the working-tree file (the Round 421 repair). OLD = the newest committed spelling that
// still carries the defect — derived from the PROPERTY, not read off HEAD.
//
// ROUND 422 §1, TAKEN. This block used to open with
//     const OLD_SRC = git('show', `${HEAD}:${GRADED_REL}`).stdout;
// and `4adcc0bf` committed the Round 421 cure and THIS GRADER in the same commit. So from
// `4adcc0bf` onward `HEAD:<graded file>` IS the cured blob: OLD === NEW, the 2 x 2 collapses to a
// 1 x 1, and the "OLD and NEW differ" gate below refuses. My published `GATE: true` was therefore
// reproducible from NO revision of this repository — the drive happened with the cure still
// uncommitted in the working tree. That is precisely the mechanism this file exists to grade, one
// layer out: an old cell sourced from HEAD inverts the moment the cure lands. It fails loudly
// rather than vacuously (his distinction, and it is the right one), so the hazard is
// irreproducibility, not a false `cleared` — but a reader who re-drives it cannot tell my three
// reds from a real regression, which is bad enough.
//
// THE CURE is the one the graded file itself now uses, applied here: derive the rev from the
// defect's own PROPERTY. Take the graded file's rev history, pick the NEWEST rev whose blob
// carries the defect token, and refuse if no rev carries it (nothing to grade) or if the newest
// rev still carries it (the cure never landed). Reproducible from every rev at or after the cure.
//
// The token is keyed on the CALL shape, not on the variable name (Rounds 357/375).
const DEFECT_TOKEN = "const prevRev = spawnSync('git', ['-C', REPO, 'rev-parse', 'HEAD']";
const gradedHistory = git('log', '--format=%H', '--', GRADED_REL).stdout.trim().split('\n').filter(Boolean);
const gradedCarriers = gradedHistory.filter((r) => git('show', `${r}:${GRADED_REL}`).stdout.includes(DEFECT_TOKEN));
const PRE_CURE = gradedCarriers.length ? gradedCarriers[0] : null;
say(`  graded file's rev history (newest first): ${gradedHistory.map((r) => r.slice(0, 8)).join(', ') || '(none)'}`);
say(`  revs whose blob carries the defect token: ${gradedCarriers.map((r) => r.slice(0, 8)).join(', ') || '(none)'}`);
say(`  PRE_CURE (derived, the OLD cell's source): ${PRE_CURE ? PRE_CURE.slice(0, 8) : 'REFUSED (null)'}`);
gate('a rev of the graded file carries the defect token (there IS an old spelling to grade)',
  PRE_CURE !== null, `${gradedCarriers.length} of ${gradedHistory.length} revs carry it`);
gate('the NEWEST rev of the graded file does NOT carry it (the cure has landed and is committed)',
  gradedHistory.length > 0 && !gradedCarriers.includes(gradedHistory[0]),
  `newest=${gradedHistory[0]?.slice(0, 8) ?? '(none)'}`);
gate('the OLD cell is not sourced from HEAD (the Round 422 §1 defect, keyed on the value)',
  PRE_CURE !== null && PRE_CURE !== HEAD, `PRE_CURE=${PRE_CURE?.slice(0, 8)} HEAD=${HEAD.slice(0, 8)}`);
if (PRE_CURE === null) {
  say('');
  say('GATE: FALSE (no rev of the graded file carries the defect token — the OLD cell is unobtainable)');
  say('SUMMARY: REFUSED — cannot derive an OLD spelling by property, and will not fall back to HEAD');
  writeFileSync(path.join(import.meta.dirname, 'grade-the-420-repair.out'), out.join('\n') + '\n');
  process.exit(2);
}
const OLD_SRC = git('show', `${PRE_CURE}:${GRADED_REL}`).stdout;
const NEW_SRC = readFileSync(GRADED_ABS, 'utf8');
gate('the OLD spelling was extracted from the derived rev, non-empty', OLD_SRC.length > 0, `${OLD_SRC.length} bytes`);
gate('OLD and NEW differ (there is something to grade)', OLD_SRC !== NEW_SRC,
  `old ${OLD_SRC.length}B vs new ${NEW_SRC.length}B`);

// Asserted present in OLD and absent in NEW, both directions.
const nOld = OLD_SRC.split(DEFECT_TOKEN).length - 1;
const nNew = NEW_SRC.split(DEFECT_TOKEN).length - 1;
say(`  defect token "const prevRev = … rev-parse HEAD…":  OLD ${nOld}x · NEW ${nNew}x`);
gate('the defect token occurs exactly once in the OLD spelling', nOld === 1, `occurs=${nOld}`);
gate('the defect token occurs zero times in the NEW spelling', nNew === 0, `occurs=${nNew}`);

// --- reproduce his §2 measurement before grading my own cure ----------------
say('');
say('## 0. His §2 figure, reproduced under his own key');
say('');
// His claim: the graded-file history has 2 revs; the needle-carrying one is e2759907; `791acfb3`
// is a descendant carrying the SAME blob; HEAD is past the repair. Re-derived here, not quoted.
const SDK_REL = 'docs/research/round417-instruments/sdk-gap-0122-to-0135.mjs';
const sdkHistory = git('log', '--format=%H', '--', SDK_REL).stdout.trim().split('\n').filter(Boolean);
const NEEDLE = "fs.writeFileSync('.testdata/round417-sdk-segment.md'";
const sdkBlob = (r) => git('show', `${r}:${SDK_REL}`).stdout;
const sdkCarries = sdkHistory.filter((r) => sdkBlob(r).includes(NEEDLE));
say(`  rev history of the graded file: ${sdkHistory.map((r) => r.slice(0, 8)).join(', ')}`);
say(`  needle-carrying: ${sdkCarries.map((r) => r.slice(0, 8)).join(', ') || '(none)'}`);
predict('his "2 revs" for the graded file', 2, sdkHistory.length);
predict('his e2759907 is the derived pre-repair rev', 'e2759907', (sdkCarries[0] || '').slice(0, 8));
predict('his ee37abae is the newest rev and does not carry the needle', true,
  sdkHistory[0] ? sdkHistory[0].startsWith('ee37abae') && !sdkCarries.includes(sdkHistory[0]) : false);
const blobEq = (a, b) => git('rev-parse', `${a}:${SDK_REL}`).stdout.trim() === git('rev-parse', `${b}:${SDK_REL}`).stdout.trim();
predict('his "791acfb3 is a descendant carrying the same blob" as e2759907', true,
  blobEq('791acfb3', 'e2759907') && git('merge-base', '--is-ancestor', 'e2759907', '791acfb3').status === 0);
predict('HEAD is past the repair, so a HEAD-sourced old cell reads the REPAIRED blob', true,
  git('merge-base', '--is-ancestor', 'ee37abae', 'HEAD').status === 0 && !sdkCarries.includes(HEAD));

// --- drive the cells ---------------------------------------------------------
say('');
say('## 1. The four cells');
say('');
rmSync(CELLS, { recursive: true, force: true });
mkdirSync(CELLS, { recursive: true });

const mutate = (src, from, to, label) => {
  const occurs = src.split(from).length - 1;
  gate(`mutation anchor for ${label} occurs exactly once`, occurs === 1, `occurs=${occurs}`);
  return occurs === 1 ? src.split(from).join(to) : null;
};

// Cell C: restore the OLD derivation inside the NEW spelling.
const C_FROM = 'const PRE_REPAIR = carries.length ? carries[0] : null;';
const C_TO = 'const PRE_REPAIR = history[0]; // MUTANT: the old HEAD-ish behaviour restored';
// Cell D: make the needle non-separating — a token BOTH blobs carry, so it cannot pick a rev.
const D_FROM = `const DEFECT_NEEDLE = "fs.writeFileSync('.testdata/round417-sdk-segment.md'";`;
const D_TO = `const DEFECT_NEEDLE = "import fs from 'node:fs'"; // MUTANT: present in both blobs`;

const cells = [
  ['A  OLD spelling, unmodified', OLD_SRC],
  ['B  NEW spelling, unmodified', NEW_SRC],
  ['C  NEW spelling, PRE_REPAIR forced to the newest rev', mutate(NEW_SRC, C_FROM, C_TO, 'cell C')],
  ['D  NEW spelling, needle made non-separating', mutate(NEW_SRC, D_FROM, D_TO, 'cell D')],
];

const results = {};
for (const [label, src] of cells) {
  const key = label.trim()[0];
  if (src === null) { say(`  ${label}: SKIPPED — anchor did not occur exactly once`); results[key] = null; continue; }
  const file = path.join(CELLS, `cell-${key}.mjs`);
  writeFileSync(file, src);
  const r = spawnSync('node', [file], { cwd: CELLS, encoding: 'utf8', timeout: 180000 });
  const text = (r.stdout || '') + (r.stderr || '');
  const m = text.match(/threw ENOENT: (true|false)/);
  const verdict = (text.match(/^SUMMARY: (.*)$/m) || [, '(no SUMMARY)'])[1];
  const gateLine = (text.match(/^GATE: (.*)$/m) || [, '(no GATE line)'])[1];
  results[key] = {
    exit: r.status,
    oldThrew: m ? m[1] === 'true' : null,
    charge1Cleared: /charge 1 cleared/.test(verdict),
    refusedAtPrecondition: /c0:/.test(gateLine),
    verdict,
    gateLine: gateLine.slice(0, 120),
  };
  say(`  ${label}`);
  say(`      exit ${r.status} | oldThrew ${results[key].oldThrew} | charge-1 cleared: ${results[key].charge1Cleared}`);
  say(`      SUMMARY: ${verdict}`);
  if (!/^true$/.test(gateLine)) say(`      GATE: ${results[key].gateLine}`);
}

// --- the separation ----------------------------------------------------------
say('');
say('## 2. Does the key separate?');
say('');
const A = results.A, B = results.B, C = results.C, D = results.D;

// His table, cell 1: my unmodified Round 419 spelling at a HEAD past the repair.
predict('A: the OLD spelling reads a FALSE old cell at this HEAD (his finding)', false, A && A.oldThrew);
predict('A: …and still exits 0', 0, A && A.exit);
predict('A: …and still reports charge 1 cleared — vacuously green', true, A && A.charge1Cleared);

predict('B: the NEW spelling derives a pre-repair rev and reads a TRUE old cell', true, B && B.oldThrew);
predict('B: …and exits 0', 0, B && B.exit);
predict('B: …and reports charge 1 cleared, on a measured cell this time', true, B && B.charge1Cleared);

predict('C: restoring the old derivation makes the NEW spelling read a FALSE old cell', false, C && C.oldThrew);
predict('C: …and the gate catches it — exit 1', 1, C && C.exit);
predict('C: …and charge 1 is reported NOT CLEARED', false, C && C.charge1Cleared);

predict('D: a non-separating needle makes the NEW spelling refuse at a precondition', true, D && D.refusedAtPrecondition);
predict('D: …and exit 1', 1, D && D.exit);

// The discriminator, stated as the thing that was missing: A and C are the SAME underlying
// situation (a false old cell). The OLD spelling calls it `cleared`; the NEW one calls it a
// failure. If both agreed, the repair would be decoration.
gate('THE DISCRIMINATOR: the same false old cell is `cleared` under OLD and a FAILURE under NEW',
  A && C && A.oldThrew === false && C.oldThrew === false && A.charge1Cleared === true && C.charge1Cleared === false,
  A && C ? `A(cleared=${A.charge1Cleared}, exit ${A.exit}) vs C(cleared=${C.charge1Cleared}, exit ${C.exit})` : 'a cell did not run');
gate('the repaired spelling is not merely strict: unmutated, it still exits 0 with charge 1 cleared',
  B && B.exit === 0 && B.charge1Cleared === true, B ? `exit ${B.exit}` : 'B did not run');
gate('the derivation itself is load-bearing: cell D refuses rather than guessing a rev',
  D && D.exit === 1 && D.refusedAtPrecondition === true, D ? `exit ${D.exit}` : 'D did not run');

// --- hygiene -----------------------------------------------------------------
say('');
rmSync(CELLS, { recursive: true, force: true });
const porcelain = git('status', '--porcelain', '--', 'docs/research/round417-instruments', '.testdata').stdout.trim();
gate('no cell leaked into a tracked path', porcelain === '', porcelain.slice(0, 200) || '(clean)');

say('');
say('='.repeat(78));
const refuted = preds.filter((p) => !p.landed);
say(`GATE: ${fails.length === 0 ? 'true' : 'FALSE (' + fails.join('; ') + ')'}`);
say(`PREDICTIONS: ${preds.length - refuted.length} landed, ${refuted.length} refuted`);
refuted.forEach((p) => say(`  REFUTED: ${p.name} — expected ${JSON.stringify(p.expected)}, got ${JSON.stringify(p.actual)}`));
say(`SUMMARY: the Round 420 §2 charge ${A && A.oldThrew === false && A.charge1Cleared ? 'REPRODUCES' : 'does NOT reproduce'}` +
  ` | the repair ${fails.length === 0 && refuted.length === 0 ? 'HOLDS and its key separates' : 'is NOT yet graded clean'}` +
  ` | OLD cell derived from ${PRE_CURE.slice(0, 8)}, not HEAD (${HEAD.slice(0, 8)})`);

writeFileSync(path.join(import.meta.dirname, 'grade-the-420-repair.out'), out.join('\n') + '\n');
if (fails.length || refuted.length) process.exit(1);
