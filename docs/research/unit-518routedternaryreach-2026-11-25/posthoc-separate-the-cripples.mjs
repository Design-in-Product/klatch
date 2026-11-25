/**
 * `unit-518` — post-hoc, written AFTER the arm's only drive and graded here for the first time.
 *
 * P12 was registered OPEN and came back REFUTED: `KEY-CRIPPLE` and `HAZARD-SIM` both read
 * `A1=false A2=false`. The addendum said that if they did, the arm must say so plainly. This
 * post-hoc asks the next question instead of accepting the saturated column:
 *
 *   **Are the two cripples one cripple, or two causes the VERDICT column cannot separate?**
 *
 * The probe's own `check` receives a DESCRIPTION string with the live figures interpolated into it
 * at call time — `kpOwner` for A1, the whole member list and `ownerCount(R225)` for A2. Capturing
 * the description rather than only the boolean reads the REASON. A saturated verdict hides a
 * reason-level cause; this is that lesson applied to my own arm.
 *
 * PH1 (registered here, before this file was first run): the two cripples differ in A1's reported
 * `kpOwner` — so they are two causes, and the `false/false` pair is a property of the column, not
 * of the cripples.
 *
 * PH2: the HAZARD-SIM `kpOwner` is NOT `(none)`. A dead key yields `(none)` because nothing ever
 * matched; a ternary in the subject yields a REAL BUT WRONG owner, because the walk keeps the last
 * entry it could read. A wrong owner is the more dangerous of the two and the one the routed
 * mechanism produces.
 *
 * Frozen instruments: the probe and `recon.mjs` are read only. The slice and both cripples are
 * rebuilt here from source, identically to the arm, and asserted against the arm's own figures.
 */

import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '../../..');
const PROBE = join(ROOT, 'scripts/probe-round373-the-red-hint-legs-ran-backwards-from-their-witnesses.mts');
const SUBJECT = join(ROOT, 'scripts/sweep-probes.mjs');
const R225 = 'probe-round225-a-citation-is-not-a-call.mts';

const probeSrc = readFileSync(PROBE, 'utf8');
const subjectSrc = readFileSync(SUBJECT, 'utf8');
const { SWEPT } = await import(`file://${SUBJECT}`);

// ── Rebuild the slice exactly as the arm did, and assert it is the same span ─────────────────────
const SLICE_START = "const srcLines = sweepSrc.split('\\n');";
const SLICE_END_ANCHOR = 'SWEPT.filter((s) => s.refusal || s.skip).reduce((n, s) => n + ownerCount(s.file), 0),';
const si = probeSrc.indexOf(SLICE_START);
const ei = probeSrc.indexOf(SLICE_END_ANCHOR);
const closeAt = probeSrc.indexOf('\n);', ei);
if (si === -1 || ei === -1 || closeAt === -1 || ei < si) {
  console.log('ABORT — slice anchors not found or out of order.');
  process.exit(2);
}
let slice = probeSrc.slice(si, closeAt + 3);
// The arm reported 3413 bytes at offsets 5810..9223. Asserted, not assumed: a post-hoc that
// silently re-slices a different span grades a different subject than the arm it is explaining.
const EXPECT = { bytes: 3413, from: 5810, to: 9223 };
console.log('=== SLICE IDENTITY (asserted against the arm\'s own printed figures) ===');
console.log(`  bytes ${slice.length} (arm: ${EXPECT.bytes})  offsets ${si}..${closeAt + 3} (arm: ${EXPECT.from}..${EXPECT.to})`);
if (slice.length !== EXPECT.bytes || si !== EXPECT.from || closeAt + 3 !== EXPECT.to) {
  console.log('ABORT — this is not the span the arm drove.');
  process.exit(2);
}
console.log('  SAME SPAN.');

for (const [from, to, want] of [
  ['const owners: string[] = [];', 'const owners = [];', 1],
  ['const ownerCount = (f: string) =>', 'const ownerCount = (f) =>', 1],
  ['check(', 'CAPTURE(', 2],
]) {
  let n = 0;
  for (let i = slice.indexOf(from); i !== -1; i = slice.indexOf(from, i + 1)) n++;
  if (n !== want) {
    console.log(`ABORT — transform ${JSON.stringify(from)} wanted ${want}, found ${n}.`);
    process.exit(2);
  }
  slice = slice.split(from).join(to);
}

const KEY_FROM = "/^\\s*file: '([^']+)',/";
const KEY_TO = '/^\\s*file: "([^"]+)",/';
let keyN = 0;
for (let i = slice.indexOf(KEY_FROM); i !== -1; i = slice.indexOf(KEY_FROM, i + 1)) keyN++;
if (keyN !== 2) {
  console.log(`ABORT — key-cripple wanted 2 occurrences, found ${keyN}.`);
  process.exit(2);
}
const liveFn = new Function('sweepSrc', 'SWEPT', 'R225', 'CAPTURE', `${slice}\n`);
const deadFn = new Function('sweepSrc', 'SWEPT', 'R225', 'CAPTURE', `${slice.split(KEY_FROM).join(KEY_TO)}\n`);

