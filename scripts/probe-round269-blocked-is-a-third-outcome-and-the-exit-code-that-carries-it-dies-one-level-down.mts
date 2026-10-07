/**
 * Round 269, Daedalus, 2026-09-25 (START fire). Drives the Round 269 changes to
 * `scripts/sweep-probes.mjs`, which answer two routed items in one pass:
 *
 *   - Theseus's Round 268 §3: the sweep collapsed `exit 2` ("could not run") and `exit 1` ("failed
 *     a check") into a flat RED, so a red cleared by the operator quitting his own dev server is
 *     indistinguishable from a regression.
 *   - Daedalus's own Round 267 §5: the `why` field is prose, only `expect` is enforced, and the
 *     figure in `why` had drifted from the figure in `expect` five times across that list.
 *
 * ## The half the routed framing did not have
 *
 * The distinction Theseus asked the sweep to surface **is already gone by the time the sweep sees
 * anything.** Measured this fire, with 3001 genuinely held by `npm run dev` in the main checkout:
 *
 *   probe-round225 exits **1**, not 2.
 *   FAIL [B] the repaired round223b runs green against the tree it now describes
 *            — exit 2 after 368 ms — 3 PASS, 0 FAIL
 *
 * Arm B of `probe-round225` drives `probe-round223b`, **reads the child's exit 2 in its own failure
 * detail**, and grades it as a failed regression check. The sweep is downstream of that. So no
 * amount of reporting in `sweep-probes.mjs` can recover the distinction on tonight's red: the
 * information is destroyed one level below, in the arm that had it in hand.
 *
 * > **A conversion from "could not run" to "failed" is lossless nowhere and invisible everywhere.**
 * > The exit code is the only channel that carries it, and a driving arm that grades a child's
 * > refusal spends that channel on a boolean.
 *
 * Arm G is the census that makes the consequence unarguable: **0 of the 13 swept probes contains an
 * `exit(2)` site**, so the BLOCKED state built this fire cannot fire on today's swept set at all. It
 * is built, driven here against processes that really do exit 2, and waiting for the exit code.
 * Arm B is Theseus's file and is routed to him rather than changed here.
 *
 * ## Why BLOCKED is declared and not sniffed
 *
 * Arm A6 is the limb that would be missing from a plausible version of this: an entry with **no**
 * `refusal` declared gets no benefit of the doubt, and its exit 2 stays RED. The alternative — a
 * fleet-wide refusal regex — was measured and rejected: 15 `exit(2)` sites across 108 probe files
 * spell the same intent seven different ways ("Stop it and re-run", "Refusing to start", "REFUSING:",
 * "Cannot run [...]", "usage:", "No database at", "MISMATCH"). Matching that would be the sweep's
 * founding error — *what a probe RUNS is not recoverable from what a probe SAYS* — aimed at a new
 * target.
 *
 * ## Why `verdict` is now a wrapper
 *
 * `probe-round261` arm D drives `verdict()` on four corners and arm E2 asserts it can return both
 * values. `verdict` was NOT copied into a three-valued sibling; it is a wrapper over `classify`, so
 * the two cannot disagree. Round 263's rule turned on my own file: *a remedy that lives as a copy in
 * one file is not available to the next file, only to the next reader of that file.* Arm B here
 * re-drives Round 261's four corners through the new implementation rather than trusting that.
 *
 * Runs nothing live: no server, no port, no database, no corpus, no model call. Every process it
 * spawns is a three-line script it mints itself under gitignored `.testdata/r269/`.
 */

import { mkdirSync, writeFileSync, rmSync, existsSync, readFileSync, readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  classify,
  diagnosisLine,
  verdict,
  sweepExit,
  entryProblems,
  measurementCheck,
  measurementLines,
  SWEPT,
  DEFERRED,
} from './sweep-probes.mjs';
import { stripSource } from './lib/strip-source.mjs';
import { fingerprint, windowState } from './lib/tree-fingerprint.mts';

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const Z_PATHSPECS = ['scripts/', 'packages/'];
const zBefore = Z_PATHSPECS.map((p) => fingerprint(REPO, p));
const zWindowAtOpen = Z_PATHSPECS.map((p) => `${p} → ${windowState(REPO, p) || '(clean)'}`);

let pass = 0;
let fail = 0;
const meas: string[] = [];

const check = (id: string, claim: string, ok: boolean, detail: string) => {
  if (ok) pass += 1;
  else fail += 1;
  console.log(`  [${id}] ${ok ? 'PASS' : 'FAIL'}  ${claim}`);
  console.log(`        ${detail}`);
};
const measure = (id: string, claim: string, detail: string) => {
  meas.push(id);
  console.log(`  [${id}] MEAS  ${claim}`);
  console.log(`        ${detail}`);
};

const SCRATCH = join(process.cwd(), '.testdata', 'r269');
const FIXTURES = join(SCRATCH, 'fixtures');
rmSync(FIXTURES, { recursive: true, force: true });
mkdirSync(FIXTURES, { recursive: true });

const EXPECT = /All 7 regression checks passed/;
const REFUSAL = /fixture: something already holds the thing/;
const GREEN = 'All 7 regression checks passed, 0 measurements, 0 skips';

// ── arm A: classify on every corner that matters ─────────────────────────────

console.log('\n── arm A: classify — three states, and the two limbs of the new one ──');

check('A1', 'exit 0 + summary line → PASS',
  classify(0, GREEN, EXPECT, REFUSAL).state === 'PASS',
  `state = ${classify(0, GREEN, EXPECT, REFUSAL).state}`);

check('A2', 'exit 1 + summary line → RED (a probe that printed its tail and threw on the way out)',
  classify(1, GREEN, EXPECT, REFUSAL).state === 'RED',
  `state = ${classify(1, GREEN, EXPECT, REFUSAL).state}`);

check('A3', 'exit 0 + no summary line → RED (the probe-round224 limb: a skip must not read as a pass)',
  classify(0, 'silently did nothing', EXPECT, REFUSAL).state === 'RED',
  `state = ${classify(0, 'silently did nothing', EXPECT, REFUSAL).state}`);

check('A4', 'exit 2 + declared refusal → BLOCKED',
  classify(2, 'fixture: something already holds the thing. Stop it and re-run.', EXPECT, REFUSAL).state === 'BLOCKED',
  `state = ${classify(2, 'fixture: something already holds the thing. Stop it and re-run.', EXPECT, REFUSAL).state}`);

check('A5', 'exit 2 WITHOUT the declared refusal → RED, not BLOCKED (an exit 2 from a throw path is not a refusal)',
  classify(2, 'TypeError: cannot read properties of undefined', EXPECT, REFUSAL).state === 'RED',
  `state = ${classify(2, 'TypeError: …', EXPECT, REFUSAL).state} — exit code alone does not buy BLOCKED`);

check('A6', 'exit 2 + refusal text but NO refusal DECLARED on the entry → RED',
  classify(2, 'fixture: something already holds the thing', EXPECT, undefined).state === 'RED',
  'state = RED. This is the limb that keeps membership declared rather than sniffed: an entry that ' +
  'has not stated what its refusal looks like gets no benefit of the doubt from text that matches ' +
  'some other entry\'s pattern.');

