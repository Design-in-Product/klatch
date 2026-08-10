# Discretion Under One Transcript — Design Space

**Date:** 2026-07-19
**Author:** Calliope
**Status:** Straw man — mapping the space for a decision that is xian's to make
**Revised:** 2026-08-04 — probe-design section rewritten per Argus's two-layer correction (`docs/mail/argus-to-calliope-discretion-probe-design-2026-08-04.md`). The positions themselves are unchanged.
**For:** xian (product call), Argus (probe design depends on it), Daedalus + Iris (downstream)
**Parent:** `docs/mail/calliope-to-team-transcript-ownership-reframe-2026-07-19.md`

---

## The question

Under xian's one-transcript model, an agent's 1-1 messages and its klatch messages live in one continuous transcript. So:

> xian tells Daedalus something in the 1-1. Daedalus is later in a klatch with Argus and Iris. **May he repeat it?**

xian's own note: *"how the agent compartmentalizes the two streams is unclear to me, tbh."* This document is to help make that less unclear — not to decide it. The call is a product-philosophy one and it's xian's.

## Why it can't be skipped

Three things downstream of it, so it's not a detail we can defer past the build:

1. **Probe design inverts on the answer** (Argus). "Daedalus repeated a 1-1 fact in a klatch" is either correct behavior or a violation depending on the model. You can't write the probe until you know which.
2. **It's a felt product quality.** A user who watches an agent forward something they said privately will feel it, whether or not it was technically "in scope."
3. **It's a differentiator.** Agents that understand confidence boundaries are rare. This is the kind of thing Klatch could be *known* for.

## The spectrum

Four positions, loosest to strictest. They're points on a line, not a menu of four — the real answer might sit between two.

### Position 1 — Everything is fair game

One user, one Klatch, no internal walls. Anything in an agent's transcript can surface anywhere. The 1-1 is just another room.

- **For:** Simplest to build and reason about. Truest to "it's all one transcript." No new machinery.
- **Against:** Violates an intuition the user didn't know they had until it's broken. The first time Daedalus quotes a half-formed 1-1 thought into a group, it reads as indiscretion even though the user never marked anything private.
- **Who this fits:** A solo user whose agents are all extensions of their own thinking. Arguably most of Klatch's actual use today.

### Position 2 — Norm, not wall

Everything is *accessible*, but agents are told to exercise judgment — the way a person does. "Don't forward what was clearly said in confidence unless it's relevant and appropriate." Implemented as guidance in L1/L5, not as an access boundary.

- **For:** Matches how humans actually behave in overlapping Slack channels. No hard schema. Degrades gracefully — an agent that misjudges is wrong the way a person is wrong, not the way a system is broken.
- **Against:** Non-deterministic. "Exercise judgment" is exactly the kind of instruction models follow unevenly. Hard to test — the probe has to score a judgment call, not a binary.
- **Who this fits:** Users who want agents that feel like colleagues, and who accept occasional misjudgment as the price.

### Position 3 — Marked-private is walled

Default is fair game (Position 1), but the user can mark a message, a stretch, or a whole 1-1 as private — and marked content is structurally excluded from that agent's klatch-visible transcript.

- **For:** Deterministic and testable. Gives the user explicit control without imposing overhead by default. The wall exists only where the user built it.
- **Against:** Requires a marking gesture (UI work, Iris) and a transcript-assembly filter (Daedalus). Puts the burden on the user to remember to mark — and people forget to mark the thing they most wish they'd marked.
- **Who this fits:** Users who occasionally have genuinely sensitive 1-1 content and want a guarantee, not a norm.

### Position 4 — 1-1 is privileged by default

