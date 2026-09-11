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
  planEntityUndo,
  checkUndoRecord,
  type BackfillUndoRecord,
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

/**
 * Round 178 — the defects Theseus's Round 176 found in the layer above this
 * module (`docs/research/round176-backfill-cli-driven-end-to-end-2026-09-09.md`).
 *
 * Three of them share one shape: an operator mistake — a copied id, a typo, an
 * underscore where a hyphen belongs — comes back as `Candidates: 0` and exit 0,
 * which reads as *"your corpus has nothing to fix."* That is the
 * `resolves-to-default` failure mirrored: a *nothing-to-do* the caller cannot
 * tell from an answer. The remedy is the same one — name what you did not find.
 */
describe('Round 178 — channelIds resolution (Theseus R176 G2/G5)', () => {
  const ID_A = 'a1b2c3d4-0000-4000-8000-000000000001';
  const ID_B = 'b7c8d9e0-0000-4000-8000-000000000002';
  const ID_C = '9f8e7d6c-0000-4000-8000-000000000003';

  function seedThree() {
    seedImportedChannel({ id: ID_A, opener: 'You are Wren.', p2: ['a'] });
    seedImportedChannel({ id: ID_B, opener: 'You are Sable.', p2: ['b'] });
    seedImportedChannel({ id: ID_C, opener: 'You are Rook.', p2: ['c'] });
  }

  it('takes the 8-character ids the review sheet prints', () => {
    seedThree();
    // The exact round trip xian was offered: read the sheet, hand back what you
    // see. The sheet prints `channelId.slice(0, 8)`.
    const plan = planEntityBackfill({ channelIds: [ID_A.slice(0, 8), ID_C.slice(0, 8)] });

    expect(plan.filter!.unmatched).toEqual([]);
    expect(plan.filter!.ambiguous).toEqual([]);
    expect(plan.summary.candidates).toBe(2);
    expect(plan.summary.inScope).toBe(3);
    expect(plan.rows.map((r) => r.channelId).sort()).toEqual([ID_A, ID_C].sort());
  });

  it('still takes full ids', () => {
    seedThree();
    const plan = planEntityBackfill({ channelIds: [ID_B] });
    expect(plan.summary.candidates).toBe(1);
    expect(plan.rows[0].channelId).toBe(ID_B);
    expect(plan.filter!.resolved).toEqual([ID_B]);
  });

  it('reports an unknown id by name instead of an empty corpus', () => {
    seedThree();
    const plan = planEntityBackfill({ channelIds: [ID_A.slice(0, 8), 'deadbeef'] });

    expect(plan.filter!.unmatched).toEqual(['deadbeef']);
    // The distinction the bare count could not make: one of two asked-for
    // channels resolved, out of three in scope.
    expect(plan.summary.candidates).toBe(1);
    expect(plan.summary.inScope).toBe(3);
  });

  it('refuses an ambiguous prefix rather than guessing which channel was meant', () => {
    // Two ids that agree for their first 8 characters — the collision the sheet's
    // 8-char column can actually produce.
    const TWIN_1 = 'cafef00d-0000-4000-8000-00000000000a';
    const TWIN_2 = 'cafef00d-0000-4000-8000-00000000000b';
    seedImportedChannel({ id: TWIN_1, opener: 'You are Wren.', p2: ['a'] });
    seedImportedChannel({ id: TWIN_2, opener: 'You are Sable.', p2: ['b'] });

    const plan = planEntityBackfill({ channelIds: ['cafef00d'] });

    // Matches carry name and full id so the refusal is actionable: the operator is
    // told to choose, and these are the two things to choose between (Round 179).
    expect(plan.filter!.ambiguous).toEqual([
      {
        requested: 'cafef00d',
        matches: [
          { id: TWIN_1, name: expect.any(String) },
          { id: TWIN_2, name: expect.any(String) },
        ],
      },
    ]);
    expect(plan.summary.candidates).toBe(0);
    expect(plan.rows).toEqual([]);
  });

  it('lets an exact id win over the same string being a prefix of another', () => {
    seedImportedChannel({ id: 'chan-1', opener: 'You are Wren.', p2: ['a'] });
    seedImportedChannel({ id: 'chan-12', opener: 'You are Sable.', p2: ['b'] });

    const plan = planEntityBackfill({ channelIds: ['chan-1'] });

    expect(plan.filter!.ambiguous).toEqual([]);
    expect(plan.rows.map((r) => r.channelId)).toEqual(['chan-1']);
  });

  it('reports no filter at all when none was asked for', () => {
    seedThree();
    const plan = planEntityBackfill();
    expect(plan.filter).toBeUndefined();
    expect(plan.summary.inScope).toBe(plan.summary.candidates);
  });
});

