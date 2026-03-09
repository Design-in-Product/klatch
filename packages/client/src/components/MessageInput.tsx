import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { Entity, InteractionMode } from '@klatch/shared';

interface Props {
  onSend: (content: string) => void;
  onStop?: () => void;
  disabled: boolean;
  isStreaming: boolean;
  channelEntities?: Entity[];
  mode?: InteractionMode;
}

export function MessageInput({ onSend, onStop, disabled, isStreaming, channelEntities = [], mode }: Props) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // @-mention autocomplete state
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionStartPos, setMentionStartPos] = useState(0);
  const [selectedMentionIdx, setSelectedMentionIdx] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isDirected = mode === 'directed';
  const showMentions = isDirected && channelEntities.length >= 2;

  // Filter entities matching the current @query (by name or handle)
  const mentionCandidates = mentionQuery !== null
    ? channelEntities.filter((e) =>
        e.name.toLowerCase().startsWith(mentionQuery.toLowerCase()) ||
        (e.handle && e.handle.toLowerCase().startsWith(mentionQuery.toLowerCase()))
      )
    : [];

  useEffect(() => {
    if (!disabled) {
      textareaRef.current?.focus();
    }
  }, [disabled]);

  // Reset selected index when candidates change
  useEffect(() => {
    setSelectedMentionIdx(0);
  }, [mentionQuery]);

  const insertMention = useCallback((entity: Entity) => {
    const before = value.slice(0, mentionStartPos);
    const after = value.slice(textareaRef.current?.selectionStart ?? value.length);

    // Prefer @handle if available, otherwise @"Name" for names with spaces, @Name for simple names
    const mentionText = entity.handle
      ? `@${entity.handle} `
      : entity.name.includes(' ')
        ? `@"${entity.name}" `
        : `@${entity.name} `;

    const newValue = before + mentionText + after;
    setValue(newValue);
    setMentionQuery(null);

    // Restore focus and cursor position
    requestAnimationFrame(() => {
      const textarea = textareaRef.current;
      if (textarea) {
        const cursorPos = before.length + mentionText.length;
        textarea.focus();
        textarea.setSelectionRange(cursorPos, cursorPos);
      }
    });
  }, [value, mentionStartPos]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setValue(newValue);

    if (!showMentions) return;

    // Check if we're in a mention context
    const cursorPos = e.target.selectionStart ?? newValue.length;
    const textBeforeCursor = newValue.slice(0, cursorPos);

    // Find the last @ before cursor that isn't preceded by a word character
    const atMatch = textBeforeCursor.match(/(^|[^\\w])@([\w-]*)$/);
    if (atMatch) {
      setMentionStartPos(cursorPos - atMatch[2].length - 1); // position of @
      setMentionQuery(atMatch[2]); // text after @
    } else {
      setMentionQuery(null);
    }
  };

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue('');
    setMentionQuery(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Handle mention dropdown navigation
    if (mentionQuery !== null && mentionCandidates.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedMentionIdx((prev) =>
          prev < mentionCandidates.length - 1 ? prev + 1 : 0
        );
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedMentionIdx((prev) =>
          prev > 0 ? prev - 1 : mentionCandidates.length - 1
        );
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        insertMention(mentionCandidates[selectedMentionIdx]);
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setMentionQuery(null);
        return;
      }
    }

    // Normal Enter → send
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const placeholder = isStreaming
    ? 'Waiting for response...'
    : isDirected
      ? 'Type @ to mention an entity...'
      : 'Type a message...';

  return (
    <div className="border-t border-line px-3 md:px-6 py-3 md:py-4">
      <div className="relative flex items-end gap-2 md:gap-3">
        {/* @-mention autocomplete dropdown */}
        {mentionQuery !== null && mentionCandidates.length > 0 && (
          <div
            ref={dropdownRef}
            className="absolute bottom-full left-0 mb-1 w-64 rounded-lg border border-line bg-panel shadow-lg overflow-hidden z-50"
          >
            <div className="px-2 py-1.5 text-[10px] text-muted font-medium uppercase tracking-wide border-b border-line">
              Mention an entity
            </div>
            {mentionCandidates.map((entity, idx) => (
              <button
                key={entity.id}
                onClick={() => insertMention(entity)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors ${
                  idx === selectedMentionIdx
                    ? 'bg-hover text-primary'
                    : 'text-secondary hover:bg-hover hover:text-primary'
                }`}
              >
                <span
                  className="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold text-white flex-shrink-0"
                  style={{ backgroundColor: entity.color }}
                >
                  {entity.name.charAt(0).toUpperCase()}
                </span>
                <span className="flex-1 truncate text-left">
                  {entity.name}
                  {entity.handle && (
                    <span className="text-muted text-[10px] ml-1 font-mono">@{entity.handle}</span>
                  )}
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-badge text-muted font-medium">
                  {entity.model.includes('opus') ? 'Opus' : entity.model.includes('sonnet') ? 'Sonnet' : 'Haiku'}
                </span>
              </button>
            ))}
          </div>
        )}

        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          className="flex-1 resize-none rounded-lg bg-input border border-line px-3 md:px-4 py-2.5 text-sm text-primary placeholder-muted focus:outline-none focus:border-accent disabled:opacity-50"
          style={{ minHeight: '42px', maxHeight: '160px' }}
          onInput={(e) => {
            const target = e.target as HTMLTextAreaElement;
            target.style.height = 'auto';
            target.style.height = `${Math.min(target.scrollHeight, 160)}px`;
          }}
        />
        {isStreaming ? (
          <button
            onClick={onStop}
            className="rounded-lg bg-danger px-3 md:px-4 py-2.5 text-sm font-medium text-white hover:bg-danger-hover transition-colors flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <rect x="6" y="6" width="12" height="12" rx="1" />
            </svg>
            <span className="hidden md:inline">Stop</span>
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={disabled || !value.trim()}
            className="rounded-lg bg-accent px-3 md:px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Send
          </button>
        )}
      </div>
    </div>
  );
}
