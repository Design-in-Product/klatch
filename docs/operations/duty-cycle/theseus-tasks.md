# Theseus — Task List of Record

**Role:** Manual testing & exploration, in tandem with the product owner (`CLAUDE.md` → Multi-Agent
Coordination).
**Cycle:** three launchd fires per day — **START 10:47, WORK 14:47, STOP 19:47 PT**
(`~/Library/LaunchAgents/com.klatch.theseus-{START,WORK,STOP}.plist`, `StartCalendarInterval` read
with `PlistBuddy` 2026-11-10).
**Worktree:** `/Users/xian/Development/klatch-worktrees/theseus` on `claude/theseus-cycle`
(`git worktree list`, 2026-11-10). Push target is `HEAD:main`.
**Last updated:** 2026-11-10, WORK-part restart fire.

---

## What this refresh corrected, and why the file had gone stale

Every claim below was checked with a tool call in the fire that wrote it. Four header facts were
wrong, not merely old:

- **Cadence.** Said "Phase 3, daily heartbeat (`31 9 * * *` — 09:31 AM PT)". There is no 09:31 job;
  there are three day-part plists at 10:47 / 14:47 / 19:47.
- **Worktree and branch.** Said `.claude/worktrees/theseus` / `claude/theseus`. Both have moved.
- **"Last updated: 2026-08-13."** The file was *edited* 2026-10-19 (`f47edd69`) but only in the
  standing-discipline section; the whole task body stayed 8/13-era.
- **Two "blocked-on-others" items had been closed for three months.** Both were closed by
  **Round 49 (`c9dd6110`, 2026-08-14 09:28)** — *the morning after* they were filed. A fire reading
  this list would have gone looking for work that shipped the next day.

The sharper problem: this seat authored **39 of the 80 `docs/research/unit-*` units** (first-commit
author `Theseus (Klatch)`, counted this fire), **all of them since 2026-10-27**, and *none* of that
work appeared anywhere in this file. The task list of record was not describing the seat's work. The
cure is structural, not a one-off tidy: a **recurring row** now makes this refresh due monthly, so
the next three-month drift is caught by the mechanism rather than by a restart that happened to land
at the head of a fire.

---

## Unblocked

_Items the cycle can pick up without xian._

- [ ] Session log at fire start; drain `docs/mail/` per the Mail Handling discipline.
- [ ] **Mail close sweep** — **100 live / 1200 read at this fire's open, 98 / 1202 after the slice
      below** (both counted with `fs.readdirSync`, not `grep`, 2026-11-11 STOP), against **93 / 1188**
      at the 11/10 measurement. Two figures because this fire *moved* the count: a single number here
      would have been false by the end of the same fire that wrote it. **The live directory grew by
      7 in one day while the deferral stood** — the sweep is losing ground, not holding, and that is
      the first figure anyone has had on which direction it moves. Of the 100 live, **20 carry
      `Theseus` as a `to:` recipient** and 17 more are cc-only — the live figure is **28 / 17 of the
      98**, and 30 of the 100 at open by arithmetic over the two this fire closed, both of which name
      this seat.
      **That figure took three tries, and the first two were wrong in opposite directions — the
      correction is the reusable part.** (1) A key reading `^to:` off YAML front matter reported
      **20 / 9**. (2) **42 of the 98 live memos have no YAML front matter at all**, carrying headers
      as bold markdown instead, and the common spelling puts the label *mid-line*
      (`**From:** X · **To:** Y`), so a line-anchored key cannot see it: the anchored key
      **under-reported this seat's own inbox by 8 of 28, 29%**, and cc-only by 8 of 17, 47%. It did
      not fail — it returned a plausible number, which is why nobody would have checked it.
      (3) Unanchoring it introduces the opposite error: `in-reply-to:` *contains* `to:`, and those
      values are memo filenames that very often contain `theseus`, so an unguarded containment match
      would read a reply-pointer as a recipient. Guarded it (label not preceded by a letter or
      hyphen) and re-measured: **28 / 17 both ways, unchanged** — so the 28 is *checked* as not
      inflated by that mechanism, not assumed clean.
      Each needs *reading* before moving, so this is a real work item, not
      bookkeeping — and it is **a fire's unit of work, not a tail**: the 11/10 WORK fire deferred it
      on exactly that ground, and the 8/13 revision of this file had already recorded it undone.
      Do not move a thread with an open action item; the Round-465 thread is open by design.
      **And the backlog is far smaller than any figure this item has ever carried — measured, not
      estimated.** Of the 28 to-me live memos, **16 are dated 11/07–11/11 and are the live Round-465
      round track** (each memo opens the next round and hands back; closing them would be wrong, not
      merely premature). **12 are older than 11/07**, and one of those is the Pard memo refused below
      for a live action on xian. **So the real close-sweep candidate set for this seat is 11 memos**,
      spanning 2026-08-09 to 2026-11-06 — not a fire's unit of work at the scale the item has been
      claiming, and the next fire that picks it up should take the 11 by date rather than re-deriving
      a population.
      **Done 2026-11-11 STOP, a declared slice rather than another whole deferral — 2 memos,
      both read in full first:** the 9/02 "urgent Friday Piper Morgan test" root (Calliope → Daedalus,
      Theseus) and Iris's closing reply on the same thread, **live for 70 days**. Closed on three
      checked facts, not on age: this seat's answer is already in `read/`
      (`theseus-to-calliope-daedalus-…-friday-answer-measured-2026-09-02.md`), Iris's memo closes her
      own side in its title and body, and the backfill question behind it is **closed on the board**
      (Calliope, 11/05, §1 "Backfill — closed", read in the memo body rather than taken off its
      filename). **Refused in the same pass, and the refusal is the more useful half:** Pard's 10/23
      capability-test memo *reads* like an ack ("Got it, thank you") but **names a live action on
      xian** — he runs the paste, then the keyless check — so it stays visible. See the new
      Blocked-on-xian entry; the memo would have been the cheapest thing in the directory to close
      wrongly.
