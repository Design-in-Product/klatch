import { v4 as uuidv4 } from 'uuid';
import { getDb } from './index.js';
import type { Channel, ChannelType, ChannelStats, Message, Entity, Project, ModelId, InteractionMode, ChannelSource, KlatchFile, FileRef, FileRefScope, FileRefType, FileWithRef } from '@klatch/shared';
import { DEFAULT_MODEL, DEFAULT_ENTITY_ID, ENTITY_COLORS, DEFAULT_INTERACTION_MODE } from '@klatch/shared';

function rowToChannel(row: any): Channel {
  return {
    id: row.id,
    name: row.name,
    type: (row.type as ChannelType) || 'chat',
    systemPrompt: row.system_prompt,
    model: row.model || DEFAULT_MODEL,
    mode: (row.mode as InteractionMode) || DEFAULT_INTERACTION_MODE,
    createdAt: row.created_at,
    source: (row.source as ChannelSource) || 'native',
    sourceMetadata: row.source_metadata || undefined,
    compactionState: row.compaction_state || undefined,
    projectId: row.project_id || undefined,
  };
}

function rowToProject(row: any): Project {
  return {
    id: row.id,
    name: row.name,
    instructions: row.instructions || '',
    memory: row.memory || '',
    source: (row.source as ChannelSource) || 'native',
    sourceMetadata: row.source_metadata || '{}',
    createdAt: row.created_at,
  };
}

function rowToMessage(row: any): Message {
  return {
    id: row.id,
    channelId: row.channel_id,
    role: row.role,
    content: row.content,
    status: row.status,
    model: row.model || undefined,
    entityId: row.entity_id || undefined,
    createdAt: row.created_at,
    originalTimestamp: row.original_timestamp || undefined,
    originalId: row.original_id || undefined,
  };
}

function rowToEntity(row: any): Entity {
  return {
    id: row.id,
    name: row.name,
    handle: row.handle || undefined,
    model: row.model || DEFAULT_MODEL,
    systemPrompt: row.system_prompt,
    color: row.color || ENTITY_COLORS[0],
    createdAt: row.created_at,
  };
}

export function getChannel(id: string): Channel | undefined {
  const row = getDb().prepare('SELECT * FROM channels WHERE id = ?').get(id) as any;
  if (!row) return undefined;
  return rowToChannel(row);
}

export function getAllChannels(): Channel[] {
  const rows = getDb()
    .prepare(`
      SELECT c.*, COUNT(ce.entity_id) as entity_count
      FROM channels c
      LEFT JOIN channel_entities ce ON c.id = ce.channel_id
      GROUP BY c.id
      ORDER BY c.created_at ASC
    `)
    .all() as any[];
  return rows.map((row) => ({
    ...rowToChannel(row),
    entityCount: row.entity_count ?? 0,
  }));
}

/**
 * Get enriched channel list with message counts and last activity.
 * Used by sidebar to sort/group without per-channel API calls.
 */
export function getAllChannelsEnriched(): Channel[] {
  const rows = getDb()
    .prepare(`
      SELECT c.*,
        p.name as project_name,
        COUNT(DISTINCT ce.entity_id) as entity_count,
        (SELECT COUNT(*) FROM messages m WHERE m.channel_id = c.id) as message_count,
        (SELECT MAX(m.created_at) FROM messages m WHERE m.channel_id = c.id) as last_message_at
      FROM channels c
      LEFT JOIN channel_entities ce ON c.id = ce.channel_id
      LEFT JOIN projects p ON c.project_id = p.id
      GROUP BY c.id
      ORDER BY c.created_at ASC
    `)
    .all() as any[];
  return rows.map((row) => ({
    ...rowToChannel(row),
    projectName: row.project_name || undefined,
    entityCount: row.entity_count ?? 0,
    messageCount: row.message_count ?? 0,
    lastMessageAt: row.last_message_at || null,
  }));
}

/**
 * Get detailed stats for a single channel: message count, artifact count,
 * tool-use breakdown, and last activity timestamp.
 */
