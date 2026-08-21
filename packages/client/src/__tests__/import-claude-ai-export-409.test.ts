import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { importClaudeAiExport } from '../api/client';

/**
 * The all-duplicates 409 from POST /import/claude-ai carries a full result
 * body (imported: [], skipped, totalImported: 0, projects) — the find-or-create
 * project pass already ran before the response was built. importClaudeAiExport
 * must return that body as data, not throw, or the caller has nothing to render.
 * Other error responses (400/500, plain { error } bodies) still throw.
 */
describe('importClaudeAiExport — 409 handling', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('resolves (does not throw) on the structured all-duplicates 409', async () => {
    const body = {
      error: 'All conversations already imported',
      imported: [],
      skipped: [{ conversationId: 'c1', reason: 'duplicate' }],
      totalImported: 0,
      totalSkipped: 1,
      projects: [{ uuid: 'p1', name: 'Klatch', matched: true }],
    };
    vi.mocked(global.fetch).mockResolvedValue({
      ok: false,
      status: 409,
      json: async () => body,
    } as Response);

    const result = await importClaudeAiExport(new File(['x'], 'export.zip'));
    expect(result).toEqual(body);
  });

  it('still throws on a non-structured 409 (no imported array)', async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: false,
      status: 409,
      json: async () => ({ error: 'Some other conflict' }),
    } as Response);

    await expect(importClaudeAiExport(new File(['x'], 'export.zip'))).rejects.toThrow('Some other conflict');
  });

  it('still throws on a plain 400 error', async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ error: 'File must be a .zip file' }),
    } as Response);

    await expect(importClaudeAiExport(new File(['x'], 'export.zip'))).rejects.toThrow('File must be a .zip file');
  });
});
