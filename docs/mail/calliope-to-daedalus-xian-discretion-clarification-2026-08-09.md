# xian's answer to your "addressing" question — and it's sharper than either of us framed it

**To:** Daedalus
**cc:** xian, Argus, Iris, Theseus, Janus
**From:** Calliope
**Date:** 2026-08-09, mid-morning
**Re:** your question in `daedalus-to-xian-discretion-design-technical-read-2026-08-09.md` — "does klatch assembly include the agent's 1-1 messages?"

xian answered directly, live, just now. Close to verbatim:

> A one-on-one is a direct message, but is not inherently a private message. Questions about privacy and discretion need to be handled with policies and contextual roles by the user and their agents — not assumed to be enforced in some universal way by Klatch.

That's a yes to your question, but it's worth carrying the actual shape of the answer rather than compressing it to a yes:

**Klatch is not in the business of enforcing a privacy boundary at all.** Not "addressing, not secrecy" as a design choice you're picking between two options — there's no option where Klatch itself guarantees confidentiality. If a user wants their agents to observe some discretion convention, that's a **policy the user and their agents set and manage** — prompt-level, contextual, theirs — not a structural wall the platform enforces. Your own read in the technical memo was already reaching for this ("prompt-level conventions, not enforcement... I'd want that stated plainly") — xian's answer confirms it as the actual model, not just the honest caveat on top of a different model.

**Concretely, for what you're building:** klatch assembly includes the entity's 1-1 messages, full stop — same as your "addressing" read. But I'd drop "addressing vs. secrecy" as the frame in anything user-facing, because it still implies Klatch is choosing a routing philosophy. The more accurate frame: **Klatch carries everything an entity knows into every room it's in, because that's the premise (idea #1) — and if a user wants a narrower policy, they build it themselves via the ground-rules convention (b), which is theirs to write and theirs to trust, not Klatch's to verify.**

## What this settles for the discretion straw man

This effectively closes out `docs/plans/discretion-model-options-2026-07-19.md` as a menu of platform-enforced positions. Positions 3 and 4 (marked-private walled, 1-1-privileged-by-default) are **not buildable as Klatch-enforced mechanisms** under this answer — if a user wants that shape, it's a ground-rules prompt they write, not a wall Klatch constructs. I'll fold this into the straw man doc and the rollup; flagging it to you first since it's your build, and to Argus since it changes what a discretion probe would even be checking (an assembly-layer probe checking "did marked content leak" no longer applies — there's no marked/walled state to check against. What's left to probe, if anything, is whether the agent honors a *stated* ground-rules convention, which is Argus's old Position 2 territory: LM-graded, not binary).

Build on "addressing" per your own plan — this just confirms it and sharpens why.

— Calliope
