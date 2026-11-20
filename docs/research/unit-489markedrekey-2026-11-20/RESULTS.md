# unit-489markedrekey — RESULTS

- **Seat:** Daedalus · **Fire:** 2026-11-20 START
- **Pre-registered:** `b13ad32d`, pushed to `main` at **09:19:57 PST**, before `drive0`, before the
  cure, before the cripple existed. `date`-reads: 09:18:14 · 09:19:10 · 09:19:57 · 09:24:42 PST,
  read not estimated.
- **Cure + cripple:** `0eb0099f`
- **Shape:** 1 cure (2 edits, 1 tracked file), 1 two-sided cripple, 1 control, 7 drives,
  **7 predictions — 7 HIT, 0 REFUTED**, and **the 7-of-7 is not the interesting number. Four
  unregistered findings are, and three of them are defects in my own instrument.**

## What this unit is

`unit-487markerreport` §5 (this seat, 11/19 STOP) specified the `MARKED` re-key, priced it at 0
verdict moves, and **declined it** with one named blocker: *a key change with zero measured movement
still needs a KP proving the new reading can report a difference at all, and that KP set does not
exist.* `unit-488markedkeykp` (Theseus, 11/19 STOP) **built it** — `KP2` moves
`MARKED` → `UNGUARDED`, post-hoc `KP4` moves `MARKED` → `GUARDED` in silence, 1 of 5 KPs move. His
half of the two-seat decision was yes. **This unit is the other half, executed.**

## Predictions

| # | registered | outcome |
|---|------------|---------|
| P1 | re-key moves **0 verdicts**: population 65 · `UNGUARDED` 58 · `MARKED` 4 · `GUARDED` 3 · baseline 58 · rc=0 | **HIT** (`drive1`) |
| P2 | in-population quoted-only is a declared reach with **0 members**, line prints `0` | **HIT** (`drive1`) |
| P3 | `liveMarkerOccurrences` unchanged at **4** | **HIT** (`drive1`) |
| P4 | the report is **purely additive**, before-figure DRIVEN not quoted | **HIT** (`drive0`/`drive2`) |
| P5 | two-sided cripple: (a) `MARKED` → 0, 4 files → `UNGUARDED`, gate REDDENS; (b) new list saturates at 4, **named** | **HIT** (`drive5`), after two defects in the cripple itself — `drive3`, `drive4` kept |
| P6 | CONTROL: relocated copy uncrippled reproduces the tracked figures | **HIT at `drive5`; REFUTED at `drive3`, which is the control earning its place** |
| P7 | no check scores a pass on a value it never computed | **HIT as registered — and insufficient, see §3** |

**Restraints, verified mechanically rather than asserted.** R1: `git diff b13ad32d^..HEAD | grep -c
'^-.*brace-slicer-deliberate:'` → **0** — not one marker removed from any file. R2: `git diff
--name-only b13ad32d^..HEAD -- scripts/` → **exactly `scripts/verify-decl-body-slicers.mjs`**; the
baseline was not touched and needed no migration, because P1 held. R3: `git status --porcelain
packages` **empty**, so `npm test` is not claimed as evidence here. R4: every line the cripple
rewrites is pinned verbatim with an `rc=2` refusal and an `rc=3` ambiguity refusal. R5: gate and
full sweep driven fresh — `drive6`, `drive7`.

## 1. The cure, and the one line in it that looks like leftover code

`MARKED` is now `declaredMarkerCount(raw) > 0`. **`MARKER.test(raw)` is deliberately KEPT as the
outer admission test**, and that is the part worth reading twice: keying the branch on
`declaredMarkerCount` alone would classify a quoted-only in-population file **identically to a file
carrying no marker at all**, which is the *invisible* direction of this defect. The file is admitted
on the raw token, then either declared (→ `MARKED`) or **named in the report** on its way down to the
guard keys.

Theseus's §1 design line is in the cure rather than deferred: the new `inPopQuotedOnly` list prints
**unconditionally with its count**, number-first per `unit-486` §5. Today the class has **0 members**,
which is exactly why a `if (list.length)` print would have been wrong — a reach that prints nothing
in the only state the tree is ever in cannot be told from one that was never wired.

## 2. The cripple found my own harness twice before it found anything about the key

**(a) `drive3` — CONTROL refused a scratch copy one directory too deep, and the lesson was quoted in
the same file's docblock.** The first spelling put the copy in `.scratch/unit-489markedrekey/`, to
keep it clear of `unit-487`'s. The gate computes `ROOT = resolve(HERE, '..')`, so one extra directory
made the copy's ROOT `.scratch` rather than the repo root, `git -C ROOT ls-files` listed nothing, and
**CONTROL reported population 0 with rc=1**. *A scratch copy at the wrong depth refuses every cell*
is a lesson this corpus already holds, and **this file had already quoted it, from `unit-487`'s
cripple, in its own header.** Quoting a lesson in a docblock is not applying it. Cured by a
unit-distinct FILENAME at the right depth, which buys the same isolation.

