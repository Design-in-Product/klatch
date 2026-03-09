import React, { useState } from 'react';
import type { Entity, ModelId } from '@klatch/shared';
import { AVAILABLE_MODELS, ENTITY_COLORS, DEFAULT_ENTITY_ID } from '@klatch/shared';

interface Props {
  entities: Entity[];
  onCreateEntity: (data: { name: string; handle?: string; model?: ModelId; systemPrompt?: string; color?: string }) => void;
  onUpdateEntity: (id: string, updates: { name?: string; handle?: string | null; model?: ModelId; systemPrompt?: string; color?: string }) => void;
  onDeleteEntity: (id: string) => void;
  onClose: () => void;
}

const modelEntries = Object.entries(AVAILABLE_MODELS) as [ModelId, { label: string; description: string }][];

export function EntityManager({ entities, onCreateEntity, onUpdateEntity, onDeleteEntity, onClose }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Panel */}
      <div className="relative ml-auto w-full max-w-md bg-panel border-l border-line h-full overflow-y-auto animate-in">
        <div className="px-5 py-4 border-b border-line flex items-center justify-between sticky top-0 bg-panel z-10">
          <h2 className="text-sm font-semibold text-secondary uppercase tracking-wide">
            Entities
          </h2>
          <button onClick={onClose} className="text-muted hover:text-primary transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-5 py-4 space-y-3">
          {entities.map((entity) =>
            editingId === entity.id ? (
              <EntityForm
                key={entity.id}
                entity={entity}
                onSave={(updates) => {
                  onUpdateEntity(entity.id, updates);
                  setEditingId(null);
                }}
                onCancel={() => setEditingId(null)}
              />
            ) : (
              <EntityCard
                key={entity.id}
                entity={entity}
                onEdit={() => setEditingId(entity.id)}
                onDelete={() => onDeleteEntity(entity.id)}
              />
            )
          )}

          {creating ? (
            <EntityForm
              onSave={(data) => {
                onCreateEntity(data as { name: string; model?: ModelId; systemPrompt?: string; color?: string });
                setCreating(false);
              }}
              onCancel={() => setCreating(false)}
            />
          ) : (
            <button
              onClick={() => setCreating(true)}
              className="w-full rounded-lg border-2 border-dashed border-line px-4 py-3 text-sm text-muted hover:text-primary hover:border-faint transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              New entity
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function EntityCard({
  entity,
  onEdit,
  onDelete,
}: {
  entity: Entity;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const isDefault = entity.id === DEFAULT_ENTITY_ID;
  const modelLabel = AVAILABLE_MODELS[entity.model]?.label || entity.model;
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div className="rounded-lg border border-line bg-card px-4 py-3 group">
      <div className="flex items-center gap-3">
        <span
          className="inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold text-white flex-shrink-0"
          style={{ backgroundColor: entity.color }}
        >
          {entity.name.charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm text-primary truncate">{entity.name}</span>
            {entity.handle && (
              <span className="text-[10px] text-muted font-mono">@{entity.handle}</span>
            )}
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-badge text-muted font-medium">
              {modelLabel}
            </span>
          </div>
          <p className="text-xs text-secondary truncate">{entity.systemPrompt}</p>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={onEdit}
            title="Edit entity"
            className="p-1.5 rounded text-muted hover:text-primary hover:bg-hover transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          {!isDefault && (
            <button
              onClick={() => {
                if (confirmDelete) {
                  onDelete();
                } else {
                  setConfirmDelete(true);
                  setTimeout(() => setConfirmDelete(false), 3000);
                }
              }}
              title={confirmDelete ? 'Click again to confirm' : 'Delete entity'}
              className={`p-1.5 rounded transition-colors ${
                confirmDelete
                  ? 'text-danger bg-danger/10'
                  : 'text-muted hover:text-danger hover:bg-hover'
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function EntityForm({
  entity,
  onSave,
  onCancel,
}: {
  entity?: Entity;
  onSave: (data: { name?: string; handle?: string | null; model?: ModelId; systemPrompt?: string; color?: string }) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(entity?.name ?? '');
  const [handle, setHandle] = useState(entity?.handle ?? '');
  const [model, setModel] = useState<ModelId>(entity?.model ?? 'claude-sonnet-4-6');
  const [systemPrompt, setSystemPrompt] = useState(entity?.systemPrompt ?? 'You are a helpful assistant.');
  const [color, setColor] = useState(entity?.color ?? ENTITY_COLORS[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (entity) {
      // Update: only send changed fields
      const updates: Record<string, any> = {};
      if (name.trim() !== entity.name) updates.name = name.trim();
      const newHandle = handle.trim() || null;
      const oldHandle = entity.handle || null;
      if (newHandle !== oldHandle) updates.handle = newHandle;
      if (model !== entity.model) updates.model = model;
      if (systemPrompt.trim() !== entity.systemPrompt) updates.systemPrompt = systemPrompt.trim();
      if (color !== entity.color) updates.color = color;
      if (Object.keys(updates).length > 0) onSave(updates);
      else onCancel();
    } else {
      onSave({ name: name.trim(), handle: handle.trim() || undefined, model, systemPrompt: systemPrompt.trim(), color });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-accent/40 bg-card px-4 py-3 space-y-3">
      {/* Name + Handle + Color */}
      <div className="flex gap-3">
        <div className="flex-1">
          <label className="block text-xs text-secondary mb-1">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Entity name"
            autoFocus
            className="w-full rounded bg-input border border-line px-3 py-1.5 text-sm text-primary placeholder-muted focus:outline-none focus:border-accent"
          />
        </div>
        <div className="w-24">
          <label className="block text-xs text-secondary mb-1">Handle</label>
          <div className="relative">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted text-sm">@</span>
            <input
              type="text"
              value={handle}
              onChange={(e) => setHandle(e.target.value.replace(/[^a-zA-Z0-9_-]/g, ''))}
              placeholder="slug"
              className="w-full rounded bg-input border border-line pl-6 pr-2 py-1.5 text-sm text-primary placeholder-muted focus:outline-none focus:border-accent font-mono"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs text-secondary mb-1">Color</label>
          <div className="flex gap-1">
            {ENTITY_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`w-6 h-6 rounded-full transition-all ${
                  color === c ? 'ring-2 ring-accent ring-offset-1 scale-110' : 'hover:scale-110'
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Model */}
      <div>
        <label className="block text-xs text-secondary mb-1">Model</label>
        <div className="flex gap-1.5">
          {modelEntries.map(([modelId, info]) => (
            <button
              key={modelId}
              type="button"
              onClick={() => setModel(modelId)}
              className={`flex-1 rounded border px-2 py-1.5 text-xs text-left transition-colors ${
                model === modelId
                  ? 'border-accent bg-accent-subtle text-primary'
                  : 'border-line bg-card text-secondary hover:text-primary hover:border-faint'
              }`}
            >
              <div className="font-medium">{info.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* System prompt */}
      <div>
        <label className="block text-xs text-secondary mb-1">System prompt</label>
        <textarea
          value={systemPrompt}
          onChange={(e) => setSystemPrompt(e.target.value)}
          rows={2}
          className="w-full rounded bg-input border border-line px-3 py-1.5 text-sm text-primary placeholder-muted focus:outline-none focus:border-accent resize-none"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          disabled={!name.trim()}
          className="rounded bg-accent px-3 py-1 text-xs font-medium text-white hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {entity ? 'Save' : 'Create'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded bg-card px-3 py-1 text-xs font-medium text-secondary hover:bg-hover transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
