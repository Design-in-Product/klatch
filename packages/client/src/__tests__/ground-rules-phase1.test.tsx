/**
 * Ground rules, phase 1 — the client half (2026-11-16, Daedalus).
 *
 * Ruling: 2026-11-03 (xian via Janus), `docs/operations/attention-rollup.md`.
 * Scoping: `docs/ux/ground-rules-scope-2026-11-16.md` (Calliope). Phase 1 is a
 * blank field with static guidance beside it; no default and no prefill-from-
 * history ship, which is the part of the ruling a UI test can actually hold.
 *
 * The assertions that carry load here are the negative ones — the field starts
 * empty, a chat sends nothing, and the guidance is beside the field rather than
 * in it. A test that only typed into the box and watched it arrive would pass
 * just as happily over an implementation that prefilled a default, which is the
 * one behaviour the ruling forbids.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ChannelSidebar } from '../components/ChannelSidebar';
import type { Channel, Entity } from '@klatch/shared';

vi.mock('../api/client', () => ({
  fetchChannelEntities: vi.fn(),
}));
import { fetchChannelEntities } from '../api/client';

function ch(o: Partial<Channel> & { id: string; name: string }): Channel {
  return { type: 'chat', systemPrompt: 'You are a helpful assistant.', model: 'claude-opus-4-6', mode: 'panel', createdAt: '2026-01-01T00:00:00Z', ...o };
}
function ent(id: string, name: string): Entity {
  return { id, name, model: 'claude-opus-4-6', effort: 'high', systemPrompt: '', color: '#111', createdAt: '2026-01-01T00:00:00Z' } as Entity;
}

const baseProps = {
  activeChannelId: 'default',
  channels: [ch({ id: 'default', name: 'general' })],
  onSelectChannel: vi.fn(),
  onCreateChannel: vi.fn(),
  theme: 'light' as const,
  onToggleTheme: vi.fn(),
};

const RULES_PLACEHOLDER = /Ground rules — how should people behave in this klatch/i;

describe('Ground rules phase 1 — where the field appears', () => {
  it('the klatch form offers it; the chat form does not', () => {
    render(<ChannelSidebar {...baseProps} onCreateChannel={vi.fn()} />);

    fireEvent.click(screen.getByText('+ New Chat'));
    expect(screen.queryByPlaceholderText(RULES_PLACEHOLDER)).toBeNull();
    fireEvent.click(screen.getByText('Cancel'));

    fireEvent.click(screen.getByText('+ New Klatch'));
    expect(screen.getByPlaceholderText(RULES_PLACEHOLDER)).toBeInTheDocument();
  });

  it('starts blank, with the guidance beside the field rather than in it', () => {
    render(<ChannelSidebar {...baseProps} onCreateChannel={vi.fn()} />);
    fireEvent.click(screen.getByText('+ New Klatch'));

    const box = screen.getByPlaceholderText(RULES_PLACEHOLDER) as HTMLTextAreaElement;
    // No default ships — the ruling's item 1 in one assertion.
    expect(box.value).toBe('');
    // The examples are guidance text, not content: they are rendered somewhere
    // that is not the field's value, so submitting an untouched form sends
    // nothing. If they were a prefill this assertion would be the one to fail.
    expect(screen.getByText(/Challenge each other's assumptions/i)).toBeInTheDocument();
    expect(box.value).not.toContain('Challenge');
  });

  it('switching klatch → chat withdraws the field', () => {
    render(<ChannelSidebar {...baseProps} onCreateChannel={vi.fn()} />);
    fireEvent.click(screen.getByText('+ New Klatch'));
    expect(screen.getByPlaceholderText(RULES_PLACEHOLDER)).toBeInTheDocument();
    // The type toggle inside the open form.
    fireEvent.click(screen.getByRole('button', { name: /^Chat$/i }));
    expect(screen.queryByPlaceholderText(RULES_PLACEHOLDER)).toBeNull();
  });
});

describe('Ground rules phase 1 — what reaches onCreateChannel', () => {
  it('typed rules arrive as the seventh argument on a klatch', () => {
    const onCreateChannel = vi.fn();
    render(<ChannelSidebar {...baseProps} onCreateChannel={onCreateChannel} />);
    fireEvent.click(screen.getByText('+ New Klatch'));

    fireEvent.change(screen.getByPlaceholderText('Klatch name'), { target: { value: 'Weekly Review' } });
    fireEvent.change(screen.getByPlaceholderText(RULES_PLACEHOLDER), { target: { value: '  No jargon.  ' } });
    fireEvent.click(screen.getByRole('button', { name: /Create Klatch/i }));

    expect(onCreateChannel).toHaveBeenCalledTimes(1);
    // Trimmed client-side as well as server-side: the value shown back to the
    // user by a later read should be the value they meant, not their whitespace.
    expect(onCreateChannel.mock.calls[0][6]).toBe('No jargon.');
  });

  it('an untouched field sends undefined, not an empty string', () => {
    const onCreateChannel = vi.fn();
    render(<ChannelSidebar {...baseProps} onCreateChannel={onCreateChannel} />);
    fireEvent.click(screen.getByText('+ New Klatch'));
    fireEvent.change(screen.getByPlaceholderText('Klatch name'), { target: { value: 'Quiet' } });
    fireEvent.click(screen.getByRole('button', { name: /Create Klatch/i }));

    expect(onCreateChannel.mock.calls[0][6]).toBeUndefined();
  });

  it('rules typed on a klatch do not follow a switch to chat', () => {
    // The state is one component's, shared across both types, so hiding the
    // field is not the same as not sending it. This is the gate, not the render.
    const onCreateChannel = vi.fn();
    render(<ChannelSidebar {...baseProps} onCreateChannel={onCreateChannel} />);
    fireEvent.click(screen.getByText('+ New Klatch'));
    fireEvent.change(screen.getByPlaceholderText(RULES_PLACEHOLDER), { target: { value: 'No jargon.' } });
    fireEvent.click(screen.getByRole('button', { name: /^Chat$/i }));
    fireEvent.change(screen.getByPlaceholderText('Chat name'), { target: { value: 'solo' } });
    fireEvent.click(screen.getByRole('button', { name: /Create Chat/i }));

    expect(onCreateChannel).toHaveBeenCalledTimes(1);
    expect(onCreateChannel.mock.calls[0][6]).toBeUndefined();
  });
});

describe('Ground rules phase 1 — clone-from-klatch carries them', () => {
  it('cloning a klatch prefills its ground rules, and a source without them leaves the field blank', async () => {
    const alpha = ent('e1', 'Alpha');
    const withRules = ch({ id: 'k1', name: 'Weekly Review', type: 'klatch', systemPrompt: 'Review the week.', mode: 'roundtable', groundRules: 'No jargon.' });
    const without = ch({ id: 'k2', name: 'Bare Klatch', type: 'klatch' });
    (fetchChannelEntities as any).mockResolvedValue([alpha]);

    render(
      <ChannelSidebar
        {...baseProps}
        channels={[ch({ id: 'default', name: 'general' }), withRules, without]}
        entities={[alpha]}
        onCreateChannel={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByText('+ New Klatch'));

    const cloneSelect = screen
      .getByRole('option', { name: /Copy setup from an existing klatch/i })
      .closest('select') as HTMLSelectElement;

    fireEvent.change(cloneSelect, { target: { value: 'k1' } });
    // The roster lands last in cloneFromKlatch (after an await), so waiting on a
    // chip guarantees the synchronous prefills — including this one — applied.
    await waitFor(() => expect(screen.getByLabelText('Remove Alpha')).toBeInTheDocument(), { timeout: 3000 });
    expect((screen.getByPlaceholderText(RULES_PLACEHOLDER) as HTMLTextAreaElement).value).toBe('No jargon.');

    // A source klatch with no rules clears the field rather than leaving the
    // previous clone's value behind — the stale-prefill failure mode.
    fireEvent.change(cloneSelect, { target: { value: 'k2' } });
    await waitFor(() =>
      expect((screen.getByPlaceholderText(RULES_PLACEHOLDER) as HTMLTextAreaElement).value).toBe(''),
      { timeout: 3000 },
    );
  });
});
