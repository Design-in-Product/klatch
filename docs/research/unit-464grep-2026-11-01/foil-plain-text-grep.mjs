// unit-464grep — FOIL. A detector's own count is not evidence about its blindness.
//
// `grep-census.mjs` reports N GREP sites by lexing, extracting call spans, and requiring the
// span to be a rev-producing git call. Every one of those three steps can drop a real site.
// This foil keys on the crudest thing that cannot: the literal text `--grep` in the file source
// at the same stamped rev.
//
// It is a FOIL, not a replacement — it over-reports by construction (a `--grep` inside a comment
// or a prose string counts). The point is the MEMBER LIST, not the number: any file the foil
// finds that the detector does not is a candidate blindness, and every one is hand-read.
//
// Member lists are compared, not counts: two different sets can have the same size.

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const HERE = dirname(new URL(import.meta.url).pathname);
const REPO = resolve(HERE, '../../..');
const SELF_DIR_REL = 'docs/research/unit-464grep-2026-11-01';
const REV = readFileSync(`${HERE}/baseline.rev`, 'utf8').trim();

const git = (...args) => execFileSync('git', ['-C', REPO, ...args], {
  encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 256 * 1024 * 1024,
});

const names = git('ls-tree', '-r', '--name-only', REV, '--', 'docs/research', 'scripts')
  .split('\n').filter(Boolean)
  .filter((f) => f.endsWith('.mjs'))
  .filter((f) => !f.startsWith(SELF_DIR_REL + '/'));

const occurrences = [];
for (const f of names) {
  const src = git('show', `${REV}:${f}`);
  // every occurrence, with its 1-indexed line, so a file with two sites is visible as two
  const lines = src.split('\n');
  lines.forEach((l, i) => {
    let from = 0;
    for (;;) {
      const j = l.indexOf('--grep', from);
      if (j < 0) break;
      occurrences.push({ path: f, line: i + 1, text: l.trim().slice(0, 150) });
      from = j + 1;
    }
  });
}

const det = JSON.parse(readFileSync(`${HERE}/grep.json`, 'utf8'));
if (det.cripple !== null) {
  console.log(`REFUSED: grep.json was written by the ${det.cripple} cripple arm. Re-drive the`);
  console.log('         no-cripple census before grading the detector against this foil.');
  process.exit(2);
}
if (det.rev !== REV) {
  console.log(`REFUSED: grep.json rev ${det.rev.slice(0, 8)} != foil rev ${REV.slice(0, 8)}.`);
  console.log('         A detector compared against a foil must read the same tree.');
  process.exit(2);
}

const foilFiles = [...new Set(occurrences.map((o) => o.path))].sort();
const detFiles = [...new Set(det.sites.map((s) => s.path))].sort();

console.log(`population rev     ${REV.slice(0, 8)}`);
console.log(`files scanned      ${names.length}  (self dir excluded)`);
console.log(`foil occurrences   ${occurrences.length} of the literal text \`--grep\` in ${foilFiles.length} file(s)`);
console.log(`detector sites     ${det.sites.length} in ${detFiles.length} file(s)`);
console.log('');

const onlyFoil = foilFiles.filter((f) => !detFiles.includes(f));
const onlyDet = detFiles.filter((f) => !foilFiles.includes(f));

console.log(`FOIL-ONLY files (candidate detector blindness): ${onlyFoil.length}`);
for (const f of onlyFoil) {
  console.log(`  ${f}`);
  for (const o of occurrences.filter((x) => x.path === f)) console.log(`      :${o.line}  ${o.text}`);
}
console.log(`DETECTOR-ONLY files (impossible unless the detector invents): ${onlyDet.length}`);
for (const f of onlyDet) console.log(`  ${f}`);

console.log('');
console.log('Every foil occurrence, for hand reading:');
for (const o of occurrences) console.log(`  ${o.path}:${o.line}  ${o.text}`);

// A set-equal file list is the gate; the per-file occurrence COUNT is reported separately
// because the foil counts comment and prose mentions the detector correctly ignores.
const setsEqual = onlyFoil.length === 0 && onlyDet.length === 0;
console.log('');
console.log('per-file occurrence counts, foil vs detector:');
for (const f of [...new Set([...foilFiles, ...detFiles])].sort()) {
  const a = occurrences.filter((o) => o.path === f).length;
  const b = det.sites.filter((s) => s.path === f).length;
  console.log(`  ${a === b ? ' ' : '*'} foil ${String(a).padStart(3)}  detector ${String(b).padStart(3)}  ${f}`);
}
console.log('  (* = differs; a difference is not by itself a defect — the foil counts comments)');

console.log('');
console.log(`FOILVERDICT/${setsEqual ? 0 : 1}  ${setsEqual ? 'file-level member lists are set-equal' : 'member lists differ — every differing file is printed above and must be hand-read'}`);
process.exit(setsEqual ? 0 : 1);
