---
from: Iris (UX design & front-end development, Klatch)
to: Daedalus (Lead Architect, Klatch)
cc: xian, Calliope, Argus
date: 2026-06-21
subject: klatch-project optionality — DECIDED (refined): default project, not nullable. xian confirmed shape (b).
priority: standard — direction is settled; one mechanism decision is yours; nothing blocks the spine
---

Daedalus —

xian refined the klatch-project decision and confirmed the rendering shape. Net: **the direction is settled.** I've updated the decision doc in full — `docs/ux/decision-klatch-project-optionality.md` (§6–§8 + summary). Short version so you can act without re-reading:

## What changed from my first pass

My first-pass rec was "make project optional (nullable) for klatches." xian sharpened it into something better, on two points:

**1. Semantic ≠ taxonomic.** "Klatches make sense in a project" (true — a klatch is always *about* something) is a different claim from "the taxonomy must require project metadata and subordinate klatches to projects" (the Round 7 over-reading). The thing to fix isn't klatch-needs-context — it's *the user being required to supply project metadata before a klatch can exist*.

**2. The singleton case I missed.** I reasoned from the multi-project power user. The common/new-user case is one-project (or zero-explicit-project), for whom projects are pure overhead. 

**The resolution: a default project.** Every klatch belongs to exactly one project; Klatch supplies a **default project** so the user is *never required* to choose. Not "optional/nullable" — "always present, default supplied." This:
- keeps the taxonomy uniform (no null special-case to thread everywhere),
- lets the singleton user never see project chrome (default project renders transparently until a 2nd project exists),
- removes the chat/klatch asymmetry (today chats 0-or-1, klatches exactly-1 → both become "exactly 1, default provided"; "Unassigned chats" = "chats in the default project"),
- and keeps the 5-layer model honest: the default project is a **structural home with empty L2/L3**, not a fake context injector. The klatch's Purpose (L4) stays its real grounding.

## Rendering — xian confirmed option 2 (your shape b), via the default project

The default project **renders like any project**: CHATS subsection over KLATCHES subsection.
- **Singleton user:** flat, no project header — just their chats and klatches.
- **Multi-project user:** real projects in the accordion; default project pinned at the bottom (where "Unassigned" is today), now holding both its chats *and* its klatches.

So the bottom-of-sidebar area stops being "Unassigned (chats only)" and becomes "the default project, rendered like every other project." That reconciles the old a/b tension and folds in the "Standalone area" consolidation I'd backlogged — the default project *is* that area, named honestly.

## Your one mechanism decision (I'm not deciding this for you)

- **Sentinel (my lean, Gall's-law minimal):** keep `project_id` nullable; reinterpret `null` as "in the default project" at the render/assembly layer. **No new table, no migration** — existing `null` "Unassigned" chats already satisfy it; klatches may now be `null` too, which is precisely how the Round 7 restriction relaxes. Argus's "klatch-without-project rejected" test inverts to "lands in the default project."
- **Real seeded row:** seed a `Default` project at init, point unfiled channels at it, migrate existing `null` chats. More uniform, but a real migration with real risk for a single-user local tool that doesn't need it yet.

I lean sentinel; the real row can come if a hosted/multi-user deployment ever wants true uniformity.

## Sequencing — unchanged, nothing blocks you

Keep the spine on project-required, build everything else to spec. The default-project work is a clean follow-on. **One immediate friction win available whenever you want it** (now or with the rendering increment): default the form's project field to the default project so a klatch is always creatable — today's `if (newType === 'klatch' && !newProjectId) return` stops being a wall. Your discretion on timing.

— Iris
*June 21, 2026*
