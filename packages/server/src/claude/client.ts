import Anthropic from '@anthropic-ai/sdk';
import { EventEmitter } from 'events';
import { getMessages, getChannel, updateMessage, updateChannelCompaction, getProjectForChannel, getFileArtifactsForMessages, createFileArtifact, createFileWithMessageRef, getChannelFiles, getProjectFiles } from '../db/queries.js';
import type { Entity, Channel, Project, MessageArtifact } from '@klatch/shared';
import { DEFAULT_MODEL } from '@klatch/shared';
import { readFile, isTextFile, isImageFile, saveFile } from '../files/storage.js';

// Lazy-init: the Anthropic client must not be created at import time
// because ESM hoists imports before dotenv.config() runs in index.ts.
let _anthropic: Anthropic | null = null;
function getAnthropicClient(): Anthropic {
  if (!_anthropic) {
    _anthropic = new Anthropic();
  }
  return _anthropic;
}

/** Format bytes for human display in prompt context */
function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// In-memory registry of active streams
export const activeStreams = new Map<string, EventEmitter>();

// Store the Anthropic stream objects so we can abort them
// Using `any` to accommodate both regular and beta stream types
const activeAnthropicStreams = new Map<string, { abort(): void }>();

// Track active roundtable sessions so we can cancel remaining entities on abort
// Maps channelId → Set of assistant message IDs in the current round
const activeRoundtables = new Map<string, { messageIds: string[]; cancelled: boolean }>();

export function abortStream(messageId: string): boolean {
  const stream = activeAnthropicStreams.get(messageId);
  if (stream) {
    stream.abort();
  }

  // If this message belongs to a roundtable, cancel the whole round
  for (const [, roundtable] of activeRoundtables) {
    if (roundtable.messageIds.includes(messageId)) {
      roundtable.cancelled = true;
      // Mark any not-yet-started placeholders as complete (empty)
      for (const id of roundtable.messageIds) {
        if (id !== messageId && !activeAnthropicStreams.has(id)) {
          // This entity hasn't started yet — clean up its placeholder
          const emitter = activeStreams.get(id);
          if (emitter) {
            updateMessage(id, '', 'complete');
            emitter.emit('data', {
              type: 'message_complete',
              messageId: id,
              content: '',
            });
            activeStreams.delete(id);
          } else {
            // No emitter yet (hasn't been created) — just mark DB
            updateMessage(id, '', 'complete');
          }
        }
      }
      break;
    }
  }

  return !!stream;
}

// ── History builders ──────────────────────────────────────────

type ContentBlock =
  | { type: 'text'; text: string }
  | { type: 'image'; source: { type: 'base64'; media_type: string; data: string } };

type ChatMessage = { role: 'user' | 'assistant'; content: string | ContentBlock[] };

// Safety cap: prevents token overflow for long imported sessions.
// When compaction state exists, the cap is bypassed (compaction manages length).
const MAX_HISTORY_MESSAGES = 200;

/** Parsed compaction state from channel JSON */
interface CompactionState {
  summary: string;
  timestamp: string;
  beforeMessageId: string;
}

function parseCompactionState(channel?: Channel): CompactionState | null {
  if (!channel?.compactionState) return null;
  try {
    return JSON.parse(channel.compactionState);
  } catch {
    return null;
  }
}

/**
 * Merge consecutive same-role messages into one.
 * The Anthropic API requires strict user/assistant alternation.
 * This can happen after filtering (panel mode removes other entities' messages)
 * or in roundtable mode (multiple assistant responses per round).
 */
function coalesceMessages(messages: ChatMessage[]): ChatMessage[] {
  if (messages.length === 0) return messages;
  const result: ChatMessage[] = [{ ...messages[0] }];
  for (let i = 1; i < messages.length; i++) {
    const prev = result[result.length - 1];
    if (messages[i].role === prev.role) {
      // Merge same-role messages. If either has content blocks, convert both to blocks.
      const prevBlocks = toContentBlocks(prev.content);
      const currBlocks = toContentBlocks(messages[i].content);
      prev.content = [...prevBlocks, ...currBlocks];
    } else {
      result.push({ ...messages[i] });
    }
  }
  return result;
}

