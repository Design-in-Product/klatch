# unit-464nomoved — pre-registration

**Seat:** Theseus · **Fire:** 2026-10-30 STOP · **Model:** claude-opus-5
**Baseline rev:** `d668a00795d09d7e83d57eb18a94a7b2e48578b2` (`baseline.rev`)
**`git status --porcelain -- packages/ scripts/` at open:** empty, 0 bytes (`baseline.gitstatus.txt`)

Filed and pushed **before the cure exists**. The subject is the one item
`daedalus-to-theseus-…-the-re-key-fixes-attribution-not-the-count-2026-10-30.md` §7 routed back
here: the `` `T9 moved=0` `` substring in
`docs/research/unit-464v21map-2026-10-30/V21-MAP.md:63`, which under the `GTYPEDDEF` gate my own
§3 asked for now costs the whole red on the first map ever authored under v2.1.

## What is NOT in doubt, and what therefore is not a prediction

Verified by tool call this fire, before any prediction below was written:

* `grep -rn 'T9 moved=0' docs/research/unit-464v21map-2026-10-30/` → **2 hits**, `V21-MAP.md:63`
  and `RESULTS.md:61`. The map hit is the one the checker can read (`--map=`); the `RESULTS.md`
  hit is this unit's own quotation of that row and is read by nothing.

So "the substring exists where he said" is a **fact**, not a prediction. What is in doubt is
whether removing it is sufficient, and whether it is *only* sufficient — i.e. whether it moves
figures beyond the typed-token ones.

## Not a blind reproduction — declared

Daedalus's §1 table and his `drive15` already report the answer to `G1` and `P3`
(`drive1 exit=1 red=[GTYPEDDEF]`, `drive15 exit=0 red=[]`). **I have read that memo.** These are
therefore *reproductions under my own argv on the committed file*, not blind predictions, and are
declared as such so neither lands as a result it is not. His `drive15` wrote a scratch copy
(`V21-MAP.nomoved.md`) in his unit; nothing in the tree was cured, and `--map=` has never been
pointed at a committed map that passes `GTYPEDDEF`. That gap is what this unit closes.

`P4`/`P5` are **not** answered anywhere in his memo and are the live content here.

## G1 — the gate leg

**`G1`:** the committed, unedited `V21-MAP.md` under the checker at this rev exits **1** with
`GTYPEDDEF` in the red set.

If `G1` does not hold, the baseline is not reddened and `P3`'s green is a green against nothing —
every prediction below is void and gets reported as unmeasured rather than as landed. The gate is
keyed on the **baseline recording**, not on the cured one, and not on my expectation of either.

## Predictions

**`P2` (reproduction, declared):** the baseline names exactly **1** typed token and it is
`t8-unpinned:moved`. Not 2 — his re-key moved `N` off `T9`, so a baseline printing `[N,moved]`
would mean the re-key is not in the checker I am driving, and `P2` would be refuted by the
*checker's* state rather than by my map's.

**`P3` (reproduction, declared):** with that one substring replaced by prose and **nothing else
in the file changed**, the drive exits **0** with `red=[]`.

**`P4` (live):** the cure moves the typed-token figures **and nothing else**. `fullyNamed`,
`fullyCaptured`, `underReported` RAW and `underReportedArmCaused` are **identical** between
baseline and cured.

*Why this can fail, and in which direction:* his §2 found the pre-fix key wrong in **both**
directions at once — a contaminating line inflated `fullyNamed` and deflated `underReported` on
the same member. The line I am editing is a `T2` row that **mentions `T9`**, so under the live
union key it is one of the lines that can attribute tokens across members. Deleting a
`name=value` span from it could plausibly take a *credit* with it and move `fullyNamed` 12 → 11.
If that happens, the cure is not figure-neutral and the prose rule of §3.4b has a cost nobody has
priced.

**`P5` (live):** `linesSubjected` and `unionBearing` — the two denominators he added this fire —
are **unchanged** by the cure. The line survives the edit and still mentions `T9` in prose, so a
key on *lines* should not move. Refuted if either is keyed on `name=value` spans rather than on
lines.

## Mutation hygiene

The drive **asserts the target before and after**, and refuses rather than reporting:

1. the substring is **present** in the committed file before the edit (else the cure is a silent
   no-op and `P3`'s green is vacuous);
2. it is **absent** after (else the edit did not land and the cured drive is a second baseline);
3. the before/after contents differ on **exactly one line** (else "nothing else changed" is an
   assumption rather than a measurement).

Any of the three failing is a **FATAL** with a non-zero exit, not a skipped prediction.

## Stop condition

The cell is not edited and not driven this fire. `T2b`'s countdown is **not re-read** and so is
not restated. Every path written is under `docs/`. Nothing here moves xian's stop/re-scope
verdict.
