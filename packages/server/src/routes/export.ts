/**
 * Export routes — Step 10 Phase 2.
 *
 * GET /channels/:id/export — produces a context package zip per the
 * Phase 1 canonical format spec (docs/plans/STEP-10-PHASE-1-PACKAGE-FORMAT.md).
 */

import { Hono } from 'hono';
import AdmZip from 'adm-zip';
import Anthropic from '@anthropic-ai/sdk';
import {
  getChannel,
  getChannelEntities,
  getMessages,
  appendReflection,
  getMessageArtifacts,
} from '../db/queries.js';
import type { Message } from '@klatch/shared';
import { readFile } from '../files/storage.js';
import { adaptToClaudeCode, resolveTemplates } from '../export/transport-claude-code.js';
import { adaptToClaudeAi } from '../export/transport-claude-ai.js';
import { assembleChannelManifest } from '../export/assemble.js';

const app = new Hono();

/**
 * GET /channels/:id/export — Export a channel as a context package zip
 *
 * Query params:
 *   ?briefing=true — generate self-authored handoff briefings for each entity (Phase 3.5a)
 *
 * Returns a zip file containing:
 *   manifest.json, conversation.jsonl, layer sidecars, file attachments
 */
app.get('/channels/:id/export', async (c) => {
  const channelId = c.req.param('id');
  const includeBriefing = c.req.query('briefing') === 'true';
  const includeExtraction = c.req.query('extract') === 'true';

  const assembled = await assembleChannelManifest(channelId, { includeBriefing, includeExtraction });
  if (!assembled) return c.json({ error: 'Channel not found' }, 404);
  if (assembled.entities.length === 0) {
    return c.json({ error: 'No entities assigned to this channel' }, 400);
  }
  const { manifest, channel, project, channelFiles, projectFiles, messages } = assembled;
  const allScopedFiles = [...projectFiles, ...channelFiles];

  // Build sidecar content
  const instructionsMd = project?.instructions?.trim() || '';
  const memoryMd = project?.memory?.trim() || '';
  const contextMd = channel.systemPrompt?.trim() || '';
  const conversationJsonl = buildConversationJsonl(messages, channelId);

  // Assemble the zip
  const zip = new AdmZip();

  // Manifest
  zip.addFile('manifest.json', Buffer.from(JSON.stringify(manifest, null, 2), 'utf-8'));

  // Layer sidecars
  zip.addFile('layer_2_instructions.md', Buffer.from(instructionsMd, 'utf-8'));
  zip.addFile('layer_3_memory.md', Buffer.from(memoryMd, 'utf-8'));
  zip.addFile('layer_4_context.md', Buffer.from(contextMd, 'utf-8'));

  // Conversation history
  zip.addFile('conversation.jsonl', Buffer.from(conversationJsonl, 'utf-8'));

  // File attachments
  for (const fileRef of allScopedFiles) {
    const content = readFile(fileRef.storageKey);
    if (content) {
      zip.addFile(`files/${fileRef.id}_${fileRef.name}`, content);
    }
  }

  // Return the zip
  const zipBuffer = zip.toBuffer();
  const filename = `${channel.name.replace(/[^a-zA-Z0-9._-]/g, '_')}-export.zip`;

  c.header('Content-Type', 'application/zip');
  c.header('Content-Disposition', `attachment; filename="${filename}"`);
  c.header('Content-Length', zipBuffer.length.toString());
  return c.body(zipBuffer as unknown as ArrayBuffer);
});

/**
 * GET /channels/:id/export-preview — Preview export manifest without producing a zip
 *
 * Returns the manifest JSON only. Supports ?briefing=true and ?extract=true
 * for field note generation. Used by the export review UI.
 */
app.get('/channels/:id/export-preview', async (c) => {
  const channelId = c.req.param('id');
  const includeBriefing = c.req.query('briefing') === 'true';
  const includeExtraction = c.req.query('extract') === 'true';

  const assembled = await assembleChannelManifest(channelId, { includeBriefing, includeExtraction });
  if (!assembled) return c.json({ error: 'Channel not found' }, 404);
  if (assembled.entities.length === 0) return c.json({ error: 'No entities assigned' }, 400);

  return c.json(assembled.manifest);
});

