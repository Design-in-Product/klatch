/**
 * Round 175 — the entity backfill apply pass.
 *
 * `docs/plans/entity-backfill-scoping-2026-09-02.md` §4 recorded (a) the review
 * sheet as built and (b) the apply pass as **not built**. This is (b).
 *
 * The test that carries the round is `getEntityTranscript` before and after: a
 * backfill that re-points `channel_entities` and stops looks repaired in the UI
 * and leaves the agent's own answers pooled on the placeholder. Every assertion
 * about bindings here is paired with one about what the transcript query can
 * actually see, because the binding is not the thing continuity #3 reads.
 */

import { describe, it, expect } from 'vitest';
import './setup.js';
import { getDb } from '../db/index.js';
import {
  planEntityBackfill,
  applyEntityBackfill,
  undoEntityBackfill,
} from '../db/entity-backfill.js';
import { getChannelEntities, getEntityTranscript, getAllEntities } from '../db/queries.js';
import { DEFAULT_ENTITY_ID } from '@klatch/shared';

/**
 * Build a channel in the shape `importSession` leaves behind: bound to the
 * default entity, user rows unstamped, assistant rows stamped with the bound
 * entity — or NULL, for anything imported before `messages.entity_id` existed.
 */
function seedImportedChannel(opts: {
  id: string;
  name?: string;
  source?: string | null;
  opener: string;
  /** Assistant replies stamped `default-entity` (P2). */
  p2?: string[];
  /** Assistant replies with NULL entity_id (P3) — pre-migration rows. */
  p3?: string[];
  projectName?: string;
  entityId?: string;
}) {
  const db = getDb();
  let projectId: string | null = null;
  if (opts.projectName) {
    projectId = `proj-${opts.id}`;
    db.prepare('INSERT INTO projects (id, name) VALUES (?, ?)').run(projectId, opts.projectName);
  }
  db.prepare(
    'INSERT INTO channels (id, name, type, source, project_id) VALUES (?, ?, ?, ?, ?)'
  ).run(opts.id, opts.name ?? opts.id, 'chat', opts.source ?? 'claude-code', projectId);
  db.prepare('INSERT INTO channel_entities (channel_id, entity_id) VALUES (?, ?)').run(
    opts.id,
    opts.entityId ?? DEFAULT_ENTITY_ID
  );

  const insert = db.prepare(
    'INSERT INTO messages (id, channel_id, role, content, entity_id, created_at) VALUES (?, ?, ?, ?, ?, ?)'
  );
  let n = 0;
  const at = (i: number) => `2026-09-0${(i % 9) + 1}T00:00:00.000Z`;
  insert.run(`${opts.id}-u0`, opts.id, 'user', opts.opener, null, at(n++));
  for (const [i, text] of (opts.p2 ?? []).entries()) {
    insert.run(`${opts.id}-a2-${i}`, opts.id, 'assistant', text, DEFAULT_ENTITY_ID, at(n++));
  }
  for (const [i, text] of (opts.p3 ?? []).entries()) {
    insert.run(`${opts.id}-a3-${i}`, opts.id, 'assistant', text, null, at(n++));
  }
}

const rowFor = (plan: ReturnType<typeof planEntityBackfill>, id: string) =>
  plan.rows.find((r) => r.channelId === id)!;

