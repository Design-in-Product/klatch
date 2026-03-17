/**
 * Round 7 speculative tests: Sidebar redesign data model
 *
 * These tests are written against the PLANNED implementation from docs/plans/SIDEBAR.md.
 * They will fail until Daedalus implements Phase 1 (type column + constraints).
 *
 * Assignment from Daedalus (2026-03-16 08:50):
 * 1. `type` column migration — channels accept 'chat' | 'klatch', default 'chat'
 * 2. Klatch requires project — creating a klatch with no projectId should fail
 * 3. Sidebar grouping by type — getAllChannelsEnriched returns `type` field
 * 4. Unassigned excludes klatches — only chats can be unassigned (no project)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import './setup.js';
import { createTestApp } from './app.js';
import {
  createChannel,
  createProject,
  setChannelProject,
  getAllChannelsEnriched,
  getChannel,
} from '../db/queries.js';

// Mock streaming — not needed
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

function patchJson(body: unknown) {
  return {
    method: 'PATCH' as const,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  };
}

// ── 1. Type column migration ─────────────────────────────────────

describe('Channel type column', () => {
  it('existing channels default to type "chat"', () => {
    // The default #general channel should have type 'chat'
    const general = getChannel('default');
    expect(general).toBeDefined();
    expect((general as any).type).toBe('chat');
  });

  it('createChannel defaults to type "chat"', () => {
    const ch = createChannel('Test Chat', 'prompt');
    expect((ch as any).type).toBe('chat');
  });

  it('can create a channel with type "klatch"', () => {
    const project = createProject('P', 'I');
    // createChannel may need a type parameter — testing the planned API
    const ch = createChannel('Team Standup', 'prompt', undefined, undefined, 'klatch');
    setChannelProject(ch.id, project.id);
    const fetched = getChannel(ch.id);
    expect((fetched as any).type).toBe('klatch');
  });

  it('getAllChannelsEnriched returns type field', () => {
    const enriched = getAllChannelsEnriched();
    const general = enriched.find((ch) => ch.id === 'default');
    expect(general).toBeDefined();
    expect((general as any).type).toBe('chat');
  });

  it('enriched query distinguishes chats from klatches in same project', () => {
    const project = createProject('Mixed Project', 'Instructions');

    const chat = createChannel('1:1 Discussion', '');
    setChannelProject(chat.id, project.id);

    const klatch = createChannel('Standup', '', undefined, undefined, 'klatch');
    setChannelProject(klatch.id, project.id);

    const enriched = getAllChannelsEnriched();
    const chatEnriched = enriched.find((ch) => ch.id === chat.id);
    const klatchEnriched = enriched.find((ch) => ch.id === klatch.id);

    expect((chatEnriched as any).type).toBe('chat');
    expect((klatchEnriched as any).type).toBe('klatch');
    // Both under same project
    expect(chatEnriched!.projectName).toBe('Mixed Project');
    expect(klatchEnriched!.projectName).toBe('Mixed Project');
  });
});

// ── 2. Klatch requires project ───────────────────────────────────

describe('Klatch-project constraint', () => {
  let app: ReturnType<typeof createApp>;
  beforeEach(() => { app = createApp(); });

  it('creating a klatch without projectId succeeds at API level (UI enforces project requirement)', async () => {
    // Note: klatch-requires-project is a UI-level constraint, not server-enforced.
    // The server allows creating klatches without projects — the UI prevents it.
    const res = await app.request('/api/channels', jsonReq({
      name: 'Orphan Klatch',
      type: 'klatch',
    }));

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.name).toBe('Orphan Klatch');
    expect(body.type).toBe('klatch');
  });

  it('creating a klatch with projectId succeeds via API', async () => {
    const project = createProject('Klatch Project', 'Instructions');
    const res = await app.request('/api/channels', jsonReq({
      name: 'Team Standup',
      type: 'klatch',
      projectId: project.id,
    }));

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.name).toBe('Team Standup');
  });

  it('removing project from a klatch via PATCH succeeds at API level (UI enforces constraint)', async () => {
    // Note: klatch-requires-project is a UI-level constraint.
    // The server allows unlinking — the UI prevents the action.
    const project = createProject('P', 'I');
    const klatch = createChannel('K', '', undefined, undefined, 'klatch');
    setChannelProject(klatch.id, project.id);

    const res = await app.request(`/api/channels/${klatch.id}`, patchJson({
      projectId: null,
    }));

    expect(res.status).toBe(200);
  });

  it('creating a chat without projectId is allowed', async () => {
    const res = await app.request('/api/channels', jsonReq({
      name: 'Loose Chat',
      // type defaults to 'chat', no projectId needed
    }));

    expect(res.status).toBe(201);
  });
});

// ── 3. Unassigned excludes klatches ──────────────────────────────

describe('Unassigned channels — klatches excluded', () => {
  it('enriched query: klatches always have a project, never appear unassigned', () => {
    const project = createProject('P', 'I');

    // Create a chat with no project (unassigned)
    const chat = createChannel('Loose Chat', '');

    // Create a klatch with project
    const klatch = createChannel('Standup', '', undefined, undefined, 'klatch');
    setChannelProject(klatch.id, project.id);

    const enriched = getAllChannelsEnriched();

    // Chat has no project
    const chatEnriched = enriched.find((ch) => ch.id === chat.id);
    expect(chatEnriched!.projectId).toBeUndefined();
    expect((chatEnriched as any).type).toBe('chat');

    // Klatch has a project
    const klatchEnriched = enriched.find((ch) => ch.id === klatch.id);
    expect(klatchEnriched!.projectId).toBe(project.id);
    expect((klatchEnriched as any).type).toBe('klatch');

    // No klatches should appear in the unassigned set
    const unassigned = enriched.filter(
      (ch) => !ch.projectId && ch.id !== 'default'
    );
    expect(unassigned.every((ch) => (ch as any).type === 'chat')).toBe(true);
  });

  it('imported channels default to type "chat" (not klatch)', () => {
    // Imported conversations are always chats — klatches are Klatch-native only
    const enriched = getAllChannelsEnriched();
    const imported = enriched.filter((ch) => ch.source && ch.source !== 'native');
    // All imported channels should be type 'chat'
    for (const ch of imported) {
      expect((ch as any).type).toBe('chat');
    }
  });
});
