#!/usr/bin/env node
/**
 * Round 419 — grade the two repairs Round 418 §5 routed into my Round 417 instrument.
 *
 * Both charges were about properties the instrument CLAIMED and did not have, so the grading has
 * to be a 2 x 2 against the old spelling, not a re-read of the new one:
 *
 *   charge 1: throws ENOENT when driven from the directory it is committed in.
 *             -> drive it from BOTH cwds and require the same exit code and a SUMMARY in both.
 *   charge 2: the content-key control printed four booleans and gated nothing (Round 356).
 *             -> break one key on a COPY and require the instrument to refuse. A repair that
 *                cannot be made to fire is indistinguishable from the defect it replaced.
 *
 * The copy is written under .testdata/ and mutated there — never the committed instrument
 * (Round 332: drive a counterfactual in a scratch copy, not in the real tree).
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const REPO = path.resolve(import.meta.dirname, '../../..');
const INSTR = path.join(REPO, 'docs/research/round417-instruments/sdk-gap-0122-to-0135.mjs');
const CHANGELOG = path.join(REPO, '.testdata', 'round419-sdk-changelog.md');
const SCRATCH = path.join(REPO, '.testdata', 'round419-417-counterfactual');

const out = [];
const say = (s = '') => { out.push(s); console.log(s); };
const fails = [];
const gate = (name, ok, detail = '') => {
  say(`  [GATE] ${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? '  — ' + detail : ''}`);
  if (!ok) fails.push(name);
};

say('# Round 419 — grading the two Round 418 §5 repairs');
say('');
say(`rev stamp: ${spawnSync('git', ['-C', REPO, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).stdout.trim()}`);
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
gate('same exit code from both cwds', fromRoot.status === fromOwn.status, `${fromRoot.status} vs ${fromOwn.status}`);
gate('SUMMARY printed from the repo root', /^SUMMARY:/m.test(fromRoot.out));
gate('SUMMARY printed from its own directory', /^SUMMARY:/m.test(fromOwn.out));
gate('no ENOENT / stack trace from its own directory', !/ENOENT/.test(fromOwn.out));
// The pre-repair behaviour, asserted so the 2 x 2 has its OLD cell: the committed instrument at
// the parent commit of this repair must still throw from its own directory.
const prevRev = spawnSync('git', ['-C', REPO, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).stdout.trim();
const old = spawnSync('git', ['-C', REPO, 'show', `${prevRev}:docs/research/round417-instruments/sdk-gap-0122-to-0135.mjs`], { encoding: 'utf8', maxBuffer: 1 << 26 }).stdout;
mkdirSync(SCRATCH, { recursive: true });
if (old && old.length) {
  const oldFile = path.join(SCRATCH, 'old-sdk-gap.mjs');
  writeFileSync(oldFile, old);
  const oldFromOwn = run(oldFile, SCRATCH);
  const oldThrew = /ENOENT/.test(oldFromOwn.out);
  say(`  OLD spelling at ${prevRev.slice(0, 8)}, from its own directory: exit ${oldFromOwn.status} | threw ENOENT: ${oldThrew}`);
  say(`  (if this reads false, the repair is already committed at that rev and the OLD cell is unmeasurable from it)`);
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
  gate(`mutation anchor for the ${name} occurs exactly once`, occurs === 1, `occurs=${occurs}`);
  if (occurs !== 1) continue;
  const mutFile = path.join(SCRATCH, `mutant-${name.replace(/\W+/g, '-')}.mjs`);
  writeFileSync(mutFile, src.split(from).join(to));
  const r = run(mutFile, SCRATCH);
  const refused = r.status === 1 && /VERDICT: REFUSED/.test(r.out) && !/^SUMMARY:/m.test(r.out);
  say(`  mutant [${name}]: exit ${r.status} | refused: ${/VERDICT: REFUSED/.test(r.out)} | SUMMARY suppressed: ${!/^SUMMARY:/m.test(r.out)}`);
  gate(`a broken ${name} makes the instrument refuse and suppresses the SUMMARY`, refused);
}

// And the unmutated instrument must still pass — a gate that reddens on everything grades nothing.
gate('the unmutated instrument still exits 0 with a SUMMARY',
  fromRoot.status === 0 && /^SUMMARY:/m.test(fromRoot.out), `exit ${fromRoot.status}`);

say('');
say('='.repeat(78));
say(`GATE: ${fails.length === 0 ? 'true' : 'FALSE (' + fails.join('; ') + ')'}`);
say(`SUMMARY: charge 1 ${fails.some((f) => /cwd|SUMMARY printed|ENOENT/.test(f)) ? 'NOT CLEARED' : 'cleared'} | ` +
  `charge 2 ${fails.some((f) => /refuse|anchor/.test(f)) ? 'NOT CLEARED' : 'cleared'} | ${fails.length} gate failure(s)`);

writeFileSync(path.join(import.meta.dirname, 'grade-the-417-repairs.out'), out.join('\n') + '\n');
if (fails.length) process.exit(1);
