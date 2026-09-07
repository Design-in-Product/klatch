import { Hono } from 'hono';
import {
  getAllEntities,
  getEntity,
  createEntity,
  updateEntity,
  deleteEntity,
  getChannel,
  getChannelEntities,
  assignEntityToChannel,
  removeEntityFromChannel,
  getChannelEntityCount,
  getKlatchesForEntity,
} from '../db/queries.js';
import type { ModelId, EffortLevel } from '@klatch/shared';
import { ENTITY_COLORS, DEFAULT_ENTITY_ID, DEFAULT_MODEL, DEFAULT_CHANNEL_PREAMBLE } from '@klatch/shared';
import { isValidModel, effortLevelsForModel } from './models.js';

const VALID_EFFORT_LEVELS: EffortLevel[] = ['low', 'medium', 'high', 'xhigh', 'max'];

/** Per-model effort gating, derived from the model's discovered capabilities. */
async function effortAllowedForModel(effort: EffortLevel, model: string): Promise<boolean> {
  const levels = await effortLevelsForModel(model);
  // Permissive when capability data is absent for an otherwise-valid model.
  return levels === null ? true : levels.includes(effort);
}

const MAX_ENTITIES_PER_CHANNEL = 5;

const app = new Hono();

// ── Entity CRUD ──────────────────────────────────────────────

app.get('/entities', (c) => {
  const entities = getAllEntities();
  return c.json(entities);
});

// Cross-reference: klatches a given entity participates in (powers the 1-1 chat "Also in" surface).
app.get('/entities/:id/klatches', (c) => {
  const id = c.req.param('id');
  if (!getEntity(id)) {
    return c.json({ error: 'Entity not found' }, 404);
  }
  return c.json(getKlatchesForEntity(id));
});

app.post('/entities', async (c) => {
  const { name, handle, model, effort, systemPrompt, color } = await c.req.json<{
    name: string;
    handle?: string;
    model?: ModelId;
    effort?: EffortLevel;
    systemPrompt?: string;
    color?: string;
  }>();

  if (!name?.trim()) {
    return c.json({ error: 'Entity name is required' }, 400);
  }

  const entityModel = model || DEFAULT_MODEL;
  if (!(await isValidModel(entityModel))) {
    return c.json({ error: `Invalid model: ${entityModel}` }, 400);
  }

  if (effort && !VALID_EFFORT_LEVELS.includes(effort)) {
    return c.json({ error: `Invalid effort level: ${effort}` }, 400);
  }

  if (effort && !(await effortAllowedForModel(effort, entityModel))) {
    return c.json({ error: `Effort level "${effort}" is not available for model ${entityModel}` }, 400);
  }

  // Pick the next unused color, or use the provided one
  const entityColor = color || pickNextColor();

  // The boilerplate default stays here, and stays *sent*, unlike the identical
  // string at layer 4 (`channels.ts` → skipped by assembly, Round 162). Not an
  // oversight: Round 162's predicate is a fall-through rule, and layer 5 has
  // nothing beneath it to fall through to. Dropping it here would hand the model
  // a zero-length system prompt for every agent whose prompt the user left
  // blank. Pinned by `round164-layer5-is-terminal.test.ts`.
  const entity = createEntity(
    name.trim(),
    entityModel as ModelId,
    systemPrompt?.trim() || DEFAULT_CHANNEL_PREAMBLE,
    entityColor,
    handle?.trim() || undefined,
    effort
  );
  return c.json(entity, 201);
});

