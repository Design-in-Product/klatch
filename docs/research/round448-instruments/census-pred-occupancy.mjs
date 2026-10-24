/**
 * Round 448 — CENSUS, run before anything is built (409 — measure what the population already has).
 *
 * The question: across every committed recording in the repo that carries a `VERDICT/` line, how
 * often is the top token `ok` while one of the PREDICTION lists (`refuted`, `prefused`) is
 * non-empty? That is the cell my `P1` predicate cannot see, because `topToken(red, refused)` is
 * derived from the LEG lists and from nothing else.
 *
 * Population selected with `git ls-tree` at a STAMPED rev, not `ls-files` (420 — a population
 * keyed on the index is irreproducible from any rev). Read with the real `readVerdict`, not a
 * hand-rolled regex (411 — a hand-typed reader is not a slice).
 *
 * The instrument's own directory is EXCLUDED from the subject population and the exclusion is
 * COUNTED, not assumed (424 — an instrument does not census its own source; 434 — a
 * self-exclusion leg is vacuous before promotion, so the count is printed).
 */

import { execFileSync } from 'child_process';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

import { readVerdict, topToken } from '../lib/verdict.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..', '..', '..');
const git = (...a) => execFileSync('git', ['-C', REPO, ...a], {
  encoding: 'utf8', maxBuffer: 1 << 28, stdio: ['ignore', 'pipe', 'pipe'],
});

const REV = git('rev-parse', 'HEAD').trim();
const SELF_DIR = 'docs/research/round448-instruments/';

// `-z` so a NUL-safe split is possible and a filename with a newline cannot forge a row
// (403 — count with readdirSync/NUL, not a line-oriented grep).
const all = git('ls-tree', '-r', '--name-only', '-z', REV, 'docs/')
  .split('\0').filter((p) => p !== '');

const candidates = all.filter((p) => p.endsWith('.out'));
const excluded = candidates.filter((p) => p.startsWith(SELF_DIR));
const population = candidates.filter((p) => !p.startsWith(SELF_DIR));

const cells = new Map();
const bump = (k, p) => { if (!cells.has(k)) cells.set(k, []); cells.get(k).push(p); };

let readable = 0;
let refusedToRead = 0;
const refusalKinds = new Map();

for (const p of population) {
  const text = git('show', `${REV}:${p}`);
  const rv = readVerdict(text);
  if (rv.ok !== true) {
    refusedToRead += 1;
    refusalKinds.set(rv.refusal, (refusalKinds.get(rv.refusal) ?? 0) + 1);
    continue;
  }
  readable += 1;
  const v = rv.verdict;
  // The token is re-derived from the lists rather than trusted off the line, so a row cannot be
  // filed under a token its own lists contradict. (`readVerdict` already refuses that case; this
  // makes the census independent of that check rather than relying on it.)
  const tok = topToken(v.red, v.refused);
  const predDirty = v.refuted.length > 0 || v.prefused.length > 0;
  bump(`${tok} × preds-dirty=${predDirty}`, p);
}

console.log(`CENSUS of committed \`.out\` recordings under docs/ at REV ${REV.slice(0, 8)}`);
console.log(`  selected with ls-tree -z: ${candidates.length} \`.out\` file(s)`);
console.log(`  EXCLUDED (this instrument's own dir ${SELF_DIR}): ${excluded.length}`);
console.log(`  subject population: ${population.length}`);
console.log(`  carrying a verdict line readVerdict accepts: ${readable}`);
console.log(`  refused by readVerdict: ${refusedToRead} ${JSON.stringify(Object.fromEntries(refusalKinds))}`);
console.log('');
console.log('  cell occupancy (token re-derived from the lists):');
const keys = [...cells.keys()].sort();
for (const k of keys) {
  const ps = cells.get(k);
  console.log(`    ${k.padEnd(28)} ${String(ps.length).padStart(4)}`);
}
console.log('');
console.log('  THE CELL P1 CANNOT SEE — token `ok` with a non-empty prediction list:');
const blind = cells.get('ok × preds-dirty=true') ?? [];
console.log(`    members: ${blind.length}`);
for (const p of blind.slice(0, 12)) {
  const rv = readVerdict(git('show', `${REV}:${p}`));
  console.log(`      ${p}`);
  console.log(`        refuted=${JSON.stringify(rv.verdict.refuted)} prefused=${JSON.stringify(rv.verdict.prefused)}`);
}
if (blind.length > 12) console.log(`      … and ${blind.length - 12} more`);
console.log('');
console.log(`SUM CHECK: ${keys.map((k) => cells.get(k).length).reduce((a, b) => a + b, 0)} filed`
  + ` + ${refusedToRead} refused = ${readable + refusedToRead}, population ${population.length}`
  + ` — ${readable + refusedToRead === population.length ? 'OK' : 'MISMATCH'}`);
