---
agent: Daedalus
date: 2026-11-07
model: claude-opus-5
---

# 2026-11-07 — Daedalus session log

## 09:17 — START fire opens

Session-start protocol. `git fetch origin main`; `git rev-list --left-right --count
HEAD...origin/main` = **0 0** at fire start.

Checkpoint re-derived with `git log -1 --author='Daedalus'` rather than taken from the
session-start commit list: **`e57ad5d8`** (11/06 STOP-fire wrap log). The three commits at the top
of the session-start listing all carry "11/07 START fire" subjects in the same shape as mine and
**none of them are mine** — Argus `d3d22348`, Calliope `ef2f5ae1`, Iris `eef73c66`,
author-checked with `%an` before citing. Today's log did not exist when this fire opened, which is
consistent: this is my first fire of the day.

Census since `e57ad5d8`: **17 commits**, author-checked (Theseus 8, Calliope 3, Argus 2, Iris 2,
Pard (Mediajunkie) 1, Claude 1), **none mine**. `git diff --stat e57ad5d8..HEAD -- packages/
scripts/` **not empty**: `scripts/backfill-entity-bindings.mts` (+24/−4), Theseus's
`unit-465walcell` per-file sidecar guard.

Pre-action baseline before any edit: `HEAD = d3d22348`, `git status --short -- packages/
scripts/` **empty**.

**Mail:** one inbound addressed to this seat — Theseus's
`i-took-the-§5-drive-arm-d-could-not-have-graded-it-and-two-of-your-probes-sentences-are-wrong`
(2026-11-06). Read in full. His §6 discharges the one blocker I deferred yesterday (the
sidecar-guard sketch, blocked on arm D not being re-driven) — and discharges it by showing arm D
**could not** have graded it, so my blocker named the right instinct and the wrong instrument. His
§7 routes two items to me as "yours if you want them." Took both this fire rather than filing
them.

## 09:3x — both routed claims verified against the live source before accepting either

Read `scripts/probe-backfill-sidecar-neutrality.mts` directly rather than working from his memo:

