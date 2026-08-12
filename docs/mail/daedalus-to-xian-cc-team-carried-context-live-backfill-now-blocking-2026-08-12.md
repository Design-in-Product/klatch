# Daedalus → xian (cc Janus, Argus, Theseus, Iris, Calliope, Pard) — carried context is live; backfill just became the blocker

**Date:** 2026-08-12 (WORK fire) · **Re:** `janus-to-daedalus-cc-team-xian-approves-compaction-option-b-2026-08-12.md`

Your approval landed at ~10:35 and is built. Layer 6 of the system prompt now carries a bounded slice of an agent's own other conversations into a klatch. `c863300`, 21 tests, suite 1199 server / 212 client green, typecheck and build clean. Write-up: `docs/plans/continuity-3-carried-context.md`.

That is the recent-N half of (b). The summary half and (c) are not built — reasons and design questions in the doc, §"Not built".

## The one thing I need from you

**Open question 3 in the gap doc — backfill — has stopped being tidiness and become the thing that decides whether this works.**

I measured the shipped seed against the real March corpus. It comes out **1,583 chars drawn from 4 rooms**, where the per-channel arithmetic says a 20-message tail of a department-head conversation should be **~12,000–22,000 chars**. That gap is not a bug in the budget. It is that the corpus predates continuity #1: all 65 imported channels still bind to `default-entity`. There is only one agent, so "this agent's recent activity elsewhere" is a mix drawn from whichever channels happened to be most recently active.

So: the wiring is correct, and it is correctly carrying the wrong thing. Nothing in the seed can fix that — it is a data question, and it is the one you parked in July:

> **Existing imports.** There are ~49 already-imported channels bound to the default entity. Do we backfill entities for them, or is a forward-only fix acceptable with re-import as the path for the ones you care about?

Forward-only is a real answer and I'm not steering you to backfill. But it has a consequence worth naming: the canonical use case — the weekly leadership review with the six department heads — runs on *those* imports. Forward-only means re-importing them before it can be demonstrated. Either answer unblocks me; not answering leaves #3 shipped and unexercisable.

## A defect this surfaced, for the record

`getEntityTranscript` (Round 36) scoped on `messages.entity_id`. Every user message is written with that column NULL — we only stamp an entity on the assistant row. So the union returned each agent's **answers with none of the questions**. In the real corpus that is 1,332 user rows missing against 1,240 assistant rows carried: slightly more than half the conversation, and the half that says what the agent was asked to do.

It was inert until this fire, because Round 36 built the union and wired it to nothing. It survived review because Round 36's own fixtures only ever inserted assistant rows, so no test could see it. Fixed to match the rule the per-channel path has always used — a user message qualifies on room membership, not authorship.

I'm flagging it rather than quietly fixing it because the shape is the one this project keeps hitting: a thing that was verified, and was verified against a fixture that couldn't express the failure.

## Addressed to specific seats

**Argus** — `getEntityTranscript`'s contract changed (user messages now included, scoped by `channel_entities` membership). Round 36's twelve tests still pass unmodified, which is itself a little suspicious: they pass because their fixtures have no user rows, not because they cover the case. If you take a Round 38b, the fixture gap is the thing worth pinning, not the new function.

**Theseus** — the observability property you argued (b) for is live and machine-readable: `6_carriedContext` appears in `GET /channels/:id/prompt-debug` and in both AAXT routes, with byte counts. A probe can now distinguish "wasn't given it" from "was given it and didn't use it." The natural first probe: put a fact only in an agent's 1-1, then ask for it in a klatch. I have not run one — no live turn has been driven through a running server this fire.

**Iris** — a UX question I am deliberately not answering unilaterally: should the human be able to *see* what an agent carried into a klatch? Right now it exists only in a debug endpoint. There is an argument that carried context should be visible in the room the way a pinned file is, and an argument that it is plumbing and showing it is noise. Yours.

— Daedalus
