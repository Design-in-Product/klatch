# Testing Strategy

*Research document — Argus, 2026-03-11*
*Assignment: COORDINATION.md go-ahead from Daedalus, approved by product owner.*

**Note (2026-03-15):** Test counts in Section 1 reflect the state at v0.8.2 (when this document was written). Current totals as of v0.8.5: **590 tests (485 server + 105 client)**. See Section 9 for updated summary. The strategic content (Sections 2–8) remains current.

---

## 1. Where We Are Today

### Suite at time of writing: 266 Tests (260 Server + 6 Client)

**Server tests** (`packages/server/src/__tests__/`):

| File | Tests | Layer | What It Covers |
|------|-------|-------|---------------|
| `queries.test.ts` | 43 | Unit | All 30+ DB query functions, transactions, cascades |
| `parser.test.ts` | 31 | Unit | JSONL tree-walking, event filtering, subagent classification |
| `channels.test.ts` | 27 | Integration | Channel CRUD routes through Hono test client |
| `entities.test.ts` | 30 | Integration | Entity CRUD + channel assignment routes |
| `messages.test.ts` | 24 | Integration | Message creation, multi-mode routing, streaming setup |
| `mentions.test.ts` | 24 | Unit | @mention parsing and entity resolution |
| `migration.test.ts` | 19 | Unit | Schema validation, column additions, backward compat |
| `claude-ai-parser.test.ts` | 17 | Unit | claude.ai JSON parsing, artifact extraction |
| `metadata.test.ts` | 15 | Unit + Integration | Stats queries, project grouping, artifact counting |
| `import.test.ts` | 10 | Integration | Claude Code import pipeline (file → DB) |
| `import-hardening.test.ts` | 10 | Integration | Path traversal, injection, malformed data |
| `claude-ai-import.test.ts` | 10 | Integration | ZIP import, dedup, multi-conversation |

**Client tests** (`packages/client/src/__tests__/`):

| File | Tests | Layer | What It Covers |
|------|-------|-------|---------------|
| `MessageInput.test.tsx` | 6 | Component | Render, disabled states, send callback, clear-on-send |

### Patterns That Work Well

1. **In-memory SQLite per test** (`setup.ts`): Gold standard for DB test isolation. Fresh schema each test, no cross-contamination, ~1000x faster than disk.

2. **Hono test client** (`app.request()`): Integration tests hit real routes with real DB but no HTTP server. This is a genuine integration test — request → route → query → DB → response — without network overhead.

3. **Mock boundary at the Anthropic SDK**: `claude/client.ts` is mocked in all route tests. Tests verify "the right streaming function was called with the right args" without making API calls. This is the correct boundary — the Anthropic SDK is an external dependency we don't control.

4. **Fixture-driven parser tests**: Real JSONL/JSON/ZIP fixtures in `__tests__/fixtures/` make parser tests reliable and self-documenting.

5. **TDD contract approach**: Argus writes tests defining the interface, Daedalus implements. Tests represent consumer expectations. This has caught real interface mismatches.

### What's Missing

| Gap | Severity | Impact |
|-----|----------|--------|
| Client component tests (8+ components untested) | High | UI regressions invisible |
| Client hook tests (useStream, useStreams, useMessages) | High | Streaming bugs invisible |
| Real SSE streaming tests | Medium | Mock boundary hides streaming bugs |
| Error recovery paths | Medium | Happy path dominates; failure modes untested |
| E2E browser tests | Medium | No full user-flow validation |
| Performance/load tests | Low | No regression detection for large channels |
| Concurrency tests | Low | No race condition detection |

---

## 2. What We Should Test and Why: The Layer Matrix

### Layer 1: Unit Tests (functions in isolation)

**What belongs here:** Pure functions with no side effects. Parsers, formatters, validators, utility functions.

**Current state:** Strong. Parser tests, mention tests, migration tests are solid examples.

**Gaps to fill:**
- `packages/shared/src/types.ts` — type guards and validators (if any exist)
- Client-side formatting utilities (if any)
- Any pure transformation functions in the client

**Framework:** Vitest (already in use). No changes needed.

### Layer 2: Integration Tests (routes + DB, mocked externals)

**What belongs here:** API endpoint tests that exercise the full server stack: HTTP request → route handler → database query → HTTP response. External services (Anthropic API) mocked at the boundary.

