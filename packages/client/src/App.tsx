import React, { useState, useCallback, useEffect } from 'react';
import type { Channel } from '@klatch/shared';
import { ChannelSidebar } from './components/ChannelSidebar';
import { MessageList } from './components/MessageList';
import { MessageInput } from './components/MessageInput';
import { useMessages } from './hooks/useMessages';
import { useStream } from './hooks/useStream';
import {
  sendMessage,
  fetchChannels,
  createChannel,
  clearChannelHistory,
  deleteMessageApi,
  stopGeneration,
  regenerateLastResponse,
} from './api/client';

export default function App() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [activeChannelId, setActiveChannelId] = useState<string>('default');
  const { messages, addMessage, updateMessage, removeMessage, clearMessages, refresh } =
    useMessages(activeChannelId);
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

  const handleStop = async () => {
    if (!streamingMessageId) return;
    try {
      await stopGeneration(streamingMessageId);
    } catch (err) {
      console.error('Failed to stop generation:', err);
    }
    // The stream will complete on its own via the SSE events
  };

  const handleClearHistory = async () => {
    try {
      await clearChannelHistory(activeChannelId);
      clearMessages();
    } catch (err) {
      console.error('Failed to clear history:', err);
    }
  };

  const handleDeleteMessage = async (id: string) => {
    try {
      await deleteMessageApi(id);
      removeMessage(id);
    } catch (err) {
      console.error('Failed to delete message:', err);
    }
  };

  const handleRegenerate = async () => {
    try {
      const { assistantMessageId } = await regenerateLastResponse(activeChannelId);

      // Remove the old last assistant message from local state
      const lastAssistantIdx = [...messages]
        .reverse()
        .findIndex((m) => m.role === 'assistant');
      if (lastAssistantIdx !== -1) {
        const actualIdx = messages.length - 1 - lastAssistantIdx;
        removeMessage(messages[actualIdx].id);
      }

      // Add the new streaming placeholder
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
      console.error('Failed to regenerate:', err);
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
        <div className="border-b border-gray-700 px-6 py-3 bg-[#0f3460] flex items-center justify-between">
          <div className="min-w-0">
            <h1 className="text-lg font-semibold text-gray-100">
              # {activeChannel?.name ?? 'general'}
            </h1>
            {activeChannel?.systemPrompt && (
              <p className="text-xs text-gray-400 truncate">
                {activeChannel.systemPrompt}
              </p>
            )}
          </div>
          {messages.length > 0 && !isStreaming && (
            <button
              onClick={handleClearHistory}
              title="Clear channel history"
              className="ml-4 flex-shrink-0 rounded bg-gray-700 hover:bg-red-600/80 px-3 py-1.5 text-xs font-medium text-gray-300 hover:text-white transition-colors flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Clear
            </button>
          )}
        </div>

        {/* Messages */}
        <MessageList
          messages={messages}
          streamingContent={streamingContent}
          streamingMessageId={streamingMessageId}
          onDeleteMessage={handleDeleteMessage}
          onRegenerateMessage={handleRegenerate}
          isStreaming={isStreaming}
        />

        {/* Input */}
        <MessageInput
          onSend={handleSend}
          onStop={handleStop}
          disabled={isStreaming}
          isStreaming={isStreaming}
        />
      </div>
    </div>
  );
}
