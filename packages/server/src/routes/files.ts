import { Hono } from 'hono';
import fs from 'fs';
import {
  getChannel,
  getChannelEntities,
  insertMessage,
  createFileArtifact,
  getMessageArtifacts,
  getProjectFiles,
  getChannelFiles,
  getEntityFiles,
  getMessageFiles,
  getFile,
  getFileByStorageKey,
  getFileRefs,
  createFile,
  createFileRef,
  createFileWithMessageRef,
  deleteFileRef,
  getProject,
} from '../db/queries.js';
import { streamClaude, streamClaudeRoundtable } from '../claude/client.js';
import { resolveMentions } from '@klatch/shared';
import { getDb } from '../db/index.js';
import { saveFile, validateFile, getFilePath, MAX_FILE_SIZE_BYTES } from '../files/storage.js';

const app = new Hono();

/**
 * POST /channels/:id/files — Send a message with a file attachment
 *
 * Multipart form-data:
 *   - file: the uploaded file (required)
 *   - content: text message to send with the file (optional)
 *
 * Creates: user message + file artifact + assistant placeholder(s)
 * Triggers: streaming to assigned entities (same as POST /channels/:id/messages)
 */
app.post('/channels/:channelId/files', async (c) => {
  const channelId = c.req.param('channelId');

  // Parse multipart
  const formData = await c.req.formData();
  const file = formData.get('file');
  const textContent = formData.get('content')?.toString() || '';

  if (!(file instanceof File)) {
    return c.json({ error: 'No file provided' }, 400);
  }

  // Read file buffer
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const fileName = file.name || 'unnamed';
  // Use browser-provided MIME, fall back to extension-based guess for octet-stream
  let mimeType = file.type || 'application/octet-stream';
  if (mimeType === 'application/octet-stream') {
    mimeType = guessMimeType(fileName);
  }

  // Validate
  const validation = validateFile(buffer, mimeType, fileName);
  if (!validation.valid) {
    return c.json({ error: validation.reason }, 400);
  }

  // Channel check
  const channel = getChannel(channelId);
  if (!channel) {
    return c.json({ error: 'Channel not found' }, 404);
  }

  const entities = getChannelEntities(channelId);
  if (entities.length === 0) {
    return c.json({ error: 'No entities assigned to this channel' }, 400);
  }

  // Save file to disk
  const saved = saveFile(buffer, fileName, mimeType);

  // Build the user message content
  const userContent = textContent.trim()
    ? `${textContent.trim()}\n\n📎 ${fileName} (${formatFileSize(saved.sizeBytes)})`
    : `📎 ${fileName} (${formatFileSize(saved.sizeBytes)})`;

  // Create user message + file artifact + assistant placeholders in a transaction
  const db = getDb();

  // Determine which entities respond (directed mode needs @-mention resolution)
  let respondingEntities = entities;
  if (channel.mode === 'directed') {
    const mentioned = resolveMentions(textContent || '', entities);
    if (mentioned.length === 0) {
      const names = entities.map((e) => `@${e.name}`).join(', ');
      return c.json({
        error: `No entity mentioned. Use @EntityName to direct your message. Available: ${names}`,
      }, 400);
    }
    respondingEntities = mentioned;
  }

  const txn = db.transaction(() => {
    const userMsg = insertMessage(channelId, 'user', userContent, 'complete');

    // Create file artifact linked to the user message
    const artifact = createFileArtifact(
      userMsg.id,
      fileName,
      mimeType,
      saved.sizeBytes,
      saved.storageKey
    );

    // Also create entry in files + file_refs (File Domain Model)
    createFileWithMessageRef(
      fileName,
      mimeType,
      saved.sizeBytes,
      saved.storageKey,
      userMsg.id,
      'user'
    );

    // Create assistant placeholders
    const assistants = respondingEntities.map((entity) => {
      const msg = insertMessage(channelId, 'assistant', '', 'streaming', entity.model, entity.id);
      return { assistantMessageId: msg.id, entityId: entity.id, model: entity.model };
    });

    return { userMsg, artifact, assistants };
  });

  const { userMsg, artifact, assistants } = txn();

  // Trigger streaming — same dispatch as regular messages
  if (channel.mode === 'roundtable') {
    streamClaudeRoundtable(
      channelId,
      assistants.map((a) => ({
        assistantMessageId: a.assistantMessageId,
        entity: entities.find((e) => e.id === a.entityId)!,
      })),
      channel.systemPrompt
    );
  } else {
    for (const assistant of assistants) {
      const entity = respondingEntities.find((e) => e.id === assistant.entityId)!;
      streamClaude(channelId, assistant.assistantMessageId, entity, channel.systemPrompt);
    }
  }

  return c.json({
    userMessageId: userMsg.id,
    fileArtifactId: artifact.id,
    assistants,
  });
});

