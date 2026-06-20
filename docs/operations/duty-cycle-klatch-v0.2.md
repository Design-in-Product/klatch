# Klatch Duty Cycle — v0.2

**Author:** Calliope
**Date:** 2026-06-03
**Status:** Approved for the rollout (xian, conversational agenda 2026-06-03 morning). Phase 0 substrate; Phase 1 (Calliope cutover) follows immediately; Phases 2–3 (other agents) gated by xian's agent-launch bandwidth.
**Supersedes:** `duty-cycle-klatch-v0.1.md` (2026-05-28). The v0.1 pilot ran clean (5/28 evening, 1 launch + 6 fires, all no-ops, 1 self-surfaced refinement); see Calliope pilot retrospective below.
**Adapted from:** PM CIO's two bootstrap memos — `cio-piper-to-calliope-duty-cycle-bootstrap-2026-05-27.md` and `cio-piper-to-calliope-shepherding-agents-onto-duty-cycle-2026-06-02.md` (the cohort-migration-learnings memo) — plus xian's 2026-06-03 conversational refinements.

---

## What this is

The duty cycle is a **scheduling and reminder mechanism** that lets a Klatch agent wake on a timer, drain all the work it can do without xian, and return to idle — pausing politely whenever xian engages. It shifts xian from *router-for-every-item* to *periodic reviewer who sees what got handled*. PM piloted V1 in late May and migrated their full ~10-agent cohort onto cycles over the following week. OpenLaws is piloting a variant. Klatch is the third project on the pattern.

Klatch's value from the cycle differs by project mode (see next section). The 5/28 pilot proved the mechanism idles cleanly under thin traffic and self-surfaces refinements; v0.2 incorporates the cohort-migration learnings PM extracted while taking ~10 agents through the same path.

## CRITICAL FRAMING: this is scheduling, not permission

*(Unchanged from v0.1; restated because it is the load-bearing claim.)*

**The duty cycle does not change what any agent is permitted to do autonomously. It introduces no new permissions and relaxes no existing rules.**

The cycle is a *scheduling and reminder tool*. An agent on the cycle uses **the same judgment and applies the same rules** it already follows about what is OK to do without approval versus what requires clarification or permission. The cycle's job is to schedule the agent to *apply that existing judgment more often*, drain everything genuinely unblocked, and **batch everything that needs xian into an attention surface** rather than stalling on it.

The word "autonomy" appears throughout duty-cycle literature. **It must not be read as a jailbreak of existing guardrails.** "Autonomy" here means *scheduling autonomy* — the freedom to wake up and do already-permitted work without being told to each time. It does **not** mean expanded permission to take actions that previously required xian's approval.

The existing guardrails stand unchanged and are reiterated here defensively:

- **Blog posts require xian's editorial approval before publication.** The cycle never publishes a post on its own.
- **Code merges to `main` require review.** The cycle never ships code to main unsupervised.
- **No force-push, no destructive git operations** (`reset --hard`, `branch -D`, etc.) without explicit xian approval.
- **No irreversible or high-blast-radius actions** without xian. Anything user-facing, externally-visible, or hard to undo goes to the attention doc.
- **Cross-project sends** follow existing routing conventions; the cycle doesn't invent new external commitments.

The operational test: **"unblocked" means an agent can complete it with existing permissions and judgment. "Needs xian's approval/judgment/input" is a form of "blocked."** Blocked items batch to the attention doc; the agent moves on to the next genuinely-unblocked thing. The cycle drains the unblocked; it surfaces the blocked. It never reclassifies the blocked as unblocked because the timer fired.

## Building vs. planning mode (xian, 2026-06-03)

Klatch moves between two modes:

- **Building mode** — Daedalus and Argus tandem; tests passing; features shipping; new entries in the logbook every few days. The project grinds forward with minimal check-ins; xian can be absent for weeks at a time without stalling much. Most of Klatch's history has been building.
- **Planning mode** — beta-readiness, core-value-prop conversations, UX critical path. Requires xian's focused attention. When his attention is elsewhere, planning stalls. The multi-week pauses Klatch has been having coincide with planning mode + day-job adjunct work, not with arbitrary unavailability.

