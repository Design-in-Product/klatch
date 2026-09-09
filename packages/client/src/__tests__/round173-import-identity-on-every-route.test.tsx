/**
 * Round 173 — the confirmed name, and the resolved entity, on every route that can carry them.
 *
 * Round 171 fixed the manual import path: it can now name its agent, and `resolveJitSeat`
 * refuses to seat the placeholder the channel hands back when nothing identified a session.
 * Theseus drove two of those routes at the endpoint (Round 172) and left three limits
 * explicitly open, which is what this file closes:
 *
 *   1. `manualEntityName` feeds three call sites (submit, replace, fork-again), each
 *      branching on `jsonlFile`. Exactly one of the six was driven. The other five were
 *      hand-read only — the same standing that hid Round 171.
 *   2. Single-session Browse import was undriven by either of us.
 *
 * (2) turned up a live defect of Round 171's own family, fixed alongside this file: the
 * Browse route recorded `entityDisposition` and `entityName` from each import but dropped
 * the `entityId`, and `handleGoToBulkChannel` passed `onImported` a channel id and nothing
 * else. So every Browse import reached the composition form through App's *fallback*
 * branch, where the only evidence available is the channel's binding — and that binding is
 * `DEFAULT_ENTITY_ID` both for an unidentified import and for a user who confirmed the name
 * "Claude". The manual path tells those apart (Theseus's arm B3). The Browse path could not:
 * it would have reported a deliberately-confirmed Claude as unidentified.
 *
 * These are component-level tests against a mocked API client. They pin what the dialog
 * *sends* and what it *hands the composition form* — not what the server does with it, and
 * not App's wiring, which remains endpoint-driven only.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Mock } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DEFAULT_ENTITY_ID } from '@klatch/shared';
import { ImportDialog } from '../components/ImportDialog';
import { resolveJitSeat } from '../utils/jitSeat';
import type { ImportResponse, SessionInfo, SessionBrowseResponse } from '../api/client';

vi.mock('../api/client', () => ({
  importClaudeCodeSession: vi.fn(),
  uploadClaudeCodeSession: vi.fn(),
  importClaudeAiExport: vi.fn(),
  previewClaudeAiExport: vi.fn(),
  deleteChannelApi: vi.fn(),
  fetchClaudeCodeSessions: vi.fn(),
  fetchChannelEntities: vi.fn().mockResolvedValue([]),
}));

import {
  importClaudeCodeSession,
  uploadClaudeCodeSession,
  deleteChannelApi,
  fetchClaudeCodeSessions,
} from '../api/client';

const PATH = '/path/to/session.jsonl';

const success = (over: Record<string, unknown> = {}) => ({
  status: 'success' as const,
  data: {
    channelId: 'ch1', channelName: 'test-session', messageCount: 10,
    artifactCount: 0, source: 'claude-code' as const, duplicate: false, ...over,
  },
});

const conflict = {
  status: 'conflict' as const,
  conflict: {
    existingChannelId: 'ch-old', existingChannelName: 'old-session',
    existingMessageCount: 4, sessionId: 's1',
  },
};

beforeEach(() => {
  cleanup();
  vi.mocked(importClaudeCodeSession).mockReset();
  vi.mocked(uploadClaudeCodeSession).mockReset();
  vi.mocked(deleteChannelApi).mockReset();
  vi.mocked(fetchClaudeCodeSessions).mockReset();
});

/** Put a .jsonl on the hidden file input the "Choose session file" button clicks. */
async function chooseFile(user: ReturnType<typeof userEvent.setup>) {
  const file = new File(['{"type":"user"}\n'], 'session.jsonl', { type: 'application/jsonl' });
  const input = document.querySelector('input[type="file"][accept=".jsonl"]') as HTMLInputElement;
  await user.upload(input, file);
  await screen.findByText('session.jsonl');
  return file;
}

