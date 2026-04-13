import React, { useEffect, useRef, useCallback, useState } from 'react';
import type { Message, Entity, ModelId, MessageArtifact } from '@klatch/shared';
import { MarkdownContent } from './MarkdownContent';
import { KlatchLogo } from './KlatchLogo';
import { getModelLabel } from '../hooks/useModels';

interface Props {
  messages: Message[];
  getStreamContent: (messageId: string) => string;
  isMessageStreaming: (messageId: string) => boolean;
  channelEntities: Entity[];
  onDeleteMessage?: (id: string) => void;
  onRegenerateMessage?: (id: string) => void;
  onPinFile?: (storageKey: string) => void;
  isStreaming?: boolean;
  theme?: 'light' | 'dark';
  channelSource?: string;  // 'native' | 'claude-code' | 'claude-ai'
}

function modelLabel(modelId?: ModelId): string | undefined {
  if (!modelId) return undefined;
  return getModelLabel(modelId);
}

/** Render user message content, styling file attachments as cards */
function UserContent({ content }: { content: string }) {
  // Split content into text and file attachment lines
  const fileRegex = /^📎 (.+?) \((.+?)\)$/m;
  const match = content.match(fileRegex);

  if (!match) {
    return <div className="whitespace-pre-wrap">{content}</div>;
  }

  const fileName = match[1];
  const fileSize = match[2];
  const textBefore = content.slice(0, match.index).trim();

  // File extension for icon hint
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  const isImage = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext);
  const isCode = ['ts', 'tsx', 'js', 'jsx', 'py', 'rs', 'go', 'java', 'css', 'html'].includes(ext);

  return (
    <div>
      {textBefore && <div className="whitespace-pre-wrap mb-2">{textBefore}</div>}
      <div className="flex items-center gap-2 rounded-md bg-white/15 px-3 py-2 text-xs">
        <span className="text-base">
          {isImage ? '🖼️' : isCode ? '💻' : '📄'}
        </span>
        <div className="min-w-0 flex-1">
          <div className="font-medium truncate">{fileName}</div>
          <div className="opacity-70">{fileSize}</div>
        </div>
      </div>
    </div>
  );
}

const API_BASE = '/api';

/** Tool icon mapping for common tools */
function toolIcon(toolName?: string): string {
  if (!toolName) return '🔧';
  const name = toolName.toLowerCase();
  if (name === 'read' || name === 'view') return '📖';
  if (name === 'bash' || name === 'bash_tool') return '⌨️';
  if (name === 'grep') return '🔍';
  if (name === 'write' || name === 'create_file' || name === 'str_replace') return '✏️';
  if (name === 'web_search' || name === 'web_fetch') return '🌐';
  if (name.includes('search')) return '🔍';
  return '🔧';
}

/** Format file size for display */
function formatSize(bytes?: number): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Render a list of artifacts below message content */
function ArtifactList({ artifacts, isUser, onPinFile }: { artifacts: MessageArtifact[]; isUser: boolean; onPinFile?: (storageKey: string) => void }) {
  // Group: files first, then tool_use, then tool_result, then thinking/image
  const files = artifacts.filter((a) => a.type === 'file');
  const tools = artifacts.filter((a) => a.type === 'tool_use');
  const thinking = artifacts.filter((a) => a.type === 'thinking');

  // Collapse repeated tool uses into summary
  const toolSummary = tools.length > 3
    ? summarizeTools(tools)
    : tools;

  if (files.length === 0 && tools.length === 0 && thinking.length === 0) return null;

  return (
    <div className="mt-2 space-y-1.5">
      {/* File attachments */}
      {files.map((f) => (
        <FileCard key={f.id} artifact={f} isUser={isUser} onPin={onPinFile && f.fileStorageKey ? () => onPinFile(f.fileStorageKey!) : undefined} />
      ))}

      {/* Tool usage */}
      {toolSummary.length > 0 && (
        <ToolCards tools={toolSummary} totalCount={tools.length} />
      )}

      {/* Thinking indicator */}
      {thinking.length > 0 && (
        <div className="flex items-center gap-1.5 text-xs text-muted opacity-60">
          <span>💭</span>
          <span>Thought about this{thinking.length > 1 ? ` (${thinking.length}×)` : ''}</span>
        </div>
      )}
    </div>
  );
}

/** Summarize many tool calls into grouped counts */
function summarizeTools(tools: MessageArtifact[]): MessageArtifact[] {
  // Show first 2 individually, then summarize the rest
  return tools.slice(0, 3);
}

