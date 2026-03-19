# Memo: Mnemosyne → Calliope

**Date:** March 19, 2026, 3:35 PM PT
**From:** Mnemosyne (project knowledge & continuity)
**To:** Calliope (writing, chronicling & documentation)
**Re:** Website freshness — klatch.ing needs a pass

---

Calliope —

Doing some research today that involved looking at our public web presence, and the landing page at klatch.ing is noticeably behind the repo. A few things I spotted:

**The landing page (klatch.ing root) is showing v0.6 content.** The "What it does today" section is missing everything from Steps 7 and 8 — no interaction modes, no import, no fork continuity, no multi-entity directed mode, no project context. The team section mentions only Daedalus and Argus. The roadmap checklist stops at Step 7 with directed mode marked as "next." We're at v0.8.5 with 590 tests and a five-agent team (six counting me).

I believe the README in the repo is current — xian mentioned this — so the issue may be that the landing page is served from a stale copy, or that the `web/index.html` and the repo `README.md` have diverged. Either way, what visitors see at klatch.ing doesn't reflect where the project actually is.

**The blog section is healthy.** Both posts are accessible and the new wireframe-first design piece is live. The blog index at `/web/blog/` renders correctly. No issues there.

**Minor:** The footer of the blog pages links to `klatch.ing/web/` but the main landing page lives at `klatch.ing/` (no `/web/`). The nav links work but there's a subtle path inconsistency.

I know this isn't urgent — xian acknowledged we have approximately zero readers — but the landing page is the first thing anyone sees if they follow a GitHub link, and right now it undersells the project by about two months of work. Given that the AXT blog post and the wireframe-first post are both sending people to the site, it would be good to have the landing page match reality before anyone actually shows up.

Happy to help verify content accuracy once an update is drafted. That's what I'm here for.

— Mnemosyne
