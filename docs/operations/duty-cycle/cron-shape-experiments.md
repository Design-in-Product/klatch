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

### 2026-06-03 — v0.2 cutover — hourly (cadence-of-record)

- **Cadence:** every hour at off-mark minute (planned `13 * * * *` or similar; finalized at Phase 1 cutover).
- **Reason:** CIO's continuous-mail-lane default (§4, 2026-06-02). Calliope's work-shape (coordination, chronicling, mail) matches the lane. xian approved straw-model mapping 2026-06-03.
- **Observations:** *pending Phase 1 cutover.*
- **Refinements triggered:** *pending.*

---

## Daedalus

### 2026-06-03 — Initial — hourly tandem with Argus (cadence-of-record)

- **Cadence:** every hour at off-mark minute (different stagger from Calliope and Argus to avoid simultaneous fires).
- **Reason:** Daedalus + Argus are a tandem (Argus checks Daedalus's work); matching cadence supports synchronization. In building mode the tandem is the engine; in planning mode (current) the hourly cycle keeps them current for cross-agent signals and routine work even when the building queue is light. Both classified as continuous (per xian 6/3, refining the literal CIO work-shape lanes).
- **Observations:** *pending Phase 2 launch (xian-scheduled).*
- **Refinements triggered:** *pending.*

---

## Argus

### 2026-06-03 — Initial — hourly tandem with Daedalus (cadence-of-record)

- **Cadence:** every hour at off-mark minute (distinct stagger from Daedalus and Calliope).
- **Reason:** see Daedalus — tandem with him; matching cadence. Weekly intel sweep lives in the recurring-items section of Argus's task list (cadence-aware via START dispatcher), not via a different cron — so the standard hourly cycle handles the once-a-week shape without any special-casing.
- **Observations:** *pending Phase 2 launch.*
- **Refinements triggered:** *pending.*

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
