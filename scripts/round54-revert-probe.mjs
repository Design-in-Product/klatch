/**
 * Round 54 — failing-direction probe for the excerpt-edge marker.
 *
 * Applies each load-bearing piece's revert on its own, runs the recall test
 * files, and prints which tests go red. A piece whose revert leaves the suite
 * green is not load-bearing and should not be described as if it were.
 *
 * Restores the file after every revert; run from the repo root:
 *   node scripts/round54-revert-probe.mjs
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
  { name: 'R1 no edge markers at all', file: RECALL, from: [
      ['if (leading !== undefined) lines.push(leading);', 'if (false && leading !== undefined) lines.push(leading);'],
      ['if (trailing !== undefined) lines.push(trailing);', 'if (false && trailing !== undefined) lines.push(trailing);'],
  ]},
  // Re-anchored 8/15 after Round 56 rewrote the reachable clause to carry an
  // address. The revert is the same one — collapse the two counts into one —
  // and it still has to go red for the same reason: a single number sends the
  // agent looking for turns nothing can reach.
  { name: 'R2 one collapsed count instead of two', file: RECALL, from: [
      ['  if (ownCount > 0) {\n    clauses.push(\n      address !== undefined\n        ? `${ownCount} you can read — ask for them with expand ` +\n          `{conversation: "${address.conversation}", from: ${address.from}, to: ${address.to}}`\n        : `${ownCount} that a different search of yours could reach`\n    );\n  }\n  if (outOfScopeCount > 0) {\n    clauses.push(`${outOfScopeCount} that no search of yours can reach`);\n  }',
       '  if (ownCount + outOfScopeCount > 0) {\n    clauses.push(`${ownCount + outOfScopeCount} you can read`);\n  }'],
  ]},
  { name: 'R3 always measure to the conversation boundary', file: RECALL, from: [
      ['const before = edgeReference(keptExcerpts, i, -1);', 'const before = undefined;'],
      ['const after = edgeReference(keptExcerpts, i, +1);', 'const after = undefined;'],
  ]},
  { name: 'R4 reference not scoped to the conversation', file: RECALL, from: [
      ['    if (candidate[0].channelId !== channelId) continue;', '    if (false) continue;'],
  ]},
  { name: 'R5 unconditional edge header sentence', file: RECALL, from: [
      ['if (edgeGaps > 0) {', 'if (true) {'],
  ]},
  { name: 'R6 reference from all excerpts, not the kept ones', file: RECALL, from: [
      ['const before = edgeReference(keptExcerpts, i, -1);', 'const before = edgeReference(excerpts, excerpts.indexOf(excerpt), -1);'],
      ['const after = edgeReference(keptExcerpts, i, +1);', 'const after = edgeReference(excerpts, excerpts.indexOf(excerpt), +1);'],
  ]},
  { name: 'R7 edge line reuses the interior vocabulary', file: RECALL, from: [
      ['${outOfScopeCount} that no search of yours can reach', '${outOfScopeCount} not of your transcript'],
  ]},
  { name: 'R8 rawTotal derived from the scoped total', file: QUERIES, from: [
      ['rawTotal: row.raw_total as number,', 'rawTotal: row.scoped_total as number,'],
  ]},
];

const FILES = [
  'src/__tests__/round54-recall-excerpt-edges.test.ts',
  'src/__tests__/round52-recall-scope-gap.test.ts',
  'src/__tests__/round50-recall-tool.test.ts',
  'src/__tests__/round56-recall-expand.test.ts',
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
  const clean = out.replace(/\[[0-9;]*m/g, '');
  const failing = [...new Set(
    [...clean.matchAll(/×\s+(.+)/g)].map((m) => m[1].replace(/\s+\d+ms$/, '').trim())
  )];
  const totals = (clean.match(/Tests\s+\d+ (?:failed|passed).*/) || ['?'])[0];
  console.log('\n### ' + r.name + '\n  ' + totals.trim());
  for (const f of failing) console.log('  - ' + f);
}
