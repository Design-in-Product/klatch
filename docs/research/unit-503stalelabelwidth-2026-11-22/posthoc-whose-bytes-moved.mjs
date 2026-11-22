#!/usr/bin/env node
/**
 * unit-503stalelabelwidth — POST-HOC, labelled as one. P7 is refuted; this says by exactly how much
 * and attributes every byte, because the alternative is hand-arithmetic on a path length, and
 * "an aligned row token is padded, so capture it, don't type it" is a lesson this corpus has
 * already paid for.
 *
 * It compares two FROZEN captures taken by this unit — the mid-fire clean green at read 1059 and
 * the post-landing green at read 1063 — as multisets of lines, so a single inserted line is not
 * reported as seventeen positional changes the way a naive index-wise diff does.
 *
 * This file deliberately does NOT spell the exemption token, not even inside a regex in a comment.
 * That is the whole content of P7's refutation: the previous file in this unit evaded the token in
 * its code and then wrote it out contiguously in the sentence explaining the evasion.
 */
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const UNIT = import.meta.dirname;
const ROOT = resolve(UNIT, '../../..');
const GATE = join(ROOT, 'scripts/verify-decl-body-slicers.mjs');
const CAP = join(UNIT, 'captures');

const sha = (b) => createHash('sha256').update(b).digest('hex');

// BEFORE: this unit's own clean green capture, mid-fire, at read 1059.
const before = readFileSync(join(CAP, 'd4-clean-after-reset.out'));
// AFTER: driven fresh here, so the figure is measured rather than carried.
const r = spawnSync(process.execPath, [GATE], { cwd: ROOT, maxBuffer: 1 << 26 });
const after = r.stdout;

const split = (b) => {
  const s = b.toString('utf8');
  const parts = s.split('\n');
  if (s.endsWith('\n')) parts.pop();
  return parts;
};
const A = split(before);
const B = split(after);

const bag = (lines) => {
  const m = new Map();
  for (const l of lines) m.set(l, (m.get(l) ?? 0) + 1);
  return m;
};
const bagA = bag(A);
const bagB = bag(B);
const added = [];
const removed = [];
for (const [l, n] of bagB) {
  const d = n - (bagA.get(l) ?? 0);
  for (let i = 0; i < d; i += 1) added.push(l);
}
for (const [l, n] of bagA) {
  const d = n - (bagB.get(l) ?? 0);
  for (let i = 0; i < d; i += 1) removed.push(l);
}

const bytesOf = (l) => Buffer.byteLength(l, 'utf8') + 1;      // + the newline console.log appends
const addedBytes = added.reduce((a, l) => a + bytesOf(l), 0);
const removedBytes = removed.reduce((a, l) => a + bytesOf(l), 0);
const delta = after.length - before.length;

// The one line that is purely NEW content rather than a re-rendered figure: a published path row.
const pathRows = added.filter((l) => /^ {6}\S+\.(mjs|ts|mts|js|cjs|cts|tsx)$/.test(l));

const verdict = {
  'the whole stdout delta is accounted for by the line multiset':
    delta === addedBytes - removedBytes,
  'exactly ONE published path row was added': pathRows.length === 1,
  'that row is this unit\'s own arm': pathRows.length === 1
    && pathRows[0].trim() === 'docs/research/unit-503stalelabelwidth-2026-11-22/arm-stalelabelwidth.mjs',
  'the path row alone is the entire byte delta — every re-rendered count kept its digit width':
    pathRows.length === 1 && delta === bytesOf(pathRows[0]),
  'the two re-rendered figure lines are byte-length-equal before and after':
    added.filter((l) => !pathRows.includes(l))
      .every((l) => removed.some((p) => bytesOf(p) === bytesOf(l))),
};

console.log(JSON.stringify({
  before: { source: 'captures/d4-clean-after-reset.out', bytes: before.length, lines: A.length, sha: sha(before) },
  after: { source: 'driven fresh in this post-hoc', bytes: after.length, lines: B.length, sha: sha(after) },
  delta,
  addedLines: added.map((l) => ({ bytes: bytesOf(l), text: l.length > 120 ? `${l.slice(0, 117)}...` : l })),
  removedLines: removed.map((l) => ({ bytes: bytesOf(l), text: l.length > 120 ? `${l.slice(0, 117)}...` : l })),
  addedBytes,
  removedBytes,
  publishedPathRowAdded: pathRows,
  publishedPathRowBytes: pathRows.length === 1 ? bytesOf(pathRows[0]) : null,
  comparisonWithUnit502: {
    his: '+70 B / +1 line, one published path row, in the `quoted-only` list (token only in a string)',
    mine: `+${delta} B / +${B.length - A.length} line, one published path row, in the DEAD MARKERS`
      + ' list (token in a COMMENT, file out of population) — a different list, the same'
      + ' unconditional-print mechanism, and the door his §1 did not name',
  },
  verdict,
}, null, 2));
