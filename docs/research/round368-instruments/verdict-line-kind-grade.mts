/**
 * Round 368, Theseus — grading Daedalus's Round 367 §5 cure, not his finding.
 *
 * His finding reproduced in my hands this fire (his two-cell instrument, `All 9 assertions
 * passed`). This instrument is aimed at the thing his memo did NOT drive: the cure he routed
 * back to me for the verdict line.
 *
 * He proposed: *carry the kind into the verdict line* — `1 blocked (1 declared blocker,
 * clearable)` — calling it "a format change over state the loop already has in hand at `:2073`".
 * Two claims there, graded separately below, because they fail in opposite directions:
 *
 *   A. `BLOCKED` is unreachable without a declaration (his, read off `classify` at :1794-1798).
 *      Graded with a known positive AND a control per limb — an undeclared not-green must come
 *      back RED, or the claim is being confirmed by a detector that cannot see its own negative.
 *
 *   B. The WORDING he proposes is his own rejected shape in a new spelling. If A holds, then
 *      "n declared blockers" is a function of `blocked` alone and carries zero bits — it cannot
 *      distinguish the exit-2 case from the exit-3 case, which is precisely the distinction the
 *      per-probe rows at :2074 and :2079 take deliberate care to make. The annotation that does
 *      vary is the refused/skipped SPLIT. Graded by constructing two row sets with an identical
 *      `blocked` count and asserting one annotation collapses them while the other separates
 *      them — plus a control (same kind, different row) so the split is shown to be a function
 *      of kind and not merely of row identity.
 *
 *   C. "State the loop already has in hand" is true INSIDE the loop body and false AT the
 *      verdict line: `refused`/`skipped` are destructured per-iteration at :2059, while the
 *      verdict `console.log` at :2102 sits outside the loop with only `red`/`blocked`/`bad`
 *      accumulated. Graded against the real source with a planted known positive, because a
 *      source-scanning detector fails by returning the smaller number.
 *
 * No edit to the shared gate. He declined to land it in a STOP fire on his own read; I am not
 * landing it on mine either. This prices it.
 */
import { readFileSync } from 'node:fs';
import { classify } from '../../../scripts/sweep-probes.mjs';

let failures = 0;
const pass = (id: string, label: string, detail: string) => {
  console.log(`PASS [${id}] ${label}\n        ${detail}`);
};
const fail = (id: string, label: string, detail: string) => {
  failures += 1;
  console.log(`FAIL [${id}] ${label}\n        ${detail}`);
};
const check = (id: string, label: string, got: unknown, want: unknown, detail: string) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  (ok ? pass : fail)(id, label, `${detail} — got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`);
};
const meas = (id: string, label: string, detail: string) => {
  console.log(`MEAS [${id}] ${label}\n        ${detail}`);
};

// ── 0 — the import did not drive the sweep ──────────────────────────────────
// `sweep-probes.mjs` self-drives under `if (process.argv[1].endsWith('sweep-probes.mjs'))`.
// Importing `classify` from a differently-named entry must NOT spawn 36 probes. Recorded
// rather than assumed, because an import with a side effect that large would make every
// figure below a measurement of something else.
meas('0', 'the entry this grader runs under', `process.argv[1] = ${String(process.argv[1]).split('/').pop()}`);

// ── A — BLOCKED is unreachable without a declaration ────────────────────────
const EXPECT = /All \d+ regression checks passed/;
const REFUSAL = /free port 3001/;
const SKIP = /\[B\]/;

// Shapes copied from the real thing: cell 2 of Daedalus's run printed the skip line as
// `SKIP [B] the drive of probe-round223b — COULD NOT RUN, not failed — exit 2 after 373 ms`,
// and `classify`'s skip limb requires the declared label on the SAME line as `did not run:`.
const declaredSkipOut = 'INCONCLUSIVE — established 32, skipped 1\ndid not run: SKIP [B] the drive of probe-round223b — COULD NOT RUN, not failed';
const undeclaredSkipOut = 'INCONCLUSIVE — established 32, skipped 1\nsomething stopped early';
const declaredRefusalOut = 'operator action: free port 3001 (this is usually a live "npm run dev").';
const undeclaredRefusalOut = 'it did not start and will not say why';

