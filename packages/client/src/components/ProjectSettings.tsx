import React, { useState, useEffect } from 'react';
import { fetchProject, updateProjectApi, type Project } from '../api/client.js';

interface Props {
  projectId: string;
  onClose: () => void;
  onUpdated: () => void; // called after save so parent can refresh
}

export function ProjectSettings({ projectId, onClose, onUpdated }: Props) {
  const [project, setProject] = useState<Project | null>(null);
  const [name, setName] = useState('');
  const [instructions, setInstructions] = useState('');
  const [memory, setMemory] = useState('');
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load project data
  useEffect(() => {
    fetchProject(projectId)
      .then((p) => {
        setProject(p);
        setName(p.name);
        setInstructions(p.instructions);
        setMemory(p.memory);
        setDirty(false);
      })
      .catch((err) => setError(err.message));
  }, [projectId]);

  const handleChange = () => setDirty(true);

  const handleSave = async () => {
    if (!project) return;
    setSaving(true);
    setError(null);
    try {
      const updates: { name?: string; instructions?: string; memory?: string } = {};
      if (name.trim() !== project.name) updates.name = name.trim();
      if (instructions !== project.instructions) updates.instructions = instructions;
      if (memory !== project.memory) updates.memory = memory;

      if (Object.keys(updates).length > 0) {
        const updated = await updateProjectApi(projectId, updates);
        setProject(updated);
      }
      setDirty(false);
      onUpdated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (project) {
      setName(project.name);
      setInstructions(project.instructions);
      setMemory(project.memory);
    }
    setDirty(false);
  };

  // Parse source metadata for display
  const meta = (() => {
    try {
      return project?.sourceMetadata ? JSON.parse(project.sourceMetadata) : null;
    } catch { return null; }
  })();

  if (!project && !error) {
    return (
      <div className="border-b border-line bg-panel px-3 md:px-6 py-4 animate-in">
        <div className="text-sm text-muted">Loading project...</div>
      </div>
    );
  }

  if (error && !project) {
    return (
      <div className="border-b border-line bg-panel px-3 md:px-6 py-4 animate-in">
        <div className="text-sm text-danger">{error}</div>
        <button onClick={onClose} className="mt-2 text-xs text-muted hover:text-secondary">Close</button>
      </div>
    );
  }

  const isImported = project?.source && project.source !== 'native';
  const sourceLabel = project?.source === 'claude-code' ? 'Claude Code'
    : project?.source === 'claude-ai' ? 'claude.ai'
    : project?.source || 'native';

  return (
    <div className="border-b border-line bg-panel px-3 md:px-6 py-4 animate-in">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-secondary uppercase tracking-wide">
          Project Settings
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
        {/* Source info */}
        {isImported && (
          <div className="rounded-lg border border-line bg-card p-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-accent/15 text-accent leading-none">
                {project?.source === 'claude-code' ? 'CC' : project?.source === 'claude-ai' ? 'AI' : '?'}
              </span>
              <span className="text-xs font-medium text-secondary">
                Imported from {sourceLabel}
              </span>
            </div>
            {meta && (
              <div className="text-xs text-muted space-y-0.5">
                {meta.cwd && <p><span className="font-medium">Path:</span> {meta.cwd}</p>}
                {meta.importedAt && <p><span className="font-medium">Imported:</span> {new Date(meta.importedAt).toLocaleString()}</p>}
              </div>
            )}
          </div>
        )}

        {/* Project name */}
        <div>
          <label className="block text-xs text-secondary mb-1">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => { setName(e.target.value); handleChange(); }}
            className="w-full rounded bg-input border border-line px-3 py-2 text-sm text-primary placeholder-muted focus:outline-none focus:border-accent"
          />
        </div>

        {/* Project instructions */}
        <div>
          <label className="block text-xs text-secondary mb-1">
            Instructions <span className="text-muted font-normal">(CLAUDE.md / project rules — injected into every chat)</span>
          </label>
          <textarea
            value={instructions}
            onChange={(e) => { setInstructions(e.target.value); handleChange(); }}
            rows={6}
            placeholder="Project conventions, build commands, architecture notes..."
            className="w-full rounded bg-input border border-line px-3 py-2 text-sm text-primary placeholder-muted focus:outline-none focus:border-accent resize-y font-mono"
          />
          {instructions && (
            <p className="mt-1 text-[10px] text-muted">{instructions.length.toLocaleString()} chars</p>
          )}
        </div>

        {/* Project memory */}
        <div>
          <label className="block text-xs text-secondary mb-1">
            Memory <span className="text-muted font-normal">(accumulated knowledge — MEMORY.md / claude.ai memories)</span>
          </label>
          <textarea
            value={memory}
            onChange={(e) => { setMemory(e.target.value); handleChange(); }}
            rows={4}
            placeholder="User preferences, project history, accumulated context..."
            className="w-full rounded bg-input border border-line px-3 py-2 text-sm text-primary placeholder-muted focus:outline-none focus:border-accent resize-y font-mono"
          />
          {memory && (
            <p className="mt-1 text-[10px] text-muted">{memory.length.toLocaleString()} chars</p>
          )}
        </div>

        {/* Save/Cancel */}
        {dirty && (
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded bg-accent px-4 py-1.5 text-sm font-medium text-white hover:bg-accent-hover transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={handleCancel}
              className="rounded bg-card px-4 py-1.5 text-sm font-medium text-secondary hover:bg-hover transition-colors"
            >
              Cancel
            </button>
          </div>
        )}

        {error && (
          <p className="text-xs text-danger">{error}</p>
        )}
      </div>
    </div>
  );
}
