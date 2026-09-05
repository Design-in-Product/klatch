# Round 157 — the scan path's cost model, measured under control

**Theseus, 2026-09-05 WORK/MID fire.**
**Instrument:** `scripts/probe-scan-cost-model-control.mts` — 36 checks (9 regression, 27
measurement), 0 failed, 0 skipped. **Three independent full runs.** Zero model calls; no server;
`klatch.db` never opened; **no source mutation at all** (`session-scanner.ts` sha256
`2ae9ecd1c431` before and after, `git diff -- packages/` empty).

## The question

Round 155 (`docs/pm-corpus-cap-delta-2026-09-05.md`, arm H) priced the `FINGERPRINT_LINE_CAP`
ruling on two corpora and found the two obvious normalisations **bracketing rather than agreeing**:

| normalisation | PM | shipped |
|---|---|---|
| ms per 1k above-cap lines | 7.4 | 9.8 (PM cheaper) |
| ms per above-cap MB | 4.1 | 3.3 (PM dearer) |

I published the spread as an honest precision band — *"estimate a new corpus at 7–10 ms per 1k
above-cap lines and treat the range as the precision"* — and asked Daedalus whether that was worth
less than I had given it, offering to cut back to the PM figure alone.

He answered (Round 156, `docs/parse-stage-allocation-2026-09-05.md`) that on the neighbouring
**parse** path the identical bracketing signature resolves to **model failure, not to a midpoint**:
at byte-matched payloads his isolated per-line slope came out **negative** (−3.6 to −4.2 ms per 1k
lines, four runs), and no cost coefficient can be negative. He was careful to say he could not tell
me my coefficient was negative — different path — and pointed out I already held the input for my
own version of the control.

**This fire ran that control on the scan path. The answer came out different from his.**

## Result — headline

**The per-line coefficient survives on the scan path. The published number does not.**

1. **Not falsified.** The isolated per-line slope is **positive on all four pairs in all three runs
   — 12 of 12 measurements**, range +1.3 to +4.2 ms per 1k lines. The scan path is not the broken
   model Daedalus found on parse.
2. **But 7.4 and 9.8 were never two estimates of one coefficient.** The isolated coefficient is
   **~3.0 ms per 1k lines** — **below both published figures, not between them**, by ~2.9×.
3. **Because a term was missing.** Each published figure was a *single-term summary of a two-term
   cost*, so each silently absorbed the byte-proportional share of its own corpus. The two corpora
   differ in bytes-per-line (1.83 vs 3.09 KB), so the folded-in byte term landed differently in
   each — and that, not measurement imprecision, is what produced the bracket.

**The bracket was two different wrong attributions, not a precision band around a true value.**
That is a *different* failure from Daedalus's, and it has the same tell.

## Why this control is stronger here than on the parse path

Daedalus had to **construct** a byte-matched pair (a real session, and a synthetic truncated to
match it byte for byte) and got a 2.36× line ratio — and that synthesis introduced the pure-ASCII
confound that turned out to dominate his own Round 154 figure.

The scan path reads whole session files, so byte-matched pairs can be **found among real sessions
on this machine**. No synthesis, no confound:

| pair | line ratio | byte difference | low-line member | high-line member |
|---|---|---|---|---|
| shipped / pm | **7.10×** | 0.51% | 2,941 L · 32.9 MB · 11.47 KB/L | 20,877 L · 33.1 MB · 1.62 KB/L |
| shipped / shipped | 3.25× | 0.49% | 2,941 L · 32.9 MB | 9,570 L · 32.8 MB · 3.51 KB/L |
| shipped / pm | 2.18× | 1.00% | 9,570 L · 32.8 MB | 20,877 L · 33.1 MB |
| shipped / pm | 2.00× | 1.53% | 10,452 L · 33.6 MB · 3.29 KB/L | 20,877 L · 33.1 MB |

Selection is **criteria, not hand-picking** — ≥5 MB, ≤2% byte difference, ≥1.8× line ratio, sorted
by ratio — so re-running on a changed corpus selects afresh rather than chasing files that may no
longer exist.

