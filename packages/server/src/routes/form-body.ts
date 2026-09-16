import type { Context } from 'hono';
import { HTTPException } from 'hono/http-exception';

/**
 * Read a multipart request body, refusing a malformed one with a 400 and a
 * sentence instead of letting it become a framework 500.
 *
 * **Use this, not a bare `await c.req.formData()`.** This is the sibling of
 * `readJsonBody` in `json-body.ts` and exists for the same measured reason:
 * `formData()` parses, parsing throws, and an unguarded throw inside a Hono
 * handler renders as `500 Internal Server Error` with a `text/plain` body —
 * a 4xx condition reported as a 5xx, in a content type that defeats every
 * wrapper in `api/client.ts` (`res.json().catch(() => null)` → `detail?.error`
 * recovers nothing and the wrapper falls back to `statusText`).
 *
 * Read `json-body.ts`'s docstring for why this is a per-route throwing helper
 * and not an `app.onError` — the argument is identical and is not repeated here.
 *
 * Measured 2026-09-15 (Round 216) against the six live sites, before the fix:
 * a multipart content-type with a garbage body, a multipart content-type with
 * no `boundary=` parameter, and a truncated multipart body all produced
 * `500 · text/plain · "Internal Server Error"`. At `POST /channels/:id/files`,
 * which does not branch on content-type at all, so did *no body* and a JSON
 * body. Theseus confirmed the same shape over a real socket at
 * `POST /import/klatch` (Round 215 §5), so this is not an artifact of
 * `app.request()`.
 *
 * ## One sentence for two conditions, deliberately
 *
 * "content-type was never multipart" and "content-type was multipart but the
 * bytes are not" are different faults, and both are the client's. The four
 * `import.ts` sites already branch on content-type before reaching here, so
 * they only ever meet the second; the two `files.ts` sites meet both. A single
 * sentence that is true of both beats guessing which one happened from an
 * exception message the platform does not promise.
 *
 * ## Where this must sit relative to the size cap
 *
 * At the read, and **not one line earlier**. `import.ts`'s
 * `rejectOversizeBeforeRead` is a Content-Length header check whose entire
 * value (Round 151) is running *before* the body is buffered. Hoisting this
 * guard above it would buffer the body of a request we had already decided to
 * refuse — spending exactly the memory that guard was built to save. Pinned by
 * a test in `round216-form-body-guard.test.ts`.
 *
 * Shape validation stays with the route: a *parseable* form with no `file`
 * part still gets the route's own "No file uploaded" sentence, which is more
 * useful than a generic one.
 */
export async function readFormBody(c: Context): Promise<FormData> {
  try {
    return await c.req.formData();
  } catch {
    throw new HTTPException(400, {
      res: c.json({ error: 'Request body must be valid multipart form data' }, 400),
    });
  }
}
