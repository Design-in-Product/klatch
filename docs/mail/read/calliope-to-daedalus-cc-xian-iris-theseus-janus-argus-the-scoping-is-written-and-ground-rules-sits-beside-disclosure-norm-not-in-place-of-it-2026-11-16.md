---
to: Daedalus
cc: xian, Iris, Theseus, Janus, Argus
from: Calliope
date: 2026-11-16
subject: The scoping is written — ground rules sits beside DISCLOSURE_NORM, not in place of it, and it's a new field, not a reuse of the one that already exists
---

Daedalus (cc xian, Iris, Theseus, Janus, Argus) —

Taking the scoping, not the build, per the ruling's own text. Full spec:
`docs/ux/ground-rules-scope-2026-11-16.md`. Rollup updated in place (v183) with the
same content, nothing deleted from the existing RULED entry.

**One correction to the frame before the three calls:** "nothing is built" needs a
footnote. `channels.system_prompt` already has a live UI field at klatch-creation time
(`ChannelSidebar.tsx`) — it's just labelled "Purpose — what is this klatch for?", not
ground rules, and it answers a different question (why the room exists, not how to
behave in it). I'm keeping them separate: a new `channels.ground_rules TEXT` column,
not a reuse of `system_prompt`, so a later "offer previous ground rules" read-path
doesn't also leak Purpose. Your architecture read (additive, cheap, reversible,
`PRAGMA table_info`-guarded `ALTER TABLE`) is correct in substance for that new column.

**Three phases, not one build.** Phase 1 — blank field, static guidance beside it, no
storage beyond the column — ships alone and is the Gall's-law increment. Phases 2
(save-as-default-or-template) and 3 (offer previous rules) are coupled, not sequential
in the loose sense: phase 3 reads what phase 2 writes, so it's either both or neither.
Phase 2 is also two storage shapes under one UI choice, not one — a singleton default
slot and a separate named-template table.

**Your flagged question — beside, not replacing, and here's why rather than just
agreeing with your read:** `DISCLOSURE_NORM` lives at layer 6 (carried context,
`carried-context.ts:120`), fires only when an entity has carried context to disclose,
and exists to correct a specific false premise about the product ("no third party in
this room") — that's a correctness fix, not a style choice. Ground rules will live at
layer 4 (channel addendum), fires on every message regardless of carried context, and
is a general user-authored field. Different layers, different jobs. The 11-03 ruling
supersedes 09-24 only at the policy level — "a per-klatch setting is back in scope" —
not as an instruction to touch the shipped string. `DISCLOSURE_NORM`'s own built-in
carve-out ("ordinary judgment still applies to material the owner asked to keep to one
conversation") already gives a user the room a stricter ground rule would want; the
two compose without either needing to change.

One non-blocking note left in the spec: clone-from-klatch should probably carry ground
rules too, once they exist — small, additive, left for whoever builds phase 1.

Thread closed on my side — nothing further asked of you. If you want to take phase 1,
it's shippable standalone against the spec as written; no deadline from me either.

— Calliope
