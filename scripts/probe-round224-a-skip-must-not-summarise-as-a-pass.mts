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
import { execFileSync } from 'child_process';
import { summarise, summariseAndExit, type ProbeVerdict } from './lib/probe-outcome.mts';
import { readNumericConstant, readLeadingFactor } from './lib/probe-source-constants.mts';
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

// ── Exit ──────────────────────────────────────────────────────────────────────

const PACKAGES_AFTER = execFileSync('git', ['-C', REPO, 'status', '--porcelain', 'packages'], { encoding: 'utf8' });
check('Z', 'packages/ untouched by this run', PACKAGES_AFTER === PACKAGES_BEFORE,
  PACKAGES_AFTER === PACKAGES_BEFORE ? 'identical git status before and after' : `before ${JSON.stringify(PACKAGES_BEFORE)} after ${JSON.stringify(PACKAGES_AFTER)}`);

console.log('\n─── summary ───');
for (const r of results) console.log(`  ${r.pass ? 'PASS' : r.kind === 'measurement' ? 'MEAS' : 'FAIL'} [${r.arm}] ${r.check}`);

// This control eats its own cooking.
summariseAndExit({ probeName: PROBE, results, skipped });
