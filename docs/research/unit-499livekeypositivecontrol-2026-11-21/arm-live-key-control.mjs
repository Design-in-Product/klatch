/**
 * unit-499livekeypositivecontrol — ARM
 *
 * Grades P1 and P4 of `PRE-REGISTRATION.md` (pre-reg `023d0f58`, pushed to `main` before this file
 * existed).
 *
 * Subject: docblock property 4 of `scripts/verify-decl-body-slicers.mjs` says the live key and the
 * hazard reader "disagree **0** times" over the `\s` closure. A 0 is what a working pair produces
 * and also what two DEAD readers produce. Theseus's 11-21 §3 named the separating term —
 * `bothTrue === ws.length` — and drove it against an in-memory slice of unit-497's arm. This arm
 * drives it at the **live** key instead, which is the surface the docblock sentence describes.
 *
 * Three things this file deliberately does NOT do:
 *   1. It does not edit `docs/research/unit-497paddedlabelclosure-2026-11-21/` — not by reader, not
 *      by byte. The 11-20 *don't edit them* decision is not reopened. unit-497's published 0 is not
 *      wrong; it is unseparated, and the separation belongs on the live claim.
 *   2. It does not re-TYPE the key. A hand-typed reader is not a slice — the key expression is cut
 *      out of the live file by the shared slicer and evaluated as cut. Re-typing it would grade this
 *      file's typing.
 *   3. It does not type the member set from the Unicode spec. The set is DERIVED by scanning
 *      U+0000..U+10FFFF with a `u`-flagged `/\s/`, so it cannot be an answer key of this unit's own
 *      making.
 */
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { bodyOf } from '../../../scripts/lib/decl-body.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..', '..', '..');
const GATE = join(ROOT, 'scripts', 'verify-decl-body-slicers.mjs');

const fail = (m) => { console.error(`ARM BLOCKED — ${m}`); process.exit(2); };
const src = readFileSync(GATE, 'utf8');

// ---------------------------------------------------------------------------
// 1. The slice. Two spans, both cut from the live file, both asserted unique.
// ---------------------------------------------------------------------------
const publishBody = bodyOf(src, 'publish');
if (typeof publishBody !== 'string' || publishBody.length === 0) fail('publish() did not slice');

const offset = src.indexOf(publishBody);
if (offset < 0 || src.indexOf(publishBody, offset + 1) !== -1) {
  fail('the sliced publish() body is not unique in the source');
}

// The key expression, cut out of the sliced body rather than typed. One occurrence asserted.
const KEY_RE = /LABELS\.find\(\(v\) => (.*?\(v\))\)/;
const keyMatch = publishBody.match(KEY_RE);
if (!keyMatch) fail('the key expression did not match inside the sliced publish() body');
const keyExpr = keyMatch[1];
const keyOccurrences = publishBody.split(keyExpr).length - 1;
if (keyOccurrences !== 1) fail(`the key expression occurs ${keyOccurrences} times, expected exactly 1`);

// `LABELS` is declared outside publish(), so it is cut separately — from the live file, same rule.
const LABELS_RE = /^const LABELS = (\[[^\]]*\]);$/m;
const labelsMatch = src.match(LABELS_RE);
if (!labelsMatch) fail('the LABELS declaration did not match in the live file');
const labelsLiteral = labelsMatch[1];
if (src.split(labelsLiteral).length - 1 !== 1) fail('the LABELS literal is not unique in the source');

// The hazard reader. The docblock writes it `/LABEL\s+(\d+)/`, where `LABEL` is a METAVARIABLE
// standing for an actual verdict token — not the literal five characters `LABEL`. The first draft of
// this arm typed it as a literal and every cell came back disagreeing with bothTrue 0 and bothFalse
// 0; the separate P4 sanity term `unpadded label is TRUE on both` read false and named it. Recorded
// because it is the same defect class as the subject: a reader keyed on a token that is not in the
// vocabulary it is reading.
//
// So the rival's vocabulary is taken from the SAME cut as the key's. That is the realistic model —
// an outside reader keyed on the partition's tokens — and it has a consequence this arm exists to
// expose: a cripple of the cut vocabulary kills BOTH readers at once, which is precisely the
// failure the `0 disagreements` figure cannot see and the positive control can.
const hazardFor = (/** @type {string} */ label) => new RegExp(`${label}\\s*$`);