/** A single file attachment card */
function FileCard({ artifact, isUser, onPin }: { artifact: MessageArtifact; isUser: boolean; onPin?: () => void }) {
  const [pinned, setPinned] = useState(false);
  const ext = artifact.fileName?.split('.').pop()?.toLowerCase() || '';
  const isImage = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext);
  const isCode = ['ts', 'tsx', 'js', 'jsx', 'py', 'rs', 'go', 'java', 'css', 'html', 'json', 'md'].includes(ext);

  return (
    <div className={`flex items-center gap-2 rounded-md px-3 py-2 text-xs transition-colors ${
      isUser
        ? 'bg-white/15 text-white'
        : 'bg-hover text-primary'
    }`}>
      <a
        href={artifact.fileStorageKey ? `${API_BASE}/files/${artifact.fileStorageKey}` : undefined}
        target="_blank"
        rel="noopener noreferrer"
        className={`flex items-center gap-2 min-w-0 flex-1 no-underline ${isUser ? 'text-white' : 'text-primary'}`}
      >
        <span className="text-base flex-shrink-0">
          {isImage ? '🖼️' : isCode ? '💻' : '📄'}
        </span>
        <div className="min-w-0 flex-1">
          <div className="font-medium truncate">{artifact.fileName}</div>
          {artifact.fileSizeBytes && (
            <div className="opacity-70">{formatSize(artifact.fileSizeBytes)}</div>
          )}
        </div>
        <span className="opacity-50 text-[10px]">↗</span>
      </a>
      {onPin && artifact.fileStorageKey && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (!pinned) {
              onPin();
              setPinned(true);
            }
          }}
          title={pinned ? 'Pinned to channel' : 'Pin to channel'}
          className={`flex-shrink-0 p-1 rounded transition-colors ${
            pinned
              ? 'text-accent'
              : isUser
                ? 'text-white/50 hover:text-white'
                : 'text-muted hover:text-accent'
          }`}
        >
          <svg className="w-3.5 h-3.5" fill={pinned ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
        </button>
      )}
    </div>
  );
}

/** Collapsible tool use display */
function ToolCards({ tools, totalCount }: { tools: MessageArtifact[]; totalCount: number }) {
  const [expanded, setExpanded] = useState(false);
  const displayTools = expanded ? tools : tools.slice(0, 2);
  const remaining = totalCount - displayTools.length;

  return (
    <div className="space-y-1">
      {displayTools.map((t) => (
        <div key={t.id} className="flex items-center gap-1.5 text-xs text-muted">
          <span>{toolIcon(t.toolName)}</span>
          <span className="font-mono opacity-80">{t.toolName || 'tool'}</span>
          {t.inputSummary && (
            <span className="truncate opacity-60 max-w-[200px]">{t.inputSummary}</span>
          )}
        </div>
      ))}
      {remaining > 0 && !expanded && (
        <button
          onClick={() => setExpanded(true)}
          className="text-xs text-accent hover:underline"
        >
          +{remaining} more tool use{remaining > 1 ? 's' : ''}
        </button>
      )}
    </div>
  );
}

