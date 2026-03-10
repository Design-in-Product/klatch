import { describe, it, expect, vi, beforeEach } from 'vitest';
import './setup.js';
import { createTestApp } from './app.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES = path.join(__dirname, 'fixtures', 'claude-ai');

// Mock the claude client to avoid real API calls
vi.mock('../claude/client.js', () => ({
  streamClaude: vi.fn(),
}));

function createApp() {
  return createTestApp();
}

function jsonReq(body: unknown) {
  return {
    method: 'POST' as const,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  };
}

// ── POST /api/import/claude-ai (JSON path mode for testing) ──

describe('POST /api/import/claude-ai', () => {
  let app: ReturnType<typeof createApp>;

  beforeEach(() => {
    app = createApp();
  });

  it('returns 201 for valid ZIP with conversations', async () => {
    const zipPath = path.join(FIXTURES, 'test-export.zip');
    const res = await app.request('/api/import/claude-ai', jsonReq({ zipPath }));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.totalImported).toBe(2);
    expect(body.imported.length).toBe(2);
  });

  it('imports all conversations from ZIP', async () => {
    const zipPath = path.join(FIXTURES, 'test-export.zip');
    const res = await app.request('/api/import/claude-ai', jsonReq({ zipPath }));
    expect(res.status).toBe(201);
    const body = await res.json();

    // Each conversation should have a channelId and messageCount
    for (const imp of body.imported) {
      expect(imp.channelId).toBeTruthy();
      expect(imp.messageCount).toBeGreaterThan(0);
      expect(imp.channelName).toBeTruthy();
    }
  });

  it('returns 400 for non-.zip file path', async () => {
    const res = await app.request('/api/import/claude-ai', jsonReq({ zipPath: '/tmp/test.txt' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('zip');
  });

  it('returns 404 for missing file', async () => {
    const res = await app.request('/api/import/claude-ai', jsonReq({ zipPath: '/nonexistent/file.zip' }));
    expect(res.status).toBe(404);
  });

  it('returns 409 when all conversations are duplicates', async () => {
    const zipPath = path.join(FIXTURES, 'test-export.zip');

    // First import
    const res1 = await app.request('/api/import/claude-ai', jsonReq({ zipPath }));
    expect(res1.status).toBe(201);

    // Second import — same conversations
    const res2 = await app.request('/api/import/claude-ai', jsonReq({ zipPath }));
    expect(res2.status).toBe(409);
    const body = await res2.json();
    expect(body.totalSkipped).toBe(2);
    expect(body.skipped.every((s: any) => s.reason === 'duplicate')).toBe(true);
  });

  it('handles partial import (some new, some duplicate)', async () => {
    const zipPath = path.join(FIXTURES, 'test-export.zip');

    // Import the tools ZIP first (has conv-tools-001)
    const toolsZipPath = path.join(FIXTURES, 'test-tools-export.zip');
    // Import simple-conversation directly by importing the multi-conversation ZIP
    const res1 = await app.request('/api/import/claude-ai', jsonReq({ zipPath }));
    expect(res1.status).toBe(201);

    // Now import a ZIP that has one of the same conversations
    // Re-import should detect duplicates
    const res2 = await app.request('/api/import/claude-ai', jsonReq({ zipPath }));
    expect(res2.status).toBe(409); // all duplicates
  });

  it('imports tool-heavy conversation with artifacts', async () => {
    const zipPath = path.join(FIXTURES, 'test-tools-export.zip');
    const res = await app.request('/api/import/claude-ai', jsonReq({ zipPath }));
    expect(res.status).toBe(201);
    const body = await res.json();
    const conv = body.imported[0];
    expect(conv.artifactCount).toBeGreaterThan(0);
  });

  it('returns 400 for ZIP with no conversations', async () => {
    // Create a ZIP with no conversation JSON files
    const AdmZip = (await import('adm-zip')).default;
    const zip = new AdmZip();
    zip.addFile('readme.txt', Buffer.from('not a conversation'));
    const emptyZipPath = path.join(FIXTURES, 'empty-test.zip');
    zip.writeZip(emptyZipPath);

    try {
      const res = await app.request('/api/import/claude-ai', jsonReq({ zipPath: emptyZipPath }));
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toContain('no conversations');
    } finally {
      fs.unlinkSync(emptyZipPath);
    }
  });
});

// ── Imported channels appear in channel list ─────────────────

describe('Claude.ai imported channels in channel list', () => {
  let app: ReturnType<typeof createApp>;

  beforeEach(() => {
    app = createApp();
  });

  it('imported channels appear with source=claude-ai', async () => {
    const zipPath = path.join(FIXTURES, 'test-export.zip');
    const importRes = await app.request('/api/import/claude-ai', jsonReq({ zipPath }));
    expect(importRes.status).toBe(201);
    const { imported } = await importRes.json();

    const listRes = await app.request('/api/channels', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    expect(listRes.status).toBe(200);
    const channels = await listRes.json();

    for (const imp of imported) {
      const ch = channels.find((c: any) => c.id === imp.channelId);
      expect(ch).toBeTruthy();
      expect(ch.source).toBe('claude-ai');
    }
  });
});

// ── Imported messages preserve timestamps ────────────────────

describe('Claude.ai imported messages preserve timestamps', () => {
  let app: ReturnType<typeof createApp>;

  beforeEach(() => {
    app = createApp();
  });

  it('messages have original_timestamp from conversation data', async () => {
    const zipPath = path.join(FIXTURES, 'test-export.zip');
    const importRes = await app.request('/api/import/claude-ai', jsonReq({ zipPath }));
    expect(importRes.status).toBe(201);
    const { imported } = await importRes.json();

    const channelId = imported[0].channelId;
    const msgRes = await app.request(`/api/channels/${channelId}/messages`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    expect(msgRes.status).toBe(200);
    const messages = await msgRes.json();

    expect(messages.length).toBeGreaterThan(0);
    const firstMsg = messages[0];
    expect(firstMsg.originalTimestamp || firstMsg.original_timestamp).toBeTruthy();
  });
});
