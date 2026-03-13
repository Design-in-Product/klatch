import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ImportDialog } from '../components/ImportDialog';

// Mock the API client
vi.mock('../api/client', () => ({
  importClaudeCodeSession: vi.fn(),
  importClaudeAiExport: vi.fn(),
  deleteChannelApi: vi.fn(),
  previewClaudeAiExport: vi.fn(),
}));

import { importClaudeCodeSession, importClaudeAiExport, deleteChannelApi, previewClaudeAiExport } from '../api/client';

const defaultProps = {
  isOpen: true,
  onClose: vi.fn(),
  onImported: vi.fn(),
};

/** Standard preview response for tests */
const mockPreview = {
  conversations: [
    { uuid: 'c1', name: 'React Chat', messageCount: 10, createdAt: '', updatedAt: '', alreadyImported: false },
    { uuid: 'c2', name: 'Python Help', messageCount: 5, createdAt: '', updatedAt: '', alreadyImported: false },
  ],
  projects: [],
  memories: [],
};

beforeEach(() => {
  vi.mocked(importClaudeCodeSession).mockReset();
  vi.mocked(importClaudeAiExport).mockReset();
  vi.mocked(deleteChannelApi).mockReset();
  vi.mocked(previewClaudeAiExport).mockReset();
  defaultProps.onClose = vi.fn();
  defaultProps.onImported = vi.fn();
});

/** Helper: switch to claude.ai mode, upload a file, and wait for preview to load */
async function uploadZipWithPreview(user: ReturnType<typeof userEvent.setup>, preview = mockPreview) {
  vi.mocked(previewClaudeAiExport).mockResolvedValue(preview);

  await user.click(screen.getByRole('button', { name: 'claude.ai' }));

  const file = new File(['zip content'], 'export.zip', { type: 'application/zip' });
  const input = document.querySelector('input[type="file"]') as HTMLInputElement;
  await user.upload(input, file);

  // Wait for preview to load
  await waitFor(() => {
    expect(screen.getByText('export.zip')).toBeInTheDocument();
  });
}

