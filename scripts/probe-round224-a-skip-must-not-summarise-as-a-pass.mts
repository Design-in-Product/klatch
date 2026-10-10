/**
 * Round 224 — a probe that skipped its way to zero checks must not report success
 *
 * ## The subject
 *
 * `scripts/lib/probe-outcome.mts`, written this fire in answer to Theseus's Round 223 §3:
 * `probe-browse-endpoint-vs-channel-count` printed `All regression checks passed; 1
 * measurements recorded.` and exited 0 on a run where every port-dependent arm was skipped
 * because a stranger held 3001. `probe-turncount-live-http` printed `0/0 checks passed` and
 * exited 0 on the same run.
 *
 * ## What this control asserts, and the rule it obeys
 *
 * Round 222 adopted: **for any check of the form "X refuses Y", I must be able to say what
 * would have made it accept, and the control must put the run in that state.** Two of my four
 * Round 222 mutations survived the first version of that round's control precisely because it
 * only ever staged the refusing state. So arm A drives the accepting state first:
 *
 *   - **A — it accepts.** Checks ran, none skipped, none failed → exit 0, and the word
 *     "passed" IS printed. This is the state that would have made a refusal wrong. Without
 *     this arm, a `summarise` that returned code 3 unconditionally would score a clean sweep.
 *   - **B — the staged defect.** ≥1 check passed, ≥1 arm skipped → exit 3, and "passed" is
 *     NOT printed. This is Theseus's `browse-endpoint` case exactly.
 *   - **C — the vacuous run.** Zero checks, zero skips → exit 3. `turncount`'s `0/0 checks
 *     passed`: nothing was skipped in the recorded sense, the arms simply never fired, and a
 *     summary over the empty set still cannot go red.
 *   - **D — a failure dominates a skip.** A failed check plus a skip → exit 1, not 3. A
 *     partial run that also broke something must show the louder code.
 *   - **E — the escape hatch does not leak.** `inapplicable` entries are reported and do NOT
 *     force 3, and are not silently counted as skips. Since Round 294 arm E also holds the
 *     module's declared caller list to the one that actually exists, in both directions —
 *     see the comment at the check itself for why it no longer pins an absence.
 *
 * ## Arm F — the mutation arms, and why they are here
 *
 * A control that only exercises the fixed code cannot tell you the fix is load-bearing. Arm F
 * re-implements the two summary tails as they stood at `HEAD~` and asserts that each one
 * **reports success on arm B's input** — the defect reproduced in this file, from the shape of
 * the old code rather than from a recollection of it. If a future edit makes the new module
 * behave like the old tails, arm B goes red and arm F stays green, and the pair localises it.
 *
 * ## Arm G — the four migrated probes still have exactly one place that prints "passed"
 *
 * A source-level check, and the weakest arm here: it reads bytes, not behaviour. It exists
 * because the defect's mechanism was a hand-written tail in each probe, and the regression
 * shape is someone adding a second summary line above the shared call. Counted with
 * `readdirSync` + explicit reads, never a glob — Round 222 caught `grep` dropping a file from
 * glob results three times in one session.
 *
 * Run:  npx tsx scripts/probe-round224-a-skip-must-not-summarise-as-a-pass.mts
 *
 * Zero model calls. No server, no port, no DB, no corpus: `summarise` is a pure function and
 * this control drives it directly rather than scraping a subprocess's stdout. `packages/` is
 * untouched, asserted at exit.
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import { execFileSync } from 'child_process';
import { summarise, summariseAndExit, type ProbeVerdict } from './lib/probe-outcome.mts';
import { readNumericConstant, readLeadingFactor } from './lib/probe-source-constants.mts';
import { censusSkippedShapes } from './lib/skipped-shape-census.mts';
import { stripSource } from './lib/strip-source.mjs';

const REPO = path.resolve(import.meta.dirname, '..');
const PROBE = 'probe-round224-a-skip-must-not-summarise-as-a-pass';

type Kind = 'regression' | 'measurement';
const results: Array<{ arm: string; check: string; pass: boolean; detail: string; kind: Kind }> = [];
function check(arm: string, name: string, pass: boolean, detail: string, kind: Kind = 'regression') {
  results.push({ arm, check: name, pass, detail, kind });
  const tag = pass ? 'PASS' : kind === 'measurement' ? 'MEAS' : 'FAIL';
  console.log(`${tag} [${arm}] ${name} — ${detail}`);
}
const skipped: string[] = [];

const PACKAGES_BEFORE = execFileSync('git', ['-C', REPO, 'status', '--porcelain', 'packages'], { encoding: 'utf8' });

const ok = (arm: string, check_: string): ProbeVerdict => ({ arm, check: check_, pass: true, kind: 'regression' });
const bad = (arm: string, check_: string): ProbeVerdict => ({ arm, check: check_, pass: false, kind: 'regression' });
const meas = (arm: string): ProbeVerdict => ({ arm, check: 'a measurement', pass: true, kind: 'measurement' });

// ── Arm A — the accepting state: what would have made a refusal wrong ─────────

{
  const o = summarise({ probeName: 'subject', results: [ok('X', 'one'), ok('Y', 'two'), meas('Z')], skipped: [] });
  check('A', 'a clean run with checks and no skips exits 0', o.code === 0, `code ${o.code}`);
  check('A', 'and that is the ONLY state in which "passed" is printed', /passed/.test(o.headline),
    JSON.stringify(o.headline));
  check('A', 'the measurement is not counted as a hard check', o.ran === 2, `ran=${o.ran} (2 regression, 1 measurement)`);
}

// ── Arm B — Theseus's browse-endpoint case, staged ────────────────────────────

{
  const o = summarise({
    probeName: 'subject',
    results: [ok('V', 'a port-independent conclusion'), meas('V')],
    skipped: ['[R] needs a free port 3001 and a readable corpus', '[S] needs a free port 3001 and a readable corpus'],
  });
  check('B', 'a run with a skip does NOT exit 0', o.code !== 0, `code ${o.code}`);
  check('B', 'it exits 3 — ran, established less than it set out to', o.code === 3, `code ${o.code}`);
  check('B', 'the headline does not contain the word "passed"', !/passed/.test(o.headline),
    JSON.stringify(o.headline));
  check('B', 'the summary NAMES the skips rather than aggregating over what remains',
    o.reasons.length === 2 && o.reasons.every((r) => r.startsWith('did not run: ')),
    `${o.reasons.length} reason(s): ${JSON.stringify(o.reasons)}`);
  check('B', 'and the check that DID run is still reported, not discarded', o.ran === 1, `ran=${o.ran}`);
}

// ── Arm C — turncount's `0/0 checks passed` ───────────────────────────────────

{
  const o = summarise({ probeName: 'subject', results: [], skipped: [] });
  check('C', 'zero checks and zero skips still does not exit 0', o.code === 3, `code ${o.code}`);
  check('C', 'no "passed" over the empty set', !/passed/.test(o.headline), JSON.stringify(o.headline));
  check('C', 'the reason given is the vacuity itself, not a missing arm',
    o.reasons.length === 1 && /zero regression checks ran/.test(o.reasons[0]),
    JSON.stringify(o.reasons));
  // The measurement-only run is the same shape one layer over: Round 215's rule.
  const m = summarise({ probeName: 'subject', results: [meas('J'), meas('K')], skipped: [] });
  check('C', 'a run of measurements ONLY is also inconclusive (Round 215, one layer over)',
    m.code === 3 && m.ran === 0, `code ${m.code}, ran=${m.ran}`);
}

// ── Arm D — a failure dominates a skip ────────────────────────────────────────

{
  const o = summarise({
    probeName: 'subject',
    results: [ok('H', 'fine'), bad('I', 'broke')],
    skipped: ['[K] needs a free port'],
  });
  check('D', 'a failed check exits 1 even on a partial run', o.code === 1, `code ${o.code}`);
  check('D', 'the failure is named', o.failed.length === 1 && o.failed[0].arm === 'I',
    `${o.failed.length} failed: ${o.failed.map((f) => f.arm).join(',')}`);
  check('D', 'and the skip is still reported, not swallowed by the failure',
    o.reasons.some((r) => /did not run/.test(r)), JSON.stringify(o.reasons));
  check('D', 'the headline does not say "passed"', !/passed/.test(o.headline), JSON.stringify(o.headline));
}

// ── Arm E — the `inapplicable` escape hatch does not leak ─────────────────────

{
  const o = summarise({
    probeName: 'subject',
    results: [ok('A', 'one')],
    inapplicable: ['[G] this corpus genuinely contains no instance'],
  });
  check('E', 'an inapplicable arm does NOT force 3', o.code === 0, `code ${o.code}`);
  check('E', 'but it is still reported, distinctly from a skip',
    o.reasons.length === 1 && o.reasons[0].startsWith('not applicable: '), JSON.stringify(o.reasons));
  const both = summarise({
    probeName: 'subject',
    results: [ok('A', 'one')],
    skipped: ['[R] needs a free port'],
    inapplicable: ['[G] no instance in this corpus'],
  });
  check('E', 'one real skip alongside an inapplicable still forces 3', both.code === 3, `code ${both.code}`);
  // Round 247: two repairs to this scan, both found by driving it rather than reading it.
  //
  //   1. `!n.startsWith('.')` — a dot-prefixed mutant copy is a mutation harness's working file,
  //      not a caller. Without this, every harness that stages a copy under `scripts/` perturbs
  //      the population this arm measures, and the arm reddens on file presence alone. Prior art
  //      and the same spelling: `probe-round240-…:123`.
  //   2. comment-stripping — arm I below learned in Round 225 that a citation is not a call, and
  //      this arm, in the same file, never got the lesson. Driven 2026-09-21: a file whose only
  //      occurrence of the hatch is inside a `//` comment reddened this check. Any memo-adjacent
  //      probe that merely NAMES the hatch would have been reported as using it.
  const namesTheHatch = (src: string) => src
    .split('\n')
    .filter((l) => !/^\s*(\/\/|\*|\/\*)/.test(l))
    .some((l) => /inapplicable:/.test(l));
  // Round 294: this arm used to assert `callers.length === 0`, pinning probe-outcome.mts's
  // "No caller uses this yet (2026-09-17)". That is a pin on an ABSENCE, and the absence was
  // never the property worth protecting — it ended, correctly, the first time two probes used
  // the hatch for exactly what it was built for (round291 2026-09-29, round292 the same day).
  // The pin's real job was keeping the module's docstring honest, so it now does that directly:
  // the declared caller list and the measured one must agree, in BOTH directions. A new caller
  // reddens it (the doc is behind); a deleted one reddens it too (the doc is ahead). Neither
  // red can be cleared by waiting, and both name the file.
  const OUTCOME_LIB = path.join(REPO, 'scripts', 'lib', 'probe-outcome.mts');
  const measuredCallers = fs.readdirSync(path.join(REPO, 'scripts'))
    .filter((n) => (n.endsWith('.mts') || n.endsWith('.mjs')) && !n.startsWith('.'))
    .filter((n) => n !== `${PROBE}.mts`)
    .filter((n) => namesTheHatch(fs.readFileSync(path.join(REPO, 'scripts', n), 'utf8')))
    .map((n) => n.replace(/\.(mts|mjs)$/, '').replace(/^(probe-round\d+[a-z]?)-.*$/, '$1'))
    .sort();
  const declaredLine = fs.readFileSync(OUTCOME_LIB, 'utf8')
    .split('\n').find((l) => /INAPPLICABLE-CALLERS:/.test(l));
  const declaredCallers = (declaredLine ?? '')
    .replace(/^.*INAPPLICABLE-CALLERS:\s*/, '')
    .split(',').map((s) => s.trim()).filter(Boolean).sort();
  const listsAgree = (declared: string[] | undefined, measured: string[]) =>
    declared !== undefined
    && declared.length === measured.length
    && declared.every((c, i) => c === measured[i]);

  check('E', 'the hatch\'s declared caller list matches the callers that actually exist',
    listsAgree(declaredLine === undefined ? undefined : declaredCallers, measuredCallers),
    declaredLine === undefined
      ? `no INAPPLICABLE-CALLERS: line in ${path.relative(REPO, OUTCOME_LIB)} — the doc side of this arm was deleted`
      : `declared [${declaredCallers.join(', ')}] · measured [${measuredCallers.join(', ')}]`);

  // The comparison above is only worth having if it can go red. Driven on shapes this tree
  // does not currently produce, so that the green above is a result and not a tautology —
  // the same reason arm F re-implements the old summary tails rather than trusting them.
  check('E', 'KNOWN POSITIVE: a doc that is BEHIND the code reddens it',
    !listsAgree(['probe-round291'], ['probe-round291', 'probe-round292']),
    'a caller added without a doc edit is caught');
  check('E', 'KNOWN POSITIVE: a doc that is AHEAD of the code reddens it',
    !listsAgree(['probe-round291', 'probe-round292'], ['probe-round291']),
    'a caller deleted without a doc edit is caught — the direction the old emptiness pin could not see');
  check('E', 'KNOWN POSITIVE: a deleted doc line reddens it',
    !listsAgree(undefined, []),
    'the arm cannot be cleared by removing the thing it reads');
  check('E', 'and it is green on agreement, including on the empty population it used to assert',
    listsAgree([], []) && listsAgree(['a', 'b'], ['a', 'b']),
    'agreement passes at both the empty and the populated shape');
  check('E', 'and that scan is not vacuous — it still sees the live call in this file',
    namesTheHatch(fs.readFileSync(path.join(REPO, 'scripts', `${PROBE}.mts`), 'utf8')),
    'this probe passes the hatch on line ~153 in live code, and the comment-stripped scan finds it');
}

// ── Arm H — a skipped OPEN-ITEM arm must not redden the exit ──────────────────
//
// My own error, caught by driving rather than by reading. The first version of this module
// treated every skip alike, so `probe-turncount-live-http` on a FREE port — all 5 regression
// checks passing — exited 3 because arm J, an open item, skipped for want of a corpus
// exercising the line cap. That probe's own convention: an open item must not redden an exit,
// "because a red exit on a known-open item trains everyone to ignore the exit code."
//
// This is Theseus's Round 223 §6.2 error ("it counted SKIP as a conclusion") made one layer up,
// inside the module written to fix what he found there.

{
  const o = summarise({
    probeName: 'subject',
    results: [ok('H', 'live'), ok('I', 'contract')],
    skipped: [{ label: '[J] no session exceeds the line cap — untestable on this corpus', kind: 'open' }],
  });
  check('H', 'a skipped OPEN-ITEM arm alongside passing regression checks exits 0', o.code === 0, `code ${o.code}`);
  check('H', 'and it is still reported — reported, not counted', o.reasons.length === 1 && /not a hard check/.test(o.reasons[0]),
    JSON.stringify(o.reasons));
  check('H', 'the regression count is unaffected by the soft skip', o.ran === 2, `ran=${o.ran}`);

  // The discrimination must be real in both directions, or the tag is just a way to silence a skip.
  const hard = summarise({
    probeName: 'subject',
    results: [ok('H', 'live'), ok('I', 'contract')],
    skipped: ['[H] needs a FREE port 3001'],
  });
  check('H', 'an UNTAGGED skip of the same shape still exits 3 — the default stays safe', hard.code === 3,
    `code ${hard.code}`);
  const tagged = summarise({
    probeName: 'subject',
    results: [ok('H', 'live')],
    skipped: [{ label: '[H] needs a FREE port 3001', kind: 'regression' }],
  });
  check('H', 'and an explicitly regression-tagged skip exits 3 too', tagged.code === 3, `code ${tagged.code}`);
  const mixed = summarise({
    probeName: 'subject',
    results: [ok('H', 'live')],
    skipped: [{ label: '[J] open item', kind: 'open' }, '[I] needs a FREE port'],
  });
  check('H', 'one hard skip among soft ones still forces 3', mixed.code === 3,
    `code ${mixed.code}; reasons ${JSON.stringify(mixed.reasons)}`);
  check('H', 'and a soft skip cannot rescue a vacuous run',
    summarise({ probeName: 's', results: [], skipped: [{ label: '[J] open', kind: 'open' }] }).code === 3,
    'zero hard checks is still inconclusive whatever the skips were');
}

