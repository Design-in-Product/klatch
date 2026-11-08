# unit-465declprose — the declaration-population prose Daedalus handed back, and whether the mechanism is cured or only its two reported instances

**Seat:** Theseus (manual testing & exploration)
**Fire:** 2026-11-08 START
**Checkpoint:** `7bd0f520` (worktree synced to `origin/main` by the wrapper before this fire; `git rev-parse HEAD origin/main` returned the same sha, run)
**Subject:** `scripts/probe-round374…mts` A5b, `scripts/probe-round375…mts` A5, `scripts/probe-round377…mts` C0b, the `SWEPT` registry in `scripts/sweep-probes.mjs`, and `scripts/probe-round308…mts`

## Why this unit exists

Daedalus's 11/08 START memo (`docs/mail/daedalus-to-theseus-argus-cc-xian-janus-calliope-iris-…-a5bs-one-refusal-and-one-skip-was-one-entry-carrying-both-2026-11-08.md`)
§2 states, in the present tense, that

> `probe-round374` A5b states its narrowness arm as "the registry still declares **one refusal and one
> skip**" … Read against the parsed registry it describes a two-member population that has never existed.

and offers the prose repair to me: *"I have not touched A5b's prose… Yours if you want it; it is prose,
not a predicate."*

His substantive finding (the population was **one entry carrying both patterns**, never two entries)
is the thing to check, and his M1 figures are the thing to reproduce under my own key rather than read
off his table.

## Already measured before this file existed — recorded as measurements, NOT predictions

I read the three live arms before writing this pre-registration. They are stated here as findings
already in hand, so that nothing below is a prediction retro-fitted to a result:

- **M0a** — `probe-round374` A5b's live label on `7bd0f520` does **not** contain the string
  `one refusal and one skip`. It reads "the mutant registry declares the **same patterns on the same
  entries** as the shipped one … Keyed on the member list read live off both modules rather than on a
  frozen count of declarations, which is a population this arm is not about:
  `${SWEPT.filter(s => s.refusal || s.skip).length}` declaring entr(ies) today" — a count **computed
  each run**, carried as evidence, not asserted. The predicate is
  `declPopulation(mutantSweep.SWEPT) === shippedPop`.
- **M0b** — `probe-round375` A5 is the same, written out rather than imported (deliberately, per its
  own docblock).
- **M0c** — Both were cured in `7b1214db`, my `unit-465declpop` cure commit of the 11/07 STOP fire —
  **prose and predicate in the same commit**. `git log origin/main -2 --` over both paths, run.
- **M0d** — `grep -rn "one refusal and one skip"` over the tree (excluding `node_modules`, `.git`,
  `.testdata`) returns **no hit in any live probe arm label**. The hits are: frozen `.out` recordings
  of drives that happened (records, true as such), `COORDINATION.md` / session-log prose describing the
  pre-cure state, two mail memos, Daedalus's own registry pins, and **`probe-round377` C0b**.
- **M0e** — `probe-round377` C0b's label says "the mutated module still declares one refusal and one
  skip **for the subject**". Scoped to `probe-round225`, which does carry exactly one of each, so the
  sentence is true; and its predicate asserts nothing about any population — only
  `occ(sweepSrc, DECL_ANCHOR) === 1` and that the anchor is gone post-replacement. This is consistent
  with `unit-465declpop` P4 (round377 needed no edit).
- **M0f** — the `(347)` in that same C0b label is a **round-number citation** (Round 347, the
  assert-the-mutation-target doctrine), not a count: the identical parenthetical appears in the `once()`
  docblock of round374, round375 and round377 and in round374b's prose as "Round 347".

**So the handoff in his §2 is already discharged, and I did not do it this fire.** What is NOT yet
measured is everything below.

## Predictions

Landing rules are written here before any figure below M0 has been read.

- **P1 — his M1 reproduces under my own key.** Parsing `SWEPT` from `scripts/sweep-probes.mjs` live and
  printing the declaring population as a **member list** (`[file, Boolean(refusal), Boolean(skip)]`, in
  list order), I will get exactly **2** declaring entries: `probe-round225…` with `[true, true]` and
  Daedalus's newly promoted `probe-backfill-sidecar-neutrality.mts` with `[false, true]` — i.e. SWEPT
  44, refusals 1, skips 2, declaring-either 2, declaring-both 1.
  **HELD** if the member list matches that exactly. **REFUTED** on any difference, including a third
  member or a different flag pair. Member lists printed, not only counts.
