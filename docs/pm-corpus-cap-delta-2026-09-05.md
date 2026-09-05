# The cap ruling on `~/.claude-pm/projects` — 1781 ms, and it bought 87.7% of the turn signal

**Round 155 · Theseus · 2026-09-05 (START fire)**
**Instrument:** `scripts/probe-pm-corpus-cap-delta.mts`
**39 checks (18 regression, 21 measurement), 0 failed, 0 skipped.** Two independent full runs.
Zero model calls. `klatch.db` never opened. Both corpora read-only.
`session-scanner.ts` sha256-verified byte-identical before exit (`2ae9ecd1c431`).

---

## Why this existed

Round 153 (`docs/browse-cold-figure-gap-2026-09-04.md`) priced xian's `FINGERPRINT_LINE_CAP`
ruling (1500 → 50 000, `18d4631`) at **723 ms on every cache-cold browse** — measured at the
endpoint, against `~/.claude/projects`. That log closed by naming what it had deliberately not
done: **the same delta on `~/.claude-pm/projects`**, the root where PM's eleven department heads
live and the corpus continuity #3 exists to demonstrate. Daedalus's 9/5 memo lists it as still
mine. This closes it.

It could not be carried over by arithmetic. The two corpora look similar in exactly the way that
would tempt someone to skip the measurement:

| | `~/.claude/projects` | `~/.claude-pm/projects` |
|---|---|---|
| files | 521 | **76** |
| bytes | 547.0 MB | 463.0 MB |
| lines | 181 744 | **258 315** |
| files over the old 1500 cap | **11** | **11** |
| largest file | 15 371 lines | **41 168 lines** |
| lines *above* the old cap | 73 536 (40% of corpus) | **240 992 (93% of corpus)** |
| avg file size | 1.05 MB | **6.1 MB** |

**The same number of files exceeds the old cap — 11 each — and the two corpora are nothing alike.**
The delta is paid per *line* above the cap, not per file, and PM has 3.3× as many. A count that
matches is the most persuasive possible reason to assume, and it would have been wrong by 2.5×.

## The measurement

Server pointed at the PM root **alone** via `CLAUDE_CONFIG_DIR` (replace semantics,
`session-scanner.ts:124-130`) rather than `KLATCH_EXTRA_SESSION_ROOTS` (additive), so the figure
is this corpus and not a union that would have to be un-mixed by subtraction. One run, one machine
state, three fresh servers, page cache warmed over the PM root only.

| arm | cap | cold browse | steady state |
|---|---|---|---|
| B | 50 000 (shipped) | **1945 ms** | 5 ms |
| C | 1 500 (pre-ruling) | **174 ms** | 4 ms |
| D | 50 000, control | **1966 ms** | 4 ms |

- **Cap delta: 1781 ms** (mean of the shipped-cap arms, minus arm C); 1771 ms taking B−C alone.
- **Arm B is not drift:** B and D are 1% apart on separate fresh servers.
- **Reproducible across runs:** an earlier full run of the same probe gave 1778 ms. The two runs
  agree to **0.2%**.

### Against the shipped corpus

**1781 ms vs 723 ms — 2.46×.** But the ratio is the least interesting way to say it:

**Shipped: 1492 ms → 2203 ms, +48%. PM: 174 ms → 1956 ms, +1021%.**

The pre-ruling browse of PM was **174 ms** because the old cap read only 17 355 of 258 315 lines —
**6.7% of the corpus**. The old cap wasn't trimming PM's tail; it was declining to read it.

## What the ruling bought, on the corpus it matters most for

**At cap 1500 the endpoint reported 138 turns across 76 sessions. At 50 000 it reported 1121.
The old cap hid 983 turns — 87.7% of PM's turn signal.** On the shipped corpus Round 153 measured
the same loss at 59.4%.

Browse would have shown PM's department heads at roughly **two turns each** when they really run to
**370 at the top**. For a corpus whose entire purpose is to demonstrate that imported conversations
carry their history, that is not a cosmetic inaccuracy.

**The ruling is most valuable exactly where it is most expensive, and both are this corpus.**

Verified by effect, not by text: arm C returned **11 capped sessions** and arm A independently
counted **11 files over 1500 lines on disk**; arm B returned **0 capped**. A patch that had failed
to reach the server would have shown zero capped and an unchanged turn total.

## Cost shape: paid once, absorbed completely

**Steady state is 4–5 ms at either cap.** The fingerprint cache absorbs the ruling entirely after
the first browse — 425–490× on this corpus. The 1781 ms is **per server start, not per browse**,
the same shape Round 153 found on the shipped root.

## The number nobody had written down: guard headroom

`session-scanner.ts:255-263` states the 50 000 guard "is not biting today" and asks for it to be
watched. A boolean tells you the morning after it starts biting.

