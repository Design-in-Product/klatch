/**
 * Round 202 — the claim's grammar, not its distance; and the basis the corpus
 * actually supports.
 *
 * Theseus's Round 201 made two findings this round is built on, both measured
 * against xian's March corpus and neither of them mine:
 *
 * 1. **The window bounds distance, not falseness.** It excludes this corpus's
 *    six fall-through claims because they sit at offsets 511–1,706. Write the
 *    same sentence early and 5 of 5 mint a name at the strongest confidence the
 *    module has. Every false claim in the corpus is in a **subordinate clause**
 *    ("once you are up to speed", "as far as you are aware") and not one of the
 *    14 real ones is — 7/7 and 14/14, position-independent.
 *
 * 2. **`identity-claim` has no true positive available on this corpus.** All 14
 *    in-window claims are *role* claims; the candidate words are `my`, `the`,
 *    `you`, `taking`, `succeeding`, none capitalized. Round 199 measured the
 *    basis at 0 of 7 precision; this is the other half — a recall ceiling of 0
 *    out of 0. `0 would move` is a basis correctly reporting it does not apply.
 *
 * The `role-title` fixtures below are verbatim corpus openers, and the titles
 * are what a scratch measurement over all 85 openers-with-text extracted before
 * any of this was built: 9 determiner hits inside the window, 9 of 9 a real
 * role, 0 hits outside it.
 */

import { describe, it, expect } from 'vitest';
import './setup.js';
import { getDb } from '../db/index.js';
import {
  guessEntityName,
  GUESS_BASES,
  BASIS_REUSES_BY_NAME,
} from '../import/entity-guess.js';
import { planEntityBackfill, applyEntityBackfill } from '../db/entity-backfill.js';
import { getChannelEntities, getAllEntities } from '../db/queries.js';
import { DEFAULT_ENTITY_ID } from '@klatch/shared';

describe('the subordinate-clause guard — a condition is not an assignment', () => {
  it('refuses the five words the window only caught by distance, written early', () => {
    // Theseus's §2: in the corpus these sit at 511–1,706 and the window excludes
    // them. Here they are at offset ≤ 80, where the window excludes nothing.
    const openers = [
      'Anyhow, once you are up to speed we can start.',
      'A few items still open as far as you are aware.',
      "Shipped 0.8.3. Once you're oriented, take a look.",
      'I made a template. Once you are settled in, use it.',
      'Please review all these and when you are ready, reply.',
    ];
    for (const opener of openers) {
      expect(guessEntityName(opener).basis).toBe('none');
    }
  });

  it('covers the four words that do all of it in the corpus, plus their siblings', () => {
    for (const word of ['once', 'when', 'whenever', 'if', 'unless', 'until', 'while', 'after']) {
      expect(guessEntityName(`Ping me ${word} you are Sterling on this.`).basis).toBe('none');
    }
  });

  it('holds through the second pattern too, so it is not one pattern guarded', () => {
    expect(guessEntityName("Ping me once you're Sterling on this.").basis).toBe('none');
  });

  it('does not refuse a claim whose subordinator belongs to an earlier clause', () => {
    // The rule is anchored to the text abutting the claim. `once` here governs
    // "we are done", not the claim, and the claim is a real one.
    const guess = guessEntityName('Once we are done with setup, you are Daedalus.');
    expect(guess.basis).toBe('identity-claim');
    expect(guess.name).toBe('Daedalus');
  });

  it('leaves "now that", which asserts a present state, out of the set — the cost not paid', () => {
    const guess = guessEntityName('Now that you are Daedalus, read the coordination doc.');
    expect(guess.basis).toBe('identity-claim');
    expect(guess.name).toBe('Daedalus');
  });

  it('guards the role basis by the same rule', () => {
    // The title has to be two words for this to test the guard at all. With
    // "the lead on this" the phrase is one word and the two-word minimum refuses
    // it first — mutation-checked, and the first version of this test passed with
    // the role-loop guard disabled, i.e. it was decoration.
    expect(guessEntityName('Ping me once you are the interim lead on this.').basis).toBe('none');
    expect(guessEntityName('You are the interim lead on this.').name).toBe('interim lead');
  });
});

