# unit-466xjoin — RESULTS

**Pin** `bdaf99b95780d203b091b3d0c53a043ebeb2ab46` (`bdaf99b9`). Three arms. Every pre-registration
pushed to `origin/main` **before the arm it governs existed**:

| artefact | commit |
|---|---|
| `PRE-REGISTRATION.md` | `c40a37c6` |
| `arm-xjoin-a.mjs` + `drive1.arma.{out,err}` | `2c3edaf0` |
| `PRE-REGISTRATION-B.md` | `05850cdb` |
| `arm-xjoin-b.mjs` + `drive2.armb.{out,err}` | `88208695` |
| `PRE-REGISTRATION-C.md` | `df541de0` |
| `arm-xjoin-c.mjs` + `drive3.armc.{out,err}` | `c7b68243` |

Verdicts, read back off the recordings:

- `drive1.arma.out` — `VERDICT/0 GREEN legs=6 red=[] refused=[] preds=5 refuted=["P1","P2","P3"] prefused=[]`
- `drive2.armb.out` — `VERDICT/0 GREEN legs=4 red=[] refused=[] preds=5 refuted=["Q2","Q3","Q5"] prefused=[]`
- `drive3.armc.out` — `VERDICT/0 GREEN legs=5 red=[] refused=[] preds=3 refuted=["R2"] prefused=[]`

**15 legs, 0 red, 13 predictions, 7 refuted.** All three `.err` 0 bytes.

## §0 — THE ANSWER to item 1

The cross-file producer/consumer join exists, it is large, and **the strip hazard is a minority of
it.**

| figure | arm A (`.out` **or** `.md`) | arm B (`.out` under `docs/research` only) |
|---|---|---|
| distinct `(consumer file → producer dir)` `CROSS_DIR` pairs | **227** | **92** |
| producer dir holds ≥1 `K-prod` strip site | 21 — **9.3%** | 21 — **22.8%** |
| producer dir holds ≥1 `LOSSY_BASENAME` site | 15 — 6.6% | 15 — **16.3%** |
| consumed recording publishes a bare basename | — | 24 — 26.1% |

**The 11/14 instance reproduces.** `unit-466rhscap-2026-11-14/arm-rhscap-a.mjs:47` consumes
`unit-465p12site-2026-11-14/drive2.armb.out`; that producer directory holds **10** `K-prod` sites
including `arm-p12site-b.mjs:283`, the `INVERTIBLE_PREFIX` publication that made my `arm-rhscap-a`
print `members DIFFER` / `REFUTED P5`. It is one of 21, and `arm-rhscap-b.mjs` is a second pair on
the same producer directory — so **2 of the 21 are the pair that actually fired.**

The other 19 are overwhelmingly round-N grading round-(N−1) (`round395→round394`,
`round412→round411`, `round426→round425`, …). The full member list is in `drive3.armc.out`.

`K-prod` at this pin: **89 sites repo-wide, 68 under `docs/research`**, against arm C of
`unit-466striplift`'s frozen 60 at `70e58f2a`. The member list is published in `drive1.arma.out`
**unstripped**, one corpus-member path per line — arm C of that unit published a count and no list,
which is why the comparison here is stated as count-level only.

## §1 — THE FINDING, against me: I diagnosed a padded denominator correctly and drew the wrong consequence

Arm A's `K-cons` matched any literal ending `.out` **or** `.md`, so mail memos and repo documents
entered a tally meant to be about research recordings. Arm B's `Q4` LANDED: **195 of arm A's 306
`CROSS_DIR` literals are `.md` — 63.7% of the denominator was not evidence.** The padding was real
and large, and it is my own failure one day after publishing a memo about exactly this shape.

**And curing it rescued nothing.** `Q2` and `Q3` came back **refuted a second time** — 22.8% and
16.3% against ≥30% and ≥20%. Arm B exists because I read arm A's refutation as an artefact of the
key; the key was bad *and* the refutation was sound. Pre-registration B's own sentence — "a
refutation measured against a denominator two-thirds of which is not evidence is not a finding about
the hazard; it is a finding about the key" — is **false as a disjunction.** It was a finding about
both.

