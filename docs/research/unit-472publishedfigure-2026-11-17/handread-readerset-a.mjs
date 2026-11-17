#!/usr/bin/env node
/**
 * unit-472publishedfigure — the HAND READ, instrument 1 of 16:
 * `docs/research/unit-465readerset-2026-11-14/arm-readerset-a.mjs`.
 *
 * The screen only makes an instrument a CANDIDATE. Promoting CANDIDATE → WRONG needs the
 * instrument's OWN published figures re-derived under the cured reader, at the instrument's OWN
 * input. This does exactly that and nothing wider.
 *
 * TWO THINGS THE SCREEN GOT WRONG ABOUT THIS INSTRUMENT, both found by hand:
 *
 * 1. It reads its subjects at a PIN — `git(['show', `${PIN}:${p}`])`, arm-readerset-a.mjs:50 — so
 *    the screen's working-tree reading was the wrong bytes. This re-reads at the pin.
 * 2. My arm's A9 rev-pin key did not catch it. A9 keys on `show`/`cat-file` appearing near the
 *    PATH LITERAL; here the literal lives in a `LIBS` array at line 49 and the read spells the path
 *    as `${p}`. A literal-adjacency key is blind to a path reached through a variable — the same
 *    shape as a path key reading 0 because the path is `${BASE}${pathname}`. So A9's count of 2 is
 *    a floor and this instrument is at least the third.
 *
 * The instrument's population key, verbatim from its line 76: /^export function ([A-Za-z0-9_]+)\s*\(/gm
 * Its naive slicer, verbatim from its lines 53-63, is reproduced below.
 *
 * brace-slicer-deliberate: `naiveBodyOf` below is arm-readerset-a's own slicer, copied so the
 * differential compares the instrument's actual reading against the cured one. Removing it removes
 * the measurement.
 */

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { declBodies } from '../../../scripts/lib/decl-body.mjs';

const PIN = 'e96741bf';
const LIBS = ['docs/research/lib/verdict.mjs', 'docs/research/lib/attested-rounds.mjs'];

const git = (args) => execFileSync('git', args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });

/** arm-readerset-a.mjs:53-63, verbatim. */
function naiveBodyOf(src, startIdx) {
  const open = src.indexOf('{', startIdx);
  if (open < 0) return null;
  let depth = 0;
  for (let i = open; i < src.length; i += 1) {
    const c = src[i];
    if (c === '{') depth += 1;
    else if (c === '}') { depth -= 1; if (depth === 0) return src.slice(open, i + 1); }
  }
  return null;
}

/** arm-readerset-a.mjs:67-70, verbatim. */
function returnsOf(body) {
  return [...body.matchAll(/\breturn\b([^;\n]*(?:\n(?![ \t]*\})[^;\n]*)*)/g)]
    .map((m) => m[0].replace(/\s+/g, ' ').trim());
}

