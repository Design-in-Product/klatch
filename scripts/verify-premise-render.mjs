/**
 * Certifies `lib/premise-render.mjs` — the module `probe-recall-tool.mjs` imports.
 *
 * Round 102, Theseus, 2026-08-27 (START fire). Same pattern and same reason as
 * `verify-empty-tail-detector.mjs` and `verify-recogniser-equivalence.mjs`: it imports the
 * module the probe imports, so what passes here is the code that runs there.
 *
 * ── Why this script exists at all ───────────────────────────────────────────
 *
 * `premiseRenderHeld` is the one field in the probe that **cannot be exercised by `--dry`**.
 * `--dry` returns before the live turn, so there are no tool calls to assert against and the
 * key is **absent** from a dry artifact — absent, not `null`; `null` is what a *live* run of an
 * arm with no declared premise writes, and the two are different statements. Every other new
 * instrument in this file has been gated by a before/after `--dry` comparison, and that gate —
 * which Round 102 also ran, 15 arms, and passed — proves only that the field is *inert*, never
 * that it is *correct*.
 *
 * The free way to prove correctness is a replay: run the predicate over the five stored Q runs
 * from Round 94, whose renders Round 98 §1 already read by hand, and check the module agrees
 * with the hand reading. Zero model calls, zero spend, real live artifacts.
 *
 * ── What it checks ──────────────────────────────────────────────────────────
 *
 * 1. **Replay against Q's five live runs.** Q declares `{ call: 'first', excerpts: 1 }`, and
 *    Round 98 §1 read call 1 as single-excerpt in all five (`addressesOffered: [1-38, 44-80]`,
 *    `excerptSeparators: 0`). So the module must return `held: true` 5/5. A `false` means
 *    either the module is wrong or Round 98's hand reading was — and either is worth knowing
 *    before arm R is paid for.
 * 2. **R's premise, replayed against Q's runs, must come back `false`.** This is the check
 *    that the call selector is load-bearing rather than decorative: R premises a *two-excerpt
 *    second* call, Q's second call is single-excerpt or a miss, so a module that ignored
 *    `call` or `excerpts` would report `held: true` here and be caught.
 * 3. **The undecidable paths**, on synthetic calls: a missing call, a Round 69 fabricated
 *    reconstruction, an error render, and a zero-match render. Each must return `held: null`
 *    with a stated `why` — except the zero-match case, which is decidably 0 excerpts and must
 *    return `held: false`, not `null`. That distinction is the one thing in the module a
 *    reader is most likely to get wrong.
 * 4. **No premise → `null`**, which is the 12-of-15 case.
 *
 * Run: `node scripts/verify-premise-render.mjs`   (no server, no DB, no API key)
 *
 * ── Exit codes (Round 103, Daedalus, 2026-08-27 MID) ────────────────────────
 *
 *   0  every assertion ran and passed
 *   1  an assertion failed
 *   2  **incomplete** — the replay corpus was absent, so checks 1+2 did not run
 *
 * The `2` is the whole point of the addition. The SKIP branch below already argued, in its own
 * comment, that "a verifier that reports success when its corpus is missing is worse than one
 * that fails — it is the *silent cap* this project's brief names by that name." It then printed
 * `PASS — 9/9 checks` and exited `0`. The caveat lived in console prose and did not travel with
 * the signal a caller reads, which is the exact failure Rounds 99-102 have now documented four
 * times in other artifacts. Measured on Daedalus's worktree, which holds R93-era `.testdata`
 * and no `R94L*-Q` runs: 9 assertions ran, 11 did not, and the process exited `0`.
 *
 * A caller testing `rc !== 0` now correctly declines to read an incomplete run as a pass; a
 * caller testing `rc === 1` for a real failure is unaffected.
 *
 * Exit `1` covers two shapes, and both print a summary line: `FAIL` when an assertion returned a
 * wrong value, `ABORTED` when the module *threw* and took the process down before the summary.
 * See the handler below for why the second needed saying out loud.
 */

import { readFileSync, existsSync } from 'fs';
import { readPremiseRenderHeld, countRenderedExcerpts } from './lib/premise-render.mjs';

let failures = 0;
let checks = 0;
// Assertions the corpus was absent for. Counted, not described, so the summary line can report a
// denominator that includes what did not run — `9/9` and `9/20` are different claims.
let notRun = 0;

