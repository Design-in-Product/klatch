/**
 * Round 54 — an excerpt stops passing itself off as the whole conversation.
 *
 * This reverses a judgement Round 52 made and Theseus measured. Round 52 marked
 * scope gaps in an excerpt's *interior* only, on the reasoning that a turn
 * before the first row or after the last is outside the radius and already
 * covered by the header's `"Nothing outside these excerpts was read."`
 *
 * That sentence has now been present in four arm-F results across two fires
 * (`docs/research/round51-neighbourhood-retrieval-live-2026-08-14.md`,
 * `docs/research/round53-scope-gap-marker-live-2026-08-15.md` finding 3). All
 * four asserted absence anyway — verbatim *"No restriction was attached to it
 * there"*, a property of a thirty-message thread stated from three lines, with
 * the owner's restriction four rows past the edge. The clause is falsified: the
 * header is present and it is ignored.
 *
 * The *other* clause of that judgement survives and shapes this: one marker
 * meaning both "turns were removed from inside this" and "the conversation
 * continues past this" is worse than either. So this is a second marker with its
 * own vocabulary, not a widening of the first.
 *
 * What these tests are trying to catch, in the order the code can get it wrong:
 *
 * 1. **The arm-F shape itself** — an excerpt in the middle of the agent's own
 *    1-1 must say how much of that conversation it is not showing.
 * 2. **The two counts collapsing into one.** Turns in the entity's transcript
 *    are reachable by another query; turns outside it are unreachable at any
 *    radius. A single number would send the agent looking for the unreachable.
 * 3. **The interior marker's vocabulary leaking onto an edge.** The interior
 *    header sentence says "the lines either side of it are not consecutive",
 *    which has no referent where there is only one side.
 * 4. **Timidity in the other direction.** An excerpt flush with both ends of its
 *    conversation must stay unmarked, or the marker means nothing.
 * 5. **The wrong reference row.** Edges are measured against the nearest
 *    *rendered* excerpt of the *same conversation* — not the array neighbour
 *    (routinely a different room), and not an excerpt the char budget dropped
 *    (not on the page, so not a boundary the reader can see).
 */

import { describe, it, expect, beforeEach } from 'vitest';
import './setup.js';
import { createChannel, createEntity } from '../db/queries.js';
import { getDb } from '../db/index.js';
import { recallFromOtherConversations } from '../claude/recall.js';
import { DEFAULT_MODEL } from '@klatch/shared';
import type { Channel, Entity } from '@klatch/shared';
import { v4 as uuidv4 } from 'uuid';

