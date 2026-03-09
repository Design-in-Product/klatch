import React, { useState, useCallback, useEffect, useRef } from 'react';
import type { Channel, Entity, ModelId, InteractionMode } from '@klatch/shared';
import { AVAILABLE_MODELS, INTERACTION_MODES } from '@klatch/shared';
import { ChannelSidebar } from './components/ChannelSidebar';
import { ChannelSettings } from './components/ChannelSettings';
import { EntityManager } from './components/EntityManager';
import { MessageList } from './components/MessageList';
import { MessageInput } from './components/MessageInput';
import { useMessages } from './hooks/useMessages';
import { useStreams } from './hooks/useStreams';
import {
  sendMessage,
  fetchChannels,
  fetchEntities,
  fetchChannelEntities,
  createChannel,
  updateChannelApi,
  clearChannelHistory,
  deleteMessageApi,
  stopChannel,
  regenerateLastResponse,
  createEntity,
  updateEntity,
  deleteEntity,
  assignEntityToChannel,
  removeEntityFromChannel,
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
  const [streamingMessageIds, setStreamingMessageIds] = useState<string[]>([]);
  const [channelEntities, setChannelEntities] = useState<Entity[]>([]);
  const [allEntities, setAllEntities] = useState<Entity[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [showEntityManager, setShowEntityManager] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Theme
  const [theme, setTheme] = useState<'light' | 'dark'>(getInitialTheme);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('klatch-theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === 'light' ? 'dark' : 'light'));

  // Load channels and entities on mount
  useEffect(() => {
    fetchChannels().then(setChannels).catch(console.error);
    fetchEntities().then(setAllEntities).catch(console.error);
  }, []);

  // Load channel entities when active channel changes
  useEffect(() => {
    fetchChannelEntities(activeChannelId)
      .then(setChannelEntities)
      .catch(console.error);
  }, [activeChannelId]);

  const activeChannel = channels.find((c) => c.id === activeChannelId);

  // Multi-stream handling
  const handleStreamComplete = useCallback(
    (messageId: string, content: string) => {
      updateMessage(messageId, { content, status: 'complete' });
      setStreamingMessageIds((prev) => prev.filter((id) => id !== messageId));
    },
    [updateMessage]
  );

  const handleStreamError = useCallback(
    (messageId: string, content: string) => {
      updateMessage(messageId, { content, status: 'error' });
      setStreamingMessageIds((prev) => prev.filter((id) => id !== messageId));
    },
    [updateMessage]
  );

  const { isAnyStreaming, getStreamContent, isMessageStreaming, reset: resetStreams } = useStreams(
    streamingMessageIds,
    handleStreamComplete,
    handleStreamError
  );

  const handleSend = async (content: string) => {
    setSendError(null);
    try {
      const { userMessageId, assistants } = await sendMessage(activeChannelId, content);

      addMessage({
        id: userMessageId,
        channelId: activeChannelId,
        role: 'user',
        content,
        status: 'complete',
        createdAt: new Date().toISOString(),
      });

      const newStreamingIds: string[] = [];
      for (const assistant of assistants) {
        addMessage({
          id: assistant.assistantMessageId,
          channelId: activeChannelId,
          role: 'assistant',
          content: '',
          status: 'streaming',
          model: assistant.model,
          entityId: assistant.entityId,
          createdAt: new Date().toISOString(),
        });
        newStreamingIds.push(assistant.assistantMessageId);
      }

      setStreamingMessageIds(newStreamingIds);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
      console.error('Failed to send message:', err);
      setSendError(errorMessage);
      // Auto-dismiss after 5 seconds
      setTimeout(() => setSendError(null), 5000);
    }
  };

  const handleStop = async () => {
    if (streamingMessageIds.length === 0) return;
    try {
      await stopChannel(activeChannelId);
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
      const { assistants } = await regenerateLastResponse(activeChannelId);

      // Remove the last assistant message(s) from the UI
      const lastAssistantIdx = [...messages]
        .reverse()
        .findIndex((m) => m.role === 'assistant');
      if (lastAssistantIdx !== -1) {
        const actualIdx = messages.length - 1 - lastAssistantIdx;
        removeMessage(messages[actualIdx].id);
      }

      const newStreamingIds: string[] = [];
      for (const assistant of assistants) {
        addMessage({
          id: assistant.assistantMessageId,
          channelId: activeChannelId,
          role: 'assistant',
          content: '',
          status: 'streaming',
          model: assistant.model,
          entityId: assistant.entityId,
          createdAt: new Date().toISOString(),
        });
        newStreamingIds.push(assistant.assistantMessageId);
      }

      setStreamingMessageIds(newStreamingIds);
    } catch (err) {
      console.error('Failed to regenerate:', err);
    }
  };

  const handleSelectChannel = (id: string) => {
    if (id === activeChannelId) {
      setSidebarOpen(false);
      return;
    }
    setStreamingMessageIds([]);
    resetStreams();
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

  const handleUpdateChannel = async (updates: { name?: string; systemPrompt?: string; model?: ModelId; mode?: InteractionMode }) => {
    try {
      const updated = await updateChannelApi(activeChannelId, updates);
      setChannels((prev) =>
        prev.map((c) => (c.id === activeChannelId ? updated : c))
      );
    } catch (err) {
      console.error('Failed to update channel:', err);
    }
  };

  // ── Entity CRUD handlers ──────────────────────────────────────

  const handleCreateEntity = async (data: { name: string; model?: ModelId; systemPrompt?: string; color?: string }) => {
    try {
      const entity = await createEntity(data);
      setAllEntities((prev) => [...prev, entity]);
    } catch (err) {
      console.error('Failed to create entity:', err);
    }
  };

  const handleUpdateEntity = async (id: string, updates: { name?: string; model?: ModelId; systemPrompt?: string; color?: string }) => {
    try {
      const updated = await updateEntity(id, updates);
      setAllEntities((prev) => prev.map((e) => (e.id === id ? updated : e)));
      // Also update channel entities if this entity is assigned
      setChannelEntities((prev) => prev.map((e) => (e.id === id ? updated : e)));
    } catch (err) {
      console.error('Failed to update entity:', err);
    }
  };

  const handleDeleteEntity = async (id: string) => {
    try {
      await deleteEntity(id);
      setAllEntities((prev) => prev.filter((e) => e.id !== id));
      setChannelEntities((prev) => prev.filter((e) => e.id !== id));
    } catch (err) {
      console.error('Failed to delete entity:', err);
    }
  };

  const handleAssignEntity = async (entityId: string) => {
    try {
      const entities = await assignEntityToChannel(activeChannelId, entityId);
      setChannelEntities(entities);
      // Refresh channels list so sidebar grouping updates (entityCount changed)
      fetchChannels().then(setChannels).catch(console.error);
    } catch (err) {
      console.error('Failed to assign entity:', err);
    }
  };

  const handleRemoveEntity = async (entityId: string) => {
    try {
      const entities = await removeEntityFromChannel(activeChannelId, entityId);
      setChannelEntities(entities);
      // Refresh channels list so sidebar grouping updates (entityCount changed)
      fetchChannels().then(setChannels).catch(console.error);
    } catch (err) {
      console.error('Failed to remove entity:', err);
    }
  };

  // Header: show entity avatars instead of single model label
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
        onOpenEntities={() => setShowEntityManager(true)}
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
              {/* Entity pills in header */}
              {channelEntities.length > 0 ? (
                <div className="flex items-center gap-1">
                  {channelEntities.map((entity) => (
                    <span
                      key={entity.id}
                      className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-badge text-muted font-medium"
                      title={`${entity.name} (${AVAILABLE_MODELS[entity.model]?.label || entity.model})`}
                    >
                      <span
                        className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: entity.color }}
                      />
                      {AVAILABLE_MODELS[entity.model]?.label || entity.model}
                    </span>
                  ))}
                </div>
              ) : activeModelLabel ? (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-badge text-muted font-medium">
                  {activeModelLabel}
                </span>
              ) : null}
              {/* Mode badge — only show for non-default modes with 2+ entities */}
              {activeChannel?.mode && activeChannel.mode !== 'panel' && channelEntities.length >= 2 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent/15 text-accent font-medium">
                  {INTERACTION_MODES[activeChannel.mode]?.label || activeChannel.mode}
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
          {messages.length > 0 && !isAnyStreaming && (
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
            channelEntities={channelEntities}
            allEntities={allEntities}
            onSave={handleUpdateChannel}
            onAssignEntity={handleAssignEntity}
            onRemoveEntity={handleRemoveEntity}
            onClose={() => setShowSettings(false)}
          />
        )}

        {/* Messages */}
        <MessageList
          messages={messages}
          getStreamContent={getStreamContent}
          isMessageStreaming={isMessageStreaming}
          channelEntities={channelEntities}
          onDeleteMessage={handleDeleteMessage}
          onRegenerateMessage={handleRegenerate}
          isStreaming={isAnyStreaming}
          theme={theme}
        />

        {/* Send error banner */}
        {sendError && (
          <div className="px-3 md:px-6 py-2 bg-danger/10 border-t border-danger/20">
            <p className="text-xs text-danger">{sendError}</p>
          </div>
        )}

        {/* Input */}
        <MessageInput
          onSend={handleSend}
          onStop={handleStop}
          disabled={isAnyStreaming}
          isStreaming={isAnyStreaming}
          channelEntities={channelEntities}
          mode={activeChannel?.mode}
        />
      </div>

      {/* Entity Manager modal */}
      {showEntityManager && (
        <EntityManager
          entities={allEntities}
          onCreateEntity={handleCreateEntity}
          onUpdateEntity={handleUpdateEntity}
          onDeleteEntity={handleDeleteEntity}
          onClose={() => setShowEntityManager(false)}
        />
      )}
    </div>
  );
}
