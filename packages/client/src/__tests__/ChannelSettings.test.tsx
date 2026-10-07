/**
 * Entity-delete ruling (2026-10-06, xian via Janus): removing the last agent
 * from a klatch is legal but anomalous — the UI prompts to delete the klatch
 * too, allowing "no" (leave it empty). Pins the branching confirm this
 * introduces in ChannelSettings, replacing the prior "hide the button
 * entirely" gate.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import './setup';
import { ChannelSettings } from '../components/ChannelSettings';
import type { Channel, Entity } from '@klatch/shared';

vi.mock('../api/client.js', () => ({
  fetchContextFile: vi.fn().mockRejectedValue(new Error('not used')),
  fetchProjects: vi.fn().mockResolvedValue([]),
  fetchChannelFiles: vi.fn().mockResolvedValue([]),
  unpinFileFromChannel: vi.fn(),
  promoteFile: vi.fn(),
}));

const klatch: Channel = {
  id: 'klatch1',
  name: 'standup',
  type: 'klatch',
  systemPrompt: '',
  model: 'claude-opus-4-6',
  mode: 'panel',
  createdAt: '2026-03-01T00:00:00Z',
};

function makeEntity(overrides: Partial<Entity> & { id: string; name: string }): Entity {
  return {
    model: 'claude-opus-4-6',
    effort: 'high',
    systemPrompt: '',
    color: '#336699',
    createdAt: '2026-03-01T00:00:00Z',
    ...overrides,
  };
}

const baseProps = {
  channel: klatch,
  allEntities: [],
  onSave: vi.fn(),
  onAssignEntity: vi.fn(),
  onClose: vi.fn(),
};

describe('ChannelSettings — last-entity removal', () => {
  it('still removes directly, with no prompt, when more than one agent remains', async () => {
    const user = userEvent.setup();
    const onRemoveEntity = vi.fn();
    const onDeleteChannel = vi.fn();
    const entities = [
      makeEntity({ id: 'e1', name: 'Agent One' }),
      makeEntity({ id: 'e2', name: 'Agent Two' }),
    ];
    render(
      <ChannelSettings {...baseProps} channelEntities={entities} onRemoveEntity={onRemoveEntity} onDeleteChannel={onDeleteChannel} />
    );

    await user.click(screen.getAllByTitle('Remove from klatch')[0]);

    expect(onRemoveEntity).toHaveBeenCalledWith('e1');
    expect(onDeleteChannel).not.toHaveBeenCalled();
    expect(screen.queryByText(/last agent in this klatch/)).not.toBeInTheDocument();
  });

  it('prompts to also delete the klatch when removing the last agent, and does not call either handler until a choice is made', async () => {
    const user = userEvent.setup();
    const onRemoveEntity = vi.fn();
    const onDeleteChannel = vi.fn();
    const entities = [makeEntity({ id: 'e1', name: 'Solo Agent' })];
    render(
      <ChannelSettings {...baseProps} channelEntities={entities} onRemoveEntity={onRemoveEntity} onDeleteChannel={onDeleteChannel} />
    );

    await user.click(screen.getByTitle('Remove from klatch'));

    expect(screen.getByText(/Solo Agent is the last agent in this klatch/)).toBeInTheDocument();
    expect(onRemoveEntity).not.toHaveBeenCalled();
    expect(onDeleteChannel).not.toHaveBeenCalled();
  });

  it('"Delete klatch" deletes the channel and does not also remove the entity', async () => {
    const user = userEvent.setup();
    const onRemoveEntity = vi.fn();
    const onDeleteChannel = vi.fn();
    const entities = [makeEntity({ id: 'e1', name: 'Solo Agent' })];
    render(
      <ChannelSettings {...baseProps} channelEntities={entities} onRemoveEntity={onRemoveEntity} onDeleteChannel={onDeleteChannel} />
    );

    await user.click(screen.getByTitle('Remove from klatch'));
    // "Delete klatch" also labels the unrelated danger-zone button at the
    // bottom of settings; the inline confirm's copy renders first in the DOM.
    await user.click(screen.getAllByText('Delete klatch')[0]);

    expect(onDeleteChannel).toHaveBeenCalledTimes(1);
    expect(onRemoveEntity).not.toHaveBeenCalled();
  });

  it('"Leave empty" removes the entity and does not delete the channel', async () => {
    const user = userEvent.setup();
    const onRemoveEntity = vi.fn();
    const onDeleteChannel = vi.fn();
    const entities = [makeEntity({ id: 'e1', name: 'Solo Agent' })];
    render(
      <ChannelSettings {...baseProps} channelEntities={entities} onRemoveEntity={onRemoveEntity} onDeleteChannel={onDeleteChannel} />
    );

    await user.click(screen.getByTitle('Remove from klatch'));
    await user.click(screen.getByText('Leave empty'));

    expect(onRemoveEntity).toHaveBeenCalledWith('e1');
    expect(onDeleteChannel).not.toHaveBeenCalled();
  });

  it('"Cancel" dismisses the prompt without calling either handler', async () => {
    const user = userEvent.setup();
    const onRemoveEntity = vi.fn();
    const onDeleteChannel = vi.fn();
    const entities = [makeEntity({ id: 'e1', name: 'Solo Agent' })];
    render(
      <ChannelSettings {...baseProps} channelEntities={entities} onRemoveEntity={onRemoveEntity} onDeleteChannel={onDeleteChannel} />
    );

    await user.click(screen.getByTitle('Remove from klatch'));
    await user.click(screen.getByText('Cancel'));

    expect(screen.queryByText(/last agent in this klatch/)).not.toBeInTheDocument();
    expect(onRemoveEntity).not.toHaveBeenCalled();
    expect(onDeleteChannel).not.toHaveBeenCalled();
  });
});