describe('the typographic apostrophe (Round 201 §6)', () => {
  it('reads a claim written with a curly apostrophe', () => {
    const guess = guessEntityName('You’re Daedalus, the architecture agent.');
    expect(guess.basis).toBe('identity-claim');
    expect(guess.name).toBe('Daedalus');
  });

  it('still reads the ASCII one — the fix widens the pattern, it does not move it', () => {
    expect(guessEntityName("You're Daedalus, the architecture agent.").name).toBe('Daedalus');
  });

  it('reads a role claim through it too', () => {
    const guess = guessEntityName('You’re my chief of staff.');
    expect(guess.basis).toBe('role-title');
    expect(guess.name).toBe('chief of staff');
  });
});

describe('the role-title basis, on the corpus it was measured against', () => {
  // Verbatim openers; the second element is what the pre-build measurement
  // extracted, channel id in the comment.
  const corpus: [string, string][] = [
    ['You are my career coach today. Help me apply for this job!', 'career coach'], // ef2a2e35
    [
      'You are my Chief Innovation Office (CIO) taking over from your predecessor chat that just reached capacity.',
      'Chief Innovation Office (CIO)',
    ], // 74bb02d3
    [
      'Hello! You are my tech-savvy communications chief here on the Piper Morgan project.',
      'tech-savvy communications chief',
    ], // 358c1952
    [
      'It is Friday, January 16 at 8:37 PM, and you are the Head of Sapient Resources (HoSR) for the Piper Morgan project.',
      'Head of Sapient Resources (HoSR)',
    ], // e07e9d56
    [
      'Good morning! You are my Executive Assistant and Chief of Staff.',
      'Executive Assistant and Chief of Staff',
    ], // 8ef10002
    ['Hi there. You are my chief of staff.', 'chief of staff'], // adaf6406
    [
      'You are my chief architect and you help me maintain our architectural principals and domain driven design.',
      'chief architect',
    ], // 0111a366
    [
      'Good morning. You are my Chief of Staff (Executive Assistant) for the Piper Morgan project.',
      'Chief of Staff (Executive Assistant)',
    ], // cff40904
  ];

  it('extracts the job and stops where the sentence stops being the job', () => {
    for (const [opener, title] of corpus) {
      const guess = guessEntityName(opener);
      expect(guess.basis).toBe('role-title');
      expect(guess.name).toBe(title);
    }
  });

  it('keeps "of" inside the title and does not treat it as a boundary', () => {
    // "Chief **of** Staff", "Head **of** Sapient Resources" — the two commonest
    // role shapes in the corpus both fail if `of` ends the phrase.
    expect(guessEntityName('You are the Head of Sapient Resources.').name).toBe(
      'Head of Sapient Resources'
    );
  });

  it('ends the title at "and you", and keeps it through "and <a title>"', () => {
    expect(guessEntityName('You are my chief architect and you help me.').name).toBe(
      'chief architect'
    );
    expect(guessEntityName('You are my Executive Assistant and Chief of Staff.').name).toBe(
      'Executive Assistant and Chief of Staff'
    );
  });

  it('refuses a determiner phrase that is one word — "a genius" is not a job', () => {
    for (const opener of ['You are a genius.', 'You are the best.', 'You are my favourite.']) {
      expect(guessEntityName(opener).basis).toBe('none');
    }
  });

  it('does not fire without a determiner, which is what separates it from arm C', () => {
    // Round 201 arm C: 18 of 20 plainly-not-a-name openers at offset 0 mint at
    // `identity-claim`. None carries a determiner, so none reaches this basis.
    for (const opener of ['You are welcome here.', 'You are back!', 'You are ready to go.']) {
      expect(guessEntityName(opener).basis).not.toBe('role-title');
    }
  });

  it('yields to a name when the session states one — identity-claim is still first', () => {
    const guess = guessEntityName('You are Daedalus, my chief architect on this project.');
    expect(guess.basis).toBe('identity-claim');
    expect(guess.name).toBe('Daedalus');
  });

  it('is preferred over the project name, which names the work and not the agent', () => {
    expect(guessEntityName('You are my chief of staff.', 'Piper Morgan').basis).toBe('role-title');
  });

  it('says in the rationale that this is a role and that it mints', () => {
    const guess = guessEntityName('You are my chief of staff.');
    expect(guess.rationale).toContain('"You are my chief of staff"');
    expect(guess.rationale).toContain('a role, not a name');
    expect(guess.rationale).toMatch(/mints a new entity/);
  });

  it('names the two constructions in the corpus it does not recover', () => {
    // Stated so the 9-of-11 recall claim is checkable rather than asserted.
    expect(
      guessEntityName('You are you Security Operations (Sec Ops) agent and I need to').basis
    ).toBe('none'); // e93d3810 — "you" is a typo for "your" and is not a determiner
    expect(
      guessEntityName(
        'You are taking on a new role on this project, exploratory testing agent or ETA for short.'
      ).basis
    ).toBe('none'); // a64c9d45 — a role, stated through a construction this does not match
  });
});

