/**
 * Round 200 — the four defects the first real corpus found in `guessEntityName`.
 *
 * Nine rounds went into what the backfill CLI says when the database is damaged.
 * Theseus's Round 199 was the first run against a database that is *fine* —
 * xian's March corpus, 139 channels — and the tool proposed seven bindings whose
 * names were wrong seven times out of seven: `Succeeding`, `Oriented`, `Taking`,
 * `You`. Three verb fragments and a pronoun, on `identity-claim`, the basis the
 * module calls its strongest signal and the only one applied by default.
 *
 * **Every opener quoted below is real** — verbatim from that corpus, with the
 * channel it came from named. Synthetic strings are marked as such where they
 * appear, and only guard cases nobody's corpus happened to contain.
 *
 * The load-bearing fact behind all of it, from Round 199 §4: `entity-guess.ts`
 * justified its aggressiveness with "the confirm step catches whatever slips
 * through", and **the backfill CLI has no confirm step**. `--apply` applies. A
 * component's safety argument had travelled to a caller that does not satisfy
 * its precondition, so the filtering in this module is the only filtering there
 * is on that path. These tests are that filtering.
 */

import { describe, it, expect } from 'vitest';
import './setup.js';
import { getDb } from '../db/index.js';
import { guessEntityName, IDENTITY_WINDOW_CHARS } from '../import/entity-guess.js';
import { planEntityBackfill } from '../db/entity-backfill.js';
import { DEFAULT_ENTITY_ID } from '@klatch/shared';

describe('D1 — continuation verbs are not names', () => {
  /**
   * The patterns are tuned for how a session opens when it is **new**. The
   * backfill corpus is made of sessions that opened when they were **resumed**,
   * and a resumed session says what it is *doing* before it says who it *is*.
   * That mismatch is the whole of D1: five of the seven bad names.
   */
  it.each([
    // channel 1e2ced26, "1/16-3/13: CXO (o) - MUX, MVP, models" — proposed "Succeeding"
    ['You are succeeding these predecessor chats:', 'Succeeding'],
    // channel e52e8fa8, "1/8,12: CXO (o) - UX vision continuity" — proposed "Succeeding"
    ['You are succeeding the chat which originate the role', 'Succeeding'],
    // channel 39bdeda2, "3/12: CIO: (o4.6) - Klatch branch test" — proposed "Taking"
    ['You are taking over from your predecessor chat that ran into a limit.', 'Taking'],
    // channel a64c9d45, "Exploratory testing agent role setup" — proposed "Taking"
    ['You are taking on a new role on this project, exploratory testing.', 'Taking'],
  ])('%j no longer proposes %j', (opener) => {
    expect(guessEntityName(opener).basis).toBe('none');
  });

  it('covers the continuation verbs this corpus did not happen to contain', () => {
    // Synthetic — Round 199 checked six verbs against the old list and 0 of 6
    // were filtered. These are the other four.
    for (const verb of ['continuing', 'resuming', 'replacing', 'picking']) {
      expect(guessEntityName(`You are ${verb} from your predecessor`).basis).toBe('none');
    }
  });

  it('rejects an unlisted -ing verb by its preposition, not by a list', () => {
    // Synthetic. The named-verb list covers what this corpus contains; this is
    // the general net behind it, for the ones nobody has written down yet.
    expect(guessEntityName('You are shadowing the outgoing agent').basis).toBe('none');
  });

  it('still names an agent whose name merely ends in -ing', () => {
    // The cost of the net above is a real name ending in -ing *followed by a
    // preposition*. Away from that shape it must not fire.
    expect(guessEntityName('You are Sterling, the architecture agent.').name).toBe('Sterling');
  });
});

