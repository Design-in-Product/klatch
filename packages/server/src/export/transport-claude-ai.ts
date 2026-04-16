/**
 * Phase 4: claude.ai transport adapter.
 *
 * Takes a Klatch canonical package manifest and produces a ZIP in the
 * claude.ai data export format:
 *
 *   conversations.json  — array with one conversation object containing chat_messages
 *   projects.json       — array with project metadata (if project exists)
 *   memories.json       — array of memory items from L3 + L5 field notes
 *
 * This is the reverse of the claude.ai import pipeline, enabling a true
 * round-trip: claude.ai → Klatch → claude.ai.
 */

import type { Message } from '@klatch/shared';
import { v4 as uuidv4 } from 'uuid';

// ── Types matching claude.ai export format ───────────────────

interface ClaudeAiConversation {
  uuid: string;
  name: string;
  created_at: string;
  updated_at: string;
  chat_messages: ClaudeAiMessage[];
}

interface ClaudeAiMessage {
  uuid: string;
  text: string;
  sender: 'human' | 'assistant';
  created_at: string;
}

interface ClaudeAiProject {
  uuid: string;
  name: string;
  prompt_template?: string;
  docs?: Array<{ uuid: string; filename: string; content: string }>;
}

interface ClaudeAiMemory {
  uuid: string;
  content: string;
  created_at: string;
}

// ── Conversation conversion ──────────────────────────────────

function messagesToClaudeAi(messages: Message[], channelName: string): ClaudeAiConversation {
  const chatMessages: ClaudeAiMessage[] = messages.map((msg) => ({
    uuid: msg.originalId || msg.id,
    text: msg.content,
    sender: msg.role === 'user' ? 'human' : 'assistant',
    created_at: msg.originalTimestamp || msg.createdAt,
  }));

  const firstAt = messages.length > 0 ? (messages[0].originalTimestamp || messages[0].createdAt) : new Date().toISOString();
  const lastAt = messages.length > 0 ? (messages[messages.length - 1].originalTimestamp || messages[messages.length - 1].createdAt) : firstAt;

  return {
    uuid: uuidv4(),
    name: channelName,
    created_at: firstAt,
    updated_at: lastAt,
    chat_messages: chatMessages,
  };
}

// ── Project conversion ───────────────────────────────────────

function projectToClaudeAi(manifest: any, fileContents: Map<string, string>): ClaudeAiProject | null {
  const project = manifest.project;
  if (!project) return null;

  const docs: ClaudeAiProject['docs'] = [];

  // Knowledge base files become project docs
  const kbFileIds: string[] = project.knowledge_base_file_ids || [];
  const fileMap = new Map<string, any>((manifest.files || []).map((f: any) => [f.id, f]));

  for (const fileId of kbFileIds) {
    const fileMeta = fileMap.get(fileId);
    if (fileMeta && fileMeta.mime_type?.startsWith('text/')) {
      const content = fileContents.get(fileMeta.ref) || '';
      if (content) {
        docs.push({
          uuid: uuidv4(),
          filename: fileMeta.name,
          content,
        });
      }
    }
  }

  return {
    uuid: project.id || uuidv4(),
    name: project.name,
    prompt_template: undefined, // L2 instructions go here if present
    docs: docs.length > 0 ? docs : undefined,
  };
}

// ── Memory conversion ────────────────────────────────────────

function buildMemories(manifest: any): ClaudeAiMemory[] {
  const memories: ClaudeAiMemory[] = [];

  // Field notes become memories
  for (const entity of manifest.entities || []) {
    if (entity.field_notes) {
      for (const note of entity.field_notes) {
        if (note.status === 'rejected') continue;
        memories.push({
          uuid: uuidv4(),
          content: `[${entity.name}] ${note.observation}`,
          created_at: manifest.created_at,
        });
      }
    }
  }

  return memories;
}

// ── Main adapter ─────────────────────────────────────────────

export interface ClaudeAiExportData {
  conversationsJson: string;  // JSON string of conversation array
  projectsJson: string;       // JSON string of projects array
  memoriesJson: string;       // JSON string of memories array
}

/**
 * Transform a Klatch canonical manifest + messages into claude.ai export format.
 *
 * @param manifest — the canonical package manifest
 * @param messages — the conversation messages (already loaded)
 * @param layer2Content — L2 instructions text (from sidecar)
 * @param fileContents — map of file ref paths to their text content (for KB files)
 */
export function adaptToClaudeAi(
  manifest: any,
  messages: Message[],
  layer2Content?: string,
  fileContents?: Map<string, string>,
): ClaudeAiExportData {
  // Build conversation
  const channelName = manifest.conversation_context?.name || 'Exported from Klatch';
  const conversation = messagesToClaudeAi(messages, channelName);

  // Build project
  const project = projectToClaudeAi(manifest, fileContents || new Map());
  if (project && layer2Content) {
    project.prompt_template = layer2Content;
  }

  // Build memories
  const memories = buildMemories(manifest);

  return {
    conversationsJson: JSON.stringify([conversation], null, 2),
    projectsJson: JSON.stringify(project ? [project] : [], null, 2),
    memoriesJson: JSON.stringify(memories, null, 2),
  };
}
