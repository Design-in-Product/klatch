import { Hono } from 'hono';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { parseClaudeCodeSession, parseClaudeCodeSessionFromContent } from '../import/parser.js';
import { parseClaudeAiConversation } from '../import/claude-ai-parser.js';
import { extractFromZip } from '../import/claude-ai-zip.js';
import { scanClaudeCodeSessions, scanExportedSessions } from '../import/session-scanner.js';
import { importKlatchPackage } from '../import/klatch-import.js';
import { resolveImportEntity } from '../import/entity-resolve.js';
import { guessEntityName } from '../import/entity-guess.js';
import { importSession, findChannelByOriginalSessionId, getImportConflictInfo, countChannelsByOriginalSessionId, findOrCreateProject, findUniqueProjectByName } from '../db/queries.js';
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
 * GET /import/claude-code/sessions
 *
 * Scan ~/.claude/projects/ for available Claude Code sessions.
 * Returns sessions grouped by project, with dedup detection.
 */
app.get('/import/claude-code/sessions', async (c) => {
  try {
    const projects = await scanClaudeCodeSessions();

    // Also scan the repo's exports/sessions/ directory for cloud agent sessions
    const exported = await scanExportedSessions(process.cwd());
    if (exported) {
      projects.push(exported);
    }

    // Attach a proposed entity name to each session so the import UI can
    // pre-fill the confirm step rather than asking the user to invent one.
    // The guess ships with its `basis` and `rationale` — a confirmation the
    // user can't evaluate is a rubber stamp, and a plausible wrong name is
    // likelier to be waved through than a blank field.
    const projectsWithGuesses = projects.map((p) => ({
      ...p,
      sessions: p.sessions.map((s) => ({
        ...s,
        entityGuess: guessEntityName(s.firstUserMessage, p.projectName ?? s.projectName),
      })),
    }));

    const totalSessions = projects.reduce((sum, p) => sum + p.sessions.length, 0);
    return c.json({
      projects: projectsWithGuesses,
      totalProjects: projects.length,
      totalSessions,
    }, 200);
  } catch (err) {
    return c.json({
      error: 'Failed to scan sessions',
      detail: err instanceof Error ? err.message : 'Unknown error',
    }, 500);
  }
});

/**
 * POST /import/claude-code
 *
 * Import a Claude Code JSONL session file into Klatch as a new channel.
 *
 * Accepts either:
 * - JSON body: { sessionPath: string, channelName?: string, forceImport?: boolean }
 * - Multipart form data: file (.jsonl), channelName?, forceImport? (for cloud agent uploads)
 *
 * Returns: 201 with ImportResult, or 400/404/409 on error.
 */
app.post('/import/claude-code', async (c) => {
  const contentType = c.req.header('content-type') || '';

  if (contentType.includes('multipart/form-data')) {
    // ── File upload path (cloud agent sessions) ──
    const formData = await c.req.formData();
    const file = formData.get('file');
    if (!file || !(file instanceof File)) {
      return c.json({ error: 'No file uploaded. Please choose a session file (.jsonl).' }, 400);
    }
    if (!file.name.endsWith('.jsonl')) {
      return c.json({ error: 'File must be a Claude Code session file (.jsonl).' }, 400);
    }
    const arrayBuffer = await file.arrayBuffer();
    if (arrayBuffer.byteLength > MAX_IMPORT_SIZE) {
      return c.json({ error: `File too large (${Math.round(arrayBuffer.byteLength / 1024 / 1024)}MB). Maximum is ${MAX_IMPORT_SIZE / 1024 / 1024}MB.` }, 400);
    }
    const channelName = formData.get('channelName') as string | null;
    const forceImport = formData.get('forceImport') === 'true';
    const entityName = formData.get('entityName') as string | null;
    const entityId = formData.get('entityId') as string | null;
    const content = Buffer.from(arrayBuffer).toString('utf-8');
    const session = parseClaudeCodeSessionFromContent(content);

    return processClaudeCodeImport(c, session, channelName || undefined, forceImport, true, {
      entityId: entityId || undefined,
      entityName: entityName || undefined,
    });
  } else {
    // ── Path-based import (local sessions) ──
    const { sessionPath, channelName, forceImport, entityName, entityId } = await c.req.json<{
      sessionPath: string;
      channelName?: string;
      forceImport?: boolean;
      /** Confirmed entity name — reused if one already has it, minted otherwise. */
      entityName?: string;
      /** Existing entity chosen explicitly; wins over entityName. */
      entityId?: string;
    }>();

    if (!sessionPath) {
      return c.json({ error: 'sessionPath is required' }, 400);
    }
    if (!sessionPath.endsWith('.jsonl')) {
      return c.json({ error: 'File must be a Claude Code session file (.jsonl).' }, 400);
    }

    const expandedPath = validateImportPath(expandHome(sessionPath));
    if (!expandedPath) {
      return c.json({ error: 'Invalid file path' }, 400);
    }
    if (!fs.existsSync(expandedPath)) {
      return c.json({ error: 'File not found' }, 404);
    }

    const stat = fs.statSync(expandedPath);
    if (stat.size > MAX_IMPORT_SIZE) {
      return c.json({ error: `File too large (${Math.round(stat.size / 1024 / 1024)}MB). Maximum is ${MAX_IMPORT_SIZE / 1024 / 1024}MB.` }, 400);
    }

    const session = await parseClaudeCodeSession(expandedPath);
    return processClaudeCodeImport(c, session, channelName, forceImport === true, false, {
      entityId,
      entityName,
    });
  }
});