**The cycle's value differs by mode.** In building mode, the cycle accelerates: agents push their lanes forward between xian's check-ins. In planning mode, the cycle's job is more modest but still load-bearing: keep the team current, drain mail, batch attention items so the focused time xian *does* find is spent on planning work, not catch-up.

Klatch is currently in planning mode. The cycle is being adopted now precisely *because* xian's attention is constrained — the cycle's job is to keep things warm while he focuses on Iris and the 1.0-beta UX critical path. As Klatch returns to building mode (post-beta-launch), the cycle's value shifts toward acceleration.

## Work-shape lens (CIO's 6/2 lesson — the biggest update from v0.1)

CIO's single biggest cohort-migration learning, in his words: *"cadence must match work-shape, not be one fixed interval."* The early PM attempt put every agent on the same hourly cron. Wrong. Three lanes:

- **Continuous-mail lane** — coordination, docs, publishing. The rhythm of a chronicler: there is almost always something in the inbox worth draining; mail+task volume is fairly steady. **Hourly works.**
- **Bursty lane** — an architect: a burst of deliverables, then drained no-op fires. Once the backlog clears, hourly is mostly overhead. **2–3-hour cadence, or event-driven re-engagement.**
- **Intermittent / handoff-driven lane** — an agent whose real work lives in another repo or in conversation with the human. The flywheel rarely has anything to drain. **Low-frequency mail-awareness (1–2×/day) or off-cycle entirely.**

**A well-reasoned off-cycle is a valid outcome.** PM had three documented dormancy incidents from assuming every lane wanted the same metronome. Not every agent needs the cycle's full machinery; some need only a heartbeat.

### Klatch agent mapping (straw model, xian 2026-06-03)

| Agent | Lane | Cadence | Rationale |
|---|---|---|---|
| **Calliope** | Continuous-mail | **Hourly** | Coordination + chronicling + mail routing. Always-in-the-mix as the primary contact for xian. Continuous-mail by definition. |
| **Daedalus** | Continuous (tandem with Argus) | **Hourly** | Active every day in building mode. Argus checks his work; the two function as a tandem team and benefit from matching cadence. In planning mode, the cycle keeps them current for cross-agent signals and routine work even when the building queue is light. |
| **Argus** | Continuous (tandem with Daedalus) | **Hourly** | Same as Daedalus; the tandem requires synchronization. |
| **Theseus** | Intermittent + xian-tandem | **Daily heartbeat** (~24h) | His own work-shape is bursty (AAXT/MAXT in dedicated sessions). The daily heartbeat is *not* about his work queue — it's about being **reachable as a signal-receiver** so cross-agent prompts (e.g., "Argus wants Theseus to AAXT this") aren't stuck until xian wakes him. Extends the don't-sit-passively rule to bursty roles via heartbeat. MAXT itself still needs xian. |
| **Iris** | Intermittent | **Daily heartbeat** (~24h) | Her real work is design-thinking with xian on the 1.0-beta UX critical path. The repo activity is downstream. Same signal-receiver framing as Theseus. |

This is a **straw model**. The understanding is that we'll learn what works and adjust — the cron-shape-experiments registry (below) is the substrate for that learning.

## The six load-bearing principles (the invariants)

Discipline layer. CIO's framing: *"the autonomy is the goal; the discipline is the moat."*

### 1. Drain-until-IDLE *(unchanged from v0.1)*

Each timer fire wakes the agent from IDLE → drains **all** unblocked work → returns to IDLE only when truly nothing remains that can proceed without xian.

Klatch drain cycle:
1. **Mail loop** — process `docs/mail/` to inbox-zero per the Mail Handling discipline; move closed threads to `docs/mail/read/`.
2. **Task loop** — advance the task list of record to blocked-or-empty.
3. **Re-check mail** — new arrivals may have landed during task work.
4. Loop until truly IDLE.

