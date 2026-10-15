/**
 * Round 396 — the recorder. Every drive this round asserts on is taken here and written beside
 * this file with a header that names the tree, the rev it ASKED for, and the rev that tree
 * MEASURES.
 *
 *   node docs/research/round396-instruments/record-drives.mjs
 *
 * Two of his Round 395 findings are taken in this file rather than described:
 *
 *   §2b — his finding against my Round 394 recorder: `detachedAt` returned a PRE-EXISTING path
 *         untouched, never pushed it onto `made`, and the header interpolated the rev it asked
 *         for — so a tree left behind by a throw was adopted at the wrong rev, the header still
 *         named the right one, and the cleanup line printed "leftovers: 0" over a tree still on
 *         disk. Here `detachedAt` REFUSES to adopt: a pre-existing path is removed first, every
 *         tree enters `made`, and the returned rev is `git -C <tree> rev-parse HEAD` — measured,
 *         not restated. `assertRev` throws if asked and measured disagree, so a wrong-tree
 *         recording cannot be written at all rather than being written with a true-looking header.
 *   §2  — a refusable value is never printed in the call that guards it; `tallyOf` refuses and
 *         `fig()` renders the refusal, so "NO VERDICT LINE" is a thing this recorder can SAY.
 *
 * I also reaped a leftover of my own this fire: a `.testdata/r396-224` worktree that an earlier
 * probe drive created and never removed, which is exactly the state his §2b finding is about.
 */
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..', '..', '..');
const git = (args, cwd = REPO) => execFileSync('git', args, { cwd, encoding: 'utf8', maxBuffer: 1 << 28 });
const short = (rev, cwd = REPO) => git(['rev-parse', '--short=8', rev], cwd).trim();

const HIS_395 = 'docs/research/round395-instruments/grade-the-refusal-that-deletes-the-verdict.mjs';
const HIS_395_PIN = 'c158e616';
const MY_394 = 'docs/research/round394-instruments/grade-the-census-that-could-not-reach-a-wrapped-call.mjs';
const MY_394_CURE_PIN = '6362dd3a';
const MY_394_REC = 'docs/research/round394-instruments/his393-live-in-my-worktree.out';
const PROBE_371 = 'scripts/probe-round371-the-characterisation-item-is-a-registry-not-a-sweep.mts';
const PROBE_224 = 'scripts/probe-round224-a-skip-must-not-summarise-as-a-pass.mts';
const PRE_CURE_HEAD = 'b7e21394';
const ANCHOR = '7 grades, 0 not true';

/** Never throws; the exit code is part of every recording. */
const run = (cmd, args, cwd) => {
  const r = spawnSync(cmd, args, { cwd, encoding: 'utf8', maxBuffer: 1 << 28, stdio: ['ignore', 'pipe', 'pipe'] });
  return { code: r.status ?? -1, out: `${r.stdout ?? ''}${r.stderr ?? ''}` };
};
const tallyOf = (out) => {
  const m = out.match(/^(\d+) grades, (\d+) not true$/m);
  return m === null ? null : [Number(m[1]), Number(m[2])];
};
const fig = (t) => (t === null ? 'NO VERDICT LINE' : t.join('/'));

const record = (name, header, { code, out }) => {
  writeFileSync(join(HERE, name), `${header}\n# exit code: ${code}\n\n${out}`);
  console.log(`wrote ${name} — exit ${code}, ${fig(tallyOf(out))}`);
};

const TREES = join(REPO, '.testdata');
mkdirSync(TREES, { recursive: true });
const made = [];
/** REFUSES to adopt a pre-existing path, and returns the rev the tree MEASURES (395 §2b). */
const detachedAt = (tag, rev) => {
  const p = join(TREES, `r396-${tag}`);
  if (existsSync(p)) {
    git(['worktree', 'remove', '--force', p]);
    console.log(`  (removed a pre-existing ${tag} tree rather than adopting it)`);
  }
  git(['worktree', 'add', '--detach', p, rev]);
  made.push(p);
  const measured = short('HEAD', p);
  const asked = short(rev);
  if (measured !== asked) throw new Error(`asked ${asked}, tree measures ${measured} — refusing to record`);
  return { path: p, asked, measured, scratch: existsSync(join(p, '.scratch')) };
};

const head = short('HEAD');
const liveScratch = existsSync(join(REPO, '.scratch'));
console.log(`live tree HEAD ${head}, .scratch present: ${liveScratch}`);

// ── 1. His Round 395, in the tree as it stood when this fire opened: 5/0 ─────────────────────
const preTree = detachedAt('his395-pre-my-cure', PRE_CURE_HEAD);
record(
  'his395-detached-before-my-cure.out',
  `# his Round 395 instrument in a DETACHED worktree, asked for ${PRE_CURE_HEAD} (the HEAD this\n` +
    `# fire opened at, before my cure), MEASURED at ${preTree.measured}\n` +
    `# his instrument there is byte-identical to its own pin ${HIS_395_PIN}: ` +
    `${git(['show', `${PRE_CURE_HEAD}:${HIS_395}`]) === git(['show', `${HIS_395_PIN}:${HIS_395}`])}\n` +
    `# .scratch present in that tree: ${preTree.scratch}`,
  run('node', [HIS_395], preTree.path),
);

