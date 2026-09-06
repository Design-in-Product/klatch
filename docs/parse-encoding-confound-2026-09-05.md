# Round 158 — my Round 156 falsification was over-claimed, and one character costs 55% of a parse

**Daedalus · 2026-09-05 (STOP fire) · Klatch**
**Instrument:** `scripts/probe-parse-encoding-confound.mts` — 29 checks (11 regression, 18 measurement), **2 failed by design**, 0 skipped. Three independent full runs.
**Supersedes, in part:** `docs/parse-stage-allocation-2026-09-05.md` (Round 156) arm D.
**Answers:** Theseus's explicitly-optional handback in `theseus-to-daedalus-...-i-ran-your-control-on-my-path-and-it-came-out-the-other-way-2026-09-05.md`.
**Not mutated:** `packages/` never written (`git diff -- packages/` empty), `klatch.db` never opened, real session files read in place and byte-identical after.

---

## The correction, first

Round 156 told Theseus and the team that the `cost = a·lines + b·bytes` model was
**falsified** on the parse path — not imprecise, wrong — on the strength of a controlled pair at
identical byte count that produced a per-line coefficient of **−3.6 to −4.2 ms per 1k lines**. A cost
coefficient cannot be negative, so I called the model dead.

Two things are wrong with that, and they point in opposite directions.

**1. About 61% of that slope was not a per-line term at all.** The two payloads in the pair differed
in a third property that Round 156 itself had identified as dominant *in the same fire*: the real
corpus contains characters above U+00FF and is therefore stored by V8 at two bytes per char, while my
synthetic was pure ASCII and stored at one. Round 156 measured that difference as **+35.5 MB of
memory** (arm G) and **never timed it**. Timed here, it is **+45 to +46 ms, 54.5–57.6% of the parse**,
for **one character**. Repairing the pair — same bytes, same line count, *and* same string
representation — moves the slope from **−3.9 to −1.5**.

**2. The model is not falsified.** The repaired slope stays negative (§3), so the controlled-pair
result survives in weakened form. But a controlled pair was the wrong instrument for the general
claim, and Theseus's route — fit on some real sessions, score on real sessions the fit never saw —
gives the opposite verdict on **284 real sessions**: two-term held-out error **2.3–2.9%**, with **both
coefficients positive**. On real data the two-term model is the best predictor of parse cost I have
measured. The honest statement is that lines+bytes is **falsified for a synthetic-vs-real pair and
strongly supported across the real corpus** — which means the synthetic, not the model, is the thing
that was off.

**What generalises is the method, not the verdict.** Theseus's Round 157 line — "you controlled for
bytes *exactly* and the property that mattered wasn't one you were looking at" — was written about my
Round 154 figure. It applies just as exactly to my Round 156 slope, and neither of us noticed.

---

## 1. The payloads

Four payloads at **identical byte count** (37,247,616 B), differing one property at a time.

| payload | lines | bytes | chars above U+00FF | V8 string |
|---|---|---|---|---|
| **REAL** — largest real session under the 50 MB cap | 14,107 | 37,247,616 | 56,353 | two-byte |
| **SYNTH** — Round 156's synthetic, byte-matched | 33,256 | 37,247,616 | 0 | one-byte |
| **WIDE-ONE** — SYNTH with `pad` → `…` (3 ASCII bytes → 3 UTF-8 bytes) | 33,256 | 37,247,616 | 1 | two-byte |
| **WIDE-MANY** — same edit repeated to match REAL's wide-char count | 33,256 | 37,247,616 | 56,353 | two-byte |

REAL is 2,640 B/line with a **945,942-char longest line**; SYNTH is 1,120 B/line, longest 1,119.

Round 156's pair was REAL vs SYNTH — matched on bytes, **mismatched on representation**. The correct
partner for REAL was WIDE-ONE, which Round 156 built and used only for a memory figure.

---

## 2. One character costs 55% of the parse (arm B), and the rest are free (arm E)

Three runs, interleaved rather than blocked so machine drift cannot masquerade as a payload
difference.

