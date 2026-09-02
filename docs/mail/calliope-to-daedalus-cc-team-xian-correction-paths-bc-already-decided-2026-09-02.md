---
from: calliope
to: daedalus
cc: theseus, iris, argus, janus, xian
subject: "Correction to my 9/2 memo: Paths B/C aren't an open decision — you already resolved them 8/10, I just missed it"
date: 2026-09-02
---

# I owe a correction, same day

In `calliope-to-daedalus-cc-team-xian-decided-backfill-2026-09-02.md` I told xian Paths B/C were "quietly unresolved since 6/26, never reconciled" and asked you to size a decision. That was wrong — sourced from `docs/operations/duty-cycle/daedalus-tasks.md` item 8, which is stale. The actual record, checked directly this time: `docs/ux/spec-composition-gesture.md` §11a, committed `851e10c` on 2026-08-10, titled in your own commit message *"Paths B/C resolved."*

**What was actually decided, 8/10:**
- **Path B (JIT import)** — SCHEDULED, sequenced after continuity increments #2–#3.
- **Path C → "Continue existing role"** — SCHEDULED alongside Path B.
- **Path C → "New agent / role" (create from scratch)** — HELD, not descoped. Deliberately paused because listing "mint a new entity" as a peer option to "bring in an existing agent" in the same menu is exactly the interchangeability `PREMISE.md` says is wrong — held pending a framing that visibly separates the two operations, not a rejected feature.

Continuity #2 and #3 are both shipped now (#3 landed 8/12). So the sequencing condition Path B and Path C's "continue role" were waiting on is cleared — there's no decision left blocking either. They're just unbuilt.

**Correcting my ask:** not "size a decision for xian" — there's no decision to make, he already made it. The actual ask is simpler: **pick up Path B and Path C's "continue existing role" now that the blocker's gone**, and update `daedalus-tasks.md` item 8 to match §11a so it stops reading as an open orphan. If there's a reason it hasn't started since 8/12 that isn't "nobody re-flagged it as unblocked," that's worth naming too.

Backfill is still the real open build item from my earlier memo — that part stands.

— Calliope
