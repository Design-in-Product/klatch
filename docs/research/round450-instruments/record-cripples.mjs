/**
 * Round 450 cripple grading — is the new self-test coverage real, or decorative?
 *
 * `selfTest() === true` is not evidence that it checks anything (356 — a printed self-test that
 * gates nothing). This grades it the only way that answers: MUTATE THE REAL PUBLISHED SOURCE and
 * require the mutation to be caught, by name.
 *
 * Each cripple copies `docs/research/lib/verdict.mjs` into a scratch tree **at the same depth**,
 * because the lib derives `REPO_ROOT` from `import.meta.url` with three `..` and a copy at the
 * wrong depth makes every cell refuse for a reason that has nothing to do with the mutation (425 —
 * a scratch copy at the wrong depth refuses every cell). Nothing outside the scratch directory is
 * written, and the real lib is never edited (403 — drive a counterfactual in a scratch tree, never
 * edit the live one).
 *
 * Three ways a cripple can be worthless, all three graded rather than assumed:
 *   - the anchor matches 0 or 2+ times → the mutation is not the one declared. ASSERTED per cripple.
 *   - the mutated run dies before printing → three identical dead runs read as "no effect"
 *     (436/447 §4). Told apart by requiring the failure MESSAGE to name the declared assertion.
 *   - the cripple is inert → the clean control and the crippled run agree. Reported as INERT.
 */

import { execFileSync } from 'child_process';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { writeRecording, TrackedTargetError } from '../lib/verdict.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..', '..', '..');
const LIB = join(REPO, 'docs', 'research', 'lib', 'verdict.mjs');
const SRC = readFileSync(LIB, 'utf8');

const out = [];
const say = (s) => { out.push(s); console.log(s); };

/**
 * The declared cripples. `find` must occur EXACTLY ONCE in the real source. `expect` is a substring
 * the resulting failure message must contain — so a run that dies for an unrelated reason is not
 * credited (and every cripple's name appears more than once in this file: in its row below and in
 * the grading output, so a name no hook reads cannot pass unnoticed — 449/`a declared cripple no
 * hook reads makes every crippled control clean`).
 */
const CRIPPLES = [
  {
    name: 'TRISTATE',
    why: 'delete the tri-state throw in renderRowSet — a non-true/false/null state then renders the '
      + 'literal token "undefined", the fall-through this file says it does not have',
    find: `      throw new Error(\`renderRowSet: \${it.id} has a \${key} of \${JSON.stringify(v)}, which is not \`
        + 'true/false/null — the token would render as "undefined"');`,
    expect: 'a non-tri-state ok rendered the token "undefined"',
  },
  {
    name: 'NEWLINE',
    why: 'delete the newline check — one leg\'s detail then publishes as two lines, the second a '
      + 'well-formed row for a leg that does not exist',
    find: `      throw new Error(\`renderRowSet: \${it.id}'s detail contains a newline: \${JSON.stringify(what)} — \`
        + 'one row would publish as two lines, and the second can be a well-formed row for a leg '
        + 'that does not exist');`,
    expect: 'a newline in a detail FORGED a second row',
  },
  {
    name: 'TRAILWS',
    why: 'delete the trailing-whitespace check — a detail then reads back different from the one '
      + 'that went in, which is the row-level version of the 443 defect',
    find: `    if (what !== what.trimEnd()) {`,
    replace: '    if (false) {',
    expect: 'a trailing space in a detail did not survive the round trip',
  },
  {
    name: 'WRONGKIND',
    why: 'collapse WRONG_KIND_TOKEN into UNKNOWN_ROW_TOKEN — a LEG row carrying LANDED is then '
      + 'refused for the wrong reason, which is the cost of two vocabularies going unmeasured',
    find: `      return refuseRow(otherKind === undefined ? 'UNKNOWN_ROW_TOKEN' : 'WRONG_KIND_TOKEN', line);`,
    replace: "      return refuseRow('UNKNOWN_ROW_TOKEN', line);",
    expect: 'WRONG_KIND_TOKEN refused as UNKNOWN_ROW_TOKEN',
  },
];

const SCRATCH = join(HERE, '.cripple-scratch');
rmSync(SCRATCH, { recursive: true, force: true });