// ---------------------------------------------------------------------------
// 2. Build the two predicates from the slice. `keyExpr` reads `v` and `line`.
// ---------------------------------------------------------------------------
function build(labelsSrc) {
  // eslint-disable-next-line no-new-func
  const mk = new Function('line', `const LABELS = ${labelsSrc};\n  return LABELS.find((v) => ${keyExpr});`);
  const labels = JSON.parse(labelsSrc.replace(/'/g, '"'));
  return { byKey: (line) => Boolean(mk(line)), labels };
}

// ---------------------------------------------------------------------------
// 3. The member set, DERIVED. Full range, `u`-flagged.
// ---------------------------------------------------------------------------
const WS_RE = /\s/u;
const ws = [];
for (let cp = 0; cp <= 0x10ffff; cp += 1) {
  const ch = String.fromCodePoint(cp);
  if (WS_RE.test(ch)) ws.push(ch);
}
const astral = ws.filter((c) => c.codePointAt(0) > 0xffff).length;

// ---------------------------------------------------------------------------
// 4. The leg, with the positive control as its OWN term and its OWN counter.
//    P4's sanity terms are recorded separately from P1's claim on purpose: a leg that
//    conjoins a sanity check with its claim into one counter cannot say which half reddened.
// ---------------------------------------------------------------------------
// THREE sources, all cut from the same live literal and then held apart. The first draft had two,
// and two cannot express the failure being graded: if the probe tokens share a source with either
// reader, crippling that reader also rewrites the lines being read, and the drive silently changes
// subject instead of going blind. So:
//   - `keyLabelsSrc`  — the vocabulary the LIVE key reads (crippleable)
//   - `rivalLabels`   — the vocabulary the outside hazard reader reads (crippleable, independently)
//   - `PROBE_LABELS`  — the tokens the probe LINES carry (never crippled; the subject must stay put)
const PROBE_LABELS = JSON.parse(labelsLiteral.replace(/'/g, '"'));

function drive(keyLabelsSrc, rivalLabels, tag) {
  const { byKey, labels } = build(keyLabelsSrc);
  let cells = 0;
  let disagreements = 0;
  let bothTrue = 0;
  let bothFalse = 0;
  const disagreeing = [];
  for (const [i, probeLabel] of PROBE_LABELS.entries()) {
    const byHazard = (line) => hazardFor(rivalLabels[i]).test(line);
    for (const c of ws) {
      const line = `  ${probeLabel}${c}`;
      const a = byKey(line);
      const b = byHazard(line);
      cells += 1;
      if (a !== b) { disagreements += 1; disagreeing.push(`${probeLabel}+U+${c.codePointAt(0).toString(16).toUpperCase().padStart(4, '0')}`); }
      if (a && b) bothTrue += 1;
      if (!a && !b) bothFalse += 1;
    }
  }
  // Separate sanity terms. Deliberately NOT fused into the counters above.
  const sanity = {
    membersDerived: ws.length,
    astralMembers: astral,
    labelsParsed: labels.length,
    probeLabels: PROBE_LABELS.length,
    rivalLabels: rivalLabels.length,
    unpaddedIsTrue: PROBE_LABELS.every((l, i) => byKey(`  ${l}`) && hazardFor(rivalLabels[i]).test(`  ${l}`)),
    quotedIsFalse: PROBE_LABELS.every((l, i) => !byKey(`  \`${l}\``) && !hazardFor(rivalLabels[i]).test(`  \`${l}\``)),
  };
  return { tag, cells, disagreements, bothTrue, bothFalse, disagreeing, sanity };
}

// Not exported. The cripple re-slices the live file for itself rather than importing this arm —
// an arm that `process.exit`s cannot be imported, and an independent second slice is worth more
// than the few lines it costs.
const control = drive(labelsLiteral, [...PROBE_LABELS], 'CONTROL (live key, as sliced)');

console.log('unit-499livekeypositivecontrol — ARM');
console.log(`  gate file                     ${'scripts/verify-decl-body-slicers.mjs'}`);
console.log(`  publish() body sliced at      offset ${offset}, ${Buffer.byteLength(publishBody, 'utf8')} bytes, 1 occurrence`);
console.log(`  key expression, as CUT        ${keyExpr}`);
console.log(`  LABELS literal, as CUT        ${labelsLiteral}`);
console.log(`  hazard rival, per label       /<label>\\s*$/  (vocabulary from the same cut)`);
console.log('');
console.log('  P1 — the claim and its positive control, at the LIVE key');
console.log(`    whitespace members derived    ${control.sanity.membersDerived}  (astral: ${control.sanity.astralMembers})`);
console.log(`    cells driven                  ${control.cells}  (${control.sanity.probeLabels} labels x ${control.sanity.membersDerived} members)`);
console.log(`    disagreements                 ${control.disagreements}${control.disagreements ? `  at ${control.disagreeing.slice(0, 6).join(' ')}${control.disagreeing.length > 6 ? ' …' : ''}` : ''}`);
console.log(`    bothTrue  (POSITIVE CONTROL)  ${control.bothTrue} of ${control.cells}`);
console.log(`    bothFalse                     ${control.bothFalse} of ${control.cells}`);
console.log('');
console.log('  P4 — sanity terms, recorded separately from the claim above');
console.log(`    LABELS parsed from the cut    ${control.sanity.labelsParsed} entries`);
console.log(`    probe labels (cut separately) ${control.sanity.probeLabels}`);
console.log(`    unpadded label is TRUE both   ${control.sanity.unpaddedIsTrue}`);
console.log(`    quoted label is FALSE both    ${control.sanity.quotedIsFalse}`);
console.log('');

const p1 = control.disagreements === 0 && control.bothTrue === control.cells;
console.log(`  P1 ${p1 ? 'HIT' : 'REFUTED'} — 0 disagreements AND bothTrue === cells: ${p1}`);
console.log(`     separating term bothTrue === cells -> ${control.bothTrue === control.cells}`);
process.exit(p1 ? 0 : 1);
