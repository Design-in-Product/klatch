import { describe, it, expect, vi, beforeEach } from 'vitest';
import './setup.js';
import { createTestApp } from './app.js';
import path from 'path';
import fs from 'fs';
import AdmZip from 'adm-zip';
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

/** Helper: create a ZIP buffer with given conversations and optional extras */
function makeTestZip(opts?: {
  conversations?: Array<{ uuid: string; name: string; messages?: number; project_uuid?: string }>;
  projects?: Array<{ uuid: string; name: string; docs?: unknown[] }>;
  memories?: Array<{ uuid: string; content: string; created_at?: string }>;
}): Buffer {
  const zip = new AdmZip();
  const convs = (opts?.conversations ?? [
    { uuid: 'conv-aaa', name: 'First Chat', messages: 2 },
    { uuid: 'conv-bbb', name: 'Second Chat', messages: 4 },
    { uuid: 'conv-ccc', name: 'Third Chat', messages: 6 },
  ]).map((c) => ({
    uuid: c.uuid,
    name: c.name,
    created_at: '2026-01-15T10:00:00.000Z',
    updated_at: '2026-01-15T10:05:00.000Z',
    project_uuid: c.project_uuid,
    chat_messages: Array.from({ length: c.messages ?? 2 }, (_, i) => ({
      uuid: `${c.uuid}-msg-${i}`,
      text: `Message ${i}`,
      sender: i % 2 === 0 ? 'human' : 'assistant',
      created_at: `2026-01-15T10:0${i}:00.000Z`,
      content: [{ type: 'text', text: `Message ${i}` }],
    })),
  }));
  zip.addFile('conversations.json', Buffer.from(JSON.stringify(convs)));

  if (opts?.projects) {
    zip.addFile('projects.json', Buffer.from(JSON.stringify(opts.projects)));
  }
  if (opts?.memories) {
    zip.addFile('memories.json', Buffer.from(JSON.stringify(opts.memories)));
  }
  return zip.toBuffer();
}

function writeTestZip(name: string, buf: Buffer): string {
  const zipPath = path.join(FIXTURES, name);
  fs.writeFileSync(zipPath, buf);
  return zipPath;
}

// ── POST /api/import/claude-ai/preview ──────────────────────

describe('POST /api/import/claude-ai/preview', () => {
  let app: ReturnType<typeof createApp>;

  beforeEach(() => {
    app = createApp();
  });

  it('returns conversation metadata from ZIP', async () => {
    const zipPath = writeTestZip('preview-test.zip', makeTestZip());
    try {
      const res = await app.request('/api/import/claude-ai/preview', jsonReq({ zipPath }));
      expect(res.status).toBe(200);
      const body = await res.json();

      expect(body.conversations).toHaveLength(3);
      expect(body.conversations[0].uuid).toBe('conv-aaa');
      expect(body.conversations[0].name).toBe('First Chat');
      expect(body.conversations[0].messageCount).toBe(2);
      expect(body.conversations[0].alreadyImported).toBe(false);
    } finally {
      fs.unlinkSync(zipPath);
    }
  });

  it('detects already-imported conversations', async () => {
    const zipBuf = makeTestZip();
    const zipPath = writeTestZip('preview-dedup.zip', zipBuf);
    try {
      // Import first
      const importRes = await app.request('/api/import/claude-ai', jsonReq({ zipPath }));
      expect(importRes.status).toBe(201);

      // Preview — should detect duplicates
      const res = await app.request('/api/import/claude-ai/preview', jsonReq({ zipPath }));
      expect(res.status).toBe(200);
      const body = await res.json();

      expect(body.conversations.every((c: any) => c.alreadyImported)).toBe(true);
      expect(body.conversations[0].existingChannelId).toBeTruthy();
    } finally {
      fs.unlinkSync(zipPath);
    }
  });

  it('returns project metadata', async () => {
    const zipBuf = makeTestZip({
      conversations: [{ uuid: 'c1', name: 'Chat', project_uuid: 'proj-1' }],
      projects: [{ uuid: 'proj-1', name: 'My Project', docs: [{}, {}] }],
    });
    const zipPath = writeTestZip('preview-projects.zip', zipBuf);
    try {
      const res = await app.request('/api/import/claude-ai/preview', jsonReq({ zipPath }));
      expect(res.status).toBe(200);
      const body = await res.json();

      expect(body.projects).toHaveLength(1);
      expect(body.projects[0].name).toBe('My Project');
      expect(body.projects[0].documentCount).toBe(2);
      // Conversation should reference project name
      expect(body.conversations[0].projectName).toBe('My Project');
    } finally {
      fs.unlinkSync(zipPath);
    }
  });

  it('returns memory metadata with truncation', async () => {
    const longContent = 'A'.repeat(300);
    const zipBuf = makeTestZip({
      conversations: [{ uuid: 'c1', name: 'Chat' }],
      memories: [
        { uuid: 'mem-1', content: 'Short memory', created_at: '2026-01-15T10:00:00.000Z' },
        { uuid: 'mem-2', content: longContent, created_at: '2026-01-15T11:00:00.000Z' },
      ],
    });
    const zipPath = writeTestZip('preview-memories.zip', zipBuf);
    try {
      const res = await app.request('/api/import/claude-ai/preview', jsonReq({ zipPath }));
      expect(res.status).toBe(200);
      const body = await res.json();

      expect(body.memories).toHaveLength(2);
      expect(body.memories[0].content).toBe('Short memory');
      // Long memory should be truncated
      expect(body.memories[1].content.length).toBeLessThan(300);
      expect(body.memories[1].content).toContain('...');
    } finally {
      fs.unlinkSync(zipPath);
    }
  });

  it('returns 400 for non-ZIP file', async () => {
    const res = await app.request('/api/import/claude-ai/preview', jsonReq({ zipPath: '/tmp/test.txt' }));
    expect(res.status).toBe(400);
  });

  it('returns 404 for missing file', async () => {
    const res = await app.request('/api/import/claude-ai/preview', jsonReq({ zipPath: '/nonexistent/file.zip' }));
    expect(res.status).toBe(404);
  });

  it('does not create any channels (preview only)', async () => {
    const zipBuf = makeTestZip();
    const zipPath = writeTestZip('preview-nodb.zip', zipBuf);
    try {
      const res = await app.request('/api/import/claude-ai/preview', jsonReq({ zipPath }));
      expect(res.status).toBe(200);

      // Check that no new channels were created (only the default 'general' channel)
      const listRes = await app.request('/api/channels');
      const channels = await listRes.json();
      expect(channels).toHaveLength(1);
      expect(channels[0].name).toBe('general');
    } finally {
      fs.unlinkSync(zipPath);
    }
  });
});

