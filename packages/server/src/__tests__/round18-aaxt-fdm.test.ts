/**
 * Round 18 — AAXT: File Domain Model × Import Interactions
 *
 * Extends the Round 11 AAXT harness to cover Step 9 (FDM) features.
 * Round 15 tested FDM on native channels; Round 11 tested imports without FDM.
 * This round tests the intersection: files on imported channels and cross-scope
 * visibility through the prompt-debug oracle.
 *
 * Groups:
 *   E — FDM × import: pinned files on imported channels, KB files on imported projects
 *   F — Cross-scope isolation: L3 vs L4, multi-channel project scope
 *   G — Lifecycle: pin/unpin reflected in prompt-debug, multi-file listing format
 *
 * Design brief: Theseus session 2026-04-05 (AAXT on Step 9 FDM work)
 */

import { describe, it, expect, vi } from 'vitest';
import './setup.js';
import { createTestApp } from './app.js';
import {
  createProject,
  createChannel,
  createFile,
  createFileRef,
  setChannelProject,
  assignEntityToChannel,
  importSession,
  getChannelFiles,
  getProjectFiles,
} from '../db/queries.js';
import { buildSystemPrompt } from '../claude/client.js';
import type { Entity, Channel, Project } from '@klatch/shared';
import { DEFAULT_MODEL, DEFAULT_ENTITY_ID, DEFAULT_INTERACTION_MODE } from '@klatch/shared';

// Mock streaming — no LLM calls in AAXT
vi.mock('../claude/client.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../claude/client.js')>();
  return {
    ...actual,
    streamClaude: vi.fn(),
    streamClaudeRoundtable: vi.fn(),
  };
});

// ── Helpers ──