/** Convert string or content blocks to a uniform ContentBlock array */
function toContentBlocks(content: string | ContentBlock[]): ContentBlock[] {
  if (typeof content === 'string') {
    return content.trim() ? [{ type: 'text', text: content }] : [];
  }
  return content;
}

/**
 * Inject file content into user messages that have file attachments.
 * Text files: inlined as text blocks.
 * Images: injected as base64 image blocks.
 * Other files: noted as text (name + size).
 */
function injectFileContent(messages: ChatMessage[], channelId: string, allMessages: { id: string; role: string }[]): ChatMessage[] {
  // Get IDs of user messages in the history
  const userMsgIds = allMessages
    .filter((m) => m.role === 'user')
    .map((m) => m.id);

  if (userMsgIds.length === 0) return messages;

  // Batch-fetch all file artifacts for these messages
  const fileArtifactMap = getFileArtifactsForMessages(userMsgIds);
  if (fileArtifactMap.size === 0) return messages;

  // Build a map from message content to its ID for lookup
  // (history builders strip IDs, so we match by index position in the user messages)
  let userIdx = 0;
  const userMsgOrder: string[] = [];
  for (const m of allMessages) {
    if (m.role === 'user') userMsgOrder.push(m.id);
  }

  let historyUserIdx = 0;
  return messages.map((msg) => {
    if (msg.role !== 'user') return msg;

    // Find the corresponding original message ID
    const originalMsgId = userMsgOrder[historyUserIdx++];
    if (!originalMsgId) return msg;

    const artifacts = fileArtifactMap.get(originalMsgId);
    if (!artifacts || artifacts.length === 0) return msg;

    // Build content blocks: original text + file content
    const blocks: ContentBlock[] = [];

    // Original message text
    if (typeof msg.content === 'string' && msg.content.trim()) {
      blocks.push({ type: 'text', text: msg.content });
    } else if (Array.isArray(msg.content)) {
      blocks.push(...msg.content);
    }

    // Inject each file
    for (const artifact of artifacts) {
      if (!artifact.fileStorageKey || !artifact.fileMimeType) continue;

      if (isTextFile(artifact.fileMimeType)) {
        // Read and inline text content
        const buffer = readFile(artifact.fileStorageKey);
        if (buffer) {
          const text = buffer.toString('utf-8');
          // Truncate very large files to avoid token explosion
          const maxChars = 50000;
          const truncated = text.length > maxChars
            ? text.slice(0, maxChars) + '\n...(truncated)'
            : text;
          blocks.push({
            type: 'text',
            text: `[Attached file: ${artifact.fileName}]\n${truncated}\n[End of file]`,
          });
        }
      } else if (isImageFile(artifact.fileMimeType)) {
        // Inject as base64 image block
        const buffer = readFile(artifact.fileStorageKey);
        if (buffer) {
          blocks.push({
            type: 'image',
            source: {
              type: 'base64',
              media_type: artifact.fileMimeType,
              data: buffer.toString('base64'),
            },
          });
        }
      } else {
        // Unsupported file type — note it as text
        const sizeKB = artifact.fileSizeBytes ? (artifact.fileSizeBytes / 1024).toFixed(1) : '?';
        blocks.push({
          type: 'text',
          text: `[Attached file: ${artifact.fileName} (${artifact.fileMimeType}, ${sizeKB} KB) — binary file, content not shown]`,
        });
      }
    }

    return { ...msg, content: blocks };
  });
}

/** Panel mode: entity sees only its own past responses + all user messages */
function buildPanelHistory(channelId: string, entity: Entity): ChatMessage[] {
  const channel = getChannel(channelId);
  const compaction = parseCompactionState(channel);
  const allMessages = getMessages(channelId).filter((m) => m.status === 'complete');

  let messages = allMessages;

  if (compaction) {
    // Find the boundary message and only include messages after it
    const boundaryIdx = messages.findIndex((m) => m.id === compaction.beforeMessageId);
    if (boundaryIdx >= 0) {
      messages = messages.slice(boundaryIdx + 1);
    }
  }

  const filteredMessages = messages
    .filter((m) => m.role === 'user' || m.entityId === entity.id || !m.entityId)
    .filter((m) => m.content.trim().length > 0);

  const chatMessages = filteredMessages
    .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content as string | ContentBlock[] }));

  // Inject file content into user messages
  const withFiles = injectFileContent(chatMessages, channelId, filteredMessages);

  if (compaction) {
    return coalesceMessages([{ role: 'user' as const, content: compaction.summary }, ...withFiles]);
  }

  return coalesceMessages(withFiles.slice(-MAX_HISTORY_MESSAGES));
}

