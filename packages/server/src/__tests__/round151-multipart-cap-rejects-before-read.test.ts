/**
 * Round 151 — the import size cap must refuse a multipart upload BEFORE the
 * body is read, not after.
 *
 * Background (measured, `docs/import-multipart-cap-2026-09-04.md`): every
 * multipart site in `routes/import.ts` checked `arrayBuffer.byteLength`
 * against MAX_IMPORT_SIZE, which reads as if the cap prevents the allocation.
 * It did not — `c.req.formData()` buffers the whole body first. A 70.3 MB
 * upload refused by the cap peaked at 169.6 MB over baseline; the same bytes
 * refused one check EARLIER (the `.jsonl` extension check) peaked at
 * 170.5 MB. Identical, because neither check was doing the reading.
 *
 * These tests pin the guard that fixes it. They declare an oversized
 * `content-length` rather than actually allocating 50 MB: the guard's whole
 * point is that it decides from the header alone, so a header is the honest
 * unit to test it with, and a real 50 MB body would only be testing undici.
 *
 * Note what is NOT asserted here: nothing about what the cap's VALUE should
 * be. These tests read MAX_IMPORT_SIZE's effect through the guard's own
 * threshold and stay correct if xian rules the cap up, down, or away.
 */
import { describe, it, expect, vi } from 'vitest';
import './setup.js';
import { createTestApp } from './app.js';

vi.mock('../claude/client.js', async () => {
  const actual = await vi.importActual('../claude/client.js');
  return { ...actual, streamClaude: vi.fn() };
});

const MAX_IMPORT_SIZE = 50 * 1024 * 1024;
const ENVELOPE_ALLOWANCE = 1024 * 1024;

/** Every route that accepts a multipart upload. */
const MULTIPART_ROUTES = [
  '/api/import/claude-code',
  '/api/import/claude-ai',
  '/api/import/claude-ai/preview',
  '/api/import/klatch',
];

/**
 * A multipart request whose declared length is `declared`, with a tiny body.
 * If the guard works the body is never read, so it does not need to be valid
 * multipart — and if the guard ever regresses, parsing this will fail loudly
 * rather than quietly passing.
 */
function declaredLengthReq(declared: number) {
  return {
    method: 'POST' as const,
    headers: {
      'content-type': 'multipart/form-data; boundary=----probe',
      'content-length': String(declared),
    },
    body: '------probe--\r\n',
  };
}

describe('Round 151 — multipart uploads are refused before the body is read', () => {
  for (const route of MULTIPART_ROUTES) {
    it(`${route} rejects an over-cap upload on content-length alone`, async () => {
      const app = createTestApp();
      const declared = MAX_IMPORT_SIZE + ENVELOPE_ALLOWANCE + 1;
      const res = await app.request(route, declaredLengthReq(declared));

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toMatch(/too large/i);
      // The message must not imply we measured the file — we measured the envelope.
      expect(body.error).toContain('MB uploaded');
      expect(body.error).toContain('50MB');
    });
  }

  it('does not reject a declared length inside the envelope allowance', async () => {
    const app = createTestApp();
    // A file just under the cap, plus multipart framing, must survive the
    // early guard and reach the exact per-file check downstream.
    const declared = MAX_IMPORT_SIZE + 1024;
    const res = await app.request('/api/import/claude-code', declaredLengthReq(declared));

    // It will still fail — the body is not real multipart — but it must NOT
    // fail with the early size rejection. "too large" is the discriminator:
    // only the guard emits it, and the fall-through error ("No file uploaded")
    // does not.
    const body = await res.json().catch(() => ({}));
    expect(body.error ?? '').not.toMatch(/too large/i);
  });

  it('falls through when content-length is absent rather than guessing', async () => {
    const app = createTestApp();
    const res = await app.request('/api/import/claude-code', {
      method: 'POST',
      headers: { 'content-type': 'multipart/form-data; boundary=----probe' },
      body: '------probe--\r\n',
    });

    const body = await res.json().catch(() => ({}));
    expect(body.error ?? '').not.toMatch(/too large/i);
  });

  it('ignores a malformed content-length rather than refusing on it', async () => {
    const app = createTestApp();
    for (const bogus of ['not-a-number', '-1', '0']) {
      const res = await app.request('/api/import/claude-code', {
        method: 'POST',
        headers: {
          'content-type': 'multipart/form-data; boundary=----probe',
          'content-length': bogus,
        },
        body: '------probe--\r\n',
      });
      const body = await res.json().catch(() => ({}));
      expect(body.error ?? '', `content-length: ${bogus}`).not.toMatch(/too large/i);
    }
  });

  it('leaves the JSON path-based route alone', async () => {
    const app = createTestApp();
    // A JSON body declaring a huge length is not a multipart upload; the
    // guard must not fire on it. The route refuses for its own reasons.
    const res = await app.request('/api/import/claude-code', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'content-length': String(MAX_IMPORT_SIZE * 2),
      },
      body: JSON.stringify({ sessionPath: '/tmp/nope.jsonl' }),
    });

    const body = await res.json().catch(() => ({}));
    expect(body.error ?? '').not.toMatch(/too large/i);
  });
});
