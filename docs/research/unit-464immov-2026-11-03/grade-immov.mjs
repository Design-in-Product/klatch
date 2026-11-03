#!/usr/bin/env node
// grade-immov — the `why`-column census (P4/P5/P6), over all 13 rows of
// unit-464order-2026-11-02/HAND-AXES-13.tsv rather than over the one row Theseus routed.
// [[feedback_census_the_mechanism_not_just_the_reported_instance]]
//
// THE READER IS HIS, AND IT IS NOT A COPY. The pre-registration said I would copy his
// `spanOf`/`countOps` verbatim and pin the copy byte-identical. A copy with a verbatim pin beside
// it is strictly worse than no copy: it can drift between the fire that writes the pin and the
// fire that reads it, and the pin is then the only thing standing between a reader and a
// paraphrase. So this LIFTS the region out of `unit-464cell-2026-11-02/grade-cell.mjs` AT THE PIN
// and evaluates it — the same `lift()` pattern his own subject uses at
// `grade-the-attrib-cure.mjs:177`. There is nothing to keep in sync, because the source IS his
// file. [[feedback_verbatim_source_pin_is_not_a_property_pin]]
// [[feedback_check_lib_before_handrolling_a_detector]]
//
// TWO PINS, NAMED SEPARATELY, because one of the inputs is this unit's own hand read and a unit's
// own artefact cannot carry the subject's pin — it did not exist at the subject's pin.
// [[feedback_an_instruments_own_input_cannot_be_pinned_to_the_subjects_rev]]
//   SUBJ_PIN  e0fbd74c   the subjects: his grade-cell.mjs, the axes TSV, the 13 graded files
//   HAND_PIN  e3db0afc   my HAND-WHY-13.tsv, at the commit that filed it before this grader existed

import { execFileSync } from 'node:child_process';
import { stripSource } from '../../../scripts/lib/strip-source.mjs';

const SUBJ_PIN = process.env.SUBJ_PIN ?? 'e0fbd74c';
const HAND_PIN = process.env.HAND_PIN ?? 'e3db0afc';
const SUBJ_ROOT = 'docs/research/';
const AXES = 'docs/research/unit-464order-2026-11-02/HAND-AXES-13.tsv';
const HAND = 'docs/research/unit-464immov-2026-11-03/HAND-WHY-13.tsv';
const HIS_READER = 'docs/research/unit-464cell-2026-11-02/grade-cell.mjs';

// A deliberate switch for the cripple drive, flipped by the PRESENCE OF A FILE rather than by an
// env var, because this fire's shell refuses an inline `VAR=… node …` prefix. It perturbs the
// CENSUS KEY, never the subject, and it is named so in the cripple map.
// [[feedback_a_cripple_map_must_name_whether_it_perturbs_the_key_or_the_subject]]
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const HERE = dirname(fileURLToPath(import.meta.url));
const CRIPPLE = existsSync(join(HERE, 'CRIPPLE-WHYKEY'));

let red = 0;
let unrunnable = 0;
const check = (id, cond, msg) => {
  if (cond === true) console.log(`${id}  ok    ${msg}`);
  else { console.log(`${id}  RED   ${msg}`); red += 1; }
};
const refuse = (id, msg) => { console.log(`${id}  UNRUNNABLE  ${msg}`); unrunnable += 1; };
const verdict = (p, claim, measured, pred) => {
  if (measured === null) { console.log(`\n${p}  UNMEASURED  ${claim}`); unrunnable += 1; return; }
  const ok = pred(measured);
  console.log(`\n${p}  ${ok ? 'LANDS' : 'REFUTED'}  ${claim}`);
  console.log(`     measured: ${JSON.stringify(measured)}`);
  if (!ok) red += 1;
};

const git = (args) => {
  try {
    return execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  } catch {
    return null;
  }
};

if (CRIPPLE) console.log(`!! CRIPPLE-WHYKEY present: the census KEY is deliberately blinded in this arm.\n`);