// A module that *throws* — rather than returning a wrong value — kills this process before the
// summary prints. The exit code is still 1, so no caller reads a crash as a pass. But a bare crash
// emits **no verdict and no denominator at all**, which is Round 103's defect in its most complete
// form: there, the caveat lived in a different channel from the signal; here the signal is simply
// absent, and a reader scrolling to the bottom for a summary finds a stack trace and has to infer
// the run's meaning from its absence.
//
// Found by mutation, not by inspection: `verify-verifier-exit-codes.mjs`'s M4 deletes the
// `if (!premise) return null` guard, and check 4 — the only assertion on that guard — never gets
// to run, because the throw happens inside the argument expression before `check` is entered.
// The mutant dies, so exit 1 is honest; but the line that was *supposed* to catch it never spoke.
//
// The remainder is reported as unrun-and-uncounted rather than invented. This file's whole subject
// is denominators that quietly shrink, and "assertions I did not reach" is a number I genuinely do
// not have from inside the handler — so it is named as unknown instead of being guessed at.
process.on('uncaughtException', (err) => {
  // The throwing assertion is counted into both totals. Without this the summary reads
  // `18/18 assertions passed` directly beneath a `FAIL` line — arithmetically defensible (18 of
  // the 18 that were *evaluated* did pass) and misleading at a glance, which is the failure this
  // file exists to not commit. Counted, it reads `18/19`, and the 19th is the one that threw.
  checks += 1;
  failures += 1;
  console.log(`\n  FAIL  assertion ${checks} threw before it could be evaluated: ${err.message}`);
  console.log(`\nABORTED — ${checks - failures}/${checks} assertions passed; assertion ${checks}`
    + ' threw, and the assertions after it did not run — their count is not knowable from here.');
  process.exit(1);
});

function check(label, actual, expected) {
  checks += 1;
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a === e) {
    console.log(`  ok    ${label}`);
  } else {
    failures += 1;
    console.log(`  FAIL  ${label}\n          expected ${e}\n          actual   ${a}`);
  }
}

const Q_PREMISE = { call: 'first', excerpts: 1, note: 'Q' };
const R_PREMISE = { call: 'second', excerpts: 2, note: 'R' };

// ── 1 & 2: replay over the five stored Q runs ───────────────────────────────
console.log('\n1+2. Replay over Round 94\'s five live Q artifacts');

const Q_RUNS = [1, 2, 3, 4, 5].map((n) => `.testdata/recall-probe-R94L${n}-Q.json`);
const present = Q_RUNS.filter((p) => existsSync(p));

if (present.length === 0) {
  // Not a pass. `.testdata/` is routinely cleared between fires, and a verifier that reports
  // success when its corpus is missing is worse than one that fails — it is the "silent cap"
  // this project's brief names by that name.
  // Derived, not a literal `11`: two checks per run plus the one denominator assertion below.
  // A hardcoded count would go stale the first time a replay check is added — the citation-drift
  // family from Rounds 99-102, in a number instead of a line reference.
  notRun = 2 * Q_RUNS.length + 1;
  console.log('  SKIP  no .testdata/recall-probe-R94L*-Q.json on this worktree.');
  console.log('        The replay is the only check of the module against real renders;');
  console.log('        checks 3 and 4 still run, but a pass here is NOT a pass of the replay.');
  console.log(`        ${notRun} assertions not run → exit code 2 (incomplete), not 0.`);
} else if (present.length !== 5) {
  failures += 1;
  console.log(`  FAIL  expected 5 Q artifacts, found ${present.length}: ${present.join(', ')}`);
} else {
  // **Expected values are Round 98 §0's table, not this script's guess** — and the first
  // draft of this file guessed, asserted that R's premise fails in all five, and was corrected
  // by the module it was written to certify. Round 98's split is: call 2 returned the
  // two-excerpt `▸`-marked flush-terminal render in **L1, L2, L4, L5** and **0 matches in
  // L3**. So R's premise holds in four and fails in one.
  const R_HOLDS_ON = { 1: true, 2: true, 3: false, 4: true, 5: true };
  const rVerdicts = {};

  for (const p of present) {
    const n = Number(p.match(/R94L(\d)-Q/)[1]);
    const run = JSON.parse(readFileSync(p, 'utf8'))[0];
    const calls = run.toolCalls || [];
    const q = readPremiseRenderHeld(Q_PREMISE, calls);
    check(`L${n} — Q's premise (call 1, 1 excerpt) holds`,
      { held: q.held, observedExcerpts: q.observedExcerpts, evidenceClass: q.evidenceClass },
      { held: true, observedExcerpts: 1, evidenceClass: 'reconstructed' });

    // The call selector doing real work: R premises call **2**, and on the same runs where Q's
    // call-1 premise holds, R's call-2 premise splits 4/1. A module that ignored `call` or
    // `excerpts` would return a uniform answer here.
    const r = readPremiseRenderHeld(R_PREMISE, calls);
    rVerdicts[n] = r.held;
    check(`L${n} — R's premise (call 2, 2 excerpts) → ${R_HOLDS_ON[n]}`, r.held, R_HOLDS_ON[n]);
  }

  // ── The check this whole field was built for ──────────────────────────────
  //
  // Round 100 §4 found by hand, two rounds late, that R's registered null was computed against
  // Q's *unconditioned* 1/5 when R's own conditioning rule makes the denominator 0/4 — L3 is
  // the one run the condition excludes and the only one that expanded. Replayed through the
  // module, R's rule selects exactly {L1, L2, L4, L5} and drops L3, with no adjudication.
  //
  // If this assertion ever fails, either the module has drifted or Round 100's correction was
  // wrong; both are worth a stop.
  const kept = Object.keys(rVerdicts).filter((n) => rVerdicts[n] === true).map(Number).sort();
  const dropped = Object.keys(rVerdicts).filter((n) => rVerdicts[n] !== true).map(Number).sort();
  check("R's conditioning rule keeps {1,2,4,5} and voids {3} — Round 100 §4's 0/4 denominator, mechanically",
    { kept, dropped }, { kept: [1, 2, 4, 5], dropped: [3] });
}

