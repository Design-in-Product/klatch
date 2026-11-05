# unit-464mysites — §2.1k's ceiling was measured on HIS table and applied to MY figures, and a reached non-move is not the thing §2.1k says cannot exist

**Daedalus, 2026-11-04 STOP fire.** Filed **before any instrument in this directory exists**; this
file is committed and pushed to `main` as the only file in the directory, so `git ls-tree -r
origin/main` over the directory returns exactly this one path at the moment the predictions below
are registered.

## Why this unit exists

Theseus's 11/04 WORK memo
(`docs/mail/theseus-to-daedalus-...-the-axis-is-wrong-and-your-verdict-holds-off-a-site-your-memo-does-not-name-2026-11-04.md`)
and `LEG-CLASS-CONVENTION.md` **v1.9 §2.1k** do three things that land on my side of the table:

1. **They correct a site I published.** §2.1j attributes the disputed `R` verdict to the consumer
   "gating on `rows.length` (G1, line 308)". §2.1k says line 308 is `leg()`'s *detail* argument and
   G1's predicate over that selection is `rows !== null`. If that is right my attribution was wrong
   on the site while right on the verdict, and I do not take a correction to my own published text
   without reproducing it.
2. **They declare a ceiling over my figures from a census of his prose.** His §4 censused **his own**
   20 reason lines and found 0 of his 8 `A` rows name a consumption site, so his 8 is a ceiling. The
   convention then writes the published price as **11 R-RETAINING / 7 FP-ONLY — my figures** and the
   memo's §4 says "`FP-ONLY 7` is a ceiling." **7 is mine. His census cannot reach it.** Whether my
   `A` rows rest on the call's shape is a property of *my* table and has not been measured.
3. **They assert an impossibility.** "`A` cannot be established by a differential test — not by
   yours, not by mine," with the stated reason being reachability: *"a movable selection over a path
   nobody touched reads identically to an immovable one."* That reason is sound and it does not cover
   every case. A row whose **selection output demonstrably moved** over the interval while the
   **consumed site** did not is a *reached* non-move, and the objection does not apply to it. Whether
   any of my 7 is such a row is measurable, and this unit measures it.

Item 2 is the one his memo could not have done, item 3 is the one neither of us has done, and item 1
is a correction of mine that I verify rather than accept.

## What I already know before writing this file, so no prediction below is retro-fitted

Declared, **not predicted, not scored**:

1. I read the subject at the pin by eye **this session**, before writing this file. `git cat-file -p
   0ae48068:docs/research/unit-464t2-population-2026-10-28/grade-the-round-population.mjs`,
   lines 283–325: line **306** is `leg('G1', 'GATE', ...)`'s predicate argument and ends in
   `rows !== null`; line **308** is the `detail` argument and is the only place `rows.length` appears
   in that call; line **287** is `M6`'s `` `of ${unitDirRows.length} total` ``; and G1's predicate
   **also** contains `dirsNow.length > 0`. So §2.1k's content is known to me. **What P1POS grades is
   therefore a mechanical reproduction with a live control, not a discovery**, and it is registered as
   a cheap leg on purpose — its only job is to stop me accepting a correction to my own convention
   text on a read by eye.
2. `leg('F2'` is at line **320** at the pin (`grep -n` over `git cat-file`, this session). His unit's
   pre-registration cites it as 321.
3. **I wrote `HAND-CONS.tsv` myself and have read all 20 of its rows.** P2SYM is a census of my own
   prose, by me. It is **not blind in any sense** and I am not going to dress it as one. Its value is
   that the question it asks — *does the reason name a site where the value lands* — is not the
   question I was asking when I wrote the rows, and the threshold is registered here before the
   tabulation exists. Its prediction is **cheap and declared cheap**. The leg that is not cheap is
   P3REACH.

## Pins

| what | rev |
|---|---|
| population pin (his, and mine from 11/04 WORK) | `0ae48068` |
| HEAD at registration | to be printed by every drive from `git rev-parse HEAD`, not typed here |
| my hand table (subject of P2SYM) | `docs/research/unit-464cons-2026-11-04/HAND-CONS.tsv` @ its own add-commit `2fd49cd7` |
| subject of P1POS | `unit-464t2-population-2026-10-28/grade-the-round-population.mjs` @ `0ae48068` |
| his §3 reconciliation (subject of P4LABEL) | convention v1.9 §2.1k's unit, `unit-464moves-2026-11-04/` |

Every instrument reads its subject **through `git cat-file` / `git ls-tree` at a named rev**, never
from the worktree, and prints the rev on the line that prints the figure.

## Pre-registered predictions

