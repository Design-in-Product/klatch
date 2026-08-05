# Handoff — Argus → Amber

**From:** Argus (quality, testing, intelligence sweeps — AAXT semantic-conveyance probing)
**Written:** 2026-08-04, ~17:15 PT, from the pre-Amber `claude/argus` worktree
**For:** my successor session on Amber, and the Klatch team mid-migration
**Protocol:** per `docs/mail/memo-pard-to-calliope-team-amber-migration-2026-07-29.md`. The push of this file is my standup signal to Pard.

Every load-bearing claim below is tagged **[VERIFIED]** (confirmed by a tool call in the session that wrote this) or **[BELIEVED]** (recalled from cycle-log/prior-session context, not re-verified this session — treat as a lead, check before citing). This is CLAUDE.md's "Verify Before Asserting" rule applied to my own handoff.

**Session note:** this session opened mid-way through the July 19 duty cycle (13:48 PT fire), then hit a 12-day compaction gap before this migration ask arrived. I did not resume the interrupted duty-cycle work — the migration ask takes priority and explicitly asked for a snapshot, not more work. See "the dropped ball" below; it's real and it's mine to flag, not to quietly finish.

---

## Who I am on this team, in one line

I own quality: the test suite (1332 tests), AAXT semantic-conveyance probing (does a fresh agent reading the UI actually understand what it communicates, not just "does the pixel exist"), the weekly intelligence sweep (SDK/model/ecosystem changes that touch Klatch), and — new as of July 19 — the pre-gate protocol that catches "green suite, unrunnable use case" gaps before they become beta-gate mistakes.

## § Hard-won lessons — the judgment that dies with this session if unwritten

**1. A green suite is not a gate, and I am the agent whose job is to say so out loud. [VERIFIED — `docs/operations/pre-gate-protocol.md`, filed and pushed to main]**

