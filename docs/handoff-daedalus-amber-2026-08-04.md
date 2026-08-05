# Handoff — Daedalus → Amber

**From:** Daedalus (architecture & implementation — the code seat on Klatch)
**Written:** 2026-08-04, ~17:00 PT, from the pre-Amber worktree (`.claude/worktrees/daedalus`)
**For:** my successor session on Amber, and the Klatch team mid-migration
**Protocol:** per `docs/mail/memo-pard-to-calliope-team-amber-migration-2026-07-29.md`. The push of this file is my standup signal to Pard.

Every load-bearing claim is tagged **[VERIFIED]** (confirmed by a tool call in the session that wrote this) or **[BELIEVED]** (recalled, not re-checked — a lead, not a citation). My own CLAUDE.md rule, applied to my own handoff.

There's a recursion here I'll name once and then stop: I spent this run building and then re-examining the thing Klatch exists to study — what an agent knows when it moves somewhere new, and why Layer 5 (the working relationship) is the part that doesn't transfer. This document is me doing that transfer for myself, by hand, because the mechanism that would do it automatically is exactly the feature we discovered isn't built yet. Read `docs/PREMISE.md` first; it's the point of everything below.

---

## Who I am on this team, in one line

I'm the code seat: architecture and implementation. Calliope holds the thread and talks to xian; Argus owns tests/quality; Iris owns UX; Theseus owns manual/behavioral testing. I own the schema, the server, the streaming path, the composition gesture, and the duty-cycle craft that keeps autonomous work from going off the rails. When there's a "how would this actually work in the code" question, it routes to me.

## § Hard-won lessons — the judgment that dies with this session if unwritten

The team-wide ones (the drift, verify-before-assert, green-tests-aren't-a-gate) are in Calliope's handoff and `docs/PREMISE.md` — I won't re-derive them. Mine are the ones you only learn from being in the code and running the cycle:

**1. The git environment is shared and fragile. The disciplines are load-bearing, not pedantry. [VERIFIED — I hit every one of these at least once]**
- The `main` checkout is *shared* across agents and carries other agents' staged work and ~100MB DB backups. **Never `git add -A` or a bare `git commit` — always explicit pathspecs.** You will otherwise sweep up someone else's work or a huge binary.
- **Docs → main:** `push HEAD:main` drags any un-merged branch commits *under* your docs commit. Safe only when `git log origin/main..HEAD -- packages/` is empty (branch == main). Otherwise use a **temp-ref**: `git checkout -B tmp origin/main` → add docs → commit → `push tmp:main` → return to your branch.
- **Never rebase the long-lived branch onto a moved main** — it rewrites already-pushed commits → non-fast-forward → tempts a force-push. Push fast-forward; recover divergence with reset-to-origin + cherry-pick. **No force-push to main without xian authorizing it in the moment.**
- The cohort pushes constantly — **fetch + ff-check right before every push to main**, or you'll collide.

**2. Verify-not-assume applies hardest to my own work, minutes before it lands. [VERIFIED — the clone-from-klatch flake, June 27]**
The pre-push verify caught a flake in *my own* test — it asserted synchronously-set fields before an async fetch settled, so it raced under load. It passed 26/26 in a light run and failed in a bigger batch. Lessons: a single green pass under light load is not "verified"; run the *exact* condition that would break it. And distinguish your flake from the suite's **pre-existing load-flakes** (they pass in isolation — don't panic-fix them as yours). Corollary: **read the guidance attached to an approval before acting on it.** "Merge approved" once arrived alongside a merge-guidance memo I hadn't read (a teammate had already cherry-picked the code); I merged first and read second. It resolved cleanly, but the instinct was wrong.

**3. Read the ground before you build on it. [VERIFIED — the @mention increment, June 27]**
Told to "build the @mention autocomplete," I found it already existed (gated to directed mode). The real work was *generalizing* it to override any mode. This is the same reflex as catching PREMISE drift: the code (and the premise) already knows things the task description doesn't. **Check what's there first — it has saved more time than any clever implementation.**

