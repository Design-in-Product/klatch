---
agent: Daedalus (Klatch) — architecture & implementation
date: 2026-11-21
model: claude-opus-5
---

# 2026-11-21 — Daedalus session log

## 09:19 — START fire (substantive)

Clock `date`-read **09:19:16 PST**. Worktree synced to `origin/main` by the wrapper; `git status`
clean at open, branch `claude/daedalus-cycle`, HEAD `9712963c`.

**Briefing.** `docs/COORDINATION.md` (own section, line 988) and `docs/mail/` read.
`docs/briefs/cross-pollination/current.md` present (295 B, 11-21 09:17).

**Mail, identified by `git log` rather than mtime.** One new memo since this seat's last commit:
`theseus-to-daedalus-argus-…-the-word-is-yes-and-your-blocker-is-dissolved-…-2026-11-20.md`,
landed with his `unit-494lineendingreach` chain 11-20 19:5x–20:00. Read in full. It answers the
item this seat specified-and-priced in yesterday's STOP §8 and gives the word: **build the
line-ending guard**, with two conditions (assert on the published STRING; split emitted chunks on
`\n`) and one correction to the justification wording. **The ask was executed in this fire rather
than boarded.**

### Work: `unit-495lineendingguard-2026-11-21` — 7 predictions, 7 HIT

Pre-registration committed and pushed to `main` as **`afe5259a`** before the emitter, the cripple,
the probe or any capture of them existed.

- **Built:** assertion **(c)** in `scripts/verify-decl-body-slicers.mjs` — one emitter (17 report
  sites + 9 RED sites), `util.format` re-dispatch, chunks split on `\n`, check **before**
  publication so the invariant is a construction, key derived from `LABELS`. Refusals bypass the
  emitter (re-entry); reds route through it (a red is the report).
- **The finding:** the construction found **two sites in the gate itself** that render a verdict
  token last — the in-population quoted-only list (stdout) and the stale-baseline RED block
  (stderr). Both sit in lists that are empty in the live tree, so **conjunct (i) was true only
  because two lists have no members** — which both Theseus's §3 and this seat's `unit-493` §4 had
  measured correctly without noticing. Cured by quoting the token; 0 published bytes move today.
- **Unregistered consequence:** unrepaired, the first live member of either list would have turned
  the gate from *reporting a state* into *refusing to run* (`C5a`: `rc=2`, red never published).
- **Cripple 9 of 9** with control (`C0`: same plant, assertion disabled → published, `rc=0`) and a
  depth arm (`drive0`: identity copy byte-identical to the real gate, asserted before any arm is
  believed). Scratch copies untracked, at `scripts/` depth, deleted per arm.
- **P5:** 34 calls · 38 published lines · 4 newline-bearing chunks → **4 of 38 (10.5%)** invisible
  to a per-call guard, reproducing his §2 under `--import` interception with the subject unedited.
  KP PASS, so the 0 in the label-terminal column is not a reader artefact.

### The figure correction — 3888 is 3898, and it started here

Found in the fire's first ten minutes while establishing a baseline capture. `git ls-tree -l
566cdb7d` reports **3898** for both `unit-491partitionbuild` captures **at the publishing commit**,
and `wc -c` reports 3898 for every committed capture of this gate's stdout including Theseus's two.
**3888 was wrong at birth, in this seat's own `unit-491` RESULTS**, and is now carried by three
RESULTS files, two memos (including his memo's subject line), `COORDINATION.md`, and the 11/21 logs
of Argus and Iris.

The verdict those figures support — *byte-identical* — is **true and unaffected** (3898 = 3898 in
every pair). Fixed **forward**: the five documents stay as published. Also observed in passing:
when this unit's own two `.mjs` files entered the tree, `tracked files read` moved **1031 → 1033**
and the byte count stayed **3898**, because the digit width did not change — **flat bytes are not
flat figures**, which is exactly why a byte-identity check could not have caught this.

### Verification (Session Wrap Protocol)

Clock `date`-read **09:27:19** and **09:30:08 PST**.

```
$ node -e "spawnSync('node',['scripts/verify-decl-body-slicers.mjs'])"
rc=0 stdout bytes=3898 stderr bytes=0
lines differing from the post-build capture: 1  ["  tracked files read: 1033"]

$ diff captures/pre-build-stdout.out captures/post-build-stdout.out
(empty)

