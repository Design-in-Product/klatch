---
agent: Daedalus
date: 2026-11-17
model: claude-opus-5
---

# Daedalus — 2026-11-17

## 09:17 — START fire (model: claude-opus-5)

`date`-reads this fire: **09:17:10**, **09:20:17**, **09:25:42**, **09:30:29 PST**. Read, not
estimated from effort.

**Briefing.** Worktree synced by the wrapper; `git status` clean at open. **Commit authors checked,
not assumed:** the five commits above my 11/16 head (`709b0ab1`) are **Argus's** mail-triage push,
**Calliope's** rollup correction, **Iris's** two ground-rules client commits, and **Pard's**
fire-depth brief — **none mine**, despite three of them carrying "11/17 START fire" in the subject.
`COORDINATION.md` §Daedalus read. Cross-pollination brief is a pointer to a private URL (repo is
public); noted, not fetched.

**Mail delta since `709b0ab1`, by `git diff --name-status`, not by mtime:** 4 added to
`docs/mail/` (all `cc:` me, both lanes Argus↔Theseus on the import-route detector — **no ask of this
seat**, Argus's own memo says "not landing it in this fire"), 4 added directly to `read/` by their
senders, 6 moved to `read/`. Two of the `read/` additions are addressed to me and both are **closes,
not asks**:

- **Iris → me:** phases 2 and 3's client halves are built against the preset API I landed yesterday
  (`d67e85c4`). Contract unchanged, checked by her before writing. **The ground-rules ruling is now
  built end to end** — phase 1, phase 2 storage + client, phase 3 — 14 days from ruling to complete.
- **Calliope → me:** my one-table shape **accepted**, her two-store split in the scope doc retracted
  with an addendum in place; `CLAUDE.md`'s table count corrected to nine off the live source; the
  Drizzle-adoption call named as xian's and left for him.

Still open and **verified** so, not assumed: Calliope's 11/16 "your §4 is corrected" memo stays in
`docs/mail/` — its §5 (client surface → Iris) is now closed by Iris's build, but its §3 (the
`setup.ts` hand-typed-DDL census question routed to **Argus**) has no answer I can find in
`read/`. Left visible rather than closed on a guess.

### Work: unit-468createlit — the create-path literal seam

Took the item I named unclaimed in my own 11/16 §5 (`createGroundRulesPreset` returning a hand-built
literal, which is why C4 could not redden `POST … makeDefault`). Full record:
`docs/research/unit-468createlit-2026-11-17/` — PRE-REG (P1–P6), PRE-REG-B (legs E/F by arm name),
RESULTS, 14 drive logs.

**Commits, all pushed to `main` as they landed** (five pushes, so a 2400s death could not strand the
unit):

| commit | what |
|---|---|
| `a33e198e` | pre-registration, before any arm existed |
| `7041f882` | the cure: `readBack(table, id, mapper)`, all ten writers through it |
| (3rd) | raw-column arms + PRE-REG-B |
| (4th) | RESULTS |
| (5th) | mail |

**Findings, shortest form:**

1. **The idiom was total.** Census keyed on "exported function in `queries.ts` containing an
   `INSERT INTO`" (not on the name `create*` — that key misses `insertMessage` and admits
   `createChannelBySessionIdResolver`): **13 writers, 12 hand-built literals, 0 through a mapper.**
   I predicted 8/2. There was no in-house counter-example to point at.
2. **Four of ten disagreed in value** with a read of the row they had just written, under an
   empty-string optional field — all four named in advance, no unnamed member diverged — by **two
   sub-mechanisms** (the INSERT collapsing via `|| null`; the mapper collapsing a stored `''`). A
   one-sided cure would have reported success with the second standing.
3. **My own equality arm cannot grade the mapper it was written for.** Four-leg matrix, cripple C5 on
   `rowToFile.createdBy`: **0 · 0 · 4 · 4** failing. The cripple reddened nothing in either tree —
   post-cure because `expect(created).toEqual(read)` compares two readings that **share** the mapper
   (invariant difference), pre-cure because those arms were **already red** (saturated). P6 refuted
   in both directions. Cure: five arms against the **raw column**.
4. **The cure's reach is 3× what I claimed, at the route level.** C6 = 11/16's C4 re-run, each leg
   against its own matched clean baseline: **4 attributable reds pre-cure, 6 post-cure**, net
   **+3 / −1**. The two I did not predict are route arms on the **POST response** — the API's create
   response is now graded by the mapper's correctness, which is exactly what 11/16 §5 said was
   missing. The −1 is recorded as a cost, not hidden.
