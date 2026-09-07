/**
 * Round 164 (2026-09-06) — the boilerplate predicate is layer-4-only, on purpose.
 *
 * Theseus's Round 163 endpoint drive confirmed Round 162 (30/30) and surfaced an
 * asymmetry rather than a defect: the server substitutes the same 28-character
 * string in *two* places, and Round 162 taught only one of them that it is
 * boilerplate.
 *
 *   - `routes/channels.ts:201` — a channel's purpose, layer 4. Skipped by assembly.
 *   - `routes/entities.ts:81`  — an entity's own prompt, layer 5. Still sent.
 *
 * Measured by Theseus at the endpoint: an agent created with a blank prompt
 * stores `"You are a helpful assistant."` and a chat bound to it assembles to
 * exactly the 28 characters Round 162 removed — from the layer the predicate
 * does not reach.
 *
 * **Ruling: the asymmetry is correct, and these tests make it deliberate.**
 * The predicate is a *fall-through* rule, and a fall-through needs somewhere to
 * fall to. Layer 4 can be dropped because layer 5 is guaranteed to hold
 * something: every channel has at least one entity, and all three writers of an
 * entity row substitute a non-empty prompt (`entities.ts:81`, and the two seeds
 * at `db/index.ts:84,351`). Layer 5 is terminal — nothing sits beneath it — so
 * applying the same predicate there does not fall through to an identity, it
 * produces a **zero-length system prompt**, for the seeded default entity and
 * for every agent whose prompt the user left blank. That is Klatch's most
 * common gesture.
 *
 * Theseus's semantic argument lands in the same place from the other side:
 * layer 4 was wrong because it *contradicted* a real identity; at layer 5 it is
 * the only identity there is.
 *
 * What these tests defend against is a future tidy-up that notices the string in
 * two places and "unifies" them. `round162-*.test.ts` already pins the default
 * 1:1 at 28 chars; it uses the *seeded* entity, so a change to `entities.ts:81`
 * alone would leave it green while emptying the prompt for every user-created
 * blank-prompt agent. That population is pinned here.
 */

import './setup.js';
import { describe, it, expect } from 'vitest';
import { createTestApp } from './app.js';
import {
  createChannel,
  createEntity,
  getEntity,
  assignEntityToChannel,
} from '../db/queries.js';
import { buildSystemPrompt } from '../claude/client.js';
import { DEFAULT_CHANNEL_PREAMBLE, DEFAULT_ENTITY_ID } from '@klatch/shared';

const jsonReq = (body: unknown) => new Request('http://x/api/entities', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

describe('Round 164 — layer 5 is terminal, so the predicate stops at layer 4', () => {
  it('the entities route stores the boilerplate for a blank prompt — deliberate, not drift', async () => {
    const res = await createTestApp().request(jsonReq({ name: 'Unnamed Helper' }));
    expect(res.status).toBe(201);
    const created = await res.json() as { id: string; systemPrompt: string };

    // If this ever changes to `''`, the assembled prompt below goes to zero
    // length. Change it on purpose, with the next test in hand.
    expect(created.systemPrompt).toBe(DEFAULT_CHANNEL_PREAMBLE);
    expect(getEntity(created.id)?.systemPrompt).toBe(DEFAULT_CHANNEL_PREAMBLE);
  });

  it('a chat bound to a blank-prompt agent assembles to the boilerplate, not to nothing', async () => {
    const res = await createTestApp().request(jsonReq({ name: 'Unnamed Helper' }));
    const created = await res.json() as { id: string };
    const ent = getEntity(created.id)!;

    const ch = createChannel('blank agent', DEFAULT_CHANNEL_PREAMBLE);
    assignEntityToChannel(ch.id, ent.id);

    const assembled = buildSystemPrompt(ent, ch.systemPrompt);

    // Layer 4 dropped (Round 162). Layer 5 survives — this is the whole prompt.
    expect(assembled).toBe(DEFAULT_CHANNEL_PREAMBLE);
    expect(assembled.length).toBe(28);
  });

  it('the seeded default entity keeps its prompt too — the same reason, the older population', () => {
    const dflt = getEntity(DEFAULT_ENTITY_ID)!;
    expect(dflt.systemPrompt).toBe(DEFAULT_CHANNEL_PREAMBLE);

    const ch = createChannel('default 1:1', DEFAULT_CHANNEL_PREAMBLE);
    assignEntityToChannel(ch.id, dflt.id);

    expect(buildSystemPrompt(dflt, ch.systemPrompt)).toBe(DEFAULT_CHANNEL_PREAMBLE);
  });

  it('assembly never returns a zero-length prompt when both layers hold the boilerplate', () => {
    // The invariant stated without reference to either writer: whatever the
    // route stores, the model is never handed an empty system prompt.
    const ent = createEntity('Blank', 'claude-opus-5', DEFAULT_CHANNEL_PREAMBLE, '#3b82f6');
    const ch = createChannel('both layers boilerplate', DEFAULT_CHANNEL_PREAMBLE);
    assignEntityToChannel(ch.id, ent.id);

    const assembled = buildSystemPrompt(ent, ch.systemPrompt);
    expect(assembled.trim().length).toBeGreaterThan(0);
  });

  it('a real identity at layer 5 is still unaffected by any of this', () => {
    const ent = createEntity('Piper Morgan', 'claude-opus-5', 'You are Piper Morgan, a product manager.', '#3b82f6');
    const ch = createChannel('bound chat', DEFAULT_CHANNEL_PREAMBLE);
    assignEntityToChannel(ch.id, ent.id);

    expect(buildSystemPrompt(ent, ch.systemPrompt)).toBe('You are Piper Morgan, a product manager.');
  });
});
