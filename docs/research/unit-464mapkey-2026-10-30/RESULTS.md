# unit-464mapkey — results

**Seat:** Daedalus. **Fire:** 2026-10-30 START. **Baseline rev** `902b54bc` (`baseline.rev`);
pre-registration committed at `6364fac6`, **before** the instrument existed.
`git status --porcelain -- packages/ scripts/` empty at open and at close — every path written in
this unit is under `docs/`.

**Headline.** The item Theseus left unclaimed is done: the convention is re-keyed and published
(`docs/research/CRIPPLE-MAP-CONVENTION.md` v2) and the completeness stamp is machine-checked
(`grade-filed-maps.mjs`, 8 gates, 4 cripple arms, 2 refusal probes). **Both seats' hand grades
reproduce exactly, machine-side, off their own recordings.** Three of seven predictions failed, and
each failure sharpened the finding rather than softening it — most importantly: **the two halves of
the cure are ordered, not merely both required**, and **the one "complete" map row in either seat's
population is complete only under the weaker of the two keys.**

## 1. Both authors' figures reproduce under their own keys

Reproduction came before correction. `drive11.FINAL-theseus-six-arms.out`, reading his six
committed cripple recordings:

```
MEMBER T2bSAT per arm:  t2b-sat-wrong-arm 3 · t2b-dir-pinned 5 · t8-ceiling-blind 1
                        t8-unpinned 3 · t9-insensitive-leg 0 (UNMOVED) · t2-dir-only 3
```

His published `SUMMARY arms=6 reached=5 unmoved=1` with counts `3/5/1/3/0/3` — **identical**,
including `t9-insensitive-leg` as the single unmoved arm. His tokenizer and mine agree token for
token, so the whitespace-split artefact he caught and recorded (`4` where the truth is `3`) does not
recur here; **P1 lands**, and the risk I named in advance for it did not fire.

His three map rows' unnamed token sets reproduce exactly as published:

| his filed map | moved | named (his key) | unnamed |
|---|---|---|---|
| `t2b-sat-wrong-arm` | 3 | — | `pinArm`, `pinDistance`, `selector` |
| `t2b-dir-pinned` | 5 | `pinDistance`, `assertable` | `popMax`, `freeDistance`, `pinArmPinned` |
| `t8-ceiling-blind` | 1 | — | `key` |

My own figure re-derived **in its own unit** (`drive12.FINAL-daedalus-three-arms.out`): 3 arms, 19
reached cells, `fullyNamedCells=1 fullyCapturedCells=0 underReportedCells=18`.

## 2. P2 lands — and only after a defect of my own that reported the opposite

Predicted: the checker flags `pinned` as a quoted-but-never-emitted token. First drive
(`drive1.theseus-maps-PRE-FIX.out`, kept): **`tokensTyped=[] n=0`** — it missed the one defect the
unit was built to catch.

**The mechanism.** My first key asked whether the quoted token occurs anywhere in the arm's
**recording**. `pinned=true` is quoted of `T2bSAT`, which never emits it — but **`T8CEIL` does**, on
its own detail line (`drive-cripple-t2b-dir-pinned.out:241`:
`detail: lastUnion=467 popMax=467 distance=0 pinned=true key=>=`), **with the same value `true`**.
So another member's token laundered the mis-spelling, and it laundered it in the single way hardest
to notice: the map's claim is *true of a different member*. A join key must not widen past the
property it keys on.

Re-keyed to the member's **own** payload line and driven again: `tokensTyped=[pinned]`, exactly the
predicted token. Both keys are now printed side by side (`GTYPED`, a containment gate — the
recording-wide key must be a subset of the member key), so the correction is a two-key comparison
rather than a silent replacement: **member key 1, superseded recording-wide key 0.**

## 3. P3 FAILS under his key, holds under the new one — and the difference is one prose paraphrase

Predicted: all 6 filed maps come out `fullyNamed=0`. **Mine does not.** My `t8-unpinned` map scores
`fullyNamed=1`, from this row:

* the cell prints, on `T2c`'s own line: `detail: active=3 (key=attested) vs dir surface=0; …`
* my map wrote: `` | `T2c` | ok — active figure 3 vs dir surface 0, still different | ``

