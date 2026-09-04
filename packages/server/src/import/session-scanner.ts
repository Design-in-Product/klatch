import fs from 'fs';
import os from 'os';
import path from 'path';
import readline from 'readline';
import { createChannelBySessionIdResolver } from '../db/queries.js';
import { isHumanTurnBoundary } from './parser.js';

export interface SessionInfo {
  /** Full path to the JSONL file */
  path: string;
  /** Session UUID (filename without .jsonl) */
  sessionId: string;
  /** Decoded project working directory */
  projectPath: string;
  /** Project name (basename of projectPath) */
  projectName: string;
  /** File size in bytes */
  sizeBytes: number;
  /** Last modified date (ISO string) */
  modifiedAt: string;
  /** Whether this session has already been imported */
  alreadyImported: boolean;
  /** Channel ID if already imported */
  existingChannelId?: string;
  /** Channel name if already imported */
  existingChannelName?: string;
  /** Whether this session came from the exports directory (cloud agent convention) */
  isExported?: boolean;
  /** Content fingerprint — first real human-typed user message, truncated ~80 chars. Empty if not found. */
  firstUserMessage?: string;
  /** Approximate message count (user + assistant turns). May be capped — see fingerprintCapped. */
  messageCount?: number;
  /**
   * Number of human turn boundaries — i.e. how many exchanges this session
   * becomes once imported. This is the count that predicts what lands:
   * `importSession` persists at most two rows per turn.
   *
   * `messageCount` counts raw events instead, and is 2–3x larger on real
   * sessions because every assistant tool-call event is its own JSONL event
   * but collapses into one row plus artifacts. Measured on real sessions:
   * 469 events -> 75 turns -> 143 rows. See
   * `scripts/probe-browse-count-vs-persisted-rows.mts` for the reconciliation.
   *
   * Also capped — see fingerprintCapped.
   */
  turnCount?: number;
  /** True if the fingerprint scan hit its line-read cap before reaching EOF (messageCount is a lower bound). */
  fingerprintCapped?: boolean;
}

export interface ProjectSessions {
  /** Decoded project working directory */
  projectPath: string;
  /** Project name (basename of projectPath) */
  projectName: string;
  /** Sessions in this project, sorted by modification date (newest first) */
  sessions: SessionInfo[];
}

/**
 * Decode a Claude Code encoded project directory name back to an absolute path.
 * Claude Code encodes cwd by replacing / with - (leading slash becomes leading -).
 * e.g., -home-user-klatch → /home/user/klatch
 *
 * Note: This is a heuristic — ambiguous if directory names contain hyphens.
 * We validate by checking if the decoded path exists on the filesystem.
 */
export function decodeProjectPath(encoded: string): string {
  // Replace leading - with /, then remaining - with /
  // This is the inverse of cwd.replace(/\//g, '-')
  if (encoded.startsWith('-')) {
    return encoded.replace(/-/g, '/');
  }
  return '/' + encoded.replace(/-/g, '/');
}

/**
 * Get the base directory where Claude Code stores project data.
 */
export function getClaudeProjectsDir(): string {
  return path.join(os.homedir(), '.claude', 'projects');
}

/**
 * Extract the session ID from the first few lines of a JSONL file.
 * Reads only the first event to get the sessionId, avoiding full file parse.
 */
export async function extractSessionId(filePath: string): Promise<string | undefined> {
  return new Promise((resolve) => {
    const stream = fs.createReadStream(filePath, { encoding: 'utf-8' });
    const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });
    let found = false;

    rl.on('line', (line) => {
      if (found) return;
      try {
        const event = JSON.parse(line);
        if (event.sessionId) {
          found = true;
          rl.close();
          stream.destroy();
          resolve(event.sessionId);
        }
      } catch {
        // skip malformed lines
      }
    });

    rl.on('close', () => {
      if (!found) resolve(undefined);
    });

    rl.on('error', () => resolve(undefined));
    stream.on('error', () => resolve(undefined));
  });
}

/** Default cap on lines read for fingerprint scan — keeps Browse responsive on long sessions. */
const FINGERPRINT_LINE_CAP = 1500;
/** Truncate the surfaced first-user-message to this many chars (per Iris T1.6). */
const FINGERPRINT_MAX_CHARS = 80;