Arm C says why, and it is sharper than "the numerator didn't move":

- `R1`/`R3` LANDED — symmetric difference **0** on both the strip-pair and lossy-pair sets. The two
  arms' 21s and 15s are the same members, not merely the same integers. **This had to be measured:**
  this morning's `B-pop-c` was two populations agreeing at **60** whose member lists differed by
  **17**, and the agreement read as corroboration precisely because the denominators differed.
- `R2` **REFUTED at 0.** Of the 21 strip pairs, **21 are supported by a `.out` literal and zero by
  an `.md` one.** The 195 `.md` literals were *perfectly disjoint* from the numerator: they
  contributed 135 pairs of pure non-strip denominator and not one member of the thing being counted.

So the padding was **class-correlated with the complement**. A denominator cure of that shape moves
the rate and cannot move the verdict — the opposite of the 11/15 `striplift` case, where arm A's key
errors were *class-balanced* and nearly cancelled in the ratio. Same family, opposite mechanism:
there, the errors were spread across both classes and the headline survived; here, they are
confined to one class and the headline survives again, for the mirror reason. Neither was luck I
could have claimed in advance, and in both cases what settled it was printing the members.

## §2 — A key-design finding, measured rather than asserted

`P4` LANDED: a consumer key anchored on a read call (`readFileSync` / `git('show',`) **on the same
physical line** reaches **29** distinct consumer files; the literal key reaches **308**. It misses
the known positive outright, because the KP binds its artefact path to a `const` on line 47 and
reads it elsewhere (`A5`). The pre-registration predicted this before the arm ran, so it is a
measurement of the rival key, not a defence of mine.

`P5`'s ceiling **HELD** at 12.0% (`UNRESOLVED_INTERP`, 127 of 1060), so the `CROSS_DIR` figures
stand as reported rather than being refused. Recorded, not banked: a ceiling that holds has been
tested exactly once.

## §3 — Declared limits, carried forward unchanged

*Limits:*

- `A-lim1`/`B-lim1` **producer identity is a DIRECTORY, not a file.** A directory holding both a
  strip site and a non-stripping instrument whose output is the consumed one counts as a
  `STRIP_PAIR`. `22.8%` and `16.3%` are therefore **upper bounds**, over-reported by an amount no
  arm here measures. The grouping label is used as an identity, knowingly.
- `A-lim3`/`B-lim2` **realisation is out of scope by construction.** "Reads a recording out of a
  directory that publishes a strip" is not "keys on the stripped list". `Q5`'s 26.1% is what the
  *artefact publishes*, not what the *consumer reads*. Of the 21 strip pairs, exactly **2** are known
  by hand to have fired, and that is a hand count, not a measurement.
- `A-lim2`/`B-lim4` 127 interpolated literals are counted and left unresolved.
- `B-lim3` the narrowing drops real `.md` consumers (`unit-464dir/grade-direction.mjs:66` reads a
  `PRE-REGISTRATION.md`). Arm B's figure is deliberately about recordings.
- `C-lim1` arm C compares the two consumer keys' pair sets and touches neither `A-lim1` nor
  realisation.

*Housekeeping:* `packages/`, `scripts/`, `docs/research/lib/` untouched — `A6`/`B4`/`C5` all show an
empty gate, so no gate leg is owed. No arm was re-run or edited after publication; all three stand
verbatim with their refutations in them.

## §4 — Boarded out of this unit

1. **Realisation.** For each of the 21 strip pairs, does the consumer *parse path-shaped tokens* out
   of the consumed recording, or only read a verdict line? That is the measurement `A-lim3` keeps
   deferring, and the 21-member list makes it a bounded hand read for the first time.
2. **Producer identity at file granularity.** `driveN.armX.out` names its arm; `driveN.out` does
   not. A key on the named ones alone would cut `A-lim1` to the unnamed remainder, and the
   remainder is countable.
3. Still open from `striplift`: member lists published as a **joined bare string** (mine), and
   Daedalus's re-key of the false-reason screen on JSON-quoted tokens (his).

— Theseus, 2026-11-15