$ node docs/research/unit-495lineendingguard-2026-11-21/cripple-lineendingguard.mjs
CRIPPLE OK — 9 of 9: assertion (c) fires on every planted violation, is silent on none,
and the two quoting cures are what keep a real state publishable.

$ tail -1 captures/drive-sweep.out
SWEEP PASSED — 45 of 45 swept probes green, 0 red, 0 blocked (0 could not run,
0 ran but did not finish), 0 census problem(s), 110 deferred
```

`packages/` untouched, so **`npm test` is not claimed**. `npm run sweep` is still not a script in
this repo; the invocation is `node scripts/sweep-probes.mjs`.

**Step 1 — commits on `origin/main`** (pasted, not asserted):

```
$ git log origin/main --oneline -5
20961d01 coord+log+results(unit-495lineendingguard): START fire -- assertion (c) built on Theseus's word, …
5d67854a mail(unit-495lineendingguard): the guard is built on Theseus's word, …
7b7307dc cripple+probe(unit-495lineendingguard): 9 of 9 on the refuse branch that has no live observable state, …
a42cd40d cure(unit-495lineendingguard): one emitter, every chunk split on \n, and no published line may END in a bare verdict label …
afe5259a prereg(unit-495lineendingguard): 7 predictions registered before the arm exists, …
```

Five commits, pushed incrementally as each piece landed rather than in one push at the end — a fire
that dies at its timeout strands whatever is uncommitted.

**Step 2 — deliverables confirmed on the remote by `git ls-tree`, not by a local `ls`:**

```
$ git ls-tree -r --name-only origin/main docs/research/unit-495lineendingguard-2026-11-21/
PRE-REGISTRATION.md · RESULTS.md · cripple-lineendingguard.mjs · probe-published-lines.mjs
captures/: drive-cripple.out · drive-sweep.out · pre-build-stdout.out · pre-build-stderr.out
           post-build-stdout.out · post-build-stderr.out
           probe-publishedlines-stdout.out · probe-publishedlines-stderr.out
(12 of 12 present)

$ git ls-tree -r --name-only origin/main scripts/verify-decl-body-slicers.mjs \
      docs/logs/2026-11-21-daedalus-log.md docs/mail/daedalus-to-theseus-argus-…-2026-11-21.md
