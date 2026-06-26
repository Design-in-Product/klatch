/**
 * Composition increment 6 — clone-from-klatch (form-prefill from an existing klatch).
 * Spec: docs/ux/spec-composition-gesture.md §46. Synchronous fireEvent; the roster fetch is mocked.
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
  onSelectChannel: vi.fn(),
  onCreateChannel: vi.fn(),
  theme: 'light' as const,
  onToggleTheme: vi.fn(),
};

describe('Clone-from-klatch (increment 6)', () => {
  it('prefills name ("Copy of"), project, and roster from the selected klatch', async () => {
    const alpha = ent('e1', 'Alpha');
    const beta = ent('e2', 'Beta');
    const source = ch({ id: 'k1', name: 'Weekly Review', type: 'klatch', systemPrompt: 'Review the week.', mode: 'roundtable', projectId: 'p1' });
    const channels = [ch({ id: 'default', name: 'general' }), source];
    (fetchChannelEntities as any).mockResolvedValue([alpha, beta]);

    render(
      <ChannelSidebar
        {...baseProps}
        channels={channels}
        entities={[alpha, beta]}
        projects={[{ id: 'p1', name: 'Proj' }] as any}
      />,
    );
    fireEvent.click(screen.getByText('+ New Klatch'));

    // The clone picker is present (a klatch exists to copy from)
    const cloneSelect = screen
      .getByRole('option', { name: /Copy setup from an existing klatch/i })
      .closest('select') as HTMLSelectElement;
    fireEvent.change(cloneSelect, { target: { value: 'k1' } });

    // Name prefilled with the "Copy of" prefix (spec §46)
    await waitFor(() =>
      expect((screen.getByPlaceholderText('Klatch name') as HTMLInputElement).value).toBe('Copy of Weekly Review'),
    );
    // Roster prefilled from the source's channel_entities (fetched, capped at 5)
    expect(fetchChannelEntities).toHaveBeenCalledWith('k1');
    expect(screen.getByLabelText('Remove Alpha')).toBeInTheDocument();
    expect(screen.getByLabelText('Remove Beta')).toBeInTheDocument();
    // Project prefilled to the source's project
    const projectSelect = screen.getByRole('option', { name: 'Proj' }).closest('select') as HTMLSelectElement;
    expect(projectSelect.value).toBe('p1');
  });

  it('does not offer the clone picker when no klatch exists yet', () => {
    render(<ChannelSidebar {...baseProps} channels={[ch({ id: 'default', name: 'general' })]} entities={[]} />);
    fireEvent.click(screen.getByText('+ New Klatch'));
    expect(screen.queryByText(/Copy setup from an existing klatch/i)).not.toBeInTheDocument();
  });
});
