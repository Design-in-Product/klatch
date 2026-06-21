# Cron-Shape Experiments — Klatch

**Purpose:** per-agent history of cron-shape choices, observations, and adjustments. The substrate for *discovering* the right cadences rather than locking a one-size-fits-all default. (Per PM CIO's §4 recommendation 2026-06-02; the lesson they most wished they'd had on day one.)

**Discipline:**
- One section per agent. Each agent maintains its own section.
- **Append-only within section.** When an agent changes its cadence, add a new entry; the prior entry stays as history.
- Entry schema: **date · cadence chosen · reason · observations after running · refinements triggered**.
- Distinct from `agent-state.md` (state-at-a-glance, derived). This file is history-with-rationale.

---

## Calliope

### 2026-05-28 — Pilot (v0.1) — 30-min observation interval

- **Cadence:** every 30 min (`7,37 * * * *`), session-bound `CronCreate`.
- **Reason:** v0.1 pilot night-1; chose 30 min (shorter than design-doc 60-min default) for night-1 observation density — more fires = more to learn.
- **Observations:** 1 launch (Fire 0) + 6 autonomous fires, all clean no-ops. Thin single-agent evening; everything else gated on xian during planning-mode pause. Cycle idled cleanly, respected xian-presence-pause, never crossed guardrails.
- **Refinement triggered:** by Fire 2, two consecutive no-op commits confirmed PM's flagged no-op-commit-noise pattern. Adopted in-flight: pure no-op fires batch locally (append cycle-log line) and commit at the next substantive event or STOP. Now standard in v0.2.

### 2026-06-03 → 2026-06-06 — v0.2 cutover — hourly (cadence-of-record)

- **Cadence:** `13 * * * *` (every hour at :13, off-mark per CronCreate fleet-health guidance). Cron job id `adca439c`. Session-only.
- **Reason:** CIO's continuous-mail-lane default (§4, 2026-06-02). Calliope's work-shape (coordination, chronicling, mail) matches the lane. xian approved straw-model mapping 2026-06-03.
- **Cutover (2026-06-06 ~08:30 PT):** Phase 0/1 walked through 6/3 morning; Phase 1 completed 6/6 after a 3-day xian-called-away pause. Persistent worktree `.claude/worktrees/calliope` on `claude/calliope` created from `origin/main`. v0.2 cron prompt registered — encodes CHECK dispatcher (START/STOP/WORK), drain-until-IDLE, CronDelete-FIRST when entering substantive work, wait-default re-arm with positive absence signals (NOT wait-forever), scheduling-not-permission guardrail. 0th-step inline drain: no actionable inbound mail; continuous tasks in steady state; IDLE.
- **Observations:** *pending — first autonomous fires will land at :13. xian present at cutover; first autonomous fire likely hits xian-presence-pause unless he steps away.*
- **Refinements triggered:** *pending — to accumulate as the cycle runs.*

---

## Daedalus

### 2026-06-03 — Initial — hourly tandem with Argus (cadence-of-record)

