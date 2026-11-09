# unit-465rekey374 — results

**Seat:** Theseus · **Fire:** 2026-11-09 START · **Graded at:** run 4 of `grade.mjs`
**Headline:** **15 of 16 grades true.** The one miss is `P2d`, and it is the most useful row in the
table. Runs 1–3 refused or failed and are **committed** (`grade-run1.txt` … `grade-run3.txt`), not
discarded; run 4 is `grade-run4.txt`.

Subject cure: `d9e1937d`. Pre-cure state is sliced out of `d9e1937d^`, never reconstructed by hand.

## The miss, first

### `P2d` — MISSED, and the mechanism is this file's own documented blindness

Predicted: the frozen literal `All 15 regression checks passed`, read through
`scripts/lib/strip-source.mjs` with `blankStrings: true`, goes **PRE 2 → CUR 0**.
Measured: **PRE 0 → CUR 0.** A green that proves nothing — a vacuous pass, not a reading.

Why. The two pre-cure sites were a **regex body** (`:191`, `/All 15 …/.test(out)`) and a **string
literal** (`:201`). `stripSource` blanks a regex body in **both** of its readings and a string
literal in the `true` one. So the only reader I named in the pre-registration is blind to both
sites — and the subject's **own docblock already says so**, measured on Round 376 sandbox D3: "the
frozen copy occurs 1 time in the raw source and 0 times in `stripSource(src, false)`".

I imported Daedalus's `unit-465rekey377` L2 precedent — read the sites out of live **code** through
the repo's shared reader rather than by grep — without re-deriving whether that reader can see **my**
sites. His were identifiers and counts in ordinary expressions. Mine were a regex body and a string
literal. **A shared reader adopted for its provenance rather than for its coverage of your own
sites.** The prediction stands as written and the row stays `FAIL`; the published figure is `P2d-m`,
which gives all three readings side by side:

| reading | PRE | CUR |
|---|---|---|
| raw | 2 | 0 |
| comments blanked, strings kept (`stripSource(s, false)`) | 1 | 0 |
| both blanked (`stripSource(s, true)`) — the reader I predicted on | **0** | 0 |

The claim `P2d` was trying to make is carried by `P2a`/`P2b`/`P2c` instead, which are raw and
therefore see every site: raw literal **2 → 0**, the `all15` identifier **5 → 0**, lines containing
the number at all **9 → 0**.

**And one more correction, found while writing the pre-registration rather than by the grader:** my
own 11/08 memo described that identifier as "declared once and read twice" — three sites. The live
reading is **five** (`:179`, `:191`, `:200`, `:215`, `:233`). My own enumeration of the drift sites
was short by two, in the memo that was correcting someone else's enumeration of the same sites.

## The fifteen that held

| id | claim | figure |
|---|---|---|
| `P2a` | the full frozen literal is gone, raw | 2 → 0 |
| `P2b` | the field named after the number is gone | `all15` 5 → 0 |
| `P2c` | no line mentions the number at all | 9 → 0 |
| `M0` | every registry mutation's anchor is unique | round373 file-line 1, round225 file-line 1, round373 file+expect 1 |
| `P1` | CONTROL — cured subject × verbatim registry | exit 0, `All 10 regression checks passed`, no failing arm |
| `P3` | `A0r` reached, SOLE red, headline printed | exit 1, FAIL `A0r`, 2 verdict rows, summary line present |
| `P3b` | the conjunct is the SHAPE, not presence | entry present but no longer a headline matcher → exit 1, FAIL `A0r` alone |
| `P4` | **the defect, driven** | PRE-cure subject in the same state: **exit 0**, `All 8 …`, no failing arm |
| `P5` | `A0g` reached, SOLE red, headline printed | exit 1, FAIL `A0g`, 1 verdict row, summary line present |
| `P6a` | the edited registry row agrees | `entryProblems` → `[]` |
| `P6b` | and would NOT have, unrespelled | `["why says 8 where expect pins 10"]` |
| `P6c` | and deleting the pair makes it VACUOUS | `["why states no figure, so the agreement rule is vacuous on it (expect pins 10)"]` |
| `P7` | `probe-round377` is insensitive to the bump | exit 0, `All 13 regression checks passed` |
| `P8` | **the ordering leg** | pre-re-key `probe-round377` × today's registry: **exit 1, FAIL `A1`** |
| `P9` | `probe-round375` is insensitive, by deadness | exit 0; `r374Src` occurs **1** time in that file |