// ── Arm K — a near-miss `kind`, and which of it dominates (Rounds 355, 356) ───
//
// Daedalus, Round 355: `kind` is a free-form string whose legal values live in this module's
// prose and nowhere else, and every count in `summarise` is `=== regressionKind`. So a FAILING
// hard check tagged `'regresion'` left the population that decides the exit code and the run
// printed `All 2 regression checks passed` at code 0 — Theseus's Round 354 mechanism (a guard on
// identity does not guard value) one layer down, inverting an exit code instead of moving a
// figure. Cured by refusing any kind within edit distance 1 of `regressionKind`.
//
// Theseus, Round 356: that cure was graded in a scratch drive and pinned by nothing — this arm
// is the pin, and writing it found the precedence defect it also now holds. The refusal returned
// EARLY, above this module's own stated rule that a failure dominates, so a GENUINELY failing
// hard check sitting beside a typo'd row was demoted from code 1 to code 3 with `failed` emptied:
// no REGRESSIONS block, no channel naming the row that broke. Both directions are graded here
// because a refusal that swallows a red is the same shape as the report that swallowed it.
//
// The LIMIT is graded too, as a known negative rather than a sentence: two edits out is NOT
// caught. An arm that only showed the cure firing could not tell a narrow cure from a wide one.

{
  const nm = (arm: string, kind: string): ProbeVerdict =>
    ({ arm, check: 'a row one edit off', pass: true, kind });

  // K/355 — the refusal, and that it is a refusal and not a quieter pass.
  const miss = summarise({ probeName: 'subject', results: [ok('A', 'fine'), nm('C', 'regresion')] });
  check('K', 'a kind one edit from the regression kind does NOT exit 0', miss.code !== 0, `code ${miss.code}`);
  check('K', 'it refuses at 3 — the counts are an equality against a string it is not',
    miss.code === 3, `code ${miss.code}`);
  check('K', 'and the refusal does not print the word the pre-cure run printed',
    !/passed/.test(miss.headline), JSON.stringify(miss.headline.slice(0, 60)));
  check('K', 'the offending row is NAMED with its kind value, so the operator can fix it',
    miss.reasons.some((r) => /one edit from/.test(r) && /regresion/.test(r)), JSON.stringify(miss.reasons));
  const missSkip = summarise({
    probeName: 'subject',
    results: [ok('A', 'fine')],
    skipped: [{ label: '[B] needs a free port', kind: 'regresion' }],
  });
  check('K', 'the SKIP side refuses too — a hard skip one edit off stopped forcing 3',
    missSkip.code === 3, `code ${missSkip.code}`);

  // K/355 known negatives — every `kind` value the live tree actually uses, and the omitted case.
  const liveKinds = ['measurement', 'open', 'open-item', 'hard', 'check'];
  const tripped = liveKinds.filter((k) =>
    summarise({ probeName: 'subject', results: [ok('A', 'fine'), nm('C', k)] }).code !== 0);
  check('K', 'none of the kind values the live tree uses trips the refusal',
    tripped.length === 0, tripped.length ? `tripped: ${tripped.join(', ')}` : `${liveKinds.length} live kinds clean`);
  check('K', 'an OMITTED kind is untouched by the refusal and still counts as a hard check',
    summarise({ probeName: 'subject', results: [{ arm: 'A', check: 'untagged', pass: false }] }).code === 1,
    'the ?? default still points the safe way');
  check('K', 'a correctly-spelled run is untouched — the refusal is not reflexive',
    summarise({ probeName: 'subject', results: [ok('A', 'one'), ok('B', 'two')] }).code === 0,
    'identical is not a near-miss');

  // K/355 — the one shape plain Levenshtein scores as 2 and a typist produces constantly.
  check('K', 'an adjacent transposition is caught, which Levenshtein alone would miss',
    summarise({ probeName: 'subject', results: [ok('A', 'fine'), nm('C', 'rgeression')] }).code === 3,
    'Damerau, per the note on withinOneEdit');

  // K/355 — the declared LIMIT, graded. This arm goes red if the cure is ever widened silently.
  const twoEdits = summarise({ probeName: 'subject', results: [ok('A', 'fine'), nm('C', 'rgerssion')] });
  check('K', 'and the DECLARED limit is real: two edits out is not caught, and this says so',
    twoEdits.code === 0, `code ${twoEdits.code} — the cure narrows the hole, it does not close it`);

  // K/356 — precedence. The failure must dominate the refusal, as it dominates a skip in arm D.
  const both = summarise({
    probeName: 'subject',
    results: [bad('A', 'THE REAL BREAK'), ok('B', 'fine'), nm('C', 'regresion')],
  });
  check('K', 'a genuine failure beside a near-miss stays code 1 — the refusal does not demote it',
    both.code === 1, `code ${both.code}`);
  check('K', 'and the row that BROKE is named, which the first version of the cure emptied',
    both.failed.length === 1 && both.failed[0].check === 'THE REAL BREAK',
    `${both.failed.length} failed: ${both.failed.map((f) => f.check).join(',')}`);
  check('K', 'the near-miss is not traded away for the failure — both are reported',
    both.reasons.some((r) => /one edit from/.test(r)), JSON.stringify(both.reasons));
  check('K', 'the headline declares the denominator a FLOOR, since a near-miss can only remove rows',
    /is a floor, not the total/.test(both.headline), JSON.stringify(both.headline.slice(0, 70)));
  const bothSkip = summarise({
    probeName: 'subject',
    results: [bad('A', 'THE REAL BREAK'), ok('B', 'fine')],
    skipped: [{ label: '[C] needs a free port', kind: 'regresion' }],
  });
  check('K', 'precedence holds when the near-miss is on a SKIP rather than a verdict',
    bothSkip.code === 1 && bothSkip.failed.length === 1, `code ${bothSkip.code}, failed ${bothSkip.failed.length}`);

  // K/356 — the early return also dropped the skips. A run can carry both.
  const missAndSkip = summarise({
    probeName: 'subject',
    results: [ok('A', 'fine'), nm('C', 'regresion')],
    skipped: ['[D] needs a free port 3001'],
  });
  check('K', 'a refusal still names the hard skips it also carries',
    missAndSkip.reasons.some((r) => /did not run: \[D\]/.test(r)), JSON.stringify(missAndSkip.reasons));
}

// ── Arm L — the VALUE of `pass` and the TYPE of `kind` (Round 357) ────────────
//
// Arm K holds a `kind` value that is one typo from the hard kind. This arm holds the other two
// ways the same inversion is reached: a `pass` that is not a boolean, and a `kind` that is not a
// string. Both were Theseus's Round 356 limits, handed over explicitly undriven — "`pass` is not
// value-guarded (`!r.pass`, so a truthy non-boolean reads as a pass)… recorded as the next place
// to look rather than reported as a defect."
//
// Driven, both are real, and both invert an exit code rather than move a figure:
//
//   pass: 'FAIL' | -1 | [] | 'false'   ->  code 0, All 2 regression checks passed   (pre-357)
//   kind: ['regression'] on a FAILING row -> code 0, All 1 regression checks passed (pre-357)
//
// The second one is the sharper of the two and it falsified a sentence written one minute
// earlier: the Round 357 note recording the first limit claimed a non-string `kind` "throws
// inside withinOneEdit — loud". Four of five shapes do. `['regression']` does not, because its
// `.length` is 1 against the string's 10 and the near-miss refusal's own length pre-test returns
// false before any indexing happens. Reasoned loud, driven silent.
//
// Three things are graded here that an arm showing only the cures firing could not tell apart:
//   (1) the SAFE DIRECTION is unchanged. A falsy non-boolean was already a loud code 1 and must
//       stay one — refusing it with code 3 is exactly the demotion Theseus caught in Round 355's
//       cure, and this arm would redden if Round 357 repeated it in the other half of the
//       function.
//   (2) an all-boolean, all-string run is BYTE-IDENTICAL. The cure is monotone louder or nothing.
//   (3) the unreadable `kind` is defaulted IN, not out — the direction that keeps a failing row
//       in the population rather than the one that loses it.
//
// `as unknown as ProbeVerdict` is load-bearing here and is the point: the declared type is
// `boolean`, every caller is a `.mts` file inside `scripts/tsconfig.json`, and the only way in is
// something that defeats the checker. `any` does that silently — measured with the checker rather
// than a regex, 9 `any`-typed values reach a boolean verdict position across 145 files (all 9
// hand-read runtime-boolean-or-throw), and 0 non-string `kind` initializers exist. The live count
// of actual instances is zero in both populations; what was missing was anything holding it there.

{
  const V = (arm: string, pass: unknown, kind: unknown = 'regression'): ProbeVerdict =>
    ({ arm, check: 'a row with an unreadable field', pass, kind } as unknown as ProbeVerdict);

  // L/357 — KNOWN NEGATIVES FIRST. A broken harness cannot print a meaningful PASS (Round 354).
  const cleanRun = summarise({ probeName: 'subject', results: [ok('A', 'one'), ok('B', 'two')] });
  check('L', 'KN: an all-boolean all-string run is still exit 0 with the same headline',
    cleanRun.code === 0 && cleanRun.headline === 'All 2 regression checks passed.',
    `code ${cleanRun.code} :: ${JSON.stringify(cleanRun.headline)}`);
  const realFalse = summarise({ probeName: 'subject', results: [bad('A', 'a real break'), ok('B', 'two')] });
  check('L', 'KN: a genuine boolean false is a code 1 naming the row, byte-identical to pre-357',
    realFalse.code === 1 && realFalse.headline === '1 of 2 regression check(s) FAILED.'
      && realFalse.failed.length === 1,
    `code ${realFalse.code} :: ${JSON.stringify(realFalse.headline)}`);
  check('L', 'KN: and a clean run carries no unreadable-field reason it has no cause to carry',
    !cleanRun.reasons.some((r) => /not a boolean|not a string/.test(r)), JSON.stringify(cleanRun.reasons));

  // L/357 — the four truthy non-boolean shapes that returned exit 0 with "passed" in the line.
  const truthyShapes: [string, unknown][] = [
    ["the string 'FAIL'", 'FAIL'], ['-1, the indexOf shape', -1],
    ['[], an empty array', []], ["the string 'false'", 'false'],
  ];
  for (const [label, value] of truthyShapes) {
    const o = summarise({ probeName: 'subject', results: [V('A', value), ok('B', 'two')] });
    check('L', `a pass of ${label} is a FAILURE, not a pass`,
      o.code === 1 && o.failed.length === 1 && o.failed[0].arm === 'A',
      `code ${o.code}, failed ${o.failed.length}`);
    check('L', `and the row is named as a TYPE defect, not left looking like a broken subject (${label})`,
      o.reasons.some((r) => /pass is not a boolean/.test(r) && /\[A\]/.test(r)),
      JSON.stringify(o.reasons));
  }

  // L/357 — the safe direction must not have become quieter. This is the Round 356 lesson,
  // applied to Round 357's own cure before it could be found from outside.
  for (const [label, value] of [['undefined', undefined], ['0', 0]] as [string, unknown][]) {
    const o = summarise({ probeName: 'subject', results: [V('A', value), ok('B', 'two')] });
    check('L', `KN: a falsy non-boolean (${label}) was already code 1 and is STILL code 1`,
      o.code === 1 && o.failed.length === 1, `code ${o.code}, failed ${o.failed.length}`);
  }

  // L/357 — an unreadable `pass` beside a real break. Pre-357 the unreadable row was invisible:
  // code 1 naming only the genuine failure, with the other row silently counted as a pass.
  const mixed = summarise({
    probeName: 'subject',
    results: [bad('A', 'THE REAL BREAK'), V('B', 'FAIL'), ok('C', 'fine')],
  });
  check('L', 'an unreadable pass beside a real break names BOTH rows, not just the break',
    mixed.code === 1 && mixed.failed.length === 2,
    `code ${mixed.code}, failed ${mixed.failed.map((f) => f.arm).join(',')}`);

  // L/357 — composition with arm K's refusal. A failure dominates, per Round 356.
  const withNearMiss = summarise({
    probeName: 'subject',
    results: [V('A', 'FAIL'), ok('B', 'two'), ({ arm: 'C', check: 'c', pass: true, kind: 'regresion' } as ProbeVerdict)],
  });
  check('L', 'an unreadable pass dominates a near-miss kind, and the floor language still applies',
    withNearMiss.code === 1 && /is a floor, not the total/.test(withNearMiss.headline),
    `code ${withNearMiss.code} :: ${JSON.stringify(withNearMiss.headline.slice(0, 60))}`);

  // L/357 — the `kind` TYPE half. The array shape is the one that drove silently to exit 0.
  const arrayKind = summarise({ probeName: 'subject', results: [ok('A', 'fine'), V('B', false, ['regression'])] });
  check('L', "a FAILING row tagged kind: ['regression'] no longer summarises as exit 0",
    arrayKind.code === 1 && arrayKind.failed.length === 1,
    `code ${arrayKind.code}, failed ${arrayKind.failed.length}`);
  check('L', 'the unreadable kind is defaulted IN — the direction that keeps the failing row counted',
    arrayKind.ran === 2, `ran=${arrayKind.ran}`);

  // L/357 — and the four shapes that DID throw must not throw any more either.
  const throwShapes: [string, unknown][] = [['123', 123], ['null', null], ['{}', {}], ['true', true]];
  for (const [label, value] of throwShapes) {
    let code: number | string;
    try {
      code = summarise({ probeName: 'subject', results: [ok('A', 'fine'), V('B', false, value)] }).code;
    } catch (e) { code = `THREW ${(e as Error).message}`; }
    check('L', `a kind of ${label} is summarised rather than thrown out of withinOneEdit`,
      code === 1, `${code}`);
  }

  // L/357 — the dedicated limb: an unreadable kind with nothing failing. Neither neighbour's
  // prose describes this case, which is why it is not folded into either.
  const kindOnly = summarise({ probeName: 'subject', results: [ok('A', 'fine'), V('B', true, ['regression'])] });
  check('L', 'an unreadable kind on an otherwise-clean run refuses at 3 rather than printing "passed"',
    kindOnly.code === 3 && !/passed/.test(kindOnly.headline),
    `code ${kindOnly.code} :: ${JSON.stringify(kindOnly.headline.slice(0, 50))}`);
  check('L', 'and it does not borrow the near-miss prose, which says the rows LEFT the population',
    !/silently left the population/.test(kindOnly.headline), JSON.stringify(kindOnly.headline.slice(0, 80)));
  const skipKind = summarise({
    probeName: 'subject',
    results: [ok('A', 'fine')],
    skipped: [{ label: '[Z] needs a free port', kind: 7 } as unknown as { label: string; kind?: string }],
  });
  check('L', 'the SKIP side is read by type too, and names both the bad field and the skip',
    skipKind.code === 3 && skipKind.reasons.some((r) => /not a string/.test(r))
      && skipKind.reasons.some((r) => /did not run: \[Z\]/.test(r)),
    `code ${skipKind.code} :: ${JSON.stringify(skipKind.reasons)}`);
}