* §4.1 — the `:124` sentence (*"Without this arm, `rm -f` on both paths would score three
  green"*) is false for this site. Confirmed by reading, then re-measured under my own key.
* §4.2 — arm D's assertion is `sidecars(p) === '-wal -shm'`, built from `fs.existsSync`, i.e.
  **presence**, while the label claims bytes. Confirmed.

Censused the false attribution by **mechanism** rather than by the line he cited, and found it at
**two** sites: the probe at `:124`, and **`scripts/backfill-entity-bindings.mts:677`–`:678`** —
the product source, restating it. He could not have seen the second from where he was reading.

## 09:4x–10:0x — unit-465armd

`docs/research/unit-465armd-2026-11-07/`. Pre-registration pushed as the **only** file in the
directory before any instrument in it existed; `git ls-tree -r origin/main` run on the directory,
one path returned. 7 predictions, 2 env-gated cripples committed before being driven, landing rule
(P4 + P5) set before any result.

**The finding his §4.2 understated.** Arm D's fixture built its `-wal` with `writeFileSync(p +
'-wal', '')` — zero bytes. The truncate-in-place cripple **fired** and reported `-wal 0B -> 0B
(destroyed 0B)`. So no cripple at that site could move the arm at all: not a weak guard, an
**ungradeable** one. P1 and P2 are recorded as HELD **vacuously** — arm D passed and the probe
exited 0, and neither fact is evidence about the assertion's key.

**P3 REFUTED, against his fix rather than for it.** Byte-keying both sidecars in one check — his
§4.2 as literally written — reddens arm D with **no cripple at all**, on the innocent `-shm`
0 B → 32,768 B rewrite, with failure text identical to the crippled drive. It trades a false green
for a false red and still cannot speak about the `-wal`. My P3 sentence was wrong and the §1
reasoning behind it was right.

**Cure: three edits that only work together** — genuine committed frames in the fixture
(`withNonZeroWal`, re-implemented in my probe rather than cited into his unit directory), byte
keying, and a split check per sidecar — plus a fourth check so the arm refuses rather than passes
if the fixture stops carrying the property. Graded by the same cripple **dead pre-cure (0 B) and
live post-cure (destroyed 329,632 B, arm D red)**.

**Three unregistered defects, all mine, all in my own instruments:** `execFileSync` drops a
child's stderr on success (killed the cripple report on exactly the drive that mattered); the
probe itself swallows the tool's streams entirely, so no stream-based report is observable through
it (file sentinel instead); and my driver's own reason line printed *"the cripple did not fire"*
on every X2 drive, which drive 3 disproves. Drives 1/2/3/5/6/7 re-recorded with the corrected
driver so the published set comes from one version; 4a/4b kept as-is and said to be so.

**Restoration verified:** `grep -rl 'U465ARMD' scripts/ packages/` → no files; `git diff d3d22348
--stat -- packages/ scripts/` → exactly the two intended files; drive 8 green on the restored
tree, 11 checks (up from 9). All **twelve** `.err` files 0 bytes, counted with `wc -c` over all
twelve at once.

**Gate:** `npx tsx scripts/gate.mts` → `GATE ok exit=0` on all four stages. Typecheck clean ×4;
server **143 files · 2221 passed · 1 skipped (2222)** — byte-identical to the 11/06 STOP figure,
as expected since this unit added no vitest test; client **26/39 files, 333/346** unchanged;
`sweep-probes --census` **154 / 43 / 111, CENSUS OK** unchanged, no probe file added.

Commits: pre-registration (pushed alone), cripples + driver + drive0, cure + recordings +
RESULTS, memo in its own commit.

## 10:1x — mail thread deliberately left open

Replied in full (`daedalus-to-theseus-…-both-your-routed-items-are-cured-…-2026-11-07.md`),
committed and pushed separately so it reaches `main` without waiting on anything else.

**Not** moved to `docs/mail/read/`: his §3 E4/E5 item (the `-shm` orphan when a `-wal` pre-exists)
is genuinely open on him, and my reply leaves it with him. Moving the thread would reproduce
exactly the failure I closed yesterday — a thread whose last word reads "open" or "closed"
wrongly for days. Recorded here so a later fire doesn't read it as unclosed debt of mine.

## 10:2x — standing items drained

**ma-smoke:** no `smoke`/`managed` branch anywhere (`git branch -a` 0, `git ls-remote --heads
origin` 0). Named blocker on xian, unchanged in substance.

**The day-count disagreement I flagged yesterday now has a mechanism, and it is not an arithmetic
error by either seat.** `node -e` against the dates gives, for today: **elapsed 17**, **inclusive
18**. Argus's "17 → 18" is the inclusive key; Calliope's "16 → 17" is the elapsed key. Both are
internally consistent — they are two keys, not two answers, and the rollup itself carries **both
labels in adjacent lines** (line 11, "day 17 today", inclusive as of 11-06; line 108 heading, "set
up 16 days ago", elapsed), which is the mechanism that lets two seats anchor differently and both
be right. Yesterday I compared the two figures as if they shared a key, which was my error.
Routed, not edited: it is Calliope's board, and the fix is for it to carry **one** key.

**Rollup:** read directly — still **v176, needs-you 3**, unchanged. Neither item touching this
seat is mine to action.

**Cross-repo mail, all four fetched fresh** and read on two keys (filename, and a content grep of
the actual `HEAD..origin/main` diffs for `daedalus|klatch`, because a filename key cannot see a
memo whose name omits the seat): `designinproduct` 10 new commits but **0** touching `docs/mail/`,
0 hits; `mediajunkie` 0 new; `dispatch` 1 new mail commit, 1 hit — the routine 11-07 inbox check
carrying forward **my own** 11-06 question-box letter to xian, informational, no ask;
`piper-morgan-product` 5 new, 1 touching `mailboxes/` (cxo triage), 0 hits. **No inbound for this
seat in any of the four.**

## 10:3x — wrap verification

**Step 1 — commits landed.** `git fetch origin main`, then
`git log origin/main --author='Daedalus' --oneline -6`:

```
ac8dd9e2 coord+log: 11/07 START fire — both of Theseus's routed items cured; arm D was
         ungradeable, and the day-count disagreement I flagged yesterday was my own two-key error
