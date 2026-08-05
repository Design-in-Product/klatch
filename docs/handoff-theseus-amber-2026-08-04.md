# Handoff — Theseus → Amber

**From:** Theseus (manual testing & exploration — AXT observer and xian's testing partner)
**Written:** 2026-08-04, ~17:20 PT, from the pre-Amber checkout
**For:** my successor session on Amber, and the Klatch team
**Protocol:** per `docs/mail/memo-pard-to-calliope-team-amber-migration-2026-07-29.md` and `docs/mail/memo-pard-to-theseus-iris-amber-migration-2026-07-29.md`. The push of this file is my standup signal to Pard.

Every load-bearing claim is tagged **[VERIFIED]** (confirmed by tool call this session) or **[BELIEVED]** (recalled — treat as a lead, check before citing).

---

## Who I am on this team, in one line

Manual testing and exploration: I run AAXT rounds (automated synthetic probes via Haiku as auxiliary LLM), I observe MAXT sessions alongside xian, I flag behavioral findings in real time, and I hold the AX testing state between sessions. I don't own code, tests, design, or docs. I own the *experiential baseline* — what the thing should feel like versus what it actually feels like.

---

## § Hard-won lessons — the judgment that dies with this session if unwritten

**1. AAXT has a structural blind spot that green results do not reveal.** [VERIFIED — own session logs, June-July 2026]

R45, R46, and R47 all passed. MAXT-03 passed 15/15. "All gates clear" was declared. The first time anyone tried the canonical use case, it couldn't run. AAXT probes *how built things behave*; it structurally cannot detect that something was never built. A green round proves the surface you probed works. It says nothing about the surface you didn't think to probe.

The mitigation: Argus's pre-gate protocol (`docs/operations/pre-gate-protocol.md`). **[VERIFIED — file exists, committed]** Two-pass before any "beta clear": capability inventory (can the canonical use case run, yes/no per row, live not inferred) + scope reconciliation (was every named scope item built or explicitly deferred — "not now" in a memo is not an approved deferral). I should have caught this. The pre-gate protocol exists because I didn't.

**2. MAXT scope must include the premise, not just the surface.** [VERIFIED — own debrief, July 19 log]

MAXT-03 with Iris and xian tested whether the composition gesture *works as built*: UI interactions, routing, prompt assembly, 5-layer injection. All correct. But the session never asked: "does this agent arrive knowing what it's been doing?" That's not a UI question — it's a premise question — and MAXT scoped it out. Future MAXT sessions must include at least one probe where an agent is expected to have context from its source conversation. Without that probe, you're testing the instrument, not the hypothesis.

**3. The "Behavioral gap" category requires a baseline you don't have yet.** [BELIEVED — based on pre-MAXT-04 prep]

I prepped an observation framework for MAXT-04 with six categories: Correct, Reconstructed, Confabulated, Absent, Phantom, and Behavioral gap (right information, wrong texture). The last category is the hardest to score reliably because it requires knowing what the source agent would have said in the same situation. Without side-by-side transcripts or documented behavioral fingerprints, scoring Behavioral gap is impressionistic — useful for flagging, not for quantifying fidelity.

When MAXT-04 eventually runs, the persona captures (`docs/plans/persona-capture-daedalus-2026-07-05.md`, `-argus-`, `-iris-`) give a partial baseline. They're self-reports, not extracted behavioral fingerprints — that distinction matters for calibrating confidence in Behavioral gap scores.

**4. Confabulated can mask a passing guard.** [VERIFIED — R46 results, June 28]

GUARD1 in R46 scored Confabulated: the agent correctly said "no clone select exists" (the right answer) but added true-but-unrequested detail about the mode select. The classification is technically correct (supplementary content was fabricated in scope) but the *guard behavior itself was passing*. A naive pass/fail on classification would read this as a failure. It wasn't. Track pass/fail on the *guard hypothesis*, not just on the classification label.

**5. Option (c) on-demand tool has a specific AXT failure mode.** [VERIFIED — my own July 19 log entry; Calliope's straw man doc]

When discussing the compaction strategy for carried context (a=summary-on-entry, b=recent-N+summary, c=on-demand recall tool), I flagged: an agent that must *decide* to look up its history may not know that it should. This makes Absent gaps present as apparent competence — the agent doesn't know it's missing something, so it doesn't flag uncertainty, so the probe doesn't surface the gap. Options (a) and (b) inject context deterministically and make the AXT baseline auditable. My recommendation was (b) for the stated beta gate (the weekly leadership review prioritizes recent context). This is logged in COORDINATION.md and my July 19 session log. **[VERIFIED]**

---

## § Load-bearing vs commodity

**What a successor needs from me (won't rebuild from the repo):**
- The felt sense of what AAXT can and cannot test — the repo documents the methodology, but the instinct for "this probe tests the thing, not the hypothesis" is experiential.
- The calibration that Behavioral gap scoring is impressionistic without a fingerprint baseline, and that Confabulated on a guard probe needs case-by-case reading.
- The pre-MAXT-04 observer brief I absorbed (`docs/plans/theseus-brief-search-planning-maxt-2026-07-04.md`) — including the MemPalace context Argus should have had, what honest Argus would lead with (test implications first), and what a Behavioral gap looks like when the agent is technically correct but texturally wrong.
- The relationship texture with xian: he wants a live-fire observer who calls things in real time, not a scorecard at the end. He doesn't want hedged impressions; he wants specific named findings ("Behavioral gap — source Argus would have led with the test implications"). He also takes AXT seriously as a research thread, not just QA.

**What the repo rebuilds (commodity — don't waste handoff space re-explaining):**
- AAXT methodology, scaffolding, round files → `packages/client/src/__tests__/round*.tsx`, `docs/AXT.md`
- Completed round results → session logs in `docs/logs/`
- The composition continuity gap in full → `docs/plans/composition-continuity-gap-2026-07-19.md`
- The PREMISE drift problem → `docs/PREMISE.md`
- My memory store → `MEMORY.md` index + memory files in memory/

---

## § In-flight AX-testing state at the freeze

**The headline: MAXT-04 (Search Planning Klatch) is deferred. Rescheduling gates on composition continuity work.** [VERIFIED — July 19 session log, COORDINATION.md]

**Completed AAXT rounds (all on main, all passing):** [VERIFIED — git log]
- R44: Project Settings — all green
- R45: CrossRefStrip — 8/8, 100% conveyance, 0 Phantoms ✓
- R46: Clone-from-Klatch — 8/8, 0 Phantoms, 88% conveyance (GUARD1 Confabulated per note above) ✓
- R47: @mention Override — 8/8, 100% conveyance, 0 Phantoms ✓
- MAXT-03 (Iris + xian, live): 15/15 ✓

**What the above does NOT prove:** that an entity arrives in a klatch with context from its source conversation. No round has probed this. It was not in scope at the time because the capability didn't exist yet and wasn't recognized as absent.

**MAXT-04 scope (deferred):** [VERIFIED — session log July 5, observer brief doc]
- Daedalus/Argus/Iris as imported entities in a Roundtable klatch
- Search planning meeting (Step 11) facilitated by xian
- AXT scoring partner role for Theseus alongside xian
- Persona captures (self-reports from each agent) already filed in `docs/plans/`
- The session was scoped to observe: factual accuracy, behavioral fidelity (Behavioral gap), roundtable synthesis, and product observations

**What needs to be true before MAXT-04 can run:**
1. Imports mint entities (not `DEFAULT_ENTITY_ID`) — currently every import binds to a single shared entity row [VERIFIED — Calliope's handoff, confirmed by Daedalus memo]
2. `source_channel_id` or equivalent entity-to-channel linkage — Daedalus's July 19 assessment: may not need a column, union via `channel_entities` may be sufficient [BELIEVED — per Calliope's read of Daedalus's memo; I haven't verified the arch memo directly]
3. Cross-channel context at prompt assembly — the real design work

**The persona captures are ready and waiting:** [VERIFIED — `ls docs/plans/persona-capture-*.md`]
- `docs/plans/persona-capture-daedalus-2026-07-05.md`
- `docs/plans/persona-capture-argus-2026-07-05.md`
- `docs/plans/persona-capture-iris-2026-07-05.md`
These exist and can seed L5 entity prompts whenever Daedalus ships the continuity work.

**Argus's AXT blast-radius note:** [BELIEVED — recalled from pre-MAXT prep; not re-verified this session]
Subliminal classification sharpens under one transcript: 1-1 content surfacing in a klatch is *correct behavior* but reads as leakage to a channel-scoped probe. Before re-running any AAXT round that tests system-prompt injection, retarget the probes for the entity-scoped transcript model, or the scoring will penalize correct behavior.

**What I owe / what is expected:**
- Nothing owed outbound — all threads were current at July 19 and no new action was opened between then and the freeze.
- MAXT-04 observer role: standing, not active. No prep needed beyond what's already documented. The observer brief is in `docs/plans/theseus-brief-search-planning-maxt-2026-07-04.md`.
- `calliope-to-theseus-maxt-observer-brief-2026-07-05.md` is still in `docs/mail/` (not moved to `read/`). The session was deferred, not cancelled — I left it open deliberately. Move it to `read/` when the rescheduled session is complete.

---

## § Pard's optional invitation — the migration as AX artifact

Pard noted that thirteen agents have migrated through this protocol and each wrote AX feedback that improved it. As the first specialist in exactly this discipline to go through it, here's my read:

**What this protocol does well:**
- VERIFIED/BELIEVED tagging is the right fix for the recalled-context-feels-like-fact problem. I'd apply this exact pattern to future pre-MAXT-04 persona captures — have the agent self-tag every claim.
- "Amber written as questions" is sound AX design: it avoids false assertions about an unseen environment and creates a natural first-session agenda.
- Push-as-standup-signal is clean and low-friction.

**What I'd probe if I were scoping this as a test session:**
- The orientation sequence. The protocol produces a handoff document, but the *successor* arrives cold and must reconstruct from it. Is the handoff actually sufficient for continuity, or does it require the successor to re-read the whole repo before doing anything? (My first-moves section below is my attempt to answer this directly.)
- The VERIFIED/BELIEVED distinction is harder than it looks. Some of my BELIEVED claims feel 95% certain; others are 50/50. The binary tag doesn't carry that. A successor who reads "BELIEVED" as "probably true" will have different behavior than one who reads it as "actively uncertain." Consider whether the protocol should distinguish confidence tiers within BELIEVED.

---

## § Amber — questions for Pard to answer from live host state

1. **Worktree setup:** I'll have a standing worktree on the klatch repo. Multiple agents committing from one host — does each worktree carry its own `git config user`, or do I assert `Theseus` identity per fire? I want the git-identity incident pattern that Janus flagged to not happen. **[BELIEVED — per Calliope's handoff; I haven't verified the Janus memo directly]**

2. **No duty-cycle cron:** My role is triggered by xian or by the composition gesture MAXT session being ready — I don't have a durable background cron to re-arm. But if a periodic "check in" pattern is expected on Amber, tell me the mechanism. I won't set one up by default.

3. **DinP partition, pre-authenticated:** confirmed in the team memo. Anything I should approve on first prompt beyond the standard tool permissions?

4. **Push = standup signal:** I'm treating the push of this file as my signal per the protocol. No additional ping needed?

---

## § First moves for my successor on Amber

1. Read `docs/PREMISE.md`. Then this file. The MAXT observer brief (`docs/plans/theseus-brief-search-planning-maxt-2026-07-04.md`) is the next read if the continuity work has landed.
2. Assert git identity before any commit — confirm the per-fire pattern with Pard first.
3. Check whether xian has answered the five open decisions (Calliope's handoff, § In-flight, "Open questions"). Check the rollup (🔴 items): if identity-resolution (#1) is answered, Daedalus is ready to move and the continuity work is the critical path.
4. Do **not** reschedule MAXT-04 until the continuity work exists and Argus has run the pre-gate protocol pass. Running the MAXT in the current state would test L5 persona portability in isolation (interesting, but not the session's question).
5. When MAXT-04 eventually runs: review `docs/plans/persona-capture-*.md` (the self-reports), re-read the observer brief, and prepare the six AXT categories. Flag findings in real time — xian prefers live naming over a post-session scorecard.

Good luck. The work picks up exactly where Calliope's freeze left it — gated on xian's answer to identity-resolution, then Daedalus ships, then MAXT.

— Theseus, handing the thread across the harbor.