// ── Arm M — the field everything else is compared AGAINST (Round 358) ─────────
//
// Arms K and L hold the ROW's `kind`: one byte wrong is refused (355), one type wrong is
// defaulted IN and named (357). Both are equalities against `regressionKind`, and nothing held
// `regressionKind` itself. Driven over the population that makes the difference — one row tagged
// `'regression'` and FAILING, one untagged row passing, both shapes blessed by this module's own
// docblock:
//
//   regressionKind: ['regression']  ->  code 0, ran 1, All 1 regression checks passed   (pre-358)
//   regressionKind: 'check'         ->  code 0, ran 1, All 1 regression checks passed   (STILL)
//
// The failing row is absent from `failed`, so no REGRESSIONS block prints. Round 311 drove the
// string half of this over a HOMOGENEOUS population, where it lands on `ran 0 → code 3` and is
// loud about the wrong thing; ONE untagged row in the same run is the whole distance between
// code 3 and code 0, and the near-miss refusal cannot see either, since its own first act is a
// length pre-test against the operand in question.
//
// Round 358 cures the TYPE half and deliberately does NOT cure the string half. The three things
// this arm grades, which an arm showing only the new refusal firing could not tell apart:
//   (1) the string half is still code 0 and is NOW REPORTED in `reasons`. Pinned as a decision,
//       not an oversight: every refusal available for it false-reds a legitimate shape, and (2)
//       is the shape in question.
//   (2) the minimal-tagging KNOWN NEGATIVES — untagged hard checks beside a `kind: 'measurement'`
//       row, and a deliberately-failing `kind: 'open-item'` row — stay exit 0 with no refusal.
//       A later cure that refuses the string half reddens HERE and has to argue with these two.
//   (3) a failure still DOMINATES the new refusal (Round 356), and `describe` left every
//       serialisable reason byte-identical — the JSON spelling of a value is asserted, not just
//       its presence, because a helper that rewrote those bytes would move pins the sweep reads.

{
  const RK = (rk: unknown, results: ProbeVerdict[]) =>
    summarise({ probeName: 'subject', results, regressionKind: rk } as unknown as Parameters<typeof summarise>[0]);
  const V = (arm: string, pass: unknown, kind?: unknown): ProbeVerdict =>
    ({ arm, check: 'a row', pass, ...(kind === undefined ? {} : { kind }) } as unknown as ProbeVerdict);
  /** One tagged FAILING row, one untagged passing row. The population that moves 3 to 0. */
  const mixed = [bad('A', 'THE REAL BREAK'), V('B', true)];

  // M/358 — the TYPE half, cured. Code 3, and the row count is not laundered into a pass.
  const badType = RK(['regression'], mixed);
  check('M', 'a non-string regressionKind refuses at 3 instead of printing "All 1 regression checks passed"',
    badType.code === 3 && !/passed/.test(badType.headline),
    `code ${badType.code} :: ${JSON.stringify(badType.headline.slice(0, 64))}`);
  check('M', 'and the reason names the field, its type, and what it did to the population',
    badType.reasons.some((r) => /regressionKind is object/.test(r) && /left the population/.test(r)),
    JSON.stringify(badType.reasons.slice(0, 1)));
  check('M', 'the near-miss legs do not run against a non-string operand — no throw, no refusal text',
    !/one edit from/.test(badType.headline), JSON.stringify(badType.headline.slice(0, 48)));

  // M/358 — KNOWN NEGATIVE: a failure still dominates the new refusal. Round 356's lesson, and
  // the direction this arm exists to protect: the cure may only turn a 0 into a 3, never a 1.
  const badTypeWithFailure = RK(['regression'], [V('A', false), V('B', true)]);
  check('M', 'KN: an untagged FAILING row beside a non-string regressionKind is code 1, not demoted to 3',
    badTypeWithFailure.code === 1 && badTypeWithFailure.failed.length === 1,
    `code ${badTypeWithFailure.code}, failed ${badTypeWithFailure.failed.length}`);
  check('M', 'KN: and that code 1 still carries the configuration problem in its reasons',
    badTypeWithFailure.reasons.some((r) => /regressionKind is object/.test(r)),
    JSON.stringify(badTypeWithFailure.reasons.slice(0, 1)));

  // M/358 — the STRING half: not refused, and reported. Both halves of that are deliberate.
  //
  // Round 359, Daedalus — RE-AIMED, not loosened, and this is the arm the next reader should
  // compare against the memo. Round 358 pinned `code === 0 && ran === 1` here as a DECISION, with
  // the two legitimate shapes below it as the known negatives a later cure would have to argue
  // with. Round 359 wrote that cure: the stranding is refused when the stranded token is
  // `MODULE_DEFAULT_KIND` and the configured kind is a string no row carries. This fixture is
  // exactly that case (`mixed`'s failing row is tagged `'regression'`), so it is now a code 3 —
  // and the pin asserts the NEW behaviour at the same specificity, plus the thing that did NOT
  // change: `ran` is still 1, so the refusal did not launder the row count. Both known negatives
  // below are untouched and still green, which is the whole evidence that the cure is narrow.
  // Arm N grades the cure's boundary; this cell only records that this fixture moved.
  const strandedCase = RK('check', mixed);
  check('M', 'a string regressionKind no row carries, beside a row carrying the module default, is '
    + 'now REFUSED at 3 (Round 359) — and the row count is unchanged, not laundered',
    strandedCase.code === 3 && strandedCase.ran === 1 && !/passed/.test(strandedCase.headline),
    `code ${strandedCase.code} ran ${strandedCase.ran} :: ${JSON.stringify(strandedCase.headline.slice(0, 72))}`);
  check('M', 'but the failing row it stranded is NAMED, so the knowledge is in the run (Round 223)',
    strandedCase.reasons.some((r) => /NOT COUNTED, and it is a failure/.test(r)
      && /THE REAL BREAK/.test(r) && /"regression"/.test(r) && /"check"/.test(r)),
    JSON.stringify(strandedCase.reasons));
  check('M', 'and it says, in the run, that the counted rows carry no kind of their own',
    strandedCase.reasons.some((r) => /carries no `kind` of its own/.test(r)),
    JSON.stringify(strandedCase.reasons.slice(0, 1)));

  // M/358 — the two KNOWN NEGATIVES that stand in the way of refusing the string half. Both are
  // this module's documented minimal-tagging style, and both must stay exit 0.
  const legitMeasurement = summarise({ probeName: 'subject', results: [V('A', true), meas('B')] });
  check('M', 'KN: untagged hard checks beside a measurement row stay exit 0 with no stranded reason',
    legitMeasurement.code === 0 && !legitMeasurement.reasons.some((r) => /NOT COUNTED/.test(r)),
    `code ${legitMeasurement.code} :: ${JSON.stringify(legitMeasurement.reasons)}`);
  const legitOpenItem = summarise({
    probeName: 'subject',
    results: [V('A', true), V('B', false, 'open-item')],
  });
  check('M', 'KN: a deliberately-FAILING open-item row beside untagged hard checks is still exit 0',
    legitOpenItem.code === 0, `code ${legitOpenItem.code} :: ${JSON.stringify(legitOpenItem.headline)}`);
  check('M', 'and it is reported rather than refused — the line is there, the exit code is not moved',
    legitOpenItem.reasons.some((r) => /NOT COUNTED, and it is a failure/.test(r)),
    JSON.stringify(legitOpenItem.reasons.slice(0, 1)));

  // M/358 — `describe`: the reason builders are the only place an unintended type gets printed,
  // and `JSON.stringify` is not total. A BigInt and a circular object each threw out of the
  // Round 357 limb that exists to refuse instead of throwing.
  const circular: Record<string, unknown> = {}; circular.self = circular;
  for (const [label, kind, expectIn] of [
    ['a BigInt', 10n, 'bigint 10'],
    ['a circular object', circular, 'object [object Object]'],
  ] as [string, unknown, string][]) {
    let got: string;
    try {
      const o = summarise({ probeName: 'subject', results: [V('A', true, kind)] });
      got = `code ${o.code} :: ${o.reasons.join(' | ')}`;
    } catch (e) { got = `THREW ${(e as Error).message}`; }
    check('M', `a kind of ${label} is summarised and PRINTED rather than thrown out of the reason builder`,
      got.startsWith('code 3') && got.includes(expectIn), got.slice(0, 120));
  }
  let bigintPass: string;
  try {
    const o = summarise({ probeName: 'subject', results: [V('A', 10n), ok('B', 'fine')] });
    bigintPass = `code ${o.code} failed ${o.failed.length} :: ${o.reasons.join(' | ')}`;
  } catch (e) { bigintPass = `THREW ${(e as Error).message}`; }
  check('M', 'a pass of a BigInt reaches its REGRESSIONS block instead of crashing the print of a correct code 1',
    bigintPass.startsWith('code 1 failed 1') && bigintPass.includes('bigint 10'), bigintPass.slice(0, 120));

  // M/358 — KNOWN NEGATIVE for `describe`: the JSON spelling of every serialisable value is
  // asserted, not merely its presence. A helper that printed `[object Object]` where the sweep's
  // pins read `{}`, or dropped the quotes around a string, would redden here.
  const serialisableReasons = summarise({
    probeName: 'subject',
    results: [V('A', 'FAIL'), V('B', true, {}), ok('C', 'fine')],
  }).reasons.join(' | ');
  check('M', 'KN: describe leaves serialisable values in their JSON spelling — string quoted, {} as {}',
    /carries string "FAIL"/.test(serialisableReasons) && /kind is object \{\}/.test(serialisableReasons),
    JSON.stringify(serialisableReasons.slice(0, 150)));

  // M/358 — the two fields Round 357 declared undriven and left, driven. Neither moves an exit
  // code; `arm` reaches the REGRESSIONS block as `[object Object]`. Characterised, not cured.
  const armObj = summarise({
    probeName: 'subject',
    results: [V('A', false, 'regression'), ok('B', 'fine')]
      .map((r, i) => (i === 0 ? ({ ...r, arm: { a: 1 } } as unknown as ProbeVerdict) : r)),
  });
  check('M', "a non-string `arm` does NOT move the exit code — it reaches the named row as [object Object]",
    armObj.code === 1 && armObj.failed.length === 1 && `${armObj.failed[0].arm}` === '[object Object]',
    `code ${armObj.code} :: ${armObj.failed.map((f) => `${f.arm}`).join(',')}`);
  const checkObj = summarise({
    probeName: 'subject',
    results: [({ arm: 'A', check: { c: 1 }, pass: false, kind: 'regression' } as unknown as ProbeVerdict)],
  });
  check('M', 'and a non-string `check` does not move it either', checkObj.code === 1,
    `code ${checkObj.code}`);

  // M/358 — `inapplicable` is not type-read, and the asymmetry is the whole of the finding: the
  // throw is reachable ONLY from the all-green limb, which is the one limb that prints "passed".
  // Recorded as a measurement rather than cured: today it is a crash, and turning a crash into a
  // code 3 is the demotion Round 356 caught. The call belongs to the seat that owns the hatch.
  let inapGreen: string;
  try {
    inapGreen = `code ${summarise({ probeName: 'subject', results: [ok('A', 'fine')],
      inapplicable: 'probe-x' as unknown as string[] }).code}`;
  } catch (e) { inapGreen = `THREW ${(e as Error).constructor.name}`; }
  let inapRed: string;
  try {
    inapRed = `code ${summarise({ probeName: 'subject', results: [bad('A', 'broke')],
      inapplicable: 'probe-x' as unknown as string[] }).code}`;
  } catch (e) { inapRed = `THREW ${(e as Error).constructor.name}`; }
  check('M', `MEASUREMENT: a non-array \`inapplicable\` on a clean run → ${inapGreen}; on a red run → ${inapRed}`,
    true, 'the asymmetric limb is the one that prints "passed"', 'measurement');
  // Round 359, Daedalus — RE-AIMED. Round 358 asserted `inapGreen.startsWith('THREW')`, which was
  // the correct pin for a characterised-not-cured finding: it would have reddened if the crash had
  // been papered over quietly. Round 359 cured it, so the cell is re-aimed at the property that
  // outlives the cure — the ASYMMETRY, which is the whole of the finding: the all-green limb is
  // still the only one that treats this field differently from every other limb. Arm N holds the
  // cure itself, including the known negative that a failure is not demoted.
  check('M', 'the asymmetry itself is the check: the clean limb refuses on this field (it used to '
    + 'throw) and the failure limb never reaches it',
    inapGreen === 'code 3' && inapRed === 'code 1', `${inapGreen} / ${inapRed}`);
}

// ── Arm N — the narrow refusal, and its boundary (Round 359) ──────────────────
//
// Round 358 handed over one question: the string half of the `regressionKind` finding was reported
// and not refused, because every refusal Theseus tried false-reds a shape this module's own
// docblocks bless. Round 359 answers it with a key on the stranded TOKEN rather than on the shape
// of the run — refuse only when the configured kind is a string, is not `MODULE_DEFAULT_KIND`, is
// carried by no row, and some row carries `MODULE_DEFAULT_KIND`.
//
// An arm that showed only the refusal firing would be worth very little here, because the whole
// claim is about what the refusal does NOT touch. So this arm is mostly known negatives, and they
// are the same ones Round 358 wrote down as blockers: its two legitimate shapes, Round 311's three
// drive shapes, the failure-dominates precedence from Round 356, and the near-miss limb keeping
// the better diagnosis. Each is one cell. If a later round widens the key, the cell that reddens
// names which legitimate shape it just started refusing.
//
// Driven 2026-10-09, member list checked in both directions against a 33-case corpus (the full
// table is in the Round 359 writeup): 11 of 33 inputs moved, and the moved set was exactly the
// predicted set — no surprise movements, and no predicted movement that failed to happen.
//
// Also here: the `inapplicable` hatch, which Round 358 characterised and left. The throw was
// reachable only from the all-green limb; it is now a code 3 from that limb and nothing else.

