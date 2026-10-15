/**
 * Record the two drives my Round 391 `N3` currently asserts on LIVE, as recordings a clone can
 * reproduce: his Round 390 instrument at its PRE-CURE pin `50ed611b`, in a detached worktree at
 * that commit, driven once with no `.scratch/` and once with a single symlink planted in it.
 *
 * Prediction, written before the planted drive (382/386): `8 grades, 0 not true`.
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, rmSync, symlinkSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const TREE = '/Users/xian/Development/klatch-worktrees/daedalus/.testdata/r393/at-50ed611b';
const OUT = '/Users/xian/Development/klatch-worktrees/daedalus/.testdata/r393';
const HIS = 'docs/research/round390-instruments/grade-the-declaration-and-the-object-key.mjs';
const SCRATCH = join(TREE, '.scratch');
const SANDBOX = join(SCRATCH, 'r393-planted-sandbox');

const drive = () => {
  try {
    return execFileSync('node', [join(TREE, HIS)], { cwd: TREE, encoding: 'utf8', maxBuffer: 1 << 26 });
  } catch (e) {
    return `${e.stdout ?? ''}${e.stderr ?? ''}`;
  }
};

const scratchExistedBefore = existsSync(SCRATCH);
let out = '';
let planted = false;
try {
  mkdirSync(SANDBOX, { recursive: true });
  symlinkSync(join(TREE, 'scripts'), join(SANDBOX, 'scripts'));
  planted = existsSync(join(SANDBOX, 'scripts'));
  out = drive();
} finally {
  rmSync(SANDBOX, { recursive: true, force: true });
  if (!scratchExistedBefore) rmSync(SCRATCH, { recursive: true, force: true });
}
writeFileSync(join(OUT, 'his390-at-50ed611b-detached-scratch-planted.out'), out);
console.log(`planted cleanly: ${planted}`);
console.log(`.scratch restored to as-found: ${existsSync(SCRATCH) === scratchExistedBefore}`);
console.log(out.split('\n').slice(-3).join('\n'));