/**
 * GET /files/:storageKey — Serve a stored file
 *
 * Returns the file with correct Content-Type header.
 * Content-Disposition: inline for viewable types, attachment for others.
 */
app.get('/files/:storageKey', (c) => {
  const storageKey = c.req.param('storageKey');
  const filePath = getFilePath(storageKey);

  if (!filePath) {
    return c.json({ error: 'File not found' }, 404);
  }

  const buffer = fs.readFileSync(filePath);

  // Extract original filename from storage key (after UUID_)
  const parts = storageKey.split('_');
  const originalName = parts.length > 1 ? parts.slice(1).join('_') : storageKey;

  // Guess content type from extension or default
  const mimeType = guessMimeType(originalName);

  c.header('Content-Type', mimeType);
  c.header('Content-Length', buffer.length.toString());

  // Inline for viewable types, attachment for others
  const isViewable = mimeType.startsWith('text/') || mimeType.startsWith('image/') || mimeType === 'application/pdf';
  c.header('Content-Disposition', isViewable ? 'inline' : `attachment; filename="${originalName}"`);

  return c.body(buffer);
});

/**
 * GET /messages/:id/artifacts — Get all artifacts for a message
 */
app.get('/messages/:id/artifacts', (c) => {
  const messageId = c.req.param('id');
  const artifacts = getMessageArtifacts(messageId);
  return c.json(artifacts);
});

// ── Helpers ──────────────────────────────────────────────────

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function guessMimeType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  const map: Record<string, string> = {
    txt: 'text/plain',
    md: 'text/markdown',
    html: 'text/html',
    css: 'text/css',
    js: 'application/javascript',
    ts: 'application/typescript',
    json: 'application/json',
    xml: 'application/xml',
    yaml: 'application/yaml',
    yml: 'application/yaml',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    webp: 'image/webp',
    svg: 'image/svg+xml',
    pdf: 'application/pdf',
    csv: 'text/csv',
  };
  return map[ext || ''] || 'application/octet-stream';
}

// ── File Domain Model: pinning + promotion (Phase 2) ─────────

/**
 * POST /files/pin — Pin a file to a channel
 *
 * Body: { channelId: string, fileId?: string, storageKey?: string }
 * Accepts either fileId or storageKey to identify the file.
 * Creates a channel-scope file_ref for the given file.
 * Idempotent — if already pinned, returns the existing ref.
 */
app.post('/files/pin', async (c) => {
  const data = await c.req.json();
  const { channelId, fileId: rawFileId, storageKey } = data;

  if (!channelId) {
    return c.json({ error: 'channelId is required' }, 400);
  }

  // Resolve file by ID or storage key
  let file;
  if (rawFileId) {
    file = getFile(rawFileId);
  } else if (storageKey) {
    file = getFileByStorageKey(storageKey);
  } else {
    return c.json({ error: 'fileId or storageKey is required' }, 400);
  }

  if (!file) {
    return c.json({ error: 'File not found' }, 404);
  }

  const channel = getChannel(channelId);
  if (!channel) {
    return c.json({ error: 'Channel not found' }, 404);
  }

  // Check if already pinned to this channel
  const existing = getChannelFiles(channelId);
  const alreadyPinned = existing.find((f) => f.id === file.id);
  if (alreadyPinned) {
    return c.json({ file, ref: { id: alreadyPinned.refId, fileId: file.id, scope: 'channel', scopeId: channelId, refType: alreadyPinned.refType, addedAt: alreadyPinned.addedAt, addedBy: alreadyPinned.addedBy }, alreadyPinned: true });
  }

  const ref = createFileRef(file.id, 'channel', channelId, 'pinned', 'user');
  return c.json({ file, ref, alreadyPinned: false });
});

/**
 * DELETE /files/:fileId/pin/:channelId — Unpin a file from a channel
 */
app.delete('/files/:fileId/pin/:channelId', (c) => {
  const fileId = c.req.param('fileId');
  const channelId = c.req.param('channelId');

  const channelFiles = getChannelFiles(channelId);
  const pinned = channelFiles.find((f) => f.id === fileId);
  if (!pinned) {
    return c.json({ error: 'File is not pinned to this channel' }, 404);
  }

  deleteFileRef(pinned.refId);
  return c.json({ ok: true });
});

// ── File Domain Model: promotion (Phase 5) ───────────────────

