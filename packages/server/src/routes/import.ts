import { Hono } from 'hono';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { parseClaudeCodeSession } from '../import/parser.js';
import { parseClaudeAiConversation } from '../import/claude-ai-parser.js';
import { extractConversationsFromZip } from '../import/claude-ai-zip.js';
import { importSession, findChannelByOriginalSessionId } from '../db/queries.js';
import { MODEL_ALIASES, AVAILABLE_MODELS } from '@klatch/shared';
import type { ModelId } from '@klatch/shared';

// Max file size for imports (50 MB)
const MAX_IMPORT_SIZE = 50 * 1024 * 1024;

/** Expand ~ to home directory safely using os.homedir() */
function expandHome(filePath: string): string {
  if (filePath.startsWith('~/') || filePath === '~') {
    return path.join(os.homedir(), filePath.slice(1));
  }
  return filePath;
}

/**
 * Validate that a resolved path is an absolute path and doesn't escape
 * via directory traversal. Returns the resolved path or null if invalid.
 */
function validateImportPath(filePath: string): string | null {
  const resolved = path.resolve(filePath);
  // Must be absolute (resolve guarantees this, but belt-and-suspenders)
  if (!path.isAbsolute(resolved)) return null;
  // Block obvious traversal patterns in the original input
  if (filePath.includes('..')) return null;
  return resolved;
}

const app = new Hono();

/**
 * POST /import/claude-code
 *
 * Import a Claude Code JSONL session file into Klatch as a new channel.
 *
 * Body: { sessionPath: string, channelName?: string }
 * Returns: 201 with ImportResult, or 400/404/409 on error.
 */
app.post('/import/claude-code', async (c) => {
  const { sessionPath, channelName } = await c.req.json<{
    sessionPath: string;
    channelName?: string;
  }>();

  if (!sessionPath) {
    return c.json({ error: 'sessionPath is required' }, 400);
  }

  // Validate file extension
  if (!sessionPath.endsWith('.jsonl')) {
    return c.json({ error: 'File must be a .jsonl file' }, 400);
  }

  // Expand ~ and validate path
  const expandedPath = validateImportPath(expandHome(sessionPath));
  if (!expandedPath) {
    return c.json({ error: 'Invalid file path' }, 400);
  }

  // Check file exists
  if (!fs.existsSync(expandedPath)) {
    return c.json({ error: 'File not found' }, 404);
  }

  // Check file size
  const stat = fs.statSync(expandedPath);
  if (stat.size > MAX_IMPORT_SIZE) {
    return c.json({ error: `File too large (${Math.round(stat.size / 1024 / 1024)}MB). Maximum is ${MAX_IMPORT_SIZE / 1024 / 1024}MB.` }, 400);
  }

  // Parse the session
  const session = await parseClaudeCodeSession(expandedPath);

  // Validate non-empty
  if (session.turns.length === 0) {
    return c.json({ error: 'Session is empty — no conversation events found' }, 400);
  }

  // Check for duplicate import
  if (session.sessionId) {
    const existing = findChannelByOriginalSessionId(session.sessionId);
    if (existing) {
      return c.json({
        error: 'This session has already been imported',
        existingChannelId: existing.id,
        existingChannelName: existing.name,
      }, 409);
    }
  }

  // Generate channel name if not provided
  const name = channelName || generateChannelName(session.cwd, session.firstTimestamp);

  // Resolve model: map legacy IDs to current ones
  const resolvedModel = resolveModel(session.model);

  // Import into database
  const result = importSession({
    channelName: name,
    source: 'claude-code',
    sourceMetadata: {
      originalSessionId: session.sessionId,
      cwd: session.cwd,
      gitBranch: session.gitBranch,
      slug: session.slug,
      version: session.version,
      eventCount: session.eventCount,
      firstTimestamp: session.firstTimestamp,
      lastTimestamp: session.lastTimestamp,
      compactionSummary: session.compactionSummary,
      importedAt: new Date().toISOString(),
    },
    model: resolvedModel,
    turns: session.turns,
  });

  return c.json({
    ...result,
    sessionId: session.sessionId,
    ...(session.skippedLines ? { skippedLines: session.skippedLines } : {}),
  }, 201);
});

/**
 * Generate a channel name from the session's working directory and timestamp.
 * Format: "{project} — {YYYY-MM-DD}"
 */
function generateChannelName(cwd?: string, timestamp?: string): string {
  const project = cwd ? path.basename(cwd) : 'import';
  const date = timestamp
    ? timestamp.slice(0, 10)  // "2026-03-08T..." → "2026-03-08"
    : new Date().toISOString().slice(0, 10);
  return `${project} — ${date}`;
}

/**
 * Resolve a Claude Code model ID to a Klatch-recognized model ID.
 * Falls back to DEFAULT_MODEL if unrecognized.
 */
