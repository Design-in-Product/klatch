---
agent: Theseus Prime (manual testing & exploration — CLI side)
date: 2026-11-09
model: claude-opus-5
---

# 2026-11-09 — Theseus session log

## 10:47 — START fire begins

`date`-read at 10:47 PT before any read of the tree, and again at 10:51 before the first edit.
Checkpoint `af6c451d` (the wrapper's sync). Branch `claude/theseus-cycle`, worktree
`/Users/xian/Development/klatch-worktrees/theseus`, clean at start.

**Briefing, done in full.** `docs/COORDINATION.md` head of my section read; `docs/mail/` listed and
counted with `readdirSync` (**84 live / 1188 read**); `docs/briefs/cross-pollination/current.md` read
— it is a pointer to the private brief URL for 11/09, as expected in a public repo, so no content is
quoted here.

**Commits since my last commit (`d79d20fb`, 11/08 STOP wrap) through `af6c451d`,** author-checked
rather than assumed: **14 — 6 Daedalus, 3 Calliope, 2 Claude, 1 Argus, 1 Iris, 1 Pard (Mediajunkie);
none mine.**

**Mail: two new memos since my last fire,** both addressed to me, counted with
`git log --name-only` over `docs/mail/` rather than inferred from the directory:

1. Daedalus ~09:3x — item 1 (`round377`'s six-site re-key) **is landed and graded**, my revised
   ordering accepted, step 2 handed to this seat: *"Step 2 is withdrawn into step 3, your call, your
   file."*
2. Argus ~09:4x — answers my closing question precisely rather than taking the match: my §1 is
   **not** his exit-code blocker, it is the reason-string-drift pattern this seat already cured once
   (`unit-464kind`, `unit-465skipE`), and the cure is to **remove** the number rather than refresh it.

**Both read in full before any edit.** The blocker my 11/08 STOP fire deferred on — *"`round377`'s
six-site re-key is Daedalus's and is not started"* — is therefore **closed**, verified by reading
`a8b366dd` and `b3fe7a86` rather than by taking his memo's word for it.

## 10:51 — unit-465rekey374: step 2 of the family pass

Pre-registration written and committed **before the instrument existed** (`cc15ee77`): nine
predictions, four declared refusals. Scope declared as two files — the subject
`scripts/probe-round374-…-the-drift-is-already-in-the-tree.mts` and the **`round374` row only** of
`scripts/sweep-probes.mjs`.

Baseline, driven before the edit: **8 of 8 green, exit 0**, and `A0`'s published reason confirmed to
read "is green on all 15", the drift site.

### What landed (`d9e1937d`)

- **`A0g`** — `unit-465guard374`'s already-graded presence guard on the unguarded
  `SWEPT.find((s) => s.file === R225)!`, **imported** from that unit's `cure.mjs` rather than
  re-typed, so this unit's green is not a reading of a copy.
- **`A0r`** — the second registry lookup the re-key stands on. Its own arm, not a conjunct of `A0g`:
  one arm asserting two independent registry claims cannot say which entry went absent. Conjunct is
  the headline **SHAPE** (`HEADLINE_SHAPE`, Daedalus's `probe-round377:124` spelling), not a count,
  so this file does not redden when he takes `round373` 15 → 16 in step 3.
- **Five frozen sites cured by removing the number**, on Argus's `unit-465skipE` precedent: the
  predicate, the `meas` text, `A0`'s own published reason, and two docblock sentences, plus the drive
  field named after the number. Raw literal **2 → 0**, `all15` token **5 → 0**, lines containing the
  number at all **9 → 0**.
- **Registry:** `expect` 8 → 10; the superseded `8/8` **respelled** to "8 of 8" with the reason in a
  note; a live `10/10` added so the agreement rule is neither drifted nor vacuous. `entryProblems`
  → `[]`, **run**, not inferred.

**One self-inflicted catch during the build, worth the record:** the first cured build left the
frozen literal at **1** occurrence — in the docblock explaining the cure, which quoted it verbatim.
That is the Round 371 shape handed back by my own measurement, inside the same fire. Reworded to
carry the FORM (`All <N> regression checks passed`) without the number; re-measured 0.

### Graded: 15 of 16 (`10dab4d0`)

Runs 1–3 refused or failed and are **committed**, not discarded. Full table in
`docs/research/unit-465rekey374-2026-11-09/RESULTS.md`.

- **`P4` — the defect, driven.** The pre-cure subject, against a registry whose `round373` entry is
  renamed away: **exit 0**, its own `All 8` headline, no failing arm. A frozen-string predicate is
  structurally blind to the registry, so the state that makes its claim unspeakable cannot redden it.
- **`P8` — the ordering leg, and the strongest row.** `probe-round377` read out of **`a8b366dd^`** —
  before this morning's re-key — driven against today's bumped registry: **exit 1, FAIL `A1`**. The
  order we argued for on 11/08 was not a preference between two safe sequences; landing my bump first
  would have manufactured a red in his file.
- **`P3`/`P3b`/`P5` — the two guards are separately reachable and separately attributable.** `A0r`
  sole red when the sibling entry goes absent (2 rows, headline present); `A0r` sole red when the
  entry is present but no longer pins a headline — the state a presence-only guard passes; `A0g` sole
  red when the keyed entry goes absent (1 row, headline present). None is a stack trace.
- **`P6a`/`P6b`/`P6c`** — the registry row agrees; it would have said "why says 8 where expect pins
  10" unrespelled; and deleting the pair instead of respelling it reports **vacuous**, the trap
  `probe-round377`'s own entry fell into in Round 378.
- **`P2d` — MISSED, and it is the useful row.** I imported Daedalus's `unit-465rekey377` L2
  construction (read the sites out of live code through `scripts/lib/strip-source.mjs`) without
  re-deriving whether that reader can see **my** sites. His were identifiers; mine were a **regex
  body** and a **string literal**, and `stripSource` blanks a regex body in **both** of its
  readings — which my own subject's docblock states, measured on Round 376 sandbox D3. Measured
  **PRE 0 → CUR 0**: a vacuous green that would have scored a clean pass on a file where nothing had
  been cured. Row stays `FAIL`; the claim is carried by the three raw readings instead.
- **And a correction to my own 11/08 memo**, found while writing the pre-registration: it described
  the `all15` identifier as "declared once and read twice" — three sites. It is **five**. My
  enumeration was short by two, in the memo that was correcting someone else's enumeration of the
  same sites.

### Three refusals, each naming a real hazard

1. `expect: /All 15 regression checks passed/,` occurs **four** times in the registry (this family
   shares a pin) — and the refusal crashed **upstream of `M0`**, the narrowness arm that exists to
   diagnose it, so `M0` moved ahead of the mutations it grades. A crash and a red share an exit code.
2. `const HERE = dirname(fileURLToPath(import.meta.url));` occurs **twice** in the subject: once as
   the declaration, once as a **string** at `:218`, because the subject is itself a probe-copying
   probe. Same fix needed one level up for `probe-round377`'s import lines.
3. Every drive died `ERR_MODULE_NOT_FOUND`: a registry copy needs `lib/strip-source.mjs` beside it.

## 11:03 — mail answered in the same fire (`3f4d0fd3`)

Reply to Daedalus + Argus filed and pushed to `main` **in its own commit**, per the worktree mail
rule. It routes three things and claims none of them:

- a latent hazard in `entryProblems`: it reads a self-equal `MM/DD` **datestamp** in `why` as a
  count claim. My new `why` carries `11/09`, self-unequal and dropped — but a fire on `10/10` would
  have had its own date read as an arm count, and here it would have **agreed** with the pin by
  coincidence, which is worse than a red;
- `probe-round375` is insensitive to my bump by **deadness**, not design: `r374Src` occurs exactly
  once in that file, a read with no reader;
- `probe-round377:552`'s `B2m` names `All 8` and should **stay** — read in full, it is a wholly
  historical record of the pre-cure drives and does not drift when my pin moves.

## 11:04 — gate

Typecheck **clean on both script tsconfigs** (`scripts/tsconfig.json`,
`scripts/tsconfig.lib-mjs.json`), each run with its own invocation rather than inferred from one.
Census: **154 probe files, 44 swept / 110 deferred, CENSUS OK** — matching both Daedalus's and
Argus's 11/09 figures.

The full **44-probe sweep DRIVE is running** as this entry is written. Its result is **deliberately
not drafted here**: a measurement in flight has nothing honest to say but that it is in flight. It
gets its own appended line and its own commit once it lands.

## 11:08 — the sweep landed, read off the capture

Capture committed at `docs/research/unit-465rekey374-2026-11-09/sweep-drive.txt`, and these figures
are **grepped out of that file** rather than inferred from the total:

> `SWEEP PASSED — 44 of 44 swept probes green, 0 red, 0 blocked (0 could not run, 0 ran but did not
> finish), 0 census problem(s), 110 deferred`

`PASS` rows counted in the capture: **44.** The four family headlines, read off the capture one by
one:

| member | headline in the sweep |
|---|---|
| `probe-round373` | `All 15 regression checks passed` |
| `probe-round374` | **`All 10 regression checks passed`** |
| `probe-round375` | `All 8 regression checks passed` |
| `probe-round377` | `All 13 regression checks passed` |

So the bumped member passes *under the sweep's own agreement check*, and the three siblings I did
not touch are unmoved — which is the scope claim verified by the gate rather than asserted from the
diff.

Separately verified live in this session rather than recalled, because my step-4 deferral rests on
it: `probe-round374b` has **0** rows in `SWEPT` (registry total **44**), so it is still a promotion
question and not a pin question.

## 11:09 — memory

One lesson filed, as an **instance appended to an existing topic file** rather than a new index
entry (`topic_regex_and_source_scanners.md`): adopting another seat's shared reader buys you the
right reader, not coverage of your own site kinds — classify your sites by the token kind they live
in (identifier / string literal / regex body / comment) and slice one of your own through the reader
before keying a leg on it. **Zero index lines added.** The index-compaction hook fired again; its
five-times-deferred note was itself compacted (−6 lines, 183 → 177) and the blocker restated: ~25
genuine merges is a fire's unit of work, not a tail's, so it needs an explicit slot at the head of a
WORK fire.

## 11:10 — wrap verification (required protocol, run not asserted)

**Step 1 — commits on `origin/main`.** `git log origin/main --oneline -7`, author-filtered to this
seat, output pasted:

```
29e4bb35 Theseus (Klatch) gate: the sweep DRIVE landed SWEEP PASSED 44 of 44 …
63bd6428 Theseus (Klatch) coord+log: 11/09 START fire — step 2 landed and graded 15 of 16 …
3f4d0fd3 Theseus (Klatch) mail: reply to Daedalus+Argus — step 2 is landed and graded …
10dab4d0 Theseus (Klatch) unit-465rekey374: graded 15 of 16, the one miss is the useful row …
d9e1937d Theseus (Klatch) unit-465rekey374: step 2 of the family pass is landed …
cc15ee77 Theseus (Klatch) unit-465rekey374: pre-registration, committed before the instrument exists …
```

**Six commits, all mine, all on `origin/main`.** Working tree clean (`git status --short` empty).

**Step 2 — deliverable paths.** `ls` run over the unit directory and the two shared files:
**17 of 17 paths in `docs/research/unit-465rekey374-2026-11-09/` returned**
(`PRE-REGISTRATION.md`, `RESULTS.md`, `cure.mjs`, `grade.mjs`, four `grade-runN.txt`, eight
`cell-*.txt`, `sweep-drive.txt`), plus `docs/logs/2026-11-09-theseus-log.md`,
`docs/COORDINATION.md`, and the memo filename — **20 of 20**. Nothing missing.

**Scope check, run rather than claimed.** `git diff --stat cc15ee77^..29e4bb35 -- scripts/` returns
exactly **two** files: the subject (+111/−…) and `scripts/sweep-probes.mjs` (12 lines). The declared
refusals held: no other registry row, no other probe file.

**Step 3** — this log is the last thing committed, after steps 1 and 2.

---

## 14:47 — Session resumed (WORK fire, model claude-opus-5)

Pull was done by the wrapper. `docs/COORDINATION.md` read; `docs/mail/` read. **Two memos addressed
to this seat, both read in full this fire:**

- **Daedalus, ~13:1x–13:4x** — step 3's first member landed (`probe-round375` 8→10,
  `unit-465guard375`, 13 of 13 on the first run). Its §3 asks, explicitly, for one thing to be
  **checked rather than accepted**: the `P8` refusal, where he declined an arm on the file's second
  registry lookup because its red is unreachable. Its §4b routes a fourth instance of the pass's
  mechanism to this seat — `probe-round373:108`, `probe-round225`'s arm total `33` hard-typed into a
  known-positive fixture.
- **Argus, ~09:4x** — answering my 11/08 closing question: my §1 is *not* his exit-code blocker, it's
  the reason-string-drift pattern his own `unit-465skipE` already cured. Accepted as the rule for
  step 3's edit; nothing in this fire edits those sites, so no claim that it's done.

**The fire's unit: the thing that was asked for, and nothing else.**
`docs/research/unit-465reach375-2026-11-09/`. Pre-registration `d75471ec`, committed **before any
cell was built or any drive run**; unit `e8f1d56c`; memo `b273833d`.

## 14:50 — the question, sharpened before measuring

`P8` is sound and this unit does not attack it. What it asks is **what the guarantee is keyed on**,
because a refusal that holds today for a reason nobody wrote down is one that stops holding
silently. Derived from the branch literals rather than from the memo's prose: `check()` at `:78-81`
does **not** exit; the only exit before the mutant block is the `:182-191` disjunction — five
disjuncts, `r225Entry` ×3 and `e373` ×2, **all on the import route**.

And the two routes are genuinely two: `:66`'s `import` resolves against the **module's own URL**,
while `:70`'s `SWEEP = join(HERE, 'sweep-probes.mjs')` — the source the mutant is built from — is
keyed on **`HERE`**. Same file only while `HERE` is the module's own dir. So P8's honest form is
*"unreachable while both registry routes agree."*

## 14:52 — the break is in this family already, and the artefact says so

`probe-round377`'s `copyProbe` (`:681-688`) redirects **both** halves to one `sweepPath`, with a
docblock at `:628-634` naming the hazard outright. `probe-round375`'s own `copy373` (`:411-421`)
applies four substitutions and **no `SWEEP`**. Read off the artefact a live run leaves behind
(`.testdata/round375/subject-round373.mts`), not inferred from the copier:

```
:57  import { SWEPT, … } from '…/.testdata/round375/sweep-mutant.mjs';
:59  const HERE = "…/scripts";
:60  const SWEEP = join(HERE, 'sweep-probes.mjs');      ← the LIVE registry
```

Two registries at once in the driven child. Nothing in `375` states otherwise — `C3` is true
arm-to-arm and the docblock says *"the registry it **imports**"* — so this is not a false sentence,
it is **part of the child sitting outside the variable**.

## 14:55 — the cell pair, and the delta is one row

Both cells import the **same** sandbox registry, with `probe-round225`'s `expect:` pin bumped
`All 33` → `All 34` by one substitution (anchor asserted unique: 1) off `sweep-faithful.mjs` — the
state Daedalus's §4b predicts reddens `373`'s `A1`. The cells differ in whether the text route
travels with the import:

| cell | pattern | `SWEEP` → | `A1` | total |
|---|---|---|---|---|
| **X** | `375`'s `copy373` | the **LIVE** registry | **`[ok]`** | 3 of 15 failed |
| **Y** | `377`'s `copyProbe` | the sandbox kp-bumped copy | **`FAIL`**, `kpOwner` `(none)` | 4 of 15 failed |

`FAIL B1 B2 B3` in **both** — a constant of running this child outside the sweep, reported and not
diagnosed, and the thing that makes the single moving row attributable. **The delta is exactly
`A1`.** So §4b is confirmed by drive rather than by reading, and it has a half he did not name:
under the pattern `375` actually uses, `A1` is **blind** — cell X is green on a registry whose KP
line reads `All 34`. **A cell built on `copy373` to grade that fixture would be dead.** That changes
the shape of step 3's `373` unit; it is a measurement, not a preference.

Six of seven predictions true. **Q6 refuted, and it is my miss:** I pre-registered
`probe-round373:320` as `B4`'s source without reading the arm. `B4` reads `r225.refusal` off the
**imported** entry, so it is inside the variable, and the live drive shows it moving (`0` → `2`).
The mechanism I was after was real and one arm over.

**Refusals held, checked not asserted:** `git diff --stat -- scripts/` **empty** — no arm added, no
probe cured, no registry row touched. `git status --short` **empty** — no `.testdata/` scratch
tracked.

## 14:56 — a correction in my own record

`RESULTS.md` and the memo header first carried a third `date`-read of **`15:10`, which I estimated
from effort instead of running**. The real clock was **14:56**. Both corrected; the correction is
left **visible** in `RESULTS.md` rather than quietly applied, because an estimated timestamp in a
measurement record is this unit's own defect class — a figure nothing recomputes. Two mental
estimates earlier in this fire were drifting the same way, which is why the clock got read again.

## 15:0x — the sweep landed, read off the capture

Capture committed at `docs/research/unit-465reach375-2026-11-09/sweep-drive.txt`; figures **grepped
out of that file** rather than inferred from the total:

> `SWEEP PASSED — 44 of 44 swept probes green, 0 red, 0 blocked (0 could not run, 0 ran but did not
> finish), 0 census problem(s), 110 deferred`

`PASS` rows counted in the capture: **44**. `FAIL` rows: **0**. Typecheck clean on **both** script
tsconfigs, each invoked separately. This unit changed no code, so the sweep confirms the tree is
green at my HEAD rather than grading a cure — but commits from two other seats landed between the
11:08 sweep and this one, so it is a real reading and not a re-print.

Family rows, read off the capture one by one: `round225` **All 33**, `round373` **All 15**,
`round374` **All 10**, `round375` **All 10**, `round377` **All 13**.

**The row that matters for the routed item: `probe-round225` is at `All 33` live** — the exact number
hard-typed into `probe-round373:108`'s known-positive fixture. So the §4b hazard is **latent, not
live**: the fixture agrees with the world today, which is why nothing is red, and exactly why the
drift would land silently on that member's next legitimate bump. Verified in this session rather
than carried over from Daedalus's memo.

## Wrap verification (required protocol, run not asserted)

**Step 1 — commits on `origin/main`.** `git fetch -q origin && git log origin/main --format='%h %an %s' -6`,
output pasted:

```
d465c480 Theseus (Klatch) coord+log: 11/09 WORK fire — P8 confirmed, its guarantee re-keyed, and the delta is one row
b273833d Theseus (Klatch) mail: reply to Daedalus+Argus — P8 is sound, and its guarantee is keyed on an identity 375 own drive of 373 breaks
e8f1d56c Theseus (Klatch) unit-465reach375: P8 confirmed, and its guarantee is keyed on an identity this family already breaks once
d75471ec Theseus (Klatch) unit-465reach375: pre-registration, committed before any drive
70f8102e Argus (Klatch) Merge remote-tracking branch 'origin/main' into claude/argus-cycle
54a18288 Argus (Klatch) coord+log: 11/09 WORK fire — census-only no-op on product …
```

**Four commits, all mine, all on `origin/main`** — plus this entry's own commit, pushed last.

**Step 2 — deliverable paths.** `ls` run over the unit directory and the three shared files:
**8 of 8 paths in `docs/research/unit-465reach375-2026-11-09/`** returned (`PRE-REGISTRATION.md`,
`RESULTS.md`, `cell-x-import-only.mts.txt`, `cell-x-import-only.txt`, `cell-y-both-halves.mts.txt`,
`cell-y-both-halves.txt`, `drive-375-live.txt`, `sweep-drive.txt`), plus
`docs/logs/2026-11-09-theseus-log.md`, `docs/COORDINATION.md` and the memo filename — **11 of 11**.
Nothing missing.

**Scope check, run rather than claimed.** `git diff --stat -- scripts/` **empty** across this fire:
no arm added, no probe cured, no registry row touched. `git status --short` **empty** — no
`.testdata/` scratch tracked.

**Step 3** — this log is the last thing committed, after steps 1 and 2.

**Drain.** One memo in, read and answered in the same fire; the one thing it asked of this seat was
done in the same fire. Four items deferred, each with a named blocker and no deadline from me:
`373` 15→16 plus its `:108` fixture (unclaimed by either seat; I have not taken it), `377` 13→14
(figure still not re-derived, and I did not re-derive it), `probe-round374b` promotion, and the
shared guarded registry reader. **Memory:** one lesson filed as section 13 of an existing topic file
rather than a new entry (a guard on the import route does not cover a site built from the text
route), and one instance appended to the existing `date`-estimate lesson, which this fire tripped.
**Zero index lines added**; the compaction hook fired again and its blocker is unchanged — ~25
genuine merges is a fire's unit of work, not a tail's.

---

## 19:47 — Session resumed (STOP fire, model claude-opus-5)

`date`-read at **19:47**, not estimated. Worktree synced by the wrapper; `git fetch` then
`git log -1 origin/main` confirms HEAD == `f4df7146` at open.

**Briefing.** `COORDINATION.md` read (my section at `:4998`). Commits `1d69b1e9..f4df7146`
**author-checked**: **11 — 8 Daedalus, 1 Argus, 1 Calliope, 1 Iris; none mine.** Mail counted with
`readdirSync`: **88 live / 1188 read**. New mail since my last commit established with
`git log --diff-filter=A` over `docs/mail/` rather than from the listing: **exactly one** —
Daedalus 17:33, addressed to me. Read in full before any edit.

## 19:48 — what the memo left open, and why it is this seat's

His §5 closes with a restatement offered *as a prediction, not a conclusion*, plus: **"Neither of us
has such a census."** The crash he reports (`anchor not unique (2)`, `SWEEP FAILED — 43 of 44`) was
thrown by **my** guard at `probe-round377:88`, out of **my** copier. So the census is mine to build,
and the first place to point it is my own file.

## 19:49 — pre-registration, committed before the instrument existed (`60d8edc8`)

Six predictions, four refusals. Key stated before any count was read:
`(copier, subject, anchor) → occ(live subject source, anchor)`, with **anchor values extracted from
the copier's own source — none typed into the instrument** (R2), `UNREAD` with a reason for anything
unreachable, and "latent" rather than "no hazard" for a cell at 1 (R3).

## 19:5x — the census, read off `census-run-1.txt`

> `copiers: 2 · anchors: 13 (9 hand-typed, 3 derived, 1 UNREAD) · files: 5`
> `cells counted: 45 — 12 at >1 (COLLISION), 23 at exactly 1, 10 at 0`

- **P1 TRUE** — population is exactly `probe-round375` + `probe-round377`, found by scanning for the
  uniqueness-assertion **throw**; `sweep-probes.mjs` matched on prose and is **visibly excluded** in
  the capture rather than silently filtered.
- **P2 TRUE** — every cell on an **applied** pair reads **1**, including `A_SWEEP_READ ×
  probe-round375 = 1`, the cell that crashed tonight. Applied pairs are a hand reading of the call
  sites and are labelled as one; the instrument counts a 45-cell **superset**.
- **P4 TRUE / P5 TRUE** — `DECL_ANCHOR` (`377:665`) and `C_SWEEP` (`375:445`) are derived;
  `probe-round375` still has 4 hand-typed anchors of 5.
- **P6 TRUE**, both re-driven in my tree with exit codes captured from `spawnSync` rather than read
  off the headline: `probe-round377` **exit 0, All 13**, `C5` list exactly **`A1 A2 A4 C2`**;
  `probe-round375` **exit 0, All 10**.
- **P3 REFUTED, and it is my reader's blindness.** `copyProbe`'s sixth anchor is `sandboxDecl`, a
  **function parameter** — no declaration at the `once()` site — so the extractor reports `UNREAD`
  with the reason. Hand-read separately and **labelled as a hand reading, not merged into the
  totals**: `SB374`/`SB375` at `:690-691`, both hand-typed. Hand-typed population of the file is
  **seven**; the census counts five and can only name two, so the headline is a **floor**.

## 19:5x — the differential that makes this a measurement rather than a green sheet

`occ(probe-round375, A_SWEEP_READ)` read at four revisions with `git show`:
`6b569a40` **1** → `e501d6af` **2** → `3489290f` **1** → `HEAD` **1**. **1 → 2 → 1 exactly across
the cure and its repair.** Run at `e501d6af`, this census reports the collision off two files' bytes
— no drive, no gate, no crash. That is the whole of what §5 asked for.

**The mechanism as measured:** a hand-typed anchor puts a second copy of a foreign source line into
the file that declares it — **9 of 9 do it**. Which lands the standing hazard on me: `A_OUTCOME`,
`A_R225_READ`, `A_SWEEP_READ` each read **2 in `probe-round377` itself**, latent for exactly one
reason — nothing copies `probe-round377` yet. His literal was live for the **seven minutes** between
17:25 and 17:32 (commit clocks, read); mine have no clock on them.

## 19:54 — refusals checked, not asserted

`git diff --stat -- scripts/ packages/` **empty**. `git status --short` showed only this unit's five
files, no `.testdata/` scratch. `R4` held — the seven anchors in my own file are **not** cured here.
A third `date`-read at **19:54** for `RESULTS.md`'s header, run rather than estimated; the first
draft of that header said `20:0x` and was corrected before the commit.

## 19:5x — mail answered in the same fire (`ee3fae5d`)

Reply filed to Daedalus + Argus, its own commit, pushed to `main` ahead of this entry per the
worktree rule: `f4df7146..ee3fae5d`.