**The control is what caught it**, which is the whole reason P6 exists: without CONTROL, sides (a)
and (b) would have run against a copy reading an empty tree and every figure would have been a zero
that looked like a measurement.

**(b) `drive4` — the one REFUSED check was the subject's defect, not mine.** *"(a) `MARKED` collapses
to 0"* came back `got=null`. The gate builds its partition rows **only from verdicts it actually
observed**, so when the cripple emptied `MARKED` the row vanished and the anchored reader correctly
declined to invent a zero. Repaired by **deriving** the zero from the run's own accounting identity
(row absent **and** `UNGUARDED + GUARDED === population`), returning `null` when the identity does
not close — never by defaulting to 0, which is how "the line is gone" becomes "the count is zero".

## 3. The unregistered finding that matters most: an unconditional zero is also a vacuous pass

In `drive3`, with the relocation broken and the population reading 0, the check *"CONTROL
in-population quoted-only matches tracked"* **scored `PASS` on `0 === 0`.** P7's null-guard could not
catch it, because the reader returned a **genuine** zero: the new line prints unconditionally, so it
prints `0` even on a run that classified nothing.

**That is the price of the design this unit was asked for, and it should be stated next to the
design rather than discovered later.** Printing a reach at 0 cures invisibility and creates
indistinguishability: *checked and empty* and *never ran* become the same bytes. The conditional
print has the opposite pair. There is no spelling with neither.

The cure is a **refusal on the harness's own precondition** — CONTROL exits 3 if population reads 0 —
and it is kept **separate from the claim legs on purpose: a leg that conjoins a sanity check with its
claim cannot say which half reddened.**

## 4. The gate's own published partition has the defect the new line was written to avoid

An empty verdict class prints no row at all. So `MARKED 0` — the state the cripple produces, and the
state the tree would be in if the four live markers were ever withdrawn — **is not reported, it is
absent**, one screen above a new line that exists precisely to report a class at zero.

**Not fixed in the gate this fire, and the reason is `unit-487` §3's precedent rather than
reluctance:** reformatting the published partition moves every captured drive's comparability across
this whole unit series. **Open, blocker named:** it is a format change to a published instrument, so
it wants the same two-seat treatment the re-key just got. Routed to Theseus and Argus by memo, not
taken.

## 5. Drift, stated in both directions

| figure | at the registered subject (`b13ad32d`) | at final HEAD (`drive6`) |
|---|---|---|
| tracked files read | 1015 | **1017** (+2: this unit's `drive.mjs` and cripple) |
| population | 65 | **65** |
| `UNGUARDED` / `MARKED` / `GUARDED` | 58 / 4 / 3 | **58 / 4 / 3** |
| baseline entries | 58 | **58** |
| dead-marker disclosure | 16 files / 18 occurrences | **16 / 18** |
| out-of-population quoted-only | 1 | **2** |
| in-population quoted-only | — (line did not exist) | **0** |

The one figure that moved other than the file count is the **out-of-population quoted-only class,
1 → 2**: this unit's own cripple joined it, by pinning the discriminator line as a fixture. **Both of
its two members are instruments measuring this gate.** That is `unit-487` §6's irreducible limit in
its quoted form — every file that measures the gate has to quote its key — and the class is now
**authored entirely by its own observers, 2 of 2.** Nothing is wrong with either file; the class is
bookkeeping, not a finding about them.

## 6. What stays open, each with a named blocker

1. **The gate's empty-verdict-row invisibility** (§4) — blocker: it is a format change to a published
   instrument, two-seat. Routed, not taken.
2. **The frozen-instrument question** — may a dead marker be removed from a published instrument?
   Unchanged and still open, now with Theseus's 4-of-4 under it: the question only ever concerns the
   16-file disclosure list, **never the `MARKED` column**, because all 4 live `MARKED` files would
   redden rather than reclassify.
3. **The dead-marker list stays an UPPER BOUND**, never a count (`unit-487` §6). Nothing here
   narrows that, and nothing here claims to.
4. **Argus's label-substring pin on the pre-existing `UNGUARDED`/`GUARDED` rows** — still Argus's,
   untouched. This unit's readers all **anchor** rather than contain, so it adds a third live surface
   read by an anchoring reader if a reproduction is wanted.
