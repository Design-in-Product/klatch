---
agent: Daedalus
date: 2026-11-13
model: claude-opus-5
---

# 2026-11-13 — Daedalus session log

## 09:17 — START fire (substantive)

`date`-reads this fire: **09:17** and **09:32:01 PST**, read not estimated from effort.

Today's first Daedalus fire — no 11/13 log existed, so this file is created rather than appended to.
Iris, Calliope and Argus had each already filed an 11/13 START entry (`3b643c67`, `40fc8d64`,
`1daa2bda`), all three no-ops on product.

**Briefing:** pulled (worktree synced by the wrapper), read `docs/COORDINATION.md` (my section at
`:963`), `docs/briefs/cross-pollination/current.md`, and `ls docs/mail/`.

**Mail delta, not a re-read of the directory.** Checkpoint = my own last commit `8ebd2fda`;
`git rev-list --count 8ebd2fda..HEAD` = **16**; `git log 8ebd2fda..HEAD --diff-filter=A -- docs/mail/`
→ **2 added, both addressed to me**:

| memo | state at end of fire |
|---|---|
| Theseus → me + Argus, 11/12 STOP (blind-spot member's price) | **acted on** — §2's two items are this fire's unit; replied `2540bbab` |
| Argus → me + Theseus, 11/12 STOP (hash reachability) | **closed** — verified my §8 finding, nothing owed; `git mv`'d to `docs/mail/read/` |

### The work

Theseus's §2 routed two things to this seat by name — a take-or-decline on a sixth source for the
attested round population, and a "named not fixed" consumer trap in `SOURCE_RECALL_FLOOR`. Both are
in my own module, `docs/research/lib/attested-rounds.mjs`.

Unit `docs/research/unit-465maildurable-2026-11-13/`. Pre-registration **`6c9a4348`, pushed to
`origin/main` before any arm in the unit existed**, carrying ten predictions *and* a binding
take-or-decline rule. Unit + cure **`a827c5cd`**; additive legs + RESULTS **`22e73bad`**; memo
**`2540bbab`**.

```
drive1.precure.out            VERDICT/0 GREEN legs=14 red=[]    refused=[T11,T12]
drive2.postcure.out           VERDICT/1 RED   legs=14 red=[T11] refused=[]
drive3.postcure-additive.out  VERDICT/1 RED   legs=16 red=[T11] refused=[]
drive4.standing-cell-postcure.out   VERDICT/1 RED legs=26 red=[T2b] refused=[T8]   (the live consumer)
```

**Ten of ten predictions held, and the finding is none of them.**

1. **The durability premise routed to me is false, on my own filter.** `affirmedBySubject` is built
   per row, so a round is dropped only when *every* attestation is a denial — and round 9 has **two**
   committed non-denying subjects. Measured through the module's own `denialRe` seam: denying 9 on
   **one** row leaves it in (`T1`); on **both** removes it (`T2`, the control). One future denial
   cannot reach it.
2. **Taken anyway, for a member neither memo named.** At-risk — in `filtered`, not in `nonSubject`,
   exactly one non-denying row — is **`[10, 270, 282, 319, 466]`**; strict `S6` covers **`[10]`**.
   `|filtered|` 466 → 466 at the current rev, 465 → 466 `gained=[9]` at `3ee13880`. **One member made
   denial-proof, no figure moved.** The pre-registered rule (no member change ∧ ≥1 at-risk covered ∧
   nothing reclassified outside `docs/mail/`) is what decided it, written before the arm existed.
3. **`T11` — the leg that grades the cure, not the subject — went RED on my own cure.**
   `unattestedRoundsAt` counts paths **no source claims**, so its value is a function of the
   **classifier** as well as the tree rev. Fixing the rev-scoping *and* adding `S6` in one commit
   made the pinned known-positive unreproducible **at its own rev** (207 → 127). Kept red, not
   re-keyed; `T13`/`T14` added additively and the gap **attributed**: 207 − 127 = 80 = exactly the
   paths `S6` newly claims there. The pin now carries `classifierRev` and `selfTest()` requires it.
4. Two more of my own: `selfTest`'s `size >= 5` coverage assertion was **satisfiable by the sixth
   source it should have caught** (re-keyed count-free on `SOURCE_IDS`); and the docblock's
   never-measured *"a date read as a round"* is really the **tail of the word *workaround*** plus a
   year, now a graded near-miss on a real in-tree path.

**Live consumer driven, not reasoned about.** `round464-instruments/grade-the-stop-condition.mjs`
imports this module; `drive4` vs the 11/12 recording has an **identical verdict line and identical
figures on all ten of its predictions**. The one figure that moved — `n=465 → 466` — is **pre-cure**
at `6c9a4348` (round 9 attested between fires by my own two commit subjects), not the cure.

**Gate:** none owed and none claimed — `git diff --name-only` over this fire's commits touches only
`docs/research/lib/attested-rounds.mjs` and this unit's directory; `typecheck:scripts` does not cover
`docs/research/lib/` and `readdirSync('scripts')` does not see it. Census hook **CENSUS OK —
155 / 45 / 110** on every commit. Cured contract checked directly: live `selfTest()` → `true`,
`SOURCE_IDS` → `S1,S2,S3,S5,S6`.

**Declared limit, written down rather than papered over:** `drive2`/`drive3`'s `DIAG` line is a
five-source reading at HEAD and does not say so — the exact axis finding 3 is about. Not re-driven;
a fourth recording of the same arm to correct a label mints another non-interchangeable artefact.
Annotated in `RESULTS.md` §7.

**Drain (bounded, per Klatch's recorded exception):** both new memos read and acted on in the same
fire; the routed decision taken and measured; Argus's thread closed to `read/`; my task file's stale
*+1 member* price replaced with the measurement; mail re-checked after the push, nothing further for
me. **Boarded with no blocker:** the four at-risk members `S6` does not protect; a mechanism-keyed
census of the `(rev, classifier)` scope defect. **Deferred with named blockers:** scanner-passes-the-
option (xian/Janus); the stop condition's unit (xian/Janus); `--dry` on M (no scratch server
non-interactively); the 8/18 ten pairs; `unit-465plant` P1–P4.

### 09:32 — wrap verification

Per CLAUDE.md's Session Wrap Protocol — commits confirmed on `origin/main` after `git fetch`, and
every deliverable `ls`'d. Output pasted below rather than summarised.

**Step 1 — `git log origin/main --oneline -5`:**

```
24e2f6a2 coord+log+tasks: 11/13 START fire — the routed durability premise is false on my own filter, …
2540bbab mail: to Theseus + Argus — the durability premise is false on my own filter, …
22e73bad unit-465maildurable: the pin's scope is (tree rev, classifier) and the cure moved the second axis …
a827c5cd unit-465maildurable + cure: the durability premise is false on the live filter, …
6c9a4348 pre-reg: unit-465maildurable — the durability premise is graded, not adopted, …
```

**Step 2 — deliverables, read off `git ls-tree origin/main` and not only off disk:**

```
docs/research/unit-465maildurable-2026-11-13/PRE-REGISTRATION.md             6278 B
docs/research/unit-465maildurable-2026-11-13/RESULTS.md                     11094 B
docs/research/unit-465maildurable-2026-11-13/arm-maildurable.mjs            24915 B
docs/research/unit-465maildurable-2026-11-13/drive1.precure.out              5068 B
docs/research/unit-465maildurable-2026-11-13/drive2.postcure.out            5116 B
docs/research/unit-465maildurable-2026-11-13/drive3.postcure-additive.out    5619 B
docs/research/unit-465maildurable-2026-11-13/drive4.standing-cell-postcure.out  33732 B
docs/logs/2026-11-13-daedalus-log.md                                        (this file)
docs/research/lib/attested-rounds.mjs                                       31180 B  (the cure)
docs/mail/daedalus-to-theseus-argus-…-on-a-second-axis-2026-11-13.md         9540 B
docs/mail/read/argus-to-daedalus-theseus-…-claimed-not-started-2026-11-12.md 2522 B  (closed)
```

`scratch/` is absent from the tree, correctly — `.gitignore:60` (`docs/research/unit-*/scratch/`)
covers it, checked with `git check-ignore -v` rather than assumed.

**Mail re-check after the pushes** (`git log 8ebd2fda..origin/main --diff-filter=A -- docs/mail/`):
three additions over the whole range — the two I acted on and my own reply. **Nothing new arrived
during the fire**, so this is the second consecutive check finding nothing.

**One thread deliberately left open:** Theseus's 11/12 memo stays in `docs/mail/` rather than moving
to `read/`. My reply **contests its §2 premise**, so the thread is not closed from his side — he has
not seen the refutation yet. Argus's thread *is* closed (`read/`): he verified my finding and nothing
is owed either way. Recording the asymmetry rather than treating "I replied" as "it's done."

---

## 13:17 — Session resumed · WORK fire (substantive)

**Model:** claude-opus-5. `date`-reads **13:17:08** and **13:35:24 PST**, read not estimated.

**Briefing.** Pulled (worktree synced by the wrapper), read `docs/COORDINATION.md`, listed
`docs/mail/`. Checkpoint my own **`24e2f6a2`**; `rev-list --count 24e2f6a2..HEAD` = **14**. Mail delta
over that range (`--diff-filter=A -- docs/mail/`) → **1 added, addressed to me**: Theseus's
`unit-465s6bounds` memo, five items. **Commit author checked rather than assumed** — the `9ced1e2f`
MID-fire commit at the top of my worktree is **Calliope's**, and the six below it are Theseus's, so
none of the 14 are mine to account for.

**All five routed items acted on in this fire.** Unit `docs/research/unit-465routecure-2026-11-13/`.
Pre-registration **`72a43aba` pushed to `main` before any arm in the unit existed**; arm A
**`aaf7ba4c`**; cures 1–4 + arm B **`130bb6fc`**; cure 5 + arm C **`755e489f`**; arm D
**`d8822cb6`**; results + memo **`72b8e3bb`**.

```
drive1.precure.out   VERDICT/0 GREEN legs=18 red=[]                        preds=14
drive2.postcure.out  VERDICT/1 RED   legs=19 red=[R13e,R18,R19-separatorTolerant] refused=[R19-boundaryFree]
drive3.armc.out      VERDICT/1 RED   legs=10 red=[C4-separatorTolerant]
drive4.armd.out      VERDICT/0 GREEN legs=12 red=[]
```

**13 of 14 predictions held. The one that failed failed twice, for two different reasons, and both
are the findings.**

1. **I declined the routed cure as written, and the memo's own §4 is why.** *"Compose the sliced
   classifier with HEAD's reader"* pins two axes and leaves a **third** live — and that third,
   `unattestedRoundsAt`'s round key, was under repair in the same memo. It also cannot work (`R4b`:
   HEAD declares `[S1,S2,S3,S5,S6]`, the classifier at `6c9a4348` returns `[S1,S2,S3,S5]`, so a
   splice leaves `S6` unproducible and the hybrid throws). `R4`: the **whole** slice at that rev
   returns `true` from its own `selfTest()`. **Slice, do not splice.** `reproduceFloorReading(repo)`
   hits the pin to the digit — `paths=207 outside=[9]`.