describe('D2 — a rejected stopword must narrow the search, not widen it', () => {
  /**
   * The old loop tried each pattern against the *whole* message in turn. So a
   * correct rejection at character 7 sent the next pattern 1,699 characters
   * further down the opener, and whatever it found there was reported as how
   * the session "opens".
   */
  it('does not reach 1,699 characters past a rejected claim for a new one', () => {
    // channel 358c1952, "1/2-14: Comms Chief (o)". Both fragments verbatim; the
    // filler stands in for the 1,699 characters of briefing between them.
    const opener =
      'Hello! You are my tech-savvy communications chief here on the Piper Morgan project. ' +
      'x'.repeat(1699) +
      " Once you're oriented, please review this batch of omnibus logs.";
    expect(guessEntityName(opener).basis).toBe('none');
  });

  it('takes the earliest surviving claim, not the earliest-listed pattern', () => {
    // Synthetic: two real claims in the opening, the *later* one matched by the
    // earlier-listed pattern. Document order decides, so "Ariadne" wins.
    const guess = guessEntityName("You're Ariadne. And you are Daedalus.");
    expect(guess.name).toBe('Ariadne');
  });

  it('still crosses a rejected stopword to a real claim inside the window', () => {
    // Narrowing must not become "give up at the first stopword" — a refusal
    // moves forward, it just cannot move forward out of the opening.
    const guess = guessEntityName('You are the agent for this project. You are Daedalus.');
    expect(guess.name).toBe('Daedalus');
    expect(guess.basis).toBe('identity-claim');
  });

  it('quotes the claim it matched rather than asserting what the session did', () => {
    // The old rationale read "The session opens by naming itself \"Oriented\"."
    // — checkable-sounding and false, which is worse than blank, and worse
    // still because the module's own header argues a confirm step the user
    // cannot evaluate is a rubber stamp.
    const guess = guessEntityName('You are Daedalus, the architecture agent.');
    expect(guess.rationale).toContain('"You are Daedalus"');
  });
});

describe('D2 — the window is measured against the real corpus', () => {
  /**
   * In xian's March corpus every genuine identity claim starts at offset 0–158
   * and every false one at offset ≥511, with nothing in between. The constant
   * sits in that gap. These two tests pin both edges so a future change to the
   * constant has to argue with the measurement.
   */
  it('accepts a claim as far in as the furthest real one (158)', () => {
    const opener = 'x'.repeat(158) + ' You are Daedalus.';
    expect(guessEntityName(opener).name).toBe('Daedalus');
  });

  it('refuses a claim past the window', () => {
    const opener = 'x'.repeat(IDENTITY_WINDOW_CHARS + 1) + ' You are Daedalus.';
    expect(guessEntityName(opener).basis).toBe('none');
  });

  it('leaves room between the two populations', () => {
    expect(IDENTITY_WINDOW_CHARS).toBeGreaterThan(158);
    expect(IDENTITY_WINDOW_CHARS).toBeLessThan(511);
  });
});

describe('D4 — `you` belongs in the stopword list', () => {
  it('does not propose "You" from a typo for "your"', () => {
    // channel e93d3810, "1/17: SecOps (o) - GCP project suspension investigation"
    const opener = 'You are you Security Operations (Sec Ops) agent and I need to';
    expect(guessEntityName(opener).basis).toBe('none');
  });

  it('has the rest of the pronouns too', () => {
    // Synthetic. `your`, `i`, `it`, `we`, `they`, `he`, `she` were listed and
    // `you` was not; these are the same oversight waiting to happen.
    for (const pronoun of ['me', 'us', 'them', 'him', 'her']) {
      expect(guessEntityName(`You are ${pronoun} on this project`).basis).toBe('none');
    }
  });
});

describe('the corpus openers that were always right to decline', () => {
  it('still declines, for the same reason as before', () => {
    // Real openers that produced no guess before this round and must still
    // produce none — the fixes must not have changed *why* these decline.
    const openers = [
      'You are my chief architect and you help me maintain our architecture.', // 0111a366
      'You are my Executive Assistant and Chief of Staff.', // 8ef10002
      'You are the Head of Sapient Resources (HoSR) for the Piper Morgan project.', // e07e9d56
      'You are my career coach today. Help me apply for this job!', // ef2a2e35
    ];
    for (const opener of openers) expect(guessEntityName(opener).basis).toBe('none');
  });

  it('falls back to the project name rather than to nothing', () => {
    const guess = guessEntityName('You are my chief architect.', 'Piper Morgan');
    expect(guess.basis).toBe('project-name');
    expect(guess.name).toBe('Piper Morgan');
  });
});

