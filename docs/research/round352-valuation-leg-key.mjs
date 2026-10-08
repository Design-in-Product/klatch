/**
 * Round 352, Theseus — characterising Daedalus's Round 351 VALUATION leg under my own key.
 *
 * He flagged his own limit: `label-valued` = "the RHS contains no `(`", graded on one known
 * positive and one known negative, "would misclassify a label-valued RHS carrying a parenthesis,
 * of which the tree has none today."
 *
 * That sentence is the thing being measured here. Two sub-questions, because the crude leg can
 * fail in BOTH directions and he named only one:
 *
 *   (A) his direction — a label-valued RHS carrying a parenthesis. Sharpened to something
 *       mechanical: a `(` that occurs ONLY inside a string literal. The crude leg sees the byte;
 *       a reader sees a label. Instrument: the strings-BLANKED reading, which preserves offsets,
 *       so a `(` is CODE iff the blanked reading still holds it there.
 *   (B) the converse he did NOT name — a paren-free RHS that is nevertheless not a label
 *       (a property access, an identifier, an index). The crude leg calls every one of these
 *       label-valued.
 *
 * Population and assign leg are byte-identical to the landed `hoistedTagSites`; nothing about the
 * emitter is used, because the valuation leg is applied to the assign leg's RHS.
 *
 * NOT under scripts/ on purpose: a file there would be the 195th member of the population it
 * measures, and would itself carry the shape.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { stripSource } from '../../scripts/lib/strip-source.mjs';

const REPO = join(import.meta.dirname, '..', '..');

const codeFilesUnder = (dir) => readdirSync(dir, { withFileTypes: true })
  .flatMap((d) => (d.isDirectory()
    ? codeFilesUnder(join(dir, d.name))
    : (/\.(mts|mjs|ts|js)$/.test(d.name) ? [join(dir, d.name)] : [])));

/** Assign leg, copied byte-identically from the landed detector. Emitter deliberately absent. */
const assignLegSites = (raw) => {
  const src = stripSource(raw, false);
  const blanked = stripSource(raw, true);
  if (src.length !== raw.length || blanked.length !== raw.length) return null;
  const isCode = (off, text) => blanked.slice(off, off + text.length) === text;
  const out = [];
  const assign = /\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*([^;]*)/g;
  let m;
  while ((m = assign.exec(src)) !== null) {
    const name = m[1];
    const rhs = m[2];
    const kw = /^(?:const|let|var)/.exec(m[0])[0];
    if (!isCode(m.index, kw)) continue;
    if (!/['"`]MEAS['"`]/.test(rhs)) continue;
    // RHS offset: m[2] is the tail of m[0].
    const rhsOff = m.index + (m[0].length - m[2].length);
    const rhsBlanked = blanked.slice(rhsOff, rhsOff + rhs.length);
    out.push({ assign: m.index, name, rhs, rhsBlanked });
  }
  return out;
};

const lineAt = (raw, off) => raw.slice(0, off).split('\n').length;

/** His leg, verbatim in effect: a byte `(` anywhere in the RHS means call-valued. */
const crudeLabelValued = (s) => !s.rhs.includes('(');

/** Mine: a `(` is CODE iff the strings-blanked reading still holds it at that offset. */
const codeParenCount = (s) => {
  let n = 0;
  for (let i = 0; i < s.rhs.length; i += 1) {
    if (s.rhs[i] === '(' && s.rhsBlanked[i] === '(') n += 1;
  }
  return n;
};
const refinedLabelValued = (s) => codeParenCount(s) === 0;

/** A paren that exists in the bytes but is not code — direction (A) made mechanical. */
const hasStringOnlyParen = (s) => s.rhs.includes('(') && codeParenCount(s) === 0;

// ── Grading, before any tree figure is read ──────────────────────────────────────────────────
// Known positives/negatives for the ASSIGN LEG are copied from the landed arm's own fixture
// arrays, so the class I enumerate is the class it enumerates.
const KP = [
  "const tag = r.kind === 'measurement' ? 'MEAS' : r.pass ? 'PASS' : 'FAIL';\nconsole.log(`${tag} [${r.arm}] ${r.check}`);",
  "const tag = pass ? 'PASS' : kind === 'measurement' ? 'MEAS' : 'FAIL';\nconsole.log(`${tag} [${arm}] ${name} — ${detail}`);",
];
// The landed arm's KN entries split in two against an ASSIGN-LEG-ONLY key, and the split is the
// grade. Entries whose declarator keyword is not code, or whose RHS carries no quote-delimited
// MEAS, must stay clean here too. The two FIXTURE-ARRAY entries must FLAG here while staying
// clean in the arm, because the arm's cleanliness on them comes from the EMITTER leg (a
// `console.log` inside a string is not code) and this key has no emitter leg. Asserting that
// split is what makes this key's class the arm's assign-leg class and not a looser one.
const KN_STILL_CLEAN = [
  "type Kind = 'regression' | 'measurement';",
  '// this arm MEASURES the thing rather than asserting it\nconst x = 1;',
  'console.log(`formulas reproduce ${MEASURED.length} measured arms exactly:`);',
  "// const tag = pass ? 'PASS' : 'MEAS';\n// console.log(`${tag} x`);\nconst live = 1;",
];
const KN_FLAGS_ASSIGN_LEG_ONLY = [
  "const H = [\n  \"const tag = pass ? 'MEAS' : 'PASS';\",\n  'console.log(`${tag} x`);',\n].join('\\n');",
  "const A = \"const tag = pass ? 'MEAS' : 'PASS';\";\nconst B = 'console.log(`${tag} x`);';",
];
const gradeAssignKp = KP.every((s) => (assignLegSites(s) ?? []).length > 0);
const gradeAssignKn = KN_STILL_CLEAN.every((s) => (assignLegSites(s) ?? [{}]).length === 0);
const gradeAssignSplit = KN_FLAGS_ASSIGN_LEG_ONLY.every((s) => (assignLegSites(s) ?? []).length > 0);

// Known positive / known negative for the STRING-ONLY-PAREN detector.
//
// The obvious spelling of his limit — a paren INSIDE the MEAS label, `'MEAS (inner)'` — is
// UNREACHABLE: the assign leg keys on `['"`]MEAS['"`]`, which needs a quote immediately after
// MEAS, and a space follows. So it never enters the class and the valuation leg never sees it.
// The reachable spelling carries the paren in a DIFFERENT string literal of the same RHS, which
// is the known positive below. The unreachable one is carried as a second known negative, since
// its being outside the class is itself a load-bearing claim.
const PAREN_KP = "const tag = pass ? 'MEAS' : 'FAIL (x)';";
const PAREN_UNREACHABLE = "const tag = pass ? 'MEAS (inner)' : 'FAIL';";
const PAREN_KN = "const meas = rows.filter((r) => r.outcome === 'MEAS');";
const pkp = (assignLegSites(PAREN_KP) ?? [])[0];
const pkn = (assignLegSites(PAREN_KN) ?? [])[0];
const gradeParen = !!pkp && !!pkn
  && hasStringOnlyParen(pkp) === true && refinedLabelValued(pkp) === true && crudeLabelValued(pkp) === false
  && hasStringOnlyParen(pkn) === false && refinedLabelValued(pkn) === false && crudeLabelValued(pkn) === false;
const gradeUnreachable = (assignLegSites(PAREN_UNREACHABLE) ?? []).length === 0;

// Known positive / known negative for direction (B): paren-free and NOT a label.
const BEE_KP = "const tag = r.counts['MEAS'];";
const BEE_KN = "const tag = pass ? 'MEAS' : 'FAIL';";
const bkp = (assignLegSites(BEE_KP) ?? [])[0];
const bkn = (assignLegSites(BEE_KN) ?? [])[0];
const gradeBee = !!bkp && !!bkn && crudeLabelValued(bkp) === true && crudeLabelValued(bkn) === true;

console.log(`GRADE assign leg, KP from the landed arm's own fixtures all flag: ${gradeAssignKp}`);
console.log(`GRADE assign leg, the 4 KN entries that must stay clean here too: ${gradeAssignKn}`);
console.log(`GRADE assign leg, the 2 KN fixture-arrays that must flag assign-leg-only: ${gradeAssignSplit}`);
console.log(`GRADE string-only-paren detector (KP paren in a sibling label, KN real filter call): ${gradeParen}`);
console.log(`GRADE the paren-inside-MEAS spelling is OUTSIDE the class entirely: ${gradeUnreachable}`);
console.log(`GRADE direction-B fixtures reach the class at all: ${gradeBee}`);
console.log('');

// ── The tree ─────────────────────────────────────────────────────────────────────────────────
const POPULATION = codeFilesUnder(join(REPO, 'scripts'));
const members = [];
let offsetsPreserved = true;
for (const abs of POPULATION) {
  const raw = readFileSync(abs, 'utf8');
  const sites = assignLegSites(raw);
  if (sites === null) { offsetsPreserved = false; continue; }
  for (const s of sites) {
    members.push({
      file: abs.slice(join(REPO, 'scripts').length + 1),
      line: lineAt(raw, s.assign),
      name: s.name,
      rhs: s.rhs.replace(/\s+/g, ' ').trim(),
      crude: crudeLabelValued(s),
      refined: refinedLabelValued(s),
      stringOnlyParen: hasStringOnlyParen(s),
      codeParens: codeParenCount(s),
    });
  }
}

/**
 * THE HAND READING, declared. Eleven members is a size where the hand reading is primary
 * (Round 337), so it is written down and the key is graded against it rather than the other way
 * round. `class` is what the RHS actually evaluates to, read at source:
 *   label — a string literal, or a conditional over string literals
 *   call  — a call expression
 *   array — an array literal (in every case here, a fixture array of source-as-strings)
 * A tree edit that moves or adds a member reds this, so the table cannot go stale silently.
 */
const HAND = [
  ['probe-round224-a-skip-must-not-summarise-as-a-pass.mts:71', 'label'],
  ['probe-round224b-the-migrated-probes-against-a-stranger.mts:57', 'label'],
  ['probe-round247-a-mutant-in-the-tree-is-in-the-population.mts:67', 'label'],
  ['probe-round255-the-comment-shadow-census.mts:171', 'label'],
  ['probe-round269-blocked-is-a-third-outcome-and-the-exit-code-that-carries-it-dies-one-level-down.mts:428', 'call'],
  ['probe-round269-blocked-is-a-third-outcome-and-the-exit-code-that-carries-it-dies-one-level-down.mts:621', 'array'],
  ['probe-round269-blocked-is-a-third-outcome-and-the-exit-code-that-carries-it-dies-one-level-down.mts:825', 'array'],
  ['probe-round269-blocked-is-a-third-outcome-and-the-exit-code-that-carries-it-dies-one-level-down.mts:992', 'array'],
  ['probe-round280-the-client-half-of-the-pair-and-what-it-leaves-behind.mts:476', 'call'],
  ['probe-round281-a-probe-that-only-runs-where-it-was-written-and-how-big-that-class-actually-is.mts:221', 'call'],
  ['probe-round282-which-socket-actually-strands-the-raw-net-server-cell.mts:617', 'call'],
];

console.log(`population: ${POPULATION.length} code files under scripts/ (readdirSync walk)`);
console.log(`offsets preserved on every file: ${offsetsPreserved}`);
console.log(`ASSIGN-LEG CLASS: ${members.length} member(s)`);
console.log('');
for (const m of members) {
  console.log(`  ${m.file}:${m.line}  ${m.name} = ${m.rhs.slice(0, 92)}`);
  console.log(`      crude(no "(")=${m.crude}  refined(no CODE "(")=${m.refined}  `
    + `string-only-paren=${m.stringOnlyParen}  codeParens=${m.codeParens}`);
}
console.log('');
// The key is graded against the hand reading as MEMBER LISTS, not counts (Round 340).
const liveKeys = members.map((m) => `${m.file}:${m.line}`).sort().join('|');
const handKeys = HAND.map(([k]) => k).sort().join('|');
console.log(`MEMBER LISTS: live class === declared hand reading: ${liveKeys === handKeys}`);
if (liveKeys !== handKeys) {
  console.log(`  live only: ${members.map((m) => `${m.file}:${m.line}`).filter((k) => !handKeys.includes(k)).join(', ')}`);
  console.log(`  hand only: ${HAND.map(([k]) => k).filter((k) => !liveKeys.includes(k)).join(', ')}`);
}
const handOf = new Map(HAND);
// The crude leg's verdict, scored against the hand reading. "label-valued" is only correct when
// the hand class is `label`; `array` is neither label nor call, and the leg has no column for it.
const wrong = members.filter((m) => {
  const h = handOf.get(`${m.file}:${m.line}`);
  return m.crude !== (h === 'label');
});
console.log(`CRUDE LEG vs HAND READING: wrong on ${wrong.length} of ${members.length} member(s)`);
for (const m of wrong) {
  const h = handOf.get(`${m.file}:${m.line}`);
  console.log(`      ${m.file}:${m.line} ${m.name} — hand=${h}, crude says label-valued=${m.crude}`);
}
console.log('');

const disagree = members.filter((m) => m.crude !== m.refined);
console.log(`(A) members where the crude leg and the code-paren leg DISAGREE: ${disagree.length}`);
for (const m of disagree) console.log(`      ${m.file}:${m.line} ${m.name}`);
const crudeLabels = members.filter((m) => m.crude);
console.log(`(B) members the crude leg calls label-valued: ${crudeLabels.length}`);
for (const m of crudeLabels) console.log(`      ${m.file}:${m.line} ${m.name} = ${m.rhs.slice(0, 92)}`);
