import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChannelSidebar } from '../components/ChannelSidebar';
import type { Channel } from '@klatch/shared';

// ── Helpers ──────────────────────────────────────────────────

function makeChannel(overrides: Partial<Channel> & { id: string; name: string }): Channel {
  return {
    systemPrompt: '',
    model: 'claude-opus-4-6',
    mode: 'panel',
    createdAt: '2026-03-01T00:00:00Z',
    ...overrides,
  };
}

const defaultProps = {
  activeChannelId: 'default',
  onSelectChannel: vi.fn(),
  onCreateChannel: vi.fn(),
  theme: 'light' as const,
  onToggleTheme: vi.fn(),
};

// ── Rendering ────────────────────────────────────────────────

describe('ChannelSidebar', () => {
  it('renders the #general channel when present', () => {
    const channels = [makeChannel({ id: 'default', name: 'general' })];
    render(<ChannelSidebar {...defaultProps} channels={channels} />);
    expect(screen.getByText('general')).toBeInTheDocument();
  });

  it('shows "No channels yet" when channel list is empty', () => {
    render(<ChannelSidebar {...defaultProps} channels={[]} />);
    expect(screen.getByText('No channels yet')).toBeInTheDocument();
  });

  it('highlights the active channel', () => {
    const channels = [
      makeChannel({ id: 'default', name: 'general' }),
      makeChannel({ id: 'ch2', name: 'other' }),
    ];
    render(<ChannelSidebar {...defaultProps} channels={channels} activeChannelId="ch2" />);

    // The active channel button should have the active class
    const activeBtn = screen.getByText('other').closest('button');
    expect(activeBtn?.className).toContain('bg-active-channel');
  });

  it('calls onSelectChannel when a channel is clicked', async () => {
    const user = userEvent.setup();
    const onSelectChannel = vi.fn();
    const channels = [
      makeChannel({ id: 'default', name: 'general' }),
      makeChannel({ id: 'ch2', name: 'other' }),
    ];
    render(
      <ChannelSidebar {...defaultProps} channels={channels} onSelectChannel={onSelectChannel} />
    );

    await user.click(screen.getByText('other'));
    expect(onSelectChannel).toHaveBeenCalledWith('ch2');
  });

  // ── Project grouping ────────────────────────────────────────

  it('groups imported channels by project', () => {
    const channels = [
      makeChannel({ id: 'default', name: 'general' }),
      makeChannel({
        id: 'imp1',
        name: 'session-1',
        source: 'claude-code',
        sourceMetadata: JSON.stringify({ cwd: '/home/user/klatch' }),
      }),
      makeChannel({
        id: 'imp2',
        name: 'session-2',
        source: 'claude-code',
        sourceMetadata: JSON.stringify({ cwd: '/home/user/klatch' }),
      }),
    ];
    render(<ChannelSidebar {...defaultProps} channels={channels} />);

    // Project group header should show the project name (last path component)
    expect(screen.getByText('klatch')).toBeInTheDocument();
    // Channel count
    expect(screen.getByText('(2)')).toBeInTheDocument();
  });

  it('shows CC badge for Claude Code imported channels', () => {
    const channels = [
      makeChannel({
        id: 'imp1',
        name: 'imported-session',
        source: 'claude-code',
        sourceMetadata: JSON.stringify({ cwd: '/tmp/project' }),
      }),
    ];
    render(<ChannelSidebar {...defaultProps} channels={channels} />);
    expect(screen.getByText('CC')).toBeInTheDocument();
  });

  it('separates roles (1 entity) from group chats (2+ entities)', () => {
    const channels = [
      makeChannel({ id: 'default', name: 'general' }),
      makeChannel({ id: 'role1', name: 'code-reviewer', entityCount: 1 }),
      makeChannel({ id: 'group1', name: 'brainstorm', entityCount: 3 }),
    ];
    render(<ChannelSidebar {...defaultProps} channels={channels} />);

    expect(screen.getByText('Roles')).toBeInTheDocument();
    expect(screen.getByText('Channels')).toBeInTheDocument();
  });

  // ── Section collapse ────────────────────────────────────────

  it('collapses and expands a section on click', async () => {
    const user = userEvent.setup();
    const channels = [
      makeChannel({ id: 'default', name: 'general' }),
      makeChannel({ id: 'role1', name: 'code-reviewer', entityCount: 1 }),
    ];
    render(<ChannelSidebar {...defaultProps} channels={channels} />);

    // Channel should be visible initially
    expect(screen.getByText('code-reviewer')).toBeInTheDocument();

    // Click the Roles section header to collapse
    await user.click(screen.getByText('Roles'));
    expect(screen.queryByText('code-reviewer')).not.toBeInTheDocument();

    // Click again to expand
    await user.click(screen.getByText('Roles'));
    expect(screen.getByText('code-reviewer')).toBeInTheDocument();
  });

  // ── Create channel form ─────────────────────────────────────

  it('shows create form when "+ New channel" is clicked', async () => {
    const user = userEvent.setup();
    render(<ChannelSidebar {...defaultProps} channels={[]} />);

    await user.click(screen.getByText('+ New channel'));
    expect(screen.getByPlaceholderText('Channel name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('System prompt (optional)')).toBeInTheDocument();
  });

  it('calls onCreateChannel with name and default prompt', async () => {
    const user = userEvent.setup();
    const onCreateChannel = vi.fn();
    render(<ChannelSidebar {...defaultProps} channels={[]} onCreateChannel={onCreateChannel} />);

    await user.click(screen.getByText('+ New channel'));
    await user.type(screen.getByPlaceholderText('Channel name'), 'my-channel');
    await user.click(screen.getByText('Create'));

    expect(onCreateChannel).toHaveBeenCalledWith('my-channel', 'You are a helpful assistant.');
  });

  it('does not submit empty channel name', async () => {
    const user = userEvent.setup();
    const onCreateChannel = vi.fn();
    render(<ChannelSidebar {...defaultProps} channels={[]} onCreateChannel={onCreateChannel} />);

    await user.click(screen.getByText('+ New channel'));
    await user.click(screen.getByText('Create'));

    expect(onCreateChannel).not.toHaveBeenCalled();
  });

  it('hides form when Cancel is clicked', async () => {
    const user = userEvent.setup();
    render(<ChannelSidebar {...defaultProps} channels={[]} />);

    await user.click(screen.getByText('+ New channel'));
    expect(screen.getByPlaceholderText('Channel name')).toBeInTheDocument();

    await user.click(screen.getByText('Cancel'));
    expect(screen.queryByPlaceholderText('Channel name')).not.toBeInTheDocument();
  });

  // ── Footer buttons ──────────────────────────────────────────

  it('renders theme toggle button', async () => {
    const user = userEvent.setup();
    const onToggleTheme = vi.fn();
    render(
      <ChannelSidebar {...defaultProps} channels={[]} onToggleTheme={onToggleTheme} />
    );

    await user.click(screen.getByText('Dark mode'));
    expect(onToggleTheme).toHaveBeenCalled();
  });

  it('shows "Light mode" when theme is dark', () => {
    render(<ChannelSidebar {...defaultProps} channels={[]} theme="dark" />);
    expect(screen.getByText('Light mode')).toBeInTheDocument();
  });

  it('renders Entities button when onOpenEntities is provided', async () => {
    const user = userEvent.setup();
    const onOpenEntities = vi.fn();
    render(
      <ChannelSidebar {...defaultProps} channels={[]} onOpenEntities={onOpenEntities} />
    );

    await user.click(screen.getByText('Entities'));
    expect(onOpenEntities).toHaveBeenCalled();
  });

  it('renders Import button when onOpenImport is provided', async () => {
    const user = userEvent.setup();
    const onOpenImport = vi.fn();
    render(
      <ChannelSidebar {...defaultProps} channels={[]} onOpenImport={onOpenImport} />
    );

    await user.click(screen.getByText('Import'));
    expect(onOpenImport).toHaveBeenCalled();
  });
});
