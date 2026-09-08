/**
 * Round 171 — the manual import path skipped identity confirmation, and the composition
 * form reported the resulting placeholder as an agent.
 *
 * Theseus drove Path B in a real browser on 2026-09-08
 * (`docs/research/round171-path-b-driven-in-a-browser-...`) and found the gesture working
 * exactly as built while the route a user reaches *first* seated the wrong agent silently:
 *
 *   1. `ImportDialog` manual path sent no `entityName`;
 *   2. `resolveImportEntity` returned `{ disposition: 'default' }`;
 *   3. the import response carried no `entityId`;
 *   4. `createChannel` bound `DEFAULT_ENTITY_ID` anyway (`queries.ts:1280`);
 *   5. `App.tsx` fell back to `fetchChannelEntities`, which faithfully returned that
 *      placeholder, and the form seated a chip reading "Claude" — for an import whose own
 *      identity text was absent from the assembled prompt.
 *
 * Two fixes, pinned here:
 *   - the confirm step now exists on the manual and upload paths, so they *can* mint an
 *     identified agent (previously only the Browse panel could);
 *   - `resolveJitSeat` refuses to seat the placeholder, turning a silent wrong answer into
 *     a true notice. Only the fallback is guarded — a confirmed name that resolves to the
 *     default entity is a choice, and still seats.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DEFAULT_ENTITY_ID } from '@klatch/shared';
import type { Channel, Entity } from '@klatch/shared';
import { ChannelSidebar } from '../components/ChannelSidebar';
import { ImportDialog } from '../components/ImportDialog';
import { resolveJitSeat } from '../utils/jitSeat';

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

function ent(id: string, name: string): Entity {
  return {
    id, name, handle: undefined, model: 'claude-opus-4-6', effort: 'high',
    systemPrompt: '', color: '#111', createdAt: '2026-03-01T00:00:00Z',
  } as Entity;
}

function makeChannel(o: Partial<Channel> & { id: string; name: string }): Channel {
  return { type: 'chat', systemPrompt: '', model: 'claude-opus-4-6', mode: 'panel', createdAt: '2026-03-01T00:00:00Z', ...o };
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
const chipFor = (name: string) => screen.queryByRole('button', { name: `Remove ${name}` });

beforeEach(() => {
  cleanup();
  vi.mocked(importClaudeCodeSession).mockReset();
});

describe('Round 171 — the seat decision tells an answer from a placeholder', () => {
  it('seats an entity the import resolved', () => {
    expect(resolveJitSeat('e9')).toEqual({ entityId: 'e9' });
  });

  it('seats a confirmed name that resolved to the default entity — a choice is not a placeholder', () => {
    // The user typed "Claude" into the confirm step: resolve matched by name and returned
    // the default entity's id *on the response*. That must still seat.
    expect(resolveJitSeat(DEFAULT_ENTITY_ID)).toEqual({ entityId: DEFAULT_ENTITY_ID });
  });

  it('refuses the default entity when it came from the channel rather than the import', () => {
    // The exact Round 171 chain: no entityId on the response, channel bound to the
    // placeholder by createChannel. This is the seat that read "Claude" in the browser.
    expect(resolveJitSeat(undefined, [ent(DEFAULT_ENTITY_ID, 'Claude')])).toEqual({ unidentified: true });
  });

  it('still seats a real agent the channel knows about — the duplicate path keeps working', () => {
    expect(resolveJitSeat(undefined, [ent('e4', 'Piper Morgan')])).toEqual({ entityId: 'e4' });
  });

  it('reports nothing seated when the channel has no entity at all', () => {
    expect(resolveJitSeat(undefined, [])).toEqual({});
    expect(resolveJitSeat(undefined, null)).toEqual({});
    expect(resolveJitSeat(undefined)).toEqual({});
  });
});

describe('Round 171 — the form says which of the two nothings happened', () => {
  it('names an unidentified import rather than claiming no agent came back', () => {
    const props = { ...baseProps, entities: [ent('e1', 'Ada')], onImportAgent: vi.fn() };
    const { rerender } = render(<ChannelSidebar {...props} />);
    openChatForm();

    rerender(<ChannelSidebar {...props} importedAgentId={undefined} importUnidentified importToken={1} />);

    expect(screen.getByText(/didn't name an agent/)).toBeInTheDocument();
    expect(chipFor('Ada')).not.toBeInTheDocument();
  });

  it('keeps the original wording when nothing came back at all', () => {
    const props = { ...baseProps, entities: [ent('e1', 'Ada')], onImportAgent: vi.fn() };
    const { rerender } = render(<ChannelSidebar {...props} />);
    openChatForm();

    rerender(<ChannelSidebar {...props} importedAgentId={undefined} importToken={1} />);

    expect(screen.getByText(/no agent came back with it/)).toBeInTheDocument();
  });

  it('seats nothing at all rather than a placeholder chip', () => {
    // The regression this whole round is about: before the fix the form came back with one
    // chip selected, reading "Claude".
    //
    // Driven through `resolveJitSeat` rather than by handing the sidebar a hardcoded
    // `importedAgentId={undefined}` — the sidebar half was never the broken half, so a
    // test that skips the decision passes before the fix as well as after and pins
    // nothing. This is the whole fallback chain minus App's fetch: an import that
    // returned no entity, a channel that answers with the placeholder.
    const props = {
      ...baseProps,
      entities: [ent(DEFAULT_ENTITY_ID, 'Claude'), ent('e1', 'Ada')],
      onImportAgent: vi.fn(),
    };
    const { rerender } = render(<ChannelSidebar {...props} />);
    openChatForm();

    const seat = resolveJitSeat(undefined, [ent(DEFAULT_ENTITY_ID, 'Claude')]);
    rerender(
      <ChannelSidebar
        {...props}
        importedAgentId={seat.entityId}
        importUnidentified={seat.unidentified}
        importToken={1}
      />
    );

    expect(chipFor('Claude')).not.toBeInTheDocument();
    expect(screen.getByText(/didn't name an agent/)).toBeInTheDocument();
  });
});

describe('Round 171 — the manual path can confirm an identity', () => {
  const successNoEntity = {
    status: 'success' as const,
    data: {
      channelId: 'ch1', channelName: 'test-session', messageCount: 10,
      artifactCount: 0, source: 'claude-code' as const, duplicate: false,
    },
  };

  it('offers the confirm step on the typed-path form', () => {
    render(<ImportDialog isOpen onClose={vi.fn()} onImported={vi.fn()} />);
    expect(screen.getByLabelText(/^Agent/)).toBeInTheDocument();
  });

  it('sends the confirmed name as entityName', async () => {
    const user = userEvent.setup();
    vi.mocked(importClaudeCodeSession).mockResolvedValue({
      status: 'success',
      data: { ...successNoEntity.data, entityId: 'e-piper' },
    });

    render(<ImportDialog isOpen onClose={vi.fn()} onImported={vi.fn()} composeMode />);
    await user.type(screen.getByPlaceholderText(/\.jsonl/), '/path/to/session.jsonl');
    await user.type(screen.getByLabelText(/^Agent/), 'Piper Morgan');
    await user.click(screen.getByRole('button', { name: 'Import' }));

    await waitFor(() => expect(importClaudeCodeSession).toHaveBeenCalled());
    expect(vi.mocked(importClaudeCodeSession).mock.calls[0]).toEqual([
      '/path/to/session.jsonl', undefined, undefined, 'Piper Morgan',
    ]);
  });

  it('sends no name when the field is left blank — blank means "I am not saying"', async () => {
    const user = userEvent.setup();
    vi.mocked(importClaudeCodeSession).mockResolvedValue(successNoEntity);

    render(<ImportDialog isOpen onClose={vi.fn()} onImported={vi.fn()} composeMode />);
    await user.type(screen.getByPlaceholderText(/\.jsonl/), '/path/to/session.jsonl');
    await user.click(screen.getByRole('button', { name: 'Import' }));

    await waitFor(() => expect(importClaudeCodeSession).toHaveBeenCalled());
    expect(vi.mocked(importClaudeCodeSession).mock.calls[0][3]).toBeUndefined();
  });

  it('does not send whitespace as a name', async () => {
    const user = userEvent.setup();
    vi.mocked(importClaudeCodeSession).mockResolvedValue(successNoEntity);

    render(<ImportDialog isOpen onClose={vi.fn()} onImported={vi.fn()} />);
    await user.type(screen.getByPlaceholderText(/\.jsonl/), '/path/to/session.jsonl');
    await user.type(screen.getByLabelText(/^Agent/), '   ');
    await user.click(screen.getByRole('button', { name: 'Import' }));

    await waitFor(() => expect(importClaudeCodeSession).toHaveBeenCalled());
    expect(vi.mocked(importClaudeCodeSession).mock.calls[0][3]).toBeUndefined();
  });

  it('carries the confirmed name through fork-again — replacing or forking does not change who the session is', async () => {
    const user = userEvent.setup();
    vi.mocked(importClaudeCodeSession)
      .mockResolvedValueOnce({
        status: 'conflict',
        conflict: {
          existingChannelId: 'ch-old', existingChannelName: 'old-session',
          existingMessageCount: 4, sessionId: 's1',
        },
      } as never)
      .mockResolvedValueOnce({ status: 'success', data: { ...successNoEntity.data, entityId: 'e-piper' } });

    render(<ImportDialog isOpen onClose={vi.fn()} onImported={vi.fn()} composeMode />);
    await user.type(screen.getByPlaceholderText(/\.jsonl/), '/path/to/session.jsonl');
    await user.type(screen.getByLabelText(/^Agent/), 'Piper Morgan');
    await user.click(screen.getByRole('button', { name: 'Import' }));

    await waitFor(() => expect(screen.getByText(/Already imported/i)).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: 'Import as new' }));

    await waitFor(() => expect(importClaudeCodeSession).toHaveBeenCalledTimes(2));
    const forkCall = vi.mocked(importClaudeCodeSession).mock.calls[1];
    expect(forkCall[2]).toBe(true);
    expect(forkCall[3]).toBe('Piper Morgan');
  });
});
