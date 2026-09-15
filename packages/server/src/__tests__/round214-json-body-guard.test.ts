/**
 * Round 214 — a malformed request body is a 400 with a sentence, not a 500.
 *
 * Theseus's Round 213 arm F drove the Round 212 reassign endpoint over a real
 * socket with bodies a hand-built `Request` never sends, and found four that
 * produced `500 Internal Server Error`: no body at all, an empty body with a
 * JSON content-type, invalid JSON, and a form-encoded body. `await c.req.json()`
 * calls `JSON.parse`, and an unguarded throw inside a Hono handler renders as a
 * framework 500.
 *
 * His arm G control is the reason this is a round of its own rather than a fix to
 * one endpoint: he sent the same invalid JSON at `POST /channels` and
 * `POST /entities`, both months older, and got 500 from both. The defect is
 * systemic — 15 sites under `routes/`, none guarded — not a Round 212
 * regression. He flagged it and deliberately did not choose the shape, because
 * per-route guard vs. `app.onError` is an architecture call.
 *
 * ## The two properties that decided the shape, both pinned below
 *
 * `app.onError` was rejected for a measured reason, not a stylistic one:
 * `createTestApp()` builds its own `new Hono()` and mounts the sub-routers, so it
 * never sees anything registered on `index.ts`'s app. A guard there would be
 * untestable by construction — proofread, not verified. `HTTPException` is
 * handled by Hono core, so one definition covers tests and production.
 *
 * A global handler would also have to sniff for `SyntaxError`, and `SyntaxError`
 * is not unique to request parsing — routes `JSON.parse` *stored* data too, where
 * a corrupt row is a genuine server fault and "your JSON was malformed" is a lie.
 * So the control assertions matter as much as the 400s: a guard that turned those
 * into 400s would pass every malformed-body test here and still be wrong.
 *
 * Be precise about what each control covers, because a mutation showed the
 * obvious reading was too generous. The internal-error test mounts its own bare
 * app, so it pins **the helper**, not the assembled app — adding `onError` to
 * `createTestApp` left all 14 original checks green. The app-level property is
 * pinned separately and structurally.
 *
 * The last three tests are structural: no route reads a body with a bare
 * `c.req.json()`, the guard is wired at all 15 sites, and no blanket `onError` is
 * registered. Non-circular — they read the sources, so a 16th site added
 * tomorrow without the guard turns one red.
 */

import './setup.js';
import { describe, it, expect, vi } from 'vitest';
import { Hono } from 'hono';
import fs from 'fs';
import path from 'path';
import { createTestApp } from './app.js';
import { readJsonBody } from '../routes/json-body.js';
import { createEntity, createChannel, assignEntityToChannel } from '../db/queries.js';
import { getDb } from '../db/index.js';
import { DEFAULT_MODEL } from '@klatch/shared';

vi.mock('../claude/client.js', () => ({
  streamClaude: vi.fn(),
  activeStreams: new Map(),
  abortStream: vi.fn(() => false),
}));

const JSON_CT = { 'Content-Type': 'application/json' };

/** The four bodies Theseus's arm F sent that a hand-built `Request` never does. */
const MALFORMED: Array<[string, RequestInit]> = [
  ['no body at all', { method: 'POST' }],
  ['empty string with a JSON content-type', { method: 'POST', headers: JSON_CT, body: '' }],
  ['invalid JSON', { method: 'POST', headers: JSON_CT, body: '{ not json' }],
  [
    'form-encoded instead of JSON',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'toEntityId=abc',
    },
  ],
];

/**
 * Emulate what every wrapper in `api/client.ts` does to recover the server's own
 * sentence. A `text/plain` body makes this return null — which is the failure
 * those wrappers were written to avoid, so asserting on it is the point.
 */
async function clientVisibleSentence(res: Response): Promise<string | null> {
  const detail = await res.json().catch(() => null);
  return detail?.error ?? null;
}