all three present
```

`git status --short` → clean; `ls scripts/scratch-unit495-cripple.mjs` → **No such file**, so no
cripple arm left its scratch copy behind.

**Mail close-discipline:** the inbound memo and this fire's reply **stay in `docs/mail/`** rather
than moving to `read/`. Its primary ask is discharged, but the thread carries a standing open item
by both seats' agreement — conjunct (ii), publication order, guarded by nothing and cured by
neither of us — and an open thread stays visible.

**Drain:** mail drained (1 inbound, its ask executed in-fire); yesterday's specified-and-priced item
built, crippled and pushed; a figure error of this seat's own making found and corrected forward;
**conjunct (ii) stays open by both seats' agreement, blocker named** (expressing it means
hard-coding row order into an assertion); the **`ABSENT` hole in (c)'s key** reported and uncured
with the reason; nothing else unblocked on this seat's queue.

---

## 13:17 — Session resumed (WORK fire, substantive)

Model: `claude-opus-5`. Clock `date`-read **13:17:07 PST**. Worktree synced to `origin/main` by the
wrapper; `git status` clean at open, branch `claude/daedalus-cycle`, HEAD `0c49b2f0`.

**Briefing.** `docs/COORDINATION.md` own section (line 988) and `docs/mail/` read.
`docs/briefs/cross-pollination/current.md` read — 3 lines, pointing at the private brief URL because
this repo is public; nothing in it that changes this seat's queue.

**Mail, identified by `git log` on `docs/mail/` rather than by mtime.** Exactly one memo has landed
since this seat's last commit: `theseus-to-daedalus-argus-…-your-two-sites-are-the-two-and-the-guard-is-one-trailing-space-from-blind-…-2026-11-21.md`
(commit `d7d010e9`). Read in full. It confirms this morning's §2 two sites under a key that sees
both forms, **hands this seat a named item** (the padded form of conjunct (i), with the blocker
named and no deadline), and **refutes this seat's §5.2 mechanism** for the 3888. The item was
**executed in this fire rather than boarded.**

### Work: `unit-497paddedlabelclosure-2026-11-21` — 6 predictions, 5 HIT, 1 REFUTED

Pre-registration committed and pushed to `main` as **`aaf24741`** before the arm, the cripple, the
post-hoc or any capture of them existed.

- **Landed:** assertion (c)'s key widened `line.endsWith(v)` → `line.trimEnd().endsWith(v)` in
  `scripts/verify-decl-body-slicers.mjs`, plus docblock property 4 recording the measurement.
- **P4, the arm his memo did not need:** the whitespace set was **derived** (25 code points in
  U+0000..U+FFFF that `/\s/` accepts) rather than typed from the spec, and the key compared against
  the hazard's own `/LABEL\s*$/` on every member — **0 disagreements**, 6-char non-whitespace
  control set both-false 6 of 6. The cure is the closure, not an approximation of it.
- **P2/P3:** the real `publish()` sliced with the shared slicer, span pinned at offset 37472 and
  asserted byte-identical; PRE 4 of 4 padded spellings **publish**, POST 4 of 4 **refuse**, controls
  unchanged — **6 of 6**.
- **Cripple 9 of 9** on the whole landed gate, identity `drive0` byte-identical, two publishing
  controls.
- **P1:** 40 published lines, 0 ending in whitespace, 0 label-terminal either way, KP 1 · 1 · 0.
- **P5 REFUTED** and the post-hoc (**expectation committed in `b87ba222` before it was driven**)
  shows why: wide and narrow keys produce byte-identical stdout, so the widening's cost is **0
  bytes**; the 4065 → 4231 move was this unit's own files, three of its four changes caused by
  **both docblocks writing `brace-slicer-deliberate:` in order to say they needed no exemption.**
  Rephrased forward: 21/24 → 19/22, one residual (the instrument that must quote the key).
- **P6:** delta 10, five em-dashes — his §4 holds, this seat's §5.2 mechanism is dead.
- **Against this seat:** the arm's first draft keyed on the hazard's spelling and threw `the PRE key
  occurs 0× in the sliced body` once the cure landed — his own §3 shape, one fire later, in a seat
  that had read that memo forty minutes earlier. Arm made direction-agnostic.

### Verification (Session Wrap Protocol)

Clock `date`-read **13:28:35 PST** at the sweep, and the figures below are pasted, not asserted.

```
$ node docs/research/unit-497paddedlabelclosure-2026-11-21/arm-padded-closure.mjs
ARM OK — rc=0 · 25 whitespace chars derived · 0 disagreements · reach 0 of 40 with KP 1·1·0

$ node docs/research/unit-497paddedlabelclosure-2026-11-21/cripple-padded-closure.mjs
CRIPPLE OK — 9 of 9, identity drive0 stdout byte-identical to the real gate = true

$ node docs/research/unit-497paddedlabelclosure-2026-11-21/posthoc-whose-bytes.mjs
POST-HOC OK — wide 4326 B, narrow 4326 B, byte-identical true, widening cost 0 bytes

$ node scripts/verify-decl-body-slicers.mjs
rc=0  stdout 4160 B  stderr 0 B

$ tail -1 captures/drive-sweep.out
SWEEP PASSED — 45 of 45 swept probes green, 0 red, 0 blocked (0 could not run,
0 ran but did not finish), 0 census problem(s), 110 deferred
```

The sweep matters here specifically because the `round303` pin caught this seat's own new file on
11-17 (Calliope's memo, *"the standing 45 of 45 sweep is now 44 of 45"*). Three new `.mjs` files
entered the tree this fire and the pin stayed green; it is **45 of 45**, driven after the cure and
after the docblock rephrasing, not inherited from this morning.

`packages/` untouched, so **`npm test` is not claimed**. `npm run sweep` is still not a script in
this repo; the invocation is `node scripts/sweep-probes.mjs`.

**The pre-commit hook is itself a verification of the post-hoc.** The gate ran on the coord+log
commit and printed `19 tracked file(s), carrying 22 marker occurrence(s)` with
`unit-497paddedlabelclosure-2026-11-21/posthoc-whose-bytes.mjs  (2 markers)` named in the list —
the exact figures the post-hoc predicted for the state after the docblock rephrasing, measured by
the gate rather than by this unit's own instrument.

**Step 1 — commits on `origin/main`** (pasted, not asserted):

```
$ git log origin/main --oneline -4
481991a3 coord+log(unit-497paddedlabelclosure): WORK fire -- the padded form is cured with an EXACT closure, …
8e82db70 mail+results(unit-497paddedlabelclosure): your S2 item is landed and the closure is EXACT …
b87ba222 cure+arm+cripple+posthoc(unit-497paddedlabelclosure): the padded form is cured, 9 of 9 …
aaf24741 prereg(unit-497paddedlabelclosure): 6 predictions registered before the arm exists …
```

Four commits, pushed incrementally as each piece landed. `b87ba222` is the one that matters for
provenance: it carries the post-hoc's **expectation** and was pushed **before** the post-hoc was
driven.

**Step 2 — deliverables confirmed on the remote by `git ls-tree`, after `git fetch`, not by a local
`ls`:**

```
$ git ls-tree -r --name-only origin/main docs/research/unit-497paddedlabelclosure-2026-11-21/
PRE-REGISTRATION.md · RESULTS.md · arm-padded-closure.mjs · cripple-padded-closure.mjs
posthoc-whose-bytes.mjs
captures/: drive-arm.out/.err · drive-cripple.out/.err · drive-posthoc.out/.err · drive-sweep.out
           pre-build-stdout.out · pre-build-stderr.out · post-build-stdout.out · post-build-stderr.out
