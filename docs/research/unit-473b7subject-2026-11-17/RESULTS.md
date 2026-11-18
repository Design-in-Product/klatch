# unit-473b7subject — RESULTS

**Seat:** Daedalus · **Fire:** 2026-11-17 STOP · **Model:** claude-opus-5
`date`-reads: **17:19:34**, **17:26:10**, **17:27:26**, **17:30:47 PST** — read, not estimated.

## Headline

The routed red is real and is now cured, and **the cure cost two more pins than the memo named**:
restaging the sweep's arm-count pin, and enrolling the new arm in a *second* census it tripped on
landing. Both were found by **driving the sweep**, not by reading the diff.

**The red was never about the tree.** B7's predicate opened `mjsFlat.length === 37` while its claim
quoted a `scripts/tsconfig.json` sentence that **I removed on 2026-09-30**, 2h39m after the arm was
written. For 48 days the arm's first conjunct was a frozen literal standing in for a reading of a
subject that no longer said anything, and it stayed green because the directory still held 37 files.

## Ledger

| # | Prediction | Outcome |
|---|---|---|
| P1 | the arm was green for the wrong reason, not right | **LANDED** |
| P2 | re-keyed arm green, probe returns 20 → **21 of 21** | **LANDED** |
| P3 | the cripple reddens it, naming the count found | **LANDED** |
| P3b | an unreadable known positive reds rather than passes (added mid-fire) | **LANDED** |
| P4 | the full sweep returns to 45 of 45 | **see §6 — re-drive in flight at write time** |
| P5 | reader characterised both directions, blindness pinned not repaired | **LANDED** |
| P6 | B7 is not the only frozen filesystem-population literal | **REFUTED AS FRAMED — the finding is better: the detector for this class already exists, and its audit's population excludes the file B7 is in** |

## 1. P1 — 48 days of green, and what the green was measuring

- `grep -n 37 scripts/tsconfig.json` → **no match**.
- `git log -S` → the sentence `The 37 \`.mjs\` probes are plain ESM and are not typechecked` left the
  file at **`62faaec9`** (Round 304, **Daedalus**, 2026-09-30 **17:37**), replaced by one that states
  the population instead of counting it.
- B7 arrived at **`6c1fc030`** (**Theseus**, 2026-09-30 **14:58**) — **2h39m earlier**. The arm was
  true when written; my own commit cured its subject out from under it the same evening.
- It reddened at `6b98355b` (mine, 13:37 today) when `scripts/verify-decl-body-slicers.mjs` landed
  flat as the 38th file.

**The correction to the routing memo, and it matters only because it changes whose instrument this
is:** Calliope's memo names B7 as "written by Daedalus himself (`28833525`, 10-25)". `28833525` is
mine and is dated 10-25, but it is `round454: stripSource refuses a non-string…`. The arm is
Theseus's. What is mine is the commit that removed its subject and the commit that tipped the count.
**Both repairs the memo offers are unavailable as stated:** there is no "37" in `tsconfig.json` to
fix, and re-pinning to 38 re-freezes a literal that has already drifted once.

## 2. P2/P5 — the arm now reads the subject

Predicate: (a) today's comment states **no** count of the `.mjs` population — `0 count-claim(s)`;
(b) the pre-cure blob at `724371e5` states **exactly one**, `37` — the known positive, taken from
git by `git show` rather than hand-typed; (c) the surviving substantive half, nested import targets
**3** > flat **1**. Each conjunct prints its own state, so a red names which one moved. The flat
count (**38** today, 11 nested, 49 total) is **printed and never asserted** — a tree drifting back
to 37 cannot restore a false green.

`B7a` characterises the reader **in the drive**: adjacent count found, other-word-order count
**not** found, JSON-body line outside the reader. The miss is **pinned, not repaired**: the obvious
repair is a proximity window, and a ±40-char window scores `Round 303 §6): \`.mjs\`` — a string in
this very file's comment — as a count claim.

Drive: `All 21 regression checks passed, 7 measurements, 0 skips`
(`.testdata/r473/drive2.rekeyed.out`). `scripts/` typecheck **0 errors**.

## 3. P3 — two cripples, both restored and verified

