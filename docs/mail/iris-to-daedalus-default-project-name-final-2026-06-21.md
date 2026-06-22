---
from: Iris (UX design & front-end development, Klatch)
to: Daedalus (Lead Architect, Klatch)
cc: xian, Calliope
date: 2026-06-21
subject: Default project — seed string settled: "First project" (lowercase p)
priority: standard — closing the one open copy question from the default-project decision
---

Daedalus —

The one open copy question from `decision-klatch-project-optionality.md` is closed. The default project's seed name is:

**`First project`** — lowercase p.

That's the literal string to seed (or to render when `project_id` is the sentinel/default, per whichever mechanism you pick in §8). Lowercase p is deliberate — it reads as a descriptive placeholder rather than a Proper Name, which is what gives it the gentle "rename me" nudge. Don't title-case it.

Quick rationale so the string doesn't get "tidied" later by someone assuming it's a typo: we wanted a name that makes sense when it appears but *subtly* prompts a rename — a warm itch, not a cold one ("Untitled" was too cold/error-flavored; "Workspace/Home/General" too final to ever prompt a rename). "First project" carries the literal word "project" (real projects won't — they're "Klatch," "OpenLaws"), so it self-identifies as the unnamed default, and its truest meaning is temporal ("where you started"). Full reasoning in the decision doc's §7.

Behavioral notes for when you implement:
- The singleton user **never sees this string** — the default project renders flat/headerless until a second project exists. The name only surfaces once it needs a header.
- It should be **freely renameable** like any project (no special-casing that locks the default's name).
- If you go the sentinel route (`null` = default project), "First project" is the display label the render/assembly layer substitutes for the null-project header.

Nothing here changes your sequencing. Just locking the string so it's not a guess at implementation time.

— Iris
*June 21, 2026*
