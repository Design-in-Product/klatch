// ── ZIP extraction for claude.ai email exports ─────────────────
// Extracts conversation JSON files and project metadata from a claude.ai export ZIP.

import AdmZip from 'adm-zip';

export interface ConversationFile {
  filename: string;
  conversation: unknown;
}

export interface ProjectInfo {
  uuid: string;
  name: string;
  documentCount?: number;
}

export interface MemoryItem {
  uuid: string;
  content: string;
  createdAt?: string;
}

export interface ClaudeAiExport {
  conversations: ConversationFile[];
  /** Map from project UUID → project info (from projects.json) */
  projects: Map<string, ProjectInfo>;
  /** Memory items from memories.json */
  memories: MemoryItem[];
}

/**
 * Extract conversations and projects from a claude.ai data export ZIP buffer.
 *
 * Supports two conversation formats:
 * 1. Single `conversations.json` at root — array of conversation objects (current export format)
 * 2. Individual .json files inside a `conversations/` directory (legacy/anticipated format)
 *
 * Also extracts `projects.json` to resolve project names for conversations.
 * Skips malformed JSON files gracefully.
 */
export function extractFromZip(zipBuffer: Buffer): ClaudeAiExport {
  const zip = new AdmZip(zipBuffer);
  const entries = zip.getEntries();
  const conversations: ConversationFile[] = [];
  const projects = new Map<string, ProjectInfo>();
  const memories: MemoryItem[] = [];

  for (const entry of entries) {
    if (entry.isDirectory) continue;

    const name = entry.entryName;
    if (!name.endsWith('.json')) continue;

    try {
      const content = entry.getData().toString('utf-8');
      const parsed = JSON.parse(content);
      const basename = name.split('/').pop();

      // projects.json — array of project objects with uuid and name
      if (basename === 'projects.json' && Array.isArray(parsed)) {
        for (const proj of parsed) {
          if (proj && proj.uuid && proj.name) {
            const docs = Array.isArray(proj.docs) ? proj.docs : [];
            projects.set(proj.uuid, {
              uuid: proj.uuid,
              name: proj.name,
              documentCount: docs.length,
            });
          }
        }
        continue;
      }

      // memories.json — array of memory objects
      if (basename === 'memories.json' && Array.isArray(parsed)) {
        for (const mem of parsed) {
          if (mem && (mem.uuid || mem.id)) {
            memories.push({
              uuid: mem.uuid || mem.id,
              content: typeof mem.content === 'string' ? mem.content : (typeof mem.text === 'string' ? mem.text : ''),
              createdAt: mem.created_at || mem.createdAt,
            });
          }
        }
        continue;
      }

      // Format 1: conversations.json at root — array of conversation objects
      if (basename === 'conversations.json' && Array.isArray(parsed)) {
        for (const conv of parsed) {
          if (conv && Array.isArray(conv.chat_messages)) {
            conversations.push({
              filename: `${name}#${conv.uuid || conversations.length}`,
              conversation: conv,
            });
          }
        }
        continue;
      }

      // Format 2: individual files inside conversations/ directory
      if (name.includes('conversations/')) {
        if (parsed && Array.isArray(parsed.chat_messages)) {
          conversations.push({
            filename: name,
            conversation: parsed,
          });
        }
      }
    } catch {
      // Skip malformed JSON files
    }
  }

  return { conversations, projects, memories };
}

/**
 * @deprecated Use extractFromZip() which also extracts projects.
 * Kept for backward compatibility with existing tests.
 */
export function extractConversationsFromZip(zipBuffer: Buffer): ConversationFile[] {
  return extractFromZip(zipBuffer).conversations;
}
