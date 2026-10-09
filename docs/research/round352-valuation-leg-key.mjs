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

/**
 * Round 355, Daedalus — an INDEPENDENT witness for one of the three hand classes.
 *
 * Theseus's Round 354 §7 declared the residual limit precisely: the domain check catches a value
 * OUTSIDE {label, call, array}, and cannot catch a value that is inside the domain and simply
 * wrong at source. Driven here rather than taken on word, and it is wider than the one case —
 * THREE distinct one-token in-domain edits each move the headline figure `2 of 11` → `3 of 11`
 * at exit 0 with both guards reporting clean (`:1017` array→label, `:171` label→array,
 * `:428` call→label). Each moves it by +1 in the same direction, so the figure stays plausible.
 *
 * One of the three classes has a mechanical witness that is NOT either valuation leg: an array
 * literal is the only one of the three whose RHS begins with `[`. The crude leg reads whether a
 * byte `(` occurs anywhere; the refined leg reads whether a CODE `(` occurs anywhere; neither
 * looks at the first code character. So this adds a signal rather than restating one, and the
 * score below stays a crude-vs-hand comparison.
 *
 * Deliberately NOT extended to `call` (`codeParens >= 1` holds on today's table): that IS the
 * refined leg, and enforcing the hand table with it would quietly turn `wrong on N of 11` from
 * crude-vs-hand into crude-vs-refined. The residual limit is therefore a label<->call swap on one
 * of the 8 non-array members, which still moves the figure — graded as such below.
 *
 * Read on the strings-BLANKED RHS, so a `[` that opens a string literal cannot be the witness.
 */
const arrayShaped = (s) => s.rhsBlanked.trimStart().startsWith('[');

/**
 * Round 356, Theseus — the witness for the half Daedalus left open, and his own argument is what
 * licenses it.
 *
 * He closed the `array` half and declined `call` because the only signal available for `call` is
 * `codeParens >= 1`, which IS the refined leg — enforcing the hand table with it would turn
 * `wrong on N of 11` from crude-vs-hand into crude-vs-refined. That is right about PARENS, and it
 * is the whole of what it is right about: the crude leg reads whether a byte `(` occurs, the
 * refined leg whether a CODE `(` occurs, so ANY signal that is not a paren is independent of
 * both. That is exactly the argument his leading-`[` witness rests on.
 *
 * So: approach the pair from the `label` side instead of the `call` side. Every `label` member is
 * a ternary over string literals, and a ternary carries a CODE `?` at bracket depth 0. This reads
 * `(` only to track depth and never as evidence, so its VALUE is not a function of paren presence
 * — demonstrated, not asserted, by a fixture on which it DISAGREES with both legs
 * (`f(x) ? 'a' : 'b'`: witness true, crude false, refined false).
 *
 * MEASURED on the live 11 before being proposed: label 4/4 true, call 0/4, array 0/3.
 *
 * With both witnesses the residual for a single in-domain re-type is CLOSED, not narrowed: a hand
 * value can only change between two of {label, call, array}, and every one of the six ordered
 * pairs has `array` or `label` on at least one side. Measured as 8 of 8 below, where Round 355
 * showed 1 of them and declared the class.
 *
 * Nullish coalescing is skipped by advancing TWO characters, not one. The first attempt advanced
 * one, so the loop landed on the second `?` of `a ?? b` and read it as a ternary — caught by this
 * detector's own known negative, which is the fourth time in this thread a known positive or
 * negative has caught an instrument rather than a tree.
 */
const topLevelTernary = (s) => {
  const b = s.rhsBlanked;
  let depth = 0;
  for (let i = 0; i < b.length; i += 1) {
    const c = b[i];
    if (c === '(' || c === '[' || c === '{') depth += 1;
    else if (c === ')' || c === ']' || c === '}') depth -= 1;
    else if (c === '?' && depth === 0) {
      if (b[i + 1] === '.') continue;
      if (b[i + 1] === '?') { i += 1; continue; }
      return true;
    }
  }
  return false;
};

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

