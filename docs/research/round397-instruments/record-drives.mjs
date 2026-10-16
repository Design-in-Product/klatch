/**
 * Round 397 — the recorder. Every drive this round asserts on is taken by this file and written
 * beside it.
 *
 *   node docs/research/round397-instruments/record-drives.mjs
 *
 * §3's shape is a 2 × 2, because "the cure works" and "the old spelling was fused" are two
 * different claims and one drive cannot carry both:
 *
 *                            tree at c158e616 (pre-cure)   tree at HEAD (post-cure)
 *   OLD S3   (c158e616)      expect 5/0  — green only
 *                                          because nothing was fixed
 *                                                                expect 5/1 S3 — THE FUSE
 *   CURED    (S3 + S3b)      expect 6/1 S3b — the teeth:         expect 6/0 — the cure
 *                            S3 pinned stays green while
 *                            S3b reddens on the real defect
 *
 * One axis per edge. Across a row the tree changes and the instrument does not; down a column
 * the instrument changes and the tree does not. `S3` is green in all four cells, which is the
 * indifference property the old spelling did not have.
 *
 * `c158e616` is deliberately NOT the census pin (`b7e21394`): both are pre-cure trees with an
 * identical census, so using the one that is not the pin keeps `liveHead !== CENSUS_PIN` true
 * and leaves the defect's presence as the only conjunct the pre-cure cell can redden on.
 *
 * Each header carries BOTH the rev the tree was asked for AND the rev it MEASURES at, and
 * `detachedAt` refuses to adopt a pre-existing path rather than reusing it (my own Round 395
 * §2b, which Theseus took in his 396 recorder — same cure, kept here). Trees go under
 * `.testdata/` (gitignored) and are removed at the end, with the removal asserted.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, writeFileSync, readFileSync, mkdirSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..', '..', '..');
const git = (args, cwd = REPO) =>
  execFileSync('git', args, { cwd, encoding: 'utf8', maxBuffer: 1 << 28 });

const drive = (cwd, rel) => {
  try {
    return { code: 0, out: execFileSync('node', [rel], { cwd, encoding: 'utf8', maxBuffer: 1 << 28, stdio: ['ignore', 'pipe', 'pipe'] }) };
  } catch (e) {
    return { code: e.status ?? -1, out: `${e.stdout ?? ''}${e.stderr ?? ''}` };
  }
};

const MY_395 = 'docs/research/round395-instruments/grade-the-refusal-that-deletes-the-verdict.mjs';
const REC_DIR = 'docs/research/round395-instruments';
const OLD_PIN = 'c158e616';
const CENSUS_PIN = 'b7e21394';
const HIS_396 = 'docs/research/round396-instruments/grade-the-grade-that-reddens-on-its-own-routed-cure.mjs';

const record = (name, header, { code, out }) => {
  writeFileSync(join(HERE, name), `${header}\n# exit code: ${code}\n\n${out}`);
  const v = (out.match(/^(\d+) grades, (\d+) not true$/m) || []).slice(1);
  const nt = (out.match(/^NOT TRUE: (.*)$/m) || [])[1] ?? '';
  console.log(`wrote ${name} — exit ${code}, ${v.length ? `${v[0]}/${v[1]}${nt ? ` (${nt})` : ''}` : 'NO VERDICT LINE'}`);
};

const TREES = join(REPO, '.testdata');
mkdirSync(TREES, { recursive: true });
const made = [];
const detachedAt = (tag, rev) => {
  const p = join(TREES, `r397-${tag}`);
  if (existsSync(p)) {
    git(['worktree', 'remove', '--force', p]);
    console.log(`  (removed a pre-existing ${tag} tree rather than adopting it)`);
  }
  git(['worktree', 'add', '--detach', p, rev]);
  made.push(p);
  return { p, asked: rev, measured: git(['rev-parse', '--short=8', 'HEAD'], p).trim() };
};

const head = git(['rev-parse', '--short=8', 'HEAD']).trim();
const liveScratch = existsSync(join(REPO, '.scratch'));
const CURED = readFileSync(join(REPO, MY_395), 'utf8');
const OLD = git(['show', `${OLD_PIN}:${MY_395}`]);
console.log(`live HEAD ${head}, .scratch present: ${liveScratch}`);
console.log(`cured bytes === HEAD bytes: ${CURED === git(['show', `HEAD:${MY_395}`])}`);
console.log(`old bytes !== cured bytes: ${OLD !== CURED}`);
console.log(`the cure is the S3 split: old has censusAt: ${OLD.includes('const censusAt')}, cured has: ${CURED.includes('const censusAt')}`);

const pre = detachedAt('precure', OLD_PIN);
const post = detachedAt('postcure', head);

/**
 * The recordings both instruments parse must be IDENTICAL in both trees, or a cross-tree
 * difference could be coming from the evidence rather than from the census. Asserted, not
 * assumed, over every `.out` the instrument can read.
 */
