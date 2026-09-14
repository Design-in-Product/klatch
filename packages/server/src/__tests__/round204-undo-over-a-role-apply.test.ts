/**
 * Round 204 — undo over a role apply.
 *
 * Theseus's Round 203 §7 named the gap: nobody had driven undo after a
 * role-basis apply. The reason it matters is Round 202's own change. Before it,
 * every applied row resolved its target by name, so one name meant one entity
 * id and undo's minted-entity removal could not meet two rows pointing at two
 * agents called the same thing. `role-title` sets `reuseByName: false`, so one
 * run mints one agent per channel — on xian's March corpus that is nine agents,
 * two of which share a name up to case.
 *
 * `scripts/probe-round204-…` drives the whole path against a copy of that
 * corpus (apply → undo → re-apply → undo, 9 agents and 821 rows, byte state
 * compared column by column). These are the same claims at unit scale so they
 * run in CI, where the corpus is not reachable.
 */

import { describe, it, expect } from 'vitest';
import './setup.js';
import { getDb } from '../db/index.js';
import {
  planEntityBackfill,
  applyEntityBackfill,
  undoEntityBackfill,
} from '../db/entity-backfill.js';
import { getChannelEntities, getAllEntities } from '../db/queries.js';
import { DEFAULT_ENTITY_ID } from '@klatch/shared';

function seedRole(id: string, opener: string, addedAt = '2026-01-02T03:04:05.000Z') {
  const db = getDb();
  db.prepare('INSERT INTO channels (id, name, type, source) VALUES (?, ?, ?, ?)').run(
    id,
    id,
    'chat',
    'claude-ai'
  );
  db.prepare(
    'INSERT INTO channel_entities (channel_id, entity_id, added_at) VALUES (?, ?, ?)'
  ).run(id, DEFAULT_ENTITY_ID, addedAt);
  db.prepare(
    'INSERT INTO messages (id, channel_id, role, content, entity_id, created_at) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(`${id}-u0`, id, 'user', opener, null, '2026-01-02T03:00:00.000Z');
  db.prepare(
    'INSERT INTO messages (id, channel_id, role, content, entity_id, created_at) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(`${id}-a0`, id, 'assistant', 'ok', DEFAULT_ENTITY_ID, '2026-01-02T03:01:00.000Z');
}

/** The corpus pair, in the wordings it actually carries: they differ by case. */
const COMMS_A = 'Hello! You are my tech-savvy communications chief here on the project.';
const COMMS_B = 'Hi! You are my tech-savvy Communications Chief here on the project.';

describe('Round 204 — undo over a role apply (Theseus R203 §7)', () => {
  it('removes both of two same-named agents one run minted', () => {
    seedRole('c-cc-a', COMMS_A);
    seedRole('c-cc-b', COMMS_B);
    const before = getAllEntities().length;

    const applied = applyEntityBackfill(planEntityBackfill({ bases: ['role-title'] }));
    expect(applied.minted).toHaveLength(2);
    expect(getAllEntities()).toHaveLength(before + 2);

    const undone = undoEntityBackfill(applied.record);
    expect(undone.reverted).toBe(2);
    // Two ids, not one. Deleting "the agent called X" rather than the two ids
    // the record holds is exactly the shape that would leave a widow here.
    expect(undone.entitiesRemoved.sort()).toEqual([...applied.minted].sort());
    expect(undone.entitiesKept).toEqual([]);
    expect(getAllEntities()).toHaveLength(before);
  });

  it('puts every binding back on the default, with its original added_at', () => {
    seedRole('c-cc-a', COMMS_A, '2026-01-02T03:04:05.000Z');
    seedRole('c-cc-b', COMMS_B, '2026-02-09T10:11:12.000Z');
    const db = getDb();
    const bindings = () =>
      db
        .prepare('SELECT channel_id, entity_id, added_at FROM channel_entities ORDER BY channel_id')
        .all();
    const before = bindings();

    undoEntityBackfill(applyEntityBackfill(planEntityBackfill({ bases: ['role-title'] })).record);

    expect(bindings()).toEqual(before);
  });

  it('puts every stamped message back on the default', () => {
    seedRole('c-cc-a', COMMS_A);
    seedRole('c-cc-b', COMMS_B);
    const db = getDb();
    const stamps = () =>
      db.prepare('SELECT id, entity_id FROM messages ORDER BY id').all();
    const before = stamps();

    undoEntityBackfill(applyEntityBackfill(planEntityBackfill({ bases: ['role-title'] })).record);

    expect(stamps()).toEqual(before);
  });

  it('keeps back only the one a later seat used, and still reverts every channel', () => {
    seedRole('c-cc-a', COMMS_A);
    seedRole('c-cc-b', COMMS_B);
    const db = getDb();
    db.prepare('INSERT INTO channels (id, name, type, source) VALUES (?, ?, ?, ?)').run(
      'c-later',
      'c-later',
      'chat',
      'claude-ai'
    );

    const applied = applyEntityBackfill(planEntityBackfill({ bases: ['role-title'] }));
    const survivor = applied.minted[0];
    db.prepare('INSERT INTO channel_entities (channel_id, entity_id) VALUES (?, ?)').run(
      'c-later',
      survivor
    );

    const undone = undoEntityBackfill(applied.record);
    expect(undone.reverted).toBe(2);
    expect(undone.entitiesKept).toEqual([survivor]);
    expect(undone.entitiesRemoved).toEqual(applied.minted.filter((id) => id !== survivor));
    // The kept agent keeps only the seat that kept it. Its role channel went
    // back to the default like the other one.
    expect(getChannelEntities('c-cc-a')[0].id).toBe(DEFAULT_ENTITY_ID);
    expect(getChannelEntities('c-cc-b')[0].id).toBe(DEFAULT_ENTITY_ID);
    expect(getChannelEntities('c-later')[0].id).toBe(survivor);
  });

  it('re-applies to fresh ids after an undo rather than reviving the deleted ones', () => {
    seedRole('c-cc-a', COMMS_A);
    seedRole('c-cc-b', COMMS_B);

    const first = applyEntityBackfill(planEntityBackfill({ bases: ['role-title'] }));
    undoEntityBackfill(first.record);
    const second = applyEntityBackfill(planEntityBackfill({ bases: ['role-title'] }));

    expect(second.minted).toHaveLength(2);
    for (const id of second.minted) expect(first.minted).not.toContain(id);
    expect(undoEntityBackfill(second.record).reverted).toBe(2);
  });

  it('reverts nothing the second time it is run', () => {
    seedRole('c-cc-a', COMMS_A);
    seedRole('c-cc-b', COMMS_B);

    const applied = applyEntityBackfill(planEntityBackfill({ bases: ['role-title'] }));
    undoEntityBackfill(applied.record);
    const again = undoEntityBackfill(applied.record);

    expect(again.reverted).toBe(0);
    // Not "removed again": an entity that no longer exists is neither removed
    // nor kept, which is Round 183's rule and holds for a role run too.
    expect(again.entitiesRemoved).toEqual([]);
    expect(again.entitiesKept).toEqual([]);
  });
});
