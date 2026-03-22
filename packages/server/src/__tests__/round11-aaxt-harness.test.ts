/**
 * Round 11 — Automated Agent Experience Testing (AAXT) Harness
 *
 * Verifies that imported agents receive the correct 5-layer prompt assembly.
 * Uses the prompt-debug endpoint as the oracle. No LLM calls — pure structural
 * verification against synthetic imports.
 *
 * Groups:
 *   A — Claude Code import (local path, via content parsing)
 *   B — Cloud session import (file upload path, v0.8.7)
 *   C — claude.ai ZIP import
 *   D — Edge cases (re-import, empty project instructions)
 *
 * Design brief: docs/mail/theseus-to-argus-aaxt-harness.md
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import './setup.js';
import { createTestApp } from './app.js';
import {
  createProject,
  updateProject,
  importSession,
  findUniqueProjectByName,
  getChannel,
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

// ── Helpers ──

function createApp() {
  return createTestApp();
}

function makeEntity(overrides: Partial<Entity> = {}): Entity {
  return {
    id: 'test-entity',
    name: 'Test Agent',
    model: 'claude-opus-4-6',
    systemPrompt: 'You are a test agent.',
    color: '#6366f1',
    createdAt: '2026-03-01T00:00:00Z',
    ...overrides,
  };
}

/**
 * Build a minimal JSONL string for a Claude Code session.
 */
function buildJsonl(opts: {
  sessionId?: string;
  cwd?: string;
  turns?: Array<{ user: string; assistant: string }>;
} = {}): string {
  const sessionId = opts.sessionId || 'test-session-001';
  const cwd = opts.cwd || '/home/user/test-project';
  const turns = opts.turns || [{ user: 'Hello', assistant: 'Hi there!' }];

  const lines: string[] = [];
  let eventNum = 0;

  for (const turn of turns) {
    const userUuid = `evt-${++eventNum}`;
    const assistantUuid = `evt-${++eventNum}`;

    lines.push(JSON.stringify({
      parentUuid: null,
      userType: 'external',
      cwd,
      sessionId,
      version: '2.1.19',
      type: 'user',
      message: { role: 'user', content: turn.user },
      uuid: userUuid,
      timestamp: `2026-03-15T10:00:${String(eventNum).padStart(2, '0')}.000Z`,
    }));

    lines.push(JSON.stringify({
      parentUuid: userUuid,
      userType: 'external',
      cwd,
      sessionId,
      version: '2.1.19',
      message: {
        model: 'claude-opus-4-6',
        id: `msg_${eventNum}`,
        type: 'message',
        role: 'assistant',
        content: [{ type: 'text', text: turn.assistant }],
        stop_reason: 'end_turn',
        usage: { input_tokens: 100, output_tokens: 50 },
      },
      type: 'assistant',
      uuid: assistantUuid,
      timestamp: `2026-03-15T10:00:${String(eventNum + 1).padStart(2, '0')}.000Z`,
    }));
  }

  return lines.join('\n');
}

/**
 * Import a synthetic Claude Code session via content parsing + importSession.
 * Returns the channelId.
 */
function importSyntheticSession(opts: {
  sessionId?: string;
  cwd?: string;
  channelName?: string;
  projectId?: string;
  claudeMd?: string;
  memoryMd?: string;
  cloudUpload?: boolean;
  turns?: Array<{ user: string; assistant: string }>;
} = {}): string {
  const sessionId = opts.sessionId || `aaxt-session-${Date.now()}`;
  const turns = opts.turns || [{ user: 'Hello', assistant: 'Hi there!' }];

  const result = importSession({
    channelName: opts.channelName || 'aaxt-test-channel',
    source: 'claude-code',
    sourceMetadata: {
      originalSessionId: sessionId,
      cwd: opts.cwd || '/home/user/test-project',
      importedAt: new Date().toISOString(),
      ...(opts.claudeMd ? { claudeMd: opts.claudeMd } : {}),
      ...(opts.memoryMd ? { memoryMd: opts.memoryMd } : {}),
      ...(opts.cloudUpload ? { cloudUpload: true } : {}),
    },
    turns: turns.map((t, i) => ({
      userText: t.user,
      assistantText: t.assistant,
      timestamp: `2026-03-15T10:00:${String(i * 2).padStart(2, '0')}.000Z`,
      originalId: `orig-${i}`,
    })),
    projectId: opts.projectId,
  });

  return result.channelId;
}