- [ ] **A target-keyed screen** — `occ(target, v) !== 1`, which is what `once()` actually throws on.
      **No blocker named**; it is a different instrument nobody has built, and it is left
      **unclaimed** so either this seat or Daedalus can take it. Opened in the 11/10 WORK entry of
      `docs/COORDINATION.md`; whoever takes it should claim it here or there first.
- [ ] **A pin on v2's capture** — **no blocker named**; nobody has asked for it. Carried from 11/10.
- [ ] **AAXT the chip in a rendered page** — *the condition this item was waiting on was met on
      2026-08-14 and nobody noticed.* The item said: "if either ships the `message_complete` field
      first, this becomes the acceptance test for it." Round 49 (`c9dd6110`) ships exactly that —
      `carriedContext` rides `message_complete` (`round49-carried-context-room-count-and-wire.test.ts:213`
      "rides the event so the chip is present on the turn just watched") **and** the SSE replay paths
      (`:333`). So this is no longer a question about the wire; it is the **human-side acceptance
      test** of a shipped field. **In a fire: blocked** — a rendered-page run needs a server start,
      and that approval is unavailable in a non-interactive fire (documented precedent:
      `round97-…-2026-08-26.md:224`). **In an interactive/tandem session: ready to run.**
- [x] ~~**`geometry-marking-before-seed.mjs` searches a population five members narrower than the
      seeder can produce**~~ — **CURED AND CLOSED 2026-11-11 (WORK fire, `unit-465leadcure`,
      `c917de1c`).** Verified live in this STOP fire off the working file, not off the memo:
      `FILLER_LEAD` is **gone from `LIST_LENGTHS`** (now `{ FILLER: 12, FILLER_LONG: 17 }`) and the
      four loop bounds read a separately named `L_SWEEP_MAX = 20` with the inertness and the
      re-spelling recorded in place. The design call the item was deferred on was **mis-posed** —
      neither "remove the number" nor "parse it": the object held three members in three roles with
      three answers, and `FILLER_LEAD` was a **sweep extent wearing a corpus name**. **The refusal
      held and is still checkable:** the N1 config survives at `L: 15`, which the old item called
      `:125` and is now `:157` — the line moved under the insert, which is exactly why the cure cites
      the self-check by searchable anchor rather than line number. **Live residual, carried
      deliberately and NOT closed with this item:** `FILLER_LONG: 17` sits in the seat `FILLER_LEAD`
      occupied on 2026-08-19 — asserted by nothing, printed as arithmetic, correct only by inspection
      today. Blocker on curing it: *it is not wrong yet*, and the matching fix (make the self-check
      assert it) is a design change to the guarded block that unit deliberately refused to touch.
      Recorded in the subject file's own comment and that unit's `RESULTS.md`, so this closure does
      not lose it. Original finding, kept for provenance:
      `scripts/geometry-marking-before-seed.mjs:44` hard-codes
      `LIST_LENGTHS = { FILLER: 12, FILLER_LONG: 17, FILLER_LEAD: 15 }`. The live array holds
      **20** pairs (counted this fire off `probe-recall-tool.mjs`'s `const FILLER_LEAD = [` block).
      The constant is used as a **loop bound** (`for (let L = 0; L <= LIST_LENGTHS.FILLER_LEAD`, at
      `:220`, `:245`, `:259`, `:276`), so the solver enumerates `L ≤ 15` while the seeder can emit
      `L ≤ 20` — it can report a constrained optimum, or no feasible configuration, with five
      leading-pair values it never tried. The drift is **mine and dates to a single commit**:
      `c017af03` (2026-08-25) is titled *"arm Q (distance): 5 FILLER_LEAD pairs, …"* — it grew the
      live array to 20 and left the solver's bound at 15, and the solver has not been touched since.
      The file's own header says the constants are **re-derived rather than imported "so a
      disagreement is informative"** (`:35`) — but a bound is not an assertion, so this disagreement
      surfaces nothing and the instrument stays green. **The unit, not the patch:** the claim worth
      pre-registering is whether widening the bound to the live length *changes the solver's
      recommendation*; bumping `15`→`20` without measuring that would answer a different question.
      Add the equality check (`LIST_LENGTHS.FILLER_LEAD === FILLER_LEAD.length`, re-derived not
      imported) in the same unit, since that is what would have caught it.
      **MEASURED 2026-11-10 (`unit-465leadbound`): the widening is INERT over bound 0..50** — all
      three arms differ in exactly two lines, both denominators, so the 155 configurations it adds
      each fail ≥2 constraints. The unit question is answered; what is left is the **cure**, still
      not landed, still this seat's next WORK unit — *not* blocked, deferred only because *"remove
      the number vs. parse it"* is a design call that wants to be made awake.
      **NARROWED 2026-11-11 (`unit-465blanket`), and this is the operative warning for whoever
      lands it:** the file holds **three** `15`s and **only `:44` is drift**. `:125`'s `L: 15` is
      N1's load-bearing config and `:160` is a comment citing N1's docblock (Daedalus's table,
      reproduced by `grep -n "15"` this fire → exactly those 3 lines). **A blanket `15`→`20`
      exits 1** — the self-check's frozen `want` fixture at `:126` reddens on 7 of 9 keys and prints
      no recommendation at all — so the blanket error is loud, not silent. **`:44` alone exits 0**
      with the self-check untouched, because the self-check never reads `LIST_LENGTHS.FILLER_LEAD`.
      Drifted site and dangerous site are disjoint: **edit `:44`, never `:125`.**
      Also censused that fire: **6 of the file's 7 re-derived figures agree with live source**, and
      the drifted one is the only one used as a loop bound rather than a geometry input.
- [ ] **Arm N1's two `--dry` runs — mine, and the live blocker on arm N.** `probe-recall-tool.mjs:772`
      defines `N1`, and its own comment block declares it **NOT RUN**: *"Two `--dry` runs before
      anything is spent … Built 2026-08-18 (STOP) by Theseus, the arm's own designer, and **not
      executed**: the fire that wrote it could not stand up the scratch server."* Daedalus's
      standing design ruling agrees — *"a `--dry` on M is the first action of any N build"*
      (`daedalus-tasks.md:39`). **Blocker: server start, approval unavailable in a non-interactive
      fire** — ready in a tandem session, and the first thing to run there.
- [ ] **Probe 3 single-variable rerun** — reinsert the owner's restriction into the *same* klatch
      prompt rather than comparing across channels, so "restriction visible → withheld, evicted →
      disclosed" becomes a licensed claim. ~4 live calls. See
      `docs/research/carried-context-disclosure-sensitivity-2026-08-13.md`
      §"What probe 3 does not establish". **Same blocker as above in a fire** (live calls /
      non-interactive approval); ready in a tandem session.
- [ ] **Replicate probe 3.** Still **n=1** — checked this fire: no replication doc exists
      (`grep -rl "probe 3" docs/research/ docs/logs/` returns only the two 8/13 write-ups and the
      two 8/13 logs). Same live-call blocker.

---

## Blocked-on-others (not xian)

- **Promotion of the restricted screen as a gate leg — Argus's, claimed by him 2026-11-10.** Three
  inputs routed to him in `46387d2e`, the last called load-bearing: promote on **4-of-403 commits**
  rather than 14-of-262; carry the two weakening sentences (this population cannot grade the
  `K-once` restriction; the five misses are not five missed hazards) *with* the figure; and **widen
  the key before promotion**, because `K-once` re-introduces the hoisted-parameter blindness v2
  cured with W1. Nothing for this seat until he rules or asks.
- **`377`'s seven derived anchors** — blocker: cross-pinned `C5`. *(As recorded in the 11/10
  COORDINATION entry; not re-measured this fire.)*
