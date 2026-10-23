/**
 * Round 438 — vacuity. Point each cure leg at a counterfactual and require the FIGURE to move.
 *
 * Every cell asserts its anchor occurs EXACTLY ONCE before changing it, asserts the swap landed,
 * and requires the crippled drive's red-leg set to differ from the baseline's and to include the
 * legs the cell is aimed at (347/389/422). A cell that merely confirms the edit landed grades
 * nothing.
 *
 * Crippling is done on a COPY in the module's own directory, never on the committed file — his 437
 * §4, and the copy is at the module's own depth because the module's relative imports do not resolve
 * from `os.tmpdir()` (421). The grader is pointed at the copy with `KLATCH_REFUSAL_MOD`.
 *
 * NOT covered, stated rather than found later:
 *   - the `extends` exclusion in `BINDING_NAME`. Removing it blanks the token `extends`, which no
 *     leg's verdict depends on: `{ span: class extends Object { m() { return src; } } }` stays
 *     ADMITTED either way, because the mention it is admitted for is `src` in the body. The guard is
 *     there for correctness of the masker's output text, and this round measures it nowhere.
 *   - `G1`, `G7`, `G8`, `G9`, `G10` read the tree, other instruments or the environment, so no
 *     crippling of the module can move them.
 */
import { readFileSync, writeFileSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..', '..', '..');
const MOD = join(REPO, 'docs/research/round430-instruments/refusal-convention.mjs');
const GRADER = 'docs/research/round438-instruments/grade-the-binding-position-cures.mjs';
const DEPTH = Number.parseInt(process.env.KLATCH_DRIVE_DEPTH ?? '0', 10) || 0;

const original = readFileSync(MOD, 'utf8');

const drive = (modPath) => {
  const env = { ...process.env, KLATCH_DRIVE_DEPTH: String(DEPTH + 1) };
  if (modPath === undefined) delete env.KLATCH_REFUSAL_MOD;
  else env.KLATCH_REFUSAL_MOD = modPath;
  let out;
  try {
    out = execFileSync('node', [GRADER, '--expect-dirty-module'],
      { cwd: REPO, encoding: 'utf8', maxBuffer: 1 << 28, env, timeout: 600_000 });
  } catch (e) { out = `${e.stdout ?? ''}${e.stderr ?? ''}`; }
  const gate = out.split('\n').find((l) => l.startsWith('GATE:')) ?? '(no GATE line)';
  const m = /RED: (.+?)(?:\s{2,}REFUSED:|$)/.exec(gate);
  return { gate: gate.includes('true'), red: m === null ? [] : m[1].trim().split(/,\s*/).sort() };
};

const CELLS = [
  {
    name: "FINDING 1's cure — the binding-name pass made a no-op",
    anchor: "    for (let j = from; j < to; j += 1) out[j] = ' ';",
    with: '    for (let j = from; j < to; j += 1) out[j] = out[j];',
    expect: ['G2', 'G3'],
  },
  {
    name: "FINDING 2's cure, the `;` half — a semicolon no longer re-arms the colon-free leg",
    anchor: "    if (c === ';') { top.headTried = false; continue; }",
    with: "    if (c === ';') { continue; }",
    // First drive expected `G4` and NOTHING MOVED: every row in his table is method-headed, and
    // those are re-armed by the reset-after-a-successful-head. `G11` was built for this cell — a
    // class FIELD is the shape only `;` can reach — rather than leaving a cure no leg grades.
    expect: ['G11'],
  },
  {
    name: "FINDING 2's cure, the undelimited half — a successful method head no longer re-arms it",
    anchor: '    // member head that masked successfully re-arms the leg for the next one.\n'
      + '    top.headTried = false;',
    with: '    // member head that masked successfully re-arms the leg for the next one.\n',
    expect: ['G4', 'G5'],
  },
];

const lines = [];
const say = (s) => { lines.push(s); console.log(s); };

const base = drive(undefined);
say(`baseline                   GATE ${base.gate}  red [${base.red.join(', ')}]`);
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
  const copy = join(dirname(MOD), `.cripple-${process.pid}-${CELLS.indexOf(c)}.mjs`);
  writeFileSync(copy, crippled);
  const landed = readFileSync(copy, 'utf8') === crippled && crippled !== original;
  const r = drive(copy);
  rmSync(copy, { force: true });
  const untouched = readFileSync(MOD, 'utf8') === original;
  const moved = r.gate !== base.gate || JSON.stringify(r.red) !== JSON.stringify(base.red);
  const covers = c.expect.every((id) => r.red.includes(id));
  const ok = landed && untouched && moved && covers;
  if (!ok) allOk = false;
  say(`CELL ${c.name}`);
  say(`  swap landed ${landed} · committed module untouched ${untouched} · figure MOVED ${moved}`);
  say(`  crippled GATE ${r.gate}  red [${r.red.join(', ')}]  · expected to include [${c.expect.join(', ')}]: ${covers}`);
  say(`  ${ok ? 'ok' : 'FAIL'}`);
}

say('');
say(`VACUITY: ${allOk ? 'every cell moved its figure' : 'AT LEAST ONE CELL DID NOT'}`);
say(`  committed module byte-identical at exit: ${readFileSync(MOD, 'utf8') === original}`);
writeFileSync(join(HERE, 'vacuity-cripple-and-regrade.out'), `${lines.join('\n')}\n`);
