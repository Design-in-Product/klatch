// Drive an instrument against an arbitrary committed SLICE of the module by swapping the slice
// over the live module, then restoring it byte-identical. Round 435's copy of this hardcoded the
// round434 slice; this one takes the slice as an argument, because Round 437's question is about
// the module as it stood at `e2a20e75` — pre his Round 436 cure — not at `839e6063`.
//
// The restore is asserted by sha256 and the swap is asserted to have actually changed the file
// (347/389/422: a mutation counterfactual needs its target asserted, and the FIGURE must move, not
// just the edit land).
//
// usage: node swap-drive.mjs <target-instrument> <slice-path>
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';

const REPO = '/Users/xian/Development/klatch-worktrees/theseus';
const MOD = `${REPO}/docs/research/round430-instruments/refusal-convention.mjs`;
const TARGET = process.argv[2];
const SLICE = `${REPO}/${process.argv[3]}`;

const sha = (s) => createHash('sha256').update(s).digest('hex').slice(0, 16);
const orig = readFileSync(MOD, 'utf8');
const pre = readFileSync(SLICE, 'utf8');
const origSha = sha(orig);

const redsOf = (t) => {
  const l = t.split('\n').find((x) => x.startsWith('GATE:')) ?? '';
  const m = l.match(/FALSE: (.+)$/);
  return { gate: l.trim(), reds: m === null ? [] : m[1].split(',').map((s) => s.trim()).sort() };
};
const drive = () => {
  try { return execFileSync('node', [TARGET], { cwd: REPO, encoding: 'utf8', maxBuffer: 1 << 28 }); }
  catch (e) { return String(e.stdout ?? '') + String(e.stderr ?? ''); }
};

const post = drive();
let preOut = null;
let swapLanded = null;
let restored = null;
try {
  writeFileSync(MOD, pre);
  swapLanded = readFileSync(MOD, 'utf8') === pre && pre !== orig;
  preOut = drive();
} finally {
  writeFileSync(MOD, orig);
  restored = sha(readFileSync(MOD, 'utf8')) === origSha;
}

const a = redsOf(post);
const b = preOut === null ? null : redsOf(preOut);
console.log(`target            ${TARGET}`);
console.log(`slice             ${process.argv[3]}`);
console.log(`swap landed       ${swapLanded}`);
console.log(`restored exactly  ${restored}`);
console.log(`LIVE (cured)      ${a.gate}`);
console.log(`PRE-cure slice    ${b === null ? 'UNREADABLE' : b.gate}`);
console.log(`red at cured      ${JSON.stringify(a.reds)}`);
console.log(`red at pre-cure   ${b === null ? 'null' : JSON.stringify(b.reds)}`);
console.log(`reddened BY cure  ${b === null ? 'null' : JSON.stringify(a.reds.filter((x) => !b.reds.includes(x)))}`);
console.log(`red on both sides ${b === null ? 'null' : JSON.stringify(a.reds.filter((x) => b.reds.includes(x)))}`);
if (preOut !== null) {
  console.log('');
  console.log('--- PRE-CURE DRIVE, verbatim ---');
  console.log(preOut);
}