describe('Round 175 — backfill plan', () => {
  it('scopes to imported channels bound to the default, and reports what it excludes', () => {
    seedImportedChannel({ id: 'c-code', opener: 'You are Daedalus, resume the cycle.' });
    seedImportedChannel({
      id: 'c-ai',
      source: 'claude-ai',
      opener: 'You are Wren and you keep the notes.',
    });
    seedImportedChannel({ id: 'c-native', source: 'native', opener: 'You are Sorrel.' });
    seedImportedChannel({ id: 'c-pkg', source: 'klatch', opener: 'You are Bramble.' });

    const plan = planEntityBackfill();

    expect(plan.rows.map((r) => r.channelId).sort()).toEqual(['c-ai', 'c-code']);
    // 'default' is the seeded #general channel from setup.ts, also native.
    expect(plan.excluded).toEqual({ native: 2, klatch: 1 });
  });

  it('mints for an unknown name and reuses an existing agent by name', () => {
    seedImportedChannel({ id: 'c1', opener: 'You are Daedalus, the architect.' });
    seedImportedChannel({ id: 'c2', opener: 'you are wren — pick up where we left off' });
    getDb()
      .prepare('INSERT INTO entities (id, name) VALUES (?, ?)')
      .run('e-wren', 'Wren');

    const plan = planEntityBackfill();

    expect(rowFor(plan, 'c1').action).toBe('minted');
    expect(rowFor(plan, 'c1').guessName).toBe('Daedalus');
    expect(rowFor(plan, 'c2').action).toBe('matched-by-name');
    expect(rowFor(plan, 'c2').targetEntityId).toBe('e-wren');
    expect(plan.summary.newAgents).toEqual(['Daedalus']);
    expect(plan.summary.reusedAgents).toEqual(['Wren']);
  });

  it('counts two channels claiming the same name as one new agent', () => {
    seedImportedChannel({ id: 'c1', opener: 'You are Daedalus. Session one.' });
    seedImportedChannel({ id: 'c2', opener: 'You are Daedalus. Session two.' });

    const plan = planEntityBackfill();

    expect(plan.summary.apply).toBe(2);
    expect(plan.summary.newAgents).toEqual(['Daedalus']);
  });

  it('skips a project-name guess by default and includes it when the basis is widened', () => {
    seedImportedChannel({
      id: 'c1',
      opener: 'Fix the flaky test in the sidebar.',
      projectName: 'Klatch',
    });

    expect(rowFor(planEntityBackfill(), 'c1').skipReason).toBe('basis-excluded');

    const widened = planEntityBackfill({ bases: ['identity-claim', 'project-name'] });
    expect(rowFor(widened, 'c1').action).toBe('minted');
    expect(rowFor(widened, 'c1').guessName).toBe('Klatch');
  });

  it('skips a guess that resolves to the default entity rather than reporting a no-op as a move', () => {
    // The seeded default agent is named "Claude" (`db/index.ts:351`), so this
    // opener matches it by name. Moving the channel "to Claude" would leave it
    // exactly where it is, counted as a success.
    seedImportedChannel({ id: 'c1', opener: 'You are Claude, and this continues our chat.' });

    const row = rowFor(planEntityBackfill(), 'c1');
    expect(row.guessName).toBe('Claude');
    expect(row.skipReason).toBe('resolves-to-default');
    expect(row.targetEntityId).toBe(DEFAULT_ENTITY_ID);
  });

  it('skips a channel that already carries a second entity', () => {
    seedImportedChannel({ id: 'c1', opener: 'You are Daedalus.' });
    getDb().prepare('INSERT INTO entities (id, name) VALUES (?, ?)').run('e-other', 'Iris');
    getDb()
      .prepare('INSERT INTO channel_entities (channel_id, entity_id) VALUES (?, ?)')
      .run('c1', 'e-other');

    expect(rowFor(planEntityBackfill(), 'c1').skipReason).toBe('multi-bound');
  });

  it('skips a channel with nothing to guess from', () => {
    seedImportedChannel({ id: 'c1', opener: 'Fix the build.' });

    expect(rowFor(planEntityBackfill(), 'c1').skipReason).toBe('no-guess');
  });

  it('counts P2 and P3 rows separately, and mints nothing while planning', () => {
    seedImportedChannel({
      id: 'c1',
      opener: 'You are Daedalus.',
      p2: ['stamped one', 'stamped two'],
      p3: ['pre-migration one'],
    });
    const before = getAllEntities().length;

    const plan = planEntityBackfill();

    expect(rowFor(plan, 'c1').p2).toBe(2);
    expect(rowFor(plan, 'c1').p3).toBe(1);
    expect(plan.summary.p2).toBe(2);
    expect(plan.summary.p3).toBe(1);
    expect(getAllEntities().length).toBe(before);
  });
});

