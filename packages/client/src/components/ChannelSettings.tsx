import React, { useState, useEffect } from 'react';
import type { Channel, ModelId } from '@klatch/shared';
import { AVAILABLE_MODELS } from '@klatch/shared';

interface Props {
  channel: Channel;
  onSave: (updates: { name?: string; systemPrompt?: string; model?: ModelId }) => void;
  onClose: () => void;
}

export function ChannelSettings({ channel, onSave, onClose }: Props) {
  const [name, setName] = useState(channel.name);
  const [systemPrompt, setSystemPrompt] = useState(channel.systemPrompt);
  const [model, setModel] = useState<ModelId>(channel.model);
  const [dirty, setDirty] = useState(false);

  // Reset form when channel changes
  useEffect(() => {
    setName(channel.name);
    setSystemPrompt(channel.systemPrompt);
    setModel(channel.model);
    setDirty(false);
  }, [channel.id]);

  const handleChange = () => setDirty(true);

  const handleSave = () => {
    const updates: { name?: string; systemPrompt?: string; model?: ModelId } = {};
    if (name.trim() !== channel.name) updates.name = name.trim();
    if (systemPrompt.trim() !== channel.systemPrompt) updates.systemPrompt = systemPrompt.trim();
    if (model !== channel.model) updates.model = model;

    if (Object.keys(updates).length > 0) {
      onSave(updates);
    }
    onClose();
  };

  const modelEntries = Object.entries(AVAILABLE_MODELS) as [ModelId, { label: string; description: string }][];

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

        {/* System prompt */}
        <div>
          <label className="block text-xs text-secondary mb-1">System prompt</label>
          <textarea
            value={systemPrompt}
            onChange={(e) => { setSystemPrompt(e.target.value); handleChange(); }}
            rows={3}
            className="w-full rounded bg-input border border-line px-3 py-2 text-sm text-primary placeholder-muted focus:outline-none focus:border-accent resize-none"
          />
        </div>

        {/* Model selection */}
        <div>
          <label className="block text-xs text-secondary mb-1">Model</label>
          <div className="flex flex-col md:flex-row gap-2">
            {modelEntries.map(([modelId, info]) => (
              <button
                key={modelId}
                onClick={() => { setModel(modelId); handleChange(); }}
                className={`flex-1 rounded border px-3 py-2 text-left transition-colors ${
                  model === modelId
                    ? 'border-accent bg-accent-subtle text-primary'
                    : 'border-line bg-card text-secondary hover:text-primary hover:border-faint'
                }`}
              >
                <div className="text-sm font-medium">{info.label}</div>
                <div className="text-xs opacity-60">{info.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <button
            onClick={handleSave}
            disabled={!dirty}
            className="rounded bg-accent px-4 py-1.5 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Save
          </button>
          <button
            onClick={onClose}
            className="rounded bg-card px-4 py-1.5 text-sm font-medium text-secondary hover:bg-hover transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