function say(channelId: string, entityId: string, content: string, at: string): void {
  getDb()
    .prepare(
      'INSERT INTO messages (id, channel_id, role, content, status, model, entity_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    )
    .run(uuidv4(), channelId, 'assistant', content, 'complete', DEFAULT_MODEL, entityId, at);
}

/** A user message — `entity_id` NULL, exactly as `insertMessage` writes it. */
function ask(channelId: string, content: string, at: string): void {
  getDb()
    .prepare(
      'INSERT INTO messages (id, channel_id, role, content, status, model, entity_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    )
    .run(uuidv4(), channelId, 'user', content, 'complete', DEFAULT_MODEL, null, at);
}

/** Minute `n` of a fixed day — keeps ordering explicit rather than incidental. */
const t = (n: number) => `2026-08-15T09:${String(n).padStart(2, '0')}:00.000Z`;

/** The interior marker's phrase. It must never appear on an edge line. */
const INTERIOR_PHRASE = 'not of your transcript';
/**
 * The two edge clauses, which state an affordance rather than a category.
 *
 * The reachable clause carries an address as of Round 56 — Theseus measured the
 * Round 54 wording ("a different search of yours could reach") producing real
 * searches that structurally could not land
 * (`docs/research/round55-excerpt-edge-marker-live-2026-08-15.md` §2). These
 * tests assert the same properties they always did; only the clause they quote
 * moved. `REACHABLE_STEM` is what every reachable clause shares regardless of
 * address, so tests that only care that the split happened do not have to
 * compute one.
 */
const REACHABLE_STEM = 'you can read — ask for them with expand';
const reachable = (conversation: string, from: number, to: number) =>
  `${REACHABLE_STEM} {conversation: "${conversation}", from: ${from}, to: ${to}}`;
const UNREACHABLE = 'no search of yours can reach';
/** The conditional header sentence that explains the edge marker. */
const EDGE_HEADER = 'is the edge of an excerpt';

let agent: Entity;
let colleague: Entity;
let oneOnOne: Channel;
let klatch: Channel;
let elsewhere: Channel;

beforeEach(() => {
  agent = createEntity('Vesper', DEFAULT_MODEL, 'You are Vesper.', '#6366f1');
  colleague = createEntity('Corvus', DEFAULT_MODEL, 'You are Corvus.', '#f59e0b');
  oneOnOne = createChannel('vesper-1-1', '', DEFAULT_MODEL, undefined, 'chat', [agent.id]);
  klatch = createChannel('weekly-review', '', DEFAULT_MODEL, undefined, 'klatch', [agent.id, colleague.id]);
  elsewhere = createChannel('vesper-notes', '', DEFAULT_MODEL, undefined, 'chat', [agent.id]);
});

/** Return the excerpt bodies — everything after the header paragraph. */
function body(text: string): string[] {
  return text.split('\n\n').slice(1);
}

// ── 1. Theseus's arm F ───────────────────────────────────────

describe('Round 54 — the edge of an excerpt is stated, not left to the header', () => {
  /**
   * Arm F rebuilt: the agent's own 1-1, the fact in the middle, the owner's
   * restriction outside the radius. Everything here is in the entity's
   * transcript, so `rawOrdinal === ordinal` throughout and the interior marker
   * cannot fire — which is precisely why Round 52 left this case silent.
   */
  function armF() {
    ask(oneOnOne.id, 'morning', t(1));
    say(oneOnOne.id, agent.id, 'morning — ready when you are', t(2));
    ask(oneOnOne.id, 'the basalt codeword for the rollback is heron-72', t(3));
    say(oneOnOne.id, agent.id, 'noted', t(4));
    ask(oneOnOne.id, 'separately, the deploy window moved to friday', t(5));
    ask(oneOnOne.id, 'and keep that rollback string inside this thread', t(6));
    say(oneOnOne.id, agent.id, 'understood', t(7));
    ask(oneOnOne.id, 'thanks', t(8));
  }

  it('says how much of the conversation it is not showing (arm F)', () => {
    armF();
    const result = recallFromOtherConversations(agent, klatch, {
      query: 'basalt codeword',
    });

    // The match is row 3, radius 2 covers rows 1–5, and the restriction is row
    // 6. Under Round 52 this excerpt ended at "the deploy window moved to
    // friday" and said nothing — 4/4 live runs then asserted no restriction
    // existed.
    expect(result.text).toContain('heron-72');
    expect(result.text).not.toContain('keep that rollback string');

    const lines = body(result.text);
    const last = lines[lines.length - 1];
    expect(last).toContain('3 later message(s) in this conversation');
    // Ordinals 6–8 of the 1-1: the restriction, the ack, and "thanks".
    expect(last).toContain(reachable('vesper-1-1', 6, 8));
  });

  it('does not mark the leading edge when the excerpt starts the conversation', () => {
    armF();
    const result = recallFromOtherConversations(agent, klatch, {
      query: 'basalt codeword',
    });
    expect(body(result.text)[0]).not.toContain('earlier message(s)');
  });

  it('calls the unreachable turns unreachable, and only those', () => {
    // Everything in arm F is the agent's own transcript, so the "no search can
    // reach" clause has nothing to count. Emitting it here would tell the agent
    // a search is futile when it is the exact thing that would work.
    armF();
    const result = recallFromOtherConversations(agent, klatch, {
      query: 'basalt codeword',
    });
    expect(result.text).not.toContain(UNREACHABLE);
  });
});

// ── 2. The two counts, and the interior marker's vocabulary ──

describe('Round 54 — reachable and unreachable are counted apart', () => {
  /**
   * A klatch where both kinds of turn sit outside the excerpt on both sides.
   * Ordinals (scoped) and raw positions:
   *
   *   r1 o1  user       "kickoff one"
   *   r2 --  Corvus     "corvus preamble"      ← outside the transcript
   *   r3 o2  user       "kickoff two"
   *   r4 o3  Vesper     "acknowledged"
   *   r5 o4  Vesper     "the ledger token is jade-vireo"   ← the match
   *   r6 o5  Vesper     "noted"
   *   r7 o6  Vesper     "closing"
   *   r8 --  Corvus     "corvus tail"          ← outside the transcript
   *   r9 o7  user       "one more thing"
   *
   * Radius 2 around o4 gives o2–o6, i.e. r3–r7 — contiguous in *both*
   * numberings, so no interior marker fires and the edges are the only thing
   * under test.
   */
  function mixedRoom() {
    ask(klatch.id, 'kickoff one', t(1));
    say(klatch.id, colleague.id, 'corvus preamble', t(2));
    ask(klatch.id, 'kickoff two', t(3));
    say(klatch.id, agent.id, 'acknowledged', t(4));
    say(klatch.id, agent.id, 'the ledger token is jade-vireo', t(5));
    say(klatch.id, agent.id, 'noted', t(6));
    say(klatch.id, agent.id, 'closing', t(7));
    say(klatch.id, colleague.id, 'corvus tail', t(8));
    ask(klatch.id, 'one more thing', t(9));
  }

  it('reports both counts, on both edges, with the right split', () => {
    mixedRoom();
    const result = recallFromOtherConversations(agent, oneOnOne, {
      query: 'ledger token',
    });

    const lines = body(result.text);
    expect(lines[0]).toBe(
      '[… 2 earlier message(s) in this conversation, not shown here: ' +
      `1 ${reachable('weekly-review', 1, 1)}; 1 that ${UNREACHABLE} …]`
    );
    expect(lines[lines.length - 1]).toBe(
      '[… 2 later message(s) in this conversation, not shown here: ' +
      `1 ${reachable('weekly-review', 7, 7)}; 1 that ${UNREACHABLE} …]`
    );
  });

  it('keeps the interior marker off the edges', () => {
    // The interior header sentence promises "the lines either side of it are
    // not consecutive". At an edge there is only one side, so reusing the
    // phrase would make the header's own explanation false where it applies.
    mixedRoom();
    const result = recallFromOtherConversations(agent, oneOnOne, {
      query: 'ledger token',
    });
    const lines = body(result.text);
    expect(lines[0]).not.toContain(INTERIOR_PHRASE);
    expect(lines[lines.length - 1]).not.toContain(INTERIOR_PHRASE);
  });

  it('leaves the match and excerpt accounting alone', () => {
    mixedRoom();
    const result = recallFromOtherConversations(agent, oneOnOne, {
      query: 'ledger token',
    });
    expect(result.matchCount).toBe(1);
    expect(result.shownCount).toBe(1);
    // An edge is not an excerpt boundary — it is the boundary of the whole
    // rendered stretch, and `---` still means "two separate stretches".
    expect(body(result.text).join('\n\n')).not.toContain('---');
  });
});

// ── 3. Timidity, and the conditional header ─────────────────

describe('Round 54 — silence where there is nothing past the edge', () => {
  function wholeConversation() {
    ask(oneOnOne.id, 'the freight code is delta-nine', t(1));
    say(oneOnOne.id, agent.id, 'noted, delta-nine', t(2));
    ask(oneOnOne.id, 'thanks', t(3));
  }

  it('adds no edge marker when the excerpt is the whole conversation', () => {
    wholeConversation();
    const result = recallFromOtherConversations(agent, klatch, {
      query: 'freight code',
    });
    expect(result.text).toContain('delta-nine');
    expect(result.text).not.toContain('message(s) in this conversation');
  });

  it('explains the edge marker in the header only when one is in the body', () => {
    wholeConversation();
    const flush = recallFromOtherConversations(agent, klatch, {
      query: 'freight code',
    });
    expect(flush.text).not.toContain(EDGE_HEADER);

    // Same tool, same entity, an excerpt that does not reach the end.
    ask(elsewhere.id, 'the escrow reference is pewter-lark', t(1));
    ask(elsewhere.id, 'unrelated', t(2));
    ask(elsewhere.id, 'also unrelated', t(3));
    ask(elsewhere.id, 'still unrelated', t(4));
    const partial = recallFromOtherConversations(agent, klatch, {
      query: 'escrow reference',
    });
    expect(partial.text).toContain(EDGE_HEADER);
  });
});

// ── 4. Which row an edge is measured against ────────────────

describe('Round 54 — the reference row', () => {
  it('measures against the neighbouring excerpt of the same conversation', () => {
    // Two matches ten turns apart in one room: `---` already says they are two
    // stretches, and the edge between them must count the turns *between them*,
    // not the turns before the first of them.
    ask(oneOnOne.id, 'the escrow reference is pewter-lark', t(1));
    for (let n = 2; n <= 11; n++) ask(oneOnOne.id, `filler ${n}`, t(n));
    ask(oneOnOne.id, 'the escrow reference is still pewter-lark', t(12));
    ask(oneOnOne.id, 'thanks', t(13));

    const result = recallFromOtherConversations(agent, klatch, {
      query: 'escrow reference',
    });
    const lines = body(result.text);

    // Excerpt one is rows 1–3, excerpt two is rows 10–13. Between them: rows
    // 4–9, six turns. Measured from the start of the conversation it would read
    // nine, which would be a true statement about the room and a false one
    // about the page.
    const between = lines.findIndex((l) => l.includes('earlier message(s)'));
    expect(between).toBeGreaterThan(0);
    expect(lines[between]).toContain('6 earlier message(s) in this conversation');
    // The address must be measured against the same reference the count is:
    // rows 4–9, not 1–9.
    expect(lines[between]).toContain(reachable('vesper-1-1', 4, 9));
  });

  it('measures against the same conversation, not the array neighbour', () => {
    // The two rooms interleave in wall-clock order, so the rows arrive
    // alternating and an edge measured against the adjacent *array* excerpt
    // would be describing a different conversation entirely.
    const rooms = [oneOnOne, elsewhere];
    for (let n = 1; n <= 12; n++) {
      const room = rooms[n % 2];
      const turn = Math.ceil(n / 2);
      // Both rooms match, at different turns, so a cross-conversation reference
      // is actually available to be picked up by mistake.
      const isMatch = room.id === elsewhere.id ? turn === 3 : turn === 4;
      ask(room.id, isMatch ? 'the escrow reference is pewter-lark' : `${room.name} turn ${turn}`, t(n));
    }

    const result = recallFromOtherConversations(agent, klatch, {
      query: 'escrow reference',
    });
    const lines = body(result.text);

    // Each room has 6 turns. `vesper-notes` matches at turn 3, so its excerpt is
    // turns 1–5 and one turn follows. `vesper-1-1` matches at turn 4, so its
    // excerpt is turns 2–6 and one turn precedes. The two excerpts are adjacent
    // in the rendered list, and each other's wrong reference: measured across
    // rooms both counts come out negative and both markers vanish.
    const notes = lines.findIndex((l) => l.includes('vesper-notes turn 5'));
    expect(notes).toBeGreaterThan(0);
    expect(lines[notes + 1]).toContain('1 later message(s) in this conversation');

    const oneOne = lines.findIndex((l) => l.includes('vesper-1-1 turn 2'));
    expect(oneOne).toBeGreaterThan(0);
    expect(lines[oneOne - 1]).toContain('1 earlier message(s) in this conversation');
  });

  it('does not measure against an excerpt the budget dropped', () => {
    // An excerpt that never reaches the page is not a boundary the reader can
    // see, so the surviving excerpt's edge must run to the start of the
    // conversation instead.
    const big = 'x'.repeat(4_500);
    ask(oneOnOne.id, `the escrow reference is pewter-lark ${big}`, t(1));
    for (let n = 2; n <= 5; n++) ask(oneOnOne.id, `filler ${n} ${big}`, t(n));
    for (let n = 6; n <= 17; n++) ask(oneOnOne.id, `filler ${n}`, t(n));
    ask(oneOnOne.id, 'the escrow reference again is pewter-lark', t(18));

    const result = recallFromOtherConversations(agent, klatch, {
      query: 'escrow reference',
    });

    // Both matched; only the newer excerpt fits the 12,000-char budget.
    expect(result.matchCount).toBe(2);
    expect(result.shownCount).toBe(1);
    // On the body only: the header contains `---` in the sentence *describing*
    // the separator, so asserting over the whole text passes vacuously — the
    // stale-probe trap this file's Round 51 sibling was caught by.
    const lines = body(result.text);
    expect(lines.join('\n\n')).not.toContain('---');

    // The dropped excerpt is rows 1–3. Measured against it the count would be
    // 12; measured against the conversation, which is what the reader can
    // check, it is 15.
    expect(lines[0]).toContain('15 earlier message(s) in this conversation');
  });
});