describe('Round 173 — every route that sends a confirmed name, sends it', () => {
  it('submit · typed path — carries the name (Theseus drove this one at the endpoint)', async () => {
    const user = userEvent.setup();
    vi.mocked(importClaudeCodeSession).mockResolvedValue(success({ entityId: 'e-piper' }));

    render(<ImportDialog isOpen onClose={vi.fn()} onImported={vi.fn()} />);
    await user.type(screen.getByPlaceholderText(/\.jsonl/), PATH);
    await user.type(screen.getByLabelText(/^Agent/), 'Piper Morgan');
    await user.click(screen.getByRole('button', { name: 'Import' }));

    await waitFor(() => expect(importClaudeCodeSession).toHaveBeenCalled());
    expect(vi.mocked(importClaudeCodeSession).mock.calls[0][3]).toBe('Piper Morgan');
  });

  it('submit · uploaded file — carries the name', async () => {
    const user = userEvent.setup();
    vi.mocked(uploadClaudeCodeSession).mockResolvedValue(success({ entityId: 'e-piper' }));

    render(<ImportDialog isOpen onClose={vi.fn()} onImported={vi.fn()} />);
    const file = await chooseFile(user);
    await user.type(screen.getByLabelText(/^Agent/), 'Piper Morgan');
    await user.click(screen.getByRole('button', { name: 'Import' }));

    await waitFor(() => expect(uploadClaudeCodeSession).toHaveBeenCalled());
    expect(vi.mocked(uploadClaudeCodeSession).mock.calls[0]).toEqual([
      file, undefined, undefined, 'Piper Morgan',
    ]);
    expect(importClaudeCodeSession).not.toHaveBeenCalled();
  });

  it('replace · typed path — carries the name through the delete-and-re-import', async () => {
    const user = userEvent.setup();
    vi.mocked(importClaudeCodeSession)
      .mockResolvedValueOnce(conflict as never)
      .mockResolvedValueOnce(success({ entityId: 'e-piper' }));
    vi.mocked(deleteChannelApi).mockResolvedValue(undefined as never);

    render(<ImportDialog isOpen onClose={vi.fn()} onImported={vi.fn()} />);
    await user.type(screen.getByPlaceholderText(/\.jsonl/), PATH);
    await user.type(screen.getByLabelText(/^Agent/), 'Piper Morgan');
    await user.click(screen.getByRole('button', { name: 'Import' }));

    await waitFor(() => expect(screen.getByText('Replace existing')).toBeInTheDocument());
    await user.click(screen.getByText('Replace existing'));

    await waitFor(() => expect(importClaudeCodeSession).toHaveBeenCalledTimes(2));
    const replaceCall = vi.mocked(importClaudeCodeSession).mock.calls[1];
    expect(replaceCall[2]).toBeUndefined();   // not a fork
    expect(replaceCall[3]).toBe('Piper Morgan');
  });

  it('replace · uploaded file — carries the name', async () => {
    const user = userEvent.setup();
    vi.mocked(uploadClaudeCodeSession)
      .mockResolvedValueOnce(conflict as never)
      .mockResolvedValueOnce(success({ entityId: 'e-piper' }));
    vi.mocked(deleteChannelApi).mockResolvedValue(undefined as never);

    render(<ImportDialog isOpen onClose={vi.fn()} onImported={vi.fn()} />);
    const file = await chooseFile(user);
    await user.type(screen.getByLabelText(/^Agent/), 'Piper Morgan');
    await user.click(screen.getByRole('button', { name: 'Import' }));

    await waitFor(() => expect(screen.getByText('Replace existing')).toBeInTheDocument());
    await user.click(screen.getByText('Replace existing'));

    await waitFor(() => expect(uploadClaudeCodeSession).toHaveBeenCalledTimes(2));
    expect(vi.mocked(uploadClaudeCodeSession).mock.calls[1]).toEqual([
      file, undefined, undefined, 'Piper Morgan',
    ]);
  });

  it('fork-again · typed path — carries the name (Round 171 pinned this one)', async () => {
    const user = userEvent.setup();
    vi.mocked(importClaudeCodeSession)
      .mockResolvedValueOnce(conflict as never)
      .mockResolvedValueOnce(success({ entityId: 'e-piper' }));

    render(<ImportDialog isOpen onClose={vi.fn()} onImported={vi.fn()} />);
    await user.type(screen.getByPlaceholderText(/\.jsonl/), PATH);
    await user.type(screen.getByLabelText(/^Agent/), 'Piper Morgan');
    await user.click(screen.getByRole('button', { name: 'Import' }));

    await waitFor(() => expect(screen.getByText(/Already imported/i)).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: 'Import as new' }));

    await waitFor(() => expect(importClaudeCodeSession).toHaveBeenCalledTimes(2));
    expect(vi.mocked(importClaudeCodeSession).mock.calls[1][2]).toBe(true);
    expect(vi.mocked(importClaudeCodeSession).mock.calls[1][3]).toBe('Piper Morgan');
  });

  it('fork-again · uploaded file — carries the name', async () => {
    const user = userEvent.setup();
    vi.mocked(uploadClaudeCodeSession)
      .mockResolvedValueOnce(conflict as never)
      .mockResolvedValueOnce(success({ entityId: 'e-piper' }));

    render(<ImportDialog isOpen onClose={vi.fn()} onImported={vi.fn()} />);
    const file = await chooseFile(user);
    await user.type(screen.getByLabelText(/^Agent/), 'Piper Morgan');
    await user.click(screen.getByRole('button', { name: 'Import' }));

    await waitFor(() => expect(screen.getByText(/Already imported/i)).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: 'Import as new' }));

    await waitFor(() => expect(uploadClaudeCodeSession).toHaveBeenCalledTimes(2));
    expect(vi.mocked(uploadClaudeCodeSession).mock.calls[1]).toEqual([
      file, undefined, true, 'Piper Morgan',
    ]);
  });

  it('blank means "I am not saying" on the upload path too', async () => {
    const user = userEvent.setup();
    vi.mocked(uploadClaudeCodeSession).mockResolvedValue(success());

    render(<ImportDialog isOpen onClose={vi.fn()} onImported={vi.fn()} />);
    await chooseFile(user);
    await user.click(screen.getByRole('button', { name: 'Import' }));

    await waitFor(() => expect(uploadClaudeCodeSession).toHaveBeenCalled());
    expect(vi.mocked(uploadClaudeCodeSession).mock.calls[0][3]).toBeUndefined();
  });
});

