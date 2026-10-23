/**
 * Round 436 — vacuity. Point each key leg at a counterfactual and require the FIGURE to move.
 *
 * Every cell asserts its anchor occurs EXACTLY ONCE before changing it, asserts the swap landed,
 * asserts the restore is byte-identical, and requires the crippled drive's GATE and red-leg set to
 * differ from the baseline's (347/389/422). A cell that merely confirms the edit landed grades
 * nothing — the gate is on the figure.
 *
 * Not covered, and said so rather than found later: `G1`, `G2`, `G9`, `G10`, `G11` and `G12` read
 * recordings, slices, other instruments' output or the git tree, so no crippling of
 * `refusal-convention.mjs` can move them. Their vacuity is unmeasured this round — the same gap
 * Theseus's Round 435 §7 declared for his `G1/G2/G6/G7`.
 */
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..', '..', '..');
const MOD = join(REPO, 'docs/research/round430-instruments/refusal-convention.mjs');
const GRADER = 'docs/research/round436-instruments/grade-the-cures-against-a-runtime-oracle.mjs';

const original = readFileSync(MOD, 'utf8');

/**
 * Round 438, his 437 §4. This file used to write the CRIPPLED text over the committed module and
 * restore it in a `finally`. He measured what that costs: four concurrent copies of this crippler
 * racing on one file, a `finally` that does not run on SIGKILL, and his own 120s child timeout
 * killing one of these mid-mutation — three ways for a crippling mutation to be left live in the
 * tree, after which the next instrument to run grades a crippled module and publishes it as a
 * defect in the module.
 *
 * The committed file is now never written. Each cell writes its crippled text to a COPY and points
 * the grader at it with `KLATCH_REFUSAL_MOD`, so a kill at any point leaves the tree untouched.
 * Children also carry `KLATCH_DRIVE_DEPTH` incremented, so the grader's population leg refuses
 * instead of recursing.
 *
 * The copy lives in the module's OWN directory under a dot-prefixed, pid-stamped name, not under
 * `os.tmpdir()`: the module imports `../../../scripts/lib/strip-source.mjs`, so a copy at any other
 * depth fails to resolve and every cell refuses (421 — measured again here, first drive). The copy
 * is untracked, so the worst a kill can leave is an untracked file rather than a mutated tracked
 * one, and each cell's name carries the pid so two concurrent cripplers cannot collide.
 */
const COPY_DIR = dirname(MOD);
const DEPTH = Number.parseInt(process.env.KLATCH_DRIVE_DEPTH ?? '0', 10) || 0;

const drive = (modPath) => {
  const env = { ...process.env, KLATCH_DRIVE_DEPTH: String(DEPTH + 1) };
  if (modPath === undefined) delete env.KLATCH_REFUSAL_MOD;
  else env.KLATCH_REFUSAL_MOD = modPath;
  let out;
  try {
    out = execFileSync('node', [GRADER],
      { cwd: REPO, encoding: 'utf8', maxBuffer: 1 << 28, env, timeout: 600_000 });
  } catch (e) { out = `${e.stdout ?? ''}${e.stderr ?? ''}`; }
  const gate = out.split('\n').find((l) => l.startsWith('GATE:')) ?? '(no GATE line)';
  // The GATE line can now carry a ` REFUSED: <ids>` suffix (Round 438), so the red list is read up
  // to that marker rather than to end-of-line — `(.+)$` would have swallowed the refused ids into
  // the red set, which is the one direction this reader must not get wrong.
  const m = /RED: (.+?)(?:\s{2,}REFUSED:|$)/.exec(gate);
  return { gate: gate.includes('true'), red: m === null ? [] : m[1].trim().split(/,\s*/).sort() };
};

const CELLS = [
  {
    name: 'the colon-free (method-head) leg made a no-op',
    // Anchor: the one line that blanks the method NAME's span.
    anchor: "    for (let j = i + from; j < i + to; j += 1) out[j] = ' ';",
    with: '    for (let j = i + from; j < i + to; j += 1) out[j] = out[j];',
    expect: ['G3', 'G4'],
  },
  {
    name: 'the dot model loosened so every dot is a property access (the spread blind spot, restored)',
    anchor: "  return text[i - 1] === '.' && text[i - 2] === '.';",
    with: '  return false;',
    expect: ['G5', 'G6'],
  },
  {
    name: 'the dot model loosened so no dot is a property access',
    anchor: "  if (text[i] !== '.') return true;",
    with: "  if (text[i] !== '\\u0000') return true;",
    expect: ['G5'],
  },
];

const lines = [];
const say = (s) => { lines.push(s); console.log(s); };

const base = drive(undefined);
say(`baseline at HEAD            GATE ${base.gate}  red [${base.red.join(', ')}]`);
let allOk = base.gate === true && base.red.length === 0;
if (!allOk) say('  !! baseline is not green — every cell below is uninterpretable');

for (const c of CELLS) {
  const occ = original.split(c.anchor).length - 1;
  if (occ !== 1) {
    say(`CELL ${c.name}\n  ABORTED: anchor occurs ${occ} time(s), not exactly once`);
    allOk = false;
    continue;
  }
  const crippled = original.split(c.anchor).join(c.with);
  const copy = join(COPY_DIR, `.cripple-${process.pid}-${CELLS.indexOf(c)}.mjs`);
  writeFileSync(copy, crippled);
  const landed = readFileSync(copy, 'utf8') === crippled && crippled !== original;
  const r = drive(copy);
  rmSync(copy, { force: true });
  // `restored` is now a statement about the COMMITTED file never having been written, which is a
  // stronger claim than restoring it afterwards and is checked the same way.
  const restored = readFileSync(MOD, 'utf8') === original;
  // The gate is that the FIGURE moved, not that the edit landed.
  const moved = r.gate !== base.gate || JSON.stringify(r.red) !== JSON.stringify(base.red);
  const covers = c.expect.every((id) => r.red.includes(id));
  const ok = landed && restored && moved && covers;
  if (!ok) allOk = false;
  say(`CELL ${c.name}`);
  say(`  swap landed ${landed} · restore byte-identical ${restored} · figure MOVED ${moved}`);
  say(`  crippled GATE ${r.gate}  red [${r.red.join(', ')}]  · expected to include [${c.expect.join(', ')}]: ${covers}`);
  say(`  ${ok ? 'ok' : 'FAIL'}`);
}

say('');
say(`VACUITY: ${allOk ? 'every cell moved its figure' : 'AT LEAST ONE CELL DID NOT'}`);
say(`  committed module never written (byte-identical at exit): ${readFileSync(MOD, 'utf8') === original}`);
say('  crippling done on dot-prefixed copies in the module\'s own directory, removed per cell');
writeFileSync(join(HERE, 'vacuity-cripple-and-regrade.out'), `${lines.join('\n')}\n`);
