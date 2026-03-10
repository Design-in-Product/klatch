import Anthropic from '@anthropic-ai/sdk';
import { EventEmitter } from 'events';
import { getMessages, updateMessage } from '../db/queries.js';
import type { Entity } from '@klatch/shared';
import { DEFAULT_MODEL } from '@klatch/shared';

// Lazy-init: the Anthropic client must not be created at import time
// because ESM hoists imports before dotenv.config() runs in index.ts.
let _anthropic: Anthropic | null = null;
function getAnthropicClient(): Anthropic {
  if (!_anthropic) {
    _anthropic = new Anthropic();
  }
  return _anthropic;
}

// In-memory registry of active streams
export const activeStreams = new Map<string, EventEmitter>();

// Store the Anthropic stream objects so we can abort them
const activeAnthropicStreams = new Map<string, ReturnType<ReturnType<typeof getAnthropicClient>['messages']['stream']>>();

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

type ChatMessage = { role: 'user' | 'assistant'; content: string };

/** Panel mode: entity sees only its own past responses + all user messages */
function buildPanelHistory(channelId: string, entity: Entity): ChatMessage[] {
  const allMessages = getMessages(channelId).filter((m) => m.status === 'complete');
  return allMessages
    .filter((m) => m.role === 'user' || m.entityId === entity.id || !m.entityId)
    .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));
}

/** Roundtable mode: entity sees ALL completed messages from ALL entities */
function buildRoundtableHistory(channelId: string): ChatMessage[] {
  const allMessages = getMessages(channelId).filter((m) => m.status === 'complete');
  return allMessages.map((m) => ({
    role: m.role as 'user' | 'assistant',
    content: m.content,
  }));
}

/** Build system prompt: channel preamble + entity's own prompt */
function buildSystemPrompt(entity: Entity, channelPreamble?: string): string {
  const parts: string[] = [];
  if (channelPreamble?.trim()) parts.push(channelPreamble.trim());
  if (entity.systemPrompt?.trim()) parts.push(entity.systemPrompt.trim());
  return parts.join('\n\n');
}

// ── Core streaming function ──────────────────────────────────

/**
 * Stream a Claude response. Used by both panel and roundtable modes.
 *
 * @returns the completed content string (useful for roundtable chaining)
 */
async function streamClaudeCore(
  assistantMessageId: string,
  entity: Entity,
  history: ChatMessage[],
  systemPrompt: string
): Promise<string> {
  const emitter = new EventEmitter();
  activeStreams.set(assistantMessageId, emitter);

  let fullContent = '';

  try {
    const model = entity.model || DEFAULT_MODEL;
    const stream = getAnthropicClient().messages.stream({
      model,
      max_tokens: 4096,
      system: systemPrompt || undefined,
      messages: history,
    });

    activeAnthropicStreams.set(assistantMessageId, stream);

    stream.on('text', (text) => {
      fullContent += text;
      emitter.emit('data', {
        type: 'text_delta',
        messageId: assistantMessageId,
        content: text,
      });
    });

    await stream.finalMessage();
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
        errorMsg = 'Invalid API key. Set ANTHROPIC_API_KEY in .env and restart the server.';
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

  return fullContent;
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
  const history = buildPanelHistory(channelId, entity);
  const systemPrompt = buildSystemPrompt(entity, channelPreamble);
  await streamClaudeCore(assistantMessageId, entity, history, systemPrompt);
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
      const systemPrompt = buildSystemPrompt(entity, channelPreamble);

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

      const content = await streamClaudeCore(
        assistantMessageId,
        entity,
        history,
        systemPrompt
      );

      roundResponses.push({ entity, content });
    }
  } finally {
    activeRoundtables.delete(channelId);
  }
}
