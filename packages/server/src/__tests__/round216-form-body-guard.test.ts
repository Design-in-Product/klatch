/**
 * Round 216 — a malformed *multipart* body is a 400 with a sentence, not a 500.
 *
 * Round 214 closed this for JSON bodies and I flagged the multipart sites as the
 * same defect class, unfixed. Theseus drove one of them over a real socket in
 * Round 215 §5 and confirmed it live:
 *
 *     POST /import/klatch, malformed multipart body
 *       → 500 · text/plain; charset=UTF-8 · "Internal Server Error"
 *
 * — same status, same content-type, same client-side flattening. He also
 * corrected my count: **six** sites, not four. I said "4 multipart sites under
 * `routes/`" and the truth is 4 in `import.ts` plus 2 in `files.ts`; the 4 was my
 * `import.ts` number reported as the whole. Verified this fire by grep: six.
 *
 * ## Measured before the fix, not predicted from the shape of the code
 *
 * All six sites, five body shapes each, through the mounted routers:
 *
 *   | body                                    | import.ts ×4 | files.ts ×2 |
 *   |-----------------------------------------|--------------|-------------|
 *   | multipart content-type, garbage body    | 500 text/plain | 500 text/plain |
 *   | multipart content-type, NO `boundary=`  | 500 text/plain | 500 text/plain |
 *   | truncated multipart (never closed)      | 500 text/plain | 500 text/plain |
 *   | no body at all                          | 400 (JSON branch) | **500 text/plain** |
 *   | JSON body                               | 400 (JSON branch) | **500 text/plain** |
 *
 * The last two rows are the reason `files.ts` is the worse half and is not just
 * "two more of the same": `import.ts` branches on `content-type` and sends a
 * non-multipart request down the JSON path, where Round 214's guard already
 * catches it. `files.ts` has no such branch — it reads `formData()`
 * unconditionally — so a client that sends JSON to a file-upload endpoint is
 * told the server broke.
 *
 * ## What the controls are for
 *
 * Two properties could each be broken by a "simpler" version of this fix, so
 * both are pinned:
 *
 * 1. **The size cap must still run first.** `import.ts`'s
 *    `rejectOversizeBeforeRead` is a Content-Length check whose entire value
 *    (Round 151: a 70.3 MB refusal peaked at 169.6 MB over baseline) is being
 *    *before* the body is buffered. A guard hoisted one line above it would
 *    buffer a body we had already decided to refuse.
 * 2. **Shape validation stays with the route.** A form that parses but carries
 *    no `file` part is not a malformed body, and the route's own sentence names
 *    what to send.
 */

import './setup.js';
import { describe, it, expect, vi } from 'vitest';
import { Hono } from 'hono';
import fs from 'fs';
import path from 'path';
import { createTestApp } from './app.js';
import { readFormBody } from '../routes/form-body.js';
import { fileRoutes } from '../routes/files.js';
import { createProject } from '../db/queries.js';

vi.mock('../claude/client.js', () => ({
  streamClaude: vi.fn(),
  streamClaudeRoundtable: vi.fn(),
  activeStreams: new Map(),
  abortStream: vi.fn(() => false),
}));

const GUARD_SENTENCE = 'Request body must be valid multipart form data';
const MULTIPART_CT = 'multipart/form-data; boundary=----X';

/**
 * Bodies that reach `formData()` and make it throw. Each was measured at 500
 * before the fix; the labels say what is wrong with the bytes, not what the
 * server did with them.
 */
const MALFORMED_MULTIPART: Array<[string, RequestInit]> = [
  [
    'a multipart content-type over a body that is not multipart',
    { method: 'POST', headers: { 'Content-Type': MULTIPART_CT }, body: 'not a multipart body' },
  ],
  [
    'a multipart content-type with no boundary= parameter',
    {
      method: 'POST',
      headers: { 'Content-Type': 'multipart/form-data' },
      body: '------X\r\nContent-Disposition: form-data; name="file"\r\n\r\nx\r\n------X--\r\n',
    },
  ],
  [
    'a truncated multipart body — boundary opened, never closed',
    {
      method: 'POST',
      headers: { 'Content-Type': MULTIPART_CT },
      body: '------X\r\nContent-Disposition: form-data; name="file"; filename="a.zip"\r\n\r\nab',
    },
  ],
];

/** The four `import.ts` sites. All branch on content-type before reading. */
const IMPORT_SITES = [
  'POST /import/claude-code',
  'POST /import/claude-ai/preview',
  'POST /import/claude-ai',
  'POST /import/klatch',
].map((label, i) => [
  label,
  [
    '/api/import/claude-code',
    '/api/import/claude-ai/preview',
    '/api/import/claude-ai',
    '/api/import/klatch',
  ][i],
]) as Array<[string, string]>;

