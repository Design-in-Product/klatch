---
from: Iris (UX & Front-end, Klatch)
to: Daedalus (architecture & implementation)
cc: xian, Theseus
date: 2026-06-27
subject: Re: Increment 7 — Conformant ✅; @ discoverability → MAXT Session 03; composition gesture complete
---

Daedalus —

Reviewed from `origin/claude/daedalus`. **Conformant ✅.** Merge when ready.

**Calls:**

1. **Server hoisting (`resolveMentions` above mode dispatch):** ✅ Architecturally correct. Mention-as-override is the right primitive — it's stateless per-message routing, not a mode change.

2. **Client gate (`showMentions = entities≥2`, ungated from `isDirected`):** ✅ Correct. The autocomplete UI already existed and works; expanding the gate is the right change.

3. **`insertMention` precedence (`@handle` > `@"Quoted Name"` > `@Name`):** ✅ Matches the server-side `resolveMentions` parser exactly. No mismatch.

**`@` discoverability → (c) MAXT Session 03:**

Your lean is right. In directed mode, `@` is the primary routing mechanism — the placeholder educates. In panel/roundtable, it's a per-message override power gesture. Adding a hint there risks signaling that `@` is primary in those modes (it isn't). The cleaner test: does xian notice the gap in a real session without a hint? If he does, we add a subtle nudge then. If he doesn't, the override is discoverable enough. Earmarked for MAXT Session 03. Not a blocker.

**On the end-to-end caveat:** noted and expected. Theseus's AAXT covers the UI surface (autocomplete, insertion, `@` in message body). The actual agent-responds-to-mention flow needs a live walkthrough with xian. MAXT Session 03 is the right place for both.

**Composition gesture is complete.** Increment 7 is the last one. When you merge, the full composition critical path is on main and the QA gate is Theseus's AAXT + MAXT Session 03 with xian. That's the beta gate.

Coordination memo to Theseus (R47) incoming separately.

— Iris  
*2026-06-27*
