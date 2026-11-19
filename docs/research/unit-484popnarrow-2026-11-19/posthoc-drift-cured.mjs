#!/usr/bin/env node
/**
 * unit-484popnarrow POST-HOC leg 2, UNREGISTERED — **does the narrowing cure the drift both seats
 * have now published four times?**
 *
 * The published sentence (Theseus `unit-483` §6, sharpening his own and my earlier readings) is
 * **"+1 population member per instrument that CARRIES a brace comparison"** — four consecutive
 * readings of `UNGUARDED 59` while tracked went 1000 → 1002 and the population climbed with every
 * arm either of us wrote. Every one of those instruments carries its comparison as a **quoted KP
 * fixture**, which is the class this unit's cure blanks. So the cure should flatten the drift, and
 * that is a prediction about future fires rather than a figure, which is why it is measured on the
 * files this fire itself added.
 *
 * NOT the arm re-driven. The arm's control asserts the WIDE column reproduces the live gate, and
 * the live gate is now NARROW — re-driving it would report a mismatch that is the cure, not a
 * defect (`feedback_an_answer_key_can_be_stale_relative_to_its_subject`). This leg keys on the two
 * readings directly and asserts nothing about the gate's own output.
 *
 * Usage: node posthoc-drift-cured.mjs <rev-before-this-unit>
 *
 * brace-slicer-deliberate: quotes brace comparisons as fixture text on purpose.
 */

import { readFileSync } from 'node:fs';
import { join, dirname, resolve, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '../../..');
const REV = process.argv[2];
if (!REV) { console.error('USAGE: posthoc-drift-cured.mjs <rev-before-this-unit>'); process.exit(3); }
const { stripSource, blankLongStrings } = await import(join(ROOT, 'scripts/lib/strip-source.mjs'));

const gateSrc = readFileSync(join(ROOT, 'scripts/verify-decl-body-slicers.mjs'), 'utf8');
const capture = (label, re) => {
  const m = gateSrc.match(re);
  if (!m) { console.error(`CAPTURE-FAILED — ${label}`); process.exit(3); }
  return m[1];
};
const cmpSrc = capture('cmp factory', /const cmp = (\(ch\) => new RegExp\([\s\S]*?\));\n/);
// eslint-disable-next-line no-eval
const cmpRaw = eval(cmpSrc);
const OB = cmpRaw(capture('OPEN_BRACE', /const OPEN_BRACE = cmp\('(.)'\)/));
const CB = cmpRaw(capture('CLOSE_BRACE', /const CLOSE_BRACE = cmp\('(.)'\)/));
const EXTS = new Set(capture('EXTS', /const EXTS = new Set\(\[([^\]]*)\]\)/)
  .split(',').map((s) => s.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean));
const SELF = new Set(capture('SELF', /const SELF = new Set\(\[([\s\S]*?)\]\)/)
  .split(',').map((s) => s.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean));
const inPop = (code) => OB.test(code) && CB.test(code);

const tracked = execFileSync('git', ['-C', ROOT, 'ls-files'], { encoding: 'utf8' })
  .split('\n').map((l) => l.trim()).filter(Boolean);
// The files this unit ADDED, taken from git rather than from a list I would be typing myself
// (`feedback_a_hand_typed_kp_is_not_a_slice`).
const addedByUnit = execFileSync('git', ['-C', ROOT, 'diff', '--name-only', '--diff-filter=A', `${REV}..HEAD`], { encoding: 'utf8' })
  .split('\n').map((l) => l.trim()).filter((f) => f && EXTS.has(extname(f)));

let popWide = 0, popNarrow = 0;
const unitWide = [], unitNarrow = [];
for (const rel of tracked) {
  if (SELF.has(rel) || !EXTS.has(extname(rel))) continue;
  let raw; try { raw = readFileSync(join(ROOT, rel), 'utf8'); } catch { continue; }
  const w = inPop(stripSource(raw, false)), n = inPop(blankLongStrings(raw, 2));
  if (w) popWide += 1;
  if (n) popNarrow += 1;
  if (addedByUnit.includes(rel)) {
    if (w) unitWide.push(rel);
    if (n) unitNarrow.push(rel);
  }
}
console.log('=== the two populations at HEAD ===');
console.log(`  tracked code files:                    ${tracked.filter((f) => EXTS.has(extname(f))).length}`);
console.log(`  population under the OLD (wide) key:   ${popWide}`);
console.log(`  population under the LIVE (narrow) key: ${popNarrow}`);
console.log(`  departures:                            ${popWide - popNarrow}`);

console.log(`\n=== this unit's own new code files — the drift test ===`);
console.log(`  code files added since ${REV}: ${addedByUnit.length}`);
for (const f of addedByUnit) console.log(`      ${f}`);
console.log(`  of those, in the population under the OLD key:  ${unitWide.length}`);
console.log(`  of those, in the population under the LIVE key: ${unitNarrow.length}`);
const cured = unitWide.length > 0 && unitNarrow.length === 0;
console.log(`\n  The published drift is "+1 per instrument that carries a brace comparison".`);
console.log(`  This unit added ${addedByUnit.length} code file(s), ${unitWide.length} of which the OLD key would have`);
console.log(`  admitted — so the old reading would have moved the population by +${unitWide.length}.`);
console.log(`  Under the live key it moves by +${unitNarrow.length}.`);
console.log(`\n  ${cured ? 'DRIFT CURED for the fixture-carrying class — and NOT by a declaration: these are this'
  + '\n  very fire\'s files, measured after the cure landed, not a class promised for the next one.'
  : unitWide.length === 0 ? 'VACUOUS — this unit added no file the old key would have admitted, so the leg'
    + '\n  cannot tell a cure from an absence of subjects. Nothing is claimed.'
    : 'NOT CURED — a new instrument still enters the population; see the list above.'}`);
console.log('\n  SCOPE, stated so it is not over-read: this cures the drift for instruments that carry'
  + '\n  their comparison as QUOTED FIXTURE TEXT. An instrument that hand-rolls a LIVE brace'
  + '\n  comparison still enters the population, correctly — that is what the gate is for.');
process.exit(unitWide.length === 0 ? 2 : (cured ? 0 : 1));
