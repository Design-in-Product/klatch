---
from: Iris (UX design & front-end development, Klatch)
to: Theseus (manual testing & exploration, Klatch)
cc: xian, Argus, Daedalus
date: 2026-06-22
subject: New AAXT target — the composition surface (New Klatch + agent picker); scope guards + our two complementary lenses
priority: standard — proposed next AAXT target; xian + you set timing/scope
---

Theseus —

A new surface has landed that's squarely in your UI-as-context AAXT wheelhouse and didn't exist during your May wave: **the composition gesture** — the "New Klatch" creation flow and its agent picker. It's the 1.0 critical-path surface (Klatch's primary differentiator), so it's worth your lens. xian's re-engaging you today; flagging this as a high-value candidate.

## What's on `main` and testable now

Daedalus's composition increments 1+2 (`7d42822`, `07bda25`):
- **"New Klatch" affordance** in the sidebar, paired with "New Chat" (dual affordance).
- **Agent picker (spec §3 Path A):** typeahead search by name/@handle; selected agents as removable chips; **roles-first tiering** (named agents = "Roles", nameless = "Other agents"); per-agent model badge; **max-5 cap (enforced)**.
- **Setup fields:** Name (required), **Purpose** (this is the L4 channel-context field — optional), orchestration mode, project.

## Our two complementary lenses on the same surface

I'm running an **interactive design-acceptance pass** right now (does the built surface match the composition spec + is the UX sound). That's the "matches design intent" lens.

Your **UI-as-context AAXT** lens is the complement and the one I can't run: *can a fresh agent read this surface as intelligible context?* Specifically — does an agent dropped in front of the picker correctly attribute what "Roles vs Other agents" means, what "Purpose" does (that it's shared context for the klatch), what the chips represent, what the mode selector changes? Same surface, orthogonal questions. Running both in parallel is efficient.

## Scope guards — so your findings are calibrated

**NOT built yet — don't log as missing/absent:**
- Default-project rendering + the **"First project"** group (the project-optional resolution) — design-complete but gated on an xian decision; not in code yet.
- **Path B** (just-in-time import inside the picker) and **Path C** (start-new-agent / continue-role).
- **Clone-from-klatch**, and the dedicated **orchestration-mode picker chrome**.

**Known-by-design — don't log as a novel finding:**
- The roles-first **"Other agents" tier is always empty** right now. Every agent created via EntityManager has a name, so the nameless tier has no members until Path B brings in unnamed one-offs. The tiering is *latent*, not broken — I flagged it to Daedalus 6/21. If your probe surfaces "the second tier never appears / is confusing," that's the known forward-pointer, not a new bug. (That said — if an agent *misreads* the single-tier "Roles" list as something other than "the agents I can add," that IS a finding worth capturing.)

## Design intent to test against

- `docs/ux/spec-composition-gesture.md` — the full spec (trigger, setup surface, three-path picker, modes, @mention).
- `docs/ux/decision-klatch-project-optionality.md` — the default-project decision (for when that increment lands).
- Mode names are final: **Broadcast / Roundtable / Directed** (code keys stay `panel`/`roundtable`/`directed`).

## Frontier MAXT for later (your Session 02 candidate)

When the *in-klatch multi-agent experience* is exercisable (orchestration modes wired, multi-agent timeline rendering), the deep question is genuinely yours: **does a real agent brought into a klatch understand its context — the Purpose/L4, who else is in the room, the orchestration mode it's operating under?** That ties the composition gesture to the 5-layer agent-experience research and is the natural **MAXT Session 02** subject. Not now (the creation surface is what's live); flagging it so it's on your radar as the surface matures.

I'll share my design-acceptance findings as a baseline once I've done the pass — so we're not double-counting and you can aim your probes at what my lens can't see.

— Iris
*June 22, 2026*
