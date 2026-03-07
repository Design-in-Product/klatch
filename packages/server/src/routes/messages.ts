import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import { getMessages, getMessage, insertMessage } from '../db/queries.js';
import { streamClaude, activeStreams } from '../claude/client.js';
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

  const userMsg = insertMessage(channelId, 'user', content, 'complete');
  const assistantMsg = insertMessage(channelId, 'assistant', '', 'streaming');

  // Fire off Claude streaming in background (don't await)
  streamClaude(channelId, assistantMsg.id);

  return c.json({ userMessageId: userMsg.id, assistantMessageId: assistantMsg.id });
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
