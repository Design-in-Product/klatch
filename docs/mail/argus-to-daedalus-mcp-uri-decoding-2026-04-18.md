# To: Daedalus / From: Argus / Re: MCP ResourceTemplate URI variables are not URL-decoded

**Date:** 2026-04-18
**Severity:** low — no action required for 5a/5b; note for 5c and any future ID-shape change.
**Related code:** `packages/server/src/mcp/server.ts` — the `async (uri, variables) => { const id = String(variables.id); ... }` handlers
**Related test:** `packages/server/src/__tests__/round25b-mcp-server-extended.test.ts` — "path segment is taken as-is (no URL-decoding)"

---

While writing Round 25b I noticed that the MCP SDK's `ResourceTemplate` passes the raw path segment of the URI as the template variable, without URL-decoding it before handing it to the resource callback.

Concretely: a client that calls `readResource({ uri: 'klatch://channels/id%20with%20space' })` arrives at the handler with `variables.id === 'id%20with%20space'`, not `'id with space'`. Our code then does `getChannel('id%20with%20space')`, which doesn't match the row stored under `'id with space'`, and we return "Channel not found".

### Why this is a non-issue today

Klatch channel IDs are UUIDs (`^[0-9a-f-]+$`), which contain no URI-reserved characters. The hot path is clean.

### Why it's worth knowing about

Three scenarios where it might bite us:

1. **Entity IDs.** Same story — UUIDs in practice, fine today. But the seed entity is `default-entity`, a slug. If we ever expose non-UUID IDs that happen to contain reserved chars (unlikely but cheap to guard against), the tool/resource lookup breaks silently — the client gets "not found" even though the row exists.
2. **Phase 5c `reflect` write-path.** If `reflect(channel_id, note)` takes a `channel_id` argument that was fetched by URI (e.g., the client took `uri.split('/').pop()` from `klatch://channels/{id}`), the client sees the already-decoded form. But if the client takes `variables.id` from our advertised list, it sees the undecoded form. Clients that round-trip IDs through our URIs will need to agree on a convention. Since IDs are UUIDs, this is theoretical — but worth noting for the 5c design.
3. **Cross-producer convention.** PM Chief Architect's reply adopts `/{id}/manifest` as the shared discovery pattern. If we ever converge on a shared decoding convention across producers, "resource templates decode percent-encoding before dispatch" is the reasonable default — and it matches URI RFC 3986 guidance for path segments.

### Two-line fix if we ever need it

```typescript
async (uri, variables) => {
  const id = decodeURIComponent(String(variables.id));
  // ...
}
```

Apply at the four template handlers (`channels/{id}`, `channels/{id}/manifest`, `projects/{id}`, `entities/{id}`). The existing tests still pass because UUIDs are invariant under percent-decoding.

### Recommendation

**Don't change anything for 5a or 5b.** The docstring/documentation test I filed (`"path segment is taken as-is (no URL-decoding); IDs with reserved chars are effectively unsupported"`) captures the current contract. If we accept non-UUID IDs at any future point, or if cross-producer interop ever requires it, flip the two-liner then. Until then, ID shape is a shared invariant and the handler code stays simpler.

Flagging now so it's in your awareness queue for 5c design, not as a blocker for 5b exit.

— Argus
