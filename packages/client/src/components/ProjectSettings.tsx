import React, { useState, useEffect, useRef } from 'react';
import type { FileWithRef } from '@klatch/shared';
import { fetchProject, updateProjectApi, fetchProjectFiles, uploadProjectFile, removeProjectFile, type Project } from '../api/client.js';

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
  const [projectFiles, setProjectFiles] = useState<FileWithRef[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load project files
  useEffect(() => {
    fetchProjectFiles(projectId).then(setProjectFiles).catch(() => setProjectFiles([]));
  }, [projectId]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      await uploadProjectFile(projectId, file);
      const updated = await fetchProjectFiles(projectId);
      setProjectFiles(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveFile = async (fileId: string) => {
    try {
      await removeProjectFile(projectId, fileId);
      setProjectFiles((prev) => prev.filter((f) => f.id !== fileId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove file');
    }
  };

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
              <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-accent/15 text-accent leading-none">
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
            <p className="mt-1 text-xs text-muted">{instructions.length.toLocaleString()} chars</p>
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
            <p className="mt-1 text-xs text-muted">{memory.length.toLocaleString()} chars</p>
          )}
        </div>

        {/* Knowledge base files */}
        <div>
          <label className="block text-xs text-secondary mb-2">
            Knowledge base <span className="text-muted font-normal">({projectFiles.length} file{projectFiles.length !== 1 ? 's' : ''} — listed in L3 context for all channels in this project)</span>
          </label>
          {projectFiles.length > 0 && (
            <div className="space-y-1.5 mb-3">
              {projectFiles.map((f) => {
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
                    <span className="text-xs text-muted">
                      {f.sizeBytes < 1024 ? `${f.sizeBytes} B` : f.sizeBytes < 1024 * 1024 ? `${(f.sizeBytes / 1024).toFixed(1)} KB` : `${(f.sizeBytes / (1024 * 1024)).toFixed(1)} MB`}
                    </span>
                    <button
                      onClick={() => handleRemoveFile(f.id)}
                      title="Remove from project"
                      className="p-1 rounded text-muted hover:text-danger hover:bg-hover transition-colors opacity-100 md:opacity-0 md:group-hover:opacity-100 md:focus-within:opacity-100"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-1.5 rounded-full border border-dashed border-line px-2.5 py-1 text-xs text-muted hover:text-primary hover:border-faint transition-colors disabled:opacity-50"
          >
            {uploading ? 'Uploading...' : '+ Add file'}
          </button>
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
