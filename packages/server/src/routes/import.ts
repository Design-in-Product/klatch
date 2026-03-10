import { Hono } from 'hono';
import fs from 'fs';
import path from 'path';
import { parseClaudeCodeSession } from '../import/parser.js';
import { importSession, findChannelByOriginalSessionId } from '../db/queries.js';
import { MODEL_ALIASES, AVAILABLE_MODELS } from '@klatch/shared';
import type { ModelId } from '@klatch/shared';

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

  // Expand ~ to home directory
  const expandedPath = sessionPath.startsWith('~')
    ? path.join(process.env.HOME || '', sessionPath.slice(1))
    : sessionPath;

  // Check file exists
  if (!fs.existsSync(expandedPath)) {
    return c.json({ error: 'File not found' }, 404);
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

export const importRoutes = app;