- **P2 — his §2 claim about the population's history is checkable and true.** At `7b1214db`'s parent
  (i.e. the registry as it stood before his promotion) the declaring population was exactly **one**
  member, `probe-round225`, `[true, true]`. **HELD** if a parse of the registry at that rev returns a
  single-member list. **REFUTED** if it returns two members, which would mean "a two-member population
  that has never existed" is itself wrong.
- **P3 — the mechanism, not the instance: no OTHER live arm freezes a declaration count.** Censusing
  every probe source in `scripts/` for an assertion keyed on a *count* of declarations (`refusal`/`skip`
  occurrence counts or `.filter(…).length` compared to a literal) will find **zero** sites outside the
  three already cured. **HELD** at zero. **REFUTED** at one or more — in which case the 11/07 cure
  repaired its reported instances and left the mechanism live, and the site is named here.
  I am predicting zero because `unit-465declpop` P3 censused this family and found four arms over
  three mechanisms; this is a re-census under a different selector, so a hit refutes my own earlier
  census, not his memo.
- **P4 — the five probes of the P6 family are green on `main` today under my own drives**, at the
  counts his §1 third column reports: round372 26/26, round373 15/15, round374 8/8, round375 8/8,
  round377 13/13, each exit 0. **HELD** on exact agreement of exit code and both counts per probe.
  **REFUTED** on any disagreement. This is a live read of the tree his pins now sit in, not a re-read
  of his table.
- **P5 — `probe-round308` is green on `main` after his prose fix**, `All 23 regression checks passed`,
  exit 0. **HELD** on that exact line. **REFUTED** otherwise. His §4a reports it; Argus's cure
  `b2fa6936` and his re-break and re-fix all landed inside twelve hours, so an independent drive from a
  third seat is worth more here than agreement would normally be.
- **P6 — the full sweep passes at 44 of 44.** `SWEEP PASSED — 44 of 44 swept probes green, 0 red,
  0 blocked (0 could not run, 0 ran but did not finish), 0 census problem(s), 110 deferred`, exit 0,
  with the 44 `PASS` rows counted mechanically off my own capture rather than taken from the summary
  line. **HELD** on that. **REFUTED** on any red, block or census problem — and if it is refuted the
  red is named with its own re-drive, not reported as a sweep-level number.
  Driven because the gate cannot see this: `--census` returns before the driving loop, which is the
  gap `probe-round308` sat in for 13 days.
- **P7 — the gate is green and unmoved.** `GATE ok exit=0`, server `143 / 2221 / 1 skipped (2222)`,
  client `333 / 13 skipped (346)` — this unit adds no vitest test, so any movement is somebody else's
  commit and is reported as such. **HELD** on exact agreement. **REFUTED** on movement.

## Declared measurement (no landing rule — recorded, not graded)

- **D1** — whether `round372` A2 and `round373` A2, the two member-list arms `unit-465declpop` re-keyed,
  have a **driven control** on `main` today. `unit-465declpop` RESULTS says round372 A2 has none,
  blocked on an entry whose declarations can move without `A1b`'s `r225.skip!` dereference crashing.
  Daedalus's §5 is taking that repair this seat-next-fire. Recorded so that the state is written down,
  not to grade anybody.

## What this unit will NOT do

- **It will not take `round372` A2.** Daedalus's §5 claims it explicitly and asks for a stand-down if
  anyone has started. I have not started it, and I will not start it this fire. Stated in the reply, so
  his claim is not three-namings-with-no-owner for a fourth time.
- **It will not re-word A5b or A5.** They are cured; re-wording cured prose to match a memo that
  describes the pre-cure text would be a regression.
- **It will not touch Daedalus's registry pins or his `probe-round308` fix.** Those are his fire's work
  and are verified here, not edited.

## Method notes binding this unit

- Every figure is from a tool call in this session. Nothing is read off his table and re-published.
- The declaring population is printed as a **member list**, never only as a count — two keys that share
  a denominator agree vacuously.
- Counts in sweep output are **counted mechanically** off the capture, not read from the summary line.
- `date` is run for timestamps; elapsed is not estimated.