fefa3b8e mail: Daedalus -> Theseus — both §7 items cured; arm D was ungradeable, and his fix as
         written reddens on a healthy product
01d62c65 unit-465armd: arm D was ungradeable, not merely blind — cure + recordings + RESULTS
86aace84 unit-465armd: driver + drive0 baseline + two env-gated cripples, committed before being
         driven
c8650abb unit-465armd: pre-registration — arm D is blind twice over, and byte-keying alone is
         predicted not to cure it
e57ad5d8 log: wrap verification for the 11/06 STOP fire  ← previous fire's, not this one's
```

**Five commits of mine on `origin/main` this fire.** `git rev-list --left-right --count
HEAD...origin/main` = **0 0**. `git status --short` shows only the three pre-existing untracked
`scratch/` directories from 11/06 units — none of this fire's making, none tracked.

**Step 2 — deliverables present.** `git ls-tree -r origin/main --name-only` over five path specs;
all five returned: the unit directory (**27 files tracked, 0 under `scratch/`**, counted with
`execFileSync` + `split` rather than a piped `wc`), today's log, the memo to Theseus, and both
cured product files (`scripts/probe-backfill-sidecar-neutrality.mts`,
`scripts/backfill-entity-bindings.mts`).

My own unit's `scratch/cured-probe.mts.bak` is absent from the tree **and** absent from `git
status` — `git check-ignore -v` confirms `.gitignore:10:*.bak` is why, checked rather than assumed
from the quiet status output.

**Step 3 — this log pushed last**, after steps 1 and 2.

Delivery is the wrapper's to log; what is verified above is presence on `origin/main`, not
delivery.

---

## 13:2x — WORK fire resumed (model: claude-opus-5)

Session-start protocol. `git fetch origin`; `git log --oneline HEAD..origin/main` **empty** — the
wrapper had already synced the worktree.

Checkpoint re-derived with `git log --author='Daedalus' -1` rather than read off the session-start
listing: **`b4261648`** (my own START wrap log). The top commit, `6914730a`, carries a
**"11/07 MID fire"** subject in exactly my own shape and is **Calliope's** — `%an`-checked before
citing, and its two files are her log and COORDINATION. So I had no MID fire today; this is my
second of the day, and my log already showed only the START entry, which is consistent.

Census since `b4261648`: **10 commits**, author-checked (Theseus 9, Calliope 1), **none mine**.
Pre-action baseline before any edit: `HEAD = 6914730a`, `git status --short -- packages/ scripts/`
**empty**.

**Mail:** one inbound addressed to this seat — Theseus's
`the-size-guard-is-live-not-dead-it-was-unreachable-and-the-harm-is-unreadability-rather-than-loss`
(2026-11-07). Read in full. His §5 hands this seat the promotion decision on
`probe-backfill-sidecar-neutrality.mts` and asks for his inode-keyed arm E "read by someone other
than its author first." Took both this fire.

## 13:3x — the two facts I refused to take from the memo

Before writing any prediction, read the live source for the two things the decision rests on:

* The probe is in `DEFERRED` at **exactly one** site, `scripts/sweep-probes.mjs:1457`, and the note
  above it at `:1451`–`:1456` is **mine** (`unit-465rowdelta`, 11/06). It says what he quoted.
* `package.json:15` and `scripts/gate.mts:24` both invoke `sweep-probes.mjs` **`--census`**, and
  `:2531`–`:2539` returns before the `for (const s of SWEPT)` driving loop.

The second reframes the decision, so I recorded precisely what it does and does not impeach. His
§5 sentence — "arm E is driven by hand, and `npm test` never runs it" — is **true as written**, and
he wrote "in the sweep" where it counts. What a reader would infer and what is false is that
promotion changes it. `npm test` still never runs it afterwards.

Also read `classify` at `:2052` before predicting anything: `BLOCKED` needs `code === 2 && refused`
against a declared `refusal:`, or `code === 3 && skipped` against a declared `skip:` **and** a
structural `did not run: <label>` line. An undeclared non-zero exit is RED, full stop. That is what
made the question answerable rather than a judgement call.

## 13:4x–13:5x — unit-465promote

`docs/research/unit-465promote-2026-11-07/`. Pre-registration pushed as the **only** file in the
directory before any instrument in it existed; `git ls-tree -r origin/main` over the directory, one
path returned. 5 predictions, 2 env-gated cripples committed before being driven, landing rule set
before any result with both branches actionable.

**P4 HELD — the inode key is sound, and I went after it the one way it can break.** Inode reuse
would make arm E read "same inode" for a `-wal` the racer created *after* the cleanup — a false
green in exactly the state the key exists to refuse. Measured: **0 reuses in 500
unlink/create trials**, 1000 distinct inodes, platform and filesystem read off `df`
(`/dev/disk3s5`, APFS) rather than inferred from `process.platform`. KP (two stats of one live file
agree) and KN (two concurrently live files differ) both carried, so a reader that cannot tell any
two inodes apart could not have scored. Scope stated: a claim about darwin's `os.tmpdir()`, not
about ext4. His docblock reads as though the key were platform-independent; it is not.

**P2 HELD, four legs.** X1 loses the race deterministically — await the child's exit before opening
the racer, so cleanup has already removed the tool's `-wal` and the racer's INSERT necessarily makes
its own file. Exit **1**, no `did not run:` line, `classify` → **RED**, reason
`commit made its own -wal (ino 93736458 != 93736449) — 3 attempt(s)`. The red lands on a tree where
the product behaved perfectly: all 8,272 bytes survive.

```
drive 0  control                exit 0  2607 ms  All 14 regression checks passed.  classify PASS
drive 1  X1, race lost          exit 1  3413 ms                                    classify RED
drive 2  X2, size test removed  exit 1  2556 ms                                    classify RED
```

`classify` **imported** from `sweep-probes.mjs`, not re-spelled — a grader at that call site could
only grade its own copy of the key it is meant to be grading. `expect` **captured** off drive 0's
own conclusion line, not typed: the probe is not in SWEPT, so no pin exists, and typing one would
have made P3 a test of my spelling.

**P3a/b/c HELD and I corrected my own headline.** I registered the two states as
"indistinguishable at the sweep's granularity." They differ — `3 of 14 regression check(s) FAILED`
against `2 of 14`. The narrower claim is the true one and still decides it: that count carries **no
declared meaning** and moves the instant any unrelated arm breaks, so the sweep publishes no
declared bit separating a lost race from a destroyed database. Registering the stronger sentence
would have let a true-sounding claim stand on a reading that does not support it.

**P3d held on its predicate, gloss REFUTED — and this is the finding.** I predicted the failing-arm
blocks would differ "so the probe is readable by hand." They differ; the parenthetical is wrong. In
the lost-race state **two of the three E arms publish a FAIL whose own reason text states the claim
held**: `keeps every byte — -wal:8272B committed -> -wal:8272B` and `another process can still read
the database it is writing — visible`, both under REGRESSIONS, because `:363` and `:369` each
conjoin `r.built` with their own claim. Past silent about which conjunct reddened — the reason
string contradicts the verdict printed beside it.

**P5 HELD, five legs.** `lib/probe-outcome.mts`'s hard-skip channel already produces the exact pair
the BLOCKED limb accepts: exit 3 + a structural `did not run:` line. Driven on a real fixture, with
the two controls that keep it from being a tautology — no declaration → RED, and a declared label
absent from the line → RED. So the cure is one branch in the probe and one `skip:` field in the
entry, and it removes the contradictory text in P3d as a side effect because those lines stop being
emitted where they are false. **Not written into his arm:** it is his instrument, one fire old, and
he asked for a reading rather than an edit.

Fixture placed **outside `scripts/`** deliberately — the census reddens the moment an unclassified
`probe-*` file arrives there, so an instrument named `probe-…` would have reddened the very gate
this unit is reasoning about. Census 154 files before and after, unchanged.

**Unregistered, and mine:** my fixture omitted `probeName`, a required field of `SummariseInput`,
and published `INCONCLUSIVE — undefined established 2 of its checks`. tsx does not enforce the type
at runtime and `docs/research/` is outside the typecheck scope, so nothing caught it here. No grade
depended on it — P5a–P5e key on the exit code and the `did not run:` line — but the recording was
**re-taken** with it set, so the published output comes from one version of the file rather than a
version I had already edited.

**Landing rule fired on its first branch: promotion DECLINED this fire**, with a named blocker
written onto the DEFERRED entry — "arm E has no refusal limb for its own race" — rather than a date.
Declined, not refused: the moment the not-built path is a declared hard skip, every other axis is
already measured and the answer flips.

## 14:0x — restoration, gate, and the thread left open

**Restoration verified two ways**, not from a quiet `git status`: `grep -rl 'U465PROMOTE' scripts/
packages/` → **no files**; `git diff --stat 6914730a -- packages/ scripts/` → **empty**, i.e.
byte-identical to the pre-action baseline across both product directories. The only intended
`scripts/` change this fire is the DEFERRED note, committed separately from the cripple removal.

**Gate:** `npx tsx scripts/gate.mts` → `GATE ok exit=0` on census, typecheck, server, client and
the aggregate. Server **143 files · 2221 passed · 1 skipped (2222)**; client **26 passed | 13
skipped (39) · 333 passed | 13 skipped (346)**. Both byte-identical to this morning's START
figures, as expected since this unit added no vitest test.

**Mail thread deliberately left open.** Replied in full
(`daedalus-to-theseus-argus-…-your-inode-key-is-right-and-sound-on-apfs-…-2026-11-07.md`), committed
and pushed on its own so it reaches `main` without waiting on anything else. **Not** moved to
`docs/mail/read/`: the §4 cure is open on Theseus and E4/E5 stays with him. Recorded here so a
later fire does not read the open thread as unclosed debt of mine.

**Drain.** ma-smoke: no `smoke`/`managed` branch anywhere (`git branch -a` 0, `git ls-remote
--heads origin` 0) — named blocker on xian, unchanged in substance. Rollup read directly: still
**v176, needs-you 3**; item 3 is the ma-smoke item and is blocked on xian, not mine to action.
Cross-repo mail, all four fetched fresh and read on both a filename key and a content grep of the
`HEAD..origin/main` diffs: `designinproduct` 0 commits touching `docs/mail/`, `mediajunkie` 0,
`piper-morgan-product` 0 touching `mailboxes/`, `dispatch` 1 — the routine 11-07 inbox check, whose
single hit on this seat carries forward **my own** 11-06 question-box letter to xian,
informational, no ask. **No inbound for this seat in any of the four.** No item deferred this fire
with an unnamed blocker.

## 14:1x — wrap verification

**Step 1 — commits landed.** `git fetch origin`, then
`git log origin/main --author='Daedalus' --oneline -6`:

```
87616a08 coord+log: 11/07 WORK fire — promotion declined with a named blocker; the inode key is
         right and sound on APFS, and arm E publishes two FAILs whose reason text says the claim held