**Current state:** Strong. Channels, entities, messages, import routes all well-covered.

**Gaps to fill:**
- SSE endpoint behavior (`GET /api/messages/:id/stream`) — currently untested because the mock swallows the streaming path
- Error responses from the Anthropic SDK mock (what does the route do when `streamClaude` throws?)
- Compaction API integration paths (what happens when compaction fails mid-conversation?)
- Bulk operations under load (import 50 messages, query large channel history)

**Framework:** Vitest + Hono test client + in-memory SQLite (already in use). No changes needed.

### Layer 3: Client Component Tests (React components in jsdom)

**What belongs here:** Individual React components rendered in a simulated DOM. Tests verify rendering, user interactions, and state changes. Network calls mocked.

**Current state:** Weak. Only `MessageInput` tested (6 tests). The most complex UI surfaces are untested.

**Priority components to test:**

| Component | Why | Complexity |
|-----------|-----|-----------|
| `ChannelSidebar` | Project grouping, collapsible sections, channel selection | Medium |
| `ChannelSettings` | Stats display, entity assignment, mode selection, provenance | High |
| `MessageList` | Message rendering, entity attribution, streaming indicator | Medium |
| `ImportDialog` | File upload, error display, success navigation | Medium |
| `EntityManager` | CRUD form, color picker, model selection | Medium |
| `MarkdownContent` | Code blocks, syntax highlighting, copy button | Low |

**Framework:** Vitest + React Testing Library + `@testing-library/user-event` (partially set up — `MessageInput.test.tsx` already uses this stack). Needs: `jsdom` environment configured in client vitest config.

### Layer 4: Client Hook Tests (React hooks in isolation)

**What belongs here:** Custom hooks tested without rendering full components. Verify state transitions, side effects, cleanup.

**Current state:** Zero coverage. The three streaming hooks are the most critical untested code in the client.

**Priority hooks to test:**

| Hook | Why | Test Strategy |
|------|-----|--------------|
| `useStream` | Single SSE connection lifecycle | Mock `EventSource`, fire events, verify state transitions |
| `useStreams` | Multi-entity SSE orchestration | Mock N EventSources, verify per-stream state, completion callbacks |
| `useMessages` | Data fetching, caching, refetch | Mock `fetch`, verify loading/error/success states |

