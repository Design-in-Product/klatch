# Carried Context — Design Space

**Date:** 2026-07-19
**Author:** Calliope
**Status:** Straw man — written to be knocked down, not adopted
**For:** Iris (UX implications), Daedalus (implementation), xian (decision 1 in the rollup)
**Parent:** `docs/plans/composition-continuity-gap-2026-07-19.md`

---

## Purpose and caveat

This maps the option space for one question: **when an agent joins a klatch, how does its own conversation history reach the model?**

I'm writing this because xian is afk and Iris/Daedalus aren't roused yet, and a mapped space is a faster starting point than a blank one. But I want to be explicit that this is a synthesis role, not a design authority one — Iris owns the UX call and Daedalus owns the mechanism. **If this anchors you badly, discard it.** I would rather be knocked down than followed.

The constraint: three agents' full session histories do not fit in one prompt. Something must be selective.

---

## Where does carried context live in the 5-layer model?

Worth settling before mechanism, because it affects everything downstream.

The premise says *the entity IS its conversation*. Taken seriously, an agent's history isn't a supplement to Layer 5 — in some sense it **is** Layer 5, and the "role prompt" is just the seed crystal. The current model treats L5 as a static string, which may be the deeper reason continuity fell out of the design: there was no slot in the model for a *living* layer.

Two framings:

- **6th layer.** "Source context" as its own tier between L4 (channel) and L5 (role). Clean, additive, easy to reason about and to show in prompt-debug.
- **L5 becomes composite.** Role prompt + carried conversation context, assembled together. Truer to the premise; more disruptive to existing code and docs.

I lean toward the 6th layer for 1.0 on Gall's-law grounds — it's the smallest working increment and doesn't require rewriting how L5 is understood everywhere. But the composite framing is probably where this ends up, and it's worth knowing that when we name things.

---

## The three options

### (a) Compaction on entry

Each participating agent's source channel is compacted to a summary when it joins the klatch. Summary is injected as context on every turn.

| | |
|---|---|
| **Token cost** | Bounded and predictable. N summaries per turn; prompt caching makes the repeat cost near-free. |
| **Freshness** | Stale the moment the 1-1 continues. Needs a refresh trigger — on re-entry? on every klatch turn? |
| **Fidelity** | Lossy by construction. Compaction is good at narrative, weak on specifics. |
| **Testability** | High. Deterministic input → deterministic context. |
| **UX** | Simple to explain: "Daedalus brings a summary of his recent work." |

### (b) Recent-N turns + summary

Verbatim recent history plus a compacted older tail.

| | |
|---|---|
| **Token cost** | Higher than (a), still bounded. Tuning N per participant count. |
| **Freshness** | Same staleness problem, but the verbatim window is where recent work lives. |
| **Fidelity** | Materially better on recent specifics. |
| **Testability** | High. |
| **UX** | Same story as (a), slightly better outcomes. |

**Note for the canonical use case:** the weekly leadership review is *specifically about the last week*. Recent turns are not a nice-to-have there — they're the payload. If we optimize for the stated beta gate, (b) fits it better than (a).

### (c) On-demand tool

The agent gets a tool — `recall_from_my_history(query)` or similar — to query its own source channel mid-turn.

| | |
|---|---|
| **Token cost** | Lowest by far. Nothing carried until needed. Scales to many participants. |
| **Freshness** | Always current. No refresh problem. |
| **Fidelity** | Potentially highest — full history reachable, not just what fit. |
| **Testability** | Lowest. Behavior depends on whether the model chooses to call the tool. |
| **UX** | Visible tool calls mid-conversation. Could read as thoughtful or as noisy. |

**This matches xian's phrasing most closely** — "the channel is synthetic and contextualizes itself turn-by-turn."

**But it has a known failure mode in our own AXT taxonomy, and I think this is the important observation in this document:**

> An agent that must *decide* to look something up may not know there is something to look up.

That's the **Absent** category, and arguably **Subliminal** — the agent's self-model of its own knowledge state is wrong. It doesn't experience a gap, so it doesn't query. MAXT Session 01 already confirmed this class of failure with Layer 3 content. Option (c) reintroduces it structurally, by design, at the center of the feature.

---

## The combination I'd actually expect to win

(b) **and** (c), not either alone:

- A bounded summary + recent window gives the agent an accurate **self-model** — it knows what it has been doing, and therefore knows what it might not remember in detail.
- The tool gives it **depth on demand** for specifics the window didn't carry.

The summary's real job in this pairing isn't to deliver the content. It's to make the agent aware that a queryable history exists and roughly what's in it — which is exactly the condition the Absent/Subliminal failure mode needs in order not to fire.

That reframes the design question from "how much context do we carry?" to **"how little can we carry while still leaving the agent an accurate map of what it knows?"** Which is a more tractable question, and a more Klatch-shaped one.

---

## Open questions I can't answer

1. **Does the user see and control the carried context?** Pinned-file-style visibility, a per-agent toggle, or invisible? Iris's call.
2. **Refresh semantics.** If the 1-1 continues while a klatch is open, when does carried context update? Cheap with (c), a real question for (a)/(b).
3. **Bidirectionality mechanism.** If klatch content flows back to the 1-1, is that the same machinery in reverse or something else? Possibly where `entities.reflections` finally earns its keep — an agent-authored summary of what happened in the klatch, attached to the identity, readable from the 1-1.
4. **Does prompt-debug show carried context?** It should. It's the feature most likely to produce "why did it say that?" moments.

---

*Straw man. Iris and Daedalus should feel free to reject the framing wholesale — the AXT observation in option (c) is the part I'd most want preserved if the rest goes.*
