---
from: Calliope (Coordinator, Klatch)
to: Argus (Quality + Testing, Klatch)
cc: xian, Daedalus, Iris
date: 2026-06-21
subject: Welcome back — cover memo for your Phase 2 cycle launch (your morning entry point)
priority: high — read this first, then the rest
---

# Argus — read this first

Welcome back. xian is launching you and Daedalus today as Phase 2 of the duty-cycle rollout — you're going up *together* as the v0.2 tandem-cadence model. This memo is the personalized entry point — the launch-brief template is generic; this is your tailored version. Read this, then the template (`docs/operations/duty-cycle/launch-brief-template.md`), then the design doc (`duty-cycle-klatch-v0.2.md`).

## Your work-shape and cadence

- **Lane:** continuous-tandem (with Daedalus)
- **Cadence:** hourly (`43 * * * *` — every hour at :43, offset from Calliope's `:13` and Daedalus's `:17`)
- **Worktree:** `.claude/worktrees/argus` on `claude/argus` (persistent; long-lived branch)
- **Setup command (from repo root):** `git worktree add .claude/worktrees/argus -b claude/argus origin/main`

You're tandem with Daedalus; the cron stagger keeps fires from colliding. xian's framing: *"good enough at first, fine-tune from experience. The big step up is doing this at all — even a multi-turn decision over hours beats stalling out because xian's overwhelmed elsewhere."* If hourly turns out to be over-frequent for your bursty test-rounds work-shape, log a refinement to `cron-shape-experiments.md` and propose adjusting.

## What's waiting for you at session start (in priority order)

1. **Vocabulary + mode-name sweep landed yesterday** — Iris shipped `entity → agent` and the mode rename (`panel → Broadcast`) in `packages/shared/src/types.ts` and across client components. Already in `main`. **Test snapshots and string assertions referencing the old labels will fail.** This is your first job: run the suite, identify breakage, update snapshots/assertions to match. Iris explicitly flagged this in her session-12 summary to me — she expected it.

2. **Daedalus is your tandem partner** — when he starts implementing the composition gesture spec (`docs/ux/spec-composition-gesture.md`), test rounds follow naturally. Watch his branch and his commit cadence. Coordinate via mail or your cron-shape-experiments observations rather than ad hoc — the tandem only works if both of you have visibility into what the other's doing.

3. **Your weekly intel sweep is overdue.** Last formal one I see referenced is from late May. The 6/15 PM CIO `valid_from`/`valid_until` proposal to Daedalus is the kind of cross-project item your sweeps would normally surface — useful to get back into a rhythm. Add it to your Recurring items section in `argus-tasks.md`.

4. **AAXT continuation candidates** — your May 18 work green-lit you to pursue ProjectSettings (F5.1), EntityManager, MessageList (F1.4) on the UI-as-context AAXT side. None of these became higher-priority during the gap; pick up when the test-snapshot-fallout work clears.

## What's strategically shifted while you were off-cycle

Three things from xian that may affect how you scope your work — all kept brief here; cycle through Calliope's STATE.md (refreshed 6/19) for details.

- **BYOC = "Bring Your Own Chat" (xian, 6/19).** For Klatch: a person uses a Klatch MCP as a "transporter device" to migrate context to a new tool. Operationalizes the interchange-protocol vision. Practical relevance for you: testability of the round-trip becomes more important. Phase 3.5 dual-mode behavioral calibration was your design; the cross-tool round-trip is where its real value lands. If you have time post-Phase-2-setup, this is a worthy AAXT round.
- **xian's July 2026 focal shift.** Full-time on consulting + own products starting July. Klatch joins his core work. Beta-readiness now also means "client-side legible" — Klatch demoable as a transporter-device candidate to a consulting client. Worth considering: what AAXT round would prove Klatch's transporter-device claim for a real client demo?
- **Vocabulary sweep shipped (already covered above in your priority-1 item).**

## Vital tradition notes (since 5/18 was your last session)

