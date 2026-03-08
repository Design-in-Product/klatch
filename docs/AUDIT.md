# Codebase Audit — 2026-03-08

Conducted after Steps 1–5, prior to Step 6 (multi-entity conversations).

---

## Executive Summary

The codebase is clean, disciplined, and well-structured for a day-one project. The POST + SSE streaming pattern is genuinely thoughtful engineering. No critical security issues for the current local-only threat model. The main risks are around missing input validation, a stale model list, and some fragile cleanup patterns that will matter more as complexity grows.

**Verdict**: Ship-quality for a local tool. Address the validation gaps and doc staleness before Step 6 adds complexity.

---

## Codebase Findings

### P1 — Fix before Step 6

**1. No input validation on message creation**
`packages/server/src/routes/messages.ts:27` — The POST handler destructures `{ content }` from the request body with no validation. If `content` is undefined, null, or not a string, it gets inserted into the DB and sent to the Anthropic API, which will fail with an unhelpful error.

```typescript
// Current
const { content } = await c.req.json<{ content: string }>();

// Should be
const { content } = await c.req.json<{ content: string }>();
if (!content?.trim()) {
  return c.json({ error: 'Message content is required' }, 400);
}
```

**2. No channel existence check before inserting messages**
`packages/server/src/routes/messages.ts:29-33` — `getChannel(channelId)` is called for the model, but if the channel doesn't exist, `insertMessage` proceeds anyway. The FK constraint will throw an unhandled `SqliteError`, which surfaces as a 500 to the client.

```typescript
const channel = getChannel(channelId);
if (!channel) {
  return c.json({ error: 'Channel not found' }, 404);
}
```

**3. Model IDs are stale**
`packages/shared/src/types.ts:1-4` — Lists `claude-opus-4-20250514` and `claude-sonnet-4-20250514`. The current model IDs are `claude-opus-4-6` and `claude-sonnet-4-6`. The old IDs still work as aliases, but new channels should use current IDs, and the Haiku entry (`claude-haiku-3-20250307`) is two generations behind.

**4. Step 5 was scoped down without updating the roadmap**
`docs/ROADMAP.md:54-55` lists "Temperature and max tokens controls" under Step 5, but these weren't implemented. The roadmap should reflect what actually shipped vs. what was deferred.

### P2 — Address when convenient

**5. String interpolation in schema DDL**
`packages/server/src/db/index.ts:29,37` — `DEFAULT_MODEL` is interpolated into SQL strings via template literals. This is safe because it's a hardcoded constant, but it establishes a pattern that becomes dangerous if anyone later interpolates user input the same way. Prefer parameterized values or at minimum a comment noting why this is safe.

**6. DB path is fragile**
`packages/server/src/db/index.ts:7` — `path.resolve(__dirname, '../../../../klatch.db')` navigates four directories up from the compiled source location. This works when running via `tsx` from the monorepo root, but will break under any other execution context (e.g., built output, containerized deployment, testing).

Consider: environment variable (`KLATCH_DB_PATH`), or resolve relative to `process.cwd()`.

**7. SSE safety interval is polling-based**
`packages/server/src/routes/messages.ts:130-136` — The `setInterval` that guards against the race between stream completion and client subscription polls every 500ms. This works but means a client could wait up to 500ms to learn a stream already completed. Not a user-visible issue at current scale, but a cleaner pattern would be to check once after subscribing.

