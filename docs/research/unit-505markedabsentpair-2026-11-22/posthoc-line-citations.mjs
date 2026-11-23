#!/usr/bin/env node
/**
 * unit-505markedabsentpair — P9. The two line citations `unit-504mixedstalelabels` §4.2 corrects.
 *
 * A line citation is a claim about a **(file, revision)** pair. Neither his correction nor my
 * original named a revision, which is the whole defect: the same true citation becomes false when
 * anyone edits above it, and his own landing edited above both of these.
 *
 * Graded by reading the tracked file out of git at NAMED revisions, never from the working tree:
 *
 *   ce288701  my unit-503 close — the tree my citations were written against
 *   30d93ea8  his unit-504 landing — the tree his correction was written against
 *   HEAD      now
 *
 * Statements are located by their own text. Nothing here is typed from memory.
 */
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '../../..');
const GATE_REL = 'scripts/verify-decl-body-slicers.mjs';
const REVS = { 'ce288701 (my unit-503 close)': 'ce288701', ' 30d93ea8 (his unit-504 landing)': '30d93ea8', 'HEAD (now)': 'HEAD' };

const must = (c, m) => { if (!c) throw new Error(`ASSERTION FAILED: ${m}`); };
const show = (rev) => {
  const r = spawnSync('git', ['-C', ROOT, 'show', `${rev}:${GATE_REL}`], { encoding: 'utf8', maxBuffer: 1 << 26 });
  must(r.status === 0, `git show failed for ${rev}: ${r.stderr}`);
  return r.stdout.split('\n');
};

/** 1-based line numbers of every line whose text contains `needle`. */
const linesOf = (lines, needle) => lines
  .map((l, i) => (l.includes(needle) ? i + 1 : 0))
  .filter(Boolean);

// Located by their own text. The `stale` filter statement, and the per-entry emitter statement.
const STALE_FILTER = "const stale = baseline.filter((f) => verdicts.get(f) !== 'UNGUARDED');";
const PER_ENTRY = 'for (const f of stale) emitErr(';

const perRev = {};
for (const [label, rev] of Object.entries(REVS)) {
  const lines = show(rev);
  perRev[label.trim()] = {
    staleFilter: linesOf(lines, STALE_FILTER),
    perEntryStatement: linesOf(lines, PER_ENTRY),
    totalLines: lines.length,
  };
}

/* --------------------------------------------------- does the statement repeat across the tree? */
// `ID@line` is ambiguous when the id repeats across files, so the uniqueness is measured, not assumed.
const grep = spawnSync('git', ['-C', ROOT, 'grep', '-n', '--', STALE_FILTER], { encoding: 'utf8', maxBuffer: 1 << 26 });
const sourceHits = grep.stdout.split('\n').filter(Boolean)
  .filter((l) => l.endsWith(STALE_FILTER) && /\.mjs:/.test(l) && !/^docs\//.test(l));

const at = (rev, key) => perRev[rev][key];

const verdict = {
  /* P9.a — his correction of my L385 */
  'P9.a1  the stale filter is at L385 at ce288701 (the tree my citation was written against)':
    at('ce288701 (my unit-503 close)', 'staleFilter').join() === '385',
  'P9.a2  ...and at L385 at 30d93ea8 (the tree HIS correction was written against)':
    at('30d93ea8 (his unit-504 landing)', 'staleFilter').join() === '385',
  'P9.a3  ...and at L385 at HEAD': at('HEAD (now)', 'staleFilter').join() === '385',
  'P9.a4  L389 matches NO revision examined — the correction is REFUTED':
    Object.values(perRev).every((v) => !v.staleFilter.includes(389)),
  'P9.a5  the statement occurs in exactly ONE tracked source file, so the citation is unambiguous':
    sourceHits.length === 1,

  /* P9.b — his L830 for the per-entry statement */
  'P9.b1  the per-entry statement IS at L830 at ce288701 — his correction is CORRECT there':
    at('ce288701 (my unit-503 close)', 'perEntryStatement').join() === '830',
  'P9.b2  ...and is at L863 at HEAD, moved by HIS OWN landing':
    at('HEAD (now)', 'perEntryStatement').join() === '863',
  'P9.b3  so the correction was already stale in the tree it was published into':
    at('30d93ea8 (his unit-504 landing)', 'perEntryStatement').join() !== '830',
};

console.log(JSON.stringify({ gate: GATE_REL, revisions: REVS, perRev, sourceHits, verdict }, null, 2));
