import React, { useState, useEffect } from 'react';
import type { Channel, Entity, ModelId, InteractionMode, ChannelStats, FileWithRef } from '@klatch/shared';
import { INTERACTION_MODES } from '@klatch/shared';
import { getModelLabel } from '../hooks/useModels';
import { fetchContextFile, fetchProjects, fetchChannelFiles, unpinFileFromChannel, promoteFile, type Project } from '../api/client.js';

interface Props {
  channel: Channel;
  channelEntities: Entity[];
  allEntities: Entity[];
  onSave: (updates: { name?: string; systemPrompt?: string; model?: ModelId; mode?: InteractionMode; projectId?: string | null }) => void;
  onAssignEntity: (entityId: string) => void;
  onRemoveEntity: (entityId: string) => void;
  onDeleteChannel: () => void;
  onClose: () => void;
}

export function ChannelSettings({
  channel,
  channelEntities,
  allEntities,
  onSave,
  onAssignEntity,
  onRemoveEntity,
  onDeleteChannel,
  onClose,
}: Props) {
  const [name, setName] = useState(channel.name);
  const [systemPrompt, setSystemPrompt] = useState(channel.systemPrompt);
  const [localProjectId, setLocalProjectId] = useState<string | null>(channel.projectId || null);
  const [localMode, setLocalMode] = useState<InteractionMode>(channel.mode);
  const [dirty, setDirty] = useState(false);
  const [contextLoading, setContextLoading] = useState(false);
  const [contextError, setContextError] = useState<string | null>(null);
  const [stats, setStats] = useState<ChannelStats | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [promptLayers, setPromptLayers] = useState<Record<string, string> | null>(null);
  const [channelFiles, setChannelFiles] = useState<FileWithRef[]>([]);

  // Reset form when channel changes
  useEffect(() => {
    setName(channel.name);
    setSystemPrompt(channel.systemPrompt);
    setLocalProjectId(channel.projectId || null);
    setLocalMode(channel.mode);
    setDirty(false);
    setContextLoading(false);
    setContextError(null);
    setStats(null);
  }, [channel.id]);

  // Load projects for the assignment dropdown
  useEffect(() => {
    fetchProjects().then(setProjects).catch(() => {});
  }, []);

  const handleChange = () => setDirty(true);

  const handleSave = () => {
    const updates: { name?: string; systemPrompt?: string; projectId?: string | null; mode?: InteractionMode } = {};
    if (name.trim() !== channel.name) updates.name = name.trim();
    if (systemPrompt.trim() !== channel.systemPrompt) updates.systemPrompt = systemPrompt.trim();
    if (localProjectId !== (channel.projectId || null)) updates.projectId = localProjectId;
    if (localMode !== channel.mode) updates.mode = localMode;

    if (Object.keys(updates).length > 0) {
      onSave(updates);
    }
    setDirty(false);
  };

  // Parse source metadata for context loading
  const meta = (() => {
    try {
      return channel.sourceMetadata ? JSON.parse(channel.sourceMetadata) : null;
    } catch { return null; }
  })();

  const isImported = channel.source && channel.source !== 'native';

  // Fetch stats for imported channels
  useEffect(() => {
    if (!isImported) return;
    fetch(`/api/channels/${channel.id}/stats`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data) setStats(data); })
      .catch(() => {});
  }, [channel.id, isImported]);

  // Fetch channel files (pinned files)
  useEffect(() => {
    fetchChannelFiles(channel.id).then(setChannelFiles).catch(() => setChannelFiles([]));
  }, [channel.id]);

  // Fetch prompt layer debug info
  useEffect(() => {
    fetch(`/api/channels/${channel.id}/prompt-debug`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data?.layers) setPromptLayers(data.layers); })
      .catch(() => {});
  }, [channel.id]);

  const hasSavedPrompt = !!channel.systemPrompt.trim();
  const hasCwd = meta?.cwd;
  const hasCompactionSummary = meta?.compactionSummary;

  const handleLoadClaudeMd = async () => {
    setContextLoading(true);
    setContextError(null);
    try {
      const result = await fetchContextFile(channel.id, 'CLAUDE.md');
      setSystemPrompt(result.content);
      setDirty(true);
    } catch (err) {
      setContextError(err instanceof Error ? err.message : 'Failed to load file');
    } finally {
      setContextLoading(false);
    }
  };

  const handleUseSessionSummary = () => {
    if (hasCompactionSummary) {
      setSystemPrompt(meta.compactionSummary);
      setDirty(true);
      setContextError(null);
    }
  };

  // Entities not currently assigned to this channel
  const assignedIds = new Set(channelEntities.map((e) => e.id));
  const unassignedEntities = allEntities.filter((e) => !assignedIds.has(e.id));

  return (
    <div className="border-b border-line bg-panel px-3 md:px-6 py-4 animate-in">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-secondary uppercase tracking-wide">
          Channel Settings
        </h2>
        <button
          onClick={onClose}
          className="text-muted hover:text-secondary transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="space-y-4 max-w-2xl">
        {/* Import provenance — only for imported channels */}
        {isImported && (
          <div className="rounded-lg border border-line bg-card p-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-accent/15 text-accent leading-none">
                {channel.source === 'claude-code' ? 'CC' : channel.source === 'claude-ai' ? 'AI' : channel.source}
              </span>
              <span className="text-xs font-medium text-secondary">
                Imported from {channel.source === 'claude-code' ? 'Claude Code' : channel.source === 'claude-ai' ? 'claude.ai' : channel.source}
              </span>
            </div>
            {meta && (
              <div className="text-xs text-muted space-y-0.5">
                {meta.cwd && <p><span className="font-medium">Project:</span> {meta.cwd.split('/').pop()}</p>}
                {meta.importedAt && <p><span className="font-medium">Imported:</span> {new Date(meta.importedAt).toLocaleString()}</p>}
                {meta.eventCount && <p><span className="font-medium">Events:</span> {meta.eventCount}</p>}
                {meta.version && <p><span className="font-medium">Claude Code:</span> v{meta.version}</p>}
              </div>
            )}
          </div>
        )}

        {/* Channel statistics — imported channels */}
        {isImported && stats && (
          <div className="rounded-lg border border-line bg-card p-3">
            <div className="text-xs font-medium text-secondary mb-2">Statistics</div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <div className="text-lg font-semibold text-primary">{stats.messageCount}</div>
                <div className="text-[10px] text-muted">Messages</div>
              </div>
              <div>
                <div className="text-lg font-semibold text-primary">
                  {stats.toolBreakdown.reduce((sum, t) => sum + t.count, 0)}
                </div>
                <div className="text-[10px] text-muted">Tool calls</div>
              </div>
              <div>
                <div className="text-lg font-semibold text-primary">{stats.toolBreakdown.length}</div>
                <div className="text-[10px] text-muted">Unique tools</div>
              </div>
            </div>
            {stats.toolBreakdown.length > 0 && (
              <div className="mt-3 pt-2 border-t border-line">
                <div className="text-[10px] text-muted mb-1">Top tools</div>
                <div className="flex flex-wrap gap-1">
                  {stats.toolBreakdown.slice(0, 5).map((t) => (
                    <span key={t.tool} className="text-[10px] px-1.5 py-0.5 rounded bg-badge text-muted">
                      {t.tool} ({t.count})
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Pinned files */}
        {channelFiles.length > 0 && (
          <div>
            <label className="block text-xs text-secondary mb-2">
              Pinned files <span className="text-muted font-normal">({channelFiles.length})</span>
            </label>
            <div className="space-y-1.5">
              {channelFiles.map((f) => {
                const ext = f.name.split('.').pop()?.toLowerCase() || '';
                const isImage = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext);
                const isCode = ['ts', 'tsx', 'js', 'jsx', 'py', 'rs', 'go', 'java', 'css', 'html', 'json', 'md'].includes(ext);
                return (
                  <div key={f.refId} className="flex items-center gap-2 rounded-lg border border-line bg-card px-3 py-2 group">
                    <span className="text-base flex-shrink-0">
                      {isImage ? '🖼️' : isCode ? '💻' : '📄'}
                    </span>
                    <a
                      href={`/api/files/${f.storageKey}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary flex-1 truncate no-underline hover:underline"
                    >
                      {f.name}
                    </a>
                    <span className="text-[10px] text-muted">
                      {f.sizeBytes < 1024 ? `${f.sizeBytes} B` : f.sizeBytes < 1024 * 1024 ? `${(f.sizeBytes / 1024).toFixed(1)} KB` : `${(f.sizeBytes / (1024 * 1024)).toFixed(1)} MB`}
                    </span>
                    {channel.projectId && (
                      <button
                        onClick={() => {
                          promoteFile(f.id, 'project', channel.projectId!).catch(console.error);
                        }}
                        title="Promote to project knowledge base"
                        className="p-1 rounded text-muted hover:text-accent hover:bg-hover transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                        </svg>
                      </button>
                    )}
                    <button
                      onClick={() => {
                        unpinFileFromChannel(f.id, channel.id).then(() => {
                          setChannelFiles((prev) => prev.filter((pf) => pf.refId !== f.refId));
                        }).catch(console.error);
                      }}
                      title="Unpin from channel"
                      className="p-1 rounded text-muted hover:text-danger hover:bg-hover transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                );
              })}
            </div>
            <p className="text-[10px] text-muted mt-1.5">
              Pinned files are listed in the channel context sent to entities.
            </p>
          </div>
        )}

        {/* Channel name */}
        <div>
          <label className="block text-xs text-secondary mb-1">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => { setName(e.target.value); handleChange(); }}
            className="w-full rounded bg-input border border-line px-3 py-2 text-sm text-primary placeholder-muted focus:outline-none focus:border-accent"
          />
        </div>

        {/* Project assignment */}
        {projects.length > 0 && (
          <div>
            <label className="block text-xs text-secondary mb-1">Project</label>
            <select
              value={localProjectId || ''}
              onChange={(e) => {
                setLocalProjectId(e.target.value || null);
                handleChange();
              }}
              className="w-full rounded bg-input border border-line px-3 py-2 text-sm text-primary focus:outline-none focus:border-accent"
            >
              <option value="">No project</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Channel addendum (system prompt) — only for klatches, not chats.
            For chats (1:1 with Claude), context comes from project instructions + entity prompt.
            The "channel addendum" only makes sense for multi-entity group conversations. */}
        {channel.type === 'klatch' && (
          <div>
            <label className="block text-xs text-secondary mb-1">
              Channel context <span className="text-muted font-normal">(shared context for all entities — agenda, constraints, background)</span>
            </label>
            <textarea
              value={systemPrompt}
              onChange={(e) => { setSystemPrompt(e.target.value); handleChange(); }}
              rows={3}
              className="w-full rounded bg-input border border-line px-3 py-2 text-sm text-primary placeholder-muted focus:outline-none focus:border-accent resize-none"
            />
          </div>
        )}

        {/* Interaction mode — only meaningful with 2+ entities */}
        {channelEntities.length >= 2 && (
          <div>
            <label className="block text-xs text-secondary mb-2">
              Interaction mode
            </label>
            <div className="inline-flex rounded-lg border border-line overflow-hidden">
              {(Object.entries(INTERACTION_MODES) as [InteractionMode, { label: string; description: string }][]).map(
                ([modeKey, { label, description }]) => {
                  const isActive = localMode === modeKey;
                  const isDisabled = false; // All modes now implemented
                  return (
                    <button
                      key={modeKey}
                      onClick={() => {
                        if (!isDisabled && !isActive) {
                          setLocalMode(modeKey);
                          handleChange();
                        }
                      }}
                      disabled={isDisabled}
                      title={isDisabled ? `${description} (coming soon)` : description}
                      className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                        isActive
                          ? 'bg-accent text-white'
                          : isDisabled
                            ? 'bg-card text-muted/50 cursor-not-allowed'
                            : 'bg-card text-secondary hover:text-primary hover:bg-hover'
                      } ${modeKey !== 'panel' ? 'border-l border-line' : ''}`}
                    >
                      {label}
                    </button>
                  );
                }
              )}
            </div>
          </div>
        )}

        {/* Save button for name/prompt changes */}
        {dirty && (
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="rounded bg-accent px-4 py-1.5 text-sm font-medium text-white hover:bg-accent-hover transition-colors"
            >
              Save
            </button>
            <button
              onClick={() => {
                setName(channel.name);
                setSystemPrompt(channel.systemPrompt);
                setLocalProjectId(channel.projectId || null);
                setLocalMode(channel.mode);
                setDirty(false);
              }}
              className="rounded bg-card px-4 py-1.5 text-sm font-medium text-secondary hover:bg-hover transition-colors"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Entity — read-only for chats, full management for klatches */}
        {channel.type === 'chat' ? (
          // Chat: show single entity as read-only info
          channelEntities.length > 0 && (
            <div>
              <label className="block text-xs text-secondary mb-2">Entity</label>
              <div className="flex items-center gap-2.5 rounded-lg border border-line bg-card px-3 py-2">
                <span
                  className="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold text-white flex-shrink-0"
                  style={{ backgroundColor: channelEntities[0].color }}
                >
                  {channelEntities[0].name.charAt(0).toUpperCase()}
                </span>
                <span className="text-sm text-primary flex-1 truncate">{channelEntities[0].name}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-badge text-muted font-medium">
                  {getModelLabel(channelEntities[0].model)}
                </span>
              </div>
            </div>
          )
        ) : (
          // Klatch: full entity management with add/remove
          <div>
            <label className="block text-xs text-secondary mb-2">
              Entities <span className="text-muted font-normal">({channelEntities.length}/5)</span>
            </label>

            {/* Assigned entities */}
            <div className="space-y-1.5 mb-3">
              {channelEntities.map((entity) => {
                const modelLabel = getModelLabel(entity.model);
                const canRemove = channelEntities.length > 1;
                return (
                  <div
                    key={entity.id}
                    className="flex items-center gap-2.5 rounded-lg border border-line bg-card px-3 py-2 group"
                  >
                    <span
                      className="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold text-white flex-shrink-0"
                      style={{ backgroundColor: entity.color }}
                    >
                      {entity.name.charAt(0).toUpperCase()}
                    </span>
                    <span className="text-sm text-primary flex-1 truncate">{entity.name}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-badge text-muted font-medium">
                      {modelLabel}
                    </span>
                    {canRemove && (
                      <button
                        onClick={() => onRemoveEntity(entity.id)}
                        title="Remove from channel"
                        className="p-1 rounded text-muted hover:text-danger hover:bg-hover transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Add entity pills */}
            {unassignedEntities.length > 0 && channelEntities.length < 5 && (
              <div className="flex flex-wrap gap-1.5">
                {unassignedEntities.map((entity) => (
                  <button
                    key={entity.id}
                    onClick={() => onAssignEntity(entity.id)}
                    className="flex items-center gap-1.5 rounded-full border border-dashed border-line px-2.5 py-1 text-xs text-muted hover:text-primary hover:border-faint transition-colors"
                  >
                    <span
                      className="inline-flex items-center justify-center w-4 h-4 rounded-full text-[8px] font-bold text-white flex-shrink-0"
                      style={{ backgroundColor: entity.color }}
                    >
                      {entity.name.charAt(0).toUpperCase()}
                    </span>
                    + {entity.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Prompt layers — shows which of the 5 assembly layers are active */}
        {promptLayers && (
          <div>
            <label className="block text-xs text-secondary mb-2">Prompt layers</label>
            <div className="space-y-1">
              {Object.entries(promptLayers).map(([key, status]) => (
                <div key={key} className="flex items-center gap-2 text-xs">
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                    status.startsWith('ACTIVE') ? 'bg-green-500' : 'bg-zinc-400'
                  }`} />
                  <span className="text-muted">
                    {key.replace(/^\d+_/, '').replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Delete channel */}
        {channel.id !== 'default' && (
          <div className="pt-2 border-t border-line">
            {!confirmDelete ? (
              <button
                onClick={() => setConfirmDelete(true)}
                className="text-xs text-muted hover:text-danger transition-colors"
              >
                Delete channel
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { setConfirmDelete(false); onDeleteChannel(); }}
                  className="text-xs px-2.5 py-1 rounded bg-danger text-white hover:bg-danger/80 transition-colors"
                >
                  Confirm delete
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="text-xs text-muted hover:text-secondary transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
