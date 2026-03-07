import { Hono } from 'hono';
import { getAllChannels, createChannel } from '../db/queries.js';

const app = new Hono();

app.get('/channels', (c) => {
  const channels = getAllChannels();
  return c.json(channels);
});

app.post('/channels', async (c) => {
  const { name, systemPrompt } = await c.req.json<{
    name: string;
    systemPrompt?: string;
  }>();

  if (!name?.trim()) {
    return c.json({ error: 'Channel name is required' }, 400);
  }

  const channel = createChannel(name.trim(), systemPrompt?.trim() || 'You are a helpful assistant.');
  return c.json(channel, 201);
});

export { app as channelRoutes };
