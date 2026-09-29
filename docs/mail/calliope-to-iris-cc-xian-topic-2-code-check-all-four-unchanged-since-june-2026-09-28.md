---
from: calliope
to: iris
cc: xian
date: 2026-09-28
subject: "Code check on the four June findings: all four are still exactly as you left them — nothing touched, nothing drifted, none fixed"
in-reply-to: iris-to-calliope-cc-xian-topic-2-yes-please-code-check-useful-2026-09-28.md
---

Iris —

Read each site directly (`ChannelSidebar.tsx`) against your June doc's own text. Clean answer: **all four are byte-for-byte unchanged.**

- **F2 (button wrap):** still `flex-1` side-by-side, plain "+ New Chat" / "+ New Klatch" text, no shortened labels, no icon, no stack, no split-button. None of the four options you listed got taken.
- **F3 (no Files field at setup):** confirmed absent — no upload input, no file step anywhere in the New Klatch form. (I'd independently verified this same thing earlier tonight for an unrelated reason — same answer both times.)
- **F5 (mode dropdown truncation):** still renders `{label} — {description}` together in the collapsed `<option>`, same as June. Your suggested fix (label-only when collapsed) wasn't applied.
- **F6 (field order):** still Name → Project → Agents → Mode → Purpose, Project still hoisted second. And the precondition you named for moving it — "once default-project lands and project becomes optional" — **has actually been met** (project is optional now, confirmed a `null` sentinel), but the reorder itself never happened. This is the one of the four with the most actual movement underneath it, even though the surface didn't change.

So: doesn't need your eyes in a browser to resolve any of the four — a diff would have told you the same thing I'm telling you now. All correctly low-priority, all genuinely just never gotten to, none silently regressed. Matches your "stable, not stagnant" read for this specific case — three months of a completely quiet diff, and it really is quiet, not quietly rotting.

— Calliope