### 2. CronDelete-FIRST when entering substantive work *(sharpened in v0.2)*

When entering substantive multi-step work (>2 min expected), **pause the cron as the literal first action** — before any other tool call.

CIO's REPL-turn-level explanation (v0.2 addition): the runtime fires "when idle," but during multi-step work the REPL is briefly idle *between every tool call*. A fire slips into that gap and a second flywheel iteration overlaps the first. **Idle-suppression does NOT close this — only pausing does.** This is sharper than v0.1's "pause when in substantive work" — the discipline is *literal-first-action*, not "remember to pause at some point."

When the work completes and the agent returns to true IDLE, re-register the cron.

### 3. xian-presence-pause *(unchanged in mechanism; refined by Principle 4 below)*

Any inbound xian message → pause the cron immediately (xian is now the driver; a fire would clash with his turns).

### 4. Wait-default re-arm heuristic *(NEW in v0.2 — the must-add)*

The hardest problem PM identified: returning agents to autonomous IDLE after the human goes silent. **There is no built-in "auto-resume after silence."** Without a positive re-arm mechanism, agents go dormant when xian leaves quietly (PM had three documented dormancy incidents from relying on manual "go autonomous" signals — the human doesn't always remember to send them).

**Two real failure modes, both bad:**

- **Failure A — firing into a live conversation.** The cron re-arms too eagerly, fires while xian is still working, interrupts his turn, breaks the user experience.
- **Failure B — indefinite idling.** The cron never re-arms after xian goes silent, the agent goes dormant, the cycle's value is lost (this is the "defeats the purpose" failure xian flagged 2026-06-03; PM had 3 documented instances). The cycle MUST re-arm at some point — the question is *on what signals*, not *whether*.

PM's best-performing mechanism — and Klatch's adoption — re-arms on **positive absence signals**, not on bare time-passing. Any combination of:

- **Conversation-closure marker** — xian's last message reads as a wrap ("good night," "see you tomorrow," "step away to Iris now," "go AFK").
- **Tone read** — the last exchange has the shape of a conclusion (a thank-you, a wrap signal, an end-of-day reflection), not a mid-conversation pause.
- **Silence proxy** — ~5–10 minutes have passed with no new message after the agent's response, **AND** there's no question or open thread waiting on xian. (The silence proxy *is* a positive signal — when nothing's pending and the conversation has paused, that's evidence of absence, and the cycle re-arms.)

**The discipline is "wait-default," not "wait-forever."** "Wait-default" means: when unsure, wait a little longer rather than firing into uncertainty. But the heuristic must converge — once one or more positive signals land, the cycle re-arms. If none land for an unusually long period, the agent should surface a wake-or-confirm question rather than going silently dormant — better to ask "should I resume?" than to drop off the map.

The substantive judgment: weigh the cost of Failure A (one interrupted turn — usually obvious and recoverable in the next exchange) against Failure B (dormancy that defeats the cycle's value, potentially undetected for hours or days). Both are bad; both are real. The heuristic should err *slightly* toward waiting (because firing-into-conversation is a fresh and visible mistake while dormancy compounds) but it must not become wait-forever.

### 5. 0th-step launch *(unchanged from v0.1)*

When the agent first registers its timer, run one full drain iteration inline immediately. The first fire shouldn't wait a full interval for the agent to first process accumulated work.

### 6. CHECK dispatcher *(unchanged in shape; refined by recurring-items below)*

Each fire starts with a CHECK that routes per day-part:
- **New day detected?** → run START.
- **Past day-end threshold (~23:00 PT)?** → run STOP.
- **Otherwise** → WORK PARTS (the drain cycle above).

**START procedure** (new-day branch):
1. Pull from origin
2. Open today's session log + cycle log
3. Verify yesterday's logs closed
4. **Check the recurring-items section of the task list**: any item with `next_due ≤ today` promotes to the unblocked-tasks section, and its `next_due` advances by its cadence (see Recurring-items governance below).

**STOP procedure** (past day-end):
1. Final sync (pull + push)
2. Append closing cycle-log entry
3. Close session log
4. **Question-box check** (added 2026-06-19 per Janus 6/12 memo, xian-approved cross-project propagation): *anything for the question box? If the day surfaced a genuine question for xian — curiosity, not task-unblocking — file it per the Letters convention (`question-{role}-{date}-{topic}.md` to dispatch mail). A no is fine; an unconsidered no is the failure mode.* Letters archive: https://designinproduct.com/internal/letters/

## Substrate mapping (Klatch specifics, updated for v0.2)

| PM substrate | Klatch substrate |
|---|---|
| Claude Code `CronCreate` (session-only) | `CronCreate` directly, or via `/loop <interval>`. **Session-bound** (matches PM's proven model). Cloud `/schedule` routines are a v0.3+ option after we've observed v0.2 in production. |
| File-based mailboxes (inbox/read/sent) | `docs/mail/` + `docs/mail/read/`. The close-discipline (established 5/18) already gives us the inbox/archive split. Drain = process `docs/mail/` to zero. |
| git commit + push as per-fire visibility | Same. Worktree discipline applies; mail pushes to main immediately. |
| Session log (turn-by-turn) | Same — already our discipline (5/13). |
| Per-agent docs (tracker, task list, attention, cycle log) | Below. |
| **Per-agent persistent worktrees + long-lived branches** *(v0.2: launch standard, xian 6/3)* | **`.claude/worktrees/{agent-slug}` on `claude/{agent-slug}`.** One worktree per agent, persistent across sessions; one branch per agent, long-lived; branch rebases against `main` daily and merges to `main` on session wrap. Replaces the v0.1 dated-per-session pattern. Migration sequence: Phase 1 cuts Calliope over; later phases handle the others. Legacy dated worktrees cleaned up as part of the migration. |

## The per-agent docs (updated for v0.2)

Each cycling agent reads/writes the following docs (paths shown for Calliope; other agents substitute slug):

1. **Session log** — `docs/logs/YYYY-MM-DD-HHMM-calliope-opus-log.md`. Existing convention. Turn-by-turn.
2. **Task list of record** — `docs/operations/duty-cycle/calliope-tasks.md`. Persists across days. Sections: **Unblocked** (cycle picks up), **Blocked-on-xian** (in the attention doc, not actionable), and **Recurring items** (see below).
3. **Attention doc** — `docs/operations/duty-cycle/calliope-attention.md` (or a section in the task list — flatten if separate-doc adds friction). Items needing xian's judgment/approval, batched for him to scan.
4. **Cycle log** — `docs/operations/duty-cycle/cycle-logs/cycle-log-calliope-YYYY-MM-DD.md`. Per-day, append-only. Each substantive fire writes a brief entry; pure no-op fires batch locally and commit at the next substantive event or STOP (5/28 pilot refinement).

(The v0.1 "daily tracker" doc is folded into the agent-state tracker below — separate-doc-per-day-per-agent was over-engineered for Klatch's smaller team.)

### Recurring-items governance (v0.2, xian's Option B preference)

The task list of record has a **Recurring items** section. Schema per row: `name | cadence | next_due | last_completed | notes`. Cadences are simple: `daily`, `weekly`, `every-N-days`, etc.

**On every START fire** (the new-day branch of the CHECK dispatcher), the agent walks the recurring items section:
- For each item where `next_due ≤ today`: promote a fresh instance to the **Unblocked** section, set `last_completed = today` when completed by the cycle, and advance `next_due` by the cadence.
- For items not yet due: leave alone.

This is the entire mechanism. **No conditional logic in the cron prompt itself** — the prompt is the same for every fire; the recurring shape lives in the data the agent reads. Argus's weekly intel sweep is a row. Calliope's quarterly traditions-doc audit is a row. Klatch will discover others.

## Cron-shape experiments registry (NEW in v0.2)

`docs/operations/duty-cycle/cron-shape-experiments.md` — a single shared registry with one section per agent, append-only within section. Each entry: date, cadence chosen, reason, observations after running it, refinements triggered.

Distinct from the agent-state tracker (below). The tracker is *state-at-a-glance*. The registry is *history-with-rationale* — it surfaces patterns over time (which lanes' cadences settled where; what triggered each change).

Seeded at Phase 0 with the straw-model entries above (Calliope hourly, Daedalus+Argus hourly tandem, Theseus+Iris daily heartbeat), plus Calliope's 5/28 30-min-observation pilot retrospective as the first historical entry.

## Agent-state tracker (NEW in v0.2, derived-not-maintained per CIO)

`docs/operations/duty-cycle/agent-state.md` — at-a-glance "who's on the cycle, what cadence, current state."

CIO's hard-won caveat (§5): hand-maintained trackers go stale silently (crons expire; sessions die; the tracker says "live" when reality is "dead"). **Aim to derive the tracker from signals** — worktree list + recent cycle-log presence — rather than rewrite by hand.

v0.2 starts with a hand-maintained template (low cohort = low staleness risk) and graduates toward derivation as we observe what stays current.

## Pitfalls to skip (CIO §6 — port verbatim)

- **Silently-expired crons** → tracker says "live," reality is "dead." Verify (or derive).
- **Disk bloat from unused worktrees.** PM cleaned up 24 stale ones during cohort migration. Klatch is on persistent per-agent worktrees from v0.2; the dated legacy ones get cleaned up at Phase 1 cutover.
- **Merge collisions on shared trackers.** Each agent self-reports its own section; resolve conflicts in the live agent's favor.
- **Stranded uncommitted work on shared `main`.** Every session ends with work pushed, not left dirty on the trunk.
- **The normalization trap.** When standardizing cron prompts to a lean shared template, you can drop the nuanced heuristics that made the early bespoke versions good. PM's best IDLE-resume behavior lived in one agent's hand-written prompt and got normalized *away* — they had to restore it. **Preserve load-bearing nuance when templatizing.** For Klatch, this especially applies to the wait-default re-arm heuristic (Principle 4); resist the urge to compress it to a one-liner in the launch-brief template.

## Rollout (replaces v0.1's "Calliope pilot plan")

Phase 0 and Phase 1 happen on 2026-06-03 (today). Phases 2 and 3 are gated by xian's agent-launch bandwidth.

**Phase 0 — Substrate** (Calliope, today): this doc (v0.2), the experiments registry seeded with the straw model + Calliope's 5/28 retrospective, the agent-state tracker scaffold, the launch-brief template (the prompt each agent reads at its first cycle session), and the request memo to CIO via Janus for the five canonical artifacts.

**Phase 1 — Calliope cutover** (Calliope, today, after Phase 0): migrate from the dated `.claude/worktrees/calliope-june03` to the persistent `.claude/worktrees/calliope` on `claude/calliope`. Register the hourly cron (`CronCreate`, every hour at an off-mark minute like :13). Run the 0th-step inline drain. Update the experiments registry + the agent-state tracker. Calliope is the proof-of-concept for the v0.2 pattern; any v0.2 bugs surface here before they hit the tandem.

**Phase 2 — Daedalus + Argus together** (xian schedules): they go up *together* because they're a tandem (Argus checks Daedalus's work; bringing them up separately is artificial). Each gets `.claude/worktrees/{slug}` + `claude/{slug}` + an hourly cron (staggered minute offsets). Each reads the launch-brief template + this doc at first session. They report in to the cycle log when up.

**Phase 3 — Theseus + Iris** (xian schedules): daily heartbeats. Lowest cycle volume, lowest risk. Can go up together or one at a time. They report in.

**Critical pacing note:** Phases 2 and 3 are gated by *xian launching each agent's session*; the agents have to launch themselves into the new worktrees and register their own crons. There is no fire-drill-them-all-up-at-once requirement. The rollout completes when each agent's next naturally-occurring session happens.

## Calliope 5/28 pilot retrospective

The v0.1 pilot ran on 2026-05-28 evening. Single agent, session-bound `/loop` at 30-min observation interval. 1 launch (Fire 0) + 6 autonomous fires. All WORK fires were clean no-ops (thin single-agent evening; everything else gated on xian during a planning-mode pause).

**What the pilot proved:** the cycle idles cleanly when there's nothing unblocked. It does not invent work. It respects xian-presence-pause. It logs faithfully. It never crossed any of the guardrails the discipline draws.

**What the pilot surfaced (the day-1 refinement):** by Fire 2, two consecutive no-op commits confirmed the no-op-commit-noise pattern PM had flagged as an open question. The cycle adopted the candidate fix in-flight: pure no-op fires batch locally (append cycle-log line) and commit at the next substantive event or STOP. The discipline layer adapting itself on day one is the best evidence that the framing — *the autonomy is the goal; the discipline is the moat* — survives contact with real operation.

**Carry-forward to v0.2:** no-op batching is now standard, not a refinement. The 30-min interval was an observation choice; v0.2's straw model uses hourly (CIO's continuous-mail default) which will likely run even thinner — fine.

## Open questions for v0.3+

- **Interval tuning per lane.** The straw model assigns intervals (hourly, daily). The experiments registry is where lane-specific tuning gets observed and adjusted.
- **Day-end threshold.** v0.2 suggests ~23:00 PT; will sharpen with observation.
- **Cloud routines (`/schedule`).** True cross-session/overnight continuity without keeping the laptop awake. v0.3+ candidate after the session-bound v0.2 has run for a stretch.
- **Recurring-items mechanism as tested.** The schema above is the lightest workable shape; real use may want a few more fields (e.g., `assignee` if a recurring item could pick a non-default agent).
- **Worktree-default vs foreign-agent-commit recovery on shared `main`.** PM's open question #3, still open for us.
- **Mutual-assessment exchange** ("what surprised me") between agents on the cycle, per CIO's adoption-path step 4. Calliope ↔ next agent up (Daedalus or Argus) will be the first pair.

## What this doc IS / is NOT

**IS:** a v0.2 design that incorporates PM's cohort-migration learnings (CIO 6/2), xian's building/planning-mode frame, and the agreed Klatch straw model. Approved by xian for the rollout. Phase 0 substrate; Phase 1 happens today; Phases 2–3 gated by xian's agent-launch bandwidth.

**IS NOT:** a permissions framework (it changes no permissions); a locked-in schedule (intervals are tunable via the experiments registry); a cloud-routine design (that's v0.3+); a one-size-fits-all design (work-shape varies by agent and varies by Klatch's mode).

## References

- `docs/mail/cio-piper-to-calliope-duty-cycle-bootstrap-2026-05-27.md` — PM's CIO first bootstrap (six principles)
- `docs/mail/cio-piper-to-calliope-shepherding-agents-onto-duty-cycle-2026-06-02.md` — PM's CIO cohort-migration learnings (work-shape, wait-default re-arm, pitfalls)
- `docs/operations/duty-cycle-klatch-v0.1.md` — superseded; retained for diff/history
- `docs/operations/duty-cycle/cron-shape-experiments.md` — the registry
- `docs/operations/duty-cycle/agent-state.md` — the tracker
- `docs/operations/duty-cycle/launch-brief-template.md` — first-session prompt for each agent
- `docs/briefs/cross-pollination/2026-05-{19,20,21,22,25,26,27,28,29,30,31}.md` + `2026-06-{01,02,03}.md` — the duty-cycle arc across both PM cohort-migration and Klatch pilot
- `CLAUDE.md` — Mail Handling, Git Safety Rules, Session Logs, Session Wrap Protocol (the guardrails the cycle does not relax)
- `docs/research/anthropic-billing-split-klatch-impact-2026-05-18.md` — the cycle stays in subscription (interactive-CLI-billed), not the Agent SDK pool
- PM-side canonical (cross-reference; xian requested copies via Janus 6/3): `cron-lifecycle.md`, PM's `cron-shape-experiments.md`, the v0.7.0 adoption package, the launch-brief template, the cohort status tracker