/**
 * Import a synthetic claude.ai conversation via importSession.
 * Returns the channelId.
 */
function importSyntheticClaudeAiSession(opts: {
  sessionId?: string;
  channelName?: string;
  projectId?: string;
  claudeMd?: string;
  memoryMd?: string;
  turns?: Array<{ user: string; assistant: string }>;
} = {}): string {
  const sessionId = opts.sessionId || `aaxt-cai-session-${Date.now()}`;
  const turns = opts.turns || [{ user: 'Hello', assistant: 'Hi there!' }];

  const result = importSession({
    channelName: opts.channelName || 'aaxt-cai-test-channel',
    source: 'claude-ai',
    sourceMetadata: {
      originalSessionId: sessionId,
      importedAt: new Date().toISOString(),
      ...(opts.claudeMd ? { claudeMd: opts.claudeMd } : {}),
      ...(opts.memoryMd ? { memoryMd: opts.memoryMd } : {}),
    },
    turns: turns.map((t, i) => ({
      userText: t.user,
      assistantText: t.assistant,
      timestamp: `2026-03-15T10:00:${String(i * 2).padStart(2, '0')}.000Z`,
      originalId: `orig-cai-${i}`,
    })),
    projectId: opts.projectId,
  });

  return result.channelId;
}

/**
 * Hit the prompt-debug endpoint and return the parsed response.
 */
async function getPromptDebug(app: ReturnType<typeof createApp>, channelId: string) {
  const res = await app.request(`/api/channels/${channelId}/prompt-debug`);
  expect(res.status).toBe(200);
  return res.json();
}

// ═══════════════════════════════════════════════════════════════
// GROUP A — Claude Code import (local path)
// ═══════════════════════════════════════════════════════════════

describe('Group A — Claude Code import', () => {
  it('A1: Basic import, no project — kit briefing fires, layers 2-3 empty, entity prompt present', async () => {
    const app = createApp();
    const channelId = importSyntheticSession({
      sessionId: 'a1-session',
    });

    const debug = await getPromptDebug(app, channelId);

    // Layer 1: kit briefing should be active (imported channel)
    expect(debug.layers['1_kitBriefing']).toContain('ACTIVE');
    expect(debug.channelSource).toBe('claude-code');

    // Layers 2-3: no project linked
    expect(debug.layers['2_projectInstructions']).toContain('INACTIVE');
    expect(debug.layers['3_projectMemory']).toContain('INACTIVE');
    expect(debug.projectId).toBeNull();

    // Layer 5: entity prompt present
    expect(debug.layers['5_entityPrompt']).toBeDefined();

    // Assembled prompt should contain kit briefing orientation text
    expect(debug.assembledPrompt).toContain('imported into Klatch');
    expect(debug.assembledPrompt).toContain('Claude Code');
  });

  it('A2: Import with claudeMd in sourceMetadata (no project) — claudeMd appears in kit briefing', async () => {
    const app = createApp();
    const claudeMdContent = '# My Project\n\nThis is the CLAUDE.md content for AAXT testing.';
    const channelId = importSyntheticSession({
      sessionId: 'a2-session',
      claudeMd: claudeMdContent,
    });

    const debug = await getPromptDebug(app, channelId);

    // Kit briefing active
    expect(debug.layers['1_kitBriefing']).toContain('ACTIVE');

    // No project → claudeMd should appear in kit briefing (legacy fallback)
    expect(debug.assembledPrompt).toContain('CLAUDE.md');
    expect(debug.assembledPrompt).toContain('AAXT testing');
  });

  it('A3: Import with memoryMd in sourceMetadata (no project) — memoryMd appears in kit briefing', async () => {
    const app = createApp();
    const memoryMdContent = 'User prefers TypeScript. Project uses Vitest.';
    const channelId = importSyntheticSession({
      sessionId: 'a3-session',
      memoryMd: memoryMdContent,
    });

    const debug = await getPromptDebug(app, channelId);

    // Kit briefing active
    expect(debug.layers['1_kitBriefing']).toContain('ACTIVE');

    // No project → memoryMd should appear in kit briefing (legacy fallback)
    expect(debug.assembledPrompt).toContain('MEMORY.md');
    expect(debug.assembledPrompt).toContain('Vitest');
  });

  it('A4: Import linked to existing project — layers 2 and 3 populated from project', async () => {
    const app = createApp();

    // Create a project with instructions and memory
    const project = createProject(
      'AAXT Test Project',
      'These are the project instructions for AAXT.',
      'native',
      {},
      'This is the project memory for AAXT verification.'
    );

    const channelId = importSyntheticSession({
      sessionId: 'a4-session',
      projectId: project.id,
    });

    const debug = await getPromptDebug(app, channelId);

    // Layer 1: kit briefing (imported)
    expect(debug.layers['1_kitBriefing']).toContain('ACTIVE');

    // Layer 2: project instructions
    expect(debug.layers['2_projectInstructions']).toContain('ACTIVE');
    expect(debug.assembledPrompt).toContain('project instructions for AAXT');

    // Layer 3: project memory
    expect(debug.layers['3_projectMemory']).toContain('ACTIVE');
    expect(debug.assembledPrompt).toContain('project memory for AAXT verification');

    // Project linked
    expect(debug.projectId).toBe(project.id);
    expect(debug.projectName).toBe('AAXT Test Project');
  });

  it('A4b: Import linked to project — claudeMd/memoryMd in sourceMetadata NOT injected via kit briefing', async () => {
    const app = createApp();

    // Create project with its own instructions
    const project = createProject(
      'AAXT Project With Own Context',
      'Project-level instructions.',
      'native',
      {},
      'Project-level memory.'
    );

    const channelId = importSyntheticSession({
      sessionId: 'a4b-session',
      projectId: project.id,
      claudeMd: 'Legacy CLAUDE.md that should NOT appear',
      memoryMd: 'Legacy MEMORY.md that should NOT appear',
    });

    const debug = await getPromptDebug(app, channelId);

    // Legacy fallback should NOT fire when project is linked
    expect(debug.assembledPrompt).not.toContain('Legacy CLAUDE.md that should NOT appear');
    expect(debug.assembledPrompt).not.toContain('Legacy MEMORY.md that should NOT appear');

    // Project-level content should be present
    expect(debug.assembledPrompt).toContain('Project-level instructions.');
    expect(debug.assembledPrompt).toContain('Project-level memory.');
  });
});

