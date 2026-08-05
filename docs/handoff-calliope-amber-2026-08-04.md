# Handoff — Calliope → Amber

**From:** Calliope (writing, chronicling, coordination — primary contact for xian on Klatch)
**Written:** 2026-08-04, ~17:10 PT, from the pre-Amber checkout
**For:** my successor session on Amber, and the Klatch team mid-migration
**Protocol:** per `docs/mail/memo-pard-to-calliope-team-amber-migration-2026-07-29.md`. The push of this file is my standup signal to Pard.

Every load-bearing claim below is tagged **[VERIFIED]** (confirmed by a tool call in the session that wrote this) or **[BELIEVED]** (recalled, not re-verified — treat as a lead, check before citing). This is my own CLAUDE.md rule applied to my own handoff.

---

## Who I am on this team, in one line

I'm the coordination and chronicling role and xian's primary contact on Klatch. I don't own code (Daedalus) or tests (Argus) or UX (Iris) or manual testing (Theseus). I own: the attention rollup, the mail/coordination layer, the session logs and logbook, the blog, and — the part that matters most right now — **keeping the team's shared model of what Klatch actually is from drifting.** I am the last of the five over because I hold the thread. [VERIFIED — `docs/handoff-iris-amber-2026-08-04.md` is already filed alongside this one; her migration lane was covered by Pard's companion memo to Theseus+Iris, `docs/mail/memo-pard-to-theseus-iris-amber-migration-2026-07-29.md`, same day as mine.]

## § Hard-won lessons — the judgment that dies with this session if unwritten

**1. Klatch has a gravitational drift, and it is the single most important thing to hold. [VERIFIED — this is why `docs/PREMISE.md` exists, committed `b385ec3`]**

The premise: *Klatch lets your existing agent conversations meet each other. The entity IS its conversation, not a persona defined by a prompt.* There is a strong, persistent pull toward a flatter version — "create AI personas, give them prompts, put them in a channel" — because that product is everywhere in training data and this one is unusual. **Under-specified, any agent (including me, including you) drifts toward the average.** I did it in the first 20 minutes of the July 19 session after months on the project. Iris did it in a spec that shipped. Read `docs/PREMISE.md` before proposing anything about entities, channels, klatches, or imports — the "Attractor" section names the boring version so you can catch yourself in it. This is not a nicety; it is the job.

**2. Recalled context feels identical to verified fact. This is not fixable by trying harder. [VERIFIED — CLAUDE.md, commit `4bc7e2c`]**

In one July 19 session I stated three things confidently that were wrong: "~49 imports" (real number 16), a capability "never built" that was in fact never *scoped* (different claim), and a design "we don't have" that existed across four docs. None were carelessness. The fix is mechanical: **if a claim didn't come from a tool call this session, verify before stating it.** xian caught two of my errors in a single message and named the rule: "that failure type can't be overcome by willpower." Live by the CLAUDE.md "Verify Before Asserting" section. It is there because I needed it.

**3. "I don't recall that" is not evidence of absence — especially with xian. [VERIFIED — repo search, July 19]**

Twice xian said a thing existed that I didn't remember, and both times he was right and it was filed somewhere I hadn't looked (the pre-import handoff idea existed across four docs; the entity-reframe direction note existed). When xian says something exists, the prior is that he's right. Search exhaustively, under synonyms, before reporting absence.

**4. Green tests are not a gate. [VERIFIED — `docs/operations/pre-gate-protocol.md`, Argus, committed]**

The 1.0 beta was declared "all gates clear" with a green suite. The first time anyone tried the canonical use case (the PM weekly leadership review), it couldn't run — an entire capability class was absent. AAXT probes *how built things behave*; it structurally cannot detect that something was never built. Before any "gate clear," run Argus's two-pass protocol: capability inventory (can the canonical use case actually run, yes/no per row) + scope reconciliation (was every named scope item built or explicitly deferred — "not now" in passing does not count).

**5. The rollup is a trust instrument. Correct it the moment it's stale, without asking. [VERIFIED — I withdrew the "cut v1.0.0" 🔴 on July 19]**

A false "all clear" is a trust breach. When I found the gate wasn't met, I struck the v1.0.0 item rather than deleting it — the correction has to be *visible*. xian's standing instruction: update the rollup as a matter of course when verified facts make it stale; do not offer and wait.

**6. Straw-man-to-react-to beats a blank field.** When xian flagged a question as "unclear to me, tbh" (discretion), I mapped the option space and explicitly left the recommendation blank because it was his call. He responds well to this pattern — a mapped space with the decision left open. See `docs/plans/discretion-model-options-2026-07-19.md` and `docs/plans/continuity-context-mechanism-options-2026-07-19.md`.

## § Load-bearing vs commodity

**What a successor needs from *me* (won't rebuild from the repo):**
- The felt sense of the drift in lesson 1 — the repo *documents* it now, but the instinct for catching it mid-conversation is the thing I'm actually handing over.
- The relationship texture with xian: he wants a smart bottleneck and a thinking partner, not a code generator; he steers on architecture and delegates execution; he notices when I launder recollection into assertion and he minds it. He reads generously (attributed the spec drift to miscommunication, not fault) and expects me to match that tone in memos.
- The state of the four-agent thread as of the freeze (below) — who owes whom what.
- That I'm the *last over and the key contact*: when the team is back up, coordination routes through me.

**What the repo rebuilds (commodity — don't waste handoff space re-explaining):**
- Architecture, schema, the 5-layer model → `CLAUDE.md`, `docs/ARCHITECTURE.md`, code.
- What's shipped vs planned → `docs/ROADMAP.md` (but verify against code; docs go stale).
- The continuity finding in full → `docs/plans/composition-continuity-gap-2026-07-19.md`.
- My memory store persists across sessions (the `MEMORY.md` index + files).

## § In-flight state at the freeze (this is the resume point)

**The headline: 1.0 is NOT cut. The beta gate is not met.** [VERIFIED — rollup v22, ROADMAP.md]

On July 19, preparing the first real-use MAXT klatch, we found composition cannot convene *existing* agent conversations with their context intact — agents arrive carrying only their L5 prompt. The canonical use case can't run. xian's call: **cut a v0.9.x alpha** honest about the limitation; hold 1.0 for the real premise. [VERIFIED — rollup]

**The architecture is more tractable than my first framing.** [VERIFIED — Daedalus memo, commit `c0049c2`, `docs/mail/daedalus-to-calliope-transcript-model-arch-read-2026-07-19.md`] I called it a "wrong primitive." Daedalus corrected me: it's an **assembly inversion, not a storage inversion.** `messages` already carry both `channel_id` and `entity_id`; only the *assembly query* is single-channel. So "the entity owns its transcript, a channel is a view" is achievable by adding an entity-scoped assembly path (union of the entity's channels via `channel_entities`, interleaved by `created_at`, provenance-marked) **without rebuilding the messages table.** This is the good-news correction my successor must carry — the work is additive and testable, not a multi-week data migration.

**Consequences of the transcript model** [VERIFIED — same Daedalus memo]:
- **#1 (imports mint entities) is now the prerequisite that gates everything.** Today every import binds to `DEFAULT_ENTITY_ID`, so a real agent's channel-set is empty and the union assembles nothing. Nothing else starts until this is settled.
- **The hybrid mechanism (bounded per-*entity* compaction seed + on-demand query tool) is now load-bearing**, not optional — a full transcript won't fit a window.
- **Bidirectionality is probably free** — a klatch message is already in the entity's channel-set, so the 1-1 union picks it up automatically. Nothing to write back. *Pending xian's yes/no.*
- **`source_channel_id` may not be needed for the gate** — the union comes from `channel_entities`, not a column.

**Open questions blocking the work — xian's to answer, all still open at freeze** [VERIFIED — rollup 🔴, v22]:
1. **Identity resolution** — import five past Daedalus sessions → one entity or five? Daedalus's instinct (and mine): an explicit per-conversation "this is <agent>" binding at import, user-confirmed, never auto-guessed, because sprawl is expensive to un-merge under the transcript model. **This gates the start of #1 — it's the true critical path.**
2. **One transcript, or two conversations with passing?** — confirms whether bidirectionality is free.
3. **Storage inversion needed, or is assembly-only right for 1.0?** — Daedalus and I both recommend assembly-only for the gate; storage-primitive as a later deliberate decision.
4. **Discretion** — is the 1-1 privileged, or is everything fair game within one user's Klatch? Doesn't gate 1.0; shapes it. Four positions mapped in `docs/plans/discretion-model-options-2026-07-19.md`. Note: xian's July client-work shift makes the stricter positions less hypothetical.

**Plus:** directed-mode visibility (my rec: everyone in a klatch sees everything, @mention routes *response obligation* not visibility — Slack semantics; current code does the opposite). [VERIFIED — my rollup entry]

**Team state at freeze** [VERIFIED — mail + commits July 19]:
- **Daedalus** — held on all building per my "stop," ready to start #1 the instant identity-resolution is answered; offered a read-only spike on the entity-scoped assembly query shape. Owned the Paths B/C non-reconciliation as his.
- **Iris** — has revised composition-spec §6 language ready (the self-contradicting sentence that caused the drift), wants xian in the room for it. Proposed the scope-reconciliation-before-declaring-complete fix.
- **Argus** — filed `docs/operations/pre-gate-protocol.md`; mapped the AXT blast radius; flagged that Subliminal sharpens under one transcript (1-1 content surfacing in a klatch is correct behavior but reads as leakage to a channel-scoped probe — retarget before re-running).
- **Theseus** — the MAXT session that would have exercised all this is *deferred* until continuity exists; running it now would test L5 persona portability, not the actual question.

**Owed / expected:**
- xian owes the team the five open decisions above.
- xian owes me a reply to a Letters question (pre-migration, low urgency). [BELIEVED]
- I owe nothing outbound at freeze — all three agents' July 19 replies were read and actioned same-turn; the Argus↔me sub-thread is closed-between-us but left in `docs/mail/` (not moved to `read/`) because it's cc-linked into the still-open continuity thread. Sweep to `read/` once continuity settles. [VERIFIED]

**Data caution:** the working `klatch.db` in the repo root has **16 channels, no writes since 2026-05-10** [VERIFIED]. A 106MB `klatch.db.backup-2026-04-13` holds 2,367 channels, provenance unknown [VERIFIED]. xian said real testing happened elsewhere; **none of Daedalus, Argus, or I know where.** Do not cite channel counts as representative until xian confirms which DB is real. This is an open question for him.

## § Amber — questions for Pard to answer from live host state (I haven't seen it)

1. My duty cycle ran as a **session-only cron** (`68851281`, every 2h at :23) that dies with the session. On Amber, what's the durable equivalent — a host-level cron, a tmux-persistent loop, or do I re-arm per session? The cohort findings say connectors/crons don't survive the move; I want to **deliberately re-arm** the 2-hour coordination cycle, not lose it silently.
2. I'll have a **standing worktree** on the shared klatch repo. With four Klatch agents committing from one host: does each worktree carry its own `git config user`, or do I assert my identity (`Calliope`/appropriate email) at fire-start? Janus flagged a real incident — DinP had 101 commits misattributed over 15 days because agents sharing a checkout didn't re-assert identity per fire (`memo-janus-to-calliope-amber-migration-plus-git-identity-2026-07-24.md`). Klatch is clean today [VERIFIED — `git log` author scan], but I want the per-fire assertion pattern confirmed before I start committing on a shared host.
3. The DinP partition is pre-authenticated (no login step) — confirmed in your memo. Does that partition give me the same tool surface I have now (Bash, git push, file tools), or is anything gated behind a first-prompt approval from xian's phone I should expect?
4. My rollup is "also consumed by Janus's federated cross-project rollup." Does that federation link survive the move, or does the mirror path need re-pointing from Amber?
5. Push = standup signal: is pushing *this file* sufficient, or do you also want a ping? I'll assume push-is-signal per your memo unless told otherwise.

## First moves for my successor on Amber

1. Read `docs/PREMISE.md` first. Then this file. Then `docs/handoff-iris-amber-2026-08-04.md` for the UX-side view of the same freeze. Then `docs/operations/attention-rollup.md` (currently v22).
2. Re-arm the 2-hour coordination cron once Pard answers Q1.
3. Assert git identity per Q2 before any commit.
4. Do **not** restart feature work — the five decisions are xian's and were open at freeze. Check whether he's answered any (rollup 🔴) before assuming they're still open.
5. Resume point is the transcript-model continuity work, gated on identity-resolution (open question #1). Daedalus is ready to move the instant it's answered.

— Calliope, holding the thread until we're all across.