describe('Round 173 — the Browse route hands the composition form what the import resolved', () => {
  // Real `SessionBrowseResponse` shape, not an approximation of it — a first draft used
  // `project`/`modified`/`name` and React warned about an undefined list key, which is the
  // browse panel telling the test its mock was wrong. Typed, so the next divergence fails
  // the typecheck instead of whispering in stderr.
  const session: SessionInfo = {
    path: '/proj/sess-a.jsonl',
    sessionId: 'sess-a',
    projectPath: '/proj',
    projectName: 'proj',
    sizeBytes: 4096,
    modifiedAt: '2026-09-08T00:00:00Z',
    alreadyImported: false,
    messageCount: 12,
    turnCount: 5,
    firstUserMessage: 'hello',
    entityGuess: { name: 'Wren', basis: 'identity-claim', rationale: 'said so' },
  };

  const browse: SessionBrowseResponse = {
    projects: [{ projectPath: '/proj', projectName: 'proj', sessions: [session] }],
    totalProjects: 1,
    totalSessions: 1,
  };

  async function importOneFromBrowse(onImported: Mock<(result: ImportResponse) => void>, entityId?: string) {
    const user = userEvent.setup();
    vi.mocked(fetchClaudeCodeSessions).mockResolvedValue(browse);
    vi.mocked(importClaudeCodeSession).mockResolvedValue(
      success({ channelId: 'ch-browse', channelName: 'sess-a', entityId, entityDisposition: 'matched-by-name' })
    );

    render(<ImportDialog isOpen onClose={vi.fn()} onImported={onImported} composeMode />);
    await user.click(screen.getByRole('button', { name: /Browse/ }));
    // The panel auto-selects every not-yet-imported session, so the submit button counts it.
    const submit = await screen.findByRole('button', { name: /Import selected \(1\)/ });
    await user.click(submit);
    // The bulk result lists each imported conversation as its own "go to channel" button.
    await user.click(await screen.findByRole('button', { name: /sess-a/ }));
    return user;
  }

  it('passes the import-resolved entity to onImported, not just a channel id', async () => {
    const onImported = vi.fn<(result: ImportResponse) => void>();
    await importOneFromBrowse(onImported, 'e-wren');

    expect(onImported).toHaveBeenCalledTimes(1);
    expect(onImported.mock.calls[0][0]).toMatchObject({
      channelId: 'ch-browse',
      entityId: 'e-wren',
      source: 'claude-code',
    });
  });

  it('a Browse row that confirmed "Claude" still seats — the defect this closes', async () => {
    const onImported = vi.fn<(result: ImportResponse) => void>();
    // The session's own identity claim resolved to the default entity. `matched-by-name`:
    // the user's choice, not the placeholder. Before this fix `entityId` was dropped here,
    // App fell to the channel-binding fallback, and `resolveJitSeat` — correctly, on the
    // evidence it was given — reported an unidentified import.
    await importOneFromBrowse(onImported, DEFAULT_ENTITY_ID);

    const result = onImported.mock.calls[0][0];
    expect(result.entityId).toBe(DEFAULT_ENTITY_ID);
    expect(resolveJitSeat(result.entityId)).toEqual({ entityId: DEFAULT_ENTITY_ID });
    expect(resolveJitSeat(result.entityId).unidentified).toBeUndefined();
  });

  it('an unidentified Browse import still reaches the fallback and is reported, not seated', async () => {
    const onImported = vi.fn<(result: ImportResponse) => void>();
    await importOneFromBrowse(onImported, undefined);

    const result = onImported.mock.calls[0][0];
    expect(result.entityId).toBeUndefined();
    // App asks the channel, which answers with the placeholder it was bound at creation.
    expect(resolveJitSeat(result.entityId, [{ id: DEFAULT_ENTITY_ID, name: 'Claude' } as never]))
      .toEqual({ unidentified: true });
  });
});