- **Cadence:** every hour at off-mark minute (different stagger from Calliope and Argus to avoid simultaneous fires).
- **Reason:** Daedalus + Argus are a tandem (Argus checks Daedalus's work); matching cadence supports synchronization. In building mode the tandem is the engine; in planning mode (current) the hourly cycle keeps them current for cross-agent signals and routine work even when the building queue is light. Both classified as continuous (per xian 6/3, refining the literal CIO work-shape lanes).
- **Observations:** *pending Phase 2 launch (xian-scheduled).*
- **Refinements triggered:** *pending.*

### 2026-06-21 — Phase 2 cutover — hourly `17 * * * *` (cadence-of-record)

- **Cadence:** `17 * * * *` (every hour at :17, off-mark per CronCreate fleet-health guidance; staggered from Calliope :13 and Argus :43 so the tandem doesn't collide). Cron job id `9a295ef9`. Session-only, 7-day auto-expire.
- **Reason:** CIO's continuous-tandem lane (with Argus). xian approved straw-model mapping 2026-06-03; launched as Phase 2 on 6/21. "Hourly is good enough at first, fine-tune from experience" (xian via Calliope cover memo) — the big step up is doing this at all.
- **Cutover (2026-06-21 ~10:13 PT, xian-present):** persistent worktree `.claude/worktrees/daedalus` on `claude/daedalus` from `origin/main` HEAD `b000ae5`. Legacy `daedalus-2026-05-18` worktree removed at launch (its branch ref retained — provably merged to origin/main, but `-d` blocked by stale upstream; full `-D` delete deferred per no-`branch -D`-without-approval rule). v0.2 drain prompt registered (CHECK dispatcher, drain-until-IDLE, CronDelete-FIRST, xian-presence-pause, re-arm-by-default standing directive, scheduling-not-permission, question-box check). 0th-step inline drain ran during orientation (mail drained, PM #972 replied+closed). Substantive 1.0-critical work (composition gesture) is the live queue.
- **Observations:** *pending — first autonomous fires land at :17. xian present at cutover; entering substantive composition work immediately, so CronDelete-FIRST applies and first autonomous fire likely hits xian-presence-pause unless he steps away. Tandem-with-Argus coordination friction (if any) to be logged as it surfaces — feeds the mutual-assessment exchange.*
- **Refinements triggered:** *pending — to accumulate as the cycle runs.*

---

## Argus

### 2026-06-03 — Initial — hourly tandem with Daedalus (cadence-of-record)

- **Cadence:** every hour at off-mark minute (distinct stagger from Daedalus and Calliope).
- **Reason:** see Daedalus — tandem with him; matching cadence. Weekly intel sweep lives in the recurring-items section of Argus's task list (cadence-aware via START dispatcher), not via a different cron — so the standard hourly cycle handles the once-a-week shape without any special-casing.
- **Observations:** *pending Phase 2 launch.*
- **Refinements triggered:** *pending.*

### 2026-06-21 — Phase 2 cutover — hourly `43 * * * *` (cadence-of-record)

- **Cadence:** `43 * * * *` (every hour at :43, off-mark per CronCreate fleet-health guidance; staggered from Calliope :13 and Daedalus :17 so the tandem doesn't collide). Cron job id `9192826d`. Session-only, 7-day auto-expire.
- **Reason:** CIO's continuous-tandem lane (with Daedalus). xian approved straw-model 2026-06-03; launched Phase 2 on 6/21 alongside Daedalus. "Good enough at first, fine-tune from experience" (xian via cover memo) — the step up is doing it at all.
- **Cutover (2026-06-21 ~11:40 PT, xian-present then stepped away):** persistent worktree `.claude/worktrees/argus` on `claude/argus` from `origin/main`, session switched in via `EnterWorktree`, rebased to HEAD `eb0f72c`. v0.2 drain prompt registered (CHECK dispatcher, drain-until-IDLE, CronDelete-FIRST, xian-presence-pause, re-arm-by-default standing directive, scheduling-not-permission, question-box). Pre-launch xian-present work: priority-1 vocab-sweep fallout (5 client tests) + bonus round25 order-flake, suite green. 0th-step drain: cover memo actioned + moved to read/, report-in to Calliope + finding to Daedalus filed.
- **Observations (first, day-of):** *Work-shape is bursty as predicted — the priority-1 fallout was one concentrated burst, then the queue thins (composition test-rounds wait on Daedalus's first impl commit). Hourly will likely no-op between his landings; matching `:17` is justified by tandem-sync, not my own queue depth. Will accumulate real observations before proposing any cadence change (cover-memo invited logging a refinement if hourly proves over-frequent for bursty test-rounds).*
- **Refinements triggered:** *none yet — holding hourly through first autonomous fires per "good enough at first."*

---

## Theseus

### 2026-06-03 — Initial — daily heartbeat (cadence-of-record)

- **Cadence:** once per day at off-mark time (e.g., `13 9 * * *` — 9:13 AM PT each day; finalized at Phase 3 launch).
- **Reason:** Theseus's own work-shape is bursty + xian-tandem (MAXT explicitly needs xian's attention). The daily heartbeat is *not* about his work queue — it's about being reachable as a **signal-receiver** so cross-agent prompts (e.g., "Argus wants Theseus to AAXT this surface") aren't stuck until xian wakes him. Extends the don't-sit-passively rule to bursty roles via heartbeat (xian, 6/3).
- **Observations:** *pending Phase 3 launch.*
- **Refinements triggered:** *pending.*

---

## Iris

### 2026-06-03 — Initial — daily heartbeat (cadence-of-record)

- **Cadence:** once per day at off-mark time (distinct from Theseus's heartbeat to avoid simultaneous fires).
- **Reason:** Iris's real work is design-thinking with xian on the 1.0-beta UX critical path; the repo activity is downstream. Same signal-receiver framing as Theseus — the heartbeat catches cross-agent prompts ("we need Iris to weigh in on this UX call") that would otherwise sit until xian wakes her.
- **Observations:** *pending Phase 3 launch.*
- **Refinements triggered:** *pending.*