// ═══════════════════════════════════════════════════════════════
// GROUP B — Cloud session import (file upload path, v0.8.7)
// ═══════════════════════════════════════════════════════════════

describe('Group B — Cloud session import', () => {
  it('B5: Cloud upload, no local cwd — kit briefing fires, cloudUpload in metadata', async () => {
    const app = createApp();
    const channelId = importSyntheticSession({
      sessionId: 'b5-session',
      cwd: '/home/ubuntu/cloud-project',
      cloudUpload: true,
    });

    const debug = await getPromptDebug(app, channelId);

    // Kit briefing active
    expect(debug.layers['1_kitBriefing']).toContain('ACTIVE');

    // Should still contain Claude Code orientation
    expect(debug.assembledPrompt).toContain('imported into Klatch');

    // Verify cloudUpload flag is in sourceMetadata
    const channel = getChannel(channelId);
    expect(channel).toBeDefined();
    const meta = JSON.parse(channel!.sourceMetadata || '{}');
    expect(meta.cloudUpload).toBe(true);
  });

  it('B6: Basename project matching — upload links to existing project', async () => {
    const app = createApp();

    // Create a local project named "klatch"
    const project = createProject(
      'klatch',
      'Klatch project instructions for basename matching.',
      'claude-code',
      { cwd: '/home/user/klatch' },
      'Klatch project memory.'
    );

    // Import a cloud session whose cwd basename is also "klatch"
    const channelId = importSyntheticSession({
      sessionId: 'b6-session',
      cwd: '/home/ubuntu/klatch',
      projectId: project.id, // Simulating what the route does after basename match
      cloudUpload: true,
    });

    const debug = await getPromptDebug(app, channelId);

    // Should be linked to the existing project
    expect(debug.projectId).toBe(project.id);
    expect(debug.projectName).toBe('klatch');
    expect(debug.layers['2_projectInstructions']).toContain('ACTIVE');
    expect(debug.assembledPrompt).toContain('basename matching');
  });

  it('B6b: findUniqueProjectByName — exact one match returns project', () => {
    createProject('unique-project', 'instructions', 'native', {});
    const found = findUniqueProjectByName('unique-project');
    expect(found).toBeDefined();
    expect(found!.name).toBe('unique-project');
  });

  it('B6c: findUniqueProjectByName — zero matches returns undefined', () => {
    const found = findUniqueProjectByName('nonexistent-project');
    expect(found).toBeUndefined();
  });

  it('B7: Ambiguous basename — multiple projects with same name returns undefined', () => {
    createProject('ambiguous', 'instructions 1', 'native', {});
    createProject('ambiguous', 'instructions 2', 'native', {});
    const found = findUniqueProjectByName('ambiguous');
    expect(found).toBeUndefined();
  });
});