- **`373` 15→16 plus the `:108` fixture, and `377` 13→14** — carried, unclaimed. *(Same provenance;
  figures not re-derived here, deliberately — they belong to their unit docs.)*
- **The shared guarded registry reader** — carried, unclaimed, with a **seventh** reason as of
  11/10: a copier-population key has now been found to be a floor three separate times.
- **`d0dff8b7`'s `R373_*` under `K5`** — blocker: the same extractor gap as `247`/`248`.
- **`247`/`248` under `K5`** — blocker unchanged and **mine**: UNREAD, not cleared.
- ~~**Room-count undercount on same-named channels**~~ — **CLOSED 2026-08-14 by Round 49**
  (`c9dd6110`), one day after it was filed, and carried here as open for three months. The count is
  by `channelId` now (`carried-context.ts:339`, whose comment cites this seat's own 8/13
  measurement), with six tests in that `describe`, including "counts two same-named conversations as two"
  (`round49-…test.ts:119`).
- ~~**Chip absent on the live turn**~~ — **CLOSED 2026-08-14 by the same commit** (see the AAXT item
  above, which inherits it as an acceptance test).
- ~~**Eviction defect**~~ — ruled 8/13 STOP: option 1 shipped, 2 deferred, 3 recorded as the
  position; residual stays open as an accepted defect.
