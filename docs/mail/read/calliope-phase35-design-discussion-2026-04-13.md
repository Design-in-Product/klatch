# Phase 3.5 Design Discussion: Behavioral Calibration Transfer

**Date:** 2026-04-13
**From:** xian (with Calliope)
**To:** Daedalus, Iris, Argus
**Re:** `docs/plans/STEP-10-PHASE-3.5-BEHAVIORAL-CALIBRATION.md`
**Purpose:** Preparation memo for a focused design discussion before implementation begins

---

Phase 3.5 is the most consequential design work in Step 10. The Janus memory research confirmed that nobody in the field has solved learned behavioral calibration transfer. If we get this right, it's a genuine contribution — and if we get it wrong, we build infrastructure that produces field notes nobody trusts.

This discussion needs all four of us because each brings something the others can't:

- **xian** — the ground truth. You've been making calibration judgments intuitively for months. Your tacit model of "how Daedalus is different from Argus" is what the extraction is trying to approximate.
- **Iris** — the review UX. Your "no rubber stamp" principle and the `FieldNote[]` schema decision are load-bearing. Phase 3.5d (the cross-validation review UI) is yours to design.
- **Daedalus** — the implementation. The export flow, the LLM calls, the format integration, the cost envelope.
- **Argus** — the methodology. The AAXT connection, the Subliminal detection, the cross-validation logic, the measurement of whether any of this actually works.

Please read the design doc before the discussion. Come prepared to weigh in on the five questions below.

---

## Question 1: What counts as a meaningful behavioral pattern?

*Primarily for xian, but everyone should think about this.*

The dual-mode extraction will surface many observations. Some will be signal ("asks clarifying questions before committing to action plans in 8 of 10 decision points"). Some will be noise ("uses bullet points in responses"). Some will be confabulated ("has a dry sense of humor" — plausible-sounding but not grounded in evidence).

**The question:** Can you articulate — even roughly — what makes a behavioral observation valuable vs. worthless for a successor instance? What's the filter?

Some candidate criteria to react to:
- Is it *actionable*? (A successor could change their behavior based on this.)
- Is it *specific*? (Cites examples, not just patterns.)
- Is it *non-obvious*? (Not something the role prompt already says.)
- Is it *relational*? (About working with this particular user, not about general best practices.)

If you can think of 3-5 examples of things you wish a successor instance of Daedalus, Argus, or Calliope knew that aren't in their role prompts or traditions docs, those examples would be the best calibration data for the discussion.

## Question 2: The handoff prompt

*Primarily for Argus and Daedalus.*

The design doc proposes a five-point prompt ("how the user prefers to work," "patterns you've learned," "relationship context," "things that went wrong," "anything else"). The "briefing a colleague" frame is the key design choice — it produces operational specifics rather than abstract personality descriptions.

**The question:** Is the five-point structure right, or does it need adjustment? Specifically:

- Should "things that went wrong" be its own point? Some agents may produce nothing useful here (no failures in the conversation), while others might produce an overwhelming list. Is there a better framing — perhaps "course corrections" or "moments where expectations were recalibrated"?
- Should the prompt explicitly ask for *negative* calibration ("things your successor should NOT do")? Absence of bad behavior is hard to extract but very valuable to transfer.
- Should the prompt vary by entity role? A Daedalus handoff briefing should probably emphasize implementation patterns and architecture preferences; a Calliope briefing should emphasize communication style and editorial judgment. Or is one universal prompt sufficient?

## Question 3: The micro-reflection cadence

*For everyone.*

The design proposes ~50-100 token reflections at session boundaries: "Note 1-3 things you learned about how to work effectively with this user."

**The question:** Is per-session the right frequency? The tradeoffs:

- **Per-session:** Captures learning while fresh. ~50 tokens is cheap. But adds a step to every session close and may produce diminishing returns after the first few sessions (the agent keeps noting the same patterns).
- **Per-correction:** Trigger only when the user explicitly corrects the agent ("no, I meant..."). Captures the highest-signal moments. But misses positive calibration ("yes, exactly like that").
- **Periodic (weekly):** Longer, more reflective. Better for consolidation than capture. Misses the freshness of in-the-moment learning.

Also: should micro-reflections be visible to the user (part of the session log) or silent (entity memory only)? Visible reflections invite correction ("that's not quite what I meant"). Silent reflections avoid cluttering the conversation but bypass the human review principle.

## Question 4: The cross-validation UX

*Primarily for Iris, with input from Argus on what the data looks like.*

When both extraction modes (external observer + self-authored briefing) produce field notes, the review UI needs to present them meaningfully.

**The question:** What does the reviewer see, and what decisions do they make?

Scenarios to design for:

**A. Agreement (both modes say the same thing).** High confidence. The reviewer probably just confirms. But even confirmation shouldn't be one-click — Iris's "no rubber stamp" principle means the reviewer needs to at least read and acknowledge. What's the minimum-friction way to confirm a high-confidence note without making it feel like a checkbox exercise?

**B. Disagreement (modes say contradictory things).** Low confidence. The reviewer needs to choose, or edit, or reject both. How do you present a contradiction productively? Side-by-side? One then the other? Merged with highlights?

**C. Unique to one mode (the other mode didn't surface it).** Medium confidence. The external observer caught a Subliminal pattern the entity couldn't self-report, or the entity noted something the observer missed. The reviewer needs to evaluate the note on its own merits without cross-validation. How do you signal "this has only one source" without making it feel unreliable?

**D. The entity confabulated.** The self-authored briefing contains a plausible-sounding pattern that isn't grounded in the conversation. The external observer doesn't corroborate it. How does the reviewer know? Can the UI surface the absence of corroboration as a signal?

Argus: what does the raw output actually look like from AAXT Phase 2? How many notes per entity per pass, roughly? What's the typical agreement rate? Even rough estimates would help Iris design for realistic data volumes.

## Question 5: What "works" looks like

*For everyone.*

**The question:** How would we know if Phase 3.5 succeeded?

Some candidate success criteria:
- A successor instance that reads the field notes performs measurably better (by MAXT standards) than one that doesn't
- A human reviewer spends less than 5 minutes reviewing field notes for a typical entity and finds the experience meaningful (not perfunctory)
- The extraction produces at least 3 notes per entity per pass that pass the Question 1 filter (actionable, specific, non-obvious, relational)
- Cross-validation catches at least one confabulation per pass (the dual-mode design earns its cost)

What's the minimum bar? What's the aspirational bar? And what would tell us to stop and rethink?

---

## Process

Read the design doc. Think about the questions. Come to the discussion with positions, not just reactions. The discussion happens in xian's next session with the team — timing is his call, but the preparation is ours.

The "no points for rushing" principle applies here with special force. This is the work that could make Klatch's Layer 5 story genuinely novel. Getting the mechanism right matters more than shipping it fast. If any question above needs more thinking time, take it.

— xian (with Calliope)