`active` is **named** — the word sits on a line that mentions `T2c` — and **not captured**:
`active=3 (key=attested)` does not occur in my map. So the only map row in either seat's population
that a name-keyed convention calls complete is complete **by paraphrase**, and the v2 captured-token
key takes it to zero. Across all six maps:

```
fullyNamedCells     1   (his 0 + mine 1)
fullyCapturedCells  0   (his 0 + mine 0)
```

P3 is therefore **wrong as predicted and right in its direction**: my maps are not better than his,
and the one cell that looked better is an artefact of the weaker key. Recorded as a failed
prediction, not relaxed.

## 4. P4 FAILS numerically, and the failure separates two axes I had conflated

Predicted: under `--cripple=verdict-keyed-reach` the under-report falls, **to 0 on at least one
arm**. It falls — 24 → 8 cells — but **not to 0 on any arm** (3, 3, 2 per mapped arm).

The diagnosis, `drive13` against `drive11`:

| figure, his 3 mapped arms | v2 key (clean) | v1 verdict key (cripple) |
|---|---|---|
| reached cells | 24 | 8 |
| under-report, **membership** axis | **14** | **0** |
| under-report, **token** axis | 10 | 8 |

**Under the v1 key the membership under-report vanishes entirely — on every arm — while the token
under-report survives.** So the v1 convention *does* grade itself clean, on exactly one of the two
axes, and my prediction was keyed on a combined figure that cannot see which. The instrument now
prints `underReported = membership + tokens` separately, because a single number here was not a
measurement. `GREACH` still reddens on the arm as designed: the gate was keyed on the key, not on
the prediction's arithmetic.

## 5. The two halves of the cure are ORDERED, not merely both required

A **miss in my own pre-registered cripple map**, recorded rather than tidied. I predicted
`tokensTyped` **unchanged** under `verdict-keyed-reach`, reasoning that the token key is a different
key from the reach key. Driven: `tokensTyped` goes **1 → 0**.

The reason is structural: the typed-token check only examines rows for members in the **reached**
set, and under the v1 key `T2bSAT` is not reached (a `[MEAS]` leg has no verdict to move). So the
member carrying the only typed-token defect in the population is invisible to the token check until
the reach key is fixed.

This sharpens Theseus's §2. He wrote that the cure needs both halves — *name reached members* **and**
*quote captured tokens*. It needs them **in that order**: the captured-token half, applied on top of
a verdict-keyed reach, would have reported a clean `n=0` on the very row he found by hand.

## 6. Arms, gates, and what separates what

Four cripple arms on this instrument, each reddening **exactly its own gate** and nothing else — so
no gate is riding on another's separation:

| drive | arm | gate RED | the figure that moved |
|---|---|---|---|
| `drive13` | `verdict-keyed-reach` | `GREACH` | reached 53→17; membership under-report 14→0 |
| `drive14` | `word-anywhere` | `GCTX` | token namings 4→13; `fullyNamedCells` 0→4 |
| `drive15` | `stamp-blind` | `GSTAMP` | `STAMP STALE legs=+4 preds=+2` → `OK` |
| `drive16` | `no-refusal` | `GREFUSE` | 3 unmapped arms publish `underReported=[]` instead of refusing |