/** Shared import logic for Claude Code sessions (both path-based and uploaded) */
function processClaudeCodeImport(
  c: any,
  session: import('../import/parser.js').ParsedSession,
  channelName: string | undefined,
  forceImport: boolean,
  isCloudUpload: boolean,
  /**
   * The entity the user confirmed this session belongs to (xian, 2026-08-08:
   * Klatch guesses, the user confirms). Omit both fields and the import binds
   * to the default entity exactly as it did before — every pre-existing
   * caller and the ~49 already-imported channels are unaffected.
   */
  confirmedEntity?: { entityId?: string; entityName?: string },
) {
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

  // Read project context files (best-effort, only if cwd exists locally)
  let claudeMd: string | undefined;
  let memoryMd: string | undefined;
  const cwdExistsLocally = session.cwd && fs.existsSync(session.cwd);

  if (session.cwd && cwdExistsLocally) {
    const claudeMdPath = path.join(session.cwd, 'CLAUDE.md');
    try {
      if (fs.existsSync(claudeMdPath)) {
        claudeMd = fs.readFileSync(claudeMdPath, 'utf-8');
      }
    } catch { /* best-effort — file may be unreadable */ }

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

  // ── Create/find project ──
  // For local sessions: match by exact cwd (existing behavior)
  // For cloud uploads: try exact cwd first, then fall back to basename matching
  let projectId: string | undefined;
  if (session.cwd) {
    const instructions = claudeMd || '';
    const projectName = path.basename(session.cwd);

    if (cwdExistsLocally) {
      // Local cwd: exact match by cwd (existing behavior)
      const project = findOrCreateProject(
        projectName, instructions, 'claude-code',
        { cwd: session.cwd }, 'cwd', session.cwd, memoryMd || ''
      );
      projectId = project.id;
    } else {
      // Cloud cwd: try exact cwd match first, then fall back to basename
      const project = findOrCreateProject(
        projectName, instructions, 'claude-code',
        { cwd: session.cwd }, 'cwd', session.cwd, memoryMd || ''
      );
      projectId = project.id;

      // If a new project was just created with the cloud cwd, check if an existing
      // project with the same basename already has real content (instructions/memory).
      // If so, link to the existing one instead and clean up the empty new one.
      if (!project.instructions && !project.memory) {
        const existing = findUniqueProjectByName(projectName);
        if (existing && existing.id !== project.id) {
          projectId = existing.id;
        }
      }
    }
  }

  // Resolve the owning entity from what the user confirmed. Reuse-by-name is
  // what turns five confirmed "Daedalus" imports into one Daedalus whose
  // transcript spans all five, rather than five look-alike entities.
  let resolvedEntity: ReturnType<typeof resolveImportEntity>;
  try {
    resolvedEntity = resolveImportEntity({
      entityId: confirmedEntity?.entityId,
      entityName: confirmedEntity?.entityName,
      model: resolvedModel,
    });
  } catch (err) {
    return c.json({ error: err instanceof Error ? err.message : 'Invalid entity' }, 400);
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
      ...(isCloudUpload ? { cloudUpload: true } : {}),
    },
    model: resolvedModel,
    turns: session.turns,
    projectId,
    entityId: resolvedEntity.entityId,
  });

  return c.json({
    ...result,
    sessionId: session.sessionId,
    ...(resolvedEntity.entityId
      ? { entityId: resolvedEntity.entityId, entityDisposition: resolvedEntity.disposition }
      : {}),
    ...(session.skippedLines ? { skippedLines: session.skippedLines } : {}),
  }, 201);
}

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

  try {
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

    // Build project list (include prompt template presence for UI display)
    const projectList = Array.from(projects.values()).map((p) => ({
      uuid: p.uuid,
      name: p.name,
      documentCount: p.documentCount || 0,
      hasPromptTemplate: !!p.promptTemplate,
      hasDocsContent: !!p.docsContent,
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
  } catch (err) {
    console.error('Preview failed:', err);
    return c.json({
      error: `Preview failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
    }, 500);
  }
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
    const forceImport = formData.get('forceImport') === 'true';
    let projectAssignments: Record<string, string> | undefined;
    const assignmentsField = formData.get('projectAssignments');
    if (assignmentsField && typeof assignmentsField === 'string') {
      try {
        projectAssignments = JSON.parse(assignmentsField);
      } catch { /* ignore malformed */ }
    }

    return processImport(c, Buffer.from(arrayBuffer), selectedConversationIds, forceImport, projectAssignments);
  } else {
    const body = await c.req.json<{ zipPath?: string; selectedConversationIds?: string[]; forceImport?: boolean; projectAssignments?: Record<string, string> }>();
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
    return processImport(c, fs.readFileSync(expandedZipPath), selectedConversationIds, body.forceImport === true, body.projectAssignments);
  }
});

/** Shared import logic for the claude-ai endpoint */
function processImport(
  c: any,
  zipBuffer: Buffer,
  selectedConversationIds?: string[],
  forceImport = false,
  projectAssignments?: Record<string, string>,
) {
  let exportData;
  try {
    exportData = extractFromZip(zipBuffer);
  } catch {
    return c.json({ error: 'Invalid ZIP file' }, 400);
  }

  const { conversations: conversationFiles, projects, memories, projectMemories } = exportData;

  if (conversationFiles.length === 0) {
    return c.json({ error: 'ZIP contains no conversations' }, 400);
  }

  try {
    // Build memories text for kit briefing (shared across all conversations in this export)
    const memoriesText = memories
      .filter((m) => m.content.trim())
      .map((m) => m.content.trim())
      .join('\n');
    const memoryMd = memoriesText || undefined;

    // Build selection set for filtering (if provided)
    const selectionSet = selectedConversationIds ? new Set(selectedConversationIds) : null;

    // ── Create projects from ZIP data (8¾a: project context injection) ──
    // For each project in the ZIP, find or create a Klatch project row.
    // This happens before conversation import so channels can be linked.
    const projectIdMap = new Map<string, string>(); // ZIP project UUID → Klatch project ID

    for (const [zipUuid, projInfo] of projects.entries()) {
      // Project instructions = prompt_template (project conventions/rules)
      // Project memory = project-scoped memories + global account memories (merged)
      const instructions = projInfo.promptTemplate || '';
      const projMem = projectMemories.get(zipUuid) || '';

      // Merge project-scoped memories with global account memories (Decision 2: don't drop)
      const memoryParts: string[] = [];
      if (projMem) memoryParts.push(projMem);
      if (memoryMd) memoryParts.push('## Account memories (from claude.ai)\n\n' + memoryMd);
      const mergedMemory = memoryParts.join('\n\n');

      const project = findOrCreateProject(
        projInfo.name,
        instructions,
        'claude-ai',
        {
          originalProjectUuid: zipUuid,
          documentCount: projInfo.documentCount || 0,
          hasPromptTemplate: !!projInfo.promptTemplate,
          hasDocsContent: !!projInfo.docsContent,
          importedAt: new Date().toISOString(),
        },
        'originalProjectUuid',
        zipUuid,
        mergedMemory
      );
      projectIdMap.set(zipUuid, project.id);
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

      // Resolve project: prefer conv.project_uuid from export, fall back to user's manual assignment
      const effectiveProjectUuid = conv.project_uuid || (conv.uuid && projectAssignments?.[conv.uuid]) || undefined;
      const projectName = effectiveProjectUuid ? projects.get(effectiveProjectUuid)?.name : undefined;
      const projectId = effectiveProjectUuid ? projectIdMap.get(effectiveProjectUuid) : undefined;

      // Build channel name — just the conversation name, not prefixed with project
      // (project context comes from sidebar grouping, not the channel name)
      const convName = parsed.slug || `claude.ai — ${parsed.sessionId || 'import'}`;
      let channelName = convName;

      // Disambiguate name for fork-again imports
      if (forceImport && parsed.sessionId) {
        const existingCount = countChannelsByOriginalSessionId(parsed.sessionId);
        if (existingCount > 0) {
          channelName = `${channelName} (${existingCount + 1})`;
        }
      }

      // Build project knowledge context (equivalent of CLAUDE.md for claude.ai imports)
      const project = effectiveProjectUuid ? projects.get(effectiveProjectUuid) : undefined;
      const claudeMd = project?.docsContent || undefined;

      const result = importSession({
        channelName,
        source: 'claude-ai',
        sourceMetadata: {
          originalSessionId: parsed.sessionId,
          conversationName: parsed.slug,
          projectUuid: effectiveProjectUuid,
          projectName,
          createdAt: conv.created_at,
          updatedAt: conv.updated_at,
          eventCount: parsed.eventCount,
          importedAt: new Date().toISOString(),
          claudeMd,
          memoryMd,
        },
        turns: parsed.turns,
        projectId,
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
  } catch (err) {
    console.error('Import failed:', err);
    return c.json({
      error: `Import failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
    }, 500);
  }
}

/**
 * POST /import/klatch
 *
 * Import a canonical Klatch context package (Step 10 Phase 1 zip) into
 * Klatch. Idempotent by canonical UUIDs: re-importing into the source
 * instance attaches to existing rows; importing into a different instance
 * creates fresh rows preserving the canonical ids.
 *
 * Multipart: send the zip as `file` in multipart/form-data.
 * JSON: { zipPath: string, forceImport?: boolean } — for testing/CLI.
 *
 * Returns 201 with KlatchImportResult on success, 409 with conflict info
 * on duplicate (use `forceImport: true` to fork), 400 on invalid zip.
 */
app.post('/import/klatch', async (c) => {
  const contentType = c.req.header('content-type') || '';
  let zipBuffer: Buffer;
  let forceImport = false;

  if (contentType.includes('multipart/form-data')) {
    const formData = await c.req.formData();
    const file = formData.get('file');
    if (!file || !(file instanceof File)) {
      return c.json({ error: 'No file uploaded. Send a zip as "file" in multipart form data.' }, 400);
    }
    if (!file.name.endsWith('.zip')) {
      return c.json({ error: 'File must be a .zip file' }, 400);
    }
    const arrayBuffer = await file.arrayBuffer();
    if (arrayBuffer.byteLength > MAX_IMPORT_SIZE) {
      return c.json({ error: `File too large (${Math.round(arrayBuffer.byteLength / 1024 / 1024)}MB). Maximum is ${MAX_IMPORT_SIZE / 1024 / 1024}MB.` }, 400);
    }
    zipBuffer = Buffer.from(arrayBuffer);
    forceImport = formData.get('forceImport') === 'true';
  } else {
    const body = await c.req.json<{ zipPath?: string; forceImport?: boolean }>();
    if (!body.zipPath || !body.zipPath.endsWith('.zip')) {
      return c.json({ error: 'File must be a .zip file' }, 400);
    }
    const expandedZipPath = validateImportPath(expandHome(body.zipPath));
    if (!expandedZipPath) return c.json({ error: 'Invalid file path' }, 400);
    if (!fs.existsSync(expandedZipPath)) return c.json({ error: 'File not found' }, 404);
    const stat = fs.statSync(expandedZipPath);
    if (stat.size > MAX_IMPORT_SIZE) {
      return c.json({ error: `File too large (${Math.round(stat.size / 1024 / 1024)}MB). Maximum is ${MAX_IMPORT_SIZE / 1024 / 1024}MB.` }, 400);
    }
    zipBuffer = fs.readFileSync(expandedZipPath);
    forceImport = body.forceImport === true;
  }

  const outcome = importKlatchPackage({ zipBuffer, forceImport });
  if (!outcome.ok) {
    if (outcome.status === 409) {
      return c.json({ error: outcome.error, ...outcome.conflict }, 409);
    }
    if (outcome.versionMismatch) {
      return c.json({ error: outcome.error, ...outcome.versionMismatch }, 400);
    }
    return c.json({ error: outcome.error }, outcome.status);
  }

  return c.json(outcome.result, 201);
});

export const importRoutes = app;