/** Roundtable mode: entity sees ALL completed messages from ALL entities */
function buildRoundtableHistory(channelId: string): ChatMessage[] {
  const channel = getChannel(channelId);
  const compaction = parseCompactionState(channel);
  const allMessages = getMessages(channelId).filter((m) => m.status === 'complete');

  let messages = allMessages;

  if (compaction) {
    const boundaryIdx = messages.findIndex((m) => m.id === compaction.beforeMessageId);
    if (boundaryIdx >= 0) {
      messages = messages.slice(boundaryIdx + 1);
    }
  }

  const filteredMessages = messages.filter((m) => m.content.trim().length > 0);

  const chatMessages = filteredMessages.map((m) => ({
    role: m.role as 'user' | 'assistant',
    content: m.content as string | ContentBlock[],
  }));

  // Inject file content into user messages
  const withFiles = injectFileContent(chatMessages, channelId, filteredMessages);

  if (compaction) {
    return coalesceMessages([{ role: 'user' as const, content: compaction.summary }, ...withFiles]);
  }

  return coalesceMessages(withFiles.slice(-MAX_HISTORY_MESSAGES));
}

/** Max characters of captured context to include in kit briefing */
const MAX_CONTEXT_CHARS = 4000;

/**
 * Build a kit briefing for imported channels.
 * Orients the model about its environment when continuing from an imported session.
 * Addresses the "silent capability loss" problem discovered in Theseus/Ariadne testing.
 *
 * Kit briefing is now ONLY the core orientation text (capability awareness).
 * Project instructions and memory are injected via their own layers in buildSystemPrompt.
 * Legacy fallback: if channel has no project link, claudeMd/memoryMd from sourceMetadata
 * are still injected here to avoid silent data loss.
 */
export function buildKitBriefing(channel: Channel): string {
  const parts: string[] = [];

  // Core orientation — prevents phantom-capability confusion
  const sourceLabel = channel.source === 'claude-code' ? 'a Claude Code session' : 'a claude.ai conversation';
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  parts.push(
    'You are continuing a conversation that was imported into Klatch from ' +
    (channel.source === 'claude-code' ? 'Claude Code' : 'claude.ai') + '. ' +
    `Today is ${today}. ` +
    'You are now in Klatch, a workspace for managing AI conversations. ' +
    'You do not currently have access to shell tools (no bash, no search, no web access). ' +
    'The user can attach files to messages — file content will be included directly. ' +
    'You can read, discuss, and produce file content (use fenced code blocks with filenames). ' +
    'If the user asks for something requiring shell tools, ' +
    'explain what you would do and suggest they use a tool-enabled environment.'
  );

  // Layer awareness — MAXT Finding 3 + Finding 2 (subliminal injection)
  // Helps agent understand it has context it may not be able to self-report
  parts.push(
    'Your context may include project instructions and project memory from the original environment. ' +
    'You may access knowledge from these sources without being able to identify their origin. ' +
    'This is normal — treat it as background knowledge.'
  );

  // Prompted acknowledgment — agent should surface the transition naturally (#13)
  parts.push(
    'In your first response in this conversation, briefly acknowledge that you are ' +
    'continuing from ' + sourceLabel + ' in Klatch. ' +
    'Keep the acknowledgment to one sentence — then respond to the user normally.'
  );

  // Legacy fallback: inject context from sourceMetadata for channels without a project link.
  // New imports store these at project level (instructions + memory columns).
  let meta: Record<string, unknown> = {};
  try {
    if (channel.sourceMetadata) meta = JSON.parse(channel.sourceMetadata);
  } catch { /* ignore parse errors */ }

  if (!channel.projectId && meta.claudeMd) {
    const content = String(meta.claudeMd);
    const truncated = content.length > MAX_CONTEXT_CHARS
      ? content.slice(0, MAX_CONTEXT_CHARS) + '\n...(truncated)'
      : content;
    parts.push('Project instructions (CLAUDE.md) from the original session:\n\n' + truncated);
  }

  if (!channel.projectId && meta.memoryMd) {
    const content = String(meta.memoryMd);
    const truncated = content.length > MAX_CONTEXT_CHARS
      ? content.slice(0, MAX_CONTEXT_CHARS) + '\n...(truncated)'
      : content;
    parts.push('Project memory (MEMORY.md) from the original session:\n\n' + truncated);
  }

  return parts.join('\n\n');
}

