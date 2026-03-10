// ── Claude.ai conversation JSON parser ─────────────────────────
// Parses a single claude.ai conversation export JSON into structured turns.
// Uses the shared ParsedSession/ParsedTurn/ParsedArtifact types from the Claude Code parser.

import type { ParsedSession, ParsedTurn, ParsedArtifact } from './parser.js';

/** Minimal shape of a claude.ai conversation export JSON */
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
  content?: ContentBlock[];
  attachments?: unknown[];
  files?: unknown[];
}

interface ContentBlock {
  type: string;
  text?: string;
  name?: string;
  input?: Record<string, unknown>;
  [key: string]: unknown;
}

function extractText(msg: ClaudeAiMessage): string {
  // Prefer content array (structured data)
  if (msg.content && Array.isArray(msg.content)) {
    const textBlocks = msg.content
      .filter((b) => b.type === 'text' && b.text)
      .map((b) => b.text!);
    if (textBlocks.length > 0) return textBlocks.join('\n');
  }
  // Fall back to top-level text field
  return msg.text || '';
}

function extractArtifacts(msg: ClaudeAiMessage): ParsedArtifact[] {
  if (!msg.content || !Array.isArray(msg.content)) return [];
  return msg.content
    .filter((b) => b.type === 'tool_use')
    .map((b) => ({
      type: 'tool_use',
      toolName: b.name || 'unknown',
      inputSummary: summarizeClaudeAiTool(b.name || '', b.input),
    }));
}

function summarizeClaudeAiTool(name: string, input?: Record<string, unknown>): string {
  if (!input) return '';
  switch (name) {
    case 'artifacts':
      return `Created artifact: ${(input as any).title || (input as any).name || ''}`.trim();
    case 'web_search':
      return `Searched: ${(input as any).query || ''}`;
    case 'analysis':
      return 'Ran analysis';
    default: {
      const keys = Object.keys(input);
      if (keys.length === 0) return '';
      const val = input[keys[0]];
      return typeof val === 'string' ? val.slice(0, 100) : JSON.stringify(val).slice(0, 100);
    }
  }
}

/**
 * Parse a single claude.ai conversation JSON into a ParsedSession.
 * The conversation object should have { uuid, name, chat_messages }.
 */
export function parseClaudeAiConversation(conversation: unknown): ParsedSession {
  const conv = conversation as ClaudeAiConversation;

  if (!conv || !conv.chat_messages || !Array.isArray(conv.chat_messages)) {
    return { turns: [] };
  }

  const turns: ParsedTurn[] = [];
  let currentUserText: string | null = null;
  let currentTimestamp: string | null = null;
  let currentOriginalId: string | null = null;
  let assistantText = '';
  let artifacts: ParsedArtifact[] = [];

  for (const msg of conv.chat_messages) {
    if (msg.sender === 'human') {
      // Flush previous turn if exists
      if (currentUserText !== null) {
        const turn: ParsedTurn = {
          timestamp: currentTimestamp!,
          originalId: currentOriginalId || '',
          userText: currentUserText,
          assistantText,
        };
        if (artifacts.length > 0) turn.artifacts = artifacts;
        turns.push(turn);
      }
      // Start new turn
      currentUserText = extractText(msg);
      currentTimestamp = msg.created_at;
      currentOriginalId = msg.uuid;
      assistantText = '';
      artifacts = [];
    } else if (msg.sender === 'assistant') {
      const text = extractText(msg);
      if (text) {
        assistantText = assistantText ? assistantText + '\n' + text : text;
      }
      const arts = extractArtifacts(msg);
      artifacts.push(...arts);
    }
  }

  // Flush final turn
  if (currentUserText !== null) {
    const turn: ParsedTurn = {
      timestamp: currentTimestamp!,
      originalId: currentOriginalId || '',
      userText: currentUserText,
      assistantText,
    };
    if (artifacts.length > 0) turn.artifacts = artifacts;
    turns.push(turn);
  }

  const result: ParsedSession = {
    turns,
    eventCount: conv.chat_messages.length,
  };
  if (conv.uuid) result.sessionId = conv.uuid;
  if (conv.name) result.slug = conv.name;

  return result;
}