export function getChannelStats(channelId: string): ChannelStats | undefined {
  const db = getDb();

  // Verify channel exists
  const channel = db.prepare('SELECT id FROM channels WHERE id = ?').get(channelId);
  if (!channel) return undefined;

  // Message count and last activity
  const counts = db.prepare(`
    SELECT COUNT(*) as message_count, MAX(created_at) as last_message_at
    FROM messages WHERE channel_id = ?
  `).get(channelId) as { message_count: number; last_message_at: string | null };

  // Artifact count
  const artifactRow = db.prepare(`
    SELECT COUNT(*) as artifact_count
    FROM message_artifacts ma
    JOIN messages m ON ma.message_id = m.id
    WHERE m.channel_id = ?
  `).get(channelId) as { artifact_count: number };

  // Tool breakdown (tool_use artifacts only, sorted by frequency)
  const toolRows = db.prepare(`
    SELECT ma.tool_name as tool, COUNT(*) as count
    FROM message_artifacts ma
    JOIN messages m ON ma.message_id = m.id
    WHERE m.channel_id = ? AND ma.type = 'tool_use' AND ma.tool_name IS NOT NULL
    GROUP BY ma.tool_name
    ORDER BY count DESC
  `).all(channelId) as { tool: string; count: number }[];

  return {
    messageCount: counts.message_count,
    artifactCount: artifactRow.artifact_count,
    toolBreakdown: toolRows,
    lastMessageAt: counts.last_message_at,
  };
}