- ~~**`omittedCount` on the carried-context chip**~~ — closed 8/13. Both fields persisted and are
  still in the source (`carried-context.ts:236,246`), chip stays existence-only.

---

## Blocked-on-xian

_Items batched for xian's attention. Calliope's sweep promotes these to the attention rollup._

- **The Round 445 / Round 418 §4 capability test — parked on xian for 19 days, and until tonight it
  was not written in the one place that would surface it.** `docs/research/round445-capability-test/`
  (`a93ede8d`, 2026-10-23) packages the test as one pasteable command with a pin guard. Pard checked
  xian's own checkout and replied the same evening
  (`docs/mail/pard-to-theseus-cc-janus-calliope-xian-capability-test-got-it-pull-will-refuse-stash-and-leave-it-2026-10-23.md`):
  `/Users/xian/Development/klatch` is **589 commits behind** and doesn't have `a93ede8d`, so the paste
  stashes-without-popping before pulling; **Pard will not run the keyless check himself** — it needs
  the pull in xian's tree — and xian runs it as step one of the same sitting. **Nothing has touched
  the directory since 10/23** (`git log -1` on it returns `a93ede8d`, i.e. the commit that created
  it), so there is no record the sitting happened. **No fire can do this one:** xian's checkout is
  outside every worktree's sandbox. **The gap, and it is this seat's:** Daedalus recorded it as
  *"Needs xian — unchanged"* in his own 10/24 `COORDINATION.md` drain lines, but it is absent from
  this section — the input Calliope's sweep promotes from — and absent from the rollup (searched
  `attention-rollup.md` for `445`, `capability test`, `verify-request-shapes`, `keyless`, `paste`,
  `589 commits`: zero hits; the rollup's one Pard item at `:116` is her hosted-agent smoke test, a
  different thing). Boarding it here is the whole cure; promotion is Calliope's call, not asserted
  here. **Caveat Pard stated and this seat repeats rather than drops:** a green run shows the surface
  works at a 2,000-token trigger and says nothing about behaviour at a real 160k context.
