import React, { useState } from 'react';
import { importClaudeCodeSession } from '../api/client';
import type { ImportResponse } from '../api/client';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onImported: (result: ImportResponse) => void;
}

export function ImportDialog({ isOpen, onClose, onImported }: Props) {
  const [sessionPath, setSessionPath] = useState('');
  const [channelName, setChannelName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResponse | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const path = sessionPath.trim();
    if (!path) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const importResult = await importClaudeCodeSession(path, channelName.trim() || undefined);
      setResult(importResult);
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

  const handleReset = () => {
    setSessionPath('');
    setChannelName('');
    setError(null);
    setResult(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50" onClick={handleReset} />

      {/* Dialog */}
      <div className="relative z-50 bg-card border border-line-strong rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-line">
          <h2 className="text-base font-semibold text-primary">
            Import Claude Code Session
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
          {result ? (
            /* Success state */
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
          ) : (
            /* Input form */
            <form onSubmit={handleSubmit} className="space-y-4">
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

              {error && (
                <div className="rounded bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-3 py-2 text-sm text-red-700 dark:text-red-300">
                  {error}
                </div>
              )}

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={loading || !sessionPath.trim()}
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
