/**
 * unit-499livekeypositivecontrol — CRIPPLE
 *
 * Grades P2. Theseus's 11-21 §3 showed that unit-497's `0 disagreements` leg publishes
 * byte-identical green figures with BOTH of its readers mis-keyed at once, because the leg's control
 * set guards *both predicates always TRUE* and the *both always FALSE* failure satisfies that
 * control rather than violating it. This file asks whether the same hole exists at the LIVE key —
 * the one docblock property 4 of `scripts/verify-decl-body-slicers.mjs` describes.
 *
 * The cripple is READER-ONLY and runs entirely in memory:
 *   - the tracked file is never written;
 *   - `docs/research/unit-497paddedlabelclosure-2026-11-21/` is not touched, by reader or by byte
 *     (the 11-20 *don't edit them* decision is not reopened);
 *   - the probe LINES keep their original tokens. Only the two READERS' vocabularies are crippled.
 *     If the probes moved with the readers, this would not be a cripple — it would be a different
 *     subject, scoring green for the wrong reason.
 *
 * This file re-slices the live gate for itself rather than importing the arm. An arm that
 * `process.exit`s cannot be imported, and a second independent slice is worth the few duplicated
 * lines: if the two slices disagreed, that would itself be the finding.
 */
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { bodyOf } from '../../../scripts/lib/decl-body.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..', '..', '..');
const GATE = join(ROOT, 'scripts', 'verify-decl-body-slicers.mjs');

const fail = (m) => { console.error(`CRIPPLE BLOCKED — ${m}`); process.exit(2); };
const src = readFileSync(GATE, 'utf8');

const publishBody = bodyOf(src, 'publish');
const keyMatch = publishBody.match(/LABELS\.find\(\(v\) => (.*?\(v\))\)/);
if (!keyMatch) fail('the key expression did not match inside the sliced publish() body');
const keyExpr = keyMatch[1];

const labelsMatch = src.match(/^const LABELS = (\[[^\]]*\]);$/m);
if (!labelsMatch) fail('the LABELS declaration did not match in the live file');
const labelsLiteral = labelsMatch[1];

const PROBE_LABELS = JSON.parse(labelsLiteral.replace(/'/g, '"'));
const VICTIM = 'GUARDED';
const SUBSTITUTE = 'ZZZZZZZ'; // same length, not a member of the vocabulary, not a substring of one

// The substitution is keyed on the QUOTED literal, not the bare token. The first draft used the bare
// token and the assertion below refused it at 2 occurrences: `GUARDED` is a substring of `UNGUARDED`,
// which is another member of the same vocabulary. A bare-token cripple would have silently damaged
// two of the three readers' entries while claiming to damage one — a cripple that is not the
// reader-only cripple it says it is. This is the same superstring hazard the gate's own docblock
// property 3 names (`MISGUARDED`), met here from the other side.
const VICTIM_LITERAL = `'${VICTIM}'`;
const SUBSTITUTE_LITERAL = `'${SUBSTITUTE}'`;

// --- the substitution, asserted exactly once, in each reader's vocabulary separately -------------
const occurrences = labelsLiteral.split(VICTIM_LITERAL).length - 1;
if (occurrences !== 1) fail(`${VICTIM_LITERAL} occurs ${occurrences} times in the cut LABELS literal, expected exactly 1`);
const bareOccurrences = labelsLiteral.split(VICTIM).length - 1;
const crippledLabelsSrc = labelsLiteral.replace(VICTIM_LITERAL, SUBSTITUTE_LITERAL);
if (crippledLabelsSrc === labelsLiteral) fail('the key-vocabulary substitution changed nothing');
const crippledRival = PROBE_LABELS.map((l) => (l === VICTIM ? SUBSTITUTE : l));
if (crippledRival.filter((l) => l === SUBSTITUTE).length !== 1) fail('the rival-vocabulary substitution did not land exactly once');

// --- the probes are asserted UNMOVED --------------------------------------------------------------
if (!PROBE_LABELS.includes(VICTIM)) fail('the probe tokens lost the victim label — this is not a reader-only cripple');
if (PROBE_LABELS.join('|') !== JSON.parse(labelsLiteral.replace(/'/g, '"')).join('|')) {
  fail('the probe tokens moved during the cripple');
}

const WS_RE = /\s/u;
const ws = [];
for (let cp = 0; cp <= 0x10ffff; cp += 1) {
  const ch = String.fromCodePoint(cp);
  if (WS_RE.test(ch)) ws.push(ch);
}

const hazardFor = (label) => new RegExp(`${label}\\s*$`);

function drive(keyLabelsSrc, rivalLabels) {
  // eslint-disable-next-line no-new-func
  const mk = new Function('line', `const LABELS = ${keyLabelsSrc};\n  return LABELS.find((v) => ${keyExpr});`);
  const byKey = (line) => Boolean(mk(line));
  let cells = 0; let disagreements = 0; let bothTrue = 0; let bothFalse = 0;
  for (const [i, probeLabel] of PROBE_LABELS.entries()) {
    const byHazard = (line) => hazardFor(rivalLabels[i]).test(line);
    for (const c of ws) {
      const line = `  ${probeLabel}${c}`;
      const a = byKey(line); const b = byHazard(line);
      cells += 1;
      if (a !== b) disagreements += 1;
      if (a && b) bothTrue += 1;
      if (!a && !b) bothFalse += 1;
    }
  }
  return { cells, disagreements, bothTrue, bothFalse };
}

const control = drive(labelsLiteral, [...PROBE_LABELS]);
const crippled = drive(crippledLabelsSrc, crippledRival);

const row = (tag, r) => `  ${tag.padEnd(9)} cells ${String(r.cells).padStart(3)}  disagreements ${String(r.disagreements).padStart(3)}`
  + `  bothTrue ${String(r.bothTrue).padStart(3)} of ${r.cells}  bothFalse ${String(r.bothFalse).padStart(3)}`;

console.log('unit-499livekeypositivecontrol — CRIPPLE (reader-only, in memory, tracked file unwritten)');
console.log(`  victim label                  ${VICTIM} -> ${SUBSTITUTE}  (keyed on ${VICTIM_LITERAL}, 1 occurrence asserted in each reader)`);
console.log(`  bare-token occurrences        ${bareOccurrences}  <- why the key is the QUOTED literal: \`${VICTIM}\` is a substring of \`UN${VICTIM}\``);
console.log(`  probe tokens                  ${PROBE_LABELS.join(', ')}   ASSERTED UNMOVED`);
console.log('');
console.log(row('CONTROL', control));
console.log(row('CRIPPLE', crippled));
console.log('');

const publishedFiguresIdentical = control.disagreements === crippled.disagreements;
const controlSeparates = control.bothTrue !== crippled.bothTrue;
console.log(`  the PUBLISHED figure (disagreements) moves under the cripple:  ${!publishedFiguresIdentical}`);
console.log(`  the POSITIVE CONTROL (bothTrue) moves under the cripple:       ${controlSeparates}  (${control.bothTrue} -> ${crippled.bothTrue})`);
console.log('');

const p2 = publishedFiguresIdentical && controlSeparates;
console.log(`  P2 ${p2 ? 'HIT' : 'REFUTED'} — disagreements stays ${control.disagreements} while bothTrue separates: ${p2}`);
if (p2) {
  console.log('     So the live claim has the same hole Theseus found in unit-497: the figure the docblock');
  console.log('     publishes is byte-identical whether the readers work or are dead, and `bothTrue === cells`');
  console.log('     is the one term that tells those two states apart.');
}
process.exit(p2 ? 0 : 1);