5. **Self-correction: census drive 1 silently dropped the member the unit is about.** Brace-balance
   body slicing started at the first `{` after the function head, so a brace in the **parameter
   list** (`opts?: { … }`, `= {}`) opened and closed the "body" on the signature's own line; the
   slice held no `INSERT INTO` and `createGroundRulesPreset` + `createProject` fell out of the
   population **with no error**. Drive 1 read 11/10/0 and looked clean. Both drives kept; the fix is
   commented at the site as load-bearing. Routed to Theseus as a general form: a brace-balance slicer
   is wrong on every options-bag and every object default in this codebase.

**Prediction ledger: 8 registered, 4 landed, 4 refuted** (P1, P2, P6, leg F). The informative
refutations are P2 and leg F.

**Gate, driven fresh this fire, not carried:**
- Typecheck **0 `error TS`** ×4 workspaces (run twice — after the cure, and again on the restored
  tree after the last cripple).
- Server **146 files / 2287 passed / 1 skipped (2288)** — standing 2272 plus this unit's 15 arms,
  nothing else moved (`drive11.legA2-cured-clean.out`).
- Client **29/42 files, 354/367** (`drive14.client-gate.out`) — untouched, and equal to the figure
  in Iris's 11/17 memo, checked rather than assumed.
- Census OK, 155 probe files, 45 swept / 110 deferred, on every push (pre-push hook).
- **Cripples restored and verified:** `git checkout HEAD -- packages/server/src/db/queries.ts` after
  each of C5/C6 and after each pre-cure leg; `git status --short` clean of tracked modifications
  before the gate run. The pre-cure legs used `git checkout a33e198e -- …`, i.e. the real pre-cure
  file, not a reconstruction — and the cure was committed **before** the first cripple so no restore
  could discard it.

**Drain:** pull + author-checked delta; `COORDINATION.md` read; mail delta computed from git and all
8 new files read in the same fire, with the one still-open thread's open item verified rather than
assumed; the ruled product item's last unclaimed seam taken from pre-registration to `main` with two
cripples and seven legs; one finding routed to Argus as a mechanically-detectable census (comparison
arms whose two sides share a reader), one self-correction routed to Theseus; gate re-driven fresh;
five incremental pushes.

**Deferred, with named blockers — no deadlines:**
- **Writers outside `queries.ts` are uncensused** (`routes/`, both importers, `db/index.ts`). Named
  in RESULTS §7. Blocker: none — a choice, this fire's scope was one file, and the unit says so in
  writing rather than implying coverage it does not have.
- The **memory-store compaction pass** the index still owes (~20 merges to reach 17.1 KB, needs a new
  cluster list authored first). Blocker: a bounded fire should not leave a half-done merge pass in a
  shared store; this fire spent its budget on product work.
- Still mine from 11/16, unclaimed: the parameter/positional exclusion, `arm-routecure-d.mjs`'s
  `hash-object` pin and `/misordered/` detector, the `unit-465p12site` RESULTS:93 one-clause cure, the
  two `schemacollide` single-name selectors, and `api/client.ts`'s eight-positional `createChannel`
  wanting an options bag.

### 09:35 — wrap verification (Session Wrap Protocol)

**Step 1 — commits on `origin/main`** (`git log origin/main --oneline -7`):

```
2fa3e844 coord+log: 11/17 START fire -- create-path literal seam cured across all ten writers, and my equality arm was green in all four cripple legs
43fcb83e mail: create-path seam cured; the equality-arm blindness routed to Argus as a census, the slicer self-correction to Theseus
81800d57 results(unit-468createlit): 8 predictions, 4 landed 4 refuted, and the cure's reach is 3x what I claimed
ea83382d test(round468)+pre-reg-B: raw-column arms, because the equality arm cannot grade the mapper
7041f882 fix(db): every writer publishes the row through its mapper, not a second literal
a33e198e pre-reg(unit-468createlit): the write path's hand-built literal is a second spelling of the row mapper
0890e245 mail+coord+log: 11/17 START fire -- ... (Argus's, not mine)
```

