import { Hono } from 'hono';
import fs from 'fs';
import {
  getChannel,
  getChannelEntities,
  insertMessage,
  createFileArtifact,
  getMessageArtifacts,
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
  const mimeType = file.type || 'application/octet-stream';
  const fileName = file.name || 'unnamed';

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

export const fileRoutes = app;
