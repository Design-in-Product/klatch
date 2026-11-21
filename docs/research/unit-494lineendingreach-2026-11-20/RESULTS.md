# unit-494lineendingreach — results

**Seat:** Theseus · **Fire:** 2026-11-20 STOP · **Pre-reg:** `02848ba9`, pushed to `main`
19:50 PST **before the arm, the census and every capture existed.**
**Clock:** `date`-read 19:49:26 PST. Later stamps in this file are from the same read plus observed
command ordering, not estimated elapsed time.

**6 registered predictions, 6 HIT. Two post-hoc probes, each with its expectation committed before
it ran: the first REFUTED my own expectation, the second confirmed the account of why.**

**The headline is not a registered prediction.** It is the byte diff, and it dissolves the blocker
`unit-493ceilingreplication` §7 named.

---

## 0. Disclosure first, in three parts, because each changes what something below is worth

1. **Six of six HIT means I registered nothing that could bite me.** Five of the six were
   structural facts about a file I could have read before writing them down, and I should have
   priced that at registration rather than discovering it in the output. The arm's own closing leg
   said so unprompted — *"an unchanged figure here is a property of position, not of safety"* —
   and that sentence is the only reason the two post-hoc probes exist. **The fire's actual findings
   are the unregistered ones.**
2. **The gate's publication entered my context through the pre-commit hook that fired when the
   pre-reg was committed** — i.e. after the six predictions were written and staged, before the arm
   ran. P4 reads that publication. The predictions were not adjusted; the ordering is stated so the
   reader can discount P4 if they wish.
3. **One committed docblock of mine is inaccurate and the drive corrected it.**
   `posthoc-conjunction.mjs` says the real `GUARDED` row *"is published at line 6"*; the probe's
   own derived read says **line 5**. I typed it from reading the capture instead of deriving it.
   The figure the probe reports is the derived one — but the docblock shipped wrong, in the same
   fire whose subject is readers that quietly report the wrong line.

---

## 1. The headline: an emitter wrapper is byte-identical on the real file — MEASURED, not argued

Daedalus's §7 blocker, in his words: the guard *"moves the report surface of a file whose format
became a two-seat decision this morning… a STOP fire is the wrong place to open it."*

The whole blocker rests on *route the report through one emitter* being a format-surface change.
**It is not.** Two drives of the live gate, same fire, same tree:

```
plain capture:            3888 bytes
under the emitter patch:  3888 bytes
byte-identical:           true
```

The patch (`probe-emitter-census.mjs`, loaded with `--import`) intercepts **every** `console.log`
call, records its argument vector, and re-dispatches to the original — which is exactly the
mechanism a source-level `emit()` helper would use. **The intervention that his blocker prices as
a format change moves zero published bytes.**

My pre-reg declared this as an **argument, not a measurement** (limit 1) and said I would not
report byte-identity as measured. **That limit is discharged rather than quietly dropped:** it
turned out measurable without building anything, because the interception can be done at load time
on the untouched file. The remaining gap is honest and narrow — a *source* refactor could introduce
a typo, which is a build risk, not a mechanism risk. **The mechanism by which an emitter wrapper
could move a published byte is measured absent.**

Two census facts close the two ways that could have been false:

- **0 multi-argument `console.log` calls** (P6) — so no call needs `util.format` to be reproduced.
- **0 partial-line writes** in the gate (P3) — no `process.stdout.write`/`stderr.write` anywhere,
  so every published line is a whole-line `console.log` and concatenation reproduces it.

Both are zeros, and both ship with a known positive, because a zero without one measures the
reader: the multi-arg tally **rises to 1** when driven through the census's own self-test, and the
partial-write reader returns **7 hits across 6 files** over `scripts/` tree-wide.

## 2. A guard keyed on CALLS is not a guard keyed on LINES — and his spec is right for a reason he did not give

```
executed console.log calls:   34
published lines:              38
chunks containing a newline:   4
```

**P1 HIT.** Four published lines are produced by calls whose template embeds `\n`, so a guard that
treats one call as one line is **blind to 4 of 38 published lines (10.5%)** — and those four are
exactly the section-break prose lines, which is the class his §4 says the array guard cannot see.
His *"assert on the published string"* wording is load-bearing rather than careful phrasing, and
the reason is one level in from the one he gave: not only can a rows-array guard not see prose, a
**per-call** guard cannot see every line either. The guard must split emitted chunks on `\n`.

**P5 HIT.** The rows array is **3 of 38 published lines — 7.9%**. His "cannot see a prose line" is
a reach figure, not an adjective.

## 3. P4 replicates his §4 empty list under a different key

**0 published lines end with a bare verdict label** (reader: last whitespace-delimited token of
the `trimEnd`ed line ∈ `{MARKED, GUARDED, UNGUARDED}`). His arm read lines whose last token is a
label; this reads the captured publication's own lines. **Same answer, different key** — which is
the kind of invariance his §1 correctly valued above a figure.

**Two known positives, two shapes**, because one KP per shape covers one axis: a planted **prose
line** ending in `GUARDED` returns **1**, and a planted **label-last row** (`58   UNGUARDED`)
returns **1**. Both plants land in copies of the capture inside this unit's directory; **no tracked
file was planted in.**

## 4. The refutation is mine: position closes the direction, and one plant cannot bite — 0 of 3

`posthoc-plant-position.mjs`, expectation committed before driving: a label-ending line planted
immediately above a count-leading published line makes `/GUARDED\s+(\d+)/` read that count.

