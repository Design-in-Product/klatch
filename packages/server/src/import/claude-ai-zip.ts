// ── ZIP extraction for claude.ai email exports ─────────────────
// Extracts conversation JSON files from a claude.ai export ZIP.

import AdmZip from 'adm-zip';

export interface ConversationFile {
  filename: string;
  conversation: unknown;
}

/**
 * Extract conversations from a claude.ai data export ZIP buffer.
 *
 * Supports two formats:
 * 1. Single `conversations.json` at root — array of conversation objects (current export format)
 * 2. Individual .json files inside a `conversations/` directory (legacy/anticipated format)
 *
 * Skips malformed JSON files gracefully.
 */
export function extractConversationsFromZip(zipBuffer: Buffer): ConversationFile[] {
  const zip = new AdmZip(zipBuffer);
  const entries = zip.getEntries();
  const conversations: ConversationFile[] = [];

  for (const entry of entries) {
    if (entry.isDirectory) continue;

    const name = entry.entryName;
    if (!name.endsWith('.json')) continue;

    try {
      const content = entry.getData().toString('utf-8');
      const parsed = JSON.parse(content);

      // Format 1: conversations.json at root — array of conversation objects
      const basename = name.split('/').pop();
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

  return conversations;
}
