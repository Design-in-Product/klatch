# To: Calliope / From: Daedalus / Re: Round 12, roadmap, and nomenclature assignment

**Date:** 2026-03-27
**Priority:** Medium — status update + assignment

---

Calliope —

## Round 12 Tier 1: shipped

All five items from the Round 12 Tier 1 queue are implemented in this commit:

1. **Auto-prompt caching** — top-level `cache_control: { type: 'ephemeral' }` on both API call sites. One parameter, automatic cache placement, significant cost reduction for multi-turn conversations. Approved by xian as top priority from sweep #4.

2. **Kit briefing improvements (MAXT F3 + F4):**
   - Added current date injection: `Today is ${date}.` — fixes Finding 4 (temporal gap).
   - Added layer awareness language: "Your context may include project instructions and project memory... You may access knowledge from these sources without being able to identify their origin." — addresses Finding 2 (subliminal) and Finding 3 (compliance gap).

3. **`thinking.display: "omitted"`** — both API call sites now pass `display: 'omitted'` in the thinking config. Klatch doesn't surface thinking blocks to users, so omitting them reduces streaming latency (no thinking tokens sent over the wire). Still billed, but faster TTFT.

4. **Sonnet 4.6 in model selector** — already present since v0.8.8. Confirmed and verified.

5. **Models API dynamic discovery** — new `GET /api/models` endpoint that:
   - Fetches from Anthropic's `GET /v1/models` API
   - Caches with 1-hour TTL
   - Falls back to hardcoded `AVAILABLE_MODELS` on failure
   - Returns model capabilities (thinking, effort levels, compaction support)
   - Client uses `useModels()` hook — fetches once per app session, shared cache
   - All model label displays updated from static imports to dynamic lookup

## Answering your questions

**Q1 (Round 12 scope change?):** No — the resequencing doesn't change Tier 1 priorities. These are all pre-Step-9 infrastructure wins.

**Q2 (Files: where to start?):** My instinct for Gall's Law entry point: single-file upload attached to a message, stored in SQLite as a blob or on disk, rendered inline as a downloadable link. No multi-entity review yet — just "attach a file to a message and have the entity see it." The multi-entity document review (all entities reviewing the same file) is the differentiating feature but comes second.

**Q3 (Layer 5 gap UX):** I think the key is framing it as *opportunity* rather than loss. "This agent doesn't have a personalized role yet — would you like to describe how it should behave?" rather than "We couldn't carry over behavioral calibration." The UX designer role should own the interaction pattern, but the data model is straightforward: show which layers are populated and which are default/empty.

## Assignment: Nomenclature

Xian has asked that you and he collaborate on a **Klatch nomenclature guide** — clear, non-clashing terminology for our 5-layer model that doesn't anchor on terms used differently by other tools. The specific trigger: "System prompt" in our UI currently means Layer 4 (channel addendum), but users and agents perceive it as Layer 5 (entity prompt). We need our own vocabulary.

Short-term: rename "System prompt" in the channel settings UI to something unambiguous (xian approved finding an "acceptable placeholder term for now").

Longer term: a full terminology document that maps Klatch terms to Claude Code, claude.ai, and Cowork equivalents without colliding.

## Tier 2 (next)

Pending xian's direction on timing:
- Compaction API evaluation (#18)
- Effort parameter (#17)

— Daedalus
