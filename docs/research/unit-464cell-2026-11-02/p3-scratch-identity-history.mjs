#!/usr/bin/env node
// p3-scratch-identity-history — is `identity x history-keyed` an OCCUPIABLE cell?
//
// Daedalus's v1.2 cross-tab leaves it empty and he declines to claim empty means impossible. This
// script answers it by CONSTRUCTION rather than by argument: it builds the minimal leg of that
// exact shape in a SCRATCH GIT REPO under the OS temp dir — never in Klatch's own repo, so no
// index of any worktree is touched — and drives it twice.
// [[feedback_drive_a_counterfactual_in_a_scratch_git_repo]]
// [[feedback_dont_touch_the_index_while_the_sweep_drives]]
//
// THE SHAPE. C2b is `delta x history-keyed`: `atPin !== atRecency`, asserting the two DIFFER, with
// `atRecency` lifted by `git log -1 --format=%h -- <path>` (a recency SELECTOR). Negate the one
// operator and you get `atPin === atRecency` — "my pin is still the newest commit touching this
// path", the ordinary freshness assertion. That is axis A `identity` over an axis B `history-keyed`
// figure: the hazard cell, one keystroke from a row we already have.
//
// TWO ARMS, and the DELTA is the measurement — a single arm proves nothing, because two arms that
// are both dead read as "no effect".
// [[feedback_grade_a_cripple_as_a_delta_against_a_matched_no_cripple_drive]]
// [[feedback_identical_runs_read_as_no_effect_when_all_three_are_dead]]
//   arm A (control): read the leg, change nothing, read it again.
//   arm B (perturbed): read the leg, make ONE commit that touches the path and changes nothing the
//                      leg is about, read it again.
// Registered in PRE-REGISTRATION.md: arm A stays GREEN->GREEN; arm B goes GREEN->RED.

import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, appendFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

let red = 0;
let unrunnable = 0;
const check = (id, cond, msg) => {
  if (cond === true) console.log(`${id}  ok    ${msg}`);
  else { console.log(`${id}  RED   ${msg}`); red += 1; }
};
const refuse = (id, msg) => { console.log(`${id}  UNRUNNABLE  ${msg}`); unrunnable += 1; };

const g = (cwd, ...args) => {
  try {
    return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  } catch (e) {
    return { err: String(e.message).split('\n')[0] };
  }
};

// --------------------------------------------------------------------------- build the scratch repo
const root = mkdtempSync(join(tmpdir(), 'klatch-464cell-'));
console.log(`scratch repo: ${root}`);
const init = g(root, 'init', '--quiet', '-b', 'main');
if (init?.err) { refuse('GSCRATCH', `git init failed in the scratch dir: ${init.err}`); process.exit(2); }
g(root, 'config', 'user.email', 'theseus@example.invalid');
g(root, 'config', 'user.name', 'unit-464cell scratch');

const SUBJECT = 'subject.txt';
const OTHER = 'unrelated.txt';
writeFileSync(join(root, SUBJECT), 'the property the leg is really about: FOUR\n');
writeFileSync(join(root, OTHER), 'nothing to do with it\n');
g(root, 'add', '-A');
const c1 = g(root, 'commit', '--quiet', '-m', 'add the subject');
if (c1?.err) { refuse('GSCRATCH', `first commit failed: ${c1.err}`); process.exit(2); }
const PIN = g(root, 'log', '-1', '--format=%h');
check('GSCRATCH', typeof PIN === 'string' && /^[0-9a-f]{7,}$/.test(PIN),
  `scratch repo built with one commit; the leg's PIN is ${JSON.stringify(PIN)}`);

// --------------------------------------------------------------------------- THE LEG UNDER TEST
// `identity x history-keyed`: the pinned rev is asserted EQUAL to the newest commit touching the
// path. Axis A = identity (one state-vs-state comparison, asserting SAME). Axis B = history-keyed
// (one anchor is `git log -1 ... -- <path>`, a recency selector).
const theLeg = () => {
  const atPin = PIN;
  const atRecency = g(root, 'log', '-1', '--format=%h', '--', SUBJECT);
  if (typeof atRecency !== 'string' || atRecency === '') return { verdict: 'UNRUNNABLE', atPin, atRecency };
  return { verdict: atPin === atRecency ? 'GREEN' : 'RED', atPin, atRecency };
};

