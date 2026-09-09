/**
 * Composition spec §3 Path B — just-in-time import (scheduled §11a, 2026-08-10).
 *
 * "Import an agent" inline, within the composition flow: the user brings an agent in
 * without leaving the setup surface, and on completion it "appears in the picker as
 * selected" (§3). The import machinery does not change — §5 calls this a UX integration
 * point, and it is: the same `ImportDialog`, the same route, the same `entityId` the
 * confirm step has returned since 2026-09-02.
 *
 * What these pin is the seam, because the seam is where it can silently do nothing:
 *   - the affordance renders *outside* the `entities.length > 0` gate, so an empty
 *     registry — the fresh install, the case where being the front door matters most —
 *     still offers it;
 *   - a completed import seats its agent in the roster under the picker's own cap rules
 *     (chat replaces at 1, klatch adds under 5);
 *   - the two ways it can fail to seat — klatch roster full, and an import that returns
 *     no agent at all — are *said*, not swallowed;
 *   - re-importing keys on the token, not the id, so importing the same agent twice
 *     re-seats it instead of going quiet.
 *
 * STABILITY: synchronous `fireEvent` for the sidebar, per the convention in
 * `composition-path-c-continue-existing-role.test.tsx`; `userEvent` for the dialog,
 * per `ImportDialog.test.tsx`.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChannelSidebar } from '../components/ChannelSidebar';
import { ImportDialog } from '../components/ImportDialog';
import type { Channel, Entity } from '@klatch/shared';

vi.mock('../api/client', () => ({
  importClaudeCodeSession: vi.fn(),
  uploadClaudeCodeSession: vi.fn(),
  importClaudeAiExport: vi.fn(),
  previewClaudeAiExport: vi.fn(),
  deleteChannelApi: vi.fn(),
  fetchClaudeCodeSessions: vi.fn(),
  fetchChannelEntities: vi.fn().mockResolvedValue([]),
}));

import { importClaudeCodeSession } from '../api/client';

function makeChannel(o: Partial<Channel> & { id: string; name: string }): Channel {
  return { type: 'chat', systemPrompt: '', model: 'claude-opus-4-6', mode: 'panel', createdAt: '2026-03-01T00:00:00Z', ...o };
}

function ent(id: string, name: string): Entity {
  return {
    id, name, handle: undefined, model: 'claude-opus-4-6', effort: 'high',
    systemPrompt: '', color: '#111', createdAt: '2026-03-01T00:00:00Z',
  } as Entity;
}

const baseProps = {
  activeChannelId: 'default',
  onSelectChannel: vi.fn(),
  onCreateChannel: vi.fn(),
  theme: 'light' as const,
  onToggleTheme: vi.fn(),
  channels: [makeChannel({ id: 'default', name: 'general' })],
};

const openChatForm = () => fireEvent.click(screen.getByText('+ New Chat'));
const openKlatchForm = () => fireEvent.click(screen.getByText('+ New Klatch'));
const importButton = () => screen.getByRole('button', { name: /Import an agent/ });

/** The selection chip for an agent — the × button's label is the unambiguous handle on it. */
const chipFor = (name: string) => screen.queryByRole('button', { name: `Remove ${name}` });

beforeEach(() => {
  cleanup();
  baseProps.onCreateChannel = vi.fn();
});

describe('Path B — the affordance', () => {
  it('offers "Import an agent" on the chat form', () => {
    render(<ChannelSidebar {...baseProps} entities={[ent('e1', 'Ada')]} onImportAgent={vi.fn()} />);
    openChatForm();
    expect(importButton()).toBeInTheDocument();
  });

  it('offers it on the klatch form too', () => {
    render(<ChannelSidebar {...baseProps} entities={[ent('e1', 'Ada')]} onImportAgent={vi.fn()} />);
    openKlatchForm();
    expect(importButton()).toBeInTheDocument();
  });

  it('offers it when the registry is empty — the fresh-install front door', () => {
    // The picker itself is gated on `entities.length > 0`. If the import affordance
    // shared that gate, a new user with nothing imported yet would open New Chat and
    // find no way in — the exact case Path B exists to serve.
    render(<ChannelSidebar {...baseProps} entities={[]} onImportAgent={vi.fn()} />);
    openChatForm();
    expect(importButton()).toBeInTheDocument();
    expect(screen.queryByPlaceholderText('Search agents by name or @handle')).not.toBeInTheDocument();
  });

  it('is absent when the caller does not wire it', () => {
    render(<ChannelSidebar {...baseProps} entities={[ent('e1', 'Ada')]} />);
    openChatForm();
    expect(screen.queryByRole('button', { name: /Import an agent/ })).not.toBeInTheDocument();
  });

  it('calls back on click rather than importing anything itself', () => {
    const onImportAgent = vi.fn();
    render(<ChannelSidebar {...baseProps} entities={[]} onImportAgent={onImportAgent} />);
    openChatForm();
    fireEvent.click(importButton());
    expect(onImportAgent).toHaveBeenCalledTimes(1);
  });
});

