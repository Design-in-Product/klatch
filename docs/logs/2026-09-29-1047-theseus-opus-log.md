# Theseus — 2026-09-29 (START fire, 10:47 PT)

Seat: manual testing & exploration. Worktree `/Users/xian/Development/klatch-worktrees/theseus`,
branch `claude/theseus-cycle`, synced to `origin/main` by the wrapper immediately before this fire.

---

## 10:47 — Briefing

`git status` clean. HEAD `8b7872ab` (Daedalus's R291 log commit).

**Mail swept.** Nothing newly addressed to this seat as primary. Standing state:

- `iris-to-theseus-…-reassign-picker-still-unverified-live-…-2026-09-28.md` and
  `iris-to-theseus-…-reassign-picker-reclassified-structural-not-low-priority-2026-09-28.md`
  — both **answered** last fire by
  `theseus-to-iris-…-the-reassign-picker-holds-live-and-it-offers-one-candidate-that-can-only-be-refused-2026-09-28.md`
  (already in `docs/mail/read/`). The two inbound memos were left in `docs/mail/` — close-discipline
  says the closer moves both sides. Moving them this fire.
- `iris-to-theseus-…-round292-ruling-disable-with-reason-built-2026-09-29.md` (in `read/`) — Iris
  **ruled and shipped** my R292 §2 finding: disable-with-reason, not hide. Commit `3c66489d`.
  Verified as an ancestor of HEAD this fire (`git merge-base --is-ancestor` → yes) and the code is
  live in `packages/client/src/components/ImportDialog.tsx:1441-1524`.
- `daedalus-to-argus-cc-theseus-…-r291-crash-is-fixed-…-2026-09-29.md` — cc, informational, no ask
  of this seat.

**Iris's closing line is the work unit:** *"If you or Argus want a live re-drive of G4 specifically,
the harness from Round 292 is right there."* She pinned the fix at unit level and said plainly she
did not re-drive it live. That is this seat's job, and I own the harness.

`probe-round292-…mts` is **DEFERRED** (`scripts/sweep-probes.mjs:636`) — verified this fire, not
recalled. Nothing runs it on a schedule, so nothing would have told anyone if the fix moved it.

## 10:50 — Round 293 opened: re-drive G4 live

Plan, in order:

1. Run `probe-round292` **unchanged** against the fix first. Prediction worth writing down before
   the run: the fix should make G2/G3 **unreachable** — those arms drive the refusal by clicking the
   bystander, and the bystander is now `disabled`. If so, two arms go red because the code got
   *better*, which is precisely the Round 286 time-bomb shape, and it is mine to repair.
2. Build Round 293 to drive the fix itself: bystander renders `disabled`, carries the
   `already on channel` reason, and a click on it reaches no endpoint.
3. Measure — not assert — the `boundIds === null` window: the fix fetches on open, so a click landing
   before that resolves still sees an enabled row.

## 10:52 — Step 1: Round 292 re-run against the fix. Prediction was right, outcome was worse.

Ran `probe-round292` unchanged. It did not report two red arms. It **threw**:

```
[G1] pass  the picker excludes the entity the channel is currently bound to
[X1] FAIL  the probe ran to completion without throwing
      locator.click: Timeout 30000ms exceeded.
        - locator resolved to <button disabled title="Already on this channel" …>
        - element is not enabled (44 retries over 30s)

1 of 18 regression check(s) FAILED.
```

**18 arms, not 24.** Playwright's `.click()` auto-waits for `enabled`; the fix disables that row; the
click never resolves and the exception aborts the try-block. H1–H6 — the happy path, the database
binding, Round 212's per-message stamp guarantee — never ran, and none of them had anything to do
with the change.

Writing the general form down because it is not specific to this probe: the fleet already names the
shape where **an arm reddens because the code got fixed** (Round 286's time-bomb). This is a worse
sibling. **A probe that *throws* at the fix discards every arm downstream of the change.** A red arm
is legible — read it, see the fix, retire the arm. A throw reads as a broken probe and buries six
green checks with it. The trap is set anywhere a probe reaches its state by clicking something a
future fix might reasonably disable.

Incidental, and useful: the failure log itself is live evidence of the fix —
`locator resolved to <button disabled title="Already on this channel">`.

## 11:05 — Step 2: Round 293 built and driven. 30/30, exit 0.

`scripts/probe-round293-the-g4-fix-driven-live-and-the-window-before-its-fetch-returns.mts`.
Own port pair **3193/5193** — not 3199/5199, so both probes can be driven in one fire without a
port race producing a false red. Real Chromium → real Vite → real Hono → real SQLite.

**G1–G7, all green.** Candidate still listed (Iris ruled disable, not hide), `disabled`, row text
`Zzborealis-r293 @borealis already on channel`, `title="Already on this channel"`. G5: the *free*
same-name candidate is **not** disabled — the arm that catches an over-broad fix.

Two deliberate choices in G6, both worth the record:

- `click({ force: true })`, **not** `dispatchEvent('click')`. Dispatching synthesises an event a
  disabled control never receives from a human, so it would have tested something nobody can do. A
  forced mouse click at the row's coordinates is what a user actually does.
- Asserted against the page's own **PATCH request log**, not against the screen. *"Nothing visibly
  happened"* and *"no request was made"* are different statements and only the second is the claim.
  Result: **0 attempts.**

**M1/M2 — the finding, recorded as measurements.** `boundIds` initialises to `null` and
`alreadyBound` is `boundIds?.has(id) ?? false`, so until the fetch-on-open resolves every candidate
renders enabled. M1 observes it live (`ENABLED: true`); M2 lands a click inside the window and
records **1 PATCH attempt**, refused.

Honesty constraint I held myself to here: **the 2.5s delay is injected, the window is not.** Round
292 made a point of its refusal being reachable with no stub at all, and this is not of that kind.
Said so in the probe header, the commit, the memo and the coordination entry rather than letting the
two findings sit side by side looking equivalent. M5 (green) records that the window closes on its
own once the GET lands — a transient, not a stuck state.

Measurements, not checks, for the same reason the original G4 was: an arm asserting "enabled before
the fetch lands" goes red the day someone closes it.

**M3/M4 re-establish Round 292's G2.** The fix made `target-already-bound` unreachable through the
picker, so the verbatim-refusal-sentence check lost its only live route the moment the fix landed.
Inside the window it is reachable again. M3 green: `Target entity is already assigned to this
channel`, verbatim, picker still open after.

**H1–H5** re-drove the happy path against the fixed component — necessary, not redundant, because
Round 292's throw meant it had never been observed against the fix. `atlas-1: 0 · atlas-2: 3`.

## 11:15 — Step 3: Round 292 repaired

Section G now asks `isDisabled()` before clicking. If disabled: G2/G3/G4 recorded as
**`inapplicable`**, not skipped — by `probe-outcome.mts`'s own test, no operator can change anything
about this machine to make them run; the path is closed by design. New **G4b** measurement makes the
probe *observe* the fix on the tree rather than infer it from a commit hash.

Re-driven: **22/22 regression checks passed, 3 inapplicable, exit 0**, happy path restored.

Side note, not chased: `probe-outcome.mts:118` still says of `inapplicable` *"No caller uses this
yet (2026-09-17)."* There are now two (Daedalus's R291 yesterday, this today). One-line doc staleness,
flagged in the memo, left alone.

## 11:25 — Verification and wrap

```
$ node scripts/sweep-probes.mjs --census
sweep-probes — 123 probe files under scripts/
  swept:    18
  deferred: 105
CENSUS OK — every probe under scripts/ is in exactly one list, and every entry agrees with its own pin.
census PASSED

$ npm run typecheck
> @klatch/shared  tsc            (clean)
> @klatch/server  tsc --noEmit   (clean)
> @klatch/client  tsc --noEmit   (clean)
> typecheck:scripts tsc -p scripts/tsconfig.json  (clean)
```

Both probes classified **DEFERRED before the gate was run**, per Round 284 §4.

**Mail.** Memo filed to Iris:
`theseus-to-iris-…-your-g4-fix-is-driven-live-and-it-holds-and-it-narrows-the-dead-end-click-rather-than-removing-it-2026-09-29.md`.
Left in `docs/mail/` — it asks her to rule on M1/M2, so the thread is open.
Closed the two 2026-09-28 Iris inbounds into `docs/mail/read/`; both were answered last fire and only
the reply side had been moved.

**One thing worth surfacing past this round.** Both probes are DEFERRED and nothing runs them on a
schedule, so **nothing would have told anyone Round 292 had started throwing.** I found it only
because I went looking at Iris's invitation. That is not a property of these two files — it is a
concrete instance of the cost of the unscheduled-sweep gap Daedalus carries as an open item.

### Session Wrap Protocol

**Step 1 — commits on `origin/main`:**

```
$ git log origin/main --oneline -3
ac712a25 mail(theseus->iris cc xian,janus,calliope,daedalus,argus): your G4 fix is driven live and holds — and it narrows the dead-end click rather than removing it
c7a6564a probe(round293): Iris's G4 fix driven live — it holds, and it narrows the dead-end click to the window before its own fetch returns
8b7872ab log: 2026-09-29 START fire — Argus's R291 ENOENT fixed (absence is `inapplicable`), and the fleet-wide scan for the same shape found exactly one instance
```

(Push: `8b7872ab..ac712a25  HEAD -> main`.)

**Step 2 — deliverable files present** (`ls` run this fire, all seven returned):

```
scripts/probe-round293-the-g4-fix-driven-live-and-the-window-before-its-fetch-returns.mts
scripts/probe-round292-the-reassign-picker-driven-live-in-a-real-browser.mts
scripts/sweep-probes.mjs
docs/mail/theseus-to-iris-…-your-g4-fix-is-driven-live-and-it-holds-…-2026-09-29.md
docs/mail/read/iris-to-theseus-…-reassign-picker-still-unverified-live-naming-it-plainly-2026-09-28.md
docs/mail/read/iris-to-theseus-…-reassign-picker-reclassified-structural-not-low-priority-2026-09-28.md
docs/logs/2026-09-29-1047-theseus-opus-log.md
```

Nothing missing.

**Step 3 —** this log is committed last.

**Carried into the next fire, unchanged:**
- The bulk/Browse row disclosure site still has not been driven live. Same component, but not
  claimed by similarity.
- `target-not-found` staleness: the picker's entity list is fetched once on open, so an entity
  deleted in another tab afterwards is still offered. Iris's `boundIds` has the same shape, and
  §2's window is a third member of the family.


---

# WORK fire — 14:47–15:15 PT (same day, second Theseus fire)

## 14:47 — Briefing

Pulled state, read `docs/COORDINATION.md`, `ls docs/mail/`. Two memos landed at 14:47 that name
this seat:

- `daedalus-to-theseus-argus-…-your-unscheduled-sweep-gap-has-a-live-instance-and-it-was-mine-2026-09-29.md`
  (Round 294) — already answered on my side last fire (`e89b6964`); Argus independently
  re-confirmed it this fire and answered the §3 pin-ergonomics question.
- `argus-to-daedalus-cc-theseus-…-round294-confirmed-and-your-pin-question-a-count-not-a-regex-change-2026-09-29.md`
  — cc only, asks nothing of this seat.

Argus's memo says he is moving both to `docs/mail/read/`. Verified they are **not** there yet
(`ls docs/mail/read/ | grep -c round294\|unscheduled-sweep` → 0; same grep in `docs/mail/` → 2), so
his move commit has not landed. **Left both in place deliberately** rather than moving them myself
— a rename race against his unpushed commit is worse than a late move, and he is the declared
closer. Not an open action for me.

The one item both memos leave open and attribute to this seat is my own Round 293 §4: the deferred
set is undriven, 29 of it verdict-bearing. Took that.

## 14:48 — The 29, verified independently before building on it

```
$ node scripts/sweep-probes.mjs --census
  swept: 18 · deferred: 105
        verdict-bearing: 29 · no conclusion line: 76
CENSUS OK
```

Re-derived the same 29 myself from `DEFERRED` + `verdictBearing()` rather than trusting the
printed figure. Matches.

## 14:49 — A hand-rolled triage, caught before it shipped

Wrote a quick regex triage of the 29 by required resource (BIND/HTTP/DB/MODEL/PROC/BROWSER). It put
**0 of 29** in the "no side effect" bucket. The safe bucket being the *smaller* number is the
direction my own standing rule says a detector fails in, so I did not trust it.

Checked the three `PROC`-only files by hand instead. `round246`/`round284` are git-read-only;
`round247` writes a mutant into `packages/` and restores it — different risk class, **not driven
this fire**, named here so it is not mistaken for examined.

## 14:49–14:50 — First drives these two have ever had

Both run from a clean tree (`git status --porcelain` empty), full output to files, nothing piped.

```
probe-round284 …census-has-a-reader…    →  All 16 regression checks passed   exit 0
  (arm C mutates scripts/ and restores it; git status -- scripts packages clean after)
probe-round246 …emit-spelling…          →  All 4 regression checks passed    exit 0
```

Two for two green — but that is the *safest two*, which is the most favourable sample available.
Recorded as such, not extrapolated.

## 14:50 — Checked `scripts/lib` before hand-rolling the triage properly

`probe-round284`'s own output says "3 **hermetic** verdict-bearing residue probes", so a
hermeticity detector already existed. It does: **`scripts/promote-probes.mts`** (Daedalus,
Round 285) — the promotion path, 8 predicates, and it *drives* DEFERRED probes in a sandbox. I was
one step from re-inventing a worse version of a tool that was already in the tree. Same rule that
bit me on the port-bind check last week.

## 14:50 — The finding

```
$ npx tsx scripts/promote-probes.mts --list
  hazard-clean DEFERRED candidates: 4
  not driven (db): 79  (net): 53  (homedir): 28  (model): 11  (suite): 10
```

Intersecting `hazards()` (promote-probes') with `verdictBearing()` (sweep's) — neither
re-implemented:

**Of the 29 verdict-bearing DEFERRED probes, the promotion path can reach 1.** That one is
`probe-round291`, which Argus drove by hand this morning anyway.

The reason it stayed invisible: `--list` reports the candidates it *found*, not the verdict-bearing
set it *missed*.

**Mechanism.** `hazards()` reads string literals — deliberately, per Round 285's argument that
blanking strings loses real detections. So a probe whose subject matter is source-scanning carries
the hazardous spellings as its own known-positive fixtures and is refused on account of them:

```
probe-round246:298   "import { getDb } from '…/db/index.js';"   → flagged `db`
probe-round246:414   "fs.readdirSync('.claude/projects');"       → flagged `homedir`
```

round246 opens no database and reads no home directory. `round284`'s `net` flag is a true positive
in kind and not in risk — `net.connect` to 3001, a read-only liveness check, not a bind.

Not an argument against the over-broad filter, which `promote-probes.mts:24` declares and which is
the right direction. The finding is that the over-breadth is nearly the whole population, and that
it had never been priced.

## 14:54 — Round 295, driven

`scripts/probe-round295-the-promotion-path-reaches-one-of-the-twenty-nine-and-the-refusals-are-its-own-fixtures.mts`

```
[MEAS] A1  verdict-bearing DEFERRED probes: 29
[MEAS] A2  of those, hazard-clean: 1 — probe-round291-…
[MEAS] A3  hazard reasons across the verdict-bearing set: db=20 net=18 homedir=12 model=9 suite=6
[ok] B1/B2/B3  known negative + two known positives for `hazards`, the literal round246:298 and :414 shapes
[ok] C1  probe-round246 exit 0, "All 4 regression checks passed."
[ok] C2  probe-round284 exit 0, "All 16 regression checks passed."
[ok] C3  scripts/ and packages/ identical across both drives
[ok] D1  REFUSED-BUT-DRIVABLE two-sided agreement (Round 294 §2 shape)
[ok] D2  the declared line is present — cannot be cleared by deleting what it reads

All 9 regression checks passed.
```

**Polarity chosen deliberately.** The obvious arm — "the promotion path reaches too few" — is a pin
on a number that should change, and would go red as good news. That is the defect Daedalus repaired
in `probe-round224` arm E this morning. So every population figure is a `[MEAS]`; the only
load-bearing arm is D1's two-sided agreement.

## 15:07 — Classification and gate

Added the DEFERRED entry **before** running the gate (Round 284 §4 / Argus's census wiring), with
the reason written out: `suite`-shaped by transitivity — it spawns two other DEFERRED probes.

```
$ npx tsc -p scripts/tsconfig.json --noEmit        (clean)
$ node scripts/sweep-probes.mjs --census
  swept: 18 · deferred: 106 · verdict-bearing: 30 · no conclusion line: 76
CENSUS OK — every probe under scripts/ is in exactly one list, and every entry is well-formed.
census PASSED
```

The verdict-bearing figure moving 29 → 30 is round295 counting itself, which is why A1 is a
measurement and not a pin.

## 15:12 — Mail

`docs/mail/theseus-to-daedalus-cc-argus-xian-janus-calliope-iris-your-promotion-path-reaches-one-of-the-twenty-nine-and-two-refusals-are-a-probes-own-fixtures-2026-09-29.md`

Left in `docs/mail/` — §4 asks Daedalus to rule on two candidate narrowings of his hazard detector
(`net` splitting read from bind; string-literal-only `db`/`homedir` hits). Thread is open until he
answers, and either answer — including "leave both alone" — closes it.

### Session Wrap Protocol

**Step 1 — commits on `origin/main`:**

```
$ git log origin/main --oneline -3
f182119c mail(theseus->daedalus cc argus,xian,janus,calliope,iris): your promotion path reaches 1 of the 29, and two of its refusals are a probe's own test fixtures
9a768407 Round 295: the promotion path reaches 1 of the 29, and two of its refusals are a probe's own fixtures
e89b6964 mail+coord+log: Round 294 re-confirmed post-rebase (17/18 green); pin-ergonomics judgment call answered
```

Both pushes confirmed by the remote (`e89b6964..9a768407`, `9a768407..f182119c`).

**Step 2 — deliverable files present:** see the `ls` block appended below, run after this entry.

**Step 3 —** this log and the COORDINATION update commit last.

**Carried into the next fire, unchanged:**

- **27 of the 29 are still unexamined.** This fire drove 2. That is the most favourable sample
  available and it establishes only that the refused set is not uniformly hazardous.
- `probe-round247` — the `suite`-flagged mutant probe — deliberately not driven. It writes into
  `packages/` and restores; it wants a fire that can watch it, not one with 20 minutes left.
- The bulk/Browse row disclosure site still has not been driven live (carried from Round 293).
- `target-not-found` staleness in the reassign picker (carried from Round 293).

**Step 2 verification — `ls` run this fire, all five returned:**

```
docs/logs/2026-09-29-1047-theseus-opus-log.md
docs/mail/theseus-to-daedalus-…-your-promotion-path-reaches-one-of-the-twenty-nine-…-2026-09-29.md
scripts/probe-round295-the-promotion-path-reaches-one-of-the-twenty-nine-and-the-refusals-are-its-own-fixtures.mts
scripts/promote-probes.mts     (read, not modified — Daedalus's; his detector is his to change)
scripts/sweep-probes.mjs       (DEFERRED entry added)
```

Nothing missing.

---

## 20:12 PT — STOP fire, Round 297: the predicted red fired, an unpredicted one fired beside it, and the refusal was never a barrier

**Briefing.** Pulled state was current (wrapper synced). `docs/COORDINATION.md` read. `docs/mail/`
had one memo new since my 14:55 fire and addressed to me: Daedalus's Round 296,
`daedalus-to-theseus-argus-…-your-net-split-is-priced-at-zero-…-2026-09-29.md` (19:47). The two later
commits on `main` (`67f2a0f2`, `6ea7f353`) were Argus's and Iris's fires, not mine. Read the memo
immediately per the mail rule; it carried two items for this seat (§6 an edit on ownership, §8 an
attestation question) and both are actioned in this fire.

**Verified before acting, not assumed.** His §4 correction of my Round 295 memo is right: I called
`probe-round246` "your sweep-repair probe" and it is mine — `883f3094`, Theseus. Checked the marker
he placed in my file quotes my §2 sentence accurately (it does, `docs/mail/theseus-to-daedalus-…-2026-09-29.md:68`),
and that round246 is genuinely in `SWEPT` now (`scripts/sweep-probes.mjs:441`).

### What the drive found that the prediction did not

Ran round295 rather than taking §6's prediction. **Two arms red:**

```
FAIL C1  probe-round246 is present in DEFERRED and drivable
FAIL D1  REFUSED-BUT-DRIVABLE … declared [probe-round246, probe-round284] · measured [probe-round284]
```

D1 was the designed expiry. **C1 was a defect in my own file.** `fileFor` searched `DEFERRED` only,
so a promotion returned `undefined` and the arm reported it with the text and the red of a deleted
file — and a red C1 *skipped the drive*, so clearing D1 alone would have shipped a probe claiming two
drives and making one. Repaired in `101adfbb`; round295 back to **9/9, exit 0**.

Line worth keeping: *an arm that reads one classification bucket cannot tell "left the bucket" from
"never existed", and the good news and the bad news arrive at it in the same shape.*

### The §8 attestation question — refused, and measuring why found the real finding

Measured before writing the marker: `hazards(probe-round295)` is `[db, homedir]`, `literalOnly` true
for both, so the attestation **would** be honoured. Both hits genuinely are scanned-corpus false
positives. **But they are not why the file is deferred** — arm C2 spawns `probe-round284`, which is
`[net, suite]`, and `hazards()` does not read spawn targets. Declined to sign.

Then the live instance, found by asking whether the class was hypothetical:

```
probe-round256:440   execFileSync('npx', ['tsx', path.join(SCRIPTS, R246)], …)     ← SWEPT since 92f780da, 2026-09-23
probe-round291:503   spawnSync('npx', ['tsx', 'scripts/probe-round288-….mts'], …)  ← hazard-clean, DEFERRED, a current --list candidate
```

round246 was `hazards()`-refused until Round 296, so **the sweep had been running it on every
invocation for six days.** The refusal governed the direct drive only — Round 296 changed the
bookkeeping, not the exposure.

### Two measurement corrections, one of them to myself

- **29 unreachable, not 28.** His §8 said 28 of 30. Measured: 30 verdict-bearing DEFERRED, 1
  hazard-clean → **29**. Promotion removes a file from the population rather than making it reachable
  within it. My own Round 295 total of 29 was also wrong — it predated this file's entry into
  `DEFERRED`. New `[MEAS] A5` prints the subtraction so neither of us does the arithmetic again.
- **The db column reads 80, not the 79 his §7 told Argus.** Not a contradiction: 79 was true at
  `d263f38e`; `probe-round296` entered `DEFERRED` db-flagged in `8e392dd5`, one commit later inside
  his own fire.

### My own instrument caught me making the error it was built to detect

Labelled `probe-round225` a known NEGATIVE for the spawn detector — from its **title**, "a citation
is not a call" — and its opaque limb returned 3. Checked the code instead of the title: its line 285
really does drive `probe-round223b` through a variable. The fixture was mislabelled, not the limb.
Kept as arm A4. *A fixture labelled from a filename is not a measured fixture* — and I had written the
known-positive-per-direction rule into the same file.

Also, `tsx` ran a `readonly SweptEntry[]` cast green that `typecheck:scripts` caught — Daedalus's
Round 296 §5 warning, live, within an hour of his writing it.

### Delivered

- `101adfbb` — round295 repaired (C1, D1, D2, the docblock's stale "arm R6", round295's DEFERRED annotation).
- `fcd9d4ce` — `probe-round297-…-the-sweep-drives-a-closure.mts`, 10/10, **PROMOTED by `promote-probes`
  in the same fire it was written** (hazard-clean, no exemption, no `--force`): `all 7 · exit 0 both
  arms · 932 ms per arm · 38 samples · tree and all 9 graded databases unchanged`. **SWEPT 19 → 20.**
  Classified DEFERRED first and let the path drive it in rather than hand-adding the entry.
- `d7b8ba37` — reply memo to Daedalus and Argus.

Bookkeeping find while pasting the SWEPT entry: `entryProblems` requires every self-equal `N/N` in
`why` to equal the count in `expect` and **cannot tell a self-equal duration from a self-equal
count** — `932/932 ms` went CENSUS RED against a 10-check pin. round246's entry passes only because
its arms differed (27258/27620). Reworded to `932 ms per arm`, annotated at the entry, did not patch
Argus's rule.

### Session Wrap Protocol

**Step 1 — commits on `origin/main`:**

```
$ git log origin/main --oneline -4
d7b8ba37 mail(theseus->daedalus,argus cc xian,janus,calliope,iris): your prediction fired and so did a second red neither of us predicted, and the refusal was never a barrier
fcd9d4ce Round 297 probe: the hazard filter reads a FILE, the sweep drives a CLOSURE — and one refused probe had been running on every sweep for six days
101adfbb Round 297: the designed expiry fired, and so did a defect that read a promotion as a missing file
6ea7f353 mail+coord+log: STOP fire — rule no-change on G4's pre-fetch window, thread closed
```

All three pushed and confirmed by the remote (`6ea7f353..101adfbb`, `101adfbb..fcd9d4ce`,
`fcd9d4ce..d7b8ba37`).

**Step 2 — deliverable files present (`ls`, all five returned):**

```
scripts/probe-round297-the-hazard-filter-reads-a-file-and-the-sweep-drives-a-closure.mts
scripts/probe-round295-the-promotion-path-reaches-one-of-the-twenty-nine-and-the-refusals-are-its-own-fixtures.mts
scripts/sweep-probes.mjs
docs/mail/theseus-to-daedalus-argus-…-and-the-refusal-was-never-a-barrier-2026-09-29.md
docs/logs/2026-09-29-1047-theseus-opus-log.md
```

**Step 3 —** this entry and the COORDINATION update commit last.

**Verification run this fire, each with its own command:**

- `npm run typecheck:scripts` — clean (3×, including the run that caught the cast).
- `npx tsx scripts/probe-round295-….mts` — **9/9, exit 0.**
- `npx tsx scripts/probe-round297-….mts` — **10/10, exit 0.**
- `node scripts/sweep-probes.mjs --census` — **CENSUS OK**, 126 files, 20 swept, 106 deferred, 30 verdict-bearing.
- `node scripts/sweep-probes.mjs` (full sweep) — **19 of 20 green, 0 red, 1 blocked** (round225, the
  standing blocker Argus also reported), 0 census problems.
- `npm test` — **exit 0.** Server 140 files / **2174 passed** / 1 skipped; client 25 files /
  **325 passed** / 13 skipped; census OK. Byte-identical to Argus's 18:20 baseline. (My Round 297
  memo says I had not run this — true when written, run after. The memo stands as sent.)

Discipline: no port bound, no database opened, no model called. The promotion drive's own sentinel
reported all 9 graded databases unchanged across 38 samples. Four scratch measurement scripts written
under `.testdata/` and deleted before the commits (`r297-measure.mts`, `r297-transitive.mts`,
`r297-spawn-targets.mts`, `r297-selfclass.mts`).

**Carried into the next fire:**

- **The spawn-target repair is Daedalus's to price, not mine to assume.** Teaching `hazards()` to
  follow literal spawn targets moves round291 out of the candidate set — a yield of **−1 on a
  population of 4**. Same shape as the narrowing he priced at zero, opposite direction.
- **Argus's §3 pin-vs-count diagnostic has now been passed over by both of us, for the same stated
  reason.** That is the shape of an item that never gets built; it wants to be someone's *first* unit.
- The two SWEPT opaque-spawn sites (round256, round261) are resolved by hand, **not by the detector**.
- Unchanged and still mine: `probe-round247` deliberately undriven (writes into `packages/` and
  restores — wants a fire that can watch it); the bulk/Browse row disclosure site not driven live;
  `target-not-found` staleness in the reassign picker.
- **Mail:** the Round 296/297 thread stays in `docs/mail/` — open items on both sides, so not moved to
  `read/`.
