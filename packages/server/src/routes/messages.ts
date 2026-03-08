import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import {
  getMessages,
  getMessage,
  getChannel,
  insertMessage,
  deleteMessage,
  deleteAllMessages,
  getLastAssistantMessage,
} from '../db/queries.js';
import { streamClaude, activeStreams, abortStream } from '../claude/client.js';
import type { StreamEvent } from '@klatch/shared';

const app = new Hono();

// Get all messages for a channel
app.get('/channels/:channelId/messages', (c) => {
  const channelId = c.req.param('channelId');
  const messages = getMessages(channelId);
  return c.json(messages);
});

// Send a message — creates user msg + placeholder assistant msg, kicks off streaming
app.post('/channels/:channelId/messages', async (c) => {
  const channelId = c.req.param('channelId');
  const { content } = await c.req.json<{ content: string }>();

  const channel = getChannel(channelId);
  const model = channel?.model;

  const userMsg = insertMessage(channelId, 'user', content, 'complete');
  const assistantMsg = insertMessage(channelId, 'assistant', '', 'streaming', model);

  // Fire off Claude streaming in background (don't await)
  streamClaude(channelId, assistantMsg.id);

  return c.json({ userMessageId: userMsg.id, assistantMessageId: assistantMsg.id, model });
});

// Clear all messages in a channel
app.delete('/channels/:channelId/messages', (c) => {
  const channelId = c.req.param('channelId');
  const deleted = deleteAllMessages(channelId);
  return c.json({ deleted });
});

// Delete a single message
app.delete('/messages/:id', (c) => {
  const id = c.req.param('id');
  const found = deleteMessage(id);
  if (!found) {
    return c.json({ error: 'Message not found' }, 404);
  }
  return c.json({ deleted: true });
});

// Stop a streaming message (abort the Claude API call, keep partial content)
app.post('/messages/:id/stop', (c) => {
  const id = c.req.param('id');
  const aborted = abortStream(id);
  if (!aborted) {
    return c.json({ error: 'No active stream for this message' }, 404);
  }
  return c.json({ stopped: true });
});

// Regenerate: delete the last assistant message and re-send
app.post('/channels/:channelId/regenerate', async (c) => {
  const channelId = c.req.param('channelId');

  const lastAssistant = getLastAssistantMessage(channelId);
  if (!lastAssistant) {
    return c.json({ error: 'No assistant message to regenerate' }, 404);
  }

  // Delete the old assistant message
  deleteMessage(lastAssistant.id);

  // Create a new placeholder with current channel model and kick off streaming
  const channel = getChannel(channelId);
  const model = channel?.model;
  const assistantMsg = insertMessage(channelId, 'assistant', '', 'streaming', model);
  streamClaude(channelId, assistantMsg.id);

  return c.json({ assistantMessageId: assistantMsg.id, model });
});

// SSE endpoint to observe a streaming message
app.get('/messages/:id/stream', (c) => {
  const messageId = c.req.param('id');

  return streamSSE(c, async (stream) => {
    const emitter = activeStreams.get(messageId);

    if (!emitter) {
      // Stream already completed before client connected — check DB for final state
      const msg = getMessage(messageId);
      const type = msg?.status === 'error' ? 'error' : 'message_complete';
      await stream.writeSSE({
        data: JSON.stringify({
          type,
          messageId,
          content: msg?.content ?? '',
        } satisfies StreamEvent),
      });
      return;
    }

    // Forward events from the in-memory emitter to SSE
    await new Promise<void>((resolve) => {
      const onData = async (event: StreamEvent) => {
        try {
          await stream.writeSSE({ data: JSON.stringify(event) });
        } catch {
          // Client disconnected
          emitter.off('data', onData);
          resolve();
          return;
        }
        if (event.type === 'message_complete' || event.type === 'error') {
          emitter.off('data', onData);
          resolve();
        }
      };

      emitter.on('data', onData);

      // Safety: resolve if emitter is removed (stream completed between our check and subscribe)
      const interval = setInterval(() => {
        if (!activeStreams.has(messageId)) {
          clearInterval(interval);
          emitter.off('data', onData);
          resolve();
        }
      }, 500);
    });
  });
});

export { app as messageRoutes };