describe('Round 178 — undo restores added_at (Theseus R176)', () => {
  const ORIGINAL_ADDED_AT = '2026-01-15 04:05:06';

  it('puts the default binding back with the clock it had, not the undo run’s', () => {
    seedImportedChannel({ id: 'c1', opener: 'You are Wren.', p2: ['hello'] });
    getDb()
      .prepare('UPDATE channel_entities SET added_at = ? WHERE channel_id = ?')
      .run(ORIGINAL_ADDED_AT, 'c1');

    const applied = applyEntityBackfill(planEntityBackfill());
    expect(applied.record.channels[0].fromAddedAt).toBe(ORIGINAL_ADDED_AT);

    undoEntityBackfill(applied.record);

    const restored = getDb()
      .prepare('SELECT added_at FROM channel_entities WHERE channel_id = ? AND entity_id = ?')
      .get('c1', DEFAULT_ENTITY_ID) as { added_at: string };
    expect(restored.added_at).toBe(ORIGINAL_ADDED_AT);
  });

  it('keeps the roster order the default binding had, once a second entity exists', () => {
    // Why the column matters: `getChannelEntities` orders by `added_at`
    // (`queries.ts:485`). Without the round trip the restored default carries the
    // undo's clock and sorts last, behind anything added between apply and undo.
    seedImportedChannel({ id: 'c1', opener: 'You are Wren.', p2: ['hello'] });
    getDb()
      .prepare('UPDATE channel_entities SET added_at = ? WHERE channel_id = ?')
      .run(ORIGINAL_ADDED_AT, 'c1');

    const applied = applyEntityBackfill(planEntityBackfill());

    getDb().prepare('INSERT INTO entities (id, name) VALUES (?, ?)').run('e-late', 'Late');
    getDb()
      .prepare('INSERT INTO channel_entities (channel_id, entity_id, added_at) VALUES (?, ?, ?)')
      .run('c1', 'e-late', '2026-06-01 00:00:00');

    undoEntityBackfill(applied.record);

    expect(getChannelEntities('c1').map((e) => e.id)).toEqual([DEFAULT_ENTITY_ID, 'e-late']);
  });

  it('replays a record written before the field existed, with the undo’s clock', () => {
    seedImportedChannel({ id: 'c1', opener: 'You are Wren.', p2: ['hello'] });
    const applied = applyEntityBackfill(planEntityBackfill());

    // A v1 record from a run before `fromAddedAt` was recorded.
    const legacy = JSON.parse(JSON.stringify(applied.record));
    delete legacy.channels[0].fromAddedAt;

    expect(() => undoEntityBackfill(legacy)).not.toThrow();
    const restored = getDb()
      .prepare('SELECT added_at FROM channel_entities WHERE channel_id = ? AND entity_id = ?')
      .get('c1', DEFAULT_ENTITY_ID) as { added_at: string } | undefined;
    expect(restored?.added_at).toBeTruthy();
  });
});

/**
 * Round 180 — `checkUndoRecord` (Theseus R179 finding 5).
 *
 * `undoEntityBackfill` reads its argument's shape directly, so anything else
 * threw from inside the module: `--undo=<a JSON file that isn't a record>` came
 * out as `TypeError: record.channels is not iterable` plus a stack, which tells
 * the operator nothing about which file they pointed at. The guard is here rather
 * than in the CLI so it is checked against a record a real apply produced.
 */
