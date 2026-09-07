/**
 * Round 166 (2026-09-07) — closing the hole Round 165 measured, but not the way
 * it was proposed, because the writer enumeration was wrong a third time.
 *
 * Round 164 ruled that layer 4's boilerplate skip is safe because layer 5 is
 * guaranteed to hold something, citing "all three writers of an entity row."
 * Theseus (Round 165) reached a zero-length assembled prompt through two writers
 * that enumeration missed — `PATCH /entities/:id` with `{"systemPrompt": ""}`,
 * reachable on the *seeded default agent* in two UI gestures, and the Klatch
 * import path — and proposed a one-liner substitution at each.
 *
 * A sixth writer settles which of those one-liners is right. `import/
 * entity-resolve.ts:93` mints an imported agent with `''` **on purpose**, with
 * the rationale written at the call site: an imported agent's identity is its
 * transcript, and inventing a role prompt at import time is precisely the drift
 * `PREMISE.md` names. So "make the enumeration true" is not available — one
 * writer wants the blank, and substituting there would be a product regression
 * dressed as an invariant fix.
 *
 * **Ruling: substitute at the user-authored writer, preserve at the import
 * writers, and put the guarantee where Round 164 actually needs it — a terminal
 * floor in assembly.**
 *
 *   - `routes/entities.ts` PATCH substitutes on empty-string, passes through on
 *     absent. A user clearing a field is erasure, not selection: nothing in the
 *     UI expresses blank as a choice (Iris, prefill ruling 2026-09-07), and
 *     create has always made that same read.
 *   - `import/klatch-import.ts` and `import/entity-resolve.ts` preserve `''`.
 *   - `buildSystemPrompt` emits the boilerplate iff *nothing else* assembled.
 *
 * The floor is not the layer-5 filter Round 164 refused. That one removed
 * content and could leave nothing behind; this one only fires when nothing else
 * did, so it can never sit above a real identity (Round 162's concern) and can
 * never displace one (Round 164's). Round 162's and Round 164's own pins stay
 * green unchanged, and are re-asserted here so a future tidy-up cannot satisfy
 * one round by breaking another.
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
import { resolveImportEntity } from '../import/entity-resolve.js';
import { DEFAULT_CHANNEL_PREAMBLE, DEFAULT_ENTITY_ID } from '@klatch/shared';
import type { Entity } from '@klatch/shared';

const patch = (id: string, body: unknown) =>
  new Request(`http://x/api/entities/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

const blankEntity = (over: Partial<Entity> = {}): Entity => ({
  id: 'e-blank',
  name: 'Imported Agent',
  model: 'claude-opus-5',
  effort: 'high',
  systemPrompt: '',
  color: '#3b82f6',
  createdAt: '2026-09-07T00:00:00Z',
  ...over,
} as Entity);

describe('Round 166 — PATCH /entities/:id substitutes on empty, passes through on absent', () => {
  it('an empty-string prompt is substituted, not stored (the Round 165 leak)', async () => {
    const ent = createEntity('Patchable', 'claude-opus-5', 'You are Piper Morgan.', '#3b82f6');

    const res = await createTestApp().request(patch(ent.id, { systemPrompt: '' }));
    expect(res.status).toBe(200);

    expect(getEntity(ent.id)?.systemPrompt).toBe(DEFAULT_CHANNEL_PREAMBLE);
  });

  it('whitespace-only is the same case — it trims to empty', async () => {
    const ent = createEntity('Whitespace', 'claude-opus-5', 'You are Piper Morgan.', '#3b82f6');

    const res = await createTestApp().request(patch(ent.id, { systemPrompt: '   \n  ' }));
    expect(res.status).toBe(200);

    expect(getEntity(ent.id)?.systemPrompt).toBe(DEFAULT_CHANNEL_PREAMBLE);
  });

  it('the seeded default agent cannot be emptied — the population the boilerplate exists for', async () => {
    const res = await createTestApp().request(patch(DEFAULT_ENTITY_ID, { systemPrompt: '' }));
    expect(res.status).toBe(200);

    const dflt = getEntity(DEFAULT_ENTITY_ID)!;
    expect(dflt.systemPrompt).toBe(DEFAULT_CHANNEL_PREAMBLE);

    // Theseus's endpoint measurement, reproduced at assembly: a 1:1 bound to
    // the default agent came out at 0 chars before this fix.
    const ch = createChannel('default 1:1', DEFAULT_CHANNEL_PREAMBLE);
    assignEntityToChannel(ch.id, dflt.id);
    expect(buildSystemPrompt(dflt, ch.systemPrompt).length).toBe(DEFAULT_CHANNEL_PREAMBLE.length);
  });

  it('a PATCH that omits systemPrompt leaves it intact — Theseus\'s control, still passing', async () => {
    const ent = createEntity('Renamed', 'claude-opus-5', 'You are Piper Morgan.', '#3b82f6');

    const res = await createTestApp().request(patch(ent.id, { name: 'Renamed Twice' }));
    expect(res.status).toBe(200);

    const after = getEntity(ent.id)!;
    expect(after.name).toBe('Renamed Twice');
    expect(after.systemPrompt).toBe('You are Piper Morgan.');
  });

  it('a non-empty prompt still updates normally', async () => {
    const ent = createEntity('Editable', 'claude-opus-5', 'old', '#3b82f6');

    const res = await createTestApp().request(patch(ent.id, { systemPrompt: '  You are new.  ' }));
    expect(res.status).toBe(200);

    expect(getEntity(ent.id)?.systemPrompt).toBe('You are new.');
  });
});

describe('Round 166 — the import writers keep their blank on purpose', () => {
  it('entity-resolve mints with an empty prompt, and that is the design, not a leak', () => {
    const resolved = resolveImportEntity({ entityName: 'Piper Morgan', model: 'claude-opus-5' });
    expect(resolved.disposition).toBe('minted');

    // If this ever becomes the boilerplate, PREMISE.md's "the entity IS its
    // conversation" has been traded for an invariant that had a cheaper fix.
    expect(getEntity(resolved.entityId!)?.systemPrompt).toBe('');
  });
});

describe('Round 166 — the terminal floor', () => {
  it('fires when nothing else assembled — the state Round 165 reached', () => {
    const ch = createChannel('native room', DEFAULT_CHANNEL_PREAMBLE);
    // Layer 4 is boilerplate (skipped, Round 162), layer 5 is blank (imported
    // agent), no project, no files, no carried context. Before the floor: 0.
    expect(buildSystemPrompt(blankEntity(), ch.systemPrompt)).toBe(DEFAULT_CHANNEL_PREAMBLE);
  });

  it('fires with no channel at all', () => {
    expect(buildSystemPrompt(blankEntity())).toBe(DEFAULT_CHANNEL_PREAMBLE);
  });

  it('does NOT fire when the entity has a real prompt — no boilerplate above an identity (Round 162)', () => {
    const ch = createChannel('bound chat', DEFAULT_CHANNEL_PREAMBLE);
    const ent = blankEntity({ systemPrompt: 'You are Piper Morgan.' });

    const assembled = buildSystemPrompt(ent, ch.systemPrompt);
    expect(assembled).toBe('You are Piper Morgan.');
    expect(assembled).not.toContain(DEFAULT_CHANNEL_PREAMBLE);
  });

  it('does NOT fire when only the channel carries a real purpose', () => {
    const ch = createChannel('purposeful', 'Ship the parser.');

    const assembled = buildSystemPrompt(blankEntity(), ch.systemPrompt);
    expect(assembled).toBe('Ship the parser.');
    expect(assembled).not.toContain(DEFAULT_CHANNEL_PREAMBLE);
  });

  it('does NOT fire for an imported channel — the kit briefing is already at layer 1', () => {
    const ch = createChannel('imported room', DEFAULT_CHANNEL_PREAMBLE);
    const imported = { ...ch, source: 'claude-ai' } as typeof ch;

    const assembled = buildSystemPrompt(blankEntity(), ch.systemPrompt, imported);
    expect(assembled.length).toBeGreaterThan(DEFAULT_CHANNEL_PREAMBLE.length);
    // Exactly one thing assembled, and it is not the floor.
    expect(assembled.startsWith(DEFAULT_CHANNEL_PREAMBLE)).toBe(false);
  });

  it('emits the boilerplate exactly once, never doubled', () => {
    const ch = createChannel('doubled?', DEFAULT_CHANNEL_PREAMBLE);
    const dflt = getEntity(DEFAULT_ENTITY_ID)!;

    // Both layers hold the boilerplate; layer 4 is skipped, layer 5 sends it,
    // the floor sees a non-empty parts and stays out. 28 chars, as Round 164.
    const assembled = buildSystemPrompt(dflt, ch.systemPrompt);
    expect(assembled).toBe(DEFAULT_CHANNEL_PREAMBLE);
  });
});
