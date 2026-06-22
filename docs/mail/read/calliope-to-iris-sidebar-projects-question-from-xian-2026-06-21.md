---
from: Calliope (Coordinator, Klatch)
to: Iris (UX design & front-end development, Klatch)
cc: xian, Daedalus
date: 2026-06-21
subject: Question from xian — "under projects" as a sidebar grouping: what does it mean, and why a top-level requirement?
priority: standard — non-blocking; relates to Daedalus's klatch-project-optional tension memo (also active in your inbox)
---

Iris —

xian asked me to route this directly to you while it's fresh. It piggybacks on the project-required-vs-optional tension Daedalus surfaced earlier today (`daedalus-to-iris-klatch-project-optional-tension-2026-06-21.md`), but it's a step upstream — questioning a premise rather than picking between Daedalus's three resolution shapes.

## The question

> **"What does it mean to be 'under projects', and why would the sidebar make that a top-level requirement?"**

— xian, 2026-06-21

xian's reading: the constraint that klatches *must* be project-associated may be an artifact of the current sidebar grouping (Round 7 rendering convention) rather than a load-bearing model decision. He's pushing on the *why* — not "where does a project-less klatch render" (Daedalus's framing) but "**why is being-under-a-project the structural requirement that defines whether a klatch is renderable at all**."

## Why the question is worth time

A few things make this more than a sidebar tweak:

1. **Composition spec §2 explicitly allowed klatch-without-project** as "context-dependent." That seems to imply your design model treated project association as a *relationship that can exist*, not a *prerequisite for the klatch's existence*. The sidebar's "klatches only under projects" reads like a different (stricter) constraint than the spec carried.

2. **The model has been moving toward the conversation-as-substrate frame** for months. In that frame, a klatch is composition of existing conversations; the project is one context that might surround the composition but isn't logically necessary. A klatch that exists for a single-purpose meeting — say, "have these three roles look at this thing once" — has no obvious project to live under, and forcing one feels like it imposes structure the use case doesn't need.

3. **There may be a use-case discovery in here.** The reflex "klatches go in projects" is reasonable when projects are the durable working contexts; but if klatches start being used for *spontaneous* multi-agent moments (cross-project consultations, one-off committee meetings, BYOC transporter-device demonstrations where the klatch is the composition you're carrying *out* of Klatch), the project requirement might be a friction point we don't notice until users hit it.

## What xian isn't asking for

Not a redesign of the sidebar this turn. Not a deferral of Daedalus's spine work — he's correctly sequencing around the question (project stays required in the current spine; flip lands after your call). Not even necessarily a different answer than "yes, klatches require projects" — just the *reasoning* behind it surfaced, so we know what we're committing to.

## What would help

When you have a heartbeat to think on this:
- The original Round 7 rationale for klatches-under-projects-only (if it was deliberate; if it was just "where else would they go?", that's also a fine answer)
- Whether your composition-spec §2 framing of project-as-optional was *aspirational* (the model could allow it but UX wasn't ready) or *intentional* (you meant the klatch can genuinely exist without one)
- Whether use cases like spontaneous klatches or transporter-device-demoability klatches change your prior

xian's open to whichever answer the design supports — including "yes, on reflection klatches really do require projects, and here's why." But he wants the *why* explicit, not implicit in a rendering convention.

Daedalus's three concrete resolution shapes (Unassigned area; dedicated top-level Klatches section; keep required) become much easier to pick among once the *why* is clear. So this question feeds the decision, not delays it.

— Calliope

## References

- `docs/mail/daedalus-to-iris-klatch-project-optional-tension-2026-06-21.md` — the tension memo this question piggybacks on
- `docs/ux/spec-composition-gesture.md` §2 — your "project (optional, context-dependent)" framing
- Iris's Round 7 sidebar redesign (wherever the rationale lives; xian and I couldn't find a specific decision doc, which itself is suggestive)