/**
 * POST /files/:id/promote — Promote a file to a higher scope
 *
 * Body: { targetScope: 'channel' | 'project', targetId: string }
 *
 * Creates a new file_ref at the target scope. The file itself is unchanged —
 * only a new reference is added. Idempotent (returns existing ref if already promoted).
 */
app.post('/files/:id/promote', async (c) => {
  const fileId = c.req.param('id');
  const file = getFile(fileId);
  if (!file) {
    return c.json({ error: 'File not found' }, 404);
  }

  const data = await c.req.json();
  const { targetScope, targetId } = data;

  if (!targetScope || !targetId) {
    return c.json({ error: 'targetScope and targetId are required' }, 400);
  }

  if (targetScope !== 'channel' && targetScope !== 'project') {
    return c.json({ error: 'targetScope must be "channel" or "project"' }, 400);
  }

  // Verify target exists
  if (targetScope === 'channel') {
    const channel = getChannel(targetId);
    if (!channel) return c.json({ error: 'Channel not found' }, 404);
  } else {
    const project = getProject(targetId);
    if (!project) return c.json({ error: 'Project not found' }, 404);
  }

  // Check if already exists at target scope
  const existingFiles = targetScope === 'channel' ? getChannelFiles(targetId) : getProjectFiles(targetId);
  const already = existingFiles.find((f) => f.id === fileId);
  if (already) {
    return c.json({ file, ref: { id: already.refId, fileId, scope: targetScope, scopeId: targetId }, alreadyExists: true });
  }

  const ref = createFileRef(fileId, targetScope, targetId, 'pinned', 'user');
  return c.json({ file, ref, alreadyExists: false });
});

// ── File Domain Model: project knowledge base (Phase 3) ──────

/**
 * POST /projects/:id/files — Upload a file to a project's knowledge base
 *
 * Multipart form-data:
 *   - file: the uploaded file (required)
 */
app.post('/projects/:id/files', async (c) => {
  const projectId = c.req.param('id');
  const project = getProject(projectId);
  if (!project) {
    return c.json({ error: 'Project not found' }, 404);
  }

  const formData = await c.req.formData();
  const file = formData.get('file');

  if (!(file instanceof File)) {
    return c.json({ error: 'No file provided' }, 400);
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const fileName = file.name || 'unnamed';
  let mimeType = file.type || 'application/octet-stream';
  if (mimeType === 'application/octet-stream') {
    mimeType = guessMimeType(fileName);
  }

  const validation = validateFile(buffer, mimeType, fileName);
  if (!validation.valid) {
    return c.json({ error: validation.reason }, 400);
  }

  const saved = saveFile(buffer, fileName, mimeType);
  const fileRecord = createFile(fileName, mimeType, saved.sizeBytes, saved.storageKey, 'user');
  const ref = createFileRef(fileRecord.id, 'project', projectId, 'pinned', 'user');

  return c.json({ file: fileRecord, ref }, 201);
});

/**
 * DELETE /projects/:id/files/:fileId — Remove a file from a project's knowledge base
 */
app.delete('/projects/:id/files/:fileId', (c) => {
  const projectId = c.req.param('id');
  const fileId = c.req.param('fileId');

  const projectFiles = getProjectFiles(projectId);
  const target = projectFiles.find((f) => f.id === fileId);
  if (!target) {
    return c.json({ error: 'File not found in this project' }, 404);
  }

  deleteFileRef(target.refId);
  return c.json({ ok: true });
});

// ── File Domain Model query endpoints (Phase 1) ─────────────

/**
 * GET /projects/:id/files — all files at project scope
 */
app.get('/projects/:id/files', (c) => {
  const projectId = c.req.param('id');
  return c.json(getProjectFiles(projectId));
});

/**
 * GET /channels/:id/files — all files at channel scope
 */
app.get('/channels/:id/files', (c) => {
  const channelId = c.req.param('id');
  return c.json(getChannelFiles(channelId));
});

/**
 * GET /entities/:id/files — entity's file library
 */
app.get('/entities/:id/files', (c) => {
  const entityId = c.req.param('id');
  return c.json(getEntityFiles(entityId));
});

/**
 * GET /messages/:id/files — message file attachments (via file domain model)
 */
app.get('/messages/:id/files', (c) => {
  const messageId = c.req.param('id');
  return c.json(getMessageFiles(messageId));
});

/**
 * GET /files/:id/refs — all references for a specific file
 */
app.get('/files/:id/refs', (c) => {
  const fileId = c.req.param('id');
  const file = getFile(fileId);
  if (!file) {
    return c.json({ error: 'File not found' }, 404);
  }
  const refs = getFileRefs(fileId);
  return c.json({ file, refs });
});

export const fileRoutes = app;
