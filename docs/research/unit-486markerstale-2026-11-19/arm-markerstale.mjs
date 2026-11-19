#!/usr/bin/env node
/**
 * unit-486markerstale arm — **size the blast radius of the marker-staleness check Daedalus offered
 * to build on this seat's word, before the word is given.**
 *
 * His 11/19 WORK memo §2: *"7 of the 8 departures were MARKED … those seven markers now grant an
 * exemption nothing needs … Theseus — four of those seven are yours or mine as author, so if you
 * want the marker-staleness check it is a two-seat decision and I will build it on your word."*
 *
 * **His 7 is a DELTA — the members his narrowing moved out of the population on one fire. A
 * staleness check does not redden on a delta; it reddens on every tracked file that carries a
 * marker and is not in the population, whatever put it there.** Those are different sets and only
 * one of them is a blast radius. That is the whole subject.
 *
 * THREE KEYS, all captured out of `scripts/verify-decl-body-slicers.mjs`, none re-typed:
 *
 *   K-MARKER   the gate's own `MARKER` regex, read from RAW text as the gate reads it.
 *   K-POP      the gate's live population key: both brace comparisons present in
 *              `blankLongStrings(raw, N)`, with N captured from the gate's own call site.
 *   K-POP-OLD  the PRE-narrowing reading, `stripSource(raw, false)` — strings KEPT — so a marker
 *              made stale by this morning's narrowing can be told from one that was never needed
 *              under any reading. This is the discrimination the delta cannot make.
 *
 * R1 forbids removing a single marker: the decision this informs is *whether a published instrument
 * may be edited to drop a dead marker*, and a fire that answers it by doing it has destroyed its own
 * subject. This arm is READ-ONLY on the tree.
 *
 * KP set: three hand-built fixtures, each asserted against its OWN registered side, per KP. Corner
 * coverage is reported and is explicitly NOT the gate — `unit-483` §5 showed a broken KP can occupy
 * its corner by not being in the population at all, which a coverage check passes.
 *
 * brace-slicer-deliberate: this arm carries brace comparisons inside KP source strings on purpose —
 * they are the subject being classified, not a reader being used. (Requirement 3 of the gate.)
 * Note for the next seat: this marker is itself in scope of what this arm measures. It is in a
 * docblock, 0 of its brace comparisons are on this line, and the arm counts it.
 */

import { readFileSync } from 'node:fs';
import { join, dirname, resolve, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '../../..');
const GATE_REL = 'scripts/verify-decl-body-slicers.mjs';
const GATE = join(ROOT, GATE_REL);
const HIS_RESULTS = join(ROOT, 'docs/research/unit-484popnarrow-2026-11-19/RESULTS.md');

const die = (code, msg) => { console.error(`\n${msg}`); process.exit(code); };
const capture = (label, re, src) => {
  const m = src.match(re);
  if (!m) die(3, `CAPTURE-FAILED — ${label}. R3: a capture failure is rc=3, never a fallback.`);
  return m[1];
};
const pct = (n, d) => (d ? `${((n / d) * 100).toFixed(1)}%` : 'n/a');

/* ============================================================ captured keys */
const gateSrc = readFileSync(GATE, 'utf8');
const cmpSrc = capture('cmp factory', /const cmp = (\(ch\) => new RegExp\([\s\S]*?\));\n/, gateSrc);
// eslint-disable-next-line no-eval
const cmp = eval(cmpSrc);
const braceChars = {};
for (const n of ['OPEN_BRACE', 'CLOSE_BRACE']) {
  braceChars[n] = capture(n, new RegExp(`const ${n} = cmp\\('(.)'\\)`), gateSrc);
}
const OPEN_BRACE = cmp(braceChars.OPEN_BRACE);
const CLOSE_BRACE = cmp(braceChars.CLOSE_BRACE);
const MARKER = new RegExp(capture('MARKER', /const MARKER = \/(.*?)\/;/, gateSrc));
const MARKER_G = new RegExp(MARKER.source, 'g');
const EXTS = new Set(capture('EXTS', /const EXTS = new Set\(\[([^\]]*)\]\)/, gateSrc)
  .split(',').map((s) => s.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean));
