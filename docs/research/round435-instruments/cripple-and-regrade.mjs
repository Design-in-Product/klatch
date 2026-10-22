/**
 * Vacuity check for this round's own legs (414): a leg you cannot point at a counterfactual cannot
 * be graded for vacuity. Each cell below swaps a CRIPPLED copy of the cured module over the live
 * one, re-drives this round's grader, and records which legs redden. The swap is asserted to have
 * landed and the restore asserted byte-identical, and each cell asserts the crippling TARGET was
 * present exactly once before it was changed (347/389/422).
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..', '..', '..');
const MOD = join(REPO, 'docs/research/round430-instruments/refusal-convention.mjs');
const GRADER = 'docs/research/round435-instruments/grade-his-cure-and-oracle-the-matrix.mjs';

const sha = (s) => createHash('sha256').update(s).digest('hex').slice(0, 16);
const orig = readFileSync(MOD, 'utf8');
const origSha = sha(orig);

const drive = () => {
  try {
    return execFileSync('node', [GRADER], { cwd: REPO, encoding: 'utf8', maxBuffer: 1 << 28 });
  } catch (e) { return String(e.stdout ?? '') + String(e.stderr ?? ''); }
};
const redLegs = (t) => {
  const g = t.match(/^GATE: (\w+)[^\n]*?(?:— FALSE: (.+))?$/m);
  if (g === null) return null;
  return { gate: g[1], red: (g[2] ?? '').split(',').map((s) => s.trim()).filter(Boolean) };
};

const CELLS = [
  {
    id: 'C1 — maskKeyPositions made a NO-OP (the §1 cure removed entirely)',
    anchor: 'const out = maskedValue.split(\'\');',
    replace: 'const out = maskedValue.split(\'\'); return out.join(\'\');',
    expectRed: ['G3', 'G8'],
    why: 'G3\'s known positive `{ src: 1 }` must stop being blanked, and G8\'s fire count must go '
      + 'to 0 — so both legs are reading the live cure and not a constant',
  },
  {
    id: 'C2 — the free-identifier guard loosened to allow a preceding dot',
    anchor: '(^|[^.\\\\w$])${p}(?![\\\\w$])',
    replace: '(^|[^\\\\w$])${p}(?![\\\\w$])',
    expectRed: ['G4', 'G5', 'G9'],
    why: 'G4 asserts the spread is MISSED; loosening the guard makes it seen, so G4 must redden, '
      + 'and with it G5 (whose cell is that signature) and G9 (whose one disagreement it is)',
  },
];

const baseline = redLegs(drive());
const rows = [];
for (const c of CELLS) {
  const occurrences = orig.split(c.anchor).length - 1;
  let out = null;
  let swapLanded = null;
  try {
    if (occurrences === 1) {
      const crippled = orig.replace(c.anchor, c.replace);
      writeFileSync(MOD, crippled);
      swapLanded = sha(readFileSync(MOD, 'utf8')) !== origSha;
      out = redLegs(drive());
    }
  } finally {
    writeFileSync(MOD, orig);
  }
  const restored = sha(readFileSync(MOD, 'utf8')) === origSha;
  const red = out?.red ?? [];
  rows.push({
    ...c, occurrences, swapLanded, restored, out,
    // The figure must MOVE, not just the edit land (347/389/422).
    moved: out !== null && JSON.stringify(red) !== JSON.stringify(baseline?.red ?? []),
    ok: occurrences === 1 && swapLanded === true && restored === true && out !== null
      && c.expectRed.every((l) => red.includes(l)),
  });
}

console.log('Round 435 — vacuity check: do this round\'s legs read the live cure?');
console.log('');
console.log(`baseline at HEAD: GATE ${baseline?.gate} · red ${JSON.stringify(baseline?.red ?? [])}`);
console.log('');
for (const r of rows) {
  console.log(`${r.ok ? 'ok  ' : 'BAD '} ${r.id}`);
  console.log(`      anchor occurs exactly once: ${r.occurrences === 1} (${r.occurrences}) · swap `
    + `landed ${r.swapLanded} · restored byte-identical ${r.restored}`);
  console.log(`      crippled GATE ${r.out?.gate} · red ${JSON.stringify(r.out?.red ?? [])} · `
    + `expected to include ${JSON.stringify(r.expectRed)} · figure moved ${r.moved}`);
  console.log(`      why: ${r.why}`);
}
const allOk = rows.length === CELLS.length && rows.every((r) => r.ok)
  && baseline !== null && baseline.gate === 'true';
console.log('');
console.log(`VACUITY: ${allOk ? 'every cell reddened the legs it targets' : 'A CELL DID NOT'}`
  + ` (${rows.filter((r) => r.ok).length} of ${rows.length})`);
console.log(`  module restored byte-identical after every cell: ${rows.every((r) => r.restored)}`);
process.exitCode = allOk ? 0 : 1;
