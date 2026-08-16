/**
 * Round 58 — the gap markers' invariant substrings are named, and the names are
 * what actually renders.
 *
 * Theseus's ask, in his shape rather than mine
 * (`docs/mail/theseus-to-daedalus-cc-iris-xian-team-jprime-ran-depth-was-never-the-variable-and-the-false-absence-is-back-2026-08-16.md`
 * §4): export the invariant substrings as named constants, and specifically
 * **not** `edgeGapLine` itself. A probe that can call the renderer agrees with
 * the build by construction, so its pattern can never break loudly — the exact
 * failure the probe exists to catch, one level in.
 *
 * **The failure being closed.** `scripts/probe-recall-tool.mjs:1059` carries
 * `REACHABLE_R54`, a regex for the reachable clause as Round 54 worded it. Round
 * 56 replaced that wording. The regex did not report a mismatch — it reported
 * **zero matches**, and zero is a legal value for that field. A stale recogniser
 * is indistinguishable from a true absence, which is the same "zero is two
 * different answers" defect this whole thread has been circling.
 *
 * **What this file is for, and why it is not the same instrument as the probe.**
 * Importing `RECALL_MARKER_PHRASES` makes a recogniser track the current wording
 * by construction — it can never silently read zero for a marker that is in fact
 * rendered. What it gives up is the ability to notice that the wording *changed*:
 * it follows the change. So that detection moves here, where it belongs. Every
 * phrase below is written out **longhand**, deliberately duplicating the source,
 * so a reworded marker fails in CI rather than being inferred hours later from a
 * behavioural run. Detecting drift and measuring behaviour under whatever wording
 * ships are two jobs and they want two instruments.
 *
 * That is why the literals here are *not* factored out into a helper. The
 * duplication is the mechanism.
 *
 * What these tests are trying to catch, in the order the code can get it wrong:
 *
 * 1. **A phrase changing without anyone deciding to change it.** §1, longhand.
 * 2. **A renderer going back to a literal of its own.** §2 and §3 assemble the
 *    expected line from the record and compare it to the real render, so a
 *    hardcoded string that differs from the record fails even though the record
 *    still holds the old value.
 * 3. **Which reachable clause this build actually ships.** §4 asserts the
 *    address form renders and the Round 54 form does not — so "zero occurrences
 *    of the address clause" has a test that says which answer that is.
 * 4. **A header sentence quoting a phrase nothing renders.** §5. `gapSentences`
 *    used to quote `"not of your transcript"` and `"earlier" or "later"` as its
 *    own literals; rewording the marker and not the sentence would have left the
 *    explanation pointing at a line that no longer exists.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import './setup.js';
import { createChannel, createEntity } from '../db/queries.js';
import { getDb } from '../db/index.js';
import {
  recallFromOtherConversations,
  RECALL_MARKER_PHRASES,
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

const t = (n: number) => `2026-08-16T09:${String(n).padStart(2, '0')}:00.000Z`;

const P = RECALL_MARKER_PHRASES;

let agent: Entity;
let colleague: Entity;
let oneOnOne: Channel;
let klatch: Channel;

beforeEach(() => {
  agent = createEntity('Vesper', DEFAULT_MODEL, 'You are Vesper.', '#6366f1');
  colleague = createEntity('Corvus', DEFAULT_MODEL, 'You are Corvus.', '#f59e0b');
  oneOnOne = createChannel('vesper-1-1', '', DEFAULT_MODEL, undefined, 'chat', [agent.id]);
  klatch = createChannel('weekly-review', '', DEFAULT_MODEL, undefined, 'klatch', [
    agent.id,
    colleague.id,
  ]);
});

/** Return the excerpt bodies — everything after the header paragraph. */
function body(text: string): string[] {
  return text.split('\n\n').slice(1);
}

/** Every rendered line of every excerpt, header excluded. */
function bodyLines(text: string): string[] {
  return body(text).flatMap((b) => b.split('\n'));
}