Six commits, all mine, all on `origin/main`. **Step 2 — deliverables confirmed in the remote tree**,
not in the worktree: `git ls-tree -r --name-only origin/main` lists all four unit documents, the arm,
**21 drive files**, `packages/server/src/__tests__/round468-create-path-literal-vs-mapper.test.ts`,
and `docs/logs/2026-11-17-daedalus-log.md`. The cure itself verified in the pushed blob:
`git show origin/main:packages/server/src/db/queries.ts | grep -c 'readBack('` → **10**, the ten call
sites (the definition reads `readBack<T>(` and is not counted). `git status --short` clean —
no cripple survived, no deliverable left uncommitted. `date` **09:35:19 PST**.

### Memory store — the owed compaction pass is still owed, and this fire did not start it

The index hook fired on this fire's edit: `MEMORY.md` measured **20,901 B** by `wc -c` (not
estimated), against a 24.4 KB read limit and a 17.1 KB target. **This fire added no index entry** —
the lesson from §3/§5 above went in as a **new section in an existing topic file**
(`feedback_a_delta_gate_cancels_a_constant_reader_blindness`, now 3 cases: the delta-invariant
blindness, the absolute-invariant mirror, and today's **equality** case where curing a two-spelling
defect routed both sides of the arm through the reader it was written to grade). Only that line's
hook was reworded. That is the shape the index's own standing note asks for.

The ~20 merges to reach 17.1 KB were **not** started: they need a new cluster list authored first,
and a bounded fire should not leave a half-done merge pass in a store four other seats read. Named as
a blocker, not a deadline.

---

## 13:17 — WORK fire (model: claude-opus-5)

`date`-reads this fire: **13:17:07**, **13:31:47 PST**. Read, not estimated — and the correction
matters: by 13:31 I had been estimating ~45 minutes elapsed from effort expended, against 14 actual.
The memory lesson is `feedback_run_date_dont_estimate_elapsed_from_effort` and it fired again.

**Briefing.** Worktree synced by the wrapper, `git status` clean at open. **Commit authors checked:**
the two commits above my 09:35 head are **Theseus's** (×5, his `unit-469braceslice`) and
**Calliope's** MID-fire coord/doc commit — none mine. `COORDINATION.md` §Daedalus read. One new memo
addressed to me, read in this fire:

- **Theseus → me + Argus (START fire):** `unit-469braceslice` censuses the brace-slicer mechanism I
  routed to him this morning as a general-form *sentence*. His §2 refutes the premise of that
  routing — `|GUARDED| = 6`, four written **before** the two incidents, two of those four **mine**,
  one in the same directory on the same day as an unguarded sibling. **Explicit ask: "an argument for
  a shared helper or a detector, not for a lesson."** That is this seat's lane.

### Work: unit-470bodyslice — the shared body slicer, built and pushed

`docs/research/unit-470bodyslice-2026-11-17/` — PRE-REGISTRATION (P1–P6), RESULTS, arm, 12 drive
files. Four pushes, so a 2400s death could not strand the unit:

| commit | what |
|---|---|
| `bc88f5c0` | pre-registration, before the helper or the arm existed |
| `c8b8fd73` | `scripts/lib/decl-body.mjs` + `.d.mts` — **before the first cripple** |
| `4f510585` | arm + drives 1–3 (3 red legs, two of them the arm's own defects) |
| `558d6f03` | RESULTS + drives 4–12 |
| `47654635` | mail to Theseus + Argus |

**Findings, shortest form:**

1. **There is a FOURTH mechanism and it defeats the cure as routed.** A brace-bearing **return
   type** — `assembleSystemPrompt(…): { prompt: string; floorApplied: boolean } {` at
   `packages/server/src/claude/client.ts:512`. Paren-match the parameter list, take the first `{`,
   land on the return type. **All six files the 469 census calls GUARDED are exposed**, including my
   own two `unit-465readerset` arms. **16 live sites in `packages/`**, counted by the helper itself.
2. **P1 refuted: his census does not reproduce in my worktree, and neither figure is the repo's.**
   66/56/8 against his 62/52/4; 1007 files walked against 931. The census walks the **filesystem**,
   so **6 of my 56 members are untracked** — and the delta is 4, which means his 52 holds 2
   untracked members of his own. **The tracked figure is 50.** Load-bearing for any detector.
3. **P3 lands on real declarations, not fixtures:** naive wrong 3/3 (9 ch, 40 ch, **2 ch** bodies),
   helper right 3/3.
4. **One cripple could not grade two cures.** C1 (routed cure removed) reddened **2 of 3** — the
   JSDoc site survived because the *other* cure (every depth walk over `stripSource(src, true)`)
   covers it. C2 (composition removed) **reddened nothing**, and returned **1545 ch where the cured
   reader returns 4902 ch**: a span 3357 characters too short that still contained the token my leg
   looked for. Leg **A2c** added at drive 7 — brace-balance under the stripped reading, an invariant
   rather than a hand-typed key — reddens exactly that site under C2 and is green 3/3 restored.
5. **Two of drive 3's three reds were my arm's own defects.** (a) My A3 *control* was
   `regexLiteralEnd`, whose parameter list carries JSDoc braces — **a fourth positive called the
   negative**, and I nearly read the differential working as the control failing. (b) My GUARDED
   parse ate the census's own **section header** (`GUARDED (paren-match within 400 chars before): 6`
   starts with `GUARDED `), `readFileSync('(paren-match')` threw into a `catch` returning `false`,
   and the bogus member scored as not-colon-aware — **inflating the denominator of the claim I was
   making**. Both drives kept, repaired at drive 4.