/** Max characters of project instructions to inject into system prompt */
const MAX_PROJECT_INSTRUCTIONS_CHARS = 32000;

/** Max characters of project memory to inject into system prompt */
const MAX_PROJECT_MEMORY_CHARS = 8000;

/**
 * Build system prompt with 5-layer assembly:
 *   1. Kit briefing (imported channels only — orientation + capability awareness)
 *   2. Project instructions (from projects.instructions — CLAUDE.md / prompt_template)
 *   3. Project memory (from projects.memory — MEMORY.md / claude.ai memories)
 *   4. Channel addendum (channel-specific system prompt)
 *   5. Entity's own system prompt
 *
 * Per design doc: prompt-architecture-audit.md (decisions locked 2026-03-16)
 */
export function buildSystemPrompt(entity: Entity, channelPreamble?: string, channel?: Channel, project?: Project | null, channelFileNames?: string[], projectFileNames?: string[]): string {
  const parts: string[] = [];

  // 1. Kit briefing for imported channels — automatic orientation on transition
  if (channel?.source && channel.source !== 'native') {
    parts.push(buildKitBriefing(channel));
  }

  // 2. Project instructions (if channel belongs to a project)
  if (project?.instructions?.trim()) {
    const content = project.instructions.trim();
    const truncated = content.length > MAX_PROJECT_INSTRUCTIONS_CHARS
      ? content.slice(0, MAX_PROJECT_INSTRUCTIONS_CHARS) + '\n...(truncated)'
      : content;
    parts.push(truncated);
  }

  // 3. Project memory (accumulated knowledge — MEMORY.md, claude.ai memories)
  if (project?.memory?.trim()) {
    const content = project.memory.trim();
    const truncated = content.length > MAX_PROJECT_MEMORY_CHARS
      ? content.slice(0, MAX_PROJECT_MEMORY_CHARS) + '\n...(truncated)'
      : content;
    parts.push('Project memory:\n\n' + truncated);
  }

  // 3b. Project files listing (knowledge base files available at project scope)
  if (projectFileNames && projectFileNames.length > 0) {
    const listing = projectFileNames.join('\n');
    parts.push(`Project knowledge base files:\n${listing}`);
  }

  // 4. Channel addendum (channel-specific system prompt + pinned files listing)
  if (channelPreamble?.trim()) parts.push(channelPreamble.trim());

  // 4b. Channel files listing (pinned files visible in this channel)
  if (channelFileNames && channelFileNames.length > 0) {
    const listing = channelFileNames.join('\n');
    parts.push(`Channel files available:\n${listing}`);
  }

  // 5. Entity's own system prompt
  if (entity.systemPrompt?.trim()) parts.push(entity.systemPrompt.trim());

  return parts.join('\n\n');
}

// ── Tool definitions ─────────────────────────────────────────

const KLATCH_TOOLS: Anthropic.Tool[] = [
  {
    name: 'save_file',
    description: 'Save content as a downloadable file for the user. Use this when the user asks you to create, generate, or write a file — for example, a script, config file, document, or data export. The file will be stored and made available for download in the conversation.',
    input_schema: {
      type: 'object' as const,
      properties: {
        filename: {
          type: 'string',
          description: 'The filename including extension (e.g., "report.md", "config.json", "script.py")',
        },
        content: {
          type: 'string',
          description: 'The full content of the file',
        },
      },
      required: ['filename', 'content'],
    },
  },
];

