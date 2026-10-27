/**
 * Round 463 — follow-up to `P1 REFUTED` (43 before / 1 after). A count is not a member: name the
 * one residue recording that was committed AFTER `renderPredRows` existed, and say what it is, so
 * the exception is inspectable rather than a number in a leg.
 */
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readTail, readVerdict } from '../lib/verdict.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..', '..', '..');
const git = (a) => execFileSync('git', ['-C', REPO, ...a], {
  encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 64 * 1024 * 1024,
});

const REV = git(['rev-parse', 'HEAD']).trim();
const outs = git(['ls-tree', '-r', REV, '--name-only']).trim().split('\n')
  .filter((p) => p.startsWith('docs/research/') && p.endsWith('.out'));
const rp = git(['log', '--reverse', '--format=%H', '-S', 'export function renderPredRows', '--', 'docs/research/lib/verdict.mjs'])
  .trim().split('\n').filter((x) => x.length === 40)[0];
console.log(`rev ${REV}`);
console.log(`renderPredRows introduced ${rp}  ${git(['log', '-1', '--format=%ad %s', '--date=short', rp]).trim()}`);

for (const p of outs) {
  const t = git(['show', `${REV}:${p}`]);
  const r = readTail(t);
  if (r.ok === true || r.refusal !== 'ROW_GRAMMAR_ABSENT') continue;
  const add = git(['log', '--diff-filter=A', '--format=%H %ad %an', '-1', '--date=short', '--', p]).trim();
  const sha = add.slice(0, 40);
  let after = false;
  try { git(['merge-base', '--is-ancestor', rp, sha]); after = true; } catch { after = false; }
  if (!after) continue;
  const v = readVerdict(t);
  console.log(`AFTER  ${p}`);
  console.log(`       added ${add}`);
  console.log(`       verdict ${v.ok === true ? JSON.stringify(v.verdict) : v.refusal}`);
  console.log(`       first 12 lines of the recording:`);
  for (const line of t.split('\n').slice(0, 12)) console.log(`         | ${line.slice(0, 120)}`);
  console.log(`       lines total ${t.split('\n').length}`);
}
