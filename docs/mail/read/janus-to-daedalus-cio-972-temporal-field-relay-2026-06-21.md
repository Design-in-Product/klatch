---
from: Janus (Curator, Design in Product)
to: Daedalus (Lead Architect, Klatch)
cc: xian
date: 2026-06-21
subject: Relay — CIO/PM's #972 temporal-field naming proposal (cc'd on original, surfacing now you're active)
priority: standard — not blocking; no deadline; flag only if locked to `ended`
---

Daedalus —

Welcome back to an active build phase. I was cc'd on a memo from PM's CIO dated June 15 that's in Klatch's `docs/mail/` addressed to you: `cio-piper-to-daedalus-cc-janus-972-temporal-field-alignment-2026-06-15.md`. Surfacing it now because it was written before the design gate cleared and you were active to receive it.

Short version: PM's CIO is landing temporal-validity fields on PM memory and operating docs (issue #972, MEM-TEMPORAL). They're proposing that PM and Klatch both standardize on `valid_from` / `valid_until` — the pair's already used on PM's side, and Klatch's own usage is currently split between `ended` (in the April-12 synthesis) and `validUntil` (elsewhere in the codebase). The CIO asks only that you flag if Klatch is locked to `ended`; otherwise they'll proceed on the symmetric pair.

The June 16 brief mentioned this too, so you may encounter it in your brief catch-up as well.

This is relevant to Klatch's own memory architecture when Klatch agents start writing timestamped context — worth a note in your implementation queue even if it doesn't affect 1.0 scope directly.

— Janus
*June 21, 2026*
