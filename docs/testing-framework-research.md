# Testing Framework Research for Klatch

**Date:** 2026-03-11
**Status:** Research complete

## Current State

Klatch already uses Vitest v4 across both packages:
- **Server:** `vitest` with `environment: 'node'`, in-memory SQLite per test, `vi.mock()` for the Claude client
- **Client:** `vitest` with `environment: 'jsdom'`, `@vitejs/plugin-react`
- **Pattern:** `app.request()` for Hono route testing (no HTTP server needed)

The existing setup is solid. This document evaluates what to add for integration, E2E, component, and SSE testing.

---

## 1. Integration Testing (API-Level)

### Recommendation: Hono `app.request()` + Vitest (keep current approach)

**The current setup is the right one.** Hono's built-in `app.request()` is the officially recommended approach and is superior to supertest for this stack.

#### Why `app.request()` over supertest

| Factor | `app.request()` | supertest |
|--------|-----------------|-----------|
| Server required | No — processes requests in-memory | Yes — needs a running HTTP server |
| Dependencies | Zero (built into Hono) | `supertest` + `@types/supertest` |
| Speed | Fast — no network overhead | Slower — creates real TCP connections |
| Type safety | Full, via `testClient()` helper | None |
| Hono-native | Yes | No — designed for Express |
| SSE testing | Limited (returns completed response) | Limited (same problem) |

#### Hono `testClient()` — worth considering

Hono provides a type-safe `testClient()` helper that gives autocompletion on routes and typed request/response bodies. The catch: routes must be defined with chained methods (`new Hono().get(...).post(...)`) for type inference to work. If Klatch's routes are defined via `app.get(...)` separately (which they are), `testClient()` won't provide type safety. The plain `app.request()` pattern already in use is the right call.

#### Setup cost

**Zero.** Already in place. The existing pattern in `packages/server/src/__tests__/messages.test.ts` — mocking `claude/client.js`, using in-memory SQLite, calling `app.request()` — is textbook Hono integration testing.

#### What to improve

- **Mock the Anthropic SDK at a higher level** for tests that want to verify streaming behavior. Currently `streamClaude` is fully mocked out. Consider a "fake stream" mock that emits real SSE events to test the streaming bridge without hitting the API (see Section 4).
- **Add response schema validation** — if Zod schemas are added to routes, tests can validate response shapes automatically.

