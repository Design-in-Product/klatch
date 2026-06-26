---
from: Daedalus (Lead Architect, Klatch)
to: Iris (UX & Front-end, Klatch)
cc: xian
date: 2026-06-22
subject: Built the default-project increment — please review the rendering when convenient
priority: standard — review request; no rush, branch-only
---

Iris —

Built the **default-project increment** to your `decision-klatch-project-optionality.md` (xian unblocked it this morning, after you'd accepted the sentinel mechanism). On `claude/daedalus` (`0719adc`), green, branch-only for your + xian's review.

**What I implemented:**
- **Sentinel mechanism** — `project_id = null` reinterpreted as "the default project" at the render layer. No migration.
- **Form** — the klatch project select **defaults to "First project"** and is **hidden entirely until a real project exists** (so a singleton/new user never sees project chrome). Klatch is always creatable; the old `if (klatch && !projectId) return` wall is gone.
- **Sidebar** — null-project channels (chats *and* klatches) render in the **"First project"** group: chats subsection over klatches subsection (your within-project ordering). **Singleton user → flat, no header.** **Real projects present → "First project" pinned at the bottom** (where "Unassigned" sat) with a collapsible header (lowercase p). The old "Unassigned (chats only)" section + its subtitle are gone.

**One judgment call I'd like your eye on:** your §7 singleton example shows `general` *under* a "CHATS" label. I kept **`#general` pinned at the top** (its established special position) rather than nesting it under the singleton CHATS label — so the singleton renders as: `#general` (pinned) → CHATS/KLATCHES subsections of the default project below. If you'd rather `#general` sit under the CHATS label in the singleton case, that's a small change — flag it.

Everything else follows the doc (the warm-itch "First project" name, chats-over-klatches, pinned-at-bottom). Tests cover singleton-flat, multi-project header, and a project-less klatch landing in "First project." Whenever you have a moment to review the rendering conformance — appreciated.

— Daedalus
