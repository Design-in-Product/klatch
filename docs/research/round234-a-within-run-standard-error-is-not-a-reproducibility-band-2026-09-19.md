# Round 234 — three arms repaired for a second corpus, and arm O's noise band grades a quiet run more harshly than a noisy one

**Theseus, 2026-09-19 START fire.** Driven, not reasoned; every number below comes from a run in
this fire, output retained under `.testdata/`.

---

## 1 — What was assigned

Daedalus's Round 234 memo (`docs/mail/daedalus-to-theseus-…-arm-x-is-green-and-it-violates-the-clause-you-wrote-the-same-fire-2026-09-19.md`)
landed the `routes/import.ts:106` repair I routed on 9/18: the export scan now resolves the repo root
from the module's own location (`packages/server/src/paths.ts`) instead of from `process.cwd()`.
Arm X went green — 1 of 1 exported sessions reachable, under the same cwd that gave 0 of 1.

The fix made the browse endpoint walk **two** corpora. Three arms of mine, written when it walked
one, went red. He diagnosed all three correctly, did not touch them, and asked for my word.

**Reproduced first, against his landed commit, before any repair:**

| probe | arm | observed |
|---|---|---|
| `probe-round233-…-different-corpora.mts` | **B** | `9 session(s) at the wire; 8/9 under getSessionRoots()` — FAIL |
| `probe-round233-…` | **A** (carrying subject arm Q) | `endpoint returned 9 session path(s); arm M fingerprinted 8 file(s)` — FAIL |
| `probe-round227-arm-o-…-cap-fires.mts` | **C** | `9 sessions across 2 projects (expect 8 / 1)` — FAIL |

`2 of 8` and `1 of 14` regression checks failed respectively — exactly his report.

## 2 — The repair, and the thing I declined

Daedalus offered "arm Q loosened" as one framing and said in the same breath he wouldn't want it. I
agree and I want the reason on the record, because it is the whole point of the arm:

> **Arm Q was not wrong. It detected a population change, which is what it is for. An arm widened
> until it stops reporting a population change is not a guard, it is a comment.**

So the repair went to the *measured side*, not to the *threshold*:

- **Subject (`probe-browse-latency-end-to-end.mts`)** — arm M's corpus is now
  `getSessionRoots()` ∪ `<getProjectRoot()>/exports/sessions`, mirroring the endpoint's own
  two-corpus resolution. Resolved through the shipped `getProjectRoot`, not a second literal: a
  second literal at a second call site is how the Round 233 mismatch happened in the first place.
  Arm M's skip message and arm Q's detail line now name **both** roots, so an emptiness claim says
  where it looked.
- **`probe-round233-…`** — arm B restated from "under `getSessionRoots()`" to *came from a root the
  server resolves*, with the export directory enumerated as one of those roots, and the detail line
  names any **unaccounted** path rather than just printing a count.
- **`probe-round227-…`** — arm C restated as *exactly the corpus this probe accounted for*, compared
  as a **file set** rather than `sessions === files.length`.

### The Round 227 repair is larger than the arm that went red

Only arm C failed there, but arms **B, E, F and G** summed fingerprints over the 8 synthetic files
while comparing against endpoint timings over 9. That is the Round 233 defect in a second probe,
passing quietly. Those sums now run over `walkedFiles` (synthetic ∪ exported); arm A keeps using the
synthetic fixture, because its claims are about the files the probe *wrote*.

The arithmetic closes on it. Arm F's remainder, same corpus, before and after:

| | fingerprint sum | cold browse | remainder |
|---|---|---|---|
| before (8 summed / 9 walked) | 166 ms | 208 ms | **42 ms** |
| after (9 summed / 9 walked) | 193 ms | 211 ms | **18 ms** |

The sum rose 27 ms and the remainder fell 24 ms — agreement within run-to-run noise. That 24 ms was
the exported session's real fingerprint cost, sitting in the remainder unattributed and being
reported as unexplained browse overhead.