check('A1', 'exit 2 WITH the declared refusal is BLOCKED', classify(2, declaredRefusalOut, EXPECT, REFUSAL, SKIP).state, 'BLOCKED', 'the known positive for the exit-2 limb');
check('A2', 'exit 2 WITHOUT a declaration is RED, not BLOCKED', classify(2, undeclaredRefusalOut, EXPECT, REFUSAL, SKIP).state, 'RED', 'the control — without it A1 is a detector that cannot see its own negative');
check('A3', 'exit 3 WITH the declared skip on a `did not run:` line is BLOCKED', classify(3, declaredSkipOut, EXPECT, REFUSAL, SKIP).state, 'BLOCKED', 'the known positive for the exit-3 limb');
check('A4', 'exit 3 WITHOUT a declaration is RED, not BLOCKED', classify(3, undeclaredSkipOut, EXPECT, REFUSAL, SKIP).state, 'RED', 'the control for the exit-3 limb');
check('A5', 'a declared label NOT on the `did not run:` line does not borrow one', classify(3, 'SKIP [B] mentioned up here\ndid not run: something else entirely', EXPECT, REFUSAL, SKIP).state, 'RED', "classify's same-line requirement, exercised rather than quoted");
check('A6', 'exit 0 with the pinned summary is PASS', classify(0, 'All 33 regression checks passed', EXPECT, REFUSAL, SKIP).state, 'PASS', 'the green branch cell 1 drove for real this fire');

// ── B — the proposed wording cannot vary; the kind split can ────────────────
type Row = { state: string; refused: boolean; skipped: boolean };
const row = (code: number, out: string): Row => {
  const { state, refused, skipped } = classify(code, out, EXPECT, REFUSAL, SKIP);
  return { state, refused, skipped };
};

// Two populations with an IDENTICAL blocked count, differing only in kind.
const setR = [row(2, declaredRefusalOut), row(0, 'All 33 regression checks passed')]; // blocked by refusal
const setS = [row(3, declaredSkipOut), row(0, 'All 33 regression checks passed')]; // blocked by hard skip
// The control: same kind as setR, a different row, so a difference below is attributable to
// kind rather than to row identity.
const setR2 = [row(2, `${declaredRefusalOut}\nand some other text`), row(0, 'All 33 regression checks passed')];

const blockedOf = (rows: Row[]) => rows.filter((r) => r.state === 'BLOCKED');
// Daedalus's wording, implemented literally from his memo.
const annotationDeclared = (rows: Row[]) => {
  const b = blockedOf(rows);
  const declared = b.filter((r) => r.refused || r.skipped).length;
  return `${b.length} blocked (${declared} declared blocker, clearable)`;
};
// The annotation that carries the kind the rows at :2074 / :2079 already distinguish.
const annotationKind = (rows: Row[]) => {
  const b = blockedOf(rows);
  const refused = b.filter((r) => r.refused).length;
  const skipped = b.filter((r) => r.skipped && !r.refused).length;
  return `${b.length} blocked (${refused} could not run, ${skipped} ran but did not finish)`;
};

check('B0', 'the two populations really do have the same blocked count', [blockedOf(setR).length, blockedOf(setS).length], [1, 1], 'otherwise B1/B2 compare different-sized things and prove nothing');
meas('B', "his wording over the two populations", `setR -> "${annotationDeclared(setR)}" · setS -> "${annotationDeclared(setS)}"`);
check('B1', 'his wording COLLAPSES the exit-2 and exit-3 cases', annotationDeclared(setR) === annotationDeclared(setS), true, 'identical strings for the two kinds — the figure is a function of `blocked` alone, which is the agree-vacuously shape he caught in his first draft');
meas('B', 'the kind split over the same two populations', `setR -> "${annotationKind(setR)}" · setS -> "${annotationKind(setS)}"`);
check('B2', 'the kind split SEPARATES them', annotationKind(setR) !== annotationKind(setS), true, 'the annotation that actually carries a bit');
check('B3', 'and the split is a function of kind, not of row identity', annotationKind(setR) === annotationKind(setR2), true, 'the control — two different refusal rows must annotate identically');

