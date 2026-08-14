/**
 * Round 50 — continuity #3, option (c): on-demand deep retrieval.
 *
 * Layer 6 is the floor and it is deliberately shallow: the 20 most recent
 * messages from an agent's other conversations. Its own footer has always
 * conceded the gap — "there is more than this… say so rather than assuming it
 * did not happen" — which was the honest placeholder for a retrieval path that
 * did not exist. xian approved (b) *with (c) layered on*; this is (c).
 *
 * What these tests are trying to catch, in the order the code can get it wrong:
 *
 * 1. **A search that silently isn't one.** `%` and `_` are SQLite `LIKE`
 *    wildcards and the query string is model-supplied, so an unescaped query
 *    matches things it did not ask for. A wildcard match looks like a hit.
 * 2. **A count that disagrees with its own rows.** The result text tells the
 *    agent how many matches it is *not* seeing. If the count and the rows come
 *    from different predicates, that sentence is worse than silence.
 * 3. **Scope widening.** Recall reads an entity's transcript. If it can reach
 *    another entity's exclusive channel, the tool is a leak with a friendly
 *    description; if it can reach the current room, it duplicates history the
 *    agent already has and burns a tool round doing it.
 * 4. **The offer drifting from the block.** The footer names the tool
 *    unconditionally. That is only honest while "tool offered" and "block
 *    assembled" are the same condition — pinned here in both directions,
 *    including the 1-1 case, where offering it would ship bidirectionality
 *    (open question 2, unanswered) through the side door.
 * 5. **A call that leaves no trace.** (b)'s determinism argument — read the
 *    prompt, know what the agent was given — does not survive material fetched
 *    mid-turn. The `tool_use` artifact is the compensation, and before this
 *    round *no* live tool call wrote one.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import './setup.js';
import {
  createChannel,
  createEntity,
  getEntityTranscript,
  countEntityTranscript,
  getMessageArtifacts,
} from '../db/queries.js';
import { getDb } from '../db/index.js';
import { buildCarriedContextBlock, RECALL_TOOL_NAME } from '../claude/carried-context.js';
import {
  recallFromOtherConversations,
  tokenizeRecallQuery,
  RECALL_MAX_LIMIT,
  RECALL_DEFAULT_LIMIT,
} from '../claude/recall.js';
import { streamClaude, streamClaudeRoundtable } from '../claude/client.js';
import { DEFAULT_MODEL } from '@klatch/shared';
import type { Channel, Entity } from '@klatch/shared';
import { v4 as uuidv4 } from 'uuid';

const h = vi.hoisted(() => ({
  sent: [] as any[],
  /** When set, every turn calls this tool once before finishing. */
  toolUse: null as null | { name: string; input: Record<string, unknown> },
}));