describe('ImportDialog', () => {
  it('renders nothing when isOpen is false', () => {
    const { container } = render(<ImportDialog {...defaultProps} isOpen={false} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders the dialog when isOpen is true', () => {
    render(<ImportDialog {...defaultProps} />);
    expect(screen.getByRole('heading', { name: 'Import' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/\.jsonl/)).toBeInTheDocument();
  });

  it('disables Import button when session path is empty', () => {
    render(<ImportDialog {...defaultProps} />);
    expect(screen.getByRole('button', { name: 'Import' })).toBeDisabled();
  });

  it('enables Import button when session path is entered', async () => {
    const user = userEvent.setup();
    render(<ImportDialog {...defaultProps} />);

    await user.type(screen.getByPlaceholderText(/\.jsonl/), '/path/to/session.jsonl');
    expect(screen.getByRole('button', { name: 'Import' })).not.toBeDisabled();
  });

  it('calls importClaudeCodeSession on submit', async () => {
    const user = userEvent.setup();
    vi.mocked(importClaudeCodeSession).mockResolvedValue({
      status: 'success',
      data: {
        channelId: 'ch1',
        channelName: 'test-session',
        messageCount: 10,
        artifactCount: 3,
        source: 'claude-code',
        duplicate: false,
      },
    });

    render(<ImportDialog {...defaultProps} />);
    await user.type(screen.getByPlaceholderText(/\.jsonl/), '/path/to/session.jsonl');
    await user.click(screen.getByRole('button', { name: 'Import' }));

    expect(importClaudeCodeSession).toHaveBeenCalledWith('/path/to/session.jsonl', undefined);
  });

  it('shows success state after successful import', async () => {
    const user = userEvent.setup();
    vi.mocked(importClaudeCodeSession).mockResolvedValue({
      status: 'success',
      data: {
        channelId: 'ch1',
        channelName: 'test-session',
        messageCount: 10,
        artifactCount: 3,
        source: 'claude-code',
        duplicate: false,
      },
    });

    render(<ImportDialog {...defaultProps} />);
    await user.type(screen.getByPlaceholderText(/\.jsonl/), '/path/to/session.jsonl');
    await user.click(screen.getByRole('button', { name: 'Import' }));

    await waitFor(() => {
      expect(screen.getByText('Import successful')).toBeInTheDocument();
    });
    expect(screen.getByText('test-session')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('Go to channel')).toBeInTheDocument();
  });

  it('shows error state on import failure', async () => {
    const user = userEvent.setup();
    vi.mocked(importClaudeCodeSession).mockRejectedValue(new Error('File not found'));

    render(<ImportDialog {...defaultProps} />);
    await user.type(screen.getByPlaceholderText(/\.jsonl/), '/bad/path.jsonl');
    await user.click(screen.getByRole('button', { name: 'Import' }));

    await waitFor(() => {
      expect(screen.getByText('File not found')).toBeInTheDocument();
    });
  });

  it('shows "Importing..." during loading', async () => {
    const user = userEvent.setup();
    // Never-resolving promise to keep loading state
    vi.mocked(importClaudeCodeSession).mockReturnValue(new Promise(() => {}));

    render(<ImportDialog {...defaultProps} />);
    await user.type(screen.getByPlaceholderText(/\.jsonl/), '/path/to/session.jsonl');
    await user.click(screen.getByRole('button', { name: 'Import' }));

    expect(screen.getByText('Importing...')).toBeInTheDocument();
  });

  it('calls onImported and closes when "Go to channel" is clicked', async () => {
    const user = userEvent.setup();
    const onImported = vi.fn();
    const onClose = vi.fn();
    const result = {
      channelId: 'ch1',
      channelName: 'test-session',
      messageCount: 10,
      artifactCount: 3,
      source: 'claude-code' as const,
      duplicate: false,
    };
    vi.mocked(importClaudeCodeSession).mockResolvedValue({ status: 'success', data: result });

    render(<ImportDialog isOpen={true} onClose={onClose} onImported={onImported} />);
    await user.type(screen.getByPlaceholderText(/\.jsonl/), '/path/to/session.jsonl');
    await user.click(screen.getByRole('button', { name: 'Import' }));

    await waitFor(() => {
      expect(screen.getByText('Go to channel')).toBeInTheDocument();
    });
    await user.click(screen.getByText('Go to channel'));

    expect(onImported).toHaveBeenCalledWith(result);
    expect(onClose).toHaveBeenCalled();
  });

  it('passes custom channel name to API when provided', async () => {
    const user = userEvent.setup();
    vi.mocked(importClaudeCodeSession).mockResolvedValue({
      status: 'success',
      data: {
        channelId: 'ch1',
        channelName: 'my-custom-name',
        messageCount: 5,
        artifactCount: 0,
        source: 'claude-code',
        duplicate: false,
      },
    });

    render(<ImportDialog {...defaultProps} />);
    await user.type(screen.getByPlaceholderText(/\.jsonl/), '/path/to/session.jsonl');
    await user.type(screen.getByPlaceholderText(/Auto-generated/), 'my-custom-name');
    await user.click(screen.getByRole('button', { name: 'Import' }));

    expect(importClaudeCodeSession).toHaveBeenCalledWith('/path/to/session.jsonl', 'my-custom-name');
  });

  it('resets state and closes when Cancel is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<ImportDialog isOpen={true} onClose={onClose} onImported={vi.fn()} />);

    await user.type(screen.getByPlaceholderText(/\.jsonl/), '/some/path.jsonl');
    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onClose).toHaveBeenCalled();
  });
});

// ── claude.ai mode ────────────────────────────────────────────