2. **The design claim, driven in one drive (`R13b`):** `unattestedRoundsAt(HEAD).rounds` **121 → 145**
   while `reproduceFloorReading` stayed `ok=true`. `R13c` keys it on the function's own source — it
   does not call `unattestedRoundsAt`. **Honest limit written down:** the four reader lines are
   HEAD-authored and editable; the design buys a **red**, not immutability.
3. **THE FINDING — the routed `T4p` survived the cure I wrote for it.** `C4-separatorTolerant` RED:
   the in-tree near-miss case was still deletable with `selfTest()` green, and `C5` confirms the
   cripple landed. The two foils are **nested**, so one witness satisfied both links. Cured with
   `S6_FOIL_CHAIN` (successor-refuses-it per link); `D1`×2/`D3`/`D5` throw naming the right thing
   against a matched uncrippled baseline (`D0` green). **Pairwise isolation is unsatisfiable, not
   weak** — the narrow foil has no path the wide one refuses. **`D4` declared limit:** the order
   check is **dominated** at length 2 and cannot fire; recorded as one guard, not two.
4. **My own grading arm crippled the wrong tree.** Arm B's `crippleLive()` read `git show HEAD:`
   with the cure uncommitted, so three legs graded the pre-cure file and reported it as the cure
   failing. **A stale-source red carries no mark distinguishing it from a defective cure** — caught
   only because `R13e` failed as a missing export. Baseline from a committed rev, subject from the
   thing just cured: two inputs, two provenances. Arm B **kept as recorded**, not re-driven.
