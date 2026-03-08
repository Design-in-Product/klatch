import React, { useState, useCallback, useEffect, useRef } from 'react';
import type { Channel, ModelId } from '@klatch/shared';
import { AVAILABLE_MODELS } from '@klatch/shared';
import { ChannelSidebar } from './components/ChannelSidebar';
import { ChannelSettings } from './components/ChannelSettings';
import { MessageList } from './components/MessageList';
import { MessageInput } from './components/MessageInput';
import { useMessages } from './hooks/useMessages';
import { useStream } from './hooks/useStream';
import {
  sendMessage,
  fetchChannels,
  createChannel,
  updateChannelApi,
  clearChannelHistory,
  deleteMessageApi,
  stopGeneration,
  regenerateLastResponse,
} from './api/client';

function getInitialTheme(): 'light' | 'dark' {
  const stored = localStorage.getItem('klatch-theme');
  if (stored === 'light' || stored === 'dark') return stored;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export default function App() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [activeChannelId, setActiveChannelId] = useState<string>('default');
  const { messages, addMessage, updateMessage, removeMessage, clearMessages, refresh } =
    useMessages(activeChannelId);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
  const [streamingModel, setStreamingModel] = useState<ModelId | undefined>();
  const [showSettings, setShowSettings] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Theme
  const [theme, setTheme] = useState<'light' | 'dark'>(getInitialTheme);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('klatch-theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === 'light' ? 'dark' : 'light'));

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
        setStreamingModel(undefined);
      }
    },
    [streamingMessageId, updateMessage]
  );

  const handleStreamError = useCallback(
    (content: string) => {
      if (streamingMessageId) {
        updateMessage(streamingMessageId, { content, status: 'error' });
        setStreamingMessageId(null);
        setStreamingModel(undefined);
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
      const { userMessageId, assistantMessageId, model } = await sendMessage(
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
        model,
        createdAt: new Date().toISOString(),
      });

      setStreamingMessageId(assistantMessageId);
      setStreamingModel(model);
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
  };

  const [confirmingClear, setConfirmingClear] = useState(false);
  const clearTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const handleClearHistory = () => {
    if (!confirmingClear) {
      setConfirmingClear(true);
      clearTimeoutRef.current = setTimeout(() => setConfirmingClear(false), 3000);
      return;
    }
    clearTimeout(clearTimeoutRef.current);
    setConfirmingClear(false);
    (async () => {
      try {
        await clearChannelHistory(activeChannelId);
        clearMessages();
      } catch (err) {
        console.error('Failed to clear history:', err);
      }
    })();
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
      const { assistantMessageId, model } = await regenerateLastResponse(activeChannelId);

      const lastAssistantIdx = [...messages]
        .reverse()
        .findIndex((m) => m.role === 'assistant');
      if (lastAssistantIdx !== -1) {
        const actualIdx = messages.length - 1 - lastAssistantIdx;
        removeMessage(messages[actualIdx].id);
      }

      addMessage({
        id: assistantMessageId,
        channelId: activeChannelId,
        role: 'assistant',
        content: '',
        status: 'streaming',
        model,
        createdAt: new Date().toISOString(),
      });

      setStreamingMessageId(assistantMessageId);
      setStreamingModel(model);
    } catch (err) {
      console.error('Failed to regenerate:', err);
    }
  };

  const handleSelectChannel = (id: string) => {
    if (id === activeChannelId) {
      setSidebarOpen(false);
      return;
    }
    setStreamingMessageId(null);
    setStreamingModel(undefined);
    setConfirmingClear(false);
    setShowSettings(false);
    setSidebarOpen(false);
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

  const handleUpdateChannel = async (updates: { name?: string; systemPrompt?: string; model?: ModelId }) => {
    try {
      const updated = await updateChannelApi(activeChannelId, updates);
      setChannels((prev) =>
        prev.map((c) => (c.id === activeChannelId ? updated : c))
      );
    } catch (err) {
      console.error('Failed to update channel:', err);
    }
  };

  // Model label for the header
  const activeModelLabel = activeChannel
    ? AVAILABLE_MODELS[activeChannel.model]?.label || activeChannel.model
    : undefined;

  return (
    <div className="h-full flex bg-app">
      {/* Sidebar */}
      <ChannelSidebar
        channels={channels}
        activeChannelId={activeChannelId}
        onSelectChannel={handleSelectChannel}
        onCreateChannel={handleCreateChannel}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="border-b border-line px-3 md:px-6 py-3 bg-header flex items-center justify-between">
          {/* Hamburger — mobile only */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden mr-3 text-muted hover:text-primary transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="min-w-0 text-left hover:opacity-80 transition-opacity"
            title="Edit channel settings"
          >
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold text-primary">
                # {activeChannel?.name ?? 'general'}
              </h1>
              {activeModelLabel && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-badge text-muted font-medium">
                  {activeModelLabel}
                </span>
              )}
              <svg className={`w-4 h-4 text-muted transition-transform ${showSettings ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            {activeChannel?.systemPrompt && (
              <p className="text-xs text-secondary truncate">
                {activeChannel.systemPrompt}
              </p>
            )}
          </button>
          {messages.length > 0 && !isStreaming && (
            <button
              onClick={handleClearHistory}
              title={confirmingClear ? 'Click again to confirm' : 'Clear channel history'}
              className={`ml-4 flex-shrink-0 rounded px-3 py-1.5 text-xs font-medium transition-colors flex items-center gap-1.5 ${
                confirmingClear
                  ? 'bg-danger text-white animate-pulse'
                  : 'bg-transparent text-muted hover:text-primary hover:bg-hover'
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              {confirmingClear ? 'Confirm clear?' : 'Clear'}
            </button>
          )}
        </div>

        {/* Settings panel (toggle) */}
        {showSettings && activeChannel && (
          <ChannelSettings
            channel={activeChannel}
            onSave={handleUpdateChannel}
            onClose={() => setShowSettings(false)}
          />
        )}

        {/* Messages */}
        <MessageList
          messages={messages}
          streamingContent={streamingContent}
          streamingMessageId={streamingMessageId}
          streamingModel={streamingModel}
          onDeleteMessage={handleDeleteMessage}
          onRegenerateMessage={handleRegenerate}
          isStreaming={isStreaming}
          theme={theme}
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