const SELF = new Set(capture('SELF', /const SELF = new Set\(\[([\s\S]*?)\]\);/, gateSrc)
  .split(',').map((s) => s.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean));
const MINLEN = Number(capture('blankLongStrings minLen at the gate\'s call site',
  /const code = blankLongStrings\(raw, (\d+)\);/, gateSrc));
if (!Number.isFinite(MINLEN) || MINLEN < 1) die(3, 'CAPTURE-FAILED — minLen is not a number');
const { stripSource, blankLongStrings } = await import(join(ROOT, 'scripts/lib/strip-source.mjs'));

// R3 sanity: the captured keys must be able to report BOTH answers, or every verdict below is
// vacuous. `unit-483` §5's lesson one level up from the KPs.
if (!OPEN_BRACE.test("if (c === '{') d += 1;") || OPEN_BRACE.test('if (c === x) d += 1;')) {
  die(3, 'CAPTURE-FAILED — OPEN_BRACE does not discriminate');
}
if (!MARKER.test('// brace-slicer-deliberate: a reason') || MARKER.test('// brace-slicer-deliberate:')) {
  die(3, 'CAPTURE-FAILED — MARKER does not discriminate (it requires a reason token)');
}

console.log('unit-486markerstale — the marker-staleness check\'s blast radius, measured');
console.log(`  keys captured from ${GATE_REL}: cmp · OPEN_BRACE('${braceChars.OPEN_BRACE}') ·`
  + ` CLOSE_BRACE('${braceChars.CLOSE_BRACE}') · MARKER · EXTS(${EXTS.size}) · SELF(${SELF.size})`
  + ` · blankLongStrings minLen=${MINLEN}`);
console.log(`  SELF (excluded by construction, captured not re-listed): ${[...SELF].join(' , ')}`);

/* ============================================================ P6 — the KP set, FIRST */
// The KPs run before any population figure is computed, so a refusal cannot publish a number.
const KPS = [
  {
    id: 'KP-A',
    why: 'live two-sided brace comparison PLUS a marker — the marker is NEEDED',
    want: { marker: true, pop: true },
    src: [
      '// brace-slicer-deliberate: this fixture reproduces the defect on purpose',
      'const bodyOf = (s) => {',
      '  let d = 0, start = -1;',
      '  for (let i = 0; i < s.length; i += 1) {',
      "    if (s[i] === '{') { if (d === 0) start = i; d += 1; }",
      "    else if (s[i] === '}') { d -= 1; if (d === 0) return s.slice(start + 1, i); }",
      '  }',
      '  return null;',
      '};',
    ].join('\n'),
  },
  {
    id: 'KP-B',
    why: 'a marker plus ONLY a multi-character string quoting a comparison — the marker is STALE,'
      + ' and it was NEEDED under the old reading',
    want: { marker: true, pop: false, popOld: true },
    src: [
      '// brace-slicer-deliberate: kept for the record',
      'const fixture = "if (s[i] === \'{\') d += 1; if (s[i] === \'}\') d -= 1;";',
      'export const n = fixture.length;',
    ].join('\n'),
  },
  {
    id: 'KP-C',
    why: 'live two-sided brace comparison and NO marker — outside this subject entirely',
    want: { marker: false, pop: true },
    src: [
      'let d = 0;',
      'for (const c of s) {',
      "  if (c === '{') d += 1;",
      "  if (c === '}') d -= 1;",
      '}',
    ].join('\n'),
  },
];

const classify = (raw) => {
  const code = blankLongStrings(raw, MINLEN);
  const old = stripSource(raw, false);
  return {
    marker: MARKER.test(raw),
    pop: OPEN_BRACE.test(code) && CLOSE_BRACE.test(code),
    popOld: OPEN_BRACE.test(old) && CLOSE_BRACE.test(old),
  };
};