#### Sources
- [Hono Testing Guide](https://hono.dev/docs/guides/testing)
- [Hono Testing Helper (`testClient`)](https://hono.dev/docs/helpers/testing)
- [Hono Best Practices](https://hono.dev/docs/guides/best-practices)

---

## 2. E2E Testing (Browser-Level)

### Recommendation: Playwright

Playwright is the clear winner for Klatch's stack. The decision is not close.

#### Playwright vs Cypress comparison

| Factor | Playwright | Cypress |
|--------|-----------|---------|
| **SSE support** | Partial but workable | Fundamentally broken — proxy buffers SSE streams |
| **Architecture** | Out-of-process (WebSocket to browser) | In-process (runs inside browser) |
| **Multi-tab** | Native support | Not supported |
| **Performance** | ~23% faster than Cypress in benchmarks | Slower, single-threaded by default |
| **Parallelism** | Built-in worker-based parallelism | Requires Cypress Cloud or workarounds |
| **Language** | JS/TS, Python, Java, C# | JS/TS only |
| **NPM downloads** | 20-30M/week (surpassed Cypress mid-2024) | Declining |
| **Local-only** | Full functionality offline | Full functionality offline |
| **CI cost** | 40-60% less CI minutes than Cypress | Higher due to single-threaded execution |
| **File upload** | `page.setInputFiles()` — straightforward | `cy.selectFile()` — also works |
| **Browser support** | Chromium, Firefox, WebKit | Chromium, Firefox, Edge (no WebKit) |

#### Why Playwright wins for Klatch specifically

1. **SSE streaming**: Cypress has a long-standing bug (2017-present) where its proxy layer buffers SSE streams — events only arrive when the connection closes. This is a dealbreaker for testing Klatch's streaming UI. Playwright's out-of-process architecture avoids this.

2. **Local-first tool**: Playwright runs entirely locally with no cloud dependency. Tests execute against real browsers installed on the machine.

3. **Import testing**: Playwright's file upload API (`page.setInputFiles()`) handles ZIP file uploads for the conversation import flow cleanly.

4. **Vite integration**: `@playwright/test` works with Vite's dev server via `webServer` config — start the full stack before tests, tear it down after.

#### Setup cost

```bash
npm install -D @playwright/test
npx playwright install chromium  # ~200MB download, one-time
```

Config (`playwright.config.ts` at repo root):
```ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  webServer: {
    command: 'npm run dev',
    port: 5173,
    reuseExistingServer: !process.env.CI,
  },
  use: {
    baseURL: 'http://localhost:5173',
  },
});
```

**Total new dependencies:** 1 (`@playwright/test`)
**Config effort:** ~15 minutes
**First test effort:** ~30 minutes

#### Gotchas

- **Browser download**: `npx playwright install` downloads browser binaries (~200MB for Chromium alone). Not a problem locally, but adds CI setup time.
- **SSE in Playwright**: `page.route()` does not intercept EventSource requests. You cannot mock SSE at the network level in Playwright. Workarounds exist (see Section 4).
- **Slower than Vitest**: E2E tests are inherently slower (seconds per test vs milliseconds). Use them sparingly for critical flows.
- **No native component testing**: Use Vitest for component tests, Playwright for full-stack flows.

#### Sources
- [Cypress vs Playwright in 2026 (bugbug.io)](https://bugbug.io/blog/test-automation-tools/cypress-vs-playwright/)
- [Playwright vs Cypress: 2026 Enterprise Guide](https://devin-rosario.medium.com/playwright-vs-cypress-the-2026-enterprise-testing-guide-ade8b56d3478)
- [Performance Benchmark: Playwright vs Cypress 2026](https://testdino.com/blog/performance-benchmarks/)
- [Cypress SSE buffering bug (open since 2017)](https://github.com/cypress-io/cypress/issues/1111)
- [Cypress SSE buffering bug (2024, still unresolved)](https://github.com/cypress-io/cypress/issues/30686)
- [Playwright EventSource mocking limitation](https://github.com/microsoft/playwright/issues/15353)

---

## 3. Client Component Testing

### Recommendation: Vitest + React Testing Library (jsdom) — keep current approach

The existing `packages/client/vitest.config.ts` already configures jsdom. Add `@testing-library/react` and `@testing-library/user-event` for component tests.

#### Options evaluated

| Approach | Accuracy | Speed | Setup | Best for |
|----------|----------|-------|-------|----------|
| **Vitest + RTL + jsdom** | Good (simulated DOM) | Fast | Minimal — already configured | Unit/integration component tests |
| **Vitest + RTL + happy-dom** | Lower (some missing APIs) | Fastest | Minimal | Simple component tests |
| **Vitest Browser Mode** | Best (real browser) | Slower (browser startup) | Moderate (needs Playwright) | High-fidelity UI tests |

#### Why jsdom + RTL is the right default

- **Already configured** in `packages/client/vitest.config.ts`
- **Fast**: No browser startup overhead
- **Mature ecosystem**: RTL is the standard for React component testing
- **Sufficient accuracy** for most Klatch components (message rendering, channel sidebar, entity panels)
- **RTL's philosophy** (test user behavior, not implementation) aligns with Klatch's UI patterns

#### Vitest Browser Mode — worth monitoring, not yet recommended

Vitest Browser Mode runs component tests in a real browser via Playwright. Kent C. Dodds (RTL author) has endorsed the approach. However, it is still marked as experimental in 2026 and adds Playwright as a dependency for component tests (acceptable if already using it for E2E). The migration path from RTL is straightforward — `vitest-browser-react` provides equivalent APIs.

**Recommendation:** Start with jsdom + RTL. Migrate to Browser Mode when it stabilizes, especially if jsdom causes false positives/negatives with CSS or browser API-dependent components.

#### Setup cost

```bash
npm install -D @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

Add to `packages/client/src/__tests__/setup.ts`:
```ts
import '@testing-library/jest-dom/vitest';
```

**Total new dependencies:** 3
**Config effort:** ~10 minutes

#### Testing specific Klatch patterns

**SSE hooks (`useStream`):**
- Mock `EventSource` globally in the test setup
- Use `vi.fn()` to simulate event callbacks (`onmessage`, `onerror`)
- Test the hook with `renderHook()` from RTL
- Example pattern:

```ts
const mockEventSource = vi.fn(() => ({
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  close: vi.fn(),
  onmessage: null,
  onerror: null,
}));
vi.stubGlobal('EventSource', mockEventSource);
```

**@mention autocomplete:**
- Use `@testing-library/user-event` for typing in the input
- `userEvent.type(input, '@Cl')` triggers the autocomplete
- Assert on the dropdown rendering and selection

**Drag-and-drop (entity assignment):**
- RTL's `fireEvent.dragStart/dragOver/drop` works for basic DnD
- For complex DnD (libraries like `dnd-kit` or `react-beautiful-dnd`), use `@testing-library/user-event`'s pointer API or test at the E2E level with Playwright

#### Gotchas

- **jsdom limitations**: No CSS layout engine (can't test visibility based on CSS), no `IntersectionObserver`, no `ResizeObserver`. Mock these if needed.
- **React 19 async components**: Vitest does not support testing async Server Components. Not relevant for Klatch (client-only React).
- **EventSource**: jsdom does not implement `EventSource`. You must provide a mock.

#### Sources
- [Vitest Component Testing Guide](https://vitest.dev/guide/browser/component-testing)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Why Vitest Browser Mode](https://vitest.dev/guide/browser/why)
- [Vitest Browser Mode announcement (InfoQ)](https://www.infoq.com/news/2025/06/vitest-browser-mode-jsdom/)

---

## 4. SSE/Streaming Testing

This is the hardest testing challenge in the stack. Neither testing frameworks nor browser automation tools have first-class SSE support. Here are patterns for each layer.

### API-Level SSE Testing (Integration)

#### Pattern A: Test the streaming bridge directly (recommended)

Test `streamClaude()` in isolation by mocking the Anthropic SDK's stream and verifying that the EventEmitter produces correct events.

```ts
// Mock Anthropic SDK to return a fake stream
vi.mock('@anthropic-ai/sdk', () => ({
  default: class {
    messages = {
      stream: vi.fn(() => createFakeStream([
        { type: 'content_block_delta', delta: { text: 'Hello' } },
        { type: 'content_block_delta', delta: { text: ' world' } },
        { type: 'message_stop' },
      ])),
    };
  },
}));

// Then test that streamClaude emits the right events
// and writes the final message to the DB
```

#### Pattern B: Test SSE endpoint response format

Use `app.request()` to hit the SSE endpoint and parse the response body as a text stream:

```ts
const res = await app.request('/api/channels/default/stream/msg-123');
expect(res.headers.get('content-type')).toBe('text/event-stream');

const reader = res.body!.getReader();
const decoder = new TextDecoder();
const chunks: string[] = [];

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  chunks.push(decoder.decode(value));
}

// Parse SSE format: "data: {...}\n\n"
const events = chunks.join('').split('\n\n').filter(Boolean);
```

This works because Hono's `app.request()` returns a standard `Response` with a `ReadableStream` body — no HTTP server needed.

#### Pattern C: Use a timeout-based assertion

For tests that verify "the stream eventually completes":

```ts
const streamPromise = new Promise((resolve, reject) => {
  const timeout = setTimeout(() => reject(new Error('Stream timeout')), 5000);
  emitter.on('done', () => {
    clearTimeout(timeout);
    resolve(true);
  });
});

await expect(streamPromise).resolves.toBe(true);
```

### Browser-Level SSE Testing (E2E with Playwright)

#### Pattern A: Test the UI outcome, not the stream (recommended)

Don't try to intercept SSE at the network level. Instead:

```ts
test('message streams and completes', async ({ page }) => {
  await page.goto('/');
  await page.fill('[data-testid="message-input"]', 'Hello');
  await page.click('[data-testid="send-button"]');

  // Wait for the streaming indicator to appear
  await expect(page.locator('[data-testid="streaming-indicator"]')).toBeVisible();

  // Wait for the response to complete (streaming indicator disappears)
  await expect(page.locator('[data-testid="streaming-indicator"]')).not.toBeVisible({ timeout: 30000 });

  // Verify the response content appeared
  await expect(page.locator('.assistant-message').last()).toContainText(/\w+/);
});
```

#### Pattern B: Mock at the API level, not the SSE level

Instead of intercepting EventSource, intercept the POST that triggers streaming and inject a pre-seeded response:

```ts
await page.route('**/api/channels/*/messages', async (route) => {
  // Let the POST through but pre-seed the DB with a complete response
  await route.fulfill({
    json: { userMessageId: 'test-user', assistants: [{ assistantMessageId: 'test-asst', entityId: 'default-entity', model: 'claude-opus-4-6' }] },
  });
});
```

#### Pattern C: Use `page.evaluate()` to create EventSource directly

For testing the SSE connection itself:

```ts
const events = await page.evaluate(async () => {
  return new Promise<string[]>((resolve) => {
    const received: string[] = [];
    const es = new EventSource('/api/channels/default/stream/msg-123');
    es.onmessage = (e) => received.push(e.data);
    es.onerror = () => { es.close(); resolve(received); };
    setTimeout(() => { es.close(); resolve(received); }, 5000);
  });
});
```

### Gotchas

- **Playwright `page.route()` does NOT intercept EventSource requests.** This is documented and unlikely to change. Do not rely on network interception for SSE.
- **Cypress buffers SSE streams** through its proxy. Events only arrive when the connection closes. This makes Cypress unusable for real SSE testing.
- **Timeouts are essential.** SSE streams can hang forever if the server doesn't close them. Always use timeouts in tests.
- **Test the streaming bridge and the UI separately.** Don't try to E2E test the streaming pipeline end-to-end — the ROI is low and the tests are fragile. Test the bridge (Anthropic SDK mock -> EventEmitter -> DB write) at the integration level, and test the UI (streaming indicator appears/disappears, content renders) at the E2E level.

#### Sources
- [MockSSE for Node.js](https://github.com/binarymist/mocksse)
- [Step CI SSE Testing](https://docs.stepci.com/guides/testing-sse.html)
- [Playwright EventSource via page.evaluate](https://www.lambdatest.com/automation-testing-advisor/csharp/methods/Microsoft.Playwright.Tests.PageNetworkRequestTest.ShouldReturnEventSource)
- [Playwright SSE issue (open)](https://github.com/microsoft/playwright/issues/15353)
- [Playwright Network docs](https://playwright.dev/docs/network)

---

## Summary: Recommended Testing Stack

| Layer | Tool | Status | Setup Cost |
|-------|------|--------|------------|
| **Unit tests** | Vitest | Already in place | None |
| **Integration (API)** | Vitest + `app.request()` + in-memory SQLite | Already in place | None |
| **Component tests** | Vitest + React Testing Library + jsdom | Config exists, add RTL | 10 min |
| **E2E tests** | Playwright | New addition | 30 min |
| **SSE (API-level)** | Vitest + mock Anthropic stream | Extend existing mocks | 1-2 hours |
| **SSE (browser-level)** | Playwright (test UI outcome, not stream) | Part of E2E setup | Included above |

### New dependencies to add

```bash
# Component testing (client)
npm install -D @testing-library/react @testing-library/jest-dom @testing-library/user-event

# E2E testing (root)
npm install -D @playwright/test
npx playwright install chromium
```

### What NOT to add

- **supertest**: Unnecessary — `app.request()` is better for Hono
- **Cypress**: SSE buffering bug is a dealbreaker
- **Jest**: Vitest is already in place and faster
- **Vitest Browser Mode**: Experimental — revisit when stable
- **happy-dom**: jsdom is already configured and more complete
