import React, { useEffect, useRef } from 'react';
import type { Message } from '@klatch/shared';
import { MarkdownContent } from './MarkdownContent';

interface Props {
  messages: Message[];
  streamingContent: string;
  streamingMessageId: string | null;
  onDeleteMessage?: (id: string) => void;
  onRegenerateMessage?: (id: string) => void;
  isStreaming?: boolean;
}

export function MessageList({
  messages,
  streamingContent,
  streamingMessageId,
  onDeleteMessage,
  onRegenerateMessage,
  isStreaming,
}: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  // Find the last assistant message for the regenerate button
  const lastAssistantId = [...messages]
    .reverse()
    .find((m) => m.role === 'assistant')?.id;

  return (
    <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
      {messages.length === 0 && (
        <div className="text-center text-gray-500 mt-20">
          <p className="text-lg">Start a conversation</p>
          <p className="text-sm mt-1">Send a message to begin.</p>
        </div>
      )}
      {messages.map((msg) => (
        <MessageBubble
          key={msg.id}
          message={msg}
          streamingContent={msg.id === streamingMessageId ? streamingContent : undefined}
          onDelete={onDeleteMessage ? () => onDeleteMessage(msg.id) : undefined}
          onRegenerate={
            onRegenerateMessage && msg.id === lastAssistantId && !isStreaming
              ? () => onRegenerateMessage(msg.id)
              : undefined
          }
          isStreaming={msg.id === streamingMessageId}
        />
      ))}
      <div ref={bottomRef} />
    </div>
  );
}

function MessageBubble({
  message,
  streamingContent,
  onDelete,
  onRegenerate,
  isStreaming: isBubbleStreaming,
}: {
  message: Message;
  streamingContent?: string;
  onDelete?: () => void;
  onRegenerate?: () => void;
  isStreaming?: boolean;
}) {
  const isUser = message.role === 'user';
  const displayContent = streamingContent ?? message.content;
  const isStreaming = message.status === 'streaming' && !streamingContent;
  const hasActions = !isBubbleStreaming && (onDelete || onRegenerate);

  return (
    <div className={`group flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[75%] rounded-lg px-4 py-2.5 ${
          isUser
            ? 'bg-indigo-600 text-white'
            : 'bg-gray-800 text-gray-100 border border-gray-700'
        }`}
      >
        <div className="text-xs font-medium mb-1 opacity-60">
          {isUser ? 'You' : 'Claude'}
        </div>
        <div className="break-words text-sm leading-relaxed">
          {isUser ? (
            <div className="whitespace-pre-wrap">{displayContent}</div>
          ) : displayContent ? (
            <MarkdownContent content={displayContent} />
          ) : isStreaming ? (
            <span className="text-gray-500">...</span>
          ) : null}
        </div>
        {message.status === 'error' && (
          <div className="text-xs text-red-400 mt-1">Error generating response</div>
        )}

        {/* Action buttons — inside the bubble, visible on hover */}
        {hasActions && (
          <div className="flex items-center gap-2 mt-2 pt-1.5 border-t border-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
            {onRegenerate && (
              <button
                onClick={onRegenerate}
                title="Regenerate response"
                className="flex items-center gap-1 rounded px-1.5 py-0.5 text-xs text-gray-400 hover:text-gray-200 hover:bg-white/10 transition-colors"
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
                className="flex items-center gap-1 rounded px-1.5 py-0.5 text-xs text-gray-400 hover:text-red-400 hover:bg-white/10 transition-colors"
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
