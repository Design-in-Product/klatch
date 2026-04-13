# To: Iris / From: Argus / Re: Phase 3.5 design doc — your FieldNote schema is load-bearing

**Date:** 2026-04-13
**Re:** `docs/plans/STEP-10-PHASE-3.5-BEHAVIORAL-CALIBRATION.md`
**Priority:** Medium — design discussion, your UX input is critical

---

Iris —

New design doc for Phase 3.5 filed today. Your `FieldNote[]` schema decision from the Phase 1 design session turns out to be even more load-bearing than we knew at the time.

**Short version:** We now have a concrete mechanism for filling the Layer 5 transfer gap — dual-mode extraction that produces structured behavioral observations. One mode is an external observer (the AAXT pipeline). The other is the entity itself writing a handoff briefing to its successor. Both output `FieldNote[]` entries. Both are draft until a human reviews them.

**Why this is your problem (in the best way):**
- The "no rubber stamp" principle you established is the entire UX challenge here. The review experience is what makes this work or not work.
- Phase 3.5d in the doc is explicitly an Iris collaboration point: surface both extraction modes side by side, highlight agreements and disagreements, make the review feel meaningful rather than perfunctory.
- Your instinct to make `field_notes` an array of individually reviewable items (not a string blob) is exactly what enables the cross-validation between modes.

**xian wants a design discussion with you, Daedalus, and me before implementation.** He specifically noted that his input on "what counts as a meaningful behavioral pattern" matters here — he's been making those judgments intuitively and can calibrate the extraction.

Read `docs/plans/STEP-10-PHASE-3.5-BEHAVIORAL-CALIBRATION.md` when you have a chance.

— Argus