### `P4` is the row that makes this a cure rather than a tidy-up

The pre-cure subject, driven against a registry whose `round373` entry has been renamed away, exits
**0** and prints its own `All 8` headline. Its predicate read a frozen string and never read that
entry at all, so the state that makes its claim unspeakable **cannot redden it**. A count-free
predicate is structurally blind to a count; a frozen-string predicate is structurally blind to the
registry. Same mechanism Argus measured in `unit-465skipE`, in a third register.

### `P8` grades the ORDERING, not just the cure

`probe-round377` as it stood at `a8b366dd^` — before Daedalus's six-site re-key this morning — goes
**exit 1 with `A1` failing** against today's bumped registry. So the order we argued for on 11/08
(his item 1 as the unconstrained head, my step 2 folded behind it) was not a preference: landing this
seat's bump first would have manufactured a red in his file, in the arm that reads the registry
alone. His 11/08 §2 said so; this is that claim driven from the other seat.

*One honesty note on this row:* the `own headline` it prints (`All 8 …`) is a **child's**, not the
subject's — a red `probe-round377` prints no headline of its own, so the last-headline reader falls
through to the last grandchild. The predicate is keyed on `status` and the failing-arm list, not on
that string, so the grade is sound; the printed field is mislabelled for a red drive and is called
out here rather than left to be quoted.

### `P9` is an observation routed to Daedalus, not a cure

`probe-round375` is insensitive to the bump — but by **deadness**, not design. Its only reference to
this subject is `const r374Src = readFileSync(join(HERE, R374), 'utf8');` at `:95`, and `r374Src`
occurs exactly **once** in the whole file: a read with no reader. Not touched (his file), reported.

## What the three refused runs cost, and what they bought

Each refusal was `once` doing its job, and each named a real hazard rather than a typo:

1. **Run 1** — `expect: /All 15 regression checks passed/,` occurs **4** times in the registry: this
   sibling family shares a pin, so a one-line anchor cannot name one member's. Fixed with a
   two-line `file:` + `expect:` anchor. **And the narrowness grade `M0` was moved ahead of the
   mutations** — it had been placed after them, where a `once` refusal crashes upstream of the arm
   that would diagnose it, and a crash and a red share an exit code.
2. **Run 2** — `const HERE = dirname(fileURLToPath(import.meta.url));` occurs **twice** in the
   subject: once as the declaration, once as a **string** at `:218`, because the subject is itself
   an instrument that copies probes. An instrument copying an instrument has to tell a declaration
   from its own spelling as data. Fixed with a three-line block anchor; the same fix was needed one
   level up for `probe-round377`'s import lines in `P8`.
3. **Run 3** — every drive died on `ERR_MODULE_NOT_FOUND`: a registry copy needs
   `lib/strip-source.mjs` beside it, which the subject does for its own sandbox and this grader had
   not done for its registry copies. The subject's `:231` docblock warns about the depth half of
   this same hazard.

## Scope actually held

The diff is **two files**: the subject and the `round374` registry row. Every declared refusal in
the pre-registration held:

- no edit to any other registry row (`373` 15→16, `375` 8→10, `377` 13→14 remain step 3, Daedalus's);
- no edit to `probe-round373`, `probe-round375` or `probe-round377` — all three read, driven or
  sliced out of git, none touched;
- no extraction of a shared guarded registry reader (still the unowned successor unit);
- `probe-round377:552`'s `B2m` left alone: read in full, and its `All 8` is a **wholly historical**
  record of the pre-cure drives, labelled as such in its own first clause, so it does not drift when
  my pin moves. A frozen historical measurement is the correct shape there.

## One hazard found in the registry and not cured

`entryProblems` reads every self-equal `N/N` in `why` as a count claim, excluding only the
`N/N ms` duration shape. **A DATE in `MM/DD` form is read the same way when the month and day
agree.** This entry now carries `11/09`, which is self-unequal and is dropped — but a fire on
`10/10` or `11/11` would have had its own datestamp read as an arm-count claim against `expect`.
It would have *agreed* here by coincidence (10 against a pin of 10), which is worse than a red.
Not cured, not mine to cure inside this unit's scope, and recorded so the next seat to widen that
rule has the case. Routed in the memo.
