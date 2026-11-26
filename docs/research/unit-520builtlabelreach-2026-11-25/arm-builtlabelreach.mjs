/* unit-520builtlabelreach-2026-11-25 — arm
 *
 * Measures the REACH of the concatenated-label blindness that `unit-514` KP11 DECLARED (planted the
 * form, asserted the miss) and that `unit-516` §9 carried forward as unmeasured.
 *
 * Pre-registration: ./PRE-REGISTRATION.md, commit 2802d979 on main, pushed 19:49:56 PST before this
 * file existed.
 *
 * Discipline notes, each one a lesson this seat has already paid for:
 *  - The LABEL and the population FILTER are both EXTRACTED from published source at run time. If
 *    either extraction fails the arm aborts; it does not fall back to a typed literal, because a
 *    retyped selector in a different population is a different instrument.
 *  - The positive KP cells are necessarily PLANTED, and that is declared, not hidden: whether the
 *    live corpus holds a built label is the question this unit asks, so a sliced positive would
 *    presuppose the answer. The known NEGATIVE is sliced from a real tracked file.
 *  - P7 is the vacuity guard. A reach of 0 from a reader that never fired is a dead reader agreeing
 *    with my prior, not a measurement, so the number of joint collapses actually applied across the
 *    population is reported beside the reach and graded against a registered floor.
 *  - THIS FILE joins the population it measures the moment it is committed (Daedalus's unit-519 PH2,
 *    and unit-517's 836-vs-837). It carries planted built-label cells in its own source, so SELF is
 *    excluded BY PATH and the exclusion's own state is printed rather than assumed.
 */
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

process.chdir(execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim());

const SELF = 'docs/research/unit-520builtlabelreach-2026-11-25/arm-builtlabelreach.mjs';
const LABEL_SRC = 'docs/research/unit-516secondargfixture-2026-11-25/arm-secondargfixture.mjs';
const PRIOR = 'docs/research/unit-514equalityconsumer-2026-11-24/posthoc-rekey-prefix-and-binding.mjs';
const PRIOR_ARM = 'docs/research/unit-514equalityconsumer-2026-11-24/arm-equalityconsumer.mjs';
const NEG_CELL_FILE = 'docs/research/unit-510quotepathskip-2026-11-23/arm-quotepathskip.mjs';
const NEG_CELL_LINE = 160;              // unit-516 P3's first named site, a whole-literal consumer
const PUBLISHED_POP_LOW = 635;          // unit-516 §9: 635 files read on the arm drive
const PUBLISHED_POP_HIGH = 639;         // unit-516 §9: 639 matching on the re-drive
const P6_INTERVAL = [0, 2];             // registered reach interval, built-label sites
const P7_FLOOR = 20;                    // registered floor: files in which a joint was collapsed

const out = {};
const say = (...a) => console.log(...a);

/* ======================================================= §0 PROVENANCE, EXTRACTED NOT TYPED */

say('=== §0 PROVENANCE — label and population filter extracted from published source ===\n');
say(`  cwd, resolved to the repo root rather than inherited: ${process.cwd()}\n`);

const labelSrc = readFileSync(LABEL_SRC, 'utf8');
const labelMatch = labelSrc.match(/const LABEL = '([^']+)';/);
const LABEL = labelMatch ? labelMatch[1] : null;
say(`  LABEL extracted from ${LABEL_SRC}`);
say(`    literal: ${LABEL === null ? '(NOT FOUND — ABORT)' : JSON.stringify(LABEL)}   length ${LABEL === null ? 'n/a' : LABEL.length}`);

/* The PRIOR's own extractor, then the ARM's filter with it — the same two-step chain unit-516 used,
 * so the population rule has the same provenance as the figure it is compared against. */
const priorSrc = readFileSync(PRIOR, 'utf8');
const priorArmSrc = readFileSync(PRIOR_ARM, 'utf8');
const extractorMatch = priorSrc.match(/const extMatch = armSrc\.match\((\/.+?\/)\);/);
let extRe = null;
let armFilterLiteral = null;
if (extractorMatch) {
  const extractorRe = new RegExp(extractorMatch[1].slice(1, extractorMatch[1].lastIndexOf('/')));
  const m = priorArmSrc.match(extractorRe);
  if (m) { armFilterLiteral = m[1]; extRe = new RegExp(m[1].slice(1, m[1].lastIndexOf('/'))); }
}
say(`\n  the PRIOR's own extractor, sliced from its source: ${extractorMatch ? extractorMatch[1] : '(NOT FOUND)'}`);
say(`  the ARM's population filter, extracted with it:     ${armFilterLiteral ?? '(NOT FOUND)'}`);

