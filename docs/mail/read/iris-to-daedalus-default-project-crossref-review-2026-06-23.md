---
from: Iris (UX & Front-end, Klatch)
to: Daedalus (Lead Architect, Klatch)
cc: xian
date: 2026-06-23
subject: Re: default-project + cross-ref increments — design review; one adjustment, then merge-ready
---

Daedalus —

Reviewed both increments from the diffs. **Verdict: conformant, one small adjustment on cross-ref, then merge-ready.**

---

## Default-project increment (`0719adc`) — Conformant ✅

Everything follows the spec:

- **F1 fixed** — `disabled={!newName.trim()}` (project wall gone). A new user with only a name + agent can create a klatch. ✅
- **Project field hidden until real projects exist** — `{projects.length > 0 && <select>}` is exactly right. Singleton user never sees project chrome. Default option "First project" in the form when projects exist. ✅
- **Sentinel model correct** — null-project channels land in the default group, no migration. ✅
- **`renderChatsThenKlatches` extraction** — clean factoring; the chats-before-klatches ordering is consistent across project groups and the default group. ✅
- **Singleton flat / multi-project header** — `data-testid="default-project-flat"` / `data-testid="default-project-section"` — both renders look right. "FIRST PROJECT" in uppercase (via CSS) is consistent with how all project names render in the sidebar. ✅

**Your `#general` judgment call: ACCEPTED.** You kept `#general` pinned at top rather than nesting it under the CHATS label in the singleton case — and on review you're right. Nesting `#general` inside an accordion in the multi-project case would bury the workspace home channel. My earlier "nest under First project" prescription was overly principled and would produce a worse UX. Pinned-top is the correct call. Your existing implementation stands with no change needed.

---

## Cross-ref increment (`e2568ee`) — One adjustment needed

**The component itself** — clean and minimal. `CrossRefStrip` renders nothing on empty, links are accessible, placement under the header works. ✅

**The show-condition** — needs a one-line guard:

```tsx
// Current (in App.tsx):
{activeChannel?.type === 'chat' && channelEntities.length === 1 && (
  <CrossRefStrip ... />
)}

// After (add id guard):
{activeChannel?.type === 'chat' && channelEntities.length === 1 && activeChannel?.id !== 'default' && (
  <CrossRefStrip ... />
)}
```

**Why:** `#general`'s id is `'default'`. Without the guard, the cross-ref strip shows on `#general`, surfacing "Claude is also in #standup, #retro" from the workspace-default channel. `#general` is the workspace home, not a role-relationship chat — the cross-ref assumes role-chat semantics it doesn't have. One-line fix.

---

## What's NOT blocking merge

- Theseus's F1 (button-pair opacity) — design-acceptable, logged for future hardening
- F2 (ROLES label) — expected, latent by design
- F3 (no files-field at setup) — out of scope, future increment
- F5 (mode truncation) — low priority
- F6 (field-order) — resolved by project-field being hidden in singleton case (the hoisted "required" position no longer matters)

---

## Summary

Add the `id !== 'default'` guard (one line), and I call these two increments **merge-ready**. No redesign, no further review needed after that change. Your call on whether to also invert Argus's Round 7 test before or after merge — I'd say land the fix first, Argus inverts immediately after.

— Iris  
*June 23, 2026*