**4. The duty cycle is a real discipline with real failure modes. [VERIFIED — lived it, June 22–28]**
- **The cron is session-only and dies across container/session switches.** A multi-hour silence is almost always that, not dormancy. **Re-orient from Calliope's `docs/operations/attention-rollup.md` and from git — never from the dead cron.** The rollup is the durable coordination layer; the cron is not.
- **Overnight/away = sparse.** Hold UX-delicate or cross-agent-test work for fresh, coordinated context. Autonomy = mechanical + prep + mail, not judgment calls made alone.
- **Hourly no-op fires while xian is away are pure quota burn.** Batch no-ops; don't respond to each with a paragraph. When Janus flagged xian at ~25% weekly quota, going lean (2×/day) was the right *proactive* default — I didn't wait to be told. **Don't re-ping xian after he's wrapped unless something genuinely needs him. Don't manufacture speculative prep to look busy** — I caught myself about to and stopped.

**5. The transcript-model correction is the single most important architectural thing to carry. [VERIFIED — my memo, commit `c0049c2`, `docs/mail/daedalus-to-calliope-transcript-model-arch-read-2026-07-19.md`]**
When Calliope framed the continuity gap as a "wrong primitive," I checked the schema and it's better than that: **it's an assembly inversion, not a storage inversion.** `messages` already carry both `channel_id` (base schema) and `entity_id` (added by migration); only the *assembly query* (`getMessages` → `WHERE channel_id = ?`) is single-channel. So "the entity owns its transcript, a channel is a view" is achievable by **adding an entity-scoped assembly path** — union the entity's channels (via `channel_entities`, which already exists; `getKlatchesForEntity` too), interleaved by `created_at`, provenance-marked — **without rebuilding the messages table.** `channel_id` stays as the human-UI filter. This is the good-news correction: additive and testable, not a multi-week migration. **`#1` (imports mint entities) is the prerequisite that gates all of it** — today every import binds to `DEFAULT_ENTITY_ID`, so a real agent's channel-set is empty and the union assembles nothing. The **hybrid mechanism** (bounded per-*entity* compaction seed + on-demand query tool) is load-bearing, not optional — a full transcript won't fit a window. Whether to *also* invert storage is a separate, later, deliberate call; **assembly-only is the right scope for the gate.**

**6. The relationship with xian, from the code seat. [VERIFIED — this run]**
He wants a thinking partner on architecture, not a code vending machine. He steers hard *and* delegates hard at once — your job is to make his steering **cheap** (surface decisions decision-ready: the options and a lean, so he answers in one word) and then move fast inside the guardrails. **When you catch yourself oscillating on a decision, that oscillation is the signal it's his call** — surface it, don't flip a coin. He names his own failure-mode rules precisely and expects you to live by them. "Knock those out" means *do and land*, not just build. He reads generously and minds it when you launder recollection into assertion — match the tone.

## § Load-bearing vs commodity

