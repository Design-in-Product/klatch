/**
 * Round 210 — the coverage that has to exist before arms A–C can be retired.
 *
 * Theseus's Round 209 §4 recommended retiring `probe-round205`'s arms A–C: all
 * eight of their failing checks encode the pre-206 behaviour, and Round 206
 * changed that behaviour deliberately, so they are failing *correctly*. He left
 * the call to me because it is a call about a deliberate change.
 *
 * The call is yes — after this file. Ran the probe myself first (23 checks · 8
 * failed · 5 open · 2 measurements, reproducing his numbers exactly) and walked
 * the eight failures against what the suite actually covers. Five have a Round
 * 206 unit test standing behind them. **Three did not, and retiring the arms
 * would have deleted the only thing watching them:**
 *
 * | probe check | what it asserted (pre-206) | post-206 counterpart | covered? |
 * |---|---|---|---|
 * | A1, A2 | plan reuses, names the last row of the scan | skips `ambiguous-name`, names every candidate | Round 206 ✓ |
 * | A4 | binding written is the first row by `created_at` | nothing is written; binding stays default | Round 206 ✓ |
 * | B1, B3 | sheet shows the row as a reuse; summary counts one | row is a SKIP; not counted as reused | Round 206 ✓ (as plan shape) |
 * | **A5** | **message stamps follow the write** | **a refused row leaves the stamps alone** | **nothing** |
 * | **B2** | **the sheet prints the name, never an id** | **the sheet names every colliding id** | **nothing — the CLI's rendering was unreachable from the suite** |
 * | **C1** | **the apply wrote one undo record** | **an all-refused run writes none** | **nothing** |
 *
 * B2's gap is the structural one. The notes an operator reads were formatted
 * inline inside `backfill-entity-bindings.mts`, so the only way to see them was
 * to spawn the script — which is why a probe was their sole check, and why, when
 * Round 206 rewrote them, that check went **green** rather than red. Extracted
 * to `mintAlongsideNote` / `ambiguousNameNote` this round, on the precedent of
 * `candidatesLine` and `restoreInstructions`.
 *
 * Every test here **establishes its subject before asserting about it**, which
 * is Theseus's Round 209 §3 generalisation and my own Round 208 correction one
 * layer out: a check that does not establish that its subject exists is
 * measuring its own default. Where a test asserts a negative, the positive it
 * depends on is asserted first, in the same test.
 */

import { describe, it, expect } from 'vitest';
import './setup.js';
import { getDb } from '../db/index.js';
import {
  planEntityBackfill,
  applyEntityBackfill,
  mintAlongsideNote,
  ambiguousNameNote,
  type BackfillPlanRow,
} from '../db/entity-backfill.js';
import { getChannelEntities } from '../db/queries.js';
import { DEFAULT_ENTITY_ID } from '@klatch/shared';

/** Seeds a channel bound to the default entity: one opener, two stamped replies. */
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
  for (let i = 0; i < 2; i++) {
    db.prepare(
      'INSERT INTO messages (id, channel_id, role, content, entity_id, created_at) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(`${id}-a${i}`, id, 'assistant', 'ok', DEFAULT_ENTITY_ID, `2026-09-01T00:0${i + 1}:00.000Z`);
  }
}

function entity(id: string, name: string, createdAt: string) {
  getDb()
    .prepare('INSERT INTO entities (id, name, model, created_at) VALUES (?, ?, ?, ?)')
    .run(id, name, 'claude-opus-5', createdAt);
}

/** Every assistant stamp in a channel, in id order. */
function stamps(channelId: string): (string | null)[] {
  return (
    getDb()
      .prepare(
        "SELECT entity_id AS e FROM messages WHERE channel_id = ? AND role = 'assistant' ORDER BY id"
      )
      .all(channelId) as { e: string | null }[]
  ).map((r) => r.e);
}

describe('A5 — a refused row leaves the message stamps where they were', () => {
  it('does not move the stamps, and there were stamps to move', () => {
    entity('ent-old', 'Daedalus', '2026-01-01T00:00:00.000Z');
    entity('ent-new', 'daedalus', '2026-02-01T00:00:00.000Z');
    seed('c-dup', 'You are Daedalus, resume the cycle.');

    const plan = planEntityBackfill();
    const row = plan.rows.find((r) => r.channelId === 'c-dup')!;

    // Establish the subject. "The stamps did not move" is worth nothing if the
    // channel had no stamps, or if the plan had nothing it wanted to move: both
    // make the assertion below true for the wrong reason. `p2` is the count of
    // assistant rows stamped with the default entity — the rows an applied
    // re-point *would* rewrite.
    expect(row.p2).toBe(2);
    expect(stamps('c-dup')).toEqual([DEFAULT_ENTITY_ID, DEFAULT_ENTITY_ID]);

    applyEntityBackfill(plan);

    expect(stamps('c-dup')).toEqual([DEFAULT_ENTITY_ID, DEFAULT_ENTITY_ID]);
  });

  it('moves them in the unambiguous case, so the test above is not asserting inertness', () => {
    // The control. Without it, "the stamps did not move" is equally consistent
    // with an apply that never moves stamps at all.
    entity('ent-solo', 'Sterling', '2026-01-01T00:00:00.000Z');
    seed('c-one', 'You are Sterling, continue.');

    const plan = planEntityBackfill();
    expect(plan.rows.find((r) => r.channelId === 'c-one')!.p2).toBe(2);

    applyEntityBackfill(plan);
    expect(stamps('c-one')).toEqual(['ent-solo', 'ent-solo']);
  });
});

