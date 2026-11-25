#!/usr/bin/env node
/**
 * unit-514equalityconsumer — post-hoc 2 of the re-key: the 18 is not comparable to the 14 until the
 * population is held still, and the two sites the widening was supposed to recover are still missed.
 *
 * `posthoc-rekey-prefix-and-binding.mjs` REFUTED P3: own-line consumers under the PREFIX matcher are
 * **18**, against the hand-derived **14**. Two different things can produce that gap and they have
 * opposite meanings:
 *   (a) the population grew — files added after the arm commit carry new sites, in which case 14 was
 *       never wrong, it was read at a different moment; or
 *   (b) the key really sees more than the hand did.
 * Published figures that skip this step are how "the arm under-counted" gets asserted about the other
 * party's number. So: partition the 18 by file existence at the arm commit, the same rung the WHOLE
 * key was already reconciled on, and report the comparable figure.
 *
 * REGISTERED BEFORE THE DRIVE (this file is committed before it is run):
 *   - P7: of the 18, the subset in files that existed at the arm commit is **14**. HIT only on
 *     exactly 14. Any other number corrects the published 14 to that number instead.
 *   - P8: the two sites this seat published as colon-form consumers but which do NOT appear among the
 *     PREFIX consumers — `num(out, 'tracked files read:')`, where the label is the SECOND argument —
 *     are still in the terminal bucket, and a SECOND-ARG key recovers **at least 2** of it.
 *
 * Provenance: every figure here is read out of `captures/POSTHOC-REKEY.out` — the trailing JSON for
 * the site lists, the §6 text for the terminal bucket — and the artefact is identified before it is
 * used (asserted: P3 REFUTED and 18 PREFIX consumers). Nothing is retyped from the screen.
 */
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const CAP = 'docs/research/unit-514equalityconsumer-2026-11-24/captures/POSTHOC-REKEY.out';
const SELF = 'docs/research/unit-514equalityconsumer-2026-11-24/posthoc-rekey-population-partition.mjs';
const ARM = 'docs/research/unit-514equalityconsumer-2026-11-24/arm-equalityconsumer.mjs';
const ARM_COMMIT = '9b9a4283';
const PUBLISHED_HAND_FIGURE = 14;

const out = readFileSync(CAP, 'utf8');

/* ---------------------------------------------------------------- §0 identify the artefact */

const jsonStart = out.indexOf('\n{\n  "provenance"');
const art = jsonStart === -1 ? null : JSON.parse(out.slice(jsonStart));
const p3 = art?.predictions?.find((p) => p.id === 'P3') ?? null;
const identityChecks = [
  ['trailing JSON parsed', Boolean(art)],
  ['P3 is REFUTED in it', p3?.verdict === 'REFUTED'],
  ['consumersPrefix list length is 18', art?.consumersPrefix?.length === 18],
  ['figures.PREFIX.consumersOwnLine is 18', art?.figures?.PREFIX?.consumersOwnLine === 18],
  ['scanner was byte-identical in that drive', art?.provenance?.scannerIdentical === true],
];
console.log('=== §0 IDENTIFY THE ARTEFACT — a capture is only usable once it is identified ===\n');
for (const [what, ok] of identityChecks) console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${what}`);
if (!identityChecks.every(([, ok]) => ok)) {
  console.log('\nREFUSED — the capture is not the drive this script is written against. No figure.');
  process.exit(0);
}

/* ---------------------------------------------------------------- §1 the oracle, KP'd again */

function existedAt(commit, path) {
  try { execFileSync('git', ['cat-file', '-e', `${commit}:${path}`], { stdio: 'ignore' }); return true; }
  catch { return false; }
}
const oracleKp = [
  { path: ARM, want: true, note: 'the arm itself, added IN that commit' },
  { path: 'packages/server/src/db/index.ts', want: true, note: 'long-lived path OUTSIDE docs/' },
  { path: SELF, want: false, note: 'this script, created after that commit' },
].map((k) => ({ ...k, got: existedAt(ARM_COMMIT, k.path) }));
console.log('\n=== §1 EXISTENCE ORACLE — re-KP\'d in this process, not inherited ===\n');
for (const k of oracleKp) console.log(`  ${k.got === k.want ? 'PASS' : 'FAIL'}  ${k.path} -> ${k.got} (want ${k.want}) — ${k.note}`);
if (!oracleKp.every((k) => k.got === k.want)) {
  console.log('\nORACLE REFUSED — no partition printed.');
  process.exit(0);
}

/* ---------------------------------------------------------------- §2 P7: hold the population still */

const rows = art.consumersPrefix.map((r) => ({ ...r, file: r.site.replace(/:\d+$/, '') }));
const presentThen = rows.filter((r) => existedAt(ARM_COMMIT, r.file));
const newFile = rows.filter((r) => !existedAt(ARM_COMMIT, r.file));

console.log('\n=== §2 P7 — the 18 partitioned by file existence at the arm commit ===\n');
console.log(`  PREFIX own-line consumers at HEAD: ${rows.length}`);
console.log(`  PRESENT-THEN ${presentThen.length} · NEW-FILE ${newFile.length}   (sums: ${presentThen.length + newFile.length === rows.length})`);
console.log(`  published hand figure: ${PUBLISHED_HAND_FIGURE}   comparable delta: ${presentThen.length - PUBLISHED_HAND_FIGURE >= 0 ? '+' : ''}${presentThen.length - PUBLISHED_HAND_FIGURE}`);
console.log('\n  NEW-FILE rows (invisible to the hand figure because their files did not exist yet):');
for (const r of newFile) console.log(`    ${r.site}  ${r.shape}  ${r.deciding.slice(0, 120)}`);
console.log('\n  PRESENT-THEN rows:');
for (const r of presentThen) console.log(`    ${r.site}  ${r.shape}  ${r.deciding.slice(0, 120)}`);

/* ---------------------------------------------------------------- §3 P8: the second-argument hole */

/**
 * The §6 bucket, read out of the capture's text. Declared limit: the capture truncates each
 * deciding slice at 150 characters, so a match beyond that is invisible here. Named, not glossed.
 */
const bucketBlock = out.slice(out.indexOf('=== §6 THE TERMINAL BUCKET'), out.indexOf('=== §7 REGISTERED'));
const bucketRows = bucketBlock.split('\n')
  .map((l) => l.match(/^\s{4}(\S+:\d+)\s{2}(.*)$/))
  .filter(Boolean)
  .map((m) => ({ site: m[1], text: m[2] }));
const declaredBucketSize = Number((bucketBlock.match(/under PREFIX \((\d+)\)/) ?? [])[1]);

const QOPEN = "['\"`]";
const NOTQ = "[^'\"`]*";
const LABEL = 'tracked files read';
const QPREFIX = `${QOPEN}${LABEL}${NOTQ}${QOPEN}`;
const SECOND_ARG = new RegExp(`[\\w$.]+\\s*\\(\\s*[^,()]+,\\s*${QPREFIX}`);

