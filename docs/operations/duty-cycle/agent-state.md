# Agent State — Klatch Duty Cycle

**Purpose:** at-a-glance current state of each agent's cycle. *State, not history* (history lives in `cron-shape-experiments.md`).

**Caveat (CIO §5, 2026-06-02):** hand-maintained trackers go stale silently — crons expire, sessions die, the row says "live" when reality is "dead." Klatch's cohort is small enough that hand-maintenance is workable at v0.2; the discipline is **derive where possible** (current cron status from `CronList`; presence of today's cycle log; last-fire timestamp from the most recent cycle-log entry). Graduate to fuller derivation as we observe what stays current.

**Update discipline:** each agent updates its own row on session start and session wrap. Calliope batches lag during chronicling pass.

---

| Agent | Cycle | Cadence | Worktree | Branch | Last fire | Notes |
|---|---|---|---|---|---|---|
| **Calliope** | **live (v0.2)** | hourly (`13 * * * *`) | `.claude/worktrees/calliope` | `claude/calliope` | 2026-06-06 Fire 0 (Phase 1 launch) | Phase 1 cutover complete 6/6. Cron job id `adca439c` (session-only — dies when this Claude session ends; next session re-registers). |
| **Daedalus** | off (pending Phase 2) | hourly tandem with Argus (planned) | `.claude/worktrees/daedalus` (not yet created) | `claude/daedalus` (not yet created) | — | Phase 2 awaits xian's next agent-launch session for D+A together. |
| **Argus** | off (pending Phase 2) | hourly tandem with Daedalus (planned) | `.claude/worktrees/argus` (not yet created) | `claude/argus` (not yet created) | — | Phase 2 awaits xian's next agent-launch session. Weekly intel sweep goes in Recurring-items section of task list, not a separate cron. |
| **Theseus** | off (pending Phase 3) | daily heartbeat (planned) | `.claude/worktrees/theseus` (not yet created) | `claude/theseus` (not yet created) | — | Phase 3 awaits xian's next agent-launch session. Signal-receiver heartbeat, not a work-queue cycle; MAXT still needs xian. |
| **Iris** | off (pending Phase 3) | daily heartbeat (planned) | `.claude/worktrees/iris` (not yet created) | `claude/iris` (not yet created) | — | Phase 3 awaits xian's next agent-launch session. Signal-receiver heartbeat; her real work is design-thinking with xian. |

---

## Legacy worktrees

**Calliope's** (cleaned up at Phase 1, 2026-06-06):
- `calliope-may18` ✓ removed
- `calliope-may28` ✓ removed
- `calliope-june02` ✓ removed
- `calliope-june03` ✓ removed (the session that drove Phase 0/1)

**Other agents'** (each cleans up at its own Phase 2/3 launch, since agents own their worktrees):
- `daedalus-2026-05-18` (cleanup at Daedalus Phase 2 launch)
- `iris-may18` (cleanup at Iris Phase 3 launch)
- `theseus-2026-05-18` (cleanup at Theseus Phase 3 launch)

**Older ephemeral** (not owned by current agents; leaving in place pending separate review):
- `hungry-johnson`, `kind-faraday`, `peaceful-merkle`, `trusting-euler`

Cleanup procedure: confirm no uncommitted work in the worktree → `git worktree remove` → `git branch -d` the corresponding branch if unused.
