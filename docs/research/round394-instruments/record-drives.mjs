/**
 * Round 394 — the recorder. Every drive this round asserts on is taken by this file and written
 * beside it with a header naming the tree, the commit it is detached at, and the commit the
 * instrument's own bytes came from (389: a recording of another seat's round has to say which
 * tree and which commit, because driving his instrument LIVE grades my cure, not his round).
 *
 *   node docs/research/round394-instruments/record-drives.mjs
 *
 * Detached worktrees are created under `.testdata/` (gitignored) and REMOVED at the end. Note
 * his Round 393 §4 reading: a tree nested under this worktree resolves `npx` UPWARD into this
 * worktree's `node_modules`, so "detached worktree" is two properties and not one. Nothing this
 * round records drives `tsc`, so the distinction does not bear on these numbers — declared
 * because it bears on anyone comparing them to a sibling-located tree's.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..', '..', '..');
const git = (args, cwd = REPO) =>
  execFileSync('git', args, { cwd, encoding: 'utf8', maxBuffer: 1 << 28 });

/** Drive `rel` with node in `cwd` and capture stdout+stderr and the exit code, never throwing. */
const drive = (cwd, rel) => {
  try {
    const out = execFileSync('node', [rel], {
      cwd,
      encoding: 'utf8',
      maxBuffer: 1 << 28,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    return { code: 0, out };
  } catch (e) {
    return { code: e.status ?? -1, out: `${e.stdout ?? ''}${e.stderr ?? ''}` };
  }
};

const HIS_393 = 'docs/research/round393-instruments/grade-the-grade-that-is-green-on-one-machine.mjs';
const MINE_392 = 'docs/research/round392-instruments/grade-the-finding-that-is-its-own-finding.mjs';

const record = (name, header, { code, out }) => {
  const p = join(HERE, name);
  writeFileSync(p, `${header}\n# exit code: ${code}\n\n${out}`);
  const tally = (out.match(/^(\d+) grades, (\d+) not true$/m) || []).slice(1).join('/');
  console.log(`wrote ${name} — exit ${code}${tally ? `, ${tally}` : ', NO VERDICT LINE'}`);
};

const TREES = join(REPO, '.testdata');
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

const head = git(['rev-parse', '--short=8', 'HEAD']).trim();
const liveScratch = existsSync(join(REPO, '.scratch'));
console.log(`live tree HEAD ${head}, .scratch present: ${liveScratch}`);

// ── 1. His Round 393, both ways ──────────────────────────────────────────────────────────────
const HIS_393_PIN = '44154365';
record(
  'his393-live-in-my-worktree.out',
  `# his Round 393 instrument, LIVE in my worktree (HEAD ${head}, .scratch present: ${liveScratch})\n` +
    `# instrument bytes: the working-tree copy, which is ${HIS_393_PIN}'s`,
  drive(REPO, HIS_393),
);
const hisTree = detachedAt('his393', HIS_393_PIN);
record(
  'his393-detached-at-his-own-commit.out',
  `# his Round 393 instrument in a DETACHED worktree at his own commit ${HIS_393_PIN}\n` +
    `# .scratch present in that tree: ${existsSync(join(hisTree, '.scratch'))}`,
  drive(hisTree, HIS_393),
);

// ── 2. Mine, pre-cure: the control, and the exception ────────────────────────────────────────
const PRE_CURE_PIN = 'c848dc66';
const preTree = detachedAt('mine-precure', PRE_CURE_PIN);
record(
  'my392-precure-detached-at-c848dc66.out',
  `# my Round 392 instrument, PRE-CURE, in a DETACHED worktree at its own commit ${PRE_CURE_PIN}\n` +
    `# .scratch present in that tree: ${existsSync(join(preTree, '.scratch'))}\n` +
    `# the memo its Q2b reads live is still at its docs/mail/ path at this commit`,
  drive(preTree, MINE_392),
);
const movedPin = git(['rev-parse', '--short=8', '3b0677e0']).trim();
const postMoveTree = detachedAt('after-the-mail-move', movedPin);
record(
  'my392-precure-in-a-tree-after-the-mail-move.out',
  `# my Round 392 instrument, PRE-CURE bytes from ${PRE_CURE_PIN}, driven in a DETACHED worktree at\n` +
    `# ${movedPin} — the close-discipline commit that git mv-ed the memo its Q2b reads live into\n` +
    `# docs/mail/read/. This is the drive that has no verdict line at all.`,
  (() => {
    const src = git(['show', `${PRE_CURE_PIN}:${MINE_392}`]);
    const p = join(postMoveTree, MINE_392);
    writeFileSync(p, src);
    return drive(postMoveTree, MINE_392);
  })(),
);

// ── 3. Mine, cured: the same bytes in both kinds of tree ─────────────────────────────────────
record(
  'my392-cured-live.out',
  `# my Round 392 instrument, CURED, LIVE in my worktree (HEAD ${head}, .scratch present: ${liveScratch})`,
  drive(REPO, MINE_392),
);
const curedTree = detachedAt('mine-cured', head);
{
  const p = join(curedTree, MINE_392);
  writeFileSync(p, git(['show', `HEAD:${MINE_392}`], REPO));
  record(
    'my392-cured-detached.out',
    `# my Round 392 instrument, CURED, in a DETACHED worktree at ${head} with the cured bytes in\n` +
      `# place (the cure is not committed when this recorder first runs, so the file is written in\n` +
      `# from \`git show HEAD\` after the commit; re-running after the commit lands is identical).\n` +
      `# .scratch present in that tree: ${existsSync(join(curedTree, '.scratch'))}`,
    drive(curedTree, MINE_392),
  );
}

// ── cleanup, asserted ────────────────────────────────────────────────────────────────────────
for (const p of made) git(['worktree', 'remove', '--force', p]);
const leftovers = made.filter((p) => existsSync(p));
console.log(`removed ${made.length} detached worktrees, leftovers: ${leftovers.length}`);
console.log(`.scratch left exactly as found: ${existsSync(join(REPO, '.scratch')) === liveScratch}`);
