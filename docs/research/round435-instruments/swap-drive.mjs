// Drive an instrument against the PRE-CURE module by swapping the committed slice over the
// live module, then restoring it byte-identical. The restore is asserted by sha256, and the
// swap is asserted to have actually changed the file (347/389/422: a mutation counterfactual
// needs its target asserted, and the FIGURE must move, not just the edit land).
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';

const REPO = '/Users/xian/Development/klatch-worktrees/theseus';
const MOD = `${REPO}/docs/research/round430-instruments/refusal-convention.mjs`;
const SLICE = `${REPO}/docs/research/round434-instruments/precure-refusal-convention.sliced.mjs`;
const TARGET = process.argv[2];

const sha = (s) => createHash('sha256').update(s).digest('hex').slice(0, 16);
const orig = readFileSync(MOD, 'utf8');
const pre = readFileSync(SLICE, 'utf8');
const origSha = sha(orig);

const verdicts = (t) => {
  const g = t.match(/^GATE: (.+)$/m);
  const p = t.match(/^PREDICTIONS: (.+)$/m);
  return { gate: g === null ? null : g[1].trim(), pred: p === null ? null : p[1].trim() };
};
const drive = () => {
  try {
    return execFileSync('node', [TARGET], { cwd: REPO, encoding: 'utf8', maxBuffer: 1 << 28 });
  } catch (e) { return String(e.stdout ?? '') + String(e.stderr ?? ''); }
};

const post = drive();
let preOut = null;
let swapLanded = null;
try {
  writeFileSync(MOD, pre);
  swapLanded = sha(readFileSync(MOD, 'utf8')) === sha(pre) && sha(pre) !== origSha;
  preOut = drive();
} finally {
  writeFileSync(MOD, orig);
}
const restored = sha(readFileSync(MOD, 'utf8')) === origSha;

const vPost = verdicts(post);
const vPre = preOut === null ? { gate: null, pred: null } : verdicts(preOut);
console.log(`target            ${TARGET}`);
console.log(`swap landed       ${swapLanded} (orig sha ${origSha}, slice sha ${sha(pre)})`);
console.log(`restored exactly  ${restored}`);
console.log(`PRE-cure module   GATE ${vPre.gate} | PREDICTIONS ${vPre.pred}`);
console.log(`LIVE (cured)      GATE ${vPost.gate} | PREDICTIONS ${vPost.pred}`);
console.log(`figure MOVED      ${vPre.gate !== vPost.gate || vPre.pred !== vPost.pred}`);
if (!restored) { console.log('!!! RESTORE FAILED'); process.exitCode = 2; }