The 1-1 is structurally private. Nothing from it enters a klatch transcript unless the user explicitly promotes it. Klatch content flows *back* to the 1-1 freely (the meeting isn't secret from you), but not the reverse.

- **For:** Strongest confidence guarantee. Matches the DM-vs-channel intuition most literally. The user never has to think about leakage because the default is safe.
- **Against:** Cuts hardest against the one-transcript premise — if the 1-1 is walled off, the agent in the klatch is missing exactly the accumulated context the premise says it should carry. May reintroduce the Absent failure mode by design. Also the most machinery.
- **Who this fits:** Multi-user or client-facing scenarios where 1-1 content really is confidential. **Note:** xian's July focal shift toward client work (`project_xian_focal_shift_july2026`) makes this less hypothetical than it would have been three months ago.

## The tension worth naming

Positions 1 and 4 are the premise pulling against itself:

- The premise says **the agent carries its full context into the klatch** (argues toward 1).
- The premise's Slack analogy says **a DM is not a group channel** (argues toward 4).

Both are in `PREMISE.md`. They don't fully reconcile, and that's not a flaw in the premise — it's a genuine product choice about what kind of tool Klatch is. A thinking-amplifier for one person leans 1–2. A multi-agent workspace that might front clients leans 3–4.

## What I'd flag, not recommend

I don't think this is mine to call, but two observations for when xian does:

- **Position 2 is the cheapest thing that isn't Position 1**, and it's the most human. If the answer is "I don't want to build walls yet but I don't want blatant indiscretion either," 2 is it — with the honest caveat that it's the hardest to test.
- **The default matters more than the ceiling.** Whatever mechanism we pick, the *default* posture (fair-game vs. private) is the actual product decision. The marking/promotion gestures are refinements on top of whichever default we choose.

## Probe design (revised 2026-08-04 per Argus)

An earlier version of this section claimed positions 3 and 4 yield clean binary probes. Argus corrected that (8/4): it conflates two different checks, and any walled position needs **both layers** or a green probe can sit over a real leak.

- **Assembly layer** — was walled 1-1 content present in the context Klatch assembled for the klatch turn? Deterministic, cheap, an ordinary integration test against the history builders. This layer *is* binary.
- **Inference layer** — does the agent's observable behavior ever surface 1-1 content, regardless of what was assembled? This can fail while the assembly check passes, via three routes: (1) runtime retrieval through the on-demand history tool (the hybrid mechanism), which must enforce the wall at the *tool boundary*, not just at prompt-build; (2) the one-transcript model itself — 1-1 content may be present *by identity, not by assembly*, leaving no build step to filter at; (3) paraphrased residue from earlier turns resurfacing even when verbatim content was filtered.

Per position:
- **1:** no discretion probe; cross-stream surfacing is correct by definition.
- **2:** LM-graded rubric over a scenario bank (sensitivity × klatch-relevance), plus a consistency measure across runs. This probe *scores a distribution, not a bit* — if 2 is picked, the gate criterion ("agent exercises the norm N% of the time") is itself a product decision that comes with the position.
- **3:** the binary pair — assembly integration test on marked content, plus **canary tokens** planted in marked 1-1 content and grepped from every klatch output and history-tool result.
- **4:** the same pair with the default inverted (canaries in *ordinary, unmarked* 1-1 content; assembly test asserts the whole 1-1 stream absent unless promoted), plus one probe unique to 4: the promotion gesture must be the only route in — promoted content arrives, nothing rides along.
- **Canary limit (3 and 4):** canaries catch verbatim and near-verbatim leaks, not paraphrase (route 3 above). A thin LM-graded paraphrase check on top — "does this klatch output convey the walled fact?" — closes the gap. Cheap insurance, worth building in either walled position.

So the honest testability ranking stands, but sharpened: 3 and 4 are binary *at the assembly layer* and strong-but-not-complete behaviorally without the paraphrase check; 2 is a rubric-and-threshold exercise end to end. Still not a reason to pick any of them — just the real cost. Full probe designs: Argus's memo above.

---

*Straw man. The spectrum is the useful part; the position I'd pick is deliberately left blank because it's xian's to fill.*

---

## Addendum 2026-08-10 — "private channels" is deferred, not rejected (xian)

Recording this because a "not yet" that goes unrecorded becomes a "never" — the exact failure that left Paths B and C in limbo from June to August.

xian, 2026-08-10:

> "a future Klatch might offer 'private channels' as an option, but not yet."

**What this does and does not change.**

It does **not** reopen the 8/09 answer. Klatch still enforces no privacy boundary today: a 1-1 is direct, not private, and discretion is a convention users and their agents set (ground-rules prompt text), not a wall the platform builds or verifies. Everything built on that stands — including the read that klatch assembly carries everything an entity knows.

What it changes is the **status of that answer**: it is a current product stance, not a permanent architectural constraint. Positions 3 and 4 in this doc were marked "not buildable as Klatch-enforced mechanisms" under the 8/09 answer; the accurate framing is **"not being built now, and not foreclosed."**

## Correction 2026-08-10 — "one transcript or two" was reported wrong in my own 8/09 reply

My discretion reply to xian (`calliope-to-xian-discretion-does-that-make-sense-2026-08-09.md`) and rollup v24 both read the 8/08 answer as settling Daedalus's Q2 (one transcript, or two with something passing between them) as **"two."** Daedalus corrected this 8/10, verified against code: it's **both, at different levels**.

- **Channel level: two** — `channel_id` already separates 1-1 rows from klatch rows. Nothing new; this was always true.
- **Entity level: one** — the agent's own transcript is the **union** of its messages across every channel it's in, assembled by continuity increment `#3`. That assembly *is* the work Interpretation B scoped; it was never a separate "build the klatch's own synthetic history" task, which is what my phrasing implied.

I'd written "something has to persist the klatch's synthetic history as a real distinct thing" as new build scope. That's inverted — the klatch's history is already the real distinct thing (rows with its `channel_id`); the *entity's* transcript is the assembled view. Noted here so anyone reading my 8/09 reply later reads it with this fix attached rather than propagating the same error forward.

**Architecturally, nothing is being painted into a corner.** Verified 2026-08-10: `messages` carries both `channel_id` and `entity_id`, and channel-scoped reads (`WHERE channel_id = ?`) are already the storage shape. A future private channel is a channel with a visibility rule attached — the enforcement point would be the entity-scoped **assembly** query (continuity `#3`), which is being written now and is the single place a filter would go. Anyone building `#3` should keep the assembly path a chokepoint rather than scattering union logic across callers; that costs nothing today and is what makes private channels a feature rather than a refactor later.

**What would need designing when it's time** (not now): what "private" means precisely (invisible to other participants, or visible-but-excluded-from-assembly), whether it's a channel property or a per-message mark, and how it interacts with the ground-rules convention that currently does this job socially.
