/**
 * Compare two drive recordings on their arm lines only, dropping each file's
 * own header (which legitimately differs: it names the cripple). Sliced from
 * the files rather than hand-typed, because a hand-typed reader is green on its
 * own slice.
 */
import fs from 'fs';
import path from 'path';

const dir = path.dirname(new URL(import.meta.url).pathname);
const armLines = (f) =>
  fs
    .readFileSync(path.join(dir, f), 'utf8')
    .split('\n')
    .filter((l) => /^\[(E[1-5]|C|D)\]/.test(l));

const [a, b] = process.argv.slice(2);
const la = armLines(a);
const lb = armLines(b);
console.log(`${a}: ${la.length} arm lines`);
console.log(`${b}: ${lb.length} arm lines`);

if (la.length !== lb.length) {
  console.log(`DIFFER: line counts ${la.length} vs ${lb.length}`);
  process.exit(1);
}
const diffs = la.map((l, i) => [l, lb[i]]).filter(([x, y]) => x !== y);
if (!diffs.length) {
  console.log(`IDENTICAL on all ${la.length} arm lines — no arm in this set can tell them apart.`);
} else {
  console.log(`DIFFER on ${diffs.length} of ${la.length} arm lines:`);
  for (const [x, y] of diffs) console.log(`  - ${a}: ${x}\n  + ${b}: ${y}`);
}
