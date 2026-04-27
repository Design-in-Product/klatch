/**
 * Round 28 — AAXT: Export Pipeline Structural Verification
 *
 * Theseus's structural AAXT for Step 10. Tests the export pipeline, transport
 * adapters, round-trip fidelity, MCP↔HTTP parity, and prompt-debug→manifest
 * consistency. No LLM calls — all mocked.
 *
 * Groups:
 *   A1 — Export format correctness (manifest schema across channel configurations)
 *   A2 — Transport adapter fidelity (Claude Code + claude.ai formats)
 *   A3 — Import→Export round-trip (provenance chain, message preservation)
 *   A4 — MCP↔HTTP parity (shared assembler produces identical output)
 *   A5 — Prompt-debug→manifest consistency
 *
 * Design brief: Theseus session 2026-04-26 (AAXT plan, Track A)
 */

import { describe, it, expect, vi } from 'vitest';
import './setup.js';
import { createTestApp } from './app.js';
import {
  createChannel,
  createProject,
  createEntity,
  assignEntityToChannel,
  setChannelProject,
  insertMessage,
  createFile,
  createFileRef,
  importSession,
  appendReflection,
  updateChannelCompaction,
} from '../db/queries.js';
import { buildManifest, mergeFieldNotes, FORMAT_VERSION } from '../export/package-builder.js';
import { adaptToClaudeCode, resolveTemplates } from '../export/transport-claude-code.js';
import { adaptToClaudeAi } from '../export/transport-claude-ai.js';
import { assembleChannelManifest } from '../export/assemble.js';
import { _internal, createKlatchMcpServer } from '../mcp/server.js';
import { buildSystemPrompt } from '../claude/client.js';
import { getDb } from '../db/index.js';
import { v4 as uuidv4 } from 'uuid';
import type { Entity, Channel, Project, Message, MicroReflection } from '@klatch/shared';
import { DEFAULT_MODEL, DEFAULT_ENTITY_ID, DEFAULT_INTERACTION_MODE } from '@klatch/shared';

const { assembleChannelPackage } = _internal;

// Mock LLM calls — no real API calls in structural AAXT
const mockMessagesCreate = vi.fn();
vi.mock('@anthropic-ai/sdk', () => ({
  default: class MockAnthropic {
    messages = { create: mockMessagesCreate };
  },
}));

vi.mock('../aaxt/auxiliary.js', () => ({
  queryAuxiliary: vi.fn(),
  getAuxiliaryInfo: vi.fn(() => ({ provider: 'openai', model: 'gpt-4o-mini' })),
}));

vi.mock('../claude/client.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../claude/client.js')>();
  return {
    ...actual,
    streamClaude: vi.fn(),
    streamClaudeRoundtable: vi.fn(),
  };
});

vi.mock('../files/storage.js', () => ({
  readFile: vi.fn((key: string) => Buffer.from(`content of ${key}`)),
  saveFile: vi.fn(),
  validateFile: vi.fn(),
  getFilePath: vi.fn(),
  isTextFile: vi.fn(),
  isImageFile: vi.fn(),
  MAX_FILE_SIZE_BYTES: 10 * 1024 * 1024,
}));

// ── Helpers ──

