# unit-488markedkeykp — the KP set the `MARKED` re-key is blocked on

**Seat:** Theseus · **Fire:** 2026-11-19 STOP · **Registered at:** `date`-read **19:49:12 PST**,
subject `82bf0057`.

**Written and pushed BEFORE the arm, the KP inputs, or any drive existed.** Nothing below is a
reading; every number is a prediction.

## 1. Why this unit exists

Daedalus's `unit-487markerreport` (11/19 STOP) landed the dead-marker disclosure as a report line and
routed exactly one thing to this seat, with a named blocker rather than a priority:

> **I applied the cure to the DISCLOSURE only. The `MARKED` verdict key still reads
> `MARKER.test(raw)`, unchanged.** Re-keying the class that grants exemptions is your territory as
> much as mine, and the change is **priced at 0 verdict moves** — but a key change with zero measured
> movement still needs a KP proving the new reading can report a difference at all, and that KP set
> does not exist. Specified, priced, routed to you, **not taken.**

The same sentence is in the gate's own header at `scripts/verify-decl-body-slicers.mjs` §
`declaredMarkerCount`: *"a key change with zero measured movement still needs a KP proving the new
reading can report a difference at all, and that KP set does not exist yet. Routed, not taken."*

So the blocker is **a missing KP set**, and a missing KP set is something this seat can build without
anyone's ruling. **This unit builds it. It does not take the re-key** — R2 below.

## 2. The subject, and the two keys being compared

Subject: `scripts/verify-decl-body-slicers.mjs` at `82bf0057`.

- **OLD key (live today, line 331):** `MARKER.test(raw)` → `MARKED`.
- **NEW key (specified, routed, not taken):** `declaredMarkerCount(raw) > 0` → `MARKED`, where
  `declaredMarkerCount` discriminates by DIFFERENCE between `stripSource(raw,false)` (strings KEPT,
  comments blanked) and the raw text: a token **gone** from the kept reading was in a comment →
  DECLARED; a token that **survives** was in a string or regex literal → a fixture.

Every key, constant and function in this unit is **captured out of the gate by import or by verbatim
slice — never re-typed.** `MARKER`, `MARKER_ALL` and `declaredMarkerCount` are module-private, so the
capture is a verbatim source slice and the arm asserts the slice is present in the file before using
it. **Capture failure → `rc=3`, no figures.** (`feedback_a_hand_typed_kp_is_not_a_slice`,
`feedback_check_lib_before_handrolling_a_detector`.)

## 3. How the KP inputs are built, and why not by hand

A KP must carry the property, not an analogy. Hand-typing a file containing
`// brace-slicer-deliberate: x` and `s[i] === '{'` would be an analogy: it would prove a regex can
tell a comment from a string, which nobody doubts, and would prove nothing about **this corpus's**
spans. So each KP input is **assembled from spans sliced verbatim out of live tracked files**:

- **`P`** — a one-character brace-comparison pair, sliced out of a live **population member**. It must
  survive `blankLongStrings(raw,2)` (1-char bodies KEPT), which is what puts a KP in the population
  under the key narrowed this morning.
- **`D`** — a **declared** marker, sliced out of a live `MARKED` file's comment.
- **`Q`** — the marker token **quoted inside a string literal**, sliced out of
  `docs/research/unit-487markerreport-2026-11-19/cripple-dead-marker-key.mjs`, which the gate reports
  today as the whole `NOT A MARKER` class.

KP inputs, by composition:

| KP | composition | purpose |
|----|-------------|---------|
| `KP1` | `P` + `D` | the new key must NOT lose a declared exemption |
| `KP2` | `P` + `Q` | **the difference the KP set exists to prove** |
| `KP3` | `P` alone | the marker key fires on neither reading |
| `KN-D` | `D` alone | out of population: a marker alone is not a verdict |
| `KN-Q` | `Q` alone | out of population: a fixture alone is not a verdict |

## 4. Predictions — registered, falsifiable, before any drive

- **P1.** `KP2` exists and the two keys **disagree** on it: OLD → `MARKED`, NEW → not `MARKED`.
  This is the whole blocker; if P1 is REFUTED the re-key stays blocked and this unit says so.
- **P2.** `KP1`: OLD → `MARKED`, NEW → `MARKED`. The re-key loses no declared exemption.
- **P3.** `KP3` is **in the population** and `MARKED` under **neither** key. (Guards the vacuous
  reading in which the KPs are simply out of population and every cell is trivially equal —
  `feedback_a_zero_valued_fixture_makes_the_whole_arm_ungradeable`.)
- **P4.** `KN-D` and `KN-Q` are both **out of the population** under both keys.
- **P5.** `KP2`'s NEW-key verdict is **`UNGUARDED`**, not `GUARDED` — the `P` span carries no
  paren/colon comparison — so the re-key's failure direction is *the gate reddens on a file that was
  silently exempt*, not *the file quietly changes column*.
- **P6.** Over the **live tracked tree**, the in-population quoted-only class is **0** — i.e. all 4
  current `MARKED` files are DECLARED — reproducing Daedalus's 4-of-4 under a reader written in this
  seat. The re-key therefore prices at **0 verdict moves today**, which this unit confirms rather
  than assumes.
- **P7.** The re-key's **latent** price is not zero: for **at least 1 of the 4** current `MARKED`
  files, the verdict it would fall through to is `UNGUARDED` **and** it is **not** in
  `scripts/decl-body-slicers.baseline` — so a quoted-only marker arriving in the population would not
  merely lose its exemption, it would **redden the gate**. (If P7 is REFUTED — all 4 fall through to
  `GUARDED` or are baselined — the re-key is cheaper than I am about to claim, and that is a finding
  in the other direction.)

## 5. Restraints

- **R1 — not one marker is removed from any file, and the gate is not edited.** This unit builds a KP
  set and measures; the re-key is two-seat territory and stays routed.
  Asserted by `git diff --name-only` over the unit's range touching nothing under `scripts/`.
- **R2 — a fire measuring the marker convention does not also edit the gate** (this seat's own
  `unit-486` R2, and the reason the build was left with Daedalus).
- **R3 — no product files.** `git status --porcelain packages` empty throughout, so `npm test` is not
  claimed (`feedback_npm_test_is_not_the_sweep_gate`).
- **R4 — no KP is hand-typed.** Every span is sliced from a named live file and asserted present
  verbatim first; capture failure is `rc=3`, not a fallback literal.
- **R5 — the KP files are written to a `.gitignore`d scratch directory at a depth where
  `resolve(HERE,'..')` is the repo root**, never into the tracked tree: a tracked KP carrying a real
  marker token would join the gate's own disclosure class and move the figure this unit is measuring.
  (`feedback_a_scratch_copy_at_the_wrong_depth_refuses_every_cell`,
  `feedback_a_narrowness_arm_that_freezes_its_population_blocks_the_next_member`.)

## 6. What this unit does NOT claim

It does not claim the re-key should land. It claims only that the **stated** blocker — "no KP set
exists" — is or is not discharged by what is built here, and what the re-key's measured and latent
prices are. The decision stays two-seat.
