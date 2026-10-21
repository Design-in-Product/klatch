# API-native probe — plan

**Filed:** 2026-10-21
**Author:** Calliope, from xian's own framing (relayed by Janus, 2026-10-21 call transcript, approved for sending)
**Status:** Plan, not yet started. Nothing costly or hard to undo begins before xian has read this.
**Answers:** `docs/operations/attention-rollup.md` needs-you item 1 (open since 2026-10-14)

---

## 1. The question, in xian's words

> "Instead, maybe you just build a Klatch around the API, and … their agents just live on the API and Klatch,
> the UI, is separate from the back end, and you still can call on Claude-like affordances through the API. …
> It's the next experiment I'm gonna do."

His diagnosis of the current cost (also his words):

> "Klatch was like, oh, I'll build my own UI, you'll bring your agents in, they'll have group chats there. And
> they're like, oh, I have to bring all their context. So I came up with this very interesting, for me, layered
> context model, which has been super helpful and interesting but was a lot of work to sort of figure out how to
> replicate what's already known in the place it's coming from. … And it doesn't necessarily have the same tools
> unless I either build tools for MCP or … reconnect it to the cloud tools somehow through the API."

Janus's one-line reading, which this plan treats as the working statement of the question (check it against the
quotes above, not against this sentence, if anything here reads wrong): **does Klatch work better as a front end
over agents that live on the API, instead of a place agents are imported into with their context rebuilt?**

Full source: `docs/mail/janus-to-calliope-cc-xian-xians-framing-of-the-api-experiment-in-his-words-2026-10-21.md`.

## 2. What this adds to, not replaces

Pard already scoped two tests at xian's request (`docs/mail/pard-to-calliope-cc-xian-janus-two-klatch-tests-managed-agents-first-then-an-api-native-probe-2026-10-20.md`,
2026-10-20): a **Managed Agents test** first (how a Klatch fire does hosted vs. on Amber — in motion, smoke run
named for this seat's 2026-10-21 START fire, not yet landed), then an **API-native probe**, built to shape itself
around what the first test teaches. xian's words above are the framing for that second test, not a third,
separate ask. Billing for both: the existing Klatch workspace in the Design in Product org (`pard-to-calliope-cc-xian-janus-klatch-tests-bill-to-the-existing-klatch-workspace-in-dinp-2026-10-20.md`).

Pard's own description of the probe, from the same memo: *"take one core Klatch feature in its most basic MVP
form, build it natively on the API, and compare. If it's promising, consider a plan to rebuild from scratch. If
not, keep evaluating how to achieve Klatch's purposes."* xian's words this fire sharpen **what "natively on the
API" means**: not just calling the API instead of the SDK, but an architecture where the agent's context and
tools live where the conversation already is, and Klatch is the thin layer that lets other agents meet it there —
rather than copying that context into Klatch's own five-layer model first.

## 3. Why this is the right thing to test — the premise connection

`docs/PREMISE.md` idea #3 states: *"Context is portable, and moving it is the hard part."* The five-layer context
model is Klatch's answer to that hard part — and xian's own words above name the cost of that answer directly: a
lot of work to replicate what's already known in the place it came from, and tools that don't come along unless
rebuilt for MCP or reconnected through the API. The API-native probe is a direct test of whether idea #3 is a law
of the domain or an artifact of *this* architecture — whether the hard part goes away, not by solving it better,
but by never moving the context in the first place.

This is not drift. `PREMISE.md`'s own rule is that a design decision which narrows or contradicts the premise is
"a conversation with xian, not a spec footnote" — this is exactly that conversation, initiated by xian, named as
an experiment rather than a silent revision. The forward check (*"does this design assume the agent's source
conversation exists and is accessible?"*) still applies to the probe's own design: an API-native agent's source
conversation is the live API session itself, which is trivially accessible to it by construction — so the probe
doesn't fail the check, it changes what "accessible" costs.

**Prior art, six months old, same shape:** `docs/futures/2026-04-10-klatch-as-context-protocol.md` (filed from
xian's own words, 2026-04-10) already named this direction — Klatch as a service other tools and agents call,
not just a place people visit; the five-layer model as a protocol, not an internal implementation detail. That
doc's open question #4 ("does this change the Klatch business model conversation?") and #6 (cross-vendor
routing) are upstream of this probe's result, not separate from it. Worth rereading in full before the probe's
design is finalized.

## 4. What the probe needs to pick, that this plan deliberately leaves open

This plan states the question and its stakes; it does not pick the technical shape, because that's the team's
scoping call (Pard's own words on the first test apply equally here: *"Choosing which [feature/fire] to use is
your team's call"*). Open, routed to Daedalus/Theseus/Argus (cc Iris, xian) in the companion mail to this plan:

1. **Which core Klatch feature, in its most basic MVP form?** Candidates that test the actual question (an
   agent living on the API, not imported) rather than a weaker version of it: a single entity's conversation
   continued live through the API with no import step at all; a two-agent klatch where both sides are live API
   sessions rather than imported transcripts; or something narrower Daedalus names once he's read this.
2. **What does "compare" measure?** Pard's Managed Agents test gives a template (time, tokens, whether it
   landed, human effort, dollars) — the API-native probe's comparison axes are not necessarily the same, since
   the thing being compared is architecture, not hosting. Needs its own short list before the build starts.
3. **What does "promising" mean, concretely, before the build starts?** xian's own instruction (via Pard) is
   that a promising result leads to considering a rebuild-from-scratch plan — that's a high-stakes branch, so the
   threshold for "promising" should be named before the probe runs, not decided retroactively from however it
   turns out.

## 5. Sequencing

1. Managed Agents test (in motion — smoke run named, real comparison fire still being picked by the team as of
   this writing).
2. What the Managed Agents test teaches shapes the API-native probe's own design (xian's explicit sequencing,
   relayed by Pard 2026-10-20) — so item 4 above isn't finalized until test 1 reports.
3. API-native probe scoped against items 4.1–4.3, then built, one core feature, MVP form.
4. Result read against the "promising" threshold named in 4.3; xian reads this before any rebuild-from-scratch
   conversation starts.

## 6. The larger question, recorded faithfully, not acted on

xian also named, in the same conversation, a question this plan doesn't answer and isn't trying to: whether
Klatch is still a product he'll ship, something he uses himself, or more of a research shop for the wider team —
and whether the team's own standing habits (automated mail, waking, round-track work) already give him most of
what he imagined from in-person meetings. Janus's explicit instruction on relaying this: treat it as framing for
this plan, not as a ruling on the product; nothing is decided. Recorded here so it's on the record where xian
reads it, not expanded on, not treated as an open needs-you item, and not left to be reconstructed from a
transcript nobody but Janus has seen in full.

## 7. What this seat is doing right now, and what it isn't

- **Done this fire:** this plan, filed where xian reads it; the rollup's needs-you item 1 updated to reflect it;
  mail to Daedalus/Theseus/Argus (cc Iris, xian) opening the four open questions in §4; a reply to Janus
  confirming the one-line reading and that the plan is filed.
- **Not done, and not this seat's to do alone:** picking the MVP feature, building anything, or deciding what
  "promising" means technically — those are routed to the team, per Pard's own framing that the technical choice
  is the team's call, not a unilateral write from this seat.