describe('C1 — an all-refused run has nothing to reverse', () => {
  it('writes an undo record naming no channels, and reports nothing to apply', () => {
    entity('ent-old', 'Daedalus', '2026-01-01T00:00:00.000Z');
    entity('ent-new', 'Daedalus', '2026-02-01T00:00:00.000Z');
    seed('c-dup', 'You are Daedalus, resume the cycle.');

    const plan = planEntityBackfill();
    // Establish the subject: there IS a candidate row, and it is refused. An
    // empty plan would satisfy every assertion below without the refusal ever
    // happening — the Round 209 shape, in the round that names it.
    expect(plan.summary.candidates).toBeGreaterThan(0);
    expect(plan.rows.find((r) => r.channelId === 'c-dup')!.skipReason).toBe('ambiguous-name');

    // `summary.apply === 0` is the exact condition the CLI branches on to print
    // "Nothing to apply. Snapshot discarded." and exit before it writes a
    // `.backfill-<stamp>.json` — which is why the probe found zero undo records
    // where it expected one. The branch itself is the CLI's; this is the
    // condition that drives it, and it is the half the suite can see.
    expect(plan.summary.apply).toBe(0);

    const result = applyEntityBackfill(plan);
    expect(result.applied).toBe(0);
    expect(result.minted).toEqual([]);
    expect(result.record.channels).toEqual([]);
    expect(getChannelEntities('c-dup').map((e) => e.id)).toEqual([DEFAULT_ENTITY_ID]);
  });
});

describe('B2 — the sheet names every agent that collided', () => {
  /** A plan row for the ambiguous case, taken from a real plan rather than built by hand. */
  function ambiguousRow(): BackfillPlanRow {
    entity('ent-a', 'Daedalus', '2026-01-01T00:00:00.000Z');
    entity('ent-b', 'daedalus', '2026-01-02T00:00:00.000Z');
    entity('ent-c', '  DAEDALUS ', '2026-01-03T00:00:00.000Z');
    seed('c-dup', 'You are Daedalus, resume the cycle.');
    return planEntityBackfill().rows.find((r) => r.channelId === 'c-dup')!;
  }

  it('prints every colliding id, not one of them, and says how many', () => {
    const note = ambiguousNameNote(ambiguousRow());

    // The positive first: there IS a note. Round 209's finding was a check that
    // asserted a negative about a note that had stopped existing.
    expect(note).not.toBeNull();
    expect(note).toContain('3 agents are named "Daedalus"');
    for (const id of ['ent-a', 'ent-b', 'ent-c']) expect(note).toContain(id.slice(0, 8));
    // And it says what to do, because a refusal the operator cannot act on is
    // just a stop.
    expect(note).toMatch(/Merge or rename/);
    expect(note).toMatch(/bind this channel by hand/);
  });

  it('is the refusal note, not the mint-alongside note — a skipped row gets exactly one', () => {
    const row = ambiguousRow();
    expect(ambiguousNameNote(row)).not.toBeNull();
    expect(mintAlongsideNote(row)).toBeNull();
  });

  it('says nothing on a row that resolved, so the note means what it says', () => {
    entity('ent-solo', 'Sterling', '2026-01-01T00:00:00.000Z');
    seed('c-one', 'You are Sterling, continue.');
    const row = planEntityBackfill().rows.find((r) => r.channelId === 'c-one')!;

    // Establish that this row is the *resolved* case before asserting silence.
    expect(row.action).toBe('matched-by-name');
    expect(row.targetEntityId).toBe('ent-solo');
    expect(ambiguousNameNote(row)).toBeNull();
    expect(mintAlongsideNote(row)).toBeNull();
  });
});

describe('the mint-alongside note counts what it names', () => {
  it('names all four on a role-title mint, in the plural', () => {
    entity('ent-cos1', 'Chief of Staff', '2026-01-01T00:00:00.000Z');
    entity('ent-cos2', 'chief of staff', '2026-01-02T00:00:00.000Z');
    entity('ent-cos3', '  CHIEF OF STAFF ', '2026-01-03T00:00:00.000Z');
    entity('ent-cos4', 'Chief Of Staff', '2026-01-04T00:00:00.000Z');
    seed('c-cos', 'You are my chief of staff.');

    const row = planEntityBackfill({ bases: ['role-title'] }).rows.find(
      (r) => r.channelId === 'c-cos'
    )!;
    expect(row.action).toBe('minted');

    const note = mintAlongsideNote(row)!;
    expect(note).not.toBeNull();
    // Theseus's Round 209 §3 in one assertion: the note that said "already
    // exists" now says "already exist", and a check matching the old wording
    // went green when it stopped matching. Pin the count, not the verb alone.
    // The name is the *guess*, lowercase as the opener said it — not any of the
    // four stored spellings. That is what the sheet showed on xian's real corpus
    // (Theseus, Round 209 §3) and the assertion follows the tool, not my memory
    // of it: my first version of this line capitalised it and failed.
    expect(note).toContain('4 agents named "chief of staff" already exist');
    for (const id of ['ent-cos1', 'ent-cos2', 'ent-cos3', 'ent-cos4'])
      expect(note).toContain(id.slice(0, 8));
    expect(note).toContain('this mints another');
  });

  it('is singular against one, because "1 agents ... exist" is how an operator stops reading', () => {
    entity('ent-cos1', 'Chief of Staff', '2026-01-01T00:00:00.000Z');
    seed('c-cos', 'You are my chief of staff.');

    const row = planEntityBackfill({ bases: ['role-title'] }).rows.find(
      (r) => r.channelId === 'c-cos'
    )!;
    const note = mintAlongsideNote(row)!;
    expect(note).toContain('an agent named "chief of staff" already exists');
    expect(note).toContain('does not reuse it');
  });
});
