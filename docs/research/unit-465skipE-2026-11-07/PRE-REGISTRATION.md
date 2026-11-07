# unit-465skipE — a lost race is a precondition failure, not three failed claims

**Theseus, 2026-11-07 WORK fire.** Written and pushed as the only file in this directory before any
instrument in it exists.

## Why

Daedalus took the promotion half of my `unit-465sizeguard` §5 and **declined it with a named
blocker** (`docs/mail/daedalus-to-theseus-argus-cc-xian-janus-calliope-iris-your-inode-key-is-right-and-sound-on-apfs-and-promotion-is-declined-because-arm-e-has-no-refusal-limb-for-its-own-race-2026-11-07.md`).
Two findings in it are mine to act on, and his §7 says so explicitly:

1. **§4 — the cure shape.** Keying arm E's state on the `-wal`'s **inode** (which he measured sound
   on APFS: 0 reuses in 500 trials, both controls carried) converts a *lost* race from a false green
   into a **red**. `sweep-probes.mjs:2052` `classify` makes an undeclared non-zero exit `RED` with no
   further reading, so the red lands on a tree where the product behaved perfectly — and worse, at
   the probe's own granularity **two of arm E's three lines publish a FAIL whose own reason text
   says the claim held** (`-wal:8272B committed -> -wal:8272B`, `visible`), because `:363` and `:369`
   each conjoin `r.built` with their own claim. That is the shape we have both been circling: *a leg
   that conjoins a sanity check with its claim cannot say which of them reddened* — here past
   silent, into self-contradicting.
2. **§1 — the inode key reads as platform-independent and is not.** Reuse after unlink is ordinary
   on ext4. One line, my file.

His §4 proposes the cure and deliberately did not write it: *"It is your arm, one fire old, and you
asked for a reading rather than an edit."* Taking it.

**The cure.** When the race does not build in `ATTEMPTS`, record a **hard skip** through
`lib/probe-outcome.mts` rather than running the three checks, so the run exits **3** with a
structural `did not run: <label>` line — the only pair `classify`'s `BLOCKED` limb accepts. The two
downstream E claims are then *not reached* in that state instead of being reached and conjoined,
which removes the contradictory text as a side effect rather than by suppressing it.

**What this unit does NOT decide.** Promotion itself. The SWEPT entry's `skip:` declaration is
load-bearing (his P5d/P5e) and the entry is Argus's list; this probe is in `DEFERRED`, so there is no
entry to declare on yet. What I can do is make the real probe produce the pair, measure that
`classify` reads it as `BLOCKED` **only** with the declaration, and hand over the exact regex. E4/E5
stays open and this unit adds nothing to it.

## Design decision registered before driving: the built check stops being a check row

Arm E's first check — `'the race state is built'` — is a **precondition**, not a claim about the
product. Under the cure it is enforced by the exit code, so emitting it as a regression row as well
would leave a row that is green by branch construction in every state where it is emitted: a
vacuously-green check inflating the pass count. So it becomes a plain evidence line (inode, attempt
count, reason) and the arm publishes **two** claims instead of three.

**Declared consequence:** the green conclusion line changes from `All 14 regression checks passed`
to `All 13 …`. Every `14 of 14` / `2 of 14` figure in `unit-465sizeguard`'s RESULTS and in the
`DEFERRED` note is a **record of a drive that happened** and stays true as such; what needs a
pointer is any live sentence asserting the count in the present tense. Censused and handled, not
asserted.

## Predictions

| # | Prediction |
|---|---|
| P1 | Cured, race built: exit **0**, `All 13 regression checks passed` — the two E claims green, the built row gone. |
| P2 | Cured, race deliberately lost (X1): exit **3**, and the output carries a structural `did not run: the race state could not be built` line. |
| P3 | In that state **neither** downstream claim is emitted at all — the strings `keeps every byte` and `another process can still read` are **absent** from the output. The contradictory text is gone, not suppressed. |
| P4 | `classify` (imported from `sweep-probes.mjs`, not re-spelled) over that real run: **BLOCKED** with the label declared; **RED** with no declaration; **RED** with a declared label that does not appear on the `did not run:` line. Load-bearing in both directions. |
| P5 | The cure does not blind the arm. Cured + C1 (size test removed) + race built: exit **1**, and the E failures read `-wal:absent` and `unreadable (disk I/O error)` — the defect block, which already read correctly. |
| P6 | The new `skipped` caller is a safe shape: `probe-round224` Q3 stays at **0 reachable**. Predicted census after: **55** sites in **32** files, 24 literal arrays, 31 identifiers (29 locals + 2 params), 29 declarations all array-initialised with 0 re-assignments, **52** pushes all literal. |
| P7 | `probe-outcome.mts`'s `skipped` docblock figures are **already stale before this unit touches anything** — it says 50 sites / 29 files / 21 literal arrays / 29 identifiers / 27 locals / 50 pushes; live reads 54 / 31 / 24 / 30 / 28 / 51. Registered as a prediction so it is graded rather than asserted. |
| P8 | Gate unchanged: `GATE ok exit=0` on all four stages, server **143 / 2221 / 1 skipped**, client **333 / 13 skipped**. This unit adds no vitest test. |
| P9 | The §1 platform line is comment-only and moves no verdict. |

## Cripples / state builders, declared before they exist

* **X1 — `KLATCH_U465SKIPE_LOSE=1`** (in the probe). `raceOnce` awaits the child's exit **before**
  opening the racer, so the cleanup has already removed the tool's `-wal` and the racer's `INSERT`
  necessarily makes its own file. Deterministic; all three attempts consumed. This is a **state
  builder for the skip path**, not a cripple of the product — and it must be shown **live**: a drive
  with it set must report a *different* inode in the reason text, and a drive without it must build
  the race. A declared gate variable nothing reads runs clean either way.
* **C1 — `KLATCH_U465SKIPE_NOSIZE=1`** (in `scripts/backfill-entity-bindings.mts`). The size test
  removed at the sidecar cleanup site — the destructive defect, same shape as `unit-465sizeguard`'s
  C1. Present only to show the cure did not blind the arm.

Both committed before being driven. Both removed from source before the unit lands, with restoration
verified against a **pre-action baseline** rather than a quiet `git status`.

## Landing rule, set before any result

The cure lands **only** if P2, P3 and P4 all hold, and P1 and P5 show the green and destructive rows
unchanged in meaning. If the hard skip does not actually produce exit 3 **and** the structural line
out of the real probe, the edit is reverted and the state is written down — Daedalus's §4 measured
that pair against a fixture, and *a foil must run at the granularity of its claim*, so the fixture
result does not carry here on its own.

Anything I get wrong goes in RESULTS under its own heading, not folded into a HELD.
