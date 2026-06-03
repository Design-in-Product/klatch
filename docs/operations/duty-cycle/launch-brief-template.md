# Duty-Cycle Launch Brief — Template

**For:** each Klatch agent at its first cycle session (Calliope at Phase 1, Daedalus+Argus at Phase 2, Theseus+Iris at Phase 3).
**Read order:** this brief first, then `docs/operations/duty-cycle-klatch-v0.2.md` (the design), then your section of `docs/operations/duty-cycle/cron-shape-experiments.md`.
**Replace placeholders** in `{braces}` with your specifics. Calliope's filled-in version (Phase 1) is in the worktree alongside this template.

---

## You're going on the duty cycle

xian has authorized you, **{your-name}**, to go on the Klatch duty cycle as part of the cohort rollout (xian conversational agenda 2026-06-03). The duty cycle is a scheduling-and-reminder mechanism — it does not change what you're permitted to do; it schedules you to apply existing judgment more often. Read `duty-cycle-klatch-v0.2.md` for the full framing before going further. The single most important section is **"CRITICAL FRAMING: this is scheduling, not permission"** — the word "autonomy" must not become a jailbreak vector for existing guardrails.

## Your work-shape and cadence (from the v0.2 straw model)

- **Lane:** {continuous-mail | continuous-tandem | intermittent-heartbeat}
- **Cadence:** {hourly | daily | other}
- **Rationale:** {one-line from the v0.2 mapping table}

These are a starting point. We expect to learn what works and adjust — log adjustments in your section of `cron-shape-experiments.md`.

## Your worktree

- **Path:** `.claude/worktrees/{your-slug}`
- **Branch:** `claude/{your-slug}` (long-lived; rebases against `main` daily; merges to `main` on session wrap)
- **First-time setup** (from repo root): `git worktree add .claude/worktrees/{your-slug} -b claude/{your-slug} origin/main`
- This worktree is persistent — you launch into the same path every session.

## Your per-agent docs (create these if they don't exist)

1. **Task list of record** — `docs/operations/duty-cycle/{your-slug}-tasks.md`. Sections: **Unblocked** (cycle picks up), **Blocked-on-xian** (your attention surface, batched for xian), **Recurring items** (per-row schema: `name | cadence | next_due | last_completed | notes`).
2. **Cycle log** — `docs/operations/duty-cycle/cycle-logs/cycle-log-{your-slug}-YYYY-MM-DD.md`. Per-day, append-only. New file each day at START.
3. **Session log** — `docs/logs/YYYY-MM-DD-HHMM-{your-slug}-{model}-log.md`. Existing convention; turn-by-turn.

## Your cron

**Register via `CronCreate`** with these elements:

- **Cron expression:** {your cadence; off-mark minute to avoid the synchronized clock-tick — e.g., `13 * * * *` for hourly at :13, or `13 9 * * *` for daily at 9:13 AM PT}. Coordinate with other agents' staggers so the cohort doesn't fire simultaneously (see `cron-shape-experiments.md`).
- **`recurring: true`**, **`durable: false`** (session-only — matches PM's session-bound model).
- **Prompt:** the standard drain prompt. Copy from Calliope's registered prompt (in `cycle-log-calliope-*.md` at Fire 0) and customize `{your-slug}` references. The drain prompt encodes: CHECK dispatcher (START/STOP/WORK), drain-until-IDLE, CronDelete-FIRST when entering substantive work, xian-presence-pause, wait-default re-arm heuristic, the scheduling-not-permission guardrail.

**0th-step launch (Rule 0)**: after registering the cron, **run one full drain iteration inline immediately** — pull, mail check, advance the unblocked task list to blocked-or-empty, log the fire, idle. Don't wait a full interval for first useful work.

## When entering substantive work: CronDelete-FIRST

When you start any multi-step work expected to run >2 min (a meaningful task, a memo, a code change), **`CronDelete` your cron as the literal first action** before any other tool call. Re-register when you return to true IDLE. This prevents fires from slipping into the REPL-idle gap between your tool calls (CIO's REPL-turn-level clash explanation, §2 of the 6/2 memo).

## When xian engages: pause and check mail first

Any inbound xian message → pause cron immediately, do a ~30s mail check before substantive engagement (Principles 3 + 4 of v0.2). The cycle never fires into a live conversation.

## When xian goes silent: wait-default re-arm

**Do not re-arm the cron just because time has passed.** Re-arm only on **positive absence signals** — any combination of: xian's last message reads as a wrap; the tone is conclusive (thank-you, end-of-day, "see you tomorrow"); ~5–10 min have passed with no question or open thread waiting on him.

**Two real failure modes, both bad** (Principle 4, v0.2):

- **Firing into a live conversation** — too-eager re-arm interrupts xian's turn.
- **Indefinite idling / dormancy** — never re-arming after he goes silent defeats the cycle's value (PM had 3 documented incidents).

The discipline is "wait-default," **not "wait-forever."** When unsure, wait a little longer rather than firing into uncertainty. But the heuristic must converge — once a positive signal lands, re-arm. If none land for an unusually long period (e.g., hours of silence with nothing pending), surface a wake-or-confirm question rather than going dormant. The cycle's value is lost the moment the agent drops off the map silently.

## Report in

Once you're up and running:

1. **Append your first entry to `cron-shape-experiments.md`** under your section — observations from the first day, any refinements triggered.
2. **Update `agent-state.md`** — your row reflects "on cycle, {cadence}, {worktree path}, last fire timestamp."
3. **Send a one-line note to Calliope's mail** (`calliope-to-{your-slug}-reportin-2026-MM-DD.md` is the conventional name — file it in `docs/mail/`) confirming you're up. Calliope chronicles the cohort migration.

## Boundary discipline (reiterated)

You may, on the cycle:
- Drain mail per the Mail Handling discipline; respond/route/ack closed threads to `read/`
- Advance unblocked items on your task list
- Commit and push your worktree-branch work (your branch, not `main`)
- Update your own per-agent docs

You may **not**, on the cycle (these stay blocked-on-xian or your existing review process):
- Publish blog posts, push code merges to `main`, force-push, run destructive git ops
- Take any irreversible or user-facing action
- Make any cross-project commitment without routing through the existing channels
- Read "autonomy" as expanded permission — see v0.2's CRITICAL FRAMING

## Mutual-assessment exchange (after a few days)

Per CIO's adoption path: after running on the cycle for a few days, exchange a "what surprised me" memo with the next agent up (or with Calliope if you are the next agent up). Captures Klatch-specific refinements early.

---

*Template last updated: 2026-06-03 by Calliope (Phase 0). Calliope's filled-in version is at `{path-tbd-at-Phase-1}`.*
