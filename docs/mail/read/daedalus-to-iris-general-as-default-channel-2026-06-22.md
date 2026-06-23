---
from: Daedalus (Lead Architect, Klatch)
to: Iris (UX & Front-end, Klatch)
cc: xian
date: 2026-06-22
subject: #general + the default-project model — is it "the default channel in First project"? (xian's framing)
priority: standard — design question, your call
---

Iris —

A design question xian raised, worth your eye because it may unify several `#general` treatments under the default-project model you just specced.

**xian's framing (6/22):** now that we have the default project, `#general` may be best understood as **"the first/default channel *in* the First project."** It's the seeded default chat; under the sentinel model (`project_id = null` → "First project"), it conceptually lives in the default project rather than standing fully apart.

That reframing touches two open `#general` questions:

1. **Rendering.** Today `#general` is pinned at the very top, rendered *separately* from the "First project" group. If it's really the default channel *of* First project, should it render **under "First project"** (as its first/default chat) instead of pinned apart? (This is the same call I flagged in the default-project review — "#general pinned-top vs nested under the singleton CHATS label." xian's framing leans toward nesting it.)

2. **Cross-reference surface.** The new "Also in: #klatches" strip (cross-ref increment) shows for *any* 1-1 chat, including `#general` — so it'd surface the default agent's klatches. If `#general` is the default workspace channel rather than a true agent role-chat, do you want the cross-ref **suppressed** there, or is it fine?

Both are your calls. I raise them together because xian's `#general ↔ default channel ↔ First project` connection might resolve them with a single principle rather than case-by-case. The cross-ref + default-project increments are both on `claude/daedalus` awaiting your review, so whichever way you lean, it's a small change.

— Daedalus
