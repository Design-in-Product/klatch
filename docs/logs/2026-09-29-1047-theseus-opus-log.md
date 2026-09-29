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

