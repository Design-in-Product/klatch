#!/usr/bin/env node
// argv-census.mjs — unit-464sat, 2026-10-31 WORK fire (Theseus).
//
// GARGV. Before anything can be priced, each of the 8 scored cells needs a full checker
// argv, and it has to be a SLICE, not a retype. A hand-typed argv is not a slice: it would
// let me drive a DIFFERENT configuration from the one that produced the recording and then
// report the delta as the cure's price.
//
// Two slices, both rev-pinned at baseline.rev via `git show` / `git ls-tree`:
//
//   1. The 8 CELLS come from my own committed recording
//      unit-464reach-2026-10-31/drive2.out — its `P3ROW ok ` / `P3ROW REFUTES` lines ARE
//      the 8 rows of the §1 table Daedalus's §7 pointed at. The two `P3ROW REFUSED` lines
//      are deliberately NOT cells; they are the 2 of 10 that leg D found and `sectionFor`
//      or a zero denominator rejected.
//   2. The ARGV for each cell comes from a committed `.out` file's `# argv:` header. The
//      cwd a recording was driven from is its own directory — that is what makes relative
//      `--map=V21-MAP.md` resolve — so every candidate carries its cwd and the map path is
//      resolved against it before being keyed.
//
// A cell with 0 candidates REFUSES. A cell with more than 1 DISTINCT candidate REFUSES
// rather than my picking one, because picking would make the price keyed on my choice of
// configuration.

import { readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, posix } from 'node:path';

const REPO = '../../..';
const BASELINE_REV = readFileSync('baseline.rev', 'utf8').trim();
const CELL_SRC = 'docs/research/unit-464reach-2026-10-31/drive2.out';

const git = (...a) => {
  const r = spawnSync('git', ['-C', REPO, ...a], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    maxBuffer: 64 * 1024 * 1024,
  });
  return r.status === 0 ? r.stdout : null;
};

let REFUSALS = 0;
const refuse = (leg, why) => {
  console.log(`${leg} REFUSED — ${why}`);
  REFUSALS += 1;
};

// --- Slice 1: the 8 cells, off my own committed recording at the baseline rev.
const cellSrc = git('show', `${BASELINE_REV}:${CELL_SRC}`);
if (cellSrc === null) {
  refuse('GARGV', `git show ${BASELINE_REV}:${CELL_SRC} failed — the cell list is UNSLICEABLE`);
  process.exit(2);
}
const CELLS = [];
const CELL_REFUSED = [];
for (const l of cellSrc.split('\n')) {
  const m = l.match(/^P3ROW (ok |REFUTES|REFUSED) (\S+) \/ (\S+):/);
  if (m === null) continue;
  if (m[1] === 'REFUSED') CELL_REFUSED.push(`${m[2]}/${m[3]}`);
  else CELLS.push({ map: m[2], arm: m[3] });
}
// The count is ASSERTED against the same recording's own summary line, so a reader change
// that silently drops a row cannot pass as a smaller census.
const sumLine = cellSrc.split('\n').find((l) => l.startsWith('P3 ')) ?? '';
const declScored = Number((sumLine.match(/(\d+) rows-bearing map\(s\) scored/) ?? [])[1]);
if (!Number.isFinite(declScored) || declScored !== CELLS.length) {
  refuse(
    'GARGV',
    `sliced ${CELLS.length} scored cell(s) but ${CELL_SRC}'s own P3 line declares ` +
      `${JSON.stringify(sumLine.slice(0, 80))} — the slice disagrees with its source`,
  );
  process.exit(2);
}
console.log(
  `CELLS  ${CELLS.length} scored cell(s) sliced from ${CELL_SRC} at ${BASELINE_REV.slice(0, 8)} ` +
    `(its own P3 line declares ${declScored}); ${CELL_REFUSED.length} not a cell [${CELL_REFUSED.join(', ')}]`,
);

// --- Slice 2: every committed `# argv:` header under docs/research/, rev-pinned.
const tree = git('ls-tree', '-r', '--name-only', BASELINE_REV);
if (tree === null) {
  refuse('GARGV', 'git ls-tree failed — the argv population is UNSLICEABLE');
  process.exit(2);
}
const outs = tree
  .trim()
  .split('\n')
  .filter((f) => f.startsWith('docs/research/') && f.endsWith('.out'));