function makeEntity(overrides: Partial<Entity> = {}): Entity {
  return {
    id: DEFAULT_ENTITY_ID,
    name: 'Claude',
    model: DEFAULT_MODEL,
    systemPrompt: 'You are a helpful assistant.',
    color: '#6366f1',
    effort: 'high',
    createdAt: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

/**
 * Import a synthetic Claude Code session. Returns channelId.
 */
function importSyntheticSession(opts: {
  sessionId?: string;
  channelName?: string;
  projectId?: string;
  claudeMd?: string;
  memoryMd?: string;
} = {}): string {
  const sessionId = opts.sessionId || `aaxt-fdm-${Date.now()}`;
  const result = importSession({
    channelName: opts.channelName || 'aaxt-fdm-channel',
    source: 'claude-code',
    sourceMetadata: {
      originalSessionId: sessionId,
      cwd: '/home/user/test-project',
      importedAt: new Date().toISOString(),
      ...(opts.claudeMd ? { claudeMd: opts.claudeMd } : {}),
      ...(opts.memoryMd ? { memoryMd: opts.memoryMd } : {}),
    },
    turns: [{ userText: 'Hello', assistantText: 'Hi there!', timestamp: '2026-04-01T10:00:00Z', originalId: 'orig-1' }],
    projectId: opts.projectId,
  });
  return result.channelId;
}

/**
 * Hit the prompt-debug endpoint and return parsed JSON.
 */
async function getPromptDebug(app: ReturnType<typeof createTestApp>, channelId: string) {
  const res = await app.request(`/api/channels/${channelId}/prompt-debug`);
  expect(res.status).toBe(200);
  return res.json();
}

// ═══════════════════════════════════════════════════════════════
// GROUP E — FDM × Import interactions
// ═══════════════════════════════════════════════════════════════

describe('Group E — FDM × Import interactions', () => {
  it('E1: Imported channel with pinned file — L1 kit briefing AND L4 file listing both present', async () => {
    const app = createTestApp();
    const channelId = importSyntheticSession({ sessionId: 'e1' });

    // Pin a file to the imported channel
    const file = createFile('architecture.md', 'text/markdown', 15300, 'sk-e1-arch');
    createFileRef(file.id, 'channel', channelId, 'pinned');

    const debug = await getPromptDebug(app, channelId);

    // L1: kit briefing fires (imported channel)
    expect(debug.layers['1_kitBriefing']).toContain('ACTIVE');
    expect(debug.assembledPrompt).toContain('imported into Klatch');

    // L4: channel files present
    expect(debug.layers['4_channelAddendum']).toContain('architecture.md');
    expect(debug.layers['4_channelAddendum']).toContain('1 file(s) pinned');
    expect(debug.assembledPrompt).toContain('Channel files available:');
    expect(debug.assembledPrompt).toContain('architecture.md');
  });

  it('E2: Imported channel linked to project with KB files — L1 + L2 + L3 (with files) all active', async () => {
    const app = createTestApp();

    // Project with instructions, memory, and a KB file
    const project = createProject(
      'FDM Test Project',
      'Follow TypeScript conventions.',
      'native',
      {},
      'User prefers Vitest for testing.'
    );
    const kbFile = createFile('roadmap.md', 'text/markdown', 3400, 'sk-e2-roadmap');
    createFileRef(kbFile.id, 'project', project.id, 'pinned');

    const channelId = importSyntheticSession({ sessionId: 'e2', projectId: project.id });

    const debug = await getPromptDebug(app, channelId);

    // L1: kit briefing (imported)
    expect(debug.layers['1_kitBriefing']).toContain('ACTIVE');

    // L2: project instructions
    expect(debug.layers['2_projectInstructions']).toContain('ACTIVE');
    expect(debug.assembledPrompt).toContain('TypeScript conventions');

    // L3: project memory + KB file
    expect(debug.layers['3_projectMemory']).toContain('ACTIVE');
    expect(debug.layers['3_projectMemory']).toContain('roadmap.md');
    expect(debug.assembledPrompt).toContain('Vitest for testing');
    expect(debug.assembledPrompt).toContain('Project knowledge base files:');
    expect(debug.assembledPrompt).toContain('roadmap.md');

    // Project linked
    expect(debug.projectId).toBe(project.id);
  });

  it('E3: Imported channel with legacy fallback + pinned file — both L1 fallback and L4 files present', async () => {
    const app = createTestApp();
    const claudeMd = '# Project Rules\n\nAlways use strict mode.';
    const channelId = importSyntheticSession({ sessionId: 'e3', claudeMd });

    // Pin a file to this imported channel (no project link)
    const file = createFile('config.json', 'application/json', 2100, 'sk-e3-config');
    createFileRef(file.id, 'channel', channelId, 'pinned');

    const debug = await getPromptDebug(app, channelId);

    // L1: kit briefing with legacy fallback (claudeMd injected)
    expect(debug.layers['1_kitBriefing']).toContain('ACTIVE');
    expect(debug.assembledPrompt).toContain('strict mode');

    // L4: channel files still present alongside legacy fallback
    expect(debug.layers['4_channelAddendum']).toContain('config.json');
    expect(debug.assembledPrompt).toContain('Channel files available:');
    expect(debug.assembledPrompt).toContain('config.json');
  });

  it('E4: Imported channel with project KB + channel pinned — both L3 and L4 file listings appear', async () => {
    const app = createTestApp();

    const project = createProject('Dual File Project', 'Build carefully.', 'native', {}, 'Remember the tests.');
    const kbFile = createFile('conventions.md', 'text/markdown', 2000, 'sk-e4-kb');
    createFileRef(kbFile.id, 'project', project.id, 'pinned');

    const channelId = importSyntheticSession({ sessionId: 'e4', projectId: project.id });

    // Also pin a channel-specific file
    const chFile = createFile('channel-notes.md', 'text/markdown', 500, 'sk-e4-ch');
    createFileRef(chFile.id, 'channel', channelId, 'pinned');

    const debug = await getPromptDebug(app, channelId);

    // L3: project KB file
    expect(debug.assembledPrompt).toContain('Project knowledge base files:');
    expect(debug.assembledPrompt).toContain('conventions.md');

    // L4: channel-pinned file
    expect(debug.assembledPrompt).toContain('Channel files available:');
    expect(debug.assembledPrompt).toContain('channel-notes.md');

    // Verify ordering: L3 (project KB) appears before L4 (channel files) in assembled prompt
    const l3Pos = debug.assembledPrompt.indexOf('Project knowledge base files:');
    const l4Pos = debug.assembledPrompt.indexOf('Channel files available:');
    expect(l3Pos).toBeLessThan(l4Pos);
  });
});

// ═══════════════════════════════════════════════════════════════
// GROUP F — Cross-scope file isolation
// ═══════════════════════════════════════════════════════════════

describe('Group F — Cross-scope file isolation', () => {
  it('F1: Channel-pinned file does NOT bleed to sibling channel in same project', async () => {
    const app = createTestApp();

    const project = createProject('Shared Project', 'Shared instructions.');

    // Two channels in the same project
    const chA = createChannel('channel-alpha', '');
    const chB = createChannel('channel-beta', '');
    setChannelProject(chA.id, project.id);
    setChannelProject(chB.id, project.id);
    // Both need an entity assigned for prompt-debug to work
    assignEntityToChannel(chA.id, DEFAULT_ENTITY_ID);
    assignEntityToChannel(chB.id, DEFAULT_ENTITY_ID);

    // Pin file ONLY to channel A
    const file = createFile('alpha-only.md', 'text/markdown', 800, 'sk-f1-alpha');
    createFileRef(file.id, 'channel', chA.id, 'pinned');

    const debugA = await getPromptDebug(app, chA.id);
    const debugB = await getPromptDebug(app, chB.id);

    // Channel A sees the pinned file
    expect(debugA.assembledPrompt).toContain('alpha-only.md');
    expect(debugA.layers['4_channelAddendum']).toContain('alpha-only.md');

    // Channel B does NOT see it
    expect(debugB.assembledPrompt).not.toContain('alpha-only.md');
  });

  it('F2: Project KB file visible to ALL channels linked to that project', async () => {
    const app = createTestApp();

    const project = createProject('KB Shared Project', '');

    const chA = createChannel('kb-ch-alpha', '');
    const chB = createChannel('kb-ch-beta', '');
    setChannelProject(chA.id, project.id);
    setChannelProject(chB.id, project.id);
    assignEntityToChannel(chA.id, DEFAULT_ENTITY_ID);
    assignEntityToChannel(chB.id, DEFAULT_ENTITY_ID);

    // Add KB file to project
    const kbFile = createFile('shared-spec.md', 'text/markdown', 5000, 'sk-f2-shared');
    createFileRef(kbFile.id, 'project', project.id, 'pinned');

    const debugA = await getPromptDebug(app, chA.id);
    const debugB = await getPromptDebug(app, chB.id);

    // Both channels see the project KB file in L3
    expect(debugA.assembledPrompt).toContain('shared-spec.md');
    expect(debugA.layers['3_projectMemory']).toContain('shared-spec.md');

    expect(debugB.assembledPrompt).toContain('shared-spec.md');
    expect(debugB.layers['3_projectMemory']).toContain('shared-spec.md');
  });

  it('F3: Unlinked channel sees neither project KB nor sibling channel files', async () => {
    const app = createTestApp();

    const project = createProject('Isolated Project', 'Instructions here.');
    const linked = createChannel('linked-ch', '');
    setChannelProject(linked.id, project.id);
    assignEntityToChannel(linked.id, DEFAULT_ENTITY_ID);

    // KB file on project + pinned file on linked channel
    const kbFile = createFile('kb-doc.md', 'text/markdown', 1000, 'sk-f3-kb');
    createFileRef(kbFile.id, 'project', project.id, 'pinned');
    const pinFile = createFile('pin-doc.md', 'text/markdown', 500, 'sk-f3-pin');
    createFileRef(pinFile.id, 'channel', linked.id, 'pinned');

    // Unlinked channel (uses 'default' which exists in setup)
    const debugDefault = await getPromptDebug(app, 'default');

    expect(debugDefault.assembledPrompt).not.toContain('kb-doc.md');
    expect(debugDefault.assembledPrompt).not.toContain('pin-doc.md');
    expect(debugDefault.layers['3_projectMemory']).toContain('INACTIVE');
  });

  it('F4: Project KB files without memory — L3 still ACTIVE with file listing only', async () => {
    const app = createTestApp();

    // Project with NO memory text, but has a KB file
    const project = createProject('Files Only Project', '');
    const ch = createChannel('files-only-ch', '');
    setChannelProject(ch.id, project.id);
    assignEntityToChannel(ch.id, DEFAULT_ENTITY_ID);

    const file = createFile('reference.pdf', 'application/pdf', 24500, 'sk-f4-ref');
    createFileRef(file.id, 'project', project.id, 'pinned');

    const debug = await getPromptDebug(app, ch.id);

    // L3 active because of file, even though memory text is empty
    expect(debug.layers['3_projectMemory']).toContain('ACTIVE');
    expect(debug.layers['3_projectMemory']).toContain('reference.pdf');
    expect(debug.assembledPrompt).toContain('Project knowledge base files:');
    expect(debug.assembledPrompt).toContain('reference.pdf');
    // But no "Project memory:" section
    expect(debug.assembledPrompt).not.toContain('Project memory:');
  });
});

// ═══════════════════════════════════════════════════════════════
// GROUP G — Lifecycle and listing format
// ═══════════════════════════════════════════════════════════════

describe('Group G — Lifecycle and listing format', () => {
  it('G1: Pin/unpin lifecycle reflected in prompt-debug', async () => {
    const app = createTestApp();

    const file = createFile('transient.md', 'text/markdown', 300, 'sk-g1-transient');
    const ref = createFileRef(file.id, 'channel', 'default', 'pinned');

    // Pinned: file appears
    const debugBefore = await getPromptDebug(app, 'default');
    expect(debugBefore.assembledPrompt).toContain('transient.md');
    expect(debugBefore.layers['4_channelAddendum']).toContain('transient.md');

    // Unpin via direct query (deleteFileRef)
    const { deleteFileRef } = await import('../db/queries.js');
    deleteFileRef(ref.id);

    // Unpinned: file gone
    const debugAfter = await getPromptDebug(app, 'default');
    expect(debugAfter.assembledPrompt).not.toContain('transient.md');
  });

  it('G2: Multiple files listed with correct format (name + mime type)', async () => {
    const app = createTestApp();

    createFileRef(
      createFile('readme.md', 'text/markdown', 1200, 'sk-g2-readme').id,
      'channel', 'default', 'pinned'
    );
    createFileRef(
      createFile('schema.sql', 'text/plain', 3400, 'sk-g2-schema').id,
      'channel', 'default', 'pinned'
    );
    createFileRef(
      createFile('logo.png', 'image/png', 45000, 'sk-g2-logo').id,
      'channel', 'default', 'pinned'
    );

    const debug = await getPromptDebug(app, 'default');

    // All three listed
    expect(debug.assembledPrompt).toContain('readme.md');
    expect(debug.assembledPrompt).toContain('schema.sql');
    expect(debug.assembledPrompt).toContain('logo.png');

    // Mime types present in listing
    expect(debug.assembledPrompt).toContain('text/markdown');
    expect(debug.assembledPrompt).toContain('text/plain');
    expect(debug.assembledPrompt).toContain('image/png');

    // Layer 4 summary shows count
    expect(debug.layers['4_channelAddendum']).toContain('3 file(s) pinned');
  });

  it('G3: Channel addendum text + pinned files coexist in L4', async () => {
    const app = createTestApp();

    // Create channel with a system prompt (channel addendum)
    const ch = createChannel('addendum-ch', 'Focus on performance optimization.');
    assignEntityToChannel(ch.id, DEFAULT_ENTITY_ID);

    // Pin a file
    const file = createFile('benchmarks.csv', 'text/csv', 8000, 'sk-g3-bench');
    createFileRef(file.id, 'channel', ch.id, 'pinned');

    const debug = await getPromptDebug(app, ch.id);

    // Both addendum text and file listing present
    expect(debug.assembledPrompt).toContain('performance optimization');
    expect(debug.assembledPrompt).toContain('Channel files available:');
    expect(debug.assembledPrompt).toContain('benchmarks.csv');

    // Layer 4 summary reflects both
    expect(debug.layers['4_channelAddendum']).toContain('chars');
    expect(debug.layers['4_channelAddendum']).toContain('1 file(s) pinned');
  });

  it('G4: Imported channel with project KB + channel pin + addendum — full 5-layer assembly', async () => {
    const app = createTestApp();

    // Full setup: project with instructions, memory, KB file
    const project = createProject(
      'Full Stack Project',
      'Use Hono for the server layer.',
      'native',
      {},
      'Database is SQLite via better-sqlite3.'
    );
    const kbFile = createFile('api-spec.yaml', 'application/yaml', 12000, 'sk-g4-api');
    createFileRef(kbFile.id, 'project', project.id, 'pinned');

    // Import a session linked to this project
    const channelId = importSyntheticSession({
      sessionId: 'g4',
      channelName: 'full-assembly',
      projectId: project.id,
    });

    // Set channel addendum and pin a channel file
    const { updateChannel } = await import('../db/queries.js');
    updateChannel(channelId, { systemPrompt: 'This channel focuses on API design.' });

    const chFile = createFile('endpoints.md', 'text/markdown', 2000, 'sk-g4-endpoints');
    createFileRef(chFile.id, 'channel', channelId, 'pinned');

    const debug = await getPromptDebug(app, channelId);

    // All 5 layers active
    expect(debug.layers['1_kitBriefing']).toContain('ACTIVE');
    expect(debug.layers['2_projectInstructions']).toContain('ACTIVE');
    expect(debug.layers['3_projectMemory']).toContain('ACTIVE');
    expect(debug.layers['4_channelAddendum']).toContain('ACTIVE');
    expect(debug.layers['5_entityPrompt']).toBeDefined();

    // Content from each layer present in assembled prompt
    expect(debug.assembledPrompt).toContain('imported into Klatch');        // L1
    expect(debug.assembledPrompt).toContain('Hono for the server');         // L2
    expect(debug.assembledPrompt).toContain('SQLite via better-sqlite3');   // L3 memory
    expect(debug.assembledPrompt).toContain('api-spec.yaml');               // L3 KB file
    expect(debug.assembledPrompt).toContain('API design');                  // L4 addendum
    expect(debug.assembledPrompt).toContain('endpoints.md');                // L4 pinned file

    // Verify layer ordering in assembled prompt
    const positions = {
      l1: debug.assembledPrompt.indexOf('imported into Klatch'),
      l2: debug.assembledPrompt.indexOf('Hono for the server'),
      l3mem: debug.assembledPrompt.indexOf('SQLite via better-sqlite3'),
      l3file: debug.assembledPrompt.indexOf('api-spec.yaml'),
      l4text: debug.assembledPrompt.indexOf('API design'),
      l4file: debug.assembledPrompt.indexOf('endpoints.md'),
    };

    expect(positions.l1).toBeLessThan(positions.l2);
    expect(positions.l2).toBeLessThan(positions.l3mem);
    expect(positions.l3mem).toBeLessThan(positions.l3file);
    expect(positions.l3file).toBeLessThan(positions.l4text);
    expect(positions.l4text).toBeLessThan(positions.l4file);
  });
});