describe('ImportDialog — claude.ai mode', () => {
  it('shows mode toggle with Claude Code and claude.ai buttons', () => {
    render(<ImportDialog {...defaultProps} />);
    expect(screen.getByRole('button', { name: 'Claude Code' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'claude.ai' })).toBeInTheDocument();
  });

  it('defaults to Claude Code mode (shows JSONL input)', () => {
    render(<ImportDialog {...defaultProps} />);
    expect(screen.getByPlaceholderText(/\.jsonl/)).toBeInTheDocument();
  });

  it('switches to claude.ai mode when toggle is clicked', async () => {
    const user = userEvent.setup();
    render(<ImportDialog {...defaultProps} />);

    await user.click(screen.getByRole('button', { name: 'claude.ai' }));

    // Should show ZIP file picker text, not JSONL input
    expect(screen.queryByPlaceholderText(/\.jsonl/)).not.toBeInTheDocument();
    expect(screen.getByText('Choose ZIP file')).toBeInTheDocument();
  });

  it('switches back to Claude Code mode', async () => {
    const user = userEvent.setup();
    render(<ImportDialog {...defaultProps} />);

    await user.click(screen.getByRole('button', { name: 'claude.ai' }));
    await user.click(screen.getByRole('button', { name: 'Claude Code' }));

    expect(screen.getByPlaceholderText(/\.jsonl/)).toBeInTheDocument();
    expect(screen.queryByText('Choose ZIP file')).not.toBeInTheDocument();
  });

  it('clears errors when switching modes', async () => {
    const user = userEvent.setup();
    vi.mocked(importClaudeCodeSession).mockRejectedValue(new Error('Bad file'));

    render(<ImportDialog {...defaultProps} />);
    await user.type(screen.getByPlaceholderText(/\.jsonl/), '/bad.jsonl');
    await user.click(screen.getByRole('button', { name: 'Import' }));

    await waitFor(() => {
      expect(screen.getByText('Bad file')).toBeInTheDocument();
    });

    // Switch to claude.ai mode — error should be cleared
    await user.click(screen.getByRole('button', { name: 'claude.ai' }));
    expect(screen.queryByText('Bad file')).not.toBeInTheDocument();
  });

  it('disables Import button when no ZIP file is selected', async () => {
    const user = userEvent.setup();
    render(<ImportDialog {...defaultProps} />);

    await user.click(screen.getByRole('button', { name: 'claude.ai' }));
    expect(screen.getByRole('button', { name: 'Import' })).toBeDisabled();
  });

  it('shows bulk success state after claude.ai import', async () => {
    const user = userEvent.setup();
    vi.mocked(importClaudeAiExport).mockResolvedValue({
      imported: [
        { channelId: 'ch1', channelName: 'React Chat', messageCount: 10, artifactCount: 2, conversationId: 'c1' },
        { channelId: 'ch2', channelName: 'Python Help', messageCount: 5, artifactCount: 0, conversationId: 'c2' },
      ],
      skipped: [],
      totalImported: 2,
      totalSkipped: 0,
    });

    render(<ImportDialog {...defaultProps} />);
    await uploadZipWithPreview(user);

    // Click the "Import selected" button
    const importBtn = screen.getByRole('button', { name: /Import selected/ });
    await user.click(importBtn);

    await waitFor(() => {
      expect(screen.getByText('Import complete')).toBeInTheDocument();
    });
    expect(screen.getByText('2 conversations')).toBeInTheDocument();
    expect(screen.getByText('React Chat')).toBeInTheDocument();
    expect(screen.getByText('Python Help')).toBeInTheDocument();
    expect(screen.getByText('Done')).toBeInTheDocument();
  });

  it('shows skipped count in bulk success state', async () => {
    const user = userEvent.setup();
    vi.mocked(importClaudeAiExport).mockResolvedValue({
      imported: [
        { channelId: 'ch1', channelName: 'New Chat', messageCount: 8, artifactCount: 0, conversationId: 'c1' },
      ],
      skipped: [{ conversationId: 'c2', reason: 'duplicate' }],
      totalImported: 1,
      totalSkipped: 1,
    });

    render(<ImportDialog {...defaultProps} />);
    await uploadZipWithPreview(user);
    await user.click(screen.getByRole('button', { name: /Import selected/ }));

    await waitFor(() => {
      expect(screen.getByText('Import complete')).toBeInTheDocument();
    });
    expect(screen.getByText(/1.*\(duplicate or empty\)/)).toBeInTheDocument();
  });

  it('navigates to channel when clicking an imported conversation', async () => {
    const user = userEvent.setup();
    const onImported = vi.fn();
    vi.mocked(importClaudeAiExport).mockResolvedValue({
      imported: [
        { channelId: 'ch-nav', channelName: 'Navigate Me', messageCount: 3, artifactCount: 0, conversationId: 'c1' },
      ],
      skipped: [],
      totalImported: 1,
      totalSkipped: 0,
    });

    render(<ImportDialog isOpen={true} onClose={vi.fn()} onImported={onImported} />);
    await uploadZipWithPreview(user);
    await user.click(screen.getByRole('button', { name: /Import selected/ }));

    await waitFor(() => {
      expect(screen.getByText('Navigate Me')).toBeInTheDocument();
    });
    await user.click(screen.getByText('Navigate Me'));

    expect(onImported).toHaveBeenCalledWith(expect.objectContaining({ channelId: 'ch-nav' }));
  });

  it('calls onBulkImported when Done button is clicked', async () => {
    const user = userEvent.setup();
    const onBulkImported = vi.fn();
    vi.mocked(importClaudeAiExport).mockResolvedValue({
      imported: [
        { channelId: 'ch1', channelName: 'Chat', messageCount: 5, artifactCount: 0, conversationId: 'c1' },
      ],
      skipped: [],
      totalImported: 1,
      totalSkipped: 0,
    });

    render(<ImportDialog isOpen={true} onClose={vi.fn()} onImported={vi.fn()} onBulkImported={onBulkImported} />);
    await uploadZipWithPreview(user);
    await user.click(screen.getByRole('button', { name: /Import selected/ }));

    await waitFor(() => {
      expect(screen.getByText('Done')).toBeInTheDocument();
    });
    await user.click(screen.getByText('Done'));

    expect(onBulkImported).toHaveBeenCalled();
  });

  it('hides mode toggle during success state', async () => {
    const user = userEvent.setup();
    vi.mocked(importClaudeAiExport).mockResolvedValue({
      imported: [
        { channelId: 'ch1', channelName: 'Chat', messageCount: 5, artifactCount: 0, conversationId: 'c1' },
      ],
      skipped: [],
      totalImported: 1,
      totalSkipped: 0,
    });

    render(<ImportDialog {...defaultProps} />);
    await uploadZipWithPreview(user);
    await user.click(screen.getByRole('button', { name: /Import selected/ }));

    await waitFor(() => {
      expect(screen.getByText('Import complete')).toBeInTheDocument();
    });

    // Mode toggle buttons should be hidden during success state
    expect(screen.queryByRole('button', { name: 'Claude Code' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'claude.ai' })).not.toBeInTheDocument();
  });

  it('shows error state on claude.ai import failure', async () => {
    const user = userEvent.setup();
    vi.mocked(importClaudeAiExport).mockRejectedValue(new Error('Invalid ZIP file'));

    render(<ImportDialog {...defaultProps} />);
    await uploadZipWithPreview(user);
    await user.click(screen.getByRole('button', { name: /Import selected/ }));

    await waitFor(() => {
      expect(screen.getByText('Invalid ZIP file')).toBeInTheDocument();
    });
  });

  it('shows "Importing..." during claude.ai upload', async () => {
    const user = userEvent.setup();
    vi.mocked(importClaudeAiExport).mockReturnValue(new Promise(() => {}));

    render(<ImportDialog {...defaultProps} />);
    await uploadZipWithPreview(user);
    await user.click(screen.getByRole('button', { name: /Import selected/ }));

    expect(screen.getByText('Importing...')).toBeInTheDocument();
  });

  it('shows file name and size after ZIP selection with preview', async () => {
    const user = userEvent.setup();
    render(<ImportDialog {...defaultProps} />);
    await uploadZipWithPreview(user);

    expect(screen.getByText('export.zip')).toBeInTheDocument();
  });
});