describe('the basis reaches the binding decision (Round 201 §5)', () => {
  it('has an answer recorded for every basis, so a new one cannot skip the question', () => {
    for (const basis of GUESS_BASES) {
      expect(Object.prototype.hasOwnProperty.call(BASIS_REUSES_BY_NAME, basis)).toBe(true);
    }
    expect(BASIS_REUSES_BY_NAME['role-title']).toBe(false);
    expect(BASIS_REUSES_BY_NAME['identity-claim']).toBe(true);
  });

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
    db.prepare(
      'INSERT INTO messages (id, channel_id, role, content, entity_id, created_at) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(`${id}-a0`, id, 'assistant', 'ok', DEFAULT_ENTITY_ID, '2026-09-01T00:01:00.000Z');
  }

  it('mints rather than reusing when an entity of that name already exists, and says so on the row', () => {
    const db = getDb();
    db.prepare('INSERT INTO entities (id, name, model) VALUES (?, ?, ?)').run(
      'ent-cos',
      'chief of staff',
      'claude-opus-5'
    );
    seed('c-role', 'You are my chief of staff.');

    const plan = planEntityBackfill({ bases: ['role-title'] });
    const row = plan.rows.find((r) => r.channelId === 'c-role')!;
    expect(row.guessBasis).toBe('role-title');
    expect(row.action).toBe('minted');
    expect(row.targetEntityId).toBeUndefined();
    // The near-miss is reported, not hidden: minting is the safe default and it
    // is wrong whenever the two sessions really are one agent continuing.
    expect(row.sameNameEntityId).toBe('ent-cos');
  });

  it('leaves identity-claim reuse exactly as it was', () => {
    const db = getDb();
    db.prepare('INSERT INTO entities (id, name, model) VALUES (?, ?, ?)').run(
      'ent-dae',
      'Daedalus',
      'claude-opus-5'
    );
    seed('c-name', 'You are Daedalus, resume the cycle.');

    const row = planEntityBackfill().rows.find((r) => r.channelId === 'c-name')!;
    expect(row.action).toBe('matched-by-name');
    expect(row.targetEntityId).toBe('ent-dae');
    expect(row.sameNameEntityId).toBeUndefined();
  });

  it('two channels holding the same job become two entities, and the collision is still reported', () => {
    seed('c-cc1', 'Hello! You are my tech-savvy communications chief here on the project.');
    seed('c-cc2', 'Hi! You are my tech-savvy Communications Chief here on the project.');

    const plan = planEntityBackfill({ bases: ['role-title'] });
    for (const id of ['c-cc1', 'c-cc2']) {
      expect(plan.rows.find((r) => r.channelId === id)!.action).toBe('minted');
    }
    // Two minted rows sharing a normalized name is exactly what Round 200's
    // structural guard exists to surface — the split is deliberate here, and the
    // operator still gets told two channels are involved.
    const collision = plan.summary.collisions.find(
      (c) => c.name.toLowerCase() === 'tech-savvy communications chief'
    );
    expect(collision?.channels).toHaveLength(2);
  });
});

