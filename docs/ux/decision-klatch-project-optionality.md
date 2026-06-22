# Design Decision — Is "under a project" a structural requirement for klatches?

**Author:** Iris
**Date:** 2026-06-21
**Status:** Recommendation — answers xian's premise question + Daedalus's three-shapes tension
**Upstream:**
- `docs/mail/calliope-to-iris-sidebar-projects-question-from-xian-2026-06-21.md` (xian's question)
- `docs/mail/daedalus-to-iris-klatch-project-optional-tension-2026-06-21.md` (the implementation tension)
- `docs/plans/SIDEBAR.md` (Round 7, the constraint's origin)
- `docs/ux/object-model.md` §Tension 3 (the governing principle)
- `docs/ux/spec-composition-gesture.md` §2 (project-as-optional framing)

---

## The question (xian, 2026-06-21)

> "What does it mean to be 'under projects', and why would the sidebar make that a top-level requirement?"

Not "where does a project-less klatch render" (Daedalus's framing) but one step upstream: **why is being-under-a-project the structural requirement that defines whether a klatch can exist at all.** xian wants the *why* surfaced — he's open to "yes, klatches really do require projects" as long as the reasoning is explicit rather than buried in a rendering convention.

## Short answer

The requirement was **deliberate, but premise-bound** — and the premise has moved. In March, a klatch *was* conceived as a project-coordination tool, so "every klatch has a project" was true by construction of the use case, not by constraint. The sidebar encoded a then-universally-true observation as a permanent rule. The use case has since broadened (spontaneous, cross-project, BYOC), the observation is no longer universal, and the rule is now friction — sitting precisely on Klatch's narrowed differentiator.

The model already contains the principle that resolves this. **My recommendation: make project optional for klatches.** Details and the rendering consequence below.

---

## 1. The original *why* — deliberate, and honestly stated

`docs/plans/SIDEBAR.md` (March 16, authors xian + Daedalus) is explicit. From the glossary:

> **Klatch** — "Belongs to **exactly 1** project (klatches are a project coordination tool; no project, no klatch)."
>
> **Unassigned** — "Only chats can be unassigned; klatches always require a project."

So the constraint wasn't arbitrary. Its justification was a single load-bearing clause: **"klatches are a project coordination tool."** The wireframe's own examples confirm the mental model — `#standup`, `#coordination`, `#retro`. Every example is a *standing project ceremony*. A standup with no project is incoherent; of course it requires one. Given the March conception of what a klatch is *for*, "no project, no klatch" follows naturally.

The requirement is downstream of a use-case definition, not a data-model necessity. That's the crux.

## 2. What moved

Two shifts since March, both post-dating SIDEBAR.md:

**(a) Conversation-as-substrate / composition framing.** The object model and the composition spec reframed a klatch as a *composition of existing conversations* — you convene agents into a room. Composition is an act the user performs; it doesn't presuppose a project any more than starting a 1:1 chat does. A klatch is a thing you *make*, not a fixture a project *contains*.

**(b) The duty-cycle reframe + BYOC.** When the cross-project duty cycle absorbed the mail-delivery / coordination job, Klatch's unique value narrowed to two things: the persistent topical room, and the interchange protocol / BYOC transporter device. Both of those produce klatches that have *no natural project*:

- A **spontaneous cross-project consultation** — "have my OpenLaws researcher and my Klatch architect look at this contract once." Which project owns it? Neither. Forcing a choice imposes structure the moment doesn't have.
- A **BYOC composition** — "compose these three roles, carry them out to another tool." The whole point is that the klatch is a *portable, self-contained payload*. Binding it to a project over-couples the unit you're trying to carry: you'd be carrying the project too.

The use cases that are now Klatch's *reason to exist* are exactly the ones the project requirement penalizes.

## 3. The principle we already committed to

This isn't a new question. It's Tension 3 from the object model, resolved by **xian himself on 2026-05-11** (two months *after* SIDEBAR.md):

> **The principle:** The object definition shouldn't encode constraints that are typical-but-not-mandatory. A role typically belongs to a project (canonical case). A role *may* not (allowed by the model, not forbidden). The relationship between role and project is contingent on the role's situation, not part of the role's definition.

The klatch↔project question is the **identical shape** as the role↔project question, and the principle resolves it identically: a klatch *typically* belongs to a project (the coordination-tool canonical case), but the requirement is contingent on the klatch's situation, not part of what a klatch *is*.

The Round 7 constraint predates this principle. Once we adopted "don't encode typical-as-mandatory" for roles, the klatch requirement became an un-reconciled survivor of the older model — the same kind of constraint we'd already agreed not to encode, left standing only because nobody re-examined the sidebar against the May principle.

## 4. Was composition spec §2 intentional or aspirational?

xian asked me to be explicit about this. Honest answer: **intentional, but the drift was latent.**

§2 says: "Project (optional, context-dependent)... Klatches can exist without a project association (same as chats)." I wrote that deliberately — by the time I drafted the composition spec, I was reasoning from the May object-model principle and the conversation-as-substrate frame, under which project-optional is the natural consequence. It was not me being loose with a field label.

**But** I did not explicitly reconcile §2 against SIDEBAR.md's "no project, no klatch," and I should have flagged the contradiction at the time. Daedalus caught a real, un-flagged drift between two of my documents. The *intent* behind §2 was sound; the *omission* (not surfacing that it overturned a Round 7 rule) was mine. Good catch by him.

## 5. Steelman for keeping the requirement — and why it doesn't hold

The strongest case for (c) "keep klatch-requires-project":

> A klatch has multiple agents who benefit from *shared* grounding. A project supplies that — L2 instructions, L3 memory, KB files. A project-less klatch has no shared context layer; each agent brings only its own L5. Isn't that incoherent?

It doesn't hold, because **the klatch already has its own shared context layer independent of any project: L4, the Purpose field.** Composition spec §6 establishes that the Purpose seeds L4, prepended to every agent in the klatch. A project-less klatch convened with a Purpose ("review this contract for jurisdiction risk") has perfectly coherent shared grounding without a project. The project is *additional* context when present, not the *only* source of it.

The remaining argument for (c) is simplicity — one fewer rendering case. But that simplicity is purchased by putting friction on the BYOC and spontaneous-consultation use cases, which are the differentiator. Paying in your moat to save a sidebar branch is the wrong trade.

## 6. Recommendation

**Make project optional for klatches.** Align the behavior to composition spec §2 and the object-model principle. The Round 7 requirement was a faithful encoding of the March use case; the use case broadened; the encoding should follow.

This is a *model* decision (what a klatch is). The rendering question (§7) is downstream of it.

## 7. Rendering consequence — answering Daedalus's a/b/c

Daedalus offered three shapes. With the model decision above, (c) is off the table (unless we consciously re-commit to klatch-as-coordination-tool-only, which the use cases argue against). Between (a) and (b):

**Recommend (b): a top-level "Klatches" section, parallel to "Unassigned," for project-less klatches.**

```
v ACTIVE PROJECT
    CHATS
    KLATCHES
> Another Project
─────────────────
  KLATCHES            <- NEW: project-less klatches (spontaneous, BYOC, cross-project)
  UNASSIGNED          <- project-less chats (existing)
[ New Chat ] [ New Klatch ] [ Import ]
```

Why (b) over (a): option (a) tucks project-less klatches *inside* "Unassigned," but **"Unassigned" connotes triage — not-yet-sorted, incomplete.** That's accurate for an imported chat awaiting project assignment. It's *inaccurate* for a deliberately-convened one-off committee or a BYOC payload, which aren't unsorted — they're *intentionally* standalone. Naming the top-level group "Klatches" describes it by what it *is*, not by a lack.

**One sub-issue this surfaces (not for this turn):** "Unassigned" has the same latent mislabel for chats — a permanent loose 1:1 you never intend to file isn't "unassigned" either. There's a future consolidation where the bottom of the sidebar is a "Standalone" area holding both loose chats and loose klatches, named by their standalone-ness rather than by absence. I flag it for the backlog; it is **not** a blocker and **not** this turn's work. xian explicitly didn't ask for a sidebar redesign, and this recommendation doesn't require one — shape (b) is an additive section.

## 8. Sequencing — endorse Daedalus's plan as-is

Daedalus is correctly building the spine with project **required** (current tested behavior, no Round 7 breakage) and everything else to spec. **That sequencing is right; keep it.** The project-optional flip + shape (b) lands as a follow-on increment, with the Round 7 test update coordinated with Argus at that point (the test that asserts "klatch-without-project is rejected" inverts to "klatch-without-project renders in the top-level Klatches section").

Nothing here blocks the spine. This is the *why* feeding the decision, exactly as Calliope framed it.

---

## Summary for the record

| Question | Answer |
|---|---|
| Was the requirement deliberate? | Yes — SIDEBAR.md, "klatches are a project coordination tool; no project, no klatch." |
| Is it load-bearing in the model? | No — it's downstream of the March use-case definition, not a data-model necessity. |
| Was composition §2 (optional) intentional? | Yes, reasoning from the May object-model principle. The un-flagged contradiction with SIDEBAR.md was my omission. |
| Do the new use cases change the prior? | They sharpen it — BYOC + spontaneous klatches are *definitionally* project-less and are Klatch's differentiator. |
| Governing principle? | Object model Tension 3 (xian, 5/11): "don't encode constraints that are typical-but-not-mandatory." Same shape, same resolution. |
| Recommendation | Make project optional for klatches; render project-less ones in a new top-level "Klatches" section (Daedalus's shape b). |
| Spine impact | None — endorse Daedalus's keep-required-now, flip-later sequencing. |
