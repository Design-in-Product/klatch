import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChannelSidebar } from '../components/ChannelSidebar';
import type { Channel } from '@klatch/shared';

// ── Helpers ──────────────────────────────────────────────────

function makeChannel(overrides: Partial<Channel> & { id: string; name: string }): Channel {
  return {
    type: 'chat',
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
        projectId: 'proj-1',
        projectName: 'klatch',
      }),
      makeChannel({
        id: 'imp2',
        name: 'session-2',
        source: 'claude-code',
        projectId: 'proj-1',
        projectName: 'klatch',
      }),
    ];
    render(<ChannelSidebar {...defaultProps} channels={channels} />);

    // Project group header should show the project name from the projects table
    expect(screen.getByText('klatch')).toBeInTheDocument();
    // Channel count
    expect(screen.getByText('(2)')).toBeInTheDocument();
  });

  it('renders null-project channels flat for a singleton user (no project chrome)', () => {
    const channels = [
      makeChannel({ id: 'default', name: 'general' }),
      makeChannel({
        id: 'imp1',
        name: 'orphan-session',
        source: 'claude-ai',
      }),
    ];
    render(<ChannelSidebar {...defaultProps} channels={channels} />);

    // Singleton (no real projects): the default project ("First project") renders flat —
    // the channel is visible, but no project header is shown.
    expect(screen.getByText('orphan-session')).toBeInTheDocument();
    expect(screen.queryByText('First project')).not.toBeInTheDocument();
  });

  it('shows CC badge for Claude Code imported channels', () => {
    const channels = [
      makeChannel({
        id: 'imp1',
        name: 'imported-session',
        source: 'claude-code',
        projectId: 'proj-1',
        projectName: 'test-project',
      }),
    ];
    render(<ChannelSidebar {...defaultProps} channels={channels} />);
    expect(screen.getByText('CC')).toBeInTheDocument();
  });

  it('separates chats from klatches within a project', () => {
    const channels = [
      makeChannel({ id: 'default', name: 'general' }),
      makeChannel({ id: 'chat1', name: 'CIO Discussion', type: 'chat', projectId: 'proj-1', projectName: 'Piper Morgan' }),
      makeChannel({ id: 'klatch1', name: 'standup', type: 'klatch', projectId: 'proj-1', projectName: 'Piper Morgan' }),
    ];
    render(<ChannelSidebar {...defaultProps} channels={channels} />);

    // When both chats and klatches exist, sub-headers appear
    expect(screen.getByText('Chats')).toBeInTheDocument();
    expect(screen.getByText('Klatches')).toBeInTheDocument();
  });

  // ── Section collapse ────────────────────────────────────────

  it('collapses and expands the First project section on click', { timeout: 15000 }, async () => {
    const user = userEvent.setup();
    const channels = [
      makeChannel({ id: 'default', name: 'general' }),
      // A real project makes the default group render with its collapsible "First project" header.
      makeChannel({ id: 'p1', name: 'proj-chat', type: 'chat', projectId: 'proj-1', projectName: 'Real Project' }),
      makeChannel({ id: 'loose1', name: 'random-chat' }),
    ];
    render(<ChannelSidebar {...defaultProps} channels={channels} />);

    // Loose chat visible initially (First project expanded by default)
    expect(screen.getByText('random-chat')).toBeInTheDocument();

    // Click the "First project" header to collapse
    await user.click(screen.getByText('First project'));
    expect(screen.queryByText('random-chat')).not.toBeInTheDocument();

    // Click again to expand
    await user.click(screen.getByText('First project'));
    expect(screen.getByText('random-chat')).toBeInTheDocument();
  });

  // ── Create channel form ─────────────────────────────────────

  it('shows create form when "+ New Chat" is clicked', async () => {
    const user = userEvent.setup();
    render(<ChannelSidebar {...defaultProps} channels={[]} />);

    await user.click(screen.getByText('+ New Chat'));
    expect(screen.getByPlaceholderText('Chat name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Custom instructions (optional)')).toBeInTheDocument();
  });

  it('"+ New Klatch" opens the setup surface in klatch mode', async () => {
    const user = userEvent.setup();
    render(<ChannelSidebar {...defaultProps} channels={[]} />);

    await user.click(screen.getByText('+ New Klatch'));
    expect(screen.getByPlaceholderText('Klatch name')).toBeInTheDocument();
    // Klatch-specific Purpose framing on the L4 context field
    expect(screen.getByPlaceholderText('Purpose — what is this klatch for? (optional)')).toBeInTheDocument();
  });

  it('agent picker: typeahead filters, roles tier, selection chip (increment 2)', async () => {
    const user = userEvent.setup();
    const entities = [
      { id: 'e1', name: 'Daedalus', handle: 'daedalus', model: 'claude-opus-4-6', effort: 'high', systemPrompt: '', color: '#111', createdAt: '2026-03-01T00:00:00Z' },
      { id: 'e2', name: 'Argus', handle: 'argus', model: 'claude-opus-4-6', effort: 'high', systemPrompt: '', color: '#222', createdAt: '2026-03-01T00:00:00Z' },
    ] as any;
    const projects = [{ id: 'p1', name: 'Klatch', instructions: '', memory: '', source: 'native', sourceMetadata: '{}', createdAt: '2026-03-01T00:00:00Z' }] as any;
    render(<ChannelSidebar {...defaultProps} channels={[]} entities={entities} projects={projects} />);

    await user.click(screen.getByText('+ New Klatch'));
    const search = screen.getByPlaceholderText(/Search agents/i);
    expect(search).toBeInTheDocument();
    expect(screen.getByText('Roles')).toBeInTheDocument();           // roles-first tier (name-as-proxy)
    expect(screen.getByText('Daedalus')).toBeInTheDocument();
    expect(screen.getByText('Argus')).toBeInTheDocument();

    // Typeahead filters the list
    await user.type(search, 'arg');
    expect(screen.queryByText('Daedalus')).not.toBeInTheDocument();
    expect(screen.getByText('Argus')).toBeInTheDocument();

    // Selecting an agent surfaces a removable chip
    await user.clear(search);
    await user.click(screen.getByText('Daedalus'));
    expect(screen.getByLabelText('Remove Daedalus')).toBeInTheDocument();
  });

  it('calls onCreateChannel with name and default prompt', async () => {
    const user = userEvent.setup();
    const onCreateChannel = vi.fn();
    render(<ChannelSidebar {...defaultProps} channels={[]} onCreateChannel={onCreateChannel} />);

    await user.click(screen.getByText('+ New Chat'));
    await user.type(screen.getByPlaceholderText('Chat name'), 'my-channel');
    await user.click(screen.getByText('Create Chat'));

    expect(onCreateChannel).toHaveBeenCalledWith('my-channel', 'You are a helpful assistant.', undefined, undefined, undefined, undefined);
  });

  it('does not submit empty channel name', async () => {
    const user = userEvent.setup();
    const onCreateChannel = vi.fn();
    render(<ChannelSidebar {...defaultProps} channels={[]} onCreateChannel={onCreateChannel} />);

    await user.click(screen.getByText('+ New Chat'));
    await user.click(screen.getByText('Create Chat'));

    expect(onCreateChannel).not.toHaveBeenCalled();
  });

  it('hides form when Cancel is clicked', async () => {
    const user = userEvent.setup();
    render(<ChannelSidebar {...defaultProps} channels={[]} />);

    await user.click(screen.getByText('+ New Chat'));
    expect(screen.getByPlaceholderText('Chat name')).toBeInTheDocument();

    await user.click(screen.getByText('Cancel'));
    expect(screen.queryByPlaceholderText('Chat name')).not.toBeInTheDocument();
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

  it('renders Agents button when onOpenEntities is provided', async () => {
    // Internal callback name remains onOpenEntities; user-facing button label
    // is "Agents" per V2 vocabulary (Iris/Daedalus 5/18 F3 reclassify).
    const user = userEvent.setup();
    const onOpenEntities = vi.fn();
    render(
      <ChannelSidebar {...defaultProps} channels={[]} onOpenEntities={onOpenEntities} />
    );

    await user.click(screen.getByText('Agents'));
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
