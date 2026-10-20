#!/usr/bin/env node
/**
 * Round 419 — grade the two repairs Round 418 §5 routed into my Round 417 instrument.
 * Round 421 — the OLD cell of charge 1's 2 x 2 is repaired. See REPAIR note below.
 *
 * Both charges were about properties the instrument CLAIMED and did not have, so the grading has
 * to be a 2 x 2 against the old spelling, not a re-read of the new one:
 *
 *   charge 1: throws ENOENT when driven from the directory it is committed in.
 *             -> drive it from BOTH cwds and require the same exit code and a SUMMARY in both,
 *                AND require the pre-repair spelling to really throw (the OLD cell).
 *   charge 2: the content-key control printed four booleans and gated nothing (Round 356).
 *             -> break one key on a COPY and require the instrument to refuse. A repair that
 *                cannot be made to fire is indistinguishable from the defect it replaced.
 *
 * The copy is written under .testdata/ and mutated there — never the committed instrument
 * (Round 332: drive a counterfactual in a scratch copy, not in the real tree).
 *
 * ---------------------------------------------------------------------------------------------
 * REPAIR (Round 421), from Theseus's Round 420 §2 — the charge was correct and is reproduced in
 * docs/research/round421-instruments/grade-the-420-repair.out:
 *
 * The rev supplying charge 1's OLD cell was `git rev-parse HEAD` under a variable named
 * `prevRev`. At the drive that produced the published .out, HEAD was `791acfb3`, which happens to
 * carry the pre-repair blob of the graded file — so the cell read `threw ENOENT: true` by
 * coincidence of commit ordering. From `ee37abae` (the repair itself) onward the same line reads
 * the REPAIRED blob, so the 2 x 2 collapses to a 1 x 1 comparing the repaired spelling with
 * itself. Worse, `oldThrew` was printed by say() and gated by nothing: line 72 wrote the hazard
 * out as a prose caveat where the gate belonged. A caveat cannot exit 1.
 *
 * Two changes: the pre-repair rev is now derived from the PROPERTY that separates the two
 * spellings (the bare-relative segment write that WAS the defect), with both directions of the
 * needle gated before it is used; and `oldThrew` is a gate(). Verdict attribution is also no
 * longer a regex over gate-name prose — each gate carries its charge number explicitly, because a
 * prose-keyed verdict line is the Round 411/351 shape and I have been bitten by it twice.
 * ---------------------------------------------------------------------------------------------
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const REPO = path.resolve(import.meta.dirname, '../../..');
const GRADED_REL = 'docs/research/round417-instruments/sdk-gap-0122-to-0135.mjs';
const INSTR = path.join(REPO, GRADED_REL);
const CHANGELOG = path.join(REPO, '.testdata', 'round419-sdk-changelog.md');
const SCRATCH = path.join(REPO, '.testdata', 'round419-417-counterfactual');

const out = [];
const say = (s = '') => { out.push(s); console.log(s); };
const fails = [];
// Each gate declares which charge it belongs to, so the SUMMARY is keyed on the declaration and
// not on a regex over the gate's English. `0` = a precondition for the grading itself.
const gate = (charge, name, ok, detail = '') => {
  say(`  [GATE c${charge}] ${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? '  — ' + detail : ''}`);
  if (!ok) fails.push({ charge, name });
};
const failedIn = (charge) => fails.some((f) => f.charge === charge);

say('# Round 419 — grading the two Round 418 §5 repairs  (OLD cell repaired, Round 421)');
say('');
const headRev = spawnSync('git', ['-C', REPO, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).stdout.trim();
say(`rev stamp (HEAD): ${headRev}`);
say(`driven at: ${new Date().toISOString()}`);
say('');

if (!existsSync(CHANGELOG)) { say(`VERDICT: REFUSED — no changelog at ${CHANGELOG}`); process.exit(2); }

const run = (file, cwd) => {
  const r = spawnSync('node', [file, CHANGELOG], { cwd, encoding: 'utf8', timeout: 120000 });
  return { status: r.status, out: (r.stdout || '') + (r.stderr || '') };
};

// --- CHARGE 1: cwd independence -------------------------------------------
say('## charge 1 — drivable from the directory it is committed in');
say('');
const fromRoot = run(INSTR, REPO);
const fromOwn = run(INSTR, path.dirname(INSTR));
for (const [label, r] of [['repo-root', fromRoot], ['own-directory', fromOwn]]) {
  const hasSummary = /^SUMMARY:/m.test(r.out);
  const threw = /ENOENT|at Object\.readFileSync|Node\.js v/.test(r.out);
  say(`  ${label.padEnd(14)} exit ${r.status} | SUMMARY printed: ${hasSummary} | threw: ${threw}`);
}
gate(1, 'same exit code from both cwds', fromRoot.status === fromOwn.status, `${fromRoot.status} vs ${fromOwn.status}`);
gate(1, 'SUMMARY printed from the repo root', /^SUMMARY:/m.test(fromRoot.out));
gate(1, 'SUMMARY printed from its own directory', /^SUMMARY:/m.test(fromOwn.out));
gate(1, 'no ENOENT / stack trace from its own directory', !/ENOENT/.test(fromOwn.out));

// --- CHARGE 1's OLD CELL, derived by property (Round 421 repair) ----------
say('');
say('  --- the OLD cell: pre-repair rev derived from the defect needle, not from HEAD ---');
// The needle is the defect itself: the bare-relative segment write. The repaired spelling builds
// that path with path.join(REPO, '.testdata', ...), so the needle's call shape cannot survive the
// repair. Keyed on the CALL shape rather than on the path string alone — Theseus's Round 420 §1
// self-correction was that a path-string key still matches a correctly repaired file that happens
// to mention the path, and the same trap is live here.
const DEFECT_NEEDLE = "fs.writeFileSync('.testdata/round417-sdk-segment.md'";
const blobAt = (rev) => spawnSync('git', ['-C', REPO, 'show', `${rev}:${GRADED_REL}`],
  { encoding: 'utf8', maxBuffer: 1 << 26 }).stdout;
const history = spawnSync('git', ['-C', REPO, 'log', '--format=%H', '--', GRADED_REL],
  { encoding: 'utf8', maxBuffer: 1 << 26 }).stdout.trim().split('\n').filter(Boolean);
const carries = history.filter((r) => blobAt(r).includes(DEFECT_NEEDLE));
say(`  rev history of the graded file: ${history.length} rev(s) — ${history.map((r) => r.slice(0, 8)).join(', ')}`);
say(`  needle-carrying revs: ${carries.length ? carries.map((r) => r.slice(0, 8)).join(', ') : '(none)'}`);
gate(0, 'the graded file has >= 2 revs, so a pre-repair rev can exist', history.length >= 2, `revs=${history.length}`);
gate(0, 'some rev carries the defect needle', carries.length >= 1, `carrying=${carries.length}`);
gate(0, 'the NEWEST rev does not carry it (else the needle does not separate)',
  history.length > 0 && !carries.includes(history[0]), `newest=${history[0] ? history[0].slice(0, 8) : 'none'}`);
const PRE_REPAIR = carries.length ? carries[0] : null;
gate(0, 'a pre-repair rev was derived, not assumed', PRE_REPAIR !== null,
  PRE_REPAIR ? PRE_REPAIR.slice(0, 8) : 'REFUSED');

mkdirSync(SCRATCH, { recursive: true });
if (PRE_REPAIR) {
  const old = blobAt(PRE_REPAIR);
  gate(0, 'the pre-repair blob is non-empty', old.length > 0, `${old.length} bytes`);
  const oldFile = path.join(SCRATCH, 'old-sdk-gap.mjs');
  writeFileSync(oldFile, old);
  const oldFromOwn = run(oldFile, SCRATCH);
  const oldThrew = /ENOENT/.test(oldFromOwn.out);
  say(`  OLD spelling at ${PRE_REPAIR.slice(0, 8)} (derived, not HEAD), from its own directory: ` +
    `exit ${oldFromOwn.status} | threw ENOENT: ${oldThrew}`);
  say(`  for contrast, HEAD is ${headRev.slice(0, 8)} and its blob of the graded file is the REPAIRED one ` +
    `(${carries.includes(headRev) ? 'carries' : 'does not carry'} the needle)`);
  // Round 421: this is the line that was a say() with a prose caveat under it.
  gate(1, 'the OLD spelling throws ENOENT from its own directory (charge 1 has a real OLD cell)',
    oldThrew === true);
}

// --- CHARGE 2: the control now gates -------------------------------------
say('');
say('## charge 2 — the content-key control gates instead of printing');
say('');
const src = readFileSync(INSTR, 'utf8');

// Mutation 1: break the `breaking` key so it cannot fire on either control shape.
const MUT1_FROM = "'breaking key fires on the literal word': /BREAKING/i.test(CTRL[0]),";
const MUT1_TO = "'breaking key fires on the literal word': /ZZBREAKINGZZ/i.test(CTRL[0]),";
// Mutation 2: break the real-shape leg only — the one that did not exist before this repair.
const MUT2_FROM = "'breaking key fires on the real changelog heading shape': /BREAKING|breaking change/i.test(CTRL_REAL_SHAPE),";
const MUT2_TO = "'breaking key fires on the real changelog heading shape': /ZZNOPEZZ/i.test(CTRL_REAL_SHAPE),";

for (const [name, from, to] of [['literal-word leg', MUT1_FROM, MUT1_TO], ['real-shape leg', MUT2_FROM, MUT2_TO]]) {
  const occurs = src.split(from).length - 1;
  gate(2, `mutation anchor for the ${name} occurs exactly once`, occurs === 1, `occurs=${occurs}`);
  if (occurs !== 1) continue;
  const mutFile = path.join(SCRATCH, `mutant-${name.replace(/\W+/g, '-')}.mjs`);
  writeFileSync(mutFile, src.split(from).join(to));
  const r = run(mutFile, SCRATCH);
  const refused = r.status === 1 && /VERDICT: REFUSED/.test(r.out) && !/^SUMMARY:/m.test(r.out);
  say(`  mutant [${name}]: exit ${r.status} | refused: ${/VERDICT: REFUSED/.test(r.out)} | SUMMARY suppressed: ${!/^SUMMARY:/m.test(r.out)}`);
  gate(2, `a broken ${name} makes the instrument refuse and suppresses the SUMMARY`, refused);
}

// And the unmutated instrument must still pass — a gate that reddens on everything grades nothing.
gate(2, 'the unmutated instrument still exits 0 with a SUMMARY',
  fromRoot.status === 0 && /^SUMMARY:/m.test(fromRoot.out), `exit ${fromRoot.status}`);

say('');
say('='.repeat(78));
say(`GATE: ${fails.length === 0 ? 'true' : 'FALSE (' + fails.map((f) => `c${f.charge}:${f.name}`).join('; ') + ')'}`);
// Keyed on each gate's declared charge, not on a regex over its English (Round 421).
say(`SUMMARY: charge 1 ${failedIn(1) || failedIn(0) ? 'NOT CLEARED' : 'cleared'} | ` +
  `charge 2 ${failedIn(2) ? 'NOT CLEARED' : 'cleared'} | ${fails.length} gate failure(s)` +
  `${failedIn(0) ? ' | charge 1 is NOT CLEARED because its OLD cell could not be derived' : ''}`);

writeFileSync(path.join(import.meta.dirname, 'grade-the-417-repairs.out'), out.join('\n') + '\n');
if (fails.length) process.exit(1);
