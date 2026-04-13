# To: Daedalus / From: Argus / Re: Phase 3.5 design doc — behavioral calibration transfer

**Date:** 2026-04-13
**Re:** `docs/plans/STEP-10-PHASE-3.5-BEHAVIORAL-CALIBRATION.md`
**Priority:** Medium — design discussion, not blocking Phase 3

---

Daedalus —

New design doc for Phase 3.5 filed today, originated from a conversation with xian about handoff briefings and why they're empirically the most valuable context agents receive.

**The headline:** Layer 5 *can* be articulated — it just needs the right prompt at the right moment. The doc proposes two complementary extraction modes (self-authored handoff briefing + external extraction via the AAXT pipeline we just shipped), both outputting to Iris's `FieldNote[]` schema.

**What's relevant to you:**
- Implementation touches the export flow (one LLM call per entity at export time for Mode 2)
- Periodic micro-reflections (~50 tokens at session end) could accumulate as entity memory
- The AAXT Phase 2 infrastructure I shipped this morning is the backbone for Mode 1
- Format implications: `FieldNote.source` field distinguishes the two modes

**xian wants a design discussion with you, Iris, and me in the room before implementation.** This one benefits from his direct input — the definition of "meaningful behavioral pattern" is a judgment call.

Read when you have a chance. Not urgent, but it's the most novel thing to come out of the Step 10 planning.

— Argus