const annotated = classify(1, `${GREEN}\nfixture: something already holds the thing`, EXPECT, REFUSAL);
check('A7', 'exit 1 + refusal text → RED, and `refused` is true so the reader can be told why',
  annotated.state === 'RED' && annotated.refused === true,
  `state = ${annotated.state}, refused = ${annotated.refused}. This is tonight's probe-round225 ` +
  'exactly: the refusal is in the output, the exit code is 1, and the sweep must not silently ' +
  'reclassify it. It annotates and does not re-grade.');

check('A8', 'classify CAN return each of its three states — no arm above is vacuous',
  new Set([
    classify(0, GREEN, EXPECT, REFUSAL).state,
    classify(1, GREEN, EXPECT, REFUSAL).state,
    classify(2, 'fixture: something already holds the thing', EXPECT, REFUSAL).state,
  ]).size === 3,
  'PASS, RED and BLOCKED all observed from the same function in this run');

// ── arm B: the wrapper cannot drift from what Round 261 drove ─────────────────

console.log('\n── arm B: verdict is a wrapper, re-driven on Round 261 arm D\'s four corners ──');

check('B1', 'exit 0 + matching summary → ok (261 D1)', verdict(0, GREEN, EXPECT).ok === true, 'ok = true');
check('B2', 'exit 1 + matching summary → NOT ok, matched still true (261 D2)',
  verdict(1, GREEN, EXPECT).ok === false && verdict(1, GREEN, EXPECT).matched === true,
  'ok = false, matched = true');
check('B3', 'exit 0 + no summary → NOT ok, matched false (261 D3)',
  verdict(0, 'nope', EXPECT).ok === false && verdict(0, 'nope', EXPECT).matched === false,
  'ok = false, matched = false');
check('B4', 'exit 1 + no summary → NOT ok (261 D4)', verdict(1, 'nope', EXPECT).ok === false, 'ok = false');
check('B5', 'and an exit 2 with refusal text is still NOT ok through the old two-valued view',
  verdict(2, 'fixture: something already holds the thing', EXPECT).ok === false,
  'ok = false. The wrapper passes no refusal, so BLOCKED is unreachable through `verdict` and ' +
  'Round 261\'s arms keep meaning what they meant.');

// ── arm C: the exit code the sweep itself returns ────────────────────────────

console.log('\n── arm C: sweepExit — the convention propagated up one level ──');

const corners: Array<[Record<string, number>, number, string]> = [
  [{ red: 0, blocked: 0, bad: 0 }, 0, 'clean'],
  [{ red: 1, blocked: 0, bad: 0 }, 1, 'a check failed'],
  [{ red: 0, blocked: 1, bad: 0 }, 2, 'nothing failed, something could not run'],
  [{ red: 1, blocked: 1, bad: 0 }, 1, 'a real failure outranks a blockage'],
  [{ red: 0, blocked: 0, bad: 1 }, 1, 'census problem is a failure'],
  [{ red: 0, blocked: 1, bad: 1 }, 1, 'census problem outranks a blockage'],
];
for (const [input, want, why] of corners) {
  const got = sweepExit(input as { red: number; blocked: number; bad: number });
  check(`C-${JSON.stringify(input)}`, `→ exit ${want} (${why})`, got === want, `got ${got}`);
}
check('C7', 'BLOCKED is never 0 — a blockage cannot summarise as a pass',
  sweepExit({ red: 0, blocked: 3, bad: 0 }) !== 0,
  `3 blocked, 0 red → exit ${sweepExit({ red: 0, blocked: 3, bad: 0 })}. Collapsing this to 0 would ` +
  'reproduce the finding of probe-round224, which is in the swept set.');

// ── arm D: the entry schema, two-sided ──────────────────────────────────────

console.log('\n── arm D: entryProblems — the drift class closed mechanically ──');

const good = { file: 'x.mts', expect: /All 27 regression checks passed/, why: 'reports 27/27, 9 measurements' };
check('D1', 'an entry whose why agrees with its pin has no problems',
  entryProblems(good).length === 0, `problems = ${entryProblems(good).length}`);

const drifted = { file: 'x.mts', expect: /All 27 regression checks passed/, why: 'reports 16/16' };
check('D2', 'why says 16/16 where expect pins 27 → a problem, named',
  entryProblems(drifted).length === 1 && /why says 16 where expect pins 27/.test(entryProblems(drifted)[0]),
  entryProblems(drifted)[0] ?? '(none)');

const loose = { file: 'x.mts', expect: /All \d+ regression checks passed/, why: 'reports 9/9' };
check('D3', 'expect containing \\d → a problem (Round 261 §6b: a count assertion that cannot fail on a count)',
  entryProblems(loose).some((p) => /cannot fail on a count/.test(p)),
  entryProblems(loose).join(' || ') || '(none)');

const silent = { file: 'x.mts', expect: /All 27 regression checks passed/, why: 'run green in some fire; no ports' };
check('D4', 'why stating NO figure → a problem, because a rule an entry satisfies by making no claim is vacuous',
  silent.why !== undefined && entryProblems(silent).some((p) => /vacuous/.test(p)),
  entryProblems(silent).join(' || ') || '(none)');

const unpinned = { file: 'x.mts', expect: /regression checks passed/, why: 'reports 27/27' };
check('D5', 'expect pinning no figure at all → a problem, and the why claim is not silently accepted',
  entryProblems(unpinned).some((p) => /pins no figure/.test(p)),
  entryProblems(unpinned).join(' || ') || '(none)');

const multi = { file: 'x.mts', expect: /All 4 regression checks passed/, why: 'reports 4/4, covered 12/14' };
check('D6', 'a non-self-equal pair like 12/14 is not a pass-count claim and is left alone',
  entryProblems(multi).length === 0,
  'probe-round245\'s real entry shape: 4/4 is checked against the pin, 12/14 is a coverage ratio ' +
  'and is not. A rule that reddened on 12/14 would be pressure to delete true prose.');

const regs = { file: 'x.mts', expect: /All 18 regression checks passed/, why: 'reports 6 regression, 3 skips' };
check('D7', 'the `N regression` spelling is checked too, not just `N/N`',
  entryProblems(regs).some((p) => /why says 6 where expect pins 18/.test(p)),
  entryProblems(regs).join(' || ') || '(none)');

// ── arm E: the live list, which is what the census now enforces ──────────────

console.log('\n── arm E: the live SWEPT list under the rule added this fire ──');

const liveProblems = SWEPT.flatMap((s: { file: string; why: string; expect: RegExp }) =>
  entryProblems(s).map((p) => `${s.file}: ${p}`));
check('E1', 'every one of the live swept entries agrees with its own pin and states a figure',
  liveProblems.length === 0,
  liveProblems.length === 0
    ? `${SWEPT.length} entries, 0 problems. probe-round259's entry stated no figure until this fire ` +
      'and was passing vacuously; 17/17 was added to it in the same commit as this rule.'
    : liveProblems.join('\n        '));

measure('E2', 'how many swept entries declare a refusal pattern',
  `${SWEPT.filter((s: { refusal?: RegExp }) => s.refusal).length} of ${SWEPT.length} — only ` +
  'probe-round225, and per arm G below its exit code cannot reach 2 anyway. Reported so the ' +
  'coverage of the new state is not mistaken for the state working.');

