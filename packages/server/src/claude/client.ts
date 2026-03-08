import Anthropic from '@anthropic-ai/sdk';
import { EventEmitter } from 'events';
import { getChannel, getMessages, updateMessage } from '../db/queries.js';

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

export async function streamClaude(channelId: string, assistantMessageId: string) {
  const emitter = new EventEmitter();
  activeStreams.set(assistantMessageId, emitter);

  const channel = getChannel(channelId);
  if (!channel) {
    emitter.emit('data', { type: 'error', messageId: assistantMessageId, content: 'Channel not found' });
    activeStreams.delete(assistantMessageId);
    return;
  }

  // Build history from completed messages only (exclude the placeholder)
  const history = getMessages(channelId)
    .filter((m) => m.status === 'complete' && m.id !== assistantMessageId)
    .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));

  let fullContent = '';

  try {
    const stream = anthropic.messages.stream({
      model: 'claude-opus-4-20250514',
      max_tokens: 4096,
      system: channel.systemPrompt,
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