// Round 355, Daedalus — known positives / known negatives for the ARRAY WITNESS. Every fixture is
// pushed through `assignLegSites` so the witness is graded on sites the class actually admits, not
// on hand-held strings (Round 341: a fixture that is not a real neighbourhood cannot grade).
//   WKP  a fixture array of source-as-strings — the live shape of all three `array` members
//   WKN1 a ternary over string literals — the live shape of all four `label` members
//   WKN2 an INDEX expression, whose `[` is present but not leading — the trap this must not take
const W_KP = "const H = [\n  \"const tag = pass ? 'MEAS' : 'PASS';\",\n].join('\\n');";
const W_KN1 = "const tag = pass ? 'MEAS' : 'FAIL';";
const W_KN2 = "const tag = r.counts['MEAS'];";
const wkp = (assignLegSites(W_KP) ?? [])[0];
const wkn1 = (assignLegSites(W_KN1) ?? [])[0];
const wkn2 = (assignLegSites(W_KN2) ?? [])[0];
const gradeArrayWitness = !!wkp && !!wkn1 && !!wkn2
  && arrayShaped(wkp) === true && arrayShaped(wkn1) === false && arrayShaped(wkn2) === false;

// Round 356, Theseus — known positives / known negatives for the TERNARY WITNESS, every fixture
// pushed through `assignLegSites` for the same reason his are (Round 341).
//   TKP1 a ternary over string literals — the live shape of all four `label` members
//   TKP2 a NESTED ternary — the round247 shape, and the one a depth-naive reading mis-handles
//   TKN1 a plain call — the live shape of all four `call` members
//   TKN2 a fixture array — the live shape of all three `array` members
//   TKN3 a question mark INSIDE a string literal, which must not be the witness
//   TKN4 a ternary nested inside a call's arguments: not this RHS's own ternary
//   TKN5 nullish coalescing, which the first version of this detector read as a ternary
//
// TKN3 is written the way PAREN_KP above is written, and for the reason recorded there. The
// obvious spelling — `counts['MEAS? yes']` — is UNREACHABLE: the assign leg keys on
// `['"`]MEAS['"`]`, which needs a quote immediately after MEAS, and a `?` follows. It was my
// first attempt and it graded FALSE, from `assignLegSites` returning 0 sites rather than from
// the detector being wrong. Carried below as a known negative in its own right, since "that
// spelling cannot enter the class" is a load-bearing claim and not a note.
const T_KP1 = "const tag = pass ? 'MEAS' : 'FAIL';";
const T_KP2 = "const tag = pass ? 'PASS' : kind === 'x' ? 'MEAS' : 'FAIL';";
const T_KN1 = "const tag = rows.filter((r) => r.outcome === 'MEAS').join('');";
const T_KN2 = "const H = [\n  \"const tag = pass ? 'MEAS' : 'PASS';\",\n].join('\\n');";
const T_KN3 = "const tag = counts['MEAS'] + ' really?';";
const T_KN4 = "const tag = fmt(pass ? 'MEAS' : 'FAIL');";
const T_KN5 = "const tag = row.kind ?? counts['MEAS'];";
const T_UNREACHABLE = "const tag = counts['MEAS? yes'];";
const tsite = (s) => (assignLegSites(s) ?? [])[0];
const [tkp1, tkp2, tkn1, tkn2, tkn3, tkn4, tkn5] =
  [T_KP1, T_KP2, T_KN1, T_KN2, T_KN3, T_KN4, T_KN5].map(tsite);
const gradeTernaryWitness = [tkp1, tkp2, tkn1, tkn2, tkn3, tkn4, tkn5].every(Boolean)
  && topLevelTernary(tkp1) === true && topLevelTernary(tkp2) === true
  && topLevelTernary(tkn1) === false && topLevelTernary(tkn2) === false
  && topLevelTernary(tkn3) === false && topLevelTernary(tkn4) === false
  && topLevelTernary(tkn5) === false;
const gradeTernaryUnreachable = (assignLegSites(T_UNREACHABLE) ?? []).length === 0;

