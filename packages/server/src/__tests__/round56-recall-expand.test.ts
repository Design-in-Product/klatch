/**
 * Round 56 — the counted turns can be asked for.
 *
 * Round 54 gave an excerpt an edge marker: how many turns of the conversation
 * lie past it, split into the ones this agent could reach and the ones nothing
 * can reach. Theseus ran it live
 * (`docs/research/round55-excerpt-edge-marker-live-2026-08-15.md`) and the
 * headline was null — the false absence claim still landed 4/5. But the clause
 * *acted*: 2 of 5 runs issued an unprompted query aimed at the hidden
 * restriction, a shape absent from Rounds 50, 51 and 53. Both returned zero rows
 * and both had to, because terms are ANDed and an agent asked about a codeword
 * cannot guess that the restriction reads *"keep it between the two of us"*. In
 * F/R4 the failed search then became the warrant for the same false sentence,
 * which is worse than the passive version it replaced.
 *
 * So the count becomes an address. What these tests are trying to catch, in the
 * order the code can get it wrong:
 *
 * 1. **The address describing a different stretch from the count beside it.**
 *    `to - from + 1 === ownCount` is the invariant, on both edges, measured
 *    against whichever reference the count used.
 * 2. **The round trip not closing** — the address an edge hands over must
 *    actually return the turns that edge was counting, restriction included.
 * 3. **Expansion widening scope.** A range is addressed in the entity's own
 *    numbering; a turn it was never party to has no position to name and must
 *    stay absent, marked, exactly as it is in a search excerpt.
 * 4. **Reaching the current room** through the back door the search path is
 *    explicitly closed to.
 * 5. **A name that addresses two rooms** answering from one of them — a real
 *    stretch of the wrong conversation under a label the agent cannot check.
 * 6. **A silent cap.** A range larger than one call can render must say where it
 *    stopped and how to continue, or the agent reads a slice as the whole.
 * 7. **The expansion passing itself off as complete** — an expanded stretch has
 *    edges of its own and they are marked like any other.
 * 8. **Timidity in the other direction.** Expanding a whole conversation must
 *    produce no edge marker and no sentence explaining one.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import './setup.js';
import { createChannel, createEntity } from '../db/queries.js';
import { getDb } from '../db/index.js';
import {
  recallFromOtherConversations,
  expandConversationRange,
  RECALL_MAX_EXPAND_ROWS,
} from '../claude/recall.js';
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

const INTERIOR_PHRASE = 'not of your transcript';
const UNREACHABLE = 'no search of yours can reach';

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

/** Return the excerpt bodies — everything after the header paragraph. */
function body(text: string): string[] {
  return text.split('\n\n').slice(1);
}

/** Every `{conversation: "x", from: n, to: m}` an edge marker put in the text. */
function addresses(text: string): { conversation: string; from: number; to: number }[] {
  const found: { conversation: string; from: number; to: number }[] = [];
  const re = /\{conversation: "([^"]+)", from: (\d+), to: (\d+)\}/g;
  for (const m of text.matchAll(re)) {
    found.push({ conversation: m[1], from: Number(m[2]), to: Number(m[3]) });
  }
  return found;
}

/** Arm F: the fact in the middle, the owner's restriction outside the radius. */
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

// ── 1. The address and the count describe the same stretch ──

describe('Round 56 — the address is what the count is about', () => {
  it('spans exactly the counted reachable turns, on both edges', () => {
    // Ten turns, a match at 5 only. Radius 2 shows 3–7, so 2 turns lie before
    // and 3 after — and the two addresses must be 1–2 and 8–10.
    for (let n = 1; n <= 10; n++) {
      ask(oneOnOne.id, n === 5 ? 'the escrow reference is pewter-lark' : `filler ${n}`, t(n));
    }

    const result = recallFromOtherConversations(agent, klatch, { query: 'escrow reference' });
    const found = addresses(result.text);

    expect(found).toEqual([
      { conversation: 'vesper-1-1', from: 1, to: 2 },
      { conversation: 'vesper-1-1', from: 8, to: 10 },
    ]);

    // The invariant, asserted against the counts printed on the same lines
    // rather than against the fixture — so a change to either has to move both.
    const lines = body(result.text);
    expect(lines[0]).toContain('2 earlier message(s)');
    expect(lines[0]).toContain('2 you can read');
    expect(lines[lines.length - 1]).toContain('3 later message(s)');
    expect(lines[lines.length - 1]).toContain('3 you can read');
    for (const a of found) expect(a.to - a.from + 1).toBeGreaterThan(0);
  });

  it('measures the address against the neighbouring excerpt, not the conversation', () => {
    // Two matches ten apart: the turns between them are 4–9, and an address of
    // 1–9 would be a true statement about the room and a false one about the
    // page — the same error the count itself is guarded against.
    ask(oneOnOne.id, 'the escrow reference is pewter-lark', t(1));
    for (let n = 2; n <= 11; n++) ask(oneOnOne.id, `filler ${n}`, t(n));
    ask(oneOnOne.id, 'the escrow reference is still pewter-lark', t(12));
    ask(oneOnOne.id, 'thanks', t(13));

    const result = recallFromOtherConversations(agent, klatch, { query: 'escrow reference' });
    const between = addresses(result.text).find((a) => a.from === 4);
    expect(between).toEqual({ conversation: 'vesper-1-1', from: 4, to: 9 });
  });

  it('offers no address where nothing reachable lies past the edge', () => {
    // A klatch turn outside the transcript on each side: the counts are real,
    // the reachable half is zero, and an address would point at nothing.
    say(klatch.id, colleague.id, 'corvus preamble', t(1));
    ask(klatch.id, 'the ledger token is jade-vireo', t(2));
    say(klatch.id, colleague.id, 'corvus tail', t(3));

    const result = recallFromOtherConversations(agent, oneOnOne, { query: 'ledger token' });
    expect(result.text).toContain(UNREACHABLE);
    expect(addresses(result.text)).toEqual([]);
  });
});

