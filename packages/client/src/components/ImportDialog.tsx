import React, { useState, useRef, useEffect } from 'react';
import { importClaudeCodeSession, uploadClaudeCodeSession, importClaudeAiExport, previewClaudeAiExport, deleteChannelApi, fetchClaudeCodeSessions } from '../api/client';
import type { ImportResponse, ImportConflict, ClaudeAiImportResponse, ZipPreviewResponse, SessionBrowseResponse, ResolveDisposition } from '../api/client';

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
  const jsonlInputRef = useRef<HTMLInputElement>(null);
  const [jsonlFile, setJsonlFile] = useState<File | null>(null);

  // Preview state for selective import
  const [preview, setPreview] = useState<ZipPreviewResponse | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  // Per-conversation project assignment (conv UUID → project UUID)
  const [projectAssignments, setProjectAssignments] = useState<Record<string, string>>({});

  // Claude Code session browser state
  const [sessionBrowse, setSessionBrowse] = useState<SessionBrowseResponse | null>(null);
  const [selectedSessions, setSelectedSessions] = useState<Set<string>>(new Set());
  const [browseLoading, setBrowseLoading] = useState(false);
  const [browseError, setBrowseError] = useState<string | null>(null);
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  // Confirmed (or edited) entity name per session path — prefilled from each
  // session's entityGuess, editable, sent as entityName on import.
  const [sessionEntityNames, setSessionEntityNames] = useState<Record<string, string>>({});

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
        // Auto-assign conversations to the single project (if only one exists)
        // For conversations that already have a projectUuid from the export, use that
        if (previewData.projects.length > 0) {
          const autoAssignments: Record<string, string> = {};
          const singleProject = previewData.projects.length === 1 ? previewData.projects[0] : null;
          for (const conv of previewData.conversations) {
            if (conv.projectUuid) {
              // Export included this link — use it
              autoAssignments[conv.uuid] = conv.projectUuid;
            } else if (singleProject) {
              // Only one project in the ZIP — auto-assign
              autoAssignments[conv.uuid] = singleProject.uuid;
            }
          }
          setProjectAssignments(autoAssignments);
        }
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
        // Upload path (JSONL file) or manual path
        const importResult = jsonlFile
          ? await uploadClaudeCodeSession(jsonlFile, channelName.trim() || undefined)
          : await importClaudeCodeSession(sessionPath.trim(), channelName.trim() || undefined);
        if (!jsonlFile && !sessionPath.trim()) return;
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
        // Only send assignments for selected conversations
        const activeAssignments = Object.keys(projectAssignments).length > 0
          ? Object.fromEntries(
              Object.entries(projectAssignments).filter(([uuid]) => !ids || ids.includes(uuid))
            )
          : undefined;
        const importResult = await importClaudeAiExport(zipFile, ids, hasRebranch || undefined, activeAssignments);
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
      const importResult = jsonlFile
        ? await uploadClaudeCodeSession(jsonlFile, channelName.trim() || undefined)
        : await importClaudeCodeSession(sessionPath.trim(), channelName.trim() || undefined);
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
      const importResult = jsonlFile
        ? await uploadClaudeCodeSession(jsonlFile, channelName.trim() || undefined, true)
        : await importClaudeCodeSession(sessionPath.trim(), channelName.trim() || undefined, true);
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

  const handleViewExisting = () => {
    if (!conflict) return;
    onImported({
      channelId: conflict.existingChannelId,
      channelName: conflict.existingChannelName,
      messageCount: conflict.existingMessageCount,
      artifactCount: 0,
      source: 'claude-code',
      duplicate: true,
    });
    handleReset();
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
    setJsonlFile(null);
    setError(null);
    setResult(null);
    setBulkResult(null);
    setConflict(null);
    setPreview(null);
    setSelectedIds(new Set());
    setProjectAssignments({});
    setSessionBrowse(null);
    setSelectedSessions(new Set());
    setSessionEntityNames({});
    setBrowseError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (jsonlInputRef.current) jsonlInputRef.current.value = '';
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
    setProjectAssignments({});
    setSessionBrowse(null);
    setSelectedSessions(new Set());
    setSessionEntityNames({});
    setBrowseError(null);
    setJsonlFile(null);
    if (jsonlInputRef.current) jsonlInputRef.current.value = '';
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
      const initialNames: Record<string, string> = {};
      for (const proj of data.projects) {
        for (const s of proj.sessions) {
          if (!s.alreadyImported) {
            nonImported.add(s.path);
            // Prefill per basis: identity-claim and project-name both carry a
            // proposed name; 'none' prefills empty (blank stays a legitimate,
            // discoverable choice — leaving it binds to the default agent).
            if (s.entityGuess?.name) initialNames[s.path] = s.entityGuess.name;
          }
        }
      }
      setSelectedSessions(nonImported);
      setSessionEntityNames(initialNames);
    } catch (err) {
      setBrowseError(err instanceof Error ? err.message : 'Failed to browse sessions');
    } finally {
      setBrowseLoading(false);
    }
  };

  const handleCloseBrowse = () => {
    setSessionBrowse(null);
    setSelectedSessions(new Set());
    setSessionEntityNames({});
    setBrowseError(null);
  };

  const updateSessionEntityName = (sessionPath: string, name: string) => {
    setSessionEntityNames((prev) => ({ ...prev, [sessionPath]: name }));
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

    const imported: Array<{ channelId: string; channelName: string; messageCount: number; artifactCount: number; conversationId: string; entityDisposition?: ResolveDisposition; entityName?: string }> = [];
    const errors: string[] = [];

    for (const sessionPath of selectedSessions) {
      try {
        const confirmedName = sessionEntityNames[sessionPath]?.trim() || undefined;
        const result = await importClaudeCodeSession(sessionPath, undefined, undefined, confirmedName);
        if (result.status === 'success') {
          imported.push({
            channelId: result.data.channelId,
            channelName: result.data.channelName,
            messageCount: result.data.messageCount,
            artifactCount: result.data.artifactCount,
            conversationId: result.data.sessionId || '',
            entityDisposition: result.data.entityDisposition,
            entityName: confirmedName,
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
        projects: [],
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
      ? (sessionBrowse ? selectedSessions.size === 0 : (!sessionPath.trim() && !jsonlFile))
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
                  onClick={handleViewExisting}
                  disabled={loading}
                  className="w-full rounded bg-accent hover:bg-accent-hover px-3 py-2 text-sm font-medium text-white disabled:opacity-50 transition-colors"
                >
                  View existing
                </button>
                <button
                  onClick={handleForkAgain}
                  disabled={loading}
                  className="w-full rounded bg-card border border-line px-3 py-2 text-sm font-medium text-secondary hover:bg-hover disabled:opacity-50 transition-colors"
                >
                  {loading ? 'Importing...' : 'Import as new'}
                </button>
                <button
                  onClick={handleReplace}
                  disabled={loading}
                  className="w-full rounded bg-red-600 hover:bg-red-700 px-3 py-2 text-sm font-medium text-white disabled:opacity-50 transition-colors"
                >
                  {loading ? 'Replacing...' : 'Replace existing'}
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
              <LayerFidelityReadout channelId={result.channelId} />
              <button
                onClick={handleGoToChannel}
                className="w-full rounded bg-accent px-3 py-2 text-sm font-medium text-white hover:bg-accent-hover transition-colors"
              >
                Go to channel
              </button>
            </div>
          ) : bulkResult ? (
            /* claude.ai bulk success state (also covers the all-duplicates
               case — same shape, totalImported is just 0) */
            <div className="space-y-4">
              {bulkResult.totalImported > 0 ? (
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="font-medium">Import complete</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                  </svg>
                  <span className="font-medium">Already imported</span>
                </div>
              )}
              <div className="text-sm text-secondary space-y-1">
                <p><span className="text-muted">Imported:</span> {bulkResult.totalImported} conversation{bulkResult.totalImported !== 1 ? 's' : ''}</p>
                {bulkResult.totalSkipped > 0 && (
                  <p><span className="text-muted">Skipped:</span> {bulkResult.totalSkipped} (duplicate or empty)</p>
                )}
                {bulkResult.projects.filter((p) => p.matched).length > 0 && (
                  <p><span className="text-muted">Attached:</span> {bulkResult.projects.filter((p) => p.matched).length} existing project{bulkResult.projects.filter((p) => p.matched).length !== 1 ? 's' : ''}</p>
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
                      {/* Mint vs. merge reads very differently on purpose — the asymmetry
                          (wrongly-separate is fixable later, wrongly-merged mostly isn't)
                          is exactly what a user should be able to tell apart at a glance. */}
                      {conv.entityDisposition === 'minted' && conv.entityName && (
                        <span className="text-accent ml-2">→ new agent: {conv.entityName}</span>
                      )}
                      {(conv.entityDisposition === 'matched-by-name' || conv.entityDisposition === 'bound-existing') && conv.entityName && (
                        <span className="text-muted ml-2">→ added to {conv.entityName}</span>
                      )}
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
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <label className="text-xs font-medium text-muted uppercase tracking-wider">
                        Sessions ({sessionBrowse.totalSessions} in {sessionBrowse.totalProjects} project{sessionBrowse.totalProjects !== 1 ? 's' : ''})
                      </label>
                      <div className="flex items-center gap-3">
                        {(() => {
                          const importable: string[] = [];
                          for (const p of sessionBrowse.projects) {
                            for (const s of p.sessions) {
                              if (!s.alreadyImported) importable.push(s.path);
                            }
                          }
                          const allSelected = importable.length > 0 && importable.every((p) => selectedSessions.has(p));
                          const noneSelected = importable.every((p) => !selectedSessions.has(p));
                          return importable.length > 1 ? (
                            <>
                              <button
                                type="button"
                                onClick={() => setSelectedSessions(new Set(importable))}
                                disabled={allSelected}
                                className="text-xs text-accent hover:text-accent-hover transition-colors disabled:opacity-40 disabled:cursor-default"
                              >
                                Select all
                              </button>
                              <button
                                type="button"
                                onClick={() => setSelectedSessions(new Set())}
                                disabled={noneSelected}
                                className="text-xs text-accent hover:text-accent-hover transition-colors disabled:opacity-40 disabled:cursor-default"
                              >
                                Unselect all
                              </button>
                            </>
                          ) : null;
                        })()}
                        <button
                          type="button"
                          onClick={handleCloseBrowse}
                          className="text-xs text-accent hover:text-accent-hover transition-colors"
                        >
                          Manual path
                        </button>
                      </div>
                    </div>

                    {browseError && (
                      <div className="rounded bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-3 py-2 text-sm text-red-700 dark:text-red-300">
                        {browseError}
                      </div>
                    )}

                    {/* Group-confirm: when multiple checked sessions independently guess the
                        same name via identity-claim (the system agreeing with itself), offer
                        a one-click fill for all of them rather than N individual confirms.
                        project-name/none guesses never group here — batching weak evidence
                        compounds it into a bigger wrong merge. */}
                    {(() => {
                      const groups: Record<string, string[]> = {};
                      for (const p of sessionBrowse.projects) {
                        for (const s of p.sessions) {
                          if (
                            !s.alreadyImported &&
                            selectedSessions.has(s.path) &&
                            s.entityGuess?.basis === 'identity-claim' &&
                            s.entityGuess.name
                          ) {
                            const key = s.entityGuess.name.trim().toLowerCase();
                            (groups[key] ||= []).push(s.path);
                          }
                        }
                      }
                      const groupable = Object.entries(groups).filter(([, paths]) => paths.length >= 2);
                      if (groupable.length === 0) return null;
                      return (
                        <div className="space-y-1.5">
                          {groupable.map(([key, paths]) => {
                            let displayName = key;
                            for (const p of sessionBrowse.projects) {
                              const hit = p.sessions.find((s) => paths.includes(s.path));
                              if (hit?.entityGuess?.name) { displayName = hit.entityGuess.name; break; }
                            }
                            return (
                              <div
                                key={key}
                                className="flex items-center justify-between gap-2 rounded bg-accent/10 border border-accent/30 px-2.5 py-1.5 text-xs"
                              >
                                <span className="text-secondary">
                                  {paths.length} sessions identify as{' '}
                                  <span className="font-medium text-primary">{displayName}</span> — confirm as one agent?
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setSessionEntityNames((prev) => {
                                      const next = { ...prev };
                                      for (const path of paths) next[path] = displayName;
                                      return next;
                                    })
                                  }
                                  className="shrink-0 text-accent hover:text-accent-hover font-medium"
                                >
                                  Confirm all
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}

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
                                {project.sessions.map((session) => {
                                  const tooltip = `Session ID: ${session.sessionId}\n${formatSize(session.sizeBytes)}\nLast active: ${new Date(session.modifiedAt).toLocaleString()}`;
                                  // I1 (Theseus R38 → Iris, 5/18): include time-of-day in the
                                  // visible date so two sessions modified on the same calendar
                                  // day are visually distinguishable. Server-side already sorts
                                  // newest-first, so list position is also a recency signal.
                                  const modified = new Date(session.modifiedAt);
                                  const dateLabel = modified.toLocaleString(undefined, {
                                    month: 'numeric',
                                    day: 'numeric',
                                    year: 'numeric',
                                    hour: 'numeric',
                                    minute: '2-digit',
                                  });
                                  // turnCount is exact corpus-wide as of the 9/4 cap ruling
                                  // (FINGERPRINT_LINE_CAP 1500 -> 50,000; see docs/scan-cap-latency-2026-09-03.md) --
                                  // no `+` hedge needed. Also the right unit: messageCount counts raw
                                  // JSONL events, not what import persists (see client.ts SessionInfo doc).
                                  const turnCountLabel = session.turnCount !== undefined
                                    ? `${session.turnCount} exchange${session.turnCount === 1 ? '' : 's'}`
                                    : null;
                                  return (
                                  <label
                                    key={session.path}
                                    title={tooltip}
                                    className={`flex items-start gap-2.5 px-3 py-2 pl-8 text-sm cursor-pointer hover:bg-hover transition-colors ${
                                      session.alreadyImported ? 'opacity-60' : ''
                                    }`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={selectedSessions.has(session.path)}
                                      onChange={() => toggleSession(session.path)}
                                      className="mt-0.5 rounded border-line text-accent focus:ring-accent"
                                    />
                                    <div className="flex-1 min-w-0">
                                      {/* Primary line: content fingerprint, or a neutral fallback */}
                                      <div className="text-primary truncate">
                                        {session.firstUserMessage || (
                                          <span className="text-muted italic">No user messages found</span>
                                        )}
                                      </div>
                                      {/* Secondary line: structural metadata */}
                                      <div className="text-xs text-muted flex items-center gap-1.5 flex-wrap">
                                        {turnCountLabel && <span>{turnCountLabel}</span>}
                                        {turnCountLabel && <span aria-hidden>\u00b7</span>}
                                        <span>{dateLabel}</span>
                                        {session.alreadyImported && (
                                          <>
                                            <span aria-hidden>\u00b7</span>
                                            <span className="text-yellow-700 dark:text-yellow-400">
                                              imported{session.existingChannelName ? ` as ${session.existingChannelName}` : ''}
                                            </span>
                                          </>
                                        )}
                                      </div>
                                      {/* Entity confirm field. Free text is primary, prefilled per
                                          basis; leaving it blank is a legitimate choice (binds to the
                                          default agent, same as today). Never rendered for an
                                          already-imported session — nothing left to confirm. */}
                                      {!session.alreadyImported && (
                                        <div
                                          className="w-full mt-1"
                                          onClick={(e) => e.stopPropagation()}
                                          onMouseDown={(e) => e.stopPropagation()}
                                        >
                                          {session.entityGuess?.basis === 'project-name' ? (
                                            <div className="space-y-0.5">
                                              <input
                                                type="text"
                                                value={sessionEntityNames[session.path] ?? ''}
                                                onChange={(e) => updateSessionEntityName(session.path, e.target.value)}
                                                placeholder="Agent name"
                                                className="w-full rounded bg-input border border-amber-400 dark:border-amber-500/70 px-2 py-1 text-xs text-primary placeholder-muted focus:outline-none focus:border-accent"
                                              />
                                              <p className="text-[11px] text-amber-600 dark:text-amber-400">
                                                {session.entityGuess.rationale}
                                              </p>
                                            </div>
                                          ) : (
                                            <input
                                              type="text"
                                              value={sessionEntityNames[session.path] ?? ''}
                                              onChange={(e) => updateSessionEntityName(session.path, e.target.value)}
                                              title={session.entityGuess?.basis === 'identity-claim' ? session.entityGuess.rationale : undefined}
                                              placeholder={
                                                session.entityGuess?.basis === 'identity-claim'
                                                  ? 'Agent name'
                                                  : 'Name this agent, or leave blank for the default agent'
                                              }
                                              className="w-full rounded bg-input border border-line px-2 py-1 text-xs text-primary placeholder-muted focus:outline-none focus:border-accent"
                                            />
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </label>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  /* Manual path input + file upload + browse button */
                  <>
                    {jsonlFile ? (
                      /* Selected JSONL file display */
                      <div>
                        <label className="block text-sm font-medium text-secondary mb-1">
                          Session file
                        </label>
                        <div className="flex items-center justify-between rounded bg-surface px-3 py-2 border border-line">
                          <div className="text-sm min-w-0">
                            <span className="font-medium text-primary truncate">{jsonlFile.name}</span>
                            <span className="text-muted ml-2">({(jsonlFile.size / 1024).toFixed(0)} KB)</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => { setJsonlFile(null); if (jsonlInputRef.current) jsonlInputRef.current.value = ''; }}
                            className="text-xs text-accent hover:text-accent-hover transition-colors ml-2 shrink-0"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Path input + upload option */
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
                            Full path to a Claude Code session file
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

                        {/* Upload divider + file picker */}
                        <div className="mt-3 flex items-center gap-3">
                          <div className="flex-1 border-t border-line" />
                          <span className="text-xs text-muted">or upload a file</span>
                          <div className="flex-1 border-t border-line" />
                        </div>
                        <input
                          ref={jsonlInputRef}
                          type="file"
                          accept=".jsonl"
                          onChange={(e) => {
                            const file = e.target.files?.[0] || null;
                            if (file && !file.name.endsWith('.jsonl')) {
                              setError('Please select a session file (.jsonl).');
                              return;
                            }
                            setError(null);
                            setJsonlFile(file);
                            if (file) setSessionPath('');
                          }}
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => jsonlInputRef.current?.click()}
                          className="mt-2 w-full rounded border-2 border-dashed border-line hover:border-accent px-4 py-3 text-sm text-muted hover:text-secondary transition-colors text-center"
                        >
                          Choose session file
                          <span className="block text-xs mt-0.5">For cloud agent sessions or shared files</span>
                        </button>
                      </div>
                    )}

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
                              <div className="flex items-center gap-3">
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (!preview) return;
                                    const importable = preview.conversations.filter((c) => !c.alreadyImported);
                                    setSelectedIds(new Set(importable.map((c) => c.uuid)));
                                  }}
                                  disabled={selectedIds.size === importableCount}
                                  className="text-xs text-accent hover:text-accent-hover transition-colors disabled:opacity-40 disabled:cursor-default"
                                >
                                  Select all
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setSelectedIds(new Set())}
                                  disabled={selectedIds.size === 0}
                                  className="text-xs text-accent hover:text-accent-hover transition-colors disabled:opacity-40 disabled:cursor-default"
                                >
                                  Unselect all
                                </button>
                              </div>
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
                                    {conv.name}
                                  </div>
                                  <div className="text-xs text-muted flex items-center gap-1.5 flex-wrap">
                                    <span>{conv.messageCount} messages</span>
                                    {willRebranch && (
                                      <span className="text-accent font-medium">
                                        (re-branch)
                                      </span>
                                    )}
                                    {conv.alreadyImported && !isSelected && (
                                      <span className="text-yellow-600 dark:text-yellow-400">
                                        (already imported)
                                      </span>
                                    )}
                                    {preview!.projects.length > 0 && (
                                      <select
                                        value={projectAssignments[conv.uuid] || ''}
                                        onChange={(e) => {
                                          e.stopPropagation();
                                          setProjectAssignments((prev) => {
                                            const next = { ...prev };
                                            if (e.target.value) {
                                              next[conv.uuid] = e.target.value;
                                            } else {
                                              delete next[conv.uuid];
                                            }
                                            return next;
                                          });
                                        }}
                                        onClick={(e) => e.stopPropagation()}
                                        className="ml-auto text-xs bg-input border border-line rounded px-1 py-0.5 text-secondary focus:outline-none focus:border-accent"
                                      >
                                        <option value="">No project</option>
                                        {preview!.projects.map((p) => (
                                          <option key={p.uuid} value={p.uuid}>{p.name}</option>
                                        ))}
                                      </select>
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
                          <div className="text-xs text-muted">
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

/** Shows which context layers were populated after an import */
function LayerFidelityReadout({ channelId }: { channelId: string }) {
  const [layers, setLayers] = useState<Record<string, string> | null>(null);

  useEffect(() => {
    fetch(`/api/channels/${channelId}/prompt-debug`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data?.layers) setLayers(data.layers); })
      .catch(() => {});
  }, [channelId]);

  if (!layers) return null;

  const LAYER_LABELS: Record<string, string> = {
    '1_kitBriefing': 'Kit briefing',
    '2_projectInstructions': 'Project instructions',
    '3_projectMemory': 'Project memory',
    '4_channelAddendum': 'Channel context',
    '5_entityPrompt': 'Entity prompt',
  };

  return (
    <div className="rounded-lg border border-line bg-card p-3">
      <div className="text-xs font-medium text-secondary mb-2">Context layers</div>
      <div className="space-y-1">
        {Object.entries(layers).map(([key, status]) => {
          const isActive = status.startsWith('ACTIVE');
          const label = LAYER_LABELS[key] || key;
          return (
            <div key={key} className="flex items-center gap-2 text-xs">
              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                isActive ? 'bg-green-500' : 'bg-zinc-400'
              }`} />
              <span className="text-secondary">{label}</span>
              <span className="text-muted text-xs truncate ml-auto max-w-[60%] text-right">
                {status.replace(/^(ACTIVE|INACTIVE|EMPTY)\s*—?\s*/, '')}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