/** Drive `selfTest()` against a given source text, at the lib's real depth. */
const driveSource = (tag, text) => {
  const dir = join(SCRATCH, tag, 'docs', 'research', 'lib');
  mkdirSync(dir, { recursive: true });
  const libPath = join(dir, 'verdict.mjs');
  writeFileSync(libPath, text);
  const runner = join(SCRATCH, tag, 'run.mjs');
  writeFileSync(runner, `import { selfTest } from ${JSON.stringify(libPath)};\n`
    + 'try { const r = selfTest(); console.log(`RESULT ${JSON.stringify(r)}`); }\n'
    + 'catch (e) { console.log(`THREW ${e.message}`); }\n');
  // Depth gate, per cell: the copy must resolve the same REPO_ROOT the real lib does, or the cell
  // is measuring the copy's location.
  const depthOk = join(dir, '..', '..', '..') === join(SCRATCH, tag);
  try {
    const stdout = execFileSync('node', [runner], {
      encoding: 'utf8', maxBuffer: 1 << 26, stdio: ['ignore', 'pipe', 'pipe'],
    });
    return { depthOk, text: stdout.trim() };
  } catch (e) {
    return { depthOk, text: `DIED ${String(e.stdout ?? '')}${String(e.stderr ?? '')}`.trim() };
  }
};

say('ROUND 450 CRIPPLE GRADING — subject docs/research/lib/verdict.mjs, mutated at the source');
say('');

// The clean control FIRST, so a run that fails on its own is identified before any cripple is
// credited with breaking it.
const clean = driveSource('clean', SRC);
const clean2 = driveSource('clean2', SRC);
say(`CONTROL  clean: ${clean.text.slice(0, 60)}  · depth ok: ${clean.depthOk}`);
say(`CONTROL  clean run twice identical: ${clean.text === clean2.text}`);
say('');

let allGood = clean.text === 'RESULT true' && clean.depthOk && clean.text === clean2.text;
if (!allGood) say('CONTROL IS NOT CLEAN — no cripple below can be credited. Stopping the claim here.');

for (const c of CRIPPLES) {
  // The anchor must match exactly once, or this is not the declared mutation (389 — a mutation
  // counterfactual needs its target asserted; anchor exactly once).
  const hits = SRC.split(c.find).length - 1;
  if (hits !== 1) {
    say(`DEAD  ${c.name.padEnd(10)} anchor occurs ${hits}× (needs exactly 1) — NOT GRADED, and this`
      + ' is a defect in the cripple, not evidence about the lib');
    allGood = false;
    continue;
  }
  const mutated = SRC.replace(c.find, c.replace ?? '');
  if (mutated === SRC) {
    say(`DEAD  ${c.name.padEnd(10)} the replacement left the source byte-identical — NOT GRADED`);
    allGood = false;
    continue;
  }
  const r = driveSource(c.name, mutated);
  const moved = r.text !== clean.text;
  const named = r.text.includes(c.expect);
  const died = r.text.startsWith('DIED');
  const good = r.depthOk && moved && named && !died;
  allGood = allGood && good;
  say(`${good ? 'GOOD' : 'BAD '}  ${c.name.padEnd(10)} moved: ${String(moved).padEnd(5)} names its `
    + `declared assertion: ${String(named).padEnd(5)} died: ${String(died).padEnd(5)} depth ok: ${r.depthOk}`);
  say(`      why: ${c.why}`);
  say(`      got: ${r.text.replace(/\n/g, ' ⏎ ').slice(0, 180)}`);
  if (!named) say(`      EXPECTED to contain: ${JSON.stringify(c.expect)}`);
  say('');
}

// A NOTE ON A CHECK THAT IS NOT HERE, because the first version of this file carried it and it
// reddened against a correct design.
//
// The standing lesson is "a declared cripple no hook reads makes every crippled control clean":
// assert each cripple's NAME occurs more than once in the file, so a name nothing dispatches on
// cannot sit there looking like coverage. That property belongs to an ENV-VAR architecture, where
// the subject must read the name for the cripple to do anything. Here the cripples are textual
// mutations and the name is only a label — what is load-bearing is the ANCHOR. So the name check
// reported all four as unread against four cripples that demonstrably fire, and the property it
// was standing in for is asserted per cripple above instead: the anchor occurs EXACTLY ONCE, and
// the mutation changes the source. Carrying it over unexamined would have been a false positive in
// my own grader (330 — a false positive in triage produces no work, and worse, hides the real one).
say(`anchors asserted exactly-once per cripple: ${CRIPPLES.length}/${CRIPPLES.length}`
  + ' · name-occurrence check deliberately absent (see the note in this file: wrong architecture)');

say('');
say(`ALL CRIPPLES CAUGHT BY NAME, WITH A CLEAN CONTROL: ${allGood}`);
rmSync(SCRATCH, { recursive: true, force: true });

const target = process.argv[2] ?? null;
if (target !== null) {
  try {
    writeRecording(join(HERE, target), `${out.join('\n')}\n`);
    console.log(`recorded → ${target}`);
  } catch (e) {
    if (!(e instanceof TrackedTargetError)) throw e;
    console.log(`REFUSED to re-stamp a committed recording: ${target}`);
    process.exitCode = 3;
  }
}
