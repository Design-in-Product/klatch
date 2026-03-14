import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import './setup.js';
import { createTestApp } from './app.js';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { importSession } from '../db/queries.js';

// Mock the claude client to avoid real API calls
vi.mock('../claude/client.js', () => ({
  streamClaude: vi.fn(),
}));

function createApp() {
  return createTestApp();
}

// ── Unit tests for session scanner ──────────────────────────

describe('decodeProjectPath', () => {
  // Import after mocks are set up
  let decodeProjectPath: typeof import('../import/session-scanner.js').decodeProjectPath;

  beforeEach(async () => {
    const mod = await import('../import/session-scanner.js');
    decodeProjectPath = mod.decodeProjectPath;
  });

  it('decodes encoded cwd back to absolute path', () => {
    expect(decodeProjectPath('-home-user-klatch')).toBe('/home/user/klatch');
  });

  it('handles deeper paths', () => {
    expect(decodeProjectPath('-Users-xian-Development-klatch')).toBe('/Users/xian/Development/klatch');
  });

  it('handles single-segment paths', () => {
    expect(decodeProjectPath('-tmp')).toBe('/tmp');
  });
});

// ── Integration test for the sessions endpoint ──────────────

describe('GET /api/import/claude-code/sessions', () => {
  let app: ReturnType<typeof createApp>;
  let tmpDir: string;
  let origHomedir: typeof os.homedir;

  beforeEach(() => {
    app = createApp();

    // Create a temporary .claude/projects structure
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'klatch-test-'));
    const projectDir = path.join(tmpDir, '.claude', 'projects', '-test-project');
    fs.mkdirSync(projectDir, { recursive: true });

    // Create a fake session JSONL file (must be > 100 bytes)
    const sessionContent = [
      JSON.stringify({ type: 'user', uuid: 'u1', sessionId: 'sess-test-001', timestamp: '2026-03-14T10:00:00Z', message: { role: 'user', content: 'Hello' } }),
      JSON.stringify({ type: 'assistant', uuid: 'a1', parentUuid: 'u1', sessionId: 'sess-test-001', timestamp: '2026-03-14T10:00:01Z', message: { role: 'assistant', content: 'Hi there! How can I help you today?' } }),
    ].join('\n');
    fs.writeFileSync(path.join(projectDir, 'sess-test-001.jsonl'), sessionContent);

    // Create a second session
    const session2 = [
      JSON.stringify({ type: 'user', uuid: 'u2', sessionId: 'sess-test-002', timestamp: '2026-03-14T11:00:00Z', message: { role: 'user', content: 'Another session here' } }),
      JSON.stringify({ type: 'assistant', uuid: 'a2', parentUuid: 'u2', sessionId: 'sess-test-002', timestamp: '2026-03-14T11:00:01Z', message: { role: 'assistant', content: 'Another response from the assistant' } }),
    ].join('\n');
    fs.writeFileSync(path.join(projectDir, 'sess-test-002.jsonl'), session2);

    // Create a tiny file that should be skipped (< 100 bytes)
    fs.writeFileSync(path.join(projectDir, 'tiny.jsonl'), '{}');

    // Create a non-jsonl file that should be ignored
    fs.writeFileSync(path.join(projectDir, 'notes.txt'), 'not a session');

    // Create a subdirectory (subagent dir) that should be ignored
    fs.mkdirSync(path.join(projectDir, 'sub-agent-dir'));

    // Mock os.homedir to use our temp dir
    origHomedir = os.homedir;
    (os as any).homedir = () => tmpDir;
  });

  afterEach(() => {
    (os as any).homedir = origHomedir;
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('returns 200 with project tree containing sessions', async () => {
    const res = await app.request('/api/import/claude-code/sessions');
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.totalProjects).toBe(1);
    expect(body.totalSessions).toBe(2);
    expect(body.projects).toHaveLength(1);

    const project = body.projects[0];
    expect(project.projectName).toBe('project');
    expect(project.projectPath).toBe('/test/project');
    expect(project.sessions).toHaveLength(2);
  });

  it('includes session metadata (path, size, date)', async () => {
    const res = await app.request('/api/import/claude-code/sessions');
    const body = await res.json();
    const session = body.projects[0].sessions[0];

    expect(session.sessionId).toMatch(/^sess-test-/);
    expect(session.path).toContain('.jsonl');
    expect(session.sizeBytes).toBeGreaterThan(100);
    expect(session.modifiedAt).toBeTruthy();
    expect(session.alreadyImported).toBe(false);
  });

  it('skips tiny files (< 100 bytes)', async () => {
    const res = await app.request('/api/import/claude-code/sessions');
    const body = await res.json();
    const allSessionIds = body.projects[0].sessions.map((s: any) => s.sessionId);
    expect(allSessionIds).not.toContain('tiny');
  });

  it('marks already-imported sessions', async () => {
    // Import a session first
    importSession({
      channelName: 'Test Import',
      source: 'claude-code',
      sourceMetadata: { originalSessionId: 'sess-test-001' },
      turns: [{ userText: 'hi', assistantText: 'hello', timestamp: '2026-03-14T10:00:00Z', originalId: 'u1' }],
    });

    const res = await app.request('/api/import/claude-code/sessions');
    const body = await res.json();
    const sessions = body.projects[0].sessions;

    const imported = sessions.find((s: any) => s.sessionId === 'sess-test-001');
    const notImported = sessions.find((s: any) => s.sessionId === 'sess-test-002');

    expect(imported.alreadyImported).toBe(true);
    expect(imported.existingChannelId).toBeTruthy();
    expect(imported.existingChannelName).toBe('Test Import');
    expect(notImported.alreadyImported).toBe(false);
  });

  it('returns empty array when no projects exist', async () => {
    // Remove the projects directory
    fs.rmSync(path.join(tmpDir, '.claude'), { recursive: true, force: true });

    const res = await app.request('/api/import/claude-code/sessions');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.totalProjects).toBe(0);
    expect(body.totalSessions).toBe(0);
    expect(body.projects).toHaveLength(0);
  });

  it('handles multiple projects', async () => {
    // Create a second project directory
    const project2Dir = path.join(tmpDir, '.claude', 'projects', '-other-project');
    fs.mkdirSync(project2Dir, { recursive: true });

    const session3 = [
      JSON.stringify({ type: 'user', uuid: 'u3', sessionId: 'sess-other-001', timestamp: '2026-03-14T12:00:00Z', message: { role: 'user', content: 'Session in second project for testing' } }),
      JSON.stringify({ type: 'assistant', uuid: 'a3', parentUuid: 'u3', sessionId: 'sess-other-001', timestamp: '2026-03-14T12:00:01Z', message: { role: 'assistant', content: 'Response from assistant in second project' } }),
    ].join('\n');
    fs.writeFileSync(path.join(project2Dir, 'sess-other-001.jsonl'), session3);

    const res = await app.request('/api/import/claude-code/sessions');
    const body = await res.json();
    expect(body.totalProjects).toBe(2);
    expect(body.totalSessions).toBe(3);

    // Projects should be sorted alphabetically
    const names = body.projects.map((p: any) => p.projectName);
    expect(names).toEqual([...names].sort());
  });

  it('sorts sessions within a project by modification date (newest first)', async () => {
    const res = await app.request('/api/import/claude-code/sessions');
    const body = await res.json();
    const sessions = body.projects[0].sessions;

    // Verify descending modification date order
    for (let i = 1; i < sessions.length; i++) {
      expect(sessions[i - 1].modifiedAt >= sessions[i].modifiedAt).toBe(true);
    }
  });
});
