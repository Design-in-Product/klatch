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
  promptTemplate?: string;  // Project system prompt from projects.json
  docsContent?: string;     // Concatenated text from project knowledge docs
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
  /** Memory items from memories.json (conversation-level) */
  memories: MemoryItem[];
  /** Project-scoped memories from memories.json, keyed by project UUID */
  projectMemories: Map<string, string>;
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
/**
 * Join a character array into a string if the value is an array of single characters.
 * claude.ai exports sometimes store project memories as char arrays: ["*", "*", "P", "u", "r", ...]
 * Bug discovered during Theseus Day 4 testing (2026-03-14).
 */
function joinIfCharArray(value: unknown): string | null {
  if (Array.isArray(value) && value.length > 0 && value.every((v) => typeof v === 'string' && v.length === 1)) {
    return value.join('');
  }
  if (typeof value === 'string') return value;
  return null;
}

export function extractFromZip(zipBuffer: Buffer): ClaudeAiExport {
  const zip = new AdmZip(zipBuffer);
  const entries = zip.getEntries();
  const conversations: ConversationFile[] = [];
  const projects = new Map<string, ProjectInfo>();
  const memories: MemoryItem[] = [];
  const projectMemories = new Map<string, string>();

  for (const entry of entries) {
    if (entry.isDirectory) continue;

    const name = entry.entryName;
    if (!name.endsWith('.json')) continue;

    try {
      const content = entry.getData().toString('utf-8');
      const parsed = JSON.parse(content);
      const basename = name.split('/').pop();

      // projects.json — array of project objects with uuid, name, prompt_template, docs
      if (basename === 'projects.json' && Array.isArray(parsed)) {
        for (const proj of parsed) {
          if (proj && proj.uuid && proj.name) {
            const docs = Array.isArray(proj.docs) ? proj.docs : [];

            // Extract document content (best-effort — field names vary)
            const docsTexts: string[] = [];
            for (const doc of docs) {
              const text = doc?.content ?? doc?.text ?? doc?.body ?? '';
              if (typeof text === 'string' && text.trim()) {
                const docName = doc?.filename || doc?.name || 'untitled';
                docsTexts.push(`## ${docName}\n${text.trim()}`);
              }
            }

            projects.set(proj.uuid, {
              uuid: proj.uuid,
              name: proj.name,
              promptTemplate: typeof proj.prompt_template === 'string' ? proj.prompt_template : undefined,
              docsContent: docsTexts.length > 0 ? docsTexts.join('\n\n') : undefined,
              documentCount: docs.length,
            });
          }
        }
        continue;
      }

      // memories.json — can contain both conversation-level and project-scoped memories
      if (basename === 'memories.json') {
        // Handle array format (conversation-level memories)
        if (Array.isArray(parsed)) {
          for (const mem of parsed) {
            if (mem && (mem.uuid || mem.id)) {
              const memContent = joinIfCharArray(mem.content) ?? (typeof mem.text === 'string' ? mem.text : '');
              memories.push({
                uuid: mem.uuid || mem.id,
                content: memContent,
                createdAt: mem.created_at || mem.createdAt,
              });
            }
          }
        }

        // Handle object format with project_memories map
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          // Top-level conversation memories
          if (Array.isArray(parsed.conversations_memory)) {
            for (const mem of parsed.conversations_memory) {
              if (mem && (mem.uuid || mem.id)) {
                const memContent = joinIfCharArray(mem.content) ?? (typeof mem.text === 'string' ? mem.text : '');
                memories.push({
                  uuid: mem.uuid || mem.id,
                  content: memContent,
                  createdAt: mem.created_at || mem.createdAt,
                });
              }
            }
          }

          // Project-scoped memories (keyed by project UUID)
          if (parsed.project_memories && typeof parsed.project_memories === 'object') {
            for (const [projUuid, memValue] of Object.entries(parsed.project_memories)) {
              const joined = joinIfCharArray(memValue);
              if (joined && joined.trim()) {
                projectMemories.set(projUuid, joined);
              }
            }
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

  return { conversations, projects, memories, projectMemories };
}

/**
 * @deprecated Use extractFromZip() which also extracts projects.
 * Kept for backward compatibility with existing tests.
 */
export function extractConversationsFromZip(zipBuffer: Buffer): ConversationFile[] {
  return extractFromZip(zipBuffer).conversations;
}