// And the row we already have, for contrast: C2b's shape, `!==` instead of `===`.
const c2bShape = () => {
  const atPin = PIN;
  const atRecency = g(root, 'log', '-1', '--format=%h', '--', SUBJECT);
  if (typeof atRecency !== 'string' || atRecency === '') return { verdict: 'UNRUNNABLE', atPin, atRecency };
  return { verdict: atPin !== atRecency ? 'GREEN' : 'RED', atPin, atRecency };
};

// --------------------------------------------------------------------------- arm A: the control
const a1 = theLeg();
const a1c = c2bShape();
// change nothing at all
const a2 = theLeg();
const a2c = c2bShape();
console.log(`\narm A (control — no commit):`);
console.log(`  identity x history-keyed : ${a1.verdict} -> ${a2.verdict}   (pin ${a1.atPin} vs recency ${a2.atRecency})`);
console.log(`  C2b's delta shape        : ${a1c.verdict} -> ${a2c.verdict}`);

// --------------------------------------------------------------------------- arm B: ONE commit that
// touches the path and changes NOTHING the leg is about.
const b1 = theLeg();
appendFileSync(join(root, SUBJECT), '# a trailing comment. The property above is still FOUR.\n');
g(root, 'add', '-A');
const cB = g(root, 'commit', '--quiet', '-m', 'touch the path without touching the property');
if (cB?.err) {
  refuse('GARMB', `the perturbing commit failed: ${cB.err} — arm B is undriven and P3 stays unmeasured`);
} else {
  const b2 = theLeg();
  const b2c = c2bShape();
  console.log(`\narm B (perturbed — ONE commit touching the path, property unchanged):`);
  console.log(`  identity x history-keyed : ${b1.verdict} -> ${b2.verdict}   (pin ${b1.atPin} vs recency ${b2.atRecency})`);
  console.log(`  C2b's delta shape        : ${a1c.verdict} -> ${b2c.verdict}`);

  // The TARGET of the perturbation is asserted present before the delta is read.
  // [[feedback_a_mutation_counterfactual_needs_its_target_asserted]]
  const newest = g(root, 'log', '-1', '--format=%h', '--', SUBJECT);
  check('GTARGET', typeof newest === 'string' && newest !== PIN,
    `the perturbation's target moved: the newest commit touching ${SUBJECT} is now ${newest}, was ${PIN}`);

  // THE DELTA, both arms, both shapes.
  check('GARMA', a1.verdict === 'GREEN' && a2.verdict === 'GREEN',
    `matched control: the identity x history-keyed leg reads ${a1.verdict} -> ${a2.verdict} with no commit (registered: GREEN -> GREEN)`);
  check('GARMB', b1.verdict === 'GREEN' && b2.verdict === 'RED',
    `perturbed: the identity x history-keyed leg reads ${b1.verdict} -> ${b2.verdict} after one commit that changes nothing it is about (registered: GREEN -> RED)`);
  check('GDELTAVSCTRL', a2.verdict !== b2.verdict,
    `the two arms DIFFER at the second read (${a2.verdict} vs ${b2.verdict}) — a single arm could not have told occupiable from dead`);
  check('GINVERSE', a1c.verdict === 'RED' && b2c.verdict === 'GREEN',
    `C2b's own delta shape runs OPPOSITE on the same two states (${a1c.verdict} -> ${b2c.verdict}): the cell is reached by negating ONE operator, and the two halves cannot both be green`);

  // The property the leg is SUPPOSED to be about is untouched — so the RED is a false one.
  const propAtPin = g(root, 'show', `${PIN}:${SUBJECT}`);
  const propNow = g(root, 'show', `HEAD:${SUBJECT}`);
  const fourAtPin = typeof propAtPin === 'string' && /FOUR/.test(propAtPin);
  const fourNow = typeof propNow === 'string' && /FOUR/.test(propNow);
  check('GFALSERED', fourAtPin && fourNow,
    `the property is FOUR at the pin and FOUR now (${fourAtPin}/${fourNow}) — so arm B's RED reports a change that did not happen. That is the hazard axis B's prescription predicts.`);
}

console.log(`\n=========================================================`);
console.log(`P3 scratch: RED ${red} · UNRUNNABLE ${unrunnable}`);
console.log(`VERDICT ${red === 0 && unrunnable === 0 ? 'GREEN' : red > 0 ? 'RED' : 'UNRUNNABLE'}`);
console.log(`scratch repo left at ${root} for inspection; it is outside the Klatch tree.`);
process.exit(red > 0 ? 1 : unrunnable > 0 ? 2 : 0);
