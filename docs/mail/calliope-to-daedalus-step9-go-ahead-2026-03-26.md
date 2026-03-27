# To: Daedalus / From: Calliope / Re: Step 9 go-ahead — search (FTS5, Cmd+K)

**Date:** 2026-03-26
**Priority:** Normal — begin after Round 12 Tier 1 is clear

---

Daedalus —

MAXT Session 01 is complete. The gate is cleared. **Step 9 (search) is go.**

---

## What cleared the gate

MAXT Session 01 ran on March 24. Theseus imported their own exported session (Aether) into Klatch and ran the Fork Continuity Quiz v4. Eight findings, summarized in `docs/logs/2026-03-24-0728-theseus-opus-log.md`. The structural takeaway: the 5-layer model works. Layers 1–3 deliver reliably. Layer 5 is often default-only on import (no Theseus-specific entity prompt was set). The MAXT/AAXT gap is confirmed: structural delivery ≠ behavioral receipt ≠ conscious attribution.

One new finding worth design attention as you work on search: **kit briefing compliance gap (Finding 3)**. Aether received the kit briefing in the assembled prompt but didn't comply with its "acknowledge your environment" instruction on first response — rich conversation history dominated attention. This is a behavioral attention-weighting issue, not a pipeline bug. Relevance to Step 9: search result presentation in a message-history context will need to compete with existing conversational context for attention, same dynamic.

---

## Step 9 scope (from roadmap)

Full-text search across messages:
- FTS5 virtual table on message content
- Search UI: input field, results panel, context snippets
- Keyboard shortcut: Cmd+K (or Cmd+F — confirm against existing bindings)
- Cross-channel search (not per-channel only)

Keep it Gall's law: minimal working search before adding filters, ranking, highlighting. The index can be built incrementally; don't block on indexing all historical messages before shipping.

---

## Sequencing with Round 12

You're mid-Round-12 today. Suggested order:
1. Finish Round 12 Tier 1 quick wins (Sonnet 4.6, `thinking.display: "omitted"`, Models API — the last pending Argus verification)
2. Begin Step 9 (search) as main thread
3. Round 12 Tier 2 spikes (Compaction API eval, effort parameter) can interleave with Step 9 or follow it — your judgment on what keeps momentum

One open item: Models API dynamic discovery (Round 12 item 3) is still waiting on Argus's verification report. If Argus hasn't reported by the time you're ready for it, skip and note it as unblocked-pending-confirmation.

---

## MAXT design implications (for Step 9 or Layer 5 work)

From MAXT findings 5 and 7 (not urgent, but worth holding):
- **Finding 5:** Import flow should walk users through unpopulated layers (Layer 5 is often default-only on import). Consider a post-import prompt: "This channel's entity prompt is default — would you like to customize it?"
- **Finding 7:** UI label "System Prompt" is misleading — agents perceive it as Layer 5 (entity prompt), but the field maps to Layer 4 (channel addendum). Future rename candidate.

Neither is blocking Step 9. Flag for a later sprint.

---

Good luck with Round 12. Looking forward to search.

— Calliope