// ── Selective import (selectedConversationIds) ──────────────

describe('POST /api/import/claude-ai — selective import', () => {
  let app: ReturnType<typeof createApp>;

  beforeEach(() => {
    app = createApp();
  });

  it('imports only selected conversations when selectedConversationIds is provided', async () => {
    const zipBuf = makeTestZip();
    const zipPath = writeTestZip('selective-test.zip', zipBuf);
    try {
      const res = await app.request('/api/import/claude-ai', jsonReq({
        zipPath,
        selectedConversationIds: ['conv-aaa', 'conv-ccc'],
      }));
      expect(res.status).toBe(201);
      const body = await res.json();

      expect(body.totalImported).toBe(2);
      const importedIds = body.imported.map((i: any) => i.conversationId);
      expect(importedIds).toContain('conv-aaa');
      expect(importedIds).toContain('conv-ccc');
      expect(importedIds).not.toContain('conv-bbb');
    } finally {
      fs.unlinkSync(zipPath);
    }
  });

  it('imports a single selected conversation', async () => {
    const zipBuf = makeTestZip();
    const zipPath = writeTestZip('selective-single.zip', zipBuf);
    try {
      const res = await app.request('/api/import/claude-ai', jsonReq({
        zipPath,
        selectedConversationIds: ['conv-bbb'],
      }));
      expect(res.status).toBe(201);
      const body = await res.json();

      expect(body.totalImported).toBe(1);
      expect(body.imported[0].conversationId).toBe('conv-bbb');
    } finally {
      fs.unlinkSync(zipPath);
    }
  });

  it('imports all when selectedConversationIds is omitted (backward compat)', async () => {
    const zipBuf = makeTestZip();
    const zipPath = writeTestZip('selective-all.zip', zipBuf);
    try {
      const res = await app.request('/api/import/claude-ai', jsonReq({ zipPath }));
      expect(res.status).toBe(201);
      const body = await res.json();

      expect(body.totalImported).toBe(3);
    } finally {
      fs.unlinkSync(zipPath);
    }
  });

  it('returns 400 when all selected conversations are empty or missing', async () => {
    const zipBuf = makeTestZip();
    const zipPath = writeTestZip('selective-miss.zip', zipBuf);
    try {
      const res = await app.request('/api/import/claude-ai', jsonReq({
        zipPath,
        selectedConversationIds: ['nonexistent-uuid'],
      }));
      // No conversations matched the selection → "No valid conversations found"
      expect(res.status).toBe(400);
    } finally {
      fs.unlinkSync(zipPath);
    }
  });

  it('still dedup-checks selected conversations', async () => {
    const zipBuf = makeTestZip();
    const zipPath = writeTestZip('selective-dedup.zip', zipBuf);
    try {
      // First import conv-aaa
      const res1 = await app.request('/api/import/claude-ai', jsonReq({
        zipPath,
        selectedConversationIds: ['conv-aaa'],
      }));
      expect(res1.status).toBe(201);

      // Try to import conv-aaa again — should be skipped as duplicate
      const res2 = await app.request('/api/import/claude-ai', jsonReq({
        zipPath,
        selectedConversationIds: ['conv-aaa'],
      }));
      expect(res2.status).toBe(409);
      const body = await res2.json();
      expect(body.skipped[0].reason).toBe('duplicate');
    } finally {
      fs.unlinkSync(zipPath);
    }
  });

  it('mixes selected new + duplicate correctly', async () => {
    const zipBuf = makeTestZip();
    const zipPath = writeTestZip('selective-mix.zip', zipBuf);
    try {
      // Import conv-aaa first
      await app.request('/api/import/claude-ai', jsonReq({
        zipPath,
        selectedConversationIds: ['conv-aaa'],
      }));

      // Import both conv-aaa (dup) and conv-bbb (new)
      const res = await app.request('/api/import/claude-ai', jsonReq({
        zipPath,
        selectedConversationIds: ['conv-aaa', 'conv-bbb'],
      }));
      expect(res.status).toBe(201);
      const body = await res.json();

      expect(body.totalImported).toBe(1);
      expect(body.totalSkipped).toBe(1);
      expect(body.imported[0].conversationId).toBe('conv-bbb');
      expect(body.skipped[0].conversationId).toBe('conv-aaa');
    } finally {
      fs.unlinkSync(zipPath);
    }
  });
});

