/**
 * Composition spec §3 Path C — "Continue existing role" (scheduled §11a, 2026-08-10).
 *
 * Before this increment the agent picker was gated to `newType === 'klatch'`, so the
 * only way to start a 1:1 chat was against the shared default entity: you could not
 * open a new conversation with an agent that already existed in the registry. The
 * server half was already there and already tested — `routes/channels.ts` accepts
 * `entityIds` for a chat and returns 400 only for chat + 2 or more agents (the
 * type/roster coherence rule, 2026-06-21). The client simply never asked.
 *
 * These tests pin the client half:
 *   - the picker renders on the chat form, framed as continuing an existing agent
 *     rather than as minting one (the distinction `PREMISE.md` insists on);
 *   - a chat carries a cap of exactly 1, enforced by *replacement* rather than
 *     refusal, so the form can never compose the roster the route rejects;
 *   - switching Klatch → Chat narrows an already-over-cap roster for the same reason;
 *   - an empty selection still sends `undefined`, preserving the pre-existing
 *     default-entity path.
 *
 * STABILITY: synchronous `fireEvent` throughout, per the convention established in
 * `composition-picker-extended.test.tsx` (heavy ChannelSidebar interaction tests are
 * fragile under `userEvent` in this singleThread suite).
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, within, fireEvent } from '@testing-library/react';
import { ChannelSidebar } from '../components/ChannelSidebar';
import type { Channel, Entity } from '@klatch/shared';

function makeChannel(o: Partial<Channel> & { id: string; name: string }): Channel {
  return { type: 'chat', systemPrompt: '', model: 'claude-opus-4-6', mode: 'panel', createdAt: '2026-03-01T00:00:00Z', ...o };
}

function ent(id: string, name: string, handle: string | null = null): Entity {
  return {
    id, name, handle, model: 'claude-opus-4-6', effort: 'high',
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

/**
 * The list checkbox for an agent. Once selected, the name renders twice — the list row
 * and the selection chip — so match on the one that is a <label> wrapping a checkbox.
 * (The sibling suite's helper takes the first match, which only holds while every agent
 * it touches is still unselected; these tests re-click selected rows.)
 */
function listCheckbox(name: string): HTMLElement {
  const label = screen
    .getAllByText(name)
    .map((el) => el.closest('label'))
    .find((el): el is HTMLLabelElement => el !== null);
  if (!label) throw new Error(`No picker row found for "${name}"`);
  return within(label).getByRole('checkbox');
}

const openChatForm = () => fireEvent.click(screen.getByText('+ New Chat'));
const openKlatchForm = () => fireEvent.click(screen.getByText('+ New Klatch'));

describe('Path C — the chat form offers existing agents', () => {
  it('renders the picker on the chat form, framed as continuing an existing agent', () => {
    render(<ChannelSidebar {...baseProps} entities={[ent('e1', 'Piper')]} />);
    openChatForm();

    expect(screen.getByText('Continue with an existing agent')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Search agents/i)).toBeInTheDocument();
    expect(screen.getByText('Piper')).toBeInTheDocument();
  });

  it('says the chat picker is optional while nothing is selected, and stops once it is', () => {
    // An empty selection is a valid choice (a new assistant), not an unfinished form.
    render(<ChannelSidebar {...baseProps} entities={[ent('e1', 'Piper')]} />);
    openChatForm();

    expect(screen.getByText(/Optional — leave empty/i)).toBeInTheDocument();
    fireEvent.click(listCheckbox('Piper'));
    expect(screen.queryByText(/Optional — leave empty/i)).not.toBeInTheDocument();
  });

  it('keeps the klatch framing and its n/5 counter unchanged', () => {
    render(<ChannelSidebar {...baseProps} entities={[ent('e1', 'Piper')]} />);
    openKlatchForm();

    expect(screen.queryByText('Continue with an existing agent')).not.toBeInTheDocument();
    expect(screen.queryByText(/Optional — leave empty/i)).not.toBeInTheDocument();
    expect(screen.getByText('Agents')).toBeInTheDocument();
    fireEvent.click(listCheckbox('Piper'));
    expect(screen.getByText('Agents (1/5)')).toBeInTheDocument();
  });

  it('does not offer an orchestration mode on a chat', () => {
    // A 1:1 has nothing to orchestrate; the mode select stays klatch-only.
    render(<ChannelSidebar {...baseProps} entities={[ent('e1', 'Piper')]} />);
    openChatForm();
    expect(screen.queryByRole('option', { name: /Broadcast/i })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Klatch' }));
    expect(screen.getByRole('option', { name: /Broadcast/i })).toBeInTheDocument();
  });
});