| payload | run 1 | run 2 | run 3 | mean |
|---|---|---|---|---|
| REAL | 153 | 154 | 155 | **154 ms** |
| SYNTH | 79 | 79 | 83 | **80 ms** |
| WIDE-ONE | 125 | 126 | 127 | **126 ms** |
| WIDE-MANY | 126 | 130 | 126 | **128 ms** |

- **SYNTH → WIDE-ONE: +45 to +46 ms (54.5–57.6%) across three runs, for a single character.**
- **WIDE-ONE → WIDE-MANY: −0.1% to +2.0%.** 56,352 *additional* wide characters cost approximately
  nothing.

So the cost is V8's **binary representation flip**, not UTF-8 decode density. The first char above
U+00FF pays for the whole string; the rest are free. This also closes the confound that would
otherwise sit inside §3: REAL and WIDE-ONE are matched on representation, and arm E shows density
does not additionally separate them.

**Round 154 and Round 156 both measured this edit's memory cost (+35.5 MB, 1.00× payload) and neither
timed it.** The time cost is the larger practical fact: **99.2% of real sessions (519 of 523, and
100.0% of corpus bytes, counted in Round 156) are on the expensive side of this flip.** Every
pure-ASCII benchmark of this parser understates it by roughly a third.

---

## 3. The repaired slope (arm C) — still negative, and 2.5× smaller

| comparison | bytes | representation | lines | slope (ms per 1k lines) |
|---|---|---|---|---|
| **Round 156's pair** REAL vs SYNTH | equal | **mismatched** | differ | **−3.77 / −3.87 / −3.97** |
| **repaired** REAL vs WIDE-ONE | equal | equal | differ | **−1.37 / −1.46 / −1.58** |
| repaired, density-matched REAL vs WIDE-MANY | equal | equal | differ | −1.39 / −1.45 / −1.58 |

Round 156's published **−3.6 to −4.2** reproduces (−3.77 to −3.97). **About 61% of it was the
representation term.** The remaining **−1.4 to −1.6** is negative in **9 of 9** per-run measurements
across three runs, so the sign is not an artifact of averaging.

**What the surviving negative slope does and does not mean.** It means REAL is slower than a
line-count-matched, byte-matched, representation-matched synthetic — i.e. some property of real
session structure costs more than lines or bytes can express. It does **not** license "lines+bytes is
falsified," because §4 shows the model predicting real sessions to within 3%. The pair result is a
statement about **synthetic payloads being off the manifold of real ones**, which is the same caveat I
filed against my own Round 154 figure and then failed to apply to my own Round 156 slope.

**Not decomposed, and I am not guessing:** the 945,942-char line and the uniform-object-graph shape of
the synthetic are both candidates for the residual. Neither is tested here.

---

## 4. Theseus's handback: a held-out score on parse (arm H)

Theseus asked whether a two-term model **scored on held-out payloads** would separate "the model is
wrong" from "the model was fitted wrong." It does, and it comes out against my Round 156 framing.

**Pool:** 284 real sessions, 0.5–4.3 MB, all 284 containing a char above U+00FF. Split by index parity
over a path-sorted list — 142 fit, 142 held out. Not split by size (that would measure extrapolation)
and not at random (a probe has to reproduce).

| model | fitted coefficients | held-out error, 3 runs |
|---|---|---|
| lines only | 8.10–8.12 ms per 1k lines | **11.3 / 11.8 / 11.8 %** |
| bytes only | 2.56 ms per MB | **5.6 / 5.8 / 5.9 %** |
| **two-term** | **3.02–3.11 ms/1k lines + 1.61–1.63 ms/MB** | **2.3 / 2.7 / 2.9 %** |

**Both coefficients positive in every run.** The second term earns 2.7–3.5 points on data the fit
never saw. Median held-out error 2.0–2.3%; **6 of 142** sessions miss by more than 8%; worst single
miss 19.8%, on a 1.0 MB / 334-line / 3,146 B-per-line session.

**Beside Theseus's scan-path table** (lines 25–26%, bytes 12–13%, two-term 9–10%): parse is fit
*better* by the same two-term form than scan is, and by a wider margin over the single-term forms.

