/**
 * Integration tests for 8¾a: Project Context Injection
 *
 * Covers the critical path end-to-end:
 * 1. claude.ai import → project creation + channel linking
 * 2. Claude Code import → project creation by cwd
 * 3. System prompt assembly with 4-layer ordering
 * 4. Project instructions truncation
 * 5. Kit briefing deduplication (CLAUDE.md in project layer vs kit)
 * 6. Re-branch (force-import) with project link
 * 7. API route coverage for projects
 */
import { describe, it, expect, vi } from 'vitest';
import './setup.js';
import { createTestApp } from './app.js';
import { buildKitBriefing, buildSystemPrompt } from '../claude/client.js';
import {
  createProject,
  createChannel,
  findOrCreateProject,
  getProjectForChannel,
  setChannelProject,
  importSession,
  getAllProjects,
} from '../db/queries.js';
import type { Channel, Entity, Project } from '@klatch/shared';

// Mock the claude client streaming (not needed for prompt assembly tests)
vi.mock('../claude/client.js', async () => {
  const actual = await vi.importActual('../claude/client.js');
  return {
    ...actual,
    streamClaude: vi.fn(),
  };
});

function createApp() {
  return createTestApp();
}

function req(method: string, path: string, body?: unknown) {
  const init: RequestInit = { method, headers: { 'Content-Type': 'application/json' } };
  if (body) init.body = JSON.stringify(body);
  return init;
}