5. **Denominator correction that is mine, not his:** arm A printed **114** mail paths naming `round`
   beside his **80**. `R15b` attributes it — substring key 114, `round`+digits 80 (his, exact, and
   also the S6-claimed count). 0 reclassified under both, so nothing downstream moves, but *"his 80
   reproduces"* would have been false.
6. **`R17c`, the half that would be easy to bury:** the §4 widening closed **no** otherwise-unattested
   round — `outside=[]` before and after. A cure can be correct and change no figure.

**Live consumer driven, not reasoned about** (`C6`): `grade-the-stop-condition.mjs` verdict line
**byte-identical** to this morning's recording. Arm C deliberately **not** re-driven at a later
`--cure-rev`, because it writes `drive5.standing-cell.out` under a fixed name and a re-drive would
re-stamp a committed recording; arm D is a separate file for that reason.

**Gate:** none owed and none claimed — `git status --porcelain packages scripts` empty on all four
drives. Census hook **CENSUS OK — 155 / 45 / 110** on all five pushes. `scratch/` `git check-ignore`d
against `.gitignore:60`; arm scratch at `scratch/b|c|d` **deliberately**, since a sibling
`scratch-b/` would not match that rule and would be committed.

**My own published figure corrected rather than silently edited:** the `at-risk` five-member table in
my START coordination entry is a **pre-`S6` reading under a post-cure rev label**. Correction block
added inline with Theseus's `U1`–`U4` figures (`[270,282,319,466]`, size 4, gap `[10]`). Same
`(rev, classifier)` defect one surface over, in my own prose, hours after writing the mechanism down.

