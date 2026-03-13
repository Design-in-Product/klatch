import { describe, it, expect, vi, beforeEach } from 'vitest';
import './setup.js';
import { createTestApp } from './app.js';
import { insertMessage } from '../db/queries.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES = path.join(__dirname, 'fixtures');

// Mock the claude client to avoid real API calls
vi.mock('../claude/client.js', () => ({
  streamClaude: vi.fn(),
}));

function createApp() {
  return createTestApp();
}

function req(method: string, path: string, body?: unknown) {
  const init: RequestInit = { method, headers: { 'Content-Type': 'application/json' } };
  if (body) init.body = JSON.stringify(body);
  return init;
}

// ── POST /api/import/claude-code ────────────────────────────────

describe('POST /api/import/claude-code', () => {
  let app: ReturnType<typeof createApp>;

  beforeEach(() => {
    app = createApp();
  });

  it('returns 201 with ImportResult for valid session file', async () => {
    const sessionPath = path.join(FIXTURES, 'simple-session.jsonl');
    const res = await app.request(
      '/api/import/claude-code',
      req('POST', '/api/import/claude-code', { sessionPath })
    );
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.channelId).toBeTruthy();
    expect(body.messageCount).toBe(4); // 2 user + 2 assistant
    expect(body.sessionId).toBe('sess-simple-001');
  });

  it('returns 404 for missing file', async () => {
    const res = await app.request(
      '/api/import/claude-code',
      req('POST', '/api/import/claude-code', { sessionPath: '/nonexistent/file.jsonl' })
    );
    expect(res.status).toBe(404);
  });

  it('returns 400 for non-.jsonl file', async () => {
    const res = await app.request(
      '/api/import/claude-code',
      req('POST', '/api/import/claude-code', { sessionPath: '/tmp/test.txt' })
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('jsonl');
  });

  it('returns 400 for empty session (no conversation events)', async () => {
    // Create a fixture with only non-conversation events
    const emptySessionPath = path.join(FIXTURES, 'empty-session-temp.jsonl');
    const fs = await import('fs');
    fs.writeFileSync(
      emptySessionPath,
      '{"type":"file-history-snapshot","uuid":"snap-001","timestamp":"2026-01-15T10:00:00.000Z","snapshot":{}}\n'
    );
    try {
      const res = await app.request(
        '/api/import/claude-code',
        req('POST', '/api/import/claude-code', { sessionPath: emptySessionPath })
      );
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toContain('empty');
    } finally {
      fs.unlinkSync(emptySessionPath);
    }
  });

  it('returns 409 with conflict info for duplicate session import', async () => {
    const sessionPath = path.join(FIXTURES, 'simple-session.jsonl');

    // First import should succeed
    const res1 = await app.request(
      '/api/import/claude-code',
      req('POST', '/api/import/claude-code', { sessionPath })
    );
    expect(res1.status).toBe(201);

    // Second import of same session should return structured conflict info
    const res2 = await app.request(
      '/api/import/claude-code',
      req('POST', '/api/import/claude-code', { sessionPath })
    );
    expect(res2.status).toBe(409);
    const body = await res2.json();
    expect(body.error).toBe('duplicate');
    expect(body.existingChannelId).toBeTruthy();
    expect(body.existingChannelName).toBeTruthy();
    expect(body.existingMessageCount).toBeGreaterThan(0);
    expect(body.hasNewMessages).toBe(false);
    expect(body.nativeMessageCount).toBe(0);
    expect(body.sessionId).toBe('sess-simple-001');
  });

  it('allows re-import with forceImport flag (fork-again)', async () => {
    const sessionPath = path.join(FIXTURES, 'simple-session.jsonl');

    // First import
    const res1 = await app.request(
      '/api/import/claude-code',
      req('POST', '/api/import/claude-code', { sessionPath })
    );
    expect(res1.status).toBe(201);
    const first = await res1.json();

    // Second import with forceImport — should succeed as a new channel
    const res2 = await app.request(
      '/api/import/claude-code',
      req('POST', '/api/import/claude-code', { sessionPath, forceImport: true })
    );
    expect(res2.status).toBe(201);
    const second = await res2.json();
    expect(second.channelId).not.toBe(first.channelId);
    // Channel name should have disambiguation suffix
    expect(second.channelName).toMatch(/\(2\)$/);
  });

  it('increments suffix for multiple fork-again imports', async () => {
    const sessionPath = path.join(FIXTURES, 'simple-session.jsonl');

    // Import three times with forceImport
    await app.request('/api/import/claude-code', req('POST', '/api/import/claude-code', { sessionPath }));
    await app.request('/api/import/claude-code', req('POST', '/api/import/claude-code', { sessionPath, forceImport: true }));
    const res3 = await app.request(
      '/api/import/claude-code',
      req('POST', '/api/import/claude-code', { sessionPath, forceImport: true })
    );
    expect(res3.status).toBe(201);
    const body = await res3.json();
    expect(body.channelName).toMatch(/\(3\)$/);
  });

  it('detects hasNewMessages when native messages exist in channel', async () => {
    const sessionPath = path.join(FIXTURES, 'simple-session.jsonl');

    // Import the session
    const res1 = await app.request(
      '/api/import/claude-code',
      req('POST', '/api/import/claude-code', { sessionPath })
    );
    expect(res1.status).toBe(201);
    const first = await res1.json();

    // Add a native message to the imported channel
    insertMessage(first.channelId, 'user', 'A new message');

    // Try to re-import — should show hasNewMessages: true
    const res2 = await app.request(
      '/api/import/claude-code',
      req('POST', '/api/import/claude-code', { sessionPath })
    );
    expect(res2.status).toBe(409);
    const conflict = await res2.json();
    expect(conflict.hasNewMessages).toBe(true);
    expect(conflict.nativeMessageCount).toBe(1);
    expect(conflict.existingMessageCount).toBe(5); // 4 imported + 1 native
  });

  it('uses channelName when provided', async () => {
    const sessionPath = path.join(FIXTURES, 'simple-session.jsonl');
    const res = await app.request(
      '/api/import/claude-code',
      req('POST', '/api/import/claude-code', { sessionPath, channelName: 'my-import' })
    );
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.channelName).toBe('my-import');
  });

  it('imports tool-heavy session with artifacts', async () => {
    const sessionPath = path.join(FIXTURES, 'tool-heavy-session.jsonl');
    const res = await app.request(
      '/api/import/claude-code',
      req('POST', '/api/import/claude-code', { sessionPath })
    );
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.channelId).toBeTruthy();
    expect(body.artifactCount).toBeGreaterThan(0);
  });

  it('handles malformed JSONL gracefully (imports valid events)', async () => {
    const sessionPath = path.join(FIXTURES, 'malformed.jsonl');
    const res = await app.request(
      '/api/import/claude-code',
      req('POST', '/api/import/claude-code', { sessionPath })
    );
    expect(res.status).toBe(201);
    const body = await res.json();
    // malformed.jsonl has 4 valid conversation events (2 turns)
    expect(body.messageCount).toBe(4);
  });
});