// ── 2. The round trip ────────────────────────────────────────

describe('Round 56 — the address returns what the edge counted', () => {
  it('closes arm F: the search hides the restriction, the expansion returns it', () => {
    armF();

    const search = recallFromOtherConversations(agent, klatch, { query: 'basalt codeword' });
    expect(search.text).toContain('heron-72');
    expect(search.text).not.toContain('keep that rollback string');

    // Taken out of the result rather than written by hand — the test fails if
    // the marker stops handing over an address, which is the whole increment.
    const address = addresses(search.text).find((a) => a.from === 6);
    expect(address).toBeDefined();

    const expanded = expandConversationRange(agent, klatch, address!);
    expect(expanded.isError).toBe(false);
    expect(expanded.text).toContain('keep that rollback string inside this thread');
    expect(expanded.text).toContain('understood');
    expect(expanded.text).toContain('Positions 6–8 of "vesper-1-1"');
  });

  it('does not return the turns the excerpt already showed', () => {
    armF();
    const search = recallFromOtherConversations(agent, klatch, { query: 'basalt codeword' });
    const address = addresses(search.text).find((a) => a.from === 6)!;
    const expanded = expandConversationRange(agent, klatch, address);

    // Position 5 was on the page; the address starts at 6. An off-by-one here
    // would re-print a turn the agent has already read and quietly shift every
    // later position by one.
    expect(expanded.text).not.toContain('the deploy window moved to friday');
  });
});

// ── 3. Scope is not widened ──────────────────────────────────

describe('Round 56 — expansion adds no reach', () => {
  it('omits a turn outside the transcript and marks the hole', () => {
    ask(klatch.id, 'kickoff', t(1));
    say(klatch.id, agent.id, 'the ledger token is jade-vireo', t(2));
    say(klatch.id, colleague.id, 'and keep that between us', t(3));
    say(klatch.id, agent.id, 'understood', t(4));
    ask(klatch.id, 'thanks', t(5));

    // Positions 1–4 of the agent's four scoped rows: the colleague's
    // restriction sits between scoped 2 and 3 and has no position of its own.
    const expanded = expandConversationRange(agent, oneOnOne, {
      conversation: 'weekly-review',
      from: 1,
      to: 4,
    });

    expect(expanded.isError).toBe(false);
    expect(expanded.text).not.toContain('keep that between us');
    expect(expanded.text).toContain(INTERIOR_PHRASE);
    expect(expanded.shownCount).toBe(4);
  });

  it('will not reach the room the agent is speaking in', () => {
    armF();
    // The same address that works from elsewhere, asked from inside the room.
    const expanded = expandConversationRange(agent, oneOnOne, {
      conversation: 'vesper-1-1',
      from: 6,
      to: 8,
    });
    expect(expanded.isError).toBe(true);
    expect(expanded.text).toContain('No conversation of yours outside this room');
    expect(expanded.text).not.toContain('keep that rollback string');
  });

  it('will not reach a conversation the entity was never in', () => {
    const stranger = createEntity('Wren', DEFAULT_MODEL, 'You are Wren.', '#10b981');
    const theirs = createChannel('wren-1-1', '', DEFAULT_MODEL, undefined, 'chat', [stranger.id]);
    ask(theirs.id, 'the private figure is 41', t(1));
    ask(theirs.id, 'more', t(2));

    const expanded = expandConversationRange(agent, klatch, {
      conversation: 'wren-1-1',
      from: 1,
      to: 2,
    });
    expect(expanded.isError).toBe(true);
    expect(expanded.text).not.toContain('private figure');
  });
});

// ── 4. An address that does not identify one stretch ─────────