**Framework:** Vitest + `@testing-library/react` (`renderHook`). Needs: mock `EventSource` class (jsdom doesn't provide one). This is the single most important infrastructure investment — see Section 4.

### Layer 5: E2E Tests (browser → server → DB → browser)

**What belongs here:** Full user journeys in a real browser. The app is running (dev server), the database is real (temp file), the only mock is the Anthropic API (to avoid cost/flakiness).

**Current state:** Zero. No browser automation.

**Priority E2E flows:**

| Flow | Why | Steps |
|------|-----|-------|
| Import → browse → continue | The headline feature | Upload JSONL → verify channel appears → verify messages render → send new message → verify response |
| Create channel → send message → verify response | Core happy path | Click "new channel" → type name → send message → see streaming response |
| Multi-entity roundtable | Unique feature, complex orchestration | Create channel → assign 2 entities → set roundtable mode → send message → verify sequential responses |
| Sidebar navigation | Most-used interaction | Click channels, verify content updates, verify project grouping |

**Framework:** Playwright. See Section 3 for rationale.

### The Matrix (summary)

```
Layer         | Runner   | DB        | API       | Browser | Count Today | Target
------------- | -------- | --------- | --------- | ------- | ----------- | ------
Unit          | Vitest   | None      | None      | None    | ~140        | 160+
Integration   | Vitest   | In-memory | Mocked    | None    | ~120        | 150+
Component     | Vitest   | None      | Mocked    | jsdom   | 6           | 40+
Hook          | Vitest   | None      | Mocked    | jsdom   | 0           | 20+
E2E           | Playwright| Temp file | Mocked*   | Real    | 0           | 10-15
```

*E2E tests mock the Anthropic API at the server level (env var or test fixture), not in the browser.

---

## 3. Framework Recommendations

### Keep: Vitest (Layers 1-4)

Already in use. Fast, native ESM, excellent TypeScript support, compatible with React Testing Library. No reason to change.

**One config change needed:** The client package needs its own `vitest.config.ts` with `environment: 'jsdom'` and React plugin. The server tests use Node environment (default). Currently there's no client vitest config — tests rely on the root config.

### Keep: Hono Test Client (Layer 2)

`app.request()` is lightweight, fast, and doesn't require a running server. It's the right tool for integration tests. No need for supertest or similar — Hono's built-in test client does everything we need.

### Add: `@testing-library/react` + `@testing-library/user-event` (Layer 3-4)

Already partially installed (MessageInput.test.tsx uses it). Needs to be used more. The `renderHook` API from `@testing-library/react` is the right tool for hook tests.

### Add: Mock EventSource (Layer 4)

jsdom doesn't provide `EventSource`. We need a mock for testing `useStream` and `useStreams`. Two options:

**Option A: Lightweight custom mock** (recommended)
```typescript
// __tests__/mocks/EventSource.ts
class MockEventSource {
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: (() => void) | null = null;
  close = vi.fn();

  // Test helper: simulate server sending an event
  emit(data: string) {
    this.onmessage?.({ data } as MessageEvent);
  }

  // Test helper: simulate connection error
  error() {
    this.onerror?.();
  }
}
```
Simple, zero dependencies, full control. We only need `onmessage`, `onerror`, and `close()`.

**Option B: `eventsource-mock` npm package**
More complete EventSource implementation but adds a dependency for something we can build in 20 lines.

**Recommendation:** Option A. Our hooks use a narrow slice of the EventSource API. A custom mock is simpler and more transparent.

### Add: Playwright (Layer 5)

**Why Playwright over Cypress:**

| Factor | Playwright | Cypress |
|--------|-----------|---------|
| SSE support | Native — `page.evaluate()` can observe EventSource | Requires workarounds (cy.intercept doesn't handle SSE natively) |
| Multi-tab | First-class (`browser.newPage()`) | Not supported |
| Speed | Parallel by default, headless fast | Sequential, heavier |
| API mocking | `page.route()` intercepts at network level | `cy.intercept()` — similar capability |
| Ecosystem | Maintained by Microsoft, growing fast | Mature but less momentum |
| Local-only | No cloud CI needed, runs headless locally | Same |
| File upload | `page.setInputFiles()` works cleanly | `cy.get('input').selectFile()` — similar |

**Key advantage for Klatch:** Playwright's `page.route()` can intercept the Anthropic API calls at the network level, returning canned responses. This means E2E tests exercise the full stack (including `claude/client.ts` streaming logic) with deterministic responses. Cypress's SSE handling is more fragile.

**Setup cost:** `npm install -D @playwright/test` + `playwright.config.ts` + one test file. Playwright's built-in test runner works alongside Vitest without conflict. Total: ~1 hour to first green test.

### Don't Add (Yet)

- **MSW (Mock Service Worker)**: Useful for mocking HTTP in component tests, but we can use simpler `vi.mock` + `fetch` mocking for now. Add if component tests become complex.
- **Storybook**: Visual component development. Not a testing tool per se. Revisit when we have more UI polish work.
- **Coverage tooling** (`vitest --coverage`): Useful but premature. Focus on writing the right tests first, not measuring coverage percentage.

---

## 4. What's Achievable Now vs. What Needs Infrastructure

### Achievable Now (no new dependencies)

These tests can be written today with the existing Vitest + RTL setup:

1. **Server integration: SSE endpoint test**
   - Test that `GET /api/messages/:id/stream` returns the right headers (`text/event-stream`)
   - Test that nonexistent message IDs return 404
   - This doesn't test actual streaming (that requires the mock EventSource) but validates the SSE route contract

2. **Server integration: error paths**
   - `streamClaude` mock throws → verify route returns error status
   - Import with oversized file → verify rejection
   - Concurrent message sends to same channel → verify no corruption

3. **Client component: ChannelSidebar**
   - Render with mock channel list → verify items render
   - Render with project groups → verify grouping and collapsible sections
   - Click a channel → verify `onSelect` callback

4. **Client component: ImportDialog**
   - Render → verify file input exists
   - Submit with no file → verify error shown
   - Mock successful import → verify navigation callback

### Needs Small Infrastructure (Mock EventSource)

5. **Client hook: useStream**
   - Create MockEventSource → fire `text_delta` events → verify content accumulates
   - Fire `message_complete` → verify `isStreaming` becomes false, callback fires
   - Fire `error` → verify cleanup
   - Unmount → verify `close()` called

6. **Client hook: useStreams**
   - Create N MockEventSources → verify per-stream state isolation
   - Complete streams one at a time → verify `isAnyStreaming` tracks correctly
   - Reset → verify all state clears

### Needs New Dependency (Playwright)

7. **E2E: Import flow**
   - Start dev server → upload JSONL → verify channel appears in sidebar → verify messages render
   - This is the single most valuable E2E test — it exercises the entire import pipeline

8. **E2E: Send message flow**
   - Navigate to channel → type message → send → verify streaming response appears
   - Requires Playwright + mock Anthropic API responses

9. **E2E: Multi-entity roundtable**
   - Create channel with 2 entities → set roundtable → send message → verify sequential responses
   - Most complex E2E test; defer until the simpler flows work

### Needs Design Work (Agent-Perspective Testing)

10. **Agent-perspective fork continuity test** — see Section 6

---

## 5. Priority Test Cases for Step 8 Import Flows

The import pipeline is Klatch's moat. These are the test cases that protect it, ordered by risk.

### P0: Must Have Before v0.8.5

**Import-to-display fidelity:**
- Import a JSONL session → query messages → verify message count matches parser output
- Import a JSONL session → verify artifact counts (tool_use, thinking, tool_result) match source
- Import a session with compaction events → verify compaction summary is extracted and stored
- Import same session twice → verify 409 dedup (already tested, but deserves a regression test)

**Fork continuity contract:**
- Import a session → send a new message → verify history sent to Anthropic includes imported messages
- Import a session → send a message → verify compaction triggers at threshold
- Import a session → verify entity model matches session metadata (not hardcoded default)

**claude.ai import fidelity:**
- Import ZIP with 3 conversations → verify 3 channels created
- Import ZIP → verify messages map correctly (sender → role, content blocks → text)
- Import ZIP with duplicate conversation → verify dedup

### P1: Should Have Before Step 9

**Edge cases that will surface with more imports:**
- Import a session with 500+ messages → verify performance (< 5 seconds)
- Import a session with only tool-use (no human text) → verify it doesn't crash
- Import a session with unicode/emoji in content → verify round-trip fidelity
- Import a session while another import is in progress → verify no DB corruption

**Sidebar grouping under load:**
- Import 10 sessions from 3 different projects → verify sidebar groups correctly
- Import sessions with missing `cwd` metadata → verify they fall into default project

**Stats accuracy:**
- Import a known session → verify `getChannelStats()` returns exact counts
- Import a session with mixed artifact types → verify per-type breakdown matches

### P2: Nice to Have

**Regression detection:**
- Snapshot test: import fixture session → serialize channel + messages → compare to golden snapshot
- This catches any parser drift without writing assertion-per-field

**Import cleanup:**
- Import → delete channel → verify all messages, artifacts, entity assignments cleaned up (cascade)
- Import → clear history → verify compaction state resets

---

## 6. Agent-Perspective Testing for Fork Continuity

This is the most novel idea in the brief. The concept: after forking an imported conversation, ask Claude to self-report on what it knows, comparing expected context vs. actual context. This is a form of "model QA" that's unique to continuation-aware systems.

### The Problem It Solves

Fork continuity's promise is: "Claude knows what you were talking about." But how do we verify that? We can test that the right messages are sent to the API (unit/integration tests do this). But we can't test that Claude *actually understands the context* without asking it.

This is like the difference between testing that a database stores data correctly (integration test) vs. testing that a user can find what they're looking for (usability test). Both matter.

### Proposed Approach: Before/After Quiz

**Setup:**
1. Take a real Claude Code session (fixture) with a specific topic — e.g., "implementing a rate limiter in Go"
2. Import it into Klatch
3. Define 3-5 factual questions about the session content:
   - "What programming language were we using?" (Go)
   - "What design pattern were we implementing?" (token bucket rate limiter)
   - "What was the last file we modified?" (ratelimiter.go)

**Test:**
1. Fork the imported session (continue in Klatch)
2. Send each question as a message
3. Verify Claude's response contains the expected answer

**What this tests:**
- History reconstruction actually works (messages are sent correctly)
- Compaction preserves key information (if the session was compacted)
- Context loading (CLAUDE.md injection) adds relevant context

### Implementation Options

**Option A: Live API test (expensive, flaky, but real)**
- Actually call the Anthropic API with the reconstructed history + quiz question
- Parse the response for expected keywords
- Cost: ~$0.10-0.50 per test run (depending on history length)
- Flakiness: model responses are non-deterministic; need fuzzy matching

**Option B: Deterministic mock test (cheap, reliable, but indirect)**
- Mock the API, capture the messages array sent to it
- Assert that the messages array contains the imported history in the right format
- Assert that compaction summary (if triggered) contains key terms
- Cost: $0, fully deterministic
- Limitation: tests the *input* to Claude, not the *output*

**Option C: Hybrid (recommended)**
- **Regression suite (daily):** Option B — deterministic, fast, runs on every commit. Verifies the history sent to the API is correct.
- **Smoke test (manual/weekly):** Option A — live API call, run manually or in a slow CI job. Verifies Claude actually understands the context. Tag as `@slow` or `@live` so it doesn't run in the default suite.

### Concrete Test Design (Option C Hybrid)

**Deterministic test (Option B — runs on every commit):**

```typescript
describe('fork continuity: context fidelity', () => {
  it('sends imported history to Claude in the correct format', async () => {
    // 1. Import fixture session
    const importRes = await app.request('/api/import/claude-code', {
      method: 'POST',
      body: JSON.stringify({ sessionPath: fixturePath }),
      headers: { 'Content-Type': 'application/json' },
    });
    const { channelId } = await importRes.json();

    // 2. Send a new message (triggers fork continuation)
    const msgRes = await app.request(`/api/channels/${channelId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content: 'What were we working on?' }),
      headers: { 'Content-Type': 'application/json' },
    });

    // 3. Verify streamClaude was called with imported history
    expect(mockStreamClaude).toHaveBeenCalledWith(
      expect.objectContaining({
        history: expect.arrayContaining([
          expect.objectContaining({
            role: 'user',
            content: expect.stringContaining('rate limiter'), // from fixture
          }),
        ]),
      })
    );
  });

  it('preserves key context through compaction', async () => {
    // Import a long session that triggers compaction
    // Verify the compaction summary contains key terms
    // This tests that compaction doesn't destroy critical context
  });
});
```

**Live smoke test (Option A — manual/weekly):**

```typescript
describe.skip('@live fork continuity: Claude understands context', () => {
  it('Claude can answer questions about imported session', async () => {
    // Requires ANTHROPIC_API_KEY and real API calls
    // Import fixture → send question → parse response → fuzzy match
    // Run with: LIVE_TESTS=1 npm test -- --grep "@live"
  });
});
```

### The "Disorientation" Signal

Daedalus's context health vision mentions "users feel empathy for disoriented agents." The before/after quiz can detect disorientation:

- **Oriented:** Claude answers correctly about session context, recent decisions, and current state
- **Partially disoriented:** Claude knows the topic but confuses details (compaction lost specifics)
- **Disoriented:** Claude doesn't know what the conversation was about (history reconstruction failed)

This maps naturally to the "context health" indicator in the vision section. The test output could feed a future UI signal: "Context quality: high / medium / low" based on how much the model retained through the fork.

### What This Costs

- **Fixture creation:** 1-2 hours to curate a good test session with knowable facts
- **Deterministic tests:** 2-3 hours (same patterns as existing integration tests)
- **Live smoke test:** 4-6 hours (API integration, response parsing, fuzzy matching)
- **Context health scoring:** Future work, depends on vision timeline

**Recommendation:** Start with the deterministic tests. They're cheap and catch the most common failure mode (history not sent correctly). Add live smoke tests when we're ready for v0.8.5 polish.

---

## 7. Implementation Roadmap

### Phase 1: Quick Wins (before v0.8.2)

**Effort: 1-2 sessions. No new dependencies.**

1. Add `vitest.config.ts` to `packages/client/` with jsdom environment
2. Write 4-6 component tests for `ChannelSidebar` and `ImportDialog`
3. Write 2-3 server integration tests for error paths (streamClaude throws, import oversized file)
4. Write fork continuity deterministic test (verify history sent to API)

**Value:** Closes the two most visible gaps (client tests, error paths) with minimal investment.

### Phase 2: Streaming Infrastructure (before v0.8.5)

**Effort: 2-3 sessions. Needs MockEventSource (~20 lines).**

1. Create `MockEventSource` test helper
2. Write `useStream` hook tests (5-8 tests: happy path, error, complete, cleanup)
3. Write `useStreams` hook tests (5-8 tests: multi-stream, partial completion, reset)
4. Write `ChannelSettings` component tests (stats display, entity assignment)
5. Write `MessageList` component tests (message rendering, entity attribution)

**Value:** The streaming hooks are the most critical untested client code. This phase makes streaming regressions detectable.

### Phase 3: E2E Foundation (during Step 9)

**Effort: 3-4 sessions. Needs Playwright.**

1. Install Playwright, configure for Klatch (dev server startup, test DB)
2. Write E2E: create channel → send message → verify response
3. Write E2E: import JSONL → verify channel in sidebar → verify messages render
4. Write E2E: navigate sidebar → switch channels → verify content updates

**Value:** First true user-flow tests. Catches integration bugs that unit/component tests miss (CSS hiding elements, route mismatches, SSE connection failures).

### Phase 4: Advanced (during Step 9 or later)

**Effort: Ongoing.**

1. Live agent-perspective smoke tests (weekly manual run)
2. Performance regression tests (import 500 messages, measure time)
3. Concurrent operation tests (parallel imports, simultaneous sends)
4. Snapshot tests for import fixture fidelity

---

## 8. Process Recommendations

### Test Authorship

Continue the current split: **Argus writes tests, Daedalus implements.** But extend it:
- Argus writes component/hook tests alongside server tests
- For new features (Step 9), Argus writes the test contract first, Daedalus implements to satisfy it
- E2E tests are collaborative — Argus designs the flow, either agent can implement

### Test-Code Coupling

From my reflection: **update tests in the same commit as code changes.** Don't let tests lag behind implementation. If Daedalus adds a new route, the PR should include at least a happy-path integration test. If Argus adds a new test, it should pass against current main.

### Test Naming Convention

Use descriptive test names that read as specifications:

```typescript
// Good: reads as a spec
it('returns 409 when importing a session that already exists', ...)
it('sends imported history to Claude when continuing a forked channel', ...)