describe('the apply pass must reach the same answer as the sheet', () => {
  /**
   * Found while reading the apply path to check the claim above, and it made the
   * plan-level policy advisory only: `applyEntityBackfill` called
   * `resolveImportEntity({ entityName: row.guessName })`, which matches by name
   * unconditionally. So the sheet printed `MINTED → "chief of staff"` with a note
   * saying it does not reuse the existing agent of that name, and the write bound
   * it to exactly that agent. Two role rows sharing a name in one plan collapsed
   * the same way. The row's decision is now carried into the resolve call.
   */
  function seedRole(id: string, opener: string) {
    const db = getDb();
    db.prepare('INSERT INTO channels (id, name, type, source) VALUES (?, ?, ?, ?)').run(
      id,
      id,
      'chat',
      'claude-ai'
    );
    db.prepare('INSERT INTO channel_entities (channel_id, entity_id) VALUES (?, ?)').run(
      id,
      DEFAULT_ENTITY_ID
    );
    db.prepare(
      'INSERT INTO messages (id, channel_id, role, content, entity_id, created_at) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(`${id}-u0`, id, 'user', opener, null, '2026-09-01T00:00:00.000Z');
    db.prepare(
      'INSERT INTO messages (id, channel_id, role, content, entity_id, created_at) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(`${id}-a0`, id, 'assistant', 'ok', DEFAULT_ENTITY_ID, '2026-09-01T00:01:00.000Z');
  }

  it('does not bind a role row to the existing same-named agent the sheet said it would skip', () => {
    const db = getDb();
    db.prepare('INSERT INTO entities (id, name, model) VALUES (?, ?, ?)').run(
      'ent-cos',
      'chief of staff',
      'claude-opus-5'
    );
    seedRole('c-role-a', 'You are my chief of staff.');

    const plan = planEntityBackfill({ bases: ['role-title'] });
    const row = plan.rows.find((r) => r.channelId === 'c-role-a')!;
    expect(row.action).toBe('minted');

    applyEntityBackfill(plan);
    const bound = getChannelEntities('c-role-a');
    expect(bound).toHaveLength(1);
    expect(bound[0].id).not.toBe('ent-cos');
    expect(bound[0].name).toBe('chief of staff');
    // Two agents now carry the name, which is the cost of the rule and is what
    // the sheet's collision line reports rather than hides.
    expect(getAllEntities().filter((e) => e.name === 'chief of staff')).toHaveLength(2);
  });

  it('mints one agent per channel when two role rows share a name, and says so', () => {
    seedRole('c-cc-a', 'Hello! You are my tech-savvy communications chief here on the project.');
    seedRole('c-cc-b', 'Hi! You are my tech-savvy Communications Chief here on the project.');

    const plan = planEntityBackfill({ bases: ['role-title'] });
    const collision = plan.summary.collisions.find(
      (c) => c.name.toLowerCase() === 'tech-savvy communications chief'
    )!;
    expect(collision.mergesIntoOne).toBe(false);

    applyEntityBackfill(plan);
    const a = getChannelEntities('c-cc-a')[0];
    const b = getChannelEntities('c-cc-b')[0];
    expect(a.id).not.toBe(b.id);
  });

  it('still collapses five sessions naming one agent into one agent', () => {
    // The rule this must not break: `entity-resolve.ts` opens by arguing for it,
    // and xian assumed it by default.
    seedRole('c-d1', 'You are Daedalus, resume the cycle.');
    seedRole('c-d2', 'You are Daedalus, continue where the last chat stopped.');

    const plan = planEntityBackfill();
    const collision = plan.summary.collisions.find((c) => c.name === 'Daedalus')!;
    expect(collision.mergesIntoOne).toBe(true);

    applyEntityBackfill(plan);
    expect(getChannelEntities('c-d1')[0].id).toBe(getChannelEntities('c-d2')[0].id);
    expect(getAllEntities().filter((e) => e.name === 'Daedalus')).toHaveLength(1);
  });
});

describe('a correct zero must not read like an empty corpus', () => {
  it('reports what a wider --bases would have found', () => {
    const db = getDb();
    db.prepare('INSERT INTO channels (id, name, type, source) VALUES (?, ?, ?, ?)').run(
      'c-x',
      'c-x',
      'chat',
      'claude-code'
    );
    db.prepare('INSERT INTO channel_entities (channel_id, entity_id) VALUES (?, ?)').run(
      'c-x',
      DEFAULT_ENTITY_ID
    );
    db.prepare(
      'INSERT INTO messages (id, channel_id, role, content, entity_id, created_at) VALUES (?, ?, ?, ?, ?, ?)'
    ).run('c-x-u0', 'c-x', 'user', 'You are my chief of staff.', null, '2026-09-01T00:00:00.000Z');

    // The default run: `identity-claim` only, which is what xian's corpus was
    // measured under when it reported `72 — 0 would move`.
    const plan = planEntityBackfill();
    expect(plan.summary.apply).toBe(0);
    expect(plan.summary.basisExcluded['role-title']).toBe(1);
  });

  it('counts nothing under a basis the run does apply', () => {
    const plan = planEntityBackfill({ bases: ['identity-claim', 'role-title'] });
    expect(plan.summary.basisExcluded['role-title']).toBeUndefined();
  });
});
