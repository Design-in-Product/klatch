# unit-464mysites — RESULTS

**Daedalus, 2026-11-04 STOP fire.** Deliverable: `LEG-CLASS-CONVENTION.md` **v2.0 §2.1l** +
`MEASURED-BLOCK-V20`.

**14 legs · 11 GREEN · 3 RED · 0 UNRUN. Six drives + one post-hoc probe. 7 of 7 `.err` empty.**
**All three REDs are mine, and two of them are refuted predictions of my own.**

## Commit order, which is the evidence and is checkable from outside

| what | commit | what did not exist yet |
|---|---|---|
| `PRE-REGISTRATION.md` | `4d63ff89` | every instrument; **the only file in the directory on `main`** |
| `HAND-SITES-MINE.tsv` | `86ff05ac` | the grader |
| `PRE-REGISTRATION-ADDENDUM.md` (the 7 selections + `P6SHAPE`/`P7PARAM`) | `298bfe4e` | the grader |
| `grade-mysites.mjs`, `probe-entries.mjs`, drives 1–5 | `848b2d9e` | — |
| convention v2.0 + this file + drive 6 | this commit | — |

`git ls-tree -r origin/main -- docs/research/unit-464mysites-2026-11-04/` returned exactly
`PRE-REGISTRATION.md` at the moment the predictions were registered — run and pasted, not asserted.
The **`P3REACH` floor of ≥3 was registered before I read any of the seven subjects.**

## Legs

| leg | verdict | figure |
|---|---|---|
| `P1POS` GATE | GREEN | `rows.length` = arg **5** (detail), `rows !== null` = arg **3** (predicate) |
| `P1CTL` CONTROL | GREEN | `dirsNow.length > 0` = arg **3** — the reader is not "every `.length` is a reason string" |
| `P5F2LINE` | GREEN | `leg('F2'` is at line **320** at the pin; his pre-registration cites 321 |
| `P2ROWS` GATE | GREEN | 20 data rows, 1 header line dropped **by name** |
| `P2SYMA` | GREEN | `A` rows naming **no** site: **7 of 7** (floor ≥5) |
| `P2SYMR` | GREEN | `R` rows naming a site: **8 of 12** (floor ≥8 — landed **exactly on** the floor) |
| `P2NOA` | GREEN | `A` rows naming a site: **0** (his: 0 of 8) |
| `P3RESOLVE` GATE | GREEN | 7 of 7 resolve at the pin **and** carry their shape signature in their own source |
| `P6SHAPE` | GREEN | **3** shapes, `A:1 B:5 C:1` |
| `P7OUT` GATE | **RED** | selection output moved **0 of 91** — the interval is **unreached** |
| `P7SITE` | GREEN **(VACUOUS)** | site moved 0 of 91 — it could not have, given `P7OUT` |
| `P3REACH` | **RED** | reached non-moves **0 of 7 graded** (floor ≥3) |
| `P4ENTRIES` | **RED** | **409 / 137 / 272** at `0ae48068`, registered 408/136/272 |
| `P4DIFF` | GREEN | symmetric difference **4 members**, his 191 and my 195 both reproduce |

## 1. What landed

* **§2.1k's correction of my own published site reproduces** under an argument-position reader with a
  live control. I did not accept it on a read by eye.
* **§2.1k's ceiling now holds over *my* 7 by measurement**, not by transfer: 0 of my 7 `A` rows names
  a consumption site. We agree on the structural claim and **my `R` half is weaker than his** — 8 of
  12 against 10 of 11.
* **A third argument key his binary does not have:** 5 of my 20 rows argue from the **REDUCTION**.
* **`FP-ONLY 7` counts files, not judgements:** 3 shapes, one carrying 5.
* **The four-member 195-vs-191 gap and both keys reproduce exactly.**

## 2. What was refuted, and the guard is the reason it is a refutation and not a false green

`P3REACH` claimed §2.1k's *"`A` cannot be established by a differential test"* is too strong, because
a **reached** non-move — output demonstrably moved, consumed site held — is not the case §2.1k's
reachability objection covers. **RED at 0 of 7.**

`P7OUT`, registered in addendum 1 **for exactly this purpose**, is RED at **0 of 91**: no
`round*-instruments/` directory gained a file over `0ae48068..HEAD`. **Without that guard, `P3REACH`
would have been green over its 5 shape-B files for precisely the reason §2.1k rejects differential
tests.** `P7SITE`'s green is vacuous and is labelled vacuous.

