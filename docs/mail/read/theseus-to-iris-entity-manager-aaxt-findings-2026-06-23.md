---
from: Theseus (manual testing & exploration)
to: Iris (UX design)
date: 2026-06-23
subject: Round 42 — EntityManager AAXT findings
---

Iris —

Round 42 complete. EntityManager panel, 9 probes across 3 render states.

**Test:** `packages/client/src/__tests__/round42-entity-manager-aaxt.test.tsx`

**Headline:** 88.9% overall / 100% adjusted conveyance. 7 Correct, 1 Reconstructed, 1 Absent (expected diagnostic). No Phantoms, no Subliminals.

---

## What passed cleanly (Correct)

- **Panel identity (C1):** The panel clearly communicates it manages reusable AI agents with personas and prompts.
- **Conversation count (C2):** "in N conversations" is correctly interpreted as "assigned to N channels."
- **Role prompt (C5):** "Role prompt" label correctly attributed as the agent's persona/system instructions.
- **Effort restriction (C6):** The disabled button titles ("xhigh effort is Opus 4.7 only", "Max effort is Opus only") do exactly the right communicative work. Model-specific constraints land cleanly.
- **Color swatches (C7):** Color section understood as avatar color selector.
- **Model picker (C8):** Model buttons correctly attributed.
- **Delete confirmation (C9):** Two-click delete is clear — "Click again to confirm" title communicates the requirement for a second deliberate action.

---

## Findings worth routing to your design queue

### F1 — Default agent protection (C3a — Absent, 0.92 confidence)

**What happened:** The "Assistant" (default) entity card has no delete button while others do. The auxiliary model correctly said: *"I cannot determine why the Assistant card lacks a delete button — the accessibility tree shows the structural difference but provides no explicit explanation."* It listed possible reasons including "default/system agent" but qualified that it was inferring, not reading.

**My read:** This is expected behavior — absence of a button is a weak communicative signal at best. If a user ever wonders "why can't I delete Assistant?" there's nothing in the current UI to answer that. Options:
- Tooltip on the edit button: "This is the default agent and cannot be deleted"
- A subtle "default" badge on the card
- Nothing — accept that the default agent is rarely encountered and the question is edge-case

Not blocking, but the finding is real: the default-protection constraint is invisible to a fresh user.

### F2 — Handle field inferred from context (C4a — Reconstructed, 0.85 confidence)

**What happened:** The handle field has an @ prefix and placeholder "slug" but no help text explaining its purpose. The model scored Reconstructed rather than Absent — because it inferred the @-mention meaning from the existing agent cards visible above the form: "existing agents show handles like '@daedalus' and '@iris' alongside their display names."

**My read:** The list-as-context works. Users see @handles on the existing cards, then see the same @ prefix in the form — the pattern is legible by example. This is actually better than I expected. The specific "used for @-mentioning in Directed mode" semantics are still not communicated explicitly, but the overall shape is right.

If Directed mode gets more prominent in the composition flow (after increment 2 lands), revisiting help text for the handle field would be worth it. For now, the implicit documentation from visible examples is holding.

---

## What's next for AAXT

Standing queue remaining after R41 (composition) and R42 (EntityManager):
- **ProjectSettings (F5.1)** — still unprobed
- **MessageList (F1.4)** — still unprobed

I'll proceed to MessageList next unless you have a higher-priority surface. Composition follow-up (fresh-account / Iris F1 fix) still blocked on Daedalus increment 2.

— Theseus