describe('Round 175 — backfill apply', () => {
  it('moves the binding and both message populations, and the transcript proves it', () => {
    seedImportedChannel({
      id: 'c1',
      opener: 'You are Daedalus, the architect.',
      p2: ['I re-read the spec.'],
      p3: ['This one predates the entity_id column.'],
    });

    // Before: the P3 row is invisible to every entity, default included — the
    // finding the scoping doc measured on a fixture and predicted from the
    // WHERE clause.
    const defaultBefore = getEntityTranscript(DEFAULT_ENTITY_ID);
    expect(defaultBefore.map((m) => m.content)).toContain('I re-read the spec.');
    expect(defaultBefore.map((m) => m.content)).not.toContain(
      'This one predates the entity_id column.'
    );

    const result = applyEntityBackfill(planEntityBackfill());
    expect(result.applied).toBe(1);
    expect(result.minted).toHaveLength(1);
    const newId = result.minted[0];

    expect(getChannelEntities('c1').map((e) => e.id)).toEqual([newId]);

    const after = getEntityTranscript(newId).map((m) => m.content);
    expect(after).toContain('You are Daedalus, the architect.'); // the user half
    expect(after).toContain('I re-read the spec.'); // P2
    expect(after).toContain('This one predates the entity_id column.'); // P3, now visible
    expect(getEntityTranscript(DEFAULT_ENTITY_ID)).toHaveLength(0);
  });

  it('stamps both the P2 and the P3 assistant rows with the new entity', () => {
    // Stated at the row level as well as through the transcript above, because
    // these are two different failures: a P3 row left NULL is invisible to the
    // query, and a P3 row left NULL also reverts to itself, so the undo test
    // cannot catch it.
    seedImportedChannel({
      id: 'c1',
      opener: 'You are Daedalus.',
      p2: ['stamped'],
      p3: ['pre-migration'],
    });

    const newId = applyEntityBackfill(planEntityBackfill()).minted[0];

    const rows = getDb()
      .prepare(
        "SELECT id, entity_id FROM messages WHERE channel_id = 'c1' AND role = 'assistant' ORDER BY id"
      )
      .all() as { id: string; entity_id: string | null }[];
    expect(rows).toEqual([
      { id: 'c1-a2-0', entity_id: newId },
      { id: 'c1-a3-0', entity_id: newId },
    ]);
    // The user row stays unstamped — `entityTranscriptWhere` reaches it through
    // `channel_entities`, and stamping it would break the klatch rule that a
    // user message belongs to everyone who was in the room.
    const user = getDb()
      .prepare("SELECT entity_id FROM messages WHERE id = 'c1-u0'")
      .get() as { entity_id: string | null };
    expect(user.entity_id).toBeNull();
  });

  it('re-points the channel_entities row rather than adding a second binding', () => {
    seedImportedChannel({ id: 'c1', opener: 'You are Daedalus.' });

    applyEntityBackfill(planEntityBackfill());

    const bindings = getDb()
      .prepare('SELECT entity_id FROM channel_entities WHERE channel_id = ?')
      .all('c1') as { entity_id: string }[];
    expect(bindings).toHaveLength(1);
    expect(bindings[0].entity_id).not.toBe(DEFAULT_ENTITY_ID);
  });

  it('makes five sessions claiming one name into one agent across five channels', () => {
    for (let i = 0; i < 5; i++) {
      seedImportedChannel({
        id: `c${i}`,
        opener: `You are Daedalus. Session ${i}.`,
        p2: [`answer ${i}`],
      });
    }

    const result = applyEntityBackfill(planEntityBackfill());

    expect(result.applied).toBe(5);
    expect(result.minted).toHaveLength(1);
    const transcript = getEntityTranscript(result.minted[0]).map((m) => m.content);
    for (let i = 0; i < 5; i++) expect(transcript).toContain(`answer ${i}`);
  });

  it('applies only the channels named by channelIds', () => {
    seedImportedChannel({ id: 'c1', opener: 'You are Daedalus.' });
    seedImportedChannel({ id: 'c2', opener: 'You are Wren.' });

    const result = applyEntityBackfill(planEntityBackfill({ channelIds: ['c1'] }));

    expect(result.applied).toBe(1);
    expect(getChannelEntities('c2').map((e) => e.id)).toEqual([DEFAULT_ENTITY_ID]);
  });

  it('leaves a skipped channel byte-identical', () => {
    seedImportedChannel({ id: 'c1', opener: 'Fix the build.', p2: ['ok'], p3: ['old'] });

    applyEntityBackfill(planEntityBackfill());

    expect(getChannelEntities('c1').map((e) => e.id)).toEqual([DEFAULT_ENTITY_ID]);
    const rows = getDb()
      .prepare("SELECT entity_id FROM messages WHERE channel_id = 'c1' AND role = 'assistant' ORDER BY id")
      .all() as { entity_id: string | null }[];
    expect(rows.map((r) => r.entity_id)).toEqual([DEFAULT_ENTITY_ID, null]);
  });
});