/** arm-readerset-a.mjs:86-94, verbatim, as a function of the body it is handed. */
const classify = (name, body) => {
  const rets = returnsOf(body);
  const retText = rets.join(' ⟂ ');
  const hasOk = /\bok\s*:/.test(retText);
  const litRefusal = /\brefusal\s*:/.test(retText);
  const helperRefusal = /\breturn\s+refuse\w*\s*\(/.test(retText) || /\brefuse\w*\s*\(/.test(retText);
  const refusalBearing = hasOk && (litRefusal || helperRefusal);
  const nameRead = /^read/.test(name);
  const stateRead = /\b(readFileSync|existsSync|execFileSync|spawnSync|git\s*\(|ls-tree|ls-files)/.test(body);
  const kind = nameRead ? 'NAME_READ' : stateRead ? 'STATE_READ' : 'NEITHER';
  return { kind, refusalBearing, hasOk, litRefusal, helperRefusal, nRets: rets.length, litOnly: hasOk && litRefusal };
};

const rowsNaive = [];
const rowsCured = [];
const spans = [];

for (const p of LIBS) {
  const src = git(['show', `${PIN}:${p}`]);
  const curedByName = new Map();
  for (const d of declBodies(src)) if (!curedByName.has(d.name)) curedByName.set(d.name, d);

  for (const m of src.matchAll(/^export function ([A-Za-z0-9_]+)\s*\(/gm)) {
    const name = m[1];
    const line = src.slice(0, m.index).split('\n').length;
    const naive = naiveBodyOf(src, m.index);
    const cured = curedByName.get(name);
    const curedBody = cured && cured.kind === 'block' ? cured.body : null;

    spans.push({
      p, name, line,
      naiveLen: naive === null ? null : naive.length,
      curedLen: curedBody === null ? null : curedBody.length,
      same: naive !== null && curedBody !== null && naive === curedBody,
      curedKind: cured ? cured.kind : '<not located>',
    });

    const endLineNaive = naive === null ? null : line + naive.split('\n').length - 1;
    const endLineCured = curedBody === null ? null : line + curedBody.split('\n').length - 1;

    rowsNaive.push({ p, name, line, endLine: endLineNaive, shape: naive === null ? 'UNPARSED' : 'PARSED', ...(naive === null ? {} : classify(name, naive)) });
    rowsCured.push({ p, name, line, endLine: endLineCured, shape: curedBody === null ? 'UNPARSED' : 'PARSED', ...(curedBody === null ? {} : classify(name, curedBody)) });
  }
}

/** The instrument's four published console.log figures, re-derived from a row set. */
const figures = (rows) => {
  const parsed = rows.filter((r) => r.shape === 'PARSED');
  const readers = parsed.filter((r) => r.kind === 'NAME_READ' || r.kind === 'STATE_READ');
  const bearing = readers.filter((r) => r.refusalBearing);
  const FOUR = ['readVerdict', 'readTail', 'readRows', 'readCorpusRows'];
  const four = FOUR.map((n) => rows.find((r) => r.name === n && r.p.endsWith('verdict.mjs')));
  const att = readers.filter((r) => r.p.endsWith('attested-rounds.mjs'));
  return {
    'exported functions parsed': rows.length,
    'UNPARSED (leg A1 asserts 0)': rows.filter((r) => r.shape === 'UNPARSED').length,
    'reader-shaped': readers.length,
    '  NAME_READ': readers.filter((r) => r.kind === 'NAME_READ').length,
    '  STATE_READ': readers.filter((r) => r.kind === 'STATE_READ').length,
    'NEITHER': parsed.filter((r) => r.kind === 'NEITHER').length,
    'refusal-bearing readers (A2 numerator)': bearing.length,
    'NOT-bearing readers (A2 denominator side)': readers.length - bearing.length,
    'A5 disagree count': parsed.filter((r) => r.refusalBearing !== r.litOnly).length,
    'A6 four-row table': four.map((r) => (r === undefined ? 'MISSING' : `${r.name}@${r.line}-${r.endLine}:${r.refusalBearing ? 'BEARING' : 'NO-SHAPE'}`)).join(' · '),
    'A1 attested-rounds reader count': att.length,
    'A1 attested-rounds bearing': att.filter((r) => r.refusalBearing).length,
  };
};

const fNaive = figures(rowsNaive);
const fCured = figures(rowsCured);

console.log(`hand read — unit-465readerset arm A, at its own pin ${PIN}`);
console.log(`  population (its own key, ^export function): ${spans.length} declarations`);
const differing = spans.filter((s) => !s.same);
console.log(`  spans that DIFFER naive vs cured: ${differing.length} of ${spans.length}`);
for (const s of differing)
  console.log(`      DIFFERS ${s.p.replace('docs/research/lib/', '')}@${s.line} ${s.name.padEnd(22)} naive ${String(s.naiveLen).padStart(5)} vs cured ${String(s.curedLen).padStart(5)} (cured kind ${s.curedKind})`);
console.log('');

console.log('  PUBLISHED FIGURE, re-derived both ways:');
let moved = 0;
for (const k of Object.keys(fNaive)) {
  const a = fNaive[k];
  const b = fCured[k];
  const flag = String(a) === String(b) ? 'same ' : 'MOVED';
  if (flag === 'MOVED') moved++;
  console.log(`      ${flag} ${k.padEnd(42)} naive=${a}${flag === 'MOVED' ? `   cured=${b}` : ''}`);
}
console.log('');
console.log(`  ${moved} of ${Object.keys(fNaive).length} of the instrument's own READINGS move under the cured reader.`);
console.log('');

/*
 * THE STEP THAT CHANGES THE VERDICT, and a finding against the first version of this very script.
 *
 * Drive 6 printed "VERDICT: WRONG — 5 of 12 published figures move" off the block above. That label
 * was false. The block compares the INSTRUMENT'S naive reading against the cured one; it had never
 * opened the write-up. Calling the naive re-derivation "the published figure" assumed the write-up
 * published whatever the instrument's first drive printed.
 *
 * The question is about the WRITE-UP. So the answer key is captured out of the committed RESULTS.md
 * by regex — not hand-typed, so it cannot go stale against the file it claims to quote.
 */
const resultsPath = 'docs/research/unit-465readerset-2026-11-14/RESULTS.md';
const resultsSrc = readFileSync(resultsPath, 'utf8');
const claim = /\*\*(\d+) reader-shaped exports, (\d+)\s*\n?refusal-bearing and (\d+) not\*\*/.exec(resultsSrc);

if (!claim) {
  console.log(`VERDICT: UNRESOLVED — could not capture the published figure out of ${resultsPath}.`);
  console.log('  Not "not wrong": a selector that matches nothing is silent, not exonerating.');
  process.exit(1);
}

const published = { readerShaped: +claim[1], bearing: +claim[2], notBearing: +claim[3] };
const matchesNaive =
  published.readerShaped === fNaive['reader-shaped'] &&
  published.bearing === fNaive['refusal-bearing readers (A2 numerator)'] &&
  published.notBearing === fNaive['NOT-bearing readers (A2 denominator side)'];
const matchesCured =
  published.readerShaped === fCured['reader-shaped'] &&
  published.bearing === fCured['refusal-bearing readers (A2 numerator)'] &&
  published.notBearing === fCured['NOT-bearing readers (A2 denominator side)'];

console.log(`  PUBLISHED, captured from ${resultsPath}:`);
console.log(`      "${claim[0].replace(/\n/g, ' ')}"`);
console.log(`      → reader-shaped ${published.readerShaped} · bearing ${published.bearing} · not-bearing ${published.notBearing}`);
console.log(`  naive re-derivation:  ${fNaive['reader-shaped']} · ${fNaive['refusal-bearing readers (A2 numerator)']} · ${fNaive['NOT-bearing readers (A2 denominator side)']}   ${matchesNaive ? '← MATCHES PUBLISHED' : ''}`);
console.log(`  cured re-derivation:  ${fCured['reader-shaped']} · ${fCured['refusal-bearing readers (A2 numerator)']} · ${fCured['NOT-bearing readers (A2 denominator side)']}   ${matchesCured ? '← MATCHES PUBLISHED' : ''}`);
console.log('');

const verdict = matchesCured && !matchesNaive ? 'NOT WRONG' : matchesNaive && !matchesCured ? 'WRONG' : matchesNaive && matchesCured ? 'INDISTINGUISHABLE' : 'NEITHER';
console.log(`VERDICT: ${verdict}`);
if (verdict === 'NOT WRONG')
  console.log('  The write-up published the CURED figures. The instrument\'s naive reading was wrong and\n  the write-up caught it: its "Self-defect 2" names all four affected exports with their\n  line numbers and records that only `attestedRounds` changed class. CANDIDATE, not wrong.');
if (verdict === 'INDISTINGUISHABLE')
  console.log('  Both re-derivations agree with the published figure, so this figure cannot tell them\n  apart and grades nothing here.');
if (verdict === 'NEITHER')
  console.log('  The published figure matches NEITHER re-derivation — so my reproduction of this\n  instrument is wrong before the write-up is, and that comes first.');
console.log('  Scoped to this instrument, at this pin, for this one published figure. It says nothing');
console.log('  about the other 15 candidates, and nothing about this instrument\'s other figures.');
process.exit(verdict === 'NEITHER' ? 1 : 0);
