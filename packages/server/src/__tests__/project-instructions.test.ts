/**
 * Test scaffolding for 8¾a: Project Instructions Inheritance
 *
 * Design doc: docs/plans/project-instructions-inheritance.md
 * These tests target the `projects` table, prompt assembly layering,
 * import integration, and kit briefing deduplication.
 *
 * Tests marked .todo() await Daedalus's implementation of:
 *   - `projects` table + migration
 *   - `project_id` FK on channels
 *   - Updated `buildSystemPrompt()` with project layer
 *   - Import flow creating project rows
 *   - Updated kit briefing (CLAUDE.md moved to project layer)
 */
import { describe, it, expect, vi } from 'vitest';
import './setup.js';
import { createTestApp } from './app.js';
import { buildKitBriefing } from '../claude/client.js';
import type { Channel } from '@klatch/shared';

// Mock the claude client to avoid real API calls
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

// ── Schema migration ─────────────────────────────────────────

describe('projects table migration', () => {
  it.todo('creates projects table with correct columns (id, name, instructions, source, source_metadata, created_at)');
  it.todo('adds project_id column to channels table (nullable)');
  it.todo('migrates existing imported channels: creates project from sourceMetadata.claudeMd');
  it.todo('migration links imported channels to created project via project_id');
  it.todo('migration preserves sourceMetadata intact (other fields still needed)');
  it.todo('existing native channels have project_id = NULL after migration');
  it.todo('migration is idempotent (safe to run twice)');
});

// ── Project CRUD ─────────────────────────────────────────────

describe('project CRUD', () => {
  it.todo('POST /api/projects creates a project with name and instructions');
  it.todo('GET /api/projects returns all projects');
  it.todo('GET /api/projects/:id returns a single project');
  it.todo('PATCH /api/projects/:id updates name');
  it.todo('PATCH /api/projects/:id updates instructions');
  it.todo('DELETE /api/projects/:id removes project');
  it.todo('DELETE /api/projects/:id unlinks channels (sets project_id = NULL)');
  it.todo('DELETE /api/projects/:id preserves channels and their system_prompt (addendum)');
  it.todo('GET /api/projects/:id/channels returns channels in a project');
});

// ── Channel-project assignment ───────────────────────────────

describe('channel-project assignment', () => {
  it.todo('PATCH /api/channels/:id with projectId assigns channel to project');
  it.todo('PATCH /api/channels/:id with projectId = null removes project assignment');
  it.todo('assigning a channel to a project preserves existing system_prompt as addendum');
  it.todo('channel response includes projectId and projectInstructions when assigned');
  it.todo('channel response omits projectInstructions when not assigned to a project');
});

// ── Prompt assembly layers ───────────────────────────────────

describe('buildSystemPrompt with project layer', () => {
  // These test the updated buildSystemPrompt function from the design doc:
  // effective_prompt = [kit_briefing] + [project.instructions] + [channel.system_prompt] + [entity.systemPrompt]

  it.todo('no project, no addendum — returns only entity prompt (backward compat)');
  it.todo('project instructions only — returns project instructions + entity prompt');
  it.todo('project instructions + channel addendum — returns both in correct order');
  it.todo('full stack: kit briefing + project instructions + channel addendum + entity prompt');
  it.todo('empty project instructions are skipped (no extra whitespace)');
  it.todo('whitespace-only project instructions are skipped');
  it.todo('empty channel addendum is skipped');
  it.todo('all layers empty — returns empty string');
  it.todo('layer ordering is always: kit → project → channel → entity');
});

// ── Import integration: claude.ai ────────────────────────────

describe('claude.ai import creates projects', () => {
  it.todo('import from ZIP with projects.json creates project rows');
  it.todo('project.prompt_template maps to projects.instructions');
  it.todo('project.name maps to projects.name');
  it.todo('project.source = "claude-ai"');
  it.todo('project.source_metadata contains original UUID, docs, etc.');
  it.todo('imported channel gets project_id FK to created project');
  it.todo('user association: selected conversation links to selected project');
  it.todo('duplicate project UUID reuses existing project row (no duplicates)');
  it.todo('import without projects.json still works (no project created)');
});

// ── Import integration: Claude Code ──────────────────────────

describe('Claude Code import creates projects', () => {
  it.todo('import with CLAUDE.md creates project row with instructions from file');
  it.todo('project.name derived from directory basename');
  it.todo('project.source = "claude-code"');
  it.todo('project.source_metadata contains cwd');
  it.todo('sessions from same cwd share the same project row');
  it.todo('import without cwd creates no project');
});

// ── Kit briefing deduplication ───────────────────────────────

describe('kit briefing after project instructions migration', () => {
  // After 8¾a, CLAUDE.md/prompt_template moves to project layer.
  // Kit briefing should NO LONGER inject CLAUDE.md content.
  // Kit briefing should STILL inject MEMORY.md and orientation text.

  it.todo('kit briefing does NOT include CLAUDE.md when channel has project_id');
  it.todo('kit briefing STILL includes MEMORY.md content');
  it.todo('kit briefing STILL includes orientation text (capability warnings)');
  it.todo('kit briefing STILL includes CLAUDE.md when channel has NO project (backward compat)');

  // Verify no double-injection
  it.todo('effective system prompt does not contain CLAUDE.md content twice');
});

// ── Existing kit briefing behavior (regression) ─────────────

describe('kit briefing existing behavior (regression)', () => {
  function makeChannel(overrides: Partial<Channel> = {}): Channel {
    return {
      id: 'ch-test',
      name: 'Test Channel',
      systemPrompt: '',
      model: 'claude-opus-4-6',
      mode: 'panel',
      createdAt: '2026-01-01T00:00:00.000Z',
      source: 'claude-code',
      ...overrides,
    };
  }

  it('still includes orientation text', () => {
    const briefing = buildKitBriefing(makeChannel());
    expect(briefing).toContain('conversation-only');
    expect(briefing).toContain('do NOT have access to tools');
  });

  it('still includes CLAUDE.md from sourceMetadata (pre-migration)', () => {
    const meta = { claudeMd: '# Build\nRun npm test' };
    const briefing = buildKitBriefing(makeChannel({
      sourceMetadata: JSON.stringify(meta),
    }));
    expect(briefing).toContain('Run npm test');
  });

  it('still includes MEMORY.md from sourceMetadata', () => {
    const meta = { memoryMd: 'User prefers TypeScript' };
    const briefing = buildKitBriefing(makeChannel({
      sourceMetadata: JSON.stringify(meta),
    }));
    expect(briefing).toContain('User prefers TypeScript');
  });
});

export {};
