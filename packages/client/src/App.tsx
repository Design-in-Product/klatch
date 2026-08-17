import React, { useState, useCallback, useEffect, useRef } from 'react';
import type { Channel, Entity, ModelId, InteractionMode, ChannelType, Message } from '@klatch/shared';
import { INTERACTION_MODES } from '@klatch/shared';
import { getModelLabel } from './hooks/useModels';
import { ChannelSidebar } from './components/ChannelSidebar';
import { CrossRefStrip } from './components/CrossRefStrip';
import { ChannelSettings } from './components/ChannelSettings';
import { ProjectSettings } from './components/ProjectSettings';
import { EntityManager } from './components/EntityManager';
import { ImportDialog } from './components/ImportDialog';
import { ExportReviewPanel } from './components/ExportReviewPanel';
import { MessageList } from './components/MessageList';
import { MessageInput } from './components/MessageInput';
import { useMessages } from './hooks/useMessages';
import { useStreams } from './hooks/useStreams';
import {
  sendMessage,
  sendMessageWithFile,
  fetchChannels,
  fetchEntities,
  fetchChannelEntities,
  fetchKlatchesForEntity,
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
  deleteChannelApi,
  fetchProjects,
  pinFileToChannel,
  type Project,
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
  const [relatedKlatches, setRelatedKlatches] = useState<Channel[]>([]);
  const [allEntities, setAllEntities] = useState<Entity[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [showExportReview, setShowExportReview] = useState(false);
  const [showEntityManager, setShowEntityManager] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
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
    fetchProjects().then(setProjects).catch(console.error);
  }, []);

  // Load channel entities when active channel changes
  useEffect(() => {
    fetchChannelEntities(activeChannelId)
      .then(setChannelEntities)
      .catch(console.error);
  }, [activeChannelId]);

  const activeChannel = channels.find((c) => c.id === activeChannelId);

  // Cross-reference: for a 1-1 role chat (one agent), surface the klatches that agent is also in.
  // Suppressed on #general (id 'default') — the workspace home isn't a role-relationship chat (Iris, 6/23).
  useEffect(() => {
    if (activeChannel?.type === 'chat' && channelEntities.length === 1 && activeChannel?.id !== 'default') {
      fetchKlatchesForEntity(channelEntities[0].id)
        .then(setRelatedKlatches)
        .catch(() => setRelatedKlatches([]));
    } else {
      setRelatedKlatches([]);
    }
  }, [channelEntities, activeChannel?.type, activeChannel?.id]);

  // Multi-stream handling
  const handleStreamComplete = useCallback(
    (messageId: string, content: string, stopReason?: Message['stopReason'], carriedContext?: string) => {
      updateMessage(messageId, (m) => ({
        content,
        status: stopReason ? 'incomplete' : 'complete',
        stopReason,
        // Live-turn carried-context chip: synthesize the same artifact shape fetchMessages
        // would return on reload, so ArtifactList's existing render path is the only one
        // that ever draws the chip (Daedalus, 2026-08-14 — one formatter, live can't drift from reload).
        // Filtered-append, not replace: the optimistic artifacts array isn't guaranteed empty
        // (Theseus, round49 flag) — preserves any artifact a tool wrote mid-stream.
        ...(carriedContext !== undefined && {
          artifacts: [
            ...(m.artifacts ?? []).filter((a) => a.type !== 'carried_context'),
            {
              id: `${messageId}-carried-context-live`,
              messageId,
              type: 'carried_context' as const,
              inputSummary: carriedContext,
              createdAt: new Date().toISOString(),
            },
          ],
        }),
      }));
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

  // Live tool_use card: same artifact shape fetchMessages returns on reload, appended as each
  // call happens mid-turn rather than waiting for message_complete — a card that only appears
  // on reload isn't informing anyone while the reply is on screen (Iris, 8/15 STOP fire decision).
  const handleToolUse = useCallback(
    (messageId: string, toolName?: string, inputSummary?: string) => {
      updateMessage(messageId, (m) => {
        const liveToolCount = (m.artifacts ?? []).filter((a) => a.type === 'tool_use').length;
        return {
          artifacts: [
            ...(m.artifacts ?? []),
            {
              id: `${messageId}-tool-use-live-${liveToolCount}`,
              messageId,
              type: 'tool_use' as const,
              toolName,
              inputSummary,
              createdAt: new Date().toISOString(),
            },
          ],
        };
      });
    },
    [updateMessage]
  );

  const { isAnyStreaming, getStreamContent, isMessageStreaming, reset: resetStreams } = useStreams(
    streamingMessageIds,
    handleStreamComplete,
    handleStreamError,
    handleToolUse
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

  const handleSendWithFile = async (content: string, file: File) => {
    setSendError(null);
    try {
      const { userMessageId, assistants } = await sendMessageWithFile(activeChannelId, content, file);

      // Build display content (same as what server creates)
      const sizeStr = file.size < 1024 ? `${file.size} B`
        : file.size < 1024 * 1024 ? `${(file.size / 1024).toFixed(1)} KB`
        : `${(file.size / (1024 * 1024)).toFixed(1)} MB`;
      const displayContent = content
        ? `${content}\n\n📎 ${file.name} (${sizeStr})`
        : `📎 ${file.name} (${sizeStr})`;

      addMessage({
        id: userMessageId,
        channelId: activeChannelId,
        role: 'user',
        content: displayContent,
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
      const errorMessage = err instanceof Error ? err.message : 'Failed to send file';
      console.error('Failed to send file:', err);
      setSendError(errorMessage);
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
  const clearTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

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

  const handleCreateChannel = async (
    name: string, systemPrompt: string,
    type?: ChannelType, mode?: InteractionMode,
    projectId?: string, entityIds?: string[]
  ) => {
    try {
      // Atomic creation: pass the selected roster so the klatch is seeded with
      // exactly those agents (no stray default entity). createChannel falls back
      // to the default entity when entityIds is empty/undefined.
      const channel = await createChannel(name, systemPrompt, undefined, type, mode, projectId, entityIds);
      // Refresh full channel list (enriched query includes projectName, counts)
      const updated = await fetchChannels();
      setChannels(updated);
      setActiveChannelId(channel.id);
    } catch (err) {
      console.error('Failed to create channel:', err);
    }
  };

  const handleUpdateChannel = async (updates: { name?: string; systemPrompt?: string; model?: ModelId; mode?: InteractionMode; projectId?: string | null }) => {
    try {
      const updated = await updateChannelApi(activeChannelId, updates);
      // Refresh channel list to pick up projectName changes from the enriched query
      if (updates.projectId !== undefined) {
        const refreshed = await fetchChannels();
        setChannels(refreshed);
      } else {
        setChannels((prev) =>
          prev.map((c) => (c.id === activeChannelId ? updated : c))
        );
      }
    } catch (err) {
      console.error('Failed to update channel:', err);
    }
  };

  const handleDeleteChannel = async () => {
    try {
      await deleteChannelApi(activeChannelId);
      setChannels((prev) => prev.filter((c) => c.id !== activeChannelId));
      setActiveChannelId('default');
      setShowSettings(false);
    } catch (err) {
      console.error('Failed to delete channel:', err);
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
    ? getModelLabel(activeChannel.model)
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
        onOpenImport={() => setShowImportDialog(true)}
        projects={projects}
        entities={allEntities}
        onOpenProjectSettings={(projectId) => {
          setActiveProjectId(projectId);
          setShowSettings(false); // close channel settings if open
        }}
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
            onClick={() => { setShowSettings(!showSettings); if (!showSettings) setActiveProjectId(null); }}
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
                      className="inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded bg-badge text-muted font-medium"
                      title={`${entity.name} (${getModelLabel(entity.model)})`}
                    >
                      <span
                        className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: entity.color }}
                      />
                      {getModelLabel(entity.model)}
                    </span>
                  ))}
                </div>
              ) : activeModelLabel ? (
                <span className="text-xs px-1.5 py-0.5 rounded bg-badge text-muted font-medium">
                  {activeModelLabel}
                </span>
              ) : null}
              {/* Mode badge — only show for non-default modes with 2+ entities */}
              {activeChannel?.mode && activeChannel.mode !== 'panel' && channelEntities.length >= 2 && (
                <span className="text-xs px-1.5 py-0.5 rounded bg-accent/15 text-accent font-medium">
                  {INTERACTION_MODES[activeChannel.mode]?.label || activeChannel.mode}
                </span>
              )}
              <svg className={`w-4 h-4 text-muted transition-transform ${showSettings ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            {activeChannel?.systemPrompt &&
             activeChannel.systemPrompt.trim() !== 'You are a helpful assistant.' && (
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

        {/* Cross-reference strip — klatches this agent is also in (1-1 role chats only) */}
        {activeChannel?.type === 'chat' && channelEntities.length === 1 && activeChannel?.id !== 'default' && (
          <CrossRefStrip klatches={relatedKlatches} onSelect={handleSelectChannel} />
        )}

        {/* Settings panel (toggle) — channel or project */}
        {showSettings && activeChannel && (
          <ChannelSettings
            channel={activeChannel}
            channelEntities={channelEntities}
            allEntities={allEntities}
            onSave={handleUpdateChannel}
            onAssignEntity={handleAssignEntity}
            onRemoveEntity={handleRemoveEntity}
            onDeleteChannel={handleDeleteChannel}
            onExport={() => { setShowSettings(false); setShowExportReview(true); }}
            onClose={() => setShowSettings(false)}
          />
        )}
        {showExportReview && activeChannel && (
          <ExportReviewPanel
            channelId={activeChannel.id}
            onClose={() => setShowExportReview(false)}
          />
        )}
        {activeProjectId && !showSettings && !showExportReview && (
          <ProjectSettings
            projectId={activeProjectId}
            onClose={() => setActiveProjectId(null)}
            onUpdated={() => {
              // Refresh channels to pick up project name changes in sidebar
              fetchChannels().then(setChannels).catch(console.error);
            }}
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
          onPinFile={activeChannel ? (storageKey) => {
            pinFileToChannel(activeChannel.id, { storageKey }).catch(console.error);
          } : undefined}
          isStreaming={isAnyStreaming}
          theme={theme}
          channelSource={activeChannel?.source}
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
          onSendWithFile={handleSendWithFile}
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

      {/* Import Dialog */}
      <ImportDialog
        isOpen={showImportDialog}
        onClose={() => {
          setShowImportDialog(false);
          // Always re-fetch channels on close — an import may have completed
          // before the user dismissed via backdrop/X instead of "Done" button,
          // and we need the enriched projectName from the JOIN.
          fetchChannels().then(setChannels).catch(console.error);
        }}
        onImported={(result) => {
          // Refresh channels and navigate to the imported channel
          fetchChannels().then((chs) => {
            setChannels(chs);
            setActiveChannelId(result.channelId);
          });
          setShowImportDialog(false);
        }}
        onBulkImported={() => {
          // Refresh channels after claude.ai bulk import
          fetchChannels().then((chs) => setChannels(chs));
          setShowImportDialog(false);
        }}
        onChannelDeleted={(deletedId) => {
          // Remove replaced channel from state; navigate away if it was active
          setChannels((prev) => prev.filter((c) => c.id !== deletedId));
          if (activeChannelId === deletedId) setActiveChannelId('default');
        }}
      />
    </div>
  );
}