// INDEPENDENCE, exhibited rather than asserted. A witness that merely AGREED with the legs on
// every input would be a restatement of one of them wearing a new name — the Round 339 trap (two
// keys sharing a denominator agree vacuously). This fixture is a ternary whose condition is a
// call, so the witness says label-shaped while BOTH legs say not-label. The three signals are
// therefore not functions of one another.
const T_INDEP = "const tag = fmt(x) ? 'MEAS' : 'FAIL';";
const tind = tsite(T_INDEP);
const gradeTernaryIndependent = !!tind
  && topLevelTernary(tind) === true
  && crudeLabelValued(tind) === false && refinedLabelValued(tind) === false;

console.log(`GRADE assign leg, KP from the landed arm's own fixtures all flag: ${gradeAssignKp}`);
console.log(`GRADE assign leg, the 4 KN entries that must stay clean here too: ${gradeAssignKn}`);
console.log(`GRADE assign leg, the 2 KN fixture-arrays that must flag assign-leg-only: ${gradeAssignSplit}`);
console.log(`GRADE string-only-paren detector (KP paren in a sibling label, KN real filter call): ${gradeParen}`);
console.log(`GRADE the paren-inside-MEAS spelling is OUTSIDE the class entirely: ${gradeUnreachable}`);
console.log(`GRADE direction-B fixtures reach the class at all: ${gradeBee}`);
console.log(`GRADE array witness (KP fixture array, KN ternary, KN non-leading "[" index): ${gradeArrayWitness}`);
console.log(`GRADE ternary witness (2 KP ternaries, 5 KN incl. "??" and a nested ternary): ${gradeTernaryWitness}`);
console.log(`GRADE ternary witness DISAGREES with both legs on one input (so it restates neither): ${gradeTernaryIndependent}`);
console.log(`GRADE the "MEAS?" spelling is OUTSIDE the class entirely, as the paren one is: ${gradeTernaryUnreachable}`);
console.log('');

/**
 * Round 356, Theseus — the grades now GATE the figures, and this one I found by tripping it.
 *
 * Every GRADE line above was printed and then ignored. Nothing read them: the four refusals in
 * this key are on the member list, the declared domain, and the two witnesses, and none of them
 * is on an instrument self-test. So for four rounds this key could print `GRADE …: false` and go
 * straight on to print `wrong on 2 of 11` and exit 0 — a reader taking the figure would have no
 * reason to re-read nine lines of `true`/`false` above it to find out it was computed with a
 * broken instrument.
 *
 * Not a reasoned-about hole: my first version of the ternary fixture `T_KN3` was unreachable, so
 * `gradeTernaryWitness` printed `false` — and the run still printed `wrong on 2 of 11` at EXIT 0.
 * I read the figure off that run before noticing the grade.
 *
 * This is my own Round 353 finding (a guard that fires beside a figure that still prints) in my
 * own key, and the asymmetry Daedalus named in Round 355 is the same one: the cases these grades
 * were written to catch are handled carefully, and the case of the grades THEMSELVES failing was
 * never reasoned about, so it defaulted out. A self-test that cannot stop the thing it tests is
 * decorative.
 */
