import type { Channel, Entity, Message, ModelId, InteractionMode, ImportResult } from '@klatch/shared';

const BASE = '/api';

// ── Channel API ──────────────────────────────────────────────

export async function fetchChannels(): Promise<Channel[]> {
  const res = await fetch(`${BASE}/channels`);
  if (!res.ok) throw new Error(`Failed to fetch channels: ${res.statusText}`);
  return res.json();
}

export async function createChannel(
  name: string,
  systemPrompt?: string,
  model?: ModelId
): Promise<Channel> {
  const res = await fetch(`${BASE}/channels`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, systemPrompt, model }),
  });
  if (!res.ok) throw new Error(`Failed to create channel: ${res.statusText}`);
  return res.json();
}

export async function updateChannelApi(
  id: string,
  updates: { name?: string; systemPrompt?: string; model?: ModelId; mode?: InteractionMode }
): Promise<Channel> {
  const res = await fetch(`${BASE}/channels/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error(`Failed to update channel: ${res.statusText}`);
  return res.json();
}

export async function deleteChannelApi(id: string): Promise<void> {
  const res = await fetch(`${BASE}/channels/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error(`Failed to delete channel: ${res.statusText}`);
}

// ── Entity API ───────────────────────────────────────────────

export async function fetchEntities(): Promise<Entity[]> {
  const res = await fetch(`${BASE}/entities`);
  if (!res.ok) throw new Error(`Failed to fetch entities: ${res.statusText}`);
  return res.json();
}

export async function fetchChannelEntities(channelId: string): Promise<Entity[]> {
  const res = await fetch(`${BASE}/channels/${channelId}/entities`);
  if (!res.ok) throw new Error(`Failed to fetch channel entities: ${res.statusText}`);
  return res.json();
}

export async function createEntity(data: {
  name: string;
  handle?: string;
  model?: ModelId;
  systemPrompt?: string;
  color?: string;
}): Promise<Entity> {
  const res = await fetch(`${BASE}/entities`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Failed to create entity: ${res.statusText}`);
  return res.json();
}

export async function updateEntity(
  id: string,
  updates: { name?: string; handle?: string | null; model?: ModelId; systemPrompt?: string; color?: string }
): Promise<Entity> {
  const res = await fetch(`${BASE}/entities/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error(`Failed to update entity: ${res.statusText}`);
  return res.json();
}

export async function deleteEntity(id: string): Promise<void> {
  const res = await fetch(`${BASE}/entities/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error(`Failed to delete entity: ${res.statusText}`);
}

export async function assignEntityToChannel(channelId: string, entityId: string): Promise<Entity[]> {
  const res = await fetch(`${BASE}/channels/${channelId}/entities`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ entityId }),
  });
  if (!res.ok) throw new Error(`Failed to assign entity: ${res.statusText}`);
  return res.json();
}

export async function removeEntityFromChannel(channelId: string, entityId: string): Promise<Entity[]> {
  const res = await fetch(`${BASE}/channels/${channelId}/entities/${entityId}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error(`Failed to remove entity: ${res.statusText}`);
  return res.json();
}

// ── Message API ──────────────────────────────────────────────

export interface AssistantInfo {
  assistantMessageId: string;
  entityId: string;
  model: ModelId;
}

export interface SendMessageResponse {
  userMessageId: string;
  assistants: AssistantInfo[];
}

export async function fetchMessages(channelId: string): Promise<Message[]> {
  const res = await fetch(`${BASE}/channels/${channelId}/messages`);
  if (!res.ok) throw new Error(`Failed to fetch messages: ${res.statusText}`);
  return res.json();
}

export async function sendMessage(
  channelId: string,
  content: string
): Promise<SendMessageResponse> {
  const res = await fetch(`${BASE}/channels/${channelId}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  });
  if (!res.ok) {
    // Try to extract server error message (e.g. directed mode missing @-mention)
    try {
      const body = await res.json();
      throw new Error(body.error || `Failed to send message: ${res.statusText}`);
    } catch (parseErr) {
      if (parseErr instanceof Error && parseErr.message !== `Failed to send message: ${res.statusText}`) {
        throw parseErr;
      }
      throw new Error(`Failed to send message: ${res.statusText}`);
    }
  }
  return res.json();
}

export async function clearChannelHistory(channelId: string): Promise<{ deleted: number }> {
  const res = await fetch(`${BASE}/channels/${channelId}/messages`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error(`Failed to clear history: ${res.statusText}`);
  return res.json();
}

export async function deleteMessageApi(id: string): Promise<void> {
  const res = await fetch(`${BASE}/messages/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error(`Failed to delete message: ${res.statusText}`);
}

export async function stopGeneration(messageId: string): Promise<void> {
  const res = await fetch(`${BASE}/messages/${messageId}/stop`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error(`Failed to stop generation: ${res.statusText}`);
}

export async function stopChannel(channelId: string): Promise<{ stopped: number }> {
  const res = await fetch(`${BASE}/channels/${channelId}/stop`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error(`Failed to stop channel: ${res.statusText}`);
  return res.json();
}

export async function regenerateLastResponse(
  channelId: string
): Promise<{ assistantMessageId: string; model?: ModelId; assistants: AssistantInfo[] }> {
  const res = await fetch(`${BASE}/channels/${channelId}/regenerate`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error(`Failed to regenerate: ${res.statusText}`);
  return res.json();
}

// ── Import API ────────────────────────────────────────────────

export interface ImportResponse extends ImportResult {
  sessionId?: string;
}

// ── Context File API ─────────────────────────────────────────

export interface ContextFileResponse {
  content: string;
  path: string;
}

/**
 * Fetch a context file (CLAUDE.md, etc.) from the imported channel's original project.
 * Returns the file content and path, or throws with a helpful error message.
 */
export async function fetchContextFile(
  channelId: string,
  filePath: string = 'CLAUDE.md'
): Promise<ContextFileResponse> {
  const res = await fetch(`${BASE}/channels/${channelId}/context-file?path=${encodeURIComponent(filePath)}`);
  if (!res.ok) {
    try {
      const body = await res.json();
      throw new Error(body.hint || body.error || `Failed to load context file: ${res.statusText}`);
    } catch (parseErr) {
      if (parseErr instanceof Error && !parseErr.message.startsWith('Failed to load')) {
        throw parseErr;
      }
      throw new Error(`Failed to load context file: ${res.statusText}`);
    }
  }
  return res.json();
}

export async function importClaudeCodeSession(
  sessionPath: string,
  channelName?: string
): Promise<ImportResponse> {
  const res = await fetch(`${BASE}/import/claude-code`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionPath, channelName: channelName || undefined }),
  });
  if (!res.ok) {
    try {
      const body = await res.json();
      throw new Error(body.error || `Import failed: ${res.statusText}`);
    } catch (parseErr) {
      if (parseErr instanceof Error && !parseErr.message.startsWith('Import failed:')) {
        throw parseErr;
      }
      throw new Error(`Import failed: ${res.statusText}`);
    }
  }
  return res.json();
}
