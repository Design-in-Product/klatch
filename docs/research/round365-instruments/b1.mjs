/**
 * Round 365 — is `probe-round283` B1's predicate FALSE at HEAD, as Theseus's Round 364 item (b)
 * says? Driven in isolation rather than by driving round283, which spawns eight other probes.
 *
 * The predicate is lifted from the probe VERBATIM, then re-derived against three manifests so the
 * reading is not a single state: HEAD, the manifest as it was before Argus's 495766e4, and a
 * hypothetical driving leg.
 */
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';

const REPO = process.cwd();

// Verbatim from probe-round283 B1, including the chain it follows one level.
const B1 = (scripts) => {
  const testChain = ['test', 'typecheck', 'typecheck:scripts'].map((k) => scripts[k] ?? '').join(' ; ');
  return { verdict: !/sweep-probes/.test(testChain), testChain };
};

const atHead = JSON.parse(readFileSync(join(REPO, 'package.json'), 'utf8')).scripts;
const head = B1(atHead);
console.log(`HEAD      B1 verdict: ${head.verdict ? 'GREEN' : 'RED'}`);
console.log(`          chain: ${head.testChain}`);

// Argus's commit, named by Theseus. Read the manifest as it was at its parent.
const before = spawnSync('git', ['show', '495766e4^:package.json'], { cwd: REPO, encoding: 'utf8' });
if (before.status !== 0) {
  console.log(`GRADE: false — could not read package.json at 495766e4^ (${(before.stderr ?? '').trim()})`);
  process.exit(1);
}
const pre = B1(JSON.parse(before.stdout).scripts);
console.log(`495766e4^ B1 verdict: ${pre.verdict ? 'GREEN' : 'RED'}`);
console.log(`          chain: ${pre.testChain}`);

const commit = spawnSync('git', ['show', '-s', '--format=%h %an %ad %s', '--date=short', '495766e4'], {
  cwd: REPO,
  encoding: 'utf8',
});
console.log(`          495766e4 = ${(commit.stdout ?? '').trim()}`);

// A hypothetical DRIVING leg — the state the repair must also distinguish.
const driving = B1({ ...atHead, test: `${atHead.test.replace(' --census', '')}` });
console.log(`DRIVING   B1 verdict: ${driving.verdict ? 'GREEN' : 'RED'}`);
console.log(`          chain: ${driving.testChain}`);

// The proposed repair: every sweep-probes invocation the chain reaches carries --census.
const REPAIRED = (scripts) => {
  const testChain = ['test', 'typecheck', 'typecheck:scripts'].map((k) => scripts[k] ?? '').join(' ; ');
  const invocations = testChain.match(/[^;&|]*sweep-probes[^;&|]*/g) ?? [];
  return {
    verdict: invocations.length > 0 && invocations.every((i) => /--census/.test(i)),
    invocations,
  };
};
for (const [label, scripts] of [
  ['HEAD', atHead],
  ['495766e4^', JSON.parse(before.stdout).scripts],
  ['DRIVING', { ...atHead, test: atHead.test.replace(' --census', '') }],
  ['BOTH', { ...atHead, test: `${atHead.test} && node scripts/sweep-probes.mjs` }],
]) {
  const r = REPAIRED(scripts);
  console.log(
    `REPAIRED over ${label.padEnd(10)} ${r.verdict ? 'GREEN' : 'RED'} · invocations reached: ${r.invocations.length}` +
      `${r.invocations.length ? ` [${r.invocations.map((i) => i.trim()).join(' | ')}]` : ''}`,
  );
}
