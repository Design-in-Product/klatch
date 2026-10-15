#!/usr/bin/env node
/**
 * Round 396 §3 — does the re-keyed `D1` still have teeth?
 *
 * The counterfactuals drive the KEY, not the whole probe: `probe-round371` spawns child probes
 * that do not run in a detached worktree (its CONTROL drive there exits 1 with no headline), so a
 * tree-mutation harness would be measuring the plumbing. This reads the live tree exactly as the
 * probe does — same lib, same recording, same file set — and substitutes mutated TEXT for one
 * swept file in memory. Nothing on disk is touched and no worktree is created.
 *
 * One axis each, expectations written before the drive:
 *   CONTROL  live tree           → new key 0, old key 4 across 1 file
 *   CF-1     +11 blank lines     → new key 0 (the point), old key GROWS
 *   CF-2     one marker removed  → new key RED: 1 lost + the file's later members re-indexed
 *   CF-3     one marker added    → new key RED: 1 gained + later members re-indexed
 *   CF-4     two blocks SWAPPED  → new key RED if their marker sets differ (order is kept)
 */
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { commentBlocks, markersIn } from '../../../scripts/lib/characterisation-markers.mjs';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const ROWS_JSON = 'docs/research/round370-instruments/characterisation-sweep-rows.json';
const SUBJ = 'scripts/probe-round303-typecheck-grades-the-declaration-and-never-the-thing-it-describes.mts';

const recorded = JSON.parse(readFileSync(join(REPO, ROWS_JSON), 'utf8'));
const recordedFiles = new Set(recorded.map((r) => r.file));
const lineKey = (r) => `${r.file}:${r.line}:${r.markers.join('+')}`;
const indexKeys = (rows) => {
  const byFile = new Map();
  for (const r of rows) byFile.set(r.file, [...(byFile.get(r.file) ?? []), r]);
  const out = [];
  for (const [f, rs] of byFile) {
    [...rs].sort((a, b) => a.line - b.line).forEach((r, i) => out.push(`${f}:#${i}:${r.markers.join('+')}`));
  }
  return out;
};

const liveRows = (override) => {
  const rows = [];
  for (const f of [...recordedFiles].sort()) {
    if (!existsSync(join(REPO, f))) continue;
    const src = override && override.file === f ? override.text : readFileSync(join(REPO, f), 'utf8');
    for (const b of commentBlocks(src)) {
      const ms = markersIn(b.text);
      if (ms.length) rows.push({ file: f, line: b.line, markers: ms });
    }
  }
  return rows;
};

const diff = (hisKeys, nowKeys) => {
  const his = new Set(hisKeys);
  const now = new Set(nowKeys);
  return {
    lost: [...his].filter((k) => !now.has(k)),
    gained: [...now].filter((k) => !his.has(k)),
    sizes: [his.size, now.size],
  };
};

const report = (label, override, expected) => {
  const rows = liveRows(override);
  const nw = diff(indexKeys(recorded), indexKeys(rows));
  const old = diff(recorded.map(lineKey), rows.map(lineKey));
  const verdict = nw.lost.length === 0 && nw.gained.length === 0 ? 'D1 ok' : 'D1 RED';
  const match = verdict === expected ? 'AS PREDICTED' : `*** PREDICTED ${expected} ***`;
  console.log(
    `${label}\n  NEW key: ${verdict} — ${nw.sizes[0]} recorded / ${nw.sizes[1]} now, ` +
      `lost ${nw.lost.length} gained ${nw.gained.length}  [${match}]\n` +
      `  OLD key: ${old.lost.length + old.gained.length} member(s) differ, ` +
      `${old.sizes[0]} = ${old.sizes[1]} totals\n` +
      `  first moved under NEW: ${JSON.stringify([...nw.lost, ...nw.gained].slice(0, 3))}`,
  );
};

const pristine = readFileSync(join(REPO, SUBJ), 'utf8');
report('CONTROL — live tree, unmodified', null, 'D1 ok');

const lines = pristine.split('\n');
report('CF-1 — 11 blank lines inserted at line 1 (pure shift)', { file: SUBJ, text: [lines[0], ...Array(11).fill(''), ...lines.slice(1)].join('\n') }, 'D1 ok');

const n = pristine.split('rather than').length - 1;
console.log(`('rather than' occurs ${n}× in the subject; CF-2 mutates the first)`);
const i = pristine.indexOf('rather than');
report('CF-2 — first marker phrase "rather than" → "instead of"', { file: SUBJ, text: `${pristine.slice(0, i)}instead of${pristine.slice(i + 11)}` }, 'D1 RED');

const mid = Math.floor(lines.length / 2);
report('CF-3 — one marker comment block planted mid-file', { file: SUBJ, text: [...lines.slice(0, mid), '// Planted: this grades the index rather than the line.', ...lines.slice(mid)].join('\n') }, 'D1 RED');

/** CF-4 — order, isolated: swap the TEXT of the subject's first two marker-bearing blocks. */
const blocks = commentBlocks(pristine).filter((b) => markersIn(b.text).length);
const sets = blocks.slice(0, 2).map((b) => markersIn(b.text).join('+'));
console.log(`(the subject's first two marker blocks carry [${sets.join('] [')}])`);
const swapped = (() => {
  const [a, b] = blocks.slice(0, 2);
  if (!a || !b || a.text === b.text) return null;
  return pristine.replace(a.text, '\u0000A\u0000').replace(b.text, a.text).replace('\u0000A\u0000', b.text);
})();
if (swapped) report('CF-4 — the first two marker blocks swapped (order only)', { file: SUBJ, text: swapped }, sets[0] === sets[1] ? 'D1 ok' : 'D1 RED');
else console.log('CF-4 — not driveable: the two blocks are not distinct');

/**
 * CF-2 was WRONG as written, and the drive is what said so: a member is a comment BLOCK, not a
 * phrase. The subject carries `rather than` 27 times and its first marker block carries more than
 * one of them, so removing the first occurrence left that block's marker set unchanged — new key
 * 0, as the drive printed, against my written prediction of RED. CF-2b is the mutation I meant:
 * blank EVERY marker phrase in the first marker-bearing block, so the block leaves the population.
 * Expect: 1 member lost, and every later member of that file re-indexed by one.
 */
const first = blocks[0];
const blanked = first.text.replace(/rather than/g, 'instead of').replace(/silently/g, 'quietly');
const stillMarked = markersIn(blanked).length;
console.log(`\n(CF-2b: the first marker block's markers after blanking: ${stillMarked} — must be 0 to be the mutation I meant)`);
const subjMembers = liveRows(null).filter((r) => r.file === SUBJ).length;
console.log(`(the subject contributes ${subjMembers} member(s); losing the first re-indexes the other ${subjMembers - 1})`);
report('CF-2b — every marker phrase in the FIRST marker block blanked', { file: SUBJ, text: pristine.replace(first.text, blanked) }, 'D1 RED');