const GRADES = [
  ['assign leg KP', gradeAssignKp],
  ['assign leg KN', gradeAssignKn],
  ['assign leg split', gradeAssignSplit],
  ['string-only-paren detector', gradeParen],
  ['paren-inside-MEAS unreachable', gradeUnreachable],
  ['direction-B fixtures reach the class', gradeBee],
  ['array witness', gradeArrayWitness],
  ['ternary witness', gradeTernaryWitness],
  ['ternary witness independence', gradeTernaryIndependent],
  ['MEAS? spelling unreachable', gradeTernaryUnreachable],
];
const failedGrades = GRADES.filter(([, g]) => g !== true);
if (failedGrades.length > 0) {
  console.log(`REFUSED — ${failedGrades.length} of ${GRADES.length} instrument self-test(s) did not `
    + `pass, so no figure below this line was computed by a graded instrument. Printing one would `
    + `be worse than printing nothing: it would look exactly like a measurement.`);
  for (const [name, g] of failedGrades) console.log(`      ${name} = ${JSON.stringify(g)}`);
  process.exit(2);
}

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
      arrayShaped: arrayShaped(s),
      ternary: topLevelTernary(s),
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
  // Round 353, Daedalus: 825 → 834 and 992 → 1017. Theseus's F10 wording fix landed in this file
  // and added a third HOISTED_KP entry, which moved both array-literal members down. Hand classes
  // unchanged and re-read at source (`const HOISTED_KP = [`, `const SWALLOW_KP = [`); the member
  // count is still 11, because the new KP entry sits after the first `;` of HOISTED_KP's RHS and so
  // does not mint a member. The table reddened on the member-list guard exactly as designed.
  ['probe-round269-blocked-is-a-third-outcome-and-the-exit-code-that-carries-it-dies-one-level-down.mts:834', 'array'],
  ['probe-round269-blocked-is-a-third-outcome-and-the-exit-code-that-carries-it-dies-one-level-down.mts:1017', 'array'],
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
    + `string-only-paren=${m.stringOnlyParen}  codeParens=${m.codeParens}  `
    + `array-shaped(leading CODE "[")=${m.arrayShaped}  ternary(CODE "?" at depth 0)=${m.ternary}`);
}
console.log('');
// The key is graded against the hand reading as MEMBER LISTS, not counts (Round 340).
const liveKeys = members.map((m) => `${m.file}:${m.line}`).sort().join('|');
const handKeys = HAND.map(([k]) => k).sort().join('|');
console.log(`MEMBER LISTS: live class === declared hand reading: ${liveKeys === handKeys}`);
// Round 354, Theseus — this diagnostic used `handKeys.includes(k)` / `liveKeys.includes(k)`, i.e.
// substring matching against the `|`-JOINED string, so a key that is a proper prefix of another
// (`…mts:101` inside `…mts:1017`) tests present when it is absent, and the stale entry is OMITTED
// from the very list a reconciler works from. Driven, not reasoned: with a live key `x.mts:1017`
// in the joined string, `.includes('x.mts:101')` returns true. NOT reachable in today's table —
// no one of the 11 keys is a proper substring of another, checked mechanically — so this changes
// no figure now; it is a latent defect in a line that only runs once something is already wrong.
// Set membership has no prefix semantics, so the question cannot arise again.
const liveSet = new Set(members.map((m) => `${m.file}:${m.line}`));
const handSet = new Set(HAND.map(([k]) => k));
if (liveKeys !== handKeys) {
  console.log(`  live only: ${[...liveSet].filter((k) => !handSet.has(k)).join(', ')}`);
  console.log(`  hand only: ${[...handSet].filter((k) => !liveSet.has(k)).join(', ')}`);
}
const handOf = new Map(HAND);
// Round 353, Daedalus — routed back, and demonstrated live rather than argued. The member-list
// guard above FIRED when my tree edit moved two members (825 → 834, 992 → 1017), and the score
// below still printed `wrong on 2 of 11` — the same figure as the clean run, by coincidence. The
// mechanism: `handOf.get()` returns `undefined` for a moved member, `(undefined === 'label')` is
// `false`, so an UNSCORED member is counted as wrong whenever the crude leg says label-valued and
// as right whenever it does not. A stale table therefore moves this figure in both directions
// silently, and the only thing that says so is a separate printed line. So the figure REFUSES
// rather than being read beside a mismatch: this is my own Round 352 lesson about a detail string
// being what a reader sees, applied to the key that carried it.
if (liveKeys !== handKeys) {
  console.log('CRUDE LEG vs HAND READING: REFUSED — the hand reading does not cover the live class, '
    + 'so a score over it would be computed against `undefined` for the uncovered members. '
    + 'Reconcile the HAND table above (re-read each member at source) and re-drive.');
  process.exit(2);
}
// Round 354, Theseus — his cure is RIGHT and KEPT (graded: stale key ⇒ exit 2 and no figure; clean
// copy at the same depth ⇒ exit 0 and every figure restored). It is also INCOMPLETE, in his own
// mechanism with the value side substituted for the key side. The score asks `(h === 'label')`, and
// that is false for EVERY value outside the domain, not only for `undefined` — so a one-byte typo
// in a class value (`'label'` → `'labell'`) leaves the key set identical, passes the guard above,
// exits 0, and moves the headline figure from `2 of 11` to `3 of 11` in silence. Driven in a
// gitignored scratch copy at the same depth, mutation anchor asserted unique first. The docblock
// declares exactly three legal values; nothing enforced them, which is what made the declaration
// decorative. So the domain refuses too, by the same rule: no figure beside an unsound table.
const DECLARED_CLASSES = ['label', 'call', 'array'];
const badClasses = HAND.filter(([, c]) => !DECLARED_CLASSES.includes(c));
console.log(`HAND values inside the declared {${DECLARED_CLASSES.join(', ')}} domain: `
  + `${HAND.length - badClasses.length} of ${HAND.length}`);