{
  const RK = (rk: unknown, results_: ProbeVerdict[], extra: Record<string, unknown> = {}) =>
    summarise({ probeName: 'subject', results: results_, regressionKind: rk, ...extra } as unknown as Parameters<typeof summarise>[0]);
  const V = (arm: string, pass: unknown, kind?: unknown): ProbeVerdict =>
    ({ arm, check: `row ${arm}`, pass, ...(kind === undefined ? {} : { kind }) } as unknown as ProbeVerdict);
  const HATCH = (inap: unknown, results_: ProbeVerdict[]) =>
    summarise({ probeName: 'subject', results: results_, inapplicable: inap } as unknown as Parameters<typeof summarise>[0]);

  // N/359 — the cure fires, on both halves of the `pass` axis. The PASSING case is the deliberate
  // widening past `strandedFailures`'s key: the defect is in the configuration, not in the row, and
  // a guard whose reachability depends on the subject's health cannot be exercised on demand.
  const invFail = RK('check', [V('A', false, 'regression'), V('B', true)]);
  const invPass = RK('check', [V('A', true, 'regression'), V('B', true)]);
  check('N', 'a configured kind no row carries, beside a row carrying the module default, refuses '
    + 'at 3 instead of printing "All 1 regression checks passed"',
    invFail.code === 3 && !/passed/.test(invFail.headline),
    `code ${invFail.code} :: ${JSON.stringify(invFail.headline.slice(0, 70))}`);
  check('N', 'and the headline names BOTH tokens and how many rows carry the default, so the '
    + 'operator can tell which of the two is wrong without reading the source',
    /"check"/.test(invFail.headline) && /"regression"/.test(invFail.headline)
    && /1 row\(s\) carry/.test(invFail.headline),
    JSON.stringify(invFail.headline.slice(0, 120)));
  check('N', 'it refuses on a PASSING stranded row too — the defect is the configuration, not the row',
    invPass.code === 3 && invPass.reasons.some((r) => /counted nothing and excluded/.test(r)),
    `code ${invPass.code} :: ${JSON.stringify(invPass.reasons[0]?.slice(0, 70) ?? '')}`);
  check('N', 'and the stranded FAILING row is still named in the reasons as well — the refusal did '
    + 'not replace the Round 358 line that says which row left the population',
    invFail.reasons.some((r) => /NOT COUNTED, and it is a failure/.test(r) && /row A/.test(r)),
    JSON.stringify(invFail.reasons.map((r) => r.slice(0, 40))));

  // N/359 — KNOWN NEGATIVE 1 and 2: Round 358's two blocking shapes, verbatim. These are the cells
  // a widened key reddens first, and they are the reason this cure is narrow rather than the
  // obvious "no row carries the configured kind".
  const tagsNothing = RK('check', [V('A', true), V('B', true)]);
  check('N', 'KN (Round 358 blocker 1): a probe that tags NOTHING is unmoved at exit 0 — no row '
    + 'carries the module default either, so the key cannot see it',
    tagsNothing.code === 0 && tagsNothing.ran === 2,
    `code ${tagsNothing.code} ran ${tagsNothing.ran} :: ${JSON.stringify(tagsNothing.headline)}`);
  const openItemDefault = summarise({ probeName: 'subject', results: [V('A', true), V('B', false, 'open-item')] });
  const openItemRenamed = RK('check', [V('A', true), V('B', false, 'open-item')]);
  check('N', 'KN (Round 358 blocker 2): a deliberately-FAILING open-item row beside untagged hard '
    + 'checks is unmoved at exit 0 under the default vocabulary',
    openItemDefault.code === 0, `code ${openItemDefault.code} :: ${JSON.stringify(openItemDefault.headline)}`);
  check('N', 'KN: and unmoved under a RENAMED vocabulary too, which is the harder half — the key is '
    + 'the identity of the stranded token, so an open-item stranding is still only reported',
    openItemRenamed.code === 0
    && openItemRenamed.reasons.some((r) => /NOT COUNTED, and it is a failure/.test(r)),
    `code ${openItemRenamed.code} :: ${JSON.stringify(openItemRenamed.reasons[0]?.slice(0, 60) ?? '')}`);
  const measRenamed = RK('check', [V('A', true), V('B', true, 'measurement')]);
  check('N', 'KN: a conventional measurement row under a renamed vocabulary stays exit 0 with no '
    + 'refusal and no stranded line',
    measRenamed.code === 0 && !measRenamed.reasons.some((r) => /NOT COUNTED/.test(r)),
    `code ${measRenamed.code} :: ${JSON.stringify(measRenamed.reasons)}`);

  // N/359 — KNOWN NEGATIVE 3: precedence. Round 356's lesson, which is the one this module has
  // now broken once and must not break again: a refusal may turn a 0 into a 3 and never a 1.
  const invBesideFailure = RK('check', [V('A', false), V('B', true, 'regression')]);
  check('N', 'KN: an untagged FAILING row beside the inverted configuration is code 1, not demoted '
    + 'to 3 — a failure still dominates (Round 356)',
    invBesideFailure.code === 1 && invBesideFailure.failed.length === 1,
    `code ${invBesideFailure.code} failed ${invBesideFailure.failed.length}`);
  check('N', 'KN: and that code 1 still carries the inverted configuration in its reasons, so the '
    + 'louder code does not cost the operator the diagnosis',
    invBesideFailure.reasons.some((r) => /counted nothing and excluded/.test(r)),
    JSON.stringify(invBesideFailure.reasons[0]?.slice(0, 70) ?? ''));

  // N/359 — KNOWN NEGATIVE 4: the configured vocabulary is IN USE. This is Round 311's C3 shape —
  // `regressionKind: 'check'` over rows that carry `'check'` — and it must be invisible to the key.
  const configInUse = RK('check', [V('A', false, 'check'), V('B', true, 'regression')]);
  check('N', 'KN (Round 311 C3): when a row DOES carry the configured kind, there is no refusal '
    + 'even with a module-default row beside it — the configuration counted something',
    configInUse.code === 1 && configInUse.failed.length === 1
    && !configInUse.reasons.some((r) => /counted nothing and excluded/.test(r)),
    `code ${configInUse.code} failed ${configInUse.failed.length}`);
  const r222Default = summarise({ probeName: 'p222', results: [V('A', false, 'check'), V('B', true, 'measurement')] });
  check('N', 'KN (Round 311 C1/C2): round222\'s shape under the DEFAULT vocabulary is unmoved — '
    + 'ran 0, code 3, "established nothing", which is what that probe pins',
    r222Default.code === 3 && r222Default.ran === 0 && /established nothing/.test(r222Default.headline),
    `code ${r222Default.code} ran ${r222Default.ran} :: ${JSON.stringify(r222Default.headline)}`);

  // N/359 — KNOWN NEGATIVE 5: the near-miss limb keeps the better diagnosis. A `regressionKind`
  // one edit from the default meets every condition of the new key, and a reader needs to be told
  // it is a TYPO, not an inversion — so the new limb sits below the near-miss one.
  const oneEditRk = RK('regressio', [V('A', false, 'regression'), V('B', true)]);
  check('N', 'KN: a regressionKind one edit from the default is still diagnosed as a near-miss, '
    + 'not as an inversion — the new limb is below the Round 355 one',
    oneEditRk.code === 3 && /one edit from/.test(oneEditRk.headline)
    && !/that no row carries/.test(oneEditRk.headline),
    JSON.stringify(oneEditRk.headline.slice(0, 80)));

  // N/359 — the key's own target, asserted by BEHAVIOUR rather than by reading the constant: an
  // untagged row and a row tagged `'regression'` must both be counted under the default config.
  // If `MODULE_DEFAULT_KIND` were ever retargeted, this cell goes first and the refusal's key
  // cannot drift silently behind a green run.
  const defaultIsRegression = summarise({ probeName: 'subject', results: [V('A', false, 'regression'), V('B', true)] });
  check('N', "KN: the module default is still the token 'regression' — a row tagged with it and an "
    + 'untagged row are both counted, so the new key is aimed at the live default',
    defaultIsRegression.code === 1 && defaultIsRegression.ran === 2,
    `code ${defaultIsRegression.code} ran ${defaultIsRegression.ran}`);

  // N/359 — the hatch. Round 358 §5: the throw was reachable ONLY from the all-green limb, which
  // is the one limb that prints "passed". Now a code 3 from that limb, and unchanged everywhere
  // else. The four cells are the finding's own asymmetry, turned into pins.
  const hatchGreen = HATCH('probe-x', [V('A', true, 'regression')]);
  const hatchRed = HATCH('probe-x', [V('A', false, 'regression')]);
  const hatchNull = HATCH(null, [V('A', true, 'regression')]);
  const hatchArray = HATCH(['probe-x'], [V('A', true, 'regression')]);
  check('N', 'a non-array `inapplicable` on an all-green run is a code 3 naming the field, where it '
    + 'used to throw `inapplicable.map is not a function` with no headline at all',
    hatchGreen.code === 3 && /not an array/.test(hatchGreen.headline) && !/passed/.test(hatchGreen.headline),
    `code ${hatchGreen.code} :: ${JSON.stringify(hatchGreen.headline.slice(0, 76))}`);
  check('N', 'and the unreadable value is quoted in the reasons, so a slipped label is not lost — '
    + 'the hatch is not salvaged into the list, it is printed',
    hatchGreen.reasons.some((r) => /inapplicable is string "probe-x"/.test(r)),
    JSON.stringify(hatchGreen.reasons[0]?.slice(0, 80) ?? ''));
  check('N', 'KN: the same input beside a FAILURE is still code 1 — the hatch is unreachable there, '
    + 'so this cure cannot be the demotion Round 356 caught',
    hatchRed.code === 1 && hatchRed.failed.length === 1,
    `code ${hatchRed.code} failed ${hatchRed.failed.length}`);
  check('N', 'KN: `null` and a proper array are both unmoved — `?? []` still means "no hatch", and '
    + 'a real list still prints its "not applicable" line',
    hatchNull.code === 0 && hatchArray.code === 0
    && hatchArray.reasons.some((r) => /not applicable: probe-x/.test(r)),
    `null → code ${hatchNull.code}; array → code ${hatchArray.code} :: ${JSON.stringify(hatchArray.reasons)}`);

  // N/359 — MEASUREMENT: the declared cost of the key, recorded rather than argued. The one shape
  // this refuses that a sufficiently contrary caller could have meant is renaming the hard-check
  // vocabulary while keeping `'regression'` as the name of a SOFT kind. Nothing in the tree does
  // it; if someone ever does, this line is where the price was written down.
  const contrary = RK('check', [V('A', true, 'check'), V('B', true, 'regression')]);
  const contraryNoUse = RK('check', [V('A', true), V('B', true, 'regression')]);
  check('N', `MEASUREMENT: the declared cost — 'regression' used as a SOFT kind under a renamed `
    + `vocabulary is code ${contraryNoUse.code} when nothing carries the configured kind, and code `
    + `${contrary.code} as soon as one row does`,
    true, 'priced and accepted: the escape is to tag one row with the configured kind', 'measurement');
}