// KP before the count, both directions
const secondArgKp = [
  [`read: num(out, '${LABEL}:'),`, true, 'the real shape, from the two sites this seat published'],
  [`const v = num('${LABEL}:');`, false, 'FIRST-argument form — STRINGARG already has it, must not double-count'],
  [`console.log(\`  ${LABEL}: \${n}\`);`, false, 'an emission line — must not be swept in'],
];
console.log('\n=== §3 P8 — the SECOND-ARGUMENT hole, KP first ===\n');
for (const [fixture, want, note] of secondArgKp) {
  const got = SECOND_ARG.test(fixture);
  console.log(`  ${got === want ? 'PASS' : 'FAIL'}  ${got} (want ${want})  ${fixture.trim()}   — ${note}`);
}
const kpOk = secondArgKp.every(([f, w]) => SECOND_ARG.test(f) === w);

const recovered = kpOk ? bucketRows.filter((r) => SECOND_ARG.test(r.text)) : [];
console.log(`\n  terminal-bucket rows parsed out of the capture: ${bucketRows.length} (capture declares ${declaredBucketSize}) — parse complete: ${bucketRows.length === declaredBucketSize}`);
console.log(`  recovered by the SECOND-ARG key: ${recovered.length}`);
for (const r of recovered) console.log(`    ${r.site}  ${r.text.slice(0, 130)}`);
console.log('\n  DECLARED LIMIT: the capture truncates each slice at 150 chars, so a second-argument');
console.log('  form further right than that cannot be seen from here. This is a FLOOR.');

/* ---------------------------------------------------------------- §4 verdicts */

const P = [
  ['P7', `of the 18, the subset in files existing at ${ARM_COMMIT} is exactly ${PUBLISHED_HAND_FIGURE}`,
    presentThen.length === PUBLISHED_HAND_FIGURE, `measured ${presentThen.length}`],
  ['P8', 'a KP-gated SECOND-ARG key recovers at least 2 rows from the terminal bucket',
    kpOk ? recovered.length >= 2 : null, kpOk ? `recovered ${recovered.length}` : 'ungraded: SECOND-ARG KP failed'],
];
console.log('\n=== §4 REGISTERED PREDICTIONS ===\n');
for (const [id, text, v, note] of P) console.log(`  ${(v === null ? 'UNGRADED' : v ? 'HIT' : 'REFUTED').padEnd(9)} ${id}  ${text}  —  ${note}`);

console.log(`\n${JSON.stringify({
  identity: identityChecks.map(([what, ok]) => ({ what, ok })),
  oracleKp,
  p7: {
    prefixAtHead: rows.length,
    presentThen: presentThen.length,
    newFile: newFile.length,
    publishedHandFigure: PUBLISHED_HAND_FIGURE,
    comparableDelta: presentThen.length - PUBLISHED_HAND_FIGURE,
    newFileRows: newFile.map((r) => r.site),
    presentThenRows: presentThen.map((r) => ({ site: r.site, shape: r.shape })),
  },
  p8: {
    bucketRowsParsed: bucketRows.length,
    bucketDeclared: declaredBucketSize,
    parseComplete: bucketRows.length === declaredBucketSize,
    secondArgKpOk: kpOk,
    recovered: recovered.map((r) => r.site),
    declaredLimit: 'capture truncates deciding slices at 150 chars; this is a floor',
  },
  predictions: P.map(([id, text, v, note]) => ({ id, text, verdict: v === null ? 'UNGRADED' : v ? 'HIT' : 'REFUTED', note })),
}, null, 2)}`);