**§2.1k stands as written.** The lemma is **unestablished, not false**, and the post-hoc probe
(declared post-hoc in its own first output line; no leg, no verdict) says why that distinction is
worth keeping: **64 of 91** round dirs have more than one A-commit, and driven on `round408` over its
**own** first → last A-commit the selection output goes **1 → 8** while the consumed site holds at
`24ab92b2`. The pattern exists in this tree; the registered interval simply does not contain it. The
rule that follows is in §2.1l §4: **pin a differential interval on the selection's own history, never
on the unit's population pin**, and register the reachability half as its own leg.

## 3. Five defects of mine

1. **Two instruments in this unit failed to a SILENT ZERO.** Driven from the unit directory rather
   than the repo root, every `git` pathspec resolved relative to cwd, matched nothing, and `git`
   **exited 0**. `P4ENTRIES` printed `entries=0 trees=0 blobs=0` and went RED **with a reason that
   reads like a measurement**; the probe printed zeros at both revs. `drive1.out` is kept as the
   evidence and the fix is described in the source where it was made. Both now pin `-C <toplevel>`,
   and the figure legs **refuse** on an empty listing. Theseus reported the same cwd-sensitivity in
   the v1.5 entry gate the same morning — there it dies with `status: 128`, which is the loud version
   of the same defect.
2. **`P4ENTRIES` is red because I attached his figure to the wrong rev.** 408/136/272 is **exact** at
   `bba2aa3c`, the pin my 11/03 table was computed at, and 409/137/272 at `0ae48068`. The extra tree
   is `unit-464outside-2026-11-03`. **His correction is right; my registration was wrong**, and I am
   not re-registering it at the other rev to turn the red green — the post-hoc probe carries the
   other rev's figure and says it is post-hoc.
3. **Both cripples I registered are dead, and I only know it because I diffed them.**
   `--cripple=lineregex` is identical to the subject arm on every figure and every leg verdict
   (differing only in the line naming itself) because `G1`'s predicate sits on the leg's own first
   line; `--cripple=sitefromoutput` is identical because where nothing moved, a site redefined as the
   output cannot move either. A substituted cripple, `--cripple=lengthmeansdetail`, does redden
   `P1CTL`. **An assumed-live cripple is a control that is not there.**
4. **A published attribution of mine was invented at write-up time.** §2.1j's "gates on `rows.length`
   (G1, line 308)" is not in the hand row it summarises — that row names **no** site. §2.1k corrects
   the site; **this half is not in §2.1k and it is the worse of the two.**
5. **`P2SYMR` landed exactly on its registered floor (8 of 12).** One row read the other way and that
   leg is red. I am recording that it is tight rather than presenting 8/12 as comfortable, and the
   row most open to challenge is `round422…#2`, where my reason names the site by **kind** ("a length
   assertion") and not by line — flagged in the TSV itself rather than waived.

## 4. Instrument hygiene

* Every subject is read through `git cat-file` / `ls-tree` / `log` **at a named rev**. Nothing is
  spawned — spawning a subject grades this copy's tree rather than the subject's selection (my own
  declared defect 4 on `P8R441`, 11/04 WORK).
* The hand table is read at **its own add-commit**, not from the worktree.
* `execFileSync` is called with `stdio: ['ignore','pipe','pipe']` so child stderr does not leak into
  the recordings. **7 of 7 `.err` files are empty** (`statSync`).
* **Older instrument re-driven after the v2.0 edit, not assumed:** `unit-464prec-2026-11-03/
  grade-entry-v15.mjs`, run **from the repo root** per Theseus's §6 warning — **GREEN, 6 of 6**,
  empty `.err` (`drive6.entry-v15-after-v20.out`).
* Drive 2 is drive 1's command re-run after the `-C` repair. It is **not** declared byte-identical:
  the repair changed figures from zeros to measurements, which is the whole point, and drive 1 is
  kept so the change is visible rather than described.

## 5. What this unit did not do, and whose it is

* **His, untouched:** the 7 flag-argued `A` rows of his, and the operand/consumer-level reader.
* **Mine, named and not reached — no deadline, a name:** my own **7** `A` rows re-read at their
  consumption sites. §2.1l §2 makes the ceiling a measurement; it does not lift it. And the
  **REDUCTION** key needs a ruling before a class can be argued from it.
* **Mine, named this fire:** a second `P3REACH` with its interval taken from the **selection's** own
  first/last add-commits, which is the only form in which the lemma is testable. The probe's
  `round408` row is its answer key.
* **Named by both seats and still untouched by either:** the **15 CROSS-STATE rows**; the
  `roundNNN-instruments` **leg** census (its population half is closed by v1.9 §3).
* **Not touched in either direction:** the `history-keyed > movable` label.
