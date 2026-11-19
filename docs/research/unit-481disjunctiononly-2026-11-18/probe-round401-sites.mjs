#!/usr/bin/env node
/**
 * POST-HOC leg, not pre-registered. Labelled as such in RESULTS §5.
 *
 * The arm's P3 list does **not** contain
 * `docs/research/round401-instruments/census-the-branch-polarity-axis.mjs` — the file Daedalus's §4
 * refutation is *about*. His memo establishes by hand-read that all 8 of its brace comparisons are
 * correct; his `DEPTH_LINE` key nonetheless classifies it as NOT disjunction-only. This prints the
 * site-by-site reading so that claim is measured rather than inferred from the absence of a row.
 *
 * brace-slicer-deliberate: the keys here are captured from other files' source text; the brace
 * comparisons in this file's own strings are the subject, not a reader.
 */
import { readFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '../../..');
const gateSrc = readFileSync(join(ROOT, 'scripts/verify-decl-body-slicers.mjs'), 'utf8');
const hisSrc = readFileSync(join(ROOT, 'docs/research/unit-480guardorder-2026-11-18/arm-b.mjs'), 'utf8');
const cap = (label, re, src) => { const m = src.match(re); if (!m) { console.error(`CAPTURE-FAILED — ${label}`); process.exit(3); } return m[1]; };
// eslint-disable-next-line no-eval
const cmpRaw = eval(cap('cmp', /const cmp = (\(ch\) => new RegExp\([\s\S]*?\));\n/, gateSrc));
const g = (ch) => new RegExp(cmpRaw(ch).source, 'g');
// eslint-disable-next-line no-eval
const DEPTH_LINE = eval(cap('DEPTH_LINE', /const DEPTH_LINE = (\/[\s\S]*?\/);\n/, hisSrc));
const WINDOW = Number(cap('window', /lineEnd \+ (\d+)\)/, hisSrc));
const { stripSource } = await import(join(ROOT, 'scripts/lib/strip-source.mjs'));

const SUBJ = 'docs/research/round401-instruments/census-the-branch-polarity-axis.mjs';
const code = stripSource(readFileSync(join(ROOT, SUBJ), 'utf8'), false);
const all = (re) => { const out = []; re.lastIndex = 0; let m; while ((m = re.exec(code))) out.push(m.index); return out; };
const lineNo = (i) => code.slice(0, i).split('\n').length;

for (const [name, ch] of [['OPEN_BRACE', '{'], ['CLOSE_BRACE', '}']]) {
  const sites = all(g(ch));
  console.log(`\n=== ${name} sites in ${SUBJ.split('/').pop()}: ${sites.length} ===`);
  for (const i of sites) {
    const lineStart = code.lastIndexOf('\n', i) + 1;
    let lineEnd = code.indexOf('\n', i); if (lineEnd < 0) lineEnd = code.length;
    const window = code.slice(lineStart, Math.min(code.length, lineEnd + WINDOW));
    const hit = DEPTH_LINE.test(window);
    console.log(`  char ${String(i).padStart(5)}  L${String(lineNo(i)).padStart(3)}  DEPTH_LINE=${hit ? 'MATCH    ' : 'NO-MATCH '} ${code.slice(lineStart, lineEnd).trim().slice(0, 96)}`);
  }
}