| Cripple | Expected | Observed |
|---|---|---|
| **C1** the removed sentence restored verbatim into `scripts/tsconfig.json` | B7 red, naming the count found | **red**, `1 count-claim(s) — [37]`, `1 of 21 FAILED`; B7a stayed green, correctly — the reader did not move, the subject did |
| **C2** `CFG_PRE_CURE` set to an unresolvable rev | B7 red as UNREADABLE, not green on an unread control | **red**, `known positive from deadbee1 (git exit 128): UNREADABLE` |

Both restored before the gate ran: `git diff --stat HEAD -- scripts/` empty, `grep -c CRIPPLE` → 0
in both files.

## 4. The cure cost two more pins, and the sweep is what found them

Neither was predicted; both are mechanisms working as designed.

1. **The arm-count pin.** `sweep-probes.mjs` pins each SWEPT probe's summary line. The first full
   sweep after the fix read `RED exit 0 … pin says 20, observed says 21 — the pin needs bumping`.
   Restaged to 21, with the repair's history written into `why` and **a second ratio deliberately
   kept out of that field**, because the entry-schema cross-read keys on it.
2. **A second census the new arm enrolled itself in.** `probe-round371` G4 went red:
   `undeclared [… probe-round303…:628]`. B7a's docblock carries the word *characterisation*, which
   is one of the two **precise** markers, so the corpus-wide reconcile reported the new comment
   block UNDECLARED. **Declared in `scripts/lib/characterisation-markers.mjs` rather than reworded
   out of the detector's reach** — the member is a real characterisation, which is the registry's
   subject. `cells: []`, and that is a limit of side A rather than a choice: side A matches cells
   against the rows of **one** drive (`SUBJECT = probe-round224`), so a cell named here would be
   looked for in that probe's output and reported missing. The entry pins the declaration **site**;
   the arm carries its own cell-level grading and reddens without the registry.
   After: `All 14 regression checks passed`, E1 `comment 7/7, code 2/2`.

**So Calliope's 44 of 45 was on its way to 43 of 45, and the second red was mine too** — her sweep
at ~17:0x predates both. Mine at 17:24 read **43 of 45, 2 red** before the two pins were restaged.

## 5. P6 — refuted as framed, and the real finding is sharper

The naive key (`<ident>.length === <N>`, `N ≥ 2`, over tracked `scripts/**/*.mts`) returns ~90 sites,
far outside the predicted 2–6, because most pin a **fixture-local** population the file owns. The
prediction's range was for the classified class and the grep is an unclassified superset — so the
figure refutes the prediction's framing rather than the corpus.

**What the classification found instead: a detector for exactly this class already exists in this
corpus, with its own known positive and known negative.** `probe-round322`'s `magnitudePins` — *"a
frozen integer compared against a count the file derives from a population it does not own"*, with
`SPEC_FROZEN` exempting exit codes, HTTP statuses and ports, and arm **A2** proving the detector can
return non-zero. Its rule matches `mjsFlat.length === 37` on inspection: the line carries `.length`,
the comparison is `=== 37`, and 37 is not in `SPEC_FROZEN`.

**Why it never saw B7:** arm **A1** drives it over **`backlogDeferred`** — the DEFERRED members of
the arm-G backlog. `probe-round303` hand-rolls its summary (`checks passed`, no `summariseAndExit`),
so it **is** in that backlog, but it is **SWEPT**, so it lands in `backlogSwept` and sits outside
A1's population. The scoping was reasonable when written — a DEFERRED probe never drives, so its
pins go stale invisibly — but a SWEPT probe's pin only reddens **when the sweep is driven**, and the
sweep is not in the pre-commit hook. 48 days of green followed by one red is that gap, measured.

**Routed, not fixed here** (named blocker): widening A1 to `backlogSwept` is `probe-round322`'s own
arm and needs its author's judgement plus a drive over the whole SWEPT set, which will surface
sibling literals — `probe-round303`'s own `tsFiles.length === 2`, line 833, is one, and unlike B7's
it is keyed on a sentence the config **still** carries ("the 2 `.ts` files"), so it is honest today
and would be a false positive for a path-blind widening.

## 6. P4 — the full sweep

First drive, before the two pins were restaged: **43 of 45, 2 red**
(`.testdata/r473/drive5.full-sweep.out`) — round303 on the arm-count pin, round371 on the
undeclared characterisation. Both causes are this unit's own additions and both are now landed.

Re-drive, returned after the paragraph above was written and filled in from its own output
(`.testdata/r473/drive8.full-sweep-after.out`, exit 0):

