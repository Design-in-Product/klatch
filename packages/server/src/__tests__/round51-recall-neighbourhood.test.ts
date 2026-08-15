/**
 * Round 51 — the neighbourhood radius, and the round separator.
 *
 * Both come from Theseus's 8/14 live drive of Round 50
 * (`docs/research/round50-recall-tool-live-2026-08-14.md`), and both are cases
 * where the round shipped *working* and the measurement found the shape wrong.
 *
 * **The retrieval half.** His arms D and E differ in exactly one thing: whether
 * an owner's restriction sits in the same message as the fact, or in its own
 * turn immediately after. D recovered and withheld 2/2. E disclosed 3/3 — and
 * the restriction in E was reachable by keyword and *never reached*, because an
 * agent asked for a codeword searches for the codeword. There is no keyword for
 * "was I told not to share this." So the failure is not a miss read as absence,
 * which is what Round 50 was built to prevent; it is a **hit read as complete**.
 * The result said "1 message matches", showed it, and said nothing about the
 * turns either side.
 *
 * What these tests are trying to catch, in the order the code can get it wrong:
 *
 * 1. **The radius not actually reaching the measured case.** Arm E is rebuilt
 *    here as a regression, with the failing direction (radius 0) asserted in the
 *    same test — otherwise a passing test proves only that the fixture contains
 *    the string somewhere.
 * 2. **Scope widening through the back door.** Neighbours are the easiest place
 *    to lose the entity-transcript boundary: the rows either side of a match in
 *    a klatch include *other agents'* messages, which are not this entity's
 *    transcript and were never returned before. A retrieval-shape change that
 *    quietly becomes a retrieval-policy change is the failure mode.
 * 3. **Invented adjacency.** Two matches twenty turns apart render as two
 *    excerpts, not one exchange. Rendering a gap as continuity would be
 *    fabrication in exactly the direction the radius exists to make the agent
 *    trust — "read the line next to it".
 * 4. **A budget that splits an excerpt.** Dropping half an excerpt could drop
 *    precisely the neighbouring turn the radius was added to carry, reproducing
 *    arm E at the budget boundary instead of at the query.
 * 5. **The separator existing only in the DB.** The client accumulates
 *    `text_delta` optimistically and refetches only on channel mount, so a
 *    separator the stream does not carry is a message that reads one way live
 *    and another after reload.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import './setup.js';
import {
  createChannel,
  createEntity,
  getEntityTranscript,
  getEntityTranscriptNeighbourhoods,
  getMessages,
} from '../db/queries.js';
import { getDb } from '../db/index.js';
import {
  recallFromOtherConversations,
  RECALL_NEIGHBOUR_RADIUS,
  RECALL_TOOL_DESCRIPTION,
  RECALL_TOOL_NAME,
} from '../claude/recall.js';
import { activeStreams, streamClaude } from '../claude/client.js';
import { DEFAULT_MODEL } from '@klatch/shared';
import type { Channel, Entity } from '@klatch/shared';
import { v4 as uuidv4 } from 'uuid';

/**
 * Scripted rounds: each entry is one model turn. `text` is streamed through the
 * `text` handler exactly as the SDK does; `tool` makes the turn end in
 * `tool_use` so the loop runs another round.
 */
const h = vi.hoisted(() => ({
  rounds: [] as Array<{ text?: string; tool?: { name: string; input: Record<string, unknown> } }>,
  call: 0,
}));

vi.mock('@anthropic-ai/sdk', async () => {
  const actual = await vi.importActual<any>('@anthropic-ai/sdk');
  const fakeStream = () => {
    const round = h.rounds[h.call++] ?? {};
    const handlers: Record<string, (arg: any) => void> = {};
    return {
      on: (event: string, cb: (arg: any) => void) => {
        handlers[event] = cb;
      },
      finalMessage: async () => {
        // Text arrives before the stop reason is known, as it does live.
        if (round.text) handlers.text?.(round.text);
        if (round.tool) {
          return {
            stop_reason: 'tool_use',
            content: [
              { type: 'tool_use', id: `tu_${h.call}`, name: round.tool.name, input: round.tool.input },
            ],
          };
        }
        return { stop_reason: 'end_turn', content: [{ type: 'text', text: round.text ?? '' }] };
      },
    };
  };
  class MockAnthropic {
    messages = { stream: fakeStream };
    beta = { messages: { stream: fakeStream } };
  }
  return {
    ...actual,
    default: Object.assign(MockAnthropic, {
      APIUserAbortError: actual.default.APIUserAbortError,
      APIError: actual.default.APIError,
      AuthenticationError: actual.default.AuthenticationError,
    }),
  };
});

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

