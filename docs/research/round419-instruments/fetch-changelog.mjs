#!/usr/bin/env node
// Round 419 — fetch the SDK changelog and record its provenance, so §3's input is not taken on
// trust from either seat's cache. Theseus published sha256
// d400af1d16903a5604d18343018ea8c2a9858de907e92f68f46f859fc7309391 / 3524 lines for his fetch;
// this prints the fetched digest beside his, and beside my own round417 cache's digest, so a
// disagreement about the INPUT cannot be mistaken for a disagreement about the KEY.
//
// Writes an absolute path (round418 §5 found my round417 instrument writing a relative one).
import { createHash } from 'node:crypto';
import { writeFileSync, existsSync, readFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';

const REPO = path.resolve(import.meta.dirname, '../../..');
const OUT = path.join(REPO, '.testdata', 'round419-sdk-changelog.md');
const HIS_SHA = 'd400af1d16903a5604d18343018ea8c2a9858de907e92f68f46f859fc7309391';
const HIS_LINES = 3524;
const URL = 'https://raw.githubusercontent.com/anthropics/anthropic-sdk-typescript/main/CHANGELOG.md';

const sha = (s) => createHash('sha256').update(s).digest('hex');
const lineCount = (s) => s.split('\n').length;

mkdirSync(path.dirname(OUT), { recursive: true });

let fetched = null, fetchErr = null;
try {
  const r = await fetch(URL, { redirect: 'follow' });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  fetched = await r.text();
} catch (e) { fetchErr = e.message; }

console.log('# Round 419 — §3 input provenance');
console.log('');
console.log(`url: ${URL}`);
console.log(`fetched at: ${new Date().toISOString()}`);

if (fetched) {
  writeFileSync(OUT, fetched);
  console.log(`FETCH: ok, ${fetched.length} bytes written to ${OUT}`);
  console.log(`  sha256: ${sha(fetched)}`);
  console.log(`  lines:  ${lineCount(fetched)}`);
  console.log(`  matches his published sha256: ${sha(fetched) === HIS_SHA}`);
  console.log(`  matches his published lines (${HIS_LINES}): ${lineCount(fetched) === HIS_LINES}`);
} else {
  console.log(`FETCH: FAILED — ${fetchErr}`);
}

const MINE = path.join(REPO, '.testdata', 'round417-sdk-changelog.md');
if (existsSync(MINE)) {
  const m = readFileSync(MINE, 'utf8');
  console.log('');
  console.log(`my round417 cache: ${MINE}`);
  console.log(`  sha256: ${sha(m)}`);
  console.log(`  lines:  ${lineCount(m)}`);
  console.log(`  matches his published sha256: ${sha(m) === HIS_SHA}`);
  console.log(`  identical to this fire's fetch: ${fetched ? sha(m) === sha(fetched) : 'UNMEASURED (fetch failed)'}`);
} else {
  console.log('');
  console.log('my round417 cache: ABSENT');
}

// A digest is only evidence if this script can tell a wrong one from a right one.
console.log('');
console.log(`CONTROL — sha256 separates: sha('a')===sha('b'): ${sha('a') === sha('b')} (must be false)`);
if (sha('a') === sha('b')) process.exit(1);
if (!fetched && !existsSync(MINE)) { console.log('VERDICT: REFUSED — no input available.'); process.exit(2); }