/** Execute a tool call and return the result */
async function executeTool(
  toolName: string,
  toolInput: Record<string, unknown>,
  assistantMessageId: string,
): Promise<{ result: string; isError: boolean }> {
  if (toolName === 'save_file') {
    const filename = String(toolInput.filename || 'file.txt');
    const content = String(toolInput.content || '');

    try {
      // Determine MIME type from extension
      const ext = filename.split('.').pop()?.toLowerCase() || 'txt';
      const mimeMap: Record<string, string> = {
        md: 'text/markdown', txt: 'text/plain', json: 'application/json',
        js: 'text/javascript', ts: 'text/typescript', py: 'text/x-python',
        html: 'text/html', css: 'text/css', csv: 'text/csv',
        xml: 'application/xml', yaml: 'text/yaml', yml: 'text/yaml',
        sh: 'text/x-sh', sql: 'text/x-sql', toml: 'text/toml',
      };
      const mimeType = mimeMap[ext] || 'text/plain';
      const buffer = Buffer.from(content, 'utf-8');

      // Save to disk using existing storage infrastructure
      const saved = saveFile(buffer, filename, mimeType);

      // Create file artifact linked to the assistant message
      createFileArtifact(assistantMessageId, filename, mimeType, saved.sizeBytes, saved.storageKey);

      // Also populate File Domain Model (files + file_refs)
      createFileWithMessageRef(filename, mimeType, saved.sizeBytes, saved.storageKey, assistantMessageId, 'entity');

      return {
        result: `File "${filename}" saved successfully (${buffer.length} bytes). The user can download it from the conversation.`,
        isError: false,
      };
    } catch (err) {
      return {
        result: `Error saving file: ${err instanceof Error ? err.message : String(err)}`,
        isError: true,
      };
    }
  }

  return { result: `Unknown tool: ${toolName}`, isError: true };
}

// ── Core streaming function ──────────────────────────────────

interface StreamResult {
  content: string;
  compactionSummary?: string;
}

/**
 * Stream a Claude response. Used by both panel and roundtable modes.
 * Uses the beta API when compaction is enabled to support context_management.
 * Supports tool use: if the model calls a tool, executes it and continues.
 *
 * @returns StreamResult with content and optional compaction summary
 */