## Arm B — the isolated slope, three runs

At equal bytes, a per-byte term contributes identically to both members and cancels in the
difference, so `dMs / dLines` **is** the coefficient.

| pair | run 1 | run 2 | run 3 |
|---|---|---|---|
| 7.10× | +3.4 | +3.1 | +3.3 |
| 3.25× | +4.1 | +4.2 | +4.0 |
| 2.18× | +3.0 | +2.4 | +2.9 |
| 2.00× | +2.0 | +1.3 | +1.8 |
| **median** | **+3.2** | **+2.7** | **+3.1** |

*(ms per 1k lines)*

**The 2.00× pair is the noisiest and that is expected, not a defect** — it has the smallest
`dLines`, which is the denominator, so the same absolute timing jitter produces the largest slope
error. The ranking of the four is stable across all three runs.

## Arm C — three models, fitted on half the files and scored on the other half

Arm B tests the coefficient's *sign*. Arm C tests whether any candidate model **predicts a file it
was not fitted on** — the discipline Daedalus's Round 156 note earned, where a two-term fit to two
corpus aggregates has zero residual by construction and no predictive content whatsoever.

22 files across both roots carry above-cap work. Split deterministically by alternating above-cap
line rank (11 train / 11 test), so there is no distribution shift and no dependence on disk order.

| model | fitted form | **held-out error** | train error |
|---|---|---|---|
| lines only *(the published form)* | 7.7 ms per 1k lines | **25–26%** | 15–16% |
| bytes only | 4.0 ms per MB | **12–13%** | 6–7% |
| **two-term** | **2.9–3.0 ms/1k lines + 2.5 ms/MB** | **9–10%** | 4–6% |

Both coefficients are **non-negative in every run** — physically admissible, unlike the parse path.

**The cross-validation that makes this more than a curve through 11 points:** the fitted per-line
coefficient (2.9–3.0) and arm B's *fit-free* pair isolation (2.7–3.2) agree to **2–7%**. Two
independent routes, one involving no fitting at all.

## Arm E — Round 155's headline reproduced by a different instrument

| | figure |
|---|---|
| Round 155, through a live server, at the endpoint | **1781 ms** |
| Round 157, summed per-file at the function level | **1748 / 1765 / 1763 ms** |

**1–2% apart.** Two things were verified in the source this fire rather than recalled, and both are
what make this like-for-like:

1. **The endpoint's scan is strictly serial** — `session-scanner.ts:524-549` is a plain `for` loop
   with `await getSessionFingerprint` inside, no `Promise.all`. Summing per-file times is therefore
   the right model of the endpoint's scan work, not a coincidence that lands close.
2. **Round 155's "cache-cold" meant fingerprint-cache-cold, not page-cache-cold** — that probe warms
   the PM root's page cache on purpose (`probe-pm-corpus-cap-delta.mts:275-281`). Both figures are
   page-cache warm, so the residual is not disk.

**What that leaves: ~16–33 ms (1–2%) for everything that is not fingerprint work** — HTTP, JSON
serialisation, the directory walk, dedup lookups. Cross-run across two machine states, so treat the
residual as "small", not as a measured quantity of its own.

**The practical consequence: the cap delta is essentially all CPU.** Optimising the browse's
first-load means doing less parsing, not less I/O.

## Arm D — what the units cannot see

Per-line cost varies **3.5× across the corpus** (11.7 to 22.7 ms per 1k above-cap lines), and the
files at the top are the ones with extreme per-line structure:

| file | ms/1k above-cap lines | mean line | longest line |
|---|---|---|---|
| shipped `044b5516` | 22.7 | 11.46 KB | 1,298,054 chars (111× its own mean) |
| shipped `0617e40a` | 20.2 | 2.56 KB | 122,753 chars (47×) |
| shipped `5cdcbfaf` | 13.1 | 3.08 KB | 505,040 chars (160×) |
| shipped `44eb2d30` | 12.2 | 3.29 KB | **2,312,071 chars (687×)** |
| shipped `e3ab1cd8` | 11.7 | 3.50 KB | 1,280,442 chars (357×) |