const candidates = new Map(); // key -> [{argv, cwd, from}]
let argvLines = 0;
let malformed = 0;
for (const f of outs) {
  const text = git('show', `${BASELINE_REV}:${f}`);
  if (text === null) {
    refuse('GARGV', `git show failed for ${f}`);
    continue;
  }
  for (const l of text.split('\n')) {
    const m = l.match(/^#\s*argv:\s*(.+)$/);
    if (m === null) continue;
    argvLines += 1;
    const argv = m[1].trim().split(/\s+/);
    // Keyed POSITIVELY: every token must be a `--flag=` form. A value containing a
    // whitespace character would split and silently produce a shorter argv, so a
    // non-conforming token disqualifies the whole line rather than being dropped.
    if (!argv.every((t) => /^--[a-z]+=/.test(t))) {
      malformed += 1;
      continue;
    }
    const cwd = dirname(f);
    const mapArg = argv.find((t) => t.startsWith('--map='));
    const armArgs = argv.filter((t) => t.startsWith('--arm='));
    if (mapArg === undefined || armArgs.length === 0) {
      malformed += 1;
      continue;
    }
    const mapResolved = posix.normalize(posix.join(cwd, mapArg.slice('--map='.length)));
    for (const a of armArgs) {
      const rest = a.slice('--arm='.length);
      const eq = rest.indexOf('=');
      const armName = eq === -1 ? rest : rest.slice(0, eq);
      const key = `${mapResolved}::${armName}`;
      if (!candidates.has(key)) candidates.set(key, []);
      candidates.get(key).push({ argv: argv.join(' '), cwd, from: f });
    }
  }
}
console.log(
  `ARGVPOP  ${outs.length} committed .out file(s) under docs/research/ at ${BASELINE_REV.slice(0, 8)} · ` +
    `${argvLines} '# argv:' line(s) found · ${malformed} rejected as malformed · ` +
    `${candidates.size} distinct (map,arm) key(s) covered`,
);

// --- Per cell: exactly one DISTINCT argv, or REFUSE.
const resolved = [];
for (const c of CELLS) {
  const key = `${c.map}::${c.arm}`;
  const cands = candidates.get(key) ?? [];
  const distinct = [...new Set(cands.map((x) => `${x.cwd}\u0000${x.argv}`))];
  if (distinct.length === 0) {
    console.log(`CELLARGV REFUSED ${key}: 0 committed '# argv:' line(s) name this (map,arm) pair`);
    resolved.push({ ...c, argv: null, why: 'no committed argv' });
    continue;
  }
  if (distinct.length > 1) {
    console.log(
      `CELLARGV REFUSED ${key}: ${distinct.length} DISTINCT argv candidate(s) ` +
        `from [${[...new Set(cands.map((x) => x.from))].join(', ')}] — not picking one`,
    );
    resolved.push({ ...c, argv: null, why: `${distinct.length} distinct candidates` });
    continue;
  }
  const [cwd, argv] = distinct[0].split('\u0000');
  console.log(
    `CELLARGV ok  ${key}: 1 distinct argv from ${cands.length} recording(s), cwd=${cwd}` +
      `  [${[...new Set(cands.map((x) => x.from))].length} source file(s)]`,
  );
  resolved.push({ ...c, argv: argv.split(' '), cwd, sources: [...new Set(cands.map((x) => x.from))] });
}

const haveArgv = resolved.filter((r) => r.argv !== null).length;
writeFileSync('cells.json', `${JSON.stringify({ baselineRev: BASELINE_REV, cells: resolved }, null, 2)}\n`);
console.log(
  `\nGARGV ${haveArgv === CELLS.length ? 'ok ' : 'PARTIAL'} ${haveArgv} of ${CELLS.length} scored cell(s) ` +
    `have exactly one sliced argv; ${CELLS.length - haveArgv} REFUSE and are UNMEASURED, not 0. ` +
    `Written to cells.json.`,
);
if (REFUSALS > 0) {
  console.log(`\nREFUSED/${REFUSALS} — the argv census itself refused; no saturation figure is published.`);
  process.exit(2);
}