vi.mock('@anthropic-ai/sdk', async () => {
  const actual = await vi.importActual<any>('@anthropic-ai/sdk');
  const fakeStream = (params: any) => {
    h.sent.push(params);
    // A turn that has already run its tool ends; anything else may call one.
    // Keying on the shape of the last message rather than a call counter is
    // what makes this work unchanged for the roundtable, where each seat gets
    // its own turn and seat 2+ opens with a synthetic user string.
    const last = params.messages[params.messages.length - 1];
    const afterTool =
      Array.isArray(last?.content) && last.content[0]?.type === 'tool_result';
    return {
      on: () => {},
      finalMessage: async () => {
        if (h.toolUse && !afterTool) {
          return {
            stop_reason: 'tool_use',
            content: [
              { type: 'tool_use', id: `tu_${h.sent.length}`, name: h.toolUse.name, input: h.toolUse.input },
            ],
          };
        }
        return { stop_reason: 'end_turn', content: [{ type: 'text', text: 'ok' }] };
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

/** An assistant row for a turn about to stream — what POST creates. */
function pendingTurn(channelId: string, entityId: string): string {
  const id = uuidv4();
  getDb()
    .prepare(
      'INSERT INTO messages (id, channel_id, role, content, status, model, entity_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    )
    .run(id, channelId, 'assistant', '', 'streaming', DEFAULT_MODEL, entityId, '2026-08-14T13:00:00.000Z');
  return id;
}

let agent: Entity;
let colleague: Entity;
let oneOnOne: Channel;
let secondRoom: Channel;
let colleagueRoom: Channel;
let klatch: Channel;

beforeEach(() => {
  h.sent.length = 0;
  h.toolUse = null;

  agent = createEntity('Vesper', DEFAULT_MODEL, 'You are Vesper.', '#6366f1');
  colleague = createEntity('Corvus', DEFAULT_MODEL, 'You are Corvus.', '#f59e0b');

  oneOnOne = createChannel('vesper-1-1', '', DEFAULT_MODEL, undefined, 'chat', [agent.id]);
  secondRoom = createChannel('vesper-ops', '', DEFAULT_MODEL, undefined, 'chat', [agent.id]);
  colleagueRoom = createChannel('corvus-1-1', '', DEFAULT_MODEL, undefined, 'chat', [colleague.id]);
  klatch = createChannel('weekly-review', '', DEFAULT_MODEL, undefined, 'klatch', [agent.id, colleague.id]);

  say(oneOnOne.id, agent.id, 'the rollback codeword is basalt-heron-72', '2026-08-01T10:00:00.000Z');
  say(secondRoom.id, agent.id, 'the freight elevator is out until the 14th', '2026-08-01T11:00:00.000Z');
  say(colleagueRoom.id, colleague.id, 'the corvus-only ledger passphrase is marlstone', '2026-08-01T12:00:00.000Z');
});

// ── 1. The query layer ───────────────────────────────────────

describe('Round 50 — getEntityTranscript search', () => {
  it('ANDs the tokens: every term must appear in the same message', () => {
    const both = getEntityTranscript(agent.id, { search: ['rollback', 'codeword'] });
    expect(both).toHaveLength(1);
    expect(both[0].content).toContain('basalt-heron-72');

    // Each term alone matches; together they must match only the row with both.
    expect(getEntityTranscript(agent.id, { search: ['rollback'] })).toHaveLength(1);
    expect(getEntityTranscript(agent.id, { search: ['elevator'] })).toHaveLength(1);
    expect(getEntityTranscript(agent.id, { search: ['rollback', 'elevator'] })).toHaveLength(0);
  });

  it('matches case-insensitively', () => {
    expect(getEntityTranscript(agent.id, { search: ['BASALT'] })).toHaveLength(1);
  });

  it('treats LIKE wildcards in the query as literal characters', () => {
    // The failing direction: without `ESCAPE`, `_` is "any single character",
    // so this token matches "the" inside every message and the tool reports a
    // hit for a term the transcript does not contain.
    say(oneOnOne.id, agent.id, 'the invoice total was 90_percent of forecast', '2026-08-02T10:00:00.000Z');

    expect(getEntityTranscript(agent.id, { search: ['90_percent'] })).toHaveLength(1);
    expect(getEntityTranscript(agent.id, { search: ['t_e'] })).toHaveLength(0);
    expect(getEntityTranscript(agent.id, { search: ['100%'] })).toHaveLength(0);
  });

  it('applies the search on top of the existing scope, not instead of it', () => {
    expect(
      getEntityTranscript(agent.id, { search: ['rollback'], excludeChannelId: oneOnOne.id })
    ).toHaveLength(0);
    expect(getEntityTranscript(agent.id, { search: ['passphrase'] })).toHaveLength(0);
  });
});

describe('Round 50 — countEntityTranscript', () => {
  it('ignores the limit and answers the same predicate as the rows', () => {
    for (let i = 0; i < 12; i++) {
      say(oneOnOne.id, agent.id, `standup note ${i} about the rollback`, `2026-08-03T10:${String(i).padStart(2, '0')}:00.000Z`);
    }
    const opts = { search: ['rollback'], excludeChannelId: klatch.id };
    expect(countEntityTranscript(agent.id, opts)).toBe(13);
    expect(getEntityTranscript(agent.id, { ...opts, limit: 5 })).toHaveLength(5);
    expect(getEntityTranscript(agent.id, opts)).toHaveLength(13);
  });

  it('counts messages said *to* the entity, matching the union the rows use', () => {
    ask(oneOnOne.id, 'what was the rollback plan again', '2026-08-04T10:00:00.000Z');
    // 1 assistant row + 1 user row in a room the entity is a member of.
    expect(countEntityTranscript(agent.id, { search: ['rollback'] })).toBe(2);
    // Corvus is not in that room, so the same user message is not part of its
    // transcript — membership, not global visibility.
    expect(countEntityTranscript(colleague.id, { search: ['rollback'] })).toBe(0);
  });
});

// ── 2. Tokenizing ────────────────────────────────────────────

describe('Round 50 — tokenizeRecallQuery', () => {
  it('splits a natural-language query down to its distinctive terms', () => {
    // Terms are ANDed, so keeping the function words would require all of
    // them in the matching message — and the message that holds the answer
    // ("the rollback codeword is basalt-heron-72") has none of them.
    expect(tokenizeRecallQuery('what was the rollback codeword')).toEqual([
      'rollback', 'codeword',
    ]);
  });

  it('drops terms too short to filter anything', () => {
    // "of"/"is" appear inside ordinary words, so ANDing them narrows nothing
    // while making the match look more specific than it was.
    expect(tokenizeRecallQuery('summary of it is procurement')).toEqual([
      'summary', 'procurement',
    ]);
  });

  it('de-duplicates repeated terms', () => {
    expect(tokenizeRecallQuery('budget budget budget')).toEqual(['budget']);
  });

  it('keeps hyphenated identifiers whole', () => {
    expect(tokenizeRecallQuery('basalt-heron-72')).toEqual(['basalt-heron-72']);
  });

  it('returns nothing searchable for a query of only short words', () => {
    expect(tokenizeRecallQuery('is it on or up')).toEqual([]);
  });
});

// ── 3. The retrieval itself ──────────────────────────────────

describe('Round 50 — recallFromOtherConversations', () => {
  it('reaches a fact that fell below the recent-N window — the point of (c)', () => {
    // The distinctive fact is the *oldest* message; 24 later ones push it out
    // of layer 6's 20-message window.
    say(oneOnOne.id, agent.id, 'the sublet keyholder is Ottoline Fairweather', '2026-07-01T09:00:00.000Z');
    for (let i = 0; i < 24; i++) {
      say(oneOnOne.id, agent.id, `routine status ${i}`, `2026-07-02T09:${String(i).padStart(2, '0')}:00.000Z`);
    }

    const block = buildCarriedContextBlock(agent, klatch)!;
    expect(block.text).not.toContain('Ottoline');
    expect(block.hasOlderHistory).toBe(true);

    const recall = recallFromOtherConversations(agent, klatch, { query: 'keyholder Ottoline' });
    expect(recall.isError).toBe(false);
    expect(recall.text).toContain('Ottoline Fairweather');
    expect(recall.shownCount).toBe(1);
  });

  it('still finds the fact when the model asks in a sentence anyway', () => {
    // The tool description asks for keywords. Models will sometimes phrase a
    // question regardless, and because terms are ANDed, keeping the function
    // words would return nothing — and "I searched and found nothing" is a
    // worse answer than the one this increment exists to replace.
    const recall = recallFromOtherConversations(agent, klatch, {
      query: 'what was the rollback codeword',
    });
    expect(recall.tokens).toEqual(['rollback', 'codeword']);
    expect(recall.text).toContain('basalt-heron-72');
  });

  it('tells the model the AND narrowed it, so a stray term is recoverable', () => {
    // The stopword list handles function words; it deliberately does not drop
    // content-ish ones like "gave", so this query excludes the message that
    // holds the answer. The result has to say why, or the agent reads a miss
    // as absence — the failure this whole increment exists to avoid.
    const recall = recallFromOtherConversations(agent, klatch, {
      query: 'rollback codeword gave',
    });
    expect(recall.tokens).toEqual(['rollback', 'codeword', 'gave']);
    expect(recall.matchCount).toBe(0);
    expect(recall.text).toContain('All 3 terms had to appear in the same message');

    // And the suggested retry works.
    expect(
      recallFromOtherConversations(agent, klatch, { query: 'rollback codeword' }).text
    ).toContain('basalt-heron-72');
  });

  it('does not offer a narrowing hint when there was only one term to narrow with', () => {
    const recall = recallFromOtherConversations(agent, klatch, { query: 'trebuchet' });
    expect(recall.text).not.toContain('terms had to appear');
    expect(recall.text).toMatch(/not evidence the thing did not happen/);
  });

  it('does not search the room the agent is in', () => {
    say(klatch.id, agent.id, 'the sealed bid number is 41821', '2026-08-05T10:00:00.000Z');
    const recall = recallFromOtherConversations(agent, klatch, { query: 'sealed bid' });
    expect(recall.matchCount).toBe(0);
    expect(recall.text).not.toContain('41821');
  });

  it('cannot reach another entity\'s exclusive conversation', () => {
    const recall = recallFromOtherConversations(agent, klatch, { query: 'ledger passphrase' });
    expect(recall.matchCount).toBe(0);
    expect(recall.text).not.toContain('marlstone');

    // Same query from the entity that owns it does find it — so the miss above
    // is scoping, not a broken search.
    expect(
      recallFromOtherConversations(colleague, klatch, { query: 'ledger passphrase' }).text
    ).toContain('marlstone');
  });

  it('labels each result with the conversation it came from', () => {
    const recall = recallFromOtherConversations(agent, klatch, { query: 'freight elevator' });
    expect(recall.text).toContain('[vesper-ops · 2026-08-01]');
    expect(recall.text).toContain('Vesper:');
  });

  it('says a miss is not evidence of absence', () => {
    const recall = recallFromOtherConversations(agent, klatch, { query: 'quarterly hiring freeze' });
    expect(recall.matchCount).toBe(0);
    expect(recall.isError).toBe(false);
    expect(recall.text).toMatch(/not evidence the thing did not happen/);
  });

  it('rejects a query with no searchable terms and says how to fix it', () => {
    const recall = recallFromOtherConversations(agent, klatch, { query: 'is it up or on' });
    expect(recall.isError).toBe(true);
    expect(recall.text).toMatch(/literal words/);
  });

  it('reports the matches it is *not* showing rather than implying it showed all', () => {
    for (let i = 0; i < 20; i++) {
      say(oneOnOne.id, agent.id, `procurement thread entry ${i}`, `2026-08-06T10:${String(i).padStart(2, '0')}:00.000Z`);
    }
    const recall = recallFromOtherConversations(agent, klatch, { query: 'procurement', limit: 5 });
    expect(recall.matchCount).toBe(20);
    expect(recall.shownCount).toBe(5);
    expect(recall.text).toContain('20 message(s)');
    expect(recall.text).toContain('15 older match(es) are not shown');
    // Most recent, not oldest — the same recency bias layer 6 applies.
    expect(recall.text).toContain('entry 19');
    expect(recall.text).not.toContain('entry 0 ');
  });

  it('clamps a limit the model invents', () => {
    for (let i = 0; i < 40; i++) {
      say(secondRoom.id, agent.id, `inventory line ${i}`, `2026-08-07T10:${String(i).padStart(2, '0')}:00.000Z`);
    }
    expect(recallFromOtherConversations(agent, klatch, { query: 'inventory', limit: 500 }).shownCount)
      .toBe(RECALL_MAX_LIMIT);
    expect(recallFromOtherConversations(agent, klatch, { query: 'inventory', limit: 0 }).shownCount)
      .toBe(1);
    expect(recallFromOtherConversations(agent, klatch, { query: 'inventory' }).shownCount)
      .toBe(RECALL_DEFAULT_LIMIT);
  });

  it('truncates an outsized message instead of letting it evict the rest', () => {
    // The measured case layer 6's per-message cap exists for: the largest real
    // message in the March corpus is 64,627 chars, more than twice that block's
    // whole budget.
    say(oneOnOne.id, agent.id, `warehouse ${'x'.repeat(60_000)}`, '2026-08-08T10:00:00.000Z');
    say(oneOnOne.id, agent.id, 'warehouse lease renews in March', '2026-08-08T11:00:00.000Z');

    const recall = recallFromOtherConversations(agent, klatch, { query: 'warehouse' });
    expect(recall.shownCount).toBe(2);
    expect(recall.text).toContain('lease renews in March');
    expect(recall.text).toContain('(this message truncated for length)');
    expect(recall.text.length).toBeLessThan(12_000 + 2_000);
  });
});

// ── 4. The offer tracks the block ────────────────────────────

function toolNamesFor(sentIndex = 0): string[] {
  return (h.sent[sentIndex].tools || []).map((t: any) => t.name);
}

describe('Round 50 — when the tool is offered', () => {
  it('is offered in a klatch where the agent has history elsewhere', async () => {
    await streamClaude(klatch.id, pendingTurn(klatch.id, agent.id), agent);
    expect(buildCarriedContextBlock(agent, klatch)).toBeDefined();
    expect(toolNamesFor()).toContain(RECALL_TOOL_NAME);
  });

  it('is not offered in a 1-1 — that direction is bidirectionality, still unruled', async () => {
    await streamClaude(oneOnOne.id, pendingTurn(oneOnOne.id, agent.id), agent);
    expect(buildCarriedContextBlock(agent, oneOnOne)).toBeUndefined();
    expect(toolNamesFor()).not.toContain(RECALL_TOOL_NAME);
    expect(toolNamesFor()).toContain('save_file');
  });

  it('is not offered to an agent with nothing elsewhere to recall', async () => {
    const newcomer = createEntity('Thorne', DEFAULT_MODEL, 'You are Thorne.', '#10b981');
    const room = createChannel('intro', '', DEFAULT_MODEL, undefined, 'klatch', [newcomer.id, agent.id]);
    await streamClaude(room.id, pendingTurn(room.id, newcomer.id), newcomer);
    expect(buildCarriedContextBlock(newcomer, room)).toBeUndefined();
    expect(toolNamesFor()).not.toContain(RECALL_TOOL_NAME);
  });

  it('names the tool in the block footer, by the same constant the tool is registered under', async () => {
    await streamClaude(klatch.id, pendingTurn(klatch.id, agent.id), agent);
    const block = buildCarriedContextBlock(agent, klatch)!;
    expect(block.text).toContain(`\`${RECALL_TOOL_NAME}\``);
    expect(h.sent[0].system).toContain(RECALL_TOOL_NAME);
    // The invariant the footer's honesty rests on, asserted rather than assumed.
    expect(toolNamesFor()).toContain(RECALL_TOOL_NAME);
  });
});

// ── 5. Executing it through a real turn ──────────────────────

/** The tool_result text the server fed back for the Nth request. */
function toolResultIn(sentIndex: number): string {
  const last = h.sent[sentIndex].messages[h.sent[sentIndex].messages.length - 1];
  return last.content[0].content;
}

describe('Round 50 — the tool through the stream loop', () => {
  it('runs the search and feeds the result back into the same turn', async () => {
    say(oneOnOne.id, agent.id, 'the loading dock code is 5591', '2026-07-01T09:00:00.000Z');
    for (let i = 0; i < 24; i++) {
      say(oneOnOne.id, agent.id, `routine status ${i}`, `2026-07-02T09:${String(i).padStart(2, '0')}:00.000Z`);
    }
    h.toolUse = { name: RECALL_TOOL_NAME, input: { query: 'loading dock code' } };

    await streamClaude(klatch.id, pendingTurn(klatch.id, agent.id), agent);

    expect(h.sent).toHaveLength(2);
    expect(toolResultIn(1)).toContain('5591');
    // And it is genuinely retrieval, not the seed re-read: the seed does not
    // contain it.
    expect(h.sent[0].system).not.toContain('5591');
  });

  it('persists a tool_use artifact carrying the query, so the call survives the stream', async () => {
    h.toolUse = { name: RECALL_TOOL_NAME, input: { query: 'freight elevator' } };
    const messageId = pendingTurn(klatch.id, agent.id);

    await streamClaude(klatch.id, messageId, agent);

    const artifacts = getMessageArtifacts(messageId);
    const toolUse = artifacts.filter((a) => a.type === 'tool_use');
    expect(toolUse).toHaveLength(1);
    expect(toolUse[0].toolName).toBe(RECALL_TOOL_NAME);
    expect(toolUse[0].inputSummary).toContain('freight elevator');
    // The carried-context chip is still there and still separate — the recall
    // record does not displace it.
    expect(artifacts.some((a) => a.type === 'carried_context')).toBe(true);
  });

  it('scopes recall per seat in a roundtable', async () => {
    say(colleagueRoom.id, colleague.id, 'the vault rota changes on Thursdays', '2026-08-09T10:00:00.000Z');
    say(secondRoom.id, agent.id, 'the vault rota is not my department', '2026-08-09T11:00:00.000Z');
    h.toolUse = { name: RECALL_TOOL_NAME, input: { query: 'vault rota' } };

    await streamClaudeRoundtable(klatch.id, [
      { assistantMessageId: pendingTurn(klatch.id, agent.id), entity: agent },
      { assistantMessageId: pendingTurn(klatch.id, colleague.id), entity: colleague },
    ]);

    // Four requests: each seat streams once, calls the tool, streams again.
    expect(h.sent).toHaveLength(4);
    expect(toolResultIn(1)).toContain('not my department');
    expect(toolResultIn(1)).not.toContain('Thursdays');
    expect(toolResultIn(3)).toContain('Thursdays');
    expect(toolResultIn(3)).not.toContain('not my department');
  });

  it('answers rather than throwing when a model names the tool where it was not offered', async () => {
    // Not reachable through the offered tool list — this pins the branch that
    // keeps a hallucinated tool name from turning into a 500 mid-turn.
    h.toolUse = { name: RECALL_TOOL_NAME, input: { query: 'anything at all' } };
    await streamClaude(oneOnOne.id, pendingTurn(oneOnOne.id, agent.id), agent);
    expect(toolResultIn(1)).toContain('not available in this conversation');
  });
});
