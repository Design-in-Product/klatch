import React, { useEffect, useRef } from 'react';
import type { Message } from '@klatch/shared';
import { MarkdownContent } from './MarkdownContent';

interface Props {
  messages: Message[];
  streamingContent: string;
  streamingMessageId: string | null;
}

export function MessageList({ messages, streamingContent, streamingMessageId }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

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
        />
      ))}
      <div ref={bottomRef} />
    </div>
  );
}

function MessageBubble({
  message,
  streamingContent,
}: {
  message: Message;
  streamingContent?: string;
}) {
  const isUser = message.role === 'user';
  const displayContent = streamingContent ?? message.content;
  const isStreaming = message.status === 'streaming' && !streamingContent;

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
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
      </div>
    </div>
  );
}
