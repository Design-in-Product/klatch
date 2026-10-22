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

1. **Which core Klatch feature, in its most basic MVP form?** Still Daedalus's architectural call, not decided
   here. Theseus's 2026-10-21 reply (`docs/mail/read/theseus-to-calliope-argus-cc-daedalus-iris-xian-pard-round-433-is-spent-so-here-is-the-rule-not-a-number-and-two-new-equivalence-gaps-2026-10-21.md`)
   names a lean, not a pick: the two-agent klatch where both sides are live API sessions, on the reasoning that a
   single entity continuing its own conversation is "the easy half" and can look good without testing the
   premise, while two live agents meeting each other is the thing `PREMISE.md` is actually about — and the only
   one of the two candidates where "did context actually reach the other side" has a yes/no answer. Recorded
   here as a second data point for Daedalus, not a resolution; the pick itself is still open.
2. **What does "compare" measure?** Answered. Argus's 2026-10-21 reply (`docs/mail/read/argus-to-calliope-cc-daedalus-theseus-iris-xian-both-open-asks-the-fire-pick-and-the-compare-axis-2026-10-21.md`)
   named four axes, each stated as gradable rather than qualitative:
   - **Context fidelity** — on a fixed small battery of questions whose answer depends on pre-boundary
     conversation detail, does the API-native agent answer correctly without being retold? Binary per question.
   - **Tool reach** — count of the agent's native tools actually callable through the API-native path vs.
     through Klatch's current MCP/reconnection story, for the same agent.
   - **Setup cost to first useful turn** — steps/time from "agent exists on the API" to "usable in Klatch,"
     API-native vs. import, since zero-import is the architecture's own claimed win and should be priced, not
     assumed.
   - **Cross-agent fidelity** (only if the two-agent-klatch candidate is picked) — does context one live-API
     agent produces actually reach the other live-API agent through Klatch, at the same completeness as
     today's imported-transcript meetings.

   Theseus's same reply added a fifth axis from his own seat, which the other four don't cover: **refusal
   fidelity** — when the API-native path *cannot* do something (an unreachable tool, a truncating context
   window, a cancelled stream), does it say so, or does it return a plausible answer built from less? Gradable
   the same binary way: drive N known-impossible requests, count how many come back as refusals naming the
   condition versus answers that don't mention it. Argus's own constraint on all five stands: whatever's built
   needs a result that's objectively gradable against these axes, not read qualitatively after the fact — if
   the picked feature doesn't admit a binary/countable answer on at least context fidelity and tool reach, that
   should be flagged before the build, not after.
3. **What does "promising" mean, concretely, before the build starts?** Still open. xian's own instruction (via
   Pard) is that a promising result leads to considering a rebuild-from-scratch plan — that's a high-stakes
   branch, so the threshold for "promising" should be named before the probe runs, not decided retroactively
   from however it turns out. Neither Argus nor Theseus set this bar; both explicitly declined to, naming it as
   xian's call.

## 5. Sequencing

1. Managed Agents test (in motion — smoke run named 2026-10-21 ~08:30 PT; the real comparison fire is now named
   too, as a **rule rather than a round number**: Theseus claimed it on behalf of his seat and Pard accepted the
   rule as written (`docs/mail/read/pard-to-theseus-cc-calliope-argus-xian-janus-round-rule-accepted-435-both-gaps-go-into-the-comparison-prompt-2026-10-21.md`)
   — the comparison fire is Theseus's next round-track fire that opens after Pard's prompt exists and xian's key
   is live, with Daedalus's inbound memo and instrument directory on `origin/main` at launch; **Round 435** is
   the concrete candidate, advancing by two if either precondition isn't ready when it opens. Theseus also
   measured two Amber-local dependencies this round-track fire needs that weren't on his 10-20 list — full repo
   history (not a shallow clone) and `core.hooksPath` being local git config, not something a clone carries —
   both of which Pard has already folded into the comparison prompt as setup lines rather than leaving them to
   be discovered as false reds).
2. What the Managed Agents test teaches shapes the API-native probe's own design (xian's explicit sequencing,
   relayed by Pard 2026-10-20) — so item 4.1 and 4.3 above aren't finalized until test 1 reports; item 4.2 is
   answered already and doesn't need to wait.
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

- **Done 2026-10-21 (initial filing):** this plan, filed where xian reads it; the rollup's needs-you item 1
  updated to reflect it; mail to Daedalus/Theseus/Argus (cc Iris, xian) opening the four open questions in §4; a
  reply to Janus confirming the one-line reading and that the plan is filed.
- **Done 2026-10-21 (STOP fire, folding the team's replies in):** Argus's and Theseus's answers on §4.2 (compare
  axes) folded into this doc rather than left to live only in mail; Theseus's §4.1 lean recorded as a data point,
  not a pick; §5 updated to name the comparison fire as a rule (Round 435 the concrete candidate) instead of
  "still being picked" — closing the one blocker that had carried, unresolved, across every fire since 10-20.
- **Not done, and not this seat's to do alone:** picking the MVP feature (§4.1) or deciding what "promising"
  means technically (§4.3) — both still open, both Daedalus's/xian's calls respectively, not a unilateral write
  from this seat.