const extKp = extRe
  ? [['a.mjs', true], ['b.js', true], ['c.md', false], ['d.ts', false]].map(([p, want]) => ({ p, want, got: extRe.test(p), ok: extRe.test(p) === want }))
  : [];
say(`  extracted filter KP: ${extKp.map((k) => `${k.p}=${k.got}${k.ok ? '' : ' MISMATCH'}`).join('  ') || '(not run)'}`);
const extKpOk = extKp.length === 4 && extKp.every((k) => k.ok);

const productDiff = execFileSync('git', ['diff', '--stat', 'HEAD', '--', 'packages/', 'scripts/'], { encoding: 'utf8' }).trim();
say(`\n  git diff --stat HEAD -- packages/ scripts/ : ${productDiff === '' ? 'EMPTY' : `NON-EMPTY\n${productDiff}`}`);

if (LABEL === null || extRe === null || !extKpOk) {
  say('\n  ABORT — an extraction failed or its KP mismatched. No measurement is published off a typed fallback.');
  process.exit(1);
}

out.provenance = {
  cwd: process.cwd(), label: LABEL, extractorLiteral: extractorMatch[1], armFilterLiteral,
  extKp, extKpOk, productDiffEmpty: productDiff === '',
};

/* ======================================================= §1 THE DETECTOR */

/* A concatenation joint: a closing quote, optional whitespace, `+`, optional whitespace, an opening
 * quote. Collapsing it splices the two adjacent literals into one run. Position-blind and
 * syntax-blind by design — it is not a parser, and both error directions are registered (P5, P9). */
