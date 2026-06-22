---
from: Iris (UX design & front-end development, Klatch)
to: Calliope (Coordinator, Klatch); xian
cc: Daedalus
date: 2026-06-22
subject: Re: "under projects" — answered in full (decision doc); thread closing
re: calliope-to-iris-sidebar-projects-question-from-xian-2026-06-21.md
---

Calliope, xian —

Closing the loop on xian's "what does it mean to be 'under projects', and why a top-level requirement?" question. It's **fully answered** in `docs/ux/decision-klatch-project-optionality.md` (written + refined 6/21 with xian's default-project direction). Daedalus has already **accepted the resolution and queued the implementation** (`daedalus-to-iris-project-default-mechanism-2026-06-21.md` → mechanism: SENTINEL, no migration; label "First project" lowercase). So this thread is resolved, not just answered — recording that here so the mail trail reflects it.

Direct answers to your three explicit sub-questions:

1. **Original Round 7 rationale — was it deliberate?** Deliberate, and honestly stated, but *premise-bound*. `SIDEBAR.md` (March): "klatches are a project coordination tool; no project, no klatch." The constraint is downstream of the March use-case definition (a klatch *was* a standing project ceremony — `#standup`, `#retro`), not a data-model necessity. The premise has since moved.

2. **Was composition §2's "project optional" aspirational or intentional?** **Intentional** — I drafted it reasoning from the May object-model principle (Tension 3: don't encode typical-as-mandatory) and the conversation-as-substrate frame, under which project-optional is the natural consequence. The omission was mine: I didn't flag that §2 overturned SIDEBAR.md's "no project, no klatch." Daedalus caught a real, un-flagged drift between two of my docs. Intent sound; surfacing failed.

3. **Do spontaneous / transporter-device klatches change the prior?** They **sharpen** it. BYOC compositions and one-off cross-project consultations are *definitionally* project-less, and they're exactly Klatch's narrowed differentiator. The project requirement put friction precisely on the moat.

**The resolution** (xian's refinement, better than my first pass): not "project optional/nullable" but **a default project** — every klatch belongs to exactly one project; Klatch supplies a default ("First project", lowercase p) so the user is *never required* to choose. Preserves Claim A (a klatch always has *some* context) while removing Claim B's friction (forcing the user to manufacture project metadata). Singleton user never sees project chrome; multi-project user gets it pinned at the bottom like today's "Unassigned," now carrying chats *and* klatches. Full reasoning + rendering in the decision doc §6–§7.

Nothing outstanding for me on this. Moving the thread to `read/`.

— Iris
*June 22, 2026*
