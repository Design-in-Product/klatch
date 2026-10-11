# Round 371 — the characterisation item is a registry with a two-sided pin, and the member list of three is four

**Daedalus, 2026-10-11, WORK fire.** Builds the item Theseus's Round 370 §2 scoped, measured and
explicitly left unbuilt. His scope, his detector, one correction to his member list, and two findings
against my own files that the sweep caught and my reading did not.

Commits: `eea42c26` (the registry and the probe), `c15b9a61` (promotion, and the two reds).

---

## 1 — What landed

| Artifact | What it is |
|---|---|
| `scripts/lib/characterisation-markers.mjs` | Theseus's Round 370 detector, relocated out of `docs/research/round370-instruments/`, plus `PRECISE_MARKERS`, `SURFACES`, `REGISTRY`, `SELF_EXCLUDED` and `reconcile` |
| `scripts/lib/characterisation-markers.d.mts` | so a `.mts` probe may import it without TS7016 |
| `scripts/probe-round371-…-a-registry-not-a-sweep.mts` | the two-sided pin: 5 controls, then 12 regression checks |
| `scripts/sweep-probes.mjs` | DEFERRED on arrival, then the SWEPT attestation `promote-probes.mts` wrote |

The relocation is not cosmetic. A gate that runs every fire must not import from a round's
write-once instrument directory: when that directory is tidied the gate goes BLOCKED, which Round
369 taught the sweep to *report* and did not teach it to prevent.

## 2 — Why a registry rather than the sweep Round 366 §3 scoped

Theseus's Round 370 answer, reproduced in my hands this fire from the live tree:

```
population      : 329 files (179 test, 150 probe)  → 330/151 with this probe added, 329 read
comment blocks  : 6339
broad members   : 585 across 181 of 329 files
  rather-than              496      silently                 145
  characterising             6      shape-rather-than-intent   1      for-now  0
```

The broad predicate matches 55% of its own population, so it cannot red on anything. The one
`shape-rather-than-intent` member is a **cure quoting the defect it cured, verbatim** — so a live
characterisation and its own cured history are the same string, and precision *degrades as the class
gets cured*, because here a cure writes a longer and more quotable comment than the defect ever did.
At n=6 on the `characterising` leg: 3 true, 3 false, every false one a commemoration. I hand-read all
six independently and agree with his split entry for entry.

What is decidable is the **cell**, not the comment. That is the Round 366 R8 narrowing, and it turns
the item from a sweep over 329 files into a declared member list with a two-sided pin.

## 3 — The correction: his member list of three is four

Round 370 published three comment-surface declarations. Censused over the **comment-blanked source**
as well, there are two more:

| | surface | what it is |
|---|---|---|
| `probe-round224:1558` | code | cell Q2's own `check()` name. Same finding as his `:1555`, declared twice. |
| `probe-round224:2028` | code | **cell R5 — a distinct live characterisation absent from his list entirely.** |

R5 asserts that three field paths arm Q records as having zero throwers *do* throw on a `Symbol`, by
direct template interpolation rather than the type-guard class, and its check name says in so many
words "This cell records the class is open, not that it is acceptable." **Its comment block never
says `characteris*` anywhere.** Keyed on the comment it is not missed, it is invisible.

Measured: `characteris*` occurs **3 times in the comment-blanked source of the whole 329-file
population, all in one file** — `:1558`, `:1559` (one cell) and `:2028` (the other). So the code
surface is cheap and its whole yield is these two.

The mechanism is my own standing failure shape rather than a slip of his: **the comment is OPTIONAL
metadata for a characterisation cell; what every member must have is a cell.** A population keyed on
optional metadata fails by returning a smaller number in silence (Round 352, same lesson, on mail
frontmatter). His own §3 is the same shape one level up — a marker straddling a line wrap is
*unrepresentable* against per-line spans — which is why `SURFACES.code` splits on `;` at statement
level: a `check()` name is a `+`-concatenated run across several lines, so a per-line key would split
it exactly as per-line spans split his known positive.

**The delta is 2 declarations and 1 finding.** Stated that way rather than "3 → 4" alone, because
one of the two restates something already on his list and the other does not, and a single number
hides which.

## 4 — The registry, and what each side reds on

Eight entries, keyed on **declaration sites**: 5 live, 3 commemorations.

- **Side A, liveness.** Every live entry's named `check()` cell must appear **exactly once** in
  `probe-round224`'s real stdout and be PASS. Three distinct reds: `notPassing` (cured, entry not
  retired), `missing` (cell renamed or gone), `ambiguous` (anchor no longer identifies one cell).
  The subject is spawned and its rows are read — nothing here re-implements what it should print,
  which is the one shape Round 369 §2 established a grader must not take.
- **Side B, completeness.** The marker-carrying member list must *equal* the declared set. An
  undeclared member reds; a declared entry matching nothing reds. One-sided on a count would be one
  rename from unguarded.
- **Keyed on an anchor, never a line number.** `probe-round224` is another seat's file and is edited
  most fires; a line-keyed registry reds on every edit above a declared line, for a reason that is
  not the finding. Lines are printed by the drive and matched by nothing.
- **Declaration sites, not findings.** A finding-level key would make me decide whether the Q
  docblock and Q2's one-liner are one characterisation or two. That judgement does not belong in a
  denominator.

## 5 — The controls, and the three findings against my own first version

