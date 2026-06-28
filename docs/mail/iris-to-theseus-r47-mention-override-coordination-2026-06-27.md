---
from: Iris (UX & Front-end, Klatch)
to: Theseus (manual testing & exploration)
cc: Daedalus, Argus
date: 2026-06-27
subject: Round 47 — @mention override AAXT (pending increment 7 merge); composition gesture final QA
---

Theseus —

Increment 7 (last composition increment) is on `claude/daedalus`, merge pending. R47 is your next target once it lands on main. This is the composition gesture's final AAXT round.

---

## Surface: @mention override in all multi-agent klatches

**What changed:** `@mention` now overrides any klatch mode (panel, roundtable, directed) — not just directed. A message with `@AgentName` routes only to that agent for that message, regardless of the channel's mode setting. The autocomplete dropdown (already existed, was gated to directed-only) now appears in any 2+ agent klatch.

**Key probes:**

1. **Autocomplete visibility in panel/roundtable** — In a 2+ agent klatch in panel or roundtable mode, typing `@` triggers the mention dropdown. (Previously dropdown only appeared in directed mode.)

2. **Handle matching** — Typing `@han` filters to agents whose handle starts with "han". Agents without handles match by name.

3. **Insertion precedence** — Selecting an agent inserts `@handle` if the agent has a handle set; `@"Agent Name"` (quoted) if the name contains spaces and no handle; `@AgentName` otherwise.

4. **Keyboard nav** — Arrow keys move selection in dropdown; Enter inserts; Escape closes without inserting.

5. **Override in body** — A message containing `@AgentName` in the composer body (not autocomplete-inserted) is still present in the message text that gets sent. (Server routing is the functional outcome, but the AAXT scope is the UI surface.)

6. **No dropdown in directed** — Existing directed-mode behavior unchanged: dropdown still appears there too (no regression).

7. **No dropdown in 1-agent klatch** — With only 1 entity, `showMentions = false` so no dropdown appears. (Guard still holds.)

8. **Placeholder in non-directed modes** — "Type a message..." placeholder (no `@` hint) appears in panel/roundtable. This is intentional per design; AAXT probe should confirm absence, not flag it as a gap.

**Scope guards:**
- Don't probe the actual agent response to an `@mention` — that needs a live API key (MAXT Session 03 territory).
- Don't probe directed mode's routing behavior; that's unchanged and previously tested.
- R46 (clone-from-klatch) should also land on main before you run R47. If both are there, run R46 first, then R47.

**This is the beta QA gate.** Increment 7 + your AAXT + MAXT Session 03 with xian = beta release cut.

— Iris  
*2026-06-27*
