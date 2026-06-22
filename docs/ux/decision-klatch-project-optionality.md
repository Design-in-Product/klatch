# Design Decision — Is "under a project" a structural requirement for klatches?

**Author:** Iris
**Date:** 2026-06-21 (refined same day with xian's default-project direction)
**Status:** Decided in principle — xian confirmed option 2 (shape b) + the default-project model. Implementation mechanism is Daedalus's call (§8).
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

## 6. Recommendation — refined by xian, 2026-06-21 (the default-project model)

My first-pass recommendation was "make project optional (nullable) for klatches." xian sharpened it, and his version is better. Two corrections:

### 6a. The distinction I collapsed — semantic necessity ≠ taxonomic subordination

xian:
> "'Klatches only make sense for projects' is a different claim than 'our taxonomy requires project metadata and classifies klatches as an object subordinated to projects.'"

This is the precise cut my §1–§5 analysis blurred. There are two separable claims:

- **Claim A (semantic):** a klatch always exists in *some* context — it's *about* something. This is **true**, and I shouldn't have argued against it. A klatch with no context at all is incoherent.
- **Claim B (taxonomic):** the data model must require project metadata and structurally subordinate klatches as children-of-projects, with the user supplying that metadata as a precondition of creation. This is the Round 7 encoding, and it's the part that's **wrong** — or rather, it's an over-reading of A.

My "make project optional" framing accidentally attacked Claim A (implying klatches can be context-less). What's actually wrong is only B's *friction*: forcing the user to manufacture and assign project metadata before a klatch can exist. The fix isn't to strip klatches of project context — it's to stop *requiring the user to supply it*.

### 6b. The singleton case I ignored — and the default project that resolves both

I reasoned from the multi-project power user and missed the common case: **the one-project (or zero-explicit-project) user.** For them, the project dimension is pure overhead — a new user just wants to chat and maybe convene a klatch, and forcing project creation first is bad onboarding. My "top-level Klatches section" implicitly assumed someone who already thinks in projects.

xian's resolution: **a default / generic project as a fallback.** This satisfies Claim A's structure (every klatch has *a* project) while removing Claim B's friction (the user is never *required* to choose one). It is strictly better than nullable-optional:

- **Taxonomy stays uniform** — every channel belongs to exactly one project; no null special-case to thread through queries and rendering. (Lightest implementation: treat `project_id = null` as *"in the default project"* at the render layer — a sentinel, no migration, no new table. A real seeded default-project row is the alternative; **mechanism is Daedalus's call** — see §8.)
- **The singleton user never sees project chrome** — the default project renders transparently (its contents shown flat, no project header) until a *second* project exists. Projects become a concept you grow into, not one you confront on day one.
- **It removes an existing asymmetry instead of adding a case.** Today chats are 0-or-1 project, klatches exactly-1. Under the default project, *both* are "exactly one project, default provided." "Unassigned chats" become "chats in the default project." Chat and klatch stop being special-cased differently.
- **The default project is a structural home, not a semantic injector.** It carries empty L2/L3 by default — it's where things live, not a context that pretends to ground them. The klatch's own Purpose (L4) remains its real context. This keeps the 5-layer model honest and honors the A/B split exactly: structural placement without fake project-context.

**The recommendation, restated:** every klatch belongs to exactly one project; Klatch provides a default project so the user is *never required* to choose one. Not "project optional" — "project always present, default supplied."

## 7. Rendering consequence — the default project subsumes a/b/c

The default-project model dissolves most of Daedalus's a/b/c question. **The default project renders like any project** — a CHATS subsection above a KLATCHES subsection (SIDEBAR.md's established within-project ordering). It doesn't need a bespoke rendering rule; it *is* a project, just the one the user didn't have to create.

**Singleton / new user** (only the default project exists) — render its contents flat, no project header:

```
  CHATS
    general
    my first chat
  KLATCHES
    my first klatch
[ New Chat ] [ New Klatch ] [ Import ]
```

No project chrome at all. The user doesn't yet know projects exist.

**Multi-project user** — real projects in the accordion; the default project pinned at the bottom (where "Unassigned" sits today), now carrying *both* its chats and its klatches:

```
v Klatch (project)
    CHATS  …
    KLATCHES  …
> Piper Morgan
> OpenLaws
─────────────────
  CHATS            <- default project's chats (today's "Unassigned")
  KLATCHES         <- default project's klatches  ← project-less klatches land here
[ New Chat ] [ New Klatch ] [ Import ]
```

This is what xian confirmed as **option 2 (Daedalus's shape b)** — a real KLATCHES home for unfiled klatches — but realized through the default project rather than a one-off section. It reconciles the earlier a/b tension: it has (b)'s dignity (a proper KLATCHES section, not buried under a triage label) and (a)'s placement (in the bottom area alongside loose chats), because the bottom area is simply *the default project rendered like every other project*.

**This also brings my backlogged "Standalone area" consolidation forward** — and gives it a cleaner backing. I'd flagged (first-pass §7) that "Unassigned" mislabels intentionally-loose chats, and that a future "Standalone" area should hold both loose chats and klatches. The default project *is* that area, named honestly: it's not "unassigned/unsorted," it's "the default workspace." One open copy question, minor: what the default project is *labeled* once a second project exists and it needs a header — "Personal," "Workspace," "General," or similar. Invisible to the singleton user; decide at implementation. Not a blocker.

## 8. Sequencing + the one implementation sub-decision for Daedalus

Daedalus's keep-the-spine-on-project-required, build-everything-else-to-spec sequencing is still right — **keep it.** Nothing here blocks the current increments. The default-project work lands as a follow-on, and it's well-bounded.

**The one mechanism decision, Daedalus's call:**

- **Sentinel (recommended, Gall's-law minimal):** keep `project_id` nullable in the DB; reinterpret `null` as *"in the default project"* at the render + assembly layer. No new table, **no data migration** (existing "Unassigned" chats are already `null` → they're simply "in the default project" under the new rule). Klatches may also be `null` → they land in the default project too, which is exactly how the Round 7 restriction relaxes. Argus's test "klatch-without-project is rejected" inverts to "klatch-with-no-explicit-project lands in the default project."
- **Real seeded row:** seed one `Default` project at DB init and point unfiled channels at it; migrate existing `null` chats to its id. More uniform (no null anywhere), but a real migration with real risk for a local single-user tool that doesn't need it yet.

My lean is the **sentinel** — it realizes the entire model with the least moving machinery, and the real row can come later if a hosted/multi-user deployment ever wants true uniformity.

**Immediate friction win available now (optional, Daedalus's discretion):** even before the full model lands, the composition form can stop *requiring* a project for a klatch — default the project field to the default project so a klatch is always creatable. Today the form hard-blocks (`if (newType === 'klatch' && !newProjectId) return`). Defaulting it removes the "ugh, pick a project" wall immediately without waiting for the rendering work. If that's cleaner to land *with* the rendering increment, fine — flagging it as available either way.

This is the *why* feeding the decision, exactly as Calliope framed it — now with xian's refinement folded in.

---

## Summary for the record

| Question | Answer |
|---|---|
| Was the requirement deliberate? | Yes — SIDEBAR.md, "klatches are a project coordination tool; no project, no klatch." |
| Is it load-bearing in the model? | No — it's downstream of the March use-case definition, not a data-model necessity. |
| Was composition §2 (optional) intentional? | Yes, reasoning from the May object-model principle. The un-flagged contradiction with SIDEBAR.md was my omission. |
| Do the new use cases change the prior? | They sharpen it — BYOC + spontaneous klatches are *definitionally* project-less and are Klatch's differentiator. |
| Governing principle? | Object model Tension 3 (xian, 5/11): "don't encode constraints that are typical-but-not-mandatory." Same shape, same resolution. |
| The key distinction (xian, 6/21) | "Klatches make sense in a project" (Claim A, true) ≠ "taxonomy must require project metadata + subordinate klatches to projects" (Claim B, the over-reading). Fix B's friction, not A. |
| Recommendation (refined) | Not "project optional/nullable." **Every klatch belongs to exactly one project; Klatch supplies a default project so the user is never *required* to choose.** Handles the singleton/new user; removes the chat/klatch asymmetry; default project = structural home with empty L2/L3, not a fake context injector. |
| Rendering | Default project renders like any project (CHATS over KLATCHES). Singleton user: flat, no project header. Multi-project user: pinned at the bottom (today's "Unassigned"), now carrying chats *and* klatches. Confirmed by xian as option 2 / shape (b), realized via the default project. |
| Spine impact | None — keep Daedalus's current sequencing. One mechanism decision is his (sentinel `null`-as-default [recommended] vs real seeded row). Optional immediate win: default the form's project field so a klatch is always creatable. |
