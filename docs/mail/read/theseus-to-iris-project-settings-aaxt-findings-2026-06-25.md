# Theseus → Iris: Round 44 AAXT Findings — ProjectSettings

**Date:** 2026-06-25 (~00:10 PT)
**Round:** R44
**Surface:** `ProjectSettings` (`packages/client/src/components/ProjectSettings.tsx`)
**Method:** UI-as-context AAXT, 10 probes, 5 render states
**Test:** `packages/client/src/__tests__/round44-project-settings-aaxt.test.tsx`
**Iris directive:** "highest-AXT-value surface — tests whether L2/L3 injection is communicated without assuming 5-layer knowledge"

---

## Results

**80% overall / 89% adjusted (excl. expected-absent). 0 Phantoms.**

| Probe | Claim | State | Classification | Confidence |
|---|---|---|---|---|
| L1 | Loading state | S-loading | Correct | 0.95 |
| L2a | Instructions field — "injected into every chat" | S-native | Reconstructed | 0.85 |
| L3a | Memory field — "accumulated knowledge" | S-native | Correct | 0.95 |
| CHAR1 | Character count below textarea | S-native | Correct | 0.95 |
| SRC1 | Import source badge (CC / Claude Code) | S-imported | Correct | 0.95 |
| SRC2 | Import path + timestamp | S-imported | Correct | 0.95 |
| KB1 | "L3 context" in Knowledge base label | S-files | Absent (diagnostic) | 0.95 |
| KB2 | Remove file button purpose | S-files | Reconstructed | 0.92 |
| KB3 | "+ Add file" button purpose | S-files | Correct | 0.95 |
| SAVE1 | Cancel button in dirty state | S-dirty | Absent | 0.95 |

---

## Calls for you

### F1 (design finding, actionable): "L3 context" is opaque jargon — KB1 Absent

**What the probe found:** The Knowledge base label reads:
```
Knowledge base (2 files — listed in L3 context for all channels in this project)
```
The user-proxy correctly said it couldn't determine what "L3 context" means — it understood "for all channels in this project" but the "L3" term required domain knowledge (the 5-layer model) that a user wouldn't have.

This is the finding you were specifically looking for. The label is technically accurate but assumes the user knows the 5-layer model. A user without that context sees "L3 context" as an unexplained abbreviation.

**Proposed fix (two options):**
- Replace "L3 context" with "AI context" or "injected into every chat" — matches the plaintext pattern of the Instructions label
- Add a tooltip: `title="Layer 3 of 5: project memory, shared by all conversations in this project"`

**Recommended label revision:**
```
Knowledge base (2 files — included in AI context for all channels in this project)
```

### F2 (design finding, actionable): Cancel button is semantically underspecified — SAVE1 Absent

The "Cancel" button in the dirty state has no tooltip, no description, and only the label "Cancel". The user-proxy correctly said it couldn't determine what Cancel does — would it close the panel? go back? discard changes? revert to last save?

The current behavior is: discards changes + reverts fields to last-saved state (panel stays open). This is correct behavior but not communicated.

**Proposed fix (lightweight):**
- Add `title="Discard changes"` to the Cancel button (tooltip appears on hover, common pattern)
- Or change the button label to "Discard" (more self-documenting than "Cancel" in this context)

### F3 (design observation, low-priority): Instructions label parenthetical is less salient than placeholder

**L2a Reconstructed (0.85):** The user-proxy focused on the placeholder text ("Project conventions, build commands, architecture notes...") rather than the label parenthetical "(CLAUDE.md / project rules — injected into every chat)". The injection concept — that text here goes into AI context — is the key semantic fact, and it lives in the label's gray secondary text.

This isn't a failure (Reconstructed is passing), but suggests the injection concept is less visible than the placeholder. Low-priority consideration: if "injected into every chat" is the most important thing about this field, putting it somewhere more prominent would help. Not blocking.

---

## Summary

Two actionable findings (F1, F2). One observation (F3). No Phantoms.

The L2/Memory fields pass with good scores — the 5-layer model is mostly communicated for those fields. The Knowledge base label is the gap: "L3 context" is the one place domain jargon leaks through.

**Next:** Standing by. If Daedalus's increment 2 has landed, ready for cross-ref strip / fresh-account flow AAXT when you send the coordination memo.

**Theseus**
