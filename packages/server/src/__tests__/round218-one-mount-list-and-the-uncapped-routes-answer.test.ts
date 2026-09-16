/**
 * Round 218 — two findings from Theseus's Round 217, both closed here.
 *
 * ## 1. The harness gap (his §1)
 *
 * `__tests__/app.ts` mounted five routers; `index.ts` mounted nine. The four
 * omitted — `modelRoutes`, `fileRoutes`, `aaxtRoutes`, `exportRoutes` — were
 * unreachable from every test that used the canonical harness, and the suite
 * was 1850-green across the entire window in which `POST /channels/:id/files`
 * answered a malformed body with `500 · text/plain`.
 *
 * The fix is not a diff test. Per the 2026-09-16 cross-pollination brief §2
 * (Janus): a rule whose only enforcement is recollection is unenforced, and
 * needs something at the *action point* that can say no. Adding a router to a
 * server whose harness keeps a separate list is an edit that is complete and
 * correct on its own terms — there is no moment at which it looks wrong. So
 * there is now exactly one list (`routes/mount.ts`), called by both apps, and
 * the checks below are aimed at keeping it the only one rather than at
 * re-counting it.
 *
 * ## 2. The uncapped upload routes don't answer (his §2/§3)
 *
 * Measured over a raw socket: a request declaring `Content-Length: 209715200`
 * and then sending ~45 bytes got **no response in 4004 ms** at both `files.ts`
 * upload sites, where all four capped `import.ts` sites refused immediately.
 *
 * My 9/15 board entry called fixing this "a sizing decision, not a body-guard
 * question," and the first half was wrong. `MAX_FILE_SIZE_BYTES` is 10 MB in
 * `files/storage.ts`, `validateFile()` has always enforced it, and the constant
 * was *imported into `files.ts` and never used*. The limit was decided long
 * ago; it was only ever applied after the whole body had been buffered. Nothing
 * here changes what size is allowed — the controls below are mostly there to
 * prove that.
 *
 * ## Why these checks read sentences and route tables, not statuses
 *
 * Round 216's mutation 4 is the precedent: a wrong fix can answer 400 with a
 * helpful-sounding sentence that is false about what happened, and a status-only
 * suite goes green on it. Every cap check below asserts *which* sentence
 * answered, because at these sites the cap, the multipart guard, and the route's
 * own shape check all say 400.
 */
import { describe, it, expect, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createTestApp } from './app.js';
import { mountApiRoutes } from '../routes/mount.js';
import { MAX_FILE_SIZE_BYTES } from '../files/storage.js';
import { MULTIPART_ENVELOPE_ALLOWANCE } from '../routes/size-cap.js';
import { createProject } from '../db/queries.js';

vi.mock('../claude/client.js', () => ({
  streamClaude: vi.fn(),
  streamClaudeRoundtable: vi.fn(),
  activeStreams: new Map(),
  abortStream: vi.fn(() => false),
}));

const SRC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel: string) => fs.readFileSync(path.join(SRC, rel), 'utf-8');

/**
 * Recover the sentence the way every wrapper in `api/client.ts` does. Returns
 * null on a `text/plain` body — which is the failure mode Round 214/216 existed
 * to remove, so asserting on the recovered string is not the same as asserting
 * on the status.
 */
async function sentence(res: Response): Promise<string | null> {
  const detail = await res.json().catch(() => null);
  return detail?.error ?? null;
}

/** A body that `formData()` cannot parse, so the multipart guard would answer if reached. */
const UNPARSEABLE: RequestInit['body'] = 'not a multipart body';
const MULTIPART_CT = 'multipart/form-data; boundary=----X';
const GUARD_SENTENCE = 'Request body must be valid multipart form data';

/** Theseus's arm L number, reused so the two rounds are comparing the same request. */
const LYING_CONTENT_LENGTH = 200 * 1024 * 1024;

// ── 1. There is one mount list, and it is the only one ──────────────────────

