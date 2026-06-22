import { Hono } from 'hono';
import fs from 'fs';
import path from 'path';
import { getAllChannelsEnriched, getChannel, getChannelStats, createChannel, updateChannel, deleteChannel, setChannelProject, getChannelEntities, getProjectForChannel, getChannelFiles, getProjectFiles, getEntity } from '../db/queries.js';
import { buildSystemPrompt } from '../claude/client.js';
import type { ModelId, InteractionMode, ChannelType } from '@klatch/shared';
import { INTERACTION_MODES } from '@klatch/shared';
import { isValidModel } from './models.js';

const app = new Hono();

app.get('/channels', (c) => {
  const channels = getAllChannelsEnriched();
  return c.json(channels);
});

/**
 * GET /channels/:id/prompt-debug
 *
 * Returns the fully assembled system prompt that would be sent to the Anthropic API,
 * broken down by layer. For debugging prompt assembly — not user-facing.
 */
app.get('/channels/:id/prompt-debug', (c) => {
  const id = c.req.param('id');
  const channel = getChannel(id);
  if (!channel) {
    return c.json({ error: 'Channel not found' }, 404);
  }

  const entities = getChannelEntities(id);
  const project = channel.projectId ? getProjectForChannel(id) : null;
  const entity = entities[0]; // Primary entity for the channel

  if (!entity) {
    return c.json({ error: 'No entity assigned to this channel' }, 400);
  }

  const channelFileList = getChannelFiles(id);
  const channelFileNames = channelFileList.map((f) => `- ${f.name} (${f.mimeType})`);
  const projectFileList = project ? getProjectFiles(project.id) : [];
  const projectFileNames = projectFileList.map((f) => `- ${f.name} (${f.mimeType})`);
  const assembled = buildSystemPrompt(entity, channel.systemPrompt, channel, project, channelFileNames, projectFileNames);

  return c.json({
    channelId: id,
    channelName: channel.name,
    channelType: channel.type,
    channelSource: channel.source,
    layers: {
      '1_kitBriefing': (channel.source && channel.source !== 'native')
        ? 'ACTIVE — imported channel gets kit briefing'
        : 'INACTIVE — native channel, no kit briefing',
      '2_projectInstructions': project?.instructions?.trim()
        ? `ACTIVE — from project "${project.name}" (${project.instructions.length} chars)`
        : project
          ? `EMPTY — project "${project.name}" has no instructions`
          : 'INACTIVE — no project linked',
      '3_projectMemory': (() => {
        const parts: string[] = [];
        if (project?.memory?.trim()) parts.push(`${project.memory.length} chars`);
        if (projectFileList.length > 0) parts.push(`${projectFileList.length} knowledge base file(s): ${projectFileList.map((f) => f.name).join(', ')}`);
        if (parts.length > 0) return `ACTIVE — from project "${project!.name}" (${parts.join('; ')})`;
        if (project) return `EMPTY — project "${project.name}" has no memory`;
        return 'INACTIVE — no project linked';
      })(),
      '4_channelAddendum': (() => {
        const parts: string[] = [];
        if (channel.systemPrompt?.trim()) parts.push(`${channel.systemPrompt.length} chars`);
        if (channelFileList.length > 0) parts.push(`${channelFileList.length} file(s) pinned: ${channelFileList.map((f) => f.name).join(', ')}`);
        return parts.length > 0 ? `ACTIVE — ${parts.join('; ')}` : 'EMPTY';
      })(),
      '5_entityPrompt': `"${entity.name}" — ${entity.systemPrompt?.length || 0} chars`,
    },
    assembledPrompt: assembled,
    assembledLength: assembled.length,
    projectId: channel.projectId || null,
    projectName: project?.name || null,
    entityName: entity.name,
  });
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
  const { name, systemPrompt, model, mode, type, projectId, entityIds } = await c.req.json<{
    name: string;
    systemPrompt?: string;
    model?: ModelId;
    mode?: InteractionMode;
    type?: ChannelType;
    projectId?: string;
    entityIds?: string[];
  }>();

  if (!name?.trim()) {
    return c.json({ error: 'Channel name is required' }, 400);
  }

  if (model && !(await isValidModel(model))) {
    return c.json({ error: `Invalid model: ${model}` }, 400);
  }

  if (mode && !(mode in INTERACTION_MODES)) {
    return c.json({ error: `Invalid mode: ${mode}` }, 400);
  }

  if (type && type !== 'chat' && type !== 'klatch') {
    return c.json({ error: `Invalid type: ${type}. Must be 'chat' or 'klatch'` }, 400);
  }

  // Validate the composition roster up front so a bad ID returns a clean 400
  // rather than tripping the FK constraint inside createChannel (a 500).
  if (entityIds !== undefined) {
    if (!Array.isArray(entityIds)) {
      return c.json({ error: 'entityIds must be an array of entity IDs' }, 400);
    }
    const missing = entityIds.filter((eid) => !getEntity(eid));
    if (missing.length > 0) {
      return c.json({ error: `Unknown entity ID(s): ${missing.join(', ')}` }, 400);
    }
  }

  // Type/roster coherence (Argus invariants finding 2026-06-21). A "chat" is 1:1 —
  // carrying multiple agents is structural incoherence, so reject it. Enforce at the
  // route only; createChannel stays permissive for imports/internal callers.
  //
  // NOTE: Argus also flagged klatch + empty-roster → default entity. On reflection
  // that's a *valid* 1-agent klatch (the spec allows klatch with ≥1 agent; the
  // default counts), and rejecting it breaks legitimate create-then-add flows
  // (round7). The "deliberate pick" is a client-UX guard, not an API invariant — so
  // we do NOT reject it. Revisit if the klatch-creation redesign (project-optional)
  // changes the contract.
  const resolvedType: ChannelType = type || 'chat';
  if (resolvedType === 'chat' && entityIds && entityIds.length > 1) {
    return c.json({ error: 'A chat is 1:1 — use type "klatch" for multiple agents' }, 400);
  }

  const channel = createChannel(
    name.trim(),
    systemPrompt?.trim() || 'You are a helpful assistant.',
    model,
    mode,
    type,
    entityIds
  );

  if (projectId) {
    setChannelProject(channel.id, projectId);
    channel.projectId = projectId;
  }

  return c.json(channel, 201);
});

app.patch('/channels/:id', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json<{
    name?: string;
    systemPrompt?: string;
    model?: ModelId;
    mode?: InteractionMode;
    projectId?: string | null;
  }>();

  if (body.model && !(await isValidModel(body.model))) {
    return c.json({ error: `Invalid model: ${body.model}` }, 400);
  }

  if (body.mode && !(body.mode in INTERACTION_MODES)) {
    return c.json({ error: `Invalid mode: ${body.mode}` }, 400);
  }

  // Handle project assignment/unassignment
  if (body.projectId !== undefined) {
    setChannelProject(id, body.projectId);
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