// ── Selective import browse UI ──────────────────────────────

describe('ImportDialog — selective import browse UI', () => {
  it('shows conversation list after file selection', async () => {
    const user = userEvent.setup();
    render(<ImportDialog {...defaultProps} />);
    await uploadZipWithPreview(user);

    expect(screen.getByText('React Chat')).toBeInTheDocument();
    expect(screen.getByText('Python Help')).toBeInTheDocument();
    expect(screen.getByText(/10 messages/)).toBeInTheDocument();
    expect(screen.getByText(/5 messages/)).toBeInTheDocument();
  });

  it('pre-selects all non-imported conversations', async () => {
    const user = userEvent.setup();
    render(<ImportDialog {...defaultProps} />);
    await uploadZipWithPreview(user);

    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes).toHaveLength(2);
    expect(checkboxes[0]).toBeChecked();
    expect(checkboxes[1]).toBeChecked();
  });

  it('shows "Import selected (N)" button with count', async () => {
    const user = userEvent.setup();
    render(<ImportDialog {...defaultProps} />);
    await uploadZipWithPreview(user);

    expect(screen.getByRole('button', { name: 'Import selected (2)' })).toBeInTheDocument();
  });

  it('updates count when toggling checkboxes', async () => {
    const user = userEvent.setup();
    render(<ImportDialog {...defaultProps} />);
    await uploadZipWithPreview(user);

    // Uncheck one
    const checkboxes = screen.getAllByRole('checkbox');
    await user.click(checkboxes[0]);

    expect(screen.getByRole('button', { name: 'Import selected (1)' })).toBeInTheDocument();
  });

  it('disables import when no conversations are selected', async () => {
    const user = userEvent.setup();
    render(<ImportDialog {...defaultProps} />);
    await uploadZipWithPreview(user);

    // Uncheck all
    const checkboxes = screen.getAllByRole('checkbox');
    await user.click(checkboxes[0]);
    await user.click(checkboxes[1]);

    const importBtn = screen.getByRole('button', { name: /Import selected \(0\)/ });
    expect(importBtn).toBeDisabled();
  });

  it('shows already-imported conversations as grayed with label', async () => {
    const user = userEvent.setup();
    render(<ImportDialog {...defaultProps} />);

    const previewWithDup = {
      ...mockPreview,
      conversations: [
        { uuid: 'c1', name: 'Already Here', messageCount: 10, createdAt: '', updatedAt: '', alreadyImported: true, existingChannelId: 'ch-old' },
        { uuid: 'c2', name: 'New One', messageCount: 5, createdAt: '', updatedAt: '', alreadyImported: false },
      ],
    };
    await uploadZipWithPreview(user, previewWithDup);

    expect(screen.getByText('(already imported)')).toBeInTheDocument();
    // Already imported checkbox should be disabled and unchecked
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes[0]).toBeDisabled();
    expect(checkboxes[0]).not.toBeChecked();
    // New one should be checked
    expect(checkboxes[1]).toBeChecked();
  });

  it('passes selectedConversationIds to import API', async () => {
    const user = userEvent.setup();
    vi.mocked(importClaudeAiExport).mockResolvedValue({
      imported: [{ channelId: 'ch1', channelName: 'React Chat', messageCount: 10, artifactCount: 0, conversationId: 'c1' }],
      skipped: [],
      totalImported: 1,
      totalSkipped: 0,
    });

    render(<ImportDialog {...defaultProps} />);
    await uploadZipWithPreview(user);

    // Uncheck second conversation
    const checkboxes = screen.getAllByRole('checkbox');
    await user.click(checkboxes[1]);

    await user.click(screen.getByRole('button', { name: 'Import selected (1)' }));

    await waitFor(() => {
      expect(importClaudeAiExport).toHaveBeenCalled();
    });
    // Should pass only the selected ID
    const callArgs = vi.mocked(importClaudeAiExport).mock.calls[0];
    expect(callArgs[1]).toEqual(['c1']);
  });

  it('shows Select all / Deselect all toggle', async () => {
    const user = userEvent.setup();
    render(<ImportDialog {...defaultProps} />);
    await uploadZipWithPreview(user);

    // All selected → shows "Deselect all"
    expect(screen.getByText('Deselect all')).toBeInTheDocument();

    // Click deselect all
    await user.click(screen.getByText('Deselect all'));

    // Now shows "Select all"
    expect(screen.getByText('Select all')).toBeInTheDocument();
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes[0]).not.toBeChecked();
    expect(checkboxes[1]).not.toBeChecked();

    // Click select all
    await user.click(screen.getByText('Select all'));
    expect(checkboxes[0]).toBeChecked();
    expect(checkboxes[1]).toBeChecked();
  });

  it('shows preview loading state', async () => {
    const user = userEvent.setup();
    // Never-resolving preview
    vi.mocked(previewClaudeAiExport).mockReturnValue(new Promise(() => {}));

    render(<ImportDialog {...defaultProps} />);
    await user.click(screen.getByRole('button', { name: 'claude.ai' }));

    const file = new File(['zip'], 'export.zip', { type: 'application/zip' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(input, file);

    expect(screen.getByText('Loading preview...')).toBeInTheDocument();
  });

  it('shows preview error when preview fails', async () => {
    const user = userEvent.setup();
    vi.mocked(previewClaudeAiExport).mockRejectedValue(new Error('Corrupt ZIP'));

    render(<ImportDialog {...defaultProps} />);
    await user.click(screen.getByRole('button', { name: 'claude.ai' }));

    const file = new File(['zip'], 'export.zip', { type: 'application/zip' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(input, file);

    await waitFor(() => {
      expect(screen.getByText('Corrupt ZIP')).toBeInTheDocument();
    });
  });

  it('shows project info line when projects are present', async () => {
    const user = userEvent.setup();
    render(<ImportDialog {...defaultProps} />);

    const previewWithProjects = {
      ...mockPreview,
      projects: [
        { uuid: 'p1', name: 'My Project', documentCount: 3 },
      ],
    };
    await uploadZipWithPreview(user, previewWithProjects);

    expect(screen.getByText(/1 project with knowledge docs/)).toBeInTheDocument();
  });

  it('shows memories info line when memories are present', async () => {
    const user = userEvent.setup();
    render(<ImportDialog {...defaultProps} />);

    const previewWithMemories = {
      ...mockPreview,
      memories: [
        { uuid: 'm1', content: 'Remember this', createdAt: '' },
        { uuid: 'm2', content: 'And this', createdAt: '' },
      ],
    };
    await uploadZipWithPreview(user, previewWithMemories);

    expect(screen.getByText(/2 memories/)).toBeInTheDocument();
  });

  it('shows conversation header with count', async () => {
    const user = userEvent.setup();
    render(<ImportDialog {...defaultProps} />);
    await uploadZipWithPreview(user);

    expect(screen.getByText('Conversations (2)')).toBeInTheDocument();
  });

  it('shows project name prefix on conversations that belong to a project', async () => {
    const user = userEvent.setup();
    render(<ImportDialog {...defaultProps} />);

    const previewWithProject = {
      ...mockPreview,
      conversations: [
        { uuid: 'c1', name: 'Architecture Chat', messageCount: 10, createdAt: '', updatedAt: '', alreadyImported: false, projectName: 'Klatch' },
      ],
    };
    await uploadZipWithPreview(user, previewWithProject);

    expect(screen.getByText(/Klatch: Architecture Chat/)).toBeInTheDocument();
  });
});

// ── Conflict resolution (re-import) ────────────────────────────

describe('ImportDialog — conflict resolution', () => {
  const conflictData = {
    error: 'duplicate' as const,
    existingChannelId: 'ch-existing',
    existingChannelName: 'Daedalus — 2026-03-07',
    existingMessageCount: 47,
    hasNewMessages: false,
    nativeMessageCount: 0,
    sessionId: 'sess-123',
  };

  it('shows conflict UI when import returns duplicate', async () => {
    const user = userEvent.setup();
    vi.mocked(importClaudeCodeSession).mockResolvedValue({
      status: 'conflict',
      conflict: conflictData,
    });

    render(<ImportDialog {...defaultProps} />);
    await user.type(screen.getByPlaceholderText(/\.jsonl/), '/path/to/session.jsonl');
    await user.click(screen.getByRole('button', { name: 'Import' }));

    await waitFor(() => {
      expect(screen.getByText('Already imported')).toBeInTheDocument();
    });
    expect(screen.getByText('Daedalus — 2026-03-07')).toBeInTheDocument();
    expect(screen.getByText('47')).toBeInTheDocument();
    expect(screen.getByText('Replace existing')).toBeInTheDocument();
    expect(screen.getByText('Import as new')).toBeInTheDocument();
  });

  it('shows warning when channel has new messages', async () => {
    const user = userEvent.setup();
    vi.mocked(importClaudeCodeSession).mockResolvedValue({
      status: 'conflict',
      conflict: { ...conflictData, hasNewMessages: true, nativeMessageCount: 5 },
    });

    render(<ImportDialog {...defaultProps} />);
    await user.type(screen.getByPlaceholderText(/\.jsonl/), '/path/to/session.jsonl');
    await user.click(screen.getByRole('button', { name: 'Import' }));

    await waitFor(() => {
      expect(screen.getByText('Already imported')).toBeInTheDocument();
    });
    expect(screen.getByText(/5 messages added since import/)).toBeInTheDocument();
  });

  it('hides mode toggle during conflict state', async () => {
    const user = userEvent.setup();
    vi.mocked(importClaudeCodeSession).mockResolvedValue({
      status: 'conflict',
      conflict: conflictData,
    });

    render(<ImportDialog {...defaultProps} />);
    await user.type(screen.getByPlaceholderText(/\.jsonl/), '/path/to/session.jsonl');
    await user.click(screen.getByRole('button', { name: 'Import' }));

    await waitFor(() => {
      expect(screen.getByText('Already imported')).toBeInTheDocument();
    });
    expect(screen.queryByRole('button', { name: 'Claude Code' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'claude.ai' })).not.toBeInTheDocument();
  });

  it('Replace deletes existing and re-imports', async () => {
    const user = userEvent.setup();
    vi.mocked(importClaudeCodeSession)
      .mockResolvedValueOnce({ status: 'conflict', conflict: conflictData })
      .mockResolvedValueOnce({
        status: 'success',
        data: { channelId: 'ch-new', channelName: 'Daedalus — 2026-03-07', messageCount: 47, artifactCount: 0, source: 'claude-code', duplicate: false },
      });
    vi.mocked(deleteChannelApi).mockResolvedValue(undefined);
    const onChannelDeleted = vi.fn();

    render(<ImportDialog {...defaultProps} onChannelDeleted={onChannelDeleted} />);
    await user.type(screen.getByPlaceholderText(/\.jsonl/), '/path/to/session.jsonl');
    await user.click(screen.getByRole('button', { name: 'Import' }));

    await waitFor(() => {
      expect(screen.getByText('Replace existing')).toBeInTheDocument();
    });
    await user.click(screen.getByText('Replace existing'));

    await waitFor(() => {
      expect(screen.getByText('Import successful')).toBeInTheDocument();
    });
    expect(deleteChannelApi).toHaveBeenCalledWith('ch-existing');
    expect(onChannelDeleted).toHaveBeenCalledWith('ch-existing');
  });

  it('Import as new calls forceImport and shows success', async () => {
    const user = userEvent.setup();
    vi.mocked(importClaudeCodeSession)
      .mockResolvedValueOnce({ status: 'conflict', conflict: conflictData })
      .mockResolvedValueOnce({
        status: 'success',
        data: { channelId: 'ch-fork', channelName: 'Daedalus — 2026-03-07 (2)', messageCount: 47, artifactCount: 0, source: 'claude-code', duplicate: false },
      });

    render(<ImportDialog {...defaultProps} />);
    await user.type(screen.getByPlaceholderText(/\.jsonl/), '/path/to/session.jsonl');
    await user.click(screen.getByRole('button', { name: 'Import' }));

    await waitFor(() => {
      expect(screen.getByText('Import as new')).toBeInTheDocument();
    });
    await user.click(screen.getByText('Import as new'));

    await waitFor(() => {
      expect(screen.getByText('Import successful')).toBeInTheDocument();
    });
    // Second call should have forceImport = true
    expect(importClaudeCodeSession).toHaveBeenCalledTimes(2);
    expect(importClaudeCodeSession).toHaveBeenLastCalledWith('/path/to/session.jsonl', undefined, true);
  });

  it('Cancel from conflict state closes dialog', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    vi.mocked(importClaudeCodeSession).mockResolvedValue({
      status: 'conflict',
      conflict: conflictData,
    });

    render(<ImportDialog isOpen={true} onClose={onClose} onImported={vi.fn()} />);
    await user.type(screen.getByPlaceholderText(/\.jsonl/), '/path/to/session.jsonl');
    await user.click(screen.getByRole('button', { name: 'Import' }));

    await waitFor(() => {
      expect(screen.getByText('Already imported')).toBeInTheDocument();
    });
    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onClose).toHaveBeenCalled();
  });
});