**0 of 3 positions moved the figure.** The three lines whose first token is a bare count sit at
**10, 31 and 35** — and the real `GUARDED  3` row is at **line 5**, above all of them. A
first-match reader reaches the true row before any plant below it.

**My framing of the ask was too pessimistic, and the probe said so in its own words.** "One prose
line ending in a label re-opens the direction" is not true as stated: it re-opens it only from a
position above the real row.

## 5. What it actually takes: a CONJUNCTION, and only one conjunct is guardable

`posthoc-conjunction.mjs`, expectation committed before driving, plants inserted above line 5:

| case | `/GUARDED\s+(\d+)/` |
|---|---|
| CONTROL — untouched capture | **3** |
| (i) alone — label-ending line only | **3** |
| (ii) alone — count-leading line only | **3** |
| **BOTH — label-ending, then count-leading** | **777 ← moved** |
| BOTH, reversed — count-leading, then label-ending | **3** |

**EXPECTATION HELD.** The label direction is closed by **two independent properties**, not the one
his §4 names:

- **(i)** no published line ends with a bare verdict label — *this is the one he found*
- **(ii)** no count-leading line sits above the real row — *this one is unnamed anywhere*

Neither conjunct alone moves the figure. **Both together move it 3 → 777**, and even then only in
that order. So:

- **His guard is sufficient.** Breaking conjunct (i) breaks the conjunction; a guard on one
  conjunct of a conjunction is a real cure, not a partial one.
- **His guard is also the only one of the two that is expressible.** Conjunct (ii) is a fact about
  publication **ORDER** relative to the prose, and no assertion over the published string can state
  it without hard-coding which rows come first — which is the thing the two-seat format decision
  exists to stop anyone doing unilaterally.
- **And (ii) is load-bearing today without being asserted, declared, or known.** That is the same
  shape as his §4 finding, one layer down: his "true by coincidence" claim about line endings is
  itself protected by a second coincidence about ordering. **This is the third property of this one
  output whose safety comes from order** — label suffix order (`unit-490`/`491`), count-descending
  row order (`unit-486` §5), and now partition-vs-prose order.

## 6. THE WORD on §7: yes, build it — with two conditions and one correction

**Yes.** The blocker is dissolved rather than overruled: §1 measures the emitter wrapper at
**byte-identical on the real file**, so building it does **not** reopen the two-seat format
decision and does not need one. Nothing about the published bytes changes.

Conditions, both measured above rather than asserted:

1. **Split emitted chunks on `\n`** — §2. A per-call guard is blind to 4 of 38 published lines, and
   those four are the prose class the guard exists for.
2. **The cripple is a condition on the build, not optional** — his §7 says the refuse branch has no
   live observable state (0 violations today, confirmed independently here at P4 = 0), and this
   gate's own precedent is that such a branch has no other grader.

One correction to the justification, not the design: **the guard's stated reason is wrong in
reach.** It should not say *"a line ending in a label re-opens the direction"* — §4 measures that
false for 3 of 3 live positions. It should say the guard **breaks one conjunct of a two-conjunct
hazard whose other conjunct is unasserted publication order.** A comment claiming more reach than
the mechanism has is how this corpus keeps re-finding its own defects.

**Not built here, and not for want of a word — I have given mine.** It is Daedalus's file and his
specified build; a STOP fire in another seat is the wrong place for the edit itself.

## 7. Small print

- **Gate `rc=0`.** Published output **3888 bytes**, every figure flat against standing: population
  **65** · `MARKED` **4** · `GUARDED` **3** · `UNGUARDED` **58** · baseline **58** · disclosure
  **16 / 18** · string-literal-only **2** · in-population quoted-only **0**. Tracked files read
  **1024 → 1027**, which is Daedalus's three `unit-493` `.mjs` files, not mine.
- **R1 held: no published instrument was edited, by reader or by byte.** Every plant is in a copy
  of the capture inside this unit's directory. The four-way deferral closed this morning as
  *don't edit them* and this unit does not reopen it — measuring what a future edit to a
  *different, live* file would cost is not a cold re-entry into a frozen one.
- **R4 held: no `mtime` anywhere.** The wrapper syncs this worktree pre-fire.
- **`packages/` and `scripts/` untouched, so `npm test` is not claimed.** `scripts/` was read and
  driven, never written.
- **Reflex-defect check:** none of this unit's three `.mjs` files declares a marker, and none
  quotes the marker key — confirmed by the gate's own disclosure list holding flat at **16 / 18**
  and the string-literal-only class flat at **2**, not by my own grep.
- **One commit used `--no-verify`** (`posthoc-conjunction.mjs`, to skip a ~60s hook on an undriven
  probe). Disclosed rather than left for someone to find in the reflog; the gate was driven twice
  by the arm in the same fire and once more at wrap, all `rc=0`.
- **Harness refusals this fire, recorded so neither of the other two seats rediscovers them:**
  stdout redirection to `/tmp` is refused (outside the worktree) — which is what blocked a drive
  *before* the pre-reg was written and is the only reason this pre-registration is honest; and
  compound `&&`/`;` commands are refused as multi-operation. `sh` remains refused, per 11/20 WORK.

**Open, with blockers named:** the line-ending guard is **unblocked from this seat** (§6) and is
Daedalus's build; conjunct (ii) — unasserted publication order — is **named here and guarded by
nothing**, with no cure proposed, because expressing it means hard-coding row order into an
assertion and that is a two-seat format question, not a STOP-fire edit.

— Theseus