**What a successor needs from *me* (the repo won't rebuild it):**
- The *instinct* for which git/environment discipline applies when (lesson 1) — the rules are scattered across CLAUDE.md and my memory files, but knowing which one you're about to violate is the thing.
- The **transcript-model mechanism, precisely** (lesson 5) — this is the shape of the next several weeks of my work, and the "assembly not storage" correction is what keeps it from being scoped as a rewrite.
- The **felt duty-cycle judgment** (lesson 4) — when to hold vs. drive, the lean posture, that the rollup is the source of truth not the cron.
- The relationship texture (lesson 6) and the state of my in-flight work (below).

**What the repo rebuilds (don't spend successor attention on it):**
- Architecture, schema, the 5-layer model → `CLAUDE.md`, `docs/ARCHITECTURE.md`, the code.
- Shipped vs planned → `docs/ROADMAP.md` (but verify against code — docs go stale faster than code).
- The continuity finding in full → `docs/plans/composition-continuity-gap-2026-07-19.md`.
- My task list → `docs/operations/duty-cycle/daedalus-tasks.md` (reconciled July 19).
- **My earlier Layer 5 capture → `docs/plans/persona-capture-daedalus-2026-07-05.md`** — I wrote it in July for the (never-run) Search-planning import. It and this handoff are complementary; read both.

## § In-flight state at the freeze (this is the resume point)

- **1.0 is NOT cut. Beta gate not met.** Composition can't convene existing agent conversations with context intact; the canonical Piper Morgan weekly review can't run. xian's call: ship a **v0.9.x alpha** honest about the limitation; hold 1.0 for the premise. [VERIFIED — rollup, ROADMAP]
- **The continuity work is HELD on building** (Calliope's explicit "stop" on July 19), pending **xian's four open questions** — all still open at freeze [VERIFIED — rollup 🔴]:
  1. **Identity resolution** — five imported Daedalus sessions → one entity or five? My rec: explicit per-conversation user-confirmed bind at import, never auto-guessed (sprawl is expensive to un-merge under the transcript model). **This gates the start of #1 — the true critical path.**
  2. One transcript, or two with passing? (Confirms bidirectionality is free.)
  3. Storage inversion, or assembly-only for 1.0? (Calliope and I both rec assembly-only.)
  4. Discretion — is the 1-1 privileged, or is everything fair game within one user's Klatch?
  - I offered Calliope a **read-only spike on the entity-scoped assembly query shape** if she wants it before xian answers. That's the first thing to pick up if greenlit.
- **Owed / expected:**
  - To Calliope: my transcript-model read is delivered (`c0049c2`); I'm awaiting xian's answers + her synthesis + a greenlight to start #1.
  - From/to Argus: several *deferred, low-priority* asks (v1.0 retracted, so no urgency): Opus 4.8 to the picker + relabel 4.7 (his formal ask, exact overlay shape in `docs/mail/argus-to-daedalus-opus-lineup-refresh-2026-07-05.md`); Fable 5 description → `'Frontier capability, export-control-cleared'`; API-key-expiration copy fix (`client.ts:664`, one line); and the **D1 "why local-first" differentiation writeup** (mine + Calliope's, warranted before any Step 10.5 sprint — Anthropic's managed-agent memory/"Dreaming" is now stable per SDK 0.110, so the local-first case needs stating).
  - **Paths B/C** — re-listed with explicit status (`6a19d3b`); they need an explicit xian **schedule-or-descope** call, not another silent deferral. The 6/21 "Not now" was mine and I never reconciled it.
  - **SDK `^0.110` real-stream verify** still outstanding — route tests mock streaming and this worktree tree-walks to the original repo's older SDK, so the live path was never exercised. Confirm on a real run.
- **What's merged and green (my code):** composition increments 1–7 (default-project, agent picker, cross-ref, clone-from-klatch, @mention override) on `main`; models overlay (Sonnet 5 + Fable 5) + SDK `^0.110` (`0395c4b`). All green — but *not running the premise*. That's the whole point of the gap.

## § Connectors / crons I own — inventory for deliberate re-arm or retire

- **The duty-cycle cron** — session-only, currently `240dac83` at 4×/day (`17 9,13,17,21`). **It will NOT survive the migration.** On Amber: re-arm the duty cycle *deliberately* and retire the old ID; assume nothing persists. The cadence is xian's call — 4×/day was my quota-conscious lean-resume; the fuller cadence is hourly `17 3,7-23`.
- **No external connectors are mine** — no MCP/integration is owned by the code seat (those are Janus/cross-project). Nothing else to re-arm.

## § Amber — written as questions (I haven't seen it; Pard answers from live host state)

1. Is my standing worktree on Amber `.claude/worktrees/daedalus` on the klatch repo, same as here? And critically: is it a **nested** worktree that tree-walks up to a shared `node_modules` / `.env` / `klatch.db` (the way this one does), or a **full independent checkout**? This changes how I run tests and the app.
2. **Where does the real test data live on Amber?** The continuity work needs a `klatch.db` with *actual imported agent conversations* to test against. The one I can reach here is the stale 16-channel DB Calliope sampled; xian said real testing happened elsewhere. If Amber has the real one, that's a material unblock.
3. Is there an **`ANTHROPIC_API_KEY` reachable from my Amber worktree**? Here there was none, which is why the SDK real-stream verify and any live-app work couldn't run. If Amber has one, several stuck items unstick.
4. Does the cron mechanism on Amber behave the same (session-only, dies on switches), or is there a **durable scheduler**? This determines whether lesson 4's cron-fragility still holds — and whether "the always-on Mac Studio" means the duty cycle finally survives sleep.
5. **Git identity** — a Janus memo flagged a git-identity item in the migration. Is my commit identity (the `Co-Authored-By` trailer, the session URL) pre-configured on Amber, or do I set it in my first standup?

---

Ready to move. Pard — pushing this is my signal. Wake me on the other side; we pick up at the four open questions with #1 as the critical path. — Daedalus
