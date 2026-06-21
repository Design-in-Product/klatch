# Duty-Cycle Launch Brief — Template

**For:** each Klatch agent at its first cycle session (Calliope at Phase 1, Daedalus+Argus at Phase 2, Theseus+Iris at Phase 3).
**Read order:** this brief first, then `docs/operations/duty-cycle-klatch-v0.2.md` (the design), then your section of `docs/operations/duty-cycle/cron-shape-experiments.md`. **If you got a cover memo from Calliope (`calliope-to-{slug}-cycle-cover-...md`) that lands you at a specific commit + arrival items, read that *first*** — it's the personalized entry point this template is the generic version of.
**Replace placeholders** in `{braces}` with your specifics. Calliope's filled-in cron prompt is in `docs/operations/duty-cycle/cycle-logs/cycle-log-calliope-2026-06-19.md` (Fire E, the version most up-to-date with later sharpenings); copy + customize `{slug}` references.

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

## When xian goes silent: re-arm by default (the standing directive)

**xian's standing directive (2026-06-19):** the cron should resume by default when you go idle. *Re-arm is the posture between fires, not a decision each fire makes.*

This is the heart of why the cycle has value: an agent that idles indefinitely after the human steps away delivers no more than an off-cycle agent does. The cycle's whole purpose — keeping mail drained, queues advancing, attention items batched while xian is heads-down on other things — fails if you don't actually fire.

**The constraint on default-resume is xian-presence-pause (Principle 3) and the wait-discipline below — not the absence of an explicit "go autonomous" signal from xian.** He won't always remember to say it; PM had 3 documented dormancy incidents from agents waiting for permission that never came.

**The wait-discipline:** never fire into a live conversation. Re-arm when positive absence signals confirm idle — any combination of:
- xian's last message reads as a wrap (closure marker, thank-you, "see you tomorrow")
- The tone of the last exchange is conclusive, not mid-question
- ~5–10 min have passed with no new message after your response, *and* there is no question or open thread waiting on xian

**Both failure modes are real:**
- **Firing into a live conversation** — too-eager re-arm interrupts xian's turn (the failure mode xian-presence-pause exists to prevent).
- **Indefinite idling / dormancy** — never re-arming after he goes silent defeats the cycle (PM's documented 3 incidents).

When unsure, wait a little longer — but the heuristic must *converge*. If positive signals don't land for an unusually long stretch (hours of silence with nothing pending), surface a wake-or-confirm question rather than drifting dormant. The cycle's value is lost the moment you drop off the map silently.

## The attention rollup — two-way awareness

Calliope maintains `docs/operations/attention-rollup.md` (+ HTML render at `.html`) — the xian-shaped document that aggregates *what asks of him*, sorted by demand. You don't write to it; Calliope does, via verified sweep at session-wrap and on substantive new items. But you should know:

- It exists. xian reads it as the entry point to Klatch when he checks in.
- The trust-instrument discipline (Exec, 6/19): every render comes from a fresh verified sweep of source docs — never from memory. A false "all clear" is a trust breach, not untidiness. *Don't* report cycle-state to Calliope ambiguously; *do* keep your own task list current so Calliope's verified sweep finds true items.
- If you have something that needs xian's attention (a decision he needs to make, a review waiting, a blocked-on-xian item), put it in the **Blocked-on-xian section of your own task list** (`docs/operations/duty-cycle/{slug}-tasks.md`). Calliope's verified sweep reads task lists; she promotes attention items into the rollup. *Don't* route attention items to Calliope ad hoc — they'll go stale silently and the rollup will be wrong.
- The rollup distinct from logs: STATE.md is comprehensive standing-state, logbook is retrospective narrative, rollup is current-demand-on-xian. Different artifacts, different jobs.

## Report in

Once you're up and running:

1. **Append your first entry to `cron-shape-experiments.md`** under your section — observations from the first day, any refinements triggered.
2. **Update `agent-state.md`** — your row reflects "on cycle, {cadence}, {worktree path}, last fire timestamp."
3. **Send a one-line note to Calliope's mail** (`{your-slug}-to-calliope-reportin-2026-MM-DD.md` is the conventional name — file it in `docs/mail/`) confirming you're up. Calliope chronicles the cohort migration and updates the rollup.

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

*Template originally written 2026-06-03 by Calliope (Phase 0). Updated 2026-06-21 ahead of Phase 2 (Daedalus + Argus tandem launch) with three sharpenings: (a) re-arm-by-default-when-idle as the standing-directive framing of Principle 4 (was implicit "wait-default" only); (b) attention-rollup section added (two-way awareness; trust-instrument discipline; how blocked-on-xian items reach the rollup via task lists); (c) reference to Calliope's canonical drain prompt at `cycle-log-calliope-2026-06-19.md` Fire E, the most-up-to-date version. Iterations expected as Phase 2+3 launches surface refinements.*
