#!/usr/bin/env node
/**
 * Round 398 — the recorder. Drives each instrument once, writes its output beside this file with
 * a header stating the rev the drive was taken at, and ASSERTS the verdict line is present and
 * says what it is expected to say. A recording whose verdict line is missing is written anyway,
 * marked `NO VERDICT LINE`, and makes this recorder exit 1 — my Round 394 defect was a recorder
 * that could not say that (his Round 395 §2).
 *
 * It drives no worktrees: every instrument here reads git objects and substituted text in memory,
 * so there is nothing to leave behind. The git state is read before and after all the same, so a
 * drive that dirties the tree is visible rather than inferred (358).
 */
import { execFileSync, spawnSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..', '..', '..');
const git = (args) => execFileSync('git', args, { cwd: REPO, encoding: 'utf8', maxBuffer: 1 << 28 });
const head = git(['rev-parse', '--short=8', 'HEAD']).trim();
const porcelainBefore = git(['status', '--porcelain']);
const worktreesBefore = git(['worktree', 'list']).trim().split('\n').length;

const DRIVES = [
  {
    out: 'census-refusable-index-windows.out',
    script: 'docs/research/round398-instruments/census-slice-from-a-refusable-index.mjs',
    verdict: /^CENSUS OK — (\d+) refusable-index window\(s\) in (\d+) tracked sources; (\d+) of them FAIL OPEN/m,
    wantExit: 0,
  },
  {
    out: 'the-refusable-anchor-counterfactuals.out',
    script: 'docs/research/round398-instruments/the-refusable-anchor-counterfactuals.mjs',
    verdict: /^HARNESS OK — 8 renamedAway cells and 4 recorder-pin cells, all as predicted\.$/m,
    wantExit: 0,
  },
  {
    out: 'my396-instrument-after-both-cures.out',
    script: 'docs/research/round396-instruments/grade-the-grade-that-reddens-on-its-own-routed-cure.mjs',
    verdict: /^(\d+) grades, (\d+) not true$/m,
    wantExit: 0,
  },
];

let bad = 0;
for (const d of DRIVES) {
  const r = spawnSync('node', [d.script], { cwd: REPO, encoding: 'utf8', maxBuffer: 1 << 28 });
  const body = `${r.stdout ?? ''}${r.stderr ?? ''}`;
  const m = body.match(d.verdict);
  const line = m === null ? 'NO VERDICT LINE' : m[0];
  const exit = r.status;
  const ok = exit === d.wantExit && m !== null;
  if (!ok) bad++;
  writeFileSync(
    join(HERE, d.out),
    `# Round 398 — \`node ${d.script}\`\n` +
      `# driven at ${head} (repo HEAD), exit ${exit} (expected ${d.wantExit})\n` +
      `# verdict line: ${line}\n` +
      `# Nothing here drives a worktree: the instruments read git objects and substituted text in memory.\n\n` +
      body,
  );
  console.log(`${ok ? 'ok  ' : 'BAD '} ${d.out} — exit ${exit}, verdict: ${line}`);
}

const porcelainAfter = git(['status', '--porcelain']);
const worktreesAfter = git(['worktree', 'list']).trim().split('\n').length;
const dirtiedBeyondRecordings = porcelainAfter
  .split('\n')
  .filter((l) => l.trim() !== '' && !DRIVES.some((d) => l.includes(d.out)))
  .filter((l) => !porcelainBefore.includes(l.trim()));
console.log(
  `\ngit state: worktrees ${worktreesBefore} → ${worktreesAfter}; ` +
    `paths dirtied beyond the recordings: ${dirtiedBeyondRecordings.length}` +
    `${dirtiedBeyondRecordings.length ? `\n  ${dirtiedBeyondRecordings.join('\n  ')}` : ''}`,
);
if (bad !== 0 || worktreesAfter !== worktreesBefore) {
  console.log('\nRECORDER NOT CLEAN — read the lines above.');
  process.exit(1);
}
console.log(`\nRECORDER OK — ${DRIVES.length} drives recorded at ${head}, every verdict line present and as expected.`);
