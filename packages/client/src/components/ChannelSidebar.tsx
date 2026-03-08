import React, { useState } from 'react';
import type { Channel } from '@klatch/shared';
import { KlatchLogo } from './KlatchLogo';

interface Props {
  channels: Channel[];
  activeChannelId: string;
  onSelectChannel: (id: string) => void;
  onCreateChannel: (name: string, systemPrompt: string) => void;
  isOpen?: boolean;
  onClose?: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export function ChannelSidebar({
  channels,
  activeChannelId,
  onSelectChannel,
  onCreateChannel,
  isOpen,
  onClose,
  theme,
  onToggleTheme,
}: Props) {
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPrompt, setNewPrompt] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    onCreateChannel(name, newPrompt.trim() || 'You are a helpful assistant.');
    setNewName('');
    setNewPrompt('');
    setShowForm(false);
  };

  const handleChannelClick = (id: string) => {
    onSelectChannel(id);
    onClose?.();
  };

  const sidebarContent = (
    <div className="w-60 flex-shrink-0 bg-sidebar border-r border-line-strong flex flex-col h-full">
      {/* Header — logo + wordmark */}
      <div className="px-4 py-3 border-b border-line-strong flex items-center justify-between">
        <div className="flex items-center gap-2">
          <KlatchLogo size={22} />
          <span className="text-sm font-semibold text-primary tracking-wide">Klatch</span>
        </div>
        {/* Close button — mobile only */}
        {onClose && (
          <button
            onClick={onClose}
            className="md:hidden text-muted hover:text-secondary transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Channel list */}
      <div className="flex-1 overflow-y-auto py-1">
        {channels.map((ch) => (
          <button
            key={ch.id}
            onClick={() => handleChannelClick(ch.id)}
            className={`w-full text-left px-4 py-1.5 text-sm transition-colors ${
              ch.id === activeChannelId
                ? 'bg-active-channel text-primary font-medium'
                : 'text-secondary hover:text-primary hover:bg-hover'
            }`}
          >
            <span className="text-muted mr-1">#</span>
            {ch.name}
          </button>
        ))}
      </div>

      {/* Footer: theme toggle + create channel */}
      <div className="border-t border-line-strong">
        {/* Theme toggle */}
        <button
          onClick={onToggleTheme}
          className="flex items-center gap-2 px-4 py-2 text-sm text-secondary hover:text-primary transition-colors w-full"
          title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === 'light' ? (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          )}
          {theme === 'light' ? 'Dark mode' : 'Light mode'}
        </button>

        {/* Create channel */}
        <div className="p-3 pt-0">
          {showForm ? (
            <form onSubmit={handleSubmit} className="space-y-2">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Channel name"
                autoFocus
                className="w-full rounded bg-input border border-line px-2.5 py-1.5 text-sm text-primary placeholder-muted focus:outline-none focus:border-accent"
              />
              <textarea
                value={newPrompt}
                onChange={(e) => setNewPrompt(e.target.value)}
                placeholder="System prompt (optional)"
                rows={2}
                className="w-full rounded bg-input border border-line px-2.5 py-1.5 text-sm text-primary placeholder-muted focus:outline-none focus:border-accent resize-none"
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 rounded bg-accent px-2 py-1 text-xs font-medium text-white hover:bg-accent-hover transition-colors"
                >
                  Create
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 rounded bg-card px-2 py-1 text-xs font-medium text-secondary hover:bg-hover transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setShowForm(true)}
              className="w-full rounded bg-card px-3 py-1.5 text-sm text-secondary hover:text-primary hover:bg-hover transition-colors text-left"
            >
              + New channel
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop: always visible, static */}
      <div className="hidden md:block">
        {sidebarContent}
      </div>

      {/* Mobile: overlay drawer */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50"
            onClick={onClose}
          />
          {/* Drawer */}
          <div className="relative z-50">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
