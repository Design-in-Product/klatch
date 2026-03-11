import { Hono } from 'hono';
import fs from 'fs';
import path from 'path';
import { getAllChannelsEnriched, getChannel, getChannelStats, createChannel, updateChannel, deleteChannel } from '../db/queries.js';
import type { ModelId, InteractionMode } from '@klatch/shared';
import { AVAILABLE_MODELS, INTERACTION_MODES } from '@klatch/shared';

const app = new Hono();

app.get('/channels', (c) => {
  const channels = getAllChannelsEnriched();
  return c.json(channels);
});

app.get('/channels/:id/stats', (c) => {
  const id = c.req.param('id');
  const stats = getChannelStats(id);
  if (!stats) {
    return c.json({ error: 'Channel not found' }, 404);
  }
  return c.json(stats);
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

/**
 * GET /channels/:id/context-file
 *
 * Read a context file (CLAUDE.md, etc.) from the imported channel's original project.
 * Only available for channels with source_metadata.cwd.
 * Security: whitelisted filenames only, no path traversal.
 */
app.get('/channels/:id/context-file', (c) => {
  const id = c.req.param('id');
  const channel = getChannel(id);
  if (!channel) {
    return c.json({ error: 'Channel not found' }, 404);
  }

  if (!channel.sourceMetadata) {
    return c.json({ error: 'Channel has no source metadata' }, 400);
  }

  let meta: { cwd?: string };
  try {
    meta = JSON.parse(channel.sourceMetadata);
  } catch {
    return c.json({ error: 'Invalid source metadata' }, 400);
  }

  if (!meta.cwd) {
    return c.json({ error: 'No project path available for this channel' }, 400);
  }

  const requestedFile = c.req.query('path') || 'CLAUDE.md';

  // Security: only allow specific files, no traversal
  const ALLOWED_FILES = ['CLAUDE.md', '.claude/CLAUDE.md'];
  if (!ALLOWED_FILES.includes(requestedFile)) {
    return c.json({ error: `File not allowed. Allowed: ${ALLOWED_FILES.join(', ')}` }, 403);
  }

  const fullPath = path.join(meta.cwd, requestedFile);

  // Extra safety: verify resolved path is within cwd
  const resolved = path.resolve(fullPath);
  const cwdResolved = path.resolve(meta.cwd);
  if (!resolved.startsWith(cwdResolved)) {
    return c.json({ error: 'Path traversal not allowed' }, 403);
  }

  if (!fs.existsSync(fullPath)) {
    return c.json({
      error: 'File not found',
      path: fullPath,
      hint: `No ${requestedFile} found at ${meta.cwd}. You can paste your project instructions manually.`,
    }, 404);
  }

  const content = fs.readFileSync(fullPath, 'utf-8');
  return c.json({ content, path: fullPath });
});

export { app as channelRoutes };