// ═══════════════════════════════════════════════════════════════
// GROUP C — claude.ai ZIP import
// ═══════════════════════════════════════════════════════════════

describe('Group C — claude.ai ZIP import', () => {
  it('C8: ZIP with project prompt_template — appears in layer 2 (project instructions)', async () => {
    const app = createApp();

    // Create project with instructions (simulating what the import route does
    // when it finds prompt_template in the ZIP)
    const project = createProject(
      'AAXT Claude.ai Project',
      'This is the prompt_template content from the ZIP.',
      'claude-ai',
      { originalProjectUuid: 'zip-proj-001', hasPromptTemplate: true },
      ''
    );

    const channelId = importSyntheticClaudeAiSession({
      sessionId: 'c8-session',
      channelName: 'c8-test',
      projectId: project.id,
    });

    const debug = await getPromptDebug(app, channelId);

    // Layer 2: project instructions from prompt_template
    expect(debug.layers['2_projectInstructions']).toContain('ACTIVE');
    expect(debug.assembledPrompt).toContain('prompt_template content from the ZIP');

    // Source should be claude-ai
    expect(debug.channelSource).toBe('claude-ai');
  });

  it('C9: ZIP with memories — appear in layer 3 (project memory)', async () => {
    const app = createApp();

    // Simulating: project with merged memories (project-scoped + account-level)
    const mergedMemories =
      'User likes concise responses.\nUser works at a startup.\n\n' +
      '## Account memories (from claude.ai)\n\nUser prefers TypeScript over JavaScript.';

    const project = createProject(
      'AAXT Memories Project',
      'Some instructions',
      'claude-ai',
      { originalProjectUuid: 'zip-proj-002' },
      mergedMemories
    );

    const channelId = importSyntheticClaudeAiSession({
      sessionId: 'c9-session',
      channelName: 'c9-test',
      projectId: project.id,
    });

    const debug = await getPromptDebug(app, channelId);

    // Layer 3: project memory with merged memories
    expect(debug.layers['3_projectMemory']).toContain('ACTIVE');
    expect(debug.assembledPrompt).toContain('concise responses');
    expect(debug.assembledPrompt).toContain('TypeScript over JavaScript');

    // Memories are strings, not individual characters (the join fix)
    expect(debug.assembledPrompt).not.toMatch(/U\ns\ne\nr/);
  });

  it('C10: ZIP, no project_uuid match — lands unassigned, layers 2-3 empty', async () => {
    const app = createApp();

    // Import without project link (simulating project_uuid = NONE or unmatched)
    const channelId = importSyntheticClaudeAiSession({
      sessionId: 'c10-session',
      channelName: 'c10-unassigned',
      // No projectId
    });

    const debug = await getPromptDebug(app, channelId);

    // Kit briefing fires (imported channel)
    expect(debug.layers['1_kitBriefing']).toContain('ACTIVE');

    // No project → layers 2-3 inactive
    expect(debug.layers['2_projectInstructions']).toContain('INACTIVE');
    expect(debug.layers['3_projectMemory']).toContain('INACTIVE');
    expect(debug.projectId).toBeNull();

    // Kit briefing should reference claude.ai (not Claude Code)
    expect(debug.assembledPrompt).toContain('claude.ai');
  });
});

// ═══════════════════════════════════════════════════════════════
// GROUP D — Edge cases
// ═══════════════════════════════════════════════════════════════