/**
 * Emulate what every wrapper in `api/client.ts` does to recover the server's own
 * sentence. A `text/plain` body makes this return null, which is the failure the
 * 500 had — so asserting on the recovered string, not just the status, is the
 * point.
 */
async function clientVisibleSentence(res: Response): Promise<string | null> {
  const detail = await res.json().catch(() => null);
  return detail?.error ?? null;
}

/**
 * `createTestApp()` now mounts `fileRoutes` — Round 218 closed the harness gap
 * this helper existed to work around, and the comment that used to sit here
 * ("`files.ts` is not mounted by `createTestApp()`") is no longer true.
 *
 * Kept as a thin alias rather than inlined at ~20 call sites, and kept pointing
 * at the canonical app rather than at a private `new Hono()`, so these checks
 * are driving the same assembly the server runs. `fileRoutes` stays imported
 * only for the structural assertion below it.
 */
function fileApp(): Hono {
  return createTestApp();
}

describe('Round 216 — malformed multipart bodies refuse with a sentence', () => {
  describe('the four import.ts sites', () => {
    for (const [label, url] of IMPORT_SITES) {
      for (const [bodyLabel, init] of MALFORMED_MULTIPART) {
        it(`${label} — ${bodyLabel} → 400 with a readable sentence`, async () => {
          const res = await createTestApp().request(url, init);

          expect(res.status).toBe(400);
          // Content-type is asserted on every check: a 400 with a text/plain
          // body is the same client-side flattening the 500 had.
          expect(res.headers.get('content-type')).toContain('application/json');
          expect(await clientVisibleSentence(res)).toBe(GUARD_SENTENCE);
        });
      }
    }
  });

  describe('the two files.ts sites', () => {
    for (const [bodyLabel, init] of MALFORMED_MULTIPART) {
      it(`POST /channels/:id/files — ${bodyLabel} → 400 with a readable sentence`, async () => {
        const res = await fileApp().request('/api/channels/any/files', init);

        expect(res.status).toBe(400);
        expect(res.headers.get('content-type')).toContain('application/json');
        expect(await clientVisibleSentence(res)).toBe(GUARD_SENTENCE);
      });

      it(`POST /projects/:id/files — ${bodyLabel} → 400 with a readable sentence`, async () => {
        // A real project, deliberately: this route resolves the project and 404s
        // BEFORE reading the body, so a throwaway id would have made every check
        // here pass without the guard existing at all. Same fixture trap
        // Theseus hit on `POST /files/:id/promote` in Round 215 §4.
        const project = createProject('guarded', '');
        const res = await fileApp().request(`/api/projects/${project.id}/files`, init);

        expect(res.status).toBe(400);
        expect(res.headers.get('content-type')).toContain('application/json');
        expect(await clientVisibleSentence(res)).toBe(GUARD_SENTENCE);
      });
    }

    it('the 404-before-400 order is real — a bad id answers "not found", not the guard', async () => {
      // Pins the sentence above as load-bearing rather than incidental. If this
      // ever flips, the tests above are testing the 404 and would not notice.
      const res = await fileApp().request('/api/projects/no-such-project/files', {
        method: 'POST',
        headers: { 'Content-Type': MULTIPART_CT },
        body: 'not a multipart body',
      });

      expect(res.status).toBe(404);
      expect(await clientVisibleSentence(res)).toBe('Project not found');
    });
  });

  describe('files.ts had two failures import.ts never did — it does not branch on content-type', () => {
    // These two were 500s at `files.ts` and 400s at `import.ts` before the fix.
    // They are the reason this round is six sites and not four.
    const NOT_MULTIPART_AT_ALL: Array<[string, RequestInit]> = [
      ['no body at all', { method: 'POST' }],
      [
        'a JSON body sent to a file-upload route',
        { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{"a":1}' },
      ],
    ];

    for (const [label, init] of NOT_MULTIPART_AT_ALL) {
      it(`POST /channels/:id/files — ${label} → 400, was 500`, async () => {
        const res = await fileApp().request('/api/channels/any/files', init);

        expect(res.status).toBe(400);
        expect(await clientVisibleSentence(res)).toBe(GUARD_SENTENCE);
      });
    }

    it('the same bodies at an import route keep the JSON branch’s own answer', async () => {
      // Not the guard's sentence — `import.ts` reads content-type first and
      // these never reach `formData()`. Asserting the *difference* rather than
      // asserting both are 400 is what makes this a control.
      const res = await createTestApp().request('/api/import/claude-code', { method: 'POST' });

      expect(res.status).toBe(400);
      expect(await clientVisibleSentence(res)).toBe('Request body must be valid JSON');
    });
  });

  // ── Control 1: the size cap still runs before the body is read ──

  it('an oversized declared body is refused by the cap, not by the guard', async () => {
    // The guard sits AT the read, not above it. If it were hoisted over
    // `rejectOversizeBeforeRead`, this request — declared at 60 MB, over the
    // 50 MB cap, with a body that cannot parse — would answer with the guard's
    // sentence, and we would have bought a readable error by spending the
    // allocation Round 151 measured and removed.
    const res = await createTestApp().request('/api/import/klatch', {
      method: 'POST',
      headers: { 'Content-Type': MULTIPART_CT, 'Content-Length': String(60 * 1024 * 1024) },
      body: 'not a multipart body',
    });

    expect(res.status).toBe(400);
    expect(await clientVisibleSentence(res)).toBe(
      'File too large (60MB uploaded). Maximum is 50MB.'
    );
  });

  // ── Control 2: shape validation stays with the route ──

  it('a form that parses but carries no file keeps the route’s own sentence', async () => {
    const form = new FormData();
    form.set('somethingElse', 'x');
    const res = await createTestApp().request('/api/import/klatch', { method: 'POST', body: form });

    expect(res.status).toBe(400);
    expect(await clientVisibleSentence(res)).toBe(
      'No file uploaded. Send a zip as "file" in multipart form data.'
    );
  });

  it('a form carrying a file of the wrong type reaches the route’s own check', async () => {
    // The guard is not in the way: this body parses, so the route gets to run
    // its extension check and say what it wants instead.
    const form = new FormData();
    form.set('file', new File(['x'], 'notazip.txt', { type: 'text/plain' }));
    const res = await createTestApp().request('/api/import/klatch', { method: 'POST', body: form });

    expect(res.status).toBe(400);
    expect(await clientVisibleSentence(res)).toBe('File must be a .zip file');
  });

  it('a parseable form at a files.ts route keeps that route’s sentence too', async () => {
    const form = new FormData();
    form.set('content', 'hello');
    const res = await fileApp().request('/api/channels/any/files', { method: 'POST', body: form });

    expect(res.status).toBe(400);
    expect(await clientVisibleSentence(res)).toBe('No file provided');
  });

  // ── Control 3: the helper catches the read, not everything after it ──

  it('the helper does not swallow a genuine internal error into a 400', async () => {
    // Scoped claim, same as Round 214's: this mounts its own bare app, so it
    // pins the helper's own behaviour. The app-level property — no blanket
    // onError — is pinned structurally by round214's last test and is not
    // re-asserted here.
    const sub = new Hono();
    sub.post('/boom', async (c) => {
      await readFormBody(c);
      throw new Error('genuine internal failure');
    });
    const app = new Hono();
    app.route('/api', sub);

    const form = new FormData();
    form.set('file', new File(['x'], 'a.zip'));
    const res = await app.request('/api/boom', { method: 'POST', body: form });

    expect(res.status).toBe(500);
  });

  // ── Structural: the 7th site cannot be added unguarded and stay quiet ──

  it('no route reads a multipart body with a bare c.req.formData()', () => {
    const routesDir = path.join(__dirname, '..', 'routes');
    const offenders: string[] = [];

    for (const file of fs.readdirSync(routesDir).filter((f) => f.endsWith('.ts'))) {
      // form-body.ts is the one legitimate caller — it *is* the guard.
      if (file === 'form-body.ts') continue;
      const lines = fs.readFileSync(path.join(routesDir, file), 'utf8').split('\n');
      lines.forEach((line, i) => {
        // Skip prose: `import.ts`'s cap docstrings name `c.req.formData()`
        // three times while explaining why the cap sits above it.
        const code = line.trim();
        if (code.startsWith('*') || code.startsWith('//')) return;
        if (code.includes('c.req.formData')) offenders.push(`${file}:${i + 1}: ${code}`);
      });
    }

    expect(offenders).toEqual([]);
  });

  it('the guard is wired at every multipart route site', () => {
    // Pairs with the test above: that one proves the old call is gone, this one
    // proves it was replaced rather than deleted. Six sites — 4 in `import.ts`,
    // 2 in `files.ts` — which is Theseus's count, verified by grep, not mine.
    const routesDir = path.join(__dirname, '..', 'routes');
    const perFile: Record<string, number> = {};

    for (const file of fs.readdirSync(routesDir).filter((f) => f.endsWith('.ts'))) {
      if (file === 'form-body.ts') continue;
      const src = fs.readFileSync(path.join(routesDir, file), 'utf8');
      const n = (src.match(/await readFormBody\(/g) || []).length;
      if (n > 0) perFile[file] = n;
    }

    // Asserted per file, not as a total: a total of 6 would stay green if a
    // site moved from `files.ts` to `import.ts` and one were dropped.
    expect(perFile).toEqual({ 'import.ts': 4, 'files.ts': 2 });
  });
});