const PLANT_FROM = `    file: '${R225}',`;
let plantN = 0;
for (let i = subjectSrc.indexOf(PLANT_FROM); i !== -1; i = subjectSrc.indexOf(PLANT_FROM, i + 1)) plantN++;
if (plantN !== 1) {
  console.log(`ABORT — plant target occurs ${plantN}x, wanted 1.`);
  process.exit(2);
}
const hazardText = subjectSrc.replace(PLANT_FROM, `    file: COND ? '${R225}' : 'other.mts',`);

// ── Drive three ways, capturing the DESCRIPTION, not only the boolean ───────────────────────────
const KP_OWNER = /attributes round225's own `expect:` line to (\S+)/;
const A2_COUNT = /\((\d+) of (\d+) declaration line\(s\) found\)/;
const A2_POP = /on the whole declaration population, entry by entry and count by count \((.*?)\), with/s;

const runs = [];
const go = (label, fn, text) => {
  const got = new Map();
  fn(text, SWEPT, R225, (id, desc, ok) => got.set(id, { ok, desc }));
  const a1 = got.get('A1');
  const a2 = got.get('A2');
  const kpOwner = a1 ? (KP_OWNER.exec(a1.desc) || [, '(unparsed)'])[1] : null;
  const a2c = a2 ? A2_COUNT.exec(a2.desc) : null;
  const a2p = a2 ? A2_POP.exec(a2.desc) : null;
  const row = {
    label,
    A1: a1 ? a1.ok : null,
    A2: a2 ? a2.ok : null,
    kpOwner,
    r225Decls: a2c ? Number(a2c[1]) : null,
    totalDecls: a2c ? Number(a2c[2]) : null,
    sourcePop: a2p ? a2p[1] : null,
  };
  runs.push(row);
  return row;
};

const live = go('LIVE', liveFn, subjectSrc);
const dead = go('KEY-CRIPPLE', deadFn, subjectSrc);
const haz = go('HAZARD-SIM', liveFn, hazardText);

console.log('\n=== THE SAME THREE DRIVES, READ AT REASON LEVEL ===\n');
console.log('  arm (verdict level)        A1     A2');
for (const r of runs) console.log(`    ${r.label.padEnd(24)} ${String(r.A1).padEnd(6)} ${String(r.A2)}`);
console.log('\n  post-hoc (reason level)    kpOwner                                          r225 decls / total');
for (const r of runs) {
  console.log(`    ${r.label.padEnd(24)} ${String(r.kpOwner).padEnd(48)} ${r.r225Decls} / ${r.totalDecls}`);
}
console.log('\n  the member list each drive actually built:');
for (const r of runs) console.log(`    ${r.label.padEnd(14)} ${r.sourcePop}`);

const ph = [];
const grade = (id, claim, expectation, actual, hit) => {
  ph.push({ id, hit });
  console.log(`\n[${id}] ${hit ? 'HIT' : 'REFUTED'}  ${claim}`);
  console.log(`      registered: ${expectation}`);
  console.log(`      actual:     ${actual}`);
};

grade(
  'PH1',
  'the two cripples are TWO CAUSES the verdict column cannot separate: they differ in A1\'s reported kpOwner',
  'KEY-CRIPPLE kpOwner !== HAZARD-SIM kpOwner, while both verdict pairs are false/false',
  `verdicts ${dead.A1}/${dead.A2} vs ${haz.A1}/${haz.A2} (identical); kpOwner ` +
    `${JSON.stringify(dead.kpOwner)} vs ${JSON.stringify(haz.kpOwner)}`,
  dead.A1 === haz.A1 && dead.A2 === haz.A2 && dead.kpOwner !== haz.kpOwner,
);

grade(
  'PH2',
  'a dead key yields (none); a ternary in the SUBJECT yields a real-but-wrong owner, because the walk keeps the last entry it could read',
  'KEY-CRIPPLE kpOwner === "(none)" and HAZARD-SIM kpOwner is neither "(none)" nor R225',
  `KEY-CRIPPLE ${JSON.stringify(dead.kpOwner)}; HAZARD-SIM ${JSON.stringify(haz.kpOwner)}; ` +
    `R225 is ${JSON.stringify(R225)}`,
  dead.kpOwner === '(none)' && haz.kpOwner !== '(none)' && haz.kpOwner !== R225,
);

grade(
  'PH3',
  'the LIVE drive is unchanged by this post-hoc existing: it still reads true/true with kpOwner = R225 and 2 of 2 declarations',
  'A1 true, A2 true, kpOwner === R225, 2 of 2',
  `A1=${live.A1} A2=${live.A2} kpOwner=${JSON.stringify(live.kpOwner)} ${live.r225Decls} of ${live.totalDecls}`,
  live.A1 === true && live.A2 === true && live.kpOwner === R225 && live.r225Decls === 2 && live.totalDecls === 2,
);

console.log('\n=== SUMMARY ===');
for (const p of ph) console.log(`  ${p.hit ? 'HIT    ' : 'REFUTED'}  ${p.id}`);
console.log(`\n  ${ph.filter((p) => p.hit).length} of ${ph.length} post-hoc predictions HIT.`);
console.log('\n  P12 stays REFUTED. It was registered OPEN and it lost honestly: the verdict pair');
console.log('  does NOT separate the two cripples. What this post-hoc adds is that the pair being');
console.log('  identical was a property of the COLUMN and not of the cripples — and that the');
console.log('  dangerous direction is the one the verdict column flattens into the same cell.');