describe('Round 180 — undo record shape check (Theseus R179)', () => {
  it('accepts a record a real apply produced', () => {
    seedImportedChannel({ id: 'c1', opener: 'You are Wren.', p2: ['hello'] });
    const applied = applyEntityBackfill(planEntityBackfill());

    // Through JSON, because that is how the CLI gets it back.
    const checked = checkUndoRecord(JSON.parse(JSON.stringify(applied.record)));
    expect(checked.ok).toBe(true);
    if (checked.ok) expect(checked.record.channels[0].channelId).toBe('c1');
  });

  it('accepts a record written before `fromAddedAt` existed', () => {
    seedImportedChannel({ id: 'c1', opener: 'You are Wren.', p2: ['hello'] });
    const applied = applyEntityBackfill(planEntityBackfill());
    const legacy = JSON.parse(JSON.stringify(applied.record));
    delete legacy.channels[0].fromAddedAt;

    // The optional field stays optional: the check must not turn an old record
    // that still replays into a refusal.
    expect(checkUndoRecord(legacy).ok).toBe(true);
  });

  it('names what is wrong, rather than throwing from inside undo', () => {
    for (const [value, problem] of [
      [null, 'not a JSON object'],
      [[], 'not a JSON object'],
      ['a string', 'not a JSON object'],
      [{ hello: 'world' }, 'version is undefined, expected 1'],
      [{ version: 2, channels: [] }, 'version is 2, expected 1'],
      [{ version: 1 }, 'no `channels` array'],
      [{ version: 1, channels: [null] }, 'channels[0] is not an object'],
      [{ version: 1, channels: [{}] }, 'channels[0].channelId is not a string'],
      [
        { version: 1, channels: [{ channelId: 'c1', fromEntityId: 'e1' }] },
        'channels[0].toEntityId is not a string',
      ],
      [
        {
          version: 1,
          channels: [{ channelId: 'c1', fromEntityId: 'e1', toEntityId: 'e2' }],
        },
        'channels[0].p2MessageIds is not an array',
      ],
    ] as [unknown, string][]) {
      const checked = checkUndoRecord(value);
      expect(checked.ok).toBe(false);
      if (!checked.ok) expect(checked.problem).toBe(problem);
    }
  });

  it('passes a record naming a since-deleted message — that is legitimate', () => {
    seedImportedChannel({ id: 'c1', opener: 'You are Wren.', p2: ['hello'] });
    const applied = applyEntityBackfill(planEntityBackfill());
    const record = JSON.parse(JSON.stringify(applied.record));
    record.channels[0].p2MessageIds.push('a-message-that-no-longer-exists');

    // Shallow on purpose: the UPDATE matches nothing and undo still reverts the
    // rest. Refusing here would block the recovery path over a stale id.
    expect(checkUndoRecord(record).ok).toBe(true);
    expect(() => undoEntityBackfill(record)).not.toThrow();
  });
});

/**
 * Round 184 — undo reads each channel before it writes it (Theseus's Round 183,
 * `docs/research/round183-the-undo-record-against-the-database-it-is-aimed-at-2026-09-10.md`).
 *
 * `checkUndoRecord` sees a record's shape; nothing saw *which database, now*. Undo
 * wrote every record channel blind, so an older record undone after a re-apply
 * half-reverted the newer run, a record from another database threw on the
 * foreign key, and all of it reported the record's channel count as reverted.
 * Every test here asserts the rows, not only the returned counts, because the
 * counts were the thing that was wrong.
 */
const assistantStamps = (channelId: string) =>
  (
    getDb()
      .prepare("SELECT entity_id FROM messages WHERE channel_id = ? AND role = 'assistant' ORDER BY id")
      .all(channelId) as { entity_id: string | null }[]
  ).map((r) => r.entity_id);
const dumpState = () =>
  JSON.stringify([
    getDb().prepare('SELECT * FROM channel_entities ORDER BY channel_id, entity_id').all(),
    getDb().prepare('SELECT id, entity_id FROM messages ORDER BY id').all(),
    getDb().prepare('SELECT id FROM entities ORDER BY id').all(),
  ]);
const reseat = (channelId: string, fromId: string, toId: string, toName: string) => {
  getDb().prepare('INSERT OR IGNORE INTO entities (id, name) VALUES (?, ?)').run(toId, toName);
  getDb().prepare('INSERT INTO channel_entities (channel_id, entity_id) VALUES (?, ?)').run(channelId, toId);
  getDb().prepare('DELETE FROM channel_entities WHERE channel_id = ? AND entity_id = ?').run(channelId, fromId);
};