export function MessageList({
  messages,
  getStreamContent,
  isMessageStreaming,
  channelEntities,
  onDeleteMessage,
  onRegenerateMessage,
  onPinFile,
  isStreaming,
  theme,
  channelSource,
}: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const userScrolledUp = useRef(false);

  // Build entity lookup map
  const entityMap = new Map(channelEntities.map((e) => [e.id, e]));

  // Find the fork boundary for imported channels
  // Imported messages have originalId set; new Klatch-native messages don't.
  const forkBoundaryIndex = (() => {
    if (!channelSource || channelSource === 'native') return -1;
    let lastImportedIdx = -1;
    for (let i = 0; i < messages.length; i++) {
      if (messages[i].originalId) lastImportedIdx = i;
    }
    // Only show marker if there are both imported and new messages
    if (lastImportedIdx === -1 || lastImportedIdx === messages.length - 1) return -1;
    return lastImportedIdx;
  })();

  // Detect when user scrolls away from bottom
  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    // "Near bottom" = within 80px of the bottom edge
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    userScrolledUp.current = !atBottom;
  }, []);

  // Auto-scroll on new messages (only if user hasn't scrolled up)
  useEffect(() => {
    if (!userScrolledUp.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Also scroll during streaming (only if user hasn't scrolled up)
  useEffect(() => {
    if (isStreaming) {
      const interval = setInterval(() => {
        if (!userScrolledUp.current) {
          bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
      }, 300);
      return () => clearInterval(interval);
    }
  }, [isStreaming]);

  // Find the last assistant message for the regenerate button
  const lastAssistantId = [...messages]
    .reverse()
    .find((m) => m.role === 'assistant')?.id;

  return (
    <div ref={containerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto px-3 md:px-6 py-4 space-y-4">
      {messages.length === 0 && (
        <div className="text-center mt-20 flex flex-col items-center gap-3">
          <KlatchLogo size={48} className="text-faint" />
          <p className="text-lg text-muted">Start a conversation</p>
          <p className="text-sm text-faint">Send a message to begin.</p>
        </div>
      )}
      {messages.map((msg, idx) => {
        const entity = msg.entityId ? entityMap.get(msg.entityId) : undefined;
        const streamContent = getStreamContent(msg.id);
        const isBubbleStreaming = isMessageStreaming(msg.id);

        return (
          <React.Fragment key={msg.id}>
            <MessageBubble
              message={msg}
              entity={entity}
              streamingContent={streamContent || undefined}
              onDelete={onDeleteMessage ? () => onDeleteMessage(msg.id) : undefined}
              onRegenerate={
                onRegenerateMessage && msg.id === lastAssistantId && !isStreaming
                  ? () => onRegenerateMessage(msg.id)
                  : undefined
              }
              onPinFile={onPinFile}
              isBubbleStreaming={isBubbleStreaming}
              theme={theme}
            />
            {idx === forkBoundaryIndex && (
              <ForkMarker date={messages[idx + 1]?.createdAt} />
            )}
          </React.Fragment>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}

/** Visual divider between imported history and new Klatch-native messages */
function ForkMarker({ date }: { date?: string }) {
  const label = date
    ? `Continued in Klatch \u2014 ${new Date(date).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
      })}`
    : 'Continued in Klatch';
  return (
    <div className="flex items-center gap-3 py-3">
      <div className="flex-1 border-t border-line" />
      <span className="text-xs text-faint font-medium whitespace-nowrap">{label}</span>
      <div className="flex-1 border-t border-line" />
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
  onPinFile,
  isBubbleStreaming,
  theme,
}: {
  message: Message;
  entity?: Entity;
  streamingContent?: string;
  onDelete?: () => void;
  onRegenerate?: () => void;
  onPinFile?: (storageKey: string) => void;
  isBubbleStreaming?: boolean;
  theme?: 'light' | 'dark';
}) {
  const [copied, setCopied] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const isUser = message.role === 'user';
  const displayContent = streamingContent ?? message.content;
  const isWaiting = message.status === 'streaming' && !streamingContent;
  const canCopy = !isUser && !isBubbleStreaming && !!displayContent;
  const hasActions = !isBubbleStreaming && (onDelete || onRegenerate || canCopy);

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
            <UserContent content={displayContent} />
          ) : displayContent ? (
            <MarkdownContent content={displayContent} theme={theme} />
          ) : isWaiting ? (
            <span className="text-muted">...</span>
          ) : null}
        </div>
        {/* Artifacts: tool use, thinking, files, images */}
        {message.artifacts && message.artifacts.length > 0 && (
          <ArtifactList artifacts={message.artifacts} isUser={isUser} onPinFile={onPinFile} />
        )}
        {message.status === 'error' && (
          <div className="text-xs text-danger mt-1">Error generating response</div>
        )}

        {/* Action buttons — inside the bubble, visible on hover (always visible on mobile) */}
        {hasActions && (
          <div className="flex items-center gap-2 mt-2 pt-1.5 border-t border-line opacity-100 md:opacity-0 md:group-hover:opacity-100 md:focus-within:opacity-100 transition-opacity">
            {canCopy && (
              <button
                onClick={() => {
                  navigator.clipboard.writeText(displayContent).then(() => {
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1500);
                  });
                }}
                title="Copy message"
                className="flex items-center gap-1 rounded px-1.5 py-0.5 text-xs text-muted hover:text-primary hover:bg-hover transition-colors"
              >
                {copied ? (
                  <>
                    <svg className="w-3 h-3 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-green-500">Copied</span>
                  </>
                ) : (
                  <>
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copy
                  </>
                )}
              </button>
            )}
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
                onClick={() => {
                  if (confirmDelete) {
                    onDelete();
                  } else {
                    setConfirmDelete(true);
                    setTimeout(() => setConfirmDelete(false), 3000);
                  }
                }}
                title={confirmDelete ? 'Click again to confirm' : 'Delete message'}
                className={`flex items-center gap-1 rounded px-1.5 py-0.5 text-xs transition-colors ${
                  confirmDelete
                    ? 'text-danger bg-danger/10'
                    : 'text-muted hover:text-danger hover:bg-hover'
                }`}
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                {confirmDelete ? 'Confirm?' : 'Delete'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