describe('D3 — a name two channels would share is named, not left to be noticed', () => {
  /**
   * The naming fixes take the March corpus to zero collisions, but they cannot
   * make the class impossible: a control run this round with the naming fixes
   * *in* and the window bound *out* still merged the Comms Chief channel and the
   * Chief of Staff channel into one `"Oriented"`, 156 message rows. So the plan
   * reports the shape structurally instead of depending on the names being good.
   *
   * Per `PREMISE.md` the entity **is** its conversation, so merging two
   * conversations into one entity is the specific failure the premise is most
   * exposed to.
   */
  function seed(id: string, name: string, opener: string, replies: number) {
    const db = getDb();
    db.prepare(
      'INSERT INTO channels (id, name, type, source, project_id) VALUES (?, ?, ?, ?, ?)'
    ).run(id, name, 'chat', 'claude-ai', null);
    db.prepare('INSERT INTO channel_entities (channel_id, entity_id) VALUES (?, ?)').run(
      id,
      DEFAULT_ENTITY_ID
    );
    const insert = db.prepare(
      'INSERT INTO messages (id, channel_id, role, content, entity_id, created_at) VALUES (?, ?, ?, ?, ?, ?)'
    );
    insert.run(`${id}-u0`, id, 'user', opener, null, '2026-03-01T00:00:00.000Z');
    for (let i = 0; i < replies; i++) {
      insert.run(`${id}-a${i}`, id, 'assistant', 'reply', DEFAULT_ENTITY_ID, '2026-03-02T00:00:00.000Z');
    }
  }

  it('reports two channels collapsing onto one new agent, with the cost', () => {
    seed('c-comms', 'Comms Chief', 'You are Scribe, the comms chief.', 34);
    seed('c-staff', 'Chief of Staff', 'You are Scribe, the chief of staff.', 122);

    const plan = planEntityBackfill();
    expect(plan.summary.newAgents).toEqual(['Scribe']);

    expect(plan.summary.collisions).toHaveLength(1);
    const [collision] = plan.summary.collisions;
    expect(collision.name).toBe('Scribe');
    expect(collision.action).toBe('minted');
    expect(collision.messages).toBe(156);
    expect(collision.channels.map((c) => c.name).sort()).toEqual([
      'Chief of Staff',
      'Comms Chief',
    ]);
  });

  it('counts a case-different name once, because the binding reuses it once', () => {
    seed('c-one', 'One', 'You are Scribe here.', 1);
    seed('c-two', 'Two', 'you are scribe here.', 1);

    const plan = planEntityBackfill();
    expect(plan.summary.newAgents).toEqual(['Scribe']);
    expect(plan.summary.collisions).toHaveLength(1);
    expect(plan.summary.collisions[0].channels).toHaveLength(2);
  });

  it('says nothing when each channel gets its own agent', () => {
    // The rule working as intended must stay silent, or the warning is noise.
    seed('c-a', 'A', 'You are Daedalus here.', 3);
    seed('c-b', 'B', 'You are Ariadne here.', 3);

    const plan = planEntityBackfill();
    expect(plan.summary.newAgents.sort()).toEqual(['Ariadne', 'Daedalus']);
    expect(plan.summary.collisions).toEqual([]);
  });

  it('says nothing about channels that are only skipped together', () => {
    // 72 channels sharing the reason `no-guess` are not a collision.
    seed('c-x', 'X', 'You are taking over from your predecessor.', 5);
    seed('c-y', 'Y', 'You are succeeding these predecessor chats.', 5);

    const plan = planEntityBackfill();
    expect(plan.summary.apply).toBe(0);
    expect(plan.summary.collisions).toEqual([]);
  });
});