// ===========================================================================================
// Lift his reader out of his file at the pin
// ===========================================================================================
const hisSrc = git(['show', `${SUBJ_PIN}:${HIS_READER}`]);
let reader = null;
if (hisSrc === null) {
  refuse('GLIFTANCHOR', `cannot read ${HIS_READER} at ${SUBJ_PIN} — the whole census is ungraded, and I will not fall back to a reader of my own`);
} else {
  const START = 'const CMP = /===';
  const ENDMARK = 'return { cmps, andTop, orTop,';
  const s = hisSrc.indexOf(START);
  const e0 = hisSrc.indexOf(ENDMARK, s);
  const e = e0 < 0 ? -1 : hisSrc.indexOf('\n};', e0);
  if (s < 0 || e0 < 0 || e < 0) {
    refuse('GLIFTANCHOR', `one of the lift anchors is missing in his file at the pin (start ${s}, endmark ${e0}, close ${e}) — the region is not intact and nothing below is quotable`);
  } else {
    const region = hisSrc.slice(s, e + 3);
    // A present anchor is not an intact span: assert the region actually CONTAINS both definitions
    // and lifts to two callable functions, not merely that it starts and ends where expected.
    // [[feedback_a_present_anchor_does_not_mean_an_intact_span]]
    let built = null;
    try {
      built = new Function('git', 'PIN', 'SUBJ_ROOT', 'stripSource',
        `${region}\nreturn { CMP, spanOf, countOps };`)(git, SUBJ_PIN, SUBJ_ROOT, stripSource);
    } catch (err) {
      refuse('GLIFTANCHOR', `his region lifted but would not evaluate: ${String(err.message).split('\n')[0]}`);
    }
    if (built !== null) {
      const intact = /const spanOf = /.test(region) && /const countOps = /.test(region)
        && typeof built.spanOf === 'function' && typeof built.countOps === 'function';
      check('GLIFTANCHOR', intact,
        `his spanOf/countOps lifted from ${HIS_READER} at ${SUBJ_PIN}: ${region.split('\n').length} lines, both definitions present, both callable. No copy of his reader exists in this unit, so there is nothing to drift`);
      if (intact) reader = built;
    }
  }
}

// ===========================================================================================
// Slice both TSVs. Neither is re-typed.
// ===========================================================================================
const sliceTsv = (pin, path) => {
  const t = git(['show', `${pin}:${path}`]);
  if (t === null) return null;
  const lines = t.split('\n');
  const hi = lines.findIndex((l) => l.startsWith('file\tline\tid\t'));
  if (hi < 0) return null;
  const cols = lines[hi].split('\t');
  return {
    header: lines.slice(0, hi).join('\n'),
    rows: lines.slice(hi + 1)
      .filter((l) => l.trim() !== '' && !l.startsWith('#'))
      .map((l) => Object.fromEntries(l.split('\t').map((v, i) => [cols[i] ?? `c${i}`, v]))),
  };
};

const axes = sliceTsv(SUBJ_PIN, AXES);
const hand = sliceTsv(HAND_PIN, HAND);
if (axes === null) refuse('GAXES', `cannot slice ${AXES} at ${SUBJ_PIN}`);
if (hand === null) refuse('GHAND', `cannot slice ${HAND} at ${HAND_PIN}`);

