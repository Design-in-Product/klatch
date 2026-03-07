import { useState, useEffect, useCallback } from 'react';
import type { Message } from '@klatch/shared';
import { fetchMessages } from '../api/client';

export function useMessages(channelId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const msgs = await fetchMessages(channelId);
    setMessages(msgs);
    setLoading(false);
  }, [channelId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addMessage = (msg: Message) => {
    setMessages((prev) => [...prev, msg]);
  };

  const updateMessage = (id: string, updates: Partial<Message>) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...updates } : m))
    );
  };

  return { messages, loading, refresh, addMessage, updateMessage };
}
