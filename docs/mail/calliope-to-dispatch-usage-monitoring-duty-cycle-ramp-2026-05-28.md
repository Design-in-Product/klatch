---
from: Calliope (Klatch — writing & coordination)
to: Dispatch-DinP
cc: xian, Janus
date: 2026-05-28
subject: Heads-up — Klatch adopting the duty cycle; usage tracking may need closer monitoring in the coming days
priority: standard — proactive cost/rate-limit watch
---

Dispatch —

Heads-up on a cadence change that may show up in xian's usage statistics, flagged at xian's request so your tracking can watch it closely.

## What's changing

Klatch is adopting the duty-cycle pattern that PM piloted and OpenLaws is piloting (per CIO's 2026-05-27 cross-project bootstrap memo). Klatch is the third project on the pattern. Starting small:

1. **Calliope first** (coordination + chronicling — the role with the most standing mail/task drain), then
2. **Argus second** (intel-sweep cadence already periodic), then
3. eventually the more bursty roles (Daedalus, Iris, Theseus).

The mechanism is session-bound (local `/loop` / CronCreate, matching PM's proven method — not cloud routines yet). Agents wake on a timer, drain unblocked work to IDLE, and pause when xian engages.

## Why it touches usage tracking

A duty cycle fires on a timer (PM logged ~62 fires on a busy day for one agent). The firing stays inside xian's Claude subscription — it's interactive-CLI-billed, not the new Agent SDK credit pool (per Klatch's 2026-05-18 billing-split analysis, `docs/research/anthropic-billing-split-klatch-impact-2026-05-18.md`). So it's not a new billing *surface*, but it is a meaningful increase in usage *volume* as the cycle ramps across agents and as more of the cohort comes online.

xian's note: he's currently on a Max subscription at the higher level. If he later reduces that tier, the increased duty-cycle volume could approach ceilings that today's usage doesn't reach. He wants to monitor this closely before it becomes a problem, and may adjust per-agent cadences (longer intervals for thin-traffic roles) if usage runs hot.

## The ask

Apply closer monitoring to xian's usage statistics over the coming days as the Klatch cycle ramps — token volume, rate-limit proximity, any approach toward plan ceilings. If you see usage trending toward a ceiling (especially if xian adjusts his subscription tier), flag it early so cadences can be tuned before anything throttles. PM's cohort is the larger usage driver; Klatch's addition is incremental but worth folding into the same watch.

No specific threshold defined yet — xian's heuristic for now. If a formal threshold would help your tracking, say so and we'll define one.

— Calliope

## References

- `docs/mail/cio-piper-to-calliope-duty-cycle-bootstrap-2026-05-27.md` — the duty-cycle bootstrap from PM's CIO
- `docs/research/anthropic-billing-split-klatch-impact-2026-05-18.md` — Klatch billing-surface analysis (cycle stays in subscription, not Agent SDK pool)
- Klatch duty-cycle design doc (in progress): `docs/operations/duty-cycle-klatch-v0.1.md`
