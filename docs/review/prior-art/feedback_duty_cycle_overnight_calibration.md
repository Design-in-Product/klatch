<!-- PROVENANCE: pre-migration Klatch memory pool, recovered from faoilean 2026-08-12
     (~/.claude/projects/-Users-xian-Development-klatch/memory/feedback_duty_cycle_overnight_calibration.md, staged via klatch-inbound).
     Committed verbatim as primary source for the Question A duty-cycle review. -->
---
name: duty-cycle-overnight-calibration
description: How to run the overnight duty cycle — sparse cadence + which work waits for fresh context
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 46a4104f-6b07-4c4b-9912-b78b91498375
---

xian's calibration of the overnight duty cycle (2026-06-22 morning, after the first full overnight autonomous run):

**Cadence — overnight watch can be sparse.** "You can take a longer watch overnight, with as few as one check between the evening and the next morning." So when re-arming the cron at an evening handoff, do NOT use hourly-all-night (`17 * * * *`) — that burns a full marathon-context reload per fire on guaranteed no-ops while xian sleeps. Use a sparse-overnight + hourly-waking shape, e.g. `17 3,7-23 * * *` (one ~3am check + hourly 7am–11pm). xian's own message and cohort mail still reach the live session directly regardless of cron cadence, so a wide overnight gap costs almost nothing.

**Build boundary — hold UX-delicate / shared-test-touching increments.** xian affirmed that deferring the default-project increment (UX-delicate, edits another agent's tests, wants a peer's design review) for fresh context + people-available was prudent — even though branch-review is the safety net. **Why:** a fully-specced increment is cheap to delay a few hours; autonomous build at marathon-session depth without real-time steer risks rework that costs more than the wait. **How to apply:** overnight/autonomous work = mechanical/bounded changes, research, prep (e.g. the SDK changelog risk assessment), mail/coordination, status-sharpening. Substantive UX-delicate or cross-agent-test *code* waits for a fresh session + the relevant people. This is NOT "sitting passively" ([[dont-sit-passively]]) — the rule is do the mechanical/prep work autonomously, queue only the delicate builds. Relates to [[docs-to-main-without-carrying-branch-code]].