// ── Imported channel appears in GET /channels ───────────────────

describe('Imported channels in channel list', () => {
  let app: ReturnType<typeof createApp>;

  beforeEach(() => {
    app = createApp();
  });

  it('imported channel appears in GET /api/channels with source=claude-code', async () => {
    const sessionPath = path.join(FIXTURES, 'simple-session.jsonl');

    // Import the session
    const importRes = await app.request(
      '/api/import/claude-code',
      req('POST', '/api/import/claude-code', { sessionPath })
    );
    expect(importRes.status).toBe(201);
    const { channelId } = await importRes.json();

    // Fetch channels
    const listRes = await app.request('/api/channels', req('GET', '/api/channels'));
    expect(listRes.status).toBe(200);
    const channels = await listRes.json();

    const imported = channels.find((c: { id: string }) => c.id === channelId);
    expect(imported).toBeTruthy();
    expect(imported.source).toBe('claude-code');
  });
});

// ── Imported messages have original timestamps ──────────────────

describe('Imported messages preserve timestamps', () => {
  let app: ReturnType<typeof createApp>;

  beforeEach(() => {
    app = createApp();
  });

  it('messages have original_timestamp from JSONL events', async () => {
    const sessionPath = path.join(FIXTURES, 'simple-session.jsonl');

    // Import the session
    const importRes = await app.request(
      '/api/import/claude-code',
      req('POST', '/api/import/claude-code', { sessionPath })
    );
    expect(importRes.status).toBe(201);
    const { channelId } = await importRes.json();

    // Fetch messages for the imported channel
    const msgRes = await app.request(
      `/api/channels/${channelId}/messages`,
      req('GET', `/api/channels/${channelId}/messages`)
    );
    expect(msgRes.status).toBe(200);
    const messages = await msgRes.json();

    // Should have messages with original timestamps from the fixture
    expect(messages.length).toBeGreaterThan(0);
    // First message should have the original timestamp from the JSONL
    const firstMsg = messages[0];
    expect(firstMsg.originalTimestamp || firstMsg.original_timestamp).toBeTruthy();
  });
});
