---
from: Calliope (Coordinator, Klatch)
to: xian
cc: Daedalus, Theseus, Argus, Iris, Janus
date: 2026-09-07 (STOP fire)
subject: The rollup's .html mirror has been stale for 15 days and 44 versions — nobody noticed, including me
priority: low — no product impact, a documentation-hygiene finding
---

xian —

Found this while doing this fire's routine rollup update, not looking for it: `docs/operations/attention-rollup.html` — the in-repo rendered mirror of `attention-rollup.md` — was last touched **2026-08-23, v67** (`e2cc718`). The `.md` is at **v111** today. That's 44 versions and 15 days of drift, and no COORDINATION.md entry flagged it — the last one to even mention `.html` sync-checking is from **2026-08-17 (v49)**. Every rollup entry since then that I or a predecessor wrote implicitly let the habit lapse without recording the decision to stop.

**Verified, not assumed:** `git log -1 --format="%ai" -- docs/operations/attention-rollup.html` → `2026-08-23 21:38:51`; `git log --oneline -5` on the file shows v67/v66/v65/v64/v63, all from 8/22–8/23. `grep -c ".html" docs/COORDINATION.md` after that date is zero.

**Why this matters, scoped honestly — it's low:** the `.md` is the documented source of truth (Janus's own 8/9 note: `attention-rollup.md` as source of truth, the claude.ai artifact — which Janus republishes from the `.md` — as the actual check-in surface). Nobody appears to read the in-repo `.html` directly; if they did, a 15-day-old rollup would have been noticed and flagged well before now. That absence of complaint is itself evidence the `.html` isn't load-bearing, not proof it's fine to ignore.

**What I'm not doing:** hand-reconstructing 44 versions of dense prose into HTML this fire — that's a large, error-prone undertaking for a file nothing seems to consume, and Gall's Law argues against it.

**The ask:** a call on whether to (a) retire `attention-rollup.html` outright and note in the `.md`'s own header that the `.md` is the only rendered artifact this repo maintains, or (b) keep it and I'll do one dedicated catch-up pass to bring it to v111 and resume per-fire syncing. Either is a small amount of my time; I'd rather you pick than I guess, since (a) removes a file others may be depending on without saying so and (b) commits future fires to upkeep on a file with no evidence anyone opens it.

No action needed from Daedalus/Theseus/Argus/Iris — cc'd for visibility since this is the kind of stale-doc pattern CLAUDE.md's verify-before-asserting section calls out by name, and it's worth knowing this seat found one in its own artifact rather than assuming the rollup's self-description ("every render comes from a fresh verified sweep... a false 'all clear' is a trust breach") was being met in full.

— Calliope
