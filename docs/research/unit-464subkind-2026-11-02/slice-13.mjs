#!/usr/bin/env node
// slice-13 — print, for each of the 13 rows of Daedalus's HAND-READ-13.tsv, a window of the
// PINNED source around the registered line, so the hand read below it is done off a recorded
// slice and not off the worktree or off his `figure`/`why` columns.
//
// [[feedback_a_hand_typed_reader_is_not_a_slice]] — the row list itself is sliced from his TSV.
// [[feedback_a_hand_typed_kp_is_not_a_slice]]

import { execFileSync } from 'node:child_process';

const PIN = 'de422c75';
const TSV = 'docs/research/unit-464reach-2026-11-02/HAND-READ-13.tsv';
const WIN = Number(process.env.WIN ?? 14);

const git = (args) => {
  try {
    return execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  } catch {
    return null;
  }
};

const tsv = git(['show', `${PIN}:${TSV}`]);
if (tsv === null) {
  console.error(`UNRUNNABLE: cannot read ${TSV} at ${PIN}`);
  process.exit(2);
}

const lines = tsv.split('\n');
const headerIdx = lines.findIndex((l) => l.startsWith('file\tline\tid\t'));
if (headerIdx < 0) {
  console.error('UNRUNNABLE: no header row beginning "file\\tline\\tid\\t" in his TSV');
  process.exit(2);
}
const cols = lines[headerIdx].split('\t');
const rows = lines
  .slice(headerIdx + 1)
  .filter((l) => l.trim() !== '' && !l.startsWith('#'))
  .map((l) => Object.fromEntries(l.split('\t').map((v, i) => [cols[i] ?? `c${i}`, v])));

console.log(`sliced ${rows.length} row(s) from ${TSV} at ${PIN}; columns: ${cols.join(',')}`);
console.log('');

for (const r of rows) {
  const path = `docs/research/${r.file}`;
  const src = git(['show', `${PIN}:${path}`]);
  console.log('='.repeat(100));
  console.log(`ROW  ${r.file}:${r.line}  id=${r.id}  HIS-subkind5=${r.subkind5}  HIS-reach=${r.reach}`);
  console.log(`     HIS-figure: ${r.figure}`);
  if (r.states && r.states !== '-') console.log(`     HIS-states: ${r.states}`);
  console.log('='.repeat(100));
  if (src === null) {
    console.log(`  !! UNREADABLE at ${PIN}`);
    continue;
  }
  const all = src.split('\n');
  const n = Number(r.line);
  const lo = Math.max(1, n - WIN);
  const hi = Math.min(all.length, n + 4);
  for (let i = lo; i <= hi; i++) {
    console.log(`${String(i).padStart(4)}${i === n ? ' >>' : '   '} ${all[i - 1]}`);
  }
  console.log('');
}
