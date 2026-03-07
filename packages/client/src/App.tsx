import React, { useState, useCallback, useEffect } from 'react';
import type { Channel } from '@klatch/shared';
import { ChannelSidebar } from './components/ChannelSidebar';
import { MessageList } from './components/MessageList';
import { MessageInput } from './components/MessageInput';
import { useMessages } from './hooks/useMessages';
import { useStream } from './hooks/useStream';
import { sendMessage, fetchChannels, createChannel } from './api/client';

export default function App() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [activeChannelId, setActiveChannelId] = useState<string>('default');
  const { messages, addMessage, updateMessage } = useMessages(activeChannelId);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);

  // Load channels on mount
  useEffect(() => {
    fetchChannels().then(setChannels).catch(console.error);
  }, []);

  const activeChannel = channels.find((c) => c.id === activeChannelId);

  const handleStreamComplete = useCallback(
    (content: string) => {
      if (streamingMessageId) {
        updateMessage(streamingMessageId, { content, status: 'complete' });
        setStreamingMessageId(null);
      }
    },
    [streamingMessageId, updateMessage]
  );

  const handleStreamError = useCallback(
    (content: string) => {
      if (streamingMessageId) {
        updateMessage(streamingMessageId, { content, status: 'error' });
        setStreamingMessageId(null);
      }
    },
    [streamingMessageId, updateMessage]
  );

  const { content: streamingContent, isStreaming } = useStream(
    streamingMessageId,
    handleStreamComplete,
    handleStreamError
  );

  const handleSend = async (content: string) => {
    try {
      const { userMessageId, assistantMessageId } = await sendMessage(
        activeChannelId,
        content
      );

      addMessage({
        id: userMessageId,
        channelId: activeChannelId,
        role: 'user',
        content,
        status: 'complete',
        createdAt: new Date().toISOString(),
      });

      addMessage({
        id: assistantMessageId,
        channelId: activeChannelId,
        role: 'assistant',
        content: '',
        status: 'streaming',
        createdAt: new Date().toISOString(),
      });

      setStreamingMessageId(assistantMessageId);
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  const handleSelectChannel = (id: string) => {
    if (id === activeChannelId) return;
    setStreamingMessageId(null);
    setActiveChannelId(id);
  };

  const handleCreateChannel = async (name: string, systemPrompt: string) => {
    try {
      const channel = await createChannel(name, systemPrompt);
      setChannels((prev) => [...prev, channel]);
      setActiveChannelId(channel.id);
    } catch (err) {
      console.error('Failed to create channel:', err);
    }
  };

  return (
    <div className="h-full flex bg-[#16213e]">
      {/* Sidebar */}
      <ChannelSidebar
        channels={channels}
        activeChannelId={activeChannelId}
        onSelectChannel={handleSelectChannel}
        onCreateChannel={handleCreateChannel}
      />

      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="border-b border-gray-700 px-6 py-3 bg-[#0f3460]">
          <h1 className="text-lg font-semibold text-gray-100">
            # {activeChannel?.name ?? 'general'}
          </h1>
          {activeChannel?.systemPrompt && (
            <p className="text-xs text-gray-400 truncate">
              {activeChannel.systemPrompt}
            </p>
          )}
        </div>

        {/* Messages */}
        <MessageList
          messages={messages}
          streamingContent={streamingContent}
          streamingMessageId={streamingMessageId}
        />

        {/* Input */}
        <MessageInput onSend={handleSend} disabled={isStreaming} />
      </div>
    </div>
  );
}