6. **Curing this raised the census's unguarded count by one.** 68 slicers / 57 unguarded now. The
   helper is **GUARDED** (P5 lands); the other new member is **my own arm, UNGUARDED and correctly
   so** — it carries the naive walk deliberately as the comparison arm. So the obvious detector
   reddens on an honest arm, and needs a **declared marker at the site**, not a path allowlist.
7. **Prediction ledger: 6 registered, 3 landed (P3, P5, P6), 3 refuted (P1, P2, P4).** P4's
   refutation is the informative one.

**Gate, driven fresh this fire, not carried:** typecheck **0 errors** ×4 workspaces; server
**146 files / 2287 passed / 1 skipped (2288)** — equal to this morning's standing figure, unmoved,
the helper being additive; client **29/42 files, 354/367**; census OK, 155 probe files, 45/110, on
every push. **Cripples restored** with `git checkout HEAD -- scripts/lib/decl-body.mjs` after C1 and
C2, each verified by `grep -c CRIPPLE` → **0** and `git status --short -- scripts/` empty before the
gate ran; the helper was committed **before** the first cripple, so no restore could discard it.

**One invocation defect worth recording:** `npm --prefix <root> test -w packages/server` failed with
`No workspaces found` — `-w` resolves against the **child cwd**, which was the unit directory, not
`--prefix`. Re-driven as `npm --prefix <root>/packages/server test` (`drive10b`). Same family as
`topic_git_and_shell_invocation`'s argv-path entry.

**Drain:** pull + author-checked delta; `COORDINATION.md` read; the one new memo read and acted on in
the same fire with the routed deliverable built and pushed, not acknowledged; one finding (the fourth
mechanism) that invalidates the cure both seats had independently reached; two self-corrections
against my own arm; one lesson filed as a **new section in an existing memory topic file**
(`topic_cripples_and_counterfactuals`, now 9 — no new index line); gate re-driven fresh; five
incremental pushes.

**Deferred, with named blockers — no deadlines:**
- **The detector is specified and priced in RESULTS §6 and NOT built** (~120 lines + a baseline list
  + 2 known positives; must key on `git ls-files`, carry a site marker for deliberate
  reproductions, and cover the return-type mechanism or it certifies the six GUARDED files as
  cured). Blocker: none technical — a scope choice; this fire's budget went to the helper, its two
  cures and twelve drives. Unclaimed; either seat.
- **The 56 unguarded slicers are NOT re-measured against the fourth mechanism.** I know the exposure
  exists and its size in `packages/`; I do not know how many of the 56 read a file carrying one.
  Printed as a refusal in the arm's own verdict line.
- The **memory-store compaction pass** (index 20,749 B by `wc -c` at this fire's write, target
  17.1 KB). Still owed, still needs a cluster list authored first.

### 13:33–13:4x — the detector, which this fire's own RESULTS had deferred

`date` **13:37:41 PST**. **Correction to the entry above:** the detector is **built and on `main`**
(`6b98355b`), not deferred. The deferral in RESULTS §6 and in my COORDINATION entry rested on an
elapsed-time belief — ~45 minutes — that I had estimated **from effort expended** rather than read
off `date`. Actual elapsed at the moment I wrote "a scope choice" was **14 minutes**. The blocker was
my own arithmetic, so the item was never blocked. `feedback_run_date_dont_estimate_elapsed_from_effort`
fired twice in one fire: once as a noticing, once as a deferral I had already written down.

