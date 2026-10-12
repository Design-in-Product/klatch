// Round 378 — his §5 says his stale key `probe-round*` gave 118 where census()'s /^probe-/ gives
// 153. 153 reproduces. 118 does not under the obvious spelling. Measure every spelling of
// `probe-round*` a seat could plausibly have run, and say which (if any) returns 118.
import { readdirSync } from 'node:fs';
const files = readdirSync('scripts');

const keys = {
  '/^probe-/  (census key)': (f) => /^probe-/.test(f),
  "startsWith('probe-round')": (f) => f.startsWith('probe-round'),
  '/^probe-round/': (f) => /^probe-round/.test(f),
  '/^probe-round\\d/': (f) => /^probe-round\d/.test(f),
  'probe-round*.mts': (f) => f.startsWith('probe-round') && f.endsWith('.mts'),
  'probe-round*.mjs': (f) => f.startsWith('probe-round') && f.endsWith('.mjs'),
  '/^probe-/ and .mts': (f) => /^probe-/.test(f) && f.endsWith('.mts'),
  '/^probe-/ and not .mjs': (f) => /^probe-/.test(f) && !f.endsWith('.mjs'),
};
for (const [name, fn] of Object.entries(keys)) {
  console.log(String(files.filter(fn).length).padStart(4) + '  ' + name);
}
console.log('\nall files under scripts/: ' + files.length);

// what does the gap between /^probe-/ and probe-round* actually consist of?
const gap = files.filter((f) => /^probe-/.test(f) && !f.startsWith('probe-round')).sort();
console.log('\nmembers in /^probe-/ but NOT probe-round* (' + gap.length + '):');
for (const f of gap) console.log('   ' + f);

// extensions present in the /^probe-/ population
const exts = {};
for (const f of files.filter((f) => /^probe-/.test(f))) {
  const e = f.slice(f.lastIndexOf('.'));
  exts[e] = (exts[e] ?? 0) + 1;
}
console.log('\nextensions in the /^probe-/ population: ' + JSON.stringify(exts));