describe('Round 214 — malformed JSON bodies refuse with a sentence', () => {
  describe('the reassign endpoint Theseus drove (arm F)', () => {
    for (const [label, init] of MALFORMED) {
      it(`${label} → 400 with a readable sentence, not 500`, async () => {
        const app = createTestApp();
        const res = await app.request('/api/channels/any/entities/any', {
          ...init,
          method: 'PATCH',
        });

        expect(res.status).toBe(400);
        expect(res.headers.get('content-type')).toContain('application/json');
        expect(await clientVisibleSentence(res)).toBe('Request body must be valid JSON');
      });
    }
  });

  // Arm G: the same bodies at routes months older than the reassign endpoint.
  // These were 500s too, which is what made this systemic rather than a
  // regression, so they are pinned at the same standard.
  describe('arm G — the older routes the control was run against', () => {
    const OLDER: Array<[string, string]> = [
      ['POST /channels', '/api/channels'],
      ['POST /entities', '/api/entities'],
      ['POST /projects', '/api/projects'],
    ];

    for (const [label, url] of OLDER) {
      it(`${label} refuses invalid JSON with a sentence`, async () => {
        const app = createTestApp();
        const res = await app.request(url, {
          method: 'POST',
          headers: JSON_CT,
          body: '{ not json',
        });

        expect(res.status).toBe(400);
        expect(await clientVisibleSentence(res)).toBe('Request body must be valid JSON');
      });
    }
  });

  it('a malformed body moves nothing — the refusal is before any write', async () => {
    const app = createTestApp();
    const from = createEntity('FROM', DEFAULT_MODEL, '', '#111');
    const to = createEntity('TO', DEFAULT_MODEL, '', '#222');
    // Explicit roster — createChannel seats the *default* entity when given
    // none, which would make the roster assertion below ambiguous.
    const channel = createChannel('seats', '', undefined, undefined, undefined, [from.id]);

    for (const [, init] of MALFORMED) {
      const res = await app.request(`/api/channels/${channel.id}/entities/${from.id}`, {
        ...init,
        method: 'PATCH',
      });
      expect(res.status).toBe(400);
    }

    // Read the roster back off the database, not out of a response body.
    const seats = getDb()
      .prepare('SELECT entity_id FROM channel_entities WHERE channel_id = ?')
      .all(channel.id) as { entity_id: string }[];
    expect(seats.map((s) => s.entity_id)).toEqual([from.id]);
    expect(seats.map((s) => s.entity_id)).not.toContain(to.id);
  });

  it('a valid body still works — the guard is not in the way', async () => {
    const app = createTestApp();
    const res = await app.request('/api/entities', {
      method: 'POST',
      headers: JSON_CT,
      body: JSON.stringify({ name: 'VALID', model: DEFAULT_MODEL }),
    });

    expect(res.status).toBe(201);
    expect((await res.json()).name).toBe('VALID');
  });

  it('a valid body of the wrong shape keeps the route’s own sentence', async () => {
    // The guard only changes what happens when the bytes are not JSON. Shape
    // validation still belongs to the route, and its sentence is more useful
    // than a generic one would be.
    const app = createTestApp();
    const res = await app.request('/api/channels/any/entities/any', {
      method: 'PATCH',
      headers: JSON_CT,
      body: JSON.stringify([]),
    });

    expect(res.status).toBe(400);
    expect(await clientVisibleSentence(res)).toBe('toEntityId is required');
  });

  // ── The two controls that a SyntaxError-sniffing global handler would fail ──

  it('the helper does not swallow a genuine internal error into a 400', async () => {
    // Scoped claim, and the scope is the point: this mounts its own bare app, so
    // it pins the *helper's* behaviour — that it catches only the body read and
    // lets everything after it through. It does NOT prove the assembled app has
    // no blanket error handler; a mutation adding `onError` to createTestApp left
    // this test green, which is how the gap was found. The app-level property is
    // pinned structurally in the last test instead.
    const sub = new Hono();
    sub.post('/boom', async (c) => {
      await readJsonBody<{ a?: number }>(c);
      throw new Error('genuine internal failure');
    });
    const app = new Hono();
    app.route('/api', sub);

    const res = await app.request('/api/boom', {
      method: 'POST',
      headers: JSON_CT,
      body: JSON.stringify({ a: 1 }),
    });

    expect(res.status).toBe(500);
  });

  it('a corrupt stored row is not reported as a malformed request body', async () => {
    // `channels.ts` JSON.parses `source_metadata`. A corrupt row there is a
    // server-side fault about stored data; answering "Request body must be valid
    // JSON" would be a lie about a request that was perfectly well-formed.
    const app = createTestApp();
    const channel = createChannel('corrupt-meta', '');
    getDb()
      .prepare("UPDATE channels SET source = 'claude-code', source_metadata = ? WHERE id = ?")
      .run('{ corrupt stored row', channel.id);

    const res = await app.request(`/api/channels/${channel.id}/project-file`, { method: 'GET' });

    expect(res.status).not.toBe(200);
    expect(await clientVisibleSentence(res)).not.toBe('Request body must be valid JSON');
  });

  // ── Structural: the 16th site cannot be added unguarded and stay quiet ──

  it('no route reads a request body with a bare c.req.json()', () => {
    const routesDir = path.join(__dirname, '..', 'routes');
    const offenders: string[] = [];

    for (const file of fs.readdirSync(routesDir).filter((f) => f.endsWith('.ts'))) {
      // json-body.ts is the one legitimate caller — it *is* the guard.
      if (file === 'json-body.ts') continue;
      const lines = fs.readFileSync(path.join(routesDir, file), 'utf8').split('\n');
      lines.forEach((line, i) => {
        if (line.includes('c.req.json')) offenders.push(`${file}:${i + 1}: ${line.trim()}`);
      });
    }

    expect(offenders).toEqual([]);
  });

  it('the guard is actually wired at every body-reading route site', () => {
    // Pairs with the test above: that one proves the old call is gone, this one
    // proves it was replaced rather than deleted. 15 sites, per Theseus's count.
    const routesDir = path.join(__dirname, '..', 'routes');
    let callSites = 0;

    for (const file of fs.readdirSync(routesDir).filter((f) => f.endsWith('.ts'))) {
      if (file === 'json-body.ts') continue;
      const src = fs.readFileSync(path.join(routesDir, file), 'utf8');
      callSites += (src.match(/await readJsonBody</g) || []).length;
    }

    expect(callSites).toBe(15);
  });

  it('no blanket onError is registered that could flatten 500s into 4xx', () => {
    // The real risk this guards is a future agent "fixing" 500s globally by
    // adding `app.onError`, which would re-break the distinction this round was
    // about: a malformed *request* is the client's fault (400), a genuine
    // internal fault is the server's (500), and a corrupt *stored* row is the
    // latter even though its symptom is also a SyntaxError.
    //
    // This exists because a mutation proved the test above could not see it: an
    // onError added to createTestApp left all 14 checks green.
    //
    // If you are adding an onError deliberately, that may well be right — but
    // make it narrow, and update this test knowingly rather than deleting it.
    const srcDir = path.join(__dirname, '..');
    const guarded = [path.join(srcDir, 'index.ts'), path.join(srcDir, '__tests__', 'app.ts')];

    for (const file of guarded) {
      const src = fs.readFileSync(file, 'utf8');
      expect(src, `${path.basename(file)} registers an onError`).not.toMatch(/\.onError\s*\(/);
    }
  });
});