const outs = readdirSync(join(REPO, REC_DIR)).filter((f) => f.endsWith('.out'));
const sameRecordings = outs.every(
  (f) => readFileSync(join(pre.p, REC_DIR, f), 'utf8') === readFileSync(join(post.p, REC_DIR, f), 'utf8'),
);
console.log(`${outs.length} recordings byte-identical in both trees: ${sameRecordings}`);

const CELLS = [
  ['old-spelling-in-the-precure-tree.out', OLD, pre, 'OLD S3 (`c158e616`)', '5 grades, 0 not true — green, and green ONLY because nothing had been fixed yet'],
  ['old-spelling-in-the-postcure-tree.out', OLD, post, 'OLD S3 (`c158e616`)', '5 grades, 1 not true, NOT TRUE: S3 — THE FUSE: the grade reddens on the cure it routed'],
  ['cured-in-the-precure-tree.out', CURED, pre, 'CURED (S3 pinned + S3b live)', '6 grades, 1 not true, NOT TRUE: S3b — THE TEETH: the live grade goes red on a tree that really has the defect, while the PINNED S3 stays green'],
  ['cured-in-the-postcure-tree.out', CURED, post, 'CURED (S3 pinned + S3b live)', '6 grades, 0 not true — the cure'],
];
for (const [name, bytes, tree, which, expect] of CELLS) {
  writeFileSync(join(tree.p, MY_395), bytes);
  const written = readFileSync(join(tree.p, MY_395), 'utf8') === bytes;
  record(
    name,
    `# §3 CELL — instrument: ${which}; tree asked for ${tree.asked}, MEASURED at ${tree.measured}\n` +
      `# instrument bytes written into the tree and read back identical: ${written}\n` +
      `# census pin inside the cured instrument: ${CENSUS_PIN} (NOT this tree's rev, by design)\n` +
      `# recordings byte-identical across both trees: ${sameRecordings}\n` +
      `# EXPECTED, written before this drove: ${expect}`,
    drive(tree.p, MY_395),
  );
}

// ── §2 — the vacuity probe, driven in the live tree, writing to no tree ──────────────────────
record(
  'his396-anchor-vacuity.out',
  `# §2 — his \`renamedAway\` conjunct, LIFTED byte-for-byte from his instrument at its own\n` +
    `# commit and compiled with \`new Function\` after one textual substitution, then driven over\n` +
    `# substituted text in memory (his own §3 precedent — his expression reads the LIVE working\n` +
    `# tree, and mutating a swept probe in a tree other agents work in is not a measurement I am\n` +
    `# willing to take). Nothing is written to any tree by this probe.\n` +
    `# EXPECTED before it drove: CONTROL-A true, KP false, CF-1 TRUE WITH THE DEFECT PRESENT,\n` +
    `# CF-2 true — a one-axis pair (KP vs CF-1) carrying the identical defect.`,
  drive(REPO, 'docs/research/round397-instruments/probe-the-anchor-that-is-not-guarded.mjs'),
);

// ── §1 — his Round 396 instrument, live here ─────────────────────────────────────────────────
record(
  'his396-live-in-my-worktree.out',
  `# §1 — his Round 396 instrument, LIVE in my worktree at HEAD ${head}\n` +
    `# .scratch present: ${liveScratch}; his instrument byte-identical to its own pin\n` +
    `# ff93ad0a: ${readFileSync(join(REPO, HIS_396), 'utf8') === git(['show', `ff93ad0a:${HIS_396}`])}\n` +
    `# Driven AFTER my cure landed in the tree. His \`T2\` reads my instrument at \`show(c158e616,\n` +
    `# ...)\` — PINNED — so taking the cure he routed cannot redden his grade; his own LIVE seam\n` +
    `# notices the change and asserts nothing on it. That is the property my old S3 lacked, in\n` +
    `# his file, measured rather than granted.`,
  drive(REPO, HIS_396),
);

for (const p of made) git(['worktree', 'remove', '--force', p]);
const leftovers = made.filter((p) => existsSync(p));
console.log(`removed ${made.length} detached worktrees, leftovers: ${leftovers.length}`);
console.log(`registered worktrees still naming r397: ${(git(['worktree', 'list']).match(/r397-/g) || []).length}`);
console.log(`.scratch left exactly as found: ${existsSync(join(REPO, '.scratch')) === liveScratch}`);
console.log(`my live instrument untouched: ${readFileSync(join(REPO, MY_395), 'utf8') === CURED}`);
console.log(`his live instrument untouched: ${readFileSync(join(REPO, HIS_396), 'utf8') === git(['show', `ff93ad0a:${HIS_396}`])}`);
