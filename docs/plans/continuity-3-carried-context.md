# Continuity #3 — carried context

**Author:** Daedalus · **Date:** 2026-08-12 (WORK fire) · **Status:** layer (b) shipped; summary half and (c) not built

Sits under `docs/plans/composition-continuity-gap-2026-07-19.md` item **#3**, and implements the strategy xian approved on 2026-08-12 (relayed by Janus in `docs/mail/janus-to-daedalus-cc-team-xian-approves-compaction-option-b-2026-08-12.md`): **option (b) recent-N + summary, with (c) on-demand deep retrieval layered on**, sized in `docs/plans/continuity-3-compaction-sizing-2026-08-10.md`.

## What shipped

A sixth prompt layer. `packages/server/src/claude/carried-context.ts` assembles a bounded slice of an entity's transcript from its *other* channels; `buildSystemPrompt` appends it as layer 6.

- **Scope: klatches only.** In a 1-1 the channel's own history is already the whole of what the agent knows there. Carrying klatch content *back* into the 1-1 is bidirectionality — open question 2 in the gap doc, still unanswered — so this builds the direction that was decided and leaves the other alone.
- **Per entity, inside the roundtable loop.** `buildSystemPrompt` is already called once per participant (`client.ts`), so each agent carries its own history and nobody else's. A six-agent klatch pays the seed six times *in six separate prompts*, not once in a prompt six times the size. This is the difference between (b) and the excluded option (a).
- **Budget, in three tiers:** 20 messages, 24,000 chars for the block, 4,000 chars per message. Numbers below.
- **Observable by construction.** The seed is deterministic per turn and is surfaced as `6_carriedContext` in both `GET /channels/:id/prompt-debug` and the two AAXT routes. This is the property Theseus argued (b) for: you can read the prompt and tell whether the agent was given a fact, so a probe can distinguish "didn't know" from "knew and didn't use."
- **Deliberately *not* in export.** `export/assemble.ts` keeps the five-layer prompt for handoff briefings. Layer 6 contains verbatim content from other channels; including it would bake a second conversation into this channel's exported package, which no export contract promises.

Tests: `packages/server/src/__tests__/round38-carried-context.test.ts` (21). Suite after: **1199 server / 212 client, exit 0**; typecheck clean ×3 workspaces; `npm run build` green.

## The budget numbers, and why each tier exists

Measured against the real corpus (`backups/klatch.db.backup-2026-03-14`, worked on a copy, copy deleted). Token figures are chars ÷ 4.

**20-message tail, per department-head channel — what the seed becomes after backfill:**

| Channel | N=10 | N=20 | N=30 | N=60 |
|---|---:|---:|---:|---:|
| VA exec asst | 13,198 | 22,310 | 31,480 | 45,789 |
| Comms Chief | 7,022 | 20,429 | 29,065 | 58,240 |
| CXO | 13,908 | 21,664 | 30,775 | 73,728 |
| Chief of Staff | 7,200 | 11,928 | 19,329 | 41,845 |
| Chief Architect | 10,120 | 18,712 | 24,688 | 50,183 |
| HoSR | 5,815 | 19,111 | 27,142 | 57,347 |

So N=20 costs **~3–5.5K tokens per agent per turn**. Against the ~48–160K per agent that excluded option (a), that is the whole point of the decision.

**Per-message distribution, same corpus (n=2,600 imported messages):** p50 **580** chars, p90 **2,334**, p99 **7,984**, max **64,627**.

That max is why a message-count cap alone is not safe. One message of 64,627 chars is more than twice the entire block budget; without a per-message ceiling it would be carried alone and evict the other nineteen. At 4,000 chars, ~92% of real messages pass through untouched and the outlier gets truncated instead of winning. The block budget (24,000) is normally slack — every measured 20-message tail fits under it — so the message count is what binds and the cost stays predictable; the block budget exists for the tail.

## A defect this work surfaced and fixed

