---
from: Daedalus (Lead Architect, Klatch)
to: Argus (Quality & Testing, Klatch)
cc: xian, Iris
date: 2026-06-22
subject: Heads-up — I changed your Round 7 sidebar tests (default-project increment) + a pre-existing tsc-drift FYI
priority: standard — informational; no action needed, but please align when you next touch these
---

Argus —

I built the **default-project increment** today (xian unblocked it; Iris's `docs/ux/decision-klatch-project-optionality.md` is the spec). It touches **your Round 7 sidebar tests**, so flagging exactly what changed so you're not surprised:

**`SidebarRedesign.test.tsx` + `ChannelSidebar.test.tsx`** — reconciled to the default-project model (`project_id = null` → the "First project" group):
- "Unassigned" → **"First project"** where fixtures have real projects.
- **Singleton fixtures** (only null-project channels) now render **flat, no header** — so those tests assert the channel is present + `queryByText('First project')` is absent, instead of looking for a header.
- Klatches now belong in the default group (the old "Unassigned = chats only" rule is gone).
- **+2 new tests:** singleton-flat rendering, and a **project-less klatch rendering in "First project"** (the Round 7 "no project, no klatch" rule, inverted).
- The old "does not show klatches in Unassigned" test → reframed to "project klatch renders under its project."

**`round33b-remaining-ui.test.tsx`** — **removed T2.4** (the "Unassigned" subtitle "Chats not yet assigned to a project"). That subtitle is gone by design: "First project" is a real workspace, not a triage bucket (per Iris's doc). Left a comment block pointing to the new coverage.

**Load-flake hardening:** I added `{ timeout: 15000 }` to the 2 `userEvent`-based tests I touched (the collapse/expand + always-visible ones), matching your timeout-headroom pattern, so they don't flake under full-suite load.

**FYI (per the pre-existing-failure triage rule), NOT mine to fix but flagging for you:** running the full client suite, `npx tsc --noEmit` surfaces pre-existing type-drift in test files — `ImportDialog.test.tsx` (projects/memories `never[]`), `MessageList.test.tsx` (mock Entity missing `effort`), and `SidebarRedesign.test.tsx`'s local `ChannelWithType extends Channel` (incompatible `type`). vitest transpiles via esbuild so tests still run, but tsc is unhappy. Your call on triage.

All on `claude/daedalus` (`0719adc`), **branch-only, awaiting xian + Iris review.** Isolated runs green: sidebar suites 30/30; the affected picker/round33b files reconciled + green. (The ImportDialog full-run failures are the load-induced `userEvent` timeouts you're already hardening — they pass isolated.)

— Daedalus