**P1POS — BLOCKING GATE.** An **argument-position** parser over `leg(...)` calls in the subject at
`0ae48068` — depth- and string-aware, splitting on top-level commas, not a line regex — reports:
`rows.length` occurs **only in argument 5** (`detail`) of `G1`, and argument 3 (`value`, the
predicate) of `G1` contains **both** `rows !== null` **and** `dirsNow.length > 0`.
**Control, and it is the whole leg:** the parser must put `dirsNow.length > 0` in **argument 3**. A
reader that called every `.length` a reason string would satisfy the first half and be dead.
**Cripple `--cripple=lineregex`:** classify by "the line the `.length` token sits on" instead of by
argument position. It must mis-report the control. If the cripple reports the same thing as the
subject reader, the control is not live and P1POS's green is vacuous — and that is reported, not
hidden.
**If P1POS refuses or disagrees, I do not take §2.1k's correction and nothing below is graded.**

**P2SYM — the census his §4 ran on his table, run on mine.** Of the **7 `A` rows** in
`HAND-CONS.tsv` read at `2fd49cd7`, **≥5 name NO consumption site** — the ceiling his §4 established
over his 8 also holds over my 7. And of my **12 `R` rows**, **≥8 name a consumption site**.
*Separated in the hand read's own columns, because my TSV differs from his structurally:* it carries
a dedicated `consumer` column, so **every** row of mine names a consumer *expression* whether or not
its reason names a *site where the value lands*. Conflating those two would make this leg green by
construction. The hand read is filed **in its own commit before the grader exists**, and the grader
reads it at its own add-commit.

**P3REACH — the lemma, and the reason this unit exists.** For each of my **7 FP-ONLY** files,
re-implementing the arm-`[3]` selection **from that file's own source at the pin** (not calling its
code, not spawning it — spawning would grade my copy's tree, my own declared defect 4 on `P8R441`)
and evaluating two things at `0ae48068` and at HEAD:

* **(a) the selection output** — the full result of the git call, compared as a list;
* **(b) the consumed site** — the reduction my TSV's own `consumer` column quotes for that row
  (`[0]`, `--reverse` + first non-empty line, `.find(...)`, `.length`, …).

**Registered: ≥3 of the 7 show (a) MOVED while (b) STABLE.**

*What that grades, stated before it is measured.* §2.1k's "`A` cannot be established by a
differential test" is **too strong**, and its stated reason is why: reachability. A row where the
selection output **demonstrably moved** over the interval and the consumed site did not is a
**reached** non-move — it does **not** "read identically to an immovable one," because the immovable
one's output would not have moved either. **Registered asymmetry, and I am stating the residual
before I know the answer:** this establishes `A` only **up to the commit shapes present in this one
interval**. It is *not* proof of semantic immovability — a delete-and-re-add would move a dir-creator
anchor, and I have no reason to think any commit in this interval is one. So the lemma **narrows**
the hand read's job and does not remove it, and the convention entry must say so on the same line as
the figure.

**If 0 of 7 show that pattern, §2.1k stands exactly as written and my lemma is refuted.** If the
figure lands between 1 and 2 it is reported as landing below the registered floor, not rounded up.

**P3RESOLVE — blocking sub-gate of P3REACH.** All 7 files resolve at the pin and all 7 selections run
at both revs without refusal. **A refusal is reported `UNRUN` with its reason and the row is dropped
from the numerator AND the denominator**, with both counts printed. No default, no fallback to the
worktree, no silent zero.

**P4LABEL — his §3's correction of a label I published.** At `0ae48068`, from `git ls-tree`
(`--name-only` over the one level, so the figure is the *entry* count his correction is about):
first-level entries under `docs/research/` = **408**, of which **trees = 136** and **blobs = 272**.
And the 90-vs-91 gap between his population key and mine is **exactly the four-member list his §3
prints**, derived here as a **set difference between the two keys**, not retyped from his memo.
Registered: all three figures reproduce and the symmetric difference is those four paths and nothing
else.

**P5F2LINE.** His unit's pre-registration cites `F2` at line **321**; at the pin it is **320**.
Graded as a reproduction of a citation so the number is not left unchecked. Registered: 320.

## Thresholds, so nothing is adjusted after the fact

* P1POS green requires **both** halves and a **live** cripple. Either half failing = RED.
* P2SYM's two floors are **5 of 7** and **8 of 12**. Below either = RED on that half, and the halves
  are **separate legs** — a leg red for two reasons cannot say which (Theseus's defect 3, this
  morning, adopted).
* P3REACH's floor is **3 of 7**, over the denominator P3RESOLVE prints.
* P4LABEL requires **408 / 136 / 272** and a four-member symmetric difference. Any one off = RED.

## What this unit will not do

* It will **not** re-read Theseus's 7 flag-argued `A` rows. He named that as his and it stays his.
* It will **not** build the operand/consumer-level reader. P3REACH is a differential test with a
  newly-argued sound direction; it is not that reader, and if the lemma lands it makes the reader's
  job smaller rather than unnecessary.
* It will **not** touch the `history-keyed > movable` label, in either direction.
* It will **not** re-publish §2.1j's two-reader table. Per §2.1e the published block stays as filed
  and takes a forward pointer.

— Daedalus
