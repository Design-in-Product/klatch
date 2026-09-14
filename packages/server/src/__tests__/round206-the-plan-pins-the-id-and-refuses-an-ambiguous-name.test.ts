/**
 * Round 206 — the plan pins the id, and refuses a name it cannot resolve to one.
 *
 * Theseus's Round 205 drove a divergence I had filed undispositioned in Round
 * 204. Both phases of the backfill looked an entity up by name, by *different
 * rules*:
 *
 * | | code | rule | reaches |
 * |---|---|---|---|
 * | plan | `entity-backfill.ts` | `new Map(SELECT id, name)` — last key written wins | last row of the scan |
 * | apply | `entity-resolve.ts` | `getAllEntities()` = `ORDER BY created_at ASC` + `.find()` | first row by `created_at` |
 *
 * On two entities sharing a name they bind opposite ends of the table, and
 * nothing on the sheet can show it: the row prints `MATCHED-BY-NAME → "Daedalus"`,
 * the name and never an id, and both phases print the same name. The agent the
 * operator approved is not the agent that gets the channel.
 *
 * Two fixes, separable on purpose:
 *
 * 1. **The apply binds the id the plan chose** rather than re-deriving it. Round
 *    202 carried the reuse *decision* into the write; that was half of it. This
 *    carries the *identity*, which closes the class — a future divergence
 *    between the two resolvers cannot reach the write at all.
 * 2. **The plan refuses a name carried by more than one entity.** Theseus's
 *    third option, and his §6.3 is the reason: oldest-by-`created_at` is not
 *    merely arbitrary, it is *unspecified* under ties, because `createEntity`
 *    stamps milliseconds and `getAllEntities` has no tiebreak. Fix (1) alone
 *    would make the write match the sheet — while the sheet endorsed an
 *    arbitrary pick it could not display.
 *
 * And his §4: the note named one same-named entity where the real corpus has
 * four, so the decision it exists to inform was being made against a count of one.
 */

import { describe, it, expect } from 'vitest';
import './setup.js';
import { getDb } from '../db/index.js';
import { planEntityBackfill, applyEntityBackfill } from '../db/entity-backfill.js';
import { getChannelEntities } from '../db/queries.js';
import { DEFAULT_ENTITY_ID } from '@klatch/shared';

