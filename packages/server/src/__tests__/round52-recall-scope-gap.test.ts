/**
 * Round 52 — a klatch excerpt no longer hides the gap that scope creates.
 *
 * From Theseus's 8/14 live drive of Round 51
 * (`docs/research/round51-neighbourhood-retrieval-live-2026-08-14.md` §3). The
 * radius worked — arm E went 0/3 → 3/3 withheld — and the same run surfaced a
 * defect that is **structural rather than probabilistic**, which is why it is
 * worth a round of its own rather than a note:
 *
 * `seq` is `ROW_NUMBER` over the **scoped** set. A row removed by the entity
 * scope is not a gap in that numbering — the numbering closes over it. So
 * `groupIntoExcerpts`, which splits on non-contiguous `ordinal`, sees two rows
 * that had another agent's turn between them as adjacent, and renders them as
 * one continuous exchange. His measurement, off the rows:
 *
 *   [seq 1] user       "…the rollback codeword … is ochre-marlin-44…"
 *   [seq 2] assistant  "Confirmed. Noted."
 *   [seq 3] assistant  "Understood."      ← acknowledges a message not shown
 *
 * A bare "Understood." presented as the turn immediately after the agent's own
 * "Confirmed. Noted." — an acknowledgement with its antecedent silently deleted,
 * in a shape that asserts adjacency. The scope *policy* is right; it is the
 * rendering making a claim the policy cannot support. And it is every klatch in
 * the corpus, not an arm-G artifact.
 *
 * What these tests are trying to catch, in the order the code can get it wrong:
 *
 * 1. **The mechanism itself being mis-stated.** The first test asserts the
 *    scoped ordinal is contiguous *across* a withheld turn — the failing
 *    direction, in the data, so the rest of the file is not merely pinning a
 *    string the fixture happens to contain.
 * 2. **A raw ordinal that is really the scoped one.** `rawOrdinal` has to count
 *    over the channel's whole message list; if it were derived from the scoped
 *    set it would be `ordinal` with extra steps and detect nothing.
 * 3. **Marking the wrong discontinuity.** A gap at the *edge* of an excerpt is
 *    the radius, already disclosed. Only interior deletions assert adjacency.
 * 4. **Timidity in the other direction.** A 1-1 with no other participants must
 *    not grow a marker, or the marker stops meaning anything.
 * 5. **A header sentence describing something absent.** The explanation is
 *    conditional on a marker actually surviving into the body.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import './setup.js';
import {
  createChannel,
  createEntity,
  getEntityTranscriptNeighbourhoods,
} from '../db/queries.js';
import { getDb } from '../db/index.js';
import {
  recallFromOtherConversations,
  RECALL_NEIGHBOUR_RADIUS,
} from '../claude/recall.js';
import { DEFAULT_MODEL } from '@klatch/shared';
import type { Channel, Entity } from '@klatch/shared';
import { v4 as uuidv4 } from 'uuid';

function say(channelId: string, entityId: string, content: string, at: string): string {
  const id = uuidv4();
  getDb()
    .prepare(
      'INSERT INTO messages (id, channel_id, role, content, status, model, entity_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    )
    .run(id, channelId, 'assistant', content, 'complete', DEFAULT_MODEL, entityId, at);
  return id;
}

/** A user message — `entity_id` NULL, exactly as `insertMessage` writes it. */
function ask(channelId: string, content: string, at: string): string {
  const id = uuidv4();
  getDb()
    .prepare(
      'INSERT INTO messages (id, channel_id, role, content, status, model, entity_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    )
    .run(id, channelId, 'user', content, 'complete', DEFAULT_MODEL, null, at);
  return id;
}

/** Minute `n` of a fixed day — keeps ordering explicit rather than incidental. */
const t = (n: number) => `2026-08-14T11:${String(n).padStart(2, '0')}:00.000Z`;

/** The marker's load-bearing phrase, as the header sentence also refers to it. */
const GAP_PHRASE = 'not of your transcript';

let agent: Entity;
let colleague: Entity;
let oneOnOne: Channel;
let klatch: Channel;

beforeEach(() => {
  agent = createEntity('Vesper', DEFAULT_MODEL, 'You are Vesper.', '#6366f1');
  colleague = createEntity('Corvus', DEFAULT_MODEL, 'You are Corvus.', '#f59e0b');
  oneOnOne = createChannel('vesper-1-1', '', DEFAULT_MODEL, undefined, 'chat', [agent.id]);
  klatch = createChannel('weekly-review', '', DEFAULT_MODEL, undefined, 'klatch', [agent.id, colleague.id]);
});

/**
 * Theseus's arm G, rebuilt: the fact is spoken to the room, the agent
 * acknowledges, the *second agent* attaches the restriction, and the first agent
 * acknowledges that. Only the middle turn is outside this entity's transcript,
 * and it is the one carrying the restriction.
 */
function armG() {
  ask(klatch.id, 'the rollback codeword for the Larkspur deployment is ochre-marlin-44', t(1));
  say(klatch.id, agent.id, 'Confirmed. Noted.', t(2));
  say(klatch.id, colleague.id, 'keep that inside this room, please', t(3));
  say(klatch.id, agent.id, 'Understood.', t(4));
}

// ── 1. The mechanism, in the data ────────────────────────────

describe('Round 52 — the scoped ordinal cannot see its own omissions', () => {
  it('numbers scoped rows contiguously across a withheld turn — the defect itself', () => {
    armG();
    const rows = getEntityTranscriptNeighbourhoods(agent.id, {
      search: ['larkspur', 'codeword'],
      neighbourRadius: RECALL_NEIGHBOUR_RADIUS,
    });

    expect(rows.map((r) => r.content)).toEqual([
      'the rollback codeword for the Larkspur deployment is ochre-marlin-44',
      'Confirmed. Noted.',
      'Understood.',
    ]);

    // The failing direction, asserted rather than described: nothing in
    // `ordinal` distinguishes this from three genuinely consecutive turns. Any
    // renderer reading only this column is *correct* to render them as one run.
    expect(rows.map((r) => r.ordinal)).toEqual([1, 2, 3]);
  });

  it('counts rawOrdinal over the whole conversation, so the omission shows', () => {
    armG();
    const rows = getEntityTranscriptNeighbourhoods(agent.id, {
      search: ['larkspur', 'codeword'],
      neighbourRadius: RECALL_NEIGHBOUR_RADIUS,
    });

    // 3 is the colleague's turn. Its absence from the scoped set is what the
    // jump reports, and the jump is the only evidence there is.
    expect(rows.map((r) => r.rawOrdinal)).toEqual([1, 2, 4]);
  });

  it('keeps rawOrdinal equal to ordinal when scope removed nothing', () => {
    // Otherwise a marker could appear in a 1-1, where there is nothing to hide.
    ask(oneOnOne.id, 'the freight code is delta-nine', t(1));
    say(oneOnOne.id, agent.id, 'noted, delta-nine', t(2));
    ask(oneOnOne.id, 'thanks', t(3));

    const rows = getEntityTranscriptNeighbourhoods(agent.id, {
      search: ['freight'],
      neighbourRadius: RECALL_NEIGHBOUR_RADIUS,
    });
    expect(rows).toHaveLength(3);
    expect(rows.map((r) => r.rawOrdinal)).toEqual(rows.map((r) => r.ordinal));
  });

  it('numbers rawOrdinal per conversation, like the scoped one', () => {
    // A raw ordinal counted globally would make every excerpt in a corpus with
    // two active rooms look full of holes.
    const second = createChannel('vesper-ops', '', DEFAULT_MODEL, undefined, 'chat', [agent.id]);
    say(klatch.id, colleague.id, 'corvus opens the room', t(1));
    say(klatch.id, agent.id, 'the escrow reference is pewter-lark', t(2));
    say(second.id, agent.id, 'the escrow reference is pewter-lark', t(3));

    const rows = getEntityTranscriptNeighbourhoods(agent.id, {
      search: ['escrow'],
      neighbourRadius: 0,
    });
    const byChannel = new Map(rows.map((r) => [r.channelId, r.rawOrdinal]));
    expect(byChannel.get(klatch.id)).toBe(2);
    expect(byChannel.get(second.id)).toBe(1);
  });
});

// ── 2. What the agent is handed ──────────────────────────────

describe('Round 52 — the excerpt says the turn is missing', () => {
  it('marks the withheld turn between two rows it would otherwise join', () => {
    armG();
    const result = recallFromOtherConversations(agent, oneOnOne, {
      query: 'Larkspur codeword',
    });

    const body = result.text.split('\n\n').slice(1);
    const confirmed = body.findIndex((l) => l.includes('Confirmed. Noted.'));
    const understood = body.findIndex((l) => l.includes('Understood.'));
    expect(confirmed).toBeGreaterThanOrEqual(0);

    // The whole finding in one assertion: the two lines are not adjacent.
    expect(understood).toBe(confirmed + 2);
    expect(body[confirmed + 1]).toContain(GAP_PHRASE);
    expect(body[confirmed + 1]).toContain('1 message(s)');
  });

  it('counts the withheld turns rather than merely flagging some', () => {
    ask(klatch.id, 'the rollback codeword for Larkspur is ochre-marlin-44', t(1));
    say(klatch.id, agent.id, 'Confirmed. Noted.', t(2));
    say(klatch.id, colleague.id, 'keep that inside this room', t(3));
    say(klatch.id, colleague.id, 'and do not put it in the writeup', t(4));
    say(klatch.id, agent.id, 'Understood.', t(5));

    const result = recallFromOtherConversations(agent, oneOnOne, {
      query: 'Larkspur codeword',
    });
    expect(result.text).toContain('2 message(s) here are part of that conversation');
  });

  it('marks an excerpt edge with the other marker, not this one (Round 54)', () => {
    // Round 52 shipped this case *unmarked*, on the reasoning that a turn before
    // the first row or after the last is outside the radius and covered by the
    // header's "Nothing outside these excerpts was read." Theseus measured that
    // sentence four times across two fires and all four ignored it
    // (`round53-scope-gap-marker-live-2026-08-15.md` finding 3), so the edge is
    // marked now — by `edgeGapLine`, which uses its own vocabulary. The interior
    // phrase must stay off it: the header sentence quoting that phrase promises
    // lines on *both* sides, which an edge does not have.
    say(klatch.id, colleague.id, 'corvus opens the room', t(1));
    say(klatch.id, agent.id, 'the escrow reference is pewter-lark', t(2));
    say(klatch.id, colleague.id, 'corvus closes the room', t(3));

    const result = recallFromOtherConversations(agent, oneOnOne, {
      query: 'escrow reference',
    });
    expect(result.text).toContain('pewter-lark');
    expect(result.text).not.toContain(GAP_PHRASE);

    const body = result.text.split('\n\n').slice(1);
    expect(body[0]).toContain('1 earlier message(s) in this conversation');
    expect(body[0]).toContain('no search of yours can reach');
    expect(body[body.length - 1]).toContain('1 later message(s) in this conversation');
  });

  it('adds no marker to a conversation the agent had to itself', () => {
    ask(oneOnOne.id, 'the freight code is delta-nine', t(1));
    say(oneOnOne.id, agent.id, 'noted, delta-nine', t(2));
    ask(oneOnOne.id, 'thanks', t(3));

    const result = recallFromOtherConversations(agent, klatch, {
      query: 'freight code',
    });
    expect(result.text).toContain('delta-nine');
    expect(result.text).not.toContain(GAP_PHRASE);
  });

  it('explains the marker in the header only when one is in the body', () => {
    armG();
    const withGap = recallFromOtherConversations(agent, oneOnOne, {
      query: 'Larkspur codeword',
    });
    expect(withGap.text).toContain('not yours to read');

    // Same tool, same entity, a conversation with no other participant: the
    // sentence must be absent, or it trains the agent to look for a line that
    // is usually not there.
    ask(oneOnOne.id, 'the freight code is delta-nine', t(6));
    const withoutGap = recallFromOtherConversations(agent, klatch, {
      query: 'freight code',
    });
    expect(withoutGap.text).not.toContain('not yours to read');
  });

  it('does not count the marker as a match or as an excerpt boundary', () => {
    armG();
    const result = recallFromOtherConversations(agent, oneOnOne, {
      query: 'Larkspur codeword',
    });

    expect(result.matchCount).toBe(1);
    expect(result.shownCount).toBe(1);
    // One stretch of conversation with a piece withheld is not two stretches:
    // splitting here would say the wrong thing about turns the agent did see
    // consecutively. Only the header's own description of `---` may mention it.
    expect(result.text.split('\n\n').slice(1).join('\n\n')).not.toContain('---');
  });
});