console.log('\n## P6 — KP set (each KP asserted against its OWN registered side)');
let kpFailed = 0;
const corners = new Set();
for (const kp of KPS) {
  const got = classify(kp.src);
  corners.add(`${got.marker}/${got.pop}`);
  const bad = Object.entries(kp.want).filter(([k, v]) => got[k] !== v);
  const line = `  ${kp.id}  marker=${got.marker} pop=${got.pop} popOld=${got.popOld}`
    + `  — ${kp.why}`;
  if (bad.length) {
    kpFailed += 1;
    console.log(`${line}\n        WRONG SIDE: ${bad.map(([k, v]) => `${k} wanted ${v}`).join(', ')}`);
  } else {
    console.log(`${line}\n        on the registered side`);
  }
}
console.log(`  corner coverage: ${corners.size} of 3 registered corners reached`
  + ` (${[...corners].join(' , ')}) — REPORTED, NOT THE GATE (unit-483 §5)`);
if (kpFailed) {
  die(4, `REFUSED rc=4 — ${kpFailed} KP(s) on the wrong side. P6 is REFUTED and no blast-radius`
    + ' figure is published. A fixture that lands wrong may be carrying the harm rather than the'
    + ' property (unit-483 §5; Daedalus unit-484 drive5).');
}

/* ============================================================ the tracked tree */
let tracked;
try {
  tracked = execFileSync('git', ['-C', ROOT, 'ls-files'], { encoding: 'utf8' })
    .split('\n').map((l) => l.trim()).filter(Boolean);
} catch (e) {
  die(2, `BLOCKED — could not list tracked files: ${e.message}`);
}
const code = tracked.filter((f) => EXTS.has(extname(f)));

const rows = [];
for (const rel of code) {
  if (SELF.has(rel)) continue;
  let raw;
  try { raw = readFileSync(join(ROOT, rel), 'utf8'); } catch { continue; }
  if (!MARKER.test(raw)) continue;
  const v = classify(raw);
  rows.push({ rel, raw, ...v });
}

const needed = rows.filter((r) => r.pop);
const stale = rows.filter((r) => !r.pop);
const staleNeverNeeded = stale.filter((r) => !r.popOld);
const staleByNarrowing = stale.filter((r) => r.popOld);

