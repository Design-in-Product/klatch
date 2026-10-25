// Round 451 recon — size and shape of the committed `.out` corpus at a pinned rev.
// Population selected with `git ls-tree` at a stamped rev, never `ls-files` (409).
import { execFileSync } from 'node:child_process';

const git = (args) => execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
const REV = git(['rev-parse', 'HEAD']).trim();
console.log('REV=' + REV);

const names = git(['ls-tree', '-r', '--name-only', REV]).split('\n').filter(Boolean);
const outs = names.filter((n) => n.endsWith('.out'));
console.log('tree files=' + names.length + ' · .out=' + outs.length);
console.log('under round451=' + outs.filter((n) => n.includes('round451')).length);

let bytes = 0;
let lines = 0;
for (const n of outs) {
  const body = git(['cat-file', 'blob', REV + ':' + n]);
  bytes += Buffer.byteLength(body);
  lines += body.split('\n').length;
}
console.log('bytes=' + bytes + ' · lines=' + lines);

// Does a `FAIL`-spelled row actually occur? That is the cell that decides whether 446's extra
// capability is realized or vacuous on real data.
const re446 = /^(?: ok |FAIL|REF ) G/;
const re448 = /^(?: ok |RED |REF ) ([A-Z][A-Z0-9]*)  /;
let both = 0; let only446 = 0; let only448 = 0; let neither = 0;
const sample446 = []; const sample448 = [];
for (const n of outs) {
  for (const l of git(['cat-file', 'blob', REV + ':' + n]).split('\n')) {
    const a = re446.test(l); const b = re448.test(l);
    if (a && b) both++;
    else if (a) { only446++; if (sample446.length < 4) sample446.push([n, l]); }
    else if (b) { only448++; if (sample448.length < 4) sample448.push([n, l]); }
    else neither++;
  }
}
console.log('both=' + both + ' only446=' + only446 + ' only448=' + only448 + ' neither=' + neither);
console.log('sum check=' + (both + only446 + only448 + neither === lines));
console.log('--- only446 samples ---');
for (const [n, l] of sample446) console.log(n + ' :: ' + JSON.stringify(l));
console.log('--- only448 samples ---');
for (const [n, l] of sample448) console.log(n + ' :: ' + JSON.stringify(l));
