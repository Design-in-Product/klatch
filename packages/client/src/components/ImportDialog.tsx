import React, { useState, useRef } from 'react';
import { importClaudeCodeSession, importClaudeAiExport, previewClaudeAiExport, deleteChannelApi, fetchClaudeCodeSessions } from '../api/client';
import type { ImportResponse, ImportConflict, ClaudeAiImportResponse, ZipPreviewResponse, SessionBrowseResponse } from '../api/client';

type ImportMode = 'claude-code' | 'claude-ai';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onImported: (result: ImportResponse) => void;
  /** Called after claude.ai bulk import — refreshes channel list */
  onBulkImported?: () => void;
  /** Called after a replace operation deletes a channel — removes it from state */
  onChannelDeleted?: (channelId: string) => void;
}

export function ImportDialog({ isOpen, onClose, onImported, onBulkImported, onChannelDeleted }: Props) {
  const [mode, setMode] = useState<ImportMode>('claude-code');
  const [sessionPath, setSessionPath] = useState('');
  const [channelName, setChannelName] = useState('');
  const [zipFile, setZipFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResponse | null>(null);
  const [bulkResult, setBulkResult] = useState<ClaudeAiImportResponse | null>(null);
  const [conflict, setConflict] = useState<ImportConflict | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Preview state for selective import
  const [preview, setPreview] = useState<ZipPreviewResponse | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Claude Code session browser state
  const [sessionBrowse, setSessionBrowse] = useState<SessionBrowseResponse | null>(null);
  const [selectedSessions, setSelectedSessions] = useState<Set<string>>(new Set());
  const [browseLoading, setBrowseLoading] = useState(false);
  const [browseError, setBrowseError] = useState<string | null>(null);
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());

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
    setConflict(null);

    try {
      if (mode === 'claude-code') {
        if (sessionBrowse) {
          // Multi-import from browse panel
          await handleImportSelected();
          return;
        }
        const path = sessionPath.trim();
        if (!path) return;
        const importResult = await importClaudeCodeSession(path, channelName.trim() || undefined);
        if (importResult.status === 'conflict') {
          setConflict(importResult.conflict);
        } else {
          setResult(importResult.data);
        }
      } else {
        if (!zipFile) return;
        const ids = selectedIds.size > 0 ? Array.from(selectedIds) : undefined;
        // If any selected conversation is already imported, use forceImport for re-branching
        const hasRebranch = preview?.conversations.some(
          (c) => c.alreadyImported && selectedIds.has(c.uuid)
        );
        const importResult = await importClaudeAiExport(zipFile, ids, hasRebranch || undefined);
        setBulkResult(importResult);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setLoading(false);
    }
  };

  const handleReplace = async () => {
    if (!conflict) return;
    setLoading(true);
    setError(null);
    try {
      await deleteChannelApi(conflict.existingChannelId);
      if (onChannelDeleted) onChannelDeleted(conflict.existingChannelId);
      // Re-import (now no duplicate exists)
      const path = sessionPath.trim();
      const importResult = await importClaudeCodeSession(path, channelName.trim() || undefined);
      if (importResult.status === 'success') {
        setConflict(null);
        setResult(importResult.data);
      } else {
        // Shouldn't happen after delete, but handle gracefully
        setError('Unexpected conflict after replace');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Replace failed');
    } finally {
      setLoading(false);
    }
  };

  const handleForkAgain = async () => {
    if (!conflict) return;
    setLoading(true);
    setError(null);
    try {
      const path = sessionPath.trim();
      const importResult = await importClaudeCodeSession(path, channelName.trim() || undefined, true);
      if (importResult.status === 'success') {
        setConflict(null);
        setResult(importResult.data);
      } else {
        setError('Unexpected conflict during fork-again');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fork-again failed');
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
    setConflict(null);
    setPreview(null);
    setSelectedIds(new Set());
    setSessionBrowse(null);
    setSelectedSessions(new Set());
    setBrowseError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    onClose();
  };

  const switchMode = (newMode: ImportMode) => {
    setMode(newMode);
    setError(null);
    setResult(null);
    setBulkResult(null);
    setConflict(null);
    setPreview(null);
    setSelectedIds(new Set());
    setSessionBrowse(null);
    setSelectedSessions(new Set());
    setBrowseError(null);
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

  const handleBrowseSessions = async () => {
    setBrowseLoading(true);
    setBrowseError(null);
    try {
      const data = await fetchClaudeCodeSessions();
      setSessionBrowse(data);
      // Auto-expand all projects, pre-select non-imported sessions
      setExpandedProjects(new Set(data.projects.map((p) => p.projectPath)));
      const nonImported = new Set<string>();
      for (const proj of data.projects) {
        for (const s of proj.sessions) {
          if (!s.alreadyImported) nonImported.add(s.path);
        }
      }
      setSelectedSessions(nonImported);
    } catch (err) {
      setBrowseError(err instanceof Error ? err.message : 'Failed to browse sessions');
    } finally {
      setBrowseLoading(false);
    }
  };

  const handleCloseBrowse = () => {
    setSessionBrowse(null);
    setSelectedSessions(new Set());
    setBrowseError(null);
  };

  const toggleSession = (sessionPath: string) => {
    setSelectedSessions((prev) => {
      const next = new Set(prev);
      if (next.has(sessionPath)) {
        next.delete(sessionPath);
      } else {
        next.add(sessionPath);
      }
      return next;
    });
  };

  const toggleProject = (projectPath: string) => {
    setExpandedProjects((prev) => {
      const next = new Set(prev);
      if (next.has(projectPath)) {
        next.delete(projectPath);
      } else {
        next.add(projectPath);
      }
      return next;
    });
  };

  const handleImportSelected = async () => {
    if (selectedSessions.size === 0) return;
    setLoading(true);
    setError(null);
    setBulkResult(null);

    const imported: Array<{ channelId: string; channelName: string; messageCount: number; artifactCount: number; conversationId: string }> = [];
    const errors: string[] = [];

    for (const sessionPath of selectedSessions) {
      try {
        const result = await importClaudeCodeSession(sessionPath);
        if (result.status === 'success') {
          imported.push({
            channelId: result.data.channelId,
            channelName: result.data.channelName,
            messageCount: result.data.messageCount,
            artifactCount: result.data.artifactCount,
            conversationId: result.data.sessionId || '',
          });
        } else {
          // Duplicate — skip silently (already imported)
        }
      } catch (err) {
        errors.push(err instanceof Error ? err.message : 'Unknown error');
      }
    }

    setLoading(false);
    setSessionBrowse(null);
    setSelectedSessions(new Set());

    if (imported.length > 0) {
      setBulkResult({
        imported,
        skipped: [],
        totalImported: imported.length,
        totalSkipped: errors.length,
      });
    } else if (errors.length > 0) {
      setError(`Import failed: ${errors[0]}`);
    } else {
      setError('All selected sessions were already imported');
    }
  };

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const importableCount = preview?.conversations.filter((c) => !c.alreadyImported).length ?? 0;
  const rebranchCount = preview?.conversations.filter(
    (c) => c.alreadyImported && selectedIds.has(c.uuid)
  ).length ?? 0;
  const isSubmitDisabled = loading || (
    mode === 'claude-code'
      ? (sessionBrowse ? selectedSessions.size === 0 : !sessionPath.trim())
      : (!zipFile || (preview !== null && selectedIds.size === 0))
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50" onClick={handleReset} />

      {/* Dialog */}
      <div className={`relative z-50 bg-card border border-line-strong rounded-lg shadow-xl w-full mx-4 ${
        sessionBrowse || preview ? 'max-w-lg' : 'max-w-md'
      }`}>
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
          {!result && !bulkResult && !conflict && (
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

          {conflict ? (
            /* Conflict resolution state */
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
                <span className="font-medium">Already imported</span>
              </div>
              <div className="text-sm text-secondary space-y-1">
                <p><span className="text-muted">Channel:</span> {conflict.existingChannelName}</p>
                <p><span className="text-muted">Messages:</span> {conflict.existingMessageCount}</p>
                {conflict.hasNewMessages && (
                  <p className="text-amber-600 dark:text-amber-400 text-xs">
                    ⚠ {conflict.nativeMessageCount} message{conflict.nativeMessageCount !== 1 ? 's' : ''} added since import
                  </p>
                )}
              </div>

              {error && (
                <div className="rounded bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-3 py-2 text-sm text-red-700 dark:text-red-300">
                  {error}
                </div>
              )}

              <div className="flex flex-col gap-2">
                <button
                  onClick={handleReplace}
                  disabled={loading}
                  className="w-full rounded bg-red-600 hover:bg-red-700 px-3 py-2 text-sm font-medium text-white disabled:opacity-50 transition-colors"
                >
                  {loading ? 'Replacing...' : 'Replace existing'}
                </button>
                <button
                  onClick={handleForkAgain}
                  disabled={loading}
                  className="w-full rounded bg-accent hover:bg-accent-hover px-3 py-2 text-sm font-medium text-white disabled:opacity-50 transition-colors"
                >
                  {loading ? 'Importing...' : 'Import as new'}
                </button>
                <button
                  onClick={handleReset}
                  disabled={loading}
                  className="w-full rounded bg-card border border-line px-3 py-2 text-sm font-medium text-secondary hover:bg-hover disabled:opacity-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : result ? (
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
                sessionBrowse ? (
                  /* Session browser panel */
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-medium text-muted uppercase tracking-wider">
                        Sessions ({sessionBrowse.totalSessions} in {sessionBrowse.totalProjects} project{sessionBrowse.totalProjects !== 1 ? 's' : ''})
                      </label>
                      <button
                        type="button"
                        onClick={handleCloseBrowse}
                        className="text-xs text-accent hover:text-accent-hover transition-colors"
                      >
                        Manual path
                      </button>
                    </div>

                    {browseError && (
                      <div className="rounded bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-3 py-2 text-sm text-red-700 dark:text-red-300">
                        {browseError}
                      </div>
                    )}

                    {sessionBrowse.projects.length === 0 ? (
                      <div className="rounded border border-line px-4 py-6 text-center text-sm text-muted">
                        No Claude Code sessions found in ~/.claude/projects/
                      </div>
                    ) : (
                      <div className="max-h-72 overflow-y-auto rounded border border-line divide-y divide-line">
                        {sessionBrowse.projects.map((project) => (
                          <div key={project.projectPath}>
                            {/* Project header */}
                            <button
                              type="button"
                              onClick={() => toggleProject(project.projectPath)}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-primary hover:bg-hover transition-colors"
                            >
                              <svg
                                className={`w-3.5 h-3.5 text-muted transition-transform ${expandedProjects.has(project.projectPath) ? 'rotate-90' : ''}`}
                                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                              </svg>
                              <span className="truncate">{project.projectName}</span>
                              <span className="text-xs text-muted ml-auto shrink-0">
                                {project.sessions.length} session{project.sessions.length !== 1 ? 's' : ''}
                              </span>
                            </button>

                            {/* Sessions list */}
                            {expandedProjects.has(project.projectPath) && (
                              <div className="bg-surface divide-y divide-line/50">
                                {project.sessions.map((session) => (
                                  <label
                                    key={session.path}
                                    className={`flex items-start gap-2.5 px-3 py-2 pl-8 text-sm cursor-pointer hover:bg-hover transition-colors ${
                                      session.alreadyImported ? 'opacity-50' : ''
                                    }`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={selectedSessions.has(session.path)}
                                      onChange={() => toggleSession(session.path)}
                                      className="mt-0.5 rounded border-line text-accent focus:ring-accent"
                                    />
                                    <div className="flex-1 min-w-0">
                                      <div className="text-primary font-mono text-xs truncate" title={session.sessionId}>
                                        {session.sessionId.slice(0, 8)}...
                                      </div>
                                      <div className="text-xs text-muted">
                                        {formatSize(session.sizeBytes)}
                                        {' \u00b7 '}
                                        {new Date(session.modifiedAt).toLocaleDateString()}
                                        {session.alreadyImported && (
                                          <span className="ml-1.5 text-yellow-600 dark:text-yellow-400">
                                            (imported{session.existingChannelName ? `: ${session.existingChannelName}` : ''})
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </label>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  /* Manual path input + browse button */
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
                      <div className="mt-1 flex items-center justify-between">
                        <p className="text-xs text-muted">
                          Full path to a Claude Code JSONL session file
                        </p>
                        <button
                          type="button"
                          onClick={handleBrowseSessions}
                          disabled={browseLoading}
                          className="text-xs text-accent hover:text-accent-hover transition-colors disabled:opacity-50"
                        >
                          {browseLoading ? 'Scanning...' : 'Browse...'}
                        </button>
                      </div>
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
                )
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
                            {preview.conversations.map((conv) => {
                              const isSelected = selectedIds.has(conv.uuid);
                              const willRebranch = conv.alreadyImported && isSelected;
                              return (
                              <label
                                key={conv.uuid}
                                className={`flex items-start gap-2.5 px-3 py-2 text-sm cursor-pointer hover:bg-hover transition-colors ${
                                  conv.alreadyImported && !isSelected ? 'opacity-50' : ''
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => toggleConversation(conv.uuid)}
                                  className="mt-0.5 rounded border-line text-accent focus:ring-accent"
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="text-primary truncate">
                                    {conv.projectName ? `${conv.projectName}: ` : ''}{conv.name}
                                  </div>
                                  <div className="text-xs text-muted">
                                    {conv.messageCount} messages
                                    {willRebranch && (
                                      <span className="ml-1.5 text-accent font-medium">
                                        (re-branch)
                                      </span>
                                    )}
                                    {conv.alreadyImported && !isSelected && (
                                      <span className="ml-1.5 text-yellow-600 dark:text-yellow-400">
                                        (already imported)
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </label>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Projects & memories info */}
                      {(preview.projects.length > 0 || preview.memories.length > 0) && (
                        <div className="text-xs text-muted space-y-0.5">
                          {preview.projects.length > 0 && (
                            <p>{preview.projects.length} project{preview.projects.length !== 1 ? 's' : ''} (instructions will be imported with conversations)</p>
                          )}
                          {preview.memories.length > 0 && (
                            <p>{preview.memories.length} memor{preview.memories.length !== 1 ? 'ies' : 'y'} (included in project context)</p>
                          )}
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
                    mode === 'claude-code' && sessionBrowse
                      ? `Import selected (${selectedSessions.size})`
                      : mode === 'claude-ai' && preview
                        ? rebranchCount > 0
                          ? `Import ${selectedIds.size} (${rebranchCount} re-branch)`
                          : `Import selected (${selectedIds.size})`
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