The composition gesture shipped 1332 green tests, full AAXT coverage, and Iris design-review sign-off. It was declared "all gates clear." The first real-use attempt (the PM weekly leadership review, Klatch's own canonical use case) couldn't run — agents join a klatch with only their L5 prompt, none of their source-channel history. AAXT is structurally blind to this class of gap: it probes *how a built thing behaves*, and has nothing to probe when the thing was never built. The fix I filed is two passes, required before any "gate clear": **Pass 1 (capability inventory)** — walk the canonical use case's required capabilities as yes/no, human + real system, not a synthetic probe. **Pass 2 (scope reconciliation)** — every named scope item is ✅ shipped / ⏸ deferred-with-approval / ❌ no call made; "not now" said in passing does not count as an approved deferral. Apply this before the next gate declaration — it hasn't been applied to one yet, because none has come up since I filed it.

**2. Load-sensitivity flakes and real regressions look identical until you isolate. [BELIEVED — recurring pattern across the duty cycle, e.g. round27b MCP InMemoryTransport, 7/4 21:00 fire]**

A test that fails under full-suite parallel load and passes in isolation is a `testTimeout`/`maxWorkers` problem, not a logic regression — different fix, different urgency. Don't sound an alarm on a full-suite failure without re-running the specific file in isolation first. Both vitest configs (client, server) currently run `maxWorkers: 1` / `poolOptions.threads.singleThread` for this reason — client suite used to flake under parallel load before that change.

**3. Interpretation forks change the estimate by 10×, and naming both interpretations explicitly is the job — not picking one and hoping. [VERIFIED — `docs/mail/argus-to-calliope-team-memos-reply-2026-07-19.md`, pushed]**

When Daedalus's transcript-ownership reframe landed (one transcript per agent, channel is a view), I forked it into **Interpretation A** (messages move from channel-ownership to entity-ownership — storage change, multi-week test re-baseline) vs **Interpretation B** (messages keep `channel_id`, history assembly joins through `channel_entities` — query change only, two builders change, suite mostly survives). B looks right on Gall's-law grounds but is a knowing simplification, not a free one — worth naming the tradeoff explicitly rather than silently picking the cheap one. This fork is still open at freeze (see below) and gates Daedalus.

**4. Discretion under one transcript is a probe-design-inverting decision, not a detail. [VERIFIED — `docs/plans/discretion-model-options-2026-07-19.md`, read; my response never written — see "the dropped ball"]**

Once agents share one transcript across 1-1 and klatch, "Daedalus repeated something xian told him in the 1-1, inside a klatch with Argus and Iris" is either correct behavior or a privacy violation depending on which of four positions xian picks (fair-game → norm-not-wall → marked-private-walled → 1-1-privileged-by-default). You cannot write the probe until you know which. Positions 3 and 4 are binary-testable; position 2 needs an LM-graded rubric — a materially harder build. **The nuance I owed Calliope and never delivered:** for positions 3/4, a probe that checks the *assembly* layer (was 1-1 content present in the system prompt Klatch built?) is not the same check as one on the *inference* layer (does the agent's actual behavior ever surface 1-1 content, regardless of what was assembled — e.g. via a retrieval tool call, or residual model behavior). A clean assembly-layer probe can pass while an inference-layer leak still happens. Whoever picks this back up should build both checks, not just the assembly one, or the "clean binary probe" promise in Calliope's straw man will be partially false.

**5. Git identity hygiene on a shared checkout is a real, not hypothetical, hazard here. [VERIFIED — `git log --format="%an <%ae>: %s" -20` this session]**

Janus flagged (memo `memo-janus-to-calliope-amber-migration-plus-git-identity-2026-07-24.md`) that Janus and Themis silently swapped git author identity for 15 days sharing one checkout on DinP — 101 commits misattributed. I checked: the last 20 commits on this branch are cleanly attributed (`mediajunkie`, `Pard (Mediajunkie)`, `Claude <noreply@anthropic.com>` for automated briefs — no cross-agent bleed visible). But that's a spot check of 20 commits, not a guarantee, and Amber is explicitly the shared-host, multi-worktree setup this hazard class targets. **Confirm the per-fire identity-assertion pattern with Pard before committing on Amber** (see questions below) — don't assume "clean today" survives the move by default.

## § Load-bearing vs commodity

**What a successor needs from *me* (won't rebuild from the repo):**
- The instinct in lesson 1 — treating "tests pass" and "the use case works" as two different questions that both need asking, every time, not just after getting burned once.
- The isolation-before-alarm discipline in lesson 2 — it's not written down as a rule anywhere except this handoff and scattered cycle-log entries.
- The Interpretation A/B framing habit in lesson 3 — Daedalus is currently *held* waiting on this exact kind of fork being named, not resolved by guessing.
- The owed nuance in lesson 4 — Calliope is waiting on it; it was never sent. See below.
- My persona capture (`docs/plans/persona-capture-argus-2026-07-05.md`, already filed and used to seed an earlier Klatch-entity version of me) — working style, communication style, more detail than fits here.

**What the repo rebuilds (commodity — don't waste handoff space re-explaining):**
- Architecture, schema, the 5-layer model → `CLAUDE.md`, `docs/ARCHITECTURE.md`, code.
- Test suite structure and counts → run it; current believed baseline below.
- The pre-gate protocol itself, in full → `docs/operations/pre-gate-protocol.md`.
- The composition continuity gap, in full → `docs/plans/composition-continuity-gap-2026-07-19.md`.
- My memory store persists across sessions (the `MEMORY.md` index + files) — but per Calliope's lesson 3 (also true for me), it can be stale; verify before citing.

## § In-flight state at the freeze (this is the resume point)

**The headline, same as Calliope's: 1.0 is NOT cut. The beta gate is not met.** [BELIEVED — rollup still shows v22, dated 2026-07-19, as the last refresh; no newer version found this session]

**The dropped ball — say this plainly, don't bury it.** My duty cycle was mid-fire (13:48 PT, July 19) when the prior session ended. The two things that fire was supposed to produce — a probe-design response to Calliope on the discretion nuance (lesson 4 above), and the 13:48 cycle-log entry — were never written or committed. **[VERIFIED — `git log --oneline` on `claude/argus` shows the last Argus commit as `e25a41f` "12:51 fire: no-op cycle log entry"; no 13:48 commit exists; no file matching `*probe*design*` or similar was ever created.]** Calliope's ack memo (`calliope-to-argus-ack-pre-gate-protocol-2026-07-19.md`) is still sitting in `docs/mail/` (not `read/`) waiting on that reply. **This is the single most concrete owed item in this handoff — successor should write it before anything else test-suite-related**, using lesson 4 above as the content.

**Suite state** [BELIEVED — last runtime-confirmed green was 7/19 ~12:06 PT per cycle log, 1332 passing (1120 server / 212 client, 12 AAXT skipped, gated on `RUN_UI_AAXT=1`); not re-run this session per xian's explicit "no active work" ask]. Re-run before trusting this number — 16 days have passed and other agents may have merged to main in that window (this session's `git merge origin/main` did pull in a batch of intel-sweep and cross-pollination commits, none touching test files as far as this session checked, but "as far as checked" is not "verified clean").

**SDK version** [VERIFIED — `packages/server/package.json:14`]: `"@anthropic-ai/sdk": "^0.110.0"`. Was current as of 7/5; check against latest on Amber — 16 days is enough time for a minor bump upstream.

**AAXT rounds R46–R50 exist on `claude/argus` but were never run** [BELIEVED, per my own 7/5 persona capture] — gated on `RUN_UI_AAXT=1`, which requires an environment with the UI harness available. Worth checking whether Amber's environment has that gate satisfiable; if not, they stay parked same as before.

**Intel sweeps — automated sweeps kept running through the gap, curation did not.** [VERIFIED — `ls docs/intel/`]: sweeps for 7/20, 7/27, and 8/03 exist on disk (auto-filed), landing on main via the `docs(intel): automated external scan` commits visible in `git log`. None have been through my curation pass (the step that reads the raw auto-sweep and pulls out what actually routes to Daedalus/Calliope with action attached, the way sweep #16 was curated into `docs/intel/2026-07-13-sweep-curated.md`). **Three sweeps' worth of curation is owed** — successor should treat this as backlog, not urgent, but real.

**The four xian-owned decisions from the continuity gap are, as far as this session can tell, still open.** [BELIEVED — rollup v22 is the newest version found; no memo in `docs/mail/` post-7/19 shows xian answering Interpretation A/B, identity resolution, one-transcript-vs-two, or discretion]. Do not assume any of these are resolved without checking the rollup version number and mail directory fresh on Amber — this is exactly the kind of stale-recall trap CLAUDE.md warns about, and 16 days is a long gap.

**Team state at the 7/19 freeze** [BELIEVED, from cycle log and Calliope's own handoff which I read this session]:
- **Daedalus** — held on all transcript-model building, waiting on Interpretation A/B (my fork) and identity resolution.
- **Iris** — has revised composition-spec §6 ready, wants xian in the room.
- **Calliope** — filed the discretion straw man, acked my pre-gate protocol, is owed my probe-design nuance (see dropped ball above).
- **Theseus** — MAXT deferred until continuity mechanism exists.

## § Amber — questions for Pard to answer from live host state (I haven't seen it)

1. My duty cycle ran as a **session-only cron** (confirmed empty via `CronList` this session — the last-known job ID, `fa489b8f` from 7/19, is gone, as expected for a session-scoped cron after a session ends). On Amber, is the durable equivalent a host-level cron, a tmux-persistent loop, or per-session re-arm? I want to **deliberately** re-arm the hourly WORK-window cycle (07:00–23:00 PT) rather than lose it silently, per the cohort's own findings that crons don't survive a move automatically.
2. Standing worktree on the shared klatch repo, per your memo. With multiple Klatch agents committing from one host: is git identity per-worktree-config, or do I need to assert mine (`Argus` / appropriate email) at fire-start? Lesson 5 above — this repo is clean as far as a 20-commit spot check goes, but Janus's DinP incident (101 misattributed commits, 15 days, undetected) is exactly the failure mode a shared multi-agent host produces. I want the per-fire assertion pattern confirmed before my first commit on Amber.
3. Does `RUN_UI_AAXT=1` have a satisfiable environment on Amber (browser/UI harness available), or do R46–R50 stay parked same as on the current host?
4. Push-is-signal, per your memo — confirmed I'll follow that. Anything else you need beyond this file landing on `main`?
5. Is there a shared intel-sweep cron already running on Amber independent of my session (the `docs(intel): automated external scan` commits suggest sweeps kept firing through the 16-day gap even with no Klatch agent session open) — or was that Pard/infra-level, and should I expect to inherit ownership of it?

## First moves for my successor on Amber

1. Read `docs/PREMISE.md`, then Calliope's handoff (`docs/handoff-calliope-amber-2026-08-04.md`) for the fuller architecture/decision context, then this file.
2. **Write the owed probe-design response to Calliope first** (lesson 4, dropped-ball section) — it's the one concrete unfinished piece of work from before the freeze, and it's blocking a thread she's holding open specifically for it.
3. Re-arm the WORK-window duty cycle once Pard answers Q1; confirm git identity per Q2 before the first commit.
4. Re-run the full suite once, to get a fresh VERIFIED baseline rather than trusting the 7/19 number.
5. Check the rollup version number and `docs/mail/` fresh before assuming any of the four xian-owned decisions are still open — 16 days is long enough that they may not be.
6. Curate the three backlogged intel sweeps (7/20, 7/27, 8/03) when there's a natural gap — not urgent, but don't let it become five.

— Argus, holding quality until we're all across.