// ── ZIP extractor: memories extraction ──────────────────────

describe('extractFromZip — memories', () => {
  it('extracts memories from memories.json', async () => {
    const { extractFromZip } = await import('../import/claude-ai-zip.js');
    const zip = new AdmZip();
    zip.addFile('conversations.json', Buffer.from(JSON.stringify([])));
    zip.addFile('memories.json', Buffer.from(JSON.stringify([
      { uuid: 'm1', content: 'Remember this', created_at: '2026-01-15T10:00:00.000Z' },
      { uuid: 'm2', content: 'And this too' },
    ])));

    const result = extractFromZip(zip.toBuffer());
    expect(result.memories).toHaveLength(2);
    expect(result.memories[0].uuid).toBe('m1');
    expect(result.memories[0].content).toBe('Remember this');
    expect(result.memories[0].createdAt).toBe('2026-01-15T10:00:00.000Z');
  });

  it('handles memories with id instead of uuid', async () => {
    const { extractFromZip } = await import('../import/claude-ai-zip.js');
    const zip = new AdmZip();
    zip.addFile('conversations.json', Buffer.from(JSON.stringify([])));
    zip.addFile('memories.json', Buffer.from(JSON.stringify([
      { id: 'alt-id', text: 'Alt format memory' },
    ])));

    const result = extractFromZip(zip.toBuffer());
    expect(result.memories).toHaveLength(1);
    expect(result.memories[0].uuid).toBe('alt-id');
    expect(result.memories[0].content).toBe('Alt format memory');
  });

  it('returns empty memories when no memories.json exists', async () => {
    const { extractFromZip } = await import('../import/claude-ai-zip.js');
    const zip = new AdmZip();
    zip.addFile('conversations.json', Buffer.from(JSON.stringify([])));

    const result = extractFromZip(zip.toBuffer());
    expect(result.memories).toHaveLength(0);
  });

  it('extracts project document counts', async () => {
    const { extractFromZip } = await import('../import/claude-ai-zip.js');
    const zip = new AdmZip();
    zip.addFile('conversations.json', Buffer.from(JSON.stringify([])));
    zip.addFile('projects.json', Buffer.from(JSON.stringify([
      { uuid: 'p1', name: 'Project A', docs: [{}, {}, {}] },
      { uuid: 'p2', name: 'Project B' }, // no docs array
    ])));

    const result = extractFromZip(zip.toBuffer());
    expect(result.projects.get('p1')?.documentCount).toBe(3);
    expect(result.projects.get('p2')?.documentCount).toBe(0);
  });
});
