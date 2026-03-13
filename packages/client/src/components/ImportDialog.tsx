import React, { useState, useRef } from 'react';
import { importClaudeCodeSession, importClaudeAiExport, deleteChannelApi } from '../api/client';
import type { ImportResponse, ImportConflict, ClaudeAiImportResponse } from '../api/client';

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

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    setBulkResult(null);
    setConflict(null);

    try {
      if (mode === 'claude-code') {
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
        const importResult = await importClaudeAiExport(zipFile);
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
    if (fileInputRef.current) fileInputRef.current.value = '';
    onClose();
  };

  const switchMode = (newMode: ImportMode) => {
    setMode(newMode);
    setError(null);
    setResult(null);
    setBulkResult(null);
    setConflict(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file && !file.name.endsWith('.zip')) {
      setError('Please select a .zip file');
      setZipFile(null);
      return;
    }
    setError(null);
    setZipFile(file);
  };

  const isSubmitDisabled = loading || (mode === 'claude-code' ? !sessionPath.trim() : !zipFile);

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
                  {/* Drop zone / browse button */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full rounded border-2 border-dashed border-line hover:border-accent px-4 py-6 text-center transition-colors group"
                  >
                    {zipFile ? (
                      <div className="space-y-1">
                        <div className="text-sm font-medium text-primary">{zipFile.name}</div>
                        <div className="text-xs text-muted">{(zipFile.size / 1024 / 1024).toFixed(1)} MB</div>
                      </div>
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
                  {loading ? 'Importing...' : 'Import'}
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
