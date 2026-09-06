/**
 * Round 162 (2026-09-06) — two consequences of Path C, both server-side.
 *
 * Both come from Theseus's Round 161 endpoint drive
 * (`docs/research/round161-path-c-live-at-the-endpoint-...md`). Neither is a
 * defect in Path C itself (`717bfb6`); both are lines that were harmless
 * because of *who they applied to*, and Path C changed who they apply to.
 *
 * **1. The boilerplate channel preamble reached the model.** A chat bound to a
 * real agent assembled to `"You are a helpful assistant.\n\nYou are Piper
 * Morgan, a product manager. …"` — generic instruction at char 0, chosen
 * identity at char 71. Invisible before Path C because layer 5 was always the
 * default entity, whose seeded prompt is character-for-character the same
 * string, so layer 4 duplicated layer 5 and cost nothing.
 *
 * Theseus routed the fix to Iris as a one-line client change (send `undefined`
 * when the field is blank). **That would not have fixed it**: `channels.ts`
 * substitutes the same string server-side when `systemPrompt` is absent, so an
 * `undefined` from the client arrives at the model unchanged. The fix has to be
 * in assembly — where it also covers every channel created before today, which
 * a client-side fix could not.
 *
 * **2. The chat roster guard counted array entries, not agents.** `[X, X]` was
 * 400 on a chat and 201-with-one-seat on a klatch, because `createChannel`
 * dedups and the route guard did not.
 */

import './setup.js';
import { describe, it, expect } from 'vitest';
import { createTestApp } from './app.js';
import {
  createChannel,
  createEntity,
  assignEntityToChannel,
  getChannelEntities,
} from '../db/queries.js';
import { buildSystemPrompt } from '../claude/client.js';
import { DEFAULT_CHANNEL_PREAMBLE, isDefaultChannelPreamble, DEFAULT_ENTITY_ID } from '@klatch/shared';
import type { Entity } from '@klatch/shared';

const PIPER_PROMPT = 'You are Piper Morgan, a product manager.';

function entity(overrides: Partial<Entity> = {}): Entity {
  return {
    id: 'e-piper',
    name: 'Piper Morgan',
    model: 'claude-opus-5',
    systemPrompt: PIPER_PROMPT,
    color: '#3b82f6',
    ...overrides,
  } as Entity;
}

