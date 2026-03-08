import Anthropic from '@anthropic-ai/sdk';
import { EventEmitter } from 'events';
import { getMessages, updateMessage } from '../db/queries.js';
import type { Entity } from '@klatch/shared';
import { DEFAULT_MODEL } from '@klatch/shared';

const anthropic = new Anthropic();

// In-memory registry of active streams
export const activeStreams = new Map<string, EventEmitter>();

// Store the Anthropic stream objects so we can abort them
const activeAnthropicStreams = new Map<string, ReturnType<typeof anthropic.messages.stream>>();

export function abortStream(messageId: string): boolean {
  const stream = activeAnthropicStreams.get(messageId);
  if (!stream) return false;
  stream.abort();
  return true;
}

/**
 * Stream a Claude response for a specific entity.
 *
 * @param channelId — channel for history lookup
 * @param assistantMessageId — the placeholder message to fill
 * @param entity — the entity responding (provides model + system prompt)
 * @param channelPreamble — the channel's system prompt, prepended as shared context
 */
export async function streamClaude(
  channelId: string,
  assistantMessageId: string,
  entity: Entity,
  channelPreamble?: string
) {
  const emitter = new EventEmitter();
  activeStreams.set(assistantMessageId, emitter);

  // Build history from completed messages only (exclude all current streaming placeholders)
  // In panel mode, each entity sees only its own past responses + all user messages
  const allMessages = getMessages(channelId).filter(
    (m) => m.status === 'complete'
  );
  const history = allMessages
    .filter((m) => m.role === 'user' || m.entityId === entity.id || !m.entityId)
    .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));

  // Build system prompt: channel preamble + entity's own prompt
  const systemParts: string[] = [];
  if (channelPreamble?.trim()) systemParts.push(channelPreamble.trim());
  if (entity.systemPrompt?.trim()) systemParts.push(entity.systemPrompt.trim());
  const systemPrompt = systemParts.join('\n\n');

  let fullContent = '';

  try {
    const model = entity.model || DEFAULT_MODEL;
    const stream = anthropic.messages.stream({
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
}