/**
 * Pull a content fingerprint from a JSONL session — first real human-typed
 * user message + approximate turn count. Streams up to FINGERPRINT_LINE_CAP
 * lines and reports whether the cap was reached (messageCount becomes a
 * lower bound in that case).
 *
 * `lineCap` is overridable so the cap's latency cost can be measured against
 * the shipped code path rather than a copy of it (see
 * scripts/probe-scan-latency-vs-cap.mts). Callers in the product don't pass it.
 *
 * "Real human" filter mirrors parser.ts isConversationEvent + the injection-
 * metadata flags: skip events that are isMeta / isCompactSummary / tool
 * results / sidechain. We don't need byte-perfect fidelity for a fingerprint;
 * a reasonably faithful preview is the goal.
 */
export async function extractSessionFingerprint(filePath: string, lineCap: number = FINGERPRINT_LINE_CAP): Promise<{
  firstUserMessage: string;
  messageCount: number;
  turnCount: number;
  capped: boolean;
}> {
  return new Promise((resolve) => {
    const stream = fs.createReadStream(filePath, { encoding: 'utf-8' });
    const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });

    let firstUserMessage = '';
    let messageCount = 0;
    let turnCount = 0;
    let linesRead = 0;
    let capped = false;

    const finish = () => {
      rl.close();
      stream.destroy();
      resolve({ firstUserMessage, messageCount, turnCount, capped });
    };

    rl.on('line', (line) => {
      linesRead++;
      if (linesRead > lineCap) {
        capped = true;
        finish();
        return;
      }

      let event: any;
      try { event = JSON.parse(line); } catch { return; }
      if (!event || (event.type !== 'user' && event.type !== 'assistant')) return;
      if (event.isSidechain) return;
      if (event.isMeta || event.isCompactSummary || event.isVisibleInTranscriptOnly) return;
      if (!event.message) return;

      // Tool-result user events: content is an array of tool_result blocks. Skip.
      if (event.type === 'user') {
        const content = event.message.content;
        const isToolResult = Array.isArray(content) && content.every((b: any) => b?.type === 'tool_result');
        if (isToolResult) return;

        // Count turns with the importer's own predicate, so the browse screen
        // and the import agree by construction rather than by coincidence.
        // Boundary detection is per-event and order-independent, so counting in
        // stream order matches groupIntoTurns' post-sort count.
        //
        // The two filters are near-identical but not provably equal: this
        // scanner also drops isVisibleInTranscriptOnly, which
        // isHumanTurnBoundary does not check. Measured across the repo's real
        // sessions the divergence is 0 events; the probe script reports it as
        // "boundaries scanner missed" if that ever stops being true.
        if (isHumanTurnBoundary(event)) turnCount++;

        // First real human-typed user message wins
        if (!firstUserMessage) {
          const text = extractFingerprintText(content);
          if (text) {
            firstUserMessage = text.length > FINGERPRINT_MAX_CHARS
              ? text.slice(0, FINGERPRINT_MAX_CHARS - 1).trimEnd() + '…'
              : text;
          }
        }
      }

      messageCount++;
    });

    rl.on('close', () => resolve({ firstUserMessage, messageCount, turnCount, capped }));
    rl.on('error', () => resolve({ firstUserMessage, messageCount, turnCount, capped }));
    stream.on('error', () => resolve({ firstUserMessage, messageCount, turnCount, capped }));
  });
}

function extractFingerprintText(content: any): string {
  if (typeof content === 'string') return content.trim();
  if (!Array.isArray(content)) return '';
  for (const block of content) {
    if (block?.type === 'text' && typeof block.text === 'string' && block.text.trim()) {
      return block.text.trim();
    }
  }
  return '';
}

/**
 * Scan ~/.claude/projects/ for Claude Code session files.
 * Returns sessions grouped by project, with dedup detection.
 */