`scripts/verify-decl-body-slicers.mjs` + `scripts/decl-body-slicers.baseline` (59 entries, generated
by `make-baseline.mjs` from a **recorded drive**, not a live re-scan — a gate that can rewrite its
own baseline can always be made green by running it). **Wired into `scripts/hooks/pre-commit`** as a
second leg beside the census self-enrolment check, and exercised by the commit that landed it.

**Green state (drive 19/20):** 62 tracked slicers — **59 UNGUARDED (baselined), 2 GUARDED,
1 MARKED**; typecheck re-run clean after wiring.

**Two findings against the detector, from its own first drive:**

1. **It called the cure itself a new defect.** `drive13`: **0 GUARDED across 62**, with
   `scripts/lib/decl-body.mjs` listed as a new hand-rolled slicer. The guard key was read from
   `stripSource(raw, true)` — **strings blanked** — where `=== '('` has become `===  `, so the
   conjunct was **unsatisfiable** while the population key (raw) matched fine. Repair:
   `stripSource(raw, false)`, the reading strip-source's header names for a caller looking for a
   quoted literal, now used for the population key too. **The tell was the saturated verdict** —
   zero in one class of a three-way split is evidence about reachability first. I hold
   `feedback_a_selectors_two_conjuncts_can_be_mutually_unsatisfiable` and wrote it anyway.
2. **The ADOPTED class credited this unit's own arm and was dropped.** Its one member was
   `arm-bodyslice-a.mjs`, which imports the shared reader *and* hand-rolls a naive slicer beside it
   on purpose. An import is a **file-level** fact about a **site-level** defect. Deliberate
   reproductions now carry `brace-slicer-deliberate: <reason>` at the site, which travels with the
   code — the path allowlist my own §9 had warned against.

**Known positives, both directions:** drive 16 (new unguarded slicer staged, unmarked) → **RED**,
names the path; drive 17 (same file, marker added) → **GREEN**, `MARKED 2`; drive 18 (baseline
entries pointing at a now-GUARDED file and an absent one) → **RED ×2 with the reason per entry**.
Baseline restored and re-verified green at drive 19.

**Still deferred, blocker named:** the 59 are not re-measured against the fourth mechanism; the
marker is honour-system (nothing checks a marked reproduction is really deliberate — a marker census
is a cheaper second unit, not built); memory-store compaction still owed.

### 13:4x — wrap verification (Session Wrap Protocol)

**Step 1 — commits on `origin/main`** (`git log origin/main --oneline -8`):

```
ed850031 mail: addendum -- the detector is built, do not take it, and its first drive called the cure a new defect
49c9bd9d results+coord+log: the detector landed, and the deferral I had written down was an arithmetic error
6b98355b gate(decl-body-slicers): the detector half, wired into pre-commit -- and its first drive called the cure itself a new defect
49500940 coord+log: 11/17 WORK fire -- the shared body slicer is built, and a fourth mechanism defeats all six files the census called GUARDED
47654635 mail: the shared slicer is built, and a fourth mechanism defeats all six files the 469 census called GUARDED
558d6f03 results(unit-470bodyslice): 6 predictions, 3 landed 3 refuted -- two cures, a fourth mechanism, and a cripple that read green because my predicate keyed on contents not span
4f510585 arm(unit-470bodyslice)+drives 1-3: helper right on 3 of 3 real mechanisms, naive wrong on 3 of 3 -- and 3 red legs, two of them my arm's own defects
c8b8fd73 lib(decl-body): the shared body slicer Theseus routed -- and a mirror mechanism neither incident found
```

Eight commits, all mine, all on `origin/main` (plus `bc88f5c0`, the pre-registration, below this
window).

**Step 2 — deliverables confirmed in the REMOTE tree**, by `git ls-tree -r --name-only origin/main`,
not in the worktree: `scripts/lib/decl-body.mjs`, `scripts/lib/decl-body.d.mts`,
`scripts/verify-decl-body-slicers.mjs`, `scripts/decl-body-slicers.baseline`,
`scripts/hooks/pre-commit`, all four unit documents, the arm, the KP fixture, `make-baseline.mjs`
and **24 drive files**, plus `docs/logs/2026-11-17-daedalus-log.md`.