function makeEntity(overrides: Partial<Entity> = {}): Entity {
  return {
    id: 'ent-test',
    name: 'Claude',
    model: 'claude-opus-4-6',
    systemPrompt: 'You are a helpful assistant.',
    color: '#6366F1',
    createdAt: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

function makeChannel(overrides: Partial<Channel> = {}): Channel {
  return {
    id: 'ch-test',
    name: 'Test Channel',
    systemPrompt: '',
    model: 'claude-opus-4-6',
    mode: 'panel',
    createdAt: '2026-01-01T00:00:00Z',
    source: 'native',
    ...overrides,
  };
}

function makeProject(overrides: Partial<Project> = {}): Project {
  return {
    id: 'proj-test',
    name: 'Test Project',
    instructions: 'Build with TypeScript. Run tests before committing.',
    source: 'native',
    sourceMetadata: '{}',
    createdAt: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

// ── 1. claude.ai import → project creation + channel linking ─────

describe('claude.ai import → project creation', () => {
  it('findOrCreateProject creates project from claude.ai data', () => {
    const project = findOrCreateProject(
      'Klatch Development',
      'You are a helpful coding assistant for the Klatch project.',
      'claude-ai',
      { originalProjectUuid: 'ai-proj-1', hasPromptTemplate: true },
      'originalProjectUuid',
      'ai-proj-1'
    );

    expect(project.id).toBeTruthy();
    expect(project.name).toBe('Klatch Development');
    expect(project.instructions).toBe('You are a helpful coding assistant for the Klatch project.');
    expect(project.source).toBe('claude-ai');
    const meta = JSON.parse(project.sourceMetadata);
    expect(meta.originalProjectUuid).toBe('ai-proj-1');
  });

  it('importSession links channel to project via projectId', () => {
    const project = findOrCreateProject(
      'My AI Project',
      'Project instructions here.',
      'claude-ai',
      { originalProjectUuid: 'ai-proj-2' },
      'originalProjectUuid',
      'ai-proj-2'
    );

    const result = importSession({
      channelName: 'Imported Conversation',
      source: 'claude-ai',
      sourceMetadata: {
        originalSessionId: 'conv-123',
        projectUuid: 'ai-proj-2',
        projectName: 'My AI Project',
      },
      turns: [{ userText: 'Hello', assistantText: 'Hi there', timestamp: '2026-03-14T00:00:00Z' }],
      projectId: project.id,
    });

    const linked = getProjectForChannel(result.channelId);
    expect(linked).toBeDefined();
    expect(linked!.id).toBe(project.id);
    expect(linked!.instructions).toBe('Project instructions here.');
  });

  it('prompt_template + project memories → combined instructions', () => {
    const project = findOrCreateProject(
      'Combined Project',
      'You are a TypeScript expert.\n\n## Project Memory\n\nUser prefers functional style.',
      'claude-ai',
      { originalProjectUuid: 'ai-proj-3' },
      'originalProjectUuid',
      'ai-proj-3'
    );

    expect(project.instructions).toContain('You are a TypeScript expert.');
    expect(project.instructions).toContain('## Project Memory');
    expect(project.instructions).toContain('User prefers functional style.');
  });

  it('duplicate import reuses existing project (same originalProjectUuid)', () => {
    const first = findOrCreateProject(
      'Project v1',
      'First import instructions',
      'claude-ai',
      { originalProjectUuid: 'ai-proj-dedup' },
      'originalProjectUuid',
      'ai-proj-dedup'
    );

    const second = findOrCreateProject(
      'Project v2 Updated',
      'Second import instructions',
      'claude-ai',
      { originalProjectUuid: 'ai-proj-dedup' },
      'originalProjectUuid',
      'ai-proj-dedup'
    );

    expect(second.id).toBe(first.id);
    expect(second.name).toBe('Project v1'); // original preserved
  });
});

// ── 2. Claude Code import → project creation by cwd ─────────────

describe('Claude Code import → project creation by cwd', () => {
  it('creates project from cwd with CLAUDE.md + MEMORY.md', () => {
    const project = findOrCreateProject(
      'klatch',
      '# Klatch\nA local-first web app.\n\n## Project Memory\n\nUser prefers dark mode.',
      'claude-code',
      { cwd: '/Users/xian/Development/klatch' },
      'cwd',
      '/Users/xian/Development/klatch'
    );

    expect(project.name).toBe('klatch');
    expect(project.instructions).toContain('A local-first web app.');
    expect(project.instructions).toContain('User prefers dark mode.');
    expect(project.source).toBe('claude-code');
  });

  it('same cwd re-import finds existing project', () => {
    const first = findOrCreateProject(
      'klatch',
      'CLAUDE.md v1',
      'claude-code',
      { cwd: '/Users/xian/Development/klatch' },
      'cwd',
      '/Users/xian/Development/klatch'
    );

    const second = findOrCreateProject(
      'klatch',
      'CLAUDE.md v2 (updated)',
      'claude-code',
      { cwd: '/Users/xian/Development/klatch' },
      'cwd',
      '/Users/xian/Development/klatch'
    );

    expect(second.id).toBe(first.id);
  });

  it('different cwds create separate projects', () => {
    const proj1 = findOrCreateProject(
      'klatch', 'Instructions A', 'claude-code',
      { cwd: '/path/to/klatch' }, 'cwd', '/path/to/klatch'
    );
    const proj2 = findOrCreateProject(
      'other-project', 'Instructions B', 'claude-code',
      { cwd: '/path/to/other' }, 'cwd', '/path/to/other'
    );

    expect(proj1.id).not.toBe(proj2.id);
    expect(proj1.name).toBe('klatch');
    expect(proj2.name).toBe('other-project');
  });

  it('importSession with projectId links channel to Claude Code project', () => {
    const project = findOrCreateProject(
      'klatch', '# CLAUDE.md\nBuild with npm.', 'claude-code',
      { cwd: '/home/user/klatch' }, 'cwd', '/home/user/klatch'
    );

    const result = importSession({
      channelName: 'klatch — 2026-03-14',
      source: 'claude-code',
      sourceMetadata: {
        originalSessionId: 'session-abc',
        cwd: '/home/user/klatch',
        claudeMd: '# CLAUDE.md\nBuild with npm.',
      },
      turns: [{ userText: 'Fix the bug', assistantText: 'Done!', timestamp: '2026-03-14T10:00:00Z' }],
      projectId: project.id,
    });

    const linked = getProjectForChannel(result.channelId);
    expect(linked).toBeDefined();
    expect(linked!.id).toBe(project.id);
  });
});

// ── 3. System prompt assembly — 4-layer ordering ────────────────

describe('buildSystemPrompt — 4-layer assembly', () => {
  it('layer 1 only: native channel with entity prompt', () => {
    const entity = makeEntity({ systemPrompt: 'You are helpful.' });
    const channel = makeChannel({ source: 'native' });

    const prompt = buildSystemPrompt(entity, undefined, channel, null);
    expect(prompt).toBe('You are helpful.');
  });

  it('layer 4 only: entity prompt alone (no channel, no project)', () => {
    const entity = makeEntity({ systemPrompt: 'Entity instructions.' });

    const prompt = buildSystemPrompt(entity);
    expect(prompt).toBe('Entity instructions.');
  });

  it('layers 1+4: imported channel gets kit briefing + entity prompt', () => {
    const entity = makeEntity({ systemPrompt: 'Be concise.' });
    const channel = makeChannel({ source: 'claude-code' });

    const prompt = buildSystemPrompt(entity, undefined, channel, null);
    expect(prompt).toContain('imported into Klatch');
    expect(prompt).toContain('do NOT have access to tools');
    expect(prompt).toContain('Be concise.');
  });

  it('layers 1+2+4: imported channel + project instructions + entity', () => {
    const entity = makeEntity({ systemPrompt: 'Be helpful.' });
    const channel = makeChannel({ source: 'claude-code', projectId: 'proj-1' });
    const project = makeProject({ instructions: 'Build with TypeScript. Use Vitest.' });

    const prompt = buildSystemPrompt(entity, undefined, channel, project);
    expect(prompt).toContain('imported into Klatch'); // layer 1
    expect(prompt).toContain('Build with TypeScript. Use Vitest.'); // layer 2
    expect(prompt).toContain('Be helpful.'); // layer 4
  });

  it('layers 1+2+3+4: full stack', () => {
    const entity = makeEntity({ systemPrompt: 'Entity prompt.' });
    const channel = makeChannel({
      source: 'claude-ai',
      systemPrompt: 'Channel-specific addendum.',
      projectId: 'proj-1',
    });
    const project = makeProject({ instructions: 'Project instructions.' });

    const prompt = buildSystemPrompt(entity, 'Channel-specific addendum.', channel, project);

    // Verify all 4 layers present
    expect(prompt).toContain('imported into Klatch'); // layer 1: kit briefing
    expect(prompt).toContain('Project instructions.'); // layer 2: project
    expect(prompt).toContain('Channel-specific addendum.'); // layer 3: channel
    expect(prompt).toContain('Entity prompt.'); // layer 4: entity

    // Verify ordering: kit briefing comes before project, project before channel, channel before entity
    const kitIdx = prompt.indexOf('imported into Klatch');
    const projIdx = prompt.indexOf('Project instructions.');
    const chanIdx = prompt.indexOf('Channel-specific addendum.');
    const entIdx = prompt.indexOf('Entity prompt.');
    expect(kitIdx).toBeLessThan(projIdx);
    expect(projIdx).toBeLessThan(chanIdx);
    expect(chanIdx).toBeLessThan(entIdx);
  });

  it('native channel skips kit briefing (layer 1)', () => {
    const entity = makeEntity({ systemPrompt: 'Helper.' });
    const channel = makeChannel({ source: 'native', projectId: 'proj-1' });
    const project = makeProject({ instructions: 'Project rules.' });

    const prompt = buildSystemPrompt(entity, undefined, channel, project);
    expect(prompt).not.toContain('imported into Klatch');
    expect(prompt).toContain('Project rules.');
    expect(prompt).toContain('Helper.');
  });

  it('empty project instructions are skipped', () => {
    const entity = makeEntity({ systemPrompt: 'Hello.' });
    const channel = makeChannel({ source: 'claude-code' });
    const project = makeProject({ instructions: '' });

    const prompt = buildSystemPrompt(entity, undefined, channel, project);
    // Should not have double newlines from empty project layer
    expect(prompt).not.toMatch(/\n\n\n/);
  });

  it('whitespace-only project instructions are skipped', () => {
    const entity = makeEntity({ systemPrompt: 'Hello.' });
    const channel = makeChannel({ source: 'claude-code' });
    const project = makeProject({ instructions: '   \n\n  ' });

    const prompt = buildSystemPrompt(entity, undefined, channel, project);
    expect(prompt).not.toMatch(/\n\n\n/);
  });

  it('empty channel addendum is skipped', () => {
    const entity = makeEntity({ systemPrompt: 'Hello.' });
    const channel = makeChannel({ source: 'native' });

    const prompt = buildSystemPrompt(entity, '', channel, null);
    expect(prompt).toBe('Hello.');
  });

  it('all layers empty returns empty string', () => {
    const entity = makeEntity({ systemPrompt: '' });
    const prompt = buildSystemPrompt(entity, '', makeChannel({ source: 'native' }), null);
    expect(prompt).toBe('');
  });
});

// ── 4. Project instructions truncation ──────────────────────────

describe('buildSystemPrompt — project instructions truncation', () => {
  it('truncates project instructions exceeding 32K chars', () => {
    const longInstructions = 'x'.repeat(40000);
    const entity = makeEntity({ systemPrompt: '' });
    const project = makeProject({ instructions: longInstructions });

    const prompt = buildSystemPrompt(entity, undefined, makeChannel({ source: 'native' }), project);
    expect(prompt).toContain('...(truncated)');
    expect(prompt).toContain('x'.repeat(32000));
    expect(prompt).not.toContain('x'.repeat(40000));
  });

  it('does not truncate project instructions under 32K', () => {
    const instructions = 'x'.repeat(31000);
    const entity = makeEntity({ systemPrompt: '' });
    const project = makeProject({ instructions });

    const prompt = buildSystemPrompt(entity, undefined, makeChannel({ source: 'native' }), project);
    expect(prompt).not.toContain('...(truncated)');
    expect(prompt).toContain(instructions);
  });
});

// ── 5. Kit briefing deduplication ───────────────────────────────

describe('kit briefing deduplication', () => {
  it('does NOT inject claudeMd when channel has projectId', () => {
    const channel = makeChannel({
      source: 'claude-code',
      projectId: 'proj-1',
      sourceMetadata: JSON.stringify({ claudeMd: '# CLAUDE.md\nBuild instructions.' }),
    });

    const briefing = buildKitBriefing(channel);
    expect(briefing).toContain('imported into Klatch');
    expect(briefing).not.toContain('Build instructions.');
    expect(briefing).not.toContain('CLAUDE.md');
  });

  it('DOES inject claudeMd as fallback when channel has no projectId', () => {
    const channel = makeChannel({
      source: 'claude-code',
      // no projectId
      sourceMetadata: JSON.stringify({ claudeMd: '# CLAUDE.md\nBuild instructions.' }),
    });

    const briefing = buildKitBriefing(channel);
    expect(briefing).toContain('Build instructions.');
    expect(briefing).toContain('CLAUDE.md');
  });

  it('always injects memoryMd regardless of project link', () => {
    const withProject = makeChannel({
      source: 'claude-code',
      projectId: 'proj-1',
      sourceMetadata: JSON.stringify({ memoryMd: 'User prefers dark mode.' }),
    });

    const withoutProject = makeChannel({
      source: 'claude-code',
      sourceMetadata: JSON.stringify({ memoryMd: 'User prefers dark mode.' }),
    });

    expect(buildKitBriefing(withProject)).toContain('User prefers dark mode.');
    expect(buildKitBriefing(withoutProject)).toContain('User prefers dark mode.');
  });

  it('effective system prompt does not contain CLAUDE.md twice', () => {
    const entity = makeEntity({ systemPrompt: '' });
    const channel = makeChannel({
      source: 'claude-code',
      projectId: 'proj-1',
      sourceMetadata: JSON.stringify({ claudeMd: 'Build with npm run dev.' }),
    });
    const project = makeProject({ instructions: 'Build with npm run dev.' });

    const prompt = buildSystemPrompt(entity, undefined, channel, project);

    // CLAUDE.md content appears exactly once (in project layer, not in kit)
    const count = prompt.split('Build with npm run dev.').length - 1;
    expect(count).toBe(1);
  });
});

// ── 6. Re-branch (force-import) with project link ───────────────

describe('re-branch with project link', () => {
  it('force-imported channel also gets project link', () => {
    const project = findOrCreateProject(
      'Klatch',
      'Project instructions for re-branch.',
      'claude-ai',
      { originalProjectUuid: 'rebranch-proj' },
      'originalProjectUuid',
      'rebranch-proj'
    );

    // First import
    const first = importSession({
      channelName: 'Original Conversation',
      source: 'claude-ai',
      sourceMetadata: { originalSessionId: 'conv-rebranch', projectUuid: 'rebranch-proj' },
      turns: [{ userText: 'Hello', assistantText: 'Hi', timestamp: '2026-03-01T00:00:00Z' }],
      projectId: project.id,
    });

    // Force re-import (simulating re-branch)
    const second = importSession({
      channelName: 'Original Conversation (2)',
      source: 'claude-ai',
      sourceMetadata: { originalSessionId: 'conv-rebranch', projectUuid: 'rebranch-proj' },
      turns: [{ userText: 'Hello', assistantText: 'Hi', timestamp: '2026-03-01T00:00:00Z' }],
      projectId: project.id,
    });

    // Both channels link to the same project
    const proj1 = getProjectForChannel(first.channelId);
    const proj2 = getProjectForChannel(second.channelId);
    expect(proj1).toBeDefined();
    expect(proj2).toBeDefined();
    expect(proj1!.id).toBe(project.id);
    expect(proj2!.id).toBe(project.id);
  });

  it('re-branch reuses existing project (no duplicate rows)', () => {
    findOrCreateProject(
      'ReProject',
      'Instructions',
      'claude-ai',
      { originalProjectUuid: 'dedup-test' },
      'originalProjectUuid',
      'dedup-test'
    );

    // Same project UUID — should reuse
    findOrCreateProject(
      'ReProject v2',
      'Instructions v2',
      'claude-ai',
      { originalProjectUuid: 'dedup-test' },
      'originalProjectUuid',
      'dedup-test'
    );

    const all = getAllProjects();
    const matching = all.filter(p => {
      const meta = JSON.parse(p.sourceMetadata);
      return meta.originalProjectUuid === 'dedup-test';
    });
    expect(matching).toHaveLength(1);
  });
});

// ── 7. API route coverage ───────────────────────────────────────

describe('project API routes', () => {
  it('POST /api/projects creates a project', async () => {
    const app = createApp();
    const res = await app.request('/api/projects', req('POST', '/api/projects', {
      name: 'New Project',
      instructions: 'Be helpful.',
    }));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.id).toBeTruthy();
    expect(body.name).toBe('New Project');
    expect(body.instructions).toBe('Be helpful.');
  });

  it('GET /api/projects lists all projects', async () => {
    createProject('P1', 'I1');
    createProject('P2', 'I2');

    const app = createApp();
    const res = await app.request('/api/projects');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.length).toBe(2);
  });

  it('GET /api/projects/:id returns single project', async () => {
    const project = createProject('Fetch Me', 'My instructions');

    const app = createApp();
    const res = await app.request(`/api/projects/${project.id}`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.name).toBe('Fetch Me');
  });

  it('GET /api/projects/:id returns 404 for non-existent', async () => {
    const app = createApp();
    const res = await app.request('/api/projects/does-not-exist');
    expect(res.status).toBe(404);
  });

  it('PATCH /api/projects/:id updates project', async () => {
    const project = createProject('Original', 'Old instructions');

    const app = createApp();
    const res = await app.request(`/api/projects/${project.id}`, req('PATCH', '', {
      name: 'Updated',
      instructions: 'New instructions',
    }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.name).toBe('Updated');
    expect(body.instructions).toBe('New instructions');
  });

  it('DELETE /api/projects/:id deletes project', async () => {
    const project = createProject('To Delete', 'Instructions');

    const app = createApp();
    const res = await app.request(`/api/projects/${project.id}`, req('DELETE', ''));
    expect(res.status).toBe(200);

    // Verify gone
    const check = await app.request(`/api/projects/${project.id}`);
    expect(check.status).toBe(404);
  });

  it('DELETE /api/projects/:id unlinks channels but preserves them', async () => {
    const project = createProject('Linked Project', 'Instructions');
    const channel = createChannel('Test Channel', '');
    setChannelProject(channel.id, project.id);

    // Verify link exists
    expect(getProjectForChannel(channel.id)).toBeDefined();

    const app = createApp();
    await app.request(`/api/projects/${project.id}`, req('DELETE', ''));

    // Channel still exists but unlinked
    expect(getProjectForChannel(channel.id)).toBeUndefined();
  });
});

export {};
