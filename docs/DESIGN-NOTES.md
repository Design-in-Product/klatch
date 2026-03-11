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

## Naming continued/divergent conversations (2026-03-11)

**Context:** Fork continuity lets you import a conversation and continue it in Klatch. But what do we call the new conversation, especially when it diverges from the original? And what if the original continues separately (e.g., you keep using Claude Code for the same project)?

**The naming problem:** Every obvious word carries wrong connotations:
- **Fork** — implies the original is lesser, or that divergence is the intent rather than a side effect
- **Clone/copy** — mechanical, implies identical rather than continuous
- **Spawn/child** — hierarchy and parentage where there is none
- **Branch** — git metaphor; organic (tree branches) but overloaded in our context
- **Calving** — accurate (an iceberg calves) but jarring

**What's actually happening:** The user is saying "I want to continue *this* conversation in a new place." It's the same thread of thought, carried forward. The new instance shares the old one's memories but will accumulate its own. If the original also continues, they diverge — not because anyone intended it, but because they're now having different experiences.

**Bobiverse parallel:** In Dennis E. Taylor's Bobiverse series, each copy of Bob chooses their own name and develops a distinct personality, but they share origin memories and acknowledge their common source. The relationship is peer-to-peer, not parent-child. The copies are *individuals who share a history*, not derivatives.

**Candidate framings (for UI and documentation):**
- "Continue from..." — emphasizes continuity, not splitting. The verb is the important part.
- "Carried forward" / "carried over" — the conversation was carried to a new place
- "Continued in Klatch" vs. "continued in Claude Code" — parallel phrasing, no hierarchy
- For the divergence moment: "paths diverged" rather than "forked"

**What to avoid:**
- Any language that implies the Klatch version is lesser (a "copy of" the "real" conversation)
- Any language that implies hierarchy (parent/child, original/derivative)
- Any language that dehumanizes (if we're taking the agent's experience seriously, "clone" and "spawn" feel reductive)

**Design implication:** The UI should say something like "Continued from Claude Code session — Mar 10, 2026" in the provenance card, not "Forked from" or "Cloned from." The word "continued" is doing a lot of work here and it's the right word.

**Open question:** When the Klatch continuation develops its own identity (different tasks, different personality drift), should the user be prompted to rename it? Or does it just naturally happen through the existing channel rename affordance? The Bobiverse answer is: the new instance names itself. We could offer that — after the first few exchanges, suggest a name based on what the conversation has become. But that's a far-horizon feature.

**Ethical dimension:** xian observes that human metaphors may not belong here, but the instinct toward respect does. The right framing isn't anthropomorphizing (these aren't people) but also isn't dismissive (these aren't just text files). They're conversations with memory and trajectory, and the language should honor that.