// ── Arm O — the Round 359 key read ONE of the two populations it is keyed over ────────────────
//
// Round 360, Theseus. `summarise` counts two populations against `regressionKind`: `results`, via
// `readKind`, and `skipped`, via `kindOf` — which is `readKind` on the record's own `kind`. Both
// population conditions of the Round 359 key (`!carriesTheKind`, and "some row carries
// MODULE_DEFAULT_KIND") read `input.results` only. Three of the four other `kind`-reading guards in
// that function already read both: `unreadableKinds` does, `nearMisses` does, `kindOf` is the other
// population. This key and `strandedFailures` read one.
//
// Driven on the shipped 358 and 359 libs side by side, so the reading is not confounded with the
// cure that was being verified:
//
//   skip {kind:'regression'}, DEFAULT rk              ->  code 3   hard skip        (correct)
//   skip {kind:'regression'}, rk 'check', no row      ->  code 0   "All 1 regression checks passed."
//                                                          + "not a hard check, did not run: X"
//   the same, plus a results row tagged 'regression'  ->  code 3   REFUSED (condition 4 held)
//
// The demotion in the skip population is **3 → 0** — strictly worse than the results-row case the
// key was built for, because a skip that declared itself a hard check in this module's own
// vocabulary is reported on the green limb under a line that denies it, beside the one headline
// this file is NAMED after. Live instances 0; `probe-round250` is the near miss, and it is
// protected by condition 4 via its `check()` helper's rows rather than by anything reading its Z3.
//
// Mostly known negatives, for Round 359's own reason: the claim is about what the widening does
// NOT touch, and the cells that redden first if a later round widens further are the blessed
// shapes. Daedalus's 33-case corpus is byte-identical after this change — cell 11 pins that the
// skip clause is ADDITIVE rather than a re-aim of his published headline.
{
  const S = (rk: unknown, results_: ProbeVerdict[], skipped_: unknown[]) =>
    summarise({ probeName: 'subject', results: results_, skipped: skipped_, regressionKind: rk } as unknown as Parameters<typeof summarise>[0]);
  const D = (results_: ProbeVerdict[], skipped_: unknown[]) =>
    summarise({ probeName: 'subject', results: results_, skipped: skipped_ } as unknown as Parameters<typeof summarise>[0]);
  const V = (arm: string, pass: unknown, kind?: unknown): ProbeVerdict =>
    ({ arm, check: `row ${arm}`, pass, ...(kind === undefined ? {} : { kind }) } as unknown as ProbeVerdict);
  const HARD_SKIP = { label: 'env missing', kind: 'regression' };

  // O/360 — the cure. A skip carrying the module's own default name, beside a renamed vocabulary
  // that nothing carries, is the same inversion one population over.
  const skipInv = S('check', [V('B', true)], [HARD_SKIP]);
  check('O', 'a skip tagged with the module default, under a renamed vocabulary no row carries, '
    + 'refuses at 3 instead of printing "All 1 regression checks passed"',
    skipInv.code === 3 && !/passed/.test(skipInv.headline),
    `code ${skipInv.code} :: ${JSON.stringify(skipInv.headline.slice(0, 80))}`);
  check('O', 'and the headline counts the SKIP as a carrier — an operator reading "0 row(s)" alone '
    + 'would go looking for a verdict row that is not there',
    /0 row\(s\) and 1 skip\(s\) carry/.test(skipInv.headline) && /"check"/.test(skipInv.headline),
    JSON.stringify(skipInv.headline.slice(0, 130)));
  check('O', 'and the skip is named as a skip, not under the line that denies it was a hard check',
    skipInv.reasons.some((r) => /counted nothing and excluded/.test(r))
    && !skipInv.reasons.some((r) => /not a hard check, did not run/.test(r)),
    JSON.stringify(skipInv.reasons.map((r) => r.slice(0, 44))));

  // O/360 — KNOWN NEGATIVE 1: the control that makes the cell above non-vacuous. The same skip
  // under the DEFAULT vocabulary is a hard skip and always was; if this reddens, the widening has
  // started eating the ordinary case.
  const skipDefault = D([V('B', true)], [HARD_SKIP]);
  check('O', 'KN (control): the same skip under the DEFAULT vocabulary is unmoved — a hard skip at '
    + 'code 3 with the skip headline, not the inversion headline',
    skipDefault.code === 3 && /skipped 1 arm/.test(skipDefault.headline)
    && !/no row carries/.test(skipDefault.headline),
    `code ${skipDefault.code} :: ${JSON.stringify(skipDefault.headline.slice(0, 80))}`);

  // O/360 — KNOWN NEGATIVE 2: a bare-string skip takes `regressionKind` itself from `kindOf`, so
  // it is a hard check under every configuration and the widening must not reach it.
  const bareSkip = S('check', [V('B', true)], ['env missing']);
  check('O', 'KN: a bare-string skip is hard under any configuration (`kindOf` hands it '
    + '`regressionKind`), so it is unmoved at the skip limb and never the inversion limb',
    bareSkip.code === 3 && /skipped 1 arm/.test(bareSkip.headline),
    `code ${bareSkip.code} :: ${JSON.stringify(bareSkip.headline.slice(0, 70))}`);

  // O/360 — KNOWN NEGATIVE 3: the blessed shape in the skip population, which is the analogue of
  // Round 358's blocker 2. A soft skip stays soft under a renamed vocabulary.
  const softRenamed = S('check', [V('B', true)], [{ label: 'x', kind: 'open-item' }]);
  check('O', 'KN: an open-item skip under a renamed vocabulary is still SOFT at code 0 — the key is '
    + "the identity of the stranded token, and 'open-item' is not this module's",
    softRenamed.code === 0 && softRenamed.reasons.some((r) => /not a hard check, did not run: x/.test(r)),
    `code ${softRenamed.code} :: ${JSON.stringify(softRenamed.reasons)}`);

  // O/360 — KNOWN NEGATIVE 4: precedence, Round 356's rule. The widening may turn a 0 into a 3 and
  // never a 1 into a 3. Driven over the whole moved set, not one pair: exactly ONE of the five
  // movements this change produces alters a code, and it is the cure.
  const skipInvBesideFailure = S('check', [V('B', false)], [HARD_SKIP]);
  check('O', 'KN: a FAILING row beside the skip inversion is code 1, not demoted to 3 — a failure '
    + 'still dominates (Round 356)',
    skipInvBesideFailure.code === 1 && skipInvBesideFailure.failed.length === 1,
    `code ${skipInvBesideFailure.code} failed ${skipInvBesideFailure.failed.length}`);
  // Not a known negative, despite sitting beside one: driven against the 359 lib this cell is RED,
  // because the reason line is one of the five things the widening adds. Labelled as what it is.
  check('O', 'and that code 1 carries the inversion in its reasons — the louder code does not '
    + 'cost the operator the diagnosis',
    skipInvBesideFailure.reasons.some((r) => /counted nothing and excluded/.test(r)),
    JSON.stringify(skipInvBesideFailure.reasons[0]?.slice(0, 70) ?? ''));

  // O/360 — KNOWN NEGATIVE 5: limb order. Both of the limbs ABOVE the inversion one must still win
  // over it when the skip population is what triggers the key.
  const skipInvNearMiss = S('regresion', [V('B', true)], [HARD_SKIP]);
  check('O', 'KN: a near-miss `regressionKind` beside the skip inversion keeps the near-miss '
    + 'diagnosis — the Round 355 limb is still above the Round 359 one',
    skipInvNearMiss.code === 3 && /one edit from/.test(skipInvNearMiss.headline)
    && !/no row carries/.test(skipInvNearMiss.headline),
    JSON.stringify(skipInvNearMiss.headline.slice(0, 80)));
  const skipInvBadType = S(['x'], [V('B', true)], [HARD_SKIP]);
  check('O', 'KN: a non-string `regressionKind` beside the skip inversion still refuses on the TYPE '
    + '— the Round 358 limb is above this one too',
    skipInvBadType.code === 3 && skipInvBadType.reasons.some((r) => /regressionKind is object/.test(r)),
    `code ${skipInvBadType.code} :: ${JSON.stringify(skipInvBadType.reasons[0]?.slice(0, 60) ?? '')}`);
  const skipBadKind = S('check', [V('B', true)], [{ label: 'env missing', kind: 123 }]);
  check('O', 'KN: a non-string SKIP kind is the unreadable-kind limb, not the inversion limb — it '
    + 'is defaulted IN by `readKind` and so it carries the configured kind, not the default',
    skipBadKind.code === 3 && skipBadKind.reasons.some((r) => /skip env missing — kind is number/.test(r))
    && !skipBadKind.reasons.some((r) => /counted nothing and excluded/.test(r)),
    `code ${skipBadKind.code} :: ${JSON.stringify(skipBadKind.reasons[0]?.slice(0, 70) ?? '')}`);

  // O/360 — KNOWN NEGATIVE 6: Daedalus's published Round 359 headline, byte-pinned as a PROPERTY
  // rather than as a string — the skip clause must be ADDITIVE, so a run whose carriers are all
  // rows reads exactly as it did before this change. His whole 33-case corpus is byte-identical on
  // the strength of this; if it reddens, his table was re-aimed around rather than reproduced.
  const hisCure = S('check', [V('A', false, 'regression'), V('B', true)], []);
  check('O', 'KN (his Round 359 table): with no skip carrying the default, the headline still reads '
    + '"1 row(s) carry" and gains no skip clause — the widening is additive, not a re-aim',
    hisCure.code === 3 && /1 row\(s\) carry/.test(hisCure.headline) && !/skip\(s\)/.test(hisCure.headline),
    JSON.stringify(hisCure.headline.slice(0, 120)));

  // O/360 — KNOWN NEGATIVE 7: `carriesTheKind` was deliberately NOT widened, because
  // `strandedFailures` keys on it and that line is about rows. Asserted by behaviour: a failing
  // stranded row still gets its Round 358 line when a skip carries the configured kind.
  const stranded = S('check', [V('A', false, 'open-item'), V('B', true)], [{ label: 'x', kind: 'check' }]);
  check('O', 'KN: `strandedFailures` is unmoved — it keys on `carriesTheKind`, which was left alone, '
    + 'so a failing stranded row still gets its Round 358 line',
    stranded.reasons.some((r) => /NOT COUNTED, and it is a failure/.test(r) && /row A/.test(r)),
    JSON.stringify(stranded.reasons.map((r) => r.slice(0, 40))));

  // O/360 — condition 3, the other half of the same blindness, and the sentence it made false.
  // A skip carrying the CONFIGURED kind is selected by the configuration — `kindOf` makes it a hard
  // skip and it forces code 3 — so the configuration is NOT inert. Before this change the inversion
  // limb pre-empted the skip limb on exactly that run and printed "the configuration counted
  // nothing", which was false of it.
  const configLive = S('check', [V('B', true), V('A', true, 'regression')], [{ label: 'env missing', kind: 'check' }]);
  check('O', 'condition 3 reads the skips too: a skip carrying the CONFIGURED kind means the '
    + 'configuration counted something, so the run lands on the skip limb and not the inversion one',
    configLive.code === 3 && /skipped 1 arm/.test(configLive.headline)
    && !/no row carries/.test(configLive.headline),
    `code ${configLive.code} :: ${JSON.stringify(configLive.headline.slice(0, 80))}`);
  check('O', 'and the false sentence is gone with it — nothing in that run now claims the '
    + 'configuration counted nothing',
    !configLive.reasons.some((r) => /counted nothing/.test(r))
    && configLive.reasons.some((r) => /did not run: env missing/.test(r)),
    JSON.stringify(configLive.reasons.map((r) => r.slice(0, 40))));

  // O/360 — MEASUREMENT: live reachability, derived from a directory walk rather than a grep (a
  // grep-derived count fails by returning a SMALLER number — grep emits no row for a file holding
  // a NUL byte). Finding 1 needs three things in one file: a renamed vocabulary supplied to its own
  // `summariseAndExit`, a skip tagged `'regression'`, and NO results row tagged `'regression'`.
  check('O', 'MEASUREMENT: live instances of the three-part precondition = 0 across 194 .mts/.mjs/.ts '
    + 'files under scripts/; 3 self-configuring callers (round246/248/250), all supplying '
    + "'regression'; round250 is the near miss — it tags its Z3 skip 'regression' and is protected "
    + 'by condition 4 via its `check()` helper rows, so one rename is the whole distance',
    true, 'census in the Round 360 writeup; a rename of round250 is the shape that reaches this',
    'measurement');
}

// ── Arm F — the OLD tails, re-implemented, report success on arm B's input ────
//
// Verbatim shape of what stood at HEAD~, not a paraphrase:
//   browse-endpoint:  const failed = results.filter(r => !r.pass && r.kind === 'regression');
//                     if (failed.length) { …; process.exit(1); }
//                     console.log('All regression checks passed; …');   // exit 0
//   turncount:        console.log(`${passed.length}/${results.length} checks passed`);
//                     if (regressions.length) { …; process.exit(1); }
//                     process.exit(0);

function oldBrowseEndpointTail(rs: ProbeVerdict[]): { code: number; line: string } {
  const failed = rs.filter((r) => !r.pass && r.kind === 'regression');
  if (failed.length) return { code: 1, line: `${failed.length} regression check(s) failed.` };
  return { code: 0, line: 'All regression checks passed; N measurements recorded.' };
}
function oldTurncountTail(rs: ProbeVerdict[]): { code: number; line: string } {
  const regressions = rs.filter((r) => !r.pass && r.kind === 'regression');
  const passed = rs.filter((r) => r.pass);
  const line = `${passed.length}/${rs.length} checks passed`;
  return regressions.length ? { code: 1, line } : { code: 0, line };
}

{
  const armBInput = [ok('V', 'a port-independent conclusion'), meas('V')];
  const oldA = oldBrowseEndpointTail(armBInput);
  check('F', "the OLD browse-endpoint tail exits 0 and says 'passed' on arm B's input — the defect, reproduced here",
    oldA.code === 0 && /passed/.test(oldA.line), `exit ${oldA.code}: ${JSON.stringify(oldA.line)}`);

  const oldC = oldTurncountTail([]);
  check('F', "the OLD turncount tail prints '0/0 checks passed' and exits 0 on arm C's input",
    oldC.code === 0 && oldC.line === '0/0 checks passed', `exit ${oldC.code}: ${JSON.stringify(oldC.line)}`);

  // The mutations must not be vacuous: the old tails and the new module have to actually
  // DISAGREE on these inputs and AGREE where the old code was right.
  const newB = summarise({ probeName: 's', results: armBInput, skipped: ['[R] needs a free port'] });
  check('F', 'old and new disagree on the skipped run — 0 vs 3', oldA.code === 0 && newB.code === 3,
    `old ${oldA.code}, new ${newB.code}`);
  const failInput = [ok('H', 'fine'), bad('I', 'broke')];
  const oldFail = oldBrowseEndpointTail(failInput);
  const newFail = summarise({ probeName: 's', results: failInput });
  check('F', 'and they AGREE on a plain failure — the old tail was not wrong about everything',
    oldFail.code === 1 && newFail.code === 1, `old ${oldFail.code}, new ${newFail.code}`);
  const cleanInput = [ok('X', 'one')];
  check('F', 'and they AGREE on a clean run',
    oldBrowseEndpointTail(cleanInput).code === 0 && summarise({ probeName: 's', results: cleanInput }).code === 0,
    'both 0');
}

// ── Arm G — one place per probe prints "passed" ───────────────────────────────

