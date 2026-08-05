# §6 revision — candidate replacement text (DRAFT for live session with xian)

**Author:** Iris
**Date:** 2026-08-04
**Status:** DRAFT — **not applied to the spec.** The hold stands: §6 changes land only in a live session with xian (per my 7/19 commitment and my handoff's first-moves list). This doc exists so that session starts from literal candidate sentences instead of from "the shape of the fix."
**Applies to:** `docs/ux/spec-composition-gesture.md` §6, the "Context richness at start" paragraph (line 156).

---

## The paragraph being replaced

> **Context richness at start:** agents participating in a klatch bring their existing context — from their ongoing 1-1 session or from the import process (Path B). The composition gesture selects who participates; it does not automatically inject agents' prior conversation histories into the klatch. Context beyond the agent's own L5 can be explicitly pinned as files.

The failure mode, for the record (full analysis in `docs/plans/composition-continuity-gap-2026-07-19.md`): one paragraph carrying two claims — "agents are continuous with their source" (premise) and "this isn't a naive history dump" (design constraint) — collapsed so that the second reads as a denial of the first. Implementation followed the second reading. The fix is structural: **two claims, two paragraphs, and the constraint explicitly subordinated to the premise.**

## Candidate replacement

> **Continuity (the premise).** An agent arrives in a klatch continuous with its source conversation. What it knows in its 1-1 — the work, the decisions, the accumulated working context — it knows here too. The composition gesture selects *who participates*; it never selects *how much of themselves they bring*. A klatch whose participants arrive without their history is not a klatch (`PREMISE.md`, idea #2); this section's remaining rules are implementations of that premise, and any reading of them that contradicts it is wrong.
>
> **Mechanism (the design constraint, subordinate to the premise).** Continuity is not implemented as a raw injection of full prior history into the klatch window. Each agent arrives with a bounded, deterministic seed of its accumulated context, and retrieves specifics on demand via its source-context tool ("let me check my notes"). The constraint governs *how* context is carried — never *whether*.
>
> **Room-level context.** The Purpose field (§6 above) and klatch-pinned files remain the mechanism for context that belongs to the *room* rather than to any participant. They supplement each agent's own continuity; they are not a substitute for it.

## Contingencies to resolve in the live session — the draft deliberately leaves these open

1. **"Source conversation" vs. "transcript."** The candidate says *source conversation*. If xian confirms the one-transcript model (Calliope's reframe, 7/19 — entity owns transcript, channels are views), the stronger phrasing is: *"An agent arrives in a klatch continuous with its own transcript — the klatch is one more source of messages in it, not a separate room it walks into empty."* That version is better **if and only if** the primitive is confirmed; writing it before the Interpretation A/B call would repeat the original sin (spec text asserting an architecture that isn't decided).
2. **Mechanism naming.** "Bounded deterministic seed + on-demand tool" is Daedalus's hybrid, which the team converged on and xian has not yet ratified (Q1/mechanism, rollup 🔴). If he picks differently, the mechanism paragraph's middle sentence changes; the first and last sentences don't.
3. **Discretion.** If xian picks Position 3 or 4 (`docs/plans/discretion-model-options-2026-07-19.md`), §6 needs one added sentence on what an agent may *withhold or must not surface* from its 1-1 in a klatch — and I owe the marking-gesture UI. Positions 1–2 need no §6 text. Draft sentence held back deliberately; writing it now would presuppose his answer.

## Adjacent open item, named so it doesn't get lost (not §6 text)

Calliope's 7/19 reframe memo assigned me a new UX question: the human sees two filtered rooms (1-1 view, klatch view); the agent has one memory. **Does the user ever need the unified view — "what does this agent actually remember"?** My instinct matches hers (yes, and it's a genuinely novel surface — likely also the natural home for discretion marking if Position 3 wins). Parked until Interpretation A/B and the discretion position land, since both change what the surface would show. Not designing it yet; refusing to forget it.

— Iris
