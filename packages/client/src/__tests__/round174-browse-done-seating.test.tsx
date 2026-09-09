/**
 * Round 174 (Theseus, 2026-09-08) drove a Browse import through "Done" in a real browser
 * and found the primary button discarding what the route had already resolved: with exactly
 * one imported row, there was no ambiguity about what to seat, and "Done" seated nothing
 * anyway — a gesture that looked like it did nothing, recoverable only by a user who knew to
 * reopen the picker. He also found the compose-mode vocabulary split across the two import
 * routes ("Use this agent" manual, "Done" Browse) and named the multi-import case as a real
 * product question, not a defect, but one that should not go *silent* either way it is ruled.
 *
 * Decision (docs/ux/browse-done-seating-2026-09-09.md):
 *   - compose mode, exactly one imported row: the primary button seats it directly and reads
 *     "Use this agent" — the manual path's own words, closing the vocabulary split.
 *   - compose mode, more than one imported row: seats nothing (which of several to seat is a
 *     real choice this fire does not make), stays "Done", and the composition form is told —
 *     it does not go quiet the way it did before this fix.
 *   - outside compose mode: unchanged, always "Done", no seating.
 *
 * These are component-level tests against a mocked API client, same convention as
 * round173-import-identity-on-every-route.test.tsx, which this file sits beside.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChannelSidebar } from '../components/ChannelSidebar';
import { ImportDialog } from '../components/ImportDialog';
import type { Channel, Entity } from '@klatch/shared';
import type { SessionInfo, SessionBrowseResponse } from '../api/client';

vi.mock('../api/client', () => ({
  importClaudeCodeSession: vi.fn(),
  uploadClaudeCodeSession: vi.fn(),
  importClaudeAiExport: vi.fn(),
  previewClaudeAiExport: vi.fn(),
  deleteChannelApi: vi.fn(),
  fetchClaudeCodeSessions: vi.fn(),
  fetchChannelEntities: vi.fn().mockResolvedValue([]),
}));

import { importClaudeCodeSession, fetchClaudeCodeSessions } from '../api/client';

function session(path: string, sessionId: string): SessionInfo {
  return {
    path, sessionId, projectPath: '/proj', projectName: 'proj', sizeBytes: 4096,
    modifiedAt: '2026-09-08T00:00:00Z', alreadyImported: false, messageCount: 12, turnCount: 5,
    firstUserMessage: 'hello', entityGuess: { name: 'Wren', basis: 'identity-claim', rationale: 'said so' },
  };
}

function browseOf(...sessions: SessionInfo[]): SessionBrowseResponse {
  return { projects: [{ projectPath: '/proj', projectName: 'proj', sessions }], totalProjects: 1, totalSessions: sessions.length };
}

const success = (over: Record<string, unknown> = {}) => ({
  status: 'success' as const,
  data: { channelId: 'ch1', channelName: 'sess', messageCount: 10, artifactCount: 0, source: 'claude-code' as const, duplicate: false, ...over },
});

beforeEach(() => {
  cleanup();
  vi.mocked(importClaudeCodeSession).mockReset();
  vi.mocked(fetchClaudeCodeSessions).mockReset();
});

async function runBrowseImport(count: 1 | 2, composeMode: boolean, onImported = vi.fn(), onBulkImported = vi.fn()) {
  const user = userEvent.setup();
  const sessions = count === 1 ? [session('/proj/a.jsonl', 'a')] : [session('/proj/a.jsonl', 'a'), session('/proj/b.jsonl', 'b')];
  vi.mocked(fetchClaudeCodeSessions).mockResolvedValue(browseOf(...sessions));
  vi.mocked(importClaudeCodeSession).mockImplementation(async (path: string) =>
    success({ channelId: `ch-${path}`, channelName: path, entityId: `e-${path}`, entityDisposition: 'minted' }) as never
  );

  render(<ImportDialog isOpen onClose={vi.fn()} onImported={onImported} onBulkImported={onBulkImported} composeMode={composeMode} />);
  await user.click(screen.getByRole('button', { name: /Browse/ }));
  const submit = await screen.findByRole('button', { name: new RegExp(`Import selected \\(${count}\\)`) });
  await user.click(submit);
  await screen.findByText('Import complete');
  return { user, onImported, onBulkImported };
}

describe('Round 174 — the primary button after a Browse import', () => {
  it('compose mode, one imported row: reads "Use this agent" and seats it directly', async () => {
    const { onImported, onBulkImported } = await runBrowseImport(1, true);

    const button = screen.getByRole('button', { name: 'Use this agent' });
    expect(screen.queryByRole('button', { name: 'Done' })).not.toBeInTheDocument();
    fireEvent.click(button);

    expect(onImported).toHaveBeenCalledTimes(1);
    expect(onImported.mock.calls[0][0]).toMatchObject({ channelId: 'ch-/proj/a.jsonl', entityId: 'e-/proj/a.jsonl' });
    expect(onBulkImported).not.toHaveBeenCalled();
  });

  it('compose mode, two imported rows: stays "Done" and seats nothing', async () => {
    const { onImported, onBulkImported } = await runBrowseImport(2, true);

    const button = screen.getByRole('button', { name: 'Done' });
    expect(screen.queryByRole('button', { name: 'Use this agent' })).not.toBeInTheDocument();
    fireEvent.click(button);

    expect(onBulkImported).toHaveBeenCalledWith(2);
    expect(onImported).not.toHaveBeenCalled();
  });

  it('outside compose mode: one imported row still reads "Done"', async () => {
    const { onBulkImported } = await runBrowseImport(1, false);

    expect(screen.getByRole('button', { name: 'Done' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Use this agent' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Done' }));
    expect(onBulkImported).toHaveBeenCalledWith(1);
  });
});

function makeChannel(o: Partial<Channel> & { id: string; name: string }): Channel {
  return { type: 'chat', systemPrompt: '', model: 'claude-opus-4-6', mode: 'panel', createdAt: '2026-03-01T00:00:00Z', ...o };
}

function ent(id: string, name: string): Entity {
  return { id, name, handle: undefined, model: 'claude-opus-4-6', effort: 'high', systemPrompt: '', color: '#111', createdAt: '2026-03-01T00:00:00Z' } as Entity;
}

describe('Round 174 — the multi-import notice on the composition form', () => {
  const baseProps = {
    activeChannelId: 'default',
    onSelectChannel: vi.fn(),
    onCreateChannel: vi.fn(),
    theme: 'light' as const,
    onToggleTheme: vi.fn(),
    channels: [makeChannel({ id: 'default', name: 'general' })],
    entities: [ent('e1', 'Ada')],
    onImportAgent: vi.fn(),
  };

  it('says how many came back, not silence, and seats none of them', () => {
    const { rerender } = render(<ChannelSidebar {...baseProps} />);
    fireEvent.click(screen.getByText('+ New Chat'));

    rerender(<ChannelSidebar {...baseProps} importedAgentId={undefined} importMultipleCount={2} importToken={1} />);

    expect(screen.getByText('Imported 2 agents — pick one from the list to seat it.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Remove/ })).not.toBeInTheDocument();
  });

  it('does not fire on a single-agent import — that path never sets the count', () => {
    const { rerender } = render(<ChannelSidebar {...baseProps} />);
    fireEvent.click(screen.getByText('+ New Chat'));

    rerender(<ChannelSidebar {...baseProps} importedAgentId="e1" importMultipleCount={undefined} importToken={1} />);

    expect(screen.queryByText(/Imported \d+ agents/)).not.toBeInTheDocument();
  });
});