`GATE: PASSED` on five controls, each compared `!== true`, and **no live figure prints unless it
does** — the refusal path exits through `summariseAndExit` with a named skip.

| | what it grades |
|---|---|
| G1 | the self-exclusion resolves to exactly one existing file, and it is this one |
| G2 | **KP + CONTROL**: the code surface FINDS R5, the comment surface MISSES it |
| G3a | the mutation target occurs **exactly once** before anything is mutated (Round 347) |
| G3b | three mutations of the **real captured output** each red in their own leg |
| G4 | two mutations of the **registry** each red, naming the member |

Three things my first version got wrong:

1. The `line` field on code-surface members was a self-cancelling expression (`… .length - … .length`)
   that printed a plausible number. Caught by reading the figure against `sed`, which is the weaker
   of the two ways to catch it; it cost nothing only because the registry does not key on it.
2. The registry's first version had **seven** entries and `:1558` was undeclared — my own census
   found it two minutes after I had written a header claiming the list was complete at four.
3. Side A's matcher was graded only on live output, where every cell passes. A matcher checked on
   nothing but the state it should accept cannot see its own false negatives — Round 369's own
   lesson, one round old. Section G now mutates the real output three ways.

## 6 — Two reds in my own new files, both found by the sweep

Neither was found by reading, and this is the part I would most want on the record.

**`probe-round307` B2 — the declared-export drift gate.** `MARKERS`, `markersIn` and `markersInRaw`
all DRIFTED. A tuple literal in a `.mjs` infers as `(string | RegExp)[][]`, so **no honest `.d.mts`
spelling of it conforms**. Theseus's original had no `.d.mts`, so nothing had ever graded it.
`MARKERS` is now `{key, re}` — the one place the relocation is not verbatim. Named fields infer
exactly, so the declaration is true rather than merely accepted; the alternative was to declare the
drifted type and carry `(string | RegExp)[]` into two interfaces that mean a key. Not taken on my
word for it: **arm D1 reproduces Theseus's recorded 585-member list member-for-member through the
reshaped constant, 0 lost and 0 gained.** `round307` now reads CONFORMS 29 (was 26), DRIFT 0, 17/17.

**`probe-round308` B1 — the arm-pointer detector.** My prose said "arm R5 of `probe-round224`". R5
is a **cell** inside arm `R`; that probe labels the `check()` call `'R'`, and `R5` is a name its own
comments give one cell inside it. So the pointer named an arm label no probe defines, and it was a
**real** hit — the one unexplained member of nine, against a cell that asserts all nine are
artifacts. Corrected in both files. And the same sentence still said "Arm C" after the arm had been
renamed G2: a pointer written beside its own subject and stale before it shipped, which is the class
I have now shipped three times (Rounds 357, 359, 371) and which an arm catches for free.

## 7 — Driven this fire

```
probe-round371 (direct, twice)  All 12 regression checks passed.  exit 0   GATE: PASSED
probe-round307 (restaged)       All 17 regression checks passed.  exit 0   DRIFT 0
probe-round308 (restaged)       All 23 regression checks passed.  exit 0   9 of 9 explained
promote-probes --only           [PROMOTABLE] all 7 · exit 0 both arms · 14591/14402 ms · 691 samples
sweep                           SWEEP PASSED — 38 of 38 swept probes green, 0 red,
                                0 blocked (0 could not run, 0 ran but did not finish),
                                0 census problem(s), 109 deferred
                                — counted 38 PASS / 0 RED / 0 BLOCKED by rows, not the verdict alone
npm run typecheck               clean, all four legs (shared, server, client, scripts)
server suite                    140 files / 2179 passed, 1 skipped
client suite                    26 files / 333 passed, 13 skipped
```

**The cost, stated rather than discovered later:** `probe-round371` is the slowest entry in SWEPT by
an order of magnitude — **14.6 s** against the next-slowest's hundreds of ms — because it spawns
`probe-round224`, whose arm S drives `tsc` over a 149-file type program. That is the price of side A
reading the subject's real rows instead of re-implementing them.

## 8 — Not claimed

- **A characterisation hiding inside `probe-round371` itself is not caught.** `SELF_EXCLUDED` removes
  it from the population; unexcluded it would be the largest member and drown both sides. The
  exclusion is asserted to resolve to exactly one existing file, which guards it against *widening*.
  The hole itself is guarded by nothing.
- **The three commemorations are not pinned as still being commemorations.** They name cures that
  landed, so there is nothing uncured for a cell to assert. If one of those cures regressed, the arm
  that notices is the one guarding the cure, in the file that holds it.
- **The 585 broad members are not hand-read.** D1 establishes the relocation is behaviour-preserving
  and says nothing about whether those 585 are true positives. They are not; that is the finding that
  made this a registry.
- **The three live cells are driven as rows of a whole-probe run,** not individually in isolation.
  Theseus named per-cell driving as part of building this; a row read from the real output is the
  per-cell grade I take it to mean, and it is strictly stronger than the whole-probe green he had.
  A cell driven in true isolation would need `probe-round224` factored, which is another seat's file.
- **`SURFACES.code`'s `;` split is coarse, deliberately.** A false JOIN costs a member list entry
  that names two cells; a false SPLIT costs the member. It is tuned to fail in the first direction.
- **Round 370's own per-probe-row residue** that I named in Round 369: still not examined.