export function createChannel(name: string, systemPrompt: string, model?: ModelId, mode?: InteractionMode, type?: ChannelType): Channel {
  const db = getDb();
  const id = uuidv4();
  const now = new Date().toISOString();
  const channelModel = model || DEFAULT_MODEL;
  const channelMode = mode || DEFAULT_INTERACTION_MODE;
  const channelType: ChannelType = type || 'chat';

  const txn = db.transaction(() => {
    db.prepare('INSERT INTO channels (id, name, system_prompt, model, mode, type, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(id, name, systemPrompt, channelModel, channelMode, channelType, now);
    // Auto-assign default entity to new channels
    db.prepare('INSERT INTO channel_entities (channel_id, entity_id) VALUES (?, ?)')
      .run(id, DEFAULT_ENTITY_ID);
  });
  txn();

  return { id, name, type: channelType, systemPrompt, model: channelModel, mode: channelMode, createdAt: now, source: 'native' as ChannelSource };
}

export function updateChannel(
  id: string,
  updates: { name?: string; systemPrompt?: string; model?: ModelId; mode?: InteractionMode }
): Channel | undefined {
  const channel = getChannel(id);
  if (!channel) return undefined;

  const name = updates.name ?? channel.name;
  const systemPrompt = updates.systemPrompt ?? channel.systemPrompt;
  const model = updates.model ?? channel.model;
  const mode = updates.mode ?? channel.mode;

  getDb()
    .prepare('UPDATE channels SET name = ?, system_prompt = ?, model = ?, mode = ? WHERE id = ?')
    .run(name, systemPrompt, model, mode, id);

  return { ...channel, name, systemPrompt, model, mode };
}

/**
 * Store compaction state on a channel after the API returns a compaction block.
 * This tells the history builder to use the summary instead of full history.
 */
export function updateChannelCompaction(
  id: string,
  state: { summary: string; timestamp: string; beforeMessageId: string }
): void {
  getDb()
    .prepare('UPDATE channels SET compaction_state = ? WHERE id = ?')
    .run(JSON.stringify(state), id);
}

export function clearChannelCompaction(id: string): void {
  getDb()
    .prepare('UPDATE channels SET compaction_state = NULL WHERE id = ?')
    .run(id);
}

export function getMessage(id: string): Message | undefined {
  const row = getDb().prepare('SELECT * FROM messages WHERE id = ?').get(id) as any;
  if (!row) return undefined;
  return rowToMessage(row);
}

export function getMessages(channelId: string): Message[] {
  const rows = getDb()
    .prepare('SELECT * FROM messages WHERE channel_id = ? ORDER BY created_at ASC, rowid ASC')
    .all(channelId) as any[];
  return rows.map(rowToMessage);
}

export function insertMessage(
  channelId: string,
  role: 'user' | 'assistant',
  content: string,
  status: 'complete' | 'streaming' = 'complete',
  model?: ModelId,
  entityId?: string
): Message {
  const id = uuidv4();
  const now = new Date().toISOString();
  getDb()
    .prepare(
      'INSERT INTO messages (id, channel_id, role, content, status, model, entity_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    )
    .run(id, channelId, role, content, status, model || null, entityId || null, now);
  return { id, channelId, role, content, status, model, entityId, createdAt: now };
}

/** Create a user message + assistant placeholder in a single transaction */
export function createMessagePair(
  channelId: string,
  content: string,
  model?: ModelId
): { userMsg: Message; assistantMsg: Message } {
  const db = getDb();
  const txn = db.transaction(() => {
    const userMsg = insertMessage(channelId, 'user', content, 'complete');
    const assistantMsg = insertMessage(channelId, 'assistant', '', 'streaming', model);
    return { userMsg, assistantMsg };
  });
  return txn();
}

export function updateMessage(id: string, content: string, status: 'complete' | 'error') {
  getDb()
    .prepare('UPDATE messages SET content = ?, status = ? WHERE id = ?')
    .run(content, status, id);
}

export function deleteMessage(id: string): boolean {
  const result = getDb()
    .prepare('DELETE FROM messages WHERE id = ?')
    .run(id);
  return result.changes > 0;
}

export function deleteAllMessages(channelId: string): number {
  const result = getDb()
    .prepare('DELETE FROM messages WHERE channel_id = ?')
    .run(channelId);
  return result.changes;
}

/** Delete a channel and all its messages + entity assignments (cascade) */
export function deleteChannel(id: string): boolean {
  const db = getDb();
  const txn = db.transaction(() => {
    db.prepare('DELETE FROM channel_entities WHERE channel_id = ?').run(id);
    db.prepare('DELETE FROM messages WHERE channel_id = ?').run(id);
    const result = db.prepare('DELETE FROM channels WHERE id = ?').run(id);
    return result.changes > 0;
  });
  return txn();
}

export function getLastAssistantMessage(channelId: string): Message | undefined {
  const row = getDb()
    .prepare(
      'SELECT * FROM messages WHERE channel_id = ? AND role = ? ORDER BY created_at DESC, rowid DESC LIMIT 1'
    )
    .get(channelId, 'assistant') as any;
  if (!row) return undefined;
  return rowToMessage(row);
}

/** Get all assistant messages from the last round (after the last user message). */
export function getLastRoundAssistantMessages(channelId: string): Message[] {
  const db = getDb();
  // Find the last user message's rowid
  const lastUser = db.prepare(
    'SELECT rowid FROM messages WHERE channel_id = ? AND role = ? ORDER BY created_at DESC, rowid DESC LIMIT 1'
  ).get(channelId, 'user') as { rowid: number } | undefined;

  if (!lastUser) return [];

  // Get all assistant messages after that user message
  const rows = db.prepare(
    'SELECT * FROM messages WHERE channel_id = ? AND role = ? AND rowid > ? ORDER BY created_at ASC, rowid ASC'
  ).all(channelId, 'assistant', lastUser.rowid) as any[];

  return rows.map(rowToMessage);
}

// ── Entity CRUD ──────────────────────────────────────────────

export function getEntity(id: string): Entity | undefined {
  const row = getDb().prepare('SELECT * FROM entities WHERE id = ?').get(id) as any;
  if (!row) return undefined;
  return rowToEntity(row);
}

export function getAllEntities(): Entity[] {
  const rows = getDb()
    .prepare('SELECT * FROM entities ORDER BY created_at ASC')
    .all() as any[];
  return rows.map(rowToEntity);
}

export function createEntity(
  name: string,
  model: ModelId,
  systemPrompt: string,
  color: string,
  handle?: string
): Entity {
  const id = uuidv4();
  const now = new Date().toISOString();
  getDb()
    .prepare('INSERT INTO entities (id, name, handle, model, system_prompt, color, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run(id, name, handle || null, model, systemPrompt, color, now);
  return { id, name, handle: handle || undefined, model, systemPrompt, color, createdAt: now };
}

export function updateEntity(
  id: string,
  updates: { name?: string; handle?: string | null; model?: ModelId; systemPrompt?: string; color?: string }
): Entity | undefined {
  const entity = getEntity(id);
  if (!entity) return undefined;

  const name = updates.name ?? entity.name;
  const handle = updates.handle !== undefined ? (updates.handle || undefined) : entity.handle;
  const model = updates.model ?? entity.model;
  const systemPrompt = updates.systemPrompt ?? entity.systemPrompt;
  const color = updates.color ?? entity.color;

  getDb()
    .prepare('UPDATE entities SET name = ?, handle = ?, model = ?, system_prompt = ?, color = ? WHERE id = ?')
    .run(name, handle || null, model, systemPrompt, color, id);

  return { ...entity, name, handle, model, systemPrompt, color };
}

export function deleteEntity(id: string): boolean {
  const db = getDb();
  const txn = db.transaction(() => {
    // Remove from all channel assignments first
    db.prepare('DELETE FROM channel_entities WHERE entity_id = ?').run(id);
    const result = db.prepare('DELETE FROM entities WHERE id = ?').run(id);
    return result.changes > 0;
  });
  return txn();
}

// ── Channel-Entity Assignment ────────────────────────────────

export function getChannelEntities(channelId: string): Entity[] {
  const rows = getDb()
    .prepare(`
      SELECT e.* FROM entities e
      JOIN channel_entities ce ON e.id = ce.entity_id
      WHERE ce.channel_id = ?
      ORDER BY ce.added_at ASC
    `)
    .all(channelId) as any[];
  return rows.map(rowToEntity);
}

export function assignEntityToChannel(channelId: string, entityId: string): boolean {
  try {
    getDb()
      .prepare('INSERT OR IGNORE INTO channel_entities (channel_id, entity_id) VALUES (?, ?)')
      .run(channelId, entityId);
    return true;
  } catch {
    return false;
  }
}

export function removeEntityFromChannel(channelId: string, entityId: string): boolean {
  const result = getDb()
    .prepare('DELETE FROM channel_entities WHERE channel_id = ? AND entity_id = ?')
    .run(channelId, entityId);
  return result.changes > 0;
}

export function getChannelEntityCount(channelId: string): number {
  const row = getDb()
    .prepare('SELECT COUNT(*) as count FROM channel_entities WHERE channel_id = ?')
    .get(channelId) as { count: number };
  return row.count;
}

// ── Project CRUD ──────────────────────────────────────────────

export function getProject(id: string): Project | undefined {
  const row = getDb().prepare('SELECT * FROM projects WHERE id = ?').get(id) as any;
  if (!row) return undefined;
  return rowToProject(row);
}

export function getAllProjects(): Project[] {
  const rows = getDb()
    .prepare('SELECT * FROM projects ORDER BY created_at ASC')
    .all() as any[];
  return rows.map(rowToProject);
}

export function createProject(
  name: string,
  instructions: string,
  source: ChannelSource = 'native',
  sourceMetadata: Record<string, unknown> = {},
  memory: string = ''
): Project {
  const id = uuidv4();
  const now = new Date().toISOString();
  getDb()
    .prepare('INSERT INTO projects (id, name, instructions, memory, source, source_metadata, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run(id, name, instructions, memory, source, JSON.stringify(sourceMetadata), now);
  return { id, name, instructions, memory, source, sourceMetadata: JSON.stringify(sourceMetadata), createdAt: now };
}

export function updateProject(
  id: string,
  updates: { name?: string; instructions?: string; memory?: string }
): Project | undefined {
  const project = getProject(id);
  if (!project) return undefined;
  const name = updates.name ?? project.name;
  const instructions = updates.instructions ?? project.instructions;
  const memory = updates.memory ?? project.memory;
  getDb()
    .prepare('UPDATE projects SET name = ?, instructions = ?, memory = ? WHERE id = ?')
    .run(name, instructions, memory, id);
  return { ...project, name, instructions, memory };
}

export function deleteProject(id: string): boolean {
  const db = getDb();
  const txn = db.transaction(() => {
    // Unlink channels (don't delete them)
    db.prepare('UPDATE channels SET project_id = NULL WHERE project_id = ?').run(id);
    const result = db.prepare('DELETE FROM projects WHERE id = ?').run(id);
    return result.changes > 0;
  });
  return txn();
}

/**
 * Find or create a project by source identity.
 * For claude.ai imports: matches by original project UUID in source_metadata.
 * For Claude Code imports: matches by cwd in source_metadata.
 */
export function findOrCreateProject(
  name: string,
  instructions: string,
  source: ChannelSource,
  sourceMetadata: Record<string, unknown>,
  matchKey: string,
  matchValue: string,
  memory: string = ''
): Project {
  // Try to find existing project by source identity
  const existing = getDb()
    .prepare(`SELECT * FROM projects WHERE json_valid(source_metadata) AND json_extract(source_metadata, '$.${matchKey}') = ?`)
    .get(matchValue) as any;
  if (existing) return rowToProject(existing);

  // Create new
  return createProject(name, instructions, source, sourceMetadata, memory);
}

/**
 * Find a project by name (basename matching for cloud imports).
 * Returns the project only if exactly one match exists — avoids ambiguity.
 */
export function findUniqueProjectByName(name: string): Project | undefined {
  const rows = getDb()
    .prepare('SELECT * FROM projects WHERE name = ?')
    .all(name) as any[];
  if (rows.length === 1) return rowToProject(rows[0]);
  return undefined; // zero or multiple matches — ambiguous
}

/**
 * Get the project for a channel (if any).
 * Used to inject project instructions into system prompt.
 */
export function getProjectForChannel(channelId: string): Project | undefined {
  const row = getDb()
    .prepare(`
      SELECT p.* FROM projects p
      JOIN channels c ON c.project_id = p.id
      WHERE c.id = ?
    `)
    .get(channelId) as any;
  if (!row) return undefined;
  return rowToProject(row);
}

/** Link a channel to a project */
export function setChannelProject(channelId: string, projectId: string | null): void {
  getDb()
    .prepare('UPDATE channels SET project_id = ? WHERE id = ?')
    .run(projectId, channelId);
}

// ── Import Operations ─────────────────────────────────────────

import type { ImportResult } from '@klatch/shared';
import type { ParsedTurn, ParsedArtifact } from '../import/parser.js';

interface ImportSessionParams {
  channelName: string;
  source: 'claude-code' | 'claude-ai';
  sourceMetadata: Record<string, unknown>;
  model?: string;
  turns: ParsedTurn[];
  projectId?: string; // FK to projects table
}

/**
 * Import a parsed session into the database as a new channel with messages and artifacts.
 * Runs in a single transaction for atomicity.
 */
export function importSession(params: ImportSessionParams): ImportResult {
  const db = getDb();
  const { channelName, source, sourceMetadata, model, turns, projectId } = params;

  const channelId = uuidv4();
  const now = new Date().toISOString();
  const channelModel = model || DEFAULT_MODEL;

  let messageCount = 0;
  let artifactCount = 0;

  const txn = db.transaction(() => {
    // 1. Create channel with source info and optional project link (imported conversations are always type 'chat')
    db.prepare(
      'INSERT INTO channels (id, name, system_prompt, model, mode, type, source, source_metadata, project_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(channelId, channelName, '', channelModel, DEFAULT_INTERACTION_MODE, 'chat', source, JSON.stringify(sourceMetadata), projectId || null, now);

    // 2. Assign default entity
    db.prepare(
      'INSERT INTO channel_entities (channel_id, entity_id) VALUES (?, ?)'
    ).run(channelId, DEFAULT_ENTITY_ID);

    // 3. Insert messages from turns
    const insertMsg = db.prepare(
      'INSERT INTO messages (id, channel_id, role, content, status, model, entity_id, original_timestamp, original_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );
    const insertArtifact = db.prepare(
      'INSERT INTO message_artifacts (id, message_id, type, tool_name, input_summary, content, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
    );

    for (const turn of turns) {
      // User message
      if (turn.userText) {
        const userMsgId = uuidv4();
        insertMsg.run(
          userMsgId, channelId, 'user', turn.userText, 'complete',
          null, null, turn.timestamp, turn.originalId, now
        );
        messageCount++;
      }

      // Assistant message
      if (turn.assistantText || (turn.artifacts && turn.artifacts.length > 0)) {
        const assistantMsgId = uuidv4();
        insertMsg.run(
          assistantMsgId, channelId, 'assistant', turn.assistantText || '', 'complete',
          turn.model || channelModel, DEFAULT_ENTITY_ID, turn.timestamp, turn.originalId, now
        );
        messageCount++;

        // Artifacts (tool uses)
        if (turn.artifacts) {
          for (const artifact of turn.artifacts) {
            insertArtifact.run(
              uuidv4(), assistantMsgId, artifact.type,
              artifact.toolName, artifact.inputSummary,
              artifact.content || null, now
            );
            artifactCount++;
          }
        }
      }
    }
  });

  txn();

  return {
    channelId,
    channelName,
    messageCount,
    artifactCount,
    source,
    duplicate: false,
  };
}

/**
 * Find a channel that was imported from the same original session.
 * Uses json_extract on source_metadata to match originalSessionId.
 */
export function findChannelByOriginalSessionId(sessionId: string): Channel | undefined {
  const row = getDb()
    .prepare("SELECT * FROM channels WHERE json_valid(source_metadata) AND json_extract(source_metadata, '$.originalSessionId') = ?")
    .get(sessionId) as any;
  if (!row) return undefined;
  return rowToChannel(row);
}

/**
 * Get conflict info for a channel that was previously imported.
 * Returns message count and whether the user has added new (non-imported) messages.
 */
export function getImportConflictInfo(channelId: string): {
  messageCount: number;
  nativeMessageCount: number;
  hasNewMessages: boolean;
} {
  const db = getDb();
  const total = db.prepare(
    'SELECT COUNT(*) as count FROM messages WHERE channel_id = ?'
  ).get(channelId) as { count: number };
  const native = db.prepare(
    'SELECT COUNT(*) as count FROM messages WHERE channel_id = ? AND original_id IS NULL'
  ).get(channelId) as { count: number };
  return {
    messageCount: total.count,
    nativeMessageCount: native.count,
    hasNewMessages: native.count > 0,
  };
}

/**
 * Count how many channels share the same originalSessionId.
 * Used to generate disambiguation suffixes for fork-again imports.
 */
export function countChannelsByOriginalSessionId(sessionId: string): number {
  const row = getDb()
    .prepare("SELECT COUNT(*) as count FROM channels WHERE json_valid(source_metadata) AND json_extract(source_metadata, '$.originalSessionId') = ?")
    .get(sessionId) as { count: number };
  return row.count;
}

// ── File artifact queries (Step 9) ──────────────────────────

import type { MessageArtifact } from '@klatch/shared';

function rowToArtifact(row: any): MessageArtifact {
  return {
    id: row.id,
    messageId: row.message_id,
    type: row.type,
    toolName: row.tool_name || undefined,
    inputSummary: row.input_summary || undefined,
    content: row.content || undefined,
    fileName: row.file_name || undefined,
    fileMimeType: row.file_mime_type || undefined,
    fileSizeBytes: row.file_size_bytes || undefined,
    fileStorageKey: row.file_storage_key || undefined,
    createdAt: row.created_at,
  };
}

/** Create a file artifact linked to a message */
export function createFileArtifact(
  messageId: string,
  fileName: string,
  fileMimeType: string,
  fileSizeBytes: number,
  fileStorageKey: string
): MessageArtifact {
  const id = uuidv4();
  const now = new Date().toISOString();
  getDb().prepare(
    `INSERT INTO message_artifacts (id, message_id, type, tool_name, input_summary, file_name, file_mime_type, file_size_bytes, file_storage_key, created_at)
     VALUES (?, ?, 'file', NULL, ?, ?, ?, ?, ?, ?)`
  ).run(id, messageId, `Attached: ${fileName}`, fileName, fileMimeType, fileSizeBytes, fileStorageKey, now);
  return {
    id,
    messageId,
    type: 'file',
    inputSummary: `Attached: ${fileName}`,
    fileName,
    fileMimeType,
    fileSizeBytes,
    fileStorageKey,
    createdAt: now,
  };
}

/** Get all file artifacts for a list of message IDs (batch query for context injection) */
export function getFileArtifactsForMessages(messageIds: string[]): Map<string, MessageArtifact[]> {
  if (messageIds.length === 0) return new Map();

  const placeholders = messageIds.map(() => '?').join(',');
  const rows = getDb()
    .prepare(`SELECT * FROM message_artifacts WHERE message_id IN (${placeholders}) AND type = 'file' ORDER BY created_at`)
    .all(...messageIds) as any[];

  const result = new Map<string, MessageArtifact[]>();
  for (const row of rows) {
    const artifact = rowToArtifact(row);
    const existing = result.get(artifact.messageId) || [];
    existing.push(artifact);
    result.set(artifact.messageId, existing);
  }
  return result;
}

/** Get all artifacts for all messages in a channel */
export function getArtifactsForChannel(channelId: string): Map<string, MessageArtifact[]> {
  const rows = getDb()
    .prepare(`
      SELECT ma.* FROM message_artifacts ma
      JOIN messages m ON ma.message_id = m.id
      WHERE m.channel_id = ?
      ORDER BY ma.created_at
    `)
    .all(channelId) as any[];

  const result = new Map<string, MessageArtifact[]>();
  for (const row of rows) {
    const artifact = rowToArtifact(row);
    const existing = result.get(artifact.messageId) || [];
    existing.push(artifact);
    result.set(artifact.messageId, existing);
  }
  return result;
}

/** Get all artifacts for a single message */
export function getMessageArtifacts(messageId: string): MessageArtifact[] {
  const rows = getDb()
    .prepare('SELECT * FROM message_artifacts WHERE message_id = ? ORDER BY created_at')
    .all(messageId) as any[];
  return rows.map(rowToArtifact);
}

// ── File Domain Model (Phase 1) ─────────────────────────────

function rowToFile(row: any): KlatchFile {
  return {
    id: row.id,
    name: row.name,
    mimeType: row.mime_type,
    sizeBytes: row.size_bytes,
    storageKey: row.storage_key,
    createdBy: row.created_by || undefined,
    createdAt: row.created_at,
  };
}

function rowToFileRef(row: any): FileRef {
  return {
    id: row.id,
    fileId: row.file_id,
    scope: row.scope as FileRefScope,
    scopeId: row.scope_id,
    refType: row.ref_type as FileRefType,
    addedAt: row.added_at,
    addedBy: row.added_by || undefined,
  };
}

function rowToFileWithRef(row: any): FileWithRef {
  return {
    id: row.id,
    name: row.name,
    mimeType: row.mime_type,
    sizeBytes: row.size_bytes,
    storageKey: row.storage_key,
    createdBy: row.created_by || undefined,
    createdAt: row.created_at,
    refId: row.ref_id,
    scope: row.scope as FileRefScope,
    scopeId: row.scope_id,
    refType: row.ref_type as FileRefType,
    addedAt: row.added_at,
    addedBy: row.added_by || undefined,
  };
}

/** Get a file by ID */
export function getFile(id: string): KlatchFile | undefined {
  const row = getDb().prepare('SELECT * FROM files WHERE id = ?').get(id) as any;
  if (!row) return undefined;
  return rowToFile(row);
}

/** Get a file by storage key */
export function getFileByStorageKey(storageKey: string): KlatchFile | undefined {
  const row = getDb().prepare('SELECT * FROM files WHERE storage_key = ?').get(storageKey) as any;
  if (!row) return undefined;
  return rowToFile(row);
}

/** Create a canonical file record */
export function createFile(
  name: string,
  mimeType: string,
  sizeBytes: number,
  storageKey: string,
  createdBy?: string
): KlatchFile {
  const id = uuidv4();
  const now = new Date().toISOString();
  getDb().prepare(
    'INSERT INTO files (id, name, mime_type, size_bytes, storage_key, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(id, name, mimeType, sizeBytes, storageKey, createdBy || null, now);
  return { id, name, mimeType, sizeBytes, storageKey, createdBy, createdAt: now };
}

/** Create a file reference at a given scope */
export function createFileRef(
  fileId: string,
  scope: FileRefScope,
  scopeId: string,
  refType: FileRefType = 'pinned',
  addedBy?: string
): FileRef {
  const id = uuidv4();
  const now = new Date().toISOString();
  getDb().prepare(
    'INSERT INTO file_refs (id, file_id, scope, scope_id, ref_type, added_at, added_by) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(id, fileId, scope, scopeId, refType, now, addedBy || null);
  return { id, fileId, scope, scopeId, refType, addedAt: now, addedBy };
}

/** Remove a file reference */
export function deleteFileRef(refId: string): boolean {
  const result = getDb().prepare('DELETE FROM file_refs WHERE id = ?').run(refId);
  return result.changes > 0;
}

/** Get all files at a given scope (with ref info) */
export function getFilesAtScope(scope: FileRefScope, scopeId: string): FileWithRef[] {
  const rows = getDb().prepare(`
    SELECT f.*, fr.id as ref_id, fr.scope, fr.scope_id, fr.ref_type, fr.added_at, fr.added_by
    FROM files f
    JOIN file_refs fr ON f.id = fr.file_id
    WHERE fr.scope = ? AND fr.scope_id = ?
    ORDER BY fr.added_at ASC
  `).all(scope, scopeId) as any[];
  return rows.map(rowToFileWithRef);
}

/** Get all files for a project */
export function getProjectFiles(projectId: string): FileWithRef[] {
  return getFilesAtScope('project', projectId);
}

/** Get all files for a channel (channel-scope refs only) */
export function getChannelFiles(channelId: string): FileWithRef[] {
  return getFilesAtScope('channel', channelId);
}

/** Get all files for an entity (entity-scope refs = library) */
export function getEntityFiles(entityId: string): FileWithRef[] {
  return getFilesAtScope('entity', entityId);
}

/** Get all files for a message (message-scope refs) */
export function getMessageFiles(messageId: string): FileWithRef[] {
  return getFilesAtScope('message', messageId);
}

/** Get all refs for a specific file (find everywhere it's visible) */
export function getFileRefs(fileId: string): FileRef[] {
  const rows = getDb().prepare(
    'SELECT * FROM file_refs WHERE file_id = ? ORDER BY added_at ASC'
  ).all(fileId) as any[];
  return rows.map(rowToFileRef);
}

/**
 * Create a file + message-scope ref in one operation.
 * Used when uploading files to messages (extends the existing createFileArtifact flow).
 */
export function createFileWithMessageRef(
  name: string,
  mimeType: string,
  sizeBytes: number,
  storageKey: string,
  messageId: string,
  createdBy?: string
): { file: KlatchFile; ref: FileRef } {
  const db = getDb();
  const fileId = uuidv4();
  const refId = uuidv4();
  const now = new Date().toISOString();

  const txn = db.transaction(() => {
    db.prepare(
      'INSERT INTO files (id, name, mime_type, size_bytes, storage_key, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(fileId, name, mimeType, sizeBytes, storageKey, createdBy || null, now);

    db.prepare(
      'INSERT INTO file_refs (id, file_id, scope, scope_id, ref_type, added_at, added_by) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(refId, fileId, 'message', messageId, 'pinned', now, createdBy || null);
  });
  txn();

  return {
    file: { id: fileId, name, mimeType, sizeBytes, storageKey, createdBy, createdAt: now },
    ref: { id: refId, fileId, scope: 'message', scopeId: messageId, refType: 'pinned', addedAt: now, addedBy: createdBy },
  };
}
