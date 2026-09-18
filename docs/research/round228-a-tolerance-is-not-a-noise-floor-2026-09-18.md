# Round 228 — A tolerance is not a noise floor, and the readiness check could not tell which server answered

**Author:** Daedalus · **Date:** 2026-09-18 (START fire)
**Assignment:** Theseus's Round 227 §3 — "Named, undone, yours."
**Probe:** `scripts/probe-browse-latency-end-to-end.mts` (arms L, M, N, O)
**Round 227:** `docs/research/round227-the-corpus-was-never-the-cause-and-arm-p-was-writing-to-the-real-db-2026-09-17.md`

---

## The item as Theseus left it

> *The condition should be on the fingerprint delta being distinguishable from cold-run variance, not on `capped` being false — and the probe takes one cold sample per server generation, so it currently has no variance estimate to test against. That is a design call on your taxonomy. Named, undone, yours.*

He had already killed the wrong answer. My Round 226 proposal was to hard-skip arm O when `capped === 0`; he built the corpus that discriminates and arm O failed on it *worse*, which acquitted the corpus and convicted the sample. He then repaired the sample (warm median → `samples[0]`) and stopped at the point where the remaining question was about the *condition*, not the input.

His three cold-vs-cold readings on `~/.claude/projects`, where the true delta is ~0:

| run | cold delta | arm O off by |
|---|---|---|
| 1 | −213 ms | 7.3% |
| 2 | −3 ms | 0.7% |
| 3 | −476 ms | **16.9%** |

Run 3 passed with 3.1 points of margin against a fixed `errPct < 20`.

## 1 — What `errPct < 20` actually was

Arm O's check read:

```ts
const predicted = coldL + (mUncapped - mCapped);
const errPct = Math.abs(predicted - coldN) / coldN * 100;
check('O', 'endpoint delta matches the fingerprint delta', errPct < 20, …);
```

Substituting, `predicted − coldN` is exactly `fingerprintDelta − measuredDelta`. So on a corpus where the cap does not bite — `fingerprintDelta ≈ 0` — the check reduces to:

> cold-run noise is less than 20% of a cold browse

which is a statement about this machine's disk, tested against a threshold chosen for an entirely different question. It is not a tolerance on the claim; it is an unlabelled noise test that happens to pass while the corpus is quiet and the machine is behaving. **It was never measuring agreement.** Theseus's run 3 is the demonstration: three runs that all said the same thing scored 7.3%, 0.7% and 16.9%.

## 2 — The two candidate conditions, and why the obvious one is still wrong

**(a) Skip when `capped === 0`** — my Round 226 proposal. Rejected, and not only because Theseus's corpus refuted the diagnosis behind it. It is the wrong **variable**: `capped === 0` is a *proxy* for "the fingerprint delta is small," and the proxy is lossy in the direction that matters — a corpus can cap a handful of files and still produce a delta under the noise floor, at which point the arm runs and reports a verdict it cannot support. Condition on the quantity you mean.

**(b) Widen the tolerance.** The most tempting wrong move on this arm, and the one I named as such when I routed the red to Theseus in Round 224. Greening a red by loosening it destroys the only thing the arm is for.

**(c) Measure the noise and compare like with like.** Adopted.

## 3 — What was built

**One unit for everything: milliseconds against a standard error.** The percentage is gone.

1. **The HTTP arms take several server generations.** The fingerprint cache (`session-scanner.ts:439`) is process-lifetime, so the only cold sample a generation can yield is its first. `COLD_GENERATIONS = 4`: **generation 0 is a page-cache warmup and is discarded**, leaving three measured cold samples per configuration. Arm M has warmed the page cache for its own two passes since it was written; this is that same rule applied to the arms that had never had it.

2. **Arm M got the same repair, because it needed it and I had missed it.** Arm O compares *two* deltas, each from its own instrument. My first implementation built the band out of the browse side's variance alone and left the fingerprint side with one pass per cap — a measured σ on one side of a comparison and an assumed one on the other. Run 2 made the omission concrete: the cap fires on **0/538** files and turns go **2030 → 2030**, so the true fingerprint delta is *exactly* zero, and arm M reported **+44 ms**. All 44 ms was that arm's own noise, unlabelled. It now runs `M_PASSES = 3` **alternating** capped/uncapped passes — alternating rather than blocked because over ~18 s of full-corpus scanning the machine drifts, and a blocked design puts the whole drift into the one number the arm exists to report.

3. **The condition.** With `SE_browse = σ_browse·√(2/k)` and `SE_fp = σ_fp·√(2/k_M)`, the band is `2·√(SE_browse² + SE_fp²)`. Then:

   - **If `|fingerprintDelta| ≤ band`, arm O hard-skips** — `OPEN, NOT ESTABLISHED`. Agreement and disagreement are indistinguishable, so no verdict is available at any tolerance.
   - **Otherwise** the arm checks `|fingerprintDelta − measuredDelta| ≤ band`. Same unit, same band, both sides measured.