The longest single line in either corpus is **2,312,071 characters — 687× that file's own mean**.
Daedalus's real corpus topped out at 945,942; this one is 2.4× worse. **Neither a line count nor a
byte count can see a line like that**, which is why the two-term model still carries ~9% held-out
error rather than closing to zero. The residual is per-line structure, and it is the honest
remaining term.

Across all 22 files, r(above-cap bytes) = **0.99** against r(above-cap lines) = **0.96** — which is
the corpus-average view that made a bytes-only unit look adequate and a lines-only unit look
adequate at the same time.

## Guard headroom — a moving number, re-read not recalled

| | Round 155 (10:47 PT) | Round 157 (14:47 PT) |
|---|---|---|
| PM largest session | 41,168 lines | **41,466 lines (82.9% of the 50,000 guard)** |
| shipped largest | 15,371 | 15,371 (30.7%) |
| shipped corpus | 521 files, 546.8 MB | 525 files, 550.8 MB |
| PM corpus | 258,223 lines | 259,313 lines |

**PM's largest grew 298 lines in four hours.** Headroom is not a property of the corpus, it is a
moving quantity — worth stating because Round 155 reported 82% as though it were a fact about the
system. `over50000 = 0` on both roots still; the guard does not bite today.

## Corrected usable form

Replacing the Round 155 text, which has been marked superseded in place:

> **≈ 3.0 ms per 1000 above-cap lines + 2.5 ms per above-cap MB**, ~10% error on a corpus the
> coefficients were not fitted to. Both terms are needed; neither alone is the rule. Expect the
> residual to widen on corpora containing individual lines in the hundreds of thousands of
> characters — that structure is invisible to both terms.

**I did not adopt the relabel Daedalus proposed.** He suggested bracketing the rule of thumb by mean
line size — *"7–10 ms per 1k above-cap lines for corpora whose mean line falls between 1.84 and 3.08
KB"*. That would have preserved a number this fire shows is ~2.9× too high as a coefficient, and
encoded the wrong reason for the bracket. His diagnosis of the *signature* was right and it is what
sent me to measure; the resolution on this path is different from the one on his.

## What I got wrong, and what caught it

**Round 155's arm H called the bracket "the honest precision".** It was not imprecision. Two
single-term summaries of a two-term cost will always bracket when the corpora differ in the ratio of
the two terms, and the true coefficient sits *outside* the bracket, not inside it. The published
range excluded the right answer, which is a worse failure than being imprecise about it.

What caught it was not care — Round 155 was careful, and said out loud that two corpora were not
enough to choose the unit. What caught it was **someone on a neighbouring path running the control
and telling me the signature was diagnostic**, plus the corpus happening to contain real pairs that
made the control cheap. Both were luck. The transferable part is the tell: **when two normalisations
of the same measurement disagree in opposite directions, suspect a missing term before you report a
range.**

## Left open, named rather than finished

- **The residual is per-line structure and is not decomposed.** Escape density, nesting depth, and
  the 2.3M-character line are the candidates; none tested. A third term would need a corpus varied
  in structure at matched lines *and* bytes, which this machine may not contain.
- **The union cold browse.** Still not measured — carried forward unchanged from Round 155. Naive
  addition of the two single-root figures is arithmetic across runs, not a measurement.
- **Round 146's arm-S transform re-pin.** Still scoped-not-built. Third round carrying it; it is not
  getting done incidentally and should either be scheduled or dropped explicitly.
- **Whether the two-term form should be pushed back onto the parse path.** Daedalus's negative slope
  falsified the *two-term* model there; a two-term fit scored on held-out payloads (rather than
  solved on two aggregates) is the analogous test, and it is his path, not mine.
- **~1.9 s per server start on PM is acceptable or not** — xian's call, and the ruling is already
  his. Unchanged.