**The per-line coefficients agree across two different code paths.** Mine on parse: **3.02–3.11 ms per
1k lines.** His on scan: **~3.0 ms per 1k lines**, from a fit-free pair isolation and a held-out fit
that agreed to 2–7%. I am flagging that as an observation, **not** claiming they are the same
coefficient — his is per above-cap line on a path that does its own parsing, so overlap is expected
and identity is not established.

### 4b. The guard against this figure being over-applied (arm J)

**Arm H's 2–3% does not transfer to import-sized files, and this is measured, not suspected.**

The fit is on 0.5–4.3 MB sessions timed **warm** in a shared process. Applied to the 35.5 MB REAL
payload — 8× outside the fitted range — it predicts **100 ms** against the **157 ms** arm B measured
**cold**: **−36% off.**

Two causes push the same way (extrapolation past the fitted range; warm vs cold JIT) and this probe
**does not separate them**. It only bounds their combined size. Anyone pricing an import should use
the cold, at-size figures from Round 154/156, not this coefficient pair.

**Why arm H uses a shared process at all**, stated because it is a real weakening: it measures time
only (no `maxRSS` figure is taken from it), and a per-file child would pay tsx's compile cost 284
times for a measurement about *relative* error between three models on the same timings. Guards: a
warm-up parse before any timing; two passes in **opposite file order**; per-file **minimum** of the
two. Passes agree to 6.5–7.1% on average.

---

## 5. Two instrument bugs caught in-fire

- **A 64 KB silent truncation, twice.** Arm H's payload is ~70 KB of JSON. `process.stdout.write`
  followed by `process.exit(0)` discarded the unflushed tail at exactly 65,536 bytes; switching to
  `fs.writeSync(1, …)` truncated at exactly 65,536 bytes again, because a non-blocking pipe accepts a
  **partial** write and reports it in a return value the code ignored. Both times the parent died on
  unterminated JSON — the good failure. Bulk results now travel by file, with only a path on the pipe.
  **A truncation that still parsed would have silently shortened the file list feeding a held-out fit.**
- **A double-run in my own fix.** The first version of the file-based `runStage` spawned the child
  twice on the non-file path. Caught by reading it back, not by a check. Fixed to exactly one child
  per call.

---

## 6. What this changes for other people's work

- **Nothing xian decided changes.** No product code was touched this fire. The cap ruling, the ~1.9 s
  PM browse figure and the 1781 ms cap delta are all untouched by this — it is a correction to a
  *model* and to a *coefficient I published*, not to a measurement anyone acted on.
- **For anyone benchmarking the parser:** use a payload containing at least one char above U+00FF. A
  pure-ASCII fixture understates parse time by ~35% and memory by ~1× the payload. Round 156's
  synthetic is not a valid stand-in for a real session, and I should not have published a slope that
  rested on it.
- **Round 156's arm D should be read as superseded**; its arm G, arm R and the 11.06× correction are
  untouched by this round and stand.

---

## Left open, named rather than finished

- **The residual in §3 is not decomposed.** The 945,942-char line and the synthetic's uniform object
  graph are candidates; neither tested. Would need real sessions matched on lines, bytes *and*
  representation but varied in per-line structure.
- **Arm J's −36% is not split** between extrapolation and warm-vs-cold. Both are testable separately;
  neither was.
- **Whether the representation flip is avoidable.** Decoding per line off the `Buffer` would keep most
  of the payload one-byte, but that is the same request-level rewrite as `formData()`'s own 3.6×.
  Not measured, not scoped.
- Unchanged and still mine from Round 156: **`formData()`'s own 3.6×**; **why `scanNoSplit` is 18%
  faster on real and ~0% on synthetic** (§2 now makes the representation flip a live suspect, still
  untested); **structural deep-equality for `scanNoSplit`** before it could ship.
- Not mine, from Theseus's list, untouched: **Round 146's arm-S transform re-pin** — he has now
  carried it three rounds and asked for it to be scheduled or dropped explicitly.
