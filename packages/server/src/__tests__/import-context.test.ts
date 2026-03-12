import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import './setup.js';
import { createTestApp } from './app.js';
import fs from 'fs';
import os from 'os';
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

// ── CLAUDE.md + MEMORY.md capture at import time ─────────────────

describe('Import context capture (CLAUDE.md + MEMORY.md)', () => {
  let app: ReturnType<typeof createApp>;
  let tempDir: string;
  let cleanupPaths: string[];

  beforeEach(() => {
    app = createApp();
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'klatch-test-'));
    cleanupPaths = [tempDir];
  });

  afterEach(() => {
    // Clean up temp directories
    for (const p of cleanupPaths) {
      fs.rmSync(p, { recursive: true, force: true });
    }
  });

  /**
   * Create a minimal JSONL session fixture that points to a given cwd.
   * Uses a unique sessionId to avoid dedup conflicts between tests.
   */
  function createSessionFixture(cwd: string, sessionId: string): string {
    const fixturePath = path.join(tempDir, `${sessionId}.jsonl`);
    const events = [
      JSON.stringify({
        parentUuid: null,
        userType: 'external',
        cwd,
        sessionId,
        version: '2.1.19',
        gitBranch: 'main',
        slug: 'test-context-capture',
        type: 'user',
        message: { role: 'user', content: 'Hello' },
        uuid: `${sessionId}-evt-001`,
        timestamp: '2026-01-15T10:00:00.000Z',
      }),
      JSON.stringify({
        parentUuid: `${sessionId}-evt-001`,
        userType: 'external',
        cwd,
        sessionId,
        version: '2.1.19',
        gitBranch: 'main',
        slug: 'test-context-capture',
        message: {
          model: 'claude-opus-4-6',
          id: `msg_${sessionId}_001`,
          type: 'message',
          role: 'assistant',
          content: [{ type: 'text', text: 'Hi there!' }],
          stop_reason: 'end_turn',
          usage: { input_tokens: 10, output_tokens: 5 },
        },
        type: 'assistant',
        uuid: `${sessionId}-evt-002`,
        timestamp: '2026-01-15T10:00:01.000Z',
      }),
    ];
    fs.writeFileSync(fixturePath, events.join('\n') + '\n');
    return fixturePath;
  }

  /** Helper: fetch a channel by ID from the channels list */
  async function getChannelById(channelId: string) {
    const listRes = await app.request('/api/channels', req('GET', '/api/channels'));
    const channels = await listRes.json() as any[];
    return channels.find((c) => c.id === channelId);
  }

  it('captures CLAUDE.md from cwd when present', async () => {
    const projectDir = path.join(tempDir, 'my-project');
    fs.mkdirSync(projectDir, { recursive: true });
    fs.writeFileSync(path.join(projectDir, 'CLAUDE.md'), '# My Project\n\nProject instructions here.');

    const sessionPath = createSessionFixture(projectDir, 'sess-claudemd-001');

    const res = await app.request(
      '/api/import/claude-code',
      req('POST', '/api/import/claude-code', { sessionPath })
    );
    expect(res.status).toBe(201);
    const { channelId } = await res.json();

    const channel = await getChannelById(channelId);
    const meta = JSON.parse(channel.sourceMetadata);
    expect(meta.claudeMd).toBe('# My Project\n\nProject instructions here.');
  });

  it('captures MEMORY.md from Claude projects directory when present', async () => {
    const projectDir = path.join(tempDir, 'my-project');
    fs.mkdirSync(projectDir, { recursive: true });

    // Create the MEMORY.md in the Claude projects directory
    // Path encoding: replace / with -
    const encodedCwd = projectDir.replace(/\//g, '-');
    const memoryDir = path.join(os.homedir(), '.claude', 'projects', encodedCwd, 'memory');
    fs.mkdirSync(memoryDir, { recursive: true });
    fs.writeFileSync(path.join(memoryDir, 'MEMORY.md'), '# Memory\n\nUser prefers dark mode.');
    cleanupPaths.push(path.join(os.homedir(), '.claude', 'projects', encodedCwd));

    const sessionPath = createSessionFixture(projectDir, 'sess-memorymd-001');

    const res = await app.request(
      '/api/import/claude-code',
      req('POST', '/api/import/claude-code', { sessionPath })
    );
    expect(res.status).toBe(201);
    const { channelId } = await res.json();

    const channel = await getChannelById(channelId);
    const meta = JSON.parse(channel.sourceMetadata);
    expect(meta.memoryMd).toBe('# Memory\n\nUser prefers dark mode.');
  });

  it('succeeds without CLAUDE.md or MEMORY.md (best-effort)', async () => {
    // Use a cwd that has no CLAUDE.md or MEMORY.md
    const projectDir = path.join(tempDir, 'bare-project');
    fs.mkdirSync(projectDir, { recursive: true });

    const sessionPath = createSessionFixture(projectDir, 'sess-nocontext-001');

    const res = await app.request(
      '/api/import/claude-code',
      req('POST', '/api/import/claude-code', { sessionPath })
    );
    expect(res.status).toBe(201);
    const { channelId } = await res.json();

    const channel = await getChannelById(channelId);
    const meta = JSON.parse(channel.sourceMetadata);
    expect(meta.claudeMd).toBeUndefined();
    expect(meta.memoryMd).toBeUndefined();
  });

  // Skip permission test when running as root (root can read any file)
  it.skipIf(process.getuid?.() === 0)(
    'handles unreadable CLAUDE.md gracefully (permission denied)',
    async () => {
      const projectDir = path.join(tempDir, 'locked-project');
      fs.mkdirSync(projectDir, { recursive: true });
      const claudeMdPath = path.join(projectDir, 'CLAUDE.md');
      fs.writeFileSync(claudeMdPath, 'Secret instructions');
      fs.chmodSync(claudeMdPath, 0o000);

      const sessionPath = createSessionFixture(projectDir, 'sess-locked-001');

      try {
        const res = await app.request(
          '/api/import/claude-code',
          req('POST', '/api/import/claude-code', { sessionPath })
        );
        // Import should succeed — context capture is best-effort
        expect(res.status).toBe(201);
        const { channelId } = await res.json();

        const channel = await getChannelById(channelId);
        const meta = JSON.parse(channel.sourceMetadata);
        // claudeMd should be undefined since the file was unreadable
        expect(meta.claudeMd).toBeUndefined();
      } finally {
        fs.chmodSync(claudeMdPath, 0o644);
      }
    }
  );

  it('handles session without cwd (no context capture attempt)', async () => {
    // Create a session file without cwd
    const noCwdSessionId = `sess-nocwd-${Date.now()}`;
    const fixturePath = path.join(tempDir, `${noCwdSessionId}.jsonl`);
    const events = [
      JSON.stringify({
        parentUuid: null,
        userType: 'external',
        sessionId: noCwdSessionId,
        type: 'user',
        message: { role: 'user', content: 'No project context' },
        uuid: `${noCwdSessionId}-evt-001`,
        timestamp: '2026-01-15T10:00:00.000Z',
      }),
      JSON.stringify({
        parentUuid: `${noCwdSessionId}-evt-001`,
        userType: 'external',
        sessionId: noCwdSessionId,
        message: {
          model: 'claude-opus-4-6',
          id: `msg_${noCwdSessionId}_001`,
          type: 'message',
          role: 'assistant',
          content: [{ type: 'text', text: 'OK' }],
          stop_reason: 'end_turn',
          usage: { input_tokens: 10, output_tokens: 5 },
        },
        type: 'assistant',
        uuid: `${noCwdSessionId}-evt-002`,
        timestamp: '2026-01-15T10:00:01.000Z',
      }),
    ];
    fs.writeFileSync(fixturePath, events.join('\n') + '\n');

    const res = await app.request(
      '/api/import/claude-code',
      req('POST', '/api/import/claude-code', { sessionPath: fixturePath })
    );
    expect(res.status).toBe(201);
    const { channelId } = await res.json();

    const channel = await getChannelById(channelId);
    const meta = JSON.parse(channel.sourceMetadata);
    expect(meta.claudeMd).toBeUndefined();
    expect(meta.memoryMd).toBeUndefined();
    expect(meta.cwd).toBeUndefined();
  });

  it('captures both CLAUDE.md and MEMORY.md when both present', async () => {
    const projectDir = path.join(tempDir, 'full-project');
    fs.mkdirSync(projectDir, { recursive: true });
    fs.writeFileSync(path.join(projectDir, 'CLAUDE.md'), 'Project rules.');

    const encodedCwd = projectDir.replace(/\//g, '-');
    const memoryDir = path.join(os.homedir(), '.claude', 'projects', encodedCwd, 'memory');
    fs.mkdirSync(memoryDir, { recursive: true });
    fs.writeFileSync(path.join(memoryDir, 'MEMORY.md'), 'User memory.');
    cleanupPaths.push(path.join(os.homedir(), '.claude', 'projects', encodedCwd));

    const sessionPath = createSessionFixture(projectDir, 'sess-both-001');

    const res = await app.request(
      '/api/import/claude-code',
      req('POST', '/api/import/claude-code', { sessionPath })
    );
    expect(res.status).toBe(201);
    const { channelId } = await res.json();

    const channel = await getChannelById(channelId);
    const meta = JSON.parse(channel.sourceMetadata);
    expect(meta.claudeMd).toBe('Project rules.');
    expect(meta.memoryMd).toBe('User memory.');
  });
});
