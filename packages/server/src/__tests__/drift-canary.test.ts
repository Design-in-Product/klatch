/**
 * The drift canary, tested directly.
 *
 * A Claude Code schema change that empties every turn while preserving turn boundaries
 * used to return `201 Created, messageCount: 0` — a successful import of nothing.
 *
 * That state is not reachable through a real transcript today, because boundary detection
 * and content extraction agree about what a text block is. The canary exists for the case
 * where a future format change makes them DISAGREE — boundaries still found, content no
 * longer recognized — which is the shape the vendor's own disclaimer warns about.
 *
 * So the guard is exercised here by forcing importSession to report zero messages, rather
 * than by fabricating a file that cannot currently exist. An untested guard against silent
 * failure would be its own instance of the problem this pipeline was just audited for.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import './setup.js';
import fs from 'fs';
import os from 'os';
import path from 'path';

vi.mock('../claude/client.js', () => ({ streamClaude: vi.fn() }));

vi.mock('../db/queries.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../db/queries.js')>();
  return {
    ...actual,
    importSession: vi.fn((...args: Parameters<typeof actual.importSession>) => {
      const real = actual.importSession(...args);
      return { ...real, messageCount: 0 }; // simulate a parser that produced no content
    }),
  };
});

const { createTestApp } = await import('./app.js');

describe('drift canary', () => {
  let tmpFile: string;

  beforeEach(() => {
    tmpFile = path.join(os.tmpdir(), `klatch-drift-${Date.now()}-${Math.random().toString(36).slice(2)}.jsonl`);
    fs.writeFileSync(tmpFile, [
      JSON.stringify({
        type: 'user', uuid: 'u1', parentUuid: null, sessionId: 'drift-session',
        timestamp: '2026-03-01T09:00:00.000Z', permissionMode: 'default',
        cwd: '/tmp/nonexistent-drift', version: '2.1.99',
        message: { role: 'user', content: 'a question that parses' },
      }),
    ].join('\n'), 'utf-8');
  });

  afterEach(() => {
    try { fs.unlinkSync(tmpFile); } catch { /* best effort */ }
  });

  it('returns 422, not 201, when turns parsed but no message was written', async () => {
    const app = createTestApp();
    const res = await app.request('/api/import/claude-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionPath: tmpFile }),
    });

    expect(res.status).toBe(422);
    const body = await res.json() as {
      error: string; turnsParsed: number; versionsSeen: string[];
      integrity: { turnsEmitted: number; boundaryMode: string };
    };
    expect(body.error).toContain('no messages');
    expect(body.turnsParsed).toBe(1);
    expect(body.versionsSeen).toEqual(['2.1.99']);
    expect(body.integrity.turnsEmitted).toBe(1);
    expect(body.integrity.boundaryMode).toBe('permissionMode');
  });

  it('says plainly that nothing was written', async () => {
    const app = createTestApp();
    const res = await app.request('/api/import/claude-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionPath: tmpFile }),
    });
    const body = await res.json() as { error: string };
    expect(body.error).toContain('Nothing was written');
    expect(body.error).toContain('format has changed');
  });
});
