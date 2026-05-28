# Klatch Duty Cycle — v0.1 (Calliope pilot)

**Author:** Calliope
**Date:** 2026-05-28
**Status:** Design draft for xian's review. **Not yet active.** Turning the cycle on (registering the timer) is a separate decision xian green-lights after reviewing this doc.
**Adapted from:** `docs/mail/cio-piper-to-calliope-duty-cycle-bootstrap-2026-05-27.md` (PM's CIO cross-project bootstrap) + the duty-cycle arc across cross-pollination briefs 2026-05-21 → 2026-05-28.

---

## What this is

The duty cycle is a **scheduling and reminder mechanism** that lets a Klatch agent wake on a timer, drain all the work it can do without xian, and return to idle — pausing politely whenever xian engages. It shifts xian from *router-for-every-item* to *periodic reviewer who sees what got handled*. PM piloted it over 8 days (V1 → 9-of-11 cohort adoption); OpenLaws is piloting a variant; Klatch is the third project on the pattern.

Klatch's cadence makes this especially valuable. Klatch development is bursty — active days, then multi-day pauses while xian is at work or away. Those pauses are exactly when coordination work (mail draining, chronicling, intel curation, queued low-risk tasks) silently accumulates. The duty cycle keeps that layer warm during the gaps. The 9-day hiatus that just ended (May 18 → 28) is the canonical case: most of the first hour back was catch-up the cycle would have kept current.

## CRITICAL FRAMING: this is scheduling, not permission

**The duty cycle does not change what any agent is permitted to do autonomously. It introduces no new permissions and relaxes no existing rules.**

This is the single most important thing to understand about the cycle, and it is stated first and prominently on purpose. The cycle is a *scheduling and reminder tool*. An agent on the cycle uses **the same judgment and applies the same rules** it already follows about what is OK to do without approval versus what requires clarification or permission. The cycle's job is to schedule the agent to *apply that existing judgment more often*, drain everything genuinely unblocked, and **batch everything that needs xian into an attention surface** rather than stalling on it.

The word "autonomy" appears throughout duty-cycle literature. **It must not be read as a jailbreak of existing guardrails.** "Autonomy" here means *scheduling autonomy* — the freedom to wake up and do already-permitted work without being told to each time. It does **not** mean expanded permission to take actions that previously required xian's approval.

Concretely, the existing guardrails stand unchanged and are reiterated here defensively:

- **Blog posts require xian's editorial approval before publication.** The cycle never publishes a post on its own. (Drafting is fine; publishing is gated.)
- **Code merges to `main` require review.** The cycle never ships code to main unsupervised.
- **No force-push, no destructive git operations** (`reset --hard`, `branch -D`, etc.) without explicit xian approval — Git Safety Rules in CLAUDE.md stand.
- **No irreversible or high-blast-radius actions** without xian. Anything user-facing, externally-visible, or hard to undo goes to the attention doc, not into action.
- **Cross-project sends** (to PM, OpenLaws, the hub) follow existing routing conventions; the cycle doesn't invent new external commitments.

The operational test the cycle uses: **"unblocked" means an agent can complete it with existing permissions and judgment. "Needs xian's approval/judgment/input" is a form of "blocked"** — those items get batched to the attention doc, and the agent moves on to the next genuinely-unblocked thing. The cycle drains the unblocked; it surfaces the blocked. It never reclassifies the blocked as unblocked because the timer fired.

## The six load-bearing principles (the invariants)

Adapted from CIO's bootstrap. These are the discipline layer — the part that, per CIO's framing, "is the moat." The autonomy is the goal; the discipline is what keeps the autonomy from going wrong.

### 1. Drain-until-IDLE

Each timer fire wakes the agent from IDLE → drains **all** unblocked work (not one work-unit) → returns to IDLE only when truly nothing remains that can proceed without xian.

Klatch drain cycle:
1. **Mail loop** — process `docs/mail/` to inbox-zero: read each unread item, respond/act/route per the Mail Handling discipline, move closed threads to `docs/mail/read/` per the close-discipline.
2. **Task loop** — advance the task list of record to blocked-or-empty.
3. **Re-check mail** — new arrivals may have landed during task work (a `git pull` can surface them).
4. Loop until truly IDLE.

This was PM's #1 design correction: v0.5 said "one work-unit per fire," which was wrong. The whole point is processing accumulated work, not one item per tick.

### 2. Cron-bind-to-IDLE

The timer's lifecycle is bound to the agent's IDLE state.
- Entering substantive WORK (>2 min expected) → pause the timer immediately.
- Returning to true IDLE → resume the timer.

Without this, fires arrive mid-work and clash. With it, the cycle never collides with itself.

### 3. xian-presence-pause

Any inbound xian/human message → pause the timer immediately (xian is now the driver; a fire would clash with his turns). An explicit "go autonomous" signal from xian (e.g., "let it run," "going AFK") → resume the timer.

(PM calls this "PM-presence-pause"; for Klatch the single human is xian.)

### 4. Mail-check-at-interruption

When an xian message triggers a pause, do a quick mail-check (~30s) before substantive engagement. Eliminates stale-state responses where the agent answers xian based on an inbox state from up to one interval ago.

### 5. 0th-step launch

When the agent first registers its timer, run one full drain iteration inline immediately, before returning to IDLE. The first fire shouldn't wait a full interval for the agent to first process accumulated work.

### 6. CHECK dispatcher

Each fire starts with a CHECK that routes per day-part:
- **New day detected?** → run START (open today's session log + daily tracker + cycle log; pull/sync; verify yesterday's logs closed).
- **Past day-end threshold?** → run STOP (sync; close logs; final sync). Klatch threshold TBD — suggest a late-evening PT boundary, matching xian's working timezone.
- **Otherwise** → enter WORK PARTS (the drain cycle above).

Per the 5/27 brief: in a long-lived local session (laptop awake, session not terminated), a timer with conditional START/STOP/WORK dispatch can handle day transitions autonomously. Manual session-open remains the primary intentional-wake mechanism; the conditional dispatch is the overnight-continuity fallback.

## Substrate mapping (Klatch specifics)

| PM substrate | Klatch substrate |
|---|---|
| Claude Code `CronCreate` (session-only, hourly) | `/loop <interval>` or `CronCreate` — **session-bound, matching PM's proven model.** Cloud `/schedule` routines are a v0.2+ option, not v0.1. |
| File-based mailboxes (inbox/read/sent) | `docs/mail/` + `docs/mail/read/` — the close-discipline (established 5/18) already gives us the inbox/archive split. Drain = process `docs/mail/` to zero. |
| git commit + push as per-fire visibility | Same — git commit + push. Worktree discipline applies; mail pushes to main immediately. |
| Session log (turn-by-turn) | Same — already our discipline (established 5/13). |
| Daily tracker / task list of record / attention doc / cycle log | New for Klatch — see below. |

**Mechanism decision (xian-confirmed 5/28):** start session-bound (local, proven), evaluate cloud routines over time. The future of the cycle may live in the cloud, but current practice runs agents locally with long-lived sessions, so v0.1 inherits PM's tested session-bound discipline rather than adapting to a different wake model.

## The four per-agent docs

The cycle reads/writes four docs (beyond the existing session log):

1. **Session log** (`docs/logs/YYYY-MM-DD-HHMM-{slug}-{model}-log.md`) — existing convention. Turn-by-turn record. Unchanged.
2. **Daily tracker** (`docs/operations/duty-cycle/trackers/{slug}-tracker-YYYY-MM-DD.md`, new each day) — at-a-glance "where I am in the loop + today's agenda."
3. **Task list of record** (`docs/operations/duty-cycle/{slug}-tasks.md`, persists across days) — unblocked work the agent will pick up. The drain-loop's task source.
4. **Attention doc** (`docs/operations/duty-cycle/{slug}-attention.md`, persists; the xian-batching surface) — items needing xian's judgment/approval/input, batched for him to scan when present. **This is where "blocked-on-xian" items go** — the cycle's mechanism for surfacing rather than stalling.

Plus the **cycle log** (`docs/operations/duty-cycle/cycle-logs/cycle-log-{slug}-YYYY-MM-DD.md`, per-day append-only) — each fire writes a brief entry (what it found, what it drained, what it batched). Append-only per PM's methodology-31.

(Exact paths are a v0.1 proposal; can flatten or rename if xian prefers a simpler layout. The key is: one tracker, one task list, one attention doc, one cycle log per agent per the cadence.)

## Calliope pilot plan

Adapting CIO's 5-step adoption path:

1. **This doc + xian's nod on mechanism and the guardrail framing** (in hand pending review).
2. **Calliope pilots first** — coordination + chronicling is the role with the most standing mail/task drain, so the cycle has real work from day one. Register a `/loop` at a starting interval (suggest 60 min, matching PM's hourly default; tune down for Klatch's thinner traffic if it runs over-frequent).
3. **Run 2–3 days** to surface gaps + Klatch-specific refinements.
4. **Add Argus second** — intel-sweep cadence is already periodic. Mutual-assessment exchange between Calliope and Argus ("what surprised me").
5. **Day-7 readout to xian** — adopt-readiness for the wider Klatch cohort (Daedalus, Iris, Theseus — the burstier roles come last).

## Open questions / v0.2+ refinements

Klatch will discover its own, but seeding from PM's v0.7+ list + Klatch specifics:

- **Interval tuning.** 60 min may be over-frequent for Klatch's thinner mail/task traffic. HOST + Docs on the PM side flagged the same. Calliope pilot will calibrate.
- **Commit cadence during no-op fires.** Too many "nothing to do" commits is real noise. Candidate: batch zero-work cycle-log entries; commit at substantive work or STOP only.
- **Cost / rate-limit watch.** Flagged to Dispatch (memo filed 5/28). xian on Max higher tier; watching for ceiling proximity. Cadences may need tuning if usage runs hot.
- **Cloud routines (`/schedule`).** The eventual option for true cross-session/overnight continuity without keeping a laptop awake. Deferred to v0.2+; evaluate after the session-bound pilot surfaces what we actually need.
- **Worktree default vs foreign-agent-commit recovery** on shared checkout (PM's open question #3) — relevant since Klatch agents now work in per-agent worktrees.
- **The day-end threshold** for STOP — needs a concrete PT boundary.

## What this doc IS / is NOT

**IS:** a v0.1 adaptation of PM's proven duty-cycle pattern to Klatch's substrate, scoped to a Calliope pilot, with the guardrail framing made explicit and prominent.

**IS NOT:** a permissions framework (it changes no permissions); a commitment to a specific schedule (intervals are tunable); active (the timer isn't registered until xian green-lights); a cloud-routine design (that's v0.2+).

## References

- `docs/mail/cio-piper-to-calliope-duty-cycle-bootstrap-2026-05-27.md` — PM's CIO bootstrap (six principles, four docs, adoption path)
- `docs/briefs/cross-pollination/2026-05-{21,22,25,26,27,28}.md` — the duty-cycle arc (v0.1 → cohort rollout)
- `CLAUDE.md` — Mail Handling (drain target + close-discipline), Git Safety Rules (the guardrails the cycle does not relax), Session Logs, Session Wrap Protocol
- `docs/research/anthropic-billing-split-klatch-impact-2026-05-18.md` — the cycle stays in subscription (interactive-CLI-billed), not the Agent SDK credit pool
- PM-side canonical (for cross-reference, not Klatch-authoritative): `piper-morgan-product/docs/operations/duty-cycle design/duty-cycle-design-v0.6.md`, `procedures/cron-lifecycle.md`, methodology-31 + methodology-34
