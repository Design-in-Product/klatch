import { Hono } from 'hono';
import { getAllChannels, getChannel, createChannel, updateChannel, deleteChannel } from '../db/queries.js';
import type { ModelId, InteractionMode } from '@klatch/shared';
import { AVAILABLE_MODELS, INTERACTION_MODES } from '@klatch/shared';

const app = new Hono();

app.get('/channels', (c) => {
  const channels = getAllChannels();
  return c.json(channels);
});

app.post('/channels', async (c) => {
  const { name, systemPrompt, model, mode } = await c.req.json<{
    name: string;
    systemPrompt?: string;
    model?: ModelId;
    mode?: InteractionMode;
  }>();

  if (!name?.trim()) {
    return c.json({ error: 'Channel name is required' }, 400);
  }

  if (model && !(model in AVAILABLE_MODELS)) {
    return c.json({ error: `Invalid model: ${model}` }, 400);
  }

  if (mode && !(mode in INTERACTION_MODES)) {
    return c.json({ error: `Invalid mode: ${mode}` }, 400);
  }

  const channel = createChannel(
    name.trim(),
    systemPrompt?.trim() || 'You are a helpful assistant.',
    model,
    mode
  );
  return c.json(channel, 201);
});

app.patch('/channels/:id', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json<{
    name?: string;
    systemPrompt?: string;
    model?: ModelId;
    mode?: InteractionMode;
  }>();

  if (body.model && !(body.model in AVAILABLE_MODELS)) {
    return c.json({ error: `Invalid model: ${body.model}` }, 400);
  }

  if (body.mode && !(body.mode in INTERACTION_MODES)) {
    return c.json({ error: `Invalid mode: ${body.mode}` }, 400);
  }

  const updated = updateChannel(id, {
    name: body.name?.trim(),
    systemPrompt: body.systemPrompt?.trim(),
    model: body.model,
    mode: body.mode,
  });

  if (!updated) {
    return c.json({ error: 'Channel not found' }, 404);
  }

  return c.json(updated);
});

app.delete('/channels/:id', (c) => {
  const id = c.req.param('id');

  // Prevent deleting the default channel
  if (id === 'default') {
    return c.json({ error: 'Cannot delete the default channel' }, 400);
  }

  const channel = getChannel(id);
  if (!channel) {
    return c.json({ error: 'Channel not found' }, 404);
  }

  deleteChannel(id);
  return c.json({ deleted: true });
});

export { app as channelRoutes };
