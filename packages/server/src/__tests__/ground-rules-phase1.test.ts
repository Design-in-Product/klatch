/**
 * Ground rules, phase 1 (2026-11-16, Daedalus) — the 2026-11-03 ruling's first
 * increment: a per-klatch conduct field, blank by default, rendered at layer 4a.
 *
 * Ruling: `docs/operations/attention-rollup.md` (RULED 2026-11-03, xian via
 * Janus). Scoping and phasing: `docs/ux/ground-rules-scope-2026-11-16.md`
 * (Calliope) — phase 1 is "blank field + static guidance, no storage beyond the
 * column"; phases 2 (save-as-default / named templates) and 3 (offer previous
 * rules) are coupled and not built.
 *
 * ## What this file is actually for
 *
 * Not "the field persists" — that is the cheap half, and it would pass with the
 * field fused into `system_prompt`, which is precisely the design the scope doc
 * rejected. The assertions that carry load are the ones that would fail under a
 * *working-but-conflated* implementation:
 *
 *  - `ground_rules` is a **column of its own** in the real migration, measured by
 *    running `applySchema` over a fresh database rather than by reading the test
 *    fixture's hand-typed DDL. The fixture is a copy; a copy agreeing with itself
 *    says nothing about what the app does to `klatch.db`.
 *  - ground rules and Purpose reach the prompt as **two parts**, and the ground
 *    rules part is **labelled**, so a reader of the assembled string can tell
 *    which field said what.
 *  - layer 4's boilerplate-Purpose skip and the ground-rules push are
 *    **independent**: a klatch that left Purpose blank (and so stores
 *    `DEFAULT_CHANNEL_PREAMBLE`) still sends its rules.
 *  - one empty state, not two: blank, whitespace-only and absent all read back
 *    `undefined`, because phase 3 keys "offer previous rules" on that difference.
 *  - ground rules alone keep the terminal floor silent — they are content, so an
 *    assembly containing them is not a zero-layer assembly.
 */

import './setup.js';
import { describe, it, expect } from 'vitest';
import Database from 'better-sqlite3';
import { applySchema } from '../db/index.js';
import {
  createChannel,
  updateChannel,
  getChannel,
  getAllChannels,
  getAllChannelsEnriched,
  createEntity,
  assignEntityToChannel,
} from '../db/queries.js';
import { assembleSystemPrompt, GROUND_RULES_PREFIX } from '../claude/client.js';
import { createTestApp } from './app.js';
import { DEFAULT_CHANNEL_PREAMBLE } from '@klatch/shared';
import type { Entity } from '@klatch/shared';

const RULES = "Challenge each other's assumptions rather than agreeing.";
const PURPOSE = 'Review the Q4 architecture decisions.';
const AGENT_PROMPT = 'You are Piper Morgan, a product manager.';

function entity(overrides: Partial<Entity> = {}): Entity {
  return {
    id: 'e-piper',
    name: 'Piper Morgan',
    model: 'claude-opus-5',
    systemPrompt: AGENT_PROMPT,
    color: '#3b82f6',
    ...overrides,
  } as Entity;
}