app.patch('/entities/:id', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json<{
    name?: string;
    handle?: string | null;
    model?: ModelId;
    effort?: EffortLevel;
    // `| null` because the wire can carry it and the route now handles it —
    // typing it `string` while the code guards with `?.` would read as a
    // redundant guard and invite the next tidy-up to remove it.
    systemPrompt?: string | null;
    color?: string;
  }>();

  if (body.model && !(await isValidModel(body.model))) {
    return c.json({ error: `Invalid model: ${body.model}` }, 400);
  }

  if (body.effort && !VALID_EFFORT_LEVELS.includes(body.effort)) {
    return c.json({ error: `Invalid effort level: ${body.effort}` }, 400);
  }

  // Validate xhigh/max effort against target model (which may be changing in same request)
  const targetModel = body.model || getEntity(id)?.model;
  if (body.effort && targetModel && !(await effortAllowedForModel(body.effort, targetModel))) {
    return c.json({ error: `Effort level "${body.effort}" is not available for model ${targetModel}` }, 400);
  }

  const updated = updateEntity(id, {
    name: body.name?.trim(),
    handle: body.handle !== undefined ? (body.handle?.trim() || null) : undefined,
    model: body.model,
    effort: body.effort,
    // Substitute on *empty*, pass through on *absent*. `updateEntity` coalesces
    // with `??`, which takes `''` as a value rather than an absence, so the
    // bare `?.trim()` twelve lines below the create route's fallback let a
    // `{"systemPrompt": ""}` PATCH store a zero-length prompt — including on
    // the seeded default agent, which `:139` guards against DELETE and nothing
    // guarded against being emptied. Reachable in two UI gestures (open the
    // agent, clear the field, save). Round 166; found by Theseus, Round 165.
    //
    // This route substitutes and the two import writers deliberately do not —
    // see the note at `import/klatch-import.ts`. A user clearing a field is
    // erasure, not selection (Iris's prefill ruling, 2026-09-07): nothing in
    // the UI expresses blank as a choice, so the safe read is the same one
    // create already makes.
    //
    // The `?.` is load-bearing, not defensive habit. The pre-Round-166 code was
    // a bare `body.systemPrompt?.trim()`, which did two jobs at once — skip on
    // absent, survive a non-string. The ternary took over the first and dropped
    // the second, so `{"systemPrompt": null}` took the false branch (`null !==
    // undefined`) and threw on `.trim()`: a 500 where Round 165 had a 200.
    // Theseus found it at the endpoint in Round 167 and checked the blast
    // radius — not reachable from the shipped UI (`api/client.ts` types it
    // `systemPrompt?: string`, `EntityManager.tsx` always sends `.trim()` of a
    // string), and nothing stored was corrupted. API-surface robustness, not a
    // user bug. `null` now substitutes, which is the same reading of a cleared
    // field the empty string gets. A non-string like `42` still throws, as it
    // did before Round 166 — a `typeof` guard would make the route total at the
    // cost of silently swallowing a client bug, so it stays loud.
    systemPrompt: body.systemPrompt === undefined
      ? undefined
      : (body.systemPrompt?.trim() || DEFAULT_CHANNEL_PREAMBLE),
    color: body.color,
  });

  if (!updated) {
    return c.json({ error: 'Entity not found' }, 404);
  }

  return c.json(updated);
});

app.delete('/entities/:id', (c) => {
  const id = c.req.param('id');

  if (id === DEFAULT_ENTITY_ID) {
    return c.json({ error: 'Cannot delete the default entity' }, 400);
  }

  const entity = getEntity(id);
  if (!entity) {
    return c.json({ error: 'Entity not found' }, 404);
  }

  deleteEntity(id);
  return c.json({ deleted: true });
});

// ── Channel-Entity Assignment ────────────────────────────────

app.get('/channels/:channelId/entities', (c) => {
  const channelId = c.req.param('channelId');

  const channel = getChannel(channelId);
  if (!channel) {
    return c.json({ error: 'Channel not found' }, 404);
  }

  const entities = getChannelEntities(channelId);
  return c.json(entities);
});

app.post('/channels/:channelId/entities', async (c) => {
  const channelId = c.req.param('channelId');
  const { entityId } = await c.req.json<{ entityId: string }>();

  const channel = getChannel(channelId);
  if (!channel) {
    return c.json({ error: 'Channel not found' }, 404);
  }

  const entity = getEntity(entityId);
  if (!entity) {
    return c.json({ error: 'Entity not found' }, 404);
  }

  const count = getChannelEntityCount(channelId);
  if (count >= MAX_ENTITIES_PER_CHANNEL) {
    return c.json({ error: `Maximum ${MAX_ENTITIES_PER_CHANNEL} entities per channel` }, 400);
  }

  assignEntityToChannel(channelId, entityId);
  const entities = getChannelEntities(channelId);
  return c.json(entities);
});

app.delete('/channels/:channelId/entities/:entityId', (c) => {
  const channelId = c.req.param('channelId');
  const entityId = c.req.param('entityId');

  const count = getChannelEntityCount(channelId);
  if (count <= 1) {
    return c.json({ error: 'Cannot remove the last entity from a channel' }, 400);
  }

  const removed = removeEntityFromChannel(channelId, entityId);
  if (!removed) {
    return c.json({ error: 'Entity not assigned to this channel' }, 404);
  }

  const entities = getChannelEntities(channelId);
  return c.json(entities);
});

// ── Helpers ──────────────────────────────────────────────────

function pickNextColor(): string {
  const entities = getAllEntities();
  const usedColors = new Set(entities.map((e) => e.color));
  const available = ENTITY_COLORS.filter((c) => !usedColors.has(c));
  return available.length > 0 ? available[0] : ENTITY_COLORS[entities.length % ENTITY_COLORS.length];
}

export { app as entityRoutes };
