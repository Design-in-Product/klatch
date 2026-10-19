/**
 * Round 417 — how big is the @anthropic-ai/sdk jump from Klatch's pin to latest,
 * and does anything in between break us?
 *
 * The heading key holds BOTH spellings the changelog uses, because the first
 * version of it held only the bare one and silently missed every heading newer
 * than 0.132.0 — including the latest. Known positive for each shape is asserted
 * before any count is printed (a key with no KP in the real shape is not a key).
 */
import fs from 'node:fs';

// Changelog path is an argument, not a constant: the instrument has to be
// drivable from the directory it is committed in, and the drive that produced
// the recorded .out used a cache under .testdata/ (gitignored). Re-fetch with:
//   curl -sL https://raw.githubusercontent.com/anthropics/anthropic-sdk-typescript/main/CHANGELOG.md -o CHANGELOG.md
// then: node sdk-gap-0122-to-0135.mjs CHANGELOG.md
const CHANGELOG = process.argv[2] ?? '.testdata/round417-sdk-changelog.md';
if (!fs.existsSync(CHANGELOG)) {
  console.log(`REFUSED — no changelog at ${CHANGELOG}. Pass one as argv[2] (see header).`);
  process.exit(2);
}
const t = fs.readFileSync(CHANGELOG, 'utf8');
const lines = t.split('\n');

// Both shapes, one key: "## 0.132.0 (date)" and "## [0.135.0](url) (date)".
const HEAD_RE = /^##\s+\[?(\d+\.\d+\.\d+)\]?/;

// Known positives, one per shape, as the literal source lines they occur in.
const KP_LINKED = '## [0.135.0](https://github.com/anthropics/anthropic-sdk-typescript/compare/sdk-v0.134.0...sdk-v0.135.0) (2026-10-15)';
const KP_BARE = '## 0.132.0 (2026-10-07)';
const KP_NEG = '### Features'; // must NOT read as a version heading

const kpLinked = HEAD_RE.exec(KP_LINKED)?.[1];
const kpBare = HEAD_RE.exec(KP_BARE)?.[1];
const kpNeg = HEAD_RE.exec(KP_NEG)?.[1];
console.log('KP linked shape ->', kpLinked, kpLinked === '0.135.0' ? 'OK' : 'FAIL');
console.log('KP bare shape   ->', kpBare, kpBare === '0.132.0' ? 'OK' : 'FAIL');
console.log('KP negative     ->', kpNeg, kpNeg === undefined ? 'OK (refused)' : 'FAIL (over-read)');
const kpOk = kpLinked === '0.135.0' && kpBare === '0.132.0' && kpNeg === undefined;
if (!kpOk) {
  console.log('VERDICT: KEY REFUSED — not printing a figure from a key that fails its own known positives');
  process.exit(1);
}

// Both KPs must also occur in the file, or they are hand-typed analogies.
for (const [name, kp] of [['linked', KP_LINKED], ['bare', KP_BARE]]) {
  const occurs = lines.filter((l) => l === kp).length;
  console.log(`KP ${name} occurs in changelog exactly once:`, occurs === 1, `(${occurs})`);
  if (occurs !== 1) { console.log('VERDICT: REFUSED — KP is not a slice of the real file'); process.exit(1); }
}

const heads = [];
lines.forEach((l, i) => { const m = HEAD_RE.exec(l); if (m) heads.push({ v: m[1], i }); });
console.log('total version headings:', heads.length);

const PIN = '0.122.0';
const LATEST = '0.135.0';
const iLatest = heads.findIndex((h) => h.v === LATEST);
const iPin = heads.findIndex((h) => h.v === PIN);
console.log(`index of ${LATEST}:`, iLatest, `| index of ${PIN}:`, iPin);
if (iLatest < 0 || iPin < 0) { console.log('VERDICT: REFUSED — an endpoint is missing'); process.exit(1); }

// Changelog is newest-first.
const span = heads.slice(iLatest, iPin);
console.log('versions strictly above the pin:', span.length);
console.log(span.map((h) => h.v).join(', '));

const seg = lines.slice(heads[iLatest].i, heads[iPin].i);
fs.writeFileSync('.testdata/round417-sdk-segment.md', seg.join('\n'));
console.log('segment lines:', seg.length);

// What would actually break us: BREAKING markers, and removals/renames.
const hits = {
  breaking: seg.filter((l) => /BREAKING|breaking change/i.test(l)),
  removed: seg.filter((l) => /\bremove[sd]?\b/i.test(l)),
  renamed: seg.filter((l) => /\brename[sd]?\b/i.test(l)),
  deprecated: seg.filter((l) => /\bdeprecat/i.test(l)),
};
for (const [k, v] of Object.entries(hits)) {
  console.log(`--- ${k}: ${v.length} line(s) ---`);
  v.forEach((l) => console.log('   ', l.trim().slice(0, 170)));
}

// Control: the same keys over a segment we expect to be quiet on 'breaking'
// would be meaningless; instead assert the keys CAN fire, on a driven string.
const CTRL = ['* **api:** BREAKING CHANGE: removed the foo param', '* renamed bar to baz', '* deprecate qux'];
console.log('CONTROL — keys fire on driven text:',
  /BREAKING/i.test(CTRL[0]), /\bremove[sd]?\b/i.test(CTRL[0]), /\brename[sd]?\b/i.test(CTRL[1]), /\bdeprecat/i.test(CTRL[2]));

console.log('SUMMARY: pin', PIN, '-> latest', LATEST, '|', span.length, 'releases |',
  hits.breaking.length, 'breaking,', hits.removed.length, 'removed,', hits.renamed.length, 'renamed,', hits.deprecated.length, 'deprecated');
