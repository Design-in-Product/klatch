/**
 * Round 56 — failing-direction probe for the expand address.
 *
 * Same discipline as `round54-revert-probe.mjs`: apply each load-bearing piece's
 * revert on its own, run the recall test files, print which tests go red. A
 * piece whose revert leaves the suite green is not load-bearing and must not be
 * described in a memo as if it were.
 *
 * Restores the file after every revert; run from the repo root:
 *   node scripts/round56-revert-probe.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

const RECALL = 'packages/server/src/claude/recall.ts';
const QUERIES = 'packages/server/src/db/queries.ts';
const orig = {
  [RECALL]: readFileSync(RECALL, 'utf8'),
  [QUERIES]: readFileSync(QUERIES, 'utf8'),
};

const reverts = [
  // The Round 54 wording Theseus measured. Reverting it should redden the round
  // trip, every address assertion, and the header sentence — if it does not,
  // the address is decorative.
  { name: 'E1 no address, back to "a different search could reach"', file: RECALL, from: [
      ['      address !== undefined\n', '      false\n'],
  ]},
  // The address must use whichever reference the count used. Measuring it to
  // the conversation boundary keeps the count right and makes the range name a
  // stretch that includes rows already on the page.
  { name: 'E2 address measured to the conversation boundary', file: RECALL, from: [
      ['    from: (before ? before.ordinal : 0) + 1,', '    from: 1,'],
      ['    to: (after ? after.ordinal : last.scopedTotal + 1) - 1,', '    to: last.scopedTotal,'],
  ]},
  // One off the low end: the expansion re-prints the last turn the excerpt
  // already showed, and every later position shifts.
  { name: 'E3 trailing address starts one row early', file: RECALL, from: [
      ['    from: last.ordinal + 1,', '    from: last.ordinal,'],
  ]},
  // The retrieval policy. Without the scope clause an expansion returns turns
  // the entity was never party to — the one change here that would widen reach.
  { name: 'E4 range query unscoped', file: QUERIES, from: [
      ['      WHERE ${scope.where}\n    ),\n    raw AS (\n      SELECT rm.id AS raw_id,\n             ROW_NUMBER() OVER (\n               PARTITION BY rm.channel_id ORDER BY rm.created_at, rm.rowid\n             ) AS raw_seq,\n             COUNT(*) OVER (PARTITION BY rm.channel_id) AS raw_total\n      FROM messages rm\n      WHERE rm.channel_id IN (SELECT channel_id FROM scoped)\n    )\n    SELECT s.*, r.raw_seq AS raw_seq, r.raw_total AS raw_total, 0 AS is_match',
       '      WHERE 1 = 1\n    ),\n    raw AS (\n      SELECT rm.id AS raw_id,\n             ROW_NUMBER() OVER (\n               PARTITION BY rm.channel_id ORDER BY rm.created_at, rm.rowid\n             ) AS raw_seq,\n             COUNT(*) OVER (PARTITION BY rm.channel_id) AS raw_total\n      FROM messages rm\n      WHERE rm.channel_id IN (SELECT channel_id FROM scoped)\n    )\n    SELECT s.*, r.raw_seq AS raw_seq, r.raw_total AS raw_total, 0 AS is_match'],
  ]},
  // The current room is excluded from search by construction; an expand that
  // drops the option reaches it through the side door.
  { name: 'E5 expand ignores the current room', file: RECALL, from: [
      ['  const options = channel ? { excludeChannelId: channel.id } : {};', '  const options = {};'],
  ]},
  // Names are not unique. Taking the first candidate returns a real stretch of
  // the wrong conversation under a label the agent cannot check.
  { name: 'E6 ambiguous name resolved to the first match', file: RECALL, from: [
      ['  if (candidates.length > 1) {', '  if (false) {'],
  ]},
  // A silent cap reads as completeness.
  { name: 'E7 no row cap', file: RECALL, from: [
      ['  const rows = all.slice(0, RECALL_MAX_EXPAND_ROWS);', '  const rows = all;'],
  ]},
  // The header must describe what is on the page, not what was fetched.
  { name: 'E8 header counts taken from the fetch, not the render', file: RECALL, from: [
      ['  if (shownRows < all.length || lastShown < to) {', '  if (false) {'],
  ]},
  // An expansion is an excerpt; it does not get to imply it is the whole thread.
  { name: 'E9 expansion emits no header sentences', file: RECALL, from: [
      ['  parts.push(...gapSentences(scopeGaps, edgeGaps));\n\n  return {\n    text: `${parts.join(\' \')}\\n\\n${kept.join(EXCERPT_SEPARATOR)}`,\n    isError: false,\n    matchCount: all.length,',
       '  parts.push();\n\n  return {\n    text: `${parts.join(\' \')}\\n\\n${kept.join(EXCERPT_SEPARATOR)}`,\n    isError: false,\n    matchCount: all.length,'],
  ]},
];

const FILES = [
  'src/__tests__/round56-recall-expand.test.ts',
  'src/__tests__/round54-recall-excerpt-edges.test.ts',
  'src/__tests__/round52-recall-scope-gap.test.ts',
  'src/__tests__/round50-recall-tool.test.ts',
].join(' ');

for (const r of reverts) {
  let src = orig[r.file];
  for (const [a, b] of r.from) {
    if (!src.includes(a)) console.log('!! ' + r.name + ': anchor not found: ' + a.slice(0, 60));
    src = src.split(a).join(b);
  }
  writeFileSync(r.file, src);
  let out = '';
  try {
    out = execSync('npx vitest run --root packages/server ' + FILES + ' 2>&1', { encoding: 'utf8' });
  } catch (e) {
    out = e.stdout || '';
  }
  writeFileSync(r.file, orig[r.file]);
  // Strip the escape byte too, not just the bracket sequence — leaving ``
  // behind collapses the double space vitest prints after "Tests" and every
  // total silently reads as `?`, which looks exactly like a probe that ran.
  const clean = out.replace(/\[[0-9;]*m/g, '');
  const failing = [...new Set(
    [...clean.matchAll(/×\s+(.+)/g)].map((m) => m[1].replace(/\s+\d+ms$/, '').trim())
  )];
  // Anchored on the summary line, not on vitest's "Failed Tests 9" banner,
  // which also matches a bare number and reads as a suite total.
  const totals = (clean.match(/Tests\s+\d+ (?:failed|passed).*/) || ['?'])[0];
  console.log('\n### ' + r.name + '\n  ' + totals.trim());
  for (const f of failing) console.log('  - ' + f);
}
