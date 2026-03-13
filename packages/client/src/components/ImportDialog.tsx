import React, { useState, useRef } from 'react';
import { importClaudeCodeSession, importClaudeAiExport, previewClaudeAiExport } from '../api/client';
import type { ImportResponse, ClaudeAiImportResponse, ZipPreviewResponse } from '../api/client';

type ImportMode = 'claude-code' | 'claude-ai';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onImported: (result: ImportResponse) => void;
  /** Called after claude.ai bulk import — refreshes channel list */
  onBulkImported?: () => void;
}

export function ImportDialog({ isOpen, onClose, onImported, onBulkImported }: Props) {
  const [mode, setMode] = useState<ImportMode>('claude-code');
  const [sessionPath, setSessionPath] = useState('');
  const [channelName, setChannelName] = useState('');
  const [zipFile, setZipFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResponse | null>(null);
  const [bulkResult, setBulkResult] = useState<ClaudeAiImportResponse | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Preview state for selective import
  const [preview, setPreview] = useState<ZipPreviewResponse | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file && !file.name.endsWith('.zip')) {
      setError('Please select a .zip file');
      setZipFile(null);
      return;
    }
    setError(null);
    setZipFile(file);
    setPreview(null);
    setSelectedIds(new Set());

    if (file) {
      // Auto-preview on file selection
      setLoading(true);
      try {
        const previewData = await previewClaudeAiExport(file);
        setPreview(previewData);
        // Pre-select all non-imported conversations
        const ids = new Set(
          previewData.conversations
            .filter((c) => !c.alreadyImported)
            .map((c) => c.uuid)
        );
        setSelectedIds(ids);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to preview ZIP');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    setBulkResult(null);

    try {
      if (mode === 'claude-code') {
        const path = sessionPath.trim();
        if (!path) return;
        const importResult = await importClaudeCodeSession(path, channelName.trim() || undefined);
        setResult(importResult);
      } else {
        if (!zipFile) return;
        const ids = selectedIds.size > 0 ? Array.from(selectedIds) : undefined;
        const importResult = await importClaudeAiExport(zipFile, ids);
        setBulkResult(importResult);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoToChannel = () => {
    if (result) {
      onImported(result);
      handleReset();
    }
  };

  const handleBulkDone = () => {
    if (onBulkImported) onBulkImported();
    handleReset();
  };

  const handleGoToBulkChannel = (channelId: string) => {
    onImported({ channelId, channelName: '', messageCount: 0, artifactCount: 0, source: 'claude-ai', duplicate: false });
    handleReset();
  };

  const handleReset = () => {
    setSessionPath('');
    setChannelName('');
    setZipFile(null);
    setError(null);
    setResult(null);
    setBulkResult(null);
    setPreview(null);
    setSelectedIds(new Set());
    if (fileInputRef.current) fileInputRef.current.value = '';
    onClose();
  };

  const switchMode = (newMode: ImportMode) => {
    setMode(newMode);
    setError(null);
    setResult(null);
    setBulkResult(null);
    setPreview(null);
    setSelectedIds(new Set());
  };

  const toggleConversation = (uuid: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(uuid)) {
        next.delete(uuid);
      } else {
        next.add(uuid);
      }
      return next;
    });
  };

  const toggleAllConversations = () => {
    if (!preview) return;
    const importable = preview.conversations.filter((c) => !c.alreadyImported);
    if (selectedIds.size === importable.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(importable.map((c) => c.uuid)));
    }
  };

  const importableCount = preview?.conversations.filter((c) => !c.alreadyImported).length ?? 0;
  const isSubmitDisabled = loading || (mode === 'claude-code' ? !sessionPath.trim() : (!zipFile || (preview !== null && selectedIds.size === 0)));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50" onClick={handleReset} />

      {/* Dialog */}
      <div className="relative z-50 bg-card border border-line-strong rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-line">
          <h2 className="text-base font-semibold text-primary">
            Import
          </h2>
          <button
            onClick={handleReset}
            className="text-muted hover:text-secondary transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-5">
          {/* Mode toggle */}
          {!result && !bulkResult && (
            <div className="flex rounded-lg border border-line overflow-hidden mb-4">
              <button
                type="button"
                onClick={() => switchMode('claude-code')}
                className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${
                  mode === 'claude-code'
                    ? 'bg-accent text-white'
                    : 'bg-card text-muted hover:text-secondary'
                }`}
              >
                Claude Code
              </button>
              <button
                type="button"
                onClick={() => switchMode('claude-ai')}
                className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${
                  mode === 'claude-ai'
                    ? 'bg-accent text-white'
                    : 'bg-card text-muted hover:text-secondary'
                }`}
              >
                claude.ai
              </button>
            </div>
          )}

          {result ? (
            /* Claude Code success state */
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span className="font-medium">Import successful</span>
              </div>
              <div className="text-sm text-secondary space-y-1">
                <p><span className="text-muted">Channel:</span> {result.channelName}</p>
                <p><span className="text-muted">Messages:</span> {result.messageCount}</p>
                {result.artifactCount > 0 && (
                  <p><span className="text-muted">Artifacts:</span> {result.artifactCount}</p>
                )}
              </div>
              <button
                onClick={handleGoToChannel}
                className="w-full rounded bg-accent px-3 py-2 text-sm font-medium text-white hover:bg-accent-hover transition-colors"
              >
                Go to channel
              </button>
            </div>
          ) : bulkResult ? (
            /* claude.ai bulk success state */
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span className="font-medium">Import complete</span>
              </div>
              <div className="text-sm text-secondary space-y-1">
                <p><span className="text-muted">Imported:</span> {bulkResult.totalImported} conversation{bulkResult.totalImported !== 1 ? 's' : ''}</p>
                {bulkResult.totalSkipped > 0 && (
                  <p><span className="text-muted">Skipped:</span> {bulkResult.totalSkipped} (duplicate or empty)</p>
                )}
              </div>
              {bulkResult.imported.length > 0 && (
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {bulkResult.imported.map((conv) => (
                    <button
                      key={conv.channelId}
                      onClick={() => handleGoToBulkChannel(conv.channelId)}
                      className="w-full text-left rounded px-2.5 py-1.5 text-sm hover:bg-hover transition-colors"
                    >
                      <span className="text-primary">{conv.channelName}</span>
                      <span className="text-muted ml-2">({conv.messageCount} messages)</span>
                    </button>
                  ))}
                </div>
              )}
              <button
                onClick={handleBulkDone}
                className="w-full rounded bg-accent px-3 py-2 text-sm font-medium text-white hover:bg-accent-hover transition-colors"
              >
                Done
              </button>
            </div>
          ) : (
            /* Input form */
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'claude-code' ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-secondary mb-1">
                      Session file path
                    </label>
                    <input
                      type="text"
                      value={sessionPath}
                      onChange={(e) => setSessionPath(e.target.value)}
                      placeholder="~/.claude/projects/.../session-id.jsonl"
                      autoFocus
                      className="w-full rounded bg-input border border-line px-3 py-2 text-sm text-primary placeholder-muted focus:outline-none focus:border-accent font-mono"
                    />
                    <p className="mt-1 text-xs text-muted">
                      Full path to a Claude Code JSONL session file
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-secondary mb-1">
                      Channel name <span className="text-muted font-normal">(optional)</span>
                    </label>
                    <input
                      type="text"
                      value={channelName}
                      onChange={(e) => setChannelName(e.target.value)}
                      placeholder="Auto-generated from project + date"
                      className="w-full rounded bg-input border border-line px-3 py-2 text-sm text-primary placeholder-muted focus:outline-none focus:border-accent"
                    />
                  </div>
                </>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-secondary mb-1">
                    Data export ZIP
                  </label>
                  {/* Hidden file input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".zip"
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  {preview ? (
                    /* Preview / browse panel */
                    <div className="space-y-3">
                      {/* File info bar */}
                      <div className="flex items-center justify-between rounded bg-surface px-3 py-2 border border-line">
                        <div className="text-sm">
                          <span className="font-medium text-primary">{zipFile?.name}</span>
                          <span className="text-muted ml-2">({((zipFile?.size ?? 0) / 1024 / 1024).toFixed(1)} MB)</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="text-xs text-accent hover:text-accent-hover transition-colors"
                        >
                          Change
                        </button>
                      </div>

                      {/* Conversations section */}
                      {preview.conversations.length > 0 && (
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <label className="text-xs font-medium text-muted uppercase tracking-wider">
                              Conversations ({preview.conversations.length})
                            </label>
                            {importableCount > 1 && (
                              <button
                                type="button"
                                onClick={toggleAllConversations}
                                className="text-xs text-accent hover:text-accent-hover transition-colors"
                              >
                                {selectedIds.size === importableCount ? 'Deselect all' : 'Select all'}
                              </button>
                            )}
                          </div>
                          <div className="max-h-56 overflow-y-auto rounded border border-line divide-y divide-line">
                            {preview.conversations.map((conv) => (
                              <label
                                key={conv.uuid}
                                className={`flex items-start gap-2.5 px-3 py-2 text-sm cursor-pointer hover:bg-hover transition-colors ${
                                  conv.alreadyImported ? 'opacity-50' : ''
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={selectedIds.has(conv.uuid)}
                                  disabled={conv.alreadyImported}
                                  onChange={() => toggleConversation(conv.uuid)}
                                  className="mt-0.5 rounded border-line text-accent focus:ring-accent"
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="text-primary truncate">
                                    {conv.projectName ? `${conv.projectName}: ` : ''}{conv.name}
                                  </div>
                                  <div className="text-xs text-muted">
                                    {conv.messageCount} messages
                                    {conv.alreadyImported && (
                                      <span className="ml-1.5 text-yellow-600 dark:text-yellow-400">
                                        (already imported)
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Projects section (info only) */}
                      {preview.projects.length > 0 && (
                        <div className="text-xs text-muted">
                          {preview.projects.length} project{preview.projects.length !== 1 ? 's' : ''} with knowledge docs (not yet importable)
                        </div>
                      )}

                      {/* Memories section (info only) */}
                      {preview.memories.length > 0 && (
                        <div className="text-xs text-muted">
                          {preview.memories.length} memor{preview.memories.length !== 1 ? 'ies' : 'y'} (not yet importable)
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Drop zone / browse button */
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full rounded border-2 border-dashed border-line hover:border-accent px-4 py-6 text-center transition-colors group"
                    >
                      {loading ? (
                        <div className="text-sm text-muted">Loading preview...</div>
                      ) : (
                        <div className="space-y-1">
                          <svg className="w-8 h-8 mx-auto text-muted group-hover:text-accent transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                          </svg>
                          <div className="text-sm text-muted group-hover:text-secondary transition-colors">
                            Choose ZIP file
                          </div>
                          <div className="text-xs text-faint">
                            claude.ai &rarr; Settings &rarr; Export Data
                          </div>
                        </div>
                      )}
                    </button>
                  )}
                </div>
              )}

              {error && (
                <div className="rounded bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-3 py-2 text-sm text-red-700 dark:text-red-300">
                  {error}
                </div>
              )}

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={isSubmitDisabled}
                  className="flex-1 rounded bg-accent px-3 py-2 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Importing...' : (
                    mode === 'claude-ai' && preview
                      ? `Import selected (${selectedIds.size})`
                      : 'Import'
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="flex-1 rounded bg-card border border-line px-3 py-2 text-sm font-medium text-secondary hover:bg-hover transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