describe('Path B — the imported agent lands in the roster', () => {
  it('seats it on a chat and sends it on submit', () => {
    const entities = [ent('e1', 'Ada'), ent('e2', 'Grace')];
    const { rerender } = render(
      <ChannelSidebar {...baseProps} entities={entities} onImportAgent={vi.fn()} />
    );
    openChatForm();

    rerender(
      <ChannelSidebar {...baseProps} entities={entities} onImportAgent={vi.fn()} importedAgentId="e2" importToken={1} />
    );

    expect(chipFor('Grace')).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText('Chat name'), { target: { value: 'notes' } });
    fireEvent.click(screen.getByText('Create Chat'));
    expect(baseProps.onCreateChannel).toHaveBeenCalledWith(
      'notes', expect.any(String), undefined, undefined, undefined, ['e2']
    );
  });

  it('replaces the existing selection on a chat (cap 1, the picker\'s own radio semantics)', () => {
    const entities = [ent('e1', 'Ada'), ent('e2', 'Grace')];
    const props = { ...baseProps, entities, onImportAgent: vi.fn() };
    const { rerender } = render(<ChannelSidebar {...props} />);
    openChatForm();

    fireEvent.click(screen.getAllByText('Ada')[0]);
    expect(chipFor('Ada')).toBeInTheDocument();

    rerender(<ChannelSidebar {...props} importedAgentId="e2" importToken={1} />);

    expect(chipFor('Grace')).toBeInTheDocument();
    expect(chipFor('Ada')).not.toBeInTheDocument();
  });

  it('adds to a klatch roster without disturbing what is already seated', () => {
    const entities = [ent('e1', 'Ada'), ent('e2', 'Grace')];
    const props = { ...baseProps, entities, onImportAgent: vi.fn() };
    const { rerender } = render(<ChannelSidebar {...props} />);
    openKlatchForm();

    fireEvent.click(screen.getAllByText('Ada')[0]);
    rerender(<ChannelSidebar {...props} importedAgentId="e2" importToken={1} />);

    expect(chipFor('Ada')).toBeInTheDocument();
    expect(chipFor('Grace')).toBeInTheDocument();
  });

  it('re-seats on a second import of the same agent — the token drives it, not the id', () => {
    const entities = [ent('e1', 'Ada')];
    const props = { ...baseProps, entities, onImportAgent: vi.fn() };
    const { rerender } = render(<ChannelSidebar {...props} />);
    openChatForm();

    rerender(<ChannelSidebar {...props} importedAgentId="e1" importToken={1} />);
    expect(chipFor('Ada')).toBeInTheDocument();

    // User changes their mind and removes it, then imports the same session again.
    fireEvent.click(chipFor('Ada')!);
    expect(chipFor('Ada')).not.toBeInTheDocument();

    rerender(<ChannelSidebar {...props} importedAgentId="e1" importToken={2} />);
    expect(chipFor('Ada')).toBeInTheDocument();
  });
});

