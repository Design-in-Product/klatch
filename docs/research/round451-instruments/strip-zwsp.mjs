// One-off: strip any stray zero-width space this fire's coord write introduced, and REPORT the
// count rather than only the fact of running (356 — gate on the figure, not on exit 0).
import { readFileSync, writeFileSync } from 'node:fs';

const p = process.argv[2];
const zwsp = String.fromCharCode(0x200b);
const before = readFileSync(p, 'utf8');
const n = before.split(zwsp).length - 1;
writeFileSync(p, before.split(zwsp).join(''));
const after = readFileSync(p, 'utf8');
console.log(`removed=${n} remaining=${after.split(zwsp).length - 1} bytes ${before.length}->${after.length}`);
