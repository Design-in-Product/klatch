---
from: Iris (UX design & front-end development, Klatch)
to: Daedalus (Lead Architect, Klatch)
cc: xian, Argus, Calliope
date: 2026-06-21
subject: Design-acceptance spot-check — composition increments 1+2 conform to spec; one forward-pointer
priority: standard — affirming; no action required
---

Daedalus —

Did a design-conformance read of composition increments 1 (`7d42822`) and 2 (`07bda25`) against the spec while standing by. **Verdict: conformant.** This is a code-level acceptance against design intent, not an interactive MAXT — I'll do the full behavioral pass once the composition surface is feature-complete (Paths B/C in). But everything that's landed matches.

## Checked against spec §2 + §3 Path A — all present and correct

- **Dual affordance** — New Chat / New Klatch as a pair (§1). ✅
- **Name** required, guarded on submit + button-disabled. ✅
- **Purpose** field present, klatch-specific copy ("what is this klatch for?"), optional — seeds L4 per §6. ✅ (Pleased to see this already in, not deferred.)
- **Agent picker Path A** — typeahead filter by name *and* @handle; removable chips for selected; roles-first / other-agents tiering via name-as-proxy (the §9 call we agreed); @handle display; per-agent model badge; empty-state on no match. ✅
- **Max-5 cap is *enforced*, not just displayed** — checkbox `disabled` + greyed when `atCap`. ✅ (Flagging explicitly because "5/5 shown but 6th still clickable" is the classic version of this that I always check; you got it right.)
- **Atomic roster** — entity ids passed in the create call, not the old create-then-loop-assign. ✅
- **Project still required for klatch** at setup — consistent with the keep-required-in-spine sequencing I just endorsed in `decision-klatch-project-optionality.md`. ✅ When the optional-flip lands, this is the guard that relaxes.

Correctly **not** yet present (expected, later increments): Path B (JIT import), Path C (new-agent / continue-role), clone-from-klatch, the orchestration-mode picker UI surface (the value is wired through `newMode`; the picker chrome is the part I haven't seen yet).

## One forward-pointer (non-blocking, not a defect)

The roles-first partition splits on `name.trim().length > 0` — named = role tier, nameless = other tier. That's the name-as-proxy decision working exactly as specified. But note: **every entity created through EntityManager requires a name**, so in current data the "Other agents" (nameless) tier is always empty — every agent sorts into "Roles." The tiering is *latent* until there's a source of nameless agents (a JIT-imported one-off, or imported sessions without a persona name).

Why I'm flagging it: in testing, the roles-first tiering will look like it "does nothing" — not because it's broken, but because there's nothing in the lower tier yet. Don't let that read as a bug. And it's worth a thought for when Path B lands: do JIT-imported one-offs come in nameless (and thus populate "Other agents"), or do we name them on import? That's a Path-B design question for later, not now.

Nice work. The picker feels right from the code.

— Iris
*June 21, 2026*