/**
 * A klatch that fires all three markers at once. Raw rows and scoped ordinals:
 *
 *   r1  o1  user     "kickoff one"                        ← leading, reachable
 *   r2  --  Corvus   "corvus preamble"                    ← leading, unreachable
 *   r3  o2  user     "kickoff two"
 *   r4  o3  Vesper   "acknowledged"
 *   r5  o4  Vesper   "the ledger token is jade-vireo"     ← the match
 *   r6  --  Corvus   "corvus middle"                      ← interior scope gap
 *   r7  o5  Vesper   "noted"
 *   r8  o6  Vesper   "closing"
 *   r9  --  Corvus   "corvus tail"                        ← trailing, unreachable
 *   r10 o7  user     "one more thing"                     ← trailing, reachable
 *
 * Radius 2 around o4 gives o2–o6 = r3, r4, r5, r7, r8: contiguous in the scoped
 * numbering and *not* in the raw one, which is what makes r6 an interior gap
 * rather than an edge.
 */
function everyMarkerRoom() {
  ask(klatch.id, 'kickoff one', t(1));
  say(klatch.id, colleague.id, 'corvus preamble', t(2));
  ask(klatch.id, 'kickoff two', t(3));
  say(klatch.id, agent.id, 'acknowledged', t(4));
  say(klatch.id, agent.id, 'the ledger token is jade-vireo', t(5));
  say(klatch.id, colleague.id, 'corvus middle', t(6));
  say(klatch.id, agent.id, 'noted', t(7));
  say(klatch.id, agent.id, 'closing', t(8));
  say(klatch.id, colleague.id, 'corvus tail', t(9));
  ask(klatch.id, 'one more thing', t(10));
}

function render(): string {
  return recallFromOtherConversations(agent, oneOnOne, { query: 'ledger token' }).text;
}

// ── 1. The longhand pin ──────────────────────────────────────

describe('Round 58 — every phrase is pinned longhand', () => {
  // Deliberately duplicated from `recall.ts`. This is the one place in the tree
  // where writing the string out twice is the point: a recogniser that imports
  // the record follows a rewording silently, so the rewording has to fail here.
  it('pins the shared delimiters', () => {
    expect(P.open).toBe('[… ');
    expect(P.close).toBe(' …]');
  });

  it('pins the interior marker', () => {
    expect(P.interiorPrefix).toBe(' message(s) here are part of that conversation but ');
    expect(P.interiorPhrase).toBe('not of your transcript');
    expect(P.interiorSuffix).toBe(', and were not read');
  });

  it('pins the edge marker', () => {
    expect(P.edgeSides).toEqual(['earlier', 'later']);
    expect(P.edgeMiddle).toBe(' message(s) in this conversation, not shown here: ');
    expect(P.edgeClauseJoin).toBe('; ');
    expect(P.edgeUnreachable).toBe(' that no search of yours can reach');
  });

  it('pins both forms of the reachable clause', () => {
    expect(P.edgeReachableWithAddress).toBe(' you can read — ask for them with expand ');
    expect(P.edgeAddressOpen).toBe('{conversation: "');
    expect(P.edgeAddressFrom).toBe('", from: ');
    expect(P.edgeAddressTo).toBe(', to: ');
    expect(P.edgeAddressClose).toBe('}');
    expect(P.edgeReachableNoAddress).toBe(' that a different search of yours could reach');
  });

  it('pins the header stem', () => {
    expect(P.edgeHeaderStem).toBe('is the edge of an excerpt');
  });

  it('is frozen, so a caller cannot edit the build out from under a recogniser', () => {
    expect(Object.isFrozen(P)).toBe(true);
    expect(Object.isFrozen(P.edgeSides)).toBe(true);
  });
});

// ── 2. The record is the render, not a description of it ─────

