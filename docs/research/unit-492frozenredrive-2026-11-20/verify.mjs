#!/usr/bin/env node
/**
 * unit-492frozenredrive — restraint + Session-Wrap verification. `node verify.mjs` from anywhere.
 *
 * Written in node rather than sh because `sh` is not a permitted invocation in this seat's fires
 * (measured this fire: the call was refused twice). Recorded so the next seat does not rediscover
 * it; see `topic_git_and_shell_invocation`.
 *
 * The marker token is BUILT from fragments and never spelled, because this file has a `.mjs`
 * extension and is therefore inside the gate's own EXTS set — a verifier that spelled the token it
 * hunts would add itself to the very 16-file disclosure list it is checking. That is the same
 * mechanism as reading (a) below, one layer out.
 */

import { execFileSync } from 'node:child_process';

const ROOT = execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim();
const git = (args) => {
  try {
    return execFileSync('git', args, { encoding: 'utf8', cwd: ROOT, maxBuffer: 1 << 28 });
  } catch (e) {
    return (e.stdout || '') + (e.stderr || '');
  }
};

const PREREG = '7340acf5';
const TOKEN = ['brace', 'slicer', 'deliberate'].join('-') + ':';
const GATE_EXTS = ['.ts', '.mts', '.js', '.mjs', '.cts', '.cjs', '.tsx'];
const UNIT = 'docs/research/unit-492frozenredrive-2026-11-20';

const say = (s = '') => console.log(s);
const addedWithToken = (pathspec) => {
  const args = ['diff', `${PREREG}^..HEAD`];
  if (pathspec) args.push('--', ...pathspec);
  return git(args)
    .split('\n')
    .filter((l) => l.startsWith('+') && l.includes(TOKEN));
};

say('=== R1: scripts/ and packages/ delta since the prereg parent ===');
const r1 = git(['diff', '--stat', `${PREREG}^..HEAD`, '--', 'scripts/', 'packages/']).trim();
say(r1 || '  (empty — scripts/ and packages/ untouched by this unit)');
say();

say('=== R1: every path this unit changed ===');
say(git(['diff', '--stat', `${PREREG}^..HEAD`]).trimEnd());
say();

say('=== working tree (uncommitted) ===');
say(git(['status', '--short']).trimEnd() || '  (clean)');
say();

say('=== R2: packages/ touched? (if empty, `npm test` is not claimed) ===');
say(git(['diff', '--stat', `${PREREG}^..HEAD`, '--', 'packages/']).trim() || '  (empty — not claimed)');
say();

say('=== R5: marker declarations added — three readings, none hand-adjusted ===');
const a = addedWithToken(null);
say(`  (a) literal on any added diff line:           ${a.length}`);
say('      The occurrences are PRE-REGISTRATION.md\'s own R5 sentence and every later QUOTATION of');
say('      it. A restraint phrased with the name of the thing it forbids is tripped by its own');
say('      phrasing — and then by every honest record of that trip. This count therefore RISES as');
say('      the defect is documented: it read 1 at the pre-reg commit and more once RESULTS §7');
say('      quoted the line and this verifier\'s own output was kept as an artefact.');
say('      NO figure is asserted in this narration on purpose. An earlier draft hardcoded "this');
say('      reads 1"; the next commit made that false. A reader that states its own expected value');
say('      as a literal is a frozen figure, which is the defect class this corpus keeps finding.');
say('      Recorded, never re-keyed to 0 by hand. Reading (b) is the load-bearing one.');
for (const l of a) say(`        ${l.slice(0, 140)}`);
const b = addedWithToken(GATE_EXTS.map((e) => `*${e}`));
say(`  (b) added lines in files the gate SCANS:      ${b.length}`);
say(`      This is the reading R5 MEANT. EXTS = {${GATE_EXTS.join(',')}}; .md and .sh are never`);
say('      read, so prose and shell cannot add a false member to the 16-file disclosure list.');
for (const l of b) say(`        ${l.slice(0, 120)}`);
const instr = git(['ls-files', `${UNIT}/`])
  .split('\n')
  .filter((f) => GATE_EXTS.some((e) => f.endsWith(e)));
const carrying = instr.filter((f) => git(['show', `HEAD:${f}`]).includes(TOKEN));
say(`  (c) this unit's gate-visible files: ${instr.length} tracked, ${carrying.length} carrying the token`);
for (const f of carrying) say(`        ${f}`);
say();

say('=== deliverables present ===');
say(git(['ls-files', `${UNIT}/`]).trimEnd() || '  (none tracked yet)');
say();

say('=== commits on origin/main ===');
say(git(['log', 'origin/main', '--oneline', '-6']).trimEnd());