```
SWEEP PASSED — 45 of 45 swept probes green, 0 red, 0 blocked (0 could not run, 0 ran but did not
finish), 0 census problem(s), 110 deferred
```

`grep -c "  RED"` over that file → **0**. `probe-round303` reads
`PASS exit 0 … All 21 regression checks passed`. **P4 LANDED** — the standing figure every fire
cites is 45 of 45 again, and for the first time in 48 days B7's green is a reading rather than a
coincidence.

Rest of the gate, driven fresh this fire: `npm run typecheck` **clean** across all four programs
(three workspaces + `scripts` ×2 configs); server **146 files / 2287 passed / 1 skipped (2288)**;
client **29/42 files, 354 passed / 13 skipped (367)**; census **OK** (155 probes, 45 swept / 110
deferred); `verify-decl-body-slicers` **OK** (974 tracked files, population 65 — UNGUARDED 59,
MARKED 4, GUARDED 2, 59 baseline entries). Every figure matches this morning's standing reading;
the only number that moved is round303's arm count, 20 → 21, by this unit's own edit.

## 7. Found on the way, and this one is about my own helper

Trying to **slice** `magnitudePins` out of round322 rather than retype it,
`scripts/lib/decl-body.mjs` — the helper I landed this afternoon — **refused**:
`return-type-annotation-on-an-arrow-declaration`. The refusal is deliberate and documented (a
depth-0 `=>` inside a function-type return annotation is indistinguishable by character scan from
the arrow's own). Measured reach over the tracked tree, 469 files:

```
declaration heads: block 2072 · concise 547 · refused 910
    510  return-type-annotation-on-an-arrow-declaration
    392  no-body-brace-after-the-parameter-list
      5  no-body-brace-after-the-return-type
      2  unbalanced-body-brace
      1  unbalanced-parameter-list
annotated-arrow refusals: 510; of those, return annotation looks function-typed: 152
```

So the single largest refusal class is **510 sites**, and **at most 152** of them carry the
ambiguity the refusal was written for — `152` is an **upper** bound, because that key is a 200-char
window regex and over-reports. At least **358** annotated arrows are refused where the annotation is
a plain type (`: string`, `: Channel`) and the first depth-0 `=>` after it is unambiguously the
arrow's own.

### 7a. The attempt to sharpen that 152, and why the figure is NOT delivered

The 152 is an upper bound from a window regex, so I tried a bracket-aware key: from the `:` after
the parameter list, count depth-0 `=>` before the first depth-0 `{` — **one** means the annotation
is a plain type and the arrow is unambiguous, **two or more** means a function-type return
annotation contributed one. Driven over the same 510 sites
(`.testdata/r473/annotation-arrows.mjs`):

```
annotated-arrow refusals scanned: 510
  exactly one depth-0 arrow before the body brace (narrowing is safe): 232
  two or more (the ambiguity the refusal was written for):              23
  scan did not reach a depth-0 brace (counted as NOT safe):            255
```

**This measurement is inconclusive, and the defect is mine, in the shape this fleet keeps finding:**
I wrote `if (arrows === 1) … else ambiguous`, so the second bucket is a **fall-through** holding
`arrows === 0` *and* `arrows >= 2`. Its own samples settle it — every one printed reads
`arrows=0 :: ":"`, i.e. an **object-type return annotation** (`): { … } => {`) where the first
depth-0 `{` is the annotation's brace and not the body's. So the 23 is not a count of the ambiguous
case; it is a bucket of at least two mechanisms. And the third bucket, **255 sites where the scan
never reached a depth-0 brace at all**, is too large to accept undiagnosed — most likely my naive
`<`/`>` depth handling taking a comparison operator for a type-parameter close.

**What survives:** the 152 remains the standing *upper* bound on the ambiguous case, **232** is a
floor on the unambiguous one, and the narrowing's real price is **unmeasured**. Recorded rather than
rounded off, because a half-diagnosed three-bucket split is exactly the artefact that would be
quoted next fire as though it were the answer.

**The narrowing is specific:** refuse only when the return annotation **itself** contains `=>`.
**Not landed this fire, named blocker:** it needs its own KP set in both directions — including a
`const f = (a: string): (b: number) => void => {…}` positive — and landing a widening of a span
reader without one is precisely the silent-wrong-span class the module exists to prevent. Routed to
Argus and Theseus by mail in this fire.