describe('Round 175 — backfill undo', () => {
  it('restores the binding, restores P2 to the default and P3 to NULL, and removes the minted agent', () => {
    seedImportedChannel({
      id: 'c1',
      opener: 'You are Daedalus.',
      p2: ['stamped'],
      p3: ['pre-migration'],
    });
    const applied = applyEntityBackfill(planEntityBackfill());
    const mintedId = applied.minted[0];

    const undone = undoEntityBackfill(applied.record);

    expect(undone.reverted).toBe(1);
    expect(undone.entitiesRemoved).toEqual([mintedId]);
    expect(getChannelEntities('c1').map((e) => e.id)).toEqual([DEFAULT_ENTITY_ID]);
    const rows = getDb()
      .prepare(
        "SELECT id, entity_id FROM messages WHERE channel_id = 'c1' AND role = 'assistant' ORDER BY id"
      )
      .all() as { id: string; entity_id: string | null }[];
    expect(rows).toEqual([
      { id: 'c1-a2-0', entity_id: DEFAULT_ENTITY_ID },
      { id: 'c1-a3-0', entity_id: null },
    ]);
  });

  it('keeps a minted agent that something bound to after the run', () => {
    seedImportedChannel({ id: 'c1', opener: 'You are Daedalus.' });
    const applied = applyEntityBackfill(planEntityBackfill());
    const mintedId = applied.minted[0];

    // A later import binds to the same agent — not this run's to delete.
    seedImportedChannel({ id: 'c2', opener: 'later session', entityId: mintedId });

    const undone = undoEntityBackfill(applied.record);

    expect(undone.entitiesRemoved).toEqual([]);
    expect(undone.entitiesKept).toEqual([mintedId]);
    expect(getAllEntities().map((e) => e.id)).toContain(mintedId);
  });

  it('round-trips a matched-by-name move without deleting the pre-existing agent', () => {
    getDb().prepare('INSERT INTO entities (id, name) VALUES (?, ?)').run('e-wren', 'Wren');
    seedImportedChannel({ id: 'c1', opener: 'You are Wren.', p2: ['hello'] });

    const applied = applyEntityBackfill(planEntityBackfill());
    expect(applied.minted).toEqual([]);
    expect(getChannelEntities('c1').map((e) => e.id)).toEqual(['e-wren']);

    undoEntityBackfill(applied.record);

    expect(getChannelEntities('c1').map((e) => e.id)).toEqual([DEFAULT_ENTITY_ID]);
    expect(getAllEntities().map((e) => e.id)).toContain('e-wren');
  });
});