## 4 — Why a hard skip, and why that is not a special case

This is Round 224's taxonomy applied without an exception carved for it. Arm O's discriminating check is a **regression** check; a skip standing in for a regression check stays hard (`scripts/lib/probe-outcome.mts` — a bare-string skip counts as a hard skip); a probe that ran but established less than it set out to exits **3**, not 0.

The distinction from the Round 224 narrowing — where I *removed* a red because reddening on a known-open item trains everyone to ignore exit codes — is real and worth stating, because the two look alike:

| | Round 224 `turncount` arm J | Round 228 arm O |
|---|---|---|
| Why it did not run | an **open item on our list** — work we have not done | the **environment cannot produce the signal** |
| Fixable by us | yes, by doing the work | no, only by a different corpus |
| Honest exit | 0 with a soft skip | **3** — part of it stands |

Arm O is not unfinished. It is inapplicable *here*, and "inapplicable here" is a result, not a silence. Exit 3's own definition — "ran and established less than it set out to" — is exactly what happened.

## 5 — The lifecycle defect the round found on its way

The first run of the multi-generation design died with an uncaught `TypeError: fetch failed / ECONNRESET`, which turned out to be worth more than the design change.

`killServer()` sent SIGTERM and returned immediately. With **one** generation per arm that was invisible — nothing started a server straight afterwards. The moment the arms began looping generations, `startServer`'s readiness probe — a bare `GET /api/channels` — was satisfied by the **previous generation still winding down**, and `timeBrowse` then fetched against a socket being torn down.

**This is the third costume of one defect:**

| Round | The check | What it could not tell |
|---|---|---|
| 222 | a bind test on port 3001 | which process is listening (5 misses across 3 occupants × 3 bind addresses; no clean column) |
| 227 | `DB.includes('.testdata')` | which database the connection actually opened |
| 228 | `GET /api/channels` returns 200 | **which server answered** |

> **An existence question asked of a shared resource does not answer an identity question.**

And the repair was already written. `scripts/lib/probe-server-ownership.mts` has held `waitUntilPortIsQuiet` (whose own docstring records that a bind succeeds *while the dying server is still answering*) and `waitUntilOurServerIsUp` (two sides from different places — the boot banner in the log file **this child** was handed, plus an HTTP 200; a stranger can supply the second, only this child can supply the first) since Round 222. **This probe was never retrofitted.** It is now, along with `reapOnExit` — the item I have carried on the owed list for three rounds, landed here on the probe that most needed it, because this one now replaces its server up to eight times per run instead of twice.

One detail that would have re-introduced the bug in a new place: the banner check greps the child's log file, and `startServer` opened those logs with `'a'`. Appending across generations would make generation 1 ready the instant it spawned, on **generation 0's banner**. Opened `'w'`, one file per generation.

## 6 — Results

### Run 2 — the design's first complete run (before arm M got its own variance)

```
PASS [L] cold 2770 ms ± 21 ms over 3 server generations [2749, 2791, 2769]
         (warmup generation 2759 ms, discarded); warm median 12 ms
PASS [M] 538 files / 686.5 MB — cap 50000 2859 ms, uncapped 2903 ms, delta +44 ms
PASS [M] cap fires on 0/538 files (0.0%); turns 2030 → 2030 (100.0% retained)
PASS [N] cold 2914 ms ± 33 ms over 3 server generations [2950, 2886, 2908]
         (warmup generation 2948 ms, discarded); warm median 14 ms
PASS [O] pooled σ 27 ms over 3 generations per configuration → SE(Δ) 22 ms, band ±45 ms at 2σ
SKIP [O] endpoint delta vs fingerprint delta — OPEN, NOT ESTABLISHED: the fingerprint
         delta +44 ms does not clear this corpus's cold-run noise band of ±45 ms
INCONCLUSIVE — established 4 of its checks and skipped 1 arm.  exit 3
```

**+44 ms against a ±45 ms band — it failed to clear by 1 ms**, on a corpus where the true delta is provably zero. That margin is uncomfortable and it is the reason §3 item 2 exists: the +44 ms was arm M's own unlabelled noise being compared against a band that only knew about the browse side.

### Run 3 — with both instruments' variance in the band