describe('Round 56 — addresses that cannot be resolved say so', () => {
  it('refuses a name that addresses two conversations', () => {
    // Klatch does not enforce unique channel names. Answering from one of them
    // returns a real stretch of the wrong room under a label the agent has no
    // way to check.
    const twinA = createChannel('sync', '', DEFAULT_MODEL, undefined, 'chat', [agent.id]);
    const twinB = createChannel('sync', '', DEFAULT_MODEL, undefined, 'chat', [agent.id]);
    ask(twinA.id, 'the figure in A is 11', t(1));
    ask(twinB.id, 'the figure in B is 22', t(1));

    const expanded = expandConversationRange(agent, klatch, {
      conversation: 'sync',
      from: 1,
      to: 1,
    });
    expect(expanded.isError).toBe(true);
    expect(expanded.text).toContain('2 of your conversations are named "sync"');
    expect(expanded.text).not.toContain('figure in A');
    expect(expanded.text).not.toContain('figure in B');
  });

  it('reports an empty range without inventing one', () => {
    armF();
    const expanded = expandConversationRange(agent, klatch, {
      conversation: 'vesper-1-1',
      from: 40,
      to: 50,
    });
    expect(expanded.isError).toBe(false);
    expect(expanded.shownCount).toBe(0);
    expect(expanded.text).toContain('nothing of yours at positions 40–50');
  });

  it('rejects a half-specified address rather than guessing the rest', () => {
    armF();
    const expanded = expandConversationRange(agent, klatch, {
      conversation: '',
      from: 6,
      to: 8,
    });
    expect(expanded.isError).toBe(true);
    expect(expanded.text).not.toContain('keep that rollback string');
  });
});

// ── 5. The cap, and the expansion's own edges ────────────────

describe('Round 56 — an expansion states its own extent', () => {
  it('caps the rows and says where to continue', () => {
    const total = RECALL_MAX_EXPAND_ROWS + 8;
    for (let n = 1; n <= total; n++) ask(oneOnOne.id, `turn ${n}`, t(n));

    const expanded = expandConversationRange(agent, klatch, {
      conversation: 'vesper-1-1',
      from: 1,
      to: total,
    });

    expect(expanded.shownCount).toBe(RECALL_MAX_EXPAND_ROWS);
    expect(expanded.matchCount).toBe(total);
    expect(expanded.text).toContain(`Positions 1–${RECALL_MAX_EXPAND_ROWS}`);
    expect(expanded.text).toContain(`Ask again with from: ${RECALL_MAX_EXPAND_ROWS + 1}`);
    expect(expanded.text).toContain(`turn ${RECALL_MAX_EXPAND_ROWS}`);
    expect(expanded.text).not.toContain(`turn ${RECALL_MAX_EXPAND_ROWS + 1}`);
  });

  it('marks the conversation continuing past the expansion, with an address', () => {
    for (let n = 1; n <= 12; n++) ask(oneOnOne.id, `turn ${n}`, t(n));

    const expanded = expandConversationRange(agent, klatch, {
      conversation: 'vesper-1-1',
      from: 4,
      to: 6,
    });

    // The expansion is an excerpt like any other: it does not get to imply it
    // is the conversation. And its own edges are addressable, so the agent can
    // keep going without going back to keywords.
    expect(addresses(expanded.text)).toEqual([
      { conversation: 'vesper-1-1', from: 1, to: 3 },
      { conversation: 'vesper-1-1', from: 7, to: 12 },
    ]);
    expect(expanded.text).toContain('is the edge of an excerpt');
  });

  it('stays silent when the expansion is the whole conversation', () => {
    for (let n = 1; n <= 5; n++) ask(oneOnOne.id, `turn ${n}`, t(n));

    const expanded = expandConversationRange(agent, klatch, {
      conversation: 'vesper-1-1',
      from: 1,
      to: 5,
    });

    // Timidity in the other direction. A marker on an excerpt that is flush
    // with both ends would mean nothing, and the sentence explaining it would
    // teach the agent to look for a line that is not there.
    expect(addresses(expanded.text)).toEqual([]);
    expect(expanded.text).not.toContain('message(s) in this conversation');
    expect(expanded.text).not.toContain('is the edge of an excerpt');
    expect(expanded.text).not.toContain(INTERIOR_PHRASE);
  });
});

// ── 6. What the header now tells the agent to do ─────────────

describe('Round 56 — the header points at the address, not at another search', () => {
  it('replaces the instruction to search again with the instruction to expand', () => {
    armF();
    const result = recallFromOtherConversations(agent, klatch, { query: 'basalt codeword' });

    // Round 54's wording — measured by Theseus producing real searches that
    // structurally could not land. Its absence is the finding acted on.
    expect(result.text).not.toContain('search again with other terms');
    expect(result.text).not.toContain('a different search of yours could reach');
    expect(result.text).toContain('call this tool again with exactly that expand argument');
  });

  it('says nothing about expanding when no edge marker is present', () => {
    // One conversation, one match, flush at both ends: nothing is counted, so
    // nothing should be explained.
    ask(oneOnOne.id, 'the escrow reference is pewter-lark', t(1));
    ask(oneOnOne.id, 'noted', t(2));

    const result = recallFromOtherConversations(agent, klatch, { query: 'escrow reference' });
    expect(result.text).not.toContain('is the edge of an excerpt');
    expect(result.text).not.toContain('expand argument');
  });
});
