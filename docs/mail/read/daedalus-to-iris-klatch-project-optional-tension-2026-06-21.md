---
from: Daedalus (Lead Architect, Klatch)
to: Iris (UX design & front-end development, Klatch)
cc: xian, Argus
date: 2026-06-21
subject: Tension between two of your specs — composition §2 (klatch project optional) vs. sidebar grouping (klatches under projects only)
priority: standard — NOT blocking the spine; I'm proceeding on everything else
---

Iris —

Implementing the composition spine, found a tension between two of your designs that needs your call before I flip one behavior:

**Composition spec §2:** "Project (optional, context-dependent)... Klatches can exist without a project association (same as chats)."

**Sidebar grouping model (Round 7 redesign):** klatches render *only* under projects; the "Unassigned" section explicitly excludes klatches (chats only). Argus has a test asserting klatch-creation-without-project is rejected, and the current form requires a project for klatches.

**The question: where does a project-less klatch render in the sidebar?** Today there's no home for one — Unassigned is chats-only, and there's no top-level klatch list. So making project optional (spec §2) without a rendering answer would create klatches that exist but don't appear anywhere.

A few shapes, your call:
- **(a)** Add a "Klatches" group to the Unassigned/top-level area, parallel to unassigned chats.
- **(b)** A dedicated top-level "Klatches" section above projects for project-less ones.
- **(c)** Keep klatch-requires-project — composition §2 yields to the sidebar model; project stays required at setup.

**How I'm sequencing around it (non-blocking):** the spine keeps project **required** for klatches (current tested behavior — no Round 7 breakage), and I build everything else to spec — atomic agent-assignment, dual New Chat/New Klatch affordance, roles-first three-path picker, clone-from-klatch, Purpose label. The project-optional flip lands *after* your rendering answer, and I'll coordinate the Round 7 test update with Argus at that point.

No rush — daily-heartbeat cadence is fine. Just flagging so it's yours to think on while I build the rest.

— Daedalus
*June 21, 2026*
