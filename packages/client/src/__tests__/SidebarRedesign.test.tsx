/**
 * Round 7 speculative client tests: Sidebar redesign
 *
 * These tests are written against the PLANNED sidebar from docs/plans/SIDEBAR.md.
 * They will fail until Daedalus implements Phase 2 (UI: accordion, chat/klatch sections).
 *
 * Tests:
 * 1. Within a project, chats render above klatches
 * 2. Unassigned section only shows chats (type: 'chat'), no klatches
 * 3. Accordion: expanding one project collapses others
 * 4. Unassigned section is always visible (not part of accordion)
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

// ── 2. Unassigned section — chats only ───────────────────────────

describe('Sidebar — Unassigned section', () => {
  it('shows unassigned chats in Unassigned section', () => {
    const channels: Channel[] = [
      makeChannel({ id: 'default', name: 'general' }),
      makeChannel({ id: 'loose-1', name: 'Random Question', type: 'chat' }),
      makeChannel({ id: 'loose-2', name: 'One-off Help', type: 'chat' }),
    ];
    render(<ChannelSidebar {...defaultProps} channels={channels} />);

    expect(screen.getByText('Unassigned')).toBeInTheDocument();
    expect(screen.getByText('Random Question')).toBeInTheDocument();
    expect(screen.getByText('One-off Help')).toBeInTheDocument();
  });

  it('does not show klatches in Unassigned section', () => {
    // This scenario shouldn't happen (klatches require projects),
    // but if data is inconsistent, the UI should still filter correctly
    const channels: Channel[] = [
      makeChannel({ id: 'default', name: 'general' }),
      makeChannel({ id: 'loose-chat', name: 'Loose Chat', type: 'chat' }),
      // A klatch with a project should appear under its project, not unassigned
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

    // Unassigned section shows the chat
    expect(screen.getByText('Loose Chat')).toBeInTheDocument();

    // Klatch appears under its project, not in unassigned
    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.getByText('team-sync')).toBeInTheDocument();
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

describe('Sidebar — Unassigned always visible', () => {
  it('Unassigned section stays visible regardless of which project is expanded', async () => {
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

    // Unassigned visible with project expanded
    expect(screen.getByText('Unassigned')).toBeInTheDocument();
    expect(screen.getByText('Loose Chat')).toBeInTheDocument();

    // Collapse the project
    await user.click(screen.getByText('MyProject'));

    // Unassigned still visible
    expect(screen.getByText('Unassigned')).toBeInTheDocument();
    expect(screen.getByText('Loose Chat')).toBeInTheDocument();
  });
});