// ── arm F: the measurement claim, checked against the run ────────────────────

console.log('\n── arm F: measurementCheck — enforced where the run permits, reported where it does not ──');

/**
 * Round 339, Daedalus: this fixture used to hold TWO lines and the arm used to say "BOTH fleet
 * spellings". It was green, and it was green for the wrong reason — the fixture was hand-written
 * from the same two spellings `MEAS_LINE` encoded, so the arm restated the regex's own assumption
 * instead of testing it. An arm whose fixture is its own hypothesis cannot fail on a case nobody
 * thought of, and two such cases were live in the swept set the whole time: `probe-round224:561`
 * renders the token-first spelling INDENTED (the same shape as probe-round225's, two spaces in,
 * which the `MEAS\s+\[` alternative could not reach for want of a leading `\s*`), and
 * `probe-round297:95` renders the token INSIDE the bracket, which neither alternative could reach.
 *
 * Every line below is copied from the rendering of a real emitting site, not invented. F6 is the
 * arm that makes this one honest going forward: it DERIVES the spelling set from the swept files.
 *
 * The attributions are on their own lines, and this is not a style choice: `probe-round308`'s
 * pointer detector pairs every `probe-roundNNN` on a line with every `[A-Z]\d+` on the same line,
 * so `'  MEAS [A1] …'` beside `// probe-round224:561` reads as an unexplained pointer to that
 * file's arm A1. It reddened B1 on the first drive of this very repair.
 */
const FLEET_SPELLINGS = [
  // probe-round225 — token first, at column 0
  'MEAS [F] first fleet spelling',
  // probe-round265:91 — arm tag first, indented
  '  [C] MEAS  second fleet spelling',
  // probe-round224:561 — token first, INDENTED; the alternative that lacked a leading \s*
  '  MEAS [A1] third fleet spelling',
  // probe-round297:95 — token INSIDE the bracket
  '[MEAS] A4  fourth fleet spelling',
];
const FOUR_SPELLINGS = `${FLEET_SPELLINGS.join('\n')}\n`;
const TWO_SPELLINGS = `${FLEET_SPELLINGS.slice(0, 2).join('\n')}\n`;

check('F1', 'measurementLines counts all FOUR fleet spellings, including the two it could not see before Round 339',
  measurementLines(FOUR_SPELLINGS) === 4 && measurementLines(TWO_SPELLINGS) === 2,
  `counted ${measurementLines(FOUR_SPELLINGS)} of 4 in a fixture holding one rendered line from each ` +
  'real emitting site (probe-round225, probe-round265, probe-round224, probe-round297), and still ' +
  `${measurementLines(TWO_SPELLINGS)} of 2 on the original pair — the widening is append-only.`);

check('F2', 'a claim that agrees with the run produces neither problem nor note',
  Object.keys(measurementCheck({ why: 'reports 27/27, 2 measurements' }, TWO_SPELLINGS)).length === 0,
  'claim 2, emitted 2');

check('F3', 'a claim contradicted by the run is a problem',
  /claims 5 measurements; the run emitted 2/.test(
    measurementCheck({ why: 'reports 27/27, 5 measurements' }, TWO_SPELLINGS).problem ?? ''),
  measurementCheck({ why: 'reports 27/27, 5 measurements' }, TWO_SPELLINGS).problem ?? '(none)');

check('F4', 'a claim the run cannot check is a NOTE, not a problem — unverified is not false',
  measurementCheck({ why: '3 measurements' }, 'no measurement lines here').note !== undefined &&
  measurementCheck({ why: '3 measurements' }, 'no measurement lines here').problem === undefined,
  measurementCheck({ why: '3 measurements' }, 'no measurement lines here').note ?? '(none)');

check('F5', 'an entry making no measurement claim is not nagged',
  Object.keys(measurementCheck({ why: 'reports 27/27' }, TWO_SPELLINGS)).length === 0,
  'no claim, no output');

/**
 * F6 — the spelling set DERIVED from the swept files, which is the arm F1 should always have been.
 *
 * F1 can only ever grade the spellings someone remembered to put in it. This one reads all 36 swept
 * probes, renders every `console.log` template that carries a MEAS token, and asserts the fleet
 * counter can count each one. A fifth spelling arriving in any swept probe reddens this instead of
 * sitting undetected behind a fixture that already agrees with the regex.
 *
 * This is a POPULATION-wide arm on purpose, and the distinction matters because Round 338 refused a
 * population-wide measurement-label channel for the opposite reason. Test the general form rather
 * than reasoning by analogy: `measurementLines` is ONE shared counter that every swept entry's
 * measurement claim is graded against, so "is every emitted shape countable" is a property OF THE
 * POPULATION. The label-collision rule Round 336 measured belongs to each FILE — probe-round289's
 * `[V5]` deliberately shares one label across a check and a measurement — which is why that arm
 * stayed file-local and this one does not.
 *
 * Comments are blanked through `stripSource` before scanning, so a commented-out emitting line is
 * not mistaken for a live one.
 */
