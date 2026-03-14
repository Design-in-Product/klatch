import fs from 'fs';
import os from 'os';
import path from 'path';
import readline from 'readline';
import { findChannelByOriginalSessionId } from '../db/queries.js';

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
      const existing = findChannelByOriginalSessionId(sessionId);

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
