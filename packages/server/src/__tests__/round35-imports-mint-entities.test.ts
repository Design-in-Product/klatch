/**
 * Round 35 — imports mint entities (continuity step #1).
 *
 * The gate on the whole continuity model. Before this, every import bound to
 * DEFAULT_ENTITY_ID, so a real agent's channel-set was empty and the
 * entity-scoped assembly path had nothing to assemble.
 *
 * Design per xian 2026-08-08: Klatch guesses the entity name, the user
 * confirms it at import. These tests pin both halves plus the
 * backward-compatible default.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { guessEntityName } from '../import/entity-guess.js';
import { resolveImportEntity } from '../import/entity-resolve.js';
import {
  importSession,
  createEntity,
  getAllEntities,
  getEntity,
  getMessages,
  getChannelEntities,
} from '../db/queries.js';
import { DEFAULT_ENTITY_ID, DEFAULT_MODEL } from '@klatch/shared';
import type { ParsedTurn } from '../import/parser.js';

function turns(): ParsedTurn[] {
  return [
    {
      userText: 'You are Daedalus, resuming work on the schema.',
      assistantText: 'Picking up where we left off.',
      timestamp: '2026-08-09T10:00:00.000Z',
      originalId: 'turn-1',
    } as ParsedTurn,
    {
      userText: 'Carry on.',
      assistantText: 'Done.',
      timestamp: '2026-08-09T10:05:00.000Z',
      originalId: 'turn-2',
    } as ParsedTurn,
  ];
}

function doImport(channelName: string, entityId?: string) {
  return importSession({
    channelName,
    source: 'claude-code',
    sourceMetadata: { originalSessionId: `sess-${channelName}` },
    model: DEFAULT_MODEL,
    turns: turns(),
    entityId,
  });
}

describe('Round 35 — entity name guessing', () => {
  it('reads an identity claim out of the opening turn', () => {
    const guess = guessEntityName('You are Daedalus, resuming on Amber.', 'klatch');
    expect(guess.name).toBe('Daedalus');
    expect(guess.basis).toBe('identity-claim');
  });

  it('normalizes casing so one agent does not become two entities', () => {
    // "you are daedalus" and "You are Daedalus" must propose the same name,
    // or reuse-by-name silently mints a duplicate on the second import.
    const lower = guessEntityName('you are daedalus, continuing.', 'klatch');
    const upper = guessEntityName('You are Daedalus, continuing.', 'klatch');
    expect(lower.name).toBe(upper.name);
  });

  it('recognizes the resuming/continuing phrasing', () => {
    const guess = guessEntityName('This is Calliope picking up the chronicle.', 'klatch');
    expect(guess.name).toBe('Calliope');
    expect(guess.basis).toBe('identity-claim');
  });

  it('falls back to the project name and says so', () => {
    const guess = guessEntityName('Can you fix this failing test?', 'klatch');
    expect(guess.name).toBe('klatch');
    expect(guess.basis).toBe('project-name');
    // The rationale must warn that this names the work, not the agent —
    // otherwise the user rubber-stamps a project name as an agent identity.
    expect(guess.rationale).toMatch(/names the work, not the agent/i);
  });

  it('does not propose sentence filler as a name', () => {
    // "You are working on..." must not yield the entity "Working".
    const guess = guessEntityName('You are working on the import path today.', 'klatch');
    expect(guess.basis).toBe('project-name');
    expect(guess.name).toBe('klatch');
  });

  it('reports honestly when there is nothing to guess from', () => {
    const guess = guessEntityName('', '');
    expect(guess.name).toBe('');
    expect(guess.basis).toBe('none');
  });

  it('always carries a rationale the user can evaluate', () => {
    for (const g of [
      guessEntityName('You are Iris.', 'klatch'),
      guessEntityName('hello', 'klatch'),
      guessEntityName('', ''),
    ]) {
      expect(g.rationale.length).toBeGreaterThan(0);
    }
  });
});

describe('Round 35 — resolving the confirmed entity', () => {
  it('mints a new entity when the confirmed name is unknown', () => {
    const before = getAllEntities().length;
    const resolved = resolveImportEntity({ entityName: 'Daedalus' });

    expect(resolved.disposition).toBe('minted');
    expect(getAllEntities().length).toBe(before + 1);
    expect(getEntity(resolved.entityId!)?.name).toBe('Daedalus');
  });

  it('minted entities carry an empty system prompt — identity is the transcript', () => {
    // PREMISE.md: an entity is its conversation, not a prompt-defined persona.
    // Inventing a role prompt at import time is the drift.
    const resolved = resolveImportEntity({ entityName: 'Theseus' });
    expect(getEntity(resolved.entityId!)?.systemPrompt).toBe('');
  });

  it('REUSES by name — five confirmed imports of one agent make ONE entity', () => {
    // This is xian's default assumption made real ("I am assuming it is one
    // entity"), and the whole reason reuse-by-name exists.
    const ids = new Set<string>();
    for (let i = 0; i < 5; i++) {
      ids.add(resolveImportEntity({ entityName: 'Daedalus' }).entityId!);
    }
    expect(ids.size).toBe(1);
  });

  it('matches names case- and whitespace-insensitively', () => {
    const first = resolveImportEntity({ entityName: 'Daedalus' });
    const second = resolveImportEntity({ entityName: '  daedalus ' });
    expect(second.entityId).toBe(first.entityId);
    expect(second.disposition).toBe('matched-by-name');
  });

  it('binds to an explicitly chosen existing entity', () => {
    const existing = createEntity('Argus', DEFAULT_MODEL, '', '#10b981');
    const resolved = resolveImportEntity({ entityId: existing.id, entityName: 'Ignored' });
    expect(resolved.entityId).toBe(existing.id);
    expect(resolved.disposition).toBe('bound-existing');
  });

  it('throws on an unknown explicit entity id rather than silently defaulting', () => {
    // Binding a transcript to the wrong agent is the expensive-to-undo
    // direction, so a bad id must fail loudly.
    expect(() => resolveImportEntity({ entityId: 'no-such-entity' })).toThrow(/not found/i);
  });

  it('falls back to the default when nothing was confirmed', () => {
    const resolved = resolveImportEntity({});
    expect(resolved.disposition).toBe('default');
    expect(resolved.entityId).toBeUndefined();
  });
});

describe('Round 35 — importSession binds the transcript to the entity', () => {
  let daedalus: string;

  beforeEach(() => {
    daedalus = resolveImportEntity({ entityName: 'Daedalus' }).entityId!;
  });

  it('stamps assistant messages with the bound entity, not the default', () => {
    const result = doImport('Session A', daedalus);
    const assistant = getMessages(result.channelId).filter((m) => m.role === 'assistant');

    expect(assistant.length).toBeGreaterThan(0);
    for (const m of assistant) {
      expect(m.entityId).toBe(daedalus);
      expect(m.entityId).not.toBe(DEFAULT_ENTITY_ID);
    }
  });

  it('assigns the channel to the bound entity', () => {
    const result = doImport('Session B', daedalus);
    const ids = getChannelEntities(result.channelId).map((e) => e.id);
    expect(ids).toContain(daedalus);
    expect(ids).not.toContain(DEFAULT_ENTITY_ID);
  });

  it('gives the entity a non-empty channel set across multiple imports', () => {
    // The actual gate: before this change an agent's channel-set was empty,
    // so entity-scoped assembly had nothing to union. Two sessions, one agent,
    // both channels reachable from that agent.
    const a = doImport('Session C', daedalus);
    const b = doImport('Session D', daedalus);

    for (const channelId of [a.channelId, b.channelId]) {
      expect(getChannelEntities(channelId).map((e) => e.id)).toContain(daedalus);
    }

    // And the union of their messages is that agent's transcript-in-waiting.
    const union = [...getMessages(a.channelId), ...getMessages(b.channelId)]
      .filter((m) => m.entityId === daedalus);
    expect(union.length).toBe(4); // 2 assistant turns per session
  });

  it('BACKWARD COMPATIBLE: omitting entityId still binds to the default entity', () => {
    // The ~49 existing imported channels and every prior caller depend on this.
    const result = doImport('Legacy Session');
    const assistant = getMessages(result.channelId).filter((m) => m.role === 'assistant');

    for (const m of assistant) {
      expect(m.entityId).toBe(DEFAULT_ENTITY_ID);
    }
    expect(getChannelEntities(result.channelId).map((e) => e.id)).toContain(DEFAULT_ENTITY_ID);
  });

  it('user messages stay unattributed — they are the human, not the agent', () => {
    const result = doImport('Session E', daedalus);
    const user = getMessages(result.channelId).filter((m) => m.role === 'user');
    for (const m of user) {
      expect(m.entityId).toBeUndefined();
    }
  });
});
