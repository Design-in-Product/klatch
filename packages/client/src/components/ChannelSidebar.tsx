import React, { useState, useMemo } from 'react';
import type { Channel } from '@klatch/shared';
import { KlatchLogo } from './KlatchLogo';


interface Props {
  channels: Channel[];
  activeChannelId: string;
  onSelectChannel: (id: string) => void;
  onCreateChannel: (name: string, systemPrompt: string) => void;
  onOpenEntities?: () => void;
  onOpenImport?: () => void;
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
  onOpenEntities,
  onOpenImport,
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

  // Track collapsed state for sidebar sections
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  const toggleSection = (key: string) => {
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  // Group channels: #general → projects → roles/channels (native)
  const { general, projectGroups, roles, groups } = useMemo(() => {
    const general = channels.find((ch) => ch.id === 'default');
    const rest = channels.filter((ch) => ch.id !== 'default');

    // Imported channels grouped by project (from projects table via projectId/projectName)
    const imported = rest.filter((ch) => ch.source && ch.source !== 'native');
    const projectMap = new Map<string, { name: string; channels: Channel[] }>();
    for (const ch of imported) {
      const groupKey = ch.projectId || '_imported';
      const groupName = ch.projectName || 'Imported';
      if (!projectMap.has(groupKey)) {
        projectMap.set(groupKey, { name: groupName, channels: [] });
      }
      projectMap.get(groupKey)!.channels.push(ch);
    }
    const projectGroups = Array.from(projectMap.entries()).map(([key, group]) => ({
      key,
      name: group.name,
      channels: group.channels,
    }));

    // Native channels (excluding #general) — split into Roles and Channels as before
    const native = rest.filter((ch) => !ch.source || ch.source === 'native');
    const roles = native.filter((ch) => (ch.entityCount ?? 1) <= 1);
    const groups = native.filter((ch) => (ch.entityCount ?? 1) >= 2);

    return { general, projectGroups, roles, groups };
  }, [channels]);

  const renderChannelItem = (ch: Channel, prefix: string) => (
    <button
      key={ch.id}
      onClick={() => handleChannelClick(ch.id)}
      className={`w-full text-left px-4 py-1.5 text-sm transition-colors flex items-center ${
        ch.id === activeChannelId
          ? 'bg-active-channel text-primary font-medium'
          : 'text-secondary hover:text-primary hover:bg-hover'
      }`}
    >
      <span className="text-muted mr-1">{prefix}</span>
      <span className="truncate">{ch.name}</span>
      {ch.source === 'claude-code' && (
        <span
          className="ml-auto flex-shrink-0 text-[9px] font-bold px-1 py-0.5 rounded bg-badge text-muted leading-none"
          title="Imported from Claude Code"
        >
          CC
        </span>
      )}
    </button>
  );

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

      {/* Channel list — #general → projects → roles → channels */}
      <div className="flex-1 overflow-y-auto py-1">
        {/* #general — always pinned at top */}
        {general && (
          <div className="pb-1">
            <button
              key={general.id}
              onClick={() => handleChannelClick(general.id)}
              className={`w-full text-left px-4 py-1.5 text-sm transition-colors flex items-center ${
                general.id === activeChannelId
                  ? 'bg-active-channel text-primary font-medium'
                  : 'text-secondary hover:text-primary hover:bg-hover'
              }`}
            >
              <span className="text-muted mr-1">#</span>
              <span className="truncate">{general.name}</span>
            </button>
          </div>
        )}

        {/* Project groups (imported channels grouped by cwd) */}
        {projectGroups.map((project) => {
          const sectionKey = `project:${project.key}`;
          const isCollapsed = collapsedSections.has(sectionKey);
          return (
            <div key={sectionKey}>
              <button
                onClick={() => toggleSection(sectionKey)}
                className="w-full flex items-center gap-1 px-4 pt-3 pb-1 group"
              >
                <svg
                  className={`w-3 h-3 text-muted transition-transform ${isCollapsed ? '' : 'rotate-90'}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
                <span className="text-[10px] font-semibold text-muted uppercase tracking-wider">
                  {project.name}
                </span>
                <span className="text-[10px] text-muted ml-1">({project.channels.length})</span>
              </button>
              {!isCollapsed && project.channels.map((ch) => renderChannelItem(ch, '@'))}
            </div>
          );
        })}

        {/* Separator between projects and native channels */}
        {projectGroups.length > 0 && (roles.length > 0 || groups.length > 0) && (
          <div className="mx-4 my-2 border-t border-line" />
        )}

        {/* Roles (1:1 native conversations with a single entity) */}
        {roles.length > 0 && (
          <div>
            <button
              onClick={() => toggleSection('roles')}
              className="w-full flex items-center gap-1 px-4 pt-3 pb-1 group"
            >
              <svg
                className={`w-3 h-3 text-muted transition-transform ${collapsedSections.has('roles') ? '' : 'rotate-90'}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
              <span className="text-[10px] font-semibold text-muted uppercase tracking-wider">
                Roles
              </span>
            </button>
            {!collapsedSections.has('roles') && roles.map((ch) => renderChannelItem(ch, '@'))}
          </div>
        )}

        {/* Group Chats (2+ entities) */}
        {groups.length > 0 && (
          <div>
            <button
              onClick={() => toggleSection('channels')}
              className="w-full flex items-center gap-1 px-4 pt-3 pb-1 group"
            >
              <svg
                className={`w-3 h-3 text-muted transition-transform ${collapsedSections.has('channels') ? '' : 'rotate-90'}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
              <span className="text-[10px] font-semibold text-muted uppercase tracking-wider">
                Channels
              </span>
            </button>
            {!collapsedSections.has('channels') && groups.map((ch) => renderChannelItem(ch, '#'))}
          </div>
        )}

        {/* Fallback: if no channels at all, show something */}
        {channels.length === 0 && (
          <div className="px-4 py-3 text-xs text-muted">No channels yet</div>
        )}
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

        {/* Entities manager */}
        {onOpenEntities && (
          <button
            onClick={onOpenEntities}
            className="flex items-center gap-2 px-4 py-2 text-sm text-secondary hover:text-primary transition-colors w-full"
            title="Manage entities"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Entities
          </button>
        )}

        {/* Import from Claude Code */}
        {onOpenImport && (
          <button
            onClick={onOpenImport}
            className="flex items-center gap-2 px-4 py-2 text-sm text-secondary hover:text-primary transition-colors w-full"
            title="Import Claude Code session"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Import
          </button>
        )}

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
