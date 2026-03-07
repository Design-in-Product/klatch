import Anthropic from '@anthropic-ai/sdk';
import { EventEmitter } from 'events';
import { getChannel, getMessages, updateMessage } from '../db/queries.js';

const anthropic = new Anthropic();

// In-memory registry of active streams
export const activeStreams = new Map<string, EventEmitter>();

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
  } finally {
    activeStreams.delete(assistantMessageId);
  }
}
