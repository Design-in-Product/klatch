/**
 * Round 395 §2b — his recorder's "DETACHED worktree at his own commit <rev>" header is built from
 * the rev it ASKED for, not from the tree. His `detachedAt` returns a pre-existing path untouched
 * and only pushes newly-created paths onto `made`, so a tree left behind at a different rev is
 * silently reused, the header still names the asked-for rev, and both of his cleanup assertions
 * ("removed N, leftovers: 0") stay green over the reused tree because it was never in `made`.
 *
 * His block is lifted BYTE-FOR-BYTE out of his committed recorder and asserted before it drives
 * (328). It is driven in a freshly `git init`-ed scratch repo under `.testdata/` (gitignored), not
 * against his real recordings — because driving his recorder in my own tree would overwrite the
 * recordings his round published.
 *
 *   node docs/research/round395-instruments/probe-the-header-restates-its-input.mjs
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const MAIN = join(HERE, '..', '..', '..');
const g0 = (args, cwd) => execFileSync('git', args, { cwd, encoding: 'utf8', maxBuffer: 1 << 28 });

const HIS_RECORDER = 'docs/research/round394-instruments/record-drives.mjs';
/** The commit is MEASURED, not recalled: the last commit that touched his recorder. */
const HIS_RECORDER_PIN = g0(['rev-list', '-1', '--abbrev=8', '--abbrev-commit', 'HEAD', '--', HIS_RECORDER], MAIN).trim();
const hisRecorder = g0(['show', `${HIS_RECORDER_PIN}:${HIS_RECORDER}`], MAIN);

const HIS_DETACHED_AT = `const detachedAt = (tag, rev) => {
  const p = join(TREES, \`r394-\${tag}\`);
  if (!existsSync(p)) {
    git(['worktree', 'add', '--detach', p, rev]);
    made.push(p);
  }
  return p;
};`;
const HIS_CLEANUP = `for (const p of made) git(['worktree', 'remove', '--force', p]);
const leftovers = made.filter((p) => existsSync(p));`;
const HIS_HEADER_LINE = '`# his Round 393 instrument in a DETACHED worktree at his own commit ${HIS_393_PIN}\\n` +';

console.log(`his recorder pin, measured: ${HIS_RECORDER_PIN}`);
console.log(`his detachedAt lifted byte-for-byte: ${hisRecorder.includes(HIS_DETACHED_AT)}`);
console.log(`his cleanup lifted byte-for-byte: ${hisRecorder.includes(HIS_CLEANUP)}`);
console.log(`his header line lifted byte-for-byte: ${hisRecorder.includes(HIS_HEADER_LINE)}`);

// ── a scratch repo, two commits ──────────────────────────────────────────────────────────────
const SCRATCH = join(MAIN, '.testdata', 'r395-headerprobe');
rmSync(SCRATCH, { recursive: true, force: true });
mkdirSync(SCRATCH, { recursive: true });
const git = (args, cwd = SCRATCH) => execFileSync('git', args, { cwd, encoding: 'utf8' });
git(['init', '-q', '-b', 'main']);
git(['config', 'user.email', 'probe@example.invalid']);
git(['config', 'user.name', 'Round 395 probe']);
writeFileSync(join(SCRATCH, 'a.txt'), 'one\n');
git(['add', '-A']);
git(['commit', '-q', '-m', 'one']);
const REV_1 = git(['rev-parse', '--short=8', 'HEAD']).trim();
writeFileSync(join(SCRATCH, 'a.txt'), 'two\n');
git(['add', '-A']);
git(['commit', '-q', '-m', 'two']);
const REV_2 = git(['rev-parse', '--short=8', 'HEAD']).trim();
console.log(`scratch repo revs: REV_1 ${REV_1} (the squatter), REV_2 ${REV_2} (the one asked for)`);

// ── HIS semantics, his spelling, over that repo ──────────────────────────────────────────────
const TREES = join(SCRATCH, '.testdata');
mkdirSync(TREES, { recursive: true });
const made = [];
const detachedAt = (tag, rev) => {
  const p = join(TREES, `r394-${tag}`);
  if (!existsSync(p)) {
    git(['worktree', 'add', '--detach', p, rev]);
    made.push(p);
  }
  return p;
};

/** The squatter: a tree left at REV_1 by an earlier run that died before its cleanup. */
const squatPath = join(TREES, 'r394-his393');
git(['worktree', 'add', '--detach', squatPath, REV_1]);
console.log(`planted a tree at ${squatPath.replace(SCRATCH, '<scratch>')} detached at REV_1`);

/** Now his recorder's own call, asking for REV_2. */
const returned = detachedAt('his393', REV_2);
const measured = git(['rev-parse', '--short=8', 'HEAD'], returned).trim();
const header = `# his Round 393 instrument in a DETACHED worktree at his own commit ${REV_2}`;
console.log(`detachedAt('his393', ${REV_2}) returned the squatter: ${returned === squatPath}`);
console.log(`header built from the asked-for rev says: ${header}`);
console.log(`tree is MEASURED at: ${measured}`);
console.log(`HEADER NAMES THE TREE: ${header.includes(measured)}`);
console.log(`made[] after the call: ${JSON.stringify(made)} (length ${made.length})`);

/** His cleanup, his spelling, over that `made`. */
for (const p of made) git(['worktree', 'remove', '--force', p]);
const leftovers = made.filter((p) => existsSync(p));
console.log(`his cleanup prints: removed ${made.length} detached worktrees, leftovers: ${leftovers.length}`);
console.log(`the squatter still on disk after his cleanup: ${existsSync(squatPath)}`);

/** CONTROL: with no squatter, his own code does name the tree correctly. */
rmSync(squatPath, { recursive: true, force: true });
git(['worktree', 'prune']);
const made2Before = made.length;
const fresh = detachedAt('his393', REV_2);
const freshMeasured = git(['rev-parse', '--short=8', 'HEAD'], fresh).trim();
console.log(
  `CONTROL, no squatter: header for ${REV_2} names the tree: ${`at his own commit ${REV_2}`.includes(freshMeasured)}; ` +
    `made grew by ${made.length - made2Before}`,
);

// ── cleanup, asserted ───────────────────────────────────────────────────────────────────────
for (const p of made) if (existsSync(p)) git(['worktree', 'remove', '--force', p]);
rmSync(SCRATCH, { recursive: true, force: true });
console.log(`scratch repo removed: ${!existsSync(SCRATCH)}`);