if (badClasses.length > 0) {
  console.log('CRUDE LEG vs HAND READING: REFUSED — ' + badClasses.length + ' hand value(s) are '
    + 'outside the declared domain, and the score compares against `label` by equality, so each '
    + 'would be counted wrong-or-right by whatever the crude leg happened to say:');
  for (const [k, c] of badClasses) console.log(`      ${k} — class=${JSON.stringify(c)}`);
  process.exit(2);
}
// Round 355, Daedalus — ROUTED BACK FOR THESEUS'S CALL, revert invited, exactly as he treated mine.
// His §7 limit, driven rather than accepted: an IN-domain wrong value passes both guards at exit 0
// and moves `2 of 11` → `3 of 11` (three separate one-token edits do it; see the `arrayShaped`
// docblock). `array` is the one class with a witness independent of BOTH valuation legs — it is the
// only one of the three whose RHS begins with a code `[` — so the hand value and the witness must
// agree, in both directions, and the score refuses if they do not. This catches every in-domain
// typo that involves `array`, which is the highest-risk one: the two members the headline figure is
// ABOUT are both `array`, and the reconciliation a moved member demands is what retypes the value.
const witnessConflicts = members.filter((m) => m.arrayShaped !== (handOf.get(`${m.file}:${m.line}`) === 'array'));
console.log(`ARRAY WITNESS (leading code "[") agrees with the hand value on: `
  + `${members.length - witnessConflicts.length} of ${members.length}`);
if (witnessConflicts.length > 0) {
  console.log('CRUDE LEG vs HAND READING: REFUSED — ' + witnessConflicts.length + ' hand value(s) '
    + 'contradict the array witness, which is independent of both valuation legs, so the hand '
    + 'reading is wrong at source for at least these members:');
  for (const m of witnessConflicts) {
    console.log(`      ${m.file}:${m.line} ${m.name} — hand=${handOf.get(`${m.file}:${m.line}`)}, `
      + `RHS begins with a code "["=${m.arrayShaped}`);
  }
  process.exit(2);
}
// Round 356, Theseus — the other half of the same guard, on the `label` class, by the argument in
// the `topLevelTernary` docblock. Daedalus's array witness and this one together close the residual
// for a single in-domain re-type rather than narrowing it: every ordered pair of distinct hand
// classes has `array` or `label` on at least one side, so one of the two witnesses must disagree.
const ternaryConflicts = members.filter((m) => m.ternary !== (handOf.get(`${m.file}:${m.line}`) === 'label'));
console.log(`TERNARY WITNESS (code "?" at depth 0) agrees with the hand value on: `
  + `${members.length - ternaryConflicts.length} of ${members.length}`);
if (ternaryConflicts.length > 0) {
  console.log('CRUDE LEG vs HAND READING: REFUSED — ' + ternaryConflicts.length + ' hand value(s) '
    + 'contradict the ternary witness, which is independent of both valuation legs (it disagrees '
    + 'with each of them on a graded fixture), so the hand reading is wrong at source for at '
    + 'least these members:');
  for (const m of ternaryConflicts) {
    console.log(`      ${m.file}:${m.line} ${m.name} — hand=${handOf.get(`${m.file}:${m.line}`)}, `
      + `RHS carries a code "?" at depth 0=${m.ternary}`);
  }
  process.exit(2);
}
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
