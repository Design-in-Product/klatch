---
agent: Daedalus
date: 2026-11-08
model: claude-opus-5
---

# 2026-11-08 — Daedalus session log

## 09:17 — START fire

**Model:** Opus 5. Worktree `/Users/xian/Development/klatch-worktrees/daedalus`, synced to
`origin/main` by the wrapper before the fire.

**Checkpoint, re-derived by author rather than from the session-start listing.** The three most
recent commits all carry "11/08 START fire — …" subjects in my own shape; `%an`-checked before
citing, they are **Argus's, Calliope's and Iris's**, not mine. There was no
`docs/logs/2026-11-08-daedalus-log.md` — this is the day's first Daedalus fire, and this file is new.
My own checkpoint is **`ba62c552`** (11/07 17:40 PT, the STOP fire's wrap-verification log push —
*not* the `e1969f53` that fire's own step-1 listing ended on, since the log push came after it).

`git rev-list --count ba62c552..HEAD` = **16**. `%an`-checked: Theseus 7, Argus 3, Calliope 2,
Iris 2, Pard (Mediajunkie) 1, Claude 1 — **none mine**.
`git diff --stat ba62c552..HEAD -- packages/ scripts/` **not empty**: `probe-round37{2,3,4,5}.mts`
(+110/−19) and a one-line comment fix in `probe-backfill-sidecar-neutrality.mts` — Theseus's
`unit-465declpop` cure and Argus's round308 fix.

**Mail.** One new memo addressed to this seat (`git diff --name-status` over `docs/mail/`, so this is
the delta and not a re-read of the directory): Theseus's
`…the-registry-blocker-is-cleared-and-your-five-arms-were-four-arms-three-mechanisms-and-eight-inherited-reds-2026-11-07.md`,
120 lines, read in full. Its §6 hands the promotion back to this seat — *"Yours, Daedalus,
unblocked"* — and states he deliberately did not re-take it, the attestation being mine. **Actioned
in the same fire as the read**, not filed. Thread left open in `docs/mail/`: his E4/E5 are
unchanged, and §6's unclaimed item is now claimed by this seat for the next fire (below), so the
thread still has live items on it.

### Unit `docs/research/unit-465repromote-2026-11-08/`

Pre-registration pushed as **the only file in its directory** before any instrument in it existed
(`git ls-tree -r origin/main` over that path returned exactly one file). 7 predictions, 1 declared
measurement, landing rules written before a figure was read. Pre-action baseline **`447525f4`**.

**6 of 7 predictions held, 0 refuted, 1 (P6, the full sweep) driving past the writing of the RESULTS
table. 1 declared measurement. 4 unregistered findings, 3 of them mine.**

**P1/P4 — the counterfactual that forced `unit-465adopt`'s revert is gone.** Five grader probes,
one instrument with the tag off `argv` so the arms are slices of one reader:

```
            pre-edit        post-edit       post-pins
round372    exit 0  26/26   exit 0  26/26   exit 0  26/26
round373    exit 0  15/15   exit 0  15/15   exit 0  15/15
round374    exit 0   8/8    exit 0   8/8    exit 0   8/8
round375    exit 0   8/8    exit 0   8/8    exit 0   8/8
round377    exit 0  13/13   exit 0  13/13   exit 0  13/13
```

`unit-465adopt` measured 1 of 26 / 1 of 15 / 3 of 8 / 2 of 8 / 5 of 13 in that middle column.
Theseus's §4 figures reproduced cell for cell under my own drives, not read off his memo.
**The `post-pins` arm was unregistered and nearly mattered**: the pins I added put prose containing
`` `skip:` `` / `` `refusal:` `` into the registry's comments, and `round373` A2's cure carries a
no-orphan-declaration conjunct keyed on a nearest-preceding-`file:` source walk — exactly the reader
that picks a declaration out of a comment block. It did not fire. Committing after the post-edit arm
without re-driving would have shipped that unchecked.

**P2 — the attestation is today's.** `promote-probes.mts --only backfill-sidecar-neutrality --force`
→ PROMOTABLE all 7, exit 0 both HOME arms, pin matched, 2725/2663 ms, **124** population samples,
`scripts/` + `packages/` fingerprints unchanged, graded databases unchanged. Yesterday's run read
121 samples at 2675/2635 ms; re-driving was not ceremony, since `scripts/` moved under it and an
entry citing a reverted drive names a warrant nobody can re-run.

**P3** — `apply-promotion.mts` still fits the tree: four pre-state assertions held, 108 comment
lines + 1 entry line moved, 2712 → 2752 lines.

**P5 — census** 154 files, 43 swept / 111 deferred → **154 / 44 / 110, `CENSUS OK`**, file count
unmoved.

**M1, declared, never measured here before.** Counted off the **parsed** registry (property access,
not `grep` — Theseus's §2 establishes a literal `grep` for `skip:` sees none of these arms):

```
pre    SWEPT 43   skips 1   refusals 1   declaring either 1   declaring both 1
post   SWEPT 44   skips 2   refusals 1   declaring either 2   declaring both 1
```

The whole frozen population was **one entry — `probe-round225` — carrying both patterns.**
`probe-round374` A5b's narrowness arm says "the registry still declares one refusal and one skip",
and my own `unit-465adopt` DEFERRED note repeated it; read against the parsed registry that phrasing
describes a two-member population that never existed. Theseus's mechanism reading (`[entries
declaring either] === [R225]`, frozen object-level) is unaffected and is what M1 makes legible — and
it explains the clause he withdrew: with one entry carrying both, "no entry declares one without the
other" was *trivially true*, which is why it read like a requirement. A5b's prose left alone: it is
in the family he cured, and re-wording a grader's own sentence from the seat whose entry it grades is
the shape I declined last time.

**P7 — the travelling record was false in four places; registered at two.** The ~108-line DEFERRED
note moves whole into the SWEPT entry. Cured by **pins, nothing deleted**:
(1) the header credited the **reverted** `unit-465adopt` attestation — unregistered, and the worst of
the four, since every entry in that list is read for who attested it;
(2) "promotion was taken, driven, and REVERTED" as the block's last word — registered;
(3) "the cure … belongs to the seats that own those rounds", done but reading as an open item —
unregistered;
(4) "`probe-round308` is already RED on `main`" — registered, fixed by Argus in `b2fa6936`.
The entry's published `why` was also re-pointed at today's drive and now names both prior refusals
rather than "DECLINED once … earlier the same day", which stopped being true at midnight.

**Unregistered findings — three are mine.**
- **U1: the agreement rule caught me twice running.** Writing the five graders' counts into the
  entry's `why` slash-separated put a self-equal pair in it; this list's own rule reads every
  self-equal pair in a `why` against that entry's `expect` → census **RED**, "why says 8 where
  expect pins 13". My first correction **re-tripped it by quoting the offending pair verbatim**.
  `probe-round371`'s shape, handed back by the file I was editing to record someone else's version
  of it. Both reds came from running the census over the edited entry rather than reasoning about it.
- **U4: I drafted P6's result slot while the sweep was still driving** — row marked HELD, figure
  written in, no result in hand. `unit-465adopt` recorded this exact error of mine ten hours earlier
  (there the figures came back byte-identical, so nothing published was false and being right was
  luck, not method). Caught this time *before* the drive returned, by re-reading my own file against
  the clock rather than against the prediction, and corrected to PENDING. Twice in two fires is a
  method problem and is recorded as one.
- **U2, not mine, re-driven: `promote-probes.mts` proposes no `skip:`** and still ends "paste into
  SWEPT". An unaltered paste of today's proposal would re-create, inside the list, the defect this
  probe was declined over. A standing property of the tool, not a one-off. **Routed, not fixed** —
  `round285`/`round295`/`round325` grade the promotion path and at least one may pin the proposal's
  shape, so changing that output is its own unit.
- **U3: the census cannot see any of this.** `--census` returns before the driving loop and says so
  in its own `NOT CHECKED` line; `package.json` and `gate.mts` both pass `--census`. The gate was
  green on this tree before the sweep ran, and would have been green with a red swept probe in the
  list. That is the 13-day `probe-round308` gap, and it is why P6 was driven rather than inferred.

**Gate, re-derived fresh:** `GATE ok exit=0` ×5 — census, typecheck, server **143 files · 2221
passed · 1 skipped (2222)**, client **26 passed | 13 skipped (39)** files and **333 passed | 13
skipped (346)** tests, aggregate. Byte-identical to Theseus's and Argus's figures, as expected for a
unit adding no vitest test.

**Standing items, re-derived not recalled.** ma-smoke: `git ls-remote --heads origin` and
`git branch -a` both **0** for `smoke`/`managed`; day **19** (2026-10-21 → today inclusive, agreeing
with Argus's figure this morning); named blocker on xian, unchanged. Rollup read directly at
`docs/operations/attention-rollup.md:9`: **v176, needs-you 3**, unchanged; item 3 is the ma-smoke
item and is blocked on xian.

**`round372` A2 — claimed, after three namings with no owner.** Theseus's §5/§6 named it unclaimed
with the blocker on nobody; Argus read the 440-line file himself this morning, confirmed the crash
(`litteral(r225.refusal!)` evaluated as a boolean argument before any result is recorded), scoped the
repair as a restructuring of `A1b` and the `REFUSAL_LINE`/`SKIP_LINE` construction rather than a
null-check patch, and declined it the same way. Three namings with no owner is a deadline with
nothing behind it, so **this seat takes it for the next fire** as its own unit. It covers both halves
— the missing driven control *and* the strictly-stronger-than-`=== 1` claim — because both need the
same thing: an entry whose declarations can move without the upstream `r225.skip!` /
`r225.refusal!` dereferences crashing first. It will not touch Theseus's cure. Offered back in the
memo if either of them has already started.

**Commits this fire** (pushed incrementally, not held to the end):
`e7b5f6e2`-era pre-registration → `5063b5ae` (the promotion + pins) → memo + RESULTS. Exact hashes
in the wrap verification below.

### P6 — REFUTED, and the cause was my own pin

Launched in the background at 09:25 after the promotion was committed, so the five at-risk graders
were green on `main` before it started.

**First drive, 09:29:** `SWEEP FAILED — 43 of 44 swept probes green, 1 red, 0 blocked (0 could not
run, 0 ran but did not finish), 0 census problem(s), 110 deferred`. The new member passed on its own
row (`PASS exit 0 probe-backfill-sidecar-neutrality.mts · All 13 regression checks passed`). The
sole red: **`probe-round308`, exit 1, `2 of 23 regression check(s) FAILED`** — the identical count
Argus cured in `b2fa6936` yesterday, on a probe he independently re-drove green at 43 swept two
hours before this fire.

**Cause, read off the probe's own rows and not guessed:** `[B0]` reports the new pointer as
`sweep-probes.mjs:1605 → r224/Q3` — **the line of my own P7 pin**, where I quoted the false arm
pointer verbatim in order to credit Argus's fix of it. `[B1]` requires every v1-reported pointer to
be explainable as an artifact of v1's key; mine was not, so it read **8 of 9 explained** and
`[B1]`/`[C1]` both failed. Round308's own finding is that the detector reads **token adjacency**,
and token adjacency cannot tell a quotation from a claim.

**Cured per round308's doctrine — the citing prose, not the detector**, the same way Argus cured
his: the pin now describes the defect without spelling the pointer, and carries the rule for the
next writer (*describe a false pointer, never reproduce it*). Re-driven alone: `All 23 regression
checks passed`, 8 measurements, 0 skips.

**This is the third instance in one fire of one shape** — U1's two census reds and this one: a
correction that reproduces the defect it is describing re-trips the detector that catches it. Twice
on the entry-schema agreement rule, once on round308. Recorded as the method problem it is.

**What the prediction bought.** The promotion was sound throughout — three grader arms green, the
new member's own row green — and the only red in the sweep was manufactured by the *documentation*
of the promotion, not by the product or the registry logic. It would have shipped silently: the gate
is `GATE ok exit=0` on both trees, because `--census` returns before the driving loop (U3). Second
time in two weeks that this blind spot was the only thing standing between a red swept probe and
`main`.

**Second drive, after the fix** — transcribed from `scratch/sweep2.out:97`, not drafted ahead of it:

```
SWEEP PASSED — 44 of 44 swept probes green, 0 red, 0 blocked (0 could not run,
0 ran but did not finish), 0 census problem(s), 110 deferred
```

44 `PASS` rows counted mechanically, 0 red. **P6 stays refuted** in the write-up rather than quietly
upgraded: the state it predicted is the state on `main` now, but it is not the state it was driven
against, and recording it as HELD would launder a refutation into a pass.

Gate re-run on the fixed tree as well: `GATE ok exit=0` ×5, server **143 / 2221 / 1 skipped (2222)**,
client **26 / 13 skipped (39)** and **333 / 13 skipped (346)** — byte-identical to the run on the red
tree. That pair of runs is the **direct** evidence for U3 rather than an inference from it: the same
gate verdict, the same figures, over one tree with a red swept probe and one without.

**Cross-pollination brief:** `docs/briefs/cross-pollination/current.md` read — by design it carries
no content in this public repo, only a pointer to a private URL. Its own commit subject (`2bafd23c`,
"testing gaps hidden by coverage") is apposite to U3 and to this fire's red, but I did not read the
brief body: **WebFetch is not a permitted tool in this fire** (requested, refused), and the private
source lives in `mediajunkie/src/internal/`, which is outside the four mailbox paths this seat may
touch. Named as a tool-permission constraint, not as "unreachable from this seat" — a claim of that
shape from this seat has been wrong before.

## 09:3x — wrap verification

**Step 1 — commits landed.** `git fetch origin`, then
`git log origin/main --author=Daedalus --oneline -6`:

```
dad07e97 coord: 11/08 START fire — the promotion is taken and on main, …
0194f4b6 sweep+unit+log: P6 REFUTED — my own pin re-broke probe-round308, …
4f850c20 mail+unit: Daedalus -> Theseus, Argus — the promotion is taken, …
5063b5ae sweep: probe-backfill-sidecar-neutrality PROMOTED into SWEPT — …
447525f4 unit-465repromote: pre-registration — the promotion re-taken …
ba62c552 log: wrap verification for the 11/07 STOP fire  [the checkpoint]
```

**Correcting this figure rather than leaving it:** the listing above was taken at `dad07e97` and said
"five commits, plus this log". Two more landed after it — `c1e3dcc0` (the re-driven sweep's figures
into the unit, memo and coordination entry) and `9b7798ed` (this log) — and then the correction itself
became a further commit, so "seven" was stale before it was pushed too.

**A count of this fire's commits cannot be written inside this fire's commits** — the log can never
include the commit that carries its own total. So the figure is replaced by the command that derives
it, which is correct at every later moment:

```
git rev-list --count --author=Daedalus ba62c552..origin/main
```

read **8** immediately after the correction landed. The fire's commits begin at `447525f4` (the
pre-registration) and run to the tip of this log. This is the same class of defect as the four pins
in P7 — a true sentence that stops being true beside its own subject — and the cure is the same one
this unit used on the entry's `why`: publish the derivation, not the frozen number
(`feedback_a_frozen_count_in_prose_beside_a_countfree_predicate_drifts_invisibly`).
`git rev-list --left-right --count HEAD...origin/main` = **0 0**.

**Step 2 — deliverables present on the remote**, `git ls-tree -r origin/main --name-only` over the
path specs: **8 asked for, 8 returned** — `PRE-REGISTRATION.md`, `RESULTS.md`, `drive-graders.mts`,
`count-declarations.mts`, `grader-grading.txt`, `declaration-population.txt`, the memo, and this log.
**0 files under `scratch/`**, which is the point of using explicit path specs rather than `git add
-A` over a unit directory.

`git diff --stat origin/main -- scripts/sweep-probes.mjs` → **empty**, so the working tree I drove
round308 and the full sweep against is byte-identical to the remote blob — the fix is verified at
the remote, not merely in my tree. `git diff --stat 447525f4 -- packages/` → **empty**: this fire
touched no product code, only `scripts/sweep-probes.mjs`.

**Step 3 — this log pushed last**, after steps 1 and 2.

Delivery is the wrapper's to log; what is verified above is presence on `origin/main`, not delivery.

---

## 13:17 — WORK fire (model: claude-opus-5)

**Substantive. The `round372` A2 item I claimed in this morning's §5 is cured, driven and routed:
`docs/research/unit-465guard-2026-11-08/`. 7 predictions, 7 held; 1 unregistered control; 2 declared
measurements; 3 unregistered findings, all three mine.**

**Briefing.** Checkpoint re-derived by author: `7bd0f520` (09:37, this morning's last log push).
8 commits since, `%an`-checked — **Theseus 7, Calliope 1, none mine.** `git diff --stat
7bd0f520..origin/main -- packages/ scripts/` **empty**: no product or script code moved under me.
Mail delta read off `git diff --name-status -- docs/mail/` rather than a re-read of the directory:
**one new memo to this seat**, Theseus's `…the-a5b-prose-you-handed-back-was-already-cured…`, 170
lines, read in full and actioned in the same fire.

**His §1 is right and I took it without softening.** I handed him a repair for a sentence that was
already gone; what I was reading was my own `unit-465adopt` DEFERRED note beside a frozen
`post-round374.out`. Verified from this seat before replying rather than taken from his memo:
`grep -rn "one refusal and one skip"` over live `.mts`/`.mjs` under `scripts/` returns **three lines,
none an arm label** — two are his registry prose at `sweep-probes.mjs:1564`/`:1587`, the third is
`round377` C0b where the phrase is scoped "for the subject" and is true. Second time this week one of
us read a recording as a live claim, and it is the lesson already in my memory as *a cured figure
leaves a live sentence about the old one*.

**His §6 stood down from `round372` A2 explicitly** ("has not started it and will not start it"), so
the claim I made this morning is unambiguous and this is the unit.

**The cure.** `A2` moved **above** `A1b` and made the guard; the two `!`s removed by narrowing (two
locals plus an explicit `=== undefined`). Not a null check at the use sites — a `?? fallback` for
`REFUSAL_LINE` would build section A's tuple set out of a string of my own invention, which is the
construction A1b exists to legitimise. Not an added arm — an upstream guard arm would make A2's
second and third conjuncts true-by-filter. **26 arms either way; the registry `expect` untouched.**

**The 2×2, pre-registered before driving.** Shipped subject from `git show d742de81:…` rather than a
hand copy, because this unit cures its own subject.

```
shipped × faithful  exit=0  26 rows  All 26 regression checks passed.    ← the control
shipped × moved     exit=1   1 row   headline: (NONE PRINTED)  TypeError: true
cured   × faithful  exit=0  26 rows  All 26 regression checks passed.
cured   × moved     exit=1   2 rows  1 of 2 regression check(s) FAILED.  FAIL A2 (names the member list)
```

**The crash and the legitimate red exit on the same code.** P1 was registered against the missing
headline for that reason, and the two cells are now the evidence rather than the argument.

**P3 — the control `sweep-probes.mjs:1593` says the arm never had.** The mutant registry moves this
entry's two declarations whole onto `probe-round241` (target *derived* from the parsed registry,
anchor asserted unique). Declaring members **2 → 2**: count-preserving, so `=== 2` is green on
exactly the registry that killed the shipped file and `includes(R225)` is not.

**Three unregistered findings.**

- **U1 — my own census counted my own cure as an instance of the defect.** First version flagged
  `probe-round372:140`, inside the docblock I had just written, where it *quotes*
  `litteral(r225.refusal!)` to say what was removed. Fixed by splitting LIVE from prose with
  `lib/strip-source.mjs` and printing both. Fourth instance this week of the same shape.
- **U2 — the mechanism is one step earlier than the `!`s I pre-registered.** 33 live
  `.refusal!`/`.skip!` dereferences across 5 files (32 candidate lines, all printed and hand read),
  none with an upstream presence assertion — **plus 9 `SWEPT.find(…)!` sites in the same 5 files**,
  which throws if the entry leaves `SWEPT` at all, and those files have no A1 to record first.
  `probe-round372` is the only file in the family that guards entry presence. P7's selector could not
  have found this, so it is recorded as unregistered rather than folded in.
- **U3 — authorship checked rather than assumed, and I had it wrong.** `round373`/`round375`/
  `round377` are mine, `round374`/`round374b` Theseus's. I was carrying `round377` as his until
  `git log --diff-filter=A`.

**The declared refusal was honoured.** Nothing outside the subject was cured. `round373`/`round375`/
`round377` claimed by this seat as its own unit; `round374`/`round374b` routed to Theseus with the
offer to take all five in one unit if he prefers.

**And a fourth finding, against myself: I edited `scripts/sweep-probes.mjs` while the full sweep was
driving**, which is the lesson in my memory as *don't touch the index while the sweep drives*.
`probe-round264` went **RED, exit 1, `1 of 14`** in that drive — and it was right to: its Z1/Z2 pair
fingerprints `scripts/` at open and close and its own Z2 text names this window ("blind to a write
into a file already being edited, which is the same window"). Driven alone immediately after, with
nothing in flight: **All 14 regression checks passed, exit 0.** So the probe caught a real mid-drive
write, mine, and the first sweep of this fire is **contaminated and discarded, not explained away**.
Re-driven clean; figures below are from the re-drive.

**Gate, re-derived fresh, all five stages:** `GATE ok exit=0` ×5 — server **143 files · 2221 passed ·
1 skipped (2222)**, client **26 passed | 13 skipped (39)** files and **333 passed | 13 skipped (346)**
tests. Byte-identical to Theseus's §4 and Argus's figures. The typecheck stage is P6's second half:
the `!`s came out by narrowing, not by a cast.

**Full sweep, clean re-drive:** `SWEEP PASSED — 44 of 44 swept probes green, 0 red, 0 blocked (0
could not run, 0 ran but did not finish), 0 census problem(s), 110 deferred` — **44 `PASS` rows and 0
`RED`/`BLOCKED` rows counted mechanically off the capture**, not read from the summary line. The
372–377 family at its shipped figures with the cure in place: `round372` **26**, `round373` 15,
`round374` 8, `round375` 8, `round377` 13, `round308` 23. Driven rather than inferred, for the reason
Theseus priced at 282 s: `--census` returns before the driving loop.

**Standing items re-derived, not recalled:** ma-smoke — `git ls-remote --heads origin` and
`git branch -a` both return **nothing** for `smoke`/`managed`, **day 19**, named blocker on xian
unchanged. Rollup read directly at `docs/operations/attention-rollup.md:9`: **v176, needs-you 3**,
last refreshed 11/06; item 3 is ma-smoke and is blocked on xian. Neither moved this fire.

**Elapsed, run rather than estimated:** `date` at the sweep's end read **13:38** — 21 minutes in. I
had been carrying ~14:10 from feel, and the memo went out with a `~14:1x` timestamp that I corrected
before the final push. That is the note in my own memory as *run `date`, don't estimate elapsed from
effort*, and the error was 30+ minutes in a single fire.

**Drain:** mail (1 addressed-to-this-seat memo, read in full and actioned in the same fire; his §1
correction accepted without softening and verified from this seat first; thread left open on his §5
Argus item), the claimed `round372` A2 unit (opened, pre-registered, cured, driven 2×2, written up),
the census it required (run, hand read, routed), the registry prose the cure falsified (pinned, not
rewritten), the red my own mid-drive write caused (root-caused, counterfactual closed, drive
discarded, sweep re-driven), gate, census, standing items. **Deferred with a named blocker:** the 33
live dereferences + 9 `SWEPT.find(…)!` sites in the other five files — blocker is this unit's own
pre-registered scope statement, which declared the refusal in advance; `round373`/`round375`/
`round377` claimed by this seat for its own unit, `round374`/`round374b` routed to Theseus with the
offer to take all five in one unit instead.

## 13:4x — wrap verification

**Step 1 — commits landed.** `git fetch origin`, then
`git log origin/main --author=Daedalus --format='%h %cI | %s' -8`:

```
6d2edbca 13:40:13  coord+log+unit: 11/08 WORK fire — round372 A2 cured, driven 2x2 and routed …
6d1edf70 13:28:52  unit-465guard: registry pin + RESULTS + the P7 census …
3107d4c2 13:27:50  mail: Daedalus -> Theseus, Argus — the round372 A2 item is cured and driven …
e481323f 13:24:19  unit-465guard: A2 moved above A1b and made the guard, driven 2x2 …
d742de81 13:20:41  unit-465guard: pre-registration — probe-round372's A1b dereferences …
7bd0f520 09:37:04  [the checkpoint — this morning's last log push]
```

The fire's commits run from `d742de81` to the tip of this log. **As last fire, the count is stated as
the command that derives it rather than as a number** — a log cannot contain the commit that carries
its own total, so any figure written here is stale before it is pushed:

```
git rev-list --count --author=Daedalus 7bd0f520..origin/main
```

read **5** immediately before this log was committed, and will read 6 once it is.
`git rev-list --left-right --count HEAD...origin/main` = **0 0**.

**Step 2 — deliverables present on the remote.** `git ls-tree -r origin/main --name-only` over the
path specs: **13 asked for, 13 returned** — `PRE-REGISTRATION.md`, `RESULTS.md`, `drive-guard.mts`,
`drive-guard.txt`, `census-registry-bangs.mjs`, `registry-bang-census.txt`, `gate.out`,
`sweep-redrive.out`, the cured `probe-round372`, `sweep-probes.mjs`, the memo, `COORDINATION.md` and
this log. **0 files under `scratch/`**, which is the point of explicit path specs rather than
`git add -A` over a unit directory.

`git diff --stat origin/main -- scripts/probe-round372-….mts scripts/sweep-probes.mjs` → **empty**,
so the tree I drove the 2×2, the gate and the 44-of-44 sweep against is byte-identical to the remote
blobs; the cure is verified at the remote, not merely in my tree.
`git diff --stat d742de81 origin/main -- packages/` → **empty**: this fire touched no product code.

**Step 3 — this log pushed last**, after steps 1 and 2.

Delivery is the wrapper's to log; what is verified above is presence on `origin/main`, not delivery.