const post = (body: unknown) =>
  createTestApp().request('/api/channels', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

const patch = (id: string, body: unknown) =>
  createTestApp().request(`/api/channels/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

describe('ground rules phase 1 — the column', () => {
  it('the real migration adds ground_rules to channels, and leaves system_prompt alone', () => {
    // Measured against `applySchema` — the function the app runs on every open —
    // on a database this test creates empty. Asserting against the `__tests__`
    // fixture schema instead would be the fixture agreeing with itself: that DDL
    // is hand-typed, and the one failure mode worth catching here is a column
    // added to the fixture and forgotten in the migration.
    const db = new Database(':memory:');
    try {
      applySchema(db);
      const cols = (db.prepare('PRAGMA table_info(channels)').all() as { name: string; type: string; notnull: number }[]);
      const byName = new Map(cols.map((c) => [c.name, c]));

      expect(byName.has('ground_rules')).toBe(true);
      expect(byName.get('ground_rules')!.type).toBe('TEXT');
      // Nullable, no default: "no rules written" has to be a distinct state from
      // '' for phase 3 to key on, and a NOT NULL DEFAULT '' would erase it.
      expect(byName.get('ground_rules')!.notnull).toBe(0);

      // Still its own field, not a rename or a reuse of the purpose column.
      expect(byName.has('system_prompt')).toBe(true);
    } finally {
      db.close();
    }
  });

  it('applying the schema twice is a no-op — the guard is on the column, not the run', () => {
    const db = new Database(':memory:');
    try {
      applySchema(db);
      // An unguarded `ALTER TABLE … ADD COLUMN` throws "duplicate column name"
      // on the second open, which for a migration means every existing install.
      expect(() => applySchema(db)).not.toThrow();
      const cols = db.prepare('PRAGMA table_info(channels)').all() as { name: string }[];
      expect(cols.filter((c) => c.name === 'ground_rules')).toHaveLength(1);
    } finally {
      db.close();
    }
  });
});

describe('ground rules phase 1 — storage and round-trip', () => {
  it('createChannel persists the rules and getChannel reads them back', () => {
    const ch = createChannel('arch-review', PURPOSE, undefined, undefined, 'klatch', undefined, RULES);
    expect(ch.groundRules).toBe(RULES);
    expect(getChannel(ch.id)!.groundRules).toBe(RULES);
    // And the sibling field is untouched — the conflation check at the storage layer.
    expect(getChannel(ch.id)!.systemPrompt).toBe(PURPOSE);
  });

  it('absent, blank and whitespace-only all read back undefined — one empty state', () => {
    const absent = createChannel('a', PURPOSE, undefined, undefined, 'klatch');
    const blank = createChannel('b', PURPOSE, undefined, undefined, 'klatch', undefined, '');
    const spaces = createChannel('c', PURPOSE, undefined, undefined, 'klatch', undefined, '   \n\t ');

    for (const ch of [absent, blank, spaces]) {
      expect(ch.groundRules).toBeUndefined();
      expect(getChannel(ch.id)!.groundRules).toBeUndefined();
    }
  });

  it('rules are trimmed on the way in, so the stored value is what layer 4a will push', () => {
    const ch = createChannel('trim', PURPOSE, undefined, undefined, 'klatch', undefined, `\n  ${RULES}  \n`);
    expect(getChannel(ch.id)!.groundRules).toBe(RULES);
  });

  it('both list paths carry the field — the sidebar reads one of them', () => {
    const ch = createChannel('listed', PURPOSE, undefined, undefined, 'klatch', undefined, RULES);
    expect(getAllChannels().find((c) => c.id === ch.id)!.groundRules).toBe(RULES);
    expect(getAllChannelsEnriched().find((c) => c.id === ch.id)!.groundRules).toBe(RULES);
  });

  it('updateChannel: undefined leaves rules alone, null clears them, a string replaces them', () => {
    const ch = createChannel('editable', PURPOSE, undefined, undefined, 'klatch', undefined, RULES);

    // A name-only update must not wipe a field it says nothing about.
    expect(updateChannel(ch.id, { name: 'renamed' })!.groundRules).toBe(RULES);
    expect(getChannel(ch.id)!.groundRules).toBe(RULES);

    expect(updateChannel(ch.id, { groundRules: 'No jargon.' })!.groundRules).toBe('No jargon.');
    expect(getChannel(ch.id)!.groundRules).toBe('No jargon.');

    expect(updateChannel(ch.id, { groundRules: null })!.groundRules).toBeUndefined();
    expect(getChannel(ch.id)!.groundRules).toBeUndefined();
  });
});

describe('ground rules phase 1 — layer 4a assembly', () => {
  it('rules reach the prompt as their own labelled part, beside Purpose', () => {
    const ch = createChannel('assembled', PURPOSE, undefined, undefined, 'klatch', undefined, RULES);
    const { prompt } = assembleSystemPrompt(entity(), ch.systemPrompt, ch);

    // Order and separation both asserted: three parts, purpose then rules then
    // the agent's own identity, joined the way every other layer is.
    expect(prompt).toBe(`${PURPOSE}\n\n${GROUND_RULES_PREFIX}\n\n${RULES}\n\n${AGENT_PROMPT}`);
    // The conflation check at the prompt layer: the rules are not inside the
    // purpose string, and a reader can tell which field each came from.
    expect(prompt.indexOf(GROUND_RULES_PREFIX)).toBeGreaterThan(prompt.indexOf(PURPOSE));
  });

  it('a boilerplate Purpose is still skipped, and the rules still go — the two are independent', () => {
    // The state produced by a user who filled in ground rules and left Purpose
    // blank: the create route stores DEFAULT_CHANNEL_PREAMBLE for the blank
    // field, and layer 4 drops it. If the rules rode on the same condition they
    // would be dropped with it, which is the whole hazard of sharing a layer.
    const ch = createChannel('rules-only', DEFAULT_CHANNEL_PREAMBLE, undefined, undefined, 'klatch', undefined, RULES);
    const { prompt, floorApplied } = assembleSystemPrompt(entity(), ch.systemPrompt, ch);

    expect(prompt).toBe(`${GROUND_RULES_PREFIX}\n\n${RULES}\n\n${AGENT_PROMPT}`);
    expect(prompt).not.toContain(DEFAULT_CHANNEL_PREAMBLE);
    expect(floorApplied).toBe(false);
  });

  it('a channel with no rules assembles exactly as it did before the field existed', () => {
    const ch = createChannel('unchanged', PURPOSE, undefined, undefined, 'klatch');
    const { prompt } = assembleSystemPrompt(entity(), ch.systemPrompt, ch);
    expect(prompt).toBe(`${PURPOSE}\n\n${AGENT_PROMPT}`);
    expect(prompt).not.toContain(GROUND_RULES_PREFIX);
  });

  it('whitespace-only rules push nothing — the label never appears alone', () => {
    // Reached directly rather than through a writer: `createChannel` already
    // trims, so this covers the import path and any future writer that does not.
    const ch = { ...createChannel('ws', PURPOSE, undefined, undefined, 'klatch'), groundRules: '   ' };
    const { prompt } = assembleSystemPrompt(entity(), ch.systemPrompt, ch);
    expect(prompt).not.toContain(GROUND_RULES_PREFIX);
  });

  it('rules alone keep the terminal floor silent', () => {
    // The symmetric case to Round 167: an assembly whose only content is ground
    // rules has content, so substituting the boilerplate floor over it would be
    // the floor displacing a real layer.
    const ch = { ...createChannel('floor', '', undefined, undefined, 'klatch'), groundRules: RULES };
    const blankAgent = entity({ systemPrompt: '' });
    const { prompt, floorApplied } = assembleSystemPrompt(blankAgent, ch.systemPrompt, ch);

    expect(floorApplied).toBe(false);
    expect(prompt).toBe(`${GROUND_RULES_PREFIX}\n\n${RULES}`);
  });
});

describe('ground rules phase 1 — the endpoints', () => {
  it('POST /channels accepts groundRules and returns them on the created klatch', async () => {
    const res = await post({ name: 'Weekly Review', type: 'klatch', systemPrompt: PURPOSE, groundRules: RULES });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.groundRules).toBe(RULES);
    expect(body.systemPrompt).toBe(PURPOSE);
    expect(getChannel(body.id)!.groundRules).toBe(RULES);
  });

  it('POST /channels stores no boilerplate substitute for blank rules', async () => {
    // Purpose gets DEFAULT_CHANNEL_PREAMBLE when blank, for historical reasons
    // layer 4 then has to undo. Repeating that here would mint a second string
    // the assembly must recognise and drop.
    const res = await post({ name: 'No Rules', type: 'klatch' });
    const body = await res.json();
    expect(body.systemPrompt).toBe(DEFAULT_CHANNEL_PREAMBLE);
    expect(body.groundRules).toBeUndefined();
    expect(getChannel(body.id)!.groundRules).toBeUndefined();
  });

  it('POST /channels accepts rules on a chat too — the klatch-only gate is the UI', async () => {
    // "A chat with two agents" is structurally incoherent and the route rejects
    // it. "A chat with conduct rules" is merely not surfaced yet, so rejecting it
    // would be the API enforcing a client decision.
    const res = await post({ name: 'solo', type: 'chat', groundRules: RULES });
    expect(res.status).toBe(201);
    expect((await res.json()).groundRules).toBe(RULES);
  });

  it('PATCH /channels/:id sets, preserves and clears the rules', async () => {
    const created = await (await post({ name: 'patchable', type: 'klatch', groundRules: RULES })).json();

    const renamed = await (await patch(created.id, { name: 'patched' })).json();
    expect(renamed.groundRules).toBe(RULES);

    const replaced = await (await patch(created.id, { groundRules: 'No jargon.' })).json();
    expect(replaced.groundRules).toBe('No jargon.');

    const cleared = await (await patch(created.id, { groundRules: null })).json();
    expect(cleared.groundRules).toBeUndefined();
    expect(getChannel(created.id)!.groundRules).toBeUndefined();
  });

  it('prompt-debug reports ground rules in layer 4, separately from the purpose count', async () => {
    const ch = createChannel('debuggable', PURPOSE, undefined, undefined, 'klatch', undefined, RULES);
    const ent = createEntity('Piper Morgan', 'claude-opus-5', AGENT_PROMPT, '#3b82f6');
    assignEntityToChannel(ch.id, ent.id);

    const res = await createTestApp().request(`/api/channels/${ch.id}/prompt-debug?entityId=${ent.id}`);
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.layers['4_channelAddendum']).toContain(`${PURPOSE.length} chars`);
    expect(body.layers['4_channelAddendum']).toContain(`ground rules ${RULES.length} chars`);
    // The debug surface and the assembly must not disagree.
    expect(body.assembledPrompt).toContain(GROUND_RULES_PREFIX);
    expect(body.assembledPrompt).toContain(RULES);
  });

  it('prompt-debug reports layer 4 ACTIVE on rules alone, even with a boilerplate purpose', async () => {
    // Before the field, this state read "EMPTY — default purpose, not sent" and
    // that was the whole truth. Now it is content the layer is carrying, and a
    // reader debugging "why is the room ignoring my rules" has to be able to see
    // which of the two halves is empty.
    const ch = createChannel('rules-only-debug', DEFAULT_CHANNEL_PREAMBLE, undefined, undefined, 'klatch', undefined, RULES);
    const res = await createTestApp().request(`/api/channels/${ch.id}/prompt-debug`);
    const body = await res.json();

    expect(body.layers['4_channelAddendum']).toBe(`ACTIVE — ground rules ${RULES.length} chars`);
  });
});
