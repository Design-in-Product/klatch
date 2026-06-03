# Agent State — Klatch Duty Cycle

**Purpose:** at-a-glance current state of each agent's cycle. *State, not history* (history lives in `cron-shape-experiments.md`).

**Caveat (CIO §5, 2026-06-02):** hand-maintained trackers go stale silently — crons expire, sessions die, the row says "live" when reality is "dead." Klatch's cohort is small enough that hand-maintenance is workable at v0.2; the discipline is **derive where possible** (current cron status from `CronList`; presence of today's cycle log; last-fire timestamp from the most recent cycle-log entry). Graduate to fuller derivation as we observe what stays current.

**Update discipline:** each agent updates its own row on session start and session wrap. Calliope batches lag during chronicling pass.

---

| Agent | Cycle | Cadence | Worktree | Branch | Last fire | Notes |
|---|---|---|---|---|---|---|
| **Calliope** | **pending Phase 1 cutover** (today) | hourly (planned) | `.claude/worktrees/calliope` (planned) | `claude/calliope` (planned) | 5/28 Fire 6 (legacy pilot, paused) | Phase 0 substrate in progress; Phase 1 launches the persistent worktree. |
| **Daedalus** | off (pending Phase 2) | hourly tandem with Argus (planned) | `.claude/worktrees/daedalus` (not yet created) | `claude/daedalus` (not yet created) | — | Phase 2 awaits xian's next agent-launch session for D+A together. |
| **Argus** | off (pending Phase 2) | hourly tandem with Daedalus (planned) | `.claude/worktrees/argus` (not yet created) | `claude/argus` (not yet created) | — | Phase 2 awaits xian's next agent-launch session. Weekly intel sweep goes in Recurring-items section of task list, not a separate cron. |
| **Theseus** | off (pending Phase 3) | daily heartbeat (planned) | `.claude/worktrees/theseus` (not yet created) | `claude/theseus` (not yet created) | — | Phase 3 awaits xian's next agent-launch session. Signal-receiver heartbeat, not a work-queue cycle; MAXT still needs xian. |
| **Iris** | off (pending Phase 3) | daily heartbeat (planned) | `.claude/worktrees/iris` (not yet created) | `claude/iris` (not yet created) | — | Phase 3 awaits xian's next agent-launch session. Signal-receiver heartbeat; her real work is design-thinking with xian. |

---

## Legacy worktrees (cleanup at Phase 1)

For removal after Calliope migrates to `.claude/worktrees/calliope`:

- `calliope-may18`, `calliope-may28`, `calliope-june02`, `calliope-june03` (dated per-session — Calliope legacy)
- `daedalus-2026-05-18`, `iris-may18`, `theseus-2026-05-18` (dated per-session — May 18 burst)
- `hungry-johnson`, `kind-faraday`, `peaceful-merkle`, `trusting-euler` (older ephemeral)

Cleanup procedure at Phase 1: confirm no uncommitted work in any legacy worktree → `git worktree remove` each → delete the corresponding branch if unused.
