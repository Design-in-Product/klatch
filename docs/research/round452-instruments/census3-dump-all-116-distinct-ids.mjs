/**
 * Round 452 — CENSUS pass 3. Pass 2's confusion matrix was keyed on 13 rows of 1045 because my
 * hand table guessed at prose words instead of reading the corpus: 15 of the 16 ids the candidates
 * disagree about were unclassified, and 16 of the 18 prose words I typed occur zero times. A
 * matrix over 13 rows is not a grade.
 *
 * 1045 rows reduce to 116 distinct id spellings. That is small enough to read ALL of, so this pass
 * dumps every one with its row count and one real line, and the hand reading in the instrument
 * that follows is keyed on the dump rather than on what I expected to find (415 — a hand-typed KP
 * is not a slice; 380 — for a small population the hand reading is primary).
 */
import { execFileSync } from 'node:child_process';
import { LEGACY_ROW_TOKENS } from '../lib/verdict.mjs';

const git = (args) => execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
const PRE_ROUND_REV = '255d9180a98a1c3d487a31ae21d79752a9c7a65e';
const SELF_DIR = 'docs/research/round452-instruments/';
const LEGACY_INLINE = /^ *([A-Za-z][A-Za-z0-9_]*) +([A-Za-z0-9_.:-]+)(?: +(.*))?$/;

const outs = git(['ls-tree', '-r', '--name-only', PRE_ROUND_REV])
  .split('\n').filter((n) => n.endsWith('.out') && !n.startsWith(SELF_DIR));

const byId = new Map();
for (const p of outs) {
  const text = git(['cat-file', 'blob', `${PRE_ROUND_REV}:${p}`]);
  for (const line of text.split('\n')) {
    const m = line.match(LEGACY_INLINE);
    if (m === null) continue;
    if (LEGACY_ROW_TOKENS[m[1]] === undefined) continue;
    if (!byId.has(m[2])) byId.set(m[2], { n: 0, line });
    byId.get(m[2]).n += 1;
  }
}

const sorted = [...byId.entries()].sort((a, b) => b[1].n - a[1].n);
console.log(`${sorted.length} distinct id spellings over ${[...byId.values()].reduce((s, v) => s + v.n, 0)} rows`);
for (const [id, { n, line }] of sorted) {
  console.log(`${String(n).padStart(4)}  ${JSON.stringify(id).padEnd(46)} ${JSON.stringify(line.slice(0, 84))}`);
}
