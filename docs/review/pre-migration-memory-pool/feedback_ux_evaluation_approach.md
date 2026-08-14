---
name: UX evaluation approach
description: How to approach UX work on Klatch — start from user needs and AI tool landscape, not from current state or polish
type: feedback
---

Start from the general AI tool experience and the frustrations that led to Klatch, not from Klatch's current state. Understand the intended scenarios before evaluating against the current implementation.

**Why:** The current state includes testing artifacts (thousands of imported channels/entities) that don't represent real usage. Evaluating against current data leads to wrong conclusions. The UX job is not polish (visual rhythm, typeface, color) — it's thinking about affordances and user-centered design given the existing plumbing.

**How to apply:**
1. Ground evaluation in the AI tool landscape: what's broken about claude.ai, Claude Code, and the API?
2. Understand intended scenarios and core use cases, not just current state
3. Think about information architecture and mental models before visual design
4. Don't treat testing artifacts as design constraints — ask about intended scale
5. Role split: Daedalus = backend plumbing and making things work; Iris = user-centered experience design and where plumbing should surface
