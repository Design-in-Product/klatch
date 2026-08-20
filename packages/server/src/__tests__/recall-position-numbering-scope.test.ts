/**
 * The expand surface's two statements about what a *position* is, pinned.
 *
 * **Reported by Theseus, 2026-08-19** (`docs/mail/theseus-to-daedalus-cc-xian-team-
 * both-arms-reproduce-the-guard-fires-and-the-header-mis-describes-its-own-
 * numbering-2026-08-19.md` §5), against my surface. Verified from source here
 * rather than accepted from the memo.
 *
 * `expandConversationRange` said, in two places:
 *
 *   - the header — *"Positions N–M of X, **your own turns** in that
 *     conversation, in order."*
 *   - the empty-range branch — *"Positions count **only your own turns** in that
 *     conversation…"*
 *
 * Positions do not count only the agent's own turns. They are `seq` over
 * `entityTranscriptWhere`'s scope, whose own comment states the rule: *"An
 * entity's transcript is its own utterances PLUS what was said to it."* In a 1-1
 * with the owner, every user turn qualifies through `channel_entities`
 * membership, so both speakers are numbered and the two readings differ by 2×.
 *
 * **Why this file exists at all, and why it pins wording that is wrong.**
 *
 * Nothing pinned these two strings. `RECALL_MARKER_PHRASES` (Round 58) covers
 * the scope-gap and edge markers — deliberately, that was its scope — and a
 * `grep` for "your own" across `__tests__/` returned zero before this file. So
 * the one piece of prose on the recall surface that *teaches the agent how to
 * read the numbers* was the piece with no drift detection on it.
 *
 * **The hold, and its discharge — Round 64, 2026-08-19 (STOP fire).** When this
 * file was written at 13:22 the wording was deliberately left wrong: arm N1 had
 * not run, and it existed to be compared against arm M (Round 62), which ran
 * under this exact text. Rewording before N1 spent would have put the two arms
 * in front of different prose in the one dimension — how an offered range is
 * read — that N1's dependent variable sits next to.
 *
 * N1 ran at 14:47 PT (`docs/research/round63-arm-n1-equal-size-offers-live-
 * 2026-08-19.md`; Theseus's memo §0 discharges the hold in as many words). The
 * fix is landed here as **Round 64**, and the round number is the boundary
 * marker: **arms up to and including N1 ran under pre-64 prose.** Any arm that
 * runs from now on does not, and a later comparison that ignores this line is
 * comparing across a changed instrument.
 *
 * The replacement is *"your turns and the user's"* at all three sites, chosen
 * over the shorter *"your turns and the turns addressed to you"* because it is
 * the only phrasing that is exactly true in a klatch as well as a 1-1. The scope
 * is `m.entity_id = you` OR (`role = 'user'` AND you are a member of that
 * channel) — read from `entityTranscriptWhere`, not from its docblock. So a
 * *third agent's* turn in a shared room is not numbered even when it is
 * unmistakably addressed to you, and "addressed to you" would have promised it.
 * "the user's" also matches the label the agent can see on the page:
 * `formatTranscriptLine` prints exactly two speakers, the entity's name and
 * `user`.
 *
 * §1 is the durable half and was always going to outlive the fix: it asserts the
 * *scope of the numbering* from the render, so a future change to
 * `entityTranscriptWhere` that quietly narrowed positions back to authored rows
 * would fail here even if every string still matched.
 *
 * §3 is new with the fix and covers a **third site**, found by `grep` this fire
 * rather than reported: the zero-token search branch said it matches *"literal
 * words in your own messages"*. Same defect, upstream surface — an agent that
 * believed it would pick keywords out of its own phrasing and avoid the ones it
 * only ever heard. It ships with a behavioural test, so the sentence is pinned
 * to a demonstrated fact rather than to an argument about a SQL clause.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import './setup.js';
import { createChannel, createEntity } from '../db/queries.js';
import { getDb } from '../db/index.js';
import { expandConversationRange, recallFromOtherConversations } from '../claude/recall.js';
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

const t = (n: number) => `2026-08-15T09:${String(n).padStart(2, '0')}:00.000Z`;

let agent: Entity;
let oneOnOne: Channel;
let here: Channel;

/** Six alternating pairs — twelve rows, six of them the agent's own. */
function twelveRows(): void {
  for (let n = 1; n <= 6; n++) {
    ask(oneOnOne.id, `owner turn ${n}`, t(n * 2 - 1));
    say(oneOnOne.id, agent.id, `agent turn ${n}`, t(n * 2));
  }
}

beforeEach(() => {
  agent = createEntity('Vesper', DEFAULT_MODEL, 'You are Vesper.', '#6366f1');
  oneOnOne = createChannel('vesper-1-1', '', DEFAULT_MODEL, undefined, 'chat', [agent.id]);
  // `expand` refuses to reach the room the agent is speaking in, so every call
  // below needs a *different* current channel. Same constraint Theseus hit
  // building `scripts/probe-expand-continuation.mts` (his §4).
  here = createChannel('recall-room', '', DEFAULT_MODEL, undefined, 'chat', [agent.id]);
});

// ── 1. What a position actually counts ──

