/**
 * The expand surface's two statements about what a *position* is, pinned.
 *
 * **Reported by Theseus, 2026-08-19** (`docs/mail/theseus-to-daedalus-cc-xian-team-
 * both-arms-reproduce-the-guard-fires-and-the-header-mis-describes-its-own-
 * numbering-2026-08-19.md` §5), against my surface. Verified from source here
 * rather than accepted from the memo.
 *
 * `expandConversationRange` says, in two places:
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
 * The wording is **not corrected here**, on purpose. Arm N1 has not run live
 * yet, and it exists to be compared against arm M (Round 62), which ran under
 * this exact text. Rewording the expand header before N1 spends would put the
 * two arms in front of different prose in the one dimension — how an offered
 * range is read — that N1's dependent variable sits next to. So the sequence is:
 * N1 runs, then the wording changes, and the change gets a round number rather
 * than arriving inside someone else's measurement.
 *
 * That makes §2 below a **change-detector on a known defect**, not an
 * endorsement. If it fails because the text was fixed, that is the fix landing —
 * update the literals and delete this paragraph. If it fails for any other
 * reason, the wording moved without anyone deciding to move it, which is the
 * thing Round 58 exists to catch and this surface was missing.
 *
 * §1 is the durable half and stays after the wording is fixed: it asserts the
 * *scope of the numbering* from the render, so a future change to
 * `entityTranscriptWhere` that quietly narrowed positions back to authored rows
 * would fail here even if every string still matched.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import './setup.js';
import { createChannel, createEntity } from '../db/queries.js';
import { getDb } from '../db/index.js';
import { expandConversationRange } from '../claude/recall.js';
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

describe('the expand surface\'s statements about its own numbering', () => {
  it('renders the header sentence as this build words it', () => {
    twelveRows();

    const result = expandConversationRange(agent, here, {
      conversation: 'vesper-1-1', from: 1, to: 12,
    });

    // Longhand, duplicating the source deliberately — the Round 58 mechanism.
    // KNOWN DEFECT: "your own turns" describes half of what §1 just proved is
    // numbered. Held, not fixed, until arm N1 has run live. See the docblock.
    expect(result.text).toContain(
      'Positions 1–12 of "vesper-1-1", your own turns in that conversation, in order.'
    );
    expect(result.text).toContain('Nothing outside this range was read.');
  });

  it('renders the empty-range sentence as this build words it', () => {
    twelveRows();

    const result = expandConversationRange(agent, here, {
      conversation: 'vesper-1-1', from: 40, to: 45,
    });

    expect(result.matchCount).toBe(0);
    expect(result.isError).toBe(false);
    // KNOWN DEFECT, and worse here than in the header: this branch is teaching
    // the numbering at the moment the agent has just got it wrong. Theseus's §5
    // singles it out for that reason.
    expect(result.text).toContain(
      'Positions count only your own turns in that conversation, so a number past its end returns nothing'
    );
  });
});
