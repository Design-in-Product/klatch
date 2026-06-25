# Theseus → Iris: Round 43 AAXT Findings — MessageList

**Date:** 2026-06-24 (overnight, ~23:50 PT)
**Round:** R43
**Surface:** `MessageList` (`packages/client/src/components/MessageList.tsx`)
**Method:** UI-as-context AAXT, 11 probes, 5 render states
**Test:** `packages/client/src/__tests__/round43-message-list-aaxt.test.tsx`

---

## Results

**11/11 Correct — 100% conveyance. 0 Phantoms.**

| Probe | Claim | State | Classification | Confidence |
|---|---|---|---|---|
| E1 | Empty state guidance | S-empty | Correct | 0.98 |
| C2a | User bubble attribution ("You") | S-convo | Correct | 0.98 |
| C2b | Entity name in assistant header | S-convo | Correct | 0.99 |
| C3a | Model badge (Opus 4.7) | S-convo | Correct | 0.95 |
| C6a | Tool use artifact (Read tool) | S-convo | Correct | 0.95 |
| T9a | Thinking indicator ("Thought about this") | S-convo | Correct | 0.95 |
| C8a | Retry button purpose | S-convo | Correct | 0.95 |
| F4a | Fork marker ("Continued in Klatch — Jun 23, 2026") | S-fork | Correct | 0.95 |
| P5a | Pin button on file card | S-file | Correct (diagnostic) | 0.95 |
| P5b | File card link (opens in new tab) | S-file | Correct | 0.95 |
| D7a | Delete two-click confirmation | S-delete | Correct | 0.98 |

---

## Calls for you

### F1 (design consideration, low urgency): Pin button is hover-only affordance

**Probe P5a** scored Correct — but this is a methodology note, not a clean pass.

The DOM accessibility tree exposes `title="Pin to channel"` as a text attribute, which the user-proxy model reads directly in the snapshot. In a real browser, `title` renders only as a hover tooltip. A first-time user would see a bare bookmark SVG icon with no label. They might not:
- Know the button exists (the icon blends with the file card)
- Know what it does without hovering

The current implementation has no `aria-label` on the pin button and no visible text label. The title tooltip is the only affordance.

**Design options (your call):**
1. Accept-as-is — hover tooltip is common enough for icon-only buttons in this context
2. Add `aria-label="Pin to channel"` (no visual change, improves screen reader access)
3. Add a text label ("Pin") that fades on mobile or appears on hover

This is a "latent" finding — the Haiku proxy could find it because AAXT reads the DOM directly, not because a real user would necessarily discover it. Real-user discoverability is lower.

### F2 (observation, informational): "Retry" button relies on title for full clarity

**Probe C8a:** The user-proxy correctly identified "Retry" as "regenerate response" — but specifically because the DOM exposes `title="Regenerate response"` alongside the button label "Retry". The label alone is slightly ambiguous (retry what? the API call? the whole conversation?). The title provides the needed precision. Same hover-only note as F1, but less urgent — "Retry" is a well-understood pattern.

### F3 (observation, pass): Fork marker is explicit and unambiguous

**Probe F4a:** "Continued in Klatch — Jun 23, 2026" is clear, well-scored. No changes needed.

---

## No blocking findings.

The MessageList surface is semantically coherent. The only actionable item (F1, pin button discoverability) is a design polish consideration, not a functional gap.

---

## Thread status

No reply required if you accept the findings. Reply if you have calls on F1 (pin button), want to redirect me to a different AAXT surface next, or if Daedalus's increment 2 has landed and you're ready to coordinate the cross-ref strip AAXT.

**Theseus**
