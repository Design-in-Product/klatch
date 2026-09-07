/**
 * Round 167 (2026-09-07) — two of the four open items from Theseus's endpoint
 * drive of Round 166's terminal floor
 * (`docs/research/round167-the-floor-holds-at-the-endpoint-and-four-open-items-2026-09-07.md`).
 *
 * Neither is a defect in the floor. Theseus's probe closed all five of Round
 * 165's regression failures and found the floor never fires above an identity —
 * including the two adversarial cases (an agent whose prompt *contains* the
 * boilerplate, and one whose prompt *is* the boilerplate), both of which come
 * out at one occurrence rather than two. `parts.length === 0` is the right
 * predicate and it survives.
 *
 * **Item 2 — when the floor fires, nothing accounts for it.** `prompt-debug`
 * reported every layer INACTIVE or EMPTY and `assembledLength: 28`: content from
 * nowhere. This is the symmetric case to the one Round 162 deliberately closed
 * for layer 4 (`EMPTY — default purpose, not sent`), which exists so a reader
 * can tell "nothing written" from "written and dropped". A reader who knows the
 * constant can infer the floor from the length — but requiring that inference is
 * exactly what Round 162 decided against, so the floor now reports itself.
 *
 * Reported *from the assembly* (`assembleSystemPrompt`) rather than re-derived
 * at each debug site, because the only test a debug site could apply on its own
 * is on the output string, and Theseus's two adversarial cases are precisely
 * where "the output equals the constant" and "the floor fired" disagree.
 *
 * **Item 3 — `PATCH {"systemPrompt": null}` 500s.** Round 166 replaced a bare
 * `body.systemPrompt?.trim()` with a ternary on `=== undefined`. The old
 * expression was doing two jobs; the ternary took the first and dropped the
 * second, so `null` fell to the false branch and threw. Not reachable from the
 * shipped UI (Theseus checked: `api/client.ts` types it `systemPrompt?: string`,
 * `EntityManager.tsx` always sends `.trim()` of a string) and nothing stored was
 * corrupted — API-surface robustness, not a user bug. `null` substitutes, on the
 * same reading of a cleared field that `''` gets.
 *
 * Items 1 (layer 6's uneven delivery to a blank imported agent) and 4 (the
 * client-side coupling that keeps PATCH-substitutes and import-preserves apart)
 * are ruled on in `docs/mail/daedalus-to-theseus-cc-iris-janus-calliope-argus-
 * xian-three-items-fixed-and-layer-6-is-scope-not-floor-2026-09-07.md`; item 4's
 * guard is a client test, not this file. Item 1's short form: the uneven
 * delivery Theseus measured is a property of layer 6's klatch-only scope
 * (`carried-context.ts:304`, decided Round 40/41), not of the floor, which never
 * sees the choice — it fires only when nothing assembled.
 */

import './setup.js';
import { describe, it, expect } from 'vitest';
import { createTestApp } from './app.js';
import { createChannel, createEntity, assignEntityToChannel, getEntity } from '../db/queries.js';
import { buildSystemPrompt, assembleSystemPrompt } from '../claude/client.js';
import { DEFAULT_CHANNEL_PREAMBLE } from '@klatch/shared';
import type { Entity } from '@klatch/shared';

function entity(overrides: Partial<Entity> = {}): Entity {
  return {
    id: 'e-blank',
    name: 'Promptless',
    model: 'claude-opus-5',
    systemPrompt: '',
    color: '#3b82f6',
    ...overrides,
  } as Entity;
}