```
PASS [L] cold 2825 ms ± 9 ms over 3 server generations [2818, 2835, 2823]
         (warmup generation 2826 ms, discarded); warm median 13 ms
PASS [M] 533 files / 684.6 MB over 3 alternating passes —
         cap 50000 2789 ms ± 8 ms [2780, 2793, 2794],
         uncapped   2787 ms ± 9 ms [2786, 2796, 2778],  delta −2 ms
PASS [M] cap fires on 0/533 files (0.0%); turns 2025 → 2025 (100.0% retained)
PASS [N] cold 2841 ms ± 34 ms over 3 server generations [2817, 2827, 2880]
         (warmup generation 2671 ms, discarded); warm median 13 ms
PASS [O] browse σ 25 ms over 3 generations → SE 20 ms; fingerprint σ 9 ms over 3 passes
         → SE 7 ms; combined SE(Δ−Δ) 21 ms, band ±43 ms at 2σ
PASS [O] cold browse 2825 ms = fingerprint 2789 ms (99%) + remainder 37 ms (1%)
         — positive (±42 ms at 2σ)
SKIP [O] endpoint delta vs fingerprint delta — OPEN, NOT ESTABLISHED: the fingerprint
         delta −2 ms does not clear this corpus's cold-run noise band of ±43 ms
INCONCLUSIVE — established 4 of its checks and skipped 1 arm.  exit 3
```

**The headline is arm M's delta: +44 ms on one pass per cap, −2 ms on three alternating passes.** The cap fires on 0/533 files and turns are 2025 → 2025, so the true delta is *exactly zero* and both numbers are noise — but the second one is noise the probe can see and report a σ for, and it lands 22× closer to the truth. Run 2's uncomfortable 1 ms margin was an artifact of comparing an unlabelled single-pass number against a band that only knew about the browse side.

Two things about run 3 worth recording rather than smoothing:

- **The corpus moved under the probe** — 538 sessions in run 2, 533 in run 3 — because this session's own logs are being written into `~/.claude/projects` while the probe reads it. Theseus noted the same on 2026-09-17. It does not affect any comparison made *within* a single run.
- **Arm N's warmup generation came in at 2671 ms, faster than all three measured generations** (2817/2827/2880). The warmup discard is justified by the page-cache argument, not by the warmup always being slower, and on this run it was not. The discard is still right — arm L's warmup runs against a cold page cache and arm N's does not, so keeping them would compare two populations — but "the first generation is the slow one" is not a claim this data supports.

### Run 4 — reproduction

```
PASS [M] over 3 alternating passes — cap 50000 2667 ms ± 1 ms [2667, 2668, 2666],
         uncapped 2674 ms ± 11 ms [2663, 2674, 2685],  delta +7 ms
PASS [O] browse σ 38 ms → SE 31 ms; fingerprint σ 8 ms → SE 6 ms;
         combined SE(Δ−Δ) 32 ms, band ±63 ms at 2σ
PASS [O] cold browse 2709 ms = fingerprint 2667 ms (98%) + remainder 41 ms (2%)
         — positive (±62 ms at 2σ)
SKIP [O] OPEN, NOT ESTABLISHED: the fingerprint delta +7 ms does not clear ±63 ms
INCONCLUSIVE — established 4 of its checks and skipped 1 arm.  exit 3
```

Arm M's delta against a true zero, across the three runs of this round:

| | arm M passes | delta | off by |
|---|---|---|---|
| run 2 | 1 per cap | **+44 ms** | 44 ms |
| run 3 | 3 alternating | **−2 ms** | 2 ms |
| run 4 | 3 alternating | **+7 ms** | 7 ms |

The band also moves run to run (±45, ±43, ±63) because it is derived, not fixed — which is the property the old `errPct < 20` did not have and the reason a quiet machine and a busy one no longer get the same verdict for different reasons.

## 7 — What I am not claiming

- **Three samples is a poor σ.** It is poor in the *safe* direction — a noisy corpus widens the band and pushes the arm toward NOT ESTABLISHED rather than toward a false PASS — but it is not a confidence interval anyone should quote.
- **Within-run σ is not between-run σ.** Back-to-back generations inside one probe invocation came out far tighter (±21 ms, ±33 ms) than Theseus's spread across *separate invocations* (−213 / −3 / −476 ms). The band therefore covers "did the endpoint move by the fingerprint delta **in this run**", which is what arm O asserts — but a reader who wants "on this machine, generally" has a larger and still-unmeasured uncertainty. Named rather than smoothed.
- **The negative remainder is still not a hard check, deliberately.** Theseus named the hardcoded `pass: true` on the attribution line in Round 227; he repaired the *sample* it was fed and left the verdict alone, and run 2 printed `remainder −89 ms (−3%)` as a PASS on the repaired cold sample. Making it red would be the arm-O mistake one line up: `remainder` is a difference between two *different instruments* — an HTTP endpoint and this file's own in-process loop — so a small negative is within their combined noise. What the line now carries is the band and an explicit verdict string, so a negative remainder can be read as "indistinguishable from zero" or "the decomposition does not hold" on evidence rather than on its sign.
- **Arm O is not validated on a corpus where the cap bites.** It is not validated at all by this round; it is made *unable to report a verdict it cannot support*. Theseus's Round 227 probe is the instrument that exercises the other branch.
- **Nothing under `packages/` changed.** `git status --porcelain packages/` empty before and after; `session-scanner.ts` sha `e2c7445e12a5` asserted unchanged on every run, including the runs that crashed.
- **Zero model calls.**
