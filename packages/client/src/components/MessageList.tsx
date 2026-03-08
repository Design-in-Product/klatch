import React, { useEffect, useRef } from 'react';
import type { Message, Entity, ModelId } from '@klatch/shared';
import { AVAILABLE_MODELS } from '@klatch/shared';
import { MarkdownContent } from './MarkdownContent';
import { KlatchLogo } from './KlatchLogo';

interface Props {
  messages: Message[];
  getStreamContent: (messageId: string) => string;
  isMessageStreaming: (messageId: string) => boolean;
  channelEntities: Entity[];
  onDeleteMessage?: (id: string) => void;
  onRegenerateMessage?: (id: string) => void;
  isStreaming?: boolean;
  theme?: 'light' | 'dark';
}

function modelLabel(modelId?: ModelId): string | undefined {
  if (!modelId) return undefined;
  return AVAILABLE_MODELS[modelId]?.label;
}

export function MessageList({
  messages,
  getStreamContent,
  isMessageStreaming,
  channelEntities,
  onDeleteMessage,
  onRegenerateMessage,
  isStreaming,
  theme,
}: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Build entity lookup map
  const entityMap = new Map(channelEntities.map((e) => [e.id, e]));

  // Auto-scroll on new messages or streaming content
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Also scroll during streaming
  useEffect(() => {
    if (isStreaming) {
      const interval = setInterval(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 300);
      return () => clearInterval(interval);
    }
  }, [isStreaming]);

  // Find the last assistant message for the regenerate button
  const lastAssistantId = [...messages]
    .reverse()
    .find((m) => m.role === 'assistant')?.id;

  return (
    <div className="flex-1 overflow-y-auto px-3 md:px-6 py-4 space-y-4">
      {messages.length === 0 && (
        <div className="text-center mt-20 flex flex-col items-center gap-3">
          <KlatchLogo size={48} className="text-faint" />
          <p className="text-lg text-muted">Start a conversation</p>
          <p className="text-sm text-faint">Send a message to begin.</p>
        </div>
      )}
      {messages.map((msg) => {
        const entity = msg.entityId ? entityMap.get(msg.entityId) : undefined;
        const streamContent = getStreamContent(msg.id);
        const isBubbleStreaming = isMessageStreaming(msg.id);

        return (
          <MessageBubble
            key={msg.id}
            message={msg}
            entity={entity}
            streamingContent={streamContent || undefined}
            onDelete={onDeleteMessage ? () => onDeleteMessage(msg.id) : undefined}
            onRegenerate={
              onRegenerateMessage && msg.id === lastAssistantId && !isStreaming
                ? () => onRegenerateMessage(msg.id)
                : undefined
            }
            isBubbleStreaming={isBubbleStreaming}
            theme={theme}
          />
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}

function EntityAvatar({ entity }: { entity: Entity }) {
  return (
    <span
      className="inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold text-white flex-shrink-0"
      style={{ backgroundColor: entity.color }}
      title={entity.name}
    >
      {entity.name.charAt(0).toUpperCase()}
    </span>
  );
}

function MessageBubble({
  message,
  entity,
  streamingContent,
  onDelete,
  onRegenerate,
  isBubbleStreaming,
  theme,
}: {
  message: Message;
  entity?: Entity;
  streamingContent?: string;
  onDelete?: () => void;
  onRegenerate?: () => void;
  isBubbleStreaming?: boolean;
  theme?: 'light' | 'dark';
}) {
  const isUser = message.role === 'user';
  const displayContent = streamingContent ?? message.content;
  const isWaiting = message.status === 'streaming' && !streamingContent;
  const hasActions = !isBubbleStreaming && (onDelete || onRegenerate);

  // Entity or model info for assistant messages
  const entityName = entity?.name || 'Claude';
  const msgModelLabel = !isUser ? modelLabel(message.model) : undefined;

  return (
    <div className={`group flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[90%] md:max-w-[75%] rounded-lg px-3 md:px-4 py-2.5 ${
          isUser
            ? 'bg-accent text-white'
            : 'bg-card text-primary border border-line'
        }`}
      >
        <div className="flex items-center gap-2 text-xs font-medium mb-1 opacity-60">
          {!isUser && entity && <EntityAvatar entity={entity} />}
          <span>{isUser ? 'You' : entityName}</span>
          {msgModelLabel && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-badge" title={message.model}>
              {msgModelLabel}
            </span>
          )}
        </div>
        <div className="break-words text-sm leading-relaxed">
          {isUser ? (
            <div className="whitespace-pre-wrap">{displayContent}</div>
          ) : displayContent ? (
            <MarkdownContent content={displayContent} theme={theme} />
          ) : isWaiting ? (
            <span className="text-muted">...</span>
          ) : null}
        </div>
        {message.status === 'error' && (
          <div className="text-xs text-danger mt-1">Error generating response</div>
        )}

        {/* Action buttons — inside the bubble, visible on hover (always visible on mobile) */}
        {hasActions && (
          <div className="flex items-center gap-2 mt-2 pt-1.5 border-t border-line opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
            {onRegenerate && (
              <button
                onClick={onRegenerate}
                title="Regenerate response"
                className="flex items-center gap-1 rounded px-1.5 py-0.5 text-xs text-muted hover:text-primary hover:bg-hover transition-colors"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Retry
              </button>
            )}
            {onDelete && (
              <button
                onClick={onDelete}
                title="Delete message"
                className="flex items-center gap-1 rounded px-1.5 py-0.5 text-xs text-muted hover:text-danger hover:bg-hover transition-colors"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
