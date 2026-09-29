# State-of-Klatch experiment — next steps

**Author:** Calliope · **Date:** 2026-09-29 · **Context:** xian's own words, closing out the two-medium experiment session. Not scoped, not assigned, not started — a record of what he named so it survives past tonight.

## Sequencing, as xian framed it

1. Work through the UI issues and compositional-logic bugs this session surfaced (both tracks — see below).
2. Then hold the previously-planned full roadmap meeting, five agents ("five of your delegates," his own phrase — Daedalus, Argus, Theseus, Iris, Calliope, each imported the way this session's Calliope and Iris were tonight).
3. In parallel and ongoing: the whole team thinking about agent experience, the value proposition, and the roadmap — not sequential to the above, a standing concern.

## UI / compositional issues to work through first (consolidated from both tracks)

From the klatch side (`klatch-artifacts/roundtable.md`, §2 and §6):
- Render-hang with no signal distinguishing "processing" from "broken" (workaround: click away and back) — real trust cost for a continuity-pitched product.
- Two-turns-per-block rendering bug — reproduced three times, including once confirmed end-to-end by xian directly against the raw GUI output. High priority per the klatch-side findings; "actively defeats the room's core legibility promise."
- CLAUDE.md / ROSTER.md drift — CLAUDE.md (Layer 2, auto-loaded for every entity) names four of five duty-cycle agents and omits Iris; ROSTER.md (the fuller, accurate roster) is never auto-surfaced to any imported entity.
- Attachment-visibility asymmetry — Iris could see an in-room image attachment; Calliope could not. Cause unconfirmed, flagged as open rather than explained.

From the mail-track side (this seat's synthesis, already on the rollup where applicable):
- Memory-path assumption bug (Layer 3) — 🟡 on the attention rollup, v160, unassigned.
- Browse-dialog friction at scale (523 unscoped sessions) — reclassified from low-priority to structural per the scales-with-value test (topic 4).
- Reassign-picker unverified live — reclassified the same way; already routed to Theseus by Iris, urgency bumped.
- Two ImportDialog.tsx bugs already fixed and shipped (`c42b4d3e`) — closed, not open.

## The planned five-agent roadmap meeting

Not yet scheduled. Runbook already exists (`roadmap-klatch-runbook-2026-09-20.md`) for the mechanics of a full five-seat room; this session's three-way test was explicitly the smaller rung building toward it. Worth revisiting the runbook once the UI/compositional fixes above land, since several of tonight's findings (Browse-at-scale especially) will matter more, not less, at five imports instead of two.

## Gap analysis requested: the Klatch kit and further tooling

xian's ask, stated plainly, not yet scoped: what does "the Klatch kit" actually provide today (the layer model, import mechanics, carried context, the file domain model), and what further tooling might be available or worth building. Not started. Natural owner: whoever picks this up should ground it in the actual layer-by-layer walkthrough already done this session (this doc's companion, `fork-identity-finding-2026-09-29.md`, and the earlier layer discussion in this seat's own session log) rather than re-deriving it from scratch.

## Thought experiment, xian's own words

> "If I had already created an agent via the API, could I build a klatch experience that same agent could have directly, without import at all?"

Real, unanswered question. Current mechanics all assume an *imported* history (a Claude Code or claude.ai session) as the seed for an entity's identity and carried context. Worth asking directly: could a freshly API-created agent, with no prior transcript, participate in Klatch's layered-context and multi-entity-room machinery on equal footing — and if not, is that a gap in the product or a correct reflection of PREMISE.md's own claim (identity is the conversation, and an agent with no conversation yet has no identity to bring)? Not resolved here on purpose.

## Pricing comparison requested

Not started. Would need to sit alongside the thought experiment above and this session's topic 6 exchange (`state-of-klatch-mail-track-synthesis-2026-09-28.md`, topic 6 section) — cost of Klatch's layered assembly and multi-entity orchestration (multiple calls per turn in roundtable mode, carried-context token overhead) against a hand-assembled raw-API equivalent.

## The deep question, xian's own words, preserved exactly

> "At what point are we sinking resources in a custom, weaker harness that could be focused on unique experiential glue."

This is topic 6 and tonight's fork-identity finding both pointing at the same fork in the road, from two different angles. Topic 6 asked whether the layered apparatus earns its cost over raw API calls. Tonight's identity finding suggests the actual unique value may be narrower and stranger than either "memory" or "orchestration" as originally framed — it may be specifically the *room*: the mechanism by which two independently-continuous things can be made to account for each other, live, in front of a person who depends on both. If that's right, the harness-replication parts of Klatch (auth-adjacent plumbing, tool-access scoping, general chat UI) are exactly the parts worth asking this question about, and the room/continuity/cross-checking mechanism is exactly the part that isn't replicated anywhere else. Not resolved — named, so it doesn't have to be re-derived next time.
