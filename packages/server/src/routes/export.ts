/**
 * Export routes — Step 10 Phase 2.
 *
 * GET /channels/:id/export — produces a context package zip per the
 * Phase 1 canonical format spec (docs/plans/STEP-10-PHASE-1-PACKAGE-FORMAT.md).
 */

import { Hono } from 'hono';
import AdmZip from 'adm-zip';
import { v4 as uuidv4 } from 'uuid';
import Anthropic from '@anthropic-ai/sdk';
import {
  getChannel,
  getChannelEntities,
  getMessages,
  getProjectForChannel,
  appendReflection,
  getChannelFiles,
  getProjectFiles,
  getMessageArtifacts,
} from '../db/queries.js';
import type { Channel, Entity, Message, Project, FileWithRef, MessageArtifact, MicroReflection } from '@klatch/shared';
import { readFile } from '../files/storage.js';
import { buildSystemPrompt } from '../claude/client.js';
import { generateHandoffBriefing, type FieldNote } from '../export/briefing.js';
import { extractBehavioralPatterns } from '../export/external-extraction.js';

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

  const channel = getChannel(channelId);
  if (!channel) {
    return c.json({ error: 'Channel not found' }, 404);
  }

  const entities = getChannelEntities(channelId);
  if (entities.length === 0) {
    return c.json({ error: 'No entities assigned to this channel' }, 400);
  }

  const project = channel.projectId ? (getProjectForChannel(channelId) ?? null) : null;
  const messages = getMessages(channelId);
  const channelFiles = getChannelFiles(channelId);
  const projectFiles = project ? getProjectFiles(project.id) : [];
  const allScopedFiles = [...projectFiles, ...channelFiles];

  // Generate handoff briefings if requested
  const entityFieldNotes = new Map<string, FieldNote[]>();
  if (includeBriefing && messages.length > 0) {
    const channelFileNames = channelFiles.map((f) => `- ${f.name} (${f.mimeType})`);
    const projectFileNames = projectFiles.map((f) => `- ${f.name} (${f.mimeType})`);

    for (const entity of entities) {
      try {
        const systemPrompt = buildSystemPrompt(entity, channel.systemPrompt, channel, project, channelFileNames, projectFileNames);
        const notes = await generateHandoffBriefing(entity, systemPrompt, messages);
        entityFieldNotes.set(entity.id, notes);
      } catch (err) {
        // If briefing generation fails for an entity, continue with null field_notes
        console.error(`Briefing generation failed for entity ${entity.name}:`, err);
      }
    }
  }

  // Generate external behavioral extraction if requested
  if (includeExtraction && messages.length >= 5) {
    for (const entity of entities) {
      try {
        const extractedNotes = await extractBehavioralPatterns(entity.name, messages);
        const existing = entityFieldNotes.get(entity.id) || [];
        entityFieldNotes.set(entity.id, [...existing, ...extractedNotes]);
      } catch (err) {
        console.error(`External extraction failed for entity ${entity.name}:`, err);
      }
    }
  }

  // Build the manifest
  const packageId = uuidv4();
  const now = new Date().toISOString();

  const manifest = buildManifest(packageId, now, channel, project, entities, channelFiles, projectFiles, messages, entityFieldNotes);

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

// ── Manifest builder ─────────────────────────────────────────