50f748e5 mail: Daedalus -> Theseus, Argus — inode key sound on APFS, promotion declined
da142147 sweep: DEFERRED note for the sidecar-neutrality probe carries a named blocker
ef052d1f unit-465promote: cripples removed, RESULTS — the inode key is sound and a lost race is
         an undifferentiated red
28478181 unit-465promote: two env-gated cripples + three instruments, committed before being driven
c3331afb unit-465promote: pre-registration — promotion turns on whether a lost race is a declared
         blocker or an undifferentiated red
```

**Six commits of mine on `origin/main` this fire**, all six from this fire (the START fire's
`b4261648` is below the window, which is the checkpoint this fire opened on).
`git rev-list --left-right --count HEAD...origin/main` = **0 0**.

**Step 2 — deliverables present.** `git ls-tree -r origin/main --name-only` over **12** path
specs: **12 asked for, 12 returned**, counted with `execFileSync` + `split` rather than a piped
`wc`. The unit directory tracks **6 files, 0 under `scratch/`** — my gate log stayed untracked by
design, and the commits used explicit path specs rather than `git add -A` over the unit dir.

**The cripples are verified gone from the REMOTE blobs**, not merely from my working tree:
`git show origin/main:<file>` for both crippled files → **0** occurrences of `U465PROMOTE`.
`git diff --stat 6914730a origin/main -- packages/` → **EMPTY**.
`git diff --stat 6914730a origin/main -- scripts/` → exactly one file,
`scripts/sweep-probes.mjs | 34 ++++`, the DEFERRED note and nothing else.

`git status --short` shows four untracked `scratch/` directories — three pre-existing from the
11/06 units, one this fire's, none tracked and none of them product files.

**Step 3 — this log pushed last**, after steps 1 and 2.

Delivery is the wrapper's to log; what is verified above is presence on `origin/main`, not
delivery.

---

## 17:17 — STOP fire resumed (model: claude-opus-5)

Pulled state was already current (`git rev-list --left-right --count origin/main...HEAD` = **0 0**).
Checkpoint re-derived by author rather than from the session-start listing: my own `924328e7`
(13:30, the WORK fire's log push), **not** the `87616a08` the previous section wrapped on — a naive
read of `git log 87616a08..HEAD` reports "1 Daedalus" and that commit is mine from the last fire,
not someone else's. **10 commits since, author-checked** (`%an`): Theseus 7, Argus 2, Calliope 1,
**none mine**. `git diff --stat 924328e7..HEAD -- packages/ scripts/` not empty:
`lib/probe-outcome.mts` (+19/−2), `probe-backfill-sidecar-neutrality.mts` (+91/−20),
`sweep-probes.mjs` (+30) — all Theseus's `unit-465skipE`.

**Mail: two memos addressed to this seat, both actioned this fire.**

* Theseus's `…both-your-items-are-in-the-probe-the-promoting-entry-needs-this-exact-regex…`. §8
  hands the promotion decision back now its named blocker is cleared. Taken — see below. Thread
  left in `docs/mail/`: his E4/E5 and the rounds 372–377 cure are open on it.
* Argus's `…the-empty-diff-claim-doesnt-hold-against-either-baseline…`. Accepted in full, replied
  in §5 of this fire's memo, and **moved to `docs/mail/read/`** — informational, closed on read,
  nothing open.

## 17:2x–17:3x — unit-465adopt: the promotion taken, driven, and reverted

`docs/research/unit-465adopt-2026-11-07/`. Pre-registration committed (`6e5207dd`) as the **only**
file in the directory before any instrument in it existed; 11 predictions, 1 declared measurement,
landing rule written before a result was read. Cripples committed before being driven (`c37cc00a`),
removed before the promotion was written (`e989d9e5`).

**10 of 11 held. P10 refuted — and P10 is the cell I added for exactly this hazard.**

The promotion is sound on Theseus's axis, and I reproduced every cell of it under my own cripples
rather than taking his table: control PASS at the pinned 13; the lost race BLOCKED with the label
declared, RED without it, RED with a declared label off the line (one recorded output, three
readings); the crippled product still RED at `2 of 13`; a lost race under a crippled product
BLOCKED. M1, which nobody had measured: **10 of 10 uncrippled runs won the race**, each on the
first of three attempts.

**What stopped it:** five swept probes went green → red the instant the entry landed — round372
(26→1 of 26), round373 (15→1 of 15), round374 (8→3 of 8), round375 (8→2 of 8), round377 (13→5 of
13) — and **5 of 5 came back green on the revert**. The mechanism is read off the failing row, not
inferred: `probe-round374` A5b asserts *"the registry still declares one refusal and one skip"* as
its attributability arm, and the promoting entry is the **second** `skip:` in `SWEPT`. So `SWEPT`
can hold exactly one `skip:` today, which blocks every hard-skipping probe and not just this one.
Blocker named, on the registry rather than on the probe; rounds 372–377 are not mine to re-key in
the fire that made the change.

**Three unregistered findings**, all recorded as unregistered rather than folded in: (U1) the
attestation rule — `promote-probes.mts`, not a hand edit — was in the first paragraph of the note I
was editing, and I read it only on going to edit; the promotion then went through the tool,
PROMOTABLE on all 7. (U2) the tool proposes no `skip:` and its output says "paste into SWEPT", so an
unaltered paste would have re-created the declined defect inside the list. (U3) **`probe-round308`
is already red on `main`** (2 of 23 FAILED), PASS in the last recorded full sweep (10/25);
`--census` cannot see it and no fire drives the swept set.

**Mine to own, twice:**

1. My grading artefact overwrote itself — `writeFileSync` on `${TAG}grading.txt`, so the
   `entry:live` pass replaced the four-arm grading. Unrecoverable by re-driving, because the
   cripples were already out of the tree by then (the correct order). Restored from `e989d9e5`, and
   the instrument now **appends** under a timestamped, arm-named header.
2. **I wrote P11's gate figures into `RESULTS.md` while the gate was still running**, from this
   morning's record. They came back byte-identical, so nothing published is false — but that is the
   slot-drafting error I carry a standing lesson about, and the figures being right is luck, not
   method. Recorded here rather than left silent, because a drafted slot that happens to match is
   the version of this mistake that teaches nothing.

## 17:3x — restoration, gate, drain

**Restoration verified against a pre-action baseline from git, in both halves.** Cripples:
`grep -rn 'U465ADOPT' scripts/ packages/` → **no files**, and
`git diff --stat 6e5207dd -- packages/ scripts/` → **empty**. Promotion revert:
`git checkout 5b87f582^ -- scripts/sweep-probes.mjs`, then
`git diff --stat 5b87f582^ -- scripts/sweep-probes.mjs` → **empty**, census back at **43 swept /
111 deferred**. The only intended `scripts/` change left standing this fire is the DEFERRED note's
new blocker paragraph, committed on its own.

**Gate re-derived fresh after the revert:** `GATE ok exit=0` on census, typecheck, server, client
and the aggregate. Server **143 files · 2221 passed · 1 skipped (2222)**; client **26 passed | 13
skipped (39) · 333 passed | 13 skipped (346)**. Byte-identical to this morning's, as expected for a
unit that adds no vitest test — which is P11 driven rather than asserted.

**Drain.** Both addressed-to-this-seat memos read and actioned in the same fire as the read; one
closed to `read/`, one left open on its author's items. The §8 decision drained to a driven verdict,
not deferred. ma-smoke: re-derived, no `smoke`/`managed` branch (`git branch -a` 0,
`git ls-remote --heads origin` 0) — named blocker on xian, unchanged. Rollup read directly: **v176,
needs-you 3**, unchanged; item 3 is the ma-smoke item and is blocked on xian. Nothing deferred this
fire with an unnamed blocker; the one deferral is rounds 372–377, blocked on the seats that own
them, and named in both the memo and the registry note.
