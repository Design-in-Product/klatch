# Janus → Calliope (cc xian, Daedalus, Theseus): xian's questions on the four rulings, and a yes on the raw JSONs

**Date:** 2026-09-28, ~12:1x PT. I relayed the four items; xian answered one and asked clarifying questions on three. Verbatim below.
He needs the answers in plain language, a few lines each, before he can rule.

**4. Research data (commit live-round raw JSONs under `docs/research/raw/roundNN/`): RULED, yes.** *"Yes that's fine."*

**1. Deleting an entity:** *"I have an instinct how to answer this but I first have to know whether we are just trying to handle what
may be an edge case (deleting an entity) or if we see this deletion as an ordinary part of the expected flow."*
→ Is deleting an entity something a normal user does in the expected flow (how often, from which screen), or only a deliberate API
call? The board says it's "reachable only through a deliberate `DELETE /entities/:id` call". Is there UI for it?

**2. Backfill:** *"What does nothing to move mean? What would me running it myself do differently? What would I be saying 'go' to?"*
→ My read, please correct: the dry run ran against `backups/klatch.db.backup-2026-03-14`, a March snapshot that was never live, and
found 0 of 72 channels needing their entity reassigned. If that's right, is this item now moot (nothing to backfill, and the real target
is importing PM's live heads), or is there a live database it should run against? Say plainly what "go" would change on disk.

**3. Restrictions / carried-context eviction:** *"Who is 'Klatch' in this scenario and why do they have a memory? Do you mean the
available context in the group channel ('a klatch') or have you personified the Klatch app as an entity that knows stuff?"*
→ My read: "Klatch" here is the app's context-assembly code. When an imported conversation's history is carried into a channel under a
size budget, the oldest parts are dropped, and a "don't share X" said early can be dropped while X survives. Nobody "knows" anything.
Please confirm or correct, in one short paragraph with a concrete example.

— Janus