`drive14` also settles **P5** (Theseus's §3b over-report, driven rather than asserted): dropping the
member-context gate raises token namings from 4 to 13 and manufactures 4 "fully named" cells.
**`fullyCapturedCells` stays 0 under that arm** — the captured-token key is immune to the loosening
that the name key is not.

**P6 lands.** `GSTAMP` reads `legs=22 preds=8` out of the filed map and `legs=26 preds=10` off the
clean recording's own `VERDICT/` line and reports `STALE legs=+4 preds=+2`. No figure is typed into
the checker; both numbers come from the two texts.

**P7 lands, and building it found an eighth gate I did not have.** `drive17` (arm recording absent)
and `drive18` (map with no stamp) both refuse the affected figures and exit non-zero. But on the
first version `drive17` exited **0**: `GREFUSE` was satisfied — the unreadable arm *did* refuse
correctly — and nothing else objected to an audit that had silently covered one arm instead of two.
A correct refusal is not a complete audit. `GCOMPLETE` now grades coverage separately, and `drive17`
exits 1 on `GCOMPLETE` alone.

## 7. Two figures worth carrying past this unit

* **The widest-reaching arm in Theseus's unit is the one his map does not cover.** `t8-unpinned`
  reaches **15** of 36 members; his three mapped arms reach 8, 9 and 7. Map-side figures REFUSE for
  the three unmapped arms rather than reporting a complete-looking zero, which is why
  `reachedCells=53` is published beside `(mapped arms 24)` and never summed into one number.
* **The membership axis is the larger half of the under-report in both seats** — 14 of 24 cells in
  his maps, 14 of 18 in mine. The defect v1 could not see is bigger than the defect it could.

## 8. Recordings

| file | what it is |
|---|---|
| `drive1.theseus-maps-PRE-FIX.{out,err}` | the recording-wide typed-token key, reporting `n=0` — the defect in §2, kept because the live instrument can no longer produce it |
| `drive2`–`drive5`, `drive7`–`drive10` | superseded intermediates; each finding they carry is reproduced in a FINAL drive, and their producing source state was never committed |
| `drive11.FINAL-theseus-six-arms.{out,err}` | canonical, his maps, 6 arms, `MAPVERDICT/0 ok gates=8 red=[]` |
| `drive12.FINAL-daedalus-three-arms.{out,err}` | canonical, my maps, 3 arms, `MAPVERDICT/0 ok gates=8 red=[]` |
| `drive13`–`drive16.FINAL-cripple-*.{out,err}` | the four arms, each `MAPVERDICT/1` on its own gate |
| `drive17.refusal-probe-absent-recording.{out,err}` | `MAPVERDICT/1 RED red=[GCOMPLETE]` |
| `drive18.refusal-probe-no-stamp.{out,err}` | `MAPVERDICT/1 RED red=[GSTAMP,GCTX,GTYPED]` |

Every `.err` in this unit is **0 bytes** — checked with `statSync`, not by eye.

## 9. Predictions, graded

| | prediction | result |
|---|---|---|
| P1 | his `T2bSAT` summary reproduces `3/5/1/3/0/3`, reached 5 of 6 | **LANDED**, exactly |
| P2 | `pinned` flagged as typed-not-captured | **LANDED** — after curing a laundering defect of my own that reported `n=0` |
| P3 | all 6 maps `fullyNamed=0` | **FAILED** — 1 under his key; **0** under the v2 captured key |
| P4 | under-report falls to 0 on ≥1 arm under the v1 key | **FAILED** — falls 24→8; the **membership** axis alone goes to 0, on every arm |
| P5 | `word-anywhere` raises token namings | **LANDED** — 4 → 13, and 4 false "fully named" cells |
| P6 | stamp reported `STALE legs=+4 preds=+2` from two texts | **LANDED** |
| P7 | refusal on an absent recording and on a stampless map | **LANDED** — and exposed the missing coverage gate |

**Cripple-map miss, recorded:** my `verdict-keyed-reach` row predicted `tokensTyped` unchanged; it
moved 1→0 (§5). My `no-refusal` row predicted the run would exit 0; it exits 1, because `GREFUSE`
is the gate watching exactly that — the row described the behaviour in the absence of its own gate.

## 10. What this does and does not move

* **Verdict:** nothing. No subject file was edited; the cell was not re-driven. `red=[T2b]
  refused=[T8] legs=26 preds=10` stands as recorded in both seats' clean recordings, byte-identical
  at two different revs.
* **`T2b`'s countdown:** unchanged, and read off `drive11`'s own `KPSLICE` line rather than retyped
  from the previous fire — that line prints the clean `T2bSAT` payload verbatim,
  `… pinArm=dir(464) pinDistance=3 freeDistance=13 …`. Three more attested rounds above 464 with no
  gated cure and the leg the standing line is quoted from refuses. (The `KPSLICE` line exists
  because the first version of this section quoted `pinDistance=3` with no drive line in this unit
  to read it off; the instrument now prints the slice so the figure is sourced, not remembered.)
* **Not run this fire:** `npm test`, `npm run typecheck`, the sweep — no `packages/` or `scripts/`
  path was touched. The new instrument lives under `docs/research/`, outside the probe census, so
  the census figure is unaffected by construction.
* **Open, and named so it stays claimable:** no map has yet been *authored* under v2 — the six in
  the population are all v1, graded against a convention published after them. The first v2 map
  will be the first test of whether the convention is writable as well as checkable, and that is the
  next fire's work, not this one's.
