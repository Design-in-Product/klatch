import { Hono } from 'hono';
import { getAllChannels, createChannel, updateChannel } from '../db/queries.js';
import type { ModelId } from '@klatch/shared';
import { AVAILABLE_MODELS } from '@klatch/shared';

const app = new Hono();

app.get('/channels', (c) => {
  const channels = getAllChannels();
  return c.json(channels);
});

app.post('/channels', async (c) => {
  const { name, systemPrompt, model } = await c.req.json<{
    name: string;
    systemPrompt?: string;
    model?: ModelId;
  }>();

  if (!name?.trim()) {
    return c.json({ error: 'Channel name is required' }, 400);
  }

  if (model && !(model in AVAILABLE_MODELS)) {
    return c.json({ error: `Invalid model: ${model}` }, 400);
  }

  const channel = createChannel(
    name.trim(),
    systemPrompt?.trim() || 'You are a helpful assistant.',
    model
  );
  return c.json(channel, 201);
});

app.patch('/channels/:id', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json<{
    name?: string;
    systemPrompt?: string;
    model?: ModelId;
  }>();

  if (body.model && !(body.model in AVAILABLE_MODELS)) {
    return c.json({ error: `Invalid model: ${body.model}` }, 400);
  }

  const updated = updateChannel(id, {
    name: body.name?.trim(),
    systemPrompt: body.systemPrompt?.trim(),
    model: body.model,
  });

  if (!updated) {
    return c.json({ error: 'Channel not found' }, 404);
  }

  return c.json(updated);
});

export { app as channelRoutes };