/**
 * GET /channels/:id/export/claude-code — Export for Claude Code environment
 *
 * Produces a zip structured for dropping into a Claude Code project directory:
 *   CLAUDE.md     — reverse kit briefing + project instructions (L2) + channel context (L4)
 *   MEMORY.md     — project memory (L3) + behavioral field notes (L5)
 *   files/        — file attachments from the package
 *
 * Supports ?briefing=true and ?extract=true for field note generation.
 */
app.get('/channels/:id/export/claude-code', async (c) => {
  const channelId = c.req.param('id');
  const includeBriefing = c.req.query('briefing') === 'true';
  const includeExtraction = c.req.query('extract') === 'true';

  const assembled = await assembleChannelManifest(channelId, { includeBriefing, includeExtraction });
  if (!assembled) return c.json({ error: 'Channel not found' }, 404);
  if (assembled.entities.length === 0) return c.json({ error: 'No entities assigned' }, 400);
  const { manifest, channel, project, channelFiles, projectFiles } = assembled;
  const allScopedFiles = [...projectFiles, ...channelFiles];

  // Adapt to Claude Code format
  const ccExport = adaptToClaudeCode(manifest);

  // Resolve template placeholders with actual sidecar content
  const resolved = resolveTemplates(ccExport, {
    layer2Instructions: project?.instructions?.trim() || undefined,
    layer3Memory: project?.memory?.trim() || undefined,
    layer4Context: channel.systemPrompt?.trim() || undefined,
  });

  // Build the zip
  const zip = new AdmZip();
  zip.addFile('CLAUDE.md', Buffer.from(resolved.claudeMd, 'utf-8'));
  zip.addFile('MEMORY.md', Buffer.from(resolved.memoryMd, 'utf-8'));

  // File attachments
  for (const fileRef of allScopedFiles) {
    const content = readFile(fileRef.storageKey);
    if (content) {
      zip.addFile(`files/${fileRef.name}`, content);
    }
  }

  const zipBuffer = zip.toBuffer();
  const filename = `${channel.name.replace(/[^a-zA-Z0-9._-]/g, '_')}-claude-code.zip`;

  c.header('Content-Type', 'application/zip');
  c.header('Content-Disposition', `attachment; filename="${filename}"`);
  c.header('Content-Length', zipBuffer.length.toString());
  return c.body(zipBuffer as unknown as ArrayBuffer);
});

/**
 * GET /channels/:id/export/claude-ai — Export for claude.ai environment
 *
 * Produces a zip structured like a claude.ai data export:
 *   conversations.json  — the conversation in claude.ai message format
 *   projects.json       — project metadata + knowledge base docs
 *   memories.json       — field notes as memory items
 *
 * This is the reverse of the claude.ai import pipeline, enabling round-trip:
 * claude.ai → Klatch → claude.ai.
 */
app.get('/channels/:id/export/claude-ai', async (c) => {
  const channelId = c.req.param('id');
  const includeBriefing = c.req.query('briefing') === 'true';
  const includeExtraction = c.req.query('extract') === 'true';

  const assembled = await assembleChannelManifest(channelId, { includeBriefing, includeExtraction });
  if (!assembled) return c.json({ error: 'Channel not found' }, 404);
  if (assembled.entities.length === 0) return c.json({ error: 'No entities assigned' }, 400);
  const { manifest, channel, project, projectFiles, messages } = assembled;

  // Load KB file contents for project docs
  const fileContents = new Map<string, string>();
  for (const fileRef of projectFiles) {
    if (fileRef.mimeType.startsWith('text/')) {
      const buf = readFile(fileRef.storageKey);
      if (buf) fileContents.set(`files/${fileRef.id}_${fileRef.name}`, buf.toString('utf-8'));
    }
  }

  // Adapt to claude.ai format
  const layer2Content = project?.instructions?.trim() || undefined;
  const claudeAiData = adaptToClaudeAi(manifest, messages, layer2Content, fileContents);

  // Build the zip
  const zip = new AdmZip();
  zip.addFile('conversations.json', Buffer.from(claudeAiData.conversationsJson, 'utf-8'));
  zip.addFile('projects.json', Buffer.from(claudeAiData.projectsJson, 'utf-8'));
  zip.addFile('memories.json', Buffer.from(claudeAiData.memoriesJson, 'utf-8'));

  const zipBuffer = zip.toBuffer();
  const filename = `${channel.name.replace(/[^a-zA-Z0-9._-]/g, '_')}-claude-ai.zip`;

  c.header('Content-Type', 'application/zip');
  c.header('Content-Disposition', `attachment; filename="${filename}"`);
  c.header('Content-Length', zipBuffer.length.toString());
  return c.body(zipBuffer as unknown as ArrayBuffer);
});