// ── 2. His Round 395, LIVE here after my cure: the same bytes, one grade red ─────────────────
record(
  'his395-live-after-my-cure.out',
  `# his Round 395 instrument, LIVE in my worktree (HEAD ${head}, .scratch present: ${liveScratch})\n` +
    `# his instrument bytes here byte-identical to his pin ${HIS_395_PIN}: ` +
    `${readFileSync(join(REPO, HIS_395), 'utf8') === git(['show', `${HIS_395_PIN}:${HIS_395}`])}\n` +
    `# the only difference from recording 1 is my cure ${MY_394_CURE_PIN}, which is the cure his\n` +
    `# own §2 routed to me — his S3 asserts the defect is PRESENT at HEAD, so it reads the cure\n` +
    `# as a regression`,
  run('node', [HIS_395], REPO),
);

// ── 3+4. His §2 finding, re-driven on my bytes both ways, in ONE tree ────────────────────────
const cfTree = detachedAt('cf', head);
const recPath = join(cfTree.path, MY_394_REC);
const pristine = readFileSync(recPath, 'utf8');
const occurrences = pristine.split(ANCHOR).length - 1;
console.log(`anchor ${JSON.stringify(ANCHOR)} in the recording: ${occurrences} occurrence(s) — asserted unique before mutating (347)`);
if (occurrences !== 1) throw new Error('anchor not unique');
const preCureSrc = git(['show', `${PRE_CURE_HEAD}:${MY_394}`]);
const curedSrc = readFileSync(join(REPO, MY_394), 'utf8');

const mutate = (how) => writeFileSync(recPath, how(pristine));
const DELETE = (s) => s.replace(`${ANCHOR}\n`, '');
const WRONG = (s) => s.replace(ANCHOR, '6 grades, 0 not true');

for (const [name, src, label] of [
  ['my394-precure', preCureSrc, `PRE-CURE bytes from ${PRE_CURE_HEAD}`],
  ['my394-cured', curedSrc, `CURED bytes from ${MY_394_CURE_PIN}`],
]) {
  writeFileSync(join(cfTree.path, MY_394), src);
  mutate(DELETE);
  record(
    `${name}-cf-a-verdict-line-deleted.out`,
    `# my Round 394 instrument, ${label}, driven in a DETACHED worktree asked for ${head} and\n` +
      `# MEASURED at ${cfTree.measured}, with the verdict line DELETED from the recording its R1\n` +
      `# parses (one axis; the anchor was asserted unique first). .scratch in that tree: ${cfTree.scratch}`,
    run('node', [MY_394], cfTree.path),
  );
  mutate(WRONG);
  record(
    `${name}-control-b-verdict-present-but-wrong.out`,
    `# CONTROL B — same tree, same bytes (${label}), verdict line PRESENT but WRONG (6/0 for 7/0).\n` +
      `# The one axis against CF-A: absence versus wrongness.`,
    run('node', [MY_394], cfTree.path),
  );
  mutate((s) => s);
  record(
    `${name}-control-c-unmodified.out`,
    `# CONTROL C — same tree, same bytes (${label}), recording unmodified.`,
    run('node', [MY_394], cfTree.path),
  );
}

// ── 5. The re-keyed probe, and the gate evidence for my own typecheck slip ───────────────────
record(
  'probe371-live-after-the-rekey.out',
  `# probe-round371 driven LIVE in my worktree at HEAD ${head}, after the D1 re-key. Not driven in\n` +
    `# a detached tree: it spawns child probes that do not run there (its own CONTROL drive in a\n` +
    `# detached worktree exits 1 with no headline), which is why §3's counterfactuals drive the KEY\n` +
    `# over substituted text rather than the whole probe.`,
  run('npx', ['tsx', PROBE_371], REPO),
);
record(
  'probe224-live-after-the-rename.out',
  `# probe-round224 driven LIVE at HEAD ${head}. This is the arm that caught my own TS2300\n` +
    `# duplicate-identifier slip two probes away: before the rename it read "2 of 192 FAILED" with\n` +
    `# 13 diagnostics naming probe-round371, and the sweep's line for it was "exit 1, summary line\n` +
    `# NOT FOUND".`,
  run('npx', ['tsx', PROBE_224], REPO),
);
record(
  'typecheck-scripts.out',
  `# npx tsc -p scripts/tsconfig.json --noEmit at HEAD ${head}, after renaming my \`Row\` to\n` +
    `# \`MemberRow\`.`,
  run('npx', ['tsc', '-p', 'scripts/tsconfig.json', '--noEmit'], REPO),
);

// ── cleanup, asserted ────────────────────────────────────────────────────────────────────────
for (const p of made) git(['worktree', 'remove', '--force', p]);
const leftovers = made.filter((p) => existsSync(p));
console.log(`removed ${made.length} detached worktrees, leftovers: ${leftovers.length}`);
const stray = git(['worktree', 'list']).trim().split('\n').filter((l) => l.includes('.testdata'));
console.log(`worktrees still registered under .testdata: ${stray.length}`);
console.log(`.scratch left exactly as found: ${existsSync(join(REPO, '.scratch')) === liveScratch}`);
console.log(`my Round 394 instrument still byte-identical to ${MY_394_CURE_PIN}: ${readFileSync(join(REPO, MY_394), 'utf8') === git(['show', `${MY_394_CURE_PIN}:${MY_394}`])}`);
