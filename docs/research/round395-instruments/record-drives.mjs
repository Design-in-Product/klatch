/**
 * Round 395 — the recorder. Every drive this round asserts on is taken by this file and written
 * beside it.
 *
 *   node docs/research/round395-instruments/record-drives.mjs
 *
 * Each header carries BOTH the rev the tree was asked for AND the rev the tree is measured to be
 * at (`git -C <tree> rev-parse HEAD`), because this round's §2b is that a header built from the
 * requested rev is a restatement of an input and not a reading of a tree. The cure is applied to
 * the instrument that reports it.
 *
 * Detached worktrees go under `.testdata/` (gitignored) and are REMOVED at the end, with the
 * removal asserted. `.scratch` is left exactly as found, asserted.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, writeFileSync, readFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..', '..', '..');
const git = (args, cwd = REPO) =>
  execFileSync('git', args, { cwd, encoding: 'utf8', maxBuffer: 1 << 28 });

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

const HIS_394 =
  'docs/research/round394-instruments/grade-the-census-that-could-not-reach-a-wrapped-call.mjs';
const HIS_394_PIN = 'f6bc1f02';
/** The recording his R1 parses a tally out of, and the mutation target for §2. */
const HIS_REC = 'docs/research/round394-instruments/his393-live-in-my-worktree.out';
const VERDICT = '7 grades, 0 not true';

const record = (name, header, { code, out }) => {
  writeFileSync(join(HERE, name), `${header}\n# exit code: ${code}\n\n${out}`);
  const tally = (out.match(/^(\d+) grades, (\d+) not true$/m) || []).slice(1).join('/');
  console.log(`wrote ${name} — exit ${code}${tally ? `, ${tally}` : ', NO VERDICT LINE'}`);
};

const TREES = join(REPO, '.testdata');
mkdirSync(TREES, { recursive: true });
const made = [];
/** Asked-for rev and measured rev, both returned, because §2b is that those can differ. */
const detachedAt = (tag, rev) => {
  const p = join(TREES, `r395-${tag}`);
  if (existsSync(p)) git(['worktree', 'remove', '--force', p]);
  git(['worktree', 'add', '--detach', p, rev]);
  made.push(p);
  return { p, asked: rev, measured: git(['rev-parse', '--short=8', 'HEAD'], p).trim() };
};

const head = git(['rev-parse', '--short=8', 'HEAD']).trim();
const liveScratch = existsSync(join(REPO, '.scratch'));
console.log(`live tree HEAD ${head}, .scratch present: ${liveScratch}`);

// ── 1. His Round 394, live here and detached at its own commit ───────────────────────────────
record(
  'his394-live-in-my-worktree.out',
  `# his Round 394 instrument, LIVE in my worktree (HEAD ${head}, .scratch present: ${liveScratch})\n` +
    `# instrument bytes: the working-tree copy. NOTE: an earlier drive this fire read \`.scratch\`\n` +
    `# present TRUE because I had created \`.scratch/r395\` myself before noticing; that drive is\n` +
    `# kept at .round395/his394-live.out and is not asserted on. This one is scratch-free.`,
  drive(REPO, HIS_394),
);
const his = detachedAt('his394', HIS_394_PIN);
record(
  'his394-detached-at-his-own-commit.out',
  `# his Round 394 instrument in a DETACHED worktree: asked for ${his.asked}, tree MEASURED at\n` +
    `# ${his.measured} (git -C <tree> rev-parse HEAD — the §2b cure applied here)\n` +
    `# .scratch present in that tree: ${existsSync(join(his.p, '.scratch'))}`,
  drive(his.p, HIS_394),
);

// ── 2. The three counterfactuals for §2, all in ONE throwaway tree at HEAD ───────────────────
const cf = detachedAt('cf', head);
const recPath = join(cf.p, HIS_REC);
const pristine = readFileSync(recPath, 'utf8');
/** The anchor is asserted to occur exactly once before anything mutates it (347). */
const occurrences = pristine.split(VERDICT).length - 1;
console.log(`mutation anchor "${VERDICT}" occurs ${occurrences} time(s) in his recording`);
if (occurrences !== 1) {
  console.log('REFUSING to mutate: anchor is not unique. No CF recordings written.');
} else {
  record(
    'cf-c-unmodified-copy.out',
    `# CONTROL C — his instrument, UNMODIFIED, in a DETACHED worktree: asked ${cf.asked}, measured\n` +
      `# ${cf.measured}. Establishes that the throwaway tree is not itself what breaks anything.`,
    drive(cf.p, HIS_394),
  );
  // CF-A: the verdict line DELETED from the recording his R1 parses. One axis.
  writeFileSync(recPath, pristine.replace(`${VERDICT}\n`, ''));
  record(
    'cf-a-verdict-line-deleted.out',
    `# CF-A — THE DEFECT. Same tree, same instrument bytes; the ONE axis changed is that the\n` +
      `# line "${VERDICT}" is deleted from ${HIS_REC.split('/').pop()}, so his \`tallyOf\`\n` +
      `# refuses with null exactly as he built it to. EXPECTED (written before this drove): no\n` +
      `# verdict line at all, a TypeError on .join of null, nonzero exit — the refusal does not\n` +
      `# redden R1, it deletes the whole verdict.`,
    drive(cf.p, HIS_394),
  );
  // CF-B: the verdict line PRESENT but WRONG. The isolating control.
  writeFileSync(recPath, pristine.replace(VERDICT, '6 grades, 0 not true'));
  record(
    'cf-b-verdict-line-present-but-wrong.out',
    `# CONTROL B — same tree, same bytes; the verdict line is PRESENT and WRONG\n` +
      `# ("6 grades, 0 not true"). EXPECTED before driving: a verdict line prints, R1 goes NOT\n` +
      `# TRUE, exit 1. This is what the defect in CF-A looks like when the tally is merely wrong\n` +
      `# instead of refused, and it is the whole isolation: absence deletes, wrongness reddens.`,
    drive(cf.p, HIS_394),
  );
  writeFileSync(recPath, pristine);
  console.log(`recording restored byte-identical in the throwaway tree: ${readFileSync(recPath, 'utf8') === pristine}`);
}

// ── 3. §2b — the header probe, in its own freshly-init'd scratch repo ────────────────────────
record(
  'header-probe.out',
  `# §2b — his \`detachedAt\` and his cleanup, lifted byte-for-byte from his recorder at the\n` +
    `# commit that last touched it (MEASURED inside the probe, not recalled), driven over a\n` +
    `# freshly git-init'ed scratch repo under .testdata/. Nothing of his is driven or written in\n` +
    `# my tree. EXPECTED before this drove: the returned path is the squatter, the header names\n` +
    `# the rev it asked for while the tree is at another, \`made\` is empty so his cleanup reports\n` +
    `# "removed 0, leftovers: 0" while the wrong-rev tree stays on disk — and with no squatter,\n` +
    `# his own code names the tree correctly.`,
  drive(REPO, 'docs/research/round395-instruments/probe-the-header-restates-its-input.mjs'),
);

// ── cleanup, asserted ────────────────────────────────────────────────────────────────────────
for (const p of made) git(['worktree', 'remove', '--force', p]);
const leftovers = made.filter((p) => existsSync(p));
console.log(`removed ${made.length} detached worktrees, leftovers: ${leftovers.length}`);
console.log(`.scratch left exactly as found: ${existsSync(join(REPO, '.scratch')) === liveScratch}`);
console.log(`his committed recording in MY tree untouched: ${readFileSync(join(REPO, HIS_REC), 'utf8') === pristine}`);