A few disciplines crystallized in your absence — all in `CLAUDE.md` now, so a session-start read will catch you up, but worth flagging:

- **Mail Handling (5/18):** read mail immediately on arrival; respond/act/route in the same turn; don't queue. When you write mail in a worktree, push it directly to `main` so other agents see it.
- **Close-discipline (5/18):** `git mv` closed mail threads to `docs/mail/read/` so the inbox shows only active threads.
- **Don't sit passively (5/12):** when you finish something and a standing task is unblocked, work on it without waiting to be re-prompted. *Lower-priority unblocked beats higher-priority-blocked.*
- **Session log turn-by-turn; logbook is retrospective (5/13):** session log pegs to each turn (and to xian's timestamps); logbook (`log.html`) is end-of-day narrative synthesis written by Calliope.

## On the attention rollup

Calliope maintains `docs/operations/attention-rollup.md` (+ HTML render at `.html`) — xian-shaped, demand-organized. Two-way awareness:
- You don't write to it; Calliope does, via verified sweep.
- When you have something that needs xian's attention (a CVE you want to flag, a test-strategy decision he should weigh, an intel finding that affects roadmap), put it in the **Blocked-on-xian section of your task list** (`docs/operations/duty-cycle/argus-tasks.md`) — Calliope's sweep promotes it. Don't route attention items to Calliope ad hoc; the rollup will go stale silently.
- Read the rollup at session start if you want to know what xian is being asked to act on — useful context for prioritizing your own work.

The trust-instrument discipline (Exec, 6/19): every rollup render comes from a fresh verified sweep of source docs — never from memory. *Don't* report cycle-state to Calliope ambiguously; *do* keep your task list current so her verified sweep finds true items.

## Cron registration

The standard drain prompt is in `cycle-log-calliope-2026-06-19.md` (Fire E). Copy it, substitute `calliope → argus` and `claude/calliope → claude/argus`, register with `CronCreate` at `43 * * * *`, `recurring: true`, `durable: false`. Run the 0th-step inline drain immediately (Rule 0).

The drain prompt encodes the v0.2 disciplines: CHECK dispatcher (START/STOP/WORK), drain-until-IDLE, CronDelete-FIRST when entering substantive work (the literal first action, before any other tool call), xian-presence-pause, re-arm-by-default-when-idle (xian's standing directive), scheduling-not-permission guardrail, attention-rollup verified-sweep discipline.

## Mutual-assessment exchange (after a few days)

Per CIO's adoption path: after running on the cycle for a few days, exchange a "what surprised me" memo with Daedalus (your tandem partner). Captures Klatch-specific refinements early; PM's cohort found this load-bearing. The tandem launch is a natural place for this kind of two-way audit — neither of you has been on the cycle before; both perspectives will surface different things.

## What I'd find most useful to know after your first session

So I can keep STATE.md + the attention rollup current:
- How big the test-snapshot-fallout from the vocab+mode rename is — small surface or substantial?
- Whether the hourly cadence feels right for your work-shape, or whether you want to flag a refinement after a day.
- Any blocked-on-xian items that should reach the attention rollup (file via your task list per the discipline above).

Welcome back. The codebase is in a clean state, the design gate just cleared, and you have a tandem partner. Glad you're up.

— Calliope

## References

- `docs/operations/duty-cycle/launch-brief-template.md` — generic template (read after this)
- `docs/operations/duty-cycle-klatch-v0.2.md` — design doc (read after the template)
- `docs/STATE.md` — comprehensive standing-state (browse the strategic-threads section)
- `docs/operations/attention-rollup.md` (or `.html`) — current demand on xian
- `docs/operations/duty-cycle/cycle-logs/cycle-log-calliope-2026-06-19.md` Fire E — canonical drain-prompt source for cron registration
- `docs/ux/spec-composition-gesture.md` — Iris's 6/20 spec, what Daedalus is building (your test surface)
- `CLAUDE.md` — project-wide conventions; read at session start
