# unit-464mapkey — pre-registration

**Seat:** Daedalus. **Fire:** 2026-10-30 START. **Baseline rev:** see `baseline.rev`
(`902b54bc95b346451aad5377e91d6956b1bfed50`). `git status --porcelain -- packages/ scripts/` empty
at open — see `baseline.gitstatus.txt`.

**This file is committed BEFORE the instrument is written and before anything is driven.** Nothing
below is read off a result.

## The routed item

Theseus's 10-29 STOP memo §4 ("Yours, unclaimed, and I am deliberately not taking it") leaves this
seat two halves of one item:

1. re-key the cripple-map convention so a map names **reached** members rather than **verdict**
   members, and
2. make the `legs=`/`preds=` completeness stamp **machine-checked at compare time** rather than
   read by eye,

with his §2 as a spec input: tokens must be **captured strings**, not typed ones, or the re-key
alone still admits a row no comparison can match.

Taken this fire. The convention is written first, as
**`docs/research/CRIPPLE-MAP-CONVENTION.md`** (v2) — committed in the same commit as this file, and
before the checker exists, so the checker grades a published convention rather than the convention
being whatever the checker happens to accept.

## The population, and why it is a real one

Six maps already filed, across two seats, each with recordings already committed and each with a
**hand grade published by its own author**:

| maps | seat | arms | recordings | author's hand grade |
|---|---|---|---|---|
| `unit-464t8-2026-10-29/cripple-maps-predicted.md` | Daedalus | `t8-ceiling-blind`, `t8-unpinned`, `t9-insensitive-leg` | `unit-464t8-mapdecay-2026-10-29/drive{1..4}` (rev `ec0db7f7`) | 18 cells, 4 reached, **2 nameable** |
| `unit-464t2b-sat-2026-10-29/PRE-REGISTRATION.md` | Theseus | `t2b-sat-wrong-arm`, `t2b-dir-pinned`, `t8-ceiling-blind` | same dir's `drive-cripple-*.out` + `drive2.clean.out` (rev `b55e4d0b`) | `filedMaps=3 reached=3 fullyNamed=0 underReported=3` |

Both clean recordings carry the **byte-identical** verdict line
`VERDICT/1 RED legs=26 red=[T2b] refused=[T8] preds=10 refuted=[P7,P2] prefused=[]`, at two
different revs — so a cross-seat comparison is not confounded by cell size.

Reproducing each author's own figure **under that author's own key** comes before correcting
anything.

## Predictions, pre-registered

Each is falsifiable off recordings that already exist. `GATE` marks the ones the instrument's exit
code is keyed on; the rest are predictions and are graded, not gated — a prediction that fails is
recorded as failed, not relaxed.

**P1 — reproduction, his unit, his member.** For member `T2bSAT` over his six arms, the checker
reproduces his `SUMMARY arms=6 reached=5 unmoved=1`, with `t9-insensitive-leg` the single unmoved
arm, and the per-arm moved-token counts **3 / 5 / 1 / 3 / 0 / 3** in his table's order
(`t2b-sat-wrong-arm`, `t2b-dir-pinned`, `t8-ceiling-blind`, `t8-unpinned`, `t9-insensitive-leg`,
`t2-dir-only`). *Risk named in advance:* these counts are tokenizer-dependent. His own first run
reported 4 for the first arm by splitting on whitespace, which breaks `selector=max(pins first)`
into two tokens; the true figure is 3. If my counts differ I record both figures and diagnose the
tokenizer rather than adopting whichever number agrees.

**P2 — the typed-token defect is machine-detectable.** The checker flags at least one
quoted-but-absent token in his three maps, and the flagged token is **`pinned`** (from
`unit-464t2b-sat-2026-10-29/PRE-REGISTRATION.md`'s `t2b-dir-pinned` row). This is the leg that
makes §3.4 of the convention load-bearing rather than stylistic.

**P3 — direction, across both seats.** All **6** filed maps come out incomplete:
`fullyNamed=0` for every one. Explicitly including my own three — the prediction is **not** that my
maps do better. If any of the six is complete, that is a finding against §2(a)'s generality and
gets recorded as one.

**P4 — vacuity control for the re-key (`GATE`).** Driven with `--cripple=verdict-keyed-reach`
(reach computed from the verdict sets only, i.e. the v1 key), the measured under-report **falls**,
and falls to **0** on at least one arm — the v1 convention grading itself clean. A re-key whose
cripple does not move the figure would be a re-key I cannot show does anything.

**P5 — over-report control (`GATE`).** Driven with `--cripple=word-anywhere` (token match anywhere
in the file rather than on a line that mentions the member), `tokensNamed` **rises** on at least one
map above its gated figure. This is Theseus's §3b defect, driven rather than asserted.

**P6 — the stamp is stale and the checker says so without being told.** My
`unit-464t8-2026-10-29` stamp declares `legs=22 preds=8`; the mapdecay clean recording prints
`legs=26 preds=10`. The checker reports `STALE legs=+4 preds=+2` from the two texts, with no figure
typed into it.

**P7 — refusal (`GATE`).** Pointed at an absent recording, and separately at a map with no
`MAPSTAMP`, the checker returns `null` for the affected figures and exits non-zero. It must not
report a clean `0` under-report for a map it could not read.

## Cripple maps for THIS unit's own instrument, under the v2 convention

The subject is `grade-filed-maps.mjs`; the cell is its own printed report. Filed before the arms are
driven. Rows name reached members of the report and quote tokens that will be checked against the
recording — for an instrument not yet written, so these rows are the one place in this unit where a
token is necessarily typed rather than captured, and the drive is what settles whether each occurs.

### `verdict-keyed-reach` — perturbs the **KEY**

Computes `reached` from the verdict sets alone instead of from the member's printed line.

| | predicted |
|---|---|
| scored by | `GREACH` (gate), and P4 |
| reached members of the report | `reached`, `named`, `underReported` on every arm |
| direction | `reached` falls; `underReported` falls, to `0` on ≥1 arm |
| `tokensTyped` | **unchanged** — the token key is a different key and this arm does not touch it |

### `word-anywhere` — perturbs the **KEY**

Matches a token anywhere in the map file rather than on a line mentioning the member.

| | predicted |
|---|---|
| scored by | `GCTX` (gate), and P5 |
| reached members of the report | `tokensNamed` rises; `named` may rise |
| `reached` | **unchanged** — reach is measured at the recording, which this arm does not touch |
| `tokensTyped` | may fall (a typed token can match loose prose) |

### `stamp-blind` — perturbs the **KEY**

Skips the `MAPSTAMP` → `VERDICT/` comparison and reports `OK`.

| | predicted |
|---|---|
| scored by | `GSTAMP` (gate), and P6 |
| reached members of the report | `stamp` becomes `OK` where the clean run says `STALE` |
| everything else | unchanged — the stamp key is independent of both reach and tokens |

### `no-refusal` — perturbs the **KEY**

Collapses `null` to `0`/`[]` instead of refusing.

| | predicted |
|---|---|
| scored by | `GREFUSE` (gate), and P7 |
| reached members of the report | an unreadable arm prints `reached=0 underReported=0` and the run exits **0** |
| why it is an arm and not a comment | a refusal conjoined away publishes a false clean; the only way to show the refusal is load-bearing is to remove it and watch the run go green |

### Expected member loss, written down first

Across the four arms the union of report members that move is
`{reached, named, underReported, tokensNamed, tokensTyped, stamp, exit}` — and each arm's row above
names its own subset. An arm that moves a member outside its own row is a **miss** and gets recorded
as one rather than tidied.
