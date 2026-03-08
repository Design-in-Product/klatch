import React, { useState, useRef, useEffect } from 'react';

interface Props {
  onSend: (content: string) => void;
  onStop?: () => void;
  disabled: boolean;
  isStreaming: boolean;
}

export function MessageInput({ onSend, onStop, disabled, isStreaming }: Props) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!disabled) {
      textareaRef.current?.focus();
    }
  }, [disabled]);

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="border-t border-line px-3 md:px-6 py-3 md:py-4">
      <div className="flex items-end gap-2 md:gap-3">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isStreaming ? 'Waiting for response...' : 'Type a message...'}
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
