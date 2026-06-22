/**
 * Composition increment 2 — agent picker (ChannelSidebar) EXTENDED coverage.
 *
 * STABILITY: synchronous `fireEvent` + explicit `{ timeout: 15000 }` on the two
 * interaction-heaviest tests (cap, end-to-end). These were briefly parked 6/21 when
 * an earlier `userEvent` version + concurrent test-run machine load cascaded the
 * singleThread suite (11–36 failures); with fireEvent, per-test timeouts, and a clean
 * machine they run green (3×3 full-suite runs, 204 passed). The lesson, recorded in
 * `argus-to-daedalus-client-suite-fragility-2026-06-21.md`: heavy ChannelSidebar
 * interaction tests need fireEvent + a generous per-test timeout in this singleThread
 * suite — and full-suite flake checks must kill stray vitest procs first (machine load
 * skews timing).
 *
 * Covers: max-5 cap boundary; chip removal deselects; typeahead by
 * @handle (not just name); roles/other partition; end-to-end picker→onCreateChannel
 * roster (client half of the atomic-roster path covered server-side in
 * composition-gesture-extended.test.ts). Synchronous fireEvent throughout.
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

/** The list checkbox for an agent (disambiguated from its selection chip). */
function listCheckbox(name: string): HTMLElement {
  const label = screen.getByText(name).closest('label');
  return within(label as HTMLElement).getByRole('checkbox');
}

function openKlatchForm() {
  fireEvent.click(screen.getByText('+ New Klatch'));
}

describe('Composition picker (increment 2) — extended', () => {
  it('enforces the max-5 cap: a 6th agent cannot be added', { timeout: 15000 }, () => {
    const entities = ['A', 'B', 'C', 'D', 'E', 'F'].map((c, i) => ent(`e${i}`, `Agent${c}`));
    render(<ChannelSidebar {...baseProps} entities={entities} />);
    openKlatchForm();

    for (const n of ['AgentA', 'AgentB', 'AgentC', 'AgentD', 'AgentE']) {
      fireEvent.click(listCheckbox(n)); // each unique in the list until selected
    }
    expect(listCheckbox('AgentF')).toBeDisabled();
    fireEvent.click(listCheckbox('AgentF'));
    expect(listCheckbox('AgentF')).not.toBeChecked();
    expect(screen.queryByLabelText('Remove AgentF')).not.toBeInTheDocument();
  });

  it('removing a selection chip deselects the agent', () => {
    render(<ChannelSidebar {...baseProps} entities={[ent('e1', 'Solo')]} />);
    openKlatchForm();

    fireEvent.click(listCheckbox('Solo'));
    expect(screen.getByLabelText('Remove Solo')).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('Remove Solo'));
    expect(screen.queryByLabelText('Remove Solo')).not.toBeInTheDocument();
    expect(listCheckbox('Solo')).not.toBeChecked();
  });

  it('typeahead filters by @handle, not just name', () => {
    const entities = [ent('e1', 'Builder', 'wizard'), ent('e2', 'Checker', 'sentinel')];
    render(<ChannelSidebar {...baseProps} entities={entities} />);
    openKlatchForm();

    fireEvent.change(screen.getByPlaceholderText(/Search agents/i), { target: { value: 'wiz' } });
    expect(screen.getByText('Builder')).toBeInTheDocument();
    expect(screen.queryByText('Checker')).not.toBeInTheDocument();
  });

  it('partitions named agents under Roles and nameless ones under Other agents', () => {
    const entities = [ent('e1', 'Daedalus', 'daedalus'), ent('e2', '')];
    render(<ChannelSidebar {...baseProps} entities={entities} />);
    openKlatchForm();

    expect(screen.getByText('Roles')).toBeInTheDocument();
    expect(screen.getByText('Other agents')).toBeInTheDocument();
    expect(screen.getByText('Daedalus')).toBeInTheDocument();
  });

  it('end-to-end: picked roster flows into onCreateChannel (klatch)', { timeout: 15000 }, () => {
    const entities = [ent('e1', 'Alpha'), ent('e2', 'Beta'), ent('e3', 'Gamma')];
    const projects = [{ id: 'p1', name: 'Proj' }] as any;
    const onCreateChannel = vi.fn();
    render(<ChannelSidebar {...baseProps} entities={entities} projects={projects} onCreateChannel={onCreateChannel} />);
    openKlatchForm();

    fireEvent.change(screen.getByPlaceholderText('Klatch name'), { target: { value: 'Weekly Review' } });
    const projectSelect = screen.getByRole('option', { name: /Select project/i }).closest('select') as HTMLSelectElement;
    fireEvent.change(projectSelect, { target: { value: 'p1' } });
    fireEvent.click(listCheckbox('Alpha'));
    fireEvent.click(listCheckbox('Gamma'));
    fireEvent.click(screen.getByRole('button', { name: /Create Klatch/i }));

    expect(onCreateChannel).toHaveBeenCalledTimes(1);
    const args = onCreateChannel.mock.calls[0];
    expect(args[0]).toBe('Weekly Review');
    expect(args[2]).toBe('klatch');
    expect(args[5]).toEqual(['e1', 'e3']);
  });
});