describe('Round 184 — undo against the database it is aimed at (Theseus R183)', () => {
  it('leaves a channel a later run re-applied, rather than half-reverting it (A1)', () => {
    seedImportedChannel({ id: 'c-wren', opener: 'You are Wren.', p2: ['a'], p3: ['b'] });
    seedImportedChannel({ id: 'c-rook', opener: 'You are Rook.', p2: ['c'] });
    const recordA = applyEntityBackfill(planEntityBackfill()).record;
    undoEntityBackfill(recordA);
    const recordB = applyEntityBackfill(planEntityBackfill({ channelIds: ['c-wren'] })).record;
    const wrenA = recordA.channels.find((c) => c.channelId === 'c-wren')!.toEntityId;
    const wrenB = recordB.channels[0].toEntityId;
    // The precondition Theseus measured: undo deleted A's Wren, so B re-minted.
    expect(wrenB).not.toBe(wrenA);
    const before = dumpState();

    const stale = undoEntityBackfill(recordA);

    expect(dumpState()).toBe(before);
    expect(getChannelEntities('c-wren').map((e) => e.id)).toEqual([wrenB]);
    expect(assistantStamps('c-wren')).toEqual([wrenB, wrenB]);
    expect(stale.reverted).toBe(0);
    expect(stale.entitiesRemoved).toEqual([]);
    expect(Object.fromEntries(stale.channels.map((s) => [s.channelId, s.disposition]))).toEqual({
      'c-wren': 'changed-since',
      'c-rook': 'already-reverted',
    });

    // The newer record is untouched by the attempt and still undoes its own run.
    const good = undoEntityBackfill(recordB);
    expect(good.reverted).toBe(1);
    expect(good.entitiesRemoved).toEqual([wrenB]);
    expect(getChannelEntities('c-wren').map((e) => e.id)).toEqual([DEFAULT_ENTITY_ID]);
    expect(assistantStamps('c-wren')).toEqual([DEFAULT_ENTITY_ID, null]);
  });

  it('reports what it wrote, not what the record named, when the run is already undone (A2/D2)', () => {
    seedImportedChannel({ id: 'c1', opener: 'You are Daedalus.', p2: ['a'], p3: ['b'] });
    const record = applyEntityBackfill(planEntityBackfill()).record;
    const first = undoEntityBackfill(record);
    expect(first.reverted).toBe(1);
    expect(first.entitiesRemoved).toHaveLength(1);
    const before = dumpState();

    const second = undoEntityBackfill(record);

    expect(dumpState()).toBe(before);
    expect(second.reverted).toBe(0);
    // A's minted agent was deleted by the first undo; the second did nothing to it.
    expect(second.entitiesRemoved).toEqual([]);
    expect(second.entitiesKept).toEqual([]);
    expect(second.channels.map((s) => s.disposition)).toEqual(['already-reverted']);
  });

  it('classifies a record from another database as not here, and attempts no write (C)', () => {
    seedImportedChannel({ id: 'c1', opener: 'You are Wren.', p2: ['a'] });
    const foreign: BackfillUndoRecord = {
      version: 1,
      createdAt: '2026-09-10T00:00:00.000Z',
      bases: ['identity-claim'],
      channels: [
        {
          channelId: 'c-from-another-database',
          fromEntityId: DEFAULT_ENTITY_ID,
          toEntityId: 'e-from-another-database',
          mintedHere: true,
          p2MessageIds: ['m-from-another-database'],
          p3MessageIds: [],
        },
      ],
    };
    const before = dumpState();

    let result: ReturnType<typeof undoEntityBackfill> | undefined;
    expect(() => {
      result = undoEntityBackfill(foreign);
    }).not.toThrow();

    expect(dumpState()).toBe(before);
    expect(result!.reverted).toBe(0);
    expect(result!.entitiesRemoved).toEqual([]);
    expect(result!.channels).toEqual([
      {
        channelId: 'c-from-another-database',
        channelName: null,
        disposition: 'not-in-database',
        seatedNow: [],
        toEntityExists: false,
        reboundSince: false,
        boundBeforeRun: false,
      },
    ]);
  });

  it('leaves a channel the user re-seated after the run, and keeps the agent its rows still name (B)', () => {
    seedImportedChannel({ id: 'c1', opener: 'You are Wren.', p2: ['a'] });
    const record = applyEntityBackfill(planEntityBackfill()).record;
    const wren = record.channels[0].toEntityId;
    reseat('c1', wren, 'e-kestrel', 'Kestrel');
    const before = dumpState();

    const result = undoEntityBackfill(record);

    expect(dumpState()).toBe(before);
    expect(getChannelEntities('c1').map((e) => e.id)).toEqual(['e-kestrel']);
    expect(result.channels[0]).toMatchObject({
      disposition: 'changed-since',
      seatedNow: [{ id: 'e-kestrel', name: 'Kestrel' }],
      toEntityExists: true,
    });
    expect(result.entitiesKept).toEqual([wren]);
  });

  it('reverts the channels still in the run’s state and leaves the rest', () => {
    seedImportedChannel({ id: 'c-a', opener: 'You are Wren.', p2: ['a'] });
    seedImportedChannel({ id: 'c-b', opener: 'You are Rook.', p2: ['b'] });
    const record = applyEntityBackfill(planEntityBackfill()).record;
    const rook = record.channels.find((c) => c.channelId === 'c-b')!.toEntityId;
    reseat('c-b', rook, 'e-kestrel', 'Kestrel');

    const result = undoEntityBackfill(record);

    expect(result.reverted).toBe(1);
    expect(getChannelEntities('c-a').map((e) => e.id)).toEqual([DEFAULT_ENTITY_ID]);
    expect(assistantStamps('c-a')).toEqual([DEFAULT_ENTITY_ID]);
    expect(getChannelEntities('c-b').map((e) => e.id)).toEqual(['e-kestrel']);
    expect(assistantStamps('c-b')).toEqual([rook]);
  });

  it('does not re-bind an agent this database never had, which would throw on the foreign key', () => {
    seedImportedChannel({ id: 'c1', opener: 'You are Wren.', p2: ['a'] });
    const record = JSON.parse(JSON.stringify(applyEntityBackfill(planEntityBackfill()).record));
    record.channels[0].fromEntityId = 'e-this-database-never-had';
    const before = dumpState();

    let result: ReturnType<typeof undoEntityBackfill> | undefined;
    expect(() => {
      result = undoEntityBackfill(record);
    }).not.toThrow();

    expect(dumpState()).toBe(before);
    expect(result!.channels[0].disposition).toBe('changed-since');
  });

  it('previews exactly the classification undo then acts on, and writes nothing doing it', () => {
    seedImportedChannel({ id: 'c-a', opener: 'You are Wren.', p2: ['a'] });
    seedImportedChannel({ id: 'c-b', opener: 'You are Rook.', p2: ['b'] });
    const record = applyEntityBackfill(planEntityBackfill()).record;
    const rook = record.channels.find((c) => c.channelId === 'c-b')!.toEntityId;
    reseat('c-b', rook, 'e-kestrel', 'Kestrel');
    const before = dumpState();

    const preview = planEntityUndo(record);

    expect(dumpState()).toBe(before);
    expect(preview.map((s) => s.disposition).sort()).toEqual(['changed-since', 'revert']);
    expect(undoEntityBackfill(record).channels).toEqual(preview);
  });
});