if (axes !== null && hand !== null && reader !== null) {
  check('GAXES', axes.rows.length === 13, `sliced ${axes.rows.length} rows from the axes TSV at ${SUBJ_PIN}`);
  check('GHAND', hand.rows.length === 13, `sliced ${hand.rows.length} rows from my hand read at ${HAND_PIN}`);

  const key = (r) => `${r.file}|${r.line}|${r.id}`;
  const handBy = new Map(hand.rows.map((r) => [key(r), r]));
  check('GJOIN', axes.rows.every((r) => handBy.has(key(r))),
    `all 13 axes rows join to my hand read on (file,line,id) — ${axes.rows.filter((r) => handBy.has(key(r))).length}/13`);

  // =========================================================================================
  // THE CENSUS KEY. Two registered classes plus the disclosure differentiation.
  // =========================================================================================
  // CRIPPLED ARM: the cmp-operator alternation of the quotation key is blinded to a token no `why`
  // column writes, so no fragment is ever recognised as carrying a comparison. The phantom key's
  // `vs` alternation is blinded the same way.
  const FRAG_CMP = CRIPPLE ? /\u0000NEVER\u0000/ : /===|!==|==|!=|<=|>=|<|>/;
  const CLAIMS_CMP = CRIPPLE ? /\u0000NEVER\u0000/ : /\bvs\b|compared to/i;
  // "at :NN" anywhere in the why DISCLOSES another line. Undifferentiated containment would fuse
  // disclosure with misattribution. [[feedback_an_undifferentiated_containment_match_fuses_two_mechanisms]]
  const DISCLOSES = /\bat :(\d+)\b/;
  const norm = (s) => s.replace(/\s+/g, ' ').trim();

  const measured = [];
  for (const r of axes.rows) {
    const span = reader.spanOf(r.file, r.line);
    if (span === null) { refuse(`GSPAN:${r.id}@${r.line}`, `cannot slice the span for ${r.file}:${r.line} at ${SUBJ_PIN} — this row is refused, NOT counted clean`); continue; }
    const ops = reader.countOps(span.text);

    // Quotation containment runs over the RAW span, not the blanked one: a fragment quoting a
    // string literal would never be found in a span whose literals are blanked to spaces.
    // [[feedback_a_diff_based_span_test_is_blind_to_self_blanking_chars]]
    const rawSrc = git(['show', `${SUBJ_PIN}:${SUBJ_ROOT}${r.file}`]);
    if (rawSrc === null) { refuse(`GRAW:${r.id}@${r.line}`, `cannot read the raw source for ${r.file} at ${SUBJ_PIN} — row refused`); continue; }
    const rawAll = rawSrc.split('\n');
    const rawSpan = norm(rawAll.slice(r.line - 1, r.line - 1 + span.lines).join('\n'));

    const frags = [...(r.why ?? '').matchAll(/`([^`]+)`/g)].map((m) => m[1]).filter((f) => FRAG_CMP.test(f));
    const outOfSpan = frags.filter((f) => !rawSpan.includes(norm(f)));
    const discloses = DISCLOSES.test(r.why ?? '');
    const claimsCmp = CLAIMS_CMP.test(r.why ?? '');

    let cls;
    if (outOfSpan.length > 0) cls = discloses ? 'outofspan-D' : 'outofspan-U';
    else if (claimsCmp && ops.cmps === 0) cls = 'phantom';
    else if (frags.length === 0 && !claimsCmp) cls = 'unreached';
    else cls = 'clean';

    // Where each out-of-span fragment ACTUALLY lives, so the finding is a location and not a denial.
    const foundAt = outOfSpan.map((f) => {
      const i = rawAll.findIndex((l) => norm(l).includes(norm(f)));
      return `${norm(f)} -> ${i < 0 ? 'nowhere in the file' : `:${i + 1}`}`;
    });

    measured.push({ ...r, cls, cmps: ops.cmps, operands: ops.andTop + ops.orTop + 1, spanLines: span.lines, frags: frags.length, outOfSpan: outOfSpan.length, discloses, claimsCmp, foundAt });
  }

  console.log(`\nTHE ${measured.length}-ROW \`why\` CENSUS (span = his model; operators over the BLANKED span, quotation over the RAW span):`);
  for (const m of measured) {
    console.log(`  ${m.file.split('/').pop()}:${String(m.line).padEnd(4)} ${m.id.padEnd(9)} ${m.axisA.padEnd(11)} ${m.cls.padEnd(12)} cmps=${m.cmps} operands=${String(m.operands).padStart(2)} spanLines=${m.spanLines} frags=${m.frags} claimsCmp=${m.claimsCmp} discloses=${m.discloses}`);
    for (const f of m.foundAt) console.log(`                          OUT OF SPAN: ${f}`);
  }

  // --------------------------------------------------------------------------------- the guards
  const kpQuote = measured.find((m) => m.id === 'GDELTA' && m.line === '60');
  check('GKPQUOTE', kpQuote !== undefined && kpQuote.frags > 0 && kpQuote.outOfSpan === 0,
    `KNOWN POSITIVE for the quotation reader: @60's \`preSrc !== postSrc\` is recognised as a cmp-bearing fragment (${kpQuote?.frags}) and found IN its own span (${kpQuote?.outOfSpan} out-of-span). A reader that found nothing anywhere would fail this leg and could not manufacture the findings below`);

  const kpPhantom = measured.find((m) => m.id === 'GCURE' && m.line === '71');
  check('GKPPHANTOM', kpPhantom !== undefined && kpPhantom.claimsCmp === true && kpPhantom.cmps > 0 && kpPhantom.cls !== 'phantom',
    `KNOWN POSITIVE for the phantom reader: @71's why DOES say "vs" (claimsCmp ${kpPhantom?.claimsCmp}) and its span carries ${kpPhantom?.cmps} comparisons, so it reads ${kpPhantom?.cls} and not phantom. The reader keys on the property, not on the word`);

  const buckets = {};
  for (const m of measured) buckets[m.cls] = (buckets[m.cls] ?? 0) + 1;
  const reached = measured.filter((m) => m.cls !== 'unreached').length;
  check('GREACHED', reached + (buckets.unreached ?? 0) === measured.length && measured.length === 13,
    `the census prints its own REACH, not a clean count: reached ${reached} / unreached ${buckets.unreached ?? 0} of ${measured.length}. Buckets ${JSON.stringify(buckets)}`);

  // Departures against my hand read — the independent half.
  const deps = measured.filter((m) => handBy.get(key(m)).whyClass !== m.cls)
    .map((m) => `${m.id}@${m.line}: hand ${handBy.get(key(m)).whyClass} vs measured ${m.cls}`);
  check('GHANDWHY', deps.length === 0,
    `${deps.length} departures of ${measured.length} between my hand read's whyClass column and the measurement${deps.length ? `: ${deps.join(' ; ')}` : ''}`);

  // =========================================================================================
  // P4 — my hand count of comparison operators vs the lifted reader, over the conjunctive rows
  // =========================================================================================
  const conj = measured.filter((m) => m.axisA === 'conjunctive');
  const cmpDeps = conj.filter((m) => Number(handBy.get(key(m)).cmpHand) !== m.cmps)
    .map((m) => `${m.id}@${m.line}: hand ${handBy.get(key(m)).cmpHand} vs measured ${m.cmps}`);
  const opndDeps = conj.filter((m) => Number(handBy.get(key(m)).opndHand) !== m.operands)
    .map((m) => `${m.id}@${m.line}: hand ${handBy.get(key(m)).opndHand} vs measured ${m.operands}`);
  const zeroCmp = conj.filter((m) => m.cmps === 0);

  // The reader must be shown alive in the POSITIVE direction too, or "0 comparisons" is unquotable.
  const kpCmp = measured.find((m) => m.id === 'GCTRLPRE' && m.line === '161');
  check('GCMPREADERKP', kpCmp !== undefined && kpCmp.cmps === 3,
    `KNOWN POSITIVE for the operator reader: :161 reads ${kpCmp?.cmps} comparison operators (Theseus published 3 at his own pin). A reader returning 0 everywhere could not pass this leg, so the zeroes below are measurements`);

  verdict('P4', 'my hand count of comparison operators over the five conjunctive spans departs from the lifted reader on 0 of 5, and the number of those rows reading ZERO comparisons is 2',
    conj.length === 5 ? { conjRows: conj.length, cmpDepartures: cmpDeps, operandDepartures: opndDeps, zeroCmpRows: zeroCmp.map((m) => `${m.id}@${m.line}`), zeroCmpCount: zeroCmp.length } : null,
    (m) => m.cmpDepartures.length === 0 && m.zeroCmpCount === 2);

  // =========================================================================================
  // P5 — the axis-A DEFINITION's parenthetical, read off the TSV header at the pin
  // =========================================================================================
  const defLine = (axes.header.split('\n').find((l) => /^#\s+conjunctive\s/.test(l)) ?? '').replace(/^#\s*/, '');
  const hasParen = /each is compared to a literal/.test(defLine);
  verdict('P5', "the `conjunctive` DEFINITION in the entry carries a parenthetical ('each is compared to a literal') that is FALSE on every conjunctive row measuring zero comparison operators — so the defect is in the convention, not only in @186's why cell",
    defLine === '' ? null : { definitionAtPin: defLine, parentheticalPresent: hasParen, rowsFalsifyingIt: zeroCmp.map((m) => `${m.id}@${m.line}`), count: zeroCmp.length },
    (m) => m.parentheticalPresent === true && m.count >= 1);

  // =========================================================================================
  // P6 — the two REGISTERED classes, over all 13
  // =========================================================================================
  const defective = measured.filter((m) => m.cls === 'phantom' || m.cls === 'outofspan-U');
  verdict('P6', 'at least 3 of the 13 why columns carry a claim unsupported by the row\'s own registered span, under the two registered classes (phantom comparison; undisclosed out-of-span quotation)',
    { defective: defective.map((m) => `${m.id}@${m.line} ${m.cls}`), count: defective.length, disclosedNotCounted: measured.filter((m) => m.cls === 'outofspan-D').map((m) => `${m.id}@${m.line}`), routedByTheseus: 'GLIFT2@186' },
    (m) => m.count >= 3);

  // =========================================================================================
  // ADDENDUM, DECLARED NON-BLIND — a third defect class the registration does NOT cover
  // =========================================================================================
  // His memo told me @90's why says "ten conjuncts" where the span carries 13 operands, so this is
  // not a blind discovery and is reported outside P6's verdict rather than folded into its count.
  const WORD = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, thirteen: 13 };
  const countClaims = [];
  for (const m of measured) {
    const mm = (m.why ?? '').match(/\b(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|\d+)\s+conjuncts\b/i);
    if (!mm) continue;
    const claimed = WORD[mm[1].toLowerCase()] ?? Number(mm[1]);
    countClaims.push({ row: `${m.id}@${m.line}`, claimed, measuredOperands: m.operands, agrees: claimed === m.operands });
  }
  console.log(`\nADDENDUM (declared non-blind, OUTSIDE P6's count) — numeric "N conjuncts" claims vs measured operands:`);
  for (const c of countClaims) console.log(`  ${c.row.padEnd(14)} claims ${String(c.claimed).padStart(2)} · measured ${String(c.measuredOperands).padStart(2)} · ${c.agrees ? 'agrees' : 'WRONG'}`);
  const wrongCounts = countClaims.filter((c) => !c.agrees);
  console.log(`  ${wrongCounts.length} of ${countClaims.length} numeric conjunct claims are wrong. This class is reached by NEITHER registered class, which is why @90 lands in the unreached bucket above rather than in P6's count.`);

  // And the cross-check figure from his memo that I could not reproduce by eye: the shape map's
  // field count. Measured off the pinned source, because a figure I am correcting in someone
  // else's memo is exactly the kind I must not assert from a glance.
  // [[feedback_reproduce_their_figures_under_their_own_key]]
  const stealSrc = git(['show', `${SUBJ_PIN}:${SUBJ_ROOT}unit-464cure3-2026-11-01/grade-the-steal-cures.mjs`]);
  if (stealSrc === null) refuse('GSHAPEFIELDS', 'cannot read grade-the-steal-cures.mjs at the pin');
  else {
    const code = stripSource(stealSrc, true).split('\n');
    const s = code.findIndex((l) => /const shape = \(src\) => \(\{/.test(l));
    const e = s < 0 ? -1 : code.findIndex((l, i) => i > s && /^\}\);/.test(l.trim()) === false && /^\s*\}\);\s*$/.test(l));
    const body = s < 0 || e < 0 ? [] : code.slice(s + 1, e);
    const fields = body.filter((l) => /^\s{4}[A-Za-z_$][\w$]*:/.test(l)).map((l) => l.trim().split(':')[0]);
    console.log(`\n  his memo's cross-check: "the shape map has 8 fields". Measured at the pin: ${fields.length} — [${fields.join(',')}]`);
    check('GSHAPEFIELDS', fields.length > 0,
      `the shape-map field reader is alive (${fields.length} fields lifted), so the comparison against his 8 is a measurement and not a failed slice`);
  }
}

console.log(`\n=========================================================`);
console.log(`grade-immov (the why-column census): RED ${red} · UNRUNNABLE ${unrunnable}${CRIPPLE ? '   [CRIPPLED ARM]' : ''}`);
console.log(`VERDICT ${red === 0 && unrunnable === 0 ? 'GREEN' : red > 0 ? 'RED' : 'UNRUNNABLE'}`);
process.exit(red > 0 ? 1 : unrunnable > 0 ? 2 : 0);
