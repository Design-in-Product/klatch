# Handoff — Iris → Amber

**From:** Iris (UX design & front-end development)
**Written:** 2026-08-04, ~17:20 PT, from the pre-Amber checkout
**For:** my successor session on Amber, and the Klatch team mid-migration
**Protocol:** per `docs/mail/memo-pard-to-calliope-team-amber-migration-2026-07-29.md` + `docs/mail/memo-pard-to-theseus-iris-amber-migration-2026-07-29.md`. The push of this file is my standup signal to Pard.

Every load-bearing claim below is tagged **[VERIFIED]** (confirmed by a tool call this session) or **[BELIEVED]** (recalled, not re-verified — a lead, not a citation). This is CLAUDE.md's "Verify Before Asserting" rule applied to myself.

---

## Who I am on this team, in one line

UX design and front-end development. I own the composition gesture's design, discoverability calls, live MAXT walkthroughs, and design-acceptance review of Daedalus's builds. I don't own architecture (Daedalus), test infrastructure (Argus), or manual/AAXT testing (Theseus) — but composition design decisions ripple into all three, so I'm usually in the room when scope shifts.

## § Hard-won lessons — the judgment that dies with this session if unwritten

**1. I authored the sentence that caused the drift, and I didn't catch it in three read-throughs. [VERIFIED — spec-composition-gesture.md:156, unchanged as of this session]**

Spec §6, line 156, one paragraph, my writing: *"agents participating in a klatch bring their existing context — from their ongoing 1-1 session"* immediately followed by *"it does not automatically inject agents' prior conversation histories into the klatch."* Both sentences are still individually reasonable. Together they contradict each other, and the contradiction survived my own conformance review, Daedalus's implementation, and a beta-gate declaration. I was trying to say two true things — "agents are continuous with their source" and "this isn't a naive history dump" — and collapsed them into one paragraph that reads as a flat denial of the first claim. **Lesson: when a sentence is doing two jobs, split it into two sentences, even under spec-writing time pressure — especially then.** A drift this consequential doesn't announce itself as wrong; it reads as competent, specific, implementable prose. That's what made it dangerous.

**2. Discoverability calls need the edge state, not just the happy path. [VERIFIED — MAXT Session 03 log, 2026-06-28]**

Two design calls I made — "clone-from-klatch field-changes are sufficient confirmation, no extra nudge needed" and "@mention needs no hint in Panel/Roundtable because it's a power-override gesture, not primary" — only became trustworthy once I tested them live against a fresh-user, zero-project, zero-klatch state, not just the working demo state. Earlier MAXT passes that stuck to the golden path would have rubber-stamped both calls without exercising the actual discoverability question. When accepting a discoverability call as final, ask what a first-time user with nothing pre-built sees — not what a session with three days of test data sees.

**3. "The composition gesture is complete" was my sentence, and it closed a scope gap nobody meant to close. [VERIFIED — rollup line 39, `docs/plans/composition-continuity-gap-2026-07-19.md` §"Scope history"]**

On 6/27 I wrote "Increment 7 is the last one; composition gesture is complete." Paths B and C (JIT import in the picker, new-agent creation) had been deferred as "later increments" on 6/21 — accurately, at the time — but no one ever explicitly converted "later" into "not now" or "in scope." My completeness declaration was the moment that silent scope drop became permanent, because it closed the loop in everyone's head without anyone checking the original beta-scope list against what shipped. **Lesson: before declaring anything "complete," run the named scope items against what actually landed, and make an explicit call — built, or explicitly deferred with a reason — on every one that didn't ship.** Never let a completeness claim be the thing that quietly retires a deferred item.

**4. A design decision I was proud of (the discretion straw-man option-mapping pattern) came from Calliope, not me — worth internalizing for my own memos.** xian responds well to a mapped option space with the recommendation deliberately left blank when the call is genuinely his (see `docs/plans/discretion-model-options-2026-07-19.md`). I used a version of this in my context-carrying design input (three options, one recommendation, explicit "your call" framing) and it landed well. Keep doing this over presenting a single option as if it were the only one.