describe('Round 186 — undo knows a run by its binding, not only its agent (Theseus R185)', () => {
  // `added_at` has second resolution, and apply → undo → apply inside one test
  // lands in one second, where two bindings of one agent cannot be told apart —
  // the stated limit. Dating the first run a day back, row and record together,
  // is the timeline an operator has, not a way around the rule.
  const EARLIER = '2026-09-01 00:00:00';
  const dateRunEarlier = (record: BackfillUndoRecord) => {
    for (const ch of record.channels) {
      getDb()
        .prepare('UPDATE channel_entities SET added_at = ? WHERE channel_id = ? AND entity_id = ?')
        .run(EARLIER, ch.channelId, ch.toEntityId);
      ch.toAddedAt = EARLIER;
    }
  };
  const seedSable = () => {
    getDb().prepare('INSERT INTO entities (id, name) VALUES (?, ?)').run('e-sable', 'Sable');
    seedImportedChannel({ id: 'c-reuse', opener: 'You are Sable.', p2: ['a'], p3: ['b'] });
  };

  it('records the added_at of the binding the run made', () => {
    seedImportedChannel({ id: 'c1', opener: 'You are Wren.', p2: ['a'] });
    const record = applyEntityBackfill(planEntityBackfill()).record;
    const row = getDb()
      .prepare('SELECT added_at FROM channel_entities WHERE channel_id = ? AND entity_id = ?')
      .get('c1', record.channels[0].toEntityId) as { added_at: string };

    expect(record.channels[0].toAddedAt).toBe(row.added_at);
  });

  it('leaves a channel a later run bound to the same agent, and the later record still undoes it (N4/N5)', () => {
    seedSable();
    const recordA = applyEntityBackfill(planEntityBackfill()).record;
    // The precondition Theseus measured: matched by name, so both runs bind one id.
    expect(recordA.channels[0]).toMatchObject({ toEntityId: 'e-sable', mintedHere: false });
    dateRunEarlier(recordA);
    undoEntityBackfill(recordA);
    // A reply while the default sits there, stamped to it as the message route does.
    getDb()
      .prepare(
        "INSERT INTO messages (id, channel_id, role, content, entity_id, created_at) VALUES (?, ?, 'assistant', ?, ?, ?)"
      )
      .run('c-reuse-reply', 'c-reuse', 'between the runs', DEFAULT_ENTITY_ID, '2026-09-09T12:00:00.000Z');
    const recordB = applyEntityBackfill(planEntityBackfill({ channelIds: ['c-reuse'] })).record;
    expect(recordB.channels[0].toEntityId).toBe('e-sable');
    expect(recordB.channels[0].p2MessageIds).toContain('c-reuse-reply');
    expect(recordA.channels[0].p2MessageIds).not.toContain('c-reuse-reply');
    const before = dumpState();

    const stale = undoEntityBackfill(recordA);

    expect(dumpState()).toBe(before);
    expect(stale.reverted).toBe(0);
    expect(stale.channels[0]).toMatchObject({
      disposition: 'changed-since',
      reboundSince: true,
      seatedNow: [{ id: 'e-sable', name: 'Sable' }],
    });

    const good = undoEntityBackfill(recordB);
    expect(good.reverted).toBe(1);
    expect(good.entitiesRemoved).toEqual([]);
    expect(getChannelEntities('c-reuse').map((e) => e.id)).toEqual([DEFAULT_ENTITY_ID]);
    // a2-0, a3-0, reply: the reply back on the default it was written under.
    expect(assistantStamps('c-reuse')).toEqual([DEFAULT_ENTITY_ID, null, DEFAULT_ENTITY_ID]);
  });

  it('leaves a channel whose agent was taken off and put back in the app', () => {
    seedSable();
    const record = applyEntityBackfill(planEntityBackfill()).record;
    dateRunEarlier(record);
    getDb().prepare('DELETE FROM channel_entities WHERE channel_id = ? AND entity_id = ?').run('c-reuse', 'e-sable');
    getDb().prepare('INSERT INTO channel_entities (channel_id, entity_id) VALUES (?, ?)').run('c-reuse', 'e-sable');
    const before = dumpState();

    const result = undoEntityBackfill(record);

    expect(dumpState()).toBe(before);
    expect(result.channels[0]).toMatchObject({ disposition: 'changed-since', reboundSince: true });
  });

  it('still reverts with a record written before toAddedAt existed', () => {
    seedSable();
    const record = JSON.parse(JSON.stringify(applyEntityBackfill(planEntityBackfill()).record));
    delete record.channels[0].toAddedAt;
    expect(checkUndoRecord(record).ok).toBe(true);

    const result = undoEntityBackfill(record);

    expect(result.reverted).toBe(1);
    expect(result.channels[0]).toMatchObject({ disposition: 'revert', reboundSince: false });
    expect(getChannelEntities('c-reuse').map((e) => e.id)).toEqual([DEFAULT_ENTITY_ID]);
    expect(assistantStamps('c-reuse')).toEqual([DEFAULT_ENTITY_ID, null]);
  });
});

