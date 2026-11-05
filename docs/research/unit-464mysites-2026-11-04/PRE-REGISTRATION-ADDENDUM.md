# Addendum 1 — the seven selections and reductions, transcribed from source at the pin, and two things I now know

**Filed before any grader in this unit exists.** `PRE-REGISTRATION.md` and `HAND-SITES-MINE.tsv`
are already committed and pushed; this file lands before `grade-mysites.mjs` exists, so the
reductions P3REACH evaluates cannot be tuned to the answer. The P3REACH floor (**≥3 of 7**) was
registered **before** I read any of the seven sources.

## Declared, not predicted, not scored

**1. My own `round464` reason already contains P3REACH's argument, in prose, unmeasured.**
`HAND-CONS.tsv`'s row for `round464-instruments/grade-the-stop-condition.mjs#1` reads: *"Later files
added to the same directory are also A-commits, but `--reverse` + first selects the earliest, which
is immutable."* That is exactly "the selection output moves and the consumed site does not." So
P3REACH is **not a discovery**; it is the measurement of a claim my own table asserted without
measuring, and the only new thing in it is that §2.1k says a differential test cannot reach it.

**2. Five of my seven FP-ONLY files instantiate ONE selection shape, and that is a criticism of my
own published figure.** I learned this by reading all seven sources at the pin, this fire, before
this file existed. `FP-ONLY 7` counts **files**; it does not count independent judgements. Three
distinct shapes carry it, and one of them carries five.

**3. For shape C I read two values at the pin:** `BASE_REV` = `e6460aba` (the content of
`unit-464vac-2026-10-31/baseline.rev` at `0ae48068`) and `LIVE_REL` =
`docs/research/unit-464mapkey-2026-10-30/grade-filed-maps.mjs`.

## The three selection shapes, transcribed from each file's source at `0ae48068`

**Shape A — newest add-commit of ONE named file.** 1 file.

```
  git log --format=%h --diff-filter=A -- docs/research/round434-instruments/grade-the-two-cures-and-the-prose.mjs
  reduction: .trim().split('\n')[0]          <- NEWEST, there is no --reverse in this call
  file: round435-instruments/grade-his-cure-and-oracle-the-matrix.mjs   (ADDED_BY, line ~410)
```

**Shape B — oldest add-commit of the DIRECTORY `round<N>-instruments/`.** 5 files.

```
  git log --diff-filter=A --reverse --format=<F> [<REV>] -- docs/research/round<N>-instruments/
  reduction: split('\n').find(l => l.trim().length > 0)   (or .filter(Boolean)[0]), then field 1
  files, with the only differences between them:
    round464-instruments/grade-the-stop-condition.mjs                  F = %H|%an
    unit-464t2-keychoice-2026-10-28/grade-the-surface-predicate.mjs    F = %H|%an
    unit-464t2-reaim-2026-10-28/grade-the-credit-key.mjs               F = %H|%an|%cI|%s
    unit-464t2-reaim-2026-10-28/recon-credit-provenance.mjs            F = %H|%an|%cI|%s
    unit-464t2-surface-2026-10-28/recon-run-length-and-cure.mjs        F = %H, and an EXPLICIT
                                                                        <REV> = rev-parse HEAD
                                                                        at run time (line 52)
  `<N>` is a PARAMETER in all five. The explicit <REV> in the fifth is HEAD at run time, so it
  bounds the log at the rev the instrument is driven at and is not a pin.
```

**Shape C — oldest commit touching one file SINCE a fixed baseline, then its first parent.** 1 file.

```
  git log --format=%H --reverse <BASE_REV>..HEAD -- <LIVE_REL>
  reduction: .trim().split('\n').filter(Boolean)[0], then git rev-parse <first>^
  file: unit-464vac-2026-10-31/grade-cure.mjs   (PRECURE_REV, line ~55)
  BASE_REV e6460aba (read from baseline.rev at the pin) · LIVE_REL as declared above
```

## How "evaluated at rev R" is parameterised, declared because it is a choice

Shapes A and B(×4) call `git log` **unbounded**, which means *HEAD at run time*. Driving them "at
rev R" is therefore spelled `git log R --diff-filter=A …`, which is what the fifth shape-B file
writes explicitly. Shape C's range is `BASE_REV..HEAD`, so it is spelled `BASE_REV..R`. The two revs
are `0ae48068` and the live `HEAD` printed by each drive from `git rev-parse HEAD`.

## Two further predictions, registered here

**P6SHAPE.** The 7 FP-ONLY files reduce to **exactly 3** distinct selection shapes, with **5** of the
7 on one shape. Graded mechanically from the three call signatures above, matched against each file's
source at the pin — not from this prose. Consequence registered with it: **`FP-ONLY 7` is a count of
files and not of independent judgements, and the convention entry must say which.**

**P7PARAM — the reachability guard on P3REACH, and without it P3REACH's green is worthless.** For
shape B instantiated over **every** `round*-instruments` directory present at `0ae48068`:

* the **selection output** moves for **≥1** instantiation, and
* the **consumed site** moves for **0**.

If the output moves for **0** instantiations, then over this interval nothing touched the selected
paths, the non-move is **vacuous for the whole shape**, and P3REACH would be green over 5 of its 7
files for the exact reason §2.1k gives for rejecting differential tests. **In that case I report
P3REACH as unestablished and §2.1k as standing, rather than publishing a floor it cleared
vacuously.** The two halves are graded as **separate legs**, because a leg red for two reasons cannot
say which.

**Cripple for P7PARAM, `--cripple=sitefromoutput`:** compute the "consumed site" as the *whole*
selection output rather than the reduction of it. Under that key the site must move wherever the
output moves, collapsing the distinction P3REACH rests on. If the crippled arm reports the same
figures as the subject arm, the reduction is doing no work and the leg says so.

— Daedalus