// ── 3: the undecidable paths, on synthetic calls ────────────────────────────
console.log('\n3. Undecidable and zero-match paths');

const renderOf = (over) => ({ shownCount: 1, excerptSeparators: 0, isError: false, ...over });
const callOf = (over) => ({ reconstructionFabricated: false, rendered: renderOf(), ...over });

check('no second call at all → held null, why stated',
  (() => { const x = readPremiseRenderHeld(R_PREMISE, [callOf()]); return { held: x.held, why: x.why }; })(),
  { held: null, why: 'no second tool call was made' });

check('Round 69 fabricated reconstruction → held null',
  readPremiseRenderHeld(Q_PREMISE, [callOf({ reconstructionFabricated: true })]).held, null);

check('error render → held null',
  readPremiseRenderHeld(Q_PREMISE, [callOf({ rendered: renderOf({ isError: true }) })]).held, null);

check('missing rendered → held null',
  readPremiseRenderHeld(Q_PREMISE, [callOf({ rendered: undefined })]).held, null);

// The one a reader is most likely to get wrong: 0 matches and 1 excerpt both have zero
// separators, and they are not the same observation.
check('zero-match render → 0 excerpts, held FALSE (not null)',
  (() => {
    const x = readPremiseRenderHeld(Q_PREMISE, [callOf({ rendered: renderOf({ shownCount: 0 }) })]);
    return { held: x.held, observedExcerpts: x.observedExcerpts };
  })(),
  { held: false, observedExcerpts: 0 });

check('countRenderedExcerpts: 0 matches → 0', countRenderedExcerpts(renderOf({ shownCount: 0 })), 0);
check('countRenderedExcerpts: 1 separator → 2', countRenderedExcerpts(renderOf({ excerptSeparators: 1 })), 2);

// ── 4: no premise declared ──────────────────────────────────────────────────
console.log('\n4. Arms with no declared premise');
check('null premise → null record', readPremiseRenderHeld(null, [callOf()]), null);
check('undefined premise → null record', readPremiseRenderHeld(undefined, [callOf()]), null);

// Three verdicts, because there are three states and two words cannot carry them. `INCOMPLETE` is
// not a failure of the module — it is a failure of *this run* to have tested it.
const verdict = failures > 0 ? 'FAIL' : notRun > 0 ? 'INCOMPLETE' : 'PASS';
console.log(`\n${verdict} — ${checks - failures}/${checks + notRun} assertions passed` +
  (notRun > 0 ? `, ${notRun} NOT RUN (replay corpus absent — this is not a verification of the replay)` : ''));
process.exit(failures > 0 ? 1 : notRun > 0 ? 2 : 0);
