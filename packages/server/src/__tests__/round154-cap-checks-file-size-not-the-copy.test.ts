/**
 * Round 154 — the exact per-file cap check reads `file.size`, not the copy.
 *
 * Round 151 shipped `rejectOversizeBeforeRead`, which refuses on Content-Length
 * before `formData()` runs. It deliberately falls through when that header is
 * absent or malformed, and on that fall-through the old code did something
 * measurably wasteful: it spent a full `await file.arrayBuffer()` copy to learn
 * a byte count `file.size` already had, and only then refused.
 *
 * Measured (Round 154, `scripts/probe-accepted-multipart-allocation.mts` arm F,
 * 45.3 MB payload): refusing on `file.size` peaks at 153.8 MB over baseline;
 * refusing on `arrayBuffer.byteLength` peaks at 249.1 MB. The probe owns that
 * number — memory is not assertable here. What IS assertable here, and what
 * these tests pin, is that moving the check did not change the DECISION:
 * an over-cap file with no Content-Length is still refused, still with 400,
 * still with the file-measured message.
 *
 * Why the real bytes. Round 151's tests declare a header and never allocate,
 * because the guard they test decides from the header alone. This one cannot
 * borrow that trick: the check under test reads a parsed `File`, so the body
 * has to be real multipart carrying a real over-cap file. One slow test is the
 * price of testing the fall-through path at all.
 *
 * Not asserted here: anything about what MAX_IMPORT_SIZE's value should be.
 * That ruling is xian's, and these tests track the constant.
 */
import { describe, it, expect, vi } from 'vitest';
import './setup.js';
import { createTestApp } from './app.js';

vi.mock('../claude/client.js', async () => {
  const actual = await vi.importActual('../claude/client.js');
  return { ...actual, streamClaude: vi.fn() };
});

const MAX_IMPORT_SIZE = 50 * 1024 * 1024;

/** Every route that accepts a multipart upload, with the extension it wants. */
const MULTIPART_ROUTES: Array<[string, string]> = [
  ['/api/import/claude-code', 'over-cap.jsonl'],
  ['/api/import/claude-ai', 'over-cap.zip'],
  ['/api/import/claude-ai/preview', 'over-cap.zip'],
  ['/api/import/klatch', 'over-cap.zip'],
];

/**
 * A multipart body carrying an over-cap file and NO usable Content-Length, so
 * Round 151's early guard falls through and the exact check is what decides.
 *
 * `app.request` with a FormData body sets no content-length, which is exactly
 * the fall-through condition — asserted below rather than assumed, because if
 * that ever changed these tests would silently start testing the other guard.
 */
function overCapUpload(filename: string): { req: Request; declaredLength: string | null } {
  const oversize = new Blob([new Uint8Array(MAX_IMPORT_SIZE + 1024)]);
  const fd = new FormData();
  fd.append('file', oversize, filename);
  const req = new Request('http://localhost/x', { method: 'POST', body: fd });
  return { req, declaredLength: req.headers.get('content-length') };
}

describe('Round 154 — the cap check reads file.size on the fall-through path', () => {
  for (const [route, filename] of MULTIPART_ROUTES) {
    it(`${route} still refuses an over-cap file when Content-Length is absent`, async () => {
      const app = createTestApp();
      const { req, declaredLength } = overCapUpload(filename);

      // The premise of this test: Round 151's header guard cannot be what
      // rejects here. If a content-length appears, this is testing the wrong
      // guard and should fail rather than pass for the wrong reason.
      expect(declaredLength).toBeNull();

      const res = await app.request(route, {
        method: 'POST',
        headers: { 'content-type': req.headers.get('content-type')! },
        body: await req.arrayBuffer(),
      });

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toMatch(/too large/i);
      expect(body.error).toContain('50MB');
      // The file-measured message, not the envelope-measured one. Round 151's
      // early guard says "MB uploaded" precisely so the two are tellable apart;
      // seeing that word here would mean the header guard fired after all.
      expect(body.error).not.toContain('uploaded');
    }, 60_000);
  }

  it('reports the file size, not the multipart envelope size', async () => {
    const app = createTestApp();
    const { req } = overCapUpload('over-cap.jsonl');
    const res = await app.request('/api/import/claude-code', {
      method: 'POST',
      headers: { 'content-type': req.headers.get('content-type')! },
      body: await req.arrayBuffer(),
    });

    const body = await res.json();
    // (MAX + 1024) bytes rounds to 50 MB. The envelope is larger; if the
    // message quoted the envelope it would round to 51 or more.
    expect(body.error).toContain('(50MB)');
  }, 60_000);

  it('still accepts an under-cap upload — the change refuses nothing new', async () => {
    const app = createTestApp();
    const small = new Blob([Buffer.from('{"type":"user"}\n', 'utf-8')]);
    const fd = new FormData();
    fd.append('file', small, 'small.jsonl');
    const req = new Request('http://localhost/x', { method: 'POST', body: fd });

    const res = await app.request('/api/import/claude-code', {
      method: 'POST',
      headers: { 'content-type': req.headers.get('content-type')! },
      body: await req.arrayBuffer(),
    });

    const body = await res.json().catch(() => ({}));
    // It may well fail on content — one bare event is not much of a session —
    // but it must not fail on size.
    expect(body.error ?? '').not.toMatch(/too large/i);
  });
});
