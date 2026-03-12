import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ImportDialog } from '../components/ImportDialog';

// Mock the API client
vi.mock('../api/client', () => ({
  importClaudeCodeSession: vi.fn(),
  importClaudeAiExport: vi.fn(),
}));

import { importClaudeCodeSession } from '../api/client';

const defaultProps = {
  isOpen: true,
  onClose: vi.fn(),
  onImported: vi.fn(),
};

beforeEach(() => {
  vi.mocked(importClaudeCodeSession).mockReset();
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