describe('Group D — Edge cases', () => {
  it('D11: Re-import (fork-again) — second import has same prompt assembly, no bleed', async () => {
    const app = createApp();

    const project = createProject(
      'Fork Test Project',
      'Fork project instructions.',
      'native',
      {},
      'Fork project memory.'
    );

    // First import
    const channelId1 = importSyntheticSession({
      sessionId: 'd11-session',
      channelName: 'fork-original',
      projectId: project.id,
      turns: [{ user: 'First import', assistant: 'Response 1' }],
    });

    // Second import (fork-again) — same sessionId, different channel
    const channelId2 = importSyntheticSession({
      sessionId: 'd11-session-fork',
      channelName: 'fork-again',
      projectId: project.id,
      turns: [{ user: 'Second import', assistant: 'Response 2' }],
    });

    expect(channelId1).not.toBe(channelId2);

    const debug1 = await getPromptDebug(app, channelId1);
    const debug2 = await getPromptDebug(app, channelId2);

    // Same prompt assembly (same project, same entity)
    expect(debug1.layers['1_kitBriefing']).toContain('ACTIVE');
    expect(debug2.layers['1_kitBriefing']).toContain('ACTIVE');
    expect(debug1.layers['2_projectInstructions']).toContain('ACTIVE');
    expect(debug2.layers['2_projectInstructions']).toContain('ACTIVE');
    expect(debug1.layers['3_projectMemory']).toContain('ACTIVE');
    expect(debug2.layers['3_projectMemory']).toContain('ACTIVE');

    // Both reference the same project
    expect(debug1.projectId).toBe(project.id);
    expect(debug2.projectId).toBe(project.id);

    // No data bleed — channel names are different
    expect(debug1.channelName).toBe('fork-original');
    expect(debug2.channelName).toBe('fork-again');
  });

  it('D12: Empty project instructions — layer 2 shows EMPTY, not injected as blank block', async () => {
    const app = createApp();

    // Create project with empty instructions but has memory
    const project = createProject(
      'Empty Instructions Project',
      '',    // empty instructions
      'native',
      {},
      'This project has memory but no instructions.'
    );

    const channelId = importSyntheticSession({
      sessionId: 'd12-session',
      projectId: project.id,
    });

    const debug = await getPromptDebug(app, channelId);

    // Layer 2: EMPTY (project exists but no instructions)
    expect(debug.layers['2_projectInstructions']).toContain('EMPTY');

    // Layer 3: memory present
    expect(debug.layers['3_projectMemory']).toContain('ACTIVE');
    expect(debug.assembledPrompt).toContain('memory but no instructions');

    // The assembled prompt should NOT contain an empty instructions block
    // (buildSystemPrompt skips empty strings)
    const parts = debug.assembledPrompt.split('\n\n');
    // None of the parts should be empty or whitespace-only
    for (const part of parts) {
      expect(part.trim().length).toBeGreaterThan(0);
    }
  });

  it('D12b: Empty project memory — layer 3 shows EMPTY', async () => {
    const app = createApp();

    const project = createProject(
      'No Memory Project',
      'Has instructions but no memory.',
      'native',
      {},
      ''  // empty memory
    );

    const channelId = importSyntheticSession({
      sessionId: 'd12b-session',
      projectId: project.id,
    });

    const debug = await getPromptDebug(app, channelId);

    // Layer 2: ACTIVE (has instructions)
    expect(debug.layers['2_projectInstructions']).toContain('ACTIVE');

    // Layer 3: EMPTY (project exists but no memory)
    expect(debug.layers['3_projectMemory']).toContain('EMPTY');
  });

  it('D13: Native channel (not imported) — no kit briefing, layers reflect native state', async () => {
    // The default channel created by setup.ts is a native channel
    const app = createApp();
    const debug = await getPromptDebug(app, 'default');

    // Layer 1: INACTIVE — native channel
    expect(debug.layers['1_kitBriefing']).toContain('INACTIVE');
    expect(debug.channelSource).toBe('native');

    // Layers 2-3: no project
    expect(debug.layers['2_projectInstructions']).toContain('INACTIVE');
    expect(debug.layers['3_projectMemory']).toContain('INACTIVE');

    // No kit briefing text in assembled prompt
    expect(debug.assembledPrompt).not.toContain('imported into Klatch');
  });
});

// ═══════════════════════════════════════════════════════════════
// buildSystemPrompt unit tests (direct function verification)
// ═══════════════════════════════════════════════════════════════

