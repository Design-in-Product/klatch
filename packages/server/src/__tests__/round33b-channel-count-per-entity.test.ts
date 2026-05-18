/**
 * Round 33b (Argus) — T2.1 server side: getAllEntities returns channelCount.
 *
 * Daedalus's 5/11 assignment §9: getAllEntities() LEFT JOINs channel_entities
 * and GROUP BYs to populate `channelCount` on every row. This test pins:
 *   - Entity assigned to N channels: channelCount === N
 *   - Entity assigned to zero channels: channelCount === 0
 *
 * Companion client-surface test ("in N channels" with pluralization) is in
 * `packages/client/src/__tests__/round33b-remaining-ui.test.tsx`.
 */

import './setup.js';
import { describe, it, expect } from 'vitest';
import {
  createEntity,
  createChannel,
  assignEntityToChannel,
  getAllEntities,
} from '../db/queries.js';

describe('Round 33b T2.1 — getAllEntities populates channelCount', () => {
  it('entity assigned to zero channels has channelCount === 0', () => {
    const lonely = createEntity('LonelyBot', 'claude-opus-4-7', 'prompt', '#FF0000');
    const found = getAllEntities().find((e) => e.id === lonely.id);
    expect(found).toBeDefined();
    expect(found!.channelCount).toBe(0);
  });

  it('entity assigned to N channels has channelCount === N', () => {
    const social = createEntity('SocialBot', 'claude-opus-4-7', 'prompt', '#00FF00');
    const ch1 = createChannel('ch-1', 'sp');
    const ch2 = createChannel('ch-2', 'sp');
    const ch3 = createChannel('ch-3', 'sp');
    assignEntityToChannel(ch1.id, social.id);
    assignEntityToChannel(ch2.id, social.id);
    assignEntityToChannel(ch3.id, social.id);

    const found = getAllEntities().find((e) => e.id === social.id);
    expect(found).toBeDefined();
    expect(found!.channelCount).toBe(3);
  });

  it('channelCount updates when an entity is unassigned (regression guard via second call)', async () => {
    const mover = createEntity('MoverBot', 'claude-opus-4-7', 'prompt', '#0000FF');
    const ch1 = createChannel('mv-1', 'sp');
    const ch2 = createChannel('mv-2', 'sp');
    assignEntityToChannel(ch1.id, mover.id);
    assignEntityToChannel(ch2.id, mover.id);

    const before = getAllEntities().find((e) => e.id === mover.id)!;
    expect(before.channelCount).toBe(2);

    // Remove one assignment via raw DB to avoid coupling to removeEntityFromChannel
    // (we already trust getAllEntities; this is a count-reactivity assertion).
    const { getDb } = await import('../db/index.js');
    getDb().prepare('DELETE FROM channel_entities WHERE channel_id = ? AND entity_id = ?').run(ch1.id, mover.id);

    const after = getAllEntities().find((e) => e.id === mover.id)!;
    expect(after.channelCount).toBe(1);
  });

  it('the default entity (Claude) also gets a channelCount field populated', () => {
    // Default entity is seeded on the default channel by setup.ts. Pin that
    // it shows channelCount >= 1 (defensive: the seed protocol may evolve).
    const entities = getAllEntities();
    const claude = entities.find((e) => e.name === 'Claude');
    expect(claude).toBeDefined();
    expect(typeof claude!.channelCount).toBe('number');
    expect(claude!.channelCount).toBeGreaterThanOrEqual(1);
  });
});