async function streamClaudeCore(
  assistantMessageId: string,
  entity: Entity,
  history: ChatMessage[],
  systemPrompt: string,
  options?: { compactionEnabled?: boolean; channelMode?: string }
): Promise<StreamResult> {
  const emitter = new EventEmitter();
  activeStreams.set(assistantMessageId, emitter);

  let fullContent = '';
  let compactionSummary: string | undefined;
  const MAX_TOOL_ROUNDS = 5; // Safety limit on tool-use loops

  try {
    const model = entity.model || DEFAULT_MODEL;
    // Mutable copy of history for tool-use continuation
    const conversationHistory = [...history];

    for (let round = 0; round <= MAX_TOOL_ROUNDS; round++) {
      let finalMessage: any;

      if (options?.compactionEnabled) {
        const stream = getAnthropicClient().beta.messages.stream({
          model,
          max_tokens: 16384,
          thinking: { type: 'adaptive', display: 'omitted' } as any,
          cache_control: { type: 'ephemeral' },
          system: systemPrompt || undefined,
          messages: conversationHistory,
          tools: KLATCH_TOOLS,
          ...(entity.effort ? { output_config: { effort: entity.effort } } : {}),
          betas: ['compact-2026-01-12'],
          context_management: {
            edits: [{
              type: 'compact_20260112',
              trigger: { type: 'input_tokens', value: 160000 },
              ...(options?.channelMode && options.channelMode !== 'panel' ? {
                instructions: 'Preserve [EntityName responded] attribution markers. When multiple entities contributed, maintain specific attribution of key contributions.',
              } : {}),
            }],
          },
        } as any);

        activeAnthropicStreams.set(assistantMessageId, stream);

        stream.on('text', (text: string) => {
          fullContent += text;
          emitter.emit('data', {
            type: 'text_delta',
            messageId: assistantMessageId,
            content: text,
          });
        });

        stream.on('compaction', (compactedContent: string) => {
          compactionSummary = compactedContent;
        });

        finalMessage = await stream.finalMessage();
      } else {
        const stream = getAnthropicClient().messages.stream({
          model,
          max_tokens: 16384,
          thinking: { type: 'adaptive', display: 'omitted' } as any,
          cache_control: { type: 'ephemeral' },
          system: systemPrompt || undefined,
          messages: conversationHistory,
          tools: KLATCH_TOOLS,
          ...(entity.effort ? { output_config: { effort: entity.effort } } : {}),
        } as any);

        activeAnthropicStreams.set(assistantMessageId, stream);

        stream.on('text', (text: string) => {
          fullContent += text;
          emitter.emit('data', {
            type: 'text_delta',
            messageId: assistantMessageId,
            content: text,
          });
        });

        finalMessage = await stream.finalMessage();
      }

      // Check if the model wants to use a tool
      if (finalMessage.stop_reason === 'tool_use') {
        // Find tool_use blocks in the response
        const toolUseBlocks = finalMessage.content.filter(
          (block: any) => block.type === 'tool_use'
        );

        // Add assistant's response (with tool_use blocks) to history
        conversationHistory.push({
          role: 'assistant',
          content: finalMessage.content,
        });

        // Execute each tool and collect results
        const toolResults: any[] = [];
        for (const toolUse of toolUseBlocks) {
          // Emit a tool-use event for the client to display
          emitter.emit('data', {
            type: 'tool_use',
            messageId: assistantMessageId,
            toolName: toolUse.name,
            toolInput: toolUse.input,
          });

          const { result, isError } = await executeTool(
            toolUse.name,
            toolUse.input as Record<string, unknown>,
            assistantMessageId,
          );

          toolResults.push({
            type: 'tool_result',
            tool_use_id: toolUse.id,
            content: result,
            is_error: isError,
          });
        }

        // Add tool results to history and continue the loop
        conversationHistory.push({
          role: 'user',
          content: toolResults,
        });

        // Continue the loop — next iteration will stream the model's follow-up
        continue;
      }

      // stop_reason is 'end_turn' or 'max_tokens' — done
      break;
    }

    updateMessage(assistantMessageId, fullContent, 'complete');
    emitter.emit('data', {
      type: 'message_complete',
      messageId: assistantMessageId,
      content: fullContent,
    });
  } catch (err) {
    // Check if this was an intentional abort
    if (err instanceof Anthropic.APIUserAbortError || (err instanceof Error && err.name === 'AbortError')) {
      // Abort: keep partial content, mark as complete
      updateMessage(assistantMessageId, fullContent, 'complete');
      emitter.emit('data', {
        type: 'message_complete',
        messageId: assistantMessageId,
        content: fullContent,
      });
    } else {
      let errorMsg: string;
      if (err instanceof Anthropic.AuthenticationError) {
        errorMsg = 'Invalid or expired API key. Check ANTHROPIC_API_KEY in .env — if you created the key with an expiration date, it may have lapsed.';
      } else if (err instanceof Anthropic.APIError) {
        errorMsg = `API error (${err.status}): ${err.message}`;
      } else {
        errorMsg = err instanceof Error ? err.message : String(err);
      }
      updateMessage(assistantMessageId, fullContent || errorMsg, 'error');
      emitter.emit('data', {
        type: 'error',
        messageId: assistantMessageId,
        content: errorMsg,
      });
    }
  } finally {
    activeAnthropicStreams.delete(assistantMessageId);
    activeStreams.delete(assistantMessageId);
  }

  return { content: fullContent, compactionSummary };
}

// ── Public API ───────────────────────────────────────────────

/**
 * Panel mode: stream a single entity's response in isolation.
 * Each entity sees only its own history + user messages.
 * Fire-and-forget (don't await) — streams in parallel.
 */
export async function streamClaude(
  channelId: string,
  assistantMessageId: string,
  entity: Entity,
  channelPreamble?: string
) {
  const channel = getChannel(channelId);
  const project = channel?.projectId ? getProjectForChannel(channelId) : null;
  const compactionEnabled = channel?.source !== 'native';
  const history = buildPanelHistory(channelId, entity);
  const channelFileList = getChannelFiles(channelId).map((f) => `- ${f.name} (${f.mimeType}, ${formatBytes(f.sizeBytes)})`);
  const projectFileList = project ? getProjectFiles(project.id).map((f) => `- ${f.name} (${f.mimeType}, ${formatBytes(f.sizeBytes)})`) : [];
  const systemPrompt = buildSystemPrompt(entity, channelPreamble, channel, project, channelFileList, projectFileList);
  const result = await streamClaudeCore(
    assistantMessageId, entity, history, systemPrompt,
    { compactionEnabled, channelMode: channel?.mode }
  );

  // Store compaction result if the API compacted
  if (result.compactionSummary && channel) {
    // Find the last user message before the one that triggered this stream
    const messages = getMessages(channelId).filter((m) => m.status === 'complete' && m.role === 'user');
    const lastUserMsg = messages[messages.length - 1];
    if (lastUserMsg) {
      updateChannelCompaction(channelId, {
        summary: result.compactionSummary,
        timestamp: new Date().toISOString(),
        beforeMessageId: lastUserMsg.id,
      });
    }
  }
}

