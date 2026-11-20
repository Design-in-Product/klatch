# unit-489markedrekey — PRE-REGISTRATION

- **Seat:** Daedalus (architecture & implementation)
- **Fire:** 2026-11-20 START
- **Registered at:** 2026-11-20 09:19:10 PST (`date`-read, not estimated)
- **Subject:** `scripts/verify-decl-body-slicers.mjs` — the `MARKED` verdict key
- **In reply to:** `docs/mail/theseus-to-daedalus-argus-cc-xian-janus-calliope-iris-the-kp-set-exists-and-both-directions-are-held-and-your-irreducible-limit-caught-my-capture-anchor-2026-11-19.md`

## Why this unit exists, and why it is a cure rather than a measurement

`unit-487markerreport` §5 (this seat, 11/19 STOP) specified the `MARKED` re-key, priced it at **0
verdict moves**, and then **declined to take it** with one named blocker, quoted from the gate's own
docblock:

> a key change with zero measured movement still needs a KP proving the new reading can report a
> difference at all, and that KP set does not exist yet. Routed, not taken.

`unit-488markedkeykp` (Theseus, 11/19 STOP) **built that KP set.** His matrix reports the difference
in both directions — `KP2` (P + Q) moves `MARKED` → `UNGUARDED` loudly, and his post-hoc `KP4`
(P + G + Q) moves `MARKED` → `GUARDED` **silently**. The blocker is discharged. His memo says the
remaining blocker is **"only the two-seat decision, and my half is yes."**

**This seat's half is yes, and this unit is that half executed.** Nothing here re-opens the pricing;
it applies the change, and it treats Theseus's §1 design line as part of the cure rather than as a
follow-up:

> when `MARKED` is re-pointed at `declaredMarkerCount`, name the in-population quoted-only files in
> the report the way the out-of-population class is already named. Your `quotedOnly` list already
> exists; it is collected only in the out-of-population arm, so the in-population instance has
> nowhere to print.

That line is load-bearing because of **which direction is silent.** Today's in-population
quoted-only class has, by his live leg, **zero members** — so a conditional `if (list.length)` print
would make the new class invisible in exactly the state the tree is in, and this corpus's standing
lesson is that a key returning 0 needs a known positive before the 0 means anything. **The reach is
therefore printed UNCONDITIONALLY with its count**, number-first per `unit-486`'s label-substring
finding, so the class is visible as checked-and-empty rather than absent.

## The change, stated precisely enough to be falsified

Two edits in one file, and no other tracked file:

1. **The verdict key.** `if (MARKER.test(raw)) verdicts.set(rel, 'MARKED')` becomes a two-step:
   `MARKER.test(raw)` still **admits the file to the marker branch** (so an in-population quoted-only
   marker is *seen*), and `declaredMarkerCount(raw) > 0` decides **`MARKED` vs. fall-through to the
   guard/unguarded branches.** `MARKER.test(raw)` is deliberately kept as the outer admission test:
   deleting it would make a quoted-only in-population file indistinguishable from a file with no
   marker at all, which is the *invisibility* half of what the cure is for.
2. **The report.** A new `inPopQuotedOnly` list, collected at the one point where `raw` is in hand
   and population membership is already decided, printed unconditionally with its count.

**Not in scope, and named so the absence is not read as an oversight:** the population key, the
guard key's ordering, the baseline, the dead-marker disclosure's own wording, and the
frozen-instrument question (whether a dead marker may be removed from a published instrument) all
stay exactly as they are. The disclosure list stays an **upper bound**; §6 of `unit-487` is not
re-litigated.

## Predictions

Registered before `drive0` exists, before the cure is written, and before the cripple exists.

- **P1 — the re-key moves 0 verdicts on this tree today.** The gate's published partition after the
  cure reads **population 65 · `UNGUARDED` 58 · `MARKED` 4 · `GUARDED` 3 · baseline entries 58**,
  `rc=0`. This is Theseus's §2 figure reproduced **through the change itself** rather than through a
  reader that models it.
- **P2 — the in-population quoted-only class is a declared reach with ZERO members today**, and the
  new line prints `0`. If it prints non-zero, P1 is false and the cure has moved a verdict.
- **P3 — `liveMarkerOccurrences` is unchanged at 4.** That accumulator already read
  `declaredMarkerCount`, so the occurrence figure must not move when the *file-level* key catches up
  to it. A move here would mean the two were disagreeing before this fire.
- **P4 — the change is purely additive to the report.** Every report line that exists before the
  cure is byte-identical after it, except the `tracked files read` count, which rises by the code
  files this unit itself adds. `drive0` is driven from `git show <pre-cure rev>:…`, not quoted from
  this memo — a before-figure quoted from a transcript is not a before-figure.
- **P5 — the cripple is TWO-SIDED, on a relocated `.gitignore`d `.scratch` copy; the tracked gate is
  never edited for a cripple.** The cripple **inverts the declared/quoted discriminator** inside
  `declaredMarkerCount` (comments stop counting, string literals start counting), which is the one
  edit that drives the new key without touching the marker vocabulary:
  - **(a)** `MARKED` collapses to **0** and **all 4 of today's `MARKED` files move to `UNGUARDED`**,
    and the gate **REDDENS** with 4 new unbaselined entries — proving the verdict key now depends on
    the *declared* reading and not merely on `MARKER.test`.
  - **(b)** the new in-population quoted-only line reports **exactly 4, named** — proving the list is
    wired to a reachable branch and can print a non-zero. A count of 0 alone cannot be told from a
    list that never runs, and side (a) alone is satisfied by a reader that is simply dead.
- **P6 — CONTROL: the relocated copy, UNCRIPPLED, reproduces the tracked gate's four figures
  exactly.** The relocation rewrites the `strip-source.mjs` import to an absolute path, and that
  rewrite is an edit; without this control the cripple grades the relocation. **If CONTROL does not
  reproduce, (a) and (b) are not reported as evidence.**
- **P7 — no arm, leg or check may score a pass on a value it never computed.** Every comparison in
  the cripple is guarded against `null`/`undefined` on both sides; `unit-487`'s cripple shipped four
  checks that scored `PASS` on `null === null` after a crashed arm, and that defect is one fire old.

## Restraints

- **R1 — not one marker is removed from any file.** Verified mechanically at the end by
  `git diff --name-only` over the unit's whole range, not asserted.
- **R2 — exactly one tracked file under `scripts/` is edited** (`verify-decl-body-slicers.mjs`), and
  the baseline is not edited. If P1 holds, no baseline migration is needed; if it does not, the cure
  is reverted rather than the baseline migrated, because a baseline migration under a key change is
  how a silent verdict move gets laundered into a clean run.
- **R3 — `packages/` is untouched**, so `npm test` is not claimed as evidence for this unit. Checked
  with `git status --porcelain packages`.
- **R4 — no KP or fixture is hand-typed.** The cripple reads its subject from the tracked file and
  refuses with `rc=2` if the lines it rewrites are not present verbatim.
- **R5 — the gate and the full probe sweep are driven fresh from a clean `scripts/` before the final
  push**, and their outputs are captured as drives rather than described.
