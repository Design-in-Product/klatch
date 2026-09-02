# New-agent creation as a guided, secondary flow — captured thinking, not yet a spec

**Status:** direction, from a conversation with xian, 2026-09-02. Not a spec. Resolves the "held" status on Path C's "new agent / role" option (`docs/ux/spec-composition-gesture.md` §11, §11a) with a real direction rather than leaving it paused indefinitely.

---

## The two things Klatch is

xian's framing, this session:

1. **Primary: existing agents having group conversations.** This is the premise (`docs/PREMISE.md`) and the MVP. The canonical use case — Piper Morgan's weekly leadership review — runs entirely on this.
2. **Secondary, possibly real: Klatch as a full agent harness.** Letting a user spawn "the kind of agent I use" — a named role with the full 5-layer context stack, not a bare prompt — from inside Klatch itself.

**Case 1 must not be degraded by case 2.** No confusion, no ambiguity, no minimalist plumbing (empty form fields with no guidance) creeping into the primary flow to make room for the secondary one.

## Why this resolves the Path C hold

The original hold (`spec-composition-gesture.md` §11) was framed as a proximity problem: listing "mint a new entity" next to "bring in an existing one" in the same picker menu blurs a distinction `PREMISE.md` says has to stay sharp.

xian's framing sharpens the actual defect: it isn't just where the option sits, it's *what the option is*. A bare name/prompt/model form, offered as a quick peer choice, **is** the boring version of Klatch — `PREMISE.md`'s own first Attractor tell ("entities are personas defined by prompts... you create them in a settings panel"). Fixing the menu placement wouldn't fix that; the flow itself has to not be a form.

His point 3 states the requirement directly: **the interface must be a smart, dynamic, interactive process that guides the user toward a well-defined role** — because we should assume the user isn't already fluent in what makes a good Klatch-native agent (a name, a working system prompt, sensible model defaults, maybe a starting sense of its own purpose). Empty fields hand that expertise problem to the user. Klatch should carry it (Tesler's Law, Design Principle 8).

## Where this connects — not duplicates — existing work

**Step 10.5 (Layer 5 portability, `docs/ROADMAP.md`)** already designs a structured-interview mechanism, but for the *mirror* case: extracting a persona from an *existing* agent's history during migration ("Prepare for migration" flow → persona capture).

This is the same conceptual move — a guided interview producing a well-formed Layer 5 profile — aimed at agents with **no history to extract from**. Not the same mechanism (nothing to mine, no correction-extraction, no fidelity scoring against a source), but likely the same *mental model* for whoever designs it: an interview that produces a working-relationship starting point, not a form that produces a string.

## What this is not

- Not new beta scope. Case 1 is unaffected; the gate is still just backfill/the fresh-import question (see `calliope-to-daedalus-theseus-cc-team-xian-urgent-friday-piper-morgan-test-2026-09-02.md`).
- Not a commitment to build before 1.0. xian: "It may be the gate from beta to 1.0 or it may be a 2.0 goal." Real design process needed first — this doc exists so that process doesn't start from zero.
- Not a reason to keep Path C's "continue existing role" sub-option held — that one has no persona-creation problem and stays scheduled per §11a.

## Open, for whoever picks this up

- Does the guided-creation flow reuse any of Step 10.5's future interview infrastructure, or is building it first (for the from-scratch case) actually the easier place to start, with migration's persona capture reusing *it* later?
- What's the minimum viable version of "guided" — a wizard with smart defaults, an actual back-and-forth conversation with the system before the entity is minted, something else?
- Does this want its own design pass now (Iris), or is it better sequenced after case 1 ships to beta so it isn't competing for attention with the actual gate?