function resolveModel(modelId?: string): ModelId | undefined {
  if (!modelId) return undefined;
  // Direct match
  if (modelId in AVAILABLE_MODELS) return modelId as ModelId;
  // Legacy alias
  if (modelId in MODEL_ALIASES) return MODEL_ALIASES[modelId];
  // Unrecognized — return undefined to use channel default
  return undefined;
}

/**
 * POST /import/claude-ai
 *
 * Import conversations from a claude.ai email export ZIP file.
 * Supports both multipart file upload and JSON body with file path.
 *
 * Multipart: Send ZIP as "file" field in multipart/form-data.
 * JSON: { zipPath: string } — for testing/CLI use.
 *
 * Returns: 201 with { imported, skipped, totalImported, totalSkipped }
 */
app.post('/import/claude-ai', async (c) => {
  const contentType = c.req.header('content-type') || '';

  let zipBuffer: Buffer;

  if (contentType.includes('multipart/form-data')) {
    const formData = await c.req.formData();
    const file = formData.get('file');
    if (!file || !(file instanceof File)) {
      return c.json({ error: 'No file uploaded. Send a ZIP file as "file" in multipart form data.' }, 400);
    }
    if (!file.name.endsWith('.zip')) {
      return c.json({ error: 'File must be a .zip file' }, 400);
    }
    const arrayBuffer = await file.arrayBuffer();
    if (arrayBuffer.byteLength > MAX_IMPORT_SIZE) {
      return c.json({ error: `File too large (${Math.round(arrayBuffer.byteLength / 1024 / 1024)}MB). Maximum is ${MAX_IMPORT_SIZE / 1024 / 1024}MB.` }, 400);
    }
    zipBuffer = Buffer.from(arrayBuffer);
  } else {
    const body = await c.req.json<{ zipPath: string }>();
    const { zipPath } = body;
    if (!zipPath || !zipPath.endsWith('.zip')) {
      return c.json({ error: 'File must be a .zip file' }, 400);
    }
    // Expand ~ and validate path
    const expandedZipPath = validateImportPath(expandHome(zipPath));
    if (!expandedZipPath) {
      return c.json({ error: 'Invalid file path' }, 400);
    }
    if (!fs.existsSync(expandedZipPath)) {
      return c.json({ error: 'File not found' }, 404);
    }
    const stat = fs.statSync(expandedZipPath);
    if (stat.size > MAX_IMPORT_SIZE) {
      return c.json({ error: `File too large (${Math.round(stat.size / 1024 / 1024)}MB). Maximum is ${MAX_IMPORT_SIZE / 1024 / 1024}MB.` }, 400);
    }
    zipBuffer = fs.readFileSync(expandedZipPath);
  }

  // Extract conversations from ZIP
  let conversationFiles;
  try {
    conversationFiles = extractConversationsFromZip(zipBuffer);
  } catch {
    return c.json({ error: 'Invalid ZIP file' }, 400);
  }

  if (conversationFiles.length === 0) {
    return c.json({ error: 'ZIP contains no conversations' }, 400);
  }

  const imported: Array<{
    channelId: string;
    channelName: string;
    messageCount: number;
    artifactCount: number;
    conversationId: string;
  }> = [];
  const skipped: Array<{
    conversationId: string;
    reason: string;
    existingChannelId?: string;
  }> = [];

  for (const { conversation } of conversationFiles) {
    const parsed = parseClaudeAiConversation(conversation);

    if (parsed.turns.length === 0) {
      if (parsed.sessionId) {
        skipped.push({ conversationId: parsed.sessionId, reason: 'empty' });
      }
      continue;
    }

    // Dedup check using the conversation UUID
    if (parsed.sessionId) {
      const existing = findChannelByOriginalSessionId(parsed.sessionId);
      if (existing) {
        skipped.push({
          conversationId: parsed.sessionId,
          reason: 'duplicate',
          existingChannelId: existing.id,
        });
        continue;
      }
    }

    const conv = conversation as { uuid?: string; name?: string; created_at?: string; updated_at?: string };

    const result = importSession({
      channelName: parsed.slug || `claude.ai — ${parsed.sessionId || 'import'}`,
      source: 'claude-ai',
      sourceMetadata: {
        originalSessionId: parsed.sessionId,
        conversationName: parsed.slug,
        createdAt: conv.created_at,
        updatedAt: conv.updated_at,
        eventCount: parsed.eventCount,
        importedAt: new Date().toISOString(),
      },
      turns: parsed.turns,
    });

    imported.push({
      ...result,
      conversationId: parsed.sessionId || '',
    });
  }

  // All duplicates → 409
  if (imported.length === 0 && skipped.every((s) => s.reason === 'duplicate')) {
    return c.json({
      error: 'All conversations already imported',
      imported: [],
      skipped,
      totalImported: 0,
      totalSkipped: skipped.length,
    }, 409);
  }

  if (imported.length === 0) {
    return c.json({ error: 'No valid conversations found in ZIP' }, 400);
  }

  return c.json({
    imported,
    skipped,
    totalImported: imported.length,
    totalSkipped: skipped.length,
  }, 201);
});

export const importRoutes = app;