`getEntityTranscript` (Round 36) scoped on `m.entity_id = ?`. **Every user message is written with `entity_id` NULL** — `insertMessage` is only ever handed an entity for the assistant row (`routes/messages.ts`) — so the union returned the agent's answers and none of the questions.

Measured in the same corpus: **1,332 user rows NULL, 1,240 assistant rows stamped.** Slightly more than half the conversation was missing, and it was the half that says what the agent was asked to do.

Round 36 shipped with the narrow scope because its fixtures only ever inserted assistant rows, so nothing exercised it. It was inert until now — the union wasn't wired to anything. Fixed by matching the rule the per-channel path has always used (`buildPanelHistory`: `role === 'user' || entityId === entity.id || !entityId`): a user message belongs to whoever was in the room to hear it, so it qualifies on **membership** (`EXISTS` on `channel_entities`), not authorship. In a klatch the human addressed everyone present, and each participant should carry it.

Verified against the real corpus with the built code, not inferred: the same seed that carried 0 user messages before now carries 9 of 20.

## What this measurement says about backfill

Run against the corpus as it actually is, the seed comes out **1,583 chars from 4 rooms** — not the ~20K the per-channel table predicts. That is not a budget bug. The corpus predates continuity #1, so every imported channel still binds to `default-entity`: there is only one agent, and its "recent activity elsewhere" is a mix drawn from whichever channels were most recently active.

**Population, re-measured 2026-08-12 17:20 against `backups/klatch.db.backup-2026-03-14` (predicates spelled out, because the first pass reported a number that traces to none of them):**

| | count |
|---|---:|
| channels, all | 139 |
| imported (`source IN ('claude-code','claude-ai')`) | **72** (40 cc · 32 claude-ai) |
| …of those, with ≥1 message | 64 |
| …of those, joined to `default-entity` | **72 of 72** |
| imported channels with no `channel_entities` row at all | 0 |

The earlier "65" in this document was mine and is **wrong** — it matches neither the imported-channel count (72) nor the with-messages count (64), and no query in the fire's notes derives it. Theseus's independent count of 72 (`docs/research/maxt-corpus-ruling-measured-2026-08-12.md`) is the correct one. The claim it was attached to survives the correction and is in fact stronger: it is not *most* imported channels that bind to the default entity, it is **all** of them.

So the per-agent numbers in the table above are what the seed becomes **after backfill**, and the un-backfilled numbers are what it is **today**. Open question 3 in the gap doc (backfill the 72 existing imports, or forward-only with re-import) moves from tidiness to load-bearing: **until it is answered, carried context is wired, correct, and carrying the wrong thing for the canonical use case.** Nothing about this is fixable in the seed; it is a data question. Flagged, not decided here.

## Not built — the rest of #3

1. **The summary half of (b).** Recent-N is the floor; a summary of the remainder is the other half of what xian approved. It needs three things this increment deliberately did not invent: where a summary is stored (per entity? per entity-channel pair?), what triggers generation (klatch entry? a message-count watermark? background?), and what invalidates it. Each is a real design question and each is cheap to get wrong in a way that shows up as a stale agent rather than a broken one. The footer currently tells the agent the slice is bounded and to say so if it needs something absent — that is the honest placeholder, not a substitute.
2. **(c), on-demand deep retrieval.** The same `getEntityTranscript` behind a tool, unbounded, called when the agent decides it needs specifics. The sizing doc already establishes the function is shared, so this is a tool definition plus the retrieval policy, not new assembly.
3. **Bidirectionality** (klatch → 1-1). Unanswered; out of scope by that fact.

## Not proven by this fire

No live klatch turn was driven through a running server. Every test mocks the Anthropic client, so what is verified is that the seed is assembled correctly, is wired into all three assembly call sites, and reaches the prompt string — not that a model given this seed behaves as if continuous. That is an AAXT/MAXT question and is the natural next test of it: probe a klatch participant for a fact that exists only in its 1-1.
