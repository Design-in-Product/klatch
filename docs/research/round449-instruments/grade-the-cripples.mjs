/**
 * Round 449 — vacuity. Does each declared cripple move its OWN leg, and only its own?
 *
 * A clean-vs-clean row runs FIRST, so run-to-run variation cannot be credited to a cripple
 * (Daedalus's Round 448 §5, and my own Round 447, where three names in my registry moved nothing
 * and the recording filed as a crippled control was not one).
 *
 * Grades on the VERDICT MAP — the per-leg token read off each run's own verdict line — rather than
 * on a line diff, because a line diff moves for every figure the cripple changes and cannot tell
 * "this leg's verdict inverted" from "a number in its detail is different".
 */
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { readVerdict } from '../lib/verdict.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const SUBJECT = join(HERE, 'resolve-the-variable-write-targets.mjs');

const run = (env) => {
  try {
    return execFileSync('node', [SUBJECT], {
      encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, ...env },
    });
  } catch (e) { return `${e.stdout ?? ''}\nDIED: ${e.status}\n${e.stderr ?? ''}`; }
};

/** The per-leg verdict map, derived from the verdict line's own lists — never from a row spelling.
 *  Round 449 `W10` measured that the two readers which DO read rows disagree with the verdict line
 *  on 23 and 10 of 43 committed recordings respectively, so reading rows here would be building on
 *  the thing that round found broken. */
const mapOf = (text) => {
  const v = readVerdict(text);
  if (v.ok !== true) return { refusal: v.refusal };
  const m = {};
  for (const id of v.verdict.red) m[id] = 'RED';
  for (const id of v.verdict.refused) m[id] = 'REF';
  return { legs: v.verdict.legs, map: m, token: text.match(/VERDICT\/1 (\S+)/)[1] };
};

const CELLS = [
  { env: {}, label: 'CONTROL clean vs clean#2', expect: null },
  {
    env: { KLATCH_R449_FALLTHROUGH: '1' },
    label: 'KLATCH_R449_FALLTHROUGH',
    expect: ['W2'],
    why: 'drop an UNMODELLED site instead of naming it — the bucket sum must stop matching the '
      + 'independently recomputed blind token count',
  },
  {
    env: { KLATCH_R449_NOVAR: '1' },
    label: 'KLATCH_R449_NOVAR',
    expect: ['W1', 'W4'],
    why: 'disable identifier resolution — the KP row that resolves through a variable must fail, '
      + 'AND the old resolver\'s tracked set must stop being a subset of mine. Two legs, declared '
      + 'as two: a cripple that moves a SET is honest; claiming single-leg isolation it does not '
      + 'have is not',
  },
  {
    env: { KLATCH_R449_TOKENONLY: '1' },
    label: 'KLATCH_R449_TOKENONLY',
    expect: ['W5'],
    why: 'empty the other-write-token list — a census that scans no other mechanism cannot tell a '
      + 'narrow result from an unscanned one',
  },
  {
    env: { KLATCH_R449_NOSUCHHOOK: '1' },
    label: 'an INERT name nothing implements',
    expect: ['W9'],
    why: 'W9 must redden by name rather than printing an unimplemented cripple as active',
  },
];

const clean = mapOf(run({}));
const clean2 = mapOf(run({}));
const controlDiff = JSON.stringify(clean) === JSON.stringify(clean2);
console.log(`CONTROL  clean vs clean#2 verdict maps identical: ${controlDiff}`);
console.log(`         clean: ${JSON.stringify(clean)}`);
if (!controlDiff) console.log(`         clean#2: ${JSON.stringify(clean2)}`);
console.log('');

let allGood = controlDiff;
for (const c of CELLS.slice(1)) {
  const got = mapOf(run(c.env));
  if (got.refusal !== undefined) {
    console.log(`DEAD  ${c.label} → the run published no verdict line (${got.refusal}) — a cripple `
      + 'that kills the instrument demonstrates nothing');
    allGood = false;
    continue;
  }
  const moved = Object.keys(got.map).filter((id) => clean.map[id] !== got.map[id]).sort();
  const unmoved = Object.keys(clean.map).filter((id) => got.map[id] !== clean.map[id]);
  const exact = JSON.stringify(moved) === JSON.stringify([...c.expect].sort());
  // The leg count must not move either: a cripple that changes how many legs RUN is changing the
  // instrument's shape, not one leg's verdict.
  const sameShape = got.legs === clean.legs;
  if (!exact || !sameShape) allGood = false;
  console.log(`${exact && sameShape ? 'GOOD' : 'BAD '}  ${c.label}`);
  console.log(`        declared ${JSON.stringify(c.expect)} · moved ${JSON.stringify(moved)} `
    + `· legs ${clean.legs} → ${got.legs} · also-unmoved-from-clean ${JSON.stringify(unmoved)}`);
  console.log(`        why: ${c.why}`);
}
console.log('');
console.log(`ALL CRIPPLES MOVE EXACTLY THEIR DECLARED LEGS, WITH A CLEAN CONTROL: ${allGood}`);