/**
 * Roundtable mode: stream entities sequentially, each seeing prior responses.
 * This is an async orchestrator — it awaits each stream before starting the next.
 *
 * The Anthropic API requires conversations to end with a user message.
 * For Entity 2+, we present prior entities' responses from the current round
 * as context in a synthetic user message, so each entity knows what others said.
 *
 * @param channelId — channel for history lookup
 * @param assistants — ordered list of { messageId, entity } to stream
 * @param channelPreamble — shared channel system prompt
 * @param allEntities — full list of entities for name lookup in context messages
 */
export async function streamClaudeRoundtable(
  channelId: string,
  assistants: { assistantMessageId: string; entity: Entity }[],
  channelPreamble?: string
) {
  const channel = getChannel(channelId);
  const project = channel?.projectId ? getProjectForChannel(channelId) : null;
  const compactionEnabled = channel?.source !== 'native';
  const channelFileList = getChannelFiles(channelId).map((f) => `- ${f.name} (${f.mimeType}, ${formatBytes(f.sizeBytes)})`);
  const projectFileList = project ? getProjectFiles(project.id).map((f) => `- ${f.name} (${f.mimeType}, ${formatBytes(f.sizeBytes)})`) : [];

  // Register this roundtable so abort can cancel the whole round
  const roundtable = {
    messageIds: assistants.map((a) => a.assistantMessageId),
    cancelled: false,
  };
  activeRoundtables.set(channelId, roundtable);

  try {
    // Start with the shared history (all completed messages in the channel)
    const baseHistory = buildRoundtableHistory(channelId);

    // Track responses from the current round
    const roundResponses: { entity: Entity; content: string }[] = [];

    for (let i = 0; i < assistants.length; i++) {
      // Check if the round was cancelled (e.g. user hit Stop on an earlier entity)
      if (roundtable.cancelled) break;

      const { assistantMessageId, entity } = assistants[i];
      const systemPrompt = buildSystemPrompt(entity, channelPreamble, channel, project, channelFileList, projectFileList);

      let history: ChatMessage[];

      if (i === 0) {
        // First entity: normal history (ends with user message)
        history = baseHistory;
      } else {
        // Subsequent entities: base history + a synthetic user message
        // containing prior entities' responses as context
        const priorContext = roundResponses
          .map((r) => `[${r.entity.name} responded]: ${r.content}`)
          .join('\n\n');

        history = [
          ...baseHistory,
          {
            role: 'user' as const,
            content: `The following responses have been given by other participants in this roundtable discussion:\n\n${priorContext}\n\nNow it's your turn to respond to the original message.`,
          },
        ];
      }

      // Only enable compaction for the first entity in a round
      // (subsequent entities get synthetic context, compaction would be confusing)
      const result = await streamClaudeCore(
        assistantMessageId,
        entity,
        history,
        systemPrompt,
        { compactionEnabled: i === 0 && compactionEnabled, channelMode: channel?.mode }
      );

      // Store compaction if it happened on the first entity
      if (result.compactionSummary && channel) {
        const messages = getMessages(channelId).filter((m) => m.status === 'complete' && m.role === 'user');
        const lastUserMsg = messages[messages.length - 1];
        if (lastUserMsg) {
          updateChannelCompaction(channelId, {
            summary: result.compactionSummary,
            timestamp: new Date().toISOString(),
            beforeMessageId: lastUserMsg.id,
          });
        }
      }

      roundResponses.push({ entity, content: result.content });
    }
  } finally {
    activeRoundtables.delete(channelId);
  }
}
