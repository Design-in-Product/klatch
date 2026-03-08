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
} from '../db/queries.js';
import type { ModelId } from '@klatch/shared';
import { AVAILABLE_MODELS, ENTITY_COLORS, DEFAULT_ENTITY_ID } from '@klatch/shared';

const MAX_ENTITIES_PER_CHANNEL = 5;

const app = new Hono();

// ── Entity CRUD ──────────────────────────────────────────────

app.get('/entities', (c) => {
  const entities = getAllEntities();
  return c.json(entities);
});

app.post('/entities', async (c) => {
  const { name, model, systemPrompt, color } = await c.req.json<{
    name: string;
    model?: ModelId;
    systemPrompt?: string;
    color?: string;
  }>();

  if (!name?.trim()) {
    return c.json({ error: 'Entity name is required' }, 400);
  }

  const entityModel = model || 'claude-opus-4-6';
  if (!(entityModel in AVAILABLE_MODELS)) {
    return c.json({ error: `Invalid model: ${entityModel}` }, 400);
  }

  // Pick the next unused color, or use the provided one
  const entityColor = color || pickNextColor();

  const entity = createEntity(
    name.trim(),
    entityModel as ModelId,
    systemPrompt?.trim() || 'You are a helpful assistant.',
    entityColor
  );
  return c.json(entity, 201);
});

app.patch('/entities/:id', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json<{
    name?: string;
    model?: ModelId;
    systemPrompt?: string;
    color?: string;
  }>();

  if (body.model && !(body.model in AVAILABLE_MODELS)) {
    return c.json({ error: `Invalid model: ${body.model}` }, 400);
  }

  const updated = updateEntity(id, {
    name: body.name?.trim(),
    model: body.model,
    systemPrompt: body.systemPrompt?.trim(),
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
