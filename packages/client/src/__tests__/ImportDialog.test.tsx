import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ImportDialog } from '../components/ImportDialog';

// Mock the API client
vi.mock('../api/client', () => ({
  importClaudeCodeSession: vi.fn(),
  importClaudeAiExport: vi.fn(),
}));

import { importClaudeCodeSession, importClaudeAiExport } from '../api/client';

const defaultProps = {
  isOpen: true,
  onClose: vi.fn(),
  onImported: vi.fn(),
};

beforeEach(() => {
  vi.mocked(importClaudeCodeSession).mockReset();
  vi.mocked(importClaudeAiExport).mockReset();
  defaultProps.onClose = vi.fn();
  defaultProps.onImported = vi.fn();
});

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
      channelId: 'ch1',
      channelName: 'test-session',
      messageCount: 10,
      artifactCount: 3,
      source: 'claude-code',
      duplicate: false,
    });

    render(<ImportDialog {...defaultProps} />);
    await user.type(screen.getByPlaceholderText(/\.jsonl/), '/path/to/session.jsonl');
    await user.click(screen.getByRole('button', { name: 'Import' }));

    expect(importClaudeCodeSession).toHaveBeenCalledWith('/path/to/session.jsonl', undefined);
  });

  it('shows success state after successful import', async () => {
    const user = userEvent.setup();
    vi.mocked(importClaudeCodeSession).mockResolvedValue({
      channelId: 'ch1',
      channelName: 'test-session',
      messageCount: 10,
      artifactCount: 3,
      source: 'claude-code',
      duplicate: false,
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
    vi.mocked(importClaudeCodeSession).mockResolvedValue(result);

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
      channelId: 'ch1',
      channelName: 'my-custom-name',
      messageCount: 5,
      artifactCount: 0,
      source: 'claude-code',
      duplicate: false,
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
    await user.click(screen.getByRole('button', { name: 'claude.ai' }));

    // Simulate file selection
    const file = new File(['zip content'], 'export.zip', { type: 'application/zip' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(input, file);

    await user.click(screen.getByRole('button', { name: 'Import' }));

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
    await user.click(screen.getByRole('button', { name: 'claude.ai' }));

    const file = new File(['zip'], 'export.zip', { type: 'application/zip' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(input, file);
    await user.click(screen.getByRole('button', { name: 'Import' }));

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
    await user.click(screen.getByRole('button', { name: 'claude.ai' }));

    const file = new File(['zip'], 'export.zip', { type: 'application/zip' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(input, file);
    await user.click(screen.getByRole('button', { name: 'Import' }));

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
    await user.click(screen.getByRole('button', { name: 'claude.ai' }));

    const file = new File(['zip'], 'export.zip', { type: 'application/zip' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(input, file);
    await user.click(screen.getByRole('button', { name: 'Import' }));

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
    await user.click(screen.getByRole('button', { name: 'claude.ai' }));

    const file = new File(['zip'], 'export.zip', { type: 'application/zip' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(input, file);
    await user.click(screen.getByRole('button', { name: 'Import' }));

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
    await user.click(screen.getByRole('button', { name: 'claude.ai' }));

    const file = new File(['zip'], 'export.zip', { type: 'application/zip' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(input, file);
    await user.click(screen.getByRole('button', { name: 'Import' }));

    await waitFor(() => {
      expect(screen.getByText('Invalid ZIP file')).toBeInTheDocument();
    });
  });

  it('shows "Importing..." during claude.ai upload', async () => {
    const user = userEvent.setup();
    vi.mocked(importClaudeAiExport).mockReturnValue(new Promise(() => {}));

    render(<ImportDialog {...defaultProps} />);
    await user.click(screen.getByRole('button', { name: 'claude.ai' }));

    const file = new File(['zip'], 'export.zip', { type: 'application/zip' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(input, file);
    await user.click(screen.getByRole('button', { name: 'Import' }));

    expect(screen.getByText('Importing...')).toBeInTheDocument();
  });

  it('shows file name and size after ZIP selection', async () => {
    const user = userEvent.setup();
    render(<ImportDialog {...defaultProps} />);
    await user.click(screen.getByRole('button', { name: 'claude.ai' }));

    const content = new Uint8Array(2 * 1024 * 1024); // 2MB
    const file = new File([content], 'my-export.zip', { type: 'application/zip' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(input, file);

    expect(screen.getByText('my-export.zip')).toBeInTheDocument();
    expect(screen.getByText('2.0 MB')).toBeInTheDocument();
  });
});
