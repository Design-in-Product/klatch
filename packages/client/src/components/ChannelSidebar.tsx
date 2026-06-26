import React, { useState, useMemo } from 'react';
import type { Channel, Entity, ChannelType, InteractionMode } from '@klatch/shared';
import { INTERACTION_MODES } from '@klatch/shared';
import { getModelLabel } from '../hooks/useModels';
import { KlatchLogo } from './KlatchLogo';
import type { Project } from '../api/client';


interface Props {
  channels: Channel[];
  activeChannelId: string;
  onSelectChannel: (id: string) => void;
  onCreateChannel: (name: string, systemPrompt: string, type?: ChannelType, mode?: InteractionMode, projectId?: string, entityIds?: string[]) => void;
  onOpenEntities?: () => void;
  onOpenImport?: () => void;
  onOpenProjectSettings?: (projectId: string) => void;
  projects?: Project[];
  entities?: Entity[];
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
  onOpenProjectSettings,
  projects = [],
  entities = [],
  isOpen,
  onClose,
  theme,
  onToggleTheme,
}: Props) {
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPrompt, setNewPrompt] = useState('');
  const [newType, setNewType] = useState<ChannelType>('chat');
  const [newProjectId, setNewProjectId] = useState('');
  const [newMode, setNewMode] = useState<InteractionMode>('panel');
  const [selectedEntityIds, setSelectedEntityIds] = useState<Set<string>>(new Set());
  const [agentSearch, setAgentSearch] = useState('');

  const resetForm = () => {
    setNewName('');
    setNewPrompt('');
    setNewType('chat');
    setNewProjectId('');
    setNewMode('panel');
    setSelectedEntityIds(new Set());
    setAgentSearch('');
    setShowForm(false);
  };

  // Open the setup surface pre-set to a type — the two entry points
  // ("New Chat" / "New Klatch") are the user's two ways to start a conversation.
  const openForm = (type: ChannelType) => {
    setNewType(type);
    setShowForm(true);
  };

  const toggleEntity = (id: string) => {
    setSelectedEntityIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else if (next.size < 5) next.add(id);
      return next;
    });
  };

  // Agent picker (composition spec §3 Path A): typeahead-filter by name/handle,
  // partition roles-first (name-as-proxy — a named agent is a role; nameless = one-off).
  const { roleAgents, otherAgents } = useMemo(() => {
    const q = agentSearch.trim().toLowerCase();
    const matches = (e: Entity) =>
      !q || e.name.toLowerCase().includes(q) || (e.handle?.toLowerCase().includes(q) ?? false);
    const filtered = entities.filter(matches);
    return {
      roleAgents: filtered.filter((e) => e.name.trim().length > 0),
      otherAgents: filtered.filter((e) => e.name.trim().length === 0),
    };
  }, [entities, agentSearch]);

  const selectedAgents = useMemo(
    () => entities.filter((e) => selectedEntityIds.has(e.id)),
    [entities, selectedEntityIds]
  );
  const atCap = selectedEntityIds.size >= 5;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    onCreateChannel(
      name,
      newPrompt.trim() || 'You are a helpful assistant.',
      newType === 'klatch' ? 'klatch' : undefined,
      newType === 'klatch' ? newMode : undefined,
      newType === 'klatch' ? (newProjectId || undefined) : undefined,
      newType === 'klatch' && selectedEntityIds.size > 0 ? [...selectedEntityIds] : undefined
    );
    resetForm();
  };

  const handleChannelClick = (id: string) => {
    onSelectChannel(id);
    onClose?.();
  };

  // Accordion: only one project expanded at a time (null = none)
  const [expandedProject, setExpandedProject] = useState<string | null>(null);
  const toggleProject = (key: string) => {
    setExpandedProject((prev) => (prev === key ? null : key));
  };

  // Track collapsed state for non-accordion sections (the "First project" default group, etc.)
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  const toggleSection = (key: string) => {
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  // Group channels into project-first structure
  const { general, projectGroups, defaultProject } = useMemo(() => {
    const general = channels.find((ch) => ch.id === 'default');
    const rest = channels.filter((ch) => ch.id !== 'default');

    // Project groups: channels with a projectId, grouped by project
    const projectMap = new Map<string, { name: string; chats: Channel[]; klatches: Channel[] }>();
    // Default project ("First project"): channels with no projectId. Both chats AND klatches
    // land here — project_id = null is the sentinel for "in the default project" (no migration).
    const dpChats: Channel[] = [];
    const dpKlatches: Channel[] = [];

    for (const ch of rest) {
      if (ch.projectId) {
        if (!projectMap.has(ch.projectId)) {
          projectMap.set(ch.projectId, {
            name: ch.projectName || 'Unknown Project',
            chats: [],
            klatches: [],
          });
        }
        const group = projectMap.get(ch.projectId)!;
        if (ch.type === 'klatch') {
          group.klatches.push(ch);
        } else {
          group.chats.push(ch);
        }
      } else if (ch.type === 'klatch') {
        dpKlatches.push(ch);
      } else {
        dpChats.push(ch);
      }
    }

    // Sort by most recent activity (last message timestamp), newest first
    const byLastActivity = (a: Channel, b: Channel) => {
      const aTime = a.lastMessageAt || a.createdAt;
      const bTime = b.lastMessageAt || b.createdAt;
      return bTime.localeCompare(aTime);
    };

    const projectGroups = Array.from(projectMap.entries()).map(([id, group]) => ({
      id,
      name: group.name,
      chats: group.chats.sort(byLastActivity),
      klatches: group.klatches.sort(byLastActivity),
      totalCount: group.chats.length + group.klatches.length,
    }));

    const defaultProject = {
      chats: dpChats.sort(byLastActivity),
      klatches: dpKlatches.sort(byLastActivity),
      totalCount: dpChats.length + dpKlatches.length,
    };

    return { general, projectGroups, defaultProject };
  }, [channels]);

  // Auto-expand first project if none is expanded yet and projects exist.
  // Priority order:
  //   1. Explicit user choice
  //   2. Project containing the active channel
  //   3. Project containing at least one imported channel (source !== 'native').
  //      F2 fix (Theseus R36 → Iris, 5/18): imported channels in non-first
  //      projects were invisible by default. Bias the auto-expand toward the
  //      project most likely to surface them.
  //   4. First project as a final fallback
  const effectiveExpanded = useMemo(() => {
    if (expandedProject !== null) return expandedProject;
    // Auto-expand project containing active channel
    for (const pg of projectGroups) {
      const allChannels = [...pg.chats, ...pg.klatches];
      if (allChannels.some((ch) => ch.id === activeChannelId)) return pg.id;
    }
    // Prefer project containing any imported channel
    for (const pg of projectGroups) {
      const allChannels = [...pg.chats, ...pg.klatches];
      if (allChannels.some((ch) => ch.source && ch.source !== 'native')) return pg.id;
    }
    // Default: expand first project
    if (projectGroups.length > 0) return projectGroups[0].id;
    return null;
  }, [expandedProject, projectGroups, activeChannelId]);

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
      <span className="truncate" title={ch.name}>{ch.name}</span>
      {(ch.entityCount ?? 0) >= 2 && (
        <span
          className="ml-1 flex-shrink-0 text-[9px] font-medium px-1 py-0.5 rounded-full bg-badge text-muted leading-none"
          title={`${ch.entityCount} agents`}
        >
          {ch.entityCount}
        </span>
      )}
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

  // Chats subsection over klatches subsection (shared by project groups + the default project).
  // Section labels appear only when both types are present (matches SIDEBAR.md within-project ordering).
  const renderChatsThenKlatches = (chats: Channel[], klatches: Channel[]) => (
    <>
      {chats.length > 0 && (
        <div>
          {klatches.length > 0 && (
            <div className="px-6 pt-1 pb-0.5">
              <span className="text-[9px] font-medium text-muted uppercase tracking-wider">Chats</span>
            </div>
          )}
          {chats.map((ch) => renderChannelItem(ch, '@'))}
        </div>
      )}
      {klatches.length > 0 && (
        <div>
          {chats.length > 0 && (
            <div className="px-6 pt-2 pb-0.5">
              <span className="text-[9px] font-medium text-muted uppercase tracking-wider">Klatches</span>
            </div>
          )}
          {klatches.map((ch) => renderChannelItem(ch, '#'))}
        </div>
      )}
    </>
  );

  const chevronIcon = (isExpanded: boolean) => (
    <svg
      className={`w-3 h-3 text-muted transition-transform ${isExpanded ? 'rotate-90' : ''}`}
      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
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

      {/* Channel list — #general → projects (accordion) → "First project" default group */}
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

        {/* Project accordion — one expanded at a time */}
        {projectGroups.map((project) => {
          const isExpanded = effectiveExpanded === project.id;
          return (
            <div key={`project:${project.id}`} data-testid={`project-group-${project.id}`}>
              <div className="flex items-center px-4 pt-3 pb-1 overflow-hidden min-w-0 group">
                <button
                  onClick={() => toggleProject(project.id)}
                  className="flex items-center gap-1 min-w-0 flex-1"
                  title={project.name}
                >
                  {chevronIcon(isExpanded)}
                  <span className="text-xs font-semibold text-muted uppercase tracking-wider truncate">
                    {project.name}
                  </span>
                  <span className="text-xs text-muted ml-1 flex-shrink-0">({project.totalCount})</span>
                </button>
                {onOpenProjectSettings && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onOpenProjectSettings(project.id); }}
                    className="ml-1 p-0.5 rounded text-muted hover:text-secondary transition-colors opacity-100 md:opacity-40 md:group-hover:opacity-100 focus:opacity-100 flex-shrink-0"
                    title="Project settings"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </button>
                )}
              </div>
              {isExpanded && renderChatsThenKlatches(project.chats, project.klatches)}
            </div>
          );
        })}

        {/* Default project ("First project") — null-project channels (chats + klatches).
            Singleton (no real projects): rendered flat, no project chrome — the user doesn't yet
            know projects exist. Multi-project: pinned at the bottom (where "Unassigned" used to
            sit), now a real KLATCHES home, with a collapsible "First project" header (lowercase p). */}
        {defaultProject.totalCount > 0 && (
          projectGroups.length === 0 ? (
            <div data-testid="default-project-flat">
              {renderChatsThenKlatches(defaultProject.chats, defaultProject.klatches)}
            </div>
          ) : (
            <div data-testid="default-project-section">
              <div className="mx-4 my-2 border-t border-line" />
              <button
                onClick={() => toggleSection('default-project')}
                className="w-full flex items-center gap-1 px-4 pt-2 pb-1 group text-left"
                title="First project"
              >
                {chevronIcon(!collapsedSections.has('default-project'))}
                <span className="text-xs font-semibold text-muted uppercase tracking-wider">
                  First project
                </span>
                <span className="text-xs text-muted ml-1">({defaultProject.totalCount})</span>
              </button>
              {!collapsedSections.has('default-project') &&
                renderChatsThenKlatches(defaultProject.chats, defaultProject.klatches)}
            </div>
          )
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

        {/* Agents manager (internal name: entities; user-facing label is "agents" per V2 vocabulary) */}
        {onOpenEntities && (
          <button
            onClick={onOpenEntities}
            className="flex items-center gap-2 px-4 py-2 text-sm text-secondary hover:text-primary transition-colors w-full"
            title="Manage agents"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Agents
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
              {/* Chat / Klatch toggle */}
              <div className="flex rounded overflow-hidden border border-line">
                <button
                  type="button"
                  onClick={() => setNewType('chat')}
                  className={`flex-1 text-xs py-1 font-medium transition-colors ${
                    newType === 'chat'
                      ? 'bg-accent text-white'
                      : 'bg-card text-secondary hover:text-primary'
                  }`}
                >
                  Chat
                </button>
                <button
                  type="button"
                  onClick={() => setNewType('klatch')}
                  className={`flex-1 text-xs py-1 font-medium transition-colors ${
                    newType === 'klatch'
                      ? 'bg-accent text-white'
                      : 'bg-card text-secondary hover:text-primary'
                  }`}
                >
                  Klatch
                </button>
              </div>

              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder={newType === 'klatch' ? 'Klatch name' : 'Chat name'}
                autoFocus
                className="w-full rounded bg-input border border-line px-2.5 py-1.5 text-sm text-primary placeholder-muted focus:outline-none focus:border-accent"
              />

              {/* Klatch-specific fields */}
              {newType === 'klatch' && (
                <>
                  {/* Project — optional. Empty = the default "First project" (null project_id, sentinel).
                      Only shown once real projects exist; a singleton user never sees project chrome. */}
                  {projects.length > 0 && (
                    <select
                      value={newProjectId}
                      onChange={(e) => setNewProjectId(e.target.value)}
                      className="w-full rounded bg-input border border-line px-2.5 py-1.5 text-sm text-primary focus:outline-none focus:border-accent"
                    >
                      <option value="">First project</option>
                      {projects.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  )}

                  {/* Agent picker — composition spec §3 Path A (existing agents) */}
                  {entities.length > 0 && (
                    <div className="space-y-1">
                      <div className="text-xs font-medium text-muted uppercase tracking-wider">
                        Agents {selectedEntityIds.size > 0 && `(${selectedEntityIds.size}/5)`}
                      </div>

                      {/* Selected agents as removable chips */}
                      {selectedAgents.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {selectedAgents.map((ent) => (
                            <span
                              key={ent.id}
                              className="inline-flex items-center gap-1 rounded-full bg-badge px-2 py-0.5 text-[11px] text-primary"
                            >
                              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: ent.color }} />
                              <span className="truncate max-w-[8rem]">{ent.name}</span>
                              <button
                                type="button"
                                onClick={() => toggleEntity(ent.id)}
                                aria-label={`Remove ${ent.name}`}
                                className="text-muted hover:text-primary leading-none"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Typeahead search */}
                      <input
                        type="text"
                        value={agentSearch}
                        onChange={(e) => setAgentSearch(e.target.value)}
                        placeholder="Search agents by name or @handle"
                        className="w-full rounded bg-input border border-line px-2 py-1 text-xs text-primary placeholder-muted focus:outline-none focus:border-accent"
                      />

                      {/* Roles first, other agents below */}
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {[{ label: 'Roles', list: roleAgents }, { label: 'Other agents', list: otherAgents }]
                          .filter((g) => g.list.length > 0)
                          .map((g) => (
                            <div key={g.label}>
                              <div className="text-[9px] font-medium text-muted uppercase tracking-wider px-1.5 mb-0.5">{g.label}</div>
                              {g.list.map((ent) => {
                                const checked = selectedEntityIds.has(ent.id);
                                return (
                                  <label
                                    key={ent.id}
                                    className={`flex items-center gap-1.5 px-1.5 py-0.5 rounded text-xs ${
                                      !checked && atCap ? 'opacity-40 cursor-not-allowed' : 'hover:bg-hover cursor-pointer'
                                    }`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={checked}
                                      onChange={() => toggleEntity(ent.id)}
                                      disabled={!checked && atCap}
                                      className="accent-accent"
                                    />
                                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: ent.color }} />
                                    <span className="text-primary truncate">{ent.name}</span>
                                    {ent.handle && <span className="text-muted text-[9px] flex-shrink-0">@{ent.handle}</span>}
                                    <span className="text-[9px] px-1 py-0.5 rounded bg-badge text-muted ml-auto flex-shrink-0">
                                      {getModelLabel(ent.model)}
                                    </span>
                                  </label>
                                );
                              })}
                            </div>
                          ))}
                        {roleAgents.length === 0 && otherAgents.length === 0 && (
                          <div className="text-[11px] text-muted px-1.5 py-1">No agents match "{agentSearch}".</div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Mode selector */}
                  <select
                    value={newMode}
                    onChange={(e) => setNewMode(e.target.value as InteractionMode)}
                    className="w-full rounded bg-input border border-line px-2.5 py-1.5 text-sm text-primary focus:outline-none focus:border-accent"
                  >
                    {Object.entries(INTERACTION_MODES).map(([key, { label, description }]) => (
                      <option key={key} value={key}>{label} — {description}</option>
                    ))}
                  </select>
                </>
              )}

              <textarea
                value={newPrompt}
                onChange={(e) => setNewPrompt(e.target.value)}
                placeholder={newType === 'klatch' ? 'Purpose — what is this klatch for? (optional)' : 'Custom instructions (optional)'}
                rows={2}
                className="w-full rounded bg-input border border-line px-2.5 py-1.5 text-sm text-primary placeholder-muted focus:outline-none focus:border-accent resize-none"
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={!newName.trim()}
                  className="flex-1 rounded bg-accent px-2 py-1 text-xs font-medium text-white hover:bg-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create {newType === 'klatch' ? 'Klatch' : 'Chat'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 rounded bg-card px-2 py-1 text-xs font-medium text-secondary hover:bg-hover transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => openForm('chat')}
                className="flex-1 rounded bg-card px-3 py-1.5 text-sm text-secondary hover:text-primary hover:bg-hover transition-colors"
              >
                + New Chat
              </button>
              <button
                onClick={() => openForm('klatch')}
                className="flex-1 rounded bg-card px-3 py-1.5 text-sm text-secondary hover:text-primary hover:bg-hover transition-colors"
              >
                + New Klatch
              </button>
            </div>
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