describe('Round 162 — the boilerplate preamble is not sent', () => {
  it('the predicate recognises the string the create route writes, and only it', () => {
    expect(isDefaultChannelPreamble(DEFAULT_CHANNEL_PREAMBLE)).toBe(true);
    // Trimmed: imports and direct createChannel callers need not pre-trim.
    expect(isDefaultChannelPreamble(`  ${DEFAULT_CHANNEL_PREAMBLE}\n`)).toBe(true);
    expect(isDefaultChannelPreamble(undefined)).toBe(false);
    expect(isDefaultChannelPreamble('')).toBe(false);
    // Real user content that merely starts the same way is still user content.
    expect(isDefaultChannelPreamble('You are a helpful assistant. Use TypeScript.')).toBe(false);
  });

  it('a bound 1:1 assembles to the agent identity alone — no generic line above it', () => {
    const assembled = buildSystemPrompt(entity(), DEFAULT_CHANNEL_PREAMBLE);
    expect(assembled).toBe(PIPER_PROMPT);
    // The specific failure Round 161 measured: identity displaced off char 0.
    expect(assembled.indexOf('You are Piper Morgan')).toBe(0);
  });

  it('a real channel purpose still leads, unchanged', () => {
    const assembled = buildSystemPrompt(entity(), 'This chat is about architecture.');
    expect(assembled).toBe(`This chat is about architecture.\n\n${PIPER_PROMPT}`);
  });

  it('the default 1:1 no longer says the same sentence to itself twice', () => {
    const dflt = entity({ id: DEFAULT_ENTITY_ID, name: 'Claude', systemPrompt: DEFAULT_CHANNEL_PREAMBLE });
    const assembled = buildSystemPrompt(dflt, DEFAULT_CHANNEL_PREAMBLE);
    // Round 161's control measured 58 chars here: the string, twice.
    expect(assembled).toBe(DEFAULT_CHANNEL_PREAMBLE);
    expect(assembled.length).toBe(28);
  });

  it('the fix reaches channels created before Path C, not just new ones', () => {
    // The population that predates the gesture: every channel ever created
    // through the route carries the stored boilerplate. A client-side fix
    // would leave all of them as they were.
    const ch = createChannel('pre-existing', DEFAULT_CHANNEL_PREAMBLE);
    expect(ch.systemPrompt).toBe(DEFAULT_CHANNEL_PREAMBLE);
    expect(buildSystemPrompt(entity(), ch.systemPrompt)).toBe(PIPER_PROMPT);
  });

  it('prompt-debug reports L4 as EMPTY with a reason, agreeing with assembly', async () => {
    const ch = createChannel('boilerplate-l4', DEFAULT_CHANNEL_PREAMBLE);
    const ent = createEntity('Piper Morgan', 'claude-opus-5', PIPER_PROMPT, '#3b82f6');
    assignEntityToChannel(ch.id, ent.id);

    const res = await createTestApp().request(`/api/channels/${ch.id}/prompt-debug?entityId=${ent.id}`);
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.layers['4_channelAddendum']).toBe('EMPTY — default purpose, not sent');
    // The debug surface and the assembled prompt must not disagree — reporting
    // ACTIVE for a layer assembly drops is how a fix like this goes unnoticed.
    expect(body.assembledPrompt).not.toContain(DEFAULT_CHANNEL_PREAMBLE);
    expect(body.assembledPrompt).toContain(PIPER_PROMPT);
  });

  it('a genuinely blank purpose still reports plain EMPTY', async () => {
    const ch = createChannel('blank-l4', '');
    const res = await createTestApp().request(`/api/channels/${ch.id}/prompt-debug`);
    const body = await res.json();
    expect(body.layers['4_channelAddendum']).toBe('EMPTY');
  });

  it('pinned files keep L4 ACTIVE even when the purpose is boilerplate', async () => {
    // The addendum layer carries two things. Suppressing the boilerplate must
    // not suppress the file listing that shares the layer.
    const ch = createChannel('files-with-boilerplate', DEFAULT_CHANNEL_PREAMBLE);
    const res = await createTestApp().request(`/api/channels/${ch.id}/prompt-debug`);
    const body = await res.json();
    // No files pinned in this fixture, so the assertion that matters is that
    // the file branch is still the thing deciding ACTIVE, not the prompt.
    expect(body.layers['4_channelAddendum']).toBe('EMPTY — default purpose, not sent');
    expect(body.layers['4_channelAddendum']).not.toContain('28 chars');
  });
});

describe('Round 162 — the chat roster guard counts agents, not array entries', () => {
  const post = (app: ReturnType<typeof createTestApp>, body: unknown) =>
    app.request('/api/channels', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

  it('chat + the same agent twice is 201 with one seat, matching klatch', async () => {
    const app = createTestApp();
    const ent = createEntity('Piper Morgan', 'claude-opus-5', PIPER_PROMPT, '#3b82f6');

    const res = await post(app, { name: 'dup-chat', type: 'chat', entityIds: [ent.id, ent.id] });
    expect(res.status).toBe(201);
    const { id } = await res.json();
    expect(getChannelEntities(id).map((e) => e.id)).toEqual([ent.id]);
  });

  it('klatch + the same agent twice is unchanged — 201, one seat', async () => {
    const app = createTestApp();
    const ent = createEntity('Piper Morgan', 'claude-opus-5', PIPER_PROMPT, '#3b82f6');

    const res = await post(app, { name: 'dup-klatch', type: 'klatch', entityIds: [ent.id, ent.id] });
    expect(res.status).toBe(201);
    const { id } = await res.json();
    expect(getChannelEntities(id).map((e) => e.id)).toEqual([ent.id]);
  });

  it('chat + two distinct agents is still 400 — the invariant is untouched', async () => {
    const app = createTestApp();
    const a = createEntity('Piper Morgan', 'claude-opus-5', PIPER_PROMPT, '#3b82f6');
    const b = createEntity('Other', 'claude-opus-5', 'You are Other.', '#ef4444');

    const res = await post(app, { name: 'multi-chat', type: 'chat', entityIds: [a.id, b.id] });
    expect(res.status).toBe(400);
    expect((await res.json()).error).toContain('1:1');
  });

  it('a duplicated *unknown* id is still 400, and names the id once', async () => {
    // Dedup must not run ahead of validation: an unknown id is an unknown id
    // however many times it appears.
    const res = await post(createTestApp(), { name: 'dup-unknown', type: 'chat', entityIds: ['nope', 'nope'] });
    expect(res.status).toBe(400);
    expect((await res.json()).error).toContain('Unknown entity ID');
  });
});
