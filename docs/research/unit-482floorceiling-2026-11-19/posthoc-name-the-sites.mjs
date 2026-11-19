#!/usr/bin/env node
/**
 * unit-482floorceiling POST-HOC probe — written AFTER drive1, labelled as post-hoc, not a
 * prediction. Three refutations in drive1 (P6, P8, P9) all say the same thing about D1 and D2, and
 * a verdict-level matrix cannot name the mechanism. This names the exact site each key fired on,
 * in line numbers of the RAW file, so the write-up quotes lines rather than inferring them.
 *
 * brace-slicer-deliberate: carries naive brace-comparison readers on purpose — the subject, not a
 * tool.
 */

import { readFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '../../..');
const GATE = join(ROOT, 'scripts/verify-decl-body-slicers.mjs');
const gateSrc = readFileSync(GATE, 'utf8');
const capture = (label, re, src) => {
  const m = src.match(re); if (!m) { console.error(`CAPTURE-FAILED — ${label}`); process.exit(3); }
  return m[1];
};
const cmpSrc = capture('cmp factory', /const cmp = (\(ch\) => new RegExp\([\s\S]*?\));\n/, gateSrc);
// eslint-disable-next-line no-eval
const cmpRaw = eval(cmpSrc);
const OPEN_BRACE = new RegExp(cmpRaw(capture('OPEN_BRACE', /const OPEN_BRACE = cmp\('(.)'\)/, gateSrc)).source, 'g');
const { stripSource } = await import(join(ROOT, 'scripts/lib/strip-source.mjs'));

const SLICE_CALL = /\.(?:slice|substring|substr)\s*\(/g;
const D1_RADIUS = 200;

const all = (re, s) => { const out = []; re.lastIndex = 0; let m; while ((m = re.exec(s))) out.push(m.index); return out; };
// The blanked source keeps offsets, so a blanked offset is the raw offset.
const lineNo = (s, i) => s.slice(0, i).split('\n').length;
const lineText = (s, i) => {
  const a = s.lastIndexOf('\n', i) + 1; let b = s.indexOf('\n', i); if (b < 0) b = s.length;
  return s.slice(a, b).trim();
};

const targets = [
  ['scripts/lib/decl-body.mjs', 'P6 — D1 FIRED here and I registered that it would not'],
  ['docs/research/round401-instruments/census-the-branch-polarity-axis.mjs', 'P8 — D1/D2 FIRED on the one file both seats hand-read as a NON-slicer'],
  ['scripts/lib/strip-source.mjs', 'M2 — a baselined file with no slice-family call at all'],
  ['docs/research/round399-instruments/census-the-named-binding-form.mjs', 'P9 — a floor-AND-D1 contradiction member'],
  ['docs/research/unit-480guardorder-2026-11-18/arm-b.mjs', 'P5 — a MARKED file D1 MISSED'],
];

for (const [rel, why] of targets) {
  const raw = readFileSync(join(ROOT, rel), 'utf8');
  const code = stripSource(raw, false);
  const ob = all(OPEN_BRACE, code), sl = all(SLICE_CALL, code);
  console.log(`\n=== ${rel}`);
  console.log(`    ${why}`);
  console.log(`    ${ob.length} open-brace comparison site(s) · ${sl.length} slice-family call site(s)`);
  let fired = 0;
  for (const i of ob) {
    const near = sl.filter((s) => s >= i - D1_RADIUS && s <= i + D1_RADIUS);
    const mark = near.length ? 'D1-FIRES' : '        ';
    console.log(`    ${mark} cmp L${String(lineNo(raw, i)).padStart(4)}  ${lineText(raw, i).slice(0, 86)}`);
    for (const s of near) {
      fired++;
      console.log(`             +-> slice L${String(lineNo(raw, s)).padStart(4)} at ${s - i >= 0 ? '+' : ''}${s - i} chars  ${lineText(raw, s).slice(0, 72)}`);
    }
  }
  if (!fired) console.log('    D1 fires on NO site in this file.');
}
