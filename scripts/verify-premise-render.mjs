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
 */

import { readFileSync, existsSync } from 'fs';
import { readPremiseRenderHeld, countRenderedExcerpts } from './lib/premise-render.mjs';

let failures = 0;
let checks = 0;

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
  console.log('  SKIP  no .testdata/recall-probe-R94L*-Q.json on this worktree.');
  console.log('        The replay is the only check of the module against real renders;');
  console.log('        checks 3 and 4 still run, but a pass here is NOT a pass of the replay.');
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

console.log(`\n${failures === 0 ? 'PASS' : 'FAIL'} — ${checks - failures}/${checks} checks`);
process.exit(failures === 0 ? 0 : 1);