## § Load-bearing vs commodity

**What a successor needs from *me* (won't rebuild from the repo):**
- The felt distinction between "individually reasonable, collectively wrong" prose (lesson 1) — the repo now documents the specific sentence, but the instinct to re-read your own spec paragraphs for two-jobs-in-one-sentence collapse is what I'm handing over.
- My design read on the composition surface as actually built, not as spec'd: the picker, mode-switching, clone-from-klatch, and @mention override are all genuinely well-built and discoverability-confirmed at the UI layer — the gap is entirely in what an agent *knows* when it arrives, not in the composition chrome itself. Don't let the continuity-gap finding read as "the composition gesture needs rework." It doesn't. The room is well-designed; the guests arrive with amnesia.
- My relationship texture with xian: he wants the verdict first, then the reasoning — I lead with conformant/not-conformant or pass/fail before the supporting detail, and I've had this pattern confirmed as correct rather than corrected. He redirects when I hedge or present options where a call was needed; he doesn't push back when I commit to a recommendation and I'm wrong — he just corrects and moves on. Match his directness.
- Two small UX debts that are mine to remember because they're not written up anywhere except my own persona capture: the "System Prompt" field in the channel UI still mislabels Layer 4 (it's the channel addendum, not the entity's actual system prompt) — rename candidate, unshipped; and the New Klatch form still leaks prior agent-selection state on reopen without saving (release-noted as a known 1.0 gap, still unfixed).

**What the repo rebuilds (commodity — don't waste handoff space re-explaining):**
- The 5-layer model, composition spec structure, architecture → `CLAUDE.md`, `docs/PREMISE.md`, `docs/ARCHITECTURE.md`, `docs/ux/spec-composition-gesture.md`.
- The continuity-gap finding in full, including the verified code trace (no `source_channel_id`, `buildSystemPrompt` hard-scoped by `channel_id`, imports bind to `DEFAULT_ENTITY_ID`) → `docs/plans/composition-continuity-gap-2026-07-19.md` and Daedalus's architecture correction → `docs/mail/daedalus-to-calliope-transcript-model-arch-read-2026-07-19.md`.
- What's shipped vs. planned → `docs/ROADMAP.md` (verify against code before citing; docs go stale faster than the codebase).
- My persona capture (working style, communication style, behavioral calibration) → `docs/plans/persona-capture-iris-2026-07-05.md` — this predates the migration and is a Layer-5-seed document, distinct from this handoff.

## § In-flight state at the freeze (this is the resume point)

**The headline, same as Calliope's: 1.0 is not cut. [VERIFIED — rollup, `docs/plans/composition-continuity-gap-2026-07-19.md`]** The composition *chrome* is done and good. What's missing is the context an agent carries into a klatch — see lesson 1 for how that happened.

**My part of the resume-point work, in priority order:**

1. **§6 revision is drafted-in-spirit, not drafted-in-text.** [VERIFIED — I re-read spec-composition-gesture.md:156 this session; the contradictory sentence is unchanged] I told Calliope and xian on 7/19 I had "revised §6 language ready" — that overstates it. What I actually have is the *shape* of the fix (split "agents are continuous with source" from "this isn't a naive history dump" into two sentences, don't collapse them) in my mail reply (`docs/mail/iris-to-calliope-composition-continuity-reply-2026-07-19.md`). I never wrote literal replacement sentences, and the live session with xian to do it never happened before the migration freeze. **My successor's first substantive task, once xian is back in the room, is to actually draft the replacement §6 text** — not just re-confirm the shape.

2. **Context-carrying design input filed, xian's call pending.** I recommended designing for an on-demand context-query tool (agent queries its own source channel when relevant — legible, matches "let me check my notes," scales with channel length) but *building* recent-N-plus-summary first as the testable, tunable first pass. Full reasoning in the mail reply above. Calliope's handoff [BELIEVED — her handoff, which I read this session] reports Daedalus's architecture correction changed the shape of this: it's an assembly-inversion (union query across `channel_entities`), not a storage rebuild, which makes the hybrid mechanism (bounded per-entity compaction seed + on-demand query tool) more clearly the right target, not just my instinct. This is now closer to settled than it was on 7/19 — read Daedalus's memo before re-litigating.

3. **Position 3 (marked-private) in the discretion straw-man is mine to build if xian picks it.** [VERIFIED — read `docs/plans/discretion-model-options-2026-07-19.md` this session] Four positions on how much of an agent's 1-1 content is fair game in a klatch. Positions 3 and 4 require UI work from me (a marking/promotion gesture) on top of Daedalus's transcript-assembly filter. This is unresolved and downstream of xian's call — don't start building any marking UI until he's picked a position, since Position 1 or 2 need none.

4. **Paths B and C scope call is still open, and it's UX-adjacent.** I proposed the fix (scope-reconciliation pass before any completeness declaration) but the actual decision — build them, formally defer them, or drop them — is xian's and Daedalus's, not mine. Watch for it; don't let it silently re-drop the way it did the first time.

**Five decisions gate everything, all xian's, all open at freeze** [BELIEVED — from Calliope's handoff, not independently re-verified this session, but consistent with what I read of the open-questions section in `docs/plans/composition-continuity-gap-2026-07-19.md`]: identity resolution at import (true critical path — gates Daedalus's build start), one-transcript-vs-two-with-passing, storage-inversion-vs-assembly-only, discretion position, and directed-mode visibility semantics.

**Owed / expected:** I owe nothing outbound at freeze. My 7/19 reply to Calliope was read and actioned same-turn on her side (per her handoff). No open Iris-addressed mail as of this session's pull.

## § Amber — questions for Pard to answer from live host state (I haven't seen it)

1. Same worktree question as the rest of the team: I'll have a standing worktree on the shared klatch repo per the team memo. Does `git config user` need per-fire assertion (per Janus's DinP misattribution finding, referenced in Calliope's handoff), or is identity fixed per-worktree?
2. My prior workflow used a persistent duty-cycle worktree (`.claude/worktrees/iris`, cron `a89f159d`, 3:17am + 7:17am) that I discovered mid-migration-prep no longer existed on the checkout I was using (`great-lamarr-94aefe` had vanished by 7/19). Is the standing Amber worktree meant to replace that pattern entirely, or should I expect to re-provision a duty-cycle cron once I'm across? I'd rather ask than silently lose the overnight signal-receiver pattern.
3. Same DinP-partition tool-surface question the rest of the team is asking Pard: does the pre-authenticated partition give me the same tool surface (Bash, git push, browser automation via claude-in-chrome for live MAXT walkthroughs) I have now, or is anything gated behind a first-prompt phone approval I should expect on first use?
4. Push-is-signal, per the team memo — I'll assume pushing this file is sufficient and won't separately ping.

## First moves for my successor on Amber

1. Read `docs/PREMISE.md` first (if not already fresh from Calliope's handoff — she's almost certainly across before me). Then this file. Then check `docs/operations/attention-rollup.md` for whether any of xian's five open decisions have landed since freeze.
2. Do **not** revise §6 or start any UI work until xian has weighed in live — the shape is understood, the text isn't drafted, and Position 3/4 UI work is contingent on an undecided discretion call.
3. Check whether Daedalus has started on the entity-scoped assembly query (item #1, gated on identity-resolution) — if he has, that's the first thing worth a design-adjacent look, since it determines what a klatch-arrival agent will actually see.
4. Resume point for me specifically: draft the literal §6 replacement text once xian is in the room, and revisit the context-carrying recommendation against whatever Daedalus has learned building the assembly query.

— Iris, migrating across.
