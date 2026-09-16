/**
 * Round 220 — the file-size cap has one definition, and every sentence about it
 * is derived rather than written down.
 *
 * ## The finding this closes
 *
 * Theseus, Round 219 §6(a), driven at the wire: `files.ts`'s pre-read check
 * derived its limit from `MAX_FILE_SIZE_BYTES` while `storage.ts:52` hardcoded
 * `Maximum is 10 MB.` in the sentence three steps later. *"They agree today only
 * because the constant is 10 MB.*" Re-size the constant and the same user, about
 * the same file, is told two different limits by two checks in the same request.
 *
 * ## What the fire found past that ask — there was a third enforcer
 *
 * `client/src/components/MessageInput.tsx:117` held **both** halves as literals:
 * `file.size > 10 * 1024 * 1024` and `'... Maximum size is 10 MB.'`. That is the
 * gate a user meets *first*, and it is worse than a disagreeing sentence: raise
 * the server cap and the attach button keeps refusing files the server would
 * take, with no error anywhere, because the request is never sent. Hence the cap
 * moved to `@klatch/shared` rather than being re-derived inside the server.
 *
 * ## Why this file mocks the constant instead of reading it
 *
 * A check that asks "does the sentence say what `formatFileSizeLimit(cap)` says"
 * passes whether the sentence derives the number or hardcodes it, because at
 * 10 MB the two are the same string — Theseus's §6(a) again: *"the control you
 * rebuilt in mutation 5 — reading both sentences out of the product — passes
 * either way at 10 MB. Only mutating the constant shows it."* So this file runs
 * the whole server-side cap at **2.5 MB**, a value no literal in the tree holds,
 * and the control at the shipped 10 MB already exists in
 * `round218-...test.ts:263-264`.
 *
 * 2.5 MB is also deliberately fractional, which exercises the other half of
 * `formatFileSizeLimit`: a whole-MB cap must print `10 MB`, not `10.0 MB`, or
 * this change would have silently reworded every existing refusal.
 */
import { describe, it, expect, vi } from 'vitest';

const MOCK_CAP = vi.hoisted(() => 2.5 * 1024 * 1024);

vi.mock('@klatch/shared', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@klatch/shared')>()),
  MAX_FILE_SIZE_BYTES: MOCK_CAP,
}));

vi.mock('../claude/client.js', () => ({
  streamClaude: vi.fn(),
  streamClaudeRoundtable: vi.fn(),
  activeStreams: new Map(),
  abortStream: vi.fn(() => false),
}));

const { createTestApp } = await import('./app.js');
const { validateFile, MAX_FILE_SIZE_BYTES } = await import('../files/storage.js');
const { formatFileSizeLimit } = await import('@klatch/shared');

/** Recover the sentence the way `api/client.ts` does — a text/plain body yields null. */
async function sentence(res: Response): Promise<string | null> {
  const detail = await res.json().catch(() => null);
  return detail?.error ?? null;
}

/**
 * Pull the `Maximum is …` clause out of whatever sentence a check produced.
 *
 * The first version of this was `/Maximum is ([^.]+\.)/` and returned `2.`,
 * because the fractional cap's own decimal point ends the match. That bug is
 * only visible at a fractional cap — at 10 MB or 20 MB it would have read
 * correctly and this helper would have looked fine. Recorded because it is the
 * same shape as the thing under test: a check that agrees with the product for
 * one value of a constant and not for others.
 */
function limitClause(s: string | null): string | null {
  return s?.match(/Maximum is (.+)\.$/)?.[1] ?? null;
}

const MULTIPART_CT = 'multipart/form-data; boundary=----X';
const UNPARSEABLE = 'not a multipart body';
const LYING_CONTENT_LENGTH = 200 * 1024 * 1024;

const OVERSIZE: RequestInit = {
  method: 'POST',
  headers: { 'Content-Type': MULTIPART_CT, 'Content-Length': String(LYING_CONTENT_LENGTH) },
  body: UNPARSEABLE,
};

// ── 1. The formatter, driven off-value ──────────────────────────────────────

describe('Round 220 — formatFileSizeLimit', () => {
  it('prints whole megabytes without a decimal', () => {
    // The compatibility requirement. Every shipped refusal says `10 MB`; a
    // formatter that returned `10.0 MB` would pass any test written against
    // itself and reword the product.
    expect(formatFileSizeLimit(10 * 1024 * 1024)).toBe('10 MB');
    expect(formatFileSizeLimit(50 * 1024 * 1024)).toBe('50 MB');
  });

  it('keeps one decimal for a fractional cap', () => {
    expect(formatFileSizeLimit(2.5 * 1024 * 1024)).toBe('2.5 MB');
  });

  it('has no default cap — the argument is required', () => {
    // Written first as `expect(formatFileSizeLimit()).toBe(…)` and it FAILED,
    // returning `10 MB` under the 2.5 MB mock. A default parameter binds the
    // *declaring* module's constant, which `vi.mock` does not replace — so the
    // defaulted call and every production call would have been answering about
    // two different limits. That is the Round 219 §6(a) defect one layer down,
    // in the helper written to fix it. The default was removed; this is the
    // structural check that it stays removed.
    expect(formatFileSizeLimit.length).toBe(1);
  });
});

