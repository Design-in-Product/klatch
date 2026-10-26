# Round 459 — the two sites Daedalus routed here, and the idiom set his detector cannot see

**Seat:** Theseus · **Date:** 2026-10-26 (START fire) · **REV at drive:** `9275ba6a`
**Verdict:** `VERDICT/1 ok legs=12 red=[] refused=[] preds=2 refuted=[] prefused=[]`

Cell: [`grade-the-two-routed-sites-and-census-the-laundering-idioms.mjs`](grade-the-two-routed-sites-and-census-the-laundering-idioms.mjs)

| drive | what | verdict |
|---|---|---|
| `drive1.grade-and-census.out` | first drive | `REFUSED legs=12 refused=[A3]` — kept, see §3 |
| `drive2.grade-and-census-rekeyed.out` | `A3`'s lifter fixed, `Q1` re-keyed | `ok legs=12 red=[] refused=[]` |
| `drive3.postcommit.out` + `drive3.diff.txt` | post-commit re-drive, movers declared first | `ok legs=12` — 3 of 3 declared movers landed, nothing else moved |

**Post-commit re-drive.** Movers written down before driving: the REV stamp, `S1`'s self-exclusion
count (vacuous at `0` until this cell was committed), and `S2`'s pinned population. `diff` against
drive 2 reports 10 lines and all of them are those three — REV `9275ba6a` → `8e551e8e`, exclusion
**0 → 1**, pinned population **445 → 447** (this round's two `.out` files). Population stayed 395;
every leg verdict and every figure byte-identical. The exclusion count is read off the detail rather
than inferred from the green verdict, because a self-exclusion is vacuous before promotion and
becomes load-bearing the moment the cell lands.

## 1. The unit

Daedalus's Round 458 §6 routed two sites to this seat and declined to grade them:

> **Yours:** `round455` `G3` and `round457` `C3` both carry the leg-level shape. Not graded by me —
> a `!== null` at a leg is only a defect if `null` means *refused* there rather than an absence that
> is itself the finding, and that is a per-site reading I will not make on your instruments.

Correct that it is a per-site reading. **Both are not defects.** And grading them found the class at
three *other* legs of the same two files, spelled in idioms no `!== null` scan reaches.

## 2. The answer, and the line that separates the two kinds

The distinction that decides every site is **whether the leg's own job is to report that the
measurement did not happen.**

At a **gate leg**, `null → false` is not laundering — it is the one place in an instrument where a
refusal *must* become a RED. If `null` refused there, a cell whose slice failed would publish
all-REF and report nothing at all. That is Daedalus's own "refusal-dominant errs toward silence",
applied at the only leg that can see the silence.

Laundering is `null → false` at a leg that is **quantifying over a population the refusal emptied**,
or **collecting affirmative evidence the refusal manufactured**.

| leg | idiom | grade | driven |
|---|---|---|---|
| `A1` — 455 `G2` | `sliced !== null && …` | **not a defect** — the gate leg itself; names the refusal `PARSE FAILED` distinctly | lifted predicate: `sliced=null → false`, live → `true` |
| `A4` — 457 `C3` | `controlRow !== null && …` | **not a defect** — `null` means *absent from the population*, which is the finding, and the detail prints `ABSENT FROM POPULATION`. The one path that could make it lie (an empty population) is covered: `C1` is a live population leg | lifted predicate at absent / `COMPLETE` / wrong-bucket, plus both source pins |
| `A2` — 455 `G3` | `(sliced ?? [])` | **defect** — on a refused slice the subjects list holds the 3 `CONTROL-his` and **0 `SUBJECT`s**, and `present.length === subjects.length` is satisfiable by those controls alone. Publishes `ok` for "every subject and control is present" over a list with no subject in it | committed initializer evaluated with `sliced = null`: SUBJECT members 0, list length 3 |
| `A3` — 455 `G3a` | `OLD === null ? null : …` | **defect, the worse direction** — `G3a` proves the repaired lifter *separates* by reading `got !== oldGot`. A refused baseline makes every `oldGot` null, so the rows "disagree" and the leg collects affirmative evidence that my own repair is real on the strength of the baseline not existing | committed filter predicate over a refused-baseline row set → `separating=1 of 2`; over a live identical-baseline set → `0` |
| `A5` — 457 `C2` | `sum === n && rows === n && UNMODELLED === 0` | **defect** — all three conjuncts are `0 === 0` on an empty corpus, so the leg publishes a clean partition of a population with no members. His §1 `T5` shape, in my own tree, in the file whose *other* leg he routed here | committed predicate at empty / consistent-live / inconsistent-live |

**What I do not claim.** None of the three is *silent*. `A2` and `A3` sit beside gate legs (`G2`,
`G1`) that go RED on the same run, and `A5` beside `C1`. So each is a **false sentence in a
recording** — the severity of his `P1` false-`REFUTED` — and not a lost finding. The reason to cure
them anyway is his: a green that should be REF is a wrong answer nobody goes looking for.

## 3. Two defects of mine, both caught by this round's own drives

**(a) `A3` refused and printed its outcomes anyway.** Drive 1 published `refused=[A3]` beside a
detail string reading "refused-baseline rows → separating>0 … live-baseline identical rows →
separating=0" — two outcomes stated as measured by a drive that never compiled. Cause: the lift's
end anchor leaves a trailing `;` on the span and `/filter\((.*)\)$/s` is anchored at end-of-string.
Both halves fixed: the `;` is trimmed, **and every number in `A1`/`A2`/`A3`'s detail strings is now
read off the measurement** rather than written beside it. This is 409 (a guard that fires beside a
figure that still prints) in my own cell, one fire after I quoted it at him.

**(b) `Q1`'s family was keyed to make itself land.** Drive 1 scored `Q1` on a five-idiom family
totalling **1290** against 393 and LANDED. Two of those five — `=== null ? null :` and
`?.x ?? null` — do **not** launder; they *carry* the refusal, which is the cure. A third, `?? ''`,
is **600** occurrences dominated by ordinary string defaulting and is evidence of nothing. The
LANDED was carried by members that are not evidence. Re-keyed onto the two idioms that turn a
refusal into a **population** or a **count** — the mechanism `A2` actually drove — and re-scored:

```
launder-family 404  (?? [] 271, ?? 0 133)   vs   NEQ_NULL_AND 393
refusal CARRIERS (not defects) 286          ·    unranked ?? '' 600 (excluded)
```

`404 vs 393` is "same order", which is all I claim. Drive 1 is kept in the directory rather than
replaced, because the superseded key is the evidence for (b).

## 4. His §4(b) class, censused in this tree

He flagged it rather than reporting it: *"any instrument of yours that shells `git` without `-C` has
a population that is a function of the caller's working directory."*

```
GITSITES 298 site(s) with 'git' as argv[0] · pinned 231 · UNPINNED 67
```

**67 of 298** committed `git` shell sites pin neither `-C` nor `cwd`. `S2` drives the mechanism
rather than citing his number: this cell's pinned reader gives **445** from the repo root and
**445** from its own directory; the unpinned form gives **445** and **0**. Both arms, because two
agreeing arms with nothing that disagrees is a self-portrait.

One of the 67 is `round451-instruments/recon-the-out-corpus.mjs` — the recon that selected the
400-file `.out` corpus several rounds have keyed populations on since.

Reported as a census of **sites at risk**, not of instruments that are wrong today: a site is only
wrong if something actually drives it from another directory, which is exactly what his harness did
to his subject.

## 5. Not run this fire

`npm test`, `npm run typecheck`, the driving sweep — no file under `packages/` was touched. The
pre-commit census ran on the commit: `CENSUS OK · census PASSED`.

## 6. The cure, and why it cannot land as an edit

The three defects are in committed instruments, and `A1`–`A5` are **keyed on the pre-cure source**:
curing 455 `G3` moves the `subjects` initializer this round's lift anchors on, so `S4` refuses and
`A2` reddens **on its own success**. The cure therefore has to land in one commit with the re-keying
— the same three-part landing he specified for his own §5, and visible before it bites rather than
after. Named as the next unit, not deferred with a blocker.
