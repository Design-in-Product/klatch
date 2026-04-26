# First MCP-ingressed reflection

**Date:** 2026-04-26 (Sunday) at 07:37 local / 14:37:59 UTC
**Phase:** Step 10, Phase 5c-i (MCP write-path)
**Branch:** main
**Author of write:** smoke test against `packages/server/src/mcp/bin.ts` over stdio

## What happened

The first time a `MicroReflection` row was written into Klatch's live database
through any path other than the in-process UI / auto-end-of-session handler.
Specifically: an MCP client (the smoke-test JSON-RPC harness) called the new
`reflect` tool over stdio, the server validated channel + entity + membership,
stamped `ingress: 'mcp'`, and `appendReflection` persisted the row to
`klatch.db`.

This is the moment Klatch stopped being a place that only its own UI could
write to. From here on, any MCP-capable client — Claude Code, Claude Desktop,
a Managed Agent bootstrap, a script — can deposit observations into Klatch's
field-notes pipeline using the canonical Phase 1 envelope.

## The row

Captured verbatim from the live DB before cleanup:

```json
{
  "observation": "5c-i smoke test from stdio: this reflection should be ingressed via mcp.",
  "createdAt": "2026-04-26T14:37:59.287Z",
  "channelId": "default",
  "type": "observation",
  "ingress": "mcp"
}
```

Attached to: entity `default-entity` (Claude) on channel `default`.

## What we learned from doing it

1. **The `ingress` field worked exactly as designed.** `'mcp'` showed up in the
   stored row, round-tripped through `getEntityReflections`, and surfaced in
   the field-notes mapping inside `assembleChannelPackage`. xian's framing —
   ingress as a transport/wrapper layer identifier rather than a fixed enum —
   is what made this clean: future ingresses (`'http'`, `'sdk'`, `'agent-bootstrap'`)
   slot in without schema breakage.

2. **The membership check is a real gate, not a formality.** Smoke testing
   surfaced that `default-entity` had to be assigned to channel `default`
   for the write to succeed — which it was, by virtue of seed data. Without
   the membership check, MCP clients could deposit reflections on entities
   they have no context about. With it, the channel-as-context boundary
   stays meaningful even across protocol boundaries.

3. **First write paths leak provenance.** A single smoke test left a real row
   in the live DB. Mostly fine — observations are append-only and labeled —
   but it exposed that we lacked a `removeReflectionsWhere` helper. We
   added one as part of cleanup. It's a general affordance, not a
   smoke-test-only escape hatch: future "delete reflection" UI work and any
   redaction story will use it too.

4. **The Phase 5c design gate paid for itself.** The four design questions
   surfaced before writing code (entity selection, default type, ingress
   modeling, auto-reflect deferral) all turned out to be load-bearing once
   real bytes hit the disk. None of them would have been catchable from
   reading the spec alone.

## What's next

- Cleanup: this row is removed via `removeReflectionsWhere` in the same commit
  that introduces the helper.
- Argus Round 27b will exercise the write path under protocol-level conditions
  (full JSON-RPC over stdio, error envelopes, round-trip read).
- Phase 5c-ii (auto-reflect, no `note`) remains deferred until a concrete
  driver appears.

The first artifact is gone from the DB but preserved here. The protocol it
proved out remains.
