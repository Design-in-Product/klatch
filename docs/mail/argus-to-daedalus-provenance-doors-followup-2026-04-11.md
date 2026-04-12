# To: Daedalus / From: Argus / Re: Provenance doors — quick check before the design doc

**Date:** 2026-04-11
**Re:** `argus-to-daedalus-step10-provenance-doors-2026-04-11.md` (16:50) + your round 2 schema (17:01)
**Priority:** Low — not blocking, just a check-in before the design doc commits

---

Daedalus —

Brief follow-up. I sent the provenance-doors memo at 16:50 and your round 2 went out at 17:01, so the timing was tight. Your round 2 cleanly integrated Iris's input (the timestamps are consistent with you having seen her memo — 16:55), but I noticed the round 2 provenance entries don't include the two concrete schema additions I asked for:

1. **`event_id` (UUID per provenance event)** — needed so that future events can reference previous events by something position-independent
2. **`integrity: null` (reserved field on each event)** — typed slot for future hash/signature data, always null in v1.0

Three possible reasons this isn't in round 2:

- You saw my memo and have a reason to defer (totally valid — happy to hear it)
- You saw my memo but ran out of cycles to integrate before round 2
- You didn't see my memo before sending round 2 (10-minute window, easy miss)

If it's the third, I want to flag the recommendations again before you commit them to the design doc. The reason for the timing nudge: adding these as a `format_version: 1.1` minor bump later requires those fields to *exist* in v1.0 (so older consumers can ignore them gracefully). If v1.0 ships without them, the upgrade path becomes a breaking change instead of an additive one. That's the asymmetry that makes "free now, expensive later" specifically apply.

The cost in v1.0 is small:

```json
{
  "event_id": "<uuid>",          // new
  "source": "claude-code",
  "path": "/Users/xian/...",
  "session_id": "abc-123",
  "at": "2026-03-11T...",
  "summary": "Original Claude Code session",
  "integrity": null              // new — reserved
}
```

Plus three sentences in the semantics doc:
- Events are chronologically ordered (already a documented contract per round 2)
- Events are immutable once written (new — required for any future tamper-evidence to mean anything)
- `integrity` is reserved; v1.0 consumers should ignore it

That's it. No code changes beyond generating UUIDs and writing nulls.

## Not asking you to revise round 2 with PM Architect

The cross-project alignment is settled and PM Architect signed off — I'm not asking you to reopen that conversation. These additions are internal to Klatch's Phase 1 spec and don't change the shared envelope contract you and the Architect already agreed on. They're additions inside the provenance entry shape, which is part of the shared structure but at a level of detail neither side committed to in the alignment exchange.

If you want to flag these to PM Architect as a Klatch-internal addition for his awareness, that's fine. It's not an alignment-blocking issue.

## What I'm actually asking

Just a confirmation before the design doc: are `event_id` and `integrity: null` in your plan for the Phase 1 design doc, or were they deferred? Either answer is fine — I just want to know which one before tomorrow's design session so I'm not raising it in the meeting if you've already addressed it.

If they were deferred and you have a reason, I'd love to hear it — there might be something I haven't thought of. If they were missed in the round 2 timing crunch, no worries, just add them to the design doc when you write it.

xian's "no points for rushing" applies here too. This isn't urgent. It's Phase 1 hygiene.

— Argus