describe('Round 167 item 2 — the floor accounts for itself', () => {
  it('assembleSystemPrompt reports the floor firing, and buildSystemPrompt is unchanged by it', () => {
    const { prompt, floorApplied } = assembleSystemPrompt(entity(), DEFAULT_CHANNEL_PREAMBLE);
    expect(floorApplied).toBe(true);
    expect(prompt).toBe(DEFAULT_CHANNEL_PREAMBLE);
    // The string-only face must be byte-identical — this refactor moved the
    // body, and every sender in the app goes through the old name.
    expect(buildSystemPrompt(entity(), DEFAULT_CHANNEL_PREAMBLE)).toBe(prompt);
  });

  it('does NOT report the floor for an agent whose identity *is* the boilerplate', () => {
    // Theseus's adversarial case. Output is the same 28 characters either way,
    // so a debug site testing the *string* would call this a floor. It is not:
    // layer 5 assembled, deliberately unfiltered (Round 164) so an agent who
    // chose the boilerplate keeps it.
    const { prompt, floorApplied } = assembleSystemPrompt(
      entity({ systemPrompt: DEFAULT_CHANNEL_PREAMBLE }),
      DEFAULT_CHANNEL_PREAMBLE,
    );
    expect(floorApplied).toBe(false);
    expect(prompt).toBe(DEFAULT_CHANNEL_PREAMBLE);
    expect(prompt.length).toBe(28);
  });

  it('does NOT report the floor for an identity that merely contains the boilerplate', () => {
    const contains = `${DEFAULT_CHANNEL_PREAMBLE} You are also terse.`;
    const { prompt, floorApplied } = assembleSystemPrompt(entity({ systemPrompt: contains }), DEFAULT_CHANNEL_PREAMBLE);
    expect(floorApplied).toBe(false);
    expect(prompt).toBe(contains);
    // One occurrence, not two — the property Theseus's stricter predicate pins.
    expect(prompt.split(DEFAULT_CHANNEL_PREAMBLE).length - 1).toBe(1);
  });

  it('does NOT report the floor when any single layer assembled', () => {
    // Layer 4 alone, blank agent: the floor's unit is "did anything assemble",
    // and something did.
    const { floorApplied } = assembleSystemPrompt(entity(), 'This chat is about architecture.');
    expect(floorApplied).toBe(false);
  });

  it('prompt-debug shows 7_floor ACTIVE when every layer above it is silent', async () => {
    const ch = createChannel('floored', DEFAULT_CHANNEL_PREAMBLE);
    const ent = createEntity('Promptless', 'claude-opus-5', '', '#3b82f6');
    assignEntityToChannel(ch.id, ent.id);

    const res = await createTestApp().request(`/api/channels/${ch.id}/prompt-debug?entityId=${ent.id}`);
    expect(res.status).toBe(200);
    const body = await res.json();

    // The state Theseus measured: everything above reads INACTIVE or EMPTY.
    expect(body.layers['1_kitBriefing']).toContain('INACTIVE');
    expect(body.layers['4_channelAddendum']).toBe('EMPTY — default purpose, not sent');
    expect(body.layers['5_entityPrompt']).toContain('0 chars');
    expect(body.assembledLength).toBe(28);
    // …and the 28 characters are now attributed rather than inferable.
    expect(body.layers['7_floor']).toContain('ACTIVE');
    expect(body.layers['7_floor']).toContain('DEFAULT_CHANNEL_PREAMBLE');
  });

  it('prompt-debug shows 7_floor INACTIVE whenever a real layer carried the prompt', async () => {
    const ch = createChannel('not-floored', DEFAULT_CHANNEL_PREAMBLE);
    const ent = createEntity('Piper Morgan', 'claude-opus-5', 'You are Piper Morgan, a product manager.', '#3b82f6');
    assignEntityToChannel(ch.id, ent.id);

    const body = await (await createTestApp().request(`/api/channels/${ch.id}/prompt-debug?entityId=${ent.id}`)).json();
    expect(body.layers['7_floor']).toContain('INACTIVE');
  });

  it('prompt-debug shows 7_floor INACTIVE for the boilerplate-as-identity agent', async () => {
    // Same 28 characters on the wire as the floored case above, opposite
    // reading. This is the check that fails if anyone re-implements the floor
    // report as a string test against the assembled prompt.
    const ch = createChannel('identity-is-boilerplate', DEFAULT_CHANNEL_PREAMBLE);
    const ent = createEntity('Echo', 'claude-opus-5', DEFAULT_CHANNEL_PREAMBLE, '#3b82f6');
    assignEntityToChannel(ch.id, ent.id);

    const body = await (await createTestApp().request(`/api/channels/${ch.id}/prompt-debug?entityId=${ent.id}`)).json();
    expect(body.assembledLength).toBe(28);
    expect(body.layers['7_floor']).toContain('INACTIVE');
  });
});

describe('Round 167 item 3 — PATCH systemPrompt: null', () => {
  it('substitutes the default instead of throwing', async () => {
    const ent = createEntity('Nullable', 'claude-opus-5', 'You are Nullable.', '#3b82f6');

    const res = await createTestApp().request(`/api/entities/${ent.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ systemPrompt: null }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.systemPrompt).toBe(DEFAULT_CHANNEL_PREAMBLE);
    expect(getEntity(ent.id)!.systemPrompt).toBe(DEFAULT_CHANNEL_PREAMBLE);
  });

  it('still substitutes on empty string, and still passes through on absent', async () => {
    // Round 166's two rulings, re-pinned so the `?.` fix can't be read as
    // widening them.
    const app = createTestApp();
    const ent = createEntity('Keeper', 'claude-opus-5', 'You are Keeper.', '#3b82f6');

    const emptied = await app.request(`/api/entities/${ent.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ systemPrompt: '   ' }),
    });
    expect((await emptied.json()).systemPrompt).toBe(DEFAULT_CHANNEL_PREAMBLE);

    const other = createEntity('Untouched', 'claude-opus-5', 'You are Untouched.', '#3b82f6');
    const renamed = await app.request(`/api/entities/${other.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Renamed' }),
    });
    const body = await renamed.json();
    expect(body.name).toBe('Renamed');
    expect(body.systemPrompt).toBe('You are Untouched.');
  });

  it('preserves an imported agent’s deliberate blank when the field is absent', async () => {
    // Writer six mints `''` on purpose (`import/entity-resolve.ts`): an imported
    // agent's identity is its transcript. A name-only PATCH must not boilerplate
    // it — this is the server half of item 4; the client half is pinned in
    // `packages/client/src/__tests__/round167-entity-edit-omits-unchanged.test.tsx`.
    const imported = createEntity('Promptless', 'claude-opus-5', '', '#3b82f6');

    const res = await createTestApp().request(`/api/entities/${imported.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Promptless Renamed' }),
    });

    expect(res.status).toBe(200);
    expect((await res.json()).systemPrompt).toBe('');
    expect(getEntity(imported.id)!.systemPrompt).toBe('');
  });
});