const renderMeasMentions = (src: string): string[] => {
  const out: string[] = [];
  for (const re of [/console\.log\(\s*`([^`]*)`/g, /console\.log\(\s*'([^']*)'/g]) {
    let m: RegExpExecArray | null;
    while ((m = re.exec(src)) !== null) {
      const raw = m[1];
      if (!raw.includes('MEAS')) continue;
      // a ternary that can yield 'MEAS' renders as MEAS; every other interpolation as a token
      out.push(raw.replace(/\$\{[^{}]*'MEAS'[^{}]*\}/g, 'MEAS').replace(/\$\{[^{}]*\}/g, 'X'));
    }
  }
  return out;
};

/**
 * ── Round 341, Daedalus: F6's POPULATION selector was token PRESENCE, and that is a false-defect
 * generator ────────────────────────────────────────────────────────────────────────────────────
 *
 * F6 as landed in Round 339 selected `raw.includes('MEAS')` — any emitted literal MENTIONING the
 * token — and then required the fleet counter to count it. Two shapes in the tree mention the token
 * in a line that is not a measurement at all:
 *
 *   `${checks} checks · ${failures} failed · ${measurements.length} MEAS`   a SUMMARY line
 *                     ..................................... probe-round240:474
 *   `formulas reproduce ${MEASURED.length} measured arms exactly:`          an identifier, lowercased
 *                     ..................................... geometry-distance-arm.mjs:102
 *
 * Neither is a measurement line and neither should be countable, so requiring them to be countable
 * reds this arm on a defect that does not exist. That is not hypothetical: F6 reads SWEPT, and the
 * promotion path moves DEFERRED files into SWEPT. Measured over the 109 DEFERRED files, 3 of them
 * red F6 on promotion — and ONE of the three is this false class.
 *
 * The repair is a selector, and the hazard in writing it is the one Round 339 §2 recorded one round
 * earlier: a selector that admits exactly what the counter counts makes this arm VACUOUS. So the
 * selector is keyed on where the token stands IN THE LINE, which is not what `MEAS_LINE` keys on,
 * and both directions are asserted in F7 rather than argued here:
 *
 *   1. every line the counter CAN count is admitted — so the arm can never red on a countable line;
 *   2. a line in label position that the counter CANNOT count is still admitted — so it can red.
 *
 * Both measured on the live tree before landing: of 99 MEAS-mentioning renderings across all 194
 * files under `scripts/`, 0 are countable-but-not-admitted and 2 are admitted-but-not-countable.
 * The 2 are real uncountable measurement spellings in DEFERRED probes, and they are what this arm
 * exists to catch at the moment either file is promoted.
 *
 * ── Round 343, Daedalus, on Theseus's Round 342 finding: d1's derived half had ZERO members of the
 * one dimension this selector's anchoring can break ────────────────────────────────────────────
 *
 * `MEAS_LINE` carries `/gm`. This selector as landed in Round 341 carried NO flags, so its `^`
 * matched only at string start. `\s` includes `\n`, so `^\s*` crossed leading newlines and the
 * obvious known positive `"\n[A1] MEAS 7ms"` was admitted — which is why the gap survived review.
 * The shape that parts the two regexes is a rendering whose FIRST line carries text and whose MEAS
 * label sits on a LATER line. Driven through this probe's own `renderMeasMentions` from a
 * real-shaped source, not a typed string: ONE rendering, the counter counts 2, the Round 341
 * selector admitted 0, and F6 graded neither of the two countable lines.
 *
 * d1 could not see it, and the reason is d2's own argument arriving at d1. `countableDropped`
 * derives over a population in which **0 of 99** MEAS-mentioning renderings carry a newline at all
 * — measured over both population units, since 175 top-level code files and 194 recursively return
 * the identical member list, symmetric difference 0 — and `FLEET_SPELLINGS` is four SINGLE-LINE
 * entries. d1 was green and could not go red however the anchoring drifted. Derived was the right
 * grade for stopping a tightening from buying a false green; it is the wrong instrument for a
 * dimension the population is empty of. So the repair is both halves, regex and fixture.
 *
 * **`/m` and deliberately NOT `/g`.** A `/g` regex advances `lastIndex` on `.test()`, and this
 * selector is `.test()`ed in six places on the same strings: driven, `/gm` returns
 * `true, false, true` on three identical calls and `true, true, false, true` on the multi-line
 * fixture, so `/g` here would make F7 report a different verdict depending on call order.
 *
 * Priced on the live tree before landing: **0** disagreements with the Round 341 selector over all
 * 99 renderings, **0** superset violations over 99 renderings + 3 multi-line fixtures + the 4 fleet
 * spellings, all 4 fleet spellings still admitted, both non-measurement mentions still rejected.
 * The figure that decides whether it is safe to land is the promotion one: of the **66**
 * MEAS-mentioning renderings in the 109 DEFERRED files, **0** become newly-admitted-and-uncountable,
 * so this widening reds F6 on promotion of nothing it did not already red on.
 *
 * The shape is REACHABLE but unwritten, and that is the honest case for a fixture: **13 of 2362**
 * `console.log` renderings under `scripts/` are multi-line across 8 files, so the fleet writes
 * multi-line templates freely; none carries a MEAS label today. A detector of mine counted 1 of
 * those 13 as already header-then-label, and hand-reading that one member —
 * `verify-design-assertions-gated.mjs` — shows it is prose whose later line merely begins with
 * capitals. The honest count of this shape in the tree is **0**, which is precisely why no clean
 * population can grade the property and the second half has to be MULTI_LINE_COUNTABLE below.
 */
const MEAS_IN_LABEL_POSITION = /^[ \t]*(?:\[[^\]]*\][ \t]*)?MEAS\b|^[ \t]*\[MEAS\]/m;

const renderMeasTemplates = (src: string): string[] =>
  renderMeasMentions(src).filter((rendered) => MEAS_IN_LABEL_POSITION.test(rendered));

/**
 * Does this file put a MEAS token in a STRING-LITERAL body? The independent key F8 grades the
 * renderer against — independent because it does not look at `console.log` at all. See F8.
 *
 * Both `stripSource` readings preserve every offset, so the four bytes of an occurrence are
 * string-literal body iff the strings-BLANKED reading has blanks at exactly those offsets. The
 * offsets do the work and no span is ever extracted: Round 344 lost a detector to the span route
 * (`stripSource` emits `${` verbatim, so a span scan halts there, and a space inside a string
 * blanks to a space, so a diff cannot find the edges either). Offset-wise there is nothing to find
 * the edges of. `offsetsPreserved` asserts the premise rather than trusting it.
 */
const measStringLiteralLines = (raw: string): number[] => {
  const kept = stripSource(raw, false);
  const blanked = stripSource(raw, true);
  if (kept.length !== raw.length || blanked.length !== raw.length) return [];
  const out: number[] = [];
  for (let i = kept.indexOf('MEAS'); i !== -1; i = kept.indexOf('MEAS', i + 1)) {
    if (/^ {4}$/.test(blanked.slice(i, i + 4))) out.push(raw.slice(0, i).split('\n').length);
  }
  return out;
};

const sweptEmitters: Array<{ file: string; rendered: string }> = [];
const sweptMentions: Array<{ file: string; rendered: string }> = [];
const sweptMissing: string[] = [];
const sweptWithMeasLiteral: string[] = [];
const sweptInvisible: Array<{ file: string; lines: number[] }> = [];
let offsetsPreserved = true;
for (const entry of SWEPT) {
  const abs = join(REPO, 'scripts', entry.file);
  if (!existsSync(abs)) {
    sweptMissing.push(entry.file);
    continue;
  }
  const raw = readFileSync(abs, 'utf8');
  if (stripSource(raw, false).length !== raw.length || stripSource(raw, true).length !== raw.length) {
    offsetsPreserved = false;
  }
  const src = stripSource(raw, false);
  for (const rendered of renderMeasTemplates(src)) {
    sweptEmitters.push({ file: entry.file, rendered });
  }
  // The UNFILTERED set, kept so F7 can assert the selector drops nothing the counter can count.
  for (const rendered of renderMeasMentions(src)) {
    sweptMentions.push({ file: entry.file, rendered });
  }
  // F8's two populations: what the independent key sees, and what the renderer cannot.
  const literalLines = measStringLiteralLines(raw);
  if (literalLines.length > 0) {
    sweptWithMeasLiteral.push(entry.file);
    if (renderMeasMentions(src).length === 0) sweptInvisible.push({ file: entry.file, lines: literalLines });
  }
}
const uncountable = sweptEmitters.filter((e) => measurementLines(e.rendered) === 0);

check('F6', 'every MEAS-bearing line any SWEPT probe emits is countable by the fleet counter — the spelling set derived, not recalled',
  uncountable.length === 0 && sweptMissing.length === 0 && sweptEmitters.length > 0,
  uncountable.length === 0
    ? `${sweptEmitters.length} MEAS-emitting template(s) across ${SWEPT.length} swept probes, all counted; ` +
      `${sweptMissing.length} swept file(s) missing from disk. Before Round 339 widened MEAS_LINE, 3 of these ` +
      'were uncounted — 1 in probe-round224 and 2 in probe-round297.'
    : `UNCOUNTABLE: ${uncountable.map((e) => `${e.file.slice(0, 28)} → ${JSON.stringify(e.rendered.slice(0, 40))}`).join(' | ')}` +
      `${sweptMissing.length > 0 ? ` · missing from disk: ${sweptMissing.join(', ')}` : ''}`);

/**
 * F7 — the two directions of F6's own population selector, because a selector that is wrong in
 * either direction makes F6 report a defect that is not there, or miss one that is.
 *
 * Direction 1 is DERIVED from the swept population AND carries one fixture, and the split is the
 * whole lesson of Round 342. Derived: every rendering the real counter counts must survive the
 * selector. A future tightening that quietly excluded a countable shape would leave F6 green by
 * shrinking its population rather than by the fleet being clean, and that is the failure this fleet
 * has shipped most often. But the derived half can only grade dimensions the population HAS
 * members of, and it has zero multi-line members — so a selector anchored at string start rather
 * than per-line was green here for twenty-four hours. MULTI_LINE_COUNTABLE closes that by fixture,
 * which makes d1 derived-plus-fixture rather than purely derived. It is graded the way Round 341
 * asked: under the Round 341 selector this fixture REDS d1 (countable, dropped) and under the
 * current one it passes. A fixture that cannot fail before the cure is not a test.
 *
 * Direction 2 is a FIXTURE, and it has to be, because it asserts the selector is NOT equivalent to
 * the counter — a property of the two regexes, which no reading of a clean population can show. The
 * line is copied from the real rendering of a live uncountable emitter.
 *
 * Direction 3 is the false class this arm was added for, copied from the two real non-measurement
 * lines that mention the token.
 *
 * Attributions sit on their own lines here for the reason F1's comment records.
 */
const countableDropped = sweptMentions.filter(
  (e) => measurementLines(e.rendered) > 0 && !MEAS_IN_LABEL_POSITION.test(e.rendered));

// probe-round221:53 renders `MEAS ${name} — ${detail}`: in label position, and uncountable
const LABELLED_UNCOUNTABLE = 'MEAS A1 — a real spelling the counter cannot count';
// probe-round240:474, a summary line
const SUMMARY_MENTION = '21 checks · 0 failed · 3 MEAS';
// geometry-distance-arm.mjs:102, an identifier
const IDENTIFIER_MENTION = 'formulas reproduce 7 measured arms exactly:';

/**
 * The dimension the derived half of d1 has zero members of: one `console.log` emitting a header
 * line plus a measurement block. The counter's `/gm` counts both labelled lines; a selector
 * anchored only at string start admits neither. Multi-line is a shape the fleet writes — 13 of
 * 2362 `console.log` renderings under `scripts/` are multi-line — but no MEAS emitter is one yet,
 * so this cannot be derived and will not become derivable by widening the population.
 *
 * The attribution stays off the labelled lines for F1's reason: probe-round308's pointer detector
 * pairs every `probe-roundNNN` on a line with every `[A-Z]\d+` on the same line.
 */
const MULTI_LINE_COUNTABLE = [
  'measurements:',
  '[A1] MEAS 7ms',
  '[A2] MEAS 9ms',
].join('\n');

const selectorAdmitsAllCountable = countableDropped.length === 0
  && FLEET_SPELLINGS.every((s) => MEAS_IN_LABEL_POSITION.test(s))
  // the fixture's own premise first — a line the counter CANNOT count is not evidence of dropping
  && measurementLines(MULTI_LINE_COUNTABLE) === 2
  && MEAS_IN_LABEL_POSITION.test(MULTI_LINE_COUNTABLE);
const selectorIsNotTheCounter = MEAS_IN_LABEL_POSITION.test(LABELLED_UNCOUNTABLE)
  && measurementLines(LABELLED_UNCOUNTABLE) === 0;
const selectorRejectsMentions = !MEAS_IN_LABEL_POSITION.test(SUMMARY_MENTION)
  && !MEAS_IN_LABEL_POSITION.test(IDENTIFIER_MENTION);

check('F7', "F6's population selector admits every countable line, including a multi-line one the population has no member of, rejects a line that merely MENTIONS the token, and is not equivalent to the counter",
  selectorAdmitsAllCountable && selectorIsNotTheCounter && selectorRejectsMentions,
  `derived: ${sweptMentions.length} MEAS-mentioning rendering(s) across ${SWEPT.length} swept probes, ` +
  `${sweptEmitters.length} in label position, ${countableDropped.length} countable-but-dropped (must be 0) — ` +
  `of which ${sweptMentions.filter((e) => e.rendered.includes('\n')).length} carry a newline, which is why d1 ` +
  'needs the fixture. Fixtures: a header-plus-measurement-block rendering counts ' +
  `${measurementLines(MULTI_LINE_COUNTABLE)} and is admitted=${MEAS_IN_LABEL_POSITION.test(MULTI_LINE_COUNTABLE)} ` +
  `(the Round 341 selector admitted it at string start only, and dropped it); a labelled uncountable ` +
  `line is admitted=${selectorIsNotTheCounter} (so F6 can still red); a summary line and an identifier ` +
  `mention are rejected=${selectorRejectsMentions}. ` +
  'Before Round 341 the selector was token PRESENCE, and one DEFERRED file reddened F6 on promotion ' +
  'for a line that is not a measurement. Before Round 343 it was anchored at string start, and d1 had ' +
  'zero members of the one dimension that can break.');

/**
 * F8 — F6's own SELECTOR COVERAGE, declared and graded in both directions.
 *
 * ── Round 345, Daedalus, building Theseus's routed Round 344 CURE C ────────────────────────────
 *
 * F6 and F7 grade the two regexes against each other. Neither can see the population F6 never
 * reached: `renderMeasMentions` keys on the MEAS token sitting literally inside a `console.log`'s
 * FIRST backtick-or-quote argument, which is narrower than "this file emits a MEAS label". Theseus
 * found the consequence and it is inside F6's own swept set: **`probe-round255` is SWEPT, emits six
 * MEAS lines, and `renderMeasMentions` returns 0 for it, so F6 grades 35 of its 36 members.**
 *
 *   const tag = r.kind === 'measurement' ? 'MEAS' : r.pass ? 'PASS' : 'FAIL';
 *   console.log(`${tag} [${r.arm}] ${r.check}`);
 *                     ..................................... probe-round255:171-172
 *
 * F6's inline-ternary special case rescues `round224`/`224b`; 255 hoists the same ternary one line
 * earlier and `${tag}` carries no literal. **F6 exists because an arm whose fixture is its own
 * hypothesis cannot fail on a case nobody thought of; a SELECTOR that silently drops a member of
 * its own population is that same defect one level up**, which is the whole argument for this arm.
 *
 * **The key is independent, and that is the only reason this arm can see anything.** It does not
 * look at `console.log`: it asks whether a MEAS token's bytes are string-literal body, by offset,
 * through the two `stripSource` readings. Graded before any figure was read off it, on shapes
 * copied out of the tree rather than typed: the hoisted-ternary site is seen by the key and NOT by
 * the renderer (the known positive, below), a commented-out emitting line is not a literal, and
 * `${MEASURED.length}` — `geometry-distance-arm.mjs:102`, the false mention Round 342 named — is
 * code in BOTH readings and so is correctly not a literal.
 *
 * **Why DECLARED rather than complete.** The honest cure is not "the renderer must see everything":
 * `probe-round280`'s emitter renders its label from a `record(id, 'MEAS', text)` helper whose MEAS
 * branch arrives as a FUNCTION PARAMETER, which no regex renderer resolves. So the arm asserts the
 * invisible set EQUALS a declared list, which reds in both directions — a new blind file reds it,
 * and so does a declared one becoming visible, so the list cannot go stale. Each declared entry
 * carries the line it really renders, and the arm asserts the fleet counter COUNTS that line: what
 * F6 would have concluded about the member it cannot see is stated and checked, not left blank.
 *
 * **Priced on the live tree before landing, swept and deferred both.** Of the 36 swept files, 32
 * carry a MEAS string literal, the renderer sees 31, and the invisible set is exactly `{round255}`;
 * the inverse direction is 0 (no file the renderer sees lacks a literal), so the key is a superset
 * of the renderer here and the arm cannot red for the key being narrow. Of the 109 DEFERRED files,
 * 64 carry a literal and **2** are invisible — `round280` and `round281`. That figure is computed
 * live below rather than written here, because a promotion number in a comment is the thing this
 * file has already been wrong about twice.
 *
 * **One correction to the routed finding, measured.** Round 344 named FOUR files in the
 * helper-emitter class — `round280/281/282/284`. All four are genuinely in it at SITE level, but
 * `round282:619` and `round284:477` each ALSO emit `console.log(`[MEAS] …`)`, a literal the
 * renderer does see, so at FILE level — which is the level CURE C specifies and this arm
 * implements — only two of the four are invisible. A file-count premise cannot see a partially
 * blind file, and saying so is cheaper than discovering it at promotion.
 *
 * **And one to its stated consequence.** Round 344 called 255's hole "vacuously harmless today"
 * because the line is countable. The countability is real, but it is not the reason: 255's SWEPT
 * entry makes NO measurement claim, so `measurementCheck` grades nothing against those six lines.
 * Both legs are now asserted — the entry's claim is F6's business, the rendering's countability is
 * this arm's.
 */
const DECLARED_INVISIBLE: Array<{ file: string; rendered: string }> = [
  // probe-round255:171-172 — the ternary is hoisted into `tag`, so the template carries no literal
  { file: 'probe-round255-the-comment-shadow-census.mts', rendered: 'MEAS [A] files walked: 194' },
];

/**
 * The known positive, copied verbatim from the two real lines at probe-round255:171-172 — a
 * detector with no known positive is not graded, and this fleet has shipped four detectors that
 * failed by returning a smaller number. It fixes both halves of the arm independently of today's
 * population: the key MUST see this, and the renderer MUST NOT. The known negatives are the two
 * real shapes that mention the token without being a literal measurement label.
 *
 * Attributions stay off the labelled lines for the reason F1's comment records.
 */
const HOISTED_TERNARY_SITE = [
  "const tag = r.kind === 'measurement' ? 'MEAS' : r.pass ? 'PASS' : 'FAIL';",
  'console.log(`${tag} [${r.arm}] ${r.check}`);',
].join('\n');
// geometry-distance-arm.mjs:102 — MEAS is an identifier inside `${ … }`, code in both readings
const INTERPOLATED_IDENTIFIER = 'console.log(`formulas reproduce ${MEASURED.length} measured arms exactly:`);';
const COMMENTED_OUT_EMITTER = '// MEAS [A1] a commented-out emitting line\nconst live = 1;\n';

const deferredInvisible = DEFERRED.filter((file: string) => {
  const abs = join(REPO, 'scripts', file);
  if (!existsSync(abs)) return false;
  const raw = readFileSync(abs, 'utf8');
  return measStringLiteralLines(raw).length > 0
    && renderMeasMentions(stripSource(raw, false)).length === 0;
});

const invisibleDeclared = [...sweptInvisible.map((e) => e.file)].sort().join('|')
  === [...DECLARED_INVISIBLE.map((e) => e.file)].sort().join('|');
const declaredRenderingsCountable = DECLARED_INVISIBLE.every((e) => measurementLines(e.rendered) === 1);
const keySeesWhatRendererCannot = measStringLiteralLines(HOISTED_TERNARY_SITE).length === 1
  && renderMeasMentions(stripSource(HOISTED_TERNARY_SITE, false)).length === 0;
const keyRejectsNonLiterals = measStringLiteralLines(INTERPOLATED_IDENTIFIER).length === 0
  && measStringLiteralLines(COMMENTED_OUT_EMITTER).length === 0;

check('F8', "F6's own selector reaches every swept file that writes a MEAS label, and the files it cannot reach are declared, rendered and countable",
  offsetsPreserved && invisibleDeclared && declaredRenderingsCountable
  && keySeesWhatRendererCannot && keyRejectsNonLiterals,
  `derived: ${sweptWithMeasLiteral.length} of ${SWEPT.length} swept files carry a MEAS string literal, ` +
  `F6's renderer reaches ${sweptWithMeasLiteral.length - sweptInvisible.length}, invisible=` +
  `${sweptInvisible.map((e) => `${e.file.slice(0, 28)}:${e.lines.join(',')}`).join(' | ') || '(none)'} ` +
  `against ${DECLARED_INVISIBLE.length} declared${invisibleDeclared ? '' : ' — SET MISMATCH, read this arm\'s comment'}. ` +
  `Each declared rendering is counted by the fleet counter=${declaredRenderingsCountable}. ` +
  `Fixtures: the real hoisted-ternary site is seen by the key and missed by the renderer=` +
  `${keySeesWhatRendererCannot}, an interpolated identifier and a commented-out emitter are not ` +
  `literals=${keyRejectsNonLiterals}, offsets preserved on every swept file=${offsetsPreserved}. ` +
  `At promotion: ${deferredInvisible.length} of the 109 DEFERRED files are invisible to the renderer ` +
  `(${deferredInvisible.map((f: string) => f.slice(6, 20)).join(', ') || 'none'}) — they emit through a ` +
  'helper whose MEAS branch is a function parameter, so they must be declared when promoted.');

// ── arm G: the census that prices the new state honestly ─────────────────────

console.log('\n── arm G: can BLOCKED fire on today\'s swept set? ──');

/**
 * Reads CODE, not prose. **Strings blanked as well as comments, and that is not a detail** — the
 * first version of this arm passed `false` here, and the first thing it caught was THIS probe:
 * arm H mints its blocked fixture from a string literal containing `process.exit(2)`, so a probe
 * that *stages* a refusal scored identical to a probe that *performs* one. Round 225's title, on
 * its author, one level in from where it was first found: a citation is not a call, and a citation
 * inside a string is still not a call. Arm G4 drives the difference two-sided.
 */
const hasExitTwo = (file: string, blankStrings = true): boolean => {
  const code = stripSource(readFileSync(join(REPO, 'scripts', file), 'utf8'), blankStrings);
  return /process\.exit\(2\)|exitCode\s*=\s*2/.test(code);
};

const sweptWithExitTwo = SWEPT.map((s: { file: string }) => s.file).filter((f: string) => hasExitTwo(f));
check('G1', 'no swept probe can exit 2, so the BLOCKED state cannot fire on today\'s swept set',
  sweptWithExitTwo.length === 0,
  sweptWithExitTwo.length === 0
    ? `0 of ${SWEPT.length} swept probes contain an exit(2) site in comment-stripped source. The ` +
      'mechanism is built and driven above against real exit-2 processes (arm H); it is waiting ' +
      'for a swept probe that propagates one. When this arm goes red that is the good news.'
    : `NOW REACHABLE from: ${sweptWithExitTwo.join(', ')} — re-read this arm's detail, the ` +
      'consequence in the memo has changed.');

const fleet = readdirSync(join(REPO, 'scripts')).filter((f) => /^probe-/.test(f));
const fleetWithExitTwo = fleet.filter((f) => hasExitTwo(f));
const fleetSoft = fleet.filter((f) => hasExitTwo(f, false));
measure('G2', 'exit(2) sites across the whole probe fleet, for contrast with G1',
  `${fleetWithExitTwo.length} of ${fleet.length} probe files refuse with exit 2 — all of them in ` +
  `DEFERRED. The convention exists and is used; the swept set is the part of the fleet that does ` +
  `not use it.\n        ${fleetWithExitTwo.slice(0, 6).join(', ')}…`);

const overReported = fleetSoft.filter((f) => !fleetWithExitTwo.includes(f));
check('G4', 'the strings-kept reading over-reports, and by a named amount — a citation in a string is not a call',
  fleetSoft.length > fleetWithExitTwo.length && overReported.length === fleetSoft.length - fleetWithExitTwo.length,
  `strings KEPT: ${fleetSoft.length}. strings BLANKED: ${fleetWithExitTwo.length}. ` +
  `Over-reported by ${overReported.length}: ${overReported.join(', ')}. ` +
  'This probe is one of them — arm H mints a refusing fixture from a string — and probe-round250 is ' +
  'the other, which nobody had noticed. The figure quoted in sweep-probes.mjs\'s header was the ' +
  'strings-kept one until this arm produced the correction.');

const citationOnly = join(FIXTURES, 'citation-only.mts');
const realCall = join(FIXTURES, 'real-call.mts');
writeFileSync(citationOnly, 'const body = "process.exit(2);\\n";\nexport default body;\n');
writeFileSync(realCall, 'if (process.argv[9]) { process.exit(2); }\nexport default 1;\n');
const hardOf = (p: string) => /process\.exit\(2\)/.test(stripSource(readFileSync(p, 'utf8'), true));
check('G5', 'driven two-sided on one minted pair: string-only citation scores 0, real call scores 1',
  hardOf(citationOnly) === false && hardOf(realCall) === true,
  `citation-only → ${hardOf(citationOnly)}, real-call → ${hardOf(realCall)}. The two files differ ` +
  'only in whether the same eighteen characters sit inside quotes. Without this pair, G1 and G4 ' +
  'would both be asserting a mask behaviour neither one demonstrates.');

const r225 = stripSource(readFileSync(join(REPO, 'scripts', 'probe-round225-a-citation-is-not-a-call.mts'), 'utf8'), false);
/**
 * Round 271: this arm has changed polarity, and the change is the point.
 *
 * In Round 269 G3 was a TRIPWIRE. It asserted the defect — `r223bExit === 0`, mapping exit 2 and
 * exit 1 onto one FAIL — and its stated purpose was to go red when Theseus repaired arm B, because
 * that red is the signal to widen this file's BLOCKED limb. In Round 270 he repaired it. The arm
 * fired. It was doing its job, and a fired tripwire that is left asserting the old world becomes a
 * permanent false red that the next reader learns to ignore.
 *
 * So it is now an ASSERTION OF THE REPAIRED STATE: the three-valued `classifyDrive` is present and
 * the boolean conjunction is gone. A revert on Theseus's side reddens this again, which is the
 * property the tripwire had and which is worth keeping; what it no longer does is redden on
 * success.
 */
const armBRepaired = /classifyDrive/.test(r225) && !/r223bExit === 0 &&/.test(r225);
check('G3', 'probe-round225 arm B distinguishes its child\'s exit 2 from exit 1 — the conversion routed in 269, repaired in 270',
  armBRepaired,
  armBRepaired
    ? '`classifyDrive` is present and the `r223bExit === 0 &&` conjunction is gone: arm B now ' +
      'returns green | red | could-not-run and records a HARD SKIP for the third, which is what ' +
      'makes the probe exit 3. This arm was a tripwire in 269 asserting the defect; it fired when ' +
      'Theseus repaired it, and it is now the assertion of the repair so that a revert still reds.'
    : 'arm B has returned to grading its child\'s exit as a boolean, or `classifyDrive` is gone. ' +
      'That re-destroys the exit-2/exit-1 distinction one level below this file and makes the ' +
      'BLOCKED limbs unreachable again.');

// ── arm H: the states arise from real processes, not from hand-passed integers ──

console.log('\n── arm H: driven against minted scripts that really exit 0, 1 and 2 ──');

const FIX = FIXTURES;
const mint = (name: string, body: string) => {
  const p = join(FIX, name);
  writeFileSync(p, body);
  return p;
};
const spawn = (p: string) => {
  const r = spawnSync(process.execPath, [p], { encoding: 'utf8', timeout: 30_000 });
  return { code: r.status, out: `${r.stdout || ''}${r.stderr || ''}` };
};

const greenFixture = mint('green.mjs', `console.log(${JSON.stringify(GREEN)});\nprocess.exit(0);\n`);
const redFixture = mint('red.mjs', 'console.log("FAILED — 1 of 7");\nprocess.exit(1);\n');
const blockedFixture = mint('blocked.mjs',
  'console.error("fixture: something already holds the thing. Stop it and re-run.");\nprocess.exit(2);\n');

const g = spawn(greenFixture);
const r = spawn(redFixture);
const b = spawn(blockedFixture);

check('H1', 'a real process exiting 0 with the summary line classifies PASS',
  classify(g.code, g.out, EXPECT, REFUSAL).state === 'PASS',
  `exit ${g.code} → ${classify(g.code, g.out, EXPECT, REFUSAL).state}`);
check('H2', 'a real process exiting 1 classifies RED',
  classify(r.code, r.out, EXPECT, REFUSAL).state === 'RED',
  `exit ${r.code} → ${classify(r.code, r.out, EXPECT, REFUSAL).state}`);
check('H3', 'a real process exiting 2 with its declared refusal on STDERR classifies BLOCKED',
  classify(b.code, b.out, EXPECT, REFUSAL).state === 'BLOCKED',
  `exit ${b.code} → ${classify(b.code, b.out, EXPECT, REFUSAL).state}. The refusal was written to ` +
  'stderr, which is where every real refusal on this fleet is written, and the sweep concatenates ' +
  'both streams before grading.');
check('H4', 'and the sweep-level exit code over that mixed set is 2, not 1 and not 0',
  sweepExit({
    red: [g, r, b].filter((x) => classify(x.code, x.out, EXPECT, REFUSAL).state === 'RED').length - 1,
    blocked: [g, r, b].filter((x) => classify(x.code, x.out, EXPECT, REFUSAL).state === 'BLOCKED').length,
    bad: 0,
  }) === 2,
  'one PASS and one BLOCKED with the RED excluded → 2. With the RED included it is 1, which arm ' +
  'C already drove; this arm is about the three states arising from processes rather than from ' +
  'integers I chose.');

// ── arm J: the exit-3 limb and the diagnosis line (Round 271) ────────────────

/**
 * Round 271. Theseus's Round 270 §4 and §5, driven rather than accepted.
 *
 * The fixture mints a script that calls the REAL `summariseAndExit` from `probe-outcome.mts` with
 * a real hard skip, rather than one that prints a plausible-looking exit-3 transcript and exits 3.
 * That distinction is this file's founding rule aimed at its own newest arm: what a probe RUNS is
 * not recoverable from what a probe SAYS, so a fixture that only says `did not run:` would prove
 * nothing about the code path the sweep actually meets. It also means the legend line under J3 is
 * emitted by the library, so if the library stops emitting it this arm notices.
 */
console.log('\n── arm J: exit 3 with a declared skip, driven through the real probe-outcome ──');

const SKIP_LABEL = 'arm Q: the drive of some-child — it refused at its own door';
const SKIP = /arm Q: the drive of some-child/;
const outcomeMod = JSON.stringify(join(REPO, 'scripts', 'lib', 'probe-outcome.mts'));
const skipFixture = mint('inconclusive.mts',
  `import { summariseAndExit } from ${outcomeMod};\n` +
  'summariseAndExit({\n' +
  '  probeName: "fixture-probe",\n' +
  // `pass`, not `ok`: ProbeVerdict's field is `pass`, and the first version of this fixture used
  // `ok`, which is not merely ignored — an absent `pass` reads as falsy, so the fixture exited 1
  // as a FAILED check instead of 3. J1 caught it, which is the reason J1 asserts the exit code
  // separately from J2 rather than letting a wrong fixture quietly redden the limb under test.
  '  results: [{ arm: "A", check: "a check that really ran", pass: true }],\n' +
  `  skipped: [${JSON.stringify(SKIP_LABEL)}],\n` +
  '});\n');
const tsxBin = join(REPO, 'node_modules', '.bin', 'tsx');
const jr = spawnSync(tsxBin, [skipFixture], { encoding: 'utf8', timeout: 60_000, cwd: REPO });
const jOut = `${jr.stdout || ''}${jr.stderr || ''}`;

check('J1', 'the fixture really exits 3 through probe-outcome — not a transcript that says 3',
  jr.status === 3,
  `exit ${jr.status} from a real run of summariseAndExit with one hard skip. A fixture that ` +
  'printed this transcript and exited 3 by hand would demonstrate nothing about the path the ' +
  'sweep meets.');

check('J2', 'exit 3 carrying the entry\'s DECLARED skip label classifies BLOCKED',
  classify(jr.status, jOut, EXPECT, REFUSAL, SKIP).state === 'BLOCKED',
  `state = ${classify(jr.status, jOut, EXPECT, REFUSAL, SKIP).state}. This is the state Round 269 ` +
  'built and could not reach: the run established a check and broke none, so neither PASS nor RED ' +
  'is honest.');

check('J3', 'and a bare exit 3 with NO declared skip stays RED — arm A6\'s discipline on the new limb',
  classify(jr.status, jOut, EXPECT, REFUSAL, undefined).state === 'RED',
  `state = ${classify(jr.status, jOut, EXPECT, REFUSAL, undefined).state}. Same output, same exit ` +
  'code, no declared label — an undeclared not-green is not evidence about its own cause. This is ' +
  'the limb a plausible version of this change would omit, and it is omitted the same way twice.');

check('J4', 'a declared label that does NOT appear in the run does not buy BLOCKED either',
  classify(jr.status, jOut, EXPECT, REFUSAL, /arm Z: a skip that never happened/).state === 'RED',
  `state = ${classify(jr.status, jOut, EXPECT, REFUSAL, /arm Z: a skip that never happened/).state}` +
  '. Declaring a skip is not the same as the run reporting one, so the pattern must match the ' +
  'run\'s own `did not run:` line rather than merely be present in the entry.');

const jLast = jOut.trim().split('\n').map((l) => l.trim()).filter(Boolean).pop() || '';
check('J5', 'the OLD last-line heuristic quotes the legend, not the conclusion — the defect, demonstrated',
  /^\(exit 3 —/.test(jLast),
  `last line was: "${jLast.slice(0, 80)}". This is why the repair is needed rather than asserted: ` +
  'summariseAndExit prints the legend AFTER the headline, so the informative line is ' +
  'second-to-last for every probe that exits 3.');

check('J6', 'and diagnosisLine recovers the conclusion instead',
  /^INCONCLUSIVE — /.test(diagnosisLine(jOut)),
  `diagnosisLine → "${diagnosisLine(jOut).slice(0, 80)}". Driven two-sided against J5 on ONE ` +
  'output: the pair is what shows the repair changed the reader, rather than prose claiming it did.');

check('J7', 'diagnosisLine still returns the plain tail for output that never routes through probe-outcome',
  diagnosisLine('some probe that rolls its own tail\nFINAL: 3 of 3 ok') === 'FINAL: 3 of 3 ok' &&
  diagnosisLine('') === '(no output)',
  `bespoke tail → "${diagnosisLine('some probe that rolls its own tail\nFINAL: 3 of 3 ok')}", ` +
  `empty → "${diagnosisLine('')}". 95 deferred probes are not all on the shared library, so a ` +
  'heuristic that returned nothing for them would be a regression against the behaviour it replaces.');

check('J8', 'the live probe-round225 entry declares a skip label that matches its own source',
  (() => {
    const e = SWEPT.find((s) => s.file.startsWith('probe-round225'));
    if (!e || !e.skip) return false;
    const src = readFileSync(join(REPO, 'scripts', 'probe-round225-a-citation-is-not-a-call.mts'), 'utf8');
    return src.search(e.skip) >= 0;
  })(),
  'the declared `skip` pattern is found in probe-round225\'s own source, so the label is a ' +
  'contract with the file rather than a guess about it. This is the check that would have caught ' +
  'a paraphrase of the label — the failure mode of every prose-matching rule on this fleet.');

// ── arm Z ───────────────────────────────────────────────────────────────────

console.log('\n── arm Z: this run changed nothing under scripts/ or packages/ ──');

const zAfter = Z_PATHSPECS.map((p) => fingerprint(REPO, p));
const zMoved = Z_PATHSPECS.filter((_, i) => zAfter[i] !== zBefore[i]);
check('Z1', 'no file under scripts/ or packages/ was changed BY THIS RUN — a before/after content fingerprint',
  zMoved.length === 0,
  zMoved.length === 0
    ? `fingerprints identical across the whole run for ${Z_PATHSPECS.join(' and ')}; every write ` +
      `went to ${FIX.replace(process.cwd(), '.')}`
    : `MOVED: ${zMoved.join(', ')}\n        before: ${zBefore.join(' || ')}\n        after:  ${zAfter.join(' || ')}`);
measure('Z2', 'state of the window when this run opened — reported, NOT graded',
  zWindowAtOpen.join('\n        '));
check('Z3', 'the fixtures are under gitignored .testdata/ and nowhere else',
  existsSync(FIX) && FIX.includes('.testdata') && !existsSync(join(REPO, 'scripts', 'green.mjs')),
  `fixtures at ${FIX.replace(process.cwd(), '.')}; scripts/green.mjs does not exist`);

console.log('');
console.log(`${fail === 0 ? `All ${pass} regression checks passed` : `FAILED — ${fail} of ${pass + fail}`}, ${meas.length} measurements, 0 skips`);
process.exit(fail === 0 ? 0 : 1);
