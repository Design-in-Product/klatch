import { Hono } from 'hono';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { parseClaudeCodeSession } from '../import/parser.js';
import { parseClaudeAiConversation } from '../import/claude-ai-parser.js';
import { extractFromZip } from '../import/claude-ai-zip.js';
import { importSession, findChannelByOriginalSessionId, getImportConflictInfo, countChannelsByOriginalSessionId } from '../db/queries.js';
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
  const { sessionPath, channelName, forceImport } = await c.req.json<{
    sessionPath: string;
    channelName?: string;
    forceImport?: boolean;
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

  // Check for duplicate import (skip if forceImport)
  if (session.sessionId && !forceImport) {
    const existing = findChannelByOriginalSessionId(session.sessionId);
    if (existing) {
      const conflict = getImportConflictInfo(existing.id);
      return c.json({
        error: 'duplicate',
        existingChannelId: existing.id,
        existingChannelName: existing.name,
        existingMessageCount: conflict.messageCount,
        hasNewMessages: conflict.hasNewMessages,
        nativeMessageCount: conflict.nativeMessageCount,
        sessionId: session.sessionId,
      }, 409);
    }
  }

  // Generate channel name, with disambiguation suffix for fork-again imports
  let name = channelName || generateChannelName(session.cwd, session.firstTimestamp);
  if (forceImport && session.sessionId) {
    const existingCount = countChannelsByOriginalSessionId(session.sessionId);
    if (existingCount > 0) {
      name = `${name} (${existingCount + 1})`;
    }
  }

  // Resolve model: map legacy IDs to current ones
  const resolvedModel = resolveModel(session.model);

  // Read project context files (best-effort)
  let claudeMd: string | undefined;
  let memoryMd: string | undefined;

  if (session.cwd) {
    // CLAUDE.md from the project root
    const claudeMdPath = path.join(session.cwd, 'CLAUDE.md');
    try {
      if (fs.existsSync(claudeMdPath)) {
        claudeMd = fs.readFileSync(claudeMdPath, 'utf-8');
      }
    } catch { /* best-effort — file may be unreadable */ }

    // MEMORY.md from Claude Code's projects directory
    // Claude Code encodes cwd by replacing / with - (leading slash becomes leading -)
    // e.g., /Users/xian/Development/klatch → -Users-xian-Development-klatch
    const encodedCwd = session.cwd.replace(/\//g, '-');
    const memoryMdPath = path.join(
      os.homedir(), '.claude', 'projects', encodedCwd, 'memory', 'MEMORY.md'
    );
    try {
      if (fs.existsSync(memoryMdPath)) {
        memoryMd = fs.readFileSync(memoryMdPath, 'utf-8');
      }
    } catch { /* best-effort — file may be unreadable */ }
  }

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
      claudeMd,
      memoryMd,
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
 * POST /import/claude-ai/preview
 *
 * Preview a claude.ai export ZIP — returns metadata about conversations,
 * projects, and memories without importing anything.
 *
 * Returns: 200 with { conversations, projects, memories }
 */
app.post('/import/claude-ai/preview', async (c) => {
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

  let exportData;
  try {
    exportData = extractFromZip(zipBuffer);
  } catch {
    return c.json({ error: 'Invalid ZIP file' }, 400);
  }

  const { conversations: conversationFiles, projects, memories } = exportData;

  // Build conversation previews with dedup detection
  const conversations = conversationFiles.map(({ conversation }) => {
    const conv = conversation as {
      uuid?: string; name?: string; created_at?: string; updated_at?: string;
      project_uuid?: string; chat_messages?: unknown[];
    };

    const uuid = conv.uuid || '';
    const existing = uuid ? findChannelByOriginalSessionId(uuid) : undefined;
    const projectName = conv.project_uuid ? projects.get(conv.project_uuid)?.name : undefined;

    return {
      uuid,
      name: conv.name || 'Untitled',
      messageCount: Array.isArray(conv.chat_messages) ? conv.chat_messages.length : 0,
      projectUuid: conv.project_uuid,
      projectName,
      createdAt: conv.created_at || '',
      updatedAt: conv.updated_at || '',
      alreadyImported: !!existing,
      existingChannelId: existing?.id,
    };
  });

  // Build project list
  const projectList = Array.from(projects.values()).map((p) => ({
    uuid: p.uuid,
    name: p.name,
    documentCount: p.documentCount || 0,
  }));

  return c.json({
    conversations,
    projects: projectList,
    memories: memories.map((m) => ({
      uuid: m.uuid,
      content: m.content.length > 200 ? m.content.slice(0, 200) + '...' : m.content,
      createdAt: m.createdAt || '',
    })),
  }, 200);
});

/**
 * POST /import/claude-ai
 *
 * Import conversations from a claude.ai email export ZIP file.
 * Supports both multipart file upload and JSON body with file path.
 *
 * Multipart: Send ZIP as "file" field in multipart/form-data.
 * JSON: { zipPath: string, selectedConversationIds?: string[] } — for testing/CLI use.
 *
 * Optional: selectedConversationIds — if provided, only import matching UUIDs.
 * Omit to import all (backward compatible).
 *
 * Returns: 201 with { imported, skipped, totalImported, totalSkipped }
 */
app.post('/import/claude-ai', async (c) => {
  // Extract selectedConversationIds from JSON body (if present) before reading ZIP
  let selectedConversationIds: string[] | undefined;
  const contentType = c.req.header('content-type') || '';
  if (contentType.includes('multipart/form-data')) {
    // For multipart, selectedConversationIds comes as a form field
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
    const selectionField = formData.get('selectedConversationIds');
    if (selectionField && typeof selectionField === 'string') {
      try {
        selectedConversationIds = JSON.parse(selectionField);
      } catch { /* ignore malformed */ }
    }

    return processImport(c, Buffer.from(arrayBuffer), selectedConversationIds);
  } else {
    const body = await c.req.json<{ zipPath?: string; selectedConversationIds?: string[] }>();
    selectedConversationIds = body.selectedConversationIds;
    const zipPath = body.zipPath;
    if (!zipPath || !zipPath.endsWith('.zip')) {
      return c.json({ error: 'File must be a .zip file' }, 400);
    }
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
    return processImport(c, fs.readFileSync(expandedZipPath), selectedConversationIds);
  }
});

/** Shared import logic for the claude-ai endpoint */
function processImport(
  c: any,
  zipBuffer: Buffer,
  selectedConversationIds?: string[],
  forceImport = false,
) {
  let exportData;
  try {
    exportData = extractFromZip(zipBuffer);
  } catch {
    return c.json({ error: 'Invalid ZIP file' }, 400);
  }

  const { conversations: conversationFiles, projects } = exportData;

  if (conversationFiles.length === 0) {
    return c.json({ error: 'ZIP contains no conversations' }, 400);
  }

  // Build selection set for filtering (if provided)
  const selectionSet = selectedConversationIds ? new Set(selectedConversationIds) : null;

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
    const conv = conversation as { uuid?: string; name?: string; created_at?: string; updated_at?: string; project_uuid?: string };

    // Skip conversations not in the selection set (if filtering)
    if (selectionSet && conv.uuid && !selectionSet.has(conv.uuid)) {
      continue;
    }

    const parsed = parseClaudeAiConversation(conversation);

    if (parsed.turns.length === 0) {
      if (parsed.sessionId) {
        skipped.push({ conversationId: parsed.sessionId, reason: 'empty' });
      }
      continue;
    }

    // Dedup check using the conversation UUID (skip if forceImport)
    if (parsed.sessionId && !forceImport) {
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

    // Resolve project name from projects.json if the conversation belongs to a project
    const projectName = conv.project_uuid ? projects.get(conv.project_uuid)?.name : undefined;

    // Build channel name: "ProjectName: ConvName" or just "ConvName" or fallback
    const convName = parsed.slug || `claude.ai — ${parsed.sessionId || 'import'}`;
    let channelName = projectName ? `${projectName}: ${convName}` : convName;

    // Disambiguate name for fork-again imports
    if (forceImport && parsed.sessionId) {
      const existingCount = countChannelsByOriginalSessionId(parsed.sessionId);
      if (existingCount > 0) {
        channelName = `${channelName} (${existingCount + 1})`;
      }
    }

    const result = importSession({
      channelName,
      source: 'claude-ai',
      sourceMetadata: {
        originalSessionId: parsed.sessionId,
        conversationName: parsed.slug,
        projectUuid: conv.project_uuid,
        projectName,
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

  // All duplicates → 409 (only when there are actual skipped duplicates)
  if (imported.length === 0 && skipped.length > 0 && skipped.every((s) => s.reason === 'duplicate')) {
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
}

export const importRoutes = app;
