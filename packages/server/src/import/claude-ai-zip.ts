// ── ZIP extraction for claude.ai email exports ─────────────────
// Extracts conversation JSON files from a claude.ai export ZIP.

import AdmZip from 'adm-zip';

export interface ConversationFile {
  filename: string;
  conversation: unknown;
}

/**
 * Extract all conversation JSON files from a claude.ai export ZIP buffer.
 * Looks for .json files in any `conversations/` directory within the ZIP.
 * Skips malformed JSON files gracefully.
 */
export function extractConversationsFromZip(zipBuffer: Buffer): ConversationFile[] {
  const zip = new AdmZip(zipBuffer);
  const entries = zip.getEntries();
  const conversations: ConversationFile[] = [];

  for (const entry of entries) {
    // Skip directories
    if (entry.isDirectory) continue;

    // Only look at .json files
    const name = entry.entryName;
    if (!name.endsWith('.json')) continue;

    // Must be inside a conversations/ directory (any nesting level)
    if (!name.includes('conversations/')) continue;

    try {
      const content = entry.getData().toString('utf-8');
      const parsed = JSON.parse(content);

      // Basic validation: must have chat_messages array
      if (parsed && Array.isArray(parsed.chat_messages)) {
        conversations.push({
          filename: name,
          conversation: parsed,
        });
      }
    } catch {
      // Skip malformed JSON files
    }
  }

  return conversations;
}