/**
 * Round 188 — Theseus's Round 187,
 * `docs/research/round187-the-binding-rule-at-the-inputs-it-was-argued-from-2026-09-10.md`.
 *
 * S2: after a snapshot restore the database holds an earlier run's binding of the
 * same agent, and the refusal called it a later one. G1/G2: the shape check read
 * neither `added_at` field, though one decides a refusal and the other is written.
 */
describe('Round 188 — which way the binding moved, and the added_at fields are checked (Theseus R187)', () => {
  const seedSable = () => {
    getDb().prepare('INSERT INTO entities (id, name) VALUES (?, ?)').run('e-sable', 'Sable');
    seedImportedChannel({ id: 'c-reuse', opener: 'You are Sable.', p2: ['a'], p3: ['b'] });
  };
  const setBindingAt = (channelId: string, entityId: string, at: string) =>
    getDb()
      .prepare('UPDATE channel_entities SET added_at = ? WHERE channel_id = ? AND entity_id = ?')
      .run(at, channelId, entityId);

  it("refuses an added_at field that is not null or datetime('now')'s form, and names it (G1/G2)", () => {
    seedImportedChannel({ id: 'c1', opener: 'You are Wren.', p2: ['a'] });
    const applied = JSON.stringify(applyEntityBackfill(planEntityBackfill()).record);

    for (const [key, value] of [
      ['toAddedAt', 12345],
      ['fromAddedAt', 'not a date'],
      ['toAddedAt', '2026-09-11T02:56:26'],
      ['fromAddedAt', ''],
    ] as [string, unknown][]) {
      const record = JSON.parse(applied);
      record.channels[0][key] = value;
      const checked = checkUndoRecord(record);
      expect(checked.ok).toBe(false);
      if (!checked.ok) {
        expect(checked.problem).toBe(
          `channels[0].${key} is ${JSON.stringify(value)}, expected null or a YYYY-MM-DD HH:MM:SS timestamp`
        );
      }
    }
  });

  it('accepts both fields as apply writes them, as null, and absent', () => {
    seedImportedChannel({ id: 'c1', opener: 'You are Wren.', p2: ['a'] });
    const applied = JSON.parse(JSON.stringify(applyEntityBackfill(planEntityBackfill()).record));
    expect(checkUndoRecord(applied).ok).toBe(true);

    const nulls = JSON.parse(JSON.stringify(applied));
    nulls.channels[0].fromAddedAt = null;
    nulls.channels[0].toAddedAt = null;
    expect(checkUndoRecord(nulls).ok).toBe(true);

    const absent = JSON.parse(JSON.stringify(applied));
    delete absent.channels[0].fromAddedAt;
    delete absent.channels[0].toAddedAt;
    expect(checkUndoRecord(absent).ok).toBe(true);
  });

  it('calls an earlier binding one from before the run, not a later one, and writes nothing (S2)', () => {
    seedSable();
    const record = applyEntityBackfill(planEntityBackfill()).record;
    // The state Theseus measured after the restore: the binding the database holds
    // is an earlier run's, and this record is from the later run.
    setBindingAt('c-reuse', 'e-sable', '2026-09-01 00:00:00');
    record.channels[0].toAddedAt = '2026-09-02 00:00:00';
    const before = dumpState();

    const result = undoEntityBackfill(record);

    expect(dumpState()).toBe(before);
    expect(result.reverted).toBe(0);
    expect(result.channels[0]).toMatchObject({
      disposition: 'changed-since',
      boundBeforeRun: true,
      reboundSince: false,
    });
  });

  it('still calls a later binding re-bound, not before the run', () => {
    seedSable();
    const record = applyEntityBackfill(planEntityBackfill()).record;
    setBindingAt('c-reuse', 'e-sable', '2026-09-02 00:00:00');
    record.channels[0].toAddedAt = '2026-09-01 00:00:00';
    const before = dumpState();

    const result = undoEntityBackfill(record);

    expect(dumpState()).toBe(before);
    expect(result.channels[0]).toMatchObject({
      disposition: 'changed-since',
      boundBeforeRun: false,
      reboundSince: true,
    });
  });
});