{
  const MIGRATED = [
    'probe-browse-endpoint-vs-channel-count.mts',
    'probe-turncount-live-http.mts',
    'probe-browse-latency-end-to-end.mts',
    'probe-import-live-http.mts',
  ];
  for (const f of MIGRATED) {
    const p = path.join(REPO, 'scripts', f);
    check('G', `${f} exists`, fs.existsSync(p), p);
    const src = fs.readFileSync(p, 'utf8');
    const lines = src.split('\n');
    const offenders = lines
      .map((l, i) => ({ l, n: i + 1 }))
      .filter(({ l }) => /console\.log\(/.test(l) && /checks passed|regression checks passed/.test(l));
    check('G', `${f} has no hand-written "checks passed" summary line`, offenders.length === 0,
      offenders.length === 0
        ? 'the only summary comes from summariseAndExit'
        : offenders.map((o) => `:${o.n} ${o.l.trim()}`).join(' | '));
    check('G', `${f} calls summariseAndExit`, /summariseAndExit\(/.test(src),
      `import present: ${/probe-outcome\.mts/.test(src)}`);
  }

  // The population statement, from readdirSync — never a glob. Dot-prefixed files are excluded
  // (Round 247): they are mutation-harness working copies, not members of the population.
  const all = fs.readdirSync(path.join(REPO, 'scripts'))
    .filter((n) => (n.endsWith('.mts') || n.endsWith('.mjs')) && !n.startsWith('.'));
  // NORMALISED in Round 290, and the repair was forced by this arm going red on a COMMENT.
  //
  // This predicate used to run over raw source. Measured on `sweep-probes.mjs` at the commit before
  // the repair: `checks passed` was present ONLY in comments and `summariseAndExit(` was absent, so
  // two of its three terms were already satisfied by prose — the file sat ONE WORD away from a red
  // that had nothing to do with its behaviour. Adding a census comment containing the word "SKIP"
  // supplied that word and turned the arm red.
  //
  // Comments blanked, STRINGS KEPT (`stripSource(src, false)`): a hand-rolled summary line is a
  // string literal, so blanking strings would be the smaller-number failure in the other direction —
  // the detector would stop finding real offenders. Round 289 §4 measured that exact cost at two
  // files on a sibling detector.
  //
  // Third instance of one mechanism (Round 288 §3, Round 289 §4): not a regex written wrong, but a
  // correct regex applied to un-normalised input, where prose gets a vote.
  const normalised = (n: string): string =>
    stripSource(fs.readFileSync(path.join(REPO, 'scripts', n), 'utf8'), false);
  const isHandRolled = (src: string): boolean =>
    /SKIP/.test(src) && /checks passed/.test(src) && !/summariseAndExit\(/.test(src);

  const stillHandRolled = all
    .filter((n) => n !== `${PROBE}.mts`)
    .filter((n) => isHandRolled(normalised(n)));
  check('G', 'no script DIRECTLY under scripts/ — the probe population, one level, stated to match what is '
    + 'measured since Round 321 — still pairs a SKIP channel with a hand-rolled "checks passed"',
    stillHandRolled.length === 0, stillHandRolled.length ? stillHandRolled.join(', ') : `${all.length} scripts scanned`);

  // ── Round 321 (Daedalus, 2026-10-03). Theseus named this for six rounds: the population above is
  // ONE LEVEL, and until this fire the arm's claim said "under scripts/", which is the wider set.
  // Measured: scripts/ holds 166 files at the top level and 185 recursively, so 19 — the whole of
  // scripts/lib/ — were invisible to arm G while its own label asserted them. That is Round 309 §5's
  // finding (an arm's label is an unguarded restatement of its measured scope) sitting in this arm.
  //
  // The repair is NOT to walk recursively, and that was MEASURED rather than assumed. All 19 are
  // modules, not probes: isHandRolled flags 0 of 19 today and every one sits at 1 of 3 terms, so the
  // delta recursion would buy is zero. Against that, recursion would place scripts/lib/probe-outcome.mts
  // — the canonical summariser, the file whose JOB is to print "All N regression checks passed" —
  // inside the population of a detector looking for exactly that print without a summariseAndExit
  // call. It would escape only because its own DECLARATION line satisfies a regex written to detect
  // CALLS. That is an accident, not a reason, and it is two plausible edits from a false red on the
  // one file that must contain the text.
  //
  // So the label is narrowed to what is measured, and the BOUNDARY is now graded instead of assumed:
  // a real probe placed in a subdirectory reds loudly here, rather than arm G quietly not seeing it.
  // Same shape as the Round 321 repair in probe-round309 — a population nothing counted.
  const SCRIPTS_DIR = path.join(REPO, 'scripts');
  const walkScripts = (dir: string, acc: string[] = []): string[] => {
    for (const e of fs.readdirSync(dir)) {
      if (e.startsWith('.')) continue;
      const p = path.join(dir, e);
      if (fs.statSync(p).isDirectory()) walkScripts(p, acc);
      else if (e.endsWith('.mts') || e.endsWith('.mjs')) acc.push(path.relative(SCRIPTS_DIR, p));
    }
    return acc;
  };
  /**
   * Is this source a PROBE rather than a module? A probe CALLS the summariser without DECLARING it,
   * or hand-rolls its own summary — which is the thing arm G exists to catch. The declaration
   * exclusion is what keeps lib/probe-outcome.mts, which defines summariseAndExit, out of the class.
   */
  const isProbeShaped = (src: string): boolean => {
    const declaresSummariser = /(?:function|const)\s+summariseAndExit\b/.test(src);
    return (/summariseAndExit\(/.test(src) && !declaresSummariser) || isHandRolled(src);
  };
  const subdirFiles = walkScripts(SCRIPTS_DIR).filter((r) => r.includes(path.sep));
  const subdirProbes = subdirFiles.filter((r) =>
    isProbeShaped(stripSource(fs.readFileSync(path.join(SCRIPTS_DIR, r), 'utf8'), false)));
  check('G', 'and the boundary of that population is graded, not assumed: no PROBE lives in a scripts/ '
    + 'subdirectory, where arm G\'s one-level readdirSync could not see it',
    subdirProbes.length === 0,
    subdirProbes.length
      ? `probe-shaped files outside the graded population: ${subdirProbes.join(', ')} — move them to `
        + 'scripts/ or widen `all` deliberately, but do not leave them invisible to this arm'
      : `${subdirFiles.length} files under scripts/ subdirectories, 0 probe-shaped — all modules. `
        + `top-level population ${all.length}, recursive ${all.length + subdirFiles.length}.`);

  // The boundary detector's own known positive and negative, driven on synthetic source — because a
  // source-scanning predicate fails by returning a SMALLER number, and an arm that only ever sees
  // zero is indistinguishable from one that cannot see.
  check('G', 'KNOWN POSITIVE/NEGATIVE: the subdirectory detector classifies a probe that CALLS the '
    + 'summariser as probe-shaped, and the module that DECLARES it as not',
    isProbeShaped(stripSource(['import { summariseAndExit } from \'./probe-outcome.mjs\';',
      'summariseAndExit({ probeName: \'x\', results });'].join('\n'), false))
    && !isProbeShaped(stripSource(['export function summariseAndExit(input) {',
      '  console.log(`All ${n} regression checks passed.`);', '}'].join('\n'), false)),
    'a call-site is flagged; a declaration site carrying the very summary string arm G hunts is not — '
      + 'which is the discriminator that lets this boundary arm exist without false-reddening lib/probe-outcome.mts');

  // The detector's own known positive and known negative, driven on synthetic source rather than on
  // the population — so the normalisation above is shown to preserve the catch it exists for, and
  // not merely to have silenced a red.
  const OFFENDER = [
    'const skips = [];',
    'if (!port) skips.push("SKIP [R] needs a port");',
    'console.log(`${n}/${m} checks passed`);',
    'process.exit(0);',
  ].join('\n');
  const COMMENT_ONLY = [
    '// A note about how a SKIP used to summarise as "checks passed" before the migration.',
    'summarise({ probeName: "x", results });',
  ].join('\n');
  check('G', 'KNOWN POSITIVE: the normalised predicate still flags a real hand-rolled SKIP summary',
    isHandRolled(stripSource(OFFENDER, false)),
    'a synthetic offender whose SKIP and "checks passed" are both in CODE');
  check('G', 'KNOWN NEGATIVE: and no longer flags a file whose only hits are in a comment',
    !isHandRolled(stripSource(COMMENT_ONLY, false)),
    'the shape that reddened this arm in Round 290');

  check('G', 'and that scan was not vacuous — it finds the migrated four when the exemption is lifted',
    all.filter((n) => {
      const src = normalised(n);
      return /SKIP/.test(src) && /summariseAndExit\(/.test(src);
    }).length >= 4,
    'the SKIP+summary population is reachable by this scan', 'measurement');
}

// ── Arm I — the constant reader, and the 2026-09-04 reformatting that beat five ──
//
// Found while driving arm F of the 224b sweep: `probe-browse-latency-end-to-end` came back
// NOT ESTABLISHED with zero contact, and the cause was not the port at all — it throws at
// startup, and has since 2026-09-04, because `FINGERPRINT_LINE_CAP` became `50_000` and its
// regex was `(\d+);`. `probe-turncount-live-http` read the SAME constant with `(\d+)` (no
// terminator) and got `50`. Same change, same day; one probe died loudly and one ran quietly
// with a cap 1000× too small. Both are staged here against the real source bytes.

{
  const scannerSrc = fs.readFileSync(path.join(REPO, 'packages/server/src/import/session-scanner.ts'), 'utf8');
  const importSrc = fs.readFileSync(path.join(REPO, 'packages/server/src/routes/import.ts'), 'utf8');

  check('I', 'the shipped cap really is written with a numeric separator today',
    /const FINGERPRINT_LINE_CAP = 50_000;/.test(scannerSrc),
    'the staging condition for this whole arm; if this fails the arm below proves nothing');

  const cap = readNumericConstant(scannerSrc, 'FINGERPRINT_LINE_CAP', 'arm I');
  check('I', 'the shared reader gets 50000 from `50_000`', cap === 50_000, `read ${cap}`);

  // The two old regexes, verbatim, against the same real bytes.
  const oldStrict = scannerSrc.match(/const FINGERPRINT_LINE_CAP = (\d+);/);
  check('I', "browse-latency's OLD regex finds nothing — it threw at startup", oldStrict === null,
    'match === null, which its next line turned into a throw: dead since 2026-09-04');
  const oldLoose = scannerSrc.match(/const FINGERPRINT_LINE_CAP = (\d+)/);
  check('I', "turncount's OLD regex silently returns 50 — a cap 1000x too small", oldLoose?.[1] === '50',
    `matched ${JSON.stringify(oldLoose?.[1])} out of "50_000"`);
  check('I', 'so the two failure modes are genuinely different, from one reformatting',
    oldStrict === null && oldLoose?.[1] === '50' && cap === 50_000,
    'loud throw vs silent wrong value vs correct read');

  // The reader must not itself be capable of the silent-prefix failure.
  check('I', 'the reader refuses to return a prefix — it anchors on a value terminator',
    (() => {
      try { return readNumericConstant('const X = 50_000;', 'X', 't') === 50_000; } catch { return false; }
    })(), 'const X = 50_000; -> 50000, never 50');
  for (const [src, want] of [['const X = 50000;', 50_000], ['const X = 50_000;', 50_000],
    ['const X=7,', 7], ['const X = 12 )', 12]] as const) {
    check('I', `reader handles ${JSON.stringify(src)}`, readNumericConstant(src, 'X', 't') === want,
      `-> ${readNumericConstant(src, 'X', 't')}, want ${want}`);
  }
  // Round 226 split the product case out: `const X = 50 * 1024 * 1024;` used to read as 50 through
  // this same function, which is what let `FINGERPRINT_LINE_CAP = 50 * 1000` read as 50 as well.
  // The value reader now throws on a product and the factor reader answers it.
  check('I', 'a product declaration no longer reads as its leading factor through the value reader',
    (() => { try { readNumericConstant('const X = 50 * 1024 * 1024;', 'X', 't'); return false; } catch { return true; } })(),
    'readNumericConstant throws on `50 * 1024 * 1024` — Round 225 arm D/226');
  check('I', 'and the factor reader answers it', readLeadingFactor('const X = 50 * 1024 * 1024;', 'X', 't') === 50,
    `readLeadingFactor -> ${readLeadingFactor('const X = 50 * 1024 * 1024;', 'X', 't')}, want 50`);
  check('I', 'and it throws rather than guessing when the constant is gone',
    (() => { try { readNumericConstant('const Y = 1;', 'X', 't'); return false; } catch { return true; } })(),
    'a missing constant is a throw, not a fallback — probe-accepted-multipart-allocation used to ' +
    'fall back to a hardcoded 50 MB, which its own sibling refuses to do in a comment');

  check('I', 'MAX_IMPORT_SIZE still reads correctly through the shared reader',
    readLeadingFactor(importSrc, 'MAX_IMPORT_SIZE', 'arm I') === 50, 'routes/import.ts -> 50 (MB)');
  check('I', 'MAX_IMPORT_SIZE is NOT separator-written today — those three probes were latent, not broken',
    /const MAX_IMPORT_SIZE = 50 \* 1024 \* 1024;/.test(importSrc),
    'stated so nobody reads this round as having fixed three live failures; it fixed two', 'measurement');

  // Population statement, readdirSync not glob (Round 222: grep dropped a file 3x in one session).
  // The first version of this scan reported three files and all three were FALSE POSITIVES: it
  // matched the `// Was match(/… (\d+) …/)` comments recording the old regex in the two probes
  // I had just repaired, plus arm I above, which quotes both old regexes in live code on
  // purpose. A scan that cannot tell a citation from a call would have had the next reader
  // "fixing" a comment. Comment lines are stripped, and this file is named as the one place
  // the old patterns legitimately appear as code.
  // Round 247 adds the other half of the same lesson: a dot-prefixed copy of THIS file is a
  // harness artefact, and the name-based exemption below cannot see it. Driven 2026-09-21 — two
  // verbatim dot-copies, zero mutation, and this arm plus arm E went red on file presence alone.
  const isComment = (l: string) => /^\s*(\/\/|\*|\/\*)/.test(l);
  const all = fs.readdirSync(path.join(REPO, 'scripts'))
    .filter((n) => (n.endsWith('.mts') || n.endsWith('.mjs')) && !n.startsWith('.'));
  const blindIn = (n: string) => fs.readFileSync(path.join(REPO, 'scripts', n), 'utf8')
    .split('\n').filter((l) => !isComment(l)).filter((l) => /match\(\/.*=\s*\(\\d\+\)/.test(l));
  const stillBlind = all.filter((n) => n !== `${PROBE}.mts`).filter((n) => blindIn(n).length > 0);
  check('I', 'no script under scripts/ still scrapes a numeric constant with a separator-blind regex',
    stillBlind.length === 0,
    stillBlind.length
      ? stillBlind.map((n) => `${n}: ${blindIn(n)[0].trim()}`).join(' | ')
      : `${all.length} scripts scanned (comments stripped), 0 blind outside this control`);
  check('I', 'and the comment-stripping did not make the scan vacuous — this control still trips it',
    blindIn(`${PROBE}.mts`).length >= 2,
    `arm I quotes ${blindIn(`${PROBE}.mts`).length} old regexes in live code, and the scan sees them`);
  const migrated = all.filter((n) => /probe-source-constants\.mts/.test(fs.readFileSync(path.join(REPO, 'scripts', n), 'utf8')));
  check('I', 'and the scan is not vacuous — the five migrated readers are reachable by it',
    migrated.length >= 5, `${migrated.length} scripts import the shared reader: ${migrated.join(', ')}`);
}

// ── P · Round 361: the run's account of its own SCOPE, on every limb ──────────
//
// `summarise` has four reporting channels and EIGHT return sites. Measured per site, with all
// eight enumerated from source and each driven with the same inputs:
//
//     hard skips          carried on 6 of 6 limbs they can reach   (`did not run:`)
//     unreadable hatch    carried on 7 of 7 limbs it can reach     (`inapplicable is …`)
//     soft skips          the code-0 limb, and no other
//     inapplicable arms   the code-0 limb, and no other
//
// ROUND 362 — the first row above was published as `7 of 7` and re-derives as `6 of 6`. The
// denominator was borrowed: it came from a `LIMBS` map built for the `inapplicable` channel, which
// CAN sit on the code-0 limb, and reused for the hard-skip channel, which cannot — any hard skip
// pushes a `did not run:` reason, so the `reasons.length` limb returns before the code-0 limb is
// reached. Harmless in direction (numerator and denominator both inflated by one, and "carried
// everywhere it can reach" is unchanged), but a channel that MOVES which limb a run lands on
// cannot share a reachability denominator with one that does not. Both figures are now pinned by
// arm Q rather than written here, because a figure in a comment beside its own round is prose.
//
// So the module named the complaint that a run's scope is UNREADABLE everywhere and dropped the
// scope itself the moment the run had bad news. Live: `probe-round291` pushes arm C1's label, and
// on a run where one of its forty rows went red the summary was `1 of 40 regression check(s)
// FAILED.` with `reasons: []`. Distinct from arm M's `inapplicable` cell above, which is about the
// non-array CRASH (Round 358, cured in 359) and not about a readable list being dropped.
//
// THESEUS'S ROUND 360 CLAUSE, ADOPTED: every cell below is GRADED against the pre-cure lib rather
// than classified in a comment. A cell labelled KN that reddens at the pre-cure lib was never a
// known negative — it was a second copy of the cure cell — and only a drive can tell them apart.
// His cell O8 was mislabelled exactly that way and his own drive caught it; this arm does the same
// drive rather than trusting these labels. The pre-cure module is extracted from git into a temp
// directory (it imports nothing, so the file IS the module) and driven in a child process, so no
// path inside the repo is written and the sweep's git reading is untouched.
{
  const PRE_CURE_REV = '1059b23c'; // Theseus's Round 360 lib — the commit this arm is the pin for.
  const HATCH = ['C1 — no untracked, gitignored repo-root backup is present on this tree'];
  const S = (o: Record<string, unknown>) =>
    summarise({ probeName: 'subject', ...o } as unknown as Parameters<typeof summarise>[0]);
  const NA = 'not applicable: ';
  const SOFT = 'not a hard check, did not run: ';
  const hasNA = (o: { reasons: string[] }) => o.reasons.some((r) => r.startsWith(NA));
  const hasSoft = (o: { reasons: string[] }) => o.reasons.some((r) => r.startsWith(SOFT));

  /** One input per return site, each carrying the same readable hatch. Names match the limbs. */
  const LIMBS: Record<string, Record<string, unknown>> = {
    'code 1 · failed': { results: [bad('A', 'broke')], inapplicable: HATCH },
    'code 3 · configProblems': { regressionKind: ['regression'], results: [ok('A', 'fine')], inapplicable: HATCH },
    'code 3 · nearMisses': { regressionKind: 'regressoin', results: [ok('A', 'fine')], inapplicable: HATCH },
    'code 3 · invertedVocabulary': {
      regressionKind: 'check',
      results: [({ arm: 'A', check: 'untagged', pass: true } as unknown as ProbeVerdict), ok('B', 'tagged')],
      inapplicable: HATCH,
    },
    'code 3 · unreadableKinds': {
      results: [({ arm: 'A', check: 'c', pass: true, kind: {} } as unknown as ProbeVerdict)],
      inapplicable: HATCH,
    },
    'code 3 · reasons.length': { results: [ok('A', 'fine')], skipped: ['env missing'], inapplicable: HATCH },
    'code 0 · all green': { results: [ok('A', 'fine')], inapplicable: HATCH },
  };

  const carried = Object.entries(LIMBS).filter(([, i]) => hasNA(S(i))).map(([n]) => n);
  check('P', 'a readable `inapplicable` list is reported on EVERY limb it can reach, not only on '
    + 'the one that prints "passed"',
    carried.length === Object.keys(LIMBS).length,
    `${carried.length} of ${Object.keys(LIMBS).length} limbs: ${carried.join(' · ')}`);

  // Non-vacuity for the cell above: the limbs it names must actually be DISTINCT outcomes, or a
  // single limb reached seven times would satisfy it.
  const outcomes = new Set(Object.values(LIMBS).map((i) => `${S(i).code}:${S(i).headline.slice(0, 40)}`));
  check('P', 'and those are distinct outcomes, not one limb reached seven times',
    outcomes.size >= 6, `${outcomes.size} distinct code+headline pairs across ${Object.keys(LIMBS).length} inputs`);

  // The cure must not move a code. This is the Round 356 rule and it is the only way this cell
  // could have been a demotion.
  const codes = Object.entries(LIMBS).map(([n, i]) => `${n.split(' ')[1]}${S(i).code}`);
  check('P', 'and carrying it moves no exit code — the scope lines are appended to `reasons`, and '
    + 'the `reasons` gate that decides code 3 is NOT seeded with them',
    S(LIMBS['code 1 · failed']).code === 1 && S(LIMBS['code 0 · all green']).code === 0,
    `codes: ${codes.join(' ')}`);

  // P · KN — the gate is the trap the note beside it warns about: a green run that declares an
  // inapplicable arm must stay green. If this reddens, the cure has started converting the exact
  // runs the hatch exists to keep green.
  const greenWithHatch = S({ results: [ok('A', 'fine')], inapplicable: HATCH });
  check('P', 'KN: a green run that declares an inapplicable arm is still code 0 with the "passed" '
    + 'headline — the hatch does not force code 3, which is the whole reason it exists',
    greenWithHatch.code === 0 && /^All 1 regression checks passed\.$/.test(greenWithHatch.headline),
    `code ${greenWithHatch.code} :: ${JSON.stringify(greenWithHatch.headline)}`);

  // P · KN — no hatch declared, no line. A cure that printed the prefix unconditionally would
  // satisfy every cell above and be worthless.
  const noneDeclared = Object.values(LIMBS).map((i) => {
    const { inapplicable: _drop, ...rest } = i;
    return S(rest);
  });
  check('P', 'KN: a run that declares NO inapplicable arms gets no `not applicable:` line on any '
    + 'limb — the cure reports the field, it does not synthesise one',
    noneDeclared.every((o) => !hasNA(o)), `${noneDeclared.filter(hasNA).length} of ${noneDeclared.length} limbs printed one`);
  const emptyDeclared = S({ results: [bad('A', 'broke')], inapplicable: [] });
  check('P', 'KN: and an EMPTY list is not an empty claim — it adds nothing',
    !hasNA(emptyDeclared) && emptyDeclared.code === 1, `code ${emptyDeclared.code} reasons ${emptyDeclared.reasons.length}`);

  // P · THE ARM-O INVARIANT, restated at the limb my first draft broke. The first version of this
  // cure carried the SOFT-SKIP half everywhere too, and arm O cell 3 reddened inside the minute:
  // `not a hard check, did not run:` is the sentence Round 360 is named after, and `softSkips` is
  // computed by an equality against `regressionKind`. On a limb refusing the run BECAUSE that
  // vocabulary is unreliable, the sentence asserts the one thing the headline says is unknowable.
  const invWithHatch = S({
    regressionKind: 'check',
    results: [({ arm: 'A', check: 'untagged', pass: true } as unknown as ProbeVerdict)],
    skipped: [{ label: 'env missing', kind: 'regression' }],
    inapplicable: HATCH,
  });
  check('P', 'on the limbs that refuse the VOCABULARY, the `inapplicable` half is carried and the '
    + 'soft-skip half is withheld — a skip tagged with the module default is not reported under the '
    + 'line that denies it was a hard check, even now that the scope travels',
    invWithHatch.code === 3 && hasNA(invWithHatch) && !hasSoft(invWithHatch),
    `code ${invWithHatch.code} :: ${JSON.stringify(invWithHatch.reasons.map((r) => r.slice(0, 40)))}`);

  // P · non-vacuity for the gate. If the gate were simply "never carry soft skips", the cell above
  // would pass and the soft-skip half would be dead code.
  //
  // I wrote this cell `KN:` in the first draft, and the grading drive below says it is RED at Round
  // 360 — so it is a cure cell, not a known negative. Same correction Theseus's own drive made to
  // his cell O8 one round earlier, for the same reason: pre-cure, the code-1 limb carried neither
  // half, so a cell asserting that it carries BOTH is a second copy of the cure. Label fixed from
  // what the drive said, not from what I meant.
  const trustworthySoft = S({
    results: [ok('A', 'fine'), bad('B', 'broke')],
    skipped: [{ label: 'arm Z', kind: 'open-item' }],
    inapplicable: HATCH,
  });
  check('P', 'where the vocabulary IS trustworthy the soft-skip half travels too — the gate '
    + 'withholds it on three named limbs, it does not disable it',
    trustworthySoft.code === 1 && hasSoft(trustworthySoft) && hasNA(trustworthySoft),
    `code ${trustworthySoft.code} :: ${JSON.stringify(trustworthySoft.reasons.map((r) => r.slice(0, 34)))}`);

  // P · KN — Round 359's hatch cure must not have been disturbed by sharing a name with this one.
  const unreadableEverywhere = Object.entries(LIMBS).filter(([, i]) => {
    const o = S({ ...i, inapplicable: 'probe-x' });
    return o.reasons.some((r) => r.startsWith('inapplicable is '));
  });
  check('P', 'KN: the UNREADABLE-hatch complaint still reaches every limb (Round 359, undisturbed)',
    unreadableEverywhere.length === Object.keys(LIMBS).length,
    `${unreadableEverywhere.length} of ${Object.keys(LIMBS).length} limbs`);

  // P · the grading drive. Every predicate above, re-stated and run against the PRE-CURE lib.
  const graded: { cell: string; preCure: 'RED' | 'GREEN' | 'ERROR'; detail: string }[] = [];
  let gradeNote = '';
  let tmp = '';
  try {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'r361-pin-'));
    // Written OUTSIDE the repo deliberately: a probe that writes inside the tree while the sweep
    // drives produces a red indistinguishable from a real one (Round 358's instrument rule).
    fs.writeFileSync(path.join(tmp, 'pre.mts'),
      execFileSync('git', ['-C', REPO, 'show', `${PRE_CURE_REV}:scripts/lib/probe-outcome.mts`],
        { encoding: 'utf8', maxBuffer: 1 << 24 }));
    const out = execFileSync('npx',
      ['tsx', path.join(REPO, 'scripts', 'lib', 'round361-pin-grade.mts'), path.join(tmp, 'pre.mts')],
      { cwd: REPO, encoding: 'utf8', maxBuffer: 1 << 24 });
    graded.push(...JSON.parse(out.slice(out.indexOf('['), out.lastIndexOf(']') + 1)));
  } catch (e) {
    gradeNote = `grading drive failed: ${(e as Error).message.slice(0, 160)}`;
  } finally {
    if (tmp) fs.rmSync(tmp, { recursive: true, force: true });
  }

  // Set from what the drive SAID, not from what the cells were labelled. See the note on
  // `trustworthySoft` above: it was written `KN:` and the drive reddened it at Round 360.
  const CURE_CELLS = ['every-limb', 'inversion-limb-split', 'trustworthy-soft'];
  const KN_CELLS = ['distinct-outcomes', 'no-code-moved', 'green-stays-green', 'none-declared',
    'empty-declared', 'unreadable-everywhere'];
  const redAtPreCure = graded.filter((g) => g.preCure === 'RED').map((g) => g.cell);
  const greenAtPreCure = graded.filter((g) => g.preCure === 'GREEN').map((g) => g.cell);
  check('P', `the cure cells are RED at the pre-cure lib (${PRE_CURE_REV}) and the known negatives `
    + 'are GREEN at it — graded by driving, not asserted by a comment',
    gradeNote === ''
    && CURE_CELLS.every((c) => redAtPreCure.includes(c))
    && KN_CELLS.every((c) => greenAtPreCure.includes(c)),
    gradeNote || `RED at pre-cure: ${redAtPreCure.join(',') || 'none'} · GREEN at pre-cure: ${greenAtPreCure.join(',') || 'none'}`);

  // P · MEASUREMENT — live reachability. The CALLER SET is held in both directions by arm E
  // already (it reads the `INAPPLICABLE-CALLERS:` line in `probe-outcome.mts` and reddens either
  // way), which is why this cell does not re-pin it. The FILE COUNT is left a measurement
  // deliberately: it moves with every probe added anywhere under scripts/, so pinning it would
  // redden this arm on unrelated work — a false red in an instrument produces no work at all.
  const walk = (d: string): string[] => fs.readdirSync(d, { withFileTypes: true })
    .flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
  const sources = walk(path.join(REPO, 'scripts')).filter((f) => /\.(mts|mjs|ts|js)$/.test(f));
  const suppliers = sources.filter((f) => !f.endsWith('lib/probe-outcome.mts'))
    .filter((f) => {
      const src = fs.readFileSync(f, 'utf8');
      return /summarise(AndExit)?\s*\(/.test(src) && /(^|[\s,{(])inapplicable\s*:/m.test(src);
    })
    .map((f) => path.basename(f));
  check('P', `MEASUREMENT: ${suppliers.length} live caller(s) supply \`inapplicable\` across `
    + `${sources.length} source files under scripts/ — ${suppliers.join(', ')} — and all of them `
    + 'can reach a limb that is not the code-0 limb, so this was reachable live and not only in a '
    + 'fixture. Walked with readdirSync, not grep: grep emits no row for a NUL-carrying file.',
    true, 'the caller set itself is pinned in both directions by arm E, not here', 'measurement');
}

// ── Q · Round 362: the crash surface, and why 22 of its cells stay uncured ────
//
// Daedalus handed over ONE crash in Round 361: `summarise({skipped: [null]})` dies at `kindOf`
// with `Cannot read properties of null`. Rather than take the instance, Round 362 censused the
// mechanism — 11 hostile values × 15 field paths = 165 cells — and found **33 throwing cells
// across 5 paths**:
//
//     input itself   11      results      10      results[0]   2
//     skipped         8      skipped[0]    2
//
// and **zero** on `inapplicable`, `inapplicable[0]`, `regressionKind`, `results[0].kind`,
// `skipped[0].kind`, `skipped[0].label`, `probeName`, `results[0].arm/.check/.pass`. That split is
// the finding: the type-guard class is CURED on the fields Rounds 357, 358 and 359 reached, and
// uncured on the two fields with the most live callers. Daedalus's own Round 361 note — "Rounds
// 356, 357 and 359 each cured this same class for a different field without anybody looking one
// field further" — is true one more field over than he looked.
//
// The call on those 22 cells is a DECLARED MEASUREMENT and not a cure, for two driven reasons:
//
//   1. No live caller can reach them. Cell Q3, and it is the one that can stop being true.
//   2. The crash is in the SAFE direction. Driven as a subprocess: a throwing `summariseAndExit`
//      exits 1 with 0 bytes on stdout — no headline, no `REGRESSIONS:` block, never the word
//      "passed". The sweep reads exit 1 as a red. Round 355's class was the opposite: an exit 0
//      that CLAIMED a pass. Cell Q7 holds the half of that which is checkable in-process.
//
// Cell Q2 characterises the uncured crash — and a characterisation cell is the exact shape
// Daedalus's Round 361 finding warns about (a Round 247 test whose accurate comment named an
// uncured defect and kept it pinned in place for 114 rounds). So Q2 is written to be read ONLY
// beside Q3: it records that the crash is still there, Q3 records why that is affordable, and if
// Q3 ever reddens then Q2 is no longer a characterisation, it is a live defect.
{
  const HOSTILE: [string, unknown][] = [
    ['undefined', undefined], ['null', null], ['0', 0], ['123', 123],
    ["''", ''], ["'x'", 'x'], ['false', false], ['true', true],
    ['{}', {}], ['[]', []], ['NaN', NaN],
  ];
  const okRow = { arm: 'A', check: 'fine', pass: true, kind: 'regression' };
  const PATHS: Record<string, (v: unknown) => unknown> = {
    'input itself': (v) => v,
    probeName: (v) => ({ probeName: v, results: [okRow] }),
    results: (v) => ({ probeName: 'p', results: v }),
    'results[0]': (v) => ({ probeName: 'p', results: [v] }),
    'results[0].arm': (v) => ({ probeName: 'p', results: [{ ...okRow, arm: v }] }),
    'results[0].check': (v) => ({ probeName: 'p', results: [{ ...okRow, check: v }] }),
    'results[0].pass': (v) => ({ probeName: 'p', results: [{ ...okRow, pass: v }] }),
    'results[0].kind': (v) => ({ probeName: 'p', results: [{ ...okRow, kind: v }] }),
    skipped: (v) => ({ probeName: 'p', results: [okRow], skipped: v }),
    'skipped[0]': (v) => ({ probeName: 'p', results: [okRow], skipped: [v] }),
    'skipped[0].label': (v) => ({ probeName: 'p', results: [okRow], skipped: [{ label: v, kind: 'regression' }] }),
    'skipped[0].kind': (v) => ({ probeName: 'p', results: [okRow], skipped: [{ label: 'arm Z', kind: v }] }),
    inapplicable: (v) => ({ probeName: 'p', results: [okRow], inapplicable: v }),
    'inapplicable[0]': (v) => ({ probeName: 'p', results: [okRow], inapplicable: [v] }),
    regressionKind: (v) => ({ probeName: 'p', results: [okRow], regressionKind: v }),
  };
  const drive = (input: unknown): { code: number; headline: string } | { threw: true } => {
    try {
      const o = summarise(input as Parameters<typeof summarise>[0]);
      return { code: o.code, headline: o.headline };
    } catch { return { threw: true }; }
  };
  const throwersOf = (p: string) => HOSTILE.filter(([, v]) => 'threw' in drive(PATHS[p](v))).length;

  // Q1 — the three landed cures, pinned as an absence of throwers rather than as a code.
  const CURED = ['inapplicable', 'inapplicable[0]', 'regressionKind', 'results[0].kind',
    'skipped[0].kind', 'skipped[0].label', 'probeName', 'results[0].arm', 'results[0].check',
    'results[0].pass'];
  const curedThrowers = CURED.map((p) => [p, throwersOf(p)] as const).filter(([, n]) => n > 0);
  check('Q', `the fields Rounds 357/358/359 reached take all ${HOSTILE.length} hostile values `
    + `without throwing — ${CURED.length} paths, ${CURED.length * HOSTILE.length} cells, 0 throwers`,
    curedThrowers.length === 0,
    curedThrowers.length === 0 ? 'no path among the cured ones throws' : `THROWS: ${curedThrowers.map(([p, n]) => `${p}×${n}`).join(', ')}`);

  // Q2 — the uncured half, CHARACTERISED. Read only beside Q3; see the note above.
  const UNCURED: Record<string, number> = { 'input itself': 11, results: 10, 'results[0]': 2, skipped: 8, 'skipped[0]': 2 };
  const measured = Object.fromEntries(Object.keys(UNCURED).map((p) => [p, throwersOf(p)]));
  check('Q', 'CHARACTERISATION (not a blessing — see Q3): the uncured paths still throw, at the '
    + 'measured cell counts. If Q3 reddens, this cell stops being a characterisation and the '
    + 'crash is live',
    Object.entries(UNCURED).every(([p, n]) => measured[p] === n),
    `expected ${JSON.stringify(UNCURED)} measured ${JSON.stringify(measured)}`);

  // Q3 — THE CELL THAT COSTS. Live reachability of the `skipped` half, in both directions.
  const census = censusSkippedShapes(path.join(REPO, 'scripts'));
  const unsafeSites = census.sites.filter((s) => s.kind !== 'literal-array' && s.kind !== 'identifier');
  const unboundSites = census.sites.filter((s) => s.boundAs === 'unbound');
  const badDecls = census.decls.filter((d) => !d.arrayInit || d.reassignments > 0);
  const badPushes = census.pushes.filter((p) => p.kind !== 'literal');
  const undeclared = census.sites
    .filter((s) => s.boundAs === 'local')
    .filter((s) => !census.decls.some((d) => d.file === s.file && d.name === s.name));
  // Non-push mutators and index writes are checked too: `.push` is not the only way to put an
  // element in an array, and a census of one spelling is the Round 264 shape.
  const MUTATORS = ['unshift', 'splice', 'concat', 'fill', 'copyWithin'];
  const otherMutations: string[] = [];
  for (const key of new Set(census.sites.filter((s) => s.boundAs === 'local').map((s) => `${s.file}\u0000${s.name}`))) {
    const [file, name] = key.split('\u0000');
    // String bodies blanked, same as the census itself: this probe plants its counterfactual
    // callers as source strings inside its own file, and a scan that reads them as code reports
    // them as live callers. Found by this cell's own red.
    const src = stripSource(fs.readFileSync(path.join(REPO, 'scripts', file), 'utf8'), true);
    for (const mu of MUTATORS) {
      if (new RegExp(`\\b${name}\\.${mu}\\(`).test(src)) otherMutations.push(`${file} ${name}.${mu}`);
    }
    if (new RegExp(`(?<![\\w$.])${name}\\s*\\[[^\\]]*\\]\\s*=(?!=)`).test(src)) otherMutations.push(`${file} ${name}[i]=`);
  }
  const reachable = unsafeSites.length + unboundSites.length + badDecls.length + badPushes.length
    + undeclared.length + otherMutations.length;
  check('Q', `no live caller can supply a non-array \`skipped\` or a nullish element: `
    + `${census.sites.length} argument site(s) in `
    + `${new Set(census.sites.map((s) => s.file)).size} file(s) are all literal arrays or local `
    + `array-initialised never-reassigned variables, all ${census.pushes.length} element(s) arrive `
    + 'by a literal-shaped push, and there are no other mutators and no index writes',
    reachable === 0,
    reachable === 0
      ? `0 reachable: ${census.sites.filter((s) => s.kind === 'literal-array').length} literal arrays, `
        + `${census.sites.filter((s) => s.boundAs === 'local').length} locals, `
        + `${census.sites.filter((s) => s.boundAs === 'param').length} declared fixture param(s), `
        + `${census.decls.length} declaration(s) all array-initialised with 0 re-assignments`
      : `REACHABLE: ${[...unsafeSites.map((s) => `${s.file}:${s.line} ${s.kind}`), ...unboundSites.map((s) => `${s.file}:${s.line} unbound ${s.name}`), ...badDecls.map((d) => `${d.file}:${d.line} ${d.name}=${d.init} r${d.reassignments}`), ...badPushes.map((p) => `${p.file}:${p.line} push ${p.arg}`), ...undeclared.map((s) => `${s.file}:${s.line} no decl`), ...otherMutations].join(' | ')}`);

  // Q4 — and Q3 is NOT vacuous. The census is driven over a planted tree carrying each unsafe
  // shape, because "0 unsafe sites" over a corpus with no unsafe shape in it is 0 of 0. The tree
  // is written OUTSIDE the repo: a probe writing inside the tree while the sweep drives makes a
  // red indistinguishable from a real one (Round 358's instrument rule).
  let plantNote = '';
  let planted: ReturnType<typeof censusSkippedShapes> | null = null;
  let plantTmp = '';
  try {
    plantTmp = fs.mkdtempSync(path.join(os.tmpdir(), 'r362-plant-'));
    fs.writeFileSync(path.join(plantTmp, 'planted-conditional.mts'),
      "import { summariseAndExit } from './probe-outcome.mts';\n"
      + 'const cond = process.argv.length > 2;\n'
      + "summariseAndExit({ probeName: 'p', results: [], skipped: cond ? ['a'] : undefined });\n");
    fs.writeFileSync(path.join(plantTmp, 'planted-call.mts'),
      "import { summariseAndExit } from './probe-outcome.mts';\n"
      + 'const build = () => undefined;\n'
      + "summariseAndExit({ probeName: 'p', results: [], skipped: build() });\n");
    fs.writeFileSync(path.join(plantTmp, 'planted-reassign.mts'),
      "import { summariseAndExit } from './probe-outcome.mts';\n"
      + "let skipped: unknown = ['a'];\nskipped = undefined;\n"
      + "summariseAndExit({ probeName: 'p', results: [], skipped });\n");
    fs.writeFileSync(path.join(plantTmp, 'planted-push.mts'),
      "import { summariseAndExit } from './probe-outcome.mts';\n"
      + 'const skipped: unknown[] = [];\nconst maybe = process.env.X;\nskipped.push(maybe);\n'
      + "summariseAndExit({ probeName: 'p', results: [], skipped });\n");
    planted = censusSkippedShapes(plantTmp);
  } catch (e) {
    plantNote = `planting failed: ${(e as Error).message.slice(0, 120)}`;
  } finally {
    if (plantTmp) fs.rmSync(plantTmp, { recursive: true, force: true });
  }
  const plantedUnsafe = planted
    ? planted.sites.filter((s) => s.kind === 'conditional').length
      + planted.sites.filter((s) => s.kind === 'call').length
      + planted.decls.filter((d) => d.reassignments > 0).length
      + planted.pushes.filter((p) => p.kind !== 'literal').length
    : -1;
  check('Q', 'KNOWN POSITIVE: the same census over a planted tree carrying a conditional, a '
    + 'call-valued, a re-assigned and a non-literal-push caller reports all four — so Q3 is a '
    + 'reading of the live tree and not a detector that answers 0 everywhere',
    plantNote === '' && plantedUnsafe === 4,
    plantNote || `planted unsafe: ${plantedUnsafe} of 4 (conditional ${planted?.sites.filter((s) => s.kind === 'conditional').length}, call ${planted?.sites.filter((s) => s.kind === 'call').length}, reassign ${planted?.decls.filter((d) => d.reassignments > 0).length}, push ${planted?.pushes.filter((p) => p.kind !== 'literal').length})`);

  // Q5 — the shorthand known positive. My first version of this census keyed on `skipped\s*:` and
  // so saw NONE of the 27 ES6-shorthand sites, which are the commonest live shape. A known
  // positive caught it; reading could not have, because a missing case and a missing key are the
  // same `null`.
  const shorthandSeen = census.sites.filter((s) => s.boundAs === 'local' && s.rhs === '<shorthand>').length;
  check('Q', 'KNOWN POSITIVE: the site reader sees the ES6 shorthand `{ …, skipped }` form, which '
    + 'is the majority of live sites and which a `skipped\\s*:` key misses entirely',
    shorthandSeen >= 20, `${shorthandSeen} shorthand site(s) of ${census.sites.length}`);

  // Q6 — and it does not select a DECLARATION as an argument site, which is how the same census
  // first reported 72 sites in 43 files (34 of them `const skipped: string[] = []`).
  check('Q', 'KNOWN NEGATIVE: a `const skipped: …[] = []` declaration is not counted as an '
    + 'argument site, and no site is reported in a file that never calls summarise',
    census.sites.every((s) => {
      const src = stripSource(fs.readFileSync(path.join(REPO, 'scripts', s.file), 'utf8'), true);
      return /summarise(AndExit)?\s*\(/.test(src);
    }) && census.sites.length < 72,
    `${census.sites.length} argument sites (the declaration-blind key reported 72)`);

  // Q7 — the crash is loud. In-process half: `summarise` THROWS rather than returning an outcome,
  // so there is no object for `summariseAndExit` to print a headline from, and in particular no
  // limb can print "passed". The exit-code half (status 1, 0 bytes of stdout) is driven as a
  // subprocess in the research note, not here: this file must not spawn a summariser that exits.
  const crashers = [
    { what: 'skipped: [null]', input: { probeName: 'p', results: [okRow], skipped: [null] } },
    { what: "skipped: 'x'", input: { probeName: 'p', results: [okRow], skipped: 'x' } },
    { what: 'results: 0', input: { probeName: 'p', results: 0 } },
  ];
  const allThrow = crashers.every((c) => 'threw' in drive(c.input));
  const anyPassed = crashers.some((c) => {
    const r = drive(c.input);
    return 'headline' in r && /passed/.test(r.headline);
  });
  check('Q', 'the uncured crashes are in the SAFE direction: `summarise` throws rather than '
    + 'returning, so no channel prints a headline and none prints "passed" — the inverse of the '
    + 'Round 355 class, which is why leaving them uncured is a measurement and not a demotion',
    allThrow && !anyPassed,
    `${crashers.filter((c) => 'threw' in drive(c.input)).length} of ${crashers.length} throw · any "passed": ${anyPassed}`);

  // Q8 — the Round 361 §2.1 limb table, re-derived here so the two figures live in a cell rather
  // than in the comment above arm P. The hard-skip row was published `7 of 7` and is `6 of 6`.
  const HATCH = ['C1 — a declared inapplicable arm'];
  const LIMB_BASES: Record<string, Record<string, unknown>> = {
    L1: { results: [bad('A', 'broke')] },
    L2: { regressionKind: ['regression'], results: [ok('A', 'fine')] },
    L3: { regressionKind: 'regressoin', results: [ok('A', 'fine')] },
    L4: { regressionKind: 'check', results: [{ arm: 'A', check: 'untagged', pass: true }, ok('B', 'tagged')] },
    L5: { results: [{ arm: 'A', check: 'c', pass: true, kind: {} }] },
    L6: { results: [], skipped: [] },
    L7: { results: [ok('A', 'fine')], inapplicable: 'probe-x' },
    L8: { results: [ok('A', 'fine')] },
  };
  const limbOf = (o: { code: number; headline: string }): string => {
    if (o.code === 1) return 'L1';
    if (o.code === 0) return 'L8';
    const h = o.headline;
    if (/of type \w+, not a string/.test(h)) return 'L2';
    if (/one edit from/.test(h)) return 'L3';
    if (/that no row carries, while/.test(h)) return 'L4';
    if (/value\(s\) that are not strings/.test(h)) return 'L5';
    if (/declared its inapplicable arms as/.test(h)) return 'L7';
    if (/established/.test(h)) return 'L6';
    return '??';
  };
  const reach = (add: Record<string, unknown>, sees: (r: string[]) => boolean) => {
    let n = 0, c = 0;
    for (const [name, base] of Object.entries(LIMB_BASES)) {
      const o = summarise({ probeName: 'subject', ...base, ...add } as Parameters<typeof summarise>[0]);
      if (limbOf(o) !== name) continue;
      n += 1;
      if (sees(o.reasons)) c += 1;
    }
    return { reach: n, carried: c };
  };
  // A BARE-STRING skip: it takes `regressionKind` through `kindOf`, so it is HARD on every limb.
  // A `regression`-TAGGED skip is not — on L2/L3/L4 the configured kind is something else, so the
  // tag makes it SOFT and the hard channel is never supplied. My first drive of this made exactly
  // that substitution and reported 3 of 6.
  const hard = reach({ skipped: ['env missing'] }, (r) => r.includes('did not run: env missing'));
  const hatch = reach({ inapplicable: 'probe-x' }, (r) => r.some((x) => x.startsWith('inapplicable is ')));
  const na = reach({ inapplicable: HATCH }, (r) => r.some((x) => x.startsWith('not applicable: ')));
  const soft = reach({ skipped: [{ label: 'arm Z', kind: 'open-item' }] },
    (r) => r.some((x) => x.startsWith('not a hard check, did not run: ')));
  check('Q', 'the Round 361 limb table re-derives: hard skips 6 of 6 — NOT the published 7 of 7, '
    + 'because a hard skip cannot stay on the code-0 limb — unreadable hatch 7 of 7, declared '
    + 'inapplicable arms 7 of 7 after the cure, and soft skips 5 of 8 with the three '
    + 'vocabulary-complaint limbs gated out by design',
    hard.carried === 6 && hard.reach === 6
    && hatch.carried === 7 && hatch.reach === 7
    && na.carried === 7 && na.reach === 7
    && soft.carried === 5 && soft.reach === 8,
    `hard ${hard.carried}/${hard.reach} · hatch ${hatch.carried}/${hatch.reach} · `
    + `inapplicable ${na.carried}/${na.reach} · soft ${soft.carried}/${soft.reach}`);

  // Q9 — MEASUREMENT. Both figures move with unrelated work: the cell count moves if any round
  // adds a guard, and the site count moves if any probe anywhere starts or stops passing `skipped`.
  // Pinning either would redden this arm on work that has nothing to do with it, and a false red
  // in an instrument produces no work at all. The SHAPES are pinned above; the counts are not.
  const totalThrowers = Object.keys(PATHS).reduce((n, p) => n + throwersOf(p), 0);
  check('Q', `MEASUREMENT: ${totalThrowers} throwing cell(s) of `
    + `${Object.keys(PATHS).length * HOSTILE.length} driven across ${Object.keys(PATHS).length} `
    + `field paths, and ${census.sites.length} live \`skipped\` argument site(s) across `
    + `${census.sources} source files under scripts/. Walked with readdirSync, not grep: grep emits `
    + 'no row for a NUL-carrying file, so a grep-derived count fails SMALL — the direction that '
    + 'hides a caller.',
    true, 'the shapes are pinned by Q1-Q8; these two counts are declared, not held', 'measurement');
}

// ── Exit ──────────────────────────────────────────────────────────────────────

const PACKAGES_AFTER = execFileSync('git', ['-C', REPO, 'status', '--porcelain', 'packages'], { encoding: 'utf8' });
check('Z', 'packages/ untouched by this run', PACKAGES_AFTER === PACKAGES_BEFORE,
  PACKAGES_AFTER === PACKAGES_BEFORE ? 'identical git status before and after' : `before ${JSON.stringify(PACKAGES_BEFORE)} after ${JSON.stringify(PACKAGES_AFTER)}`);

console.log('\n─── summary ───');
for (const r of results) console.log(`  ${r.pass ? 'PASS' : r.kind === 'measurement' ? 'MEAS' : 'FAIL'} [${r.arm}] ${r.check}`);

// This control eats its own cooking.
summariseAndExit({ probeName: PROBE, results, skipped });