describe('Round 218 — one mount list', () => {
  it('index.ts mounts nothing of its own', () => {
    // The veto. If someone adds a tenth router straight to `index.ts`, this is
    // the check that notices — not a human comparing two lists, and not a test
    // that has to be taught the new router's name.
    const src = read('index.ts');

    expect(src).toContain('mountApiRoutes(app)');
    expect(src.match(/app\.route\(/g)).toBeNull();
  });

  it('the test harness mounts nothing of its own', () => {
    const src = read('__tests__/app.ts');

    expect(src).toContain('mountApiRoutes(new Hono())');
    expect(src.match(/app\.route\(/g)).toBeNull();
  });

  it('every router exported under routes/ is in the mount list', () => {
    // Two export styles exist in this directory — `export const fooRoutes = app`
    // (6 files) and `export { app as fooRoutes }` (3 files). Matching only the
    // first is how a check like this quietly stops covering a third of the
    // routers, so both are matched and the total is asserted.
    const exported = fs
      .readdirSync(path.join(SRC, 'routes'))
      .filter((f) => f.endsWith('.ts'))
      .flatMap((f) => {
        const src = read(path.join('routes', f));
        return [
          ...src.matchAll(/export\s+const\s+(\w+Routes)\s*=\s*app/g),
          ...src.matchAll(/export\s*\{\s*app\s+as\s+(\w+Routes)\s*\}/g),
        ].map((m) => m[1]);
      })
      .sort();

    expect(exported).toHaveLength(9);

    const mountSrc = read('routes/mount.ts');
    for (const name of exported) {
      expect(mountSrc, `${name} is exported but never mounted`).toContain(`app.route('/api`);
      expect(mountSrc, `${name} is exported but never mounted`).toContain(name);
    }
  });

  it('the harness app and the production mount order are the same list, not two equal lists', () => {
    // A test that compared two hand-written arrays would pass just as happily
    // against two lists that happen to agree today. This asserts identity: the
    // harness's routes are whatever `mountApiRoutes` produces, because that is
    // the only thing it calls.
    const { Hono } = require('hono') as typeof import('hono');
    const direct = mountApiRoutes(new Hono()).routes.map((r) => `${r.method} ${r.path}`);
    const viaHarness = createTestApp().routes.map((r) => `${r.method} ${r.path}`);

    expect(viaHarness).toEqual(direct);
  });
});

// ── 2. The four formerly-unreachable routers are reachable ──────────────────

describe('Round 218 — the four omitted routers answer through the canonical harness', () => {
  /**
   * Route-table assertions rather than requests, for `modelRoutes` specifically:
   * `GET /models` calls the Anthropic API, and a test that drives it would be a
   * model call smuggled into the suite. `app.routes` carries the prefixed paths
   * (verified by `scripts/probe-round218-hono-routes-introspection.mts` rather
   * than taken from the Hono docs), so reachability is checkable without one.
   */
  it.each([
    ['fileRoutes', 'POST', '/api/channels/:channelId/files'],
    ['fileRoutes', 'POST', '/api/projects/:id/files'],
    ['modelRoutes', 'GET', '/api/models'],
    ['aaxtRoutes', 'GET', '/api/aaxt/status'],
    ['exportRoutes', 'GET', '/api/channels/:id/export-preview'],
  ])('%s — %s %s is registered on the test app', (_router, method, routePath) => {
    const registered = createTestApp().routes.map((r) => `${r.method} ${r.path}`);

    expect(registered).toContain(`${method} ${routePath}`);
  });

  it('and they answer with their own handler, not a bare framework 404', async () => {
    // The distinction that matters: an unmounted route 404s too. A handler 404
    // carries JSON and a sentence; the framework's carries neither.
    const res = await createTestApp().request('/api/files/no-such-file/refs');

    expect(res.status).toBe(404);
    expect(res.headers.get('content-type')).toContain('application/json');
    expect(await sentence(res)).toBe('File not found');
  });

  it('aaxt answers too, and does it without a model call', async () => {
    const res = await createTestApp().request('/api/aaxt/status');

    expect(res.status).toBe(200);
    expect(await res.json()).toHaveProperty('configured');
  });

  it('export answers with its own 404 sentence', async () => {
    const res = await createTestApp().request('/api/channels/no-such-channel/export-preview');

    expect(res.status).toBe(404);
    expect(await sentence(res)).toBe('Channel not found');
  });
});

// ── 3. The cap answers before the body is read, at both files.ts sites ──────

describe('Round 218 — the uncapped upload routes now refuse from the header', () => {
  const OVERSIZE: RequestInit = {
    method: 'POST',
    headers: {
      'Content-Type': MULTIPART_CT,
      'Content-Length': String(LYING_CONTENT_LENGTH),
    },
    body: UNPARSEABLE,
  };

  const CAP_SENTENCE = 'File too large (200.0 MB uploaded). Maximum is 10 MB.';

  it('POST /channels/:id/files — a 200MB declared body is refused with the cap’s sentence', async () => {
    const res = await createTestApp().request('/api/channels/any/files', OVERSIZE);

    expect(res.status).toBe(400);
    expect(await sentence(res)).toBe(CAP_SENTENCE);
  });

  it('POST /projects/:id/files — same, at a project that exists', async () => {
    const project = createProject('capped', '');
    const res = await createTestApp().request(`/api/projects/${project.id}/files`, OVERSIZE);

    expect(res.status).toBe(400);
    expect(await sentence(res)).toBe(CAP_SENTENCE);
  });

  it('the cap answers, not the multipart guard — which pins the order', async () => {
    // The whole property, and the only thing distinguishing a working guard
    // from a hoisted one: both answer 400 on this request. The body above is
    // deliberately unparseable, so if the cap were removed or moved below
    // `readFormBody`, this same request would come back with GUARD_SENTENCE and
    // the server would have buffered 200 MB to produce it.
    const res = await createTestApp().request('/api/channels/any/files', OVERSIZE);

    expect(await sentence(res)).not.toBe(GUARD_SENTENCE);

    // The same bytes without the lying header DO reach the guard. Asserting
    // the difference is what makes this an ordering check rather than two
    // independent facts about a 400.
    const withoutHeader = await createTestApp().request('/api/channels/any/files', {
      method: 'POST',
      headers: { 'Content-Type': MULTIPART_CT },
      body: UNPARSEABLE,
    });

    expect(await sentence(withoutHeader)).toBe(GUARD_SENTENCE);
  });

  it('the two sentences differ, and the cap’s says "uploaded"', () => {
    // Round 217 §1's check, applied to this pair: if anyone ever makes the cap
    // and the exact check share one string, both of the assertions above stay
    // green and this one goes red. "uploaded" is the word carrying "this is the
    // envelope you declared, not a file we measured."
    expect(CAP_SENTENCE).toContain('uploaded');
    expect(CAP_SENTENCE).not.toBe(GUARD_SENTENCE);
    expect(read('files/storage.ts')).toContain('Maximum is 10 MB.');
    expect(read('files/storage.ts')).not.toContain('uploaded');
  });
});

// ── 4. Controls: the cap changed no answer that already existed ─────────────

describe('Round 218 — controls: nothing previously accepted is now refused', () => {
  it('no Content-Length at all falls through to the previous behaviour', async () => {
    // Chunked encoding and some clients send none. Guessing here would be the
    // one way this guard could refuse something the exact check would accept.
    const res = await createTestApp().request('/api/channels/any/files', {
      method: 'POST',
      headers: { 'Content-Type': MULTIPART_CT },
      body: UNPARSEABLE,
    });

    expect(await sentence(res)).toBe(GUARD_SENTENCE);
  });

  it('a garbage Content-Length falls through rather than being coerced', async () => {
    const res = await createTestApp().request('/api/channels/any/files', {
      method: 'POST',
      headers: { 'Content-Type': MULTIPART_CT, 'Content-Length': 'banana' },
      body: UNPARSEABLE,
    });

    expect(await sentence(res)).toBe(GUARD_SENTENCE);
  });

  it('a declared size over the cap but inside the envelope allowance falls through', async () => {
    // The boundary case the allowance exists for: a file of exactly 10 MB
    // arrives declaring 10 MB *plus* boundaries and part headers. `validateFile`
    // would accept that file, so this guard must not refuse its envelope.
    const declared = MAX_FILE_SIZE_BYTES + MULTIPART_ENVELOPE_ALLOWANCE;
    const res = await createTestApp().request('/api/channels/any/files', {
      method: 'POST',
      headers: { 'Content-Type': MULTIPART_CT, 'Content-Length': String(declared) },
      body: UNPARSEABLE,
    });

    expect(await sentence(res)).toBe(GUARD_SENTENCE);
  });

  it('an oversized upload at a nonexistent project still gets the 404', async () => {
    // Placement: the cap sits below the project lookup, which is a DB read and
    // not a body read, so putting it above would have bought no memory and
    // would have replaced a correct answer with a less useful one.
    const res = await createTestApp().request('/api/projects/no-such-project/files', {
      method: 'POST',
      headers: {
        'Content-Type': MULTIPART_CT,
        'Content-Length': String(LYING_CONTENT_LENGTH),
      },
      body: UNPARSEABLE,
    });

    expect(res.status).toBe(404);
    expect(await sentence(res)).toBe('Project not found');
  });

  it('a well-formed small upload still succeeds', async () => {
    // The cap is not in the way of the happy path. `/projects/:id/files` rather
    // than `/channels/:id/files` because the latter streams — Theseus's Round
    // 217 made the same choice for the same reason.
    const project = createProject('happy', '');
    const form = new FormData();
    form.set('file', new File(['hello'], 'note.txt', { type: 'text/plain' }));

    const res = await createTestApp().request(`/api/projects/${project.id}/files`, {
      method: 'POST',
      body: form,
    });

    expect(res.status).toBe(201);
    // Read the whole body. Round 217 §4: truncating it to 400 chars turned a
    // perfectly good 201 into a reported failure, because `{ file, ref }` is 447.
    const body = await res.json();
    expect(body.file.name).toBe('note.txt');
  });

  it('the import family’s cap sentence is untouched by the extraction', async () => {
    // `rejectOversizeBeforeRead` moved into `size-cap.ts` this round. The four
    // import sites must answer exactly as they did before — same number
    // formatting, same wording, no space before MB.
    const res = await createTestApp().request('/api/import/klatch', {
      method: 'POST',
      headers: { 'Content-Type': MULTIPART_CT, 'Content-Length': String(60 * 1024 * 1024) },
      body: UNPARSEABLE,
    });

    expect(res.status).toBe(400);
    expect(await sentence(res)).toBe('File too large (60MB uploaded). Maximum is 50MB.');
  });
});
