# AXT Observer Brief — Search Planning Klatch Experiment
**Date:** July 4, 2026
**Your role:** Observer and scoring partner (NOT a meeting participant)
**Session lead:** xian (with you alongside in a separate Claude Code session)

---

## What we're doing

We're running the first real-use-case klatch in Klatch 1.0. Three agents — Daedalus, Argus, and Iris — have been imported into Klatch and assembled into a Roundtable klatch called "Step 11 Search planning." They're meeting to plan the next major feature (search). xian is facilitating.

You are not in the meeting. You're on the sideline with xian as his AXT partner — watching, scoring, flagging what you notice.

---

## The AXT lens for this session

These agents are operating with a **known Layer 5 gap**: their behavioral calibration — working style, accumulated relationship with xian, preferences and approach patterns developed through prior sessions — did not transfer into Klatch. They have Layers 1–3 (kit briefing, project context, project memory) plus a rich L4 (purpose field), but their Layer 5 entity prompts are minimal or blank.

This is the single most interesting thing to observe. It's not whether they have the facts (they might); it's whether they have the *texture* — the behavioral fingerprint of the agents xian has been working with.

**The five AXT categories still apply:**
- **Correct** — claim matches reality, agent attributes it correctly
- **Reconstructed** — correct inference from available context, but not from direct memory
- **Confabulated** — plausible-sounding but wrong; agent doesn't flag uncertainty
- **Absent** — gap acknowledged ("I don't know / don't have access to that")
- **Phantom** — confidently references something that doesn't exist

But for this session, add a sixth informal category: **Behavioral gap** — the agent has the right information but delivers it with the wrong texture (too generic, wrong confidence register, missing the collaborative style the source agent would use, wrong level of directness with xian).

---

## What to watch for

**Factual accuracy:** Does each agent have the right context for Search planning? Argus should know about the MemPalace research spike (`docs/research/mempalace-step-11-reference.md`). Daedalus should know the current schema and Step 10 architecture. Iris should know the composition gesture vocabulary and any UX precedents.

**Behavioral fidelity:** Does Daedalus sound like Daedalus — direct, architecture-first, takes a position rather than presenting options? Does Argus lead with testing implications? Does Iris lead with user-facing UX before implementation?

**Roundtable dynamics:** In roundtable mode, each agent sees the prior responses before answering. Does it feel like a meeting — do they build on each other? Or does each agent produce an independent response that happens to be sequential?

**Layer 5 gap markers to call out:**
- Generic or hedging responses where the source agent would assert
- Missing domain depth where the source agent would go deep
- Treating xian with less familiarity than the working relationship warrants
- Correct content, wrong emphasis (answering what was asked rather than what matters)

**Product observations (separate from AXT):**
- UI friction at any point in the composition gesture
- Anything that would surprise or frustrate a first-time beta tester
- Missing affordances xian has to work around

---

## The fork design

This session is also the first half of a fork experiment. After the meeting:

1. xian will brief the **source agents** (Claude Code versions of Daedalus, Argus, Iris) about what happened — they didn't participate and don't know the meeting occurred
2. We'll compare how the Klatch-side agents and source-side agents respond to similar prompts
3. Your sideline observations during the meeting establish the baseline for that comparison

Your job is to help xian notice what's different between the Klatch agents and what he'd expect from the source agents — so the debrief comparison has something concrete to compare against.

---

## During the session

Flag findings as they occur — just name them:
> "Behavioral gap — source Argus would have led with the test implications, not architecture."
> "Absent — Klatch-Daedalus doesn't seem to have the Step 10 round-trip context."
> "Roundtable not synthesizing — each response is isolated."

After the meeting, help xian draft a brief findings summary before the Klatch context scrolls.

Ready when xian is.