describe('Path C — a chat roster is capped at one, by replacement', () => {
  it('picking a second agent replaces the first rather than seating both', () => {
    // The route returns 400 for chat + 2 agents. The picker must not be able to
    // compose that request at all, so the cap is enforced here, not discovered there.
    render(<ChannelSidebar {...baseProps} entities={[ent('e1', 'Alpha'), ent('e2', 'Beta')]} />);
    openChatForm();

    fireEvent.click(listCheckbox('Alpha'));
    expect(listCheckbox('Alpha')).toBeChecked();

    fireEvent.click(listCheckbox('Beta'));
    expect(listCheckbox('Beta')).toBeChecked();
    expect(listCheckbox('Alpha')).not.toBeChecked();
    expect(screen.queryByLabelText('Remove Alpha')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Remove Beta')).toBeInTheDocument();
  });

  it('leaves the unselected rows enabled at cap — replacement needs them clickable', () => {
    // Contrast with the klatch cap, which disables: there, which of five to unseat is
    // the user's call. Here there is no ambiguity, so refusing would just be a dead end.
    render(<ChannelSidebar {...baseProps} entities={[ent('e1', 'Alpha'), ent('e2', 'Beta')]} />);
    openChatForm();

    fireEvent.click(listCheckbox('Alpha'));
    expect(listCheckbox('Beta')).not.toBeDisabled();
  });

  it('clicking the selected agent clears back to the new-assistant path', () => {
    render(<ChannelSidebar {...baseProps} entities={[ent('e1', 'Alpha')]} />);
    openChatForm();

    fireEvent.click(listCheckbox('Alpha'));
    fireEvent.click(listCheckbox('Alpha'));
    expect(listCheckbox('Alpha')).not.toBeChecked();
    expect(screen.getByText(/Optional — leave empty/i)).toBeInTheDocument();
  });

  it('narrows an over-cap roster when the type switches Klatch → Chat', {  timeout: 15000 }, () => {
    // Without this, a user who picks three agents and then flips to Chat submits a
    // roster the server rejects — a 400 produced entirely by the form's own state.
    const entities = [ent('e1', 'Alpha'), ent('e2', 'Beta'), ent('e3', 'Gamma')];
    const onCreateChannel = vi.fn();
    render(<ChannelSidebar {...baseProps} entities={entities} onCreateChannel={onCreateChannel} />);
    openKlatchForm();

    fireEvent.click(listCheckbox('Alpha'));
    fireEvent.click(listCheckbox('Beta'));
    fireEvent.click(listCheckbox('Gamma'));
    expect(screen.getByText('Agents (3/5)')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Chat' }));
    fireEvent.change(screen.getByPlaceholderText('Chat name'), { target: { value: 'Catch-up' } });
    fireEvent.click(screen.getByRole('button', { name: /Create Chat/i }));

    expect(onCreateChannel).toHaveBeenCalledTimes(1);
    expect(onCreateChannel.mock.calls[0][5]).toEqual(['e1']);
  });
});

describe('Path C — what reaches onCreateChannel', () => {
  it('end-to-end: a chosen agent flows through as a one-entity roster', { timeout: 15000 }, () => {
    const onCreateChannel = vi.fn();
    render(
      <ChannelSidebar
        {...baseProps}
        entities={[ent('e1', 'Alpha'), ent('e2', 'Piper', 'piper')]}
        onCreateChannel={onCreateChannel}
      />
    );
    openChatForm();

    fireEvent.change(screen.getByPlaceholderText('Chat name'), { target: { value: 'Monday check-in' } });
    fireEvent.click(listCheckbox('Piper'));
    fireEvent.click(screen.getByRole('button', { name: /Create Chat/i }));

    expect(onCreateChannel).toHaveBeenCalledTimes(1);
    const args = onCreateChannel.mock.calls[0];
    expect(args[0]).toBe('Monday check-in');
    expect(args[2]).toBeUndefined(); // type: chat is the default, sent as undefined
    expect(args[3]).toBeUndefined(); // mode: klatch-only
    expect(args[4]).toBeUndefined(); // projectId: klatch-only
    expect(args[5]).toEqual(['e2']);
  });

  it('an untouched chat picker still sends no roster (the default-entity path is intact)', () => {
    const onCreateChannel = vi.fn();
    render(<ChannelSidebar {...baseProps} entities={[ent('e1', 'Alpha')]} onCreateChannel={onCreateChannel} />);
    openChatForm();

    fireEvent.change(screen.getByPlaceholderText('Chat name'), { target: { value: 'Scratch' } });
    fireEvent.click(screen.getByRole('button', { name: /Create Chat/i }));

    expect(onCreateChannel).toHaveBeenCalledTimes(1);
    expect(onCreateChannel.mock.calls[0][5]).toBeUndefined();
  });

  it('renders no picker at all when the registry is empty', () => {
    render(<ChannelSidebar {...baseProps} entities={[]} />);
    openChatForm();

    expect(screen.queryByText('Continue with an existing agent')).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/Search agents/i)).not.toBeInTheDocument();
  });
});
