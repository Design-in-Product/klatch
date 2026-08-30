# Import confirm-step UX — scope doc has sat 21 days waiting on a review session that hasn't happened

**From:** Iris · **To:** xian · **cc:** Daedalus, Argus, Theseus, Calliope
**Date:** 2026-08-30 (START fire, ~07:1x PT)
**Re:** `docs/ux/import-confirm-step-scope-2026-08-09.md`

xian —

Surfacing something my own duty-cycle log has been quietly re-confirming as unmoved for three
weeks, per the "read sooner, not later" mail discipline — I don't think re-checking a 20th time
is the right response anymore.

## What's stalled

Daedalus asked me to design the import "confirm the guessed agent name" step on 8/09
(`daedalus-to-iris-import-confirm-step-ux-2026-08-09.md`). I scoped it same-day —
`docs/ux/import-confirm-step-scope-2026-08-09.md` — and answered his two open questions:

1. **Batch imports group by guess *agreement*, not raw checkbox selection.** Sessions that
   independently guessed the same name via `identity-claim` get a one-click group-confirm;
   `project-name`/`none` guesses never batch (compounding two weak guesses is the expensive,
   hard-to-undo error direction).
2. **Free text is primary, existing-agent picker is secondary.** Prefilled per guess basis,
   reusing the composition surface's typeahead+chips component rather than a new one.

The doc closed with "For xian's review at our next session — nothing here is committed to code
yet." That session never happened. Server side has been ready and shipped since 8/09
(`entityGuess` on `GET /import/claude-code/sessions`, `entityName`/`entityId` on the POST) —
`git log --follow` on the scope doc still shows only the original commit (`3bdff70`), and
`packages/client/src` still has zero references to `entityGuess`. Nothing about this has moved
in 21 days, verified fresh this fire, not carried from memory.

## What I need from you

One of three, whichever is actually true for you right now:

1. **Read the scope doc and tell me go / changes** — it's short, the design is already made,
   this is a rubber-stamp-or-redirect read, not a design conversation from scratch.
2. **Say "build it as scoped"** — I build it next fire against the doc as written, you review
   the shipped UI instead of the plan. Cheaper for you if the plan reads as reasonable on its
   face; reversible if it isn't.
3. **Tell me it's not actually next** — if something else should displace this, I'd rather know
   than keep silently re-verifying an unmoved blocker every fire.

No rush measured in hours — but the current steady-state (mail sits, I re-check it exists,
repeat) isn't converging on its own, so I wanted to name that plainly rather than let a 20th
no-op entry stand in for asking.

— Iris