- **MAXT Session 02** — needs xian's live tandem attention; parked until he dedicates a session.
- **Round-trip MAXT** (Daedalus 4/28 assignment) — also needs live tandem attention; parked.
- ~~**Is the AAXT standing queue still live?**~~ — **ANSWERED 2026-11-11, by xian, relayed by Janus
  via Claude Duet (`docs/mail/janus-to-calliope-cc-theseus-xian-real-api-backlog-neither-the-block-is-xians-time-2026-11-11.md`,
  17:37 PT), in his words:** *"The answer for Calliope is neither. The API work requires further work
  but the challenge right now is my availability to clarify and explain."* So **neither of the two
  options this seat posed** — not retired, not crowded out. The queue stays live and still needs
  doing. **The item does not leave this section; its blocker changes from "unasked" to a named one:
  xian's time to clarify and explain the work to the team.** That is a *missing-input* blocker, not a
  time-indexed one, so no fire should re-date it or treat it as ripening on its own. Janus's own
  suggestion to Calliope — reframe her board item 4 as "a session with xian to clarify the API work,
  when he has time" — is hers to take; recorded here because the question was this seat's and the
  answer lands on this seat's queue. **Verified before writing this:** rollup item 4 is the same item
  (`docs/operations/attention-rollup.md:122`, heading *"The real-API ('AAXT') test backlog hasn't
  moved in ~5.5 months — retire it, or say it's being crowded out?"*), read on the file rather than
  assumed from Janus's paraphrase.
- ~~**Staged test-data cleanup**~~ — **removed; the 8/13 framing is void.** It said "the four DBs in
  `.testdata/` are Pard's staging, held pending xian's call." Checked this fire: `.testdata/` holds
  **345 top-level entries, among them 134 `.db` files** (found recursively), is in active use by
  this seat's probe/corpus work, and
  the **whole directory** is ignored (`git check-ignore -v` → `.gitignore:33  .testdata/`). There is
  no four-DB decision pending and nothing for xian to rule on. *(The companion item "staged
  `.testdata/` DBs missing", reported to Pard 8/13, dies with it for the same reason.)*

---

## Recurring items

| name | cadence | next_due | last_completed | notes |
|---|---|---|---|---|
| Mail drain | per fire | 2026-11-11 STOP | 2026-11-11 STOP | Read on arrival, act/reply/surface in the same turn. 11/11 STOP: 3 in (all cc-only, all read in full), 1 out to Janus, 2 threads closed into read/, 1 refused for a named live action on xian |
| COORDINATION.md update | per fire | 2026-11-11 STOP | 2026-11-11 STOP | Update Theseus Prime section before any push |
| Session log entry | per fire | 2026-11-11 STOP | 2026-11-11 STOP | Timestamped entries as work progresses, not reconstructed |
| **Task list of record refresh** | **monthly** | **2026-12-10** | **2026-11-10** | **New 2026-11-10.** The cure for this file's three-month drift. Refresh means *verify*: header facts against `git worktree list` and the plists, every open item against code or `git log`, and every "blocked on X" against whether X still holds. A refresh that only re-dates the header has not been done. |

---

## Standing discipline for this seat

- **Verify before asserting.** If a claim did not come from a tool call *in this session*, it is a
  lead, not a source (`CLAUDE.md` §"Verify Before Asserting"). This file is the standing example of
  the cost: two items carried as open for three months after the commit that closed them, and a
  cadence line naming a cron job that does not exist.
- **Scratch DBs and result files are deleted at end of fire.** Corrected 2026-10-19 (Round 418) and
  **re-verified 2026-11-10**: `.gitignore:33` ignores the **whole** `.testdata/` directory, so
  nothing under it can be committed and nothing there will ever appear in `git status`. Durable
  output goes to `docs/research/`, quoted.
- **Probes cost real money.** State the call count in the write-up.
- **Every probe needs the control that makes its result readable.** An empty or errored control is
  void, not a datum — check `status`/`stop_reason` on the row before reading a non-answer as a
  decision (this cost a wrong write-up on 8/13 and was caught).
- **A unit's pre-registration is committed and pushed before its instrument exists.** The shape this
  seat has run since 10/27: predictions and refusals first, in their own commit, then the
  instrument + capture, then RESULTS with post-hoc legs labelled as post-hoc.

---

## AAXT candidates (standing queue — green-lit 5/28 by Calliope relay, untouched since)

All four surfaces exist in the client as of 2026-11-10 (`ls packages/client/src/components/`), and
**no AAXT round doc is dedicated to any of them** — checked by filename across
`docs/research/aaxt-*` and by content grep, whose hits are other rounds that merely name the file
(Round 49's write-up among them):

1. **ProjectSettings (F5.1)** — `ProjectSettings.tsx` exists; greenlit, not started
2. **EntityManager** — `EntityManager.tsx` exists; greenlit, not started
3. **MessageList (F1.4)** — `MessageList.tsx` exists; greenlit, not started
4. **Composition gesture surface** — `MessageInput.tsx` exists; was "not yet ready (Daedalus
   mid-implementation 6/22)". His own task list now records the composition gesture as largely built
   with sub-phases 1–7 done, so the readiness condition is likely met — **unverified here**, and his
   to confirm.

**Open question — ANSWERED 2026-11-11, and the answer was "neither."** The question this seat raised
twice ("either the queue is stale and should be retired, or AAXT is being crowded out") was boarded by
Calliope as rollup item 4 and answered by xian through Janus the same evening: *"The answer for
Calliope is neither. The API work requires further work but the challenge right now is my
availability to clarify and explain."* The queue is **live and unretired**; the four surfaces below
stay queued. **The standing blocker is now named and is xian's time to clarify the work, not a
priority call** — see the Blocked-on-xian entry above for the full quote and provenance. Declining to
decide it unilaterally was the right call: both options this seat offered were wrong, and a fire that
had picked one would have retired live work or mislabelled it.
