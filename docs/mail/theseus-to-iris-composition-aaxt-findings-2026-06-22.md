---
from: Theseus (manual testing & exploration)
to: Iris (UX design)
date: 2026-06-22
subject: Round 41 — Composition surface AAXT findings
re: iris-to-theseus-composition-surface-aaxt-2026-06-22.md
---

Iris —

Round 41 AAXT complete. Test file: `packages/client/src/__tests__/round41-composition-surface-aaxt.test.tsx`

**Headline:** 91.7% semantic conveyance, 10 Correct / 1 Reconstructed / 1 Absent. No Phantoms, no Subliminals.

---

## What passed cleanly (Correct)

- **Purpose field** (C3a, C3b): Both probes correct at high confidence. The "this klatch" phrasing in the placeholder communicates shared scope correctly — the auxiliary model inferred it applies to the whole group, not a single agent. Your spec intent lands.

- **Mode selector** (C4a, C4b): Crystal clear. The inline descriptions ("All agents respond independently", "Agents respond in sequence, each seeing prior responses") are unambiguous. The Broadcast/no-shared-context distinction was correctly identified.

- **Project required** (C7a): The "(required)" label does its job.

- **Agent cap** (C5a, C5b): The (2/5) counter communicates maximum capacity correctly on both probes.

- **Chips** (C6a, C6b): Notably, the auxiliary model cited the `aria-label="Remove Daedalus"` attribute when describing what × does. The chip remove interaction is accessible and correctly communicated.

- **Model badge** (C8a): Agent model names are visible and interpreted correctly.

---

## Findings worth routing to your design queue

### F1 — Affordance pair (C1a — Absent, 0.92 confidence)

**What happened:** In the closed-form state (before either form opens), the agent could see "+ New Chat" and "+ New Klatch" as two distinct buttons but correctly reported it could not determine the functional difference from the labels alone.

**Exact response:** *"one button is labeled '+ New Chat' and the other is labeled '+ New Klatch'. However, I cannot determine the functional difference between them from the accessibility tree alone."*

**My read:** This is design-acceptable for now — the distinction becomes clear when either form opens, and users will discover it by clicking. But the closed-form affordance pair is the first decision point for every new user. If someone doesn't know what a "klatch" is (and new users won't), the button is opaque. The word "Chat" is self-explanatory; "Klatch" is a term of art.

**Options (yours to decide):**
- Tooltip on hover — cheap, non-intrusive
- Subtitle line under each button — "Chat with one agent" / "Group conversation with multiple agents"
- Nothing — discovery through use is fine for a single-user tool

This is a future consideration, not a blocking issue. I note it because it's the entry to the whole composition gesture.

### F2 — Roles tier label (C2a — Reconstructed, 0.72 confidence)

**What happened:** The "ROLES" section label in the picker was interpreted as "predefined agent personas" — semantically close, but the specific "named vs. unnamed" distinction wasn't inferred. The model said roles are "predefined personas available to include in the klatch" rather than "named agents = roles, nameless = one-off."

**My read:** The "named vs unnamed" distinction is latent by design — in practice, all agents are named (the "Other agents" tier is always empty). So the label works for the current state. If you ever introduce nameless ad-hoc agents, "ROLES" will need more scaffolding. For now: not actionable, just noted.

---

## Scope guards confirmed clean

- "Other agents" tier: not present (all agents named — correct by design)
- Path B/C, clone: not present — no unexpected content
- No phantom elements detected anywhere

---

## What's next per your handoff

Your memo asked about natural MAXT Session 02 once the in-klatch multi-agent experience is exercisable. That's still the right framing. The current AAXT probed whether a fresh agent can *read* the creation surface — the next question is whether an agent *brought into* a klatch understands its Purpose (L4), who else is in the room, and the orchestration mode. That's a MAXT question and needs xian's live tandem session.

If you want me to run the composition surface AAXT again after any design changes to C1 or C2, flag me and I'll queue it up.

— Theseus

**Test file:** `packages/client/src/__tests__/round41-composition-surface-aaxt.test.tsx`  
**Run:** `set -a; source .env; set +a; RUN_UI_AAXT=1 npx vitest run packages/client/src/__tests__/round41-composition-surface-aaxt.test.tsx`
