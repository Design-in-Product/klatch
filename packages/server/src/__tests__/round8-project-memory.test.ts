/**
 * Round 8 tests: Project memory + 5-layer prompt assembly
 *
 * Covers:
 * 1. Project CRUD with memory field (createProject, updateProject, getProject, getAllProjects)
 * 2. Import stores memory at project level (Claude Code + claude.ai)
 * 3. 5-layer prompt assembly (buildSystemPrompt with project.memory as layer 3)
 * 4. Legacy fallback (kit briefing injects memoryMd only when no project linked)
 * 5. Prompt debug endpoint (GET /channels/:id/prompt-debug with 3_projectMemory)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import './setup.js';
import { createTestApp } from './app.js';
import {
  createProject,
  updateProject,
  getProject,
  getAllProjects,
  createChannel,
  setChannelProject,
  getProjectForChannel,
} from '../db/queries.js';
import { buildSystemPrompt, buildKitBriefing } from '../claude/client.js';
import type { Entity, Channel, Project } from '@klatch/shared';

// Mock streaming — not needed for these tests
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

function jsonReq(body: unknown) {
  return {
    method: 'POST' as const,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  };
}

function makeEntity(overrides: Partial<Entity> = {}): Entity {
  return {
    id: 'test-entity',
    name: 'Claude',
    model: 'claude-opus-4-6',
    systemPrompt: 'You are a helpful assistant.',
    color: '#6366f1',
    createdAt: '2026-03-01T00:00:00Z',
    ...overrides,
  };
}

// ── 1. Project CRUD with memory ─────────────────────────────────

describe('Project CRUD — memory field', () => {
  it('createProject with memory stores and returns it', () => {
    const project = createProject('P1', 'Instructions here', 'native', {}, 'Some memory content');
    expect(project.memory).toBe('Some memory content');
  });

  it('createProject defaults memory to empty string', () => {
    const project = createProject('P2', 'Instructions');
    expect(project.memory).toBe('');
  });

  it('getProject returns memory field', () => {
    const created = createProject('P3', 'Inst', 'native', {}, 'Remembered facts');
    const fetched = getProject(created.id);
    expect(fetched).toBeDefined();
    expect(fetched!.memory).toBe('Remembered facts');
  });

  it('updateProject with memory updates the field', () => {
    const created = createProject('P4', 'Inst', 'native', {}, 'Old memory');
    const updated = updateProject(created.id, { memory: 'New memory' });
    expect(updated).toBeDefined();
    expect(updated!.memory).toBe('New memory');

    // Verify persistence
    const fetched = getProject(created.id);
    expect(fetched!.memory).toBe('New memory');
  });

  it('updateProject without memory preserves existing memory', () => {
    const created = createProject('P5', 'Inst', 'native', {}, 'Keep this');
    const updated = updateProject(created.id, { name: 'P5-renamed' });
    expect(updated!.memory).toBe('Keep this');
    expect(updated!.name).toBe('P5-renamed');
  });

  it('getAllProjects returns memory field for all projects', () => {
    createProject('A', 'ia', 'native', {}, 'mem-a');
    createProject('B', 'ib', 'native', {}, 'mem-b');

    const all = getAllProjects();
    const a = all.find((p) => p.name === 'A');
    const b = all.find((p) => p.name === 'B');
    expect(a!.memory).toBe('mem-a');
    expect(b!.memory).toBe('mem-b');
  });
});

// ── 2. Import stores memory at project level ────────────────────

describe('Import — memory at project level', () => {
  let app: ReturnType<typeof createApp>;
  beforeEach(() => { app = createApp(); });

  it('Claude Code import: MEMORY.md goes into project.memory, not instructions', async () => {
    // We test via direct DB functions since import reads filesystem.
    // The import route calls findOrCreateProject(name, instructions, source, meta, matchKey, matchValue, memory).
    // We verify the separation:
    const project = createProject(
      'my-repo',
      'CLAUDE.md content here',
      'claude-code',
      { cwd: '/Users/dev/my-repo' },
      '# MEMORY.md content\n\nThis is accumulated knowledge.'
    );

    expect(project.instructions).toBe('CLAUDE.md content here');
    expect(project.memory).toBe('# MEMORY.md content\n\nThis is accumulated knowledge.');
    expect(project.instructions).not.toContain('MEMORY');
  });

  it('claude.ai import: project memories go into project.memory', () => {
    const project = createProject(
      'AI Project',
      'prompt_template content',
      'claude-ai',
      { projectUuid: 'uuid-123' },
      'User prefers concise responses\nUser works with TypeScript'
    );

    expect(project.instructions).toBe('prompt_template content');
    expect(project.memory).toContain('concise responses');
    expect(project.memory).toContain('TypeScript');
  });

  it('claude.ai import: global account memories merged with project memories', () => {
    // Simulating the merge logic from import.ts:
    // mergedMemory = projMem + "\n\n## Account memories (from claude.ai)\n\n" + globalMem
    const projMem = 'User prefers concise responses';
    const globalMem = 'Account-level memory about user preferences';
    const mergedMemory = [
      projMem,
      '## Account memories (from claude.ai)\n\n' + globalMem,
    ].join('\n\n');

    const project = createProject(
      'AI Project',
      'prompt_template',
      'claude-ai',
      { projectUuid: 'uuid-456' },
      mergedMemory
    );

    expect(project.memory).toContain('concise responses');
    expect(project.memory).toContain('Account memories (from claude.ai)');
    expect(project.memory).toContain('Account-level memory');
  });

  it('project.instructions contains only CLAUDE.md / prompt_template, no memory content', () => {
    const project = createProject(
      'Clean Separation',
      '# CLAUDE.md\n\nBuild instructions only.',
      'claude-code',
      { cwd: '/Users/dev/clean' },
      '# MEMORY.md\n\nAccumulated knowledge here.'
    );

    expect(project.instructions).not.toContain('MEMORY');
    expect(project.instructions).toBe('# CLAUDE.md\n\nBuild instructions only.');
    expect(project.memory).toContain('Accumulated knowledge');
  });
});

// ── 3. 5-layer prompt assembly ──────────────────────────────────

describe('5-layer prompt assembly — project memory', () => {
  const entity = makeEntity();

  it('project.memory appears in assembled prompt with "Project memory:" header', () => {
    const project: Project = {
      id: 'p1',
      name: 'Test',
      instructions: 'Build instructions',
      memory: 'User prefers TypeScript',
      source: 'native',
      sourceMetadata: '{}',
      createdAt: '2026-03-01T00:00:00Z',
    };

    const prompt = buildSystemPrompt(entity, '', undefined, project);
    expect(prompt).toContain('Project memory:');
    expect(prompt).toContain('User prefers TypeScript');
  });

  it('memory appears AFTER instructions and BEFORE channel addendum', () => {
    const project: Project = {
      id: 'p2',
      name: 'Test',
      instructions: 'INSTRUCTIONS_MARKER',
      memory: 'MEMORY_MARKER',
      source: 'native',
      sourceMetadata: '{}',
      createdAt: '2026-03-01T00:00:00Z',
    };

    const prompt = buildSystemPrompt(entity, 'ADDENDUM_MARKER', undefined, project);

    const instrIdx = prompt.indexOf('INSTRUCTIONS_MARKER');
    const memIdx = prompt.indexOf('MEMORY_MARKER');
    const addendumIdx = prompt.indexOf('ADDENDUM_MARKER');

    expect(instrIdx).toBeGreaterThan(-1);
    expect(memIdx).toBeGreaterThan(-1);
    expect(addendumIdx).toBeGreaterThan(-1);

    // Order: instructions < memory < addendum
    expect(instrIdx).toBeLessThan(memIdx);
    expect(memIdx).toBeLessThan(addendumIdx);
  });

  it('empty memory produces no "Project memory:" in output', () => {
    const project: Project = {
      id: 'p3',
      name: 'Test',
      instructions: 'Some instructions',
      memory: '',
      source: 'native',
      sourceMetadata: '{}',
      createdAt: '2026-03-01T00:00:00Z',
    };

    const prompt = buildSystemPrompt(entity, '', undefined, project);
    expect(prompt).not.toContain('Project memory:');
  });

  it('whitespace-only memory produces no "Project memory:" in output', () => {
    const project: Project = {
      id: 'p4',
      name: 'Test',
      instructions: 'Inst',
      memory: '   \n\t  ',
      source: 'native',
      sourceMetadata: '{}',
      createdAt: '2026-03-01T00:00:00Z',
    };

    const prompt = buildSystemPrompt(entity, '', undefined, project);
    expect(prompt).not.toContain('Project memory:');
  });

  it('memory truncated at 8000 chars (MAX_PROJECT_MEMORY_CHARS)', () => {
    const longMemory = 'x'.repeat(10000);
    const project: Project = {
      id: 'p5',
      name: 'Test',
      instructions: '',
      memory: longMemory,
      source: 'native',
      sourceMetadata: '{}',
      createdAt: '2026-03-01T00:00:00Z',
    };

    const prompt = buildSystemPrompt(entity, '', undefined, project);
    // Should contain truncation indicator
    expect(prompt).toContain('...(truncated)');
    // Should not contain the full 10000 chars
    expect(prompt.length).toBeLessThan(10000 + 500); // some overhead for headers
  });

  it('all 5 layers present in correct order for imported channel with project', () => {
    const channel: Channel = {
      id: 'ch-imported',
      name: 'Imported Chat',
      type: 'chat',
      systemPrompt: 'CHANNEL_ADDENDUM',
      model: 'claude-opus-4-6',
      mode: 'panel',
      createdAt: '2026-03-01T00:00:00Z',
      source: 'claude-code',
      sourceMetadata: JSON.stringify({ cwd: '/dev/proj' }),
      projectId: 'p-linked',
    };

    const project: Project = {
      id: 'p-linked',
      name: 'Linked Project',
      instructions: 'PROJECT_INSTRUCTIONS',
      memory: 'PROJECT_MEMORY',
      source: 'claude-code',
      sourceMetadata: '{}',
      createdAt: '2026-03-01T00:00:00Z',
    };

    const entityWithPrompt = makeEntity({ systemPrompt: 'ENTITY_PROMPT' });
    const prompt = buildSystemPrompt(entityWithPrompt, 'CHANNEL_ADDENDUM', channel, project);

    // Layer 1: kit briefing (imported)
    expect(prompt).toContain('imported into Klatch');
    // Layer 2: project instructions
    expect(prompt).toContain('PROJECT_INSTRUCTIONS');
    // Layer 3: project memory
    expect(prompt).toContain('Project memory:');
    expect(prompt).toContain('PROJECT_MEMORY');
    // Layer 4: channel addendum
    expect(prompt).toContain('CHANNEL_ADDENDUM');
    // Layer 5: entity prompt
    expect(prompt).toContain('ENTITY_PROMPT');

    // Verify ordering
    const kitIdx = prompt.indexOf('imported into Klatch');
    const instrIdx = prompt.indexOf('PROJECT_INSTRUCTIONS');
    const memIdx = prompt.indexOf('PROJECT_MEMORY');
    const addendumIdx = prompt.indexOf('CHANNEL_ADDENDUM');
    const entityIdx = prompt.lastIndexOf('ENTITY_PROMPT');

    expect(kitIdx).toBeLessThan(instrIdx);
    expect(instrIdx).toBeLessThan(memIdx);
    expect(memIdx).toBeLessThan(addendumIdx);
    expect(addendumIdx).toBeLessThan(entityIdx);
  });
});

// ── 4. Legacy fallback ──────────────────────────────────────────

describe('Legacy fallback — kit briefing memory injection', () => {
  it('channel WITH projectId: kit briefing does NOT inject memoryMd', () => {
    const channel: Channel = {
      id: 'ch-linked',
      name: 'Linked Chat',
      type: 'chat',
      systemPrompt: '',
      model: 'claude-opus-4-6',
      mode: 'panel',
      createdAt: '2026-03-01T00:00:00Z',
      source: 'claude-code',
      sourceMetadata: JSON.stringify({
        cwd: '/dev/project',
        memoryMd: 'Legacy MEMORY.md content that should NOT appear',
        claudeMd: 'Legacy CLAUDE.md content that should NOT appear',
      }),
      projectId: 'some-project-id',
    };

    const briefing = buildKitBriefing(channel);
    expect(briefing).toContain('imported into Klatch');
    expect(briefing).not.toContain('Legacy MEMORY.md');
    expect(briefing).not.toContain('Legacy CLAUDE.md');
  });

  it('channel WITHOUT projectId: kit briefing DOES inject memoryMd', () => {
    const channel: Channel = {
      id: 'ch-unlinked',
      name: 'Unlinked Chat',
      type: 'chat',
      systemPrompt: '',
      model: 'claude-opus-4-6',
      mode: 'panel',
      createdAt: '2026-03-01T00:00:00Z',
      source: 'claude-code',
      sourceMetadata: JSON.stringify({
        cwd: '/dev/old-project',
        memoryMd: 'Legacy memory from MEMORY.md',
        claudeMd: 'Legacy instructions from CLAUDE.md',
      }),
      // No projectId — legacy channel
    };

    const briefing = buildKitBriefing(channel);
    expect(briefing).toContain('imported into Klatch');
    expect(briefing).toContain('Legacy memory from MEMORY.md');
    expect(briefing).toContain('Legacy instructions from CLAUDE.md');
  });

  it('channel WITHOUT projectId but no memoryMd: kit briefing has no memory section', () => {
    const channel: Channel = {
      id: 'ch-no-mem',
      name: 'No Memory Chat',
      type: 'chat',
      systemPrompt: '',
      model: 'claude-opus-4-6',
      mode: 'panel',
      createdAt: '2026-03-01T00:00:00Z',
      source: 'claude-code',
      sourceMetadata: JSON.stringify({ cwd: '/dev/minimal' }),
    };

    const briefing = buildKitBriefing(channel);
    expect(briefing).toContain('imported into Klatch');
    expect(briefing).not.toContain('MEMORY.md');
    expect(briefing).not.toContain('Project memory');
  });
});

// ── 5. Prompt debug endpoint ────────────────────────────────────

describe('Prompt debug endpoint — 3_projectMemory layer', () => {
  let app: ReturnType<typeof createApp>;
  beforeEach(() => { app = createApp(); });

  it('shows ACTIVE when project has memory', async () => {
    const project = createProject('MemProject', 'Instructions', 'native', {}, 'Some accumulated memory');
    const ch = createChannel('Debug Chat', '');
    setChannelProject(ch.id, project.id);

    const res = await app.request(`/api/channels/${ch.id}/prompt-debug`);
    expect(res.status).toBe(200);
    const body = await res.json() as any;

    expect(body.layers['3_projectMemory']).toContain('ACTIVE');
    expect(body.layers['3_projectMemory']).toContain('MemProject');
  });

  it('shows EMPTY when project has no memory', async () => {
    const project = createProject('EmptyMem', 'Instructions');
    const ch = createChannel('Debug Chat 2', '');
    setChannelProject(ch.id, project.id);

    const res = await app.request(`/api/channels/${ch.id}/prompt-debug`);
    expect(res.status).toBe(200);
    const body = await res.json() as any;

    expect(body.layers['3_projectMemory']).toContain('EMPTY');
    expect(body.layers['3_projectMemory']).toContain('EmptyMem');
  });

  it('shows INACTIVE when no project linked', async () => {
    // Use the default channel (no project)
    const res = await app.request('/api/channels/default/prompt-debug');
    expect(res.status).toBe(200);
    const body = await res.json() as any;

    expect(body.layers['3_projectMemory']).toContain('INACTIVE');
  });

  it('assembledPrompt includes project memory content', async () => {
    const project = createProject('PromptCheck', 'My instructions', 'native', {}, 'Remembered: user likes TypeScript');
    const ch = createChannel('Prompt Chat', '');
    setChannelProject(ch.id, project.id);

    const res = await app.request(`/api/channels/${ch.id}/prompt-debug`);
    const body = await res.json() as any;

    expect(body.assembledPrompt).toContain('Project memory:');
    expect(body.assembledPrompt).toContain('user likes TypeScript');
    expect(body.assembledPrompt).toContain('My instructions');
  });

  it('returns 5 layers in response', async () => {
    const res = await app.request('/api/channels/default/prompt-debug');
    const body = await res.json() as any;

    expect(body.layers).toHaveProperty('1_kitBriefing');
    expect(body.layers).toHaveProperty('2_projectInstructions');
    expect(body.layers).toHaveProperty('3_projectMemory');
    expect(body.layers).toHaveProperty('4_channelAddendum');
    expect(body.layers).toHaveProperty('5_entityPrompt');
  });
});
