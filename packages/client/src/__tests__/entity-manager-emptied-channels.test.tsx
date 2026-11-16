/**
 * Entity delete now surfaces the channels it emptied (Theseus's `72172a52`,
 * 2026-11-15, the Round 220 half of xian's 2026-10-06 entity-delete ruling:
 * `DELETE /entities/:id` returns `{ deleted: true, emptiedChannels }`).
 *
 * `emptiedChannels` is always present server-side so a client can branch on
 * length without having to tell "none emptied" from "an older server that
 * didn't say" — this is the client half that was left for Iris
 * (`theseus-to-iris-...-second-ruled-item-unbuilt-for-48-2026-11-15.md`, §2).
 *
 * The entity's own row is gone from the DOM by the time the delete response
 * resolves, so the disclosure can't live on the entity card — it's a
 * dismissible banner at the top of the panel, naming what the deletion emptied.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EntityManager } from '../components/EntityManager';
import type { Entity } from '@klatch/shared';

const baseEntity: any = {
  id: 'e1',
  name: 'Daedalus',
  handle: null,
  model: 'claude-opus-4-7',
  effort: 'high',
  systemPrompt: '',
  color: '#3B82F6',
  reflections: [],
  createdAt: '2026-05-18T00:00:00Z',
};

async function clickDeleteTwice(user: ReturnType<typeof userEvent.setup>) {
  const deleteButton = screen.getByTitle('Delete agent');
  await user.click(deleteButton); // arms the confirm state
  await user.click(screen.getByTitle('Click again to confirm'));
}

describe('EntityManager — emptied-channels disclosure on delete', () => {
  it('shows a singular banner naming the one channel emptied', async () => {
    const user = userEvent.setup();
    const onDeleteEntity = vi.fn().mockResolvedValue([{ id: 'c1', name: 'general' }]);

    render(
      <EntityManager
        entities={[baseEntity as Entity]}
        onCreateEntity={vi.fn()}
        onUpdateEntity={vi.fn()}
        onDeleteEntity={onDeleteEntity}
        onClose={vi.fn()}
      />,
    );

    await clickDeleteTwice(user);

    expect(onDeleteEntity).toHaveBeenCalledWith('e1');
    await waitFor(() => {
      expect(screen.getByText(/left 1 channel with no agent: general/)).toBeInTheDocument();
    });
  });

  it('shows a plural banner naming all channels emptied', async () => {
    const user = userEvent.setup();
    const onDeleteEntity = vi.fn().mockResolvedValue([
      { id: 'c1', name: 'general' },
      { id: 'c2', name: 'standup' },
    ]);

    render(
      <EntityManager
        entities={[baseEntity as Entity]}
        onCreateEntity={vi.fn()}
        onUpdateEntity={vi.fn()}
        onDeleteEntity={onDeleteEntity}
        onClose={vi.fn()}
      />,
    );

    await clickDeleteTwice(user);

    await waitFor(() => {
      expect(screen.getByText(/left 2 channels with no agent: general, standup/)).toBeInTheDocument();
    });
  });

  it('shows no banner when nothing was emptied', async () => {
    const user = userEvent.setup();
    const onDeleteEntity = vi.fn().mockResolvedValue([]);

    render(
      <EntityManager
        entities={[baseEntity as Entity]}
        onCreateEntity={vi.fn()}
        onUpdateEntity={vi.fn()}
        onDeleteEntity={onDeleteEntity}
        onClose={vi.fn()}
      />,
    );

    await clickDeleteTwice(user);

    await waitFor(() => expect(onDeleteEntity).toHaveBeenCalled());
    expect(screen.queryByText(/with no agent/)).toBeNull();
  });

  it('the banner is dismissible', async () => {
    const user = userEvent.setup();
    const onDeleteEntity = vi.fn().mockResolvedValue([{ id: 'c1', name: 'general' }]);

    render(
      <EntityManager
        entities={[baseEntity as Entity]}
        onCreateEntity={vi.fn()}
        onUpdateEntity={vi.fn()}
        onDeleteEntity={onDeleteEntity}
        onClose={vi.fn()}
      />,
    );

    await clickDeleteTwice(user);

    const banner = await screen.findByText(/with no agent/);
    expect(banner).toBeInTheDocument();

    await user.click(screen.getByLabelText('Dismiss'));
    expect(screen.queryByText(/with no agent/)).toBeNull();
  });
});