/**
 * POST /channels/:id/reflect — Trigger a micro-reflection for a channel's entities
 *
 * Phase 3.5c: The entity reviews recent conversation and notes 1-3 things
 * it learned about how to work effectively with the user.
 *
 * Reflections are stored on the entity and included in exports.
 */
app.post('/channels/:id/reflect', async (c) => {
  const channelId = c.req.param('id');
  const channel = getChannel(channelId);
  if (!channel) {
    return c.json({ error: 'Channel not found' }, 404);
  }

  const entities = getChannelEntities(channelId);
  if (entities.length === 0) {
    return c.json({ error: 'No entities assigned to this channel' }, 400);
  }

  const messages = getMessages(channelId);
  if (messages.length === 0) {
    return c.json({ error: 'No messages in channel — nothing to reflect on' }, 400);
  }

  // Take recent messages for context (last 50)
  const recent = messages.slice(-50);
  const history = recent.map((m) => {
    const role = m.role === 'user' ? 'User' : 'Assistant';
    return `${role}: ${m.content.slice(0, 300)}`;
  }).join('\n\n');

  const reflections: Array<{ entityId: string; entityName: string; observation: string }> = [];

  // Lazy-init Anthropic client
  let client: Anthropic | null = null;
  const getClient = () => { if (!client) client = new Anthropic(); return client; };

  for (const entity of entities) {
    try {
      const response = await getClient().messages.create({
        model: entity.model,
        max_tokens: 256,
        system: entity.systemPrompt || 'You are a helpful assistant.',
        messages: [{
          role: 'user',
          content: `Here is a recent conversation you've been part of:\n\n${history}\n\n---\n\nBefore this session closes, note 1-3 things you learned about how to work effectively with this user that a future session of yours should know. Be specific. If nothing new was learned this session, say "Nothing new to note."`,
        }],
      });

      const text = response.content
        .filter((block): block is Anthropic.TextBlock => block.type === 'text')
        .map((block) => block.text)
        .join('');

      if (text.trim() && !text.toLowerCase().includes('nothing new to note')) {
        const reflection = {
          observation: text.trim().slice(0, 500),
          createdAt: new Date().toISOString(),
          channelId,
          type: 'session-end' as const,
          ingress: 'klatch-ui',
        };
        appendReflection(entity.id, reflection);
        reflections.push({ entityId: entity.id, entityName: entity.name, observation: reflection.observation });
      }
    } catch (err) {
      console.error(`Reflection failed for entity ${entity.name}:`, err);
    }
  }

  return c.json({ reflections, count: reflections.length });
});

// ── Conversation JSONL builder ───────────────────────────────

function buildConversationJsonl(messages: Message[], channelId: string): string {
  const lines: string[] = [];

  for (const msg of messages) {
    const artifacts = getMessageArtifacts(msg.id);
    const row: any = {
      id: msg.id,
      role: msg.role,
      entity_id: msg.entityId || null,
      content: msg.content,
      status: msg.status,
      model: msg.model || null,
      created_at: msg.createdAt,
      original_timestamp: msg.originalTimestamp || null,
      original_id: msg.originalId || null,
    };

    if (artifacts.length > 0) {
      row.artifacts = artifacts.map((a) => ({
        id: a.id,
        type: a.type,
        tool_name: a.toolName || null,
        input_summary: a.inputSummary || null,
        content: a.content || null,
        file_name: a.fileName || null,
        file_mime_type: a.fileMimeType || null,
        file_size_bytes: a.fileSizeBytes || null,
        file_storage_key: a.fileStorageKey || null,
      }));
    }

    lines.push(JSON.stringify(row));
  }

  return lines.join('\n');
}

export const exportRoutes = app;