describe('buildSystemPrompt — 5-layer assembly verification', () => {
  it('Layer ordering: kit > instructions > memory > addendum > entity', () => {
    const entity = makeEntity({ systemPrompt: 'ENTITY_PROMPT_MARKER' });
    const channel: Channel = {
      id: 'test-ch',
      name: 'test',
      type: 'chat',
      systemPrompt: 'CHANNEL_ADDENDUM_MARKER',
      model: 'claude-opus-4-6',
      mode: 'one-on-one',
      source: 'claude-code',
      sourceMetadata: '{}',
      createdAt: '2026-03-01T00:00:00Z',
    };
    const project: Project = {
      id: 'test-proj',
      name: 'Test',
      instructions: 'INSTRUCTIONS_MARKER',
      memory: 'MEMORY_MARKER',
      source: 'native',
      sourceMetadata: '{}',
      createdAt: '2026-03-01T00:00:00Z',
    };

    const prompt = buildSystemPrompt(entity, channel.systemPrompt, channel, project);

    // All markers present
    expect(prompt).toContain('imported into Klatch');          // kit briefing
    expect(prompt).toContain('INSTRUCTIONS_MARKER');           // layer 2
    expect(prompt).toContain('MEMORY_MARKER');                 // layer 3
    expect(prompt).toContain('CHANNEL_ADDENDUM_MARKER');       // layer 4
    expect(prompt).toContain('ENTITY_PROMPT_MARKER');          // layer 5

    // Verify ordering: kit before instructions before memory before addendum before entity
    const kitIdx = prompt.indexOf('imported into Klatch');
    const instrIdx = prompt.indexOf('INSTRUCTIONS_MARKER');
    const memIdx = prompt.indexOf('MEMORY_MARKER');
    const addendumIdx = prompt.indexOf('CHANNEL_ADDENDUM_MARKER');
    const entityIdx = prompt.indexOf('ENTITY_PROMPT_MARKER');

    expect(kitIdx).toBeLessThan(instrIdx);
    expect(instrIdx).toBeLessThan(memIdx);
    expect(memIdx).toBeLessThan(addendumIdx);
    expect(addendumIdx).toBeLessThan(entityIdx);
  });

  it('Native channel: no kit briefing, only addendum + entity', () => {
    const entity = makeEntity({ systemPrompt: 'NATIVE_ENTITY' });
    const channel: Channel = {
      id: 'native-ch',
      name: 'native',
      type: 'chat',
      systemPrompt: 'NATIVE_ADDENDUM',
      model: 'claude-opus-4-6',
      mode: 'one-on-one',
      source: 'native',
      sourceMetadata: null,
      createdAt: '2026-03-01T00:00:00Z',
    };

    const prompt = buildSystemPrompt(entity, channel.systemPrompt, channel, null);

    expect(prompt).not.toContain('imported into Klatch');
    expect(prompt).toContain('NATIVE_ADDENDUM');
    expect(prompt).toContain('NATIVE_ENTITY');
  });

  it('Legacy fallback: claudeMd/memoryMd injected when no project linked', () => {
    const entity = makeEntity();
    const channel: Channel = {
      id: 'legacy-ch',
      name: 'legacy',
      type: 'chat',
      systemPrompt: '',
      model: 'claude-opus-4-6',
      mode: 'one-on-one',
      source: 'claude-code',
      sourceMetadata: JSON.stringify({
        claudeMd: 'LEGACY_CLAUDE_MD_CONTENT',
        memoryMd: 'LEGACY_MEMORY_MD_CONTENT',
      }),
      createdAt: '2026-03-01T00:00:00Z',
    };

    // No project → legacy fallback should fire
    const prompt = buildSystemPrompt(entity, channel.systemPrompt, channel, null);

    expect(prompt).toContain('LEGACY_CLAUDE_MD_CONTENT');
    expect(prompt).toContain('LEGACY_MEMORY_MD_CONTENT');
  });

  it('Legacy fallback suppressed when project linked', () => {
    const entity = makeEntity();
    const channel: Channel = {
      id: 'linked-ch',
      name: 'linked',
      type: 'chat',
      systemPrompt: '',
      model: 'claude-opus-4-6',
      mode: 'one-on-one',
      source: 'claude-code',
      sourceMetadata: JSON.stringify({
        claudeMd: 'SHOULD_NOT_APPEAR',
        memoryMd: 'SHOULD_NOT_APPEAR_EITHER',
      }),
      projectId: 'some-project-id',
      createdAt: '2026-03-01T00:00:00Z',
    };
    const project: Project = {
      id: 'some-project-id',
      name: 'Linked Project',
      instructions: 'Project instructions override.',
      memory: 'Project memory override.',
      source: 'native',
      sourceMetadata: '{}',
      createdAt: '2026-03-01T00:00:00Z',
    };

    const prompt = buildSystemPrompt(entity, channel.systemPrompt, channel, project);

    expect(prompt).not.toContain('SHOULD_NOT_APPEAR');
    expect(prompt).toContain('Project instructions override.');
    expect(prompt).toContain('Project memory override.');
  });
});
