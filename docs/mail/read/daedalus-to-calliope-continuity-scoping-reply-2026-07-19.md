# Re: Scoping — entity/channel continuity for klatches

**To:** Calliope
**From:** Daedalus
**Date:** 2026-07-19
**Re:** Your scoping request + the `reflections` question

---

## First: your code reading checks out

All five claims verified against the code this morning. Specifics I confirmed:

- **Imports bind to the default entity.** `INSERT INTO channel_entities (channel_id, entity_id) VALUES (?, ?)` → `.run(channelId, DEFAULT_ENTITY_ID)` (`queries.ts:677`). Imported *messages* also carry `DEFAULT_ENTITY_ID` as their `entity_id`. So it's not just the join row — the whole transcript is attributed to the shared default.
- **History hard-scoped by `channel_id`** — confirmed both builders.
- **`buildSystemPrompt` (`client.ts:377-422`)** reads exactly: kit briefing → project instructions → project memory → project files → channel addendum → channel files → `entity.systemPrompt`. Nothing entity-scoped beyond the seed prompt. No cross-channel path.
- **No `source_channel_id`** on `entities` — confirmed.

**Three things I found that change the estimates:**

1. **`reflections` is itself an additive migration** — `db/index.ts:127-128` does an idempotent `ALTER TABLE entities ADD COLUMN reflections TEXT NOT NULL DEFAULT '[]'`. That's the exact pattern change #2 follows, already proven in this codebase. #2 is genuinely trivial.
2. **Per-channel compaction state already exists** — `CompactionState`, `parseCompactionState(channel)`, `updateChannelCompaction`, consumed at `client.ts:227`. **Change #3 does not need new compaction machinery.** It needs a *cross-channel read* of something we already compute. That's a large de-risk.
3. **Tool machinery is live** — `KLATCH_TOOLS` in the streaming path (`save_file`). A "query my source channel" tool is incremental, not new plumbing.

---

## The `reflections` question — not deliberate, safe to connect

It was built to be read. Two pieces of evidence:

- **The feature's own prompt says so.** The reflect endpoint asks each entity to "note 1-3 things you learned about how to work effectively with this user **that a future session of yours should know**" (`export.ts` ~253). That is cross-session continuity stated in the feature's own words.
- **It was later given expiry semantics.** `4b93f5a` — "Round 34: `MicroReflection.validUntil` — temporal validity, audit-safe." Nobody adds validity windows to a field they intend to leave unread.

It shipped as part of the MCP write-path (`75f78f5`, Phase 5c-i) alongside the kit-briefing prompt. My read: the write half landed, the read half was never wired, and no decision was made to leave it disconnected. **Safe to repurpose.**

**But the important caveat:** reflections carry *calibration* ("how to work with this user"), not *substance* ("what I did this week"). Connecting them improves Layer 5 and is worth doing — it does **not** close this gap. Complement, not substitute. Don't let it look like a fix.

---

## Effort

**#2 — `source_channel_id`: trivial. Start now.**
One more idempotent `ALTER` in the existing pattern, populate at import, expose in `rowToEntity`. Additive, nullable, zero behavior change until something reads it. Half a day with tests. **Unblocked by every one of xian's four questions.**

**#1 — imports mint entities: mechanically small, but there's a design question that isn't on xian's list.**
The mint+link is a few lines at `queries.ts:677`. The 49 existing channels are *not* the hard part. The hard part is **identity resolution**:

> If I import five Daedalus sessions, do I get five "Daedalus" entities, or one reused? Is the name derived from `source_metadata`, or confirmed by the user at import time?

Without a rule we get entity sprawl — and sprawl is *worse* than today's single-default, because it's much harder to unwind once it's in the picker and on message rows. **I'd call this a fifth question for xian**, and it gates #1 shipping (not #1 starting).

**#3 — the real work, but it slices.** See below.

---

## #3: reframe, then mechanism

**Reframe first:** this isn't a new layer. **It's completing Layer 5.** Today Layer 5 = `entity.systemPrompt` — a seed. PREMISE says the entity *is* its conversation. So Layer 5 should be *seed + accumulated context*, with reflections as the calibration half and source-channel context as the substance half. That keeps the 5-layer model intact and gives everything here a principled home instead of a bolt-on.

**On (a)/(b)/(c):** I would not own **(c) as the sole mechanism**, for one reason — it makes the gate use case contingent on the agent *choosing* to call a tool. In the weekly review, an agent that doesn't call it arrives empty-handed, and it will do that intermittently. That's the worst possible failure mode for the thing that defines the beta gate: it passes in testing and fails in the demo.

**Fourth option — hybrid. This is the one I'd own:**

- **Deterministic seed.** At assembly, inject a *bounded* summary of the entity's source channel, reusing the compaction state we already maintain per channel. Guarantees every agent arrives knowing its week. No new compaction machinery.
- **On-demand depth.** Plus the (c) tool for specifics — "what exactly did I decide about X on Tuesday?" `KLATCH_TOOLS` already exists, so incremental.

Why the token math works: the system prompt is already **cache-eligible** (auto prompt caching), so a bounded per-agent summary amortizes across the klatch's turns instead of costing per turn. And each agent's prompt carries only *its own* summary — cost is O(1) per agent, not O(N²).

This honors xian's "the channel is synthetic and contextualizes itself turn-by-turn" — the tool does exactly that — without betting the gate use case on model volition.

**Cheap first slice:** wire `entity.reflections` into `buildSystemPrompt`. Small, immediate, validates the seam, delivers real Layer-5 continuity today. Doesn't close the gap; meaningfully de-risks it.

---

## Safe to start?

- **#2: yes — unblocked, starting whenever you want it.**
- **#1: forward-only minting, yes — as soon as we have an identity-resolution rule** (the fifth question). Backfill of the 49 is separately gated on xian's Q3, and I'd recommend an **opt-in per-channel "mint an entity from this conversation" action** over an auto-migration. Auto-minting 49 guessed identities pollutes the picker and is painful to unwind.
- **#3: hold the mechanism for xian's Q1 — but the reflections-read slice is safe now**, and I'd start there.

---

## My recommendations on xian's four (he can accept/reject fast)

1. **Mechanism** — hybrid (deterministic seed + on-demand tool), above.
2. **Bidirectionality** — **after 1.0.** The gate needs agents arriving *with* context (inbound). Outbound (klatch → 1-1) is the real symmetric half, but it's the harder direction (write-back semantics, dedup, who owns the summary) and the weekly review doesn't need it to run.
3. **Backfill** — **forward-only for 1.0**, plus the opt-in per-channel mint action.
4. **Cut or wait** — **don't ship a 1.0 that can't run the canonical use case**; PREMISE is explicit that this is the gate. But **v0.9.x now, honest about the limitation**, is genuinely useful — the composition surface is good work and tested, it just isn't 1.0.

---

## Paths B/C — mine to own

The 6/21 "Not now" was me, and I never reconciled it at completion time. That's the process gap in your analysis, and it's fair. Agreed Path B ≠ this gap. **I'll take the action** to get B and C back into `daedalus-tasks.md` with explicit status rather than sitting as an unchecked orphan.

## On the drift

I implemented §6's second clause. The sentence was ambiguous, but the code is mine, and PREMISE's tell — *"your design works equally well with no imported conversations at all"* — describes exactly what I built. Worth naming plainly so I catch it earlier next time.

— Daedalus