describe('Round 58 — the markers are assembled from the record and nothing else', () => {
  it('renders the interior marker exactly as the record composes it', () => {
    everyMarkerRoom();
    const lines = bodyLines(render());
    const interior = lines.filter((l) => l.includes(P.interiorPhrase));

    expect(interior).toEqual([
      `${P.open}1${P.interiorPrefix}${P.interiorPhrase}${P.interiorSuffix}${P.close}`,
    ]);
    // …and, longhand, the same line. If a renderer reintroduces a literal that
    // differs from the record, the assembled comparison above still passes while
    // this one fails; if the record is reworded, this one fails and that one does
    // not. Both directions are covered only because both are written.
    expect(interior[0]).toBe(
      '[… 1 message(s) here are part of that conversation but not of your transcript, ' +
      'and were not read …]'
    );
  });

  it('renders the edge markers exactly as the record composes them', () => {
    everyMarkerRoom();
    const lines = body(render());
    const address = (from: number, to: number) =>
      `${P.edgeReachableWithAddress}${P.edgeAddressOpen}weekly-review` +
      `${P.edgeAddressFrom}${from}${P.edgeAddressTo}${to}${P.edgeAddressClose}`;

    expect(lines[0].split('\n')[0]).toBe(
      `${P.open}2 ${P.edgeSides[0]}${P.edgeMiddle}` +
      `1${address(1, 1)}${P.edgeClauseJoin}1${P.edgeUnreachable}${P.close}`
    );
    const last = lines[lines.length - 1].split('\n').pop() as string;
    expect(last).toBe(
      `${P.open}2 ${P.edgeSides[1]}${P.edgeMiddle}` +
      `1${address(7, 7)}${P.edgeClauseJoin}1${P.edgeUnreachable}${P.close}`
    );
  });

  it('keeps the two vocabularies apart — no edge line carries the interior phrase', () => {
    everyMarkerRoom();
    const edges = bodyLines(render()).filter((l) => l.includes(P.edgeMiddle));
    expect(edges.length).toBeGreaterThan(0);
    for (const line of edges) expect(line).not.toContain(P.interiorPhrase);
  });
});

// ── 3. Which reachable clause this build ships ───────────────

describe('Round 58 — zero occurrences has a documented answer', () => {
  it('ships the address form and not the Round 54 form', () => {
    // The point of asserting the *absence* of the old wording: a recogniser that
    // counts `edgeReachableNoAddress` and gets zero on this build is correct, and
    // one that gets zero for `edgeReachableWithAddress` has found a regression.
    // Without this test both zeroes look the same from outside.
    everyMarkerRoom();
    const text = render();
    expect(text).toContain(P.edgeReachableWithAddress);
    expect(text).not.toContain(P.edgeReachableNoAddress);
  });

  it('states no edge marker where the excerpt is the whole conversation', () => {
    // The other legal zero, so the two are distinguished by fixture and not by
    // reading the count. A 1-1 with a single exchange has nothing past its edges.
    ask(klatch.id, 'the ledger token is jade-vireo', t(1));
    say(klatch.id, agent.id, 'noted', t(2));
    const text = render();
    expect(text).toContain('jade-vireo');
    expect(text).not.toContain(P.edgeMiddle);
    expect(text).not.toContain(P.interiorPhrase);
  });
});

// ── 4. The header explains lines that exist ──────────────────

describe('Round 58 — the header quotes only phrases it renders', () => {
  it('quotes the interior phrase, and the body contains a line with it', () => {
    everyMarkerRoom();
    const text = render();
    const header = text.split('\n\n')[0];

    expect(header).toContain(`"${P.interiorPhrase}"`);
    expect(bodyLines(text).some((l) => l.includes(P.interiorPhrase))).toBe(true);
  });

  it('quotes both edge sides and its own stem, and the body renders both', () => {
    everyMarkerRoom();
    const text = render();
    const header = text.split('\n\n')[0];

    expect(header).toContain(P.edgeHeaderStem);
    expect(header).toContain(`"${P.edgeSides[0]}"`);
    expect(header).toContain(`"${P.edgeSides[1]}"`);

    const lines = bodyLines(text);
    for (const side of P.edgeSides) {
      expect(lines.some((l) => l.includes(`${side}${P.edgeMiddle}`))).toBe(true);
    }
  });

  it('withholds each sentence when its marker is not in the body', () => {
    // Round 52's finding 5, restated against the phrases rather than against a
    // hand-copied fragment: an explanation for an absent line trains the agent to
    // look for something that is usually not there.
    ask(klatch.id, 'the ledger token is jade-vireo', t(1));
    say(klatch.id, agent.id, 'noted', t(2));
    const header = render().split('\n\n')[0];

    expect(header).not.toContain(P.interiorPhrase);
    expect(header).not.toContain(P.edgeHeaderStem);
  });
});