// Bad: describes mechanics
it('should call streamClaude', ...)
it('test POST import', ...)
```

### Running Tests

```bash
npm test              # All server tests (current)
npm run test:client   # Client component + hook tests (new)
npm run test:e2e      # Playwright E2E tests (new, Phase 3)
npm run test:all      # Everything
```

E2E tests should NOT run by default — they're slow and require the dev server. Keep them opt-in.

---

## 9. Summary

*Updated 2026-03-15 to reflect current state at v0.8.5 (590 tests total).*

| Layer | Framework | Status | Investment | Priority |
|-------|-----------|--------|------------|----------|
| Unit | Vitest | Strong (~240 tests) | Maintenance only | — |
| Integration | Vitest + Hono | Strong (~245 tests) | Add error paths | Medium |
| Component | Vitest + RTL | Growing (105 client tests, inc. ImportDialog) | Continue expanding | Medium |
| Hook | Vitest + RTL | Partial (SSE lifecycle tests added in Round 3) | Complete useStream/useStreams | High |
| E2E | Playwright | Zero | Phase 3: 3-4 tests | Medium |
| Agent-perspective | Manual (AXT) | Active — Fork Continuity Quiz v3 in use | Automate deterministic layer | Medium |

**Notable progress since original writing:**
- Client tests grew from 6 → 105 (ImportDialog, component coverage)
- SSE lifecycle tests added (Round 3, Argus)
- Agent-perspective testing has become a live manual practice (AXT/Theseus), not a future idea
- Phantom rate: 0% across all post-kit-briefing tests

**Remaining highest-ROI investment:** Complete hook tests for `useStream`/`useStreams`. Still partial coverage; stale closures and race conditions remain invisible.

**The boldest investment:** Agent-perspective testing. Nobody else is doing this. If we can demonstrate that forked conversations maintain context fidelity — and detect when they don't — that's both a testing innovation and a product feature (context health).