describe('expand positions number both speakers, not only the agent', () => {
  it('numbers the owner\'s turns alongside the agent\'s', () => {
    twelveRows();

    const result = expandConversationRange(agent, here, {
      conversation: 'vesper-1-1', from: 1, to: 12,
    });

    // Twelve rows are addressable, of which the agent authored six. If positions
    // counted only its own turns, `1–12` would run six past the end and the
    // empty-range branch would answer instead.
    expect(result.matchCount).toBe(12);
    expect(result.shownCount).toBe(12);
    expect(result.text).toContain('Positions 1–12 of "vesper-1-1"');

    // Render-level, not just count-level: the rows the agent did not author are
    // on the page. `formatTranscriptLine` labels them `user:` and the agent's own
    // with its name, so the two are separable in the output the model reads.
    const ownLines = result.text.match(/\] Vesper: /g) ?? [];
    const ownerLines = result.text.match(/\] user: /g) ?? [];
    expect(ownLines).toHaveLength(6);
    expect(ownerLines).toHaveLength(6);
  });

  it('addresses the same rows the header numbers, halfway in', () => {
    twelveRows();

    // A stretch that starts and ends on a turn the agent did not author — under
    // an "own turns only" numbering this window would name entirely different
    // rows, so the contents are the assertion, not the count.
    const result = expandConversationRange(agent, here, {
      conversation: 'vesper-1-1', from: 5, to: 8,
    });

    expect(result.matchCount).toBe(4);
    expect(result.text).toContain('Positions 5–8 of "vesper-1-1"');
    expect(result.text).toContain('owner turn 3');
    expect(result.text).toContain('agent turn 3');
    expect(result.text).toContain('owner turn 4');
    expect(result.text).toContain('agent turn 4');
    expect(result.text).not.toContain('owner turn 5');
    expect(result.text).not.toContain('agent turn 2');
  });

  it('runs past the end only after both speakers are exhausted', () => {
    twelveRows();

    // 13 is past the end of twelve interleaved rows. Under "own turns only" it
    // would be past the end at 7 — so this is the boundary that separates the
    // two readings, and it is where the mis-describing sentence renders.
    const at7 = expandConversationRange(agent, here, {
      conversation: 'vesper-1-1', from: 7, to: 7,
    });
    const at13 = expandConversationRange(agent, here, {
      conversation: 'vesper-1-1', from: 13, to: 13,
    });
    expect(at7.matchCount).toBe(1);
    expect(at13.matchCount).toBe(0);
  });
});

// ── 2. Change-detector on the two sentences (see the file docblock) ──
//
// Round 64 fixed both. These stay, unchanged in purpose: the wording is the one
// piece of prose on this surface that teaches the agent how to read the numbers,
// and until this file existed nothing pinned it in either direction.

describe('the expand surface\'s statements about its own numbering', () => {
  it('renders the header sentence as this build words it', () => {
    twelveRows();

    const result = expandConversationRange(agent, here, {
      conversation: 'vesper-1-1', from: 1, to: 12,
    });

    // Longhand, duplicating the source deliberately — the Round 58 mechanism.
    // Round 64: the sentence now names both speakers §1 proves are numbered.
    expect(result.text).toContain(
      'Positions 1–12 of "vesper-1-1", your turns and the user\'s in that conversation, in order.'
    );
    expect(result.text).toContain('Nothing outside this range was read.');
    // The defect, pinned negatively as well as positively. A revert or a
    // half-applied edit that reinstated "your own turns" would pass the
    // `toContain` above only by accident; this cannot pass either way.
    expect(result.text).not.toContain('your own turns');
  });

  it('renders the empty-range sentence as this build words it', () => {
    twelveRows();

    const result = expandConversationRange(agent, here, {
      conversation: 'vesper-1-1', from: 40, to: 45,
    });

    expect(result.matchCount).toBe(0);
    expect(result.isError).toBe(false);
    // Theseus's §5 singled this branch out over the header, and his ordering was
    // right: it teaches the numbering at the moment the agent has just got it
    // wrong, so a wrong rule here is read at the one point it will be acted on.
    expect(result.text).toContain(
      'Positions count your turns and the user\'s in that conversation, so a number past its end returns nothing'
    );
    expect(result.text).not.toContain('only your own turns');
    // The lead clause moved too, and had to: "nothing *of yours* at positions
    // 40–45" would have contradicted the corrected sentence directly after it.
    expect(result.text).toContain('"vesper-1-1" has nothing at positions 40–45.');
  });
});

// ── 3. The third site: what a *search* matches (Round 64) ──

describe('the search surface describes the same scope it queries', () => {
  it('matches a word only the user ever said', () => {
    // The proof the prose rests on, stated as behaviour. `quokka` appears in one
    // row, authored by the owner, `entity_id` NULL — the exact shape
    // `insertMessage` writes and the exact shape a narrow `m.entity_id = ?`
    // scope would drop.
    ask(oneOnOne.id, 'do you remember the quokka photo', t(1));
    say(oneOnOne.id, agent.id, 'I do, it was a good one', t(2));

    const result = recallFromOtherConversations(agent, here, { query: 'quokka' });

    expect(result.matchCount).toBe(1);
    expect(result.text).toContain('quokka photo');
  });

  it('says so in the branch that tells the agent how to pick keywords', () => {
    const result = recallFromOtherConversations(agent, here, { query: '???' });

    expect(result.isError).toBe(true);
    // Found by grep this fire, not reported: the old sentence said "your own
    // messages", which would steer an agent away from the terms it only heard —
    // and the test above shows those terms are exactly the ones that work.
    expect(result.text).toContain(
      'This tool matches literal words in your turns and in the user\'s'
    );
    expect(result.text).not.toContain('your own messages');
  });
});
