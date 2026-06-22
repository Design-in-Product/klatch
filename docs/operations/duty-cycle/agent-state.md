# Agent State — Klatch Duty Cycle

**Purpose:** at-a-glance current state of each agent's cycle. *State, not history* (history lives in `cron-shape-experiments.md`).

**Caveat (CIO §5, 2026-06-02):** hand-maintained trackers go stale silently — crons expire, sessions die, the row says "live" when reality is "dead." Klatch's cohort is small enough that hand-maintenance is workable at v0.2; the discipline is **derive where possible** (current cron status from `CronList`; presence of today's cycle log; last-fire timestamp from the most recent cycle-log entry). Graduate to fuller derivation as we observe what stays current.

**Update discipline:** each agent updates its own row on session start and session wrap. Calliope batches lag during chronicling pass.

---

| Agent | Cycle | Cadence | Worktree | Branch | Last fire | Notes |
|---|---|---|---|---|---|---|
| **Calliope** | **live (v0.2)** | hourly (`13 * * * *`) | `.claude/worktrees/calliope` | `claude/calliope` | 2026-06-06 Fire 0 (Phase 1 launch) | Phase 1 cutover complete 6/6. Cron job id `adca439c` (session-only — dies when this Claude session ends; next session re-registers). |
| **Daedalus** | **live (v0.2)** | hourly (`17 * * * *`) tandem with Argus | `.claude/worktrees/daedalus` | `claude/daedalus` | 2026-06-21 Fire 0 (Phase 2 launch) | Phase 2 cutover 6/21. Cron job id `9a295ef9` (session-only — dies when this Claude session ends; next session re-registers). |
| **Argus** | **live (v0.2)** | hourly (`43 * * * *`) tandem with Daedalus | `.claude/worktrees/argus` | `claude/argus` | 2026-06-21 Fire 0 (Phase 2 launch) | Phase 2 cutover 6/21. Cron job id `9192826d` (session-only — dies when this Claude session ends; next session re-registers). Weekly intel sweep is a Recurring-items row, not a separate cron. |
| **Theseus** | **live (v0.2)** | daily heartbeat (`31 9 * * *`) | `.claude/worktrees/theseus` | `claude/theseus` | 2026-06-22 Fire 0 (Phase 3 launch) | Phase 3 cutover 6/22. Cron job id TBD (session-only — dies when this Claude session ends; next session re-registers). Signal-receiver heartbeat, not a work-queue cycle; MAXT still needs xian. |
| **Iris** | **active (xian-tandem; no heartbeat cron yet)** | ad-hoc + one-shot `fireAt` (standing heartbeat cron pending Phase 3 formal cutover) | `.claude/worktrees/great-lamarr-94aefe` (temp session worktree; persistent `.claude/worktrees/iris` not yet created) | `claude/great-lamarr-94aefe` (temp; persistent `claude/iris` not yet created) | 2026-06-22 05:00 (`fireAt` one-shot, auto-disabled) | Active since 6/21 on composition UX sprint (xian-tandem). Persistent worktree + recurring daily cron NOT yet created — each session is xian-invoked or a one-shot `fireAt`. Phase 3 formal cutover still pending. |

---

## Legacy worktrees

**Calliope's** (cleaned up at Phase 1, 2026-06-06):
- `calliope-may18` ✓ removed
- `calliope-may28` ✓ removed
- `calliope-june02` ✓ removed
- `calliope-june03` ✓ removed (the session that drove Phase 0/1)

**Other agents'** (each cleans up at its own Phase 2/3 launch, since agents own their worktrees):
- `daedalus-2026-05-18` ✓ worktree removed 6/21 (Phase 2 launch); branch ref `worktree-daedalus-2026-05-18` retained — provably merged to origin/main (0 unique commits) but `git branch -d` blocked by stale upstream; full `-D` delete deferred pending xian approval (Git Safety Rules)
- `iris-may18` (cleanup at Iris Phase 3 launch)
- `theseus-2026-05-18` — Phase 3 launched 6/22; worktree cleanup pending (confirm no uncommitted work first)

**Older ephemeral** (not owned by current agents; leaving in place pending separate review):
- `hungry-johnson`, `kind-faraday`, `peaceful-merkle`, `trusting-euler`

Cleanup procedure: confirm no uncommitted work in the worktree → `git worktree remove` → `git branch -d` the corresponding branch if unused.