function insertImportedChannel(
  name: string,
  source: 'claude-code' | 'claude-ai',
  metadata: Record<string, any>,
): string {
  const id = uuidv4();
  getDb()
    .prepare(
      `INSERT INTO channels (id, name, system_prompt, model, mode, type, source, source_metadata, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
    )
    .run(id, name, '', DEFAULT_MODEL, 'panel', 'chat', source, JSON.stringify(metadata));
  // Assign default entity
  getDb()
    .prepare('INSERT INTO channel_entities (channel_id, entity_id) VALUES (?, ?)')
    .run(id, DEFAULT_ENTITY_ID);
  return id;
}

function setupRichChannel(): { channelId: string; projectId: string; entityId: string } {
  const proj = createProject('AAXT Project', 'Follow TypeScript conventions.', 'native', {}, 'User prefers Vitest. Project uses SQLite.');
  const ch = createChannel('rich-channel', 'Focus on performance.');
  setChannelProject(ch.id, proj.id);

  const entity = createEntity('TestBot', DEFAULT_MODEL, 'You are a testing specialist.', '#6366f1', 'testbot', 'high');
  assignEntityToChannel(ch.id, entity.id);

  // Add messages
  for (let i = 0; i < 6; i++) {
    insertMessage(ch.id, i % 2 === 0 ? 'user' : 'assistant', `Message ${i + 1}`, 'complete');
  }

  // Add files at both scopes
  const kbFile = createFile('spec.md', 'text/markdown', 5000, 'sk-kb-spec');
  createFileRef(kbFile.id, 'project', proj.id, 'pinned');
  const pinFile = createFile('notes.txt', 'text/plain', 800, 'sk-pin-notes');
  createFileRef(pinFile.id, 'channel', ch.id, 'pinned');

  return { channelId: ch.id, projectId: proj.id, entityId: entity.id };
}

function maskVolatile(manifest: any): any {
  const clone = JSON.parse(JSON.stringify(manifest));
  clone.package_id = '<masked>';
  clone.created_at = '<masked>';
  if (Array.isArray(clone.provenance)) {
    clone.provenance = clone.provenance.map((e: any) => {
      const m = { ...e, event_id: '<masked>' };
      if (m.at) m.at = '<masked>';
      return m;
    });
  }
  if (clone.conversation_context) {
    if (clone.conversation_context.last_active_at) clone.conversation_context.last_active_at = '<masked>';
    if (clone.conversation_context.created_at) clone.conversation_context.created_at = '<masked>';
  }
  if (clone.conversation_history) {
    if (clone.conversation_history.first_message_at) clone.conversation_history.first_message_at = '<masked>';
    if (clone.conversation_history.last_message_at) clone.conversation_history.last_message_at = '<masked>';
  }
  if (Array.isArray(clone.files)) {
    clone.files = clone.files.map((f: any) => ({ ...f, added_at: f.added_at ? '<masked>' : f.added_at }));
  }
  return clone;
}

// ═══════════════════════════════════════════════════════════════
// A1 — Export format correctness
// ═══════════════════════════════════════════════════════════════

describe('A1 — Export format correctness', () => {
  it('A1.1: Rich native channel produces complete manifest', () => {
    const { channelId, projectId } = setupRichChannel();
    const pkg = assembleChannelPackage(channelId);

    expect(pkg).not.toBeNull();
    expect(pkg.format_version).toBe(FORMAT_VERSION);
    expect(pkg.source_type).toBe('klatch');
    expect(pkg.package_kind).toBe('klatch.context.v1');
    expect(pkg.package_id).toBeTruthy();
    expect(pkg.created_at).toBeTruthy();

    // Provenance: native channel → 1 hop
    expect(pkg.provenance).toHaveLength(1);
    expect(pkg.provenance[0].source).toBe('klatch');

    // Project present
    expect(pkg.project).not.toBeNull();
    expect(pkg.project.name).toBe('AAXT Project');
    expect(pkg.project.instructions.length_chars).toBeGreaterThan(0);
    expect(pkg.project.memory.length_chars).toBeGreaterThan(0);
    expect(pkg.project.knowledge_base_file_ids).toHaveLength(1);

    // Conversation context
    expect(pkg.conversation_context.name).toBe('rich-channel');
    expect(pkg.conversation_context.pinned_file_ids).toHaveLength(1);

    // Entities
    expect(pkg.entities.length).toBeGreaterThanOrEqual(1);
    const bot = pkg.entities.find((e: any) => e.name === 'TestBot');
    expect(bot).toBeDefined();
    expect(bot.prompt_length_chars).toBeGreaterThan(0);

    // Files — deduplicated
    expect(pkg.files).toHaveLength(2); // 1 project + 1 channel (no overlap)

    // Conversation history
    expect(pkg.conversation_history.message_count).toBe(6);
    expect(pkg.conversation_history.first_message_at).toBeTruthy();
    expect(pkg.conversation_history.last_message_at).toBeTruthy();
  });

  it('A1.2: Native channel without project has null project and INACTIVE L2/L3', () => {
    // Use the default channel — no project linked
    const pkg = assembleChannelPackage('default');

    expect(pkg).not.toBeNull();
    expect(pkg.project).toBeNull();
    expect(pkg.provenance).toHaveLength(1);

    // Layer fidelity
    const klatchHop = pkg.provenance[0];
    expect(klatchHop.layer_fidelity.L2).toBe('absent');
    expect(klatchHop.layer_fidelity.L3).toBe('absent');
  });

  it('A1.3: Imported channel has 2-hop provenance chain', () => {
    const chId = insertImportedChannel('imported-test', 'claude-code', {
      originalSessionId: 'sess-001',
      cwd: '/home/user/project',
      importedAt: '2026-04-01T00:00:00Z',
    });
    insertMessage(chId, 'user', 'Hello', 'complete');

    const pkg = assembleChannelPackage(chId);

    expect(pkg.provenance).toHaveLength(2);
    expect(pkg.provenance[0].source).toBe('claude-code');
    expect(pkg.provenance[0].session_id).toBe('sess-001');
    expect(pkg.provenance[0].path).toBe('/home/user/project');
    expect(pkg.provenance[1].source).toBe('klatch');
  });

  it('A1.4: Entity with reflections includes field_notes in manifest', () => {
    const { channelId, entityId } = setupRichChannel();

    appendReflection(entityId, {
      observation: 'User prefers short responses.',
      createdAt: new Date().toISOString(),
      channelId,
      type: 'observation',
    });

    const pkg = assembleChannelPackage(channelId);
    const entity = pkg.entities.find((e: any) => e.name === 'TestBot');
    expect(entity.field_notes).not.toBeNull();
    expect(entity.field_notes).toHaveLength(1);
    expect(entity.field_notes[0].observation).toBe('User prefers short responses.');
    expect(entity.field_notes[0].source).toBe('micro-reflection');
    expect(entity.field_notes[0].trust).toBe('agent-observed');
    expect(entity.field_notes[0].status).toBe('draft');
  });

  it('A1.5: Channel with compaction state includes it in manifest', () => {
    const ch = createChannel('compacted-ch', '');
    assignEntityToChannel(ch.id, DEFAULT_ENTITY_ID);
    insertMessage(ch.id, 'user', 'Before compaction', 'complete');
    const msg2 = insertMessage(ch.id, 'assistant', 'After compaction', 'complete');
    updateChannelCompaction(ch.id, {
      summary: 'Prior conversation discussed architecture.',
      timestamp: '2026-04-20T10:00:00Z',
      beforeMessageId: msg2.id,
    });

    const pkg = assembleChannelPackage(ch.id);
    expect(pkg.conversation_context.compaction_state).not.toBeNull();
    expect(pkg.conversation_context.compaction_state.summary).toContain('architecture');
    expect(pkg.conversation_context.compaction_state.before_message_id).toBe(msg2.id);
  });

  it('A1.6: Files deduplicated when same file at project and channel scope', () => {
    const proj = createProject('Dedup Project', '');
    const ch = createChannel('dedup-ch', '');
    setChannelProject(ch.id, proj.id);
    assignEntityToChannel(ch.id, DEFAULT_ENTITY_ID);

    // Same file, two refs
    const file = createFile('shared.md', 'text/markdown', 1000, 'sk-shared');
    createFileRef(file.id, 'project', proj.id, 'pinned');
    createFileRef(file.id, 'channel', ch.id, 'pinned');

    const pkg = assembleChannelPackage(ch.id);
    expect(pkg.files).toHaveLength(1); // deduplicated
    expect(pkg.files[0].id).toBe(file.id);
  });
});

// ═══════════════════════════════════════════════════════════════
// A2 — Transport adapter fidelity
// ═══════════════════════════════════════════════════════════════

describe('A2 — Transport adapter fidelity', () => {
  it('A2.1: Claude Code adapter includes reverse kit briefing in CLAUDE.md', () => {
    const { channelId } = setupRichChannel();
    const pkg = assembleChannelPackage(channelId);
    const ccExport = adaptToClaudeCode(pkg);

    expect(ccExport.claudeMd).toContain('Context from Klatch');
    expect(ccExport.claudeMd).toContain('rich-channel');
    expect(ccExport.claudeMd).toContain('Claude Code'); // mentions tool access
  });

  it('A2.2: Claude Code adapter includes template placeholders for L2 and L4', () => {
    const { channelId } = setupRichChannel();
    const pkg = assembleChannelPackage(channelId);
    const ccExport = adaptToClaudeCode(pkg);

    expect(ccExport.claudeMd).toContain('{{LAYER_2_INSTRUCTIONS}}');
    expect(ccExport.claudeMd).toContain('{{LAYER_4_CONTEXT}}');
    expect(ccExport.memoryMd).toContain('{{LAYER_3_MEMORY}}');
  });

  it('A2.3: resolveTemplates replaces all placeholders', () => {
    const { channelId } = setupRichChannel();
    const pkg = assembleChannelPackage(channelId);
    const ccExport = adaptToClaudeCode(pkg);

    const resolved = resolveTemplates(ccExport, {
      layer2Instructions: 'Follow TypeScript conventions.',
      layer3Memory: 'User prefers Vitest.',
      layer4Context: 'Focus on performance.',
    });

    expect(resolved.claudeMd).not.toContain('{{LAYER_2_INSTRUCTIONS}}');
    expect(resolved.claudeMd).toContain('Follow TypeScript conventions.');
    expect(resolved.claudeMd).not.toContain('{{LAYER_4_CONTEXT}}');
    expect(resolved.claudeMd).toContain('Focus on performance.');
    expect(resolved.memoryMd).not.toContain('{{LAYER_3_MEMORY}}');
    expect(resolved.memoryMd).toContain('User prefers Vitest.');
  });

  it('A2.4: Claude Code adapter includes field notes in MEMORY.md', () => {
    const { channelId, entityId } = setupRichChannel();
    appendReflection(entityId, {
      observation: 'User likes concise code reviews.',
      createdAt: new Date().toISOString(),
      channelId,
      type: 'observation',
    });

    const pkg = assembleChannelPackage(channelId);
    const ccExport = adaptToClaudeCode(pkg);

    expect(ccExport.memoryMd).toContain('Behavioral Notes');
    expect(ccExport.memoryMd).toContain('concise code reviews');
    expect(ccExport.memoryMd).toContain('TestBot');
  });

  it('A2.5: claude.ai adapter maps sender correctly', () => {
    const { channelId } = setupRichChannel();
    const pkg = assembleChannelPackage(channelId);
    const messages = Array.from({ length: 6 }, (_, i) => ({
      id: `msg-${i}`,
      channelId,
      role: (i % 2 === 0 ? 'user' : 'assistant') as 'user' | 'assistant',
      content: `Message ${i + 1}`,
      status: 'complete' as const,
      createdAt: '2026-04-01T00:00:00Z',
    }));

    const caiExport = adaptToClaudeAi(pkg, messages);
    const conversations = JSON.parse(caiExport.conversationsJson);

    expect(conversations).toHaveLength(1);
    expect(conversations[0].chat_messages).toHaveLength(6);
    expect(conversations[0].chat_messages[0].sender).toBe('human');
    expect(conversations[0].chat_messages[1].sender).toBe('assistant');
  });

  it('A2.6: claude.ai adapter includes prompt_template from L2', () => {
    const { channelId } = setupRichChannel();
    const pkg = assembleChannelPackage(channelId);
    const messages: Message[] = [];

    const caiExport = adaptToClaudeAi(pkg, messages, 'Follow TypeScript conventions.');
    const projects = JSON.parse(caiExport.projectsJson);

    expect(projects).toHaveLength(1);
    expect(projects[0].prompt_template).toBe('Follow TypeScript conventions.');
  });

  it('A2.7: claude.ai adapter converts field notes to memories', () => {
    const { channelId, entityId } = setupRichChannel();
    appendReflection(entityId, {
      observation: 'Prefers terse responses.',
      createdAt: new Date().toISOString(),
      channelId,
      type: 'session-end',
    });

    const pkg = assembleChannelPackage(channelId);
    const caiExport = adaptToClaudeAi(pkg, []);
    const memories = JSON.parse(caiExport.memoriesJson);

    expect(memories.length).toBeGreaterThanOrEqual(1);
    const noteMemory = memories.find((m: any) => m.content.includes('terse responses'));
    expect(noteMemory).toBeDefined();
    expect(noteMemory.content).toContain('[TestBot]');
  });
});

// ═══════════════════════════════════════════════════════════════
// A3 — Import→Export round-trip
// ═══════════════════════════════════════════════════════════════

describe('A3 — Import→Export round-trip', () => {
  it('A3.1: Imported Claude Code session produces 2-hop provenance', () => {
    const result = importSession({
      channelName: 'round-trip-cc',
      source: 'claude-code',
      sourceMetadata: {
        originalSessionId: 'rt-sess-001',
        cwd: '/home/user/project',
        importedAt: '2026-04-01T00:00:00Z',
      },
      turns: [
        { userText: 'Hello', assistantText: 'Hi', timestamp: '2026-04-01T10:00:00Z', originalId: 'o1' },
        { userText: 'How?', assistantText: 'Like this.', timestamp: '2026-04-01T10:01:00Z', originalId: 'o2' },
      ],
    });

    const pkg = assembleChannelPackage(result.channelId);
    expect(pkg.provenance).toHaveLength(2);
    expect(pkg.provenance[0].source).toBe('claude-code');
    expect(pkg.provenance[1].source).toBe('klatch');
    expect(pkg.conversation_history.message_count).toBe(4); // 2 user + 2 assistant
  });

  it('A3.2: Imported claude.ai session produces 2-hop provenance', () => {
    const result = importSession({
      channelName: 'round-trip-cai',
      source: 'claude-ai',
      sourceMetadata: {
        originalSessionId: 'rt-cai-001',
        importedAt: '2026-04-01T00:00:00Z',
      },
      turns: [
        { userText: 'Test', assistantText: 'OK', timestamp: '2026-04-01T10:00:00Z', originalId: 'cai-o1' },
      ],
    });

    const pkg = assembleChannelPackage(result.channelId);
    expect(pkg.provenance).toHaveLength(2);
    expect(pkg.provenance[0].source).toBe('claude-ai');
    expect(pkg.provenance[1].source).toBe('klatch');
  });

  it('A3.3: Import→Export preserves message count', () => {
    const turns = Array.from({ length: 5 }, (_, i) => ({
      userText: `Question ${i + 1}`,
      assistantText: `Answer ${i + 1}`,
      timestamp: `2026-04-01T10:${String(i).padStart(2, '0')}:00Z`,
      originalId: `msg-${i}`,
    }));

    const result = importSession({
      channelName: 'count-test',
      source: 'claude-code',
      sourceMetadata: { originalSessionId: 'count-sess', importedAt: '2026-04-01T00:00:00Z' },
      turns,
    });

    const pkg = assembleChannelPackage(result.channelId);
    expect(pkg.conversation_history.message_count).toBe(10); // 5 turns × 2 messages
  });

  it('A3.4: Layer fidelity reflects actual content for imported channel with project', () => {
    const proj = createProject('RT Project', 'Instructions here.', 'native', {}, 'Memory here.');
    const result = importSession({
      channelName: 'fidelity-test',
      source: 'claude-code',
      sourceMetadata: { originalSessionId: 'fid-sess', importedAt: '2026-04-01T00:00:00Z' },
      turns: [{ userText: 'Hi', assistantText: 'Hey', timestamp: '2026-04-01T10:00:00Z', originalId: 'f1' }],
      projectId: proj.id,
    });

    const pkg = assembleChannelPackage(result.channelId);
    const klatchHop = pkg.provenance[pkg.provenance.length - 1];
    expect(klatchHop.layer_fidelity.L1).toBe('full'); // imported
    expect(klatchHop.layer_fidelity.L2).toBe('full'); // has instructions
    expect(klatchHop.layer_fidelity.L3).toBe('full'); // has memory
    expect(klatchHop.layer_fidelity.L5).toBe('full'); // always full
  });
});

// ═══════════════════════════════════════════════════════════════
// A4 — MCP↔HTTP parity
// ═══════════════════════════════════════════════════════════════

describe('A4 — MCP↔HTTP parity', () => {
  it('A4.1: MCP and HTTP produce structurally identical manifests for rich channel', async () => {
    const { channelId } = setupRichChannel();

    // MCP path (synchronous)
    const mcpManifest = assembleChannelPackage(channelId);

    // HTTP path (async, no briefing/extraction)
    const httpResult = await assembleChannelManifest(channelId);

    expect(mcpManifest).not.toBeNull();
    expect(httpResult).not.toBeNull();

    // Mask volatile fields and compare
    const mcpMasked = maskVolatile(mcpManifest);
    const httpMasked = maskVolatile(httpResult!.manifest);

    expect(mcpMasked).toEqual(httpMasked);
  });

  it('A4.2: MCP and HTTP agree on channel without project', async () => {
    const mcpManifest = assembleChannelPackage('default');
    const httpResult = await assembleChannelManifest('default');

    expect(maskVolatile(mcpManifest)).toEqual(maskVolatile(httpResult!.manifest));
  });

  it('A4.3: MCP and HTTP agree on imported channel', async () => {
    const chId = insertImportedChannel('parity-import', 'claude-code', {
      originalSessionId: 'par-sess',
      importedAt: '2026-04-01T00:00:00Z',
    });

    const mcpManifest = assembleChannelPackage(chId);
    const httpResult = await assembleChannelManifest(chId);

    expect(maskVolatile(mcpManifest)).toEqual(maskVolatile(httpResult!.manifest));
  });

  it('A4.4: Both return null for nonexistent channel', async () => {
    const mcpManifest = assembleChannelPackage('nonexistent');
    const httpResult = await assembleChannelManifest('nonexistent');

    expect(mcpManifest).toBeNull();
    expect(httpResult).toBeNull();
  });
});

// ═══════════════════════════════════════════════════════════════
// A5 — Prompt-debug → manifest consistency
// ═══════════════════════════════════════════════════════════════

describe('A5 — Prompt-debug → manifest consistency', () => {
  it('A5.1: Active L2/L3/L4 layers match manifest content lengths', async () => {
    const { channelId } = setupRichChannel();

    const app = createTestApp();
    const res = await app.request(`/api/channels/${channelId}/prompt-debug`);
    expect(res.status).toBe(200);
    const debug = await res.json() as any;

    const pkg = assembleChannelPackage(channelId);

    // L2 active in both
    expect(debug.layers['2_projectInstructions']).toContain('ACTIVE');
    expect(pkg.project.instructions.length_chars).toBeGreaterThan(0);

    // L3 active in both
    expect(debug.layers['3_projectMemory']).toContain('ACTIVE');
    expect(pkg.project.memory.length_chars).toBeGreaterThan(0);

    // L4 active in both (has channel addendum + pinned file)
    expect(debug.layers['4_channelAddendum']).toContain('ACTIVE');
    expect(pkg.conversation_context.context.length_chars).toBeGreaterThan(0);
  });

  it('A5.2: EMPTY L3 matches manifest with zero-length memory', async () => {
    const proj = createProject('Empty Mem Project', 'Has instructions.');
    const ch = createChannel('empty-mem-ch', '');
    setChannelProject(ch.id, proj.id);
    assignEntityToChannel(ch.id, DEFAULT_ENTITY_ID);

    const app = createTestApp();
    const res = await app.request(`/api/channels/${ch.id}/prompt-debug`);
    const debug = await res.json() as any;

    const pkg = assembleChannelPackage(ch.id);

    // L3 is EMPTY in prompt-debug
    expect(debug.layers['3_projectMemory']).toContain('EMPTY');
    // Manifest has zero-length memory
    expect(pkg.project.memory.length_chars).toBe(0);
  });

  it('A5.3: Native channel has single provenance hop (no kit briefing)', async () => {
    const app = createTestApp();
    const res = await app.request('/api/channels/default/prompt-debug');
    const debug = await res.json() as any;

    const pkg = assembleChannelPackage('default');

    // L1 inactive in prompt-debug
    expect(debug.layers['1_kitBriefing']).toContain('INACTIVE');
    // Single provenance hop
    expect(pkg.provenance).toHaveLength(1);
    expect(pkg.provenance[0].layer_fidelity.L1).toBe('absent');
  });

  it('A5.4: File counts match between prompt-debug and manifest', async () => {
    const { channelId } = setupRichChannel();

    const app = createTestApp();
    const res = await app.request(`/api/channels/${channelId}/prompt-debug`);
    const debug = await res.json() as any;

    const pkg = assembleChannelPackage(channelId);

    // Prompt-debug mentions file counts
    expect(debug.layers['3_projectMemory']).toContain('1 knowledge base file(s)');
    expect(debug.layers['4_channelAddendum']).toContain('1 file(s) pinned');

    // Manifest has matching file entries
    const projectFileIds = pkg.project.knowledge_base_file_ids;
    const pinnedFileIds = pkg.conversation_context.pinned_file_ids;
    expect(projectFileIds).toHaveLength(1);
    expect(pinnedFileIds).toHaveLength(1);
  });
});
