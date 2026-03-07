import type { Channel, Message } from '@klatch/shared';

const BASE = '/api';

export async function fetchChannels(): Promise<Channel[]> {
  const res = await fetch(`${BASE}/channels`);
  if (!res.ok) throw new Error(`Failed to fetch channels: ${res.statusText}`);
  return res.json();
}

export async function createChannel(
  name: string,
  systemPrompt?: string
): Promise<Channel> {
  const res = await fetch(`${BASE}/channels`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, systemPrompt }),
  });
  if (!res.ok) throw new Error(`Failed to create channel: ${res.statusText}`);
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
): Promise<{ userMessageId: string; assistantMessageId: string }> {
  const res = await fetch(`${BASE}/channels/${channelId}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  });
  if (!res.ok) throw new Error(`Failed to send message: ${res.statusText}`);
  return res.json();
}
