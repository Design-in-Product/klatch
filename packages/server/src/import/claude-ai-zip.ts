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
  if (typeof value === 'string') return value;
  if (!Array.isArray(value) || value.length === 0) return null;
  if (!value.every((v) => typeof v === 'string')) return null;
  const parts = value as string[];

  // Char array: every element is a single CODE POINT. Note [...v].length rather than
  // v.length — an astral character (any emoji) has .length === 2 in JS, so the old test
  // failed on the whole array if a single emoji appeared anywhere in the memory, and the
  // caller then fell through to '' — silent loss of the entire memory.
  if (parts.every((v) => [...v].length === 1)) return parts.join('');

  // Otherwise it is a list of whole strings. Keep all of them rather than returning null
  // and dropping the lot; a one-element array of a full string is the common real case.
  return parts.join('\n\n');
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

            // Extract text content from project knowledge documents (best-effort — field names vary)
            const docsTexts: string[] = [];
            for (const doc of docs) {
              const text = typeof doc === 'string' ? doc
                : (doc?.content ?? doc?.text ?? doc?.body ?? '');
              if (typeof text === 'string' && text.trim()) {
                const title = doc?.filename ?? doc?.name ?? doc?.title ?? '';
                docsTexts.push(title ? `## ${title}\n${text.trim()}` : text.trim());
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

      // memories.json — conversation-level and project-scoped memories.
      //
      // Real exports wrap the payload in a SINGLE-ELEMENT ARRAY:
      //   [{ conversations_memory: "<string>", project_memories: {...}, account_uuid }]
      // (research/claude-export-format-analysis.docx). The original code treated any
      // array as a list of memory items requiring uuid/id, so the real container was
      // skipped; the object branch was guarded by !Array.isArray and never ran; and
      // joinIfCharArray — the 2026-03-14 char-array fix — was unreachable on real data.
      // Every claude.ai import therefore produced empty memory, silently, while
      // CHANGELOG.md:182 and docs/PROMPT-ASSEMBLY.md:69 said otherwise.
      // Fixed 2026-08-28. Both container and loose-item shapes are now accepted.
      if (basename === 'memories.json') {
        const isContainer = (v: any): boolean =>
          !!v && typeof v === 'object' && !Array.isArray(v) &&
          ('conversations_memory' in v || 'project_memories' in v);

        const containers: any[] = [];
        const looseItems: any[] = [];

        if (Array.isArray(parsed)) {
          for (const el of parsed) {
            if (isContainer(el)) containers.push(el);
            else if (el && typeof el === 'object') looseItems.push(el);
          }
        } else if (parsed && typeof parsed === 'object') {
          containers.push(parsed);
        }

        // An item that carries its own uuid is a user-declared entry: emit it even when
        // the content is empty, which is the long-standing contract (see
        // memories-parsing.test.ts, "handles memory with empty content"). Entries we
        // *synthesize* from a container are skipped when they would carry nothing —
        // inventing a blank memory would put a misleading count in the import preview.
        const pushItem = (mem: any, fallbackUuid: string, skipIfEmpty: boolean) => {
          const memContent =
            joinIfCharArray(mem.content) ?? (typeof mem.text === 'string' ? mem.text : '');
          if (skipIfEmpty && !memContent.trim()) return;
          memories.push({
            uuid: mem.uuid || mem.id || fallbackUuid,
            content: memContent,
            createdAt: mem.created_at || mem.createdAt,
          });
        };

        // Loose items: [{uuid, content}, ...] — the shape the existing tests use.
        looseItems.forEach((mem, i) => {
          if (mem.uuid || mem.id) pushItem(mem, `memory-${i}`, false);
        });

        for (const container of containers) {
          const accountUuid =
            typeof container.account_uuid === 'string' ? container.account_uuid : 'account';

          // conversations_memory is a STRING in real exports; older/other shapes give an
          // array of items or a char array. Accept all three rather than one.
          const cm = container.conversations_memory;
          if (Array.isArray(cm) && cm.some((m: any) => m && typeof m === 'object' && !Array.isArray(m))) {
            cm.forEach((mem: any, i: number) => {
              if (mem && typeof mem === 'object') pushItem(mem, `${accountUuid}-cm-${i}`, true);
            });
          } else {
            const joined = joinIfCharArray(cm);
            if (joined && joined.trim()) {
              memories.push({ uuid: `${accountUuid}-conversations-memory`, content: joined });
            }
          }

          // Project-scoped memories, keyed by project UUID.
          if (container.project_memories && typeof container.project_memories === 'object') {
            for (const [projUuid, memValue] of Object.entries(container.project_memories)) {
              // A project's value may itself be an object wrapper rather than a bare string.
              const raw =
                memValue && typeof memValue === 'object' && !Array.isArray(memValue)
                  ? ((memValue as any).content ?? (memValue as any).text ?? (memValue as any).memory)
                  : memValue;
              const joined = joinIfCharArray(raw);
              if (joined && joined.trim()) {
                // Merge rather than overwrite when a project appears in more than one container.
                const existing = projectMemories.get(projUuid);
                projectMemories.set(projUuid, existing ? `${existing}\n\n${joined}` : joined);
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
