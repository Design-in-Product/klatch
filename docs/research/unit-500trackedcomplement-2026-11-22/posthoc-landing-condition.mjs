// unit-500trackedcomplement post-hoc 3 — P6, the landing condition. Daedalus, 2026-11-22.
//
// `unit-499`'s P5 was a BYTE-IDENTITY condition because a docblock patch adds no files. This unit
// adds three `.mjs` files, so byte-identity here would be false by construction and copying that
// predicate would have been the stale-answer-key defect. P6 is therefore the narrower claim actually
// available: the report differs in the `tracked files read` digits and NOWHERE else, with the byte
// LENGTH preserved (the count stays four digits) and none of this unit's paths in any published
// list.
//
// Diffs the two committed captures rather than re-driving, so what is graded is what was recorded.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const CAP = 'docs/research/unit-500trackedcomplement-2026-11-22/captures';
const pre = readFileSync(join(process.cwd(), CAP, 'gate-pre-commit.out'), 'utf8');
const post = readFileSync(join(process.cwd(), CAP, 'gate-post-commit.out'), 'utf8');

const preL = pre.split('\n');
const postL = post.split('\n');
const READ = /^(\s*tracked files read: )(\d+)$/;

console.log(`pre  : ${Buffer.byteLength(pre)} bytes, ${preL.length - 1} lines`);
console.log(`post : ${Buffer.byteLength(post)} bytes, ${postL.length - 1} lines`);

const diffs = [];
if (preL.length !== postL.length) diffs.push(`line count ${preL.length} vs ${postL.length}`);
for (let i = 0; i < Math.max(preL.length, postL.length); i++) {
  if (preL[i] !== postL[i]) diffs.push(`line ${i + 1}: ${JSON.stringify(preL[i])} -> ${JSON.stringify(postL[i])}`);
}
console.log(`\ndiffering lines: ${diffs.length}`);
for (const d of diffs) console.log('  ', d);

const onlyRead = diffs.length === 1 && READ.test(preL.find((l, i) => l !== postL[i]) ?? '');
const preRead = Number(pre.match(/tracked files read: (\d+)/)[1]);
const postRead = Number(post.match(/tracked files read: (\d+)/)[1]);
const sameLength = Buffer.byteLength(pre) === Buffer.byteLength(post);
const sameDigits = String(preRead).length === String(postRead).length;
const myPaths = postL.filter((l) => l.includes('unit-500trackedcomplement'));

console.log(`\nread figure              : ${preRead} -> ${postRead}  (+${postRead - preRead}, this unit's three .mjs files)`);
console.log(`byte length preserved    : ${sameLength}  (${Buffer.byteLength(pre)} / ${Buffer.byteLength(post)})`);
console.log(`digit count preserved    : ${sameDigits}`);
console.log(`only the read line moved : ${onlyRead}`);
console.log(`this unit's paths in the published report : ${myPaths.length}`);
for (const p of myPaths) console.log('  ', p);

for (const row of ['population (compares against both braces)', 'MARKED', 'GUARDED', 'UNGUARDED', 'baseline entries']) {
  const a = preL.find((l) => l.includes(row));
  const b = postL.find((l) => l.includes(row));
  console.log(`  row ${row.padEnd(42)} ${a === b ? 'unchanged' : `MOVED: ${a} -> ${b}`}`);
}

const P6 = onlyRead && sameLength && sameDigits && myPaths.length === 0 && postRead === preRead + 3;
console.log(`\nP6: ${P6 ? 'TRUE' : 'FALSE'}`);