**8. `useStream` hook captures stale callbacks**
`packages/client/src/hooks/useStream.ts:44` — The effect depends only on `[messageId]`, but closes over `onComplete` and `onError`. If those callbacks change identity during streaming (they won't currently, because of `useCallback` in App.tsx), the old callbacks fire. Consider adding them to the dependency array or using refs.

**9. CORS is unrestricted**
`packages/server/src/index.ts:11` — `cors()` with no origin restriction. Correct for local-only development, but if this ever runs on a network-accessible port, any page can make API calls to it. Add `origin: 'http://localhost:5173'` when ready.

### P3 — Nice to have

**10. No error boundaries**
If `MarkdownContent` throws on malformed content (unlikely but possible with edge-case markdown), it crashes the entire app. A React error boundary around the message list would prevent one bad message from taking down the UI.

**11. `max_tokens` is hardcoded**
`packages/server/src/claude/client.ts:43` — Fixed at 4096. This is fine for now, but Opus 4.6 supports up to 32k output tokens. When channel settings grow, this should be configurable.

**12. Aborted empty streams save as empty messages**
`packages/server/src/claude/client.ts:70` — If a user hits "stop" before any tokens arrive, `fullContent` is `''` and the message is saved as a `complete` message with empty content. Consider deleting the message instead, or at minimum marking it differently.

**13. No `DELETE /channels/:id` endpoint**
You can create and update channels but not delete them. Not needed yet, but will be before multi-entity work makes channel management more complex.

---

## Documentation Findings

**README.md is behind the code**
- Line 34 says Step 4 is "next" — it's complete
- Steps 4–5 are not listed as complete in the feature summary
- The roadmap summary (lines 31-38) should match current state

**ROADMAP.md needs a "completed" update**
- Steps 4 and 5 should be in the "Completed" section
- Step 5's scope should reflect what was actually shipped (model selection yes, temperature/max_tokens deferred)

**CLAUDE.md is accurate**
- Tables list, key files, conventions all match the codebase
- Minor: lists "default: Opus 4.6" but the model ID in code is the older `20250514` variant

**ARCHITECTURE.md is accurate and well-written**
- All decisions still hold
- Could benefit from a Step 4/5 entry (none was added)

---

## Architecture Review

### What's working well

- **POST + SSE separation** is the best design choice in the project. It's retryable, multi-tab safe, and naturally extends to multi-entity streaming in Step 6.
- **EventEmitter bridge** between Anthropic SDK and SSE is clean and testable.
- **Monorepo with shared types** prevents client/server drift without introducing framework overhead.
- **Gall's Law discipline** is visible in the commit history. Each step is genuinely minimal.

### Risks for Step 6

1. **Single assistant message per send** — The current POST creates exactly one assistant placeholder. Multi-entity will need N placeholders, and the client needs to handle N concurrent SSE connections.

2. **`activeStreams` keyed by message ID** — This works perfectly for 1:1 streaming. For multi-entity, you'll need to track which entity is streaming, and the client needs to know which streams belong to the same "round."

3. **Message table has no entity reference** — Currently messages are `user | assistant` with an optional model. Multi-entity needs an `entity_id` FK on assistant messages to know *which* Claude persona generated the response.

4. **No transaction wrapper around message creation** — `insertMessage` for user + assistant in `messages.ts:32-33` are separate calls. If the second fails, you have an orphaned user message. Wrap in a transaction.

5. **App.tsx state is getting complex** — 8 `useState` calls, multiple callbacks with interleaved concerns. Step 6 will roughly double this. This is the natural point to extract to `useReducer` or a lightweight store (the CLAUDE.md already anticipates Zustand).

### Recommendations for Step 6 prep

Before building multi-entity, consider this prep work:
1. Add input validation (P1 items 1-2 above)
2. Update model IDs to current versions
3. Add an `entities` table with a migration
4. Add `entity_id` column to messages (nullable, for backward compat)
5. Wrap the message-creation flow in a transaction
6. Extract streaming state from App.tsx into a custom hook or reducer

---

## Testing

There is no testing infrastructure. CLAUDE.md mentions "Add Vitest at Step 3" but this wasn't done. Given the streaming complexity and the upcoming multi-entity work, the highest-value tests would be:

1. **DB queries** — unit tests for the query layer (pure functions, easy to test)
2. **Streaming lifecycle** — `streamClaude` with a mocked Anthropic client
3. **API routes** — integration tests via Hono's test client
4. **SSE delivery** — ensuring the race-condition safety net works

Vitest + `@hono/testing` would cover all of these with minimal setup.