function buildManifest(
  packageId: string,
  createdAt: string,
  channel: Channel,
  project: Project | null,
  entities: Entity[],
  channelFiles: FileWithRef[],
  projectFiles: FileWithRef[],
  messages: Message[],
  entityFieldNotes?: Map<string, FieldNote[]>,
) {
  const instructionsLength = project?.instructions?.trim().length || 0;
  const memoryLength = project?.memory?.trim().length || 0;
  const contextLength = channel.systemPrompt?.trim().length || 0;

  // Build provenance chain
  const provenance: any[] = [];

  // If imported, the original source is the first hop
  if (channel.source && channel.source !== 'native') {
    const meta = parseSourceMetadata(channel.sourceMetadata);
    provenance.push({
      event_id: uuidv4(),
      source: channel.source,
      at: meta?.importedAt || meta?.firstTimestamp || createdAt,
      summary: `Original ${channel.source === 'claude-code' ? 'Claude Code' : 'claude.ai'} session`,
      ...(meta?.cwd ? { path: meta.cwd } : {}),
      ...(meta?.originalSessionId ? { session_id: meta.originalSessionId } : {}),
      ...(meta?.originalProjectUuid ? { project_uuid: meta.originalProjectUuid } : {}),
      layer_fidelity: null,
      integrity: null,
    });
  }

  // The current export is the last hop
  provenance.push({
    event_id: uuidv4(),
    source: 'klatch',
    at: createdAt,
    summary: 'Exported from Klatch',
    instance: 'klatch-local',
    channel_id: channel.id,
    layer_fidelity: {
      L1: channel.source !== 'native' ? 'full' : 'absent',
      L2: instructionsLength > 0 ? 'full' : 'absent',
      L3: memoryLength > 0 || projectFiles.length > 0 ? 'full' : 'absent',
      L4: contextLength > 0 || channelFiles.length > 0 ? 'full' : 'absent',
      L5: 'full',
    },
    integrity: null,
  });

  // Build file entries
  const allFiles = [...projectFiles, ...channelFiles];
  const fileEntries = allFiles.map((f) => ({
    id: f.id,
    name: f.name,
    mime_type: f.mimeType,
    size_bytes: f.sizeBytes,
    length_chars: f.sizeBytes, // approximation for binary; exact for UTF-8 text
    ref: `files/${f.id}_${f.name}`,
    scope: f.scope,
    scope_id: f.scopeId,
    ref_type: f.refType,
    added_at: f.addedAt,
    source: f.addedBy || 'unknown',
    trust: 'unattributed',
  }));

  // Deduplicate files that appear at both project and channel scope
  const seenFileIds = new Set<string>();
  const dedupedFiles = fileEntries.filter((f) => {
    if (seenFileIds.has(f.id)) return false;
    seenFileIds.add(f.id);
    return true;
  });

  // Compaction state
  let compactionState = null;
  if (channel.compactionState) {
    try {
      const parsed = JSON.parse(channel.compactionState);
      compactionState = {
        summary: parsed.summary,
        before_message_id: parsed.beforeMessageId,
        compacted_at: parsed.timestamp,
      };
    } catch { /* ignore malformed */ }
  }

  return {
    format_version: '1.0.0',
    source_type: 'klatch',
    package_id: packageId,
    package_kind: 'klatch.context.v1',
    created_at: createdAt,

    provenance,

    project: project ? {
      id: project.id,
      name: project.name,
      instructions: {
        ref: 'layer_2_instructions.md',
        length_chars: instructionsLength,
      },
      memory: {
        ref: 'layer_3_memory.md',
        length_chars: memoryLength,
        memory_format: 'flat',
      },
      knowledge_base_file_ids: projectFiles.map((f) => f.id),
    } : null,

    conversation_context: {
      id: channel.id,
      name: channel.name,
      type: channel.type,
      mode: channel.mode,
      created_at: channel.createdAt,
      last_active_at: messages.length > 0 ? messages[messages.length - 1].createdAt : channel.createdAt,
      context: {
        ref: 'layer_4_context.md',
        length_chars: contextLength,
      },
      pinned_file_ids: channelFiles.map((f) => f.id),
      compaction_state: compactionState,
    },

    entities: entities.map((e) => ({
      id: e.id,
      name: e.name,
      handle: e.handle || null,
      model: e.model,
      effort: e.effort,
      color: e.color,
      prompt: e.systemPrompt,
      prompt_length_chars: e.systemPrompt?.length || 0,
      field_notes: mergeFieldNotes(entityFieldNotes?.get(e.id), e.reflections),
    })),

    files: dedupedFiles,

    conversation_history: {
      ref: 'conversation.jsonl',
      message_count: messages.length,
      first_message_at: messages.length > 0 ? messages[0].createdAt : null,
      last_message_at: messages.length > 0 ? messages[messages.length - 1].createdAt : null,
    },

    extensions: {
      klatch: {},
    },
  };
}

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

// ── Helpers ──────────────────────────────────────────────────

/** Merge handoff briefing notes with accumulated micro-reflections into a single field_notes array */
function mergeFieldNotes(briefingNotes?: FieldNote[], reflections?: MicroReflection[]): any[] | null {
  const notes: any[] = [];

  if (briefingNotes) {
    notes.push(...briefingNotes);
  }

  if (reflections && reflections.length > 0) {
    for (const r of reflections) {
      notes.push({
        observation: r.observation,
        citations: [],
        confidence: 'medium',
        source: 'micro-reflection',
        trust: 'agent-observed',
        status: 'draft',
        category: r.type === 'correction' ? 'course-corrections' : 'patterns',
      });
    }
  }

  return notes.length > 0 ? notes : null;
}

function parseSourceMetadata(raw?: string): Record<string, any> | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export const exportRoutes = app;