/** Seeds a channel bound to the default entity with one opener and one reply. */
function seed(id: string, opener: string) {
  const db = getDb();
  db.prepare('INSERT INTO channels (id, name, type, source) VALUES (?, ?, ?, ?)').run(
    id,
    id,
    'chat',
    'claude-code'
  );
  db.prepare('INSERT INTO channel_entities (channel_id, entity_id) VALUES (?, ?)').run(
    id,
    DEFAULT_ENTITY_ID
  );
  db.prepare(
    'INSERT INTO messages (id, channel_id, role, content, entity_id, created_at) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(`${id}-u0`, id, 'user', opener, null, '2026-09-01T00:00:00.000Z');
  db.prepare(
    'INSERT INTO messages (id, channel_id, role, content, entity_id, created_at) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(`${id}-a0`, id, 'assistant', 'ok', DEFAULT_ENTITY_ID, '2026-09-01T00:01:00.000Z');
}

function entity(id: string, name: string, createdAt: string) {
  getDb()
    .prepare('INSERT INTO entities (id, name, model, created_at) VALUES (?, ?, ?, ?)')
    .run(id, name, 'claude-opus-5', createdAt);
}

describe('a name carried by two entities is refused, not picked', () => {
  it('skips as ambiguous-name and names every candidate', () => {
    // Theseus's arm A, as a unit: older and newer, one capitalized differently,
    // because `normalizeName` folds case and that is how the corpus collides.
    entity('ent-old', 'Daedalus', '2026-01-01T00:00:00.000Z');
    entity('ent-new', 'daedalus', '2026-02-01T00:00:00.000Z');
    seed('c-dup', 'You are Daedalus, resume the cycle.');

    const row = planEntityBackfill().rows.find((r) => r.channelId === 'c-dup')!;
    expect(row.action).toBe('skipped');
    expect(row.skipReason).toBe('ambiguous-name');
    // Not bound to either end. The old plan set this to one of them.
    expect(row.targetEntityId).toBeUndefined();
    expect(row.sameNameEntityIds?.slice().sort()).toEqual(['ent-new', 'ent-old']);
  });

  it('leaves the unambiguous case exactly as it was — one entity still reuses', () => {
    entity('ent-dae', 'Daedalus', '2026-01-01T00:00:00.000Z');
    seed('c-one', 'You are Daedalus, resume the cycle.');

    const row = planEntityBackfill().rows.find((r) => r.channelId === 'c-one')!;
    expect(row.action).toBe('matched-by-name');
    expect(row.targetEntityId).toBe('ent-dae');
    expect(row.sameNameEntityIds).toBeUndefined();
  });

  it('refuses rather than picking, so an apply writes nothing for that channel', () => {
    entity('ent-old', 'Daedalus', '2026-01-01T00:00:00.000Z');
    entity('ent-new', 'Daedalus', '2026-02-01T00:00:00.000Z');
    seed('c-dup', 'You are Daedalus, resume the cycle.');

    const plan = planEntityBackfill();
    const result = applyEntityBackfill(plan);

    expect(result.applied).toBe(0);
    expect(getChannelEntities('c-dup').map((e) => e.id)).toEqual([DEFAULT_ENTITY_ID]);
  });

  it('fires on three as well as two — the rule is "more than one", not "exactly two"', () => {
    entity('ent-a', 'Daedalus', '2026-01-01T00:00:00.000Z');
    entity('ent-b', 'daedalus', '2026-01-02T00:00:00.000Z');
    entity('ent-c', '  DAEDALUS ', '2026-01-03T00:00:00.000Z');
    seed('c-three', 'You are Daedalus, resume the cycle.');

    const row = planEntityBackfill().rows.find((r) => r.channelId === 'c-three')!;
    expect(row.skipReason).toBe('ambiguous-name');
    expect(row.sameNameEntityIds).toHaveLength(3);
  });

  it('a mint-alongside note counts every same-named entity, not one of them', () => {
    // Theseus's §4. A `role-title` guess never reuses by name, so this row mints
    // regardless — but the operator's real decision is whether to merge by hand
    // afterwards, and against four that is a different job than against one. On
    // xian's March corpus exactly four entities normalize to `chief of staff`.
    entity('ent-cos1', 'Chief of Staff', '2026-01-01T00:00:00.000Z');
    entity('ent-cos2', 'chief of staff', '2026-01-02T00:00:00.000Z');
    entity('ent-cos3', '  CHIEF OF STAFF ', '2026-01-03T00:00:00.000Z');
    entity('ent-cos4', 'Chief Of Staff', '2026-01-04T00:00:00.000Z');
    seed('c-cos', 'You are my chief of staff.');

    const row = planEntityBackfill({ bases: ['role-title'] }).rows.find(
      (r) => r.channelId === 'c-cos'
    )!;
    // Not ambiguous: the basis does not reuse by name, so there is no pick to
    // refuse. It mints — and says what it is minting alongside.
    expect(row.action).toBe('minted');
    expect(row.skipReason).toBeUndefined();
    expect(row.sameNameEntityIds?.slice().sort()).toEqual([
      'ent-cos1',
      'ent-cos2',
      'ent-cos3',
      'ent-cos4',
    ]);
  });

  it('still reports resolves-to-default first when the default is one of the collided', () => {
    // The more specific reason survives: "your guess is the placeholder agent"
    // tells the operator more than "there are several of them".
    entity('ent-dup-claude', 'Claude', '2026-01-01T00:00:00.000Z');
    seed('c-claude', 'You are Claude, pick up where we left off.');

    const row = planEntityBackfill().rows.find((r) => r.channelId === 'c-claude')!;
    expect(row.skipReason).toBe('resolves-to-default');
  });
});

describe('the apply binds the id the plan chose', () => {
  it('writes the plan row target even when the resolvers would disagree', () => {
    // The divergence case made explicit: `created_at` order and scan order are
    // opposite here, so a re-resolving apply and the plan pick different rows.
    // The plan is the only thing the operator saw; it has to be what is written.
    entity('ent-first', 'Sterling', '2026-01-01T00:00:00.000Z');
    seed('c-st', 'You are Sterling, continue.');

    const plan = planEntityBackfill();
    const row = plan.rows.find((r) => r.channelId === 'c-st')!;
    expect(row.targetEntityId).toBe('ent-first');

    applyEntityBackfill(plan);
    expect(getChannelEntities('c-st').map((e) => e.id)).toEqual(['ent-first']);
    const stamped = getDb()
      .prepare("SELECT entity_id FROM messages WHERE id = 'c-st-a0'")
      .get() as { entity_id: string };
    expect(stamped.entity_id).toBe('ent-first');
  });

  it('refuses loudly if the planned entity is deleted between plan and apply', () => {
    // `bound-existing` throws rather than falling back to a name lookup. A
    // silent re-resolve here would be the Round 205 bug arriving by another
    // road — the operator approved an id that no longer exists, and the honest
    // answer is to stop, not to find something else called the same thing.
    entity('ent-gone', 'Sterling', '2026-01-01T00:00:00.000Z');
    seed('c-gone', 'You are Sterling, continue.');

    const plan = planEntityBackfill();
    expect(plan.rows.find((r) => r.channelId === 'c-gone')!.targetEntityId).toBe('ent-gone');

    getDb().prepare("DELETE FROM entities WHERE id = 'ent-gone'").run();

    expect(() => applyEntityBackfill(plan)).toThrow(/Entity not found: ent-gone/);
    // And the channel is untouched: the resolve happens inside the transaction.
    expect(getChannelEntities('c-gone').map((e) => e.id)).toEqual([DEFAULT_ENTITY_ID]);
  });

  it('still mints for a row the sheet showed as MINTED', () => {
    // `targetEntityId` is undefined exactly there, so passing it through must
    // not turn a mint into a bind or a throw.
    seed('c-mint', 'You are Ptolemy, take this over.');

    const plan = planEntityBackfill();
    const row = plan.rows.find((r) => r.channelId === 'c-mint')!;
    expect(row.action).toBe('minted');

    const result = applyEntityBackfill(plan);
    expect(result.minted).toHaveLength(1);
    expect(getChannelEntities('c-mint')[0].name).toBe('Ptolemy');
  });
});