**PM's largest session is 41 168 lines — 82% of the guard, 8 832 lines of headroom.** The shipped
corpus's largest is 15 371 (31%). **PM leads it by 2.7× and is the root that will cross first.**

`over50000 = 0` on both roots today, so the guard still holds — but the monitoring the comment asks
for should be pointed at PM, not at the default root. Arm G reports this as a percentage every run,
and arm E's first check goes red on the crossing. That red is the finding, not a broken probe.

## Does the per-line cost travel? Partly — and the honest answer is a range

Arm H puts both corpora on the same axis (disk figures current; shipped delta from Round 153, so
this is a cross-run consistency check and not a controlled experiment):

| normalisation | PM | shipped | spread |
|---|---|---|---|
| ms per 1k lines above cap | 7.4 | 9.8 | 25% apart, **PM cheaper** |
| ms per MB above cap | 4.1 | 3.3 | 26% apart, **PM dearer** |

**The two normalisations bracket rather than agree**, and by a similar margin in opposite
directions — PM's lines average 1.84 KB against shipped's 3.08 KB, so lines and bytes disagree
about which corpus is doing more work. Cost scales with above-cap work under either unit; two
corpora are not enough to choose the unit.

> ### ⚠️ Superseded by Round 157 — the "7–10 ms per 1k lines" form below was wrong
>
> **This section's usable form has been replaced.** Round 157
> (`docs/scan-cost-model-control-2026-09-05.md`,
> `scripts/probe-scan-cost-model-control.mts`) ran the controlled experiment this
> section says two corpora were not enough for, using **four byte-matched,
> line-divergent pairs of real sessions** — up to 7.10× apart in line count at
> 0.51% apart in bytes.
>
> **What held:** the per-line coefficient is real. Positive on all four pairs, in
> all three runs (12/12 measurements), so the scan path is *not* the falsified
> model Daedalus found on the parse path.
>
> **What did not:** 7.4 and 9.8 were never two estimates of one coefficient. The
> isolated coefficient is **~3.0 ms per 1k lines** — *below both*, not between
> them, by ~2.9×. Each published figure was a single-term summary of a two-term
> cost, so each silently absorbed the byte-proportional share of its own corpus.
> The bracket was two different wrong attributions, not a precision band.
>
> **Replacement usable form, and it is fitted and then scored on files it never
> saw:**
>
> **≈ 3.0 ms per 1000 above-cap lines + 2.5 ms per above-cap MB**
>
> | model | held-out error |
> |---|---|
> | lines only (the form below) | 26% |
> | bytes only | 12% |
> | **two-term** | **9%** |
>
> Two independent routes agree on the line coefficient: least squares over 22
> files gives 2.9–3.0, and the fit-free pair isolation gives 2.7–3.2 (2–7% apart).
>
> The original text is kept below unedited, because the reasoning that produced
> it is the point — a bracket that looks like a precision band is the signature of
> a missing term, on this path and on the parse path both.

**Usable form:** estimate a new corpus at **7–10 ms per 1000 above-cap lines**, and treat the range
as the precision rather than picking a point inside it.

## For xian — the price tag, not a request

Opening Browse against PM costs **~1.9 s on the first browse after a server start**, and 4 ms every
time after. Of that, **1.78 s is the cap ruling** and it buys 87.7% of the turn counts you see.
Nobody has said 1.9 s is a problem; I am not asserting it is. The ruling looks right on these
numbers — more clearly right here than on the shipped corpus, where it bought less and cost less.

The one thing worth knowing: **PM is at 82% of the fingerprint guard.** No action today. If a PM
session crosses 50 000 lines, turn counts on that session silently become lower bounds, and the
probe's arm E is what will say so.

## Left open, not guessed at

- **The union.** xian's real Browse runs both roots via `KLATCH_EXTRA_SESSION_ROOTS`. Neither
  Round 153 nor this fire measured the union's cold browse. Naive addition of the two single-root
  figures gives ~4.2 s, and **that is arithmetic across two runs, not a measurement** — it assumes
  the roots don't interact through page cache, the walk, or the response build. Not asserted; it is
  the obvious next arm and it is one server generation of work.
- **Whether ~1.9 s per server start is acceptable on PM.** xian's call; the ruling is already his.
- **Round 146's arm-S transform re-pin** — still scoped-not-built, still mine.
- **The unit question in arm H** — settling lines-vs-bytes needs a third corpus with a different
  KB/line, which does not exist on this machine today.

## Provenance

- `~/.claude-pm/projects` figures: measured this fire, streamed line counts, twice.
- `~/.claude/projects` disk figures: measured this fire (arm H).
- Shipped-corpus **latency** figures (1492 / 2203 / 723 ms): Round 153,
  `docs/browse-cold-figure-gap-2026-09-04.md`, **not re-measured today** — quoted, and every
  comparison against them is labelled cross-run above.
- Round 153's shipped turn figures (2047 → 831, 59.4%): same source, same caveat.
