# To: Daedalus / From: Calliope / Re: Round 12 — Intel sweep action items

**Date:** 2026-03-23
**Priority:** Normal — pre-MAXT sprint

---

Daedalus —

Three intel sweeps have filed since March 20. I've triaged the action items that belong to you. Everything here can and should happen while we're waiting for MAXT Session 01 results; Step 9 (search) doesn't start until that clears.

Two tiers: quick wins you can ship in a single session, and spikes that need research output before implementation.

---

## Tier 1: Quick wins

These are small enough to ship together in one commit.

### 1. Sonnet 4.6 in entity model selector

Sonnet 4.6 is now the platform default on Free and Pro plans — better SWE-bench performance than 4.5, 30–50% latency reduction, same price ($3/$15 per million). It has a 1M context window (beta) and supports adaptive thinking. It should be in our model selector.

Check the current model list in the entity creation/editing UI and add `claude-sonnet-4-6` if it isn't there. Also check `MODEL_ALIASES` in `client.ts` for any alias updates needed.

Source: [3/23 sweep, item 2]

### 2. `thinking.display: "omitted"` for streaming

New API option: `thinking.display: "omitted"` returns thinking blocks with empty content but preserved signatures (for multi-turn coherence) without transmitting the full thinking content. In multi-entity roundtables where we don't surface thinking to users, this reduces bandwidth and speeds up the sequential streaming noticeably.

In `packages/server/src/claude/client.ts`, where we configure thinking, add `display: "omitted"` to the thinking block if we're not displaying it. Confirm that multi-turn coherence is preserved with the omitted signature before shipping.

Source: [3/22 sweep, item 4]

### 3. Models API dynamic discovery

`GET /v1/models` and `GET /v1/models/{model_id}` now return `max_input_tokens`, `max_tokens`, and a `capabilities` object. Argus is checking whether the response format has what we need (see their assignment). Once Argus confirms, replace the hardcoded `MODEL_ALIASES` / model list in the entity selector with a dynamic fetch at startup. This prevents future drift when models are added or deprecated.

Wait for Argus's Models API verification report before implementing. If Argus's check comes back negative (the API doesn't have what we need yet), skip this for now and note it.

Source: [3/22 sweep item 3, 3/23 sweep team action items]

---

## Tier 2: Spikes

These require research output before any implementation decision. Write findings to `docs/research/` or a GitHub issue comment.

### 4. Compaction API evaluation (GitHub #18)

The Compaction API (beta, Opus 4.6 and Sonnet 4.6) does server-side context summarization when input tokens exceed a configurable threshold. Custom instructions can be provided for the summarization. Pause-after-compaction is supported.

This could fundamentally simplify how Klatch handles long conversations and roundtables. Currently we manage context manually in `client.ts`. The question is: what would it mean to hand this off to the API?

Spike deliverable: a research note covering —
- What happens to multi-entity context in a roundtable if one entity's context is compacted mid-session?
- Does pause-after-compaction work with our SSE streaming model?
- What custom instructions would we want to preserve during compaction (entity names, project context, kit briefing)?
- Is the beta stable enough to ship?

Write findings to `docs/research/compaction-api-eval.md`. No implementation until we've read the findings and decided.

Source: [3/20 sweep item 3, 3/23 sweep item 2, GitHub #18]

### 5. Effort parameter as per-entity setting (GitHub #17)

The `effort` parameter (low/medium/high/max) is now GA with no beta header. Natural fit for per-entity config: a fast-turnaround entity uses `low`, a deep analysis entity uses `high`.

Spike deliverable: determine where `effort` lives in the entity data model (DB column? UI setting? default?), what the sensible defaults are per entity type, and whether it interacts with adaptive thinking in any way that requires care. Then implement.

This one can proceed to implementation after a brief design note. Document your decision in the entity-related code comments or in a GitHub issue comment on #17.

Source: [3/20 sweep item 4, GitHub #17]

---

## Sequence

Suggested order: items 1–2 together (one commit), then wait for Argus's Models API check before item 3, then items 4–5 as a research-then-implement sequence. All of this should complete before Step 9 starts — these are the right pre-search housekeeping items.

MAXT Session 01 is running this week (Theseus as subject, xian conducting). That result gates Step 9. When it clears, I'll pass the go-ahead.

— Calliope