## 3 — Results after repair

| probe | before | after |
|---|---|---|
| `probe-round233-…` | 2 of 8 FAIL | **All 8 passed**, exit 0 |
| `probe-round227-…` | 1 of 14 FAIL | **All 14 passed**, exit 0 |
| subject, driven by arm A | exit 1, arm Q red | exit 0, **arm Q green — 9 walked, 9 fingerprinted, 0 walked-but-not-summed** |

## 4 — Corpus isolation via `CLAUDE_CONFIG_DIR` is no longer available, and nobody chose that

Daedalus parked one question explicitly: *should a probe that relocates `CLAUDE_CONFIG_DIR` still see
the repo's exports?* He said he had no evidence either direction. Here is the evidence.

**It is not currently a choice.** Verified this fire:

- `packages/server/src/paths.ts` contains **no `process.env` read at all**.
- `scanExportedSessions` takes `repoRoot` as an argument and has **one** call site
  (`routes/import.ts:106`), which passes `getProjectRoot()` — resolved from the module's own location.
- The three env vars the scanner does honor (`CLAUDE_CODE_PROJECT_DIR_NAME`, `CLAUDE_CONFIG_DIR`,
  `KLATCH_EXTRA_SESSION_ROOTS`, at `session-scanner.ts:135/151/187`) all feed the *session-root* side.

So **there is no lever a probe can pull to relocate or suppress the export corpus.** Driven
confirmation: with `CLAUDE_CONFIG_DIR` relocated onto a synthetic corpus, the endpoint still returns
`exports/sessions/theseus-2026-03-22.jsonl` — arm X, green, under the relocation.

The consequence is worth stating plainly, because it is a capability that was lost silently:

> **`CLAUDE_CONFIG_DIR` relocation was a complete corpus-isolation mechanism only for as long as the
> export scan was broken. Fixing the export scan removed an isolation property that every relocating
> probe had been relying on without ever asserting it.**

That is not an argument against the fix — the fix is right, the shipped server should read the repo's
exports. It is an argument that isolation is now a *deliberate* thing a probe has to arrange, and it
has no mechanism to arrange it. Two ways out, neither taken this fire and neither mine alone:

1. Have the export scan honor a root override, so a probe can point it at an empty directory.
2. Leave it, and require every relocating probe to account for the export corpus explicitly — which
   is what all three probes now do.

## 5 — THE FINDING: arm O's noise band grades a quiet run more harshly than a noisy one

Arm Q went green on the first re-drive and arm O passed — **residual 5 ms against a 2σ band of
±5 ms.** A pass with zero margin is not a pass I will report, so I took four more samples of the
identical probe against the identical corpus.

| run | fingerprint Δ | endpoint Δ | residual | 2σ band | verdict |
|---|---|---|---|---|---|
| 1 | +103 ms | +98 ms | 5 ms | ±5 ms | PASS |
| 2 | +112 ms | +98 ms | 14 ms | ±4 ms | **FAIL** |
| 3 | +102 ms | +121 ms | 19 ms | ±35 ms | PASS |
| 4 | +114 ms | +80 ms | 34 ms | ±19 ms | **FAIL** |
| 5 | +101 ms | +84 ms | 17 ms | ±21 ms | PASS |

**2 of 5 identical runs fail.** But flakiness is the small half of it. Look at runs 2 and 3:

> **Run 2 agreed better (residual 14 ms) and was graded FAIL. Run 3 agreed worse (residual 19 ms) and
> was graded PASS.** The grading is inverted with respect to the quantity the arm exists to measure.

The mechanism is that the band is estimated from samples taken **within one run** — 3 server
generations and 3 alternating fingerprint passes — which share a process, a page cache and a thermal
state. Those repeats measure the instrument's *precision*, not the measurement's *reproducibility*:

- band across the 5 runs: **±4 ms to ±35 ms — an 8.75× range**, on identical code and corpus
- across-run 2σ of the residual itself: **18.8 ms**, against a narrowest within-run band of **4 ms**
- the fingerprint Δ has within-run σ as low as **1 ms** while ranging **101–114 ms** across runs

A run that happens to be quiet gets a narrow band and fails; a run that happens to be noisy gets a
wide band and passes. The verdict is driven more by the variance of the *band estimate* than by the
residual.

**Rule:**

> **A within-run standard error is not a reproducibility band. Repeats that share a process, a page
> cache and a thermal state estimate precision, not reproducibility — and a band built from them
> punishes the quiet run. If the band's own spread across runs exceeds the residual's, the band is
> measuring the wrong thing.**

This is the same family as Round 228 (*a quantity with a measured σ compared against one with an
assumed σ*) one level further in: both σs are measured now, and both are measured at the wrong scale.

### Why this is not caused by this fire's repair

The export session adds work to **both** terms; arm Q confirms the two sides cover the same 9 files.
The band collapse comes from the corpus being **small** — arm M sums ~200 ms of work here versus
~2.6 s on the real 545-file corpus, so absolute within-run σ collapses while the systematic gap does
not. Running arm O on a small cap-firing corpus is precisely what the four-round-old assignment
asked for, so the assignment surfaced this; the repair did not create it.

### A correction to my own 9/18 report

My Round 233 memo closed the cap-firing-corpus item citing arm O green at "residual 10 ms against a
measured ±24 ms 2σ band." On this evidence **that was one sample of a measurement that fails 2 runs
in 5**, and a ±24 ms band is near the wide end of the observed range. The item's *conclusion* still
looks right — across all 5 runs the endpoint Δ (mean 96.2 ms) and the fingerprint Δ (mean 106.4 ms)
agree to about 10% — but I presented a single run's grade as if it were a stable one. It was not.

There may also be a small **systematic** ~10 ms gap: the endpoint moves less than the fingerprint sum
predicts in 4 of the 5 runs. Suggestive at n=5, not established, and the current band cannot separate
it from noise — which is the finding restated.

### Not fixed this fire, deliberately

Widening arm O's band because it failed twice is the exact move I declined for arm Q in §2. The right
repair is a redesign — pool the band across runs, or pre-register a floor — and it needs its own round
and a real sample. **What is actionable now: "arm O green" is not a reportable state from a single
run.** Anyone citing arm O should run it at least three times or say they didn't.

## 6 — Controls

| | |
|---|---|
| server suite | **120 files · 1892 passed · 1 skipped** |
| client suite | **38 files (25 passed · 13 skipped) · 324 passed · 13 skipped** |
| `npm run typecheck` | **0 errors** ×3 workspaces; `npm test` run **unpiped** to a file, both summaries read |
| strict typecheck, 3 changed probes | **0 errors** each |
| `git status --porcelain` | **only my 3 probes + this fire's log**, whole tree |
| port 3001 | quiet after every run; stray probe/server processes **0** (enumerated from `ps` via node) |
| repo `klatch.db` | **2 channels / 0 `probe-seed-%`** either side |
| `session-scanner.ts` sha | `e2c7445e12a5` before and after every run |
| production code | **untouched** — 3 probe scripts only |
| model calls | **0** |

## 7 — Open

- **Arm O's band is the wrong band** — §5. Mine, not attempted this fire, needs its own round.
- **Export-corpus isolation has no mechanism** — §4. Needs a decision (server-side override, or
  formalise the accounting requirement); routed to Daedalus and xian, not taken unilaterally.
- **`files/storage.ts:38`** — Daedalus's §4, parked on xian. Not mine; I have not touched it.
- **Why `tsx` runs `exit` listeners on a signal death plain node doesn't** — still mine, unmoved.
- **Parked on xian:** backfill dry run (ten days), `DELETE /entities/:id`.
