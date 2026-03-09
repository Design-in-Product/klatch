import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import {
  getMessages,
  getMessage,
  getChannel,
  getChannelEntities,
  insertMessage,
  deleteMessage,
  deleteAllMessages,
  getLastAssistantMessage,
  getLastRoundAssistantMessages,
} from '../db/queries.js';
import { streamClaude, streamClaudeRoundtable, activeStreams, abortStream } from '../claude/client.js';
import type { StreamEvent, Entity } from '@klatch/shared';
import { resolveMentions } from '@klatch/shared';
import { getDb } from '../db/index.js';

const app = new Hono();

// Get all messages for a channel
app.get('/channels/:channelId/messages', (c) => {
  const channelId = c.req.param('channelId');
  const messages = getMessages(channelId);
  return c.json(messages);
});

// Send a message — creates user msg + N assistant placeholders (one per entity), kicks off N streams
app.post('/channels/:channelId/messages', async (c) => {
  const channelId = c.req.param('channelId');
  const { content } = await c.req.json<{ content: string }>();

  // Input validation
  if (!content?.trim()) {
    return c.json({ error: 'Message content is required' }, 400);
  }

  // Channel existence check
  const channel = getChannel(channelId);
  if (!channel) {
    return c.json({ error: 'Channel not found' }, 404);
  }

  // Get assigned entities
  const entities = getChannelEntities(channelId);
  if (entities.length === 0) {
    return c.json({ error: 'No entities assigned to this channel' }, 400);
  }

  // ── Mode dispatch ────────────────────────────────────────────
  // Panel: all entities respond in parallel, each seeing only its own history
  // Roundtable: entities respond sequentially, each seeing prior responses (Step 7c)
  // Directed: @-mention routes to a specific entity (Step 7d)

  if (channel.mode === 'roundtable') {
    // Roundtable: create placeholders, then stream sequentially
    const db = getDb();
    const txn = db.transaction(() => {
      const userMsg = insertMessage(channelId, 'user', content.trim(), 'complete');
      const assistants = entities.map((entity) => {
        const msg = insertMessage(channelId, 'assistant', '', 'streaming', entity.model, entity.id);
        return { assistantMessageId: msg.id, entityId: entity.id, model: entity.model };
      });
      return { userMsg, assistants };
    });
    const { userMsg, assistants } = txn();

    // Fire sequential roundtable orchestration (don't await — runs in background)
    streamClaudeRoundtable(
      channelId,
      assistants.map((a) => ({
        assistantMessageId: a.assistantMessageId,
        entity: entities.find((e) => e.id === a.entityId)!,
      })),
      channel.systemPrompt
    );

    return c.json({ userMessageId: userMsg.id, assistants });
  }

  if (channel.mode === 'directed') {
    // Directed: @-mention routes to specific entity(ies)
    const mentioned = resolveMentions(content, entities);

    if (mentioned.length === 0) {
      // No valid @-mention found — tell the user what's available
      const names = entities.map((e) => `@${e.name}`).join(', ');
      return c.json({
        error: `No entity mentioned. Use @EntityName to direct your message. Available: ${names}`,
      }, 400);
    }

    // Create user message + placeholders only for mentioned entities
    const db = getDb();
    const txn = db.transaction(() => {
      const userMsg = insertMessage(channelId, 'user', content.trim(), 'complete');
      const assistants = mentioned.map((entity) => {
        const msg = insertMessage(channelId, 'assistant', '', 'streaming', entity.model, entity.id);
        return { assistantMessageId: msg.id, entityId: entity.id, model: entity.model };
      });
      return { userMsg, assistants };
    });
    const { userMsg, assistants } = txn();

    // Fire off streams for mentioned entities (parallel, panel-like isolation)
    for (const assistant of assistants) {
      const entity = mentioned.find((e) => e.id === assistant.entityId)!;
      streamClaude(channelId, assistant.assistantMessageId, entity, channel.systemPrompt);
    }

    return c.json({ userMessageId: userMsg.id, assistants });
  }

  // ── Panel mode (default) ────────────────────────────────────
  // Create user message + N assistant placeholders in a single transaction
  const db = getDb();
  const txn = db.transaction(() => {
    const userMsg = insertMessage(channelId, 'user', content.trim(), 'complete');
    const assistants = entities.map((entity) => {
      const msg = insertMessage(channelId, 'assistant', '', 'streaming', entity.model, entity.id);
      return { assistantMessageId: msg.id, entityId: entity.id, model: entity.model };
    });
    return { userMsg, assistants };
  });
  const { userMsg, assistants } = txn();

  // Fire off N parallel streams (don't await)
  for (const assistant of assistants) {
    const entity = entities.find((e) => e.id === assistant.entityId)!;
    streamClaude(channelId, assistant.assistantMessageId, entity, channel.systemPrompt);
  }

  return c.json({ userMessageId: userMsg.id, assistants });
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

// Stop a single streaming message
app.post('/messages/:id/stop', (c) => {
  const id = c.req.param('id');
  const aborted = abortStream(id);
  if (!aborted) {
    return c.json({ error: 'No active stream for this message' }, 404);
  }
  return c.json({ stopped: true });
});

// Stop all active streams in a channel
app.post('/channels/:channelId/stop', (c) => {
  const channelId = c.req.param('channelId');

  // Find all active streams for streaming messages in this channel
  const messages = getMessages(channelId).filter((m) => m.status === 'streaming');
  let stopped = 0;
  for (const msg of messages) {
    if (abortStream(msg.id)) stopped++;
  }

  return c.json({ stopped });
});

// Regenerate: delete the last round's assistant messages and re-send
app.post('/channels/:channelId/regenerate', async (c) => {
  const channelId = c.req.param('channelId');

  const channel = getChannel(channelId);
  if (!channel) {
    return c.json({ error: 'Channel not found' }, 404);
  }

  const entities = getChannelEntities(channelId);
  if (entities.length === 0) {
    return c.json({ error: 'No entities assigned to this channel' }, 400);
  }

  if (channel.mode === 'roundtable') {
    // Roundtable: delete ALL assistant messages from the last round, redo the whole round
    const lastRound = getLastRoundAssistantMessages(channelId);
    if (lastRound.length === 0) {
      return c.json({ error: 'No assistant messages to regenerate' }, 404);
    }

    const db = getDb();
    const txn = db.transaction(() => {
      for (const msg of lastRound) deleteMessage(msg.id);
      return entities.map((entity) => {
        const msg = insertMessage(channelId, 'assistant', '', 'streaming', entity.model, entity.id);
        return { assistantMessageId: msg.id, entityId: entity.id, model: entity.model };
      });
    });
    const assistants = txn();

    streamClaudeRoundtable(
      channelId,
      assistants.map((a) => ({
        assistantMessageId: a.assistantMessageId,
        entity: entities.find((e) => e.id === a.entityId)!,
      })),
      channel.systemPrompt
    );

    return c.json({
      assistantMessageId: assistants[0].assistantMessageId,
      model: assistants[0].model,
      assistants,
    });
  }

  // Panel and directed modes: regenerate just the last assistant message(s)
  // For directed, there may be multiple assistant messages from the last user turn
  // but we regenerate the same set. For now, single-entity regenerate works for both.
  const lastAssistant = getLastAssistantMessage(channelId);
  if (!lastAssistant) {
    return c.json({ error: 'No assistant message to regenerate' }, 404);
  }

  deleteMessage(lastAssistant.id);

  // If the message had an entity, regenerate with that entity; otherwise use first channel entity
  const entity = lastAssistant.entityId
    ? entities.find((e) => e.id === lastAssistant.entityId) || entities[0]
    : entities[0];

  if (!entity) {
    return c.json({ error: 'Entity not found for regeneration' }, 404);
  }

  const assistantMsg = insertMessage(channelId, 'assistant', '', 'streaming', entity.model, entity.id);
  streamClaude(channelId, assistantMsg.id, entity, channel.systemPrompt);

  return c.json({
    assistantMessageId: assistantMsg.id,
    model: entity.model,
    assistants: [{ assistantMessageId: assistantMsg.id, entityId: entity.id, model: entity.model }],
  });
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