export async function scanClaudeCodeSessions(): Promise<ProjectSessions[]> {
  const projectsDir = getClaudeProjectsDir();

  if (!fs.existsSync(projectsDir)) {
    return [];
  }

  const entries = fs.readdirSync(projectsDir, { withFileTypes: true });
  const projects: ProjectSessions[] = [];

  // One channels scan for the whole walk instead of one per session file — the
  // per-call lookup is unindexed, so in a loop it costs O(files x channels).
  // Nothing here writes channels, so a snapshot is safe.
  const findChannel = createChannelBySessionIdResolver();

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const projectDir = path.join(projectsDir, entry.name);
    const projectPath = decodeProjectPath(entry.name);
    const projectName = path.basename(projectPath);

    // Find all .jsonl files in this project directory (non-recursive — subagent dirs have their own)
    let files: fs.Dirent[];
    try {
      files = fs.readdirSync(projectDir, { withFileTypes: true });
    } catch {
      continue; // skip unreadable directories
    }

    const sessions: SessionInfo[] = [];

    for (const file of files) {
      if (!file.isFile() || !file.name.endsWith('.jsonl')) continue;

      const filePath = path.join(projectDir, file.name);
      const sessionId = file.name.replace('.jsonl', '');

      let stat: fs.Stats;
      try {
        stat = fs.statSync(filePath);
      } catch {
        continue; // skip unreadable files
      }

      // Skip tiny files (< 100 bytes — likely empty or corrupted)
      if (stat.size < 100) continue;

      // Check dedup against database
      const existing = findChannel(sessionId);

      // Content fingerprint — first user message + approximate turn count
      const fp = await extractSessionFingerprint(filePath);

      sessions.push({
        path: filePath,
        sessionId,
        projectPath,
        projectName,
        sizeBytes: stat.size,
        modifiedAt: stat.mtime.toISOString(),
        alreadyImported: !!existing,
        existingChannelId: existing?.id,
        existingChannelName: existing?.name,
        firstUserMessage: fp.firstUserMessage || undefined,
        messageCount: fp.messageCount,
        turnCount: fp.turnCount,
        fingerprintCapped: fp.capped || undefined,
      });
    }

    // Sort by modification date (newest first)
    sessions.sort((a, b) => b.modifiedAt.localeCompare(a.modifiedAt));

    if (sessions.length > 0) {
      projects.push({ projectPath, projectName, sessions });
    }
  }

  // Sort projects alphabetically by name
  projects.sort((a, b) => a.projectName.localeCompare(b.projectName));

  return projects;
}

/**
 * Scan the repo's exports/sessions/ directory for JSONL files.
 * Cloud agents commit their session files here for easy import.
 * Returns a single ProjectSessions group if any files are found.
 */
export async function scanExportedSessions(repoRoot: string): Promise<ProjectSessions | null> {
  const exportDir = path.join(repoRoot, 'exports', 'sessions');

  if (!fs.existsSync(exportDir)) return null;

  let files: fs.Dirent[];
  try {
    files = fs.readdirSync(exportDir, { withFileTypes: true });
  } catch {
    return null;
  }

  const sessions: SessionInfo[] = [];

  // Same reason as scanClaudeCodeSessions: one channels scan, not one per file.
  const findChannel = createChannelBySessionIdResolver();

  for (const file of files) {
    if (!file.isFile() || !file.name.endsWith('.jsonl')) continue;

    const filePath = path.join(exportDir, file.name);
    let stat: fs.Stats;
    try {
      stat = fs.statSync(filePath);
    } catch {
      continue;
    }

    if (stat.size < 100) continue;

    // Extract session ID: try the filename (sans .jsonl), or read from file
    const sessionId = file.name.replace('.jsonl', '');
    const existing = findChannel(sessionId);
    const fp = await extractSessionFingerprint(filePath);

    sessions.push({
      path: filePath,
      sessionId,
      projectPath: exportDir,
      projectName: 'Exported sessions',
      sizeBytes: stat.size,
      modifiedAt: stat.mtime.toISOString(),
      alreadyImported: !!existing,
      existingChannelId: existing?.id,
      existingChannelName: existing?.name,
      isExported: true,
      firstUserMessage: fp.firstUserMessage || undefined,
      messageCount: fp.messageCount,
      turnCount: fp.turnCount,
      fingerprintCapped: fp.capped || undefined,
    });
  }

  if (sessions.length === 0) return null;

  sessions.sort((a, b) => b.modifiedAt.localeCompare(a.modifiedAt));

  return {
    projectPath: exportDir,
    projectName: 'Exported sessions',
    sessions,
  };
}