Verified in the **pushed blobs**, not the working copy:
`git show origin/main:scripts/lib/decl-body.mjs | grep -c 'parenClose + 1'` → **2** (the cure and
its comment); `| grep -c CRIPPLE` → **0** (neither cripple survived);
`git show origin/main:scripts/decl-body-slicers.baseline | grep -c '^docs/\|^scripts/\|^packages/'`
→ **59**. `git status --short` → **empty**: no deliverable left uncommitted, no cripple left in the
tree.

**Fire summary:** one peer-routed item taken from pre-registration to `main` in both halves — the
shared reader *and* the gate — with 20+ drives, 2 cripples on the helper, 2 known positives on the
detector in both directions, four self-corrections (two against my arm, two against the detector),
one mechanism found that invalidates the cure both seats had independently reached, and one deferral
retracted because its blocker was my own arithmetic. Gate green throughout: typecheck 0 ×4, server
146/2287+1, client 29/42 · 354/367, census OK, detector OK.

---

## 17:19 — STOP fire (model: claude-opus-5)

`date`-reads: **17:19:34**, **17:26:10**, **17:27:26**, **17:30:47**, **17:32:50**, **17:34:19 PST**
— read, not estimated. (At 17:26 I had been working from an internal estimate of 17:35; the clock
said 17:26. Same direction as the 13:31 error, which was the opposite way round — effort does not
measure elapsed time in either direction.)

**Session start.** Worktree synced by the wrapper; `git log` checked by **author**, not assumed:
the nine commits above my 13:40 head are **Theseus's** (×6), **Argus's** (×2 plus a coord entry) and
**Calliope's** (×1) — none mine. `git diff --name-status 7ece4421..HEAD -- docs/mail/` → **3 new
memos**, all read in this fire:

1. Argus — the shared-reader census is two confirmed, not a count (cc, no ask of this seat).
2. Theseus — his 469 LIVE figure is an over-count by 25 of 41, my correction reproduces at exactly
   two (cc, no ask).
3. **Calliope — the standing full sweep is 44 of 45 on `main`.** Addressed to me, with an action.
   Taken in this fire.

### The item: `unit-473b7subject` — the red is cured, and its subject was removed 48 days ago by me

Pre-registration before any edit (`c79e927a`), red reproduced first
(`.testdata/r473/b7-before.out`: `[B7] FAIL`, `1 of 20 FAILED`).

1. **The red was never about the tree.** B7's predicate opened `mjsFlat.length === 37` and its claim
   quoted `scripts/tsconfig.json`'s `The 37 \`.mjs\` probes…`. **`grep -n 37 scripts/tsconfig.json`
   → no match.** That sentence left the file at **`62faaec9`** (Round 304, **mine**, 09-30 17:37),
   **2h39m after** the arm landed (`6c1fc030`, **Theseus**, 14:58 the same day). For 48 days the
   first conjunct was a frozen literal standing in for a reading of a cured subject, green only
   because the directory still held 37 files.
2. **Both repairs the memo offered were unavailable as stated** — no "37" to fix, and re-pinning to
   38 re-freezes a literal that has drifted once. **Re-keyed to read the config** (`a2ee646e`):
   no count claim today · exactly one, `37`, in the pre-cure blob at `724371e5` as the known
   positive **taken by `git show` rather than hand-typed** · nested import targets 3 > flat 1. Flat
   count printed, never asserted.
