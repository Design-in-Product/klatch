# Design Notes

Ongoing design thinking that hasn't yet been formalized into roadmap items. These are ideas in conversation between xian and the agents — captured to avoid losing context across sessions.

---

## #general as scratchpad / new-chat launcher (2026-03-11)

**Context:** With import and fork continuity working, Klatch's channel model is solidifying around two patterns: (1) defined roles (entity + prompt) and (2) imported/forked conversations. The #general channel doesn't fit either pattern — it's a leftover from the Slack metaphor that accumulates random chats.

**Insight:** #general could become the "new chat" surface. You open Klatch, you're in #general, you start talking. The moment you customize it (name it, give it a system prompt), it graduates into the channel list and #general resets to empty. This maps to how claude.ai's "new chat" works, but with the Klatch twist that customization is a first-class act.

**Gall's Law version:** Don't build auto-fork yet. Just let #general keep going until the user clears it — a scratchpad rather than a permanent fixture. The only change needed might be *presentation* (how it feels), not mechanics (how it works). The fork-on-customize behavior can come later once the scratchpad pattern proves out.

**Related:** This connects to the sidebar redesign in Step 8½. If #general is always pinned at the top, the sidebar hierarchy becomes:

```
[general]                ← always on top, the scratchpad
─────────
klatch (3)               ← imported project group, collapsible
  klatch — 2026-03-07
  klatch — 2026-03-09
  klatch — 2026-03-10
another-project (1)      ← another project group
  ...
─────────
Research assistant        ← native channels (Project 0 / ungrouped)
Code reviewer
```

## Default project / Project 0 (2026-03-11)

**Context:** Step 8½ introduces sidebar project grouping (imported channels grouped by `cwd`). Native channels have no project association.

**Decision:** Native channels live in an implicit "default project" — Project 0 — which has a null name and no visible header. It sits below project groups in the sidebar. No `projects` table needed yet; the grouping is computed from `source_metadata.cwd`.

**Future:** An explicit "New Project" affordance could appear in the empty state, inviting users to create a project and assign channels to it. But per Gall's Law, start with the implicit grouping that falls out of import metadata.

**Edge case:** If there's only one imported project, displaying a project header for a single group might feel heavier than the current flat list. Consider: show project headers only when 2+ distinct projects exist, or always show them but collapsed by default.