describe('Path B — the two ways it can fail to seat are said out loud', () => {
  it('reports a full klatch roster instead of dropping the import', () => {
    const entities = [1, 2, 3, 4, 5].map((n) => ent(`e${n}`, `Agent${n}`));
    const sixth = ent('e6', 'Sixth');
    const props = { ...baseProps, entities: [...entities, sixth], onImportAgent: vi.fn() };
    const { rerender } = render(<ChannelSidebar {...props} />);
    openKlatchForm();

    for (const e of entities) fireEvent.click(screen.getAllByText(e.name)[0]);
    expect(chipFor('Agent5')).toBeInTheDocument();

    rerender(<ChannelSidebar {...props} importedAgentId="e6" importToken={1} />);

    expect(chipFor('Sixth')).not.toBeInTheDocument();
    expect(screen.getByText(/roster is full \(5\)/)).toBeInTheDocument();
  });

  it('reports an import that came back with no agent', () => {
    // Reachable from the duplicate path, whose result is synthesized from a conflict
    // payload that carries no entity, and from a claude.ai bulk import.
    const props = { ...baseProps, entities: [ent('e1', 'Ada')], onImportAgent: vi.fn() };
    const { rerender } = render(<ChannelSidebar {...props} />);
    openChatForm();

    rerender(<ChannelSidebar {...props} importedAgentId={undefined} importToken={1} />);

    expect(screen.getByText(/no agent came back with it/)).toBeInTheDocument();
  });

  it('clears the notice once the user resolves it by hand', () => {
    const props = { ...baseProps, entities: [ent('e1', 'Ada')], onImportAgent: vi.fn() };
    const { rerender } = render(<ChannelSidebar {...props} />);
    openChatForm();
    rerender(<ChannelSidebar {...props} importedAgentId={undefined} importToken={1} />);
    expect(screen.getByText(/no agent came back with it/)).toBeInTheDocument();

    fireEvent.click(screen.getAllByText('Ada')[0]);
    expect(screen.queryByText(/no agent came back with it/)).not.toBeInTheDocument();
  });

  it('does not also show the generic "Optional" picker hint while a notice is up — one remedy, not two', () => {
    // Theseus (Round 172): the evergreen "Optional — leave empty…" chat-picker hint and an
    // unidentified-import notice both name a choice, in the same ~200px, when neither the
    // notice nor the hint yields to the other. The notice already says a choice exists;
    // the generic hint is suppressed rather than stacked under it.
    const props = { ...baseProps, entities: [ent('e1', 'Ada')], onImportAgent: vi.fn() };
    const { rerender } = render(<ChannelSidebar {...props} />);
    openChatForm();
    expect(screen.getByText(/leave empty to start with a new assistant/)).toBeInTheDocument();

    rerender(<ChannelSidebar {...props} importedAgentId={undefined} importToken={1} />);
    expect(screen.getByText(/no agent came back with it/)).toBeInTheDocument();
    expect(screen.queryByText(/leave empty to start with a new assistant/)).not.toBeInTheDocument();

    // Resolving by hand clears the notice; the hint reappears once selection is back to
    // empty (select Ada, which also clears the notice, then deselect her again via her chip).
    fireEvent.click(screen.getAllByText('Ada')[0]);
    expect(screen.queryByText(/no agent came back with it/)).not.toBeInTheDocument();
    fireEvent.click(chipFor('Ada')!);
    expect(screen.getByText(/leave empty to start with a new assistant/)).toBeInTheDocument();
  });
});

describe('Path B — the dialog knows it was opened from the form', () => {
  it('offers to use the agent rather than to leave for the channel', async () => {
    const user = userEvent.setup();
    vi.mocked(importClaudeCodeSession).mockResolvedValue({
      status: 'success',
      data: {
        channelId: 'ch1', channelName: 'test-session', messageCount: 10,
        artifactCount: 0, source: 'claude-code', duplicate: false, entityId: 'e9',
      },
    });

    render(<ImportDialog isOpen onClose={vi.fn()} onImported={vi.fn()} composeMode />);
    await user.type(screen.getByPlaceholderText(/\.jsonl/), '/path/to/session.jsonl');
    await user.click(screen.getByRole('button', { name: 'Import' }));

    await waitFor(() => expect(screen.getByText('Import successful')).toBeInTheDocument());
    expect(screen.getByText('Use this agent')).toBeInTheDocument();
    expect(screen.queryByText('Go to channel')).not.toBeInTheDocument();
  });

  it('still says "Go to channel" outside compose mode', async () => {
    const user = userEvent.setup();
    vi.mocked(importClaudeCodeSession).mockResolvedValue({
      status: 'success',
      data: {
        channelId: 'ch1', channelName: 'test-session', messageCount: 10,
        artifactCount: 0, source: 'claude-code', duplicate: false,
      },
    });

    render(<ImportDialog isOpen onClose={vi.fn()} onImported={vi.fn()} />);
    await user.type(screen.getByPlaceholderText(/\.jsonl/), '/path/to/session.jsonl');
    await user.click(screen.getByRole('button', { name: 'Import' }));

    await waitFor(() => expect(screen.getByText('Import successful')).toBeInTheDocument());
    expect(screen.getByText('Go to channel')).toBeInTheDocument();
  });

  it('hands the same ImportResponse back either way — compose mode changes the caller, not the payload', async () => {
    const user = userEvent.setup();
    const onImported = vi.fn();
    const data = {
      channelId: 'ch1', channelName: 'test-session', messageCount: 10,
      artifactCount: 0, source: 'claude-code' as const, duplicate: false, entityId: 'e9',
    };
    vi.mocked(importClaudeCodeSession).mockResolvedValue({ status: 'success', data });

    render(<ImportDialog isOpen onClose={vi.fn()} onImported={onImported} composeMode />);
    await user.type(screen.getByPlaceholderText(/\.jsonl/), '/path/to/session.jsonl');
    await user.click(screen.getByRole('button', { name: 'Import' }));
    await waitFor(() => expect(screen.getByText('Import successful')).toBeInTheDocument());
    await user.click(screen.getByText('Use this agent'));

    expect(onImported).toHaveBeenCalledWith(data);
  });
});