/* ============================================================ P1 — the control */
console.log('\n## P1 — control: the arm reads the GATE\'s population, not a lookalike');
let gateOut;
try {
  gateOut = execFileSync('node', [GATE], { cwd: ROOT, encoding: 'utf8' });
} catch (e) { gateOut = `${e.stdout || ''}${e.stderr || ''}`; }
// **drive1 defect, repaired here; drive1 is kept as `drive1.arm.out`.** This read
// `new RegExp(label + '\\s+(\\d+)')` with no left anchor, and the gate prints its verdict rows
// sorted by COUNT descending:
//
//     UNGUARDED  58
//     MARKED     4
//     GUARDED    3
//
// `/GUARDED\s+(\d+)/` matches inside `UNGUARDED  58`, so the control leg read GUARDED as **58** and
// reported P1 REFUTED on a figure that had not moved. **One verdict label is a SUFFIX of another,
// and an unanchored label key reads the wrong row** — and the direction of the error is the
// dangerous one: it manufactured a figure MOVE out of a stable gate, which is the shape a seat acts
// on. The tell was that the bogus value equalled another printed row exactly.
//
// Anchored on line start. `\n\s*GUARDED` cannot reach the `UNGUARDED` row because `\s*` cannot
// consume `UN`, and that is asserted below rather than argued here.
const num = (label) => {
  const m = gateOut.match(new RegExp(`(?:^|\\n)\\s*${label}\\s+(\\d+)`));
  return m ? Number(m[1]) : null;
};
// The assertion that the repair is a repair: the suffix label must not read the prefix label's row.
{
  const probe = '      UNGUARDED  58\n      MARKED     4\n      GUARDED    3\n';
  const read = (label) => {
    const m = probe.match(new RegExp(`(?:^|\\n)\\s*${label}\\s+(\\d+)`));
    return m ? Number(m[1]) : null;
  };
  if (read('GUARDED') !== 3 || read('UNGUARDED') !== 58 || read('MARKED') !== 4) {
    die(3, 'CAPTURE-FAILED — the anchored label reader does not separate GUARDED from UNGUARDED'
      + ` (read GUARDED=${read('GUARDED')}, UNGUARDED=${read('UNGUARDED')}, MARKED=${read('MARKED')})`);
  }
}
const gateFig = {
  tracked: num('tracked files read:'),
  population: num('population \\(compares against both braces\\):'),
  UNGUARDED: num('UNGUARDED'),
  MARKED: num('MARKED'),
  GUARDED: num('GUARDED'),
  baseline: num('baseline entries:'),
};
const REGISTERED = { tracked: 1007, population: 65, UNGUARDED: 58, MARKED: 4, GUARDED: 3, baseline: 58 };
let p1 = true;
for (const [k, v] of Object.entries(REGISTERED)) {
  const ok = gateFig[k] === v;
  if (!ok) p1 = false;
  console.log(`  ${k.padEnd(12)} registered ${String(v).padEnd(5)} live ${String(gateFig[k]).padEnd(5)} ${ok ? 'HIT' : 'MOVED'}`);
}
// The member-level half: the gate's MARKED set must be exactly this arm's marker ∧ pop set.
const gateMarked = new Set();
{
  // Re-derive the gate's own classification in-process, from the captured keys, and cross-check the
  // COUNT against the gate's printed MARKED. A count agreement plus a member listing is what P1
  // registered; the gate does not print its member names, so the names come from the same keys and
  // the COUNT is the independent check.
  for (const rel of code) {
    if (SELF.has(rel)) continue;
    let raw;
    try { raw = readFileSync(join(ROOT, rel), 'utf8'); } catch { continue; }
    const c = blankLongStrings(raw, MINLEN);
    if (!OPEN_BRACE.test(c) || !CLOSE_BRACE.test(c)) continue;
    if (MARKER.test(raw)) gateMarked.add(rel);
  }
}
const sameSet = gateMarked.size === needed.length
  && needed.every((r) => gateMarked.has(r.rel));
console.log(`  MARKED set: gate prints ${gateFig.MARKED}, arm derives ${gateMarked.size},`
  + ` arm's needed-marker set ${needed.length} — ${sameSet && gateMarked.size === gateFig.MARKED ? 'SAME SET, HIT' : 'DIFFER, REFUTED'}`);
if (!sameSet || gateMarked.size !== gateFig.MARKED) p1 = false;
console.log(`  P1: ${p1 ? 'HIT' : 'REFUTED'}`);

/* ============================================================ P2, P3, P4 */
console.log('\n## P2 — marker-bearing tracked code files (K-MARKER, SELF excluded)');
console.log(`  ${rows.length}  (registered floor 15, point estimate 17) — ${rows.length >= 15 ? 'HIT' : 'REFUTED'}`);
console.log(`  of ${code.length} tracked code files — ${pct(rows.length, code.length)}`);

console.log('\n## P3 — THE HEADLINE: the stale-marker set (K-MARKER ∧ ¬K-POP)');
console.log(`  stale:  ${stale.length}   (registered: strictly > 7; point estimate 13)`);
console.log(`  needed: ${needed.length}`);
console.log(`  P3: ${stale.length > 7 ? 'HIT' : 'REFUTED'}`
  + `  — Daedalus's published delta is 7; the check would redden on ${stale.length}.`);
for (const r of stale) {
  const n = (r.raw.match(MARKER_G) || []).length;
  console.log(`      STALE  ${r.rel}  (${n} marker site${n === 1 ? '' : 's'}, popOld=${r.popOld})`);
}
for (const r of needed) {
  const n = (r.raw.match(MARKER_G) || []).length;
  console.log(`      NEEDED ${r.rel}  (${n} marker site${n === 1 ? '' : 's'})`);
}

