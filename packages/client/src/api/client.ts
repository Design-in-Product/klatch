import type { Channel, Message, ModelId } from '@klatch/shared';

const BASE = '/api';

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
  updates: { name?: string; systemPrompt?: string; model?: ModelId }
): Promise<Channel> {
  const res = await fetch(`${BASE}/channels/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error(`Failed to update channel: ${res.statusText}`);
  return res.json();
}

export async function fetchMessages(channelId: string): Promise<Message[]> {
  const res = await fetch(`${BASE}/channels/${channelId}/messages`);
  if (!res.ok) throw new Error(`Failed to fetch messages: ${res.statusText}`);
  return res.json();
}

export async function sendMessage(
  channelId: string,
  content: string
): Promise<{ userMessageId: string; assistantMessageId: string; model?: ModelId }> {
  const res = await fetch(`${BASE}/channels/${channelId}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  });
  if (!res.ok) throw new Error(`Failed to send message: ${res.statusText}`);
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

export async function regenerateLastResponse(
  channelId: string
): Promise<{ assistantMessageId: string; model?: ModelId }> {
  const res = await fetch(`${BASE}/channels/${channelId}/regenerate`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error(`Failed to regenerate: ${res.statusText}`);
  return res.json();
}
