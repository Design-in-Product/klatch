import React, { useState, useEffect } from 'react';
import type { Channel, Entity, ModelId, InteractionMode } from '@klatch/shared';
import { AVAILABLE_MODELS, INTERACTION_MODES } from '@klatch/shared';

interface Props {
  channel: Channel;
  channelEntities: Entity[];
  allEntities: Entity[];
  onSave: (updates: { name?: string; systemPrompt?: string; model?: ModelId; mode?: InteractionMode }) => void;
  onAssignEntity: (entityId: string) => void;
  onRemoveEntity: (entityId: string) => void;
  onClose: () => void;
}

export function ChannelSettings({
  channel,
  channelEntities,
  allEntities,
  onSave,
  onAssignEntity,
  onRemoveEntity,
  onClose,
}: Props) {
  const [name, setName] = useState(channel.name);
  const [systemPrompt, setSystemPrompt] = useState(channel.systemPrompt);
  const [dirty, setDirty] = useState(false);

  // Reset form when channel changes
  useEffect(() => {
    setName(channel.name);
    setSystemPrompt(channel.systemPrompt);
    setDirty(false);
  }, [channel.id]);

  const handleChange = () => setDirty(true);

  const handleSave = () => {
    const updates: { name?: string; systemPrompt?: string } = {};
    if (name.trim() !== channel.name) updates.name = name.trim();
    if (systemPrompt.trim() !== channel.systemPrompt) updates.systemPrompt = systemPrompt.trim();

    if (Object.keys(updates).length > 0) {
      onSave(updates);
    }
    setDirty(false);
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

        {/* System prompt (shared preamble) */}
        <div>
          <label className="block text-xs text-secondary mb-1">
            System prompt <span className="text-muted font-normal">(shared context for all entities)</span>
          </label>
          <textarea
            value={systemPrompt}
            onChange={(e) => { setSystemPrompt(e.target.value); handleChange(); }}
            rows={3}
            className="w-full rounded bg-input border border-line px-3 py-2 text-sm text-primary placeholder-muted focus:outline-none focus:border-accent resize-none"
          />
        </div>

        {/* Interaction mode — only meaningful with 2+ entities */}
        {channelEntities.length >= 2 && (
          <div>
            <label className="block text-xs text-secondary mb-2">
              Interaction mode
            </label>
            <div className="inline-flex rounded-lg border border-line overflow-hidden">
              {(Object.entries(INTERACTION_MODES) as [InteractionMode, { label: string; description: string }][]).map(
                ([modeKey, { label, description }]) => {
                  const isActive = channel.mode === modeKey;
                  const isDisabled = false; // All modes now implemented
                  return (
                    <button
                      key={modeKey}
                      onClick={() => {
                        if (!isDisabled && !isActive) {
                          onSave({ mode: modeKey });
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
                setDirty(false);
              }}
              className="rounded bg-card px-4 py-1.5 text-sm font-medium text-secondary hover:bg-hover transition-colors"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Entity assignment */}
        <div>
          <label className="block text-xs text-secondary mb-2">
            Entities <span className="text-muted font-normal">({channelEntities.length}/5)</span>
          </label>

          {/* Assigned entities */}
          <div className="space-y-1.5 mb-3">
            {channelEntities.map((entity) => {
              const modelLabel = AVAILABLE_MODELS[entity.model]?.label || entity.model;
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
      </div>
    </div>
  );
}