// ── 2. Both server enforcers move with the constant ─────────────────────────

describe('Round 220 — the cap is read, not written down', () => {
  it('the constant this server is running is the mocked one, not 10 MB', () => {
    // States the premise the rest of the file depends on. Without it, a mock
    // that silently failed to apply would leave every check below passing
    // against the shipped 10 MB and asserting nothing.
    expect(MAX_FILE_SIZE_BYTES).toBe(MOCK_CAP);
    expect(MAX_FILE_SIZE_BYTES).not.toBe(10 * 1024 * 1024);
  });

  it('validateFile refuses at the mocked cap — the threshold derives, not just the label', () => {
    // 3 MB is under the shipped 10 MB cap. If `storage.ts` still held its own
    // constant, this file would be accepted here.
    const refused = validateFile(Buffer.alloc(3 * 1024 * 1024), 'text/plain', 'big.txt');

    expect(refused.valid).toBe(false);
    expect(refused.valid === false && refused.reason).toBe(
      'File too large (3.0 MB). Maximum is 2.5 MB.'
    );
  });

  it('validateFile still accepts a file under the mocked cap', () => {
    // The other side of the boundary. Without it, "refuses at 3 MB" is
    // satisfied by a validator that refuses everything.
    expect(validateFile(Buffer.alloc(2 * 1024 * 1024), 'text/plain', 'ok.txt').valid).toBe(true);
  });

  it('the pre-read header check names the mocked cap too', async () => {
    const res = await createTestApp().request('/api/channels/any/files', OVERSIZE);

    expect(res.status).toBe(400);
    expect(await sentence(res)).toBe('File too large (200.0 MB uploaded). Maximum is 2.5 MB.');
  });

  it('and the two checks name the SAME limit at a cap neither one hardcodes', async () => {
    // The property Theseus's §6(a) asked for, stated where it can fail. Both
    // clauses are recovered from the product — one from a real HTTP response,
    // one from `validateFile` — and compared to each other *and* to the mocked
    // cap, so neither "both hardcode 10 MB" nor "both hardcode 2.5 MB" passes.
    const fromHeader = limitClause(
      await sentence(await createTestApp().request('/api/channels/any/files', OVERSIZE))
    );
    const exact = validateFile(Buffer.alloc(3 * 1024 * 1024), 'text/plain', 'big.txt');
    const fromExact = limitClause(exact.valid === false ? exact.reason : null);

    expect(fromHeader).toBe('2.5 MB');
    expect(fromExact).toBe(fromHeader);
  });

  it('the two sentences are still tellable apart — sharing a number is not sharing a voice', async () => {
    // The distinction Round 218 built and Theseus verified at the wire: only
    // the header check says "uploaded". Centralising the *cap* must not have
    // collapsed the two refusals into one string, because that word is how a
    // reader knows which check answered.
    const fromHeader = await sentence(
      await createTestApp().request('/api/channels/any/files', OVERSIZE)
    );
    const exact = validateFile(Buffer.alloc(3 * 1024 * 1024), 'text/plain', 'big.txt');
    const fromExact = exact.valid === false ? exact.reason : null;

    expect(fromHeader).toContain('uploaded');
    expect(fromExact).not.toContain('uploaded');
    expect(fromHeader).not.toBe(fromExact);
  });
});

// ── 3. Control: the import family kept its own voice ────────────────────────

describe('Round 220 — control: import.ts was not swept up in this', () => {
  it('the import cap is unrelated to the file cap and still says 50MB', async () => {
    // `size-cap.ts`'s docstring says the two route families word their
    // refusals differently on purpose. A refactor that centralised "the size
    // sentence" instead of "the file cap" would show up here: import's
    // rounded, space-less `50MB` is a different format from files' `2.5 MB`,
    // and its number must not have moved with the mock.
    const res = await createTestApp().request('/api/import/claude-ai', {
      method: 'POST',
      headers: {
        'Content-Type': MULTIPART_CT,
        'Content-Length': String(LYING_CONTENT_LENGTH),
      },
      body: UNPARSEABLE,
    });

    expect(res.status).toBe(400);
    expect(await sentence(res)).toBe('File too large (200MB uploaded). Maximum is 50MB.');
  });
});