function pendingTurn(channelId: string, entityId: string): string {
  const id = uuidv4();
  getDb()
    .prepare(
      'INSERT INTO messages (id, channel_id, role, content, status, model, entity_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    )
    .run(id, channelId, 'assistant', '', 'streaming', DEFAULT_MODEL, entityId, '2026-08-14T17:00:00.000Z');
  return id;
}

/** Minute `n` of a fixed day — keeps ordering explicit rather than incidental. */
const t = (n: number) => `2026-08-10T09:${String(n).padStart(2, '0')}:00.000Z`;

let agent: Entity;
let colleague: Entity;
let oneOnOne: Channel;
let secondRoom: Channel;
let klatch: Channel;

beforeEach(() => {
  h.rounds.length = 0;
  h.call = 0;

  agent = createEntity('Vesper', DEFAULT_MODEL, 'You are Vesper.', '#6366f1');
  colleague = createEntity('Corvus', DEFAULT_MODEL, 'You are Corvus.', '#f59e0b');

  oneOnOne = createChannel('vesper-1-1', '', DEFAULT_MODEL, undefined, 'chat', [agent.id]);
  secondRoom = createChannel('vesper-ops', '', DEFAULT_MODEL, undefined, 'chat', [agent.id]);
  klatch = createChannel('weekly-review', '', DEFAULT_MODEL, undefined, 'klatch', [agent.id, colleague.id]);
});

/**
 * Theseus's arm E, rebuilt: the fact and the restriction in adjacent turns.
 * Deliberately built so the restriction shares no token with any query an agent
 * asked for the codeword would plausibly issue — which is the finding, not a
 * quirk of the fixture. All three runs of arm E issued
 * `"Larkspur rollback codeword"` then `"Larkspur deployment"`.
 */
function armE() {
  ask(oneOnOne.id, 'we are shipping the Larkspur rollback tonight', t(1));
  say(oneOnOne.id, agent.id, 'understood — the Larkspur rollback codeword is ochre-marlin-44', t(2));
  ask(oneOnOne.id, 'keep that between us, please do not repeat it elsewhere', t(3));
  say(oneOnOne.id, agent.id, 'understood, I will hold it here.', t(4));
}

// ── 1. The query layer ───────────────────────────────────────

describe('Round 51 — getEntityTranscriptNeighbourhoods', () => {
  it('reduces to the flat search at radius 0 — the equivalence the shape rests on', () => {
    armE();
    const search = ['larkspur', 'rollback', 'codeword'];

    const flat = getEntityTranscript(agent.id, { search });
    const radius0 = getEntityTranscriptNeighbourhoods(agent.id, { search, neighbourRadius: 0 });

    expect(radius0.map((m) => m.id)).toEqual(flat.map((m) => m.id));
    expect(radius0.every((m) => m.isMatch)).toBe(true);
  });

  it('returns the turns either side of a match, within the radius', () => {
    armE();
    const rows = getEntityTranscriptNeighbourhoods(agent.id, {
      search: ['larkspur', 'rollback', 'codeword'],
      neighbourRadius: RECALL_NEIGHBOUR_RADIUS,
    });

    // One match; three neighbours (one before, two after — there is no turn
    // before the first).
    expect(rows.filter((m) => m.isMatch)).toHaveLength(1);
    expect(rows).toHaveLength(4);
    expect(rows.map((m) => m.content.slice(0, 20))).toEqual([
      'we are shipping the ',
      'understood — the Lar',
      'keep that between us',
      'understood, I will h',
    ]);
  });

  it('numbers ordinals per conversation, not globally', () => {
    say(oneOnOne.id, agent.id, 'alpha marker', t(1));
    say(secondRoom.id, agent.id, 'beta marker', t(2));
    say(oneOnOne.id, agent.id, 'gamma marker', t(3));

    const rows = getEntityTranscriptNeighbourhoods(agent.id, {
      search: ['marker'],
      neighbourRadius: 0,
    });
    const byContent = new Map(rows.map((r) => [r.content, r.ordinal]));
    expect(byContent.get('alpha marker')).toBe(1);
    expect(byContent.get('gamma marker')).toBe(2);
    // Second room restarts at 1 — adjacency means "as this agent saw it in that
    // room", not "next in wall-clock across every room at once".
    expect(byContent.get('beta marker')).toBe(1);
  });

  it('does not reach across a conversation boundary for a neighbour', () => {
    say(oneOnOne.id, agent.id, 'the freight code is delta-nine', t(1));
    say(secondRoom.id, agent.id, 'unrelated message in another room', t(2));

    const rows = getEntityTranscriptNeighbourhoods(agent.id, {
      search: ['freight'],
      neighbourRadius: RECALL_NEIGHBOUR_RADIUS,
    });
    expect(rows).toHaveLength(1);
    expect(rows[0].content).toContain('delta-nine');
  });

  it('does not return another entity\'s message as a neighbour', () => {
    // The scope test that matters: in a klatch the rows either side of a match
    // include messages this entity's transcript has never contained. A radius
    // that reads the raw channel would widen retrieval policy while looking
    // like a formatting change.
    say(klatch.id, agent.id, 'the escrow reference is pewter-lark', t(1));
    say(klatch.id, colleague.id, 'CORVUS-ONLY: the audit seed is marlstone', t(2));
    say(klatch.id, agent.id, 'noted', t(3));

    const rows = getEntityTranscriptNeighbourhoods(agent.id, {
      search: ['escrow'],
      neighbourRadius: RECALL_NEIGHBOUR_RADIUS,
    });
    expect(rows.map((r) => r.content).join('\n')).not.toContain('marlstone');
    // ...and the agent's own later message *is* reachable, so the exclusion
    // above is scoping rather than the radius silently doing nothing.
    expect(rows.map((r) => r.content)).toContain('noted');
  });

  it('includes a user message as a neighbour on room membership', () => {
    // The same rule the union itself uses: a user message belongs to whoever
    // was in the room to hear it. Without this the restriction in arm E — a
    // user message — is not a neighbour at all and the radius is inert.
    armE();
    const rows = getEntityTranscriptNeighbourhoods(agent.id, {
      search: ['larkspur', 'rollback', 'codeword'],
      neighbourRadius: RECALL_NEIGHBOUR_RADIUS,
    });
    expect(rows.filter((r) => r.role === 'user')).toHaveLength(2);
  });

  it('bounds `limit` on matches, letting neighbours ride along', () => {
    for (let i = 0; i < 10; i++) {
      ask(oneOnOne.id, `context before ${i}`, t(i * 3));
      say(oneOnOne.id, agent.id, `ledger entry ${i}`, t(i * 3 + 1));
      ask(oneOnOne.id, `context after ${i}`, t(i * 3 + 2));
    }
    const rows = getEntityTranscriptNeighbourhoods(agent.id, {
      search: ['ledger'],
      limit: 3,
      neighbourRadius: 1,
    });
    expect(rows.filter((r) => r.isMatch)).toHaveLength(3);
    expect(rows).toHaveLength(9);
    // Most recent three, not the oldest.
    expect(rows.map((r) => r.content)).toContain('ledger entry 9');
    expect(rows.map((r) => r.content)).not.toContain('ledger entry 0');
  });

  it('merges overlapping neighbourhoods instead of repeating the shared turns', () => {
    say(oneOnOne.id, agent.id, 'tender marker one', t(1));
    ask(oneOnOne.id, 'a turn between them', t(2));
    say(oneOnOne.id, agent.id, 'tender marker two', t(3));

    const rows = getEntityTranscriptNeighbourhoods(agent.id, {
      search: ['tender'],
      neighbourRadius: RECALL_NEIGHBOUR_RADIUS,
    });
    expect(rows).toHaveLength(3);
    expect(new Set(rows.map((r) => r.id)).size).toBe(3);
  });
});

// ── 2. Arm E, end to end ─────────────────────────────────────

describe('Round 51 — the arm-E regression', () => {
  it('recovers a restriction stated in the turn after the fact', () => {
    armE();

    // The failing direction, in the same test: the flat search Round 50 shipped
    // returns the fact and nothing around it. Without this assertion, the one
    // below proves only that the fixture contains the string.
    const flat = getEntityTranscript(agent.id, {
      search: ['larkspur', 'rollback', 'codeword'],
      excludeChannelId: klatch.id,
    });
    expect(flat).toHaveLength(1);
    expect(flat[0].content).not.toContain('do not repeat');

    const recall = recallFromOtherConversations(agent, klatch, {
      query: 'Larkspur rollback codeword',
    });
    expect(recall.text).toContain('ochre-marlin-44');
    expect(recall.text).toContain('do not repeat it elsewhere');
    // The count is still about matches, not about rows shown.
    expect(recall.matchCount).toBe(1);
    expect(recall.shownCount).toBe(1);
  });

  it('marks which line matched and leaves the neighbours unmarked', () => {
    armE();
    const lines = recallFromOtherConversations(agent, klatch, {
      query: 'Larkspur rollback codeword',
    }).text.split('\n\n');

    const marked = lines.filter((l) => l.startsWith('▸ '));
    expect(marked).toHaveLength(1);
    expect(marked[0]).toContain('ochre-marlin-44');
    expect(lines.some((l) => !l.startsWith('▸ ') && l.includes('do not repeat'))).toBe(true);
  });

  it('says what it did not read — the sentence, in its specific form', () => {
    armE();
    const text = recallFromOtherConversations(agent, klatch, {
      query: 'Larkspur rollback codeword',
    }).text;
    expect(text).toContain('Nothing outside these excerpts was read.');
    expect(text).toMatch(/condition attached to a fact is often in the next message/);
  });

  it('keeps an excerpt whole when two conversations are interleaved in time', () => {
    // Rows arrive in one global chronological order, so two rooms active the
    // same morning alternate in the list. Walking that list linearly breaks
    // every excerpt at the alternation — the neighbours are all still returned,
    // but they render as isolated fragments divided by ---, which tells the
    // agent the turns are unrelated when they are consecutive.
    ask(oneOnOne.id, 'before the tally', t(1));
    say(secondRoom.id, agent.id, 'ops chatter one', t(2));
    say(oneOnOne.id, agent.id, 'the tally reference is copper-swift', t(3));
    say(secondRoom.id, agent.id, 'ops chatter two', t(4));
    ask(oneOnOne.id, 'after the tally', t(5));

    const text = recallFromOtherConversations(agent, klatch, { query: 'tally reference' }).text;
    const body = text.split('\n\n').slice(1).join('\n\n');
    expect(body.split('---')).toHaveLength(1);
    expect(text).toContain('before the tally');
    expect(text).toContain('after the tally');
    expect(text).not.toContain('ops chatter');
  });

  it('does not render two distant matches as one continuous exchange', () => {
    say(oneOnOne.id, agent.id, 'the depot cipher is umber-finch', t(1));
    for (let i = 0; i < 8; i++) ask(oneOnOne.id, `unrelated chatter ${i}`, t(10 + i));
    say(oneOnOne.id, agent.id, 'the depot rota changed again', t(30));

    const text = recallFromOtherConversations(agent, klatch, { query: 'depot' }).text;
    expect(text).toContain('umber-finch');
    expect(text).toContain('rota changed');
    expect(text).toContain('---');
    // The eight turns between them were not read and must not appear as though
    // they were.
    expect(text).not.toContain('unrelated chatter 4');
  });
});

// ── 3. The budget ────────────────────────────────────────────

describe('Round 51 — the excerpt is the budget unit', () => {
  it('drops an excerpt whole rather than truncating one', () => {
    // Two excerpts, each far larger than half the 12,000-char budget, so only
    // the newer one can fit. The failure this pins is a *partial* excerpt: the
    // neighbour that carries a condition being the line dropped at the boundary
    // is arm E again, one layer down.
    const bulk = 'z'.repeat(3_500);
    say(oneOnOne.id, agent.id, `older neighbour ${bulk}`, t(1));
    say(oneOnOne.id, agent.id, `manifest older ${bulk}`, t(2));
    say(oneOnOne.id, agent.id, `older trailing ${bulk}`, t(3));
    for (let i = 0; i < 6; i++) ask(oneOnOne.id, `gap ${i}`, t(10 + i));
    say(oneOnOne.id, agent.id, `newer neighbour ${bulk}`, t(30));
    say(oneOnOne.id, agent.id, `manifest newer ${bulk}`, t(31));
    say(oneOnOne.id, agent.id, `newer trailing ${bulk}`, t(32));

    const recall = recallFromOtherConversations(agent, klatch, { query: 'manifest' });
    expect(recall.matchCount).toBe(2);
    expect(recall.shownCount).toBe(1);
    expect(recall.text).toContain('manifest newer');
    // Whole excerpt or nothing: both neighbours of the kept match are present,
    // and no part of the dropped one is.
    expect(recall.text).toContain('newer neighbour');
    expect(recall.text).toContain('newer trailing');
    expect(recall.text).not.toContain('manifest older');
    expect(recall.text).toContain('1 older match(es) are not shown');
  });

  it('degrades to the bare match rather than overrunning the budget', () => {
    // One excerpt, too large for the budget even alone. The pre-Round-51 shape
    // — match with no context — is the right failure here, and it is announced
    // rather than silent.
    // Each message is over the per-message cap, so three of them — the match
    // plus its radius — cannot fit the 12,000-char result budget together.
    const bulk = 'z'.repeat(4_500);
    for (let i = 0; i < 5; i++) {
      say(oneOnOne.id, agent.id, `turnstile ${i} ${bulk}`, t(i + 1));
    }
    const recall = recallFromOtherConversations(agent, klatch, { query: 'turnstile', limit: 1 });
    expect(recall.text.length).toBeLessThanOrEqual(12_000 + 2_000);
    expect(recall.shownCount).toBe(1);
    expect(recall.text).toContain('shown alone');
  });
});

// ── 4. What the model is told ────────────────────────────────

describe('Round 51 — the tool description', () => {
  it('tells the model the neighbours are there and why', () => {
    expect(RECALL_TOOL_DESCRIPTION).toMatch(/immediately before and after/);
    expect(RECALL_TOOL_DESCRIPTION).toMatch(/next message rather than the same one/);
  });

  it('tells the model not to search for what it is already holding', () => {
    // Arm C: 2/2 runs called recall with the answer in their own carried-context
    // block, one querying the literal token it had just read off its prompt.
    expect(RECALL_TOOL_DESCRIPTION).toMatch(/already in front of you/);
    expect(RECALL_TOOL_DESCRIPTION).toMatch(/summary of your other conversations/);
  });
});

// ── 5. The round separator ───────────────────────────────────

describe('Round 51 — text either side of a tool call', () => {
  /** Drive one panel turn, capturing every `text_delta` the stream emitted. */
  async function driveTurn(channel: Channel): Promise<{ stored: string; streamed: string }> {
    const messageId = pendingTurn(channel.id, agent.id);
    const deltas: string[] = [];
    const realSet = activeStreams.set.bind(activeStreams);
    const spy = vi.spyOn(activeStreams, 'set').mockImplementation((id: string, emitter: any) => {
      emitter.on('data', (e: any) => {
        if (e.type === 'text_delta') deltas.push(e.content);
      });
      return realSet(id, emitter);
    });
    try {
      await streamClaude(channel.id, messageId, agent);
    } finally {
      spy.mockRestore();
    }
    const stored = getMessages(channel.id).find((m) => m.id === messageId)!.content;
    return { stored, streamed: deltas.join('') };
  }

  beforeEach(() => {
    // Recall is only offered where layer 6 is assembled, so the agent needs
    // something to carry — this is the measured configuration, not a synthetic
    // tool call.
    say(oneOnOne.id, agent.id, 'the depot cipher is ochre-marlin-44', t(1));
  });

  it('separates pre-tool narration from the answer', async () => {
    h.rounds.push(
      { text: "I'll check my other threads.", tool: { name: RECALL_TOOL_NAME, input: { query: 'depot cipher' } } },
      { text: '`ochre-marlin-44`' },
    );

    const { stored } = await driveTurn(klatch);
    // The measured defect, verbatim: 8 of 13 replies ran these together.
    expect(stored).not.toContain("threads.`ochre");
    expect(stored).toBe("I'll check my other threads.\n\n`ochre-marlin-44`");
  });

  it('carries the separator on the stream, not only into the row', async () => {
    // The client accumulates deltas optimistically and refetches only on channel
    // mount. A separator present in the DB and absent from the stream is a
    // message that reads one way live and another after reload.
    h.rounds.push(
      { text: 'Looking that up.', tool: { name: RECALL_TOOL_NAME, input: { query: 'depot cipher' } } },
      { text: 'Found it.' },
    );

    const { stored, streamed } = await driveTurn(klatch);
    expect(streamed).toBe(stored);
    expect(streamed).toContain('\n\n');
  });

  it('leaves no trailing blank when the round after the tool says nothing', async () => {
    h.rounds.push(
      { text: 'Checking.', tool: { name: RECALL_TOOL_NAME, input: { query: 'depot cipher' } } },
      {},
    );

    const { stored } = await driveTurn(klatch);
    expect(stored).toBe('Checking.');
  });

  it('does not stack newlines on a round that already ended with one', async () => {
    h.rounds.push(
      { text: 'Checking.\n', tool: { name: RECALL_TOOL_NAME, input: { query: 'depot cipher' } } },
      { text: 'Done.' },
    );

    const { stored } = await driveTurn(klatch);
    expect(stored).toBe('Checking.\n\nDone.');
  });

  it('leaves a single-round turn untouched', async () => {
    h.rounds.push({ text: 'No tool needed here.' });

    const { stored, streamed } = await driveTurn(klatch);
    expect(stored).toBe('No tool needed here.');
    expect(streamed).toBe('No tool needed here.');
  });
});