**Drain (bounded, per Klatch's recorded exception):** one new memo, read and all five items acted on
in the same fire — four cured, one accepted and corrected in prose; reply filed and pushed to `main`;
the 11/12 thread Theseus closed with *"I have nothing to defend"* moved to `docs/mail/read/` together
with my reply. **Boarded, no blocker:** the chain order check being dominated at length 2; whether
any of the 28 leaked rounds is otherwise unattested at a rev other than HEAD. **Deferred with named
blockers:** scanner-passes-the-option (**xian/Janus**); the stop condition's unit (**xian/Janus**);
`--dry` on M (no scratch server non-interactively); the 8/18 ten pairs; `unit-465plant` P1–P4.

**One thread deliberately left open:** Theseus's 11/13 memo and my reply both stay in `docs/mail/`.
My reply routes a mechanism to **Argus** that he has not seen, and contains a finding Theseus may
want to verify (his `T4p` surviving its cure), so the thread has an open item and is not mine to
close from one side.

### 13:4x — wrap verification

Per CLAUDE.md's Session Wrap Protocol. Commits confirmed on `origin/main` after `git fetch`, every
deliverable read off the **pushed tree** (`git ls-tree -r origin/main`) and not off disk. Output
pasted rather than summarised.

**Push was rejected once, non-fast-forward** — Argus landed `ab3da5ae` mid-fire. Rebased onto
`origin/main` (clean, no conflicts), verified my commit was still present with
`git log --oneline -3` **before** pushing, then pushed. No force push; none authorised and none
needed.

**Step 1 — `git log origin/main --oneline -7`:**

```
7f39da41 coord+log: 11/13 WORK fire — the routed T4p survived its own cure, and my grading arm crippled the wrong tree
ab3da5ae pre-reg: unit-465t3nonempty — Theseus's T3 missing non-emptiness conjunct, claimed 11/12, taken here   (Argus)
72b8e3bb results+mail: the routed T4p survived its own cure because nested foils share one witness, …
d8822cb6 unit-465routecure: arm D — the chain cure is non-vacuous, and the order check is dominated
755e489f unit-465routecure: arm C — the routed T4p survived my cure, because nested foils share one witness
130bb6fc unit-465routecure + cure: the route is a function that owns its reader, …
aaf7ba4c unit-465routecure: arm A — the routed figures all reproduce, …
```

Pre-registration `72a43aba` is below this window and was pushed before any arm existed.

**Step 2 — deliverables, read off `git ls-tree -r origin/main --long`:**

```
docs/research/lib/attested-rounds.mjs                                   44376 B  (the cure)
docs/research/unit-465routecure-2026-11-13/PRE-REGISTRATION.md           7404 B
docs/research/unit-465routecure-2026-11-13/RESULTS.md                   14757 B
docs/research/unit-465routecure-2026-11-13/arm-routecure.mjs            17456 B
docs/research/unit-465routecure-2026-11-13/arm-routecure-b.mjs          17565 B
docs/research/unit-465routecure-2026-11-13/arm-routecure-c.mjs          12150 B
docs/research/unit-465routecure-2026-11-13/arm-routecure-d.mjs          10587 B
docs/research/unit-465routecure-2026-11-13/drive1.precure.out            3368 B   (.err 0 B)
docs/research/unit-465routecure-2026-11-13/drive2.postcure.out           4420 B   (.err 0 B)
docs/research/unit-465routecure-2026-11-13/drive3.armc.out               2852 B   (.err 0 B)
docs/research/unit-465routecure-2026-11-13/drive4.armd.out               3748 B   (.err 0 B)
docs/research/unit-465routecure-2026-11-13/drive5.standing-cell.out     33738 B
docs/mail/daedalus-to-theseus-argus-…-crippled-the-wrong-tree-2026-11-13.md       (present)
docs/mail/read/theseus-to-daedalus-argus-…-summary-line-2026-11-12.md             (closed)
docs/mail/read/daedalus-to-theseus-argus-…-on-a-second-axis-2026-11-13.md         (closed)
```

All four `.err` captures are **0 bytes** — stderr was redirected separately on every drive, so no
child's stderr is interleaved into a recording.

`scratch/` is absent from the pushed tree, checked by asking for it explicitly
(`git ls-tree -r origin/main -- …/scratch` → no entries) rather than inferred from `.gitignore`.

**Mail re-check after the pushes** (`git log 24e2f6a2..origin/main --diff-filter=A -- docs/mail/`):
**two** additions over the whole range — Theseus's memo, which I acted on, and my own reply.
**Nothing new arrived during the fire**, so this is the second consecutive check finding nothing.

---

## 17:17 — Session resumed · STOP fire (substantive)

**Model:** Opus 5 (`claude-opus-5`). `date`-read **17:17:29 PST** at open and **17:5x PST** at
close, read not estimated.

**Briefing.** Pulled (wrapper synced the worktree). Checkpoint = my own last commit **`0b8aa23e`**;
`rev-list --count 0b8aa23e..HEAD` = **9**. **Commit author checked, not assumed, and it mattered:**
`afa76b20` at the top of the worktree is **Calliope's**, and `3c2bdbc1`/`e6c9ca01`/`dabfe5ab` —
whose subject lines read like answers to the chain-order question I had open — are **Theseus's**, not
mine. I had started to read them as my own work already done. Mail delta over the range
(`--diff-filter=A`) → **2 added, both addressed to me**, neither acted on before this fire.
Cross-pollination brief read: `current.md` is a 3-line pointer to the private brief (public repo),
so nothing project-affecting in-tree.

**Unit `docs/research/unit-465chainfloor-2026-11-13/`.** Pre-reg **`32feaa52`** pushed to `main`
before any arm existed; arm A **`0acea553`**; the two cures **`f7b67f13`**; arms B/C + the arm-D
addendum **`fd53956e`**; arm D + results + memo **`294756e3`**.

**18 pre-registered predictions; 14 held, 4 refuted (P8, P16, P17, P18).**

**0. My own grading was wrong in my own favour, and it goes first.** `P8` pre-registered *"the
message names **both** spellings"*; the floor is a `for` over two required names and `must` throws at
the **first** miss, so one throw can only name one — **unsatisfiable, not merely unmet**. The leg I
then wrote tested `separatorTolerant || boundaryFree`, weaker than the text it graded, and the arm
recorded HELD. Corrected by hand in `RESULTS.md`; the arm left as it ran.

**1. The claim Theseus left me is driven, and the instrument is worse than his read.** Scratch tree
at the depth `arm-routecure-d.mjs` resolves; module from `755e489f`, instrument byte-identical from
`d8822cb6`. Emptied family → the module's own `selfTest()` **`true`**; arm D publishes
**`VERDICT/1 REFUSED legs=8 red=[] refused=[D3,D4]`** against a control of
`VERDICT/0 GREEN legs=12`. `D0b` green on an empty array, **0** per-link legs against 4, and `D7`
(*"the live module is green…"*) **green because of the vacuity**. Sharpening his read: `D3`/`D4`
**refuse** rather than redden, both via `selfTestUnder`'s *"the edit did not land"* branch, so **a
dead guard and a cripple that failed to apply are one published row** — exactly what his correction
to that machinery fixes, reached from the other side. His correction adopted in all three of my arms.

**2. §4 cured: a floor keyed on the two NAMES as literals in the assertion.** Not another exported
list (same defect one level up) and not a count — `B4`/`P11` drove the separation: both languages
kept under `looseA`/`looseB` makes `Object.keys(S6_FOILS).length >= 2` **true** while the name floor
**throws**. His objection to a count answered on its terms (`B3`/`P10`: a chained third foil throws
at the witness loop, never the floor). Attribution `B1b`: the same cripple at `755e489f` → `true`.
Price zero (`B2`/`P9`): `selfTest()` `true`, `SOURCE_IDS` unchanged, `|filtered|` **466**, that live
read pinned by `B0b` (47585 bytes both sides). **Declared limit:** names, not languages.

**3. §3 cured: the order check's remedy existed in no state that could print it.** `misordered`
replaced with *incomparable → cannot form a chain → reordering cannot help → split or drop*. `C1`
reproduces the old wording at `755e489f`, `C2` the new, `C3` red in the other order. His scope
correction written into the module's comment, and **two now-false-in-scope sentences in my own
`unit-465routecure/RESULTS.md` (*"kept for chains of 3+"*) corrected in place, struck not deleted.**

**4. THE FINDING — it refuted three of my four arm-D predictions, and it is about my instrument.** A
`grep -rln` census for `misordered` found an **executing** file I had not accounted for: Theseus's
`arm-foilchain-a.mjs`. Pre-registered P15–P18 (`fd53956e`) **before** driving, then ran **his arm,
unmodified, on his tree**. `A-src` RED as predicted (`worktree=8310290fda3f a5667195=fb6278e1e826`),
but `C1`/`C2` stayed **green** and his `P7`/`P8` still `LANDED`: **his cripples come from a pinned
pre-cure rev, and his `LIVE` constant is used for one thing only — the `A-src` hash pin. I read the
constant and inferred the subject.** `E6`: **`arm-routecure-d.mjs` has no `hash-object` pin at all** —
nothing in it asserts the live module is the rev it claims to grade. His `A-src` is the only leg in
either instrument that noticed my cure, and it is the design I mispredicted. Taken as mine, **not
patched here** (edits a committed arm with a standing recording; wants its own matched baseline).
`P17` is the keeper: **verdict right, mechanism false** — graded on the verdict alone it would have
read as held and the wrong reason would have travelled.

**Gate.** `git status --porcelain packages scripts` → `""` on all four drives (`A10`, `C5`, his own
`A-gate`, `E8`). Subject is `docs/research/lib/`, outside `typecheck:scripts` and outside
`readdirSync('scripts')`. Census hook **CENSUS OK — 155 / 45 / 110** on all five pushes. His
committed `drive1.arma.out` and his arm are **unmodified** after my drive (`E7`).

**Drain (bounded, per Klatch's recorded exception).** Both new memos read at session start and acted
on in the same fire: Theseus's four items (one driven, two cured, one accepted-and-corrected) and
Argus's informational close (**nothing owed — moved to `read/`**). Theseus's memo **left in
`docs/mail/`** because its §Argus item (whether Argus's `agree` compares the two `removed` sets) is
an open action neither of us has taken; moving it would hide a live ask.

**Boarded, no blocker, mine:** `arm-routecure-d.mjs`'s missing `hash-object` pin (`E6`) and its
`/misordered/` detector now blind to the cured throw (`C4`/`P14`). **No blocker, either seat:** the
floor pins names not languages; the crossing family here is 4 members so his two-member exhaustive
enumeration stands un-re-run; the §Argus `agree` leg. **Carried from earlier today, untouched, no
blocker:** the four at-risk members `S6` does not protect; the mechanism-keyed census of the
`(rev, classifier)` scope defect; the target-keyed screen (still unclaimed); `373` 15→16 + the
`:108` fixture; `377` 13→14; the shared guarded registry reader; `FILLER_LONG` unasserted.
**Deferred with named blockers (unchanged):** the scanner-passes-the-option behaviour change
(**xian/Janus**); the stop condition's unit (**xian/Janus**); `--dry` on M (no scratch server
non-interactively); whether my 8/18 ten pairs are among the twenty; `unit-465plant` P1–P4.

**Question box:** considered, nothing filed this fire.
