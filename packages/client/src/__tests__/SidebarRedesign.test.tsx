/**
 * Round 7 client tests: Sidebar redesign (implemented; updated 2026-06-22 for the default project).
 *
 * Originally written against the PLANNED sidebar from docs/plans/SIDEBAR.md. The "no project,
 * no klatch" + "Unassigned (chats only)" rules from Round 7 were superseded by the default-project
 * model (docs/ux/decision-klatch-project-optionality.md): project_id = null = "First project".
 *
 * Tests:
 * 1. Within a project, chats render above klatches
 * 2. Default project ("First project"): holds null-project chats AND klatches; renders flat for a
 *    singleton user (no header), and a project-less klatch lands here (Round 7 inverted)
 * 3. Accordion: expanding one project collapses others
 * 4. First project section is always visible (pinned, not part of the accordion)
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChannelSidebar } from '../components/ChannelSidebar';
import type { Channel } from '@klatch/shared';

function makeChannel(overrides: Partial<Channel> & { id: string; name: string }): Channel {
  return {
    systemPrompt: '',
    model: 'claude-opus-4-6',
    mode: 'panel',
    createdAt: '2026-03-01T00:00:00Z',
    type: 'chat',
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

// ── 1. Chats above klatches within a project ─────────────────────

describe('Sidebar — chats above klatches within a project', () => {
  const projectChannels: Channel[] = [
    makeChannel({ id: 'default', name: 'general' }),
    makeChannel({
      id: 'chat-1',
      name: 'API Discussion',
      type: 'chat',
      projectId: 'proj-1',
      projectName: 'Klatch',
    }),
    makeChannel({
      id: 'chat-2',
      name: 'Architecture Review',
      type: 'chat',
      projectId: 'proj-1',
      projectName: 'Klatch',
    }),
    makeChannel({
      id: 'klatch-1',
      name: 'standup',
      type: 'klatch',
      projectId: 'proj-1',
      projectName: 'Klatch',
      entityCount: 3,
    }),
    makeChannel({
      id: 'klatch-2',
      name: 'retro',
      type: 'klatch',
      projectId: 'proj-1',
      projectName: 'Klatch',
      entityCount: 2,
    }),
  ];

  // These render the project accordion and assert on its content. The auto-expanded
  // content can land a tick after the synchronous render() under slow-render / runner
  // contention, so we settle with findBy* before any synchronous query — otherwise
  // getAllByRole/getByText momentarily miss the items (Daedalus confirmed 6/21 the
  // ordering is structurally guaranteed; the flake was purely test-side timing).

  it('renders "Chats" section header within a project', async () => {
    render(<ChannelSidebar {...defaultProps} channels={projectChannels} />);
    expect(await screen.findByText('Chats')).toBeInTheDocument();
  });

  it('renders "Klatches" section header within a project', async () => {
    render(<ChannelSidebar {...defaultProps} channels={projectChannels} />);
    expect(await screen.findByText('Klatches')).toBeInTheDocument();
  });

  it('chats appear before klatches in DOM order', async () => {
    render(<ChannelSidebar {...defaultProps} channels={projectChannels} />);

    // Settle the accordion content first so the indices are stable (not -1).
    await screen.findByText('API Discussion');
    await screen.findByText('standup');

    const allButtons = screen.getAllByRole('button');
    const chatIdx = allButtons.findIndex((btn) => btn.textContent?.includes('API Discussion'));
    const klatchIdx = allButtons.findIndex((btn) => btn.textContent?.includes('standup'));

    expect(chatIdx).toBeGreaterThan(-1);
    expect(klatchIdx).toBeGreaterThan(-1);
    expect(chatIdx).toBeLessThan(klatchIdx);
  });

  it('chats use @ prefix, klatches use # prefix', async () => {
    render(<ChannelSidebar {...defaultProps} channels={projectChannels} />);

    // Chat items should have @ prefix
    const chatBtn = (await screen.findByText('API Discussion')).closest('button');
    expect(chatBtn?.textContent).toContain('@');

    // Klatch items should have # prefix
    const klatchBtn = (await screen.findByText('standup')).closest('button');
    expect(klatchBtn?.textContent).toContain('#');
  });
});

// ── 2. Default project ("First project") ─────────────────────────

describe('Sidebar — default project ("First project")', () => {
  it('renders null-project chats flat for a singleton user (no project header)', () => {
    const channels: Channel[] = [
      makeChannel({ id: 'default', name: 'general' }),
      makeChannel({ id: 'loose-1', name: 'Random Question', type: 'chat' }),
      makeChannel({ id: 'loose-2', name: 'One-off Help', type: 'chat' }),
    ];
    render(<ChannelSidebar {...defaultProps} channels={channels} />);

    // No real projects → the default project renders flat, with no "First project" header.
    expect(screen.queryByText('First project')).not.toBeInTheDocument();
    expect(screen.getByText('Random Question')).toBeInTheDocument();
    expect(screen.getByText('One-off Help')).toBeInTheDocument();
  });

  it('shows a project klatch under its project, with a loose chat in the default group', () => {
    // A klatch WITH a project renders under that project. (A project-less klatch renders in
    // the "First project" group — see the dedicated test below.)
    const channels: Channel[] = [
      makeChannel({ id: 'default', name: 'general' }),
      makeChannel({ id: 'loose-chat', name: 'Loose Chat', type: 'chat' }),
      makeChannel({
        id: 'klatch-with-proj',
        name: 'team-sync',
        type: 'klatch',
        projectId: 'proj-1',
        projectName: 'Alpha',
        entityCount: 2,
      }),
    ];
    render(<ChannelSidebar {...defaultProps} channels={channels} />);

    // Loose chat lands in the default group; the project klatch renders under its project.
    expect(screen.getByText('Loose Chat')).toBeInTheDocument();
    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.getByText('team-sync')).toBeInTheDocument();
  });

  it('renders a project-less klatch in the "First project" group (Round 7 inverted)', () => {
    // Round 7 originally forbade klatches without a project ("no project, no klatch").
    // Now a project-less klatch lands in the default project. With a real project also
    // present, the default group shows its "First project" header.
    const channels: Channel[] = [
      makeChannel({ id: 'default', name: 'general' }),
      makeChannel({ id: 'pchat', name: 'Proj Chat', type: 'chat', projectId: 'proj-1', projectName: 'Alpha' }),
      makeChannel({ id: 'loose-klatch', name: 'spontaneous-room', type: 'klatch', entityCount: 3 }),
    ];
    render(<ChannelSidebar {...defaultProps} channels={channels} />);

    expect(screen.getByText('First project')).toBeInTheDocument();
    expect(screen.getByText('spontaneous-room')).toBeInTheDocument();
  });
});

// ── 3. Accordion behavior ────────────────────────────────────────

describe('Sidebar — accordion (one project expanded at a time)', () => {
  const multiProjectChannels: Channel[] = [
    makeChannel({ id: 'default', name: 'general' }),
    makeChannel({
      id: 'a-chat',
      name: 'Alpha Chat',
      type: 'chat',
      projectId: 'proj-a',
      projectName: 'Alpha',
    }),
    makeChannel({
      id: 'b-chat',
      name: 'Beta Chat',
      type: 'chat',
      projectId: 'proj-b',
      projectName: 'Beta',
    }),
    makeChannel({
      id: 'c-chat',
      name: 'Gamma Chat',
      type: 'chat',
      projectId: 'proj-c',
      projectName: 'Gamma',
    }),
  ];

  it('first project is expanded by default, others are collapsed', () => {
    render(<ChannelSidebar {...defaultProps} channels={multiProjectChannels} />);

    // First project's channels should be visible
    expect(screen.getByText('Alpha Chat')).toBeInTheDocument();

    // Other projects' channels should be hidden (collapsed)
    expect(screen.queryByText('Beta Chat')).not.toBeInTheDocument();
    expect(screen.queryByText('Gamma Chat')).not.toBeInTheDocument();
  });

  it('expanding a project collapses the previously-open one', async () => {
    const user = userEvent.setup();
    render(<ChannelSidebar {...defaultProps} channels={multiProjectChannels} />);

    // Alpha is expanded
    expect(screen.getByText('Alpha Chat')).toBeInTheDocument();

    // Click Beta project header to expand it
    await user.click(screen.getByText('Beta'));

    // Beta should now be visible, Alpha should be collapsed
    expect(screen.getByText('Beta Chat')).toBeInTheDocument();
    expect(screen.queryByText('Alpha Chat')).not.toBeInTheDocument();
  });

  it('clicking the active project toggles it, but auto-expand re-opens first project', async () => {
    const user = userEvent.setup();
    render(<ChannelSidebar {...defaultProps} channels={multiProjectChannels} />);

    // Alpha is expanded (auto-expanded as first project)
    expect(screen.getByText('Alpha Chat')).toBeInTheDocument();

    // Click Alpha to collapse — but effectiveExpanded auto-opens first project
    // when expandedProject is null, so Alpha remains visible
    await user.click(screen.getByText('Alpha'));

    // Alpha is still visible due to auto-expand logic
    // (When no project is explicitly expanded, the first project auto-expands)
    expect(screen.getByText('Alpha Chat')).toBeInTheDocument();
    expect(screen.queryByText('Beta Chat')).not.toBeInTheDocument();
  });
});

// ── 4. Unassigned section always visible ─────────────────────────

describe('Sidebar — First project always visible', () => {
  it('First project section stays visible regardless of which project is expanded', { timeout: 15000 }, async () => {
    const user = userEvent.setup();
    const channels: Channel[] = [
      makeChannel({ id: 'default', name: 'general' }),
      makeChannel({
        id: 'proj-chat',
        name: 'Project Chat',
        type: 'chat',
        projectId: 'proj-1',
        projectName: 'MyProject',
      }),
      makeChannel({ id: 'loose', name: 'Loose Chat', type: 'chat' }),
    ];
    render(<ChannelSidebar {...defaultProps} channels={channels} />);

    // First project visible with the real project expanded
    expect(screen.getByText('First project')).toBeInTheDocument();
    expect(screen.getByText('Loose Chat')).toBeInTheDocument();

    // Collapse the real project
    await user.click(screen.getByText('MyProject'));

    // First project still visible (pinned at the bottom, not part of the accordion)
    expect(screen.getByText('First project')).toBeInTheDocument();
    expect(screen.getByText('Loose Chat')).toBeInTheDocument();
  });
});