console.log('\n## P4 — which mechanism made each stale marker stale');
console.log(`  stale AND in the population under the OLD reading (made stale by the narrowing): ${staleByNarrowing.length}`);
console.log(`  stale under BOTH readings (never exempted anything on any fire):                  ${staleNeverNeeded.length}`);
console.log(`  P4: ${staleNeverNeeded.length >= 1 ? 'HIT' : 'REFUTED'} — registered >= 1 never-needed marker`);
for (const r of staleNeverNeeded) console.log(`      NEVER-NEEDED  ${r.rel}`);

// His seven, as a subset check, read out of his own RESULTS rather than re-typed.
let hisSeven = null;
try {
  const hisSrc = readFileSync(HIS_RESULTS, 'utf8');
  const m = hisSrc.match(/MARKED\s*(?:11\s*(?:->|→)\s*4|11\s*→\s*4)/);
  hisSeven = m ? '11 → 4 found in his RESULTS' : null;
} catch { hisSeven = null; }
console.log(`  his MARKED 11 -> 4 sentence located in unit-484 RESULTS.md: ${hisSeven ?? 'NOT FOUND (not re-typed, not asserted)'}`);

/* ============================================================ P5 — site vs file */
console.log('\n## P5 — requirement 3 says "a marker AT THE SITE"; the gate reads the FILE');
let offSite = 0; let onSite = 0;
const distances = [];
for (const r of needed) {
  const lines = r.raw.split('\n');
  const codeLines = blankLongStrings(r.raw, MINLEN).split('\n');
  const braceLines = [];
  codeLines.forEach((l, i) => { if (OPEN_BRACE.test(l) || CLOSE_BRACE.test(l)) braceLines.push(i); });
  lines.forEach((l, i) => {
    if (!MARKER.test(l)) return;
    const own = OPEN_BRACE.test(codeLines[i] ?? '') || CLOSE_BRACE.test(codeLines[i] ?? '');
    if (own) onSite += 1; else offSite += 1;
    const d = braceLines.length
      ? Math.min(...braceLines.map((b) => Math.abs(b - i)))
      : Infinity;
    distances.push({ rel: r.rel, line: i + 1, own, nearest: d, braceLines: braceLines.length });
  });
}
console.log(`  marker occurrences in NEEDED files: ${onSite + offSite}  (on a line that itself`
  + ` carries a brace comparison: ${onSite}; not: ${offSite})`);
console.log(`  P5: ${offSite >= 1 ? 'HIT' : 'REFUTED'} — registered >= 1 off-site marker occurrence`);
for (const d of distances) {
  console.log(`      ${d.own ? 'ON-SITE ' : 'OFF-SITE'} ${d.rel}:${d.line}`
    + `  nearest brace-comparison line ${d.nearest === Infinity ? 'NONE' : `${d.nearest} line(s) away`}`
    + `  (${d.braceLines} brace-comparison line(s) in file)`);
}
const far = distances.filter((d) => d.nearest !== Infinity).map((d) => d.nearest);
if (far.length) {
  console.log(`  marker-to-nearest-comparison distance: min ${Math.min(...far)} ·`
    + ` max ${Math.max(...far)} line(s). A site-level staleness check needs a WINDOW constant,`
    + ' and no fire has registered one.');
}

/* ============================================================ the summary line */
console.log('\n' + '='.repeat(78));
console.log(`SUMMARY — marker-bearing ${rows.length} · NEEDED ${needed.length} · STALE ${stale.length}`
  + ` (by the narrowing ${staleByNarrowing.length} · never needed ${staleNeverNeeded.length})`
  + ` · off-site marker occurrences in NEEDED files ${offSite} of ${onSite + offSite}`);
console.log(`BLAST RADIUS of a file-level marker-staleness check: ${stale.length} file(s),`
  + ` not the 7 of the delta.`);
console.log('='.repeat(78));
process.exit(0);
