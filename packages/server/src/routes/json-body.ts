import type { Context } from 'hono';
import { HTTPException } from 'hono/http-exception';

/**
 * Read and parse a JSON request body, refusing a malformed one with a 400 and a
 * sentence instead of letting it become a framework 500.
 *
 * **Use this, not a bare `await c.req.json()`.** `c.req.json()` calls
 * `JSON.parse`, so *no body*, an *empty body*, *invalid JSON*, and a
 * *form-encoded* body all throw — and an unguarded throw inside a Hono handler
 * is rendered as `500 Internal Server Error` with a `text/plain` body. That is
 * wrong twice over:
 *
 * 1. It tells an operator "the server broke" when the truth is "your request was
 *    malformed" — a 4xx condition reported as a 5xx.
 * 2. `text/plain` defeats the client. Every wrapper in `api/client.ts` recovers
 *    the server's own sentence with `await res.json().catch(() => null)` and then
 *    `detail?.error`; on a `text/plain` body that parse fails, `detail` is null,
 *    and the wrapper falls back to `statusText` — which is the exact flattening
 *    those wrappers were written to avoid.
 *
 * Measured, 2026-09-15, on a bare `new Hono()` with no `app.onError`: unguarded
 * → 500 `text/plain`; this helper → 400 `application/json`, client recovers the
 * sentence.
 *
 * ## Why a throwing helper and not `app.onError`
 *
 * An `app.onError` in `index.ts` would be **invisible to the test suite**:
 * `__tests__/app.ts`'s `createTestApp()` builds its own `new Hono()` and mounts
 * the sub-routers, so it never sees anything registered on `index.ts`'s app. A
 * guard there would be proofread, not verified. `HTTPException` is handled by
 * Hono core rather than by an app-level handler, so this works in
 * `createTestApp()` and in production from one definition.
 *
 * A global handler would also have to *sniff* for `SyntaxError` to decide what
 * is a bad body — and `SyntaxError` is not unique to request parsing. Routes
 * `JSON.parse` stored data too (e.g. `channels.ts` on `source_metadata`), where
 * a corrupt row is a real server fault and "your JSON was malformed" would be a
 * lie. Scoping the guard to the body read keeps genuine internal errors as 500s:
 * verified in `round214-json-body-guard.test.ts`.
 *
 * Shape validation is deliberately *not* done here — each route's own
 * required-field checks already return their own sentences, and this helper only
 * changes what happens when the bytes are not JSON at all.
 */
export async function readJsonBody<T>(c: Context): Promise<T> {
  try {
    return await c.req.json<T>();
  } catch {
    throw new HTTPException(400, {
      res: c.json({ error: 'Request body must be valid JSON' }, 400),
    });
  }
}
