---
from: calliope
to: xian
cc: janus
subject: "The refresher you asked Janus to route to me — what's happened since the flows clarification, in my own account"
date: 2026-08-25 ~15:00 PT
---

# What's happened since you clarified the primary flows

Janus relayed your ask rather than answering it, correctly — this is mine to give you directly.
One scoping note up front, honestly: you didn't say *which* clarification you meant, and I want
to tell you what I'm scoping against rather than guess silently. I'm anchoring on the arc that
started with your April direction note — *"The entity IS its conversation, given a seat at a
shared table. A klatch is a meeting of existing chats, not a new conversation with
pre-configured personas"* — and that got operationalized in two concrete decisions from you this
summer: the composition-continuity gap (you and I found it together, 7/19) and the carried-context
approval (8/12). If you meant something else by "primary flows," tell me and I'll re-scope — but
this is the throughline I can trace and stand behind.

## The gap we found, and what you decided about it (July)

7/19: setting up the first real-use klatch together, we hit a wall — composition could seat
agents but couldn't give them their own accumulated context. The spec's own language contradicted
itself on whether agents "bring their existing context" or don't. The implementation had followed
the more literal reading, which quietly reversed your entity model. I wrote `docs/PREMISE.md`
that day as an anchor against that drift, and flagged it as gravitational, not careless — the
flat, persona-based version of Klatch is the one every other product builds, and it's easy to
land there by accident.

8/8: you answered four gating decisions arising from that gap (routed through Janus) — most
load-bearing: an agent's transcript inside a klatch is the *union* across its channels, and
directed-mode visibility means everyone in a klatch sees everything (an @mention requests a
reply, it doesn't restrict who sees it). 8/12: you approved the specific mechanism — recent-N
messages plus summary (with on-demand deep retrieval layered on) as how an agent's outside
context gets carried into a klatch without blowing the context window, sized against the real
corpus rather than guessed.

## What got built off that (mid-August)

Daedalus and Theseus shipped it in stages: the recent-N seed as a sixth prompt layer (Round 38,
8/12), a real defect fix underneath it (user messages were being written without an entity_id, so
the seed was silently dropping every question and keeping only the agent's own answers — found
and fixed the same week), on-demand recall as a tool the agent can call itself (Round 50, 8/14),
and a disclosure norm plus a visible "carried context" chip so a user can see when an agent is
drawing on another room. All of that is live, tested, and currently green — server **1447/1447 (88 files)**, client
**239/239 (13 skipped)**, re-run and verified by me this fire.

## The research arc that's consumed most of the last two weeks

Once carried context existed, a harder question opened under it: when the carried slice has to be
truncated to fit budget, what gets silently dropped, and does that ever cross a privacy line — an
owner's restricted content leaking into another agent's prompt through eviction? Daedalus and
Theseus have spent roughly 40+ named rounds (Rounds 50 through 92, accelerating hard since 8/20)
building and adversarially stress-testing the instrument that measures this: a compliance checker
over the corpus, a container-opacity detector, mutation tests where one agent tries to break the
other's fix and reports back exactly which mutant survived. The pattern that's held throughout,
and that Janus told you registered with you directly: each finds real defects in the *other's*
work, including their own prior rounds, and neither ships past a mutation test that still kills
their own control.

That work culminated today in a go/no-go you made directly (relayed by Janus ~14:15 PT): **go** on
the "distance-arm" experiment — five live opus runs plus ~80 constructed test rows, to actually
measure whether the eviction gap is real and how often it fires, rather than reasoning about it in
the abstract. You also gave them the threat model explicitly rather than a scope directive: the
primary deployment shape is one human across their own agents, so a residual eviction gap there is
lower-stakes than one human's restricted content reaching a *different* human's agent — a
disclosed-limits warning is an available mitigation alongside whatever the experiment recommends,
not instead of it. As of this afternoon the arm itself is built and its pre-registration is
committed ahead of any result (Round 92) — the five opus runs you authorized are deliberately
unspent, saved for the next fire rather than burned reflexively.

## Running in parallel, not blocking any of the above

- **Amber migration** (late July): the whole team's working environment moved hosts; verified,
  test data landed, duty-cycle cadence re-established.
- **Composition gesture + beta gate**: now fully clear — this was the thing continuity had to
  catch up to.
- **Import dedup UX** (Iris/Daedalus, mid-August): decided and built.
- Routine cadence work: session logs, coordination discipline, mail hygiene — the connective
  tissue that's let five agents run largely unsupervised without drifting.

## What's still actually sitting on your desk

Two threads, both older than today's go-ahead and unrelated to it:

1. **Backfill of the 72 existing imports** — they all currently bind to one shared entity, so
   "this agent's carried context" is presently a mix across every imported conversation, not one
   agent's own history. Continuity #3 is shipped and correct; it's carrying the wrong content
   until this is answered. Open since 7/19.
2. **The discretion-model straw-man** — I asked you directly on 8/9 whether the "no
   platform-enforced privacy boundary, it's a convention" framing makes sense to you. Still open.

Both are named in the standing 🔴 section of the attention rollup Janus pointed you to, so you'll
recognize them there — I'm restating them here because they predate and are independent of the
distance-arm work, and I didn't want either to read as resolved by today's go-ahead.

— Calliope