3. **Correction to the routing memo, recorded because it changes whose instrument this is:** B7 is
   **Theseus's**, not mine. `28833525` is mine and is dated 10-25 but is `round454: stripSource
   refuses a non-string…`. Everything else in her trace reproduced exactly.
4. **Two cripples, both restored and verified before the gate ran.** C1 (sentence restored verbatim)
   → B7 red naming `1 count-claim(s) — [37]`, B7a correctly still green: the reader did not move,
   the subject did. C2 (`CFG_PRE_CURE` → unresolvable rev) → red as `UNREADABLE`, not green on an
   unread control. `grep -c CRIPPLE` → 0 ×2, `git diff HEAD -- scripts/` empty.
5. **THE CURE COST TWO MORE PINS, AND THE SWEEP FOUND BOTH — NOT THE DIFF** (`2c599b3c`). My first
   sweep after the arm read **43 of 45, 2 red**: (a) the SWEPT registry pins round303's summary
   line, so B7a's arrival read `pin says 20, observed says 21` — restaged, with a second ratio kept
   out of `why` because the entry-schema cross-read keys on it; (b) `probe-round371` G4 reported the
   new comment block **UNDECLARED** — B7a's docblock carries *characterisation*, a precise marker.
   **Declared in the registry rather than reworded out of the detector's reach**, `cells: []`
   because side A matches cells against one drive's rows (`probe-round224`). So Calliope's 44/45 was
   on its way to 43/45 and the second red was mine too.
6. **P6 refuted as framed, and the real finding is sharper: the detector for this class already
   exists and its audit's population excludes the file the live case was in.**
   `probe-round322`'s `magnitudePins` is exactly "a frozen integer compared against a count the file
   derives from a population it does not own", with KP/KN in arm A2 — and arm **A1 drives it over
   `backlogDeferred` only.** round303 hand-rolls its summary so it **is** in the arm-G backlog, but
   it is **SWEPT** → `backlogSwept` → outside the audit. **A SWEPT probe's pin only reddens when the
   sweep is driven, and the sweep is not in the hook.** My naive key returned ~90 sites against a
   predicted 2–6, which refutes the prediction's framing, not the corpus.
7. **Found by trying to USE my own helper rather than retype a detector:** `decl-body.mjs` refused
   the slice — `return-type-annotation-on-an-arrow-declaration`. Reach over 469 tracked files:
   **block 2072 · concise 547 · refused 910**, of which **510** are that one class and **at most
   152** carry the ambiguity it was written for (152 is an *upper* bound — a 200-char window key
   that over-reports). **≥358** annotated arrows are refused where the first depth-0 `=>` after a
   plain annotation is unambiguously the arrow's own.
8. **P4 LANDED — the standing figure is restored.** `SWEEP PASSED — 45 of 45 swept probes green, 0
   red, 0 blocked, 0 census problem(s), 110 deferred`, exit 0, `grep -c "  RED"` → 0.
9. **Gate driven fresh:** typecheck **clean** ×4 programs; server **146 / 2287 + 1 skipped**; client
   **29/42 · 354/367**; census **OK**; decl-body detector **OK** (974 files, population 65 —
   59/4/2). Only round303's arm count moved, 20 → 21, by this edit.

**Ledger: 7 registered, 6 landed (P1, P2, P3, P3b, P5, P4), 1 refuted as framed (P6) with a better
finding under it.**

**Deferred, each with a named blocker, no deadlines:**
- **Widening round322 A1 to `backlogSwept`** — round322's own arm, wants its author's judgement plus
  a drive over the whole SWEPT set; it will surface siblings and **not all are defects**
  (round303's own `tsFiles.length === 2`, line 833, is keyed on a sentence the config *still*
  carries, so it is honest today and a false positive for any path-blind widening). Routed to Argus
  and Theseus by mail.
- **Narrowing `decl-body.mjs`'s arrow refusal** to "only when the return annotation itself contains
  `=>`" — needs its own KP set both ways including a `(a: string): (b: number) => void => {…}`
  positive; a span-reader widening without one is the silent-wrong-span class the module exists to
  prevent. **Mine, next fire**, flagged in the memo so nobody else takes it.
- **`unit-470bodyslice`'s blocker stands:** the 59 baselined slicers are still not re-measured
  against the brace-bearing-return-type mechanism.
- **Memory-index compaction's structural half still owed** — hook trimming bought the bytes on
  11-17 WORK; the ~20 merges that reduce 125 lines are not done.

**Drain:** author-checked delta; `COORDINATION.md` read; all three new memos read, the one with an
action **taken to `main` in the same fire**; two corrections to the routing memo verified against git
before writing; two cripples; two further pins found by driving rather than reading; one refutation
of my own prediction; one finding against my own helper from this afternoon; one memo filed to three
seats with two named blockers; gate re-driven fresh; five pushes.

### Wrap verification

576cf765 results+mail(unit-473b7subject): the red is cured, its subject was removed 48 days ago by me, and the class detector already exists with the live file outside its audit
2c599b3c gate(unit-473b7subject): the arm-count pin restaged, and the new arm enrolled itself in a second census
a2ee646e arm(unit-473b7subject): round303 B7 re-keyed off a frozen 37 and onto the config it quotes
c79e927a prereg(unit-473b7subject): the 44/45 red is a stale pin whose quoted subject I removed 48 days ago
5d049f70 mail+coord+log: 11/17 SWEEP fire -- the standing 45/45 full sweep is now 44/45, Daedalus's own round303 drift-detector caught his own new flat .mjs file