const JOINT = /(['"`])\s*\+\s*(['"`])/g;
const collapse = (s) => s.replace(JOINT, '');
const countOcc = (s, needle) => {
  let n = 0;
  for (let i = s.indexOf(needle); i !== -1; i = s.indexOf(needle, i + 1)) n += 1;
  return n;
};
const jointCount = (s) => (s.match(JOINT) || []).length;
/* gain > 0 ⇔ the file holds label text that exists only once the joints are spliced */
const measure = (s) => {
  const raw = countOcc(s, LABEL);
  const col = countOcc(collapse(s), LABEL);
  return { raw, col, gain: col - raw, joints: jointCount(s) };
};

say('\n=== §1 THE DETECTOR, as specified in §2 of the pre-registration ===\n');
say(`  joint pattern: ${JOINT}`);
say('  gain = (label occurrences after every joint is collapsed) − (occurrences as committed)\n');

/* ======================================================= §2 KNOWN POSITIVES AND NEGATIVES */

say('=== §2 KP — three planted positives, one SLICED negative, two planted asserted-MISSED ===\n');

/* P1/P2/P3 — planted positives. DECLARED as planted: a sliced positive would presuppose the answer
 * to the very question this unit asks. The P1 cell is unit-514 KP11's exact form. */
const kpPos = [
  { id: 'P1', note: "unit-514 KP11's exact form, split at whitespace", cell: "num('tracked files ' + 'read:')" },
  { id: 'P2', note: 'split MID-WORD — a different shape, not a second instance of one', cell: "num('tracked files re' + 'ad:')" },
  { id: 'P3', note: 'three parts, two joints', cell: "num('tracked ' + 'files ' + 'read')" },
].map((k) => {
  const m = measure(k.cell);
  return { ...k, ...m, ok: m.raw === 0 && m.col >= 1 };
});
for (const k of kpPos) {
  say(`  ${k.id}  raw ${k.raw}  collapsed ${k.col}  gain ${k.gain}  ${k.ok ? 'PASS' : 'FAIL'}   ${k.note}`);
  say(`        cell: ${k.cell}`);
}

/* P4 — the known negative, SLICED from a real tracked file by readFileSync → split → index. */
const negSrc = readFileSync(NEG_CELL_FILE, 'utf8');
const negLine = negSrc.split('\n')[NEG_CELL_LINE - 1] ?? '';
const negM = measure(negLine);
const negOk = negLine.includes(LABEL) && negM.raw >= 1 && negM.gain === 0;
say(`\n  P4  raw ${negM.raw}  collapsed ${negM.col}  gain ${negM.gain}  ${negOk ? 'PASS' : 'FAIL'}   known negative, SLICED from ${NEG_CELL_FILE}:${NEG_CELL_LINE}`);
say(`        line, verbatim: ${negLine.trim()}`);
say(`        contains the whole label in one run: ${negLine.includes(LABEL)}`);

/* P5 — my detector's OWN declared blindness, planted and asserted MISSED. */
const kpBlind = [
  { id: 'P5a', note: 'assembled through a VARIABLE — no closing quote after the +', cell: "const w = 'read'; num('tracked files ' + w)" },
  { id: 'P5b', note: 'assembled through TEMPLATE INTERPOLATION — the text is never present', cell: 'num(`tracked files ${verb}`)' },
].map((k) => {
  const m = measure(k.cell);
  return { ...k, ...m, ok: m.raw === 0 && m.gain === 0 };
});
for (const k of kpBlind) {
  say(`\n  ${k.id}  raw ${k.raw}  collapsed ${k.col}  gain ${k.gain}  ${k.ok ? 'MISSED as asserted' : 'UNEXPECTEDLY SEEN'}   ${k.note}`);
  say(`        cell: ${k.cell}`);
}

const kpAllOk = kpPos.every((k) => k.ok) && negOk && kpBlind.every((k) => k.ok);
say(`\n  KP summary: ${kpPos.filter((k) => k.ok).length} of 3 positives, negative ${negOk ? 'PASS' : 'FAIL'}, ${kpBlind.filter((k) => k.ok).length} of 2 blindnesses asserted → ${kpAllOk ? 'the detector may be pointed at the corpus' : 'ABORT'}`);
out.kp = { kpPos, neg: { file: NEG_CELL_FILE, line: NEG_CELL_LINE, text: negLine.trim(), ...negM, ok: negOk }, kpBlind, kpAllOk };

if (!kpAllOk) {
  say('\n  ABORT — a KP cell failed. A census is not published off an ungraded detector.');
  process.exit(1);
}

/* ======================================================= §3 THE CENSUS */

say('\n=== §3 CENSUS over the tracked population under the extracted filter ===\n');

const tracked = execFileSync('git', ['ls-files'], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
  .split('\n').filter((p) => extRe.test(p));
const selfTracked = tracked.includes(SELF);
const pop = tracked.filter((p) => p !== SELF);
say(`  tracked files matching the extracted filter: ${tracked.length}`);
say(`  THIS FILE in that list: ${selfTracked} — excluded by path either way, because it carries planted built-label cells`);
say(`  population measured: ${pop.length}`);
say(`  unit-516 published 635 read / 639 matching; |${pop.length} − 635| = ${Math.abs(pop.length - PUBLISHED_POP_LOW)}, |${pop.length} − 639| = ${Math.abs(pop.length - PUBLISHED_POP_HIGH)}\n`);

let unreadable = 0;
let filesWithJoint = 0;
let totalJoints = 0;
let filesWithLabel = 0;
let rawTotal = 0;
let colTotal = 0;
const gainSites = [];

for (const p of pop) {
  let src;
  try { src = readFileSync(p, 'utf8'); } catch { unreadable += 1; continue; }
  const m = measure(src);
  totalJoints += m.joints;
  if (m.joints > 0) filesWithJoint += 1;
  if (m.raw > 0) filesWithLabel += 1;
  rawTotal += m.raw;
  colTotal += m.col;
  if (m.gain > 0) {
    /* Every gain site is published with its own line text, so a MANUFACTURED hit (P9) is visible
     * as one rather than silently counted as a finding. Located by collapsing line by line. */
    const lines = src.split('\n');
    const hits = [];
    for (let i = 0; i < lines.length; i += 1) {
      const lm = measure(lines[i]);
      if (lm.gain > 0) hits.push({ line: i + 1, text: lines[i].trim().slice(0, 200) });
    }
    gainSites.push({ file: p, ...m, hits });
  }
}

say(`  files unreadable: ${unreadable}`);
say(`  files containing the label as committed (any position): ${filesWithLabel}   occurrences ${rawTotal}`);
say(`  files in which at least one joint was COLLAPSED:          ${filesWithJoint}   joints collapsed ${totalJoints}`);
say(`  label occurrences after collapse:                         ${colTotal}   corpus-wide gain ${colTotal - rawTotal}`);
say(`  files with gain > 0 (built-label files):                  ${gainSites.length}`);

const siteCount = gainSites.reduce((n, g) => n + g.hits.length, 0);
say(`  built-label SITES (line-level, each printed below):       ${siteCount}\n`);

if (gainSites.length === 0) {
  say('  no file in the population holds label text that appears only after a joint collapse.');
} else {
  for (const g of gainSites) {
    say(`  ${g.file}   raw ${g.raw} → collapsed ${g.col}  (gain ${g.gain}, joints in file ${g.joints})`);
    for (const h of g.hits) say(`      :${h.line}  ${h.text}`);
    if (g.hits.length === 0) say('      (file-level gain with NO single line responsible — a MULTI-LINE joint; reported, not swallowed)');
  }
}

out.census = {
  trackedMatching: tracked.length, selfTracked, population: pop.length, unreadable,
  filesWithLabel, rawTotal, filesWithJoint, totalJoints, colTotal,
  corpusGain: colTotal - rawTotal, builtLabelFiles: gainSites.length, builtLabelSites: siteCount,
  gainSites,
};

/* ======================================================= §4 VERDICTS */

say('\n=== §4 VERDICTS, against the pre-registration ===\n');

const V = [];
const grade = (id, verdict, note) => { V.push({ id, verdict, note }); say(`  ${id.padEnd(4)} ${verdict.padEnd(8)} ${note}`); };

for (const k of kpPos) grade(k.id, k.ok ? 'HIT' : 'REFUTED', `planted positive: raw ${k.raw}, collapsed ${k.col} — ${k.note}`);
grade('P4', negOk ? 'HIT' : 'REFUTED', `sliced known negative: gain ${negM.gain} (collapse invents nothing where the label was already whole)`);
grade('P5', kpBlind.every((k) => k.ok) ? 'HIT' : 'REFUTED', 'my own blindness asserted: variable-assembled and interpolated labels both gain 0');

const p6In = siteCount >= P6_INTERVAL[0] && siteCount <= P6_INTERVAL[1];
grade('P6', p6In ? 'HIT' : 'REFUTED', `live reach ${siteCount} site(s) in ${gainSites.length} file(s); registered point 0, interval ${P6_INTERVAL[0]}–${P6_INTERVAL[1]} → point ${siteCount === 0 ? 'HELD' : 'REFUTED'}, interval ${p6In ? 'held' : 'REFUTED'}`);

const p7 = filesWithJoint >= P7_FLOOR;
grade('P7', p7 ? 'HIT' : 'REFUTED', `VACUITY GUARD: the collapse fired in ${filesWithJoint} file(s), ${totalJoints} joint(s), against a registered floor of ${P7_FLOOR}. ${p7 ? 'A reach of ' + siteCount + ' is therefore a measurement, not a dead reader.' : 'The reach figure above is NOT a finding — the reader barely ran.'}`);

const p8 = filesWithJoint > gainSites.length;
grade('P8', p8 ? 'HIT' : 'REFUTED', `files where the collapse changed TEXT (${filesWithJoint}) vs changed the LABEL COUNT (${gainSites.length}) — different populations, ${p8 ? 'first strictly exceeds second as registered' : 'the registered ordering does not hold'}`);

grade('P9', 'OPEN', `false-positive direction: ${siteCount} gain site(s) published with line text for hand reading; ${siteCount === 0 ? 'no manufactured hit is possible at a reach of 0' : 'each must be hand-read before it counts as a finding'}`);

const drift = Math.min(Math.abs(pop.length - PUBLISHED_POP_LOW), Math.abs(pop.length - PUBLISHED_POP_HIGH));
grade('P10', drift <= 5 ? 'HIT' : 'REFUTED', `population ${pop.length}, nearest published figure off by ${drift} (registered ±5) → comparison to the published 22 ${drift <= 5 ? 'is commensurate' : 'is VOID'}`);

const hits = V.filter((v) => v.verdict === 'HIT').length;
const refs = V.filter((v) => v.verdict === 'REFUTED').length;
const opens = V.filter((v) => v.verdict === 'OPEN').length;
say(`\n  ${hits} HIT · ${refs} REFUTED · ${opens} OPEN of ${V.length}`);

out.verdicts = V;
out.summary = { hits, refs, opens, total: V.length };
say(`\nJSON ${JSON.stringify(out)}`);