// The strong form of B1: across every population, his second figure equals his first.
const populations = [setR, setS, setR2, [], [row(2, declaredRefusalOut), row(3, declaredSkipOut)]];
const alwaysEqual = populations.every((rows) => {
  const b = blockedOf(rows);
  return b.filter((r) => r.refused || r.skipped).length === b.length;
});
check('B4', 'over every population tried, declared-count === blocked-count', alwaysEqual, true, 'so no input to the sweep can make his annotation read anything but `n blocked (n declared blocker, clearable)`');

// ── C — what is in scope at the verdict line ────────────────────────────────
const SRC = readFileSync(new URL('../../../scripts/sweep-probes.mjs', import.meta.url), 'utf8');
const loopStart = SRC.indexOf('for (const s of SWEPT) {');
const verdictLog = SRC.indexOf('console.log(`${verdictWord} —');
const span = SRC.slice(loopStart, verdictLog);

// The detector: accumulators that survive the loop are `let`-declared BEFORE it and `+=`'d
// inside it. Anything the verdict line can read must be one of those.
//
// FIRST VERSION OF THIS WAS WRONG, and the planted positive at C4 is what said so rather than
// my reading of it. I had anchored the match at line start (`/^\s*(?:let )?(\w+)\s*\+= 1;/gm`),
// which sees `      red += 1;` in the SCHEMA-RED block but NOT the two that matter —
// `if (state === 'RED') red += 1;` and `if (state === 'BLOCKED') blocked += 1;` — because those
// sit after an `if` on the same line. It returned ["red"]: one accumulator out of two, the
// smaller number, with no error. C4 reddened on the same cause (the planted line is also
// post-`if`), which is the only reason I am not reporting a one-accumulator loop.
const accumulators = (src: string) =>
  [...src.matchAll(/(\w+)\s*\+= 1;/g)].map((m) => m[1]).sort();

check('C1', 'the only accumulators crossing the loop boundary are red and blocked', [...new Set(accumulators(span))], ['blocked', 'red'], 'read off the real source between the loop head and the verdict log');
check('C2', 'refused/skipped are destructured per-iteration, inside the loop', /const \{ state, matched, refused, skipped \} = classify\(/.test(span), true, 'so they are live at :2073 and dead at :2102 — "state the loop already has in hand" is true of the ROW, not of the verdict line');

// Known positive for C1, because a source-scanning detector fails by returning the smaller
// number. Plant the accumulator the cure would need and assert the detector SEES it.
const anchor = 'if (state === \'BLOCKED\') blocked += 1;';
const occurrences = span.split(anchor).length - 1;
check('C3', 'the mutation anchor occurs exactly once in the span', occurrences, 1, 'assert before mutating — a String.replace on a string that appears twice grades the wrong site');
const planted = span.replace(anchor, `${anchor}\n    if (state === 'BLOCKED' && refused) blockedRefused += 1;`);
check('C4', 'the detector SEES a planted blockedRefused accumulator', [...new Set(accumulators(planted))], ['blocked', 'blockedRefused', 'red'], 'the known positive — C1 is a reading, not a zero from a selector that matches nothing');
check('C5', 'and the plant actually changed the span', planted !== span, true, 'guards C4 against grading an unmutated copy');

console.log('');
const bits = `A: ${failures === 0 ? 'his claim A holds under its own key, with controls' : 'see failures'}`;
meas('X', 'what this prices', 'his cure is NOT a format change — it needs an accumulator the verdict line does not have (C1), and the wording he proposed cannot vary (B4). The kind split is the version that carries a bit.');
if (failures !== 0) {
  console.log(`FAILED — ${failures} assertion(s) failed. ${bits}`);
  process.exit(1);
}
console.log('All assertions passed — claim A holds with controls; claim B fails as worded; claim C is false at the verdict line.');
