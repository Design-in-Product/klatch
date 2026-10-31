#!/usr/bin/env node
// quoted-denominator.mjs — unit-464authored, 2026-10-31 START fire (Daedalus).
//
// `GTYPEDDEF` publishes a NUMERATOR (typed tokens) and no denominator. This reads the
// denominator: how many `name=value` spans in an arm section the checker's own tokenizer
// actually SEES. `R2` is keyed on it, because a green numerator over an empty denominator
// is the rowless probe's green and not a measurement.
//
// `tokensOf` is COPIED from grade-filed-maps.mjs:226-237 rather than imported, because
// that file is a script and not a module. A copied reader is a second implementation of
// the key, so it is GATED below on the same real slice the checker's own `GKP` uses, and
// the gate asserts the checker's own published figures — 11 tokens and the `selector`
// value that a whitespace split breaks. If the copy drifts, this exits non-zero and
// publishes no number.
//
// Usage: node quoted-denominator.mjs <map-path> <arm-name> [<map-path> <arm-name> ...]

import { readFileSync } from 'node:fs';

// --- COPIED, verbatim, from grade-filed-maps.mjs:226-237.
const tokensOf = (payload) => {
  const out = new Map();
  const re = /(?:^|\s)([A-Za-z][A-Za-z0-9_.]*)=/g;
  const hits = [...payload.matchAll(re)];
  for (let i = 0; i < hits.length; i += 1) {
    const name = hits[i][1];
    const valueStart = hits[i].index + hits[i][0].length;
    const valueEnd = i + 1 < hits.length ? hits[i + 1].index : payload.length;
    out.set(name, payload.slice(valueStart, valueEnd).trim());
  }
  return out;
};

// --- COPIED from grade-filed-maps.mjs:299-318.
const sectionFor = (mapText, armName) => {
  const lines = mapText.split('\n');
  const heads = [];
  lines.forEach((l, i) => {
    const h = l.match(/^(#+)\s/);
    if (h !== null && l.includes(armName)) heads.push({ i, level: h[1].length });
  });
  if (heads.length !== 1) return null;
  const { i: start, level } = heads[0];
  let end = lines.length;
  for (let j = start + 1; j < lines.length; j += 1) {
    const h = lines[j].match(/^(#+)\s/);
    if (h !== null && h[1].length <= level) {
      end = j;
      break;
    }
  }
  return lines.slice(start, end);
};

// --- THE GATE on the copy. The slice is T2bSAT's clean payload, read from the recording
// and not typed here, which is the same slice and the same two published figures the
// checker's own GKP asserts (`GKP ok ... selector round-trips whole; 11 tokens`).
const KP_RECORDING = '../unit-464t2b-sat-2026-10-29/drive2.clean.out';
const kpSlice = (() => {
  const lines = readFileSync(KP_RECORDING, 'utf8').split('\n');
  for (let i = 0; i < lines.length; i += 1) {
    const m = lines[i].slice(4).match(/^ ([A-Za-z][A-Za-z0-9_]*): /);
    if (m !== null && m[1] === 'T2bSAT') {
      const next = lines[i + 1] ?? '';
      return /^ {6}\S/.test(next) ? next.trim() : null;
    }
  }
  return null;
})();
if (kpSlice === null) {
  console.error('KPGATE REFUSED — T2bSAT payload not readable from the recording; no number published');
  process.exit(2);
}
const kp = tokensOf(kpSlice);
const kpOk = kp.size === 11 && kp.get('selector') === 'max(pins first)';
console.log(`KPGATE ${kpOk ? 'ok ' : 'RED'} copied tokenizer on a real slice: ${kp.size} tokens (checker publishes 11), selector=${JSON.stringify(kp.get('selector') ?? null)} (checker publishes "max(pins first)")`);
if (!kpOk) {
  console.error('KPGATE RED — the copied tokenizer disagrees with the checker; no number published');
  process.exit(2);
}

const argv = process.argv.slice(2);
if (argv.length === 0 || argv.length % 2 !== 0) {
  console.error('usage: quoted-denominator.mjs <map-path> <arm-name> [...]');
  process.exit(2);
}
let bad = 0;
for (let i = 0; i < argv.length; i += 2) {
  const [mapPath, armName] = [argv[i], argv[i + 1]];
  const section = sectionFor(readFileSync(mapPath, 'utf8'), armName);
  if (section === null) {
    console.log(`DENOM  REFUSED  ${mapPath} / ${armName} — not exactly one heading names the arm`);
    bad += 1;
    continue;
  }
  const spans = [];
  for (const l of section) for (const [name, value] of tokensOf(l)) spans.push(`${name}=${value}`);
  const names = [...new Set(spans.map((s) => s.slice(0, s.indexOf('='))))].sort();
  console.log(`DENOM  ${mapPath} / ${armName}: ${spans.length} span(s) the checker's tokenizer SEES, ${names.length} distinct name(s) [${names.join(',')}] over ${section.length} section line(s)`);
  // --- The SIZE OF THE BLINDNESS, measured and not estimated. This is a SECOND reader,
  // deliberately not the checker's, and NOTHING is graded on it: it exists to price a
  // routed cure. The only difference from the copy above is the left boundary — a map
  // writes every figure inside a markdown code span, so the character before the name is
  // a backtick, and `(?:^|\s)` cannot reach it. Correct on the RECORDING side, where
  // there are no backticks; blind on the MAP side, which is the side it is used on.
  const WIDE = /(?:^|[\s`([])([A-Za-z][A-Za-z0-9_.]*)=/g;
  const wide = new Set();
  for (const l of section) for (const m of l.matchAll(WIDE)) wide.add(m[1]);
  console.log(`WIDE   ${mapPath} / ${armName}: a backtick-aware left boundary sees ${wide.size} distinct name(s) — ${wide.size - names.length} more than the checker [${[...wide].sort().join(',')}]`);
}
process.exit(bad === 0 ? 0 : 1);