(16 of 16 present)

$ git ls-tree -r --name-only origin/main scripts/verify-decl-body-slicers.mjs \
      docs/logs/2026-11-21-daedalus-log.md docs/COORDINATION.md docs/mail/daedalus-to-theseus-…-2026-11-21.md
all four present

$ git show origin/main:scripts/verify-decl-body-slicers.mjs | grep -c 'trimEnd().endsWith'
3        ← the cure is on the remote. One of the three lines is the KEY inside `publish()` (the arm
           asserts exactly one in the sliced body); the others are docblock prose describing it.
```

`git status --short` → clean; `ls scripts/scratch-unit497*` → **no matches found**, so none of the
arm, cripple or post-hoc arms left a scratch copy behind.

**Mail close-discipline:** the inbound memo and this fire's reply **stay in `docs/mail/`**. The
item the memo handed over is discharged, but the thread still carries conjunct (ii) by both seats'
agreement and the 45-file `chars`-as-`bytes` default, so the thread is open and stays visible.

**Drain:** mail drained (1 inbound, read in full, its named item **executed in-fire** rather than
boarded); the cure landed, crippled 9 of 9 and swept 45 of 45; the landing condition's refutation
chased to its real cause with a committed-before-driven post-hoc and then **fixed forward** in this
same fire; this seat's own §5.2 mechanism retracted on his evidence and re-derived under its own
drive; one general lesson about our own instruments written down (a harness that substitutes the
hazard's spelling is single-use and expires the moment its unit succeeds). **Deferred, each with a
named blocker, none deadlined:** conjunct (ii) — publication order — blocker is that expressing it
hard-codes row order into an assertion, and it is open by both seats' agreement; the `ABSENT` hole
in (c)'s key — blocker is that no key derived from `LABELS` can see a token that is not in `LABELS`,
so curing it means widening the vocabulary, which is the two-seat format decision; the four
`BLOCKED` exits — outside the emitter by design, one ending in an arbitrary `${e.message}` from
`git`; the 45-file `chars`-labelled-`bytes` default — blocker is that it is 45 relabellings **plus a
per-site decision about which quantity was wanted**, which is 45 judgement calls rather than a
mechanical rename, and a shared helper nobody calls yet would be drift rather than a cure. Nothing
else unblocked on this seat's queue; fire closed bounded.

---

## 17:17 — Session resumed (STOP fire, substantive)

**Model:** claude-opus-5. Clock `date`-read at 17:17:17, 17:19:21, 17:24:12, 17:27:05, 17:29:19 PST
— not estimated from effort.

**Session-start protocol, done first.** Pulled (worktree synced by the wrapper to `a3dfb7e0`);
`docs/COORDINATION.md` read at this seat's own section; `docs/mail/` listed by mtime. **One new
inbound memo, read in full in the same turn it was noticed:**
`theseus-to-daedalus-argus-...-the-cure-is-the-closure-and-your-25-member-set-grades-on-24-because-publish-splits-on-one-of-its-own-members-2026-11-21.md`.
Cross-pollination brief read (it points at the private DinP URL; this repo is public and the brief
body is deliberately not copied here). Four cross-repo mailboxes checked — `dispatch/mail`,
`designinproduct/docs/mail`, `mediajunkie/docs/mail`, `piper-morgan-product/mailboxes` — **nothing
addressed to this seat in any of them.**

### What the memo asked, and the redirection that is the substance of this fire

Theseus closed this seat's §3 question with **yes** and handed back two items marked "yours to take
or decline" plus one report. Both items taken, **neither at the surface he offered it**:

- **His §3** — unit-497's closure leg has no positive control; its control set guards *both
  predicates always TRUE*, so the *both always FALSE* failure **satisfies** it. He offered to fix
  that leg. The leg is **published and frozen** and the 11-20 *don't edit them* decision stands, so
  it was not touched, by reader or by byte. But **the same claim is written into the LIVE docblock**
  of `scripts/verify-decl-body-slicers.mjs` property 4 ("disagree **0** times") — a live file, where
  a reader actually meets the claim. That copy is the one cured. His finding did not need his target
  to be editable to be worth acting on.
- **His §4** — two stale denominators (`34` calls / `38` published lines, written at `a42cd40d`;
  he measures 37/41). Taken, but **pinned rather than refreshed** — see below.
- **His §2** — the U+000A vacuous cell. Nothing to cure, agreed; recorded in the live docblock as the
  general shape so a later set-complete drive does not read that cell as evidence.

### `unit-499livekeypositivecontrol-2026-11-21` — 6 predictions registered, 6 HIT

Pre-reg `023d0f58` pushed to `main` at **17:19:21 PST**, before the arm, the cripple, the recorder or
the patch existed. Five commits, pushed incrementally as each piece landed.

**P1 HIT — the positive control reads TRUE at the live key.** Key expression **cut** from the live
`publish()` by the shared slicer (`scripts/lib/decl-body.mjs` → `bodyOf`), not re-typed. Theseus's
slice figures reproduce exactly under this seat's own independent re-slice: **offset 37472, 833
bytes, 1 occurrence**. Member set **derived** by scanning U+0000..U+10FFFF with a `u`-flagged `/\s/`
— **25 members, 0 astral**. Drive widened from his one label to all three: **75 cells (3 labels x 25
members), disagreements 0, bothTrue 75 of 75.**

**P2 HIT — the control separates.** Reader-only cripple, in memory, tracked file never written,
unit-497 untouched: `CONTROL disagreements 0 / bothTrue 75 of 75` vs `CRIPPLE disagreements 0 /
bothTrue 50 of 75`. **The published figure is byte-identical; only `bothTrue` moves.** His §3 hole is
confirmed at the live surface, and `bothTrue === cells` is now written into the docblock beside the
`0` it separates, with his name on it.

**P3 HIT — the denominators reproduce under an independent seam.** He recorded `console.log`; this
unit recorded **`process.stdout.write`** (one write per call, the next seam down). All four figures
agree across two independently-written recorders at two seams: **37 calls · 41 published lines · 4
not-first-of-chunk · rows 3.**

**P4 HIT — recorder honesty, as its own term.** Reconstruction byte-identical to the plain capture at
**4160 bytes** (his figure, reproduced). Recorded with its own verdict and own counter, deliberately
**not fused** into P3's numbers; the post-hoc refuses to print any P3 figure at all if P4 reads
false, rather than printing numbers it cannot attribute.

**P5 HIT — landing condition.** `cmp` over the gate's stdout captured immediately before and
immediately after the docblock patch: **byte-identical, rc=0**. A docblock that moved the report it
describes would not have gone in.

**P6 HIT on the count — and the finding is what it licensed.** Measured three times (before this
unit's `.mjs` files were committed, after, and after the patch): **41 every time.** This unit's files
moved `tracked files read` **1042 → 1044 → 1046** and landed in no published list (dead-marker list
unmoved at **19 files / 22 occurrences**, quoted-only at **2**). So the number *was* writable — and
it still was not written flat, because **21 of the 41 published lines are file paths of files written
about this gate**, making the denominator a function of the tree rather than of the file. What went
in instead: the two **stable** figures (4 not-first-of-chunk, rows 3) stated as the property; the
denominators **pinned** to the unit and date measured, naming both seams; the reason they drift (0 of
21 static emit sites moved between `a42cd40d` and today — the entire `+3` came from the self-naming
loops); and an instruction to **re-measure rather than treat a mismatch as a defect**. A figure that
has gone stale twice does not want refreshing; it wants a pin and a reason.

### Against this seat — both defects found are in this unit's own instrument

1. **The arm's first draft typed the docblock's `LABEL` metavariable as a five-character literal.**
   All 25 cells disagreed (**25 disagreements, bothTrue 0, bothFalse 0**) — the *same defect class as
   the subject*: a reader keyed on a token that is not in the vocabulary it reads. Named by the
   **separate** P4 sanity term `unpadded label is TRUE on both` reading `false`. Had that term been
   fused into the disagreement counter — exactly as unit-497's leg fuses, which is what Theseus came
   to say — the leg would have reported `25 disagreements` with no way to tell subject from
   instrument. **The lesson this unit exists to apply caught this unit on its first drive.**
2. **The cripple's first substitution key was the bare token and refused at 2 occurrences.**
   `GUARDED` is a substring of `UNGUARDED`, so a bare-token substitution would have crippled **two**
   vocabulary entries while claiming one. Re-keyed on the quoted literal `'GUARDED'`, asserted at
   exactly 1. It is the superstring hazard property 3 of this very docblock names (`MISGUARDED`), met
   from the writer's side.
3. **Three sources, not two.** The first cripple draft fused the probe tokens with a reader. Two
   sources **cannot express this failure**: crippling a reader also rewrites the lines being read, so
   the drive changes subject instead of going blind and scores green for the wrong reason. Probe
   tokens asserted unmoved.
4. **A declared limit stated rather than patched.** `posthoc-denominators.mjs` carries
   `docblock = { calls: 34, publishedLines: 38 }` as a literal, true when driven and **stale relative
   to the patched file** from the moment the patch landed. Left as driven rather than re-stamped —
   re-stamping an instrument after its drive is how a reading stops being a reading. Recorded in
   RESULTS §7.3; its `docblock` column reads as *"the docblock as it stood at `a42cd40d`."*

### Standing checks, re-driven fresh this fire

**Gate** (`npx tsx scripts/gate.mts`): census OK, typecheck clean; **server 147 files / 2295 passed,
1 skipped (2296)**; **client 29 passed | 13 skipped (42) files, 354 passed | 13 skipped (367)**;
`GATE ok exit=0` on all five legs — **matches standing exactly.**

### Session Wrap Protocol

**Step 1 — commits on `origin/main`** (pasted, not asserted):

```
$ git log origin/main --oneline -5
e5335694 mail(unit-499livekeypositivecontrol): both of Theseus's items taken, neither at the surface he offered …
05d1d803 cure+results(unit-499livekeypositivecontrol): 6 of 6 HIT -- the live docblock's bare 0 now carries the separating term …
d480ab46 recorder+posthoc(unit-499livekeypositivecontrol): P3, P4, P6 HIT -- the stdout.write seam reproduces all four figures …
a0df47a5 arm+cripple(unit-499livekeypositivecontrol): P1 and P2 HIT -- Theseus's separating term reproduces at the LIVE key …
023d0f58 prereg(unit-499livekeypositivecontrol): 6 predictions registered before the arm, the cripple, the recorder or the patch exists …
```

**Step 2 — deliverables confirmed on the remote by `git ls-tree`, after `git fetch`, not by a local
`ls`:**

```
$ git ls-tree -r --name-only origin/main docs/research/unit-499livekeypositivecontrol-2026-11-21/
PRE-REGISTRATION.md · RESULTS.md · arm-live-key-control.mjs · cripple-both-readers-dead.mjs
posthoc-denominators.mjs · recorder-preload.mjs
captures/: drive-arm.out/.err · drive-cripple.out/.err · drive-posthoc-pre.out/.err
           drive-posthoc-committed.out/.err · drive-posthoc-post-patch.out/.err
           gate-pre-patch.out/.err · gate-post-patch.out/.err
(20 of 20 present)
```

The cure and the memo are verified present on the remote separately, below.

**Mail close-discipline:** the inbound memo and this fire's reply **stay in `docs/mail/`**. Both
items the memo handed over are discharged, but the thread still carries conjunct (ii), the `ABSENT`
hole and the 45-file `chars`-as-`bytes` default by both seats' agreement — the thread is open and
stays visible.

**Question-box check:** nothing filed this fire.
