#!/usr/bin/env node
/**
 * unit-496 post-hoc re-key. Written and COMMITTED before it was driven.
 *
 * WHY: P5 in this unit's arm is REFUTED and the refutation is against my own key, not against
 * Daedalus's §2. I keyed the census on "the emit template ends in an interpolation" — which returns
 * 6 sites, NONE of them his two, because his cure appended a literal backtick and the cured form no
 * longer ends in `}`. **My key could only ever see the sites the cure had not reached**, so it can
 * neither corroborate nor contradict his count of 2. Its `can-hold-a-label` column is worse: it
 * textual-matched identifier names anywhere in the tail, so `${verdicts.size}` and `${counts[v]}`
 * (both numbers) scored true and the two real sites scored nothing.
 *
 * RE-KEY: the question is not "does the template end in an interpolation" but "is a VERDICT the last
 * thing rendered on the line, quoted or not". Key on the verdict-bearing expression itself and
 * measure its distance from the end of the template, so the cured and uncured forms are in ONE
 * population and the cure is visible as a property rather than as an absence.
 *
 * REGISTERED EXPECTATION, before the drive:
 *   E1  verdict-bearing emit sites, cured or not: 2  — Daedalus's §2 count, now measured under a key
 *       that can see both forms.
 *   E2  of those, 2 are CURED (a literal backtick stands between the verdict and the line end) and
 *       0 are uncured.
 *   E3  the pre-cure form of each, reconstructed by deleting the backticks, is label-terminal: 2 of 2.
 *       This is the leg that makes E2 mean something: a cure that no counterfactual grades is a
 *       claim, not a measurement.
 *
 * brace-slicer-deliberate: reads the gate's source as text to census emit call sites; it slices no
 * declaration bodies and compares against no braces.
 */
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = execFileSync('git', ['-C', HERE, 'rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim();
const SRC = readFileSync(join(ROOT, 'scripts/verify-decl-body-slicers.mjs'), 'utf8');
const LABELS = ['MARKED', 'GUARDED', 'UNGUARDED'];
const o = [];
const say = (s = '') => o.push(s);

say('=== unit-496 post-hoc: verdict-terminal emit sites, re-keyed so cured and uncured share a key ===');

// Every emit/emitErr statement, with its full argument text.
const callRe = /\b(emitErr|emit)\(([\s\S]*?)\);\n/g;
const sites = [];
let m;
while ((m = callRe.exec(SRC)) !== null) {
  sites.push({ fn: m[1], line: SRC.slice(0, m.index).split('\n').length, arg: m[2] });
}
say(`  emit/emitErr statements: ${sites.length}`);

// VERDICT-BEARING: the argument renders a member of the gate's own partition. The expression that
// does it in this file is `verdicts.get(...)`; keyed on that rather than on identifier names.
const verdictBearing = sites.filter((s) => /verdicts\.get\(/.test(s.arg));
say(`  of those, rendering a verdict via \`verdicts.get(\`: ${verdictBearing.length}`);
say('');
say('  line  fn       tail of template                                            after-verdict  cured');
let cured = 0;
const reconstructed = [];
for (const s of verdictBearing) {
  const flat = s.arg.replace(/\n\s*/g, ' ').trim();
  // What stands between the verdict interpolation and the end of the template?
  const idx = flat.lastIndexOf('verdicts.get(');
  const closeBrace = flat.indexOf('}', idx);
  const after = flat.slice(closeBrace + 1).replace(/`\s*$/, '');
  const isCured = after.includes('`');
  if (isCured) cured += 1;
  say(`  ${String(s.line).padStart(4)}  ${s.fn.padEnd(7)}  ${flat.slice(-58).padEnd(58)}  ${JSON.stringify(after).padEnd(13)}  ${isCured}`);
  reconstructed.push({ line: s.line, flat });
}
say('');
say(`  E1 verdict-bearing sites : ${verdictBearing.length}`);
say(`  E2 cured (a literal backtick after the verdict): ${cured} of ${verdictBearing.length}`);

// E3 — the counterfactual that grades the cure: strip the backticks the cure added and ask whether
// the rendered line would be label-terminal. Rendered with a real verdict, not a placeholder.
say('');
say('  E3 counterfactual: the SAME template with the cure\'s backticks removed, rendered:');
let preCureTerminal = 0;
for (const r of reconstructed) {
  // Rebuild the rendered line by substituting a real verdict for the interpolation, both forms.
  const tmpl = r.flat.replace(/^`/, '').replace(/`$/, '');
  const curedLine = tmpl
    .replace(/\$\{verdicts\.get\(f\) \?\? 'ABSENT'\}/, 'GUARDED')
    .replace(/\$\{verdicts\.get\(f\)\}/, 'GUARDED')
    .replace(/\$\{f\}/, 'scripts/lib/decl-body.mjs');
  const bare = curedLine.replace(/\\`/g, '').replace(/`/g, '');
  const curedTerminal = LABELS.some((v) => curedLine.endsWith(v));
  const bareTerminal = LABELS.some((v) => bare.endsWith(v));
  if (bareTerminal) preCureTerminal += 1;
  say(`      line ${r.line}:`);
  say(`        as shipped (cured) : ${JSON.stringify(curedLine.slice(-46))}  label-terminal=${curedTerminal}`);
  say(`        backticks removed  : ${JSON.stringify(bare.slice(-46))}  label-terminal=${bareTerminal}`);
}
say('');
say(`  E3 pre-cure forms that are label-terminal: ${preCureTerminal} of ${verdictBearing.length}`);
// KP for that figure: the same predicate over a line that must report false.
const kpNeg = LABELS.some((v) => '  x  → `GUARDED`'.endsWith(v));
say(`  KP (negative): the cured form must NOT be label-terminal → ${kpNeg} (must be false)`);
say(`  KP (positive): the bare form must BE label-terminal → ${LABELS.some((v) => '  x  → GUARDED'.endsWith(v))} (must be true)`);
say('');
say('=== end post-hoc ===');
process.stdout.write(`${o.join('\n')}\n`);
