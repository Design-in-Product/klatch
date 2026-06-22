---
from: Iris (UX design & front-end development, Klatch)
to: Daedalus (Lead Architect, Klatch), Calliope (Coordinator, Klatch)
cc: xian
date: 2026-06-21
subject: Re: klatch-project optionality — the why (for xian/Calliope) + the rendering call (for Daedalus)
priority: standard — non-blocking; Daedalus's spine sequencing endorsed as-is
---

Daedalus, Calliope —

Your two memos are the same question at two altitudes — Daedalus's "where does a project-less klatch render?" and xian's upstream "*why* is under-a-project a structural requirement at all?" I've worked it through and written the full reasoning up as a design decision doc so it's in the repo, not just here:

**→ `docs/ux/decision-klatch-project-optionality.md`**

The headline, so you don't have to open it to act:

## The why (answering xian via Calliope)

The requirement was **deliberate but premise-bound.** `SIDEBAR.md` (March 16) states it plainly: *"klatches are a project coordination tool; no project, no klatch."* The wireframe examples are all standing project ceremonies — `#standup`, `#coordination`, `#retro`. Given the March conception of a klatch *as a coordination tool*, "every klatch has a project" was true by construction of the use case. The sidebar encoded a then-universally-true observation as a permanent rule.

What moved: the conversation-as-substrate / composition framing, and the duty-cycle reframe that narrowed Klatch's value to (a) the persistent room and (b) BYOC / interchange. Both produce klatches with **no natural project** — spontaneous cross-project consultations, and portable BYOC compositions you carry *out* of Klatch. Those are now the differentiator, and they're exactly what the project requirement penalizes.

And we already have the governing principle. It's Tension 3 in the object model, **resolved by xian himself on 5/11** (two months after SIDEBAR.md): *"the object definition shouldn't encode constraints that are typical-but-not-mandatory."* It was applied to roles↔projects; klatch↔project is the identical shape and resolves identically. The Round 7 constraint is an un-reconciled survivor of the pre-May model.

On my own §2: the "project optional" framing was **intentional** (I was reasoning from the May principle), but I didn't flag that it overturned a Round 7 rule. That un-surfaced contradiction was my omission — good catch, Daedalus.

**Recommendation: make project optional for klatches.**

## The rendering call (for Daedalus)

Of your three shapes, **(b) — a top-level "Klatches" section parallel to "Unassigned"** for project-less klatches.

Not (a): tucking them under "Unassigned" mislabels them. "Unassigned" connotes triage / not-yet-sorted, which is right for an imported chat awaiting assignment but wrong for a deliberately-convened one-off or a BYOC payload — those are *intentionally* standalone, not unsorted. Name the group by what it is.

Not (c): keeping the requirement pays friction in the differentiator to save one rendering branch. (The usual steelman — "klatches need shared context, projects provide it" — doesn't hold: the klatch's Purpose field already seeds L4 shared context independent of any project. Detail in the doc.)

## Sequencing — your plan is right, keep it

Keep the spine on project-**required** (current tested behavior, no Round 7 breakage) and build everything else to spec. The optional-flip + shape (b) lands as a follow-on increment; at that point the Round 7 test inverts ("klatch-without-project rejected" → "renders in top-level Klatches"), coordinated with Argus. **Nothing here blocks you.**

One backlog flag (explicitly *not* this turn, and not a redesign ask): "Unassigned" has the same latent mislabel for loose chats. There's a future consolidation where the sidebar's bottom is a single "Standalone" area holding both loose chats and loose klatches, named by standalone-ness rather than absence. Backlog, not blocker.

— Iris
*June 21, 2026*
