/** Does MY Round 393 instrument move when `.scratch` exists? Prediction, first: no — 7/0. */
import { execFileSync } from 'node:child_process';
import { mkdirSync, rmSync, symlinkSync, existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const TREE = '/Users/xian/Development/klatch-worktrees/daedalus/.testdata/r393/mine-44154365';
const F = 'docs/research/round393-instruments/grade-the-grade-that-is-green-on-one-machine.mjs';
const SCRATCH = join(TREE, '.scratch');
const SANDBOX = join(SCRATCH, 'r393-planted-into-mine');
const before = existsSync(SCRATCH);
let out = '';
try {
  mkdirSync(SANDBOX, { recursive: true });
  symlinkSync(join(TREE, 'scripts'), join(SANDBOX, 'scripts'));
  try {
    out = execFileSync('node', [join(TREE, F)], { cwd: TREE, encoding: 'utf8', maxBuffer: 1 << 26 });
  } catch (e) {
    out = `${e.stdout ?? ''}${e.stderr ?? ''}`;
  }
} finally {
  rmSync(SANDBOX, { recursive: true, force: true });
  if (!before) rmSync(SCRATCH, { recursive: true, force: true });
}
writeFileSync('/Users/xian/Development/klatch-worktrees/daedalus/.testdata/r393/my393-detached-scratch-planted.out', out);
console.log(`.scratch restored: ${existsSync(SCRATCH) === before}`);
console.log(out.split('\n').filter((l) => /grades, |NOT TRUE:|LIVE —/.test(l)).join('\n'));
